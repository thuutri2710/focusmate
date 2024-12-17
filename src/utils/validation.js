import { BLOCKING_MODES } from '../constants/index.js';

const URL_PATTERNS = {
  PROTOCOL: /^https?:\/\//,
  BASIC: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}(\/[^\s]*)?\/?$/,
  WILDCARD_TLD: /^[*?]+$/
};

const VALIDATION_MESSAGES = {
  WEBSITE_URL_REQUIRED: 'Website URL is required',
  INVALID_REGEX: 'Invalid regular expression pattern',
  INVALID_WILDCARD: 'Invalid wildcard pattern',
  INVALID_URL: 'Invalid URL format',
  START_TIME_REQUIRED: 'Start time is required for time range blocking',
  END_TIME_REQUIRED: 'End time is required for time range blocking',
  DAILY_LIMIT_REQUIRED: 'Daily time limit is required for time limit blocking',
  DAILY_LIMIT_POSITIVE: 'Daily time limit must be a positive number'
};

function isValidRegexPattern(pattern) {
  // Check if pattern is enclosed in forward slashes
  if (!pattern.startsWith("/") || !pattern.endsWith("/")) {
    return false;
  }

  // Try to create a RegExp object with the pattern
  try {
    new RegExp(pattern.slice(1, -1));
    return true;
  } catch (e) {
    return false;
  }
}

function isValidWildcardPattern(pattern) {
  // Allow * and ? wildcards, but ensure basic URL structure
  const parts = pattern.split(".");
  if (parts.length < 2) return false;

  // Check TLD isn't just wildcards
  const tld = parts[parts.length - 1];
  if (tld.length < 2 || URL_PATTERNS.WILDCARD_TLD.test(tld)) return false;

  return true;
}

function isValidUrl(url) {
  // Remove protocol if present
  const urlWithoutProtocol = url.replace(URL_PATTERNS.PROTOCOL, "");
  return URL_PATTERNS.BASIC.test(urlWithoutProtocol);
}

export function validateRule(rule) {
  const errors = [];

  if (!rule.websiteUrl) {
    errors.push(VALIDATION_MESSAGES.WEBSITE_URL_REQUIRED);
    return { isValid: false, errors };
  }

  const websiteUrl = rule.websiteUrl.trim();

  // Check if it's a regex pattern
  if (websiteUrl.startsWith("/") && websiteUrl.endsWith("/")) {
    if (!isValidRegexPattern(websiteUrl)) {
      errors.push(VALIDATION_MESSAGES.INVALID_REGEX);
    }
  }
  // Check if it's a wildcard pattern
  else if (websiteUrl.includes("*") || websiteUrl.includes("?")) {
    if (!isValidWildcardPattern(websiteUrl)) {
      errors.push(VALIDATION_MESSAGES.INVALID_WILDCARD);
    }
  }
  // Regular URL validation
  else if (!isValidUrl(websiteUrl)) {
    errors.push(VALIDATION_MESSAGES.INVALID_URL);
  }

  // Validate blocking mode specific fields
  if (rule.blockingMode === BLOCKING_MODES.TIME_RANGE) {
    if (!rule.startTime) {
      errors.push(VALIDATION_MESSAGES.START_TIME_REQUIRED);
    }
    if (!rule.endTime) {
      errors.push(VALIDATION_MESSAGES.END_TIME_REQUIRED);
    }
  } else {
    if (!rule.dailyTimeLimit) {
      errors.push(VALIDATION_MESSAGES.DAILY_LIMIT_REQUIRED);
    }
    if (rule.dailyTimeLimit <= 0) {
      errors.push(VALIDATION_MESSAGES.DAILY_LIMIT_POSITIVE);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
