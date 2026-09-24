export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initReminderCron } = await import("@/lib/cron/reminderCron");
    initReminderCron();
  }
}
