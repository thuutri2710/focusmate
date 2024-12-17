import { StorageService } from "../services/storage.js";
import { createRuleElement } from "./components/ruleElement.js";
import { validateRule } from "../utils/validation.js";
import { DOM_IDS, EVENTS, BLOCKING_MODES } from "../constants/index.js";
import { TEMPLATES } from "../constants/templates.js";

// Track current tab URL
let currentTabUrl = "";
let currentRules = [];

// Track if we're coming from edit button click
let isEditButtonClick = false;

document.addEventListener(EVENTS.DOM_CONTENT_LOADED, async () => {
  // Get current tab URL when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabUrl = tabs[0].url;
      document.getElementById(DOM_IDS.CURRENT_URL).textContent = currentTabUrl;
    }
  });

  await loadRules();
  setupEventListeners();
});

// Load all rules and update the UI
export async function loadRules() {
  currentRules = await StorageService.getRules();
  await Promise.all([loadActiveRules(), loadApplyingRules()]);
}

async function loadActiveRules() {
  const allRulesList = document.getElementById(DOM_IDS.ALL_RULES_LIST);
  allRulesList.innerHTML = "";

  if (!currentRules || currentRules.length === 0) {
    allRulesList.innerHTML = TEMPLATES.EMPTY_STATE.NO_RULES;
    return;
  }

  // Load time spent for each rule
  const updatedRules = await Promise.all(
    currentRules.map(async (rule) => {
      const timeSpent = await StorageService.getTimeSpentToday(rule.id);
      return {
        ...rule,
        timeSpentToday: timeSpent,
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
      isEditButtonClick = true;

      // Fill form with rule data first
      document.getElementById(DOM_IDS.WEBSITE_URL).value = rule.websiteUrl;
      document.getElementById(DOM_IDS.REDIRECT_URL).value = rule.redirectUrl || "";

      // Set blocking mode radio button and trigger change event
      const radioButton = document.querySelector(
        `input[name="blockingModeRadio"][value="${rule.blockingMode}"]`
      );
      console.log(radioButton, rule);
      if (radioButton) {
        radioButton.checked = true;
        // Create and dispatch a change event
        const changeEvent = new Event("change", { bubbles: true });
        radioButton.dispatchEvent(changeEvent);
      }

      // Set the appropriate fields based on blocking mode
      if (rule.blockingMode === BLOCKING_MODES.TIME_RANGE) {
        document.getElementById(DOM_IDS.START_TIME).value = rule.startTime;
        document.getElementById(DOM_IDS.END_TIME).value = rule.endTime;
      } else {
        document.getElementById(DOM_IDS.DAILY_TIME_LIMIT).value = rule.dailyTimeLimit;
      }

      // Store the rule ID for updating
      const form = document.getElementById(DOM_IDS.BLOCK_FORM);
      form.dataset.editRuleId = rule.id;

      // Update submit button text
      document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent =
        "Update blocking rule";

      // Switch to Add Rule tab last
      document.getElementById(DOM_IDS.ADD_RULE_TAB).click();

      // Reset the flag after a short delay to handle any subsequent tab switches
      setTimeout(() => {
        isEditButtonClick = false;
      }, 100);
    });
  });
}

async function loadApplyingRules() {
  if (!currentTabUrl) return;

  const applyingRulesList = document.getElementById(DOM_IDS.APPLYING_RULES_LIST);
  applyingRulesList.innerHTML = "";

  // Helper function to convert URL pattern to regex
  const patternToRegex = (pattern) => {
    // Escape special regex characters except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    // Replace * with regex pattern
    const regexStr = escaped.replace(/\*/g, ".*");
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
        fullUrl: url,
      };
    } catch (e) {
      return null;
    }
  };

  const currentUrlParts = getUrlParts(currentTabUrl);
  if (!currentUrlParts) {
    applyingRulesList.innerHTML = TEMPLATES.EMPTY_STATE.INVALID_URL;
    return;
  }

  // Filter rules that apply to current URL
  const applyingRules = currentRules.filter((rule) => {
    const rulePattern = rule.websiteUrl;

    // Check exact match first
    if (rulePattern === currentTabUrl) return true;

    // Check pattern matches
    if (rulePattern.includes("*")) {
      const regex = patternToRegex(rulePattern);
      if (regex.test(currentTabUrl)) return true;

      // Check if the pattern matches the hostname
      const ruleUrlParts = getUrlParts(rulePattern.replace(/\*/g, "example.com"));
      if (ruleUrlParts && ruleUrlParts.hostname === currentUrlParts.hostname) return true;
    }

    // Check if current URL starts with the pattern (for partial matches)
    if (currentTabUrl.startsWith(rulePattern.replace(/\*$/, ""))) return true;

    // Check domain-only patterns
    const ruleUrlParts = getUrlParts(rulePattern.replace(/\*/g, "example.com"));
    if (
      ruleUrlParts &&
      ruleUrlParts.hostname === currentUrlParts.hostname &&
      (rulePattern.endsWith("/*") || rulePattern.includes("*"))
    )
      return true;

    return false;
  });

  if (applyingRules.length === 0) {
    applyingRulesList.innerHTML = TEMPLATES.EMPTY_STATE.NO_APPLYING_RULES;

    // Add click handler for "Add rule" button
    document.getElementById("addRuleForCurrent")?.addEventListener("click", () => {
      document.getElementById(DOM_IDS.WEBSITE_URL).value = currentTabUrl;
      document.getElementById(DOM_IDS.ADD_RULE_TAB).click();
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
          matchType: rule.websiteUrl === currentTabUrl ? "exact" : "pattern",
        };
      })
    );

    // Create rule elements with updated time spent
    updatedRules.forEach((rule) => {
      const ruleElement = createRuleElement(rule, true);

      // Add match type indicator
      if (rule.matchType === "pattern") {
        const container = ruleElement.querySelector(".space-y-2");
        if (container) {
          container.insertAdjacentHTML("beforeend", TEMPLATES.PATTERN_MATCH_INDICATOR);
        }
      }

      applyingRulesList.appendChild(ruleElement);
    });
  }
}

function setupEventListeners() {
  const tabButtons = document.querySelectorAll(".tab-button");

  // Handle tab switching
  tabButtons.forEach((button) => {
    button.addEventListener(EVENTS.CLICK, handleTabSwitch);
  });

  // Handle blocking mode changes
  document.querySelectorAll('input[name="blockingModeRadio"]').forEach((radio) => {
    radio.addEventListener(EVENTS.CHANGE, (e) => {
      const timeRangeFields = document.getElementById(DOM_IDS.TIME_RANGE_FIELDS);
      const timeLimitFields = document.getElementById(DOM_IDS.TIME_LIMIT_FIELDS);

      // Update the blockingMode container's value
      document.getElementById(DOM_IDS.BLOCKING_MODE).setAttribute("value", e.target.value);

      if (e.target.value === BLOCKING_MODES.TIME_RANGE) {
        timeRangeFields.classList.remove("hidden");
        timeLimitFields.classList.add("hidden");
      } else {
        timeRangeFields.classList.add("hidden");
        timeLimitFields.classList.remove("hidden");
      }
    });
  });

  // Handle form submission
  document.getElementById(DOM_IDS.BLOCK_FORM).addEventListener(EVENTS.SUBMIT, async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    const form = e.target;
    const websiteUrl = form.websiteUrl.value.trim();
    const redirectUrl = form.redirectUrl.value.trim();
    const blockingModeRadio = document.querySelector('input[name="blockingModeRadio"]:checked');

    if (!blockingModeRadio) {
      console.error("No blocking mode selected");
      return;
    }

    const blockingMode = blockingModeRadio.value;
    console.log("Form values:", { websiteUrl, redirectUrl, blockingMode });

    const rule = {
      id: form.dataset.editRuleId || Date.now().toString(),
      websiteUrl,
      redirectUrl,
      blockingMode,
    };

    if (blockingMode === BLOCKING_MODES.TIME_RANGE) {
      rule.startTime = form.startTime.value;
      rule.endTime = form.endTime.value;
    } else {
      rule.dailyTimeLimit = parseInt(form.dailyTimeLimit.value);
    }

    console.log("Rule to save:", rule);

    try {
      // Validate rule before saving
      const validationResult = validateRule(rule);
      if (!validationResult.isValid) {
        console.error("Validation failed:", validationResult.errors);
        // Display validation errors to user
        const errorMessages = validationResult.errors.join("\n");
        alert(errorMessages);
        return;
      }

      if (form.dataset.editRuleId) {
        await StorageService.saveRule(rule);
        console.log("Rule updated");
      } else {
        await StorageService.saveRule(rule);
        console.log("Rule added");
      }

      // Reset form and switch to All Rules tab if we were editing
      if (form.dataset.editRuleId) {
        form.dataset.editRuleId = "";
        document.getElementById(DOM_IDS.ACTIVE_RULES_TAB).click();
        form.reset();
        document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent =
          "Add blocking rule";
      } else {
        // Also reset form after adding a new rule
        form.reset();
        document.getElementById(DOM_IDS.ACTIVE_RULES_TAB).click();
      }

      await updateRuleLists();
    } catch (error) {
      console.error("Error saving rule:", error);
      alert("Failed to save rule: " + error.message);
    }
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

  // Reset form when switching to Active Rules tab or Add Rule tab (unless coming from edit button)
  if (
    tabId === DOM_IDS.ACTIVE_RULES_CONTENT ||
    (tabId === DOM_IDS.ADD_RULE_CONTENT && !isEditButtonClick)
  ) {
    const form = document.getElementById(DOM_IDS.BLOCK_FORM);
    form.reset();
    form.dataset.editRuleId = "";

    // Reset radio button to Time Range and show/hide appropriate fields
    const timeRangeRadio = document.querySelector(
      'input[name="blockingModeRadio"][value="timeRange"]'
    );
    if (timeRangeRadio) {
      timeRangeRadio.checked = true;
      document.getElementById(DOM_IDS.TIME_RANGE_FIELDS).classList.remove("hidden");
      document.getElementById(DOM_IDS.TIME_LIMIT_FIELDS).classList.add("hidden");
    }

    // Reset submit button text
    document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent =
      "Add blocking rule";
  }

  // Load active rules if switching to that tab
  if (tabId === DOM_IDS.ACTIVE_RULES_CONTENT) {
    loadActiveRules();
  }
}

// Update both rule lists after changes
async function updateRuleLists() {
  await loadRules();
}

// Handle removing all rules
document.getElementById(DOM_IDS.REMOVE_ALL_RULES).addEventListener(EVENTS.CLICK, async () => {
  await StorageService.clearAllRules();
  await updateRuleLists();
});
