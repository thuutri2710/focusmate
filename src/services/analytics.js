// Analytics Event Categories
export const EventCategory = {
    RULE: 'rule_management',
    NAVIGATION: 'navigation',
    URL: 'url_interaction',
    CONFIGURATION: 'rule_configuration',
    ERROR: 'error',
    ENGAGEMENT: 'user_engagement',
    FEATURE: 'feature_usage'
};

// Analytics Event Actions
export const EventAction = {
    // Rule Management
    CREATE: 'create',
    DELETE: 'delete',
    EDIT: 'edit',
    CLEAR_ALL: 'clear_all',
    VALIDATION_FAIL: 'validation_fail',

    // Navigation
    TAB_SWITCH: 'tab_switch',
    POPUP_OPEN: 'popup_open',
    POPUP_CLOSE: 'popup_close',

    // URL Interaction
    COPY_SUCCESS: 'copy_success',
    COPY_FAIL: 'copy_fail',
    AUTO_FILL: 'auto_fill',

    // Configuration
    MODE_SELECT: 'mode_select',
    TIME_SET: 'time_set',
    TOGGLE_STATUS: 'toggle_status',

    // Error Events
    FORM_ERROR: 'form_error',
    STORAGE_ERROR: 'storage_error',

    // Feature Usage
    QUICK_ADD: 'quick_add',
    USE_TEMPLATE: 'use_template',
    VIEW_LIST: 'view_list'
};

class AnalyticsService {
    constructor() {
        this.isInitialized = false;
        this.measurementId = null;
    }

    init(measurementId) {
        if (this.isInitialized) return;

        this.measurementId = measurementId;
        
        // Load Google Analytics script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { window.dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', measurementId);

        this.isInitialized = true;
    }

    trackEvent(category, action, label = null, value = null) {
        if (!this.isInitialized) {
            console.warn('Analytics not initialized');
            return;
        }

        const eventParams = {
            event_category: category,
            event_label: label
        };

        if (value !== null) {
            eventParams.value = value;
        }

        gtag('event', action, eventParams);
    }

    // Rule Management Events
    trackRuleCreation(ruleType, success = true) {
        this.trackEvent(EventCategory.RULE, EventAction.CREATE, ruleType);
    }

    trackRuleDeletion(ruleType) {
        this.trackEvent(EventCategory.RULE, EventAction.DELETE, ruleType);
    }

    trackRuleEdit(ruleType) {
        this.trackEvent(EventCategory.RULE, EventAction.EDIT, ruleType);
    }

    trackClearAllRules() {
        this.trackEvent(EventCategory.RULE, EventAction.CLEAR_ALL);
    }

    // Navigation Events
    trackTabSwitch(tabName) {
        this.trackEvent(EventCategory.NAVIGATION, EventAction.TAB_SWITCH, tabName);
    }

    trackPopupOpen() {
        this.trackEvent(EventCategory.NAVIGATION, EventAction.POPUP_OPEN);
    }

    trackPopupClose() {
        this.trackEvent(EventCategory.NAVIGATION, EventAction.POPUP_CLOSE);
    }

    // URL Interaction Events
    trackUrlCopy(success) {
        const action = success ? EventAction.COPY_SUCCESS : EventAction.COPY_FAIL;
        this.trackEvent(EventCategory.URL, action);
    }

    trackUrlAutofill() {
        this.trackEvent(EventCategory.URL, EventAction.AUTO_FILL);
    }

    // Configuration Events
    trackBlockingModeSelection(mode) {
        this.trackEvent(EventCategory.CONFIGURATION, EventAction.MODE_SELECT, mode);
    }

    trackTimeRangeSet(range) {
        this.trackEvent(EventCategory.CONFIGURATION, EventAction.TIME_SET, range);
    }

    trackRuleToggle(enabled) {
        this.trackEvent(EventCategory.CONFIGURATION, EventAction.TOGGLE_STATUS, enabled ? 'enabled' : 'disabled');
    }

    // Error Events
    trackError(errorType, errorMessage) {
        this.trackEvent(EventCategory.ERROR, errorType, errorMessage);
    }

    // Feature Usage Events
    trackQuickAdd() {
        this.trackEvent(EventCategory.FEATURE, EventAction.QUICK_ADD);
    }

    trackTemplateUsage(templateName) {
        this.trackEvent(EventCategory.FEATURE, EventAction.USE_TEMPLATE, templateName);
    }

    trackListView(listType) {
        this.trackEvent(EventCategory.FEATURE, EventAction.VIEW_LIST, listType);
    }
}

export const Analytics = new AnalyticsService();
