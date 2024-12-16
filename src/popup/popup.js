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
    });
  }
}

function setupEventListeners() {
  const blockForm = document.getElementById("blockForm");
  const tabButtons = document.querySelectorAll(".tab-button");

  blockForm.addEventListener("submit", handleFormSubmit);

  // Handle blocking mode switching
  const modeInputs = document.querySelectorAll('input[name="blockingMode"]');
  modeInputs.forEach((input) => {
    input.addEventListener("change", handleModeChange);
  });

  // Handle tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", handleTabSwitch);
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

function handleModeChange(e) {
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

async function handleFormSubmit(e) {
  e.preventDefault();

  const blockingMode = document.querySelector('input[name="blockingMode"]:checked').value;

  const rule = {
    websiteUrl: document.getElementById("websiteUrl").value,
    redirectUrl: document.getElementById("redirectUrl").value || "https://www.google.com",
  };

  // Add relevant time restriction based on mode
  if (blockingMode === "timeRange") {
    rule.startTime = document.getElementById("startTime").value;
    rule.endTime = document.getElementById("endTime").value;
    rule.blockingMode = "timeRange";
  } else {
    rule.dailyTimeLimit = document.getElementById("dailyTimeLimit").value;
    rule.blockingMode = "dailyLimit";
  }

  const validationError = validateRule(rule);
  if (validationError) {
    alert(validationError);
    return;
  }

  await StorageService.saveRule(rule);

  // Refresh active rules after adding a new rule
  if (document.getElementById("active-rules-content").classList.contains("hidden") === false) {
    loadActiveRules();
  }

  e.target.reset();

  // Reset to default time range mode
  document.querySelector('input[value="timeRange"]').checked = true;
  handleModeChange({ target: { value: "timeRange" } });
}

async function handleRuleDelete(e) {
  if (e.target.closest(".btn-delete")) {
    const ruleId = e.target.closest(".rule-item").dataset.id;
    await StorageService.deleteRule(ruleId);
  }
}

// Handle removing all rules
document.getElementById("removeAllRules").addEventListener("click", async () => {
  await StorageService.clearAllRules();
  loadActiveRules(); // Refresh the active rules list
});
