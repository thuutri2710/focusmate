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

const STORAGE_KEYS = {
  TIME_USAGE: "timeUsage",
  RULES: "blockRules",
};

export const StorageService = {
  // Storage keys

  async getRules() {
    // Force refresh the cache
    rulesCache = null;
    return getRulesFromCache();
  },

  async saveRule(rule) {
    const rules = await getRulesFromCache();
    const existingRuleIndex = rules.findIndex((r) => r.id === rule.id);

    if (existingRuleIndex !== -1) {
      // Update existing rule
      rules[existingRuleIndex] = rule;
    } else {
      // Add new rule with generated ID if not provided
      if (!rule.id) {
        rule.id = Date.now().toString();
      }
      rules.push(rule);
    }

    await chrome.storage.local.set({ blockRules: rules });
    rulesCache = rules;
    return rule;
  },

  async deleteRule(ruleId) {
    const rules = await getRulesFromCache();
    const newRules = rules.filter((rule) => rule.id !== ruleId);
    await chrome.storage.local.set({ blockRules: newRules });
    rulesCache = newRules;
  },

  async clearAllRules() {
    await chrome.storage.local.set({ blockRules: [] });
    rulesCache = [];
  },

  async updateTimeUsage(url, totalMilliseconds) {
    console.log("Updating time usage for:", url, "Total ms:", totalMilliseconds);
    // Normalize URL for consistent storage
    const normalizedUrl = normalizeUrl(url);

    // Get current date as YYYY-MM-DD for the key
    const today = new Date().toISOString().split("T")[0];

    try {
      // Get existing time usage data
      const data = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
      const timeUsage = data[STORAGE_KEYS.TIME_USAGE] || {};

      // Initialize nested objects if they don't exist
      if (!timeUsage[today]) {
        timeUsage[today] = {};
      }

      // Store the total milliseconds spent
      timeUsage[today][normalizedUrl] = Math.round(totalMilliseconds);

      // Save back to storage
      const saveData = {
        [STORAGE_KEYS.TIME_USAGE]: timeUsage,
      };
      await chrome.storage.local.set(saveData);

      console.log("Saved time usage:", {
        url: normalizedUrl,
        date: today,
        timeSpent: totalMilliseconds,
      });

      return timeUsage[today][normalizedUrl];
    } catch (error) {
      console.error("Error updating time usage:", error);
      throw error;
    }
  },

  async getTimeSpentToday(url) {
    try {
      const normalizedUrl = normalizeUrl(url);
      const today = new Date().toISOString().split("T")[0];

      const data = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
      const timeUsage = data[STORAGE_KEYS.TIME_USAGE] || {};

      return timeUsage[today]?.[normalizedUrl] || 0;
    } catch (error) {
      console.error("Error getting time spent:", error);
      return 0;
    }
  },

  async clearTimeUsage() {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.TIME_USAGE);
      console.log("Time usage data cleared");
    } catch (error) {
      console.error("Error clearing time usage:", error);
      throw error;
    }
  },

  async clearOldTimeUsage() {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
      const timeUsage = data[STORAGE_KEYS.TIME_USAGE] || {};

      // Keep only today's data
      const today = new Date().toISOString().split("T")[0];
      const newTimeUsage = {
        [today]: timeUsage[today] || {},
      };

      await chrome.storage.local.set({
        [STORAGE_KEYS.TIME_USAGE]: newTimeUsage,
      });

      console.log("Old time usage data cleared");
    } catch (error) {
      console.error("Error clearing old time usage:", error);
      throw error;
    }
  },

  async getAllTimeUsage() {
    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
      return data[STORAGE_KEYS.TIME_USAGE] || {};
    } catch (error) {
      console.error("Error getting all time usage:", error);
      return {};
    }
  },

  async isUrlBlocked(url) {
    const rules = await this.getRules();
    const normalizedUrl = normalizeUrl(url);
    const timeSpentMs = await this.getTimeSpentToday(normalizedUrl);
    const timeSpentMinutes = timeSpentMs / (1000 * 60); // Convert to minutes for rule checking

    // Group rules by type for efficient checking
    const { exact, wildcard, regexp } = groupRulesByType(rules);

    // Check each type of rule
    for (const rule of [...exact, ...wildcard, ...regexp]) {
      if (isRuleMatched(rule, normalizedUrl, timeSpentMinutes, getCurrentTimeInMinutes())) {
        return rule;
      }
    }

    return null;
  },
};
