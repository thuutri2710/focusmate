import { StorageService } from "../services/storage.js";
import { createRuleElement } from "./components/ruleElement.js";
import { validateRule } from "../utils/validation.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadActiveRules();
  setupEventListeners();
});

async function loadActiveRules() {
  const rules = await StorageService.getRules();
  const activeRulesList = document.getElementById("activeRulesList");
  activeRulesList.innerHTML = "";

  if (rules.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "text-center py-8 text-gray-500";
    emptyState.innerHTML = `
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>No rules added yet</p>
    `;
    activeRulesList.appendChild(emptyState);
  } else {
    // Load time spent for each rule
    const updatedRules = await Promise.all(
      rules.map(async (rule) => {
        if (rule.blockingMode === "dailyLimit") {
          rule.timeSpentToday = await StorageService.getTimeSpentToday(rule.websiteUrl);
        }
        return rule;
      })
    );

    // Create rule elements with updated time spent
    updatedRules.forEach((rule) => {
      const ruleElement = createRuleElement(rule, true);
      activeRulesList.appendChild(ruleElement);

      // Add click handler for edit button
      const editButton = ruleElement.querySelector(".edit-rule-btn");
      editButton.addEventListener("click", (e) => {
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

    await StorageService.saveRule(rule);

    // Refresh active rules after adding/updating a rule
    if (document.getElementById("active-rules-content").classList.contains("hidden") === false) {
      loadActiveRules();
    }

    // Reset form and switch to Active Rules tab if we were editing
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

// Handle removing all rules
document.getElementById("removeAllRules").addEventListener("click", async () => {
  await StorageService.clearAllRules();
  loadActiveRules(); // Refresh the active rules list
});
