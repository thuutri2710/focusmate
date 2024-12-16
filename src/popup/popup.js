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
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No Active Rules</h3>
            <p class="mt-1 text-sm text-gray-500">There are no rules currently active.</p>
        `;
    activeRulesList.appendChild(emptyState);
  } else {
    rules.forEach((rule) => {
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
