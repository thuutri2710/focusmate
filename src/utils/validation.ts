import { BlockRule, BlockingMode, TimeRange } from "../types";
import { isValidDomainPattern } from "./urlUtils";

/**
 * Validates a blocking rule
 * @param rule The rule to validate
 * @returns Object with validation result and error message
 */
export function validateRule(rule: Partial<BlockRule>): { isValid: boolean; error?: string } {
  // Check domain
  if (!rule.domain || rule.domain.trim() === '') {
    return { isValid: false, error: 'Domain is required' };
  }

  // Validate domain pattern
  if (!isValidDomainPattern(rule.domain)) {
    return { isValid: false, error: 'Invalid domain pattern' };
  }

  // Check mode
  if (!rule.mode) {
    return { isValid: false, error: 'Blocking mode is required' };
  }

  // Validate based on mode
  if (rule.mode === BlockingMode.TIME_LIMIT) {
    if (!rule.timeLimit || rule.timeLimit <= 0) {
      return { isValid: false, error: 'Time limit must be greater than 0' };
    }
  } else if (rule.mode === BlockingMode.SCHEDULE) {
    if (!rule.schedule || !rule.schedule.days || rule.schedule.days.length === 0) {
      return { isValid: false, error: 'At least one day must be selected for schedule' };
    }

    if (!rule.schedule.timeRanges || rule.schedule.timeRanges.length === 0) {
      return { isValid: false, error: 'At least one time range must be added for schedule' };
    }

    // Validate time ranges
    for (const timeRange of rule.schedule.timeRanges) {
      if (!validateTimeRange(timeRange)) {
        return { isValid: false, error: 'Invalid time range' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates a time range
 * @param timeRange The time range to validate
 * @returns Boolean indicating if time range is valid
 */
export function validateTimeRange(timeRange: TimeRange): boolean {
  if (!timeRange.start || !timeRange.end) {
    return false;
  }

  // Check if start time is before end time
  const startTime = new Date(`1970-01-01T${timeRange.start}`);
  const endTime = new Date(`1970-01-01T${timeRange.end}`);

  return startTime < endTime;
}

/**
 * Validates time format (HH:MM)
 * @param time The time string to validate
 * @returns Boolean indicating if time format is valid
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}
