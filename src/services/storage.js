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
    return urlObj.origin + urlObj.pathname;
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
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except * and ?
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${regexPattern}$`).test(text);
}

function matchesRegExp(text, pattern) {
  // Remove leading and trailing slashes
  const regexPattern = pattern.slice(1, -1);
  try {
    return new RegExp(regexPattern).test(text);
  } catch (e) {
    console.error("Invalid RegExp pattern:", pattern);
    return false;
  }
}

// Create an index of rules by domain for faster lookup
function createRuleIndex(rules) {
  const index = new Map();
  for (const rule of rules) {
    const websiteUrl = rule.websiteUrl;
    if (!index.has(websiteUrl)) {
      index.set(websiteUrl, []);
    }
    index.get(websiteUrl).push(rule);
  }
  return index;
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
    const rulesIndex = createRuleIndex(rules);
    const normalizedUrl = normalizeUrl(url);

    // Check all rules for a match
    for (const [rulePattern, rulesList] of rulesIndex.entries()) {
      let matches = false;

      if (isRegExpPattern(rulePattern)) {
        matches = matchesRegExp(normalizedUrl, rulePattern);
      } else if (isWildcardPattern(rulePattern)) {
        matches = matchesWildcard(normalizedUrl, rulePattern);
      } else {
        // Exact match (case-insensitive)
        const normalizedPattern = normalizeUrl(rulePattern);
        matches = normalizedUrl.toLowerCase() === normalizedPattern.toLowerCase();
      }

      if (matches) {
        const today = new Date().toLocaleDateString();
        const timeUsage = await this.getTimeUsage();
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        // Check all matching rules
        for (const rule of rulesList) {
          // Check daily time limit
          if (rule.dailyTimeLimit) {
            const minutesSpentToday = timeUsage[today]?.[normalizedUrl] || 0;
            if (minutesSpentToday >= rule.dailyTimeLimit) {
              return rule;
            }
          }

          // Check time range
          if (rule.startTime && rule.endTime) {
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const [startHour, startMinute] = rule.startTime.split(":").map(Number);
            const [endHour, endMinute] = rule.endTime.split(":").map(Number);
            const startTimeMinutes = startHour * 60 + startMinute;
            const endTimeMinutes = endHour * 60 + endMinute;

            if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes) {
              return rule;
            }
          }
        }
      }
    }

    return null;
  },
};
