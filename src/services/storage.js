export const StorageService = {
    async getRules() {
        const result = await chrome.storage.local.get('blockRules');
        return result.blockRules || [];
    },

    async saveRule(rule) {
        const rules = await this.getRules();
        rules.push({
            ...rule,
            id: Date.now().toString()
        });
        await chrome.storage.local.set({ blockRules: rules });
    },

    async deleteRule(ruleId) {
        const rules = await this.getRules();
        const updatedRules = rules.filter(rule => rule.id !== ruleId);
        await chrome.storage.local.set({ blockRules: updatedRules });
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

    async getRules() {
        const result = await chrome.storage.local.get('blockRules');
        const rules = result.blockRules || [];
        
        // Add time spent today for each rule
        const rulesWithTimeSpent = await Promise.all(rules.map(async (rule) => {
            const timeSpent = await this.getTimeSpentToday(rule.websiteUrl);
            return { ...rule, timeSpentToday: timeSpent };
        }));
        
        return rulesWithTimeSpent;
    },

    async isUrlBlocked(url) {
        const rules = await this.getRules();
        const currentTime = new Date('2024-12-13T14:59:46+07:00'); // Using provided time
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const today = currentTime.toLocaleDateString();
        
        // Clean up old data on each check
        const timeUsage = await this.getTimeUsage();
        const yesterday = new Date(currentTime);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString();
        
        if (timeUsage[yesterdayStr]) {
            delete timeUsage[yesterdayStr];
            await chrome.storage.local.set({ timeUsage });
        }

        // Find the first matching rule
        for (const rule of rules) {
            const ruleUrl = rule.websiteUrl;
            const isWildcardRule = ruleUrl.endsWith('/*');
            const baseUrl = isWildcardRule ? ruleUrl.slice(0, -2) : ruleUrl;
            const urlMatches = isWildcardRule ? 
                url.startsWith(baseUrl) : 
                url === baseUrl;
            
            if (!urlMatches) continue;

            // Check daily time limit
            if (rule.dailyTimeLimit) {
                const minutesSpentToday = timeUsage[today]?.[url] || 0;
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