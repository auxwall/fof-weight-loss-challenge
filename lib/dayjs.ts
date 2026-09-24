import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const DUBAI_TZ = "Asia/Dubai";
dayjs.tz.setDefault(DUBAI_TZ);

export function nowDubai() {
  return dayjs().tz(DUBAI_TZ);
}

export function formatDubai(
  date: Date | string | dayjs.Dayjs | null | undefined,
  format: string = "DD MMM YYYY, hh:mm A"
): string {
  if (!date) return "—";
  return dayjs(date).tz(DUBAI_TZ).format(format);
}

export function formatDateOnlyDubai(
  date: Date | string | dayjs.Dayjs | null | undefined
): string {
  return formatDubai(date, "DD MMM YYYY");
}

/**
 * Calculates deadline as Day 1 + 30 days in Asia/Dubai.
 * Day 1 is the start day, Day 30 is target completion, and Day 30 23:59:59 is the final return cut-off.
 */
export function calculateDeadlineDubai(day1Date: Date | string): Date {
  return dayjs(day1Date).tz(DUBAI_TZ).add(30, "day").endOf("day").toDate();
}

/**
 * Returns current challenge day number for a participant (Day 1, Day 2 ... Day 30)
 */
export function getChallengeDay(day1Date: Date | string | null | undefined): number {
  if (!day1Date) return 1;
  const start = dayjs(day1Date).tz(DUBAI_TZ).startOf("day");
  const now = nowDubai().startOf("day");
  const diffDays = now.diff(start, "day");
  return Math.max(1, diffDays + 1);
}

// Set to true or set NEXT_PUBLIC_DISABLE_FINAL_LOCK="true" in .env to bypass final weigh-in lock for testing
export const DEV_BYPASS_FINAL_LOCK = false;

export interface FinalWeighInWindow {
  isEligible: boolean;
  challengeDay: number;
  status: "TOO_EARLY" | "OPEN" | "EXPIRED";
  day30Date: string;
  day31Date: string;
  message: string;
}

/**
 * Validates whether the participant is currently in the allowable Final Weigh-in window.
 * STRICT RULE: Only Day 30 or Day 31 are accepted.
 * - Days 1 to 29: TOO_EARLY (Cannot submit yet)
 * - Days 30 and 31: OPEN (Eligible for Final Weigh-In)
 * - Day 32+: EXPIRED (Disqualified)
 */
export function getFinalWeighInWindow(
  day1Date: Date | string | null | undefined,
  deadlineDate?: Date | string | null | undefined
): FinalWeighInWindow {
  if (DEV_BYPASS_FINAL_LOCK || process.env.NEXT_PUBLIC_DISABLE_FINAL_LOCK === "true") {
    return {
      isEligible: true,
      challengeDay: 30,
      status: "OPEN",
      day30Date: "Test Mode",
      day31Date: "Test Mode",
      message: "Test Mode: Final weigh-in window lock is bypassed.",
    };
  }

  if (!day1Date) {
    return {
      isEligible: false,
      challengeDay: 1,
      status: "TOO_EARLY",
      day30Date: "—",
      day31Date: "—",
      message: "Day-1 starting weight has not been recorded yet.",
    };
  }

  const challengeDay = getChallengeDay(day1Date);
  const start = dayjs(day1Date).tz(DUBAI_TZ);
  const day30 = start.add(29, "day");
  const day31 = start.add(30, "day");
  const day30Date = day30.format("DD MMM YYYY");
  const day31Date = day31.format("DD MMM YYYY");

  // Check if deadline has passed (> Day 31)
  if (deadlineDate) {
    const remaining = getDaysRemaining(deadlineDate);
    if (remaining.isExpired || challengeDay > 31) {
      return {
        isEligible: false,
        challengeDay,
        status: "EXPIRED",
        day30Date,
        day31Date,
        message: "Participant has exceeded the 30-day return window and is disqualified.",
      };
    }
  } else if (challengeDay > 31) {
    return {
      isEligible: false,
      challengeDay,
      status: "EXPIRED",
      day30Date,
      day31Date,
      message: "Participant has exceeded the 30-day return window and is disqualified.",
    };
  }

  // Check if too early (prior to Day 30)
  if (challengeDay < 30) {
    return {
      isEligible: false,
      challengeDay,
      status: "TOO_EARLY",
      day30Date,
      day31Date,
      message: `Final weigh-in is only allowed on Day 30. Participant is currently on Day ${challengeDay}. Window opens on ${day30Date}.`,
    };
  }

  // Day 30 (with Day 31 buffer)
  return {
    isEligible: true,
    challengeDay,
    status: "OPEN",
    day30Date,
    day31Date,
    message: `Final weigh-in window is open (Day ${challengeDay} of 30).`,
  };
}

/**
 * Checks if current time in Dubai is between start and end
 */
export function isRegistrationWindowOpen(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): { isOpen: boolean; reason?: string } {
  const now = nowDubai();

  if (!start && !end) {
    return { isOpen: true };
  }

  if (start && now.isBefore(dayjs(start).tz(DUBAI_TZ))) {
    return {
      isOpen: false,
      reason: `Registration opens on ${formatDubai(start)} (Dubai Time).`,
    };
  }

  if (end && now.isAfter(dayjs(end).tz(DUBAI_TZ))) {
    return {
      isOpen: false,
      reason: `Registration closed on ${formatDubai(end)} (Dubai Time).`,
    };
  }

  return { isOpen: true };
}

/**
 * Calculate days remaining until deadline
 */
export function getDaysRemaining(
  deadlineDate: Date | string | null | undefined
): { daysLeft: number; isExpired: boolean; label: string } {
  if (!deadlineDate) return { daysLeft: 0, isExpired: false, label: "Not started" };
  const now = nowDubai();
  const deadline = dayjs(deadlineDate).tz(DUBAI_TZ);
  const diffHours = deadline.diff(now, "hour", true);

  if (diffHours <= 0) {
    return { daysLeft: 0, isExpired: true, label: "Deadline passed" };
  }

  const days = Math.ceil(diffHours / 24);
  return {
    daysLeft: days,
    isExpired: false,
    label: `${days} ${days === 1 ? "day" : "days"} remaining`,
  };
}

export default dayjs;
