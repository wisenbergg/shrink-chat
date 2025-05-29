/**
 * Time and timezone context utilities for enhanced therapeutic AI responses
 */

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface TimeContext {
  userTime: string;
  userTimezone: string;
  timeOfDay: TimeOfDay;
  localDateTime: string;
}

/**
 * Get comprehensive time context for the user
 */
export function getTimeContext(): TimeContext {
  const now = new Date();
  const userTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDateTime = now.toISOString();

  // Determine time of day based on hour
  const hour = now.getHours();
  let timeOfDay: TimeOfDay;

  if (hour >= 5 && hour < 12) {
    timeOfDay = "morning";
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = "afternoon";
  } else if (hour >= 17 && hour < 22) {
    timeOfDay = "evening";
  } else {
    timeOfDay = "night";
  }

  return {
    userTime,
    userTimezone,
    timeOfDay,
    localDateTime,
  };
}
