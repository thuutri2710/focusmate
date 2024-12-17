import { StorageService } from "../services/storage.js";
import { createRuleElement } from "./components/ruleElement.js";
import { validateRule } from "../utils/validation.js";
import { DOM_IDS, EVENTS, BLOCKING_MODES, TABS } from "../constants/index.js";
import { TEMPLATES } from "../constants/templates.js";
import { showErrorToast } from "../utils/uiUtils.js";
import { Analytics } from "../services/analytics.js";
import { ANALYTICS_CONFIG } from "../config/analytics.js";

// Track current tab URL
let currentTabUrl = "";
let currentRules = [];

// Track if we're coming from edit button click
let isEditButtonClick = false;

document.addEventListener(EVENTS.DOM_CONTENT_LOADED, async () => {
  // Initialize Analytics
  Analytics.init(ANALYTICS_CONFIG.MEASUREMENT_ID);
  Analytics.trackPopupOpen();

  // Get current tab URL when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabUrl = tabs[0].url;
      document.getElementById(DOM_IDS.CURRENT_URL).textContent = currentTabUrl;

      // Fill the website URL input field
      const urlInput = document.getElementById(DOM_IDS.WEBSITE_URL);
      if (urlInput) {
        urlInput.value = currentTabUrl;
        Analytics.trackUrlAutofill();
      }

      // Add click handler to the parent div containing the link icon
      const currentUrlInfo = document.getElementById("currentUrlInfo");
      const iconContainer = currentUrlInfo.querySelector("svg");
      const originalIcon = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      `;

      const successIcon = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      `;

      const errorIcon = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      `;

      // Make the icon look clickable
      iconContainer.style.cursor = "pointer";

      // Add hover effect
      iconContainer.addEventListener("mouseenter", () => {
        iconContainer.style.color = "#4B5563"; // text-gray-700
      });

      iconContainer.addEventListener("mouseleave", () => {
        iconContainer.style.color = "#4B5563"; // text-gray-600
      });

      // Add click handler for copying
      iconContainer.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(currentTabUrl);
          Analytics.trackUrlCopy(true);
          // Show success icon
          iconContainer.style.stroke = "#059669";
          iconContainer.innerHTML = successIcon;
          setTimeout(() => {
            iconContainer.style.stroke = "currentColor";
            iconContainer.innerHTML = originalIcon;
          }, 1000);
        } catch (err) {
          Analytics.trackUrlCopy(false);
          console.error("Failed to copy URL:", err);
          // Show error icon
          iconContainer.style.stroke = "#DC2626";
          iconContainer.innerHTML = errorIcon;
          setTimeout(() => {
            iconContainer.style.stroke = "currentColor";
            iconContainer.innerHTML = originalIcon;
          }, 1000);
        }
      });
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
  const removeAllRulesBtn = document.getElementById(DOM_IDS.REMOVE_ALL_RULES);
  allRulesList.innerHTML = "";

  if (!currentRules || currentRules.length === 0) {
    allRulesList.innerHTML = TEMPLATES.EMPTY_STATE.NO_RULES;
    removeAllRulesBtn.classList.add("hidden");
    return;
  }

  // Show the Remove All Rules button when there are rules
  removeAllRulesBtn.classList.remove("hidden");

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
      Analytics.trackRuleEdit(rule.blockingMode);

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

    // Add click handler for delete button
    const deleteButton = ruleElement.querySelector(".delete-rule-btn");
    deleteButton?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await StorageService.deleteRule(rule.id);
      Analytics.trackRuleDeletion(rule.blockingMode);
      await updateRuleLists();
    });

    // Add click handler for toggle button
    const toggleButton = ruleElement.querySelector(".toggle-rule-btn");
    toggleButton?.addEventListener("click", async (e) => {
      e.stopPropagation();
      rule.enabled = !rule.enabled;
      await StorageService.updateRule(rule);
      Analytics.trackRuleToggle(rule.enabled);
      await updateRuleLists();
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
  // Handle tab switching
  document.querySelectorAll("[data-tab]").forEach((tab) => {
    tab.addEventListener(EVENTS.CLICK, handleTabSwitch);
  });

  // Handle "Add rule for this site" button click
  document.addEventListener(EVENTS.CLICK, (e) => {
    const addRuleButton = e.target.closest("#" + DOM_IDS.ADD_RULE_FOR_CURRENT);
    if (addRuleButton) {
      isEditButtonClick = true;

      // We must switch to the Add Rule tab first then fill the form
      document.getElementById(DOM_IDS.ADD_RULE_TAB).click();
      document.getElementById(DOM_IDS.WEBSITE_URL).value = currentTabUrl;

      setTimeout(() => {
        isEditButtonClick = false;
      }, 100);
    }
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
      Analytics.trackBlockingModeSelection(e.target.value);
    });
  });

  // Handle form submission
  const blockForm = document.getElementById(DOM_IDS.BLOCK_FORM);
  blockForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(blockForm);
    const websiteUrl = (formData.get("websiteUrl") || "").trim();
    const redirectUrl = (formData.get("redirectUrl") || "").trim();
    const blockingModeRadio = document.querySelector('input[name="blockingModeRadio"]:checked');

    const blockingMode = blockingModeRadio.value;

    // Construct the rule object for validation
    const rule = {
      websiteUrl,
      redirectUrl,
      blockingMode,
    };

    // Add time-specific fields based on blocking mode
    if (blockingMode === BLOCKING_MODES.TIME_RANGE) {
      rule.startTime = formData.get("startTime") || "";
      rule.endTime = formData.get("endTime") || "";
    } else if (blockingMode === BLOCKING_MODES.TIME_LIMIT) {
      rule.dailyTimeLimit = formData.get("dailyTimeLimit") || "";
    }

    try {
      // Validate the rule first
      const validationResult = validateRule(rule);

      if (!validationResult.isValid) {
        Analytics.trackError("form_error", validationResult.errors.join(", "));

        // Clear any existing error messages
        const errorFields = document.querySelectorAll(".error-message");
        errorFields.forEach((field) => field.remove());

        // Clear error states from inputs
        const inputs = blockForm.querySelectorAll("input");
        inputs.forEach((input) => {
          input.classList.remove("border-red-500", "focus:ring-red-500");
        });

        // Show field-specific errors
        Object.entries(validationResult.fieldErrors).forEach(([field, error]) => {
          let targetInput;
          switch (field) {
            case "websiteUrl":
              targetInput = blockForm.querySelector("#websiteUrl");
              break;
            case "startTime":
              targetInput = blockForm.querySelector('[name="startTime"]');
              break;
            case "endTime":
              targetInput = blockForm.querySelector('[name="endTime"]');
              break;
            case "dailyTimeLimit":
              targetInput = blockForm.querySelector('[name="dailyTimeLimit"]');
              break;
          }

          if (targetInput) {
            // Find the parent div that contains the input
            const inputGroup = targetInput.closest(".mb-4");
            if (inputGroup) {
              // Create error message div
              const errorDiv = document.createElement("div");
              errorDiv.className = "error-message text-xs text-red-600 mt-1";
              errorDiv.textContent = error;

              // Add the error message
              inputGroup.appendChild(errorDiv);

              // Add error styling to input
              targetInput.classList.add("border-red-500");
              targetInput.classList.add("focus:ring-red-500");
            }
          }
        });
        return;
      }

      // If validation passes, proceed with saving
      if (blockForm.dataset.editRuleId) {
        rule.id = blockForm.dataset.editRuleId;
        await StorageService.updateRule(rule);
        Analytics.trackRuleEdit(rule.blockingMode);
        delete blockForm.dataset.editRuleId;
      } else {
        await StorageService.saveRule(rule);
        Analytics.trackRuleCreation(rule.blockingMode);
      }

      // Track time settings after successful save
      if (blockingMode === BLOCKING_MODES.TIME_RANGE) {
        Analytics.trackTimeRangeSet(`${rule.startTime}-${rule.endTime}`);
      } else if (blockingMode === BLOCKING_MODES.TIME_LIMIT) {
        Analytics.trackTimeRangeSet(`daily-${rule.dailyTimeLimit}`);
      }

      // Reset form and update lists
      blockForm.reset();
      document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent =
        "Add blocking rule";

      // Clear any existing error messages and states
      const errorFields = document.querySelectorAll(".error-message");
      errorFields.forEach((field) => field.remove());

      // Clear error states from inputs
      const inputs = blockForm.querySelectorAll("input");
      inputs.forEach((input) => {
        input.classList.remove("border-red-500", "focus:ring-red-500");
      });

      await updateRuleLists();
    } catch (error) {
      console.error("Error saving rule:", error);
      Analytics.trackError("storage_error", error.message);
      showErrorToast("Failed to save rule: " + error.message);
    }
  });

  // Handle removing all rules
  document.getElementById(DOM_IDS.REMOVE_ALL_RULES).addEventListener(EVENTS.CLICK, async () => {
    await StorageService.clearAllRules();
    Analytics.trackClearAllRules();
    await updateRuleLists();
  });
}

function handleTabSwitch(e) {
  if (e.target.classList.contains("tab-button")) {
    const tabId = e.target.getAttribute("data-tab");
    Analytics.trackTabSwitch(tabId);

    // Remove active classes from all tabs and content
    document.querySelectorAll(".tab-button").forEach((tab) => {
      tab.classList.remove("active", "border-blue-500", "text-blue-600");
      tab.classList.add("border-transparent", "text-gray-500");
    });

    // Hide all tab panes except the selected one
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      if (pane.id === tabId) {
        pane.classList.remove("hidden");
      } else {
        pane.classList.add("hidden");
      }
    });

    // Add active classes to clicked tab
    const button = e.target;
    button.classList.remove("border-transparent", "text-gray-500");
    button.classList.add("active", "border-blue-500", "text-blue-600");

    // Reset form validation when switching to Add Rule tab
    if (tabId === "add-rule-content") {
      const blockForm = document.getElementById(DOM_IDS.BLOCK_FORM);
      if (blockForm) {
        // Remove error messages
        const errorFields = blockForm.querySelectorAll(".error-message");
        errorFields.forEach((field) => field.remove());

        // Clear error states from inputs
        const inputs = blockForm.querySelectorAll("input");
        inputs.forEach((input) => {
          input.classList.remove("border-red-500", "focus:ring-red-500");
          input.classList.remove("border-red-500");
        });

        // Reset validation error container
        const validationErrors = document.getElementById("validation-errors");
        if (validationErrors) {
          validationErrors.innerHTML = "";
          validationErrors.classList.add("hidden");
        }

        // Reset form fields
        blockForm.reset();
      }
    }
  }
}

// Update both rule lists after changes
async function updateRuleLists() {
  await loadRules();
}
