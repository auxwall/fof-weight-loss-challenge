import fs from "fs";
import path from "path";
import { scheduleJob, scheduledJobs } from "node-schedule";
import prisma from "@/lib/prisma";
import dayjs, { DUBAI_TZ, getChallengeDay } from "@/lib/dayjs";
import { sendReminderEmail } from "@/lib/mailer";

export const REMINDER_CRON_JOB_NAME = "finalWeighInReminderJob";

const TRACKER_FILE = path.join(process.cwd(), "public", "uploads", "Auxwall", "sent_reminders.json");

function getSentReminders(): Record<string, string> {
  try {
    if (!fs.existsSync(TRACKER_FILE)) return {};
    const content = fs.readFileSync(TRACKER_FILE, "utf-8");
    return JSON.parse(content) || {};
  } catch {
    return {};
  }
}

function markReminderSent(userId: string): void {
  try {
    const dir = path.dirname(TRACKER_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = getSentReminders();
    data[userId] = new Date().toISOString();
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to mark reminder sent for user", userId, err);
  }
}

/**
 * Runs the daily check for all ACTIVE participants on Day 28 (2 days before Day 30).
 */
export async function sendDailyRemindersTask() {
  console.log(`[CRON ${new Date().toISOString()}] Starting daily 2-day reminder check (Asia/Dubai)...`);
  try {
    const activeUsers = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        day1Date: { not: null },
      },
      include: {
        registeredBranch: true,
        weighIns: {
          select: {
            type: true,
            weightKg: true,
            createdAt: true,
          },
        },
      },
    });

    const sentRecords = getSentReminders();
    let sentCount = 0;

    for (const user of activeUsers) {
      if (!user.day1Date) continue;

      // Skip if participant already logged final weigh-in
      const hasFinal = user.weighIns.some((w) => w.type === "FINAL");
      if (hasFinal) continue;

      const challengeDay = getChallengeDay(user.day1Date);
      const start = dayjs(user.day1Date).tz(DUBAI_TZ);
      const day30Date = start.add(29, "day").toDate();
      const day31Date = start.add(30, "day").toDate();

      // "Before 2 days of 30th day" is Challenge Day 28 (Days 28 & 29 prior to Day 30)
      const isDueForReminder = challengeDay >= 28 && challengeDay < 30;
      if (!isDueForReminder) continue;

      // Check if already sent
      if (sentRecords[user.id]) {
        continue;
      }

      // Find Day-1 starting weight
      const day1WeighIn = user.weighIns.find((w) => w.type === "DAY_1");
      const day1Weight = day1WeighIn ? Number(day1WeighIn.weightKg) : 0;

      // Send the reminder email
      const result = await sendReminderEmail({
        email: user.email,
        name: user.name,
        userId: user.id,
        branchName: user.registeredBranch?.label || "Face Off Fitness",
        day1WeightKg: day1Weight,
        day1Date: user.day1Date,
        day30Date,
        day31Date,
      });

      if (result.success) {
        markReminderSent(user.id);
        sentCount++;
        console.log(`[CRON] Sent 2-day reminder email to ${user.name} (${user.email}, Day ${challengeDay})`);
      } else {
        console.error(`[CRON] Failed to send reminder to ${user.email}`);
      }
    }

    console.log(`[CRON] Daily reminder check complete. Sent ${sentCount} reminders.`);
    return { success: true, sentCount };
  } catch (err) {
    console.error("[CRON] Error during daily reminder job:", err);
    return { success: false, error: err };
  }
}

/**
 * Registers node-schedule cron job to run every day at 11:00 PM (23:00) Asia/Dubai
 */
export function initReminderCron() {
  // Cancel if already scheduled to prevent duplicate runners during hot reloading
  const existingJob = scheduledJobs[REMINDER_CRON_JOB_NAME];
  if (existingJob) {
    try {
      existingJob.cancel();
    } catch {}
  }

  // Schedule every day at 11:00 PM (23:00) in Asia/Dubai
  const job = scheduleJob(
    REMINDER_CRON_JOB_NAME,
    { hour: 23, minute: 0, second: 0, tz: "Asia/Dubai" },
    async () => {
      await sendDailyRemindersTask();
    }
  );

  console.log(`[CRON] Scheduled job "${REMINDER_CRON_JOB_NAME}" initialized: runs every day at 11:00 PM (Asia/Dubai)`);
  return job;
}
