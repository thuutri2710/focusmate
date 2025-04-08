import { BlockingMode, DayOfWeek } from '../types';

export const DOM_IDS = {
  // Tab IDs
  ADD_RULE_TAB: 'add-rule-tab',
  APPLYING_RULES_TAB: 'applying-rules-tab',
  SETTINGS_TAB: 'settings-tab',
  STATS_TAB: 'stats-tab',
  
  // Content IDs
  ADD_RULE_CONTENT: 'add-rule-content',
  APPLYING_RULES_CONTENT: 'applying-rules-content',
  SETTINGS_CONTENT: 'settings-content',
  STATS_CONTENT: 'stats-content',
  
  // Form IDs
  DOMAIN_INPUT: 'domain-input',
  BLOCKING_MODE_SELECT: 'blocking-mode-select',
  TIME_LIMIT_CONTAINER: 'time-limit-container',
  TIME_LIMIT_HOURS: 'time-limit-hours',
  TIME_LIMIT_MINUTES: 'time-limit-minutes',
  SCHEDULE_CONTAINER: 'schedule-container',
  SCHEDULE_DAYS: 'schedule-days',
  TIME_RANGES_CONTAINER: 'time-ranges-container',
  ADD_TIME_RANGE_BTN: 'add-time-range-btn',
  CUSTOM_MESSAGE_INPUT: 'custom-message-input',
  ADD_RULE_BTN: 'add-rule-btn',
  CANCEL_EDIT_BTN: 'cancel-edit-btn',
  
  // Other elements
  CURRENT_URL: 'current-url',
  ADD_CURRENT_URL_BTN: 'add-current-url-btn',
  ACTIVE_RULES_LIST: 'active-rules-list',
  INACTIVE_RULES_LIST: 'inactive-rules-list',
  TOAST_CONTAINER: 'toast-container',
  MODAL_CONTAINER: 'modal-container',
  STATS_CONTAINER: 'stats-container',
  RESET_STATS_BTN: 'reset-stats-btn'
} as const;

export const EVENTS = {
  DOM_CONTENT_LOADED: 'DOMContentLoaded',
  CLICK: 'click',
  CHANGE: 'change',
  INPUT: 'input',
  SUBMIT: 'submit'
} as const;

export const BLOCKING_MODES = {
  BLOCK: BlockingMode.BLOCK,
  TIME_LIMIT: BlockingMode.TIME_LIMIT,
  SCHEDULE: BlockingMode.SCHEDULE
} as const;

export const TABS = {
  ADD_RULE: 'add-rule-content',
  APPLYING_RULES: 'applying-rules-content',
  RULE_MATCHES: 'rule-matches-content',
  SETTINGS: 'settings-content',
  STATS: 'stats-content'
} as const;

export const DAYS_LIST = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY
] as const;

export const DAY_LABELS = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
  [DayOfWeek.SATURDAY]: 'Saturday',
  [DayOfWeek.SUNDAY]: 'Sunday'
} as const;

export const DEFAULT_SETTINGS = {
  enableNotifications: true,
  darkMode: false,
  resetTime: '00:00',
  defaultBlockMessage: 'This website is blocked by FocusMate to help you stay focused.'
} as const;

export const STORAGE_KEYS = {
  BLOCK_RULES: 'blockRules',
  TIME_USAGE: 'timeUsage',
  LAST_RESET: 'lastReset',
  SETTINGS: 'settings'
} as const;

export const ATTRIBUTES = {
  ROLE: 'role',
  TAB: 'tab',
  ARIA_CONTROLS: 'aria-controls',
  ARIA_SELECTED: 'aria-selected'
} as const;

export const CSS_CLASSES = {
  HIDDEN: 'hidden',
  TAB: {
    SELECTED: {
      ADD: ['bg-blue-500', 'text-white'],
      REMOVE: ['bg-gray-200', 'text-gray-700']
    },
    UNSELECTED: {
      ADD: ['bg-gray-200', 'text-gray-700'],
      REMOVE: ['bg-blue-500', 'text-white']
    }
  }
} as const;

export const MESSAGES = {
  RULE_ADDED: 'Rule added successfully',
  RULE_UPDATED: 'Rule updated successfully',
  RULE_DELETED: 'Rule deleted successfully',
  RULE_VALIDATION_ERROR: 'Please fill in all required fields',
  STATS_RESET: 'Statistics have been reset'
} as const;
