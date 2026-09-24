import fs from "fs";
import path from "path";
import { scheduleJob, scheduledJobs } from "node-schedule";
import prisma from "@/lib/prisma";
import dayjs, { DUBAI_TZ, getChallengeDay } from "@/lib/dayjs";
import { sendReminderEmail } from "@/lib/mailer";

export const REMINDER_CRON_JOB_NAME = "finalWeighInReminderJob";

const TRACKER_FILE = path.join(process.cwd(), "public", "uploads", "Auxwall", "sent_reminders.json");

interface ReminderRecord {
  day28SentAt?: string;
  sameDaySentAt?: string;
}

function getSentReminders(): Record<string, ReminderRecord> {
  try {
    if (!fs.existsSync(TRACKER_FILE)) return {};
    const content = fs.readFileSync(TRACKER_FILE, "utf-8");
    const raw = JSON.parse(content) || {};
    // Backward compatibility if old string timestamps exist
    const migrated: Record<string, ReminderRecord> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === "string") {
        migrated[key] = { day28SentAt: val };
      } else {
        migrated[key] = val as ReminderRecord;
      }
    }
    return migrated;
  } catch {
    return {};
  }
}

function markReminderSent(userId: string, type: "day28" | "sameDay"): void {
  try {
    const dir = path.dirname(TRACKER_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = getSentReminders();
    const existing = data[userId] || {};
    if (type === "day28") {
      existing.day28SentAt = new Date().toISOString();
    } else {
      existing.sameDaySentAt = new Date().toISOString();
    }
    data[userId] = existing;
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to mark reminder sent for user", userId, err);
  }
}

/**
 * Runs the check for all ACTIVE participants:
 * - 2 Days Before: Day 28
 * - Same Day: Day 30
 */
export async function sendDailyRemindersTask() {
  console.log(`[CRON ${new Date().toISOString()}] Starting daily reminder check for 2-day before & same-day (Asia/Dubai)...`);
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

      const userRecord = sentRecords[user.id] || {};
      const day1WeighIn = user.weighIns.find((w) => w.type === "DAY_1");
      const day1Weight = day1WeighIn ? Number(day1WeighIn.weightKg) : 0;

      // CASE 1: 2 Days Before (Challenge Day 28 or 29 before Day 30)
      if (challengeDay >= 28 && challengeDay < 30 && !userRecord.day28SentAt) {
        const result = await sendReminderEmail({
          email: user.email,
          name: user.name,
          userId: user.id,
          branchName: user.registeredBranch?.label || "Face Off Fitness",
          day1WeightKg: day1Weight,
          day1Date: user.day1Date,
          day30Date,
          day31Date,
          reminderType: "DAY_28",
        });

        if (result.success) {
          markReminderSent(user.id, "day28");
          sentCount++;
          console.log(`[CRON] Sent 2-day reminder email to ${user.name} (${user.email}, Day ${challengeDay})`);
        }
      }

      // CASE 2: Same Day (Challenge Day 30)
      if (challengeDay >= 30 && challengeDay <= 31 && !userRecord.sameDaySentAt) {
        const result = await sendReminderEmail({
          email: user.email,
          name: user.name,
          userId: user.id,
          branchName: user.registeredBranch?.label || "Face Off Fitness",
          day1WeightKg: day1Weight,
          day1Date: user.day1Date,
          day30Date,
          day31Date,
          reminderType: "SAME_DAY",
        });

        if (result.success) {
          markReminderSent(user.id, "sameDay");
          sentCount++;
          console.log(`[CRON] Sent SAME DAY reminder email to ${user.name} (${user.email}, Day ${challengeDay})`);
        }
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
 * Registers node-schedule cron job to run:
 * - 9:00 AM every morning (ideal for same-day & 2-day notifications)
 * - 6:00 PM every evening
 */
export function initReminderCron() {
  const existingJob = scheduledJobs[REMINDER_CRON_JOB_NAME];
  if (existingJob) {
    try {
      existingJob.cancel();
    } catch {}
  }

  // Schedule at 09:00 AM (Asia/Dubai) every day
  const job = scheduleJob(
    REMINDER_CRON_JOB_NAME,
    { hour: 9, minute: 0, second: 0, tz: "Asia/Dubai" },
    async () => {
      await sendDailyRemindersTask();
    }
  );

  // Also schedule an evening check at 18:00 (Asia/Dubai)
  scheduleJob(
    `${REMINDER_CRON_JOB_NAME}_evening`,
    { hour: 18, minute: 0, second: 0, tz: "Asia/Dubai" },
    async () => {
      await sendDailyRemindersTask();
    }
  );

  console.log(`[CRON] Scheduled jobs "${REMINDER_CRON_JOB_NAME}" initialized: runs at 09:00 AM & 06:00 PM (Asia/Dubai)`);
  return job;
}
