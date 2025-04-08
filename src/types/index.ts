// Core Types for the FocusMate Extension

export enum BlockingMode {
  BLOCK = 'block',
  TIME_LIMIT = 'time_limit',
  SCHEDULE = 'schedule'
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export interface TimeRange {
  start: string; // Format: "HH:MM"
  end: string;   // Format: "HH:MM"
}

export interface ScheduleRule {
  days: DayOfWeek[];
  timeRanges: TimeRange[];
}

export interface BlockRule {
  id: string;
  domain: string;
  mode: BlockingMode;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  // For TIME_LIMIT mode
  timeLimit?: number; // in milliseconds
  // For SCHEDULE mode
  schedule?: ScheduleRule;
  // Optional custom message
  customMessage?: string;
}

export interface TimeUsage {
  [domain: string]: number; // Domain to time spent in milliseconds
}

export interface ExtensionStorage {
  blockRules: BlockRule[];
  timeUsage: TimeUsage;
  lastReset: number; // Timestamp of last daily reset
  settings: ExtensionSettings;
}

export interface ExtensionSettings {
  enableNotifications: boolean;
  darkMode: boolean;
  resetTime: string; // Format: "HH:MM"
  defaultBlockMessage: string;
}

// Chrome Message Types
export enum MessageType {
  CHECK_URL = 'check_url',
  UPDATE_RULES = 'update_rules',
  GET_TIME_SPENT = 'get_time_spent',
  RESET_STATS = 'reset_stats',
  UPDATE_SETTINGS = 'update_settings',
  RULE_MATCHED = 'rule_matched',
  GET_MATCHED_RULES = 'get_matched_rules',
  BLOCK_PAGE = 'block_page',
  CHECK_CURRENT_URL = 'check_current_url',
  CLOSE_CURRENT_TAB = 'close_current_tab'
}

export interface ChromeMessage {
  type: MessageType;
  payload?: any;
}

export interface ChromeMessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// UI Component Props Types
export interface TabProps {
  id: string;
  label: string;
  active: boolean;
  onClick: (id: string) => void;
}

export interface RuleItemProps {
  rule: BlockRule;
  onEdit: (rule: BlockRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

export interface RuleFormProps {
  initialRule?: Partial<BlockRule>;
  onSubmit: (rule: Omit<BlockRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface StatsProps {
  timeUsage: TimeUsage;
  blockRules: BlockRule[];
}
