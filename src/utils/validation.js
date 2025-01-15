import { BLOCKING_MODES, DAYS_LIST } from "../constants/index.js";

const URL_PATTERNS = {
  PROTOCOL: /^https?:\/\//,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/,
  WILDCARD_DOMAIN: /^\*\.[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/,
};

const VALIDATION_MESSAGES = {
  WEBSITE_URL_REQUIRED: "Website URL is required",
  INVALID_URL: "Invalid domain format. Use domain.com or *.domain.com",
  START_TIME_REQUIRED: "Start time is required for time range blocking",
  END_TIME_REQUIRED: "End time is required for time range blocking",
  DAILY_LIMIT_REQUIRED: "Daily time limit is required",
  DAILY_LIMIT_POSITIVE: "Daily time limit must be a positive number",
  INVALID_DAYS: "Selected days must be valid days of the week",
  AT_LEAST_ONE_DAY: "At least one day must be selected",
};

function isValidDomainPattern(domain) {
  // Remove protocol if present
  const domainWithoutProtocol = domain.replace(URL_PATTERNS.PROTOCOL, "");

  if (domainWithoutProtocol.startsWith("*.")) {
    return URL_PATTERNS.WILDCARD_DOMAIN.test(domainWithoutProtocol);
  }

  return URL_PATTERNS.DOMAIN.test(domainWithoutProtocol);
}

function validateSelectedDays(days) {
  if (!days || !Array.isArray(days)) return false;
  if (days.length === 0) return false;
  return days.every(day => DAYS_LIST.includes(day));
}

export function validateRule(rule) {
  const errors = [];
  const fieldErrors = {};

  // Validate website URL (domain)
  if (!rule.websiteUrl) {
    errors.push(VALIDATION_MESSAGES.WEBSITE_URL_REQUIRED);
    fieldErrors.websiteUrl = VALIDATION_MESSAGES.WEBSITE_URL_REQUIRED;
  } else if (!isValidDomainPattern(rule.websiteUrl)) {
    errors.push(VALIDATION_MESSAGES.INVALID_URL);
    fieldErrors.websiteUrl = VALIDATION_MESSAGES.INVALID_URL;
  }

  // Validate selected days
  if (!validateSelectedDays(rule.selectedDays)) {
    errors.push(VALIDATION_MESSAGES.AT_LEAST_ONE_DAY);
    fieldErrors.selectedDays = VALIDATION_MESSAGES.AT_LEAST_ONE_DAY;
  }

  // Validate based on blocking mode
  if (rule.blockingMode === BLOCKING_MODES.TIME_RANGE) {
    if (!rule.startTime) {
      errors.push(VALIDATION_MESSAGES.START_TIME_REQUIRED);
      fieldErrors.startTime = VALIDATION_MESSAGES.START_TIME_REQUIRED;
    }
    if (!rule.endTime) {
      errors.push(VALIDATION_MESSAGES.END_TIME_REQUIRED);
      fieldErrors.endTime = VALIDATION_MESSAGES.END_TIME_REQUIRED;
    }
  } else if (rule.blockingMode === BLOCKING_MODES.TIME_LIMIT) {
    if (!rule.dailyTimeLimit) {
      errors.push(VALIDATION_MESSAGES.DAILY_LIMIT_REQUIRED);
      fieldErrors.dailyTimeLimit = VALIDATION_MESSAGES.DAILY_LIMIT_REQUIRED;
    } else if (rule.dailyTimeLimit < 0) {
      errors.push(VALIDATION_MESSAGES.DAILY_LIMIT_POSITIVE);
      fieldErrors.dailyTimeLimit = VALIDATION_MESSAGES.DAILY_LIMIT_POSITIVE;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}
