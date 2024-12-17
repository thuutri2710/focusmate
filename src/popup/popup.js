import { StorageService } from "../services/storage.js";
import { createRuleElement } from "./components/ruleElement.js";
import { validateRule } from "../utils/validation.js";

// Track current tab URL
let currentTabUrl = '';
let currentRules = [];

// Event dispatcher for rule updates
const ruleUpdateEvent = new Event('rulesUpdated');

document.addEventListener("DOMContentLoaded", async () => {
  // Get current tab URL when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabUrl = tabs[0].url;
      document.getElementById('currentUrl').textContent = currentTabUrl;
    }
  });

  await loadRules();
  setupEventListeners();
});

// Listen for rule updates
document.addEventListener('rulesUpdated', async () => {
  await loadRules();
});

async function loadRules() {
  currentRules = await StorageService.getRules();
  await Promise.all([
    loadActiveRules(),
    loadApplyingRules()
  ]);
}

async function loadActiveRules() {
  const allRulesList = document.getElementById("allRulesList");
  allRulesList.innerHTML = "";

  if (!currentRules || currentRules.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "text-center py-8 text-gray-500";
    emptyState.innerHTML = `
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M12 18a6 6 0 100-12 6 6 0 000 12z" />
      </svg>
      <p>No rules yet</p>
      <p class="text-sm mt-2">Add your first rule to get started</p>
    `;
    allRulesList.appendChild(emptyState);
    return;
  }

  // Load time spent for each rule
  const updatedRules = await Promise.all(
    currentRules.map(async (rule) => {
      const timeSpent = await StorageService.getTimeSpentToday(rule.id);
      return {
        ...rule,
        timeSpentToday: timeSpent
      };
    })
  );

  updatedRules.forEach((rule) => {
    const ruleElement = createRuleElement(rule);
    allRulesList.appendChild(ruleElement);

    // Add click handler for edit button
    const editButton = ruleElement.querySelector(".edit-rule-btn");
    editButton?.addEventListener("click", (e) => {
      e.stopPropagation();

      // Switch to Add Rule tab
      document.getElementById("add-rule-tab").click();

      // Fill form with rule data
      document.getElementById("websiteUrl").value = rule.websiteUrl;
      document.getElementById("redirectUrl").value = rule.redirectUrl || "";
      document.getElementById("blockingMode").value = rule.blockingMode;
      handleBlockingModeChange({ target: { value: rule.blockingMode } });

      // Show/hide appropriate fields based on blocking mode
      if (rule.blockingMode === "timeRange") {
        document.getElementById("startTime").value = rule.startTime;
        document.getElementById("endTime").value = rule.endTime;
      } else {
        document.getElementById("dailyTimeLimit").value = rule.dailyTimeLimit;
      }

      // Store the rule ID for updating
      const form = document.getElementById("blockForm");
      form.dataset.editRuleId = rule.id;

      // Update submit button text
      document.querySelector('#blockForm button[type="submit"]').textContent =
        "Update blocking rule";
    });
  });
}

async function loadApplyingRules() {
  if (!currentTabUrl) return;

  const applyingRulesList = document.getElementById("applyingRulesList");
  applyingRulesList.innerHTML = "";

  // Helper function to convert URL pattern to regex
  const patternToRegex = (pattern) => {
    // Escape special regex characters except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Replace * with regex pattern
    const regexStr = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regexStr}$`);
  };

  // Helper function to get URL parts
  const getUrlParts = (url) => {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        fullUrl: url
      };
    } catch (e) {
      return null;
    }
  };

  const currentUrlParts = getUrlParts(currentTabUrl);
  if (!currentUrlParts) {
    applyingRulesList.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <p>Invalid URL format</p>
      </div>
    `;
    return;
  }

  // Filter rules that apply to current URL
  const applyingRules = currentRules.filter(rule => {
    const rulePattern = rule.websiteUrl;
    
    // Check exact match first
    if (rulePattern === currentTabUrl) return true;

    // Check pattern matches
    if (rulePattern.includes('*')) {
      const regex = patternToRegex(rulePattern);
      if (regex.test(currentTabUrl)) return true;

      // Check if the pattern matches the hostname
      const ruleUrlParts = getUrlParts(rulePattern.replace(/\*/g, 'example.com'));
      if (ruleUrlParts && ruleUrlParts.hostname === currentUrlParts.hostname) return true;
    }

    // Check if current URL starts with the pattern (for partial matches)
    if (currentTabUrl.startsWith(rulePattern.replace(/\*$/, ''))) return true;

    // Check domain-only patterns
    const ruleUrlParts = getUrlParts(rulePattern.replace(/\*/g, 'example.com'));
    if (ruleUrlParts && 
        ruleUrlParts.hostname === currentUrlParts.hostname && 
        (rulePattern.endsWith('/*') || rulePattern.includes('*'))) return true;

    return false;
  });

  if (applyingRules.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "text-center py-8 text-gray-500";
    emptyState.innerHTML = `
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M12 18a6 6 0 100-12 6 6 0 000 12z" />
      </svg>
      <p>No rules apply to this page</p>
      <button id="addRuleForCurrent" class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
        Add rule for this page
      </button>
    `;
    applyingRulesList.appendChild(emptyState);

    // Add click handler for "Add rule" button
    document.getElementById('addRuleForCurrent')?.addEventListener('click', () => {
      document.getElementById('websiteUrl').value = currentTabUrl;
      document.getElementById('add-rule-tab').click();
    });
  } else {
    // Sort rules by specificity (exact matches first, then pattern matches)
    applyingRules.sort((a, b) => {
      const aExact = a.websiteUrl === currentTabUrl;
      const bExact = b.websiteUrl === currentTabUrl;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    // Load time spent for each rule
    const updatedRules = await Promise.all(
      applyingRules.map(async (rule) => {
        const timeSpent = await StorageService.getTimeSpentToday(rule.id);
        return {
          ...rule,
          timeSpentToday: timeSpent,
          matchType: rule.websiteUrl === currentTabUrl ? 'exact' : 'pattern'
        };
      })
    );

    // Create rule elements with updated time spent
    updatedRules.forEach((rule) => {
      const ruleElement = createRuleElement(rule, true);
      
      // Add match type indicator
      if (rule.matchType === 'pattern') {
        const matchIndicator = document.createElement('div');
        matchIndicator.className = 'text-xs text-gray-500 mt-2 flex items-center gap-1';
        matchIndicator.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Pattern match
        `;
        ruleElement.querySelector('.space-y-2')?.appendChild(matchIndicator);
      }
      
      applyingRulesList.appendChild(ruleElement);
    });
  }
}

function setupEventListeners() {
  const tabButtons = document.querySelectorAll(".tab-button");

  // Handle tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", handleTabSwitch);
  });

  // Handle blocking mode changes
  document.querySelectorAll('input[name="blockingMode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const timeRangeFields = document.getElementById("timeRangeFields");
      const dailyLimitFields = document.getElementById("dailyLimitFields");

      if (e.target.value === "timeRange") {
        timeRangeFields.classList.remove("hidden");
        dailyLimitFields.classList.add("hidden");
      } else {
        timeRangeFields.classList.add("hidden");
        dailyLimitFields.classList.remove("hidden");
      }
    });
  });

  // Handle form submission
  document.getElementById("blockForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const websiteUrl = form.websiteUrl.value.trim();
    const redirectUrl = form.redirectUrl.value.trim();
    const blockingMode = form.blockingMode.value;

    const rule = {
      id: form.dataset.editRuleId || Date.now().toString(),
      websiteUrl,
      redirectUrl,
      blockingMode,
    };

    if (blockingMode === "timeRange") {
      rule.startTime = form.startTime.value;
      rule.endTime = form.endTime.value;
    } else {
      rule.dailyTimeLimit = parseInt(form.dailyTimeLimit.value);
    }

    if (form.dataset.editRuleId) {
      await updateRule(form.dataset.editRuleId, rule);
    } else {
      await addRule(rule);
    }

    // Reset form and switch to All Rules tab if we were editing
    if (form.dataset.editRuleId) {
      form.dataset.editRuleId = "";
      document.getElementById("active-rules-tab").click();
    }

    e.target.reset();

    // Reset submit button text
    document.querySelector('#blockForm button[type="submit"]').textContent = "Add blocking rule";

    // Reset to default time range mode
    handleBlockingModeChange({ target: { value: "timeRange" } });
  });
}

function handleTabSwitch(e) {
  e.preventDefault();

  // Remove active classes from all tabs and content
  document.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.remove("active", "border-blue-500", "text-blue-600");
    tab.classList.add("border-transparent", "text-gray-500");
  });

  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.add("hidden");
  });

  // Add active classes to clicked tab
  const button = e.currentTarget;
  const tabId = button.getAttribute("data-tab");

  button.classList.remove("border-transparent", "text-gray-500");
  button.classList.add("active", "border-blue-500", "text-blue-600");

  // Show selected content
  const tabContent = document.getElementById(tabId);
  tabContent.classList.remove("hidden");

  // Refresh the active rules list if switching to that tab
  if (tabId === "active-rules-content") {
    loadActiveRules();
  }
}

function handleBlockingModeChange(e) {
  const timeRangeInputs = document.getElementById("timeRangeInputs");
  const dailyLimitInputs = document.getElementById("dailyLimitInputs");

  if (e.target.value === "timeRange") {
    timeRangeInputs.classList.remove("hidden");
    dailyLimitInputs.classList.add("hidden");
    // Clear daily limit input
    document.getElementById("dailyTimeLimit").value = "";
  } else {
    timeRangeInputs.classList.add("hidden");
    dailyLimitInputs.classList.remove("hidden");
    // Clear time range inputs
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
  }
}

// Update both rule lists after changes
async function updateRuleLists() {
  document.dispatchEvent(ruleUpdateEvent);
}

// Modify rule deletion to update both lists
async function deleteRule(ruleId) {
  await StorageService.deleteRule(ruleId);
  await updateRuleLists();
}

// Modify rule addition to update both lists
async function addRule(rule) {
  await StorageService.addRule(rule);
  await updateRuleLists();
}

// Modify rule update to update both lists
async function updateRule(ruleId, updatedRule) {
  await StorageService.updateRule(ruleId, updatedRule);
  await updateRuleLists();
}

// Handle removing all rules
document.getElementById("removeAllRules").addEventListener("click", async () => {
  await StorageService.clearAllRules();
  await updateRuleLists();
});
