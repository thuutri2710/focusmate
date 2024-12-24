import { StorageService } from "../services/storage.js";
import { extractDomain } from "../utils/urlUtils.js";

// Track active tabs and their start times
const activeTabTimes = new Map();
// Track interval for active tab (only one tab can be active at a time)
let activeInterval = null;
// Track if window is focused
let isWindowFocused = true;

// Function to clear current interval and tracking
async function clearCurrentTracking() {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }

  // Update final time for the active tab
  for (const [tabId, tabInfo] of activeTabTimes.entries()) {
    const finalInterval = Date.now() - tabInfo.lastUpdate;
    const currentTimeSpent = await StorageService.getTimeSpentToday(tabInfo.url);
    await StorageService.updateTimeUsage(tabInfo.url, currentTimeSpent + finalInterval);
  }

  activeTabTimes.clear();
}

// Function to start tracking a tab
function startTrackingTab(tabId, url) {
  // Extract domain from URL
  const domain = extractDomain(url);

  // Set up new tracking for this tab
  activeTabTimes.set(tabId, {
    url: domain, // Store domain instead of full URL
    lastUpdate: Date.now(),
  });

  checkTabRules(tabId, domain);

  // Create new interval for this tab (check every second)
  activeInterval = setInterval(() => {
    checkTabRules(tabId, domain);
  }, 1000);
}

// Function to check rules and update time for a specific tab
async function checkTabRules(tabId, domain) {
  // Only count time if window is focused
  if (!isWindowFocused) {
    return;
  }

  const tabInfo = activeTabTimes.get(tabId);
  if (!tabInfo) {
    return;
  }

  const now = Date.now();
  // Calculate time spent in milliseconds since last check
  const intervalMs = now - tabInfo.lastUpdate;

  // Get current accumulated time and add the new interval
  const currentTimeSpent = await StorageService.getTimeSpentToday(domain);
  const newTimeSpent = currentTimeSpent + intervalMs;

  // Store the total accumulated time
  await StorageService.updateTimeUsage(domain, newTimeSpent);

  // Update the last update time for next interval
  tabInfo.lastUpdate = now;
  activeTabTimes.set(tabId, tabInfo);

  // Check if URL should be blocked based on current conditions
  const blockedRule = await StorageService.isUrlBlocked(domain);
  if (blockedRule) {
    try {
      const currentTab = await chrome.tabs.get(tabId);
      if (currentTab && currentTab.url.includes(domain)) {
        chrome.tabs.update(tabId, {
          url: blockedRule.redirectUrl || "https://www.google.com",
        });
        // Clean up tracking
        await clearCurrentTracking();
      }
    } catch (error) {
      await clearCurrentTracking();
    }
  }
}

// Handle window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    isWindowFocused = false;
    await clearCurrentTracking();
  } else {
    isWindowFocused = true;
    // Start tracking the currently active tab in the focused window
    const tabs = await chrome.tabs.query({ active: true, windowId });

    if (tabs[0]?.url) {
      startTrackingTab(tabs[0].id, tabs[0].url);
    }
  }
});

// Handle when a tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Get the new active tab's info
  const newTab = await chrome.tabs.get(activeInfo.tabId);

  // Update final time for previous tab and clear interval
  await clearCurrentTracking();

  // Only start new tracking if window is focused and tab has a URL
  if (isWindowFocused && newTab.url) {
    startTrackingTab(newTab.id, newTab.url);
  }
});

// Handle tab URL updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only care about URL changes
  if (!changeInfo.url) return;

  // Check if this is the active tab
  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const isActiveTab = activeTabs[0]?.id === tabId;

  // If this is the active tab and window is focused, update tracking
  if (isActiveTab && isWindowFocused) {
    await clearCurrentTracking();
    startTrackingTab(tabId, changeInfo.url);
  }
});

// Handle tab close
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // Only clear tracking if this was the tracked tab
  if (activeTabTimes.has(tabId)) {
    await clearCurrentTracking();

    // If window is still focused, start tracking the new active tab
    if (isWindowFocused) {
      const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTabs[0]?.url) {
        startTrackingTab(activeTabs[0].id, activeTabs[0].url);
      }
    }
  }
});

// Clean up when extension is unloaded
chrome.runtime.onSuspend.addListener(async () => {
  await clearCurrentTracking();
});
