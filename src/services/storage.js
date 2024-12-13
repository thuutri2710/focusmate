// Cache for rules to avoid frequent storage reads
let rulesCache = null;
let rulesCacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

async function getRulesFromCache() {
    const now = Date.now();
    if (!rulesCache || now - rulesCacheTimestamp > CACHE_DURATION) {
        const result = await chrome.storage.local.get('blockRules');
        rulesCache = result.blockRules || [];
        rulesCacheTimestamp = now;
    }
    return rulesCache;
}

// Create an index of rules by domain for faster lookup
function createRuleIndex(rules) {
    const index = new Map();
    for (const rule of rules) {
        const domain = rule.websiteUrl.endsWith('/*') 
            ? rule.websiteUrl.slice(0, -2) 
            : rule.websiteUrl;
        if (!index.has(domain)) {
            index.set(domain, []);
        }
        index.get(domain).push(rule);
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
        rules.push({
            ...rule,
            id: Date.now().toString()
        });
        await chrome.storage.local.set({ blockRules: rules });
        rulesCache = rules;
        rulesCacheTimestamp = Date.now();
    },

    async deleteRule(ruleId) {
        const rules = await getRulesFromCache();
        const updatedRules = rules.filter(rule => rule.id !== ruleId);
        await chrome.storage.local.set({ blockRules: updatedRules });
        rulesCache = updatedRules;
        rulesCacheTimestamp = Date.now();
    },

    async cleanupOldTimeUsage() {
        const timeUsage = await this.getTimeUsage();
        const today = new Date().toLocaleDateString();
        
        // Only keep today's data
        const cleanedTimeUsage = {
            [today]: timeUsage[today] || {}
        };
        
        await chrome.storage.local.set({ timeUsage: cleanedTimeUsage });
        return cleanedTimeUsage;
    },

    async getTimeUsage() {
        const result = await chrome.storage.local.get('timeUsage');
        return result.timeUsage || {};
    },

    async updateTimeUsage(url, minutes) {
        const today = new Date().toLocaleDateString();
        const timeUsage = await this.getTimeUsage();
        
        if (!timeUsage[today]) {
            timeUsage[today] = {};
        }
        
        if (!timeUsage[today][url]) {
            timeUsage[today][url] = 0;
        }
        
        timeUsage[today][url] += minutes;
        await chrome.storage.local.set({ timeUsage });
        
        return timeUsage[today][url];
    },

    async getTimeSpentToday(url) {
        const today = new Date().toLocaleDateString();
        const timeUsage = await this.getTimeUsage();
        return Math.round(timeUsage[today]?.[url] || 0);
    },

    async isUrlBlocked(url) {
        const rules = await getRulesFromCache();
        const rulesIndex = createRuleIndex(rules);
        const urlObj = new URL(url);
        const urlPath = urlObj.origin + urlObj.pathname;
        
        // Check exact match first
        const exactMatches = rulesIndex.get(urlPath) || [];
        
        // Check wildcard matches
        const domainParts = urlPath.split('/');
        const possibleWildcardDomains = [];
        for (let i = 0; i < domainParts.length; i++) {
            const partialPath = domainParts.slice(0, i + 1).join('/');
            possibleWildcardDomains.push(partialPath);
        }
        
        const matchingRules = [
            ...exactMatches,
            ...possibleWildcardDomains.flatMap(domain => rulesIndex.get(domain) || [])
        ];

        if (matchingRules.length === 0) return null;

        const today = new Date().toLocaleDateString();
        const timeUsage = await this.getTimeUsage();
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        // Check all matching rules
        for (const rule of matchingRules) {
            // Check daily time limit
            if (rule.dailyTimeLimit) {
                const minutesSpentToday = timeUsage[today]?.[urlPath] || 0;
                if (minutesSpentToday >= rule.dailyTimeLimit) {
                    return rule;
                }
            }

            // Check time range
            if (rule.startTime && rule.endTime) {
                const currentTimeMinutes = currentHour * 60 + currentMinute;
                const [startHour, startMinute] = rule.startTime.split(':').map(Number);
                const [endHour, endMinute] = rule.endTime.split(':').map(Number);
                const startTimeMinutes = startHour * 60 + startMinute;
                const endTimeMinutes = endHour * 60 + endMinute;

                if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes) {
                    return rule;
                }
            }
        }

        return null;
    }
};