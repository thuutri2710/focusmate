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
  if (tld.length < 2 || /^[*?]+$/.test(tld)) return false;

  return true;
}

function isValidUrl(url) {
  // Remove protocol if present
  const urlWithoutProtocol = url.replace(/^https?:\/\//, "");

  // Basic URL pattern (allows subdomains and paths)
  const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}(\/[^\s]*)?\/?$/;
  console.log(urlPattern, urlWithoutProtocol, url);
  return urlPattern.test(urlWithoutProtocol);
}

export function validateRule(rule) {
  if (!rule.websiteUrl) {
    return "Website URL is required";
  }

  const websiteUrl = rule.websiteUrl.trim();

  // Check if it's a regex pattern
  if (websiteUrl.startsWith("/") && websiteUrl.endsWith("/")) {
    if (!isValidRegexPattern(websiteUrl)) {
      return "Invalid regular expression pattern";
    }
  }
  // Check if it's a wildcard pattern
  else if (websiteUrl.includes("*") || websiteUrl.includes("?")) {
    if (!isValidWildcardPattern(websiteUrl)) {
      return "Invalid wildcard pattern";
    }
  }
  // Regular URL validation
  else {
    // Handle URLs with or without protocol
    let urlToValidate = websiteUrl.startsWith("https") ? websiteUrl : `https://${websiteUrl}`;
    urlToValidate = websiteUrl.startsWith("http") ? websiteUrl : `http://${websiteUrl}`;
    console.log(urlToValidate, websiteUrl);
    try {
      new URL(urlToValidate);
      if (!isValidUrl(websiteUrl)) {
        return "Invalid website URL format";
      }
    } catch (e) {
      return "Invalid website URL format";
    }
  }

  if (rule.redirectUrl && !rule.redirectUrl.startsWith("http")) {
    return "Redirect URL must start with http:// or https://";
  }

  // Check if either time range or daily limit is provided, but not both
  const hasTimeRange = rule.startTime && rule.endTime;
  const hasDailyLimit = rule.dailyTimeLimit;

  if (!hasTimeRange && !hasDailyLimit) {
    return "Please set either a time range or a daily time limit";
  }

  if (hasTimeRange && hasDailyLimit) {
    return "Cannot set both time range and daily time limit";
  }

  // Validate time range if provided
  if (hasTimeRange) {
    const [startHour, startMinute] = rule.startTime.split(":").map(Number);
    const [endHour, endMinute] = rule.endTime.split(":").map(Number);

    if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
      return "End time must be after start time";
    }
  }

  // Validate daily time limit if provided
  if (hasDailyLimit) {
    const limit = Number(rule.dailyTimeLimit);
    if (isNaN(limit) || limit <= 0 || !Number.isInteger(limit)) {
      return "Daily time limit must be a positive integer";
    }
  }

  return null;
}
