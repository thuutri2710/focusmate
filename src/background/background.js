import { StorageService } from "../services/storage.js";

// Track active tabs and their start times
const activeTabTimes = new Map();

// Track the current date for cleanup
let currentDate = new Date().toLocaleDateString();

// Function to check and run cleanup if it's a new day
async function checkAndCleanup() {
  const now = new Date();
  const todayDate = now.toLocaleDateString();
  
  if (todayDate !== currentDate) {
    // It's a new day, run cleanup
    await StorageService.cleanupOldTimeUsage();
    currentDate = todayDate;
  }
}

// Add periodic time check
chrome.alarms.create("checkTimeLimit", {
  periodInMinutes: 1,
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkTimeLimit") {
    // Check for new day first
    await checkAndCleanup();
    
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      if (tab.url) {
        const url = new URL(tab.url);
        const urlPath = url.origin + url.pathname;
        const blockedRule = await StorageService.isUrlBlocked(urlPath);
        if (blockedRule) {
          chrome.tabs.update(tab.id, {
            url: blockedRule.redirectUrl || "https://www.google.com",
          });
        }
      }
    }
  }
});

// Track when a tab becomes active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Update time for previously active tab
  const tabs = await chrome.tabs.query({ active: true });
  for (const tab of tabs) {
    if (tab.id !== activeInfo.tabId) {
      await updateTabTime(tab.id);
    }
  }

  // Start tracking new active tab
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    const url = new URL(tab.url);
    const urlPath = url.origin + url.pathname;
    activeTabTimes.set(activeInfo.tabId, {
      url: urlPath,
      startTime: Date.now(),
    });
  }
});

// Track when a tab's URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // Update time for the old URL
    await updateTabTime(tabId);

    // Start tracking the new URL
    const url = new URL(changeInfo.url);
    const urlPath = url.origin + url.pathname;
    activeTabTimes.set(tabId, {
      url: urlPath,
      startTime: Date.now(),
    });
  }
});

// Track when window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus, update all active tabs
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      await updateTabTime(tab.id);
    }
  } else {
    // Window gained focus, start tracking active tab
    const tabs = await chrome.tabs.query({ active: true, windowId });
    for (const tab of tabs) {
      const url = new URL(tab.url);
      const urlPath = url.origin + url.pathname;
      activeTabTimes.set(tab.id, {
        url: urlPath,
        startTime: Date.now(),
      });
    }
  }
});

// Track when a tab becomes inactive or is closed
async function updateTabTime(tabId) {
  const tabInfo = activeTabTimes.get(tabId);
  if (tabInfo) {
    const timeSpent = (Date.now() - tabInfo.startTime) / 1000 / 60; // Convert to minutes
    await StorageService.updateTimeUsage(tabInfo.url, timeSpent);

    // Check if URL should be blocked after updating time
    const blockedRule = await StorageService.isUrlBlocked(tabInfo.url);
    if (blockedRule) {
      chrome.tabs.update(tabId, {
        url: blockedRule.redirectUrl || "https://www.google.com",
      });
    }

    activeTabTimes.delete(tabId);
  }
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await updateTabTime(tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const url = new URL(details.url);
  const urlPath = url.origin + url.pathname;

  // Update time spent before checking if URL should be blocked
  await updateTabTime(details.tabId);

  const blockedRule = await StorageService.isUrlBlocked(urlPath);

  if (blockedRule) {
    chrome.tabs.update(details.tabId, {
      url: blockedRule.redirectUrl || "https://www.google.com",
    });
  }
});
