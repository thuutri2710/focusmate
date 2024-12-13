// Storage utility functions
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

    async isUrlBlocked(url) {
        const rules = await this.getRules();
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        return rules.find(rule => {
            if (!url.includes(rule.websiteUrl)) return false;

            const [startHour, startMinute] = rule.startTime.split(':').map(Number);
            const [endHour, endMinute] = rule.endTime.split(':').map(Number);

            const isAfterStart = currentHour > startHour || 
                (currentHour === startHour && currentMinute >= startMinute);
            const isBeforeEnd = currentHour < endHour || 
                (currentHour === endHour && currentMinute <= endMinute);

            return isAfterStart && isBeforeEnd;
        });
    }
};