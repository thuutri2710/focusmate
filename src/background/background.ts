import { StorageService } from "../services/storage";
import { extractDomain } from "../utils/urlUtils";
import { isWithinSchedule } from "../utils/scheduleUtils";

// Types for message passing
enum MessageType {
  BLOCK_PAGE = 'BLOCK_PAGE',
  CHECK_CURRENT_URL = 'CHECK_CURRENT_URL',
  CLOSE_CURRENT_TAB = 'CLOSE_CURRENT_TAB',
  CONTENT_SCRIPT_READY = 'CONTENT_SCRIPT_READY',
  CHECK_URL = 'CHECK_URL',
  UPDATE_RULES = 'UPDATE_RULES',
  GET_MATCHED_RULES = 'GET_MATCHED_RULES',
  GET_TIME_SPENT = 'GET_TIME_SPENT',
  RESET_STATS = 'RESET_STATS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  RULE_MATCHED = 'RULE_MATCHED'
}

interface BlockRule {
  id: string;
  domain: string;
  mode: 'block' | 'time_limit' | 'schedule';
  timeLimit?: number;
  schedule?: {
    timeRanges: { start: string; end: string; }[];
    days: string[];
  };
}

interface ChromeMessage {
  type: MessageType;
  payload?: any;
}

interface ChromeMessageResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// Track matched rules for UI indicator
interface MatchedRule {
  url: string;
  rule: BlockRule;
  matchTime: number;
  matchReason: string;
}

// Store last 10 matched rules
const matchedRules: MatchedRule[] = [];

// Track active tabs and their start times
interface TabInfo {
  url: string;
  lastUpdate: number;
}

const activeTabTimes = new Map<number, TabInfo>();
// Track interval for active tab (only one tab can be active at a time)
let activeInterval: number | null = null;
// Track if window is focused
let isWindowFocused = true;

// Function to clear current interval and tracking
async function clearCurrentTracking(): Promise<void> {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  // Update final time for the active tab
  for (const [_, tabInfo] of activeTabTimes.entries()) {
    const now = Date.now();
    const elapsedTime = now - tabInfo.lastUpdate;
    
    // Only count time if it's reasonable (less than 30 seconds)
    // This prevents counting huge chunks if the browser was suspended or computer was asleep
    const timeToAdd = elapsedTime > 30000 ? 1000 : elapsedTime;
    
    const currentTimeSpent = await StorageService.getTimeSpentToday(tabInfo.url);
    await StorageService.updateTimeUsage(tabInfo.url, currentTimeSpent + timeToAdd);
  }

  activeTabTimes.clear();
}

// Function to start tracking a tab
function startTrackingTab(tabId: number, url: string): void {
  // Extract domain from URL
  const domain = extractDomain(url);

  // Set up new tracking for this tab
  activeTabTimes.set(tabId, {
    url: domain, // Store domain instead of full URL
    lastUpdate: Date.now(),
  });

  // start checking rules for this tab immediately
  checkTabRules(tabId, domain);

  // Create new interval for this tab (check every second)
  activeInterval = setInterval(() => {
    checkTabRules(tabId, domain);
  }, 1000);
}

// Function to check rules and update time for a specific tab
async function checkTabRules(tabId: number, domain: string): Promise<void> {
  // Only count time if window is focused
  if (!isWindowFocused) {
    return;
  }

  // Get tab info
  const tabInfo = activeTabTimes.get(tabId);
  if (!tabInfo) return;

  try {
    // Calculate time spent since last update
    const now = Date.now();
    const elapsedTime = now - tabInfo.lastUpdate;
    
    // Only count time if it's reasonable (less than 30 seconds)
    // This prevents counting huge chunks if the browser was suspended or computer was asleep
    const timeToAdd = elapsedTime > 30000 ? 1000 : elapsedTime;

    // Get current time spent for this domain today
    const currentTimeSpent = await StorageService.getTimeSpentToday(domain);
    const newTimeSpent = currentTimeSpent + timeToAdd;

    // Update time usage
    await StorageService.updateTimeUsage(domain, newTimeSpent);

    // Always update the last update time after checking
    tabInfo.lastUpdate = now;
    activeTabTimes.set(tabId, tabInfo);
  } catch (error) {
    console.error('Error updating time usage:', error);
  }

  // Check if this domain should be blocked
  const { blocked, rule } = await StorageService.checkUrlAgainstRules(domain);
  const currentTimeSpent = await StorageService.getTimeSpentToday(domain);

  if (blocked && rule) {
    // Handle different blocking modes
    switch (rule.mode) {
      case "block":
        // Always block
        blockTab(tabId, rule);
        break;
      case "time_limit":
        // Block if time limit exceeded
        if (rule.timeLimit && currentTimeSpent > rule.timeLimit) {
          blockTab(tabId, rule);
        }
        break;
      case "schedule":
        // Block if current time is within schedule
        if (rule.schedule && isWithinSchedule(rule.schedule)) {
          blockTab(tabId, rule);
        }
        break;
    }
  }
}

// Function to check if current time is within schedule is now imported from scheduleUtils

// Function to block a tab using content script overlay
function blockTab(tabId: number, rule: BlockRule): void {
  try {
    // Determine the reason for blocking based on the rule mode
    let reason = "Domain matched blocking rule";
    switch (rule.mode) {
      case "block":
        reason = "Always block mode";
        break;
      case "time_limit":
        reason = "Time limit exceeded";
        break;
      case "schedule":
        reason = "Within scheduled block time";
        break;
    }

    // Send message to content script to show overlay
    chrome.tabs.sendMessage(tabId, {
      type: MessageType.BLOCK_PAGE,
      payload: { rule, reason }
    });
  } catch (error) {
    console.error('Error blocking tab:', error);
  }
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Clear current tracking
  await clearCurrentTracking();

  // Get tab info
  const tab = await chrome.tabs.get(activeInfo.tabId);

  // Start tracking new tab if it has a URL
  if (tab.url && tab.url.startsWith("http")) {
    startTrackingTab(activeInfo.tabId, tab.url);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only care about URL changes on the active tab
  if (changeInfo.url && tab.active) {
    // Clear current tracking
    clearCurrentTracking().then(() => {
      // Start tracking new URL if it's http/https
      if (changeInfo.url && changeInfo.url.startsWith("http")) {
        startTrackingTab(tabId, changeInfo.url);
      }
    });
  }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
});

// Function to add a matched rule to the history
function addMatchedRule(url: string, rule: BlockRule, matchReason: string): void {
  // Add to the beginning of the array
  matchedRules.unshift({
    url,
    rule,
    matchTime: Date.now(),
    matchReason
  });
  
  // Keep only the last 10 matches
  if (matchedRules.length > 10) {
    matchedRules.pop();
  }
  
  // Send update to any open popups
  chrome.runtime.sendMessage({
    type: MessageType.RULE_MATCHED,
    payload: { matchedRules }
  }).catch(() => {
    // Ignore errors if no listeners
  });
}

// Function to check if a URL should be blocked based on all rules
async function shouldBlockUrl(url: string): Promise<{ blocked: boolean; rule: BlockRule | null; reason: string }> {
  const domain = extractDomain(url);
  const { blocked, rule } = await StorageService.checkUrlAgainstRules(domain);
  
  if (blocked && rule) {
    let reason = "Domain matched";
    let shouldBlock = false;
    
    // Check specific blocking conditions based on mode
    switch (rule.mode) {
      case "block":
        // Always block
        shouldBlock = true;
        reason = "Always block mode";
        break;
        
      case "time_limit":
        // Block if time limit exceeded
        if (rule.timeLimit) {
          const currentTimeSpent = await StorageService.getTimeSpentToday(domain);
          if (currentTimeSpent > rule.timeLimit) {
            shouldBlock = true;
            const minutes = Math.floor(rule.timeLimit / 60000);
            reason = `Time limit (${minutes} min) exceeded`;
          } else {
            reason = `Under time limit (${Math.floor(currentTimeSpent/1000)}/${Math.floor(rule.timeLimit/1000)} sec)`;
          }
        }
        break;
        
      case "schedule":
        // Block if current time is within schedule
        if (rule.schedule && isWithinSchedule(rule.schedule)) {
          shouldBlock = true;
          reason = "Within scheduled block time";
        } else {
          reason = "Outside scheduled block time";
        }
        break;
    }
    
    if (shouldBlock) {
      return { blocked: true, rule, reason };
    }
    
    return { blocked: false, rule, reason };
  }
  
  return { blocked: false, rule: null, reason: "No matching rule" };
}

// Set up webNavigation listener for blocking
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigations (not iframes, etc)
  if (details.frameId !== 0) return;
  
  // Check if this URL should be blocked
  const { blocked, rule, reason } = await shouldBlockUrl(details.url);
  
  if (blocked && rule) {
    // Add to matched rules history
    addMatchedRule(details.url, rule, reason);
    
    // Send message to content script to show overlay
    // We need to wait for the page to load before sending the message
    // So we'll set up a listener for the completed navigation
    chrome.webNavigation.onCompleted.addListener(function onComplete(completedDetails) {
      if (completedDetails.tabId === details.tabId && completedDetails.frameId === 0) {
        // Remove this one-time listener
        chrome.webNavigation.onCompleted.removeListener(onComplete);
        
        // Send message to content script
        chrome.tabs.sendMessage(details.tabId, {
          type: MessageType.BLOCK_PAGE,
          payload: { rule, reason }
        });
      }
    });
  } else if (rule) {
    // Rule matched but not blocked (e.g., under time limit)
    addMatchedRule(details.url, rule, reason);
  }
});

// Track which tabs have content scripts ready
const contentScriptTabs = new Set<number>();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (message: ChromeMessage, sender, sendResponse: (response: ChromeMessageResponse) => void) => {
    // Handle content script ready message
    if (message.type === MessageType.CONTENT_SCRIPT_READY && sender.tab?.id) {
      contentScriptTabs.add(sender.tab.id);
      sendResponse({ success: true });
      return true;
    }
    const handleMessage = async () => {
      try {
        switch (message.type) {
          case MessageType.CHECK_URL:
            const url = message.payload?.url;
            if (!url) {
              return { success: false, error: "No URL provided" };
            }
            const result = await StorageService.checkUrlAgainstRules(url);
            return { success: true, data: result };
            
          case MessageType.CHECK_CURRENT_URL:
            const currentUrl = message.payload?.url;
            if (!currentUrl) {
              return { success: false, error: "No URL provided" };
            }
            const { blocked, rule, reason } = await shouldBlockUrl(currentUrl);
            return { success: true, data: { blocked, rule, reason } };

          case MessageType.UPDATE_RULES:
            // Force refresh of rules cache
            await StorageService.getAllRules();
            return { success: true };
            
          case MessageType.GET_MATCHED_RULES:
            return { success: true, data: matchedRules };

          case MessageType.GET_TIME_SPENT:
            const domain = message.payload?.domain;
            if (!domain) {
              return { success: false, error: "No domain provided" };
            }
            const timeSpent = await StorageService.getTimeSpentToday(domain);
            return { success: true, data: timeSpent };

          case MessageType.RESET_STATS:
            await StorageService.resetTimeUsage();
            return { success: true };

          case MessageType.UPDATE_SETTINGS:
            const settings = message.payload?.settings;
            if (!settings) {
              return { success: false, error: "No settings provided" };
            }
            const updatedSettings = await StorageService.updateSettings(settings);
            return { success: true, data: updatedSettings };
            
          case MessageType.CLOSE_CURRENT_TAB:
            // Get the sender tab ID and close it
            if (sender.tab?.id) {
              chrome.tabs.remove(sender.tab.id);
              return { success: true };
            }
            return { success: false, error: "Could not determine tab ID" };

          default:
            return { success: false, error: "Unknown message type" };
        }
      } catch (error) {
        console.error("Error handling message:", error);
        return { success: false, error: String(error) };
      }
    };

    // Handle async response
    handleMessage().then(sendResponse);
    return true; // Indicate async response
  }
);

// Check for daily reset on startup
(async () => {
  const settings = await StorageService.getSettings();
  const lastReset = await StorageService.getLastResetTime();

  // Check if we need to reset stats
  const now = new Date();
  const lastResetDate = new Date(lastReset);

  // Parse reset time
  const [hours, minutes] = settings.resetTime.split(":").map(Number);
  const resetDate = new Date(now);
  resetDate.setHours(hours, minutes, 0, 0);

  // If current time is before reset time, use previous day's reset time
  if (now < resetDate) {
    resetDate.setDate(resetDate.getDate() - 1);
  }

  // Check if last reset was before the reset time
  if (!lastReset || lastResetDate < resetDate) {
    await StorageService.resetTimeUsage();
  }
})();
