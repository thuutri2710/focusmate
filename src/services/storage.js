// Cache for rules to avoid frequent storage reads
let rulesCache = null;
let rulesCacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

async function getRulesFromCache() {
  const now = Date.now();
  if (!rulesCache || now - rulesCacheTimestamp > CACHE_DURATION) {
    const result = await chrome.storage.local.get("blockRules");
    rulesCache = result.blockRules || [];
    rulesCacheTimestamp = now;
  }
  return rulesCache;
}

function normalizeUrl(url) {
  // Add protocol if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  try {
    const urlObj = new URL(url);
    // Return the full URL including pathname for wildcard and regex matching
    return urlObj.toString().replace(/\/$/, ""); // Remove trailing slash
  } catch (e) {
    // If URL is invalid or contains wildcards/regex, return as is
    return url;
  }
}

function isWildcardPattern(pattern) {
  return pattern.includes("*") || pattern.includes("?");
}

function isRegExpPattern(pattern) {
  return pattern.startsWith("/") && pattern.endsWith("/");
}

function matchesWildcard(text, pattern) {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except * and ?
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${regexPattern}$`, "i"); // Add 'i' flag for case-insensitive
  return regex.test(text);
}

function matchesRegExp(text, pattern) {
  // Remove leading and trailing slashes
  const regexPattern = pattern.slice(1, -1);
  try {
    const regex = new RegExp(regexPattern, "i"); // Add 'i' flag for case-insensitive
    return regex.test(text);
  } catch (e) {
    console.error("Invalid RegExp pattern:", pattern);
    return false;
  }
}

function groupRulesByType(rules) {
  return rules.reduce(
    (acc, rule) => {
      const pattern = rule.websiteUrl;
      if (isRegExpPattern(pattern)) {
        acc.regexp.push(rule);
      } else if (isWildcardPattern(pattern)) {
        acc.wildcard.push(rule);
      } else {
        acc.exact.push(rule);
      }
      return acc;
    },
    { exact: [], wildcard: [], regexp: [] }
  );
}

function getCurrentTimeInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseTimeRange(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return {
    start: startHour * 60 + startMinute,
    end: endHour * 60 + endMinute,
  };
}

function isWithinTimeRange(currentMinutes, startTime, endTime) {
  const range = parseTimeRange(startTime, endTime);
  return currentMinutes >= range.start && currentMinutes <= range.end;
}

function checkExactMatch(normalizedUrl, pattern) {
  const normalizedPattern = normalizeUrl(pattern);
  return normalizedUrl.toLowerCase() === normalizedPattern.toLowerCase();
}

function isRuleMatched(rule, normalizedUrl, timeSpent, currentTimeMinutes) {
  // Check if URL matches the rule pattern
  let matches = false;
  const rulePattern = rule.websiteUrl;

  if (isRegExpPattern(rulePattern)) {
    matches = matchesRegExp(normalizedUrl, rulePattern);
  } else if (isWildcardPattern(rulePattern)) {
    matches = matchesWildcard(normalizedUrl, rulePattern);
  } else {
    // For exact matches, normalize both URLs and compare case-insensitively
    const normalizedPattern = normalizeUrl(rulePattern);
    matches = normalizedUrl.toLowerCase() === normalizedPattern.toLowerCase();
  }

  if (!matches) return false;

  // If there's a daily time limit and it's exceeded, block the URL
  if (rule.dailyTimeLimit && timeSpent >= rule.dailyTimeLimit) {
    return true;
  }

  // If there's a time range and we're within it, block the URL
  if (rule.startTime && rule.endTime) {
    return isWithinTimeRange(currentTimeMinutes, rule.startTime, rule.endTime);
  }

  // If there's no time limit or range specified but URL matches, block it
  return !rule.dailyTimeLimit && !rule.startTime && !rule.endTime;
}

export const StorageService = {
  async getRules() {
    const rules = await getRulesFromCache();
    return rules;
  },

  async saveRule(rule) {
    const rules = await getRulesFromCache();
    const normalizedRule = {
      ...rule,
      id: Date.now().toString(),
      websiteUrl: rule.websiteUrl.trim(),
    };
    rules.push(normalizedRule);
    await chrome.storage.local.set({ blockRules: rules });
    rulesCache = rules;
    rulesCacheTimestamp = Date.now();
  },

  async deleteRule(ruleId) {
    const rules = await getRulesFromCache();
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    await chrome.storage.local.set({ blockRules: updatedRules });
    rulesCache = updatedRules;
    rulesCacheTimestamp = Date.now();
  },

  async cleanupOldTimeUsage() {
    const timeUsage = await this.getTimeUsage();
    const today = new Date().toLocaleDateString();

    // Only keep today's data
    const cleanedTimeUsage = {
      [today]: timeUsage[today] || {},
    };

    await chrome.storage.local.set({ timeUsage: cleanedTimeUsage });
    return cleanedTimeUsage;
  },

  async getTimeUsage() {
    const result = await chrome.storage.local.get("timeUsage");
    return result.timeUsage || {};
  },

  async updateTimeUsage(url, minutes) {
    const normalizedUrl = normalizeUrl(url);
    const today = new Date().toLocaleDateString();
    const timeUsage = await this.getTimeUsage();

    if (!timeUsage[today]) {
      timeUsage[today] = {};
    }

    if (!timeUsage[today][normalizedUrl]) {
      timeUsage[today][normalizedUrl] = 0;
    }

    timeUsage[today][normalizedUrl] += minutes;
    await chrome.storage.local.set({ timeUsage });

    return timeUsage[today][normalizedUrl];
  },

  async getTimeSpentToday(url) {
    const normalizedUrl = normalizeUrl(url);
    const today = new Date().toLocaleDateString();
    const timeUsage = await this.getTimeUsage();
    return Math.round(timeUsage[today]?.[normalizedUrl] || 0);
  },

  async isUrlBlocked(url) {
    const rules = await getRulesFromCache();
    if (!rules.length) return null;

    const normalizedUrl = normalizeUrl(url);
    const today = new Date().toLocaleDateString();
    const timeUsage = await this.getTimeUsage();
    const timeSpent = timeUsage[today]?.[normalizedUrl] || 0;
    const currentTimeMinutes = getCurrentTimeInMinutes();

    // Process rules in order of matching complexity
    const { exact, wildcard, regexp } = groupRulesByType(rules);

    // Check all rules in order of complexity
    for (const rule of [...exact, ...wildcard, ...regexp]) {
      if (isRuleMatched(rule, normalizedUrl, timeSpent, currentTimeMinutes)) {
        return rule;
      }
    }

    return null;
  },
};
