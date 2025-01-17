import { StorageService } from "../services/storage.js";
import { createRuleElement } from "./components/ruleElement.js";
import { validateRule } from "../utils/validation.js";
import { showToast } from "../utils/uiUtils.js";
import { showErrorToast } from "../utils/uiUtils.js";
import { showConfirmationModal } from "../utils/uiUtils.js";
import { extractDomain } from "../utils/urlUtils.js";
import { DOM_IDS, EVENTS, BLOCKING_MODES, TABS, DAYS_LIST, DAY_LABELS } from "../constants/index.js";
import { TEMPLATES } from "../constants/templates.js";

// Track current tab URL
let currentTabUrl = "";
let currentRules = [];
let updateInterval = null;

// Track if we're coming from edit button click
let isEditButtonClick = false;

// Start the update interval when the popup opens
function startUpdateInterval() {
  // Clear any existing interval
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Update rules and URL immediately
  updateRuleLists();
  updateCurrentUrl();

  // Set up interval to update rules every 30 seconds
  updateInterval = setInterval(() => {
    updateRuleLists();
    updateCurrentUrl();
  }, 30000);
}

// Clean up interval when popup closes
window.addEventListener("unload", () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

document.addEventListener(EVENTS.DOM_CONTENT_LOADED, async () => {
  try {
    // Get current tab URL when popup opens
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentTabUrl = tabs[0].url;
      const currentUrlElement = document.getElementById(DOM_IDS.CURRENT_URL);
      const currentUrlTooltip = document.getElementById("currentUrlTooltip");
      if (currentUrlElement) {
        currentUrlElement.textContent = currentTabUrl;
      }
      if (currentUrlTooltip) {
        currentUrlTooltip.textContent = currentTabUrl;
      }
      await updateCurrentUrl();
    }

    // Initial setup
    await setupUI();
    startUpdateInterval();
  } catch (error) {
    console.error("Error initializing popup:", error);
    showErrorToast("Error initializing popup");
  }
});

// Load all rules and update the UI
export async function loadRules() {
  currentRules = await StorageService.getRules();
  await Promise.all([loadActiveRules(), loadApplyingRules()]);
}

async function loadActiveRules() {
  const allRulesList = document.getElementById(DOM_IDS.ALL_RULES_LIST);
  const removeAllRulesBtn = document.getElementById(DOM_IDS.REMOVE_ALL_RULES);
  const allRulesHeader = document.getElementById("all-rules-header");

  allRulesList.innerHTML = "";

  if (!currentRules || currentRules.length === 0) {
    allRulesList.innerHTML = TEMPLATES.EMPTY_STATE.NO_RULES;
    removeAllRulesBtn.classList.add("hidden");
    allRulesHeader.classList.add("hidden");
    return;
  }

  // Show the header and Remove All Rules button when there are rules
  allRulesHeader.classList.remove("hidden");
  removeAllRulesBtn.classList.remove("hidden");

  // Create and append rule elements
  await Promise.all(
    currentRules.map(async (rule) => {
      const ruleElement = await createRuleElement(rule);
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

        // Set selected days
        const selectedDays = rule.selectedDays;
        if (selectedDays) {
          selectedDays.forEach((day) => {
            const checkbox = document.querySelector(`input[name="selectedDays"][value="${day}"]`);
            if (checkbox) {
              checkbox.checked = true;
            }
          });
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
        const confirmed = await showConfirmationModal();

        if (confirmed === true) {
          try {
            await StorageService.deleteRule(rule.id);
            showToast("Rule removed successfully");
            await loadRules(); // Only reload if we actually deleted
          } catch (error) {
            console.error("Error deleting rule:", error);
            showToast(error.message || "Failed to delete rule", "error");
          }
        }
        // Don't reload if user cancelled
      });

      // Add click handler for toggle button
      const toggleButton = ruleElement.querySelector(".toggle-rule-btn");
      toggleButton?.addEventListener("click", async (e) => {
        e.stopPropagation();
        rule.enabled = !rule.enabled;
        await StorageService.updateRule(rule);
        await updateRuleLists();
      });
    })
  );
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

  // Helper function to normalize URL for comparison
  const normalizeUrlForComparison = (url) => {
    try {
      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      const urlObj = new URL(url);
      return {
        hostname: urlObj.hostname.replace(/^www\./, ""),
        pathname: urlObj.pathname,
        fullUrl: url,
      };
    } catch (e) {
      return null;
    }
  };

  const currentUrlParts = normalizeUrlForComparison(currentTabUrl);
  if (!currentUrlParts) {
    applyingRulesList.innerHTML = TEMPLATES.EMPTY_STATE.INVALID_URL;
    return;
  }

  // Filter rules that apply to current URL
  const applyingRules = currentRules.filter((rule) => {
    const rulePattern = rule.websiteUrl;

    // Normalize URLs for comparison
    const normalizedRule = normalizeUrlForComparison(rulePattern);
    const normalizedCurrent = normalizeUrlForComparison(currentTabUrl);

    if (!normalizedRule || !normalizedCurrent) return false;

    // Check exact match first (ignoring protocol and www.)
    if (normalizedRule.hostname === normalizedCurrent.hostname) {
      // If rule has no path or just /, it matches all paths
      if (normalizedRule.pathname === "/" || !normalizedRule.pathname) {
        return true;
      }
      // If rule has a specific path, current URL should start with it
      if (normalizedCurrent.pathname.startsWith(normalizedRule.pathname)) {
        return true;
      }
    }

    // Check wildcard patterns
    if (rulePattern.includes("*")) {
      const regex = patternToRegex(rulePattern);
      // Test against both the full URL and just the hostname
      return regex.test(currentTabUrl) || regex.test(normalizedCurrent.hostname);
    }

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

    // Create rule elements
    await Promise.all(
      applyingRules.map(async (rule) => {
        const ruleElement = await createRuleElement(rule, true);

        // Add match type indicator
        if (rule.websiteUrl !== currentTabUrl) {
          const container = ruleElement.querySelector(".space-y-2");
          if (container) {
            container.insertAdjacentHTML("beforeend", TEMPLATES.PATTERN_MATCH_INDICATOR);
          }
        }

        applyingRulesList.appendChild(ruleElement);
      })
    );
  }
}

async function setupEventListeners() {
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
    });
  });

  // Handle form submission
  document.getElementById(DOM_IDS.BLOCK_FORM).addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Get selected days
    const selectedDays = Array.from(document.querySelectorAll('input[name="selectedDays"]:checked'))
      .map(checkbox => checkbox.value);

    const rule = {
      websiteUrl: formData.get("websiteUrl"),
      redirectUrl: formData.get("redirectUrl"),
      blockingMode: formData.get("blockingModeRadio"),
      selectedDays: selectedDays,
    };

    if (rule.blockingMode === BLOCKING_MODES.TIME_RANGE) {
      rule.startTime = formData.get("startTime");
      rule.endTime = formData.get("endTime");
    } else {
      rule.dailyTimeLimit = formData.get("dailyTimeLimit");
    }

    // If editing existing rule, include the ID
    const editRuleId = e.target.dataset.editRuleId;
    if (editRuleId) {
      rule.id = editRuleId;
    }

    try {
      await StorageService.saveRule(rule);
      showToast(editRuleId ? "Rule updated successfully" : "Rule added successfully");
      e.target.reset();
      e.target.dataset.editRuleId = "";
      document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent = "Add blocking rule";
      await loadRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      showErrorToast(error.message || "Failed to save rule");
    }
  });

  // Handle removing all rules
  document.getElementById(DOM_IDS.REMOVE_ALL_RULES).addEventListener(EVENTS.CLICK, async () => {
    await StorageService.clearAllRules();
    await updateRuleLists();
  });
}

function resetDaySelections() {
  const dayCheckboxes = document.querySelectorAll('input[name="selectedDays"]');
  dayCheckboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
}

function handleTabSwitch(e) {
  const selectedTab = e.currentTarget;
  const targetId = selectedTab.dataset.tab;

  // Don't switch if we're coming from edit button click
  if (isEditButtonClick && targetId === DOM_IDS.ADD_RULE_CONTENT) {
    return;
  }

  // Reset form when switching to Add Rule tab
  if (targetId === DOM_IDS.ADD_RULE_CONTENT) {
    const form = document.getElementById(DOM_IDS.BLOCK_FORM);
    form.reset();
    resetDaySelections();
    form.dataset.editRuleId = "";
    document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent = "Add blocking rule";
  }

  // Update tab button styles
  document.querySelectorAll(".tab-button").forEach((tab) => {
    if (tab === selectedTab) {
      tab.classList.remove("border-transparent", "text-gray-500", "hover:text-gray-700", "hover:border-gray-300");
      tab.classList.add("border-blue-500", "text-blue-600");
    } else {
      tab.classList.remove("border-blue-500", "text-blue-600");
      tab.classList.add("border-transparent", "text-gray-500", "hover:text-gray-700", "hover:border-gray-300");
    }
  });

  // Show selected tab content
  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.toggle("hidden", pane.id !== targetId);
  });
}

// Update both rule lists after changes
async function updateRuleLists() {
  await loadRules();
}

async function updateCurrentUrl() {
  const currentUrlElement = document.getElementById(DOM_IDS.CURRENT_URL);
  if (currentUrlElement && currentTabUrl) {
    currentUrlElement.textContent = currentTabUrl;
    currentUrlElement.title = currentTabUrl;
  }
}

// Set up initial UI state
async function setupUI() {
  if (currentTabUrl) {
    // Show full URL in the display area
    await updateCurrentUrl();

    // Fill the website URL input field with just the domain
    const urlInput = document.getElementById(DOM_IDS.WEBSITE_URL);
    if (urlInput) {
      urlInput.value = extractDomain(currentTabUrl);
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
        // Show success icon
        iconContainer.style.stroke = "#059669";
        iconContainer.innerHTML = successIcon;
        setTimeout(() => {
          iconContainer.style.stroke = "currentColor";
          iconContainer.innerHTML = originalIcon;
        }, 1000);
      } catch (err) {
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
  setupEventListeners();
  await loadRules();
}
