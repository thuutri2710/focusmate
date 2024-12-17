// Rule Types
export const BLOCKING_MODES = {
  TIME_RANGE: "timeRange",
  TIME_LIMIT: "timeLimit",
};

// Tab Order and IDs
export const TABS = {
  ORDER: ["add-rule-tab", "applying-rules-tab", "active-rules-tab"],
  IDS: {
    ADD_RULE: "add-rule-tab",
    CURRENT_PAGE: "applying-rules-tab",
    ALL_RULES: "active-rules-tab",
  },
  CONTENT: {
    ADD_RULE: "add-rule-content",
    CURRENT_PAGE: "applying-rules-content",
    ALL_RULES: "active-rules-content",
  },
};

// DOM Element IDs
export const DOM_IDS = {
  // Form Elements
  BLOCK_FORM: "blockForm",
  WEBSITE_URL: "websiteUrl",
  REDIRECT_URL: "redirectUrl",
  BLOCKING_MODE: "blockingMode",
  START_TIME: "startTime",
  END_TIME: "endTime",
  DAILY_TIME_LIMIT: "dailyTimeLimit",

  // Tab Elements
  ADD_RULE_TAB: "add-rule-tab",
  APPLYING_RULES_TAB: "applying-rules-tab",
  ACTIVE_RULES_TAB: "active-rules-tab",
  ADD_RULE_CONTENT: "add-rule-content",
  APPLYING_RULES_CONTENT: "applying-rules-content",
  ACTIVE_RULES_CONTENT: "active-rules-content",

  // Lists
  ALL_RULES_LIST: "allRulesList",
  APPLYING_RULES_LIST: "applyingRulesList",

  // Other Elements
  CURRENT_URL: "currentUrl",
  TIME_RANGE_FIELDS: "timeRangeFields",
  TIME_LIMIT_FIELDS: "timeLimitFields",
  REMOVE_ALL_RULES: "removeAllRules",
};

// CSS Classes
export const CSS_CLASSES = {
  HIDDEN: "hidden",
  TAB: {
    SELECTED: {
      ADD: ["border-indigo-500", "text-indigo-600"],
      REMOVE: [
        "border-transparent",
        "text-gray-500",
        "hover:border-gray-300",
        "hover:text-gray-700",
      ],
    },
    UNSELECTED: {
      ADD: ["border-transparent", "text-gray-500", "hover:border-gray-300", "hover:text-gray-700"],
      REMOVE: ["border-indigo-500", "text-indigo-600"],
    },
  },
  EMPTY_STATE: {
    CONTAINER: "text-center py-8 text-gray-500",
    ICON: "w-16 h-16 mx-auto text-gray-400 mb-4",
  },
};

// Events
export const EVENTS = {
  RULES_UPDATED: "rulesUpdated",
  DOM_CONTENT_LOADED: "DOMContentLoaded",
  CHANGE: "change",
  CLICK: "click",
  SUBMIT: "submit",
};

// Default Values
export const DEFAULTS = {
  REDIRECT_URL: "https://www.google.com",
  URL_PREVIEW_LENGTH: 30,
};

// HTML Attributes
export const ATTRIBUTES = {
  ROLE: "role",
  TAB: "tab",
  ARIA_CONTROLS: "aria-controls",
  ARIA_SELECTED: "aria-selected",
};

// Messages
export const MESSAGES = {
  NO_RULES: {
    TITLE: "No rules yet",
    SUBTITLE: "Add your first rule to get started",
  },
  BUTTONS: {
    ADD_RULE: "Add blocking rule",
    UPDATE_RULE: "Update blocking rule",
  },
};
