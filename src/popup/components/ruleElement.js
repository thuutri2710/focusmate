export function createRuleElement(rule, isActiveView = false) {
  const div = document.createElement("div");
  div.className = `p-4 rounded-lg shadow-sm transition-all ${
    isActiveView
      ? "bg-green-50 border border-green-200"
      : "bg-white hover:bg-gray-50 border border-gray-200"
  }`;
  div.dataset.id = rule.id;

  // Format the redirect URL for display
  const redirectUrl = rule.redirectUrl || "https://www.google.com";
  const isStaticUrl = !redirectUrl.includes("*") && redirectUrl.startsWith("http");
  const redirectDisplay = isStaticUrl
    ? `<a href="${redirectUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">${redirectUrl}</a>`
    : `<span class="text-gray-700">${redirectUrl}</span>`;

  // Determine which time restriction is active and get time spent
  let statusBadge = "";
  let timeRestrictionText = "";

  if (rule.blockingMode === "timeRange") {
    timeRestrictionText = `<span class="font-medium text-indigo-600">${rule.startTime} - ${rule.endTime}</span>`;
    if (isActiveView) {
      statusBadge =
        '<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Time Range Active</span>';
    }
  } else {
    const timeLeft = Math.max(0, rule.dailyTimeLimit - (rule.timeSpentToday || 0));
    timeRestrictionText = `
      <div class="flex flex-col">
        <div class="text-sm">
          <span class="text-gray-500">Time Limit:</span>
          <span class="font-medium text-purple-600">${rule.dailyTimeLimit} minutes</span>
        </div>
        <div class="text-sm">
          <span class="text-gray-500">Time Spent:</span>
          <span class="font-medium ${
            rule.timeSpentToday >= rule.dailyTimeLimit ? "text-red-600" : "text-green-600"
          }">${rule.timeSpentToday || 0} minutes</span>
        </div>
      </div>`;
    if (isActiveView && rule.timeSpentToday >= rule.dailyTimeLimit) {
      statusBadge =
        '<span class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Limit Reached</span>';
    }
  }

  div.innerHTML = `
    <div class="flex justify-between items-start">
      <div class="space-y-2 flex-grow">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-medium text-gray-900">${rule.websiteUrl}</h3>
          ${
            rule.websiteUrl.endsWith("/*")
              ? '<span class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">Pattern</span>'
              : ""
          }
          ${statusBadge}
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-sm">
            ${timeRestrictionText}
          </p>
          <p class="text-sm">
            <span class="text-gray-500">Redirects to:</span> ${redirectDisplay}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="edit-rule-btn group relative p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span class="absolute scale-0 group-hover:scale-100 transition-transform duration-200 -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
            Edit rule
          </span>
        </button>
        <button class="delete-rule-btn group relative p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="absolute scale-0 group-hover:scale-100 transition-transform duration-200 -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
            Delete rule
          </span>
        </button>
      </div>
    </div>
  `;

  // Add click handler for delete button
  const deleteButton = div.querySelector(".delete-rule-btn");
  deleteButton.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this rule?")) {
      await StorageService.deleteRule(rule.id);
      div.remove();

      // Check if this was the last rule
      const activeRulesList = document.getElementById("activeRulesList");
      if (activeRulesList.children.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "text-center py-8 text-gray-500";
        emptyState.innerHTML = `
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No rules added yet</p>
        `;
        activeRulesList.appendChild(emptyState);
      }
    }
  });

  // Add click handler for edit button
  const editButton = div.querySelector(".edit-rule-btn");
  editButton.addEventListener("click", (e) => {
    e.stopPropagation();

    // Switch to Add Rule tab
    document.getElementById("add-rule-tab").click();

    // Fill form with rule data
    document.getElementById("websiteUrl").value = rule.websiteUrl;
    document.getElementById("redirectUrl").value = rule.redirectUrl || "";
    
    // Set blocking mode radio button
    document.querySelector(`input[name="blockingMode"][value="${rule.blockingMode}"]`).checked = true;
    
    // Show/hide appropriate fields based on blocking mode
    const timeRangeFields = document.getElementById("timeRangeFields");
    const dailyLimitFields = document.getElementById("dailyLimitFields");

    if (rule.blockingMode === "timeRange") {
      timeRangeFields.classList.remove("hidden");
      dailyLimitFields.classList.add("hidden");
      document.getElementById("startTime").value = rule.startTime;
      document.getElementById("endTime").value = rule.endTime;
    } else {
      timeRangeFields.classList.add("hidden");
      dailyLimitFields.classList.remove("hidden");
      document.getElementById("dailyTimeLimit").value = rule.dailyTimeLimit;
    }

    // Store the rule ID for updating
    const form = document.getElementById("blockForm");
    form.dataset.editRuleId = rule.id;

    // Update submit button text
    document.querySelector('#blockForm button[type="submit"]').textContent = "Update blocking rule";
  });

  // Add click handler for links
  if (isStaticUrl) {
    const link = div.querySelector("a");
    link.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      chrome.tabs.create({ url: redirectUrl });
    });
  }

  return div;
}
