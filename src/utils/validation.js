import { BLOCKING_MODES } from "../constants/index.js";

const URL_PATTERNS = {
  PROTOCOL: /^https?:\/\//,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/,
  WILDCARD_DOMAIN: /^\*\.[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/
};

const VALIDATION_MESSAGES = {
  WEBSITE_URL_REQUIRED: "Website URL is required",
  INVALID_URL: "Invalid domain format. Use domain.com or *.domain.com",
  START_TIME_REQUIRED: "Start time is required for time range blocking",
  END_TIME_REQUIRED: "End time is required for time range blocking",
  DAILY_LIMIT_REQUIRED: "Daily time limit is required for time limit blocking",
  DAILY_LIMIT_POSITIVE: "Daily time limit must be a positive number"
};

function isValidDomainPattern(domain) {
  const domainWithoutProtocol = domain.replace(URL_PATTERNS.PROTOCOL, "");
  
  if (domainWithoutProtocol.startsWith("*.")) {
    return URL_PATTERNS.WILDCARD_DOMAIN.test(domainWithoutProtocol);
  }
  
  return URL_PATTERNS.DOMAIN.test(domainWithoutProtocol);
}

export function validateRule(rule) {
  const errors = [];

  if (!rule.websiteUrl) {
    errors.push(VALIDATION_MESSAGES.WEBSITE_URL_REQUIRED);
  } else if (!isValidDomainPattern(rule.websiteUrl)) {
    errors.push(VALIDATION_MESSAGES.INVALID_URL);
  }

  if (rule.blockingMode === BLOCKING_MODES.TIME_RANGE) {
    if (!rule.startTime) {
      errors.push(VALIDATION_MESSAGES.START_TIME_REQUIRED);
    }
    if (!rule.endTime) {
      errors.push(VALIDATION_MESSAGES.END_TIME_REQUIRED);
    }
  } else if (rule.blockingMode === BLOCKING_MODES.DAILY_LIMIT) {
    if (!rule.dailyTimeLimit) {
      errors.push(VALIDATION_MESSAGES.DAILY_LIMIT_REQUIRED);
    } else if (rule.dailyTimeLimit <= 0) {
      errors.push(VALIDATION_MESSAGES.DAILY_LIMIT_POSITIVE);
    }
  }

  return errors;
}
