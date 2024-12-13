export function validateRule(rule) {
    if (!rule.websiteUrl) {
        return 'Website URL is required';
    }

    const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/;
    if (!urlPattern.test(rule.websiteUrl)) {
        return 'Invalid website URL format';
    }

    if (rule.redirectUrl && !rule.redirectUrl.startsWith('http')) {
        return 'Redirect URL must start with http:// or https://';
    }

    // Check if either time range or daily limit is provided, but not both
    const hasTimeRange = rule.startTime && rule.endTime;
    const hasDailyLimit = rule.dailyTimeLimit;

    if (!hasTimeRange && !hasDailyLimit) {
        return 'Please set either a time range or a daily time limit';
    }

    if (hasTimeRange && hasDailyLimit) {
        return 'Cannot set both time range and daily time limit';
    }

    // Validate time range if provided
    if (hasTimeRange) {
        const [startHour, startMinute] = rule.startTime.split(':').map(Number);
        const [endHour, endMinute] = rule.endTime.split(':').map(Number);
        
        if (startHour > endHour || (startHour === endHour && startMinute >= endMinute)) {
            return 'End time must be after start time';
        }
    }

    // Validate daily time limit if provided
    if (hasDailyLimit) {
        const limit = Number(rule.dailyTimeLimit);
        if (isNaN(limit) || limit <= 0 || !Number.isInteger(limit)) {
            return 'Daily time limit must be a positive integer';
        }
    }

    return null;
}