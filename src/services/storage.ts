import { extractDomain } from "../utils/urlUtils";
import { isWithinSchedule } from "../utils/scheduleUtils";
import { BlockRule, ExtensionSettings, TimeUsage } from "../types";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../constants";

// Cache for rules to avoid frequent storage reads
let rulesCache: BlockRule[] | null = null;
let rulesCacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

async function getRulesFromCache(): Promise<BlockRule[] | null> {
  const now = Date.now();
  if (!rulesCache || now - rulesCacheTimestamp > CACHE_DURATION) {
    const result = await chrome.storage.local.get(STORAGE_KEYS.BLOCK_RULES);
    rulesCache = result[STORAGE_KEYS.BLOCK_RULES] || [];
    rulesCacheTimestamp = now;
  }

  return rulesCache;
}

function matchDomainPattern(domain: string, pattern: string): boolean {
  // If pattern starts with *., it's a wildcard domain pattern
  if (pattern.startsWith("*.")) {
    const patternDomain = pattern.slice(2); // Remove *. prefix
    return domain.endsWith(patternDomain);
  }

  // Otherwise, exact domain match
  return domain === pattern;
}

function normalizeUrl(url: string): string {
  return extractDomain(url);
}

function isWildcardPattern(pattern: string): boolean {
  return pattern.includes("*") || pattern.includes("?");
}

function isRegExpPattern(pattern: string): boolean {
  return pattern.startsWith("/") && pattern.endsWith("/");
}

function matchesWildcard(text: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex special chars except * and ?
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${regexPattern}$`, "i"); // Add 'i' flag for case-insensitive
  return regex.test(text);
}

function matchesRegExp(text: string, pattern: string): boolean {
  try {
    // Extract the pattern and flags from /pattern/flags format
    const patternBody = pattern.slice(1, pattern.lastIndexOf("/"));
    const patternFlags = pattern.slice(pattern.lastIndexOf("/") + 1);
    const regex = new RegExp(patternBody, patternFlags);
    return regex.test(text);
  } catch (error) {
    console.error("Invalid RegExp pattern:", pattern, error);
    return false;
  }
}

export const StorageService = {
  async getAllRules(): Promise<BlockRule[]> {
    return (await getRulesFromCache()) || [];
  },

  async getRuleById(id: string): Promise<BlockRule | null> {
    const rules = await this.getAllRules();
    return rules.find((rule) => rule.id === id) || null;
  },

  async addRule(rule: Omit<BlockRule, "id" | "createdAt" | "updatedAt">): Promise<BlockRule> {
    const rules = await this.getAllRules();

    // Create new rule with ID and timestamps
    const newRule: BlockRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add to rules array
    rules.push(newRule);

    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEYS.BLOCK_RULES]: rules });

    // Update cache
    rulesCache = rules;
    rulesCacheTimestamp = Date.now();

    return newRule;
  },

  async updateRule(id: string, updates: Partial<BlockRule>): Promise<BlockRule | null> {
    const rules = await this.getAllRules();
    const index = rules.findIndex((rule) => rule.id === id);

    if (index === -1) {
      return null;
    }

    // Update the rule
    const updatedRule: BlockRule = {
      ...rules[index],
      ...updates,
      updatedAt: Date.now(),
    };

    rules[index] = updatedRule;

    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEYS.BLOCK_RULES]: rules });

    // Update cache
    rulesCache = rules;
    rulesCacheTimestamp = Date.now();

    return updatedRule;
  },

  async deleteRule(id: string): Promise<boolean> {
    const rules = await this.getAllRules();
    const filteredRules = rules.filter((rule) => rule.id !== id);

    if (filteredRules.length === rules.length) {
      return false; // No rule was deleted
    }

    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEYS.BLOCK_RULES]: filteredRules });

    // Update cache
    rulesCache = filteredRules;
    rulesCacheTimestamp = Date.now();

    return true;
  },

  async checkUrlAgainstRules(url: string): Promise<{ blocked: boolean; rule: BlockRule | null }> {
    const domain = normalizeUrl(url);
    const rules = await this.getAllRules();

    // Find active rules that match this domain
    for (const rule of rules) {
      if (!rule.active) continue;

      let matches = false;

      if (isRegExpPattern(rule.domain)) {
        matches = matchesRegExp(domain, rule.domain);
      } else if (isWildcardPattern(rule.domain)) {
        matches = matchesWildcard(domain, rule.domain);
      } else {
        matches = matchDomainPattern(domain, rule.domain);
      }

      if (matches) {
        // For schedule mode, check if current time is within schedule
        if (rule.mode === 'schedule') {
          if (rule.schedule && isWithinSchedule(rule.schedule)) {
            return { blocked: true, rule };
          }
        } else {
          // For non-schedule modes (block, time_limit), block immediately on match
          return { blocked: true, rule };
        }
      }
    }

    return { blocked: false, rule: null };
  },

  async getTimeSpentToday(domain: string): Promise<number> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
    const timeUsage: TimeUsage = result[STORAGE_KEYS.TIME_USAGE] || {};
    return timeUsage[domain] || 0;
  },

  async updateTimeUsage(domain: string, timeSpent: number): Promise<void> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
    const timeUsage: TimeUsage = result[STORAGE_KEYS.TIME_USAGE] || {};

    timeUsage[domain] = timeSpent;

    await chrome.storage.local.set({ [STORAGE_KEYS.TIME_USAGE]: timeUsage });
  },

  async getAllTimeUsage(): Promise<TimeUsage> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TIME_USAGE);
    return result[STORAGE_KEYS.TIME_USAGE] || {};
  },

  async resetTimeUsage(): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.TIME_USAGE]: {},
      [STORAGE_KEYS.LAST_RESET]: Date.now(),
    });
  },

  async getLastResetTime(): Promise<number> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_RESET);
    return result[STORAGE_KEYS.LAST_RESET] || 0;
  },

  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const currentSettings = await this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };

    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updatedSettings });
    return updatedSettings;
  },

  async resetAllData(): Promise<void> {
    await chrome.storage.local.clear();
    rulesCache = null;
  },
};
