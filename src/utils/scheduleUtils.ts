import { DayOfWeek, ScheduleRule } from "../types";

/**
 * Convert a time string in HH:MM format to minutes since midnight in the user's timezone
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight in the user's timezone
 */
function getCurrentTimeInMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Get current day of week in the user's timezone
 */
function getCurrentDayOfWeek(): DayOfWeek {
  const now = new Date();
  const dayMap: Record<number, DayOfWeek> = {
    0: DayOfWeek.SUNDAY,
    1: DayOfWeek.MONDAY,
    2: DayOfWeek.TUESDAY,
    3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY,
    5: DayOfWeek.FRIDAY,
    6: DayOfWeek.SATURDAY,
  };
  return dayMap[now.getDay()];
}

/**
 * Check if the current time is within a schedule's time range
 * All times are handled in the user's local timezone
 */
export function isWithinSchedule(schedule: ScheduleRule): boolean {
  const today = getCurrentDayOfWeek();

  // Check if today is in the schedule
  if (!schedule.days.includes(today)) {
    return false;
  }

  // Get current time in minutes since midnight
  const currentTime = getCurrentTimeInMinutes();

  // Check each time range
  for (const timeRange of schedule.timeRanges) {
    const startTime = timeToMinutes(timeRange.start);
    const endTime = timeToMinutes(timeRange.end);

    // Handle overnight schedules (e.g. 22:00-06:00)
    if (endTime <= startTime) {
      // For overnight schedules, check if current time is after start OR before end
      if (currentTime >= startTime || currentTime <= endTime) {
        return true;
      }
    } else {
      // For same-day schedules, check if current time is between start and end (inclusive)
      if (currentTime >= startTime && currentTime <= endTime) {
        return true;
      }
    }
  }

  return false;
}
