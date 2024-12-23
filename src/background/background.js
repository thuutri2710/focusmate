import { StorageService } from "../services/storage.js";

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
  // Set up new tracking for this tab
  activeTabTimes.set(tabId, {
    url,
    lastUpdate: Date.now(),
  });

  // Create new interval for this tab (check every second)
  activeInterval = setInterval(() => {
    checkTabRules(tabId, url);
  }, 1000);
}

// Function to check rules and update time for a specific tab
async function checkTabRules(tabId, url) {
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
  const currentTimeSpent = await StorageService.getTimeSpentToday(url);
  const newTimeSpent = currentTimeSpent + intervalMs;

  // Store the total accumulated time
  await StorageService.updateTimeUsage(url, newTimeSpent);

  // Update the last update time for next interval
  tabInfo.lastUpdate = now;
  activeTabTimes.set(tabId, tabInfo);

  // Check if URL should be blocked based on current conditions
  const blockedRule = await StorageService.isUrlBlocked(url);
  if (blockedRule) {
    try {
      const currentTab = await chrome.tabs.get(tabId);
      if (currentTab && currentTab.url === url) {
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
  // Clear current tracking regardless of window focus
  await clearCurrentTracking();

  // Only start new tracking if window is focused
  if (!isWindowFocused) {
    return;
  }

  // Start tracking the newly activated tab
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    startTrackingTab(tab.id, tab.url);
  }
});

// Handle tab URL updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // If this is the active tab and window is focused, update tracking
    const activeTab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (activeTab[0]?.id === tabId && isWindowFocused) {
      await clearCurrentTracking();
      startTrackingTab(tabId, changeInfo.url);
    }
  }
});

// Handle tab close
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // If this was the active tab, clear tracking
  if (activeTabTimes.has(tabId)) {
    await clearCurrentTracking();
  }
});

// Clean up when extension is unloaded
chrome.runtime.onSuspend.addListener(async () => {
  await clearCurrentTracking();
});
