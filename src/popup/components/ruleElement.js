export function createRuleElement(rule, isActiveView = false) {
  const div = document.createElement("div");
  div.className = `p-4 rounded-lg shadow-sm transition-all duration-200 ${
    isActiveView
      ? "bg-white border-l-4 border-l-green-500 hover:shadow-md"
      : "bg-white hover:bg-gray-50 border border-gray-200"
  }`;
  div.dataset.id = rule.id;

  // Format the redirect URL for display
  const redirectUrl = rule.redirectUrl || "https://www.google.com";
  const isStaticUrl = !redirectUrl.includes("*") && redirectUrl.startsWith("http");
  const displayUrl = redirectUrl.length > 30 ? redirectUrl.substring(0, 27) + "..." : redirectUrl;
  const redirectDisplay = isStaticUrl
    ? `<a href="${redirectUrl}" title="${redirectUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px] inline-block align-bottom">${displayUrl}</a>`
    : `<span class="text-gray-700 truncate max-w-[200px] inline-block align-bottom" title="${redirectUrl}">${displayUrl}</span>`;

  // Determine which time restriction is active and get time spent
  let statusBadge = "";
  let timeRestrictionText = "";

  if (rule.blockingMode === "timeRange") {
    timeRestrictionText = `
      <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
        ${rule.startTime} - ${rule.endTime}
      </div>`;
    if (isActiveView) {
      statusBadge =
        '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active Now</span>';
    }
  } else {
    const timeLeft = Math.max(0, rule.dailyTimeLimit - (rule.timeSpentToday || 0));
    const progress = ((rule.timeSpentToday || 0) / rule.dailyTimeLimit) * 100;
    const isOverLimit = rule.timeSpentToday >= rule.dailyTimeLimit;
    const isNearLimit = progress >= 80 && !isOverLimit;
    
    timeRestrictionText = `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Daily Time Limit:</span>
          <div class="flex items-center gap-1.5">
            <span class="font-medium ${
              isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-blue-600'
            }">
              ${rule.timeSpentToday || 0} / ${rule.dailyTimeLimit} mins
            </span>
            ${isNearLimit ? 
              '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Almost reached</span>' 
              : ''}
          </div>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2">
          <div class="h-2 rounded-full transition-all duration-300 ${
            isOverLimit 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : isNearLimit
                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }" style="width: ${Math.min(100, progress)}%"></div>
        </div>
      </div>`;
    
    if (isActiveView) {
      if (isOverLimit) {
        statusBadge =
          '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Limit Reached</span>';
      } else if (isNearLimit) {
        statusBadge =
          '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Near Limit</span>';
      }
    }
  }

  div.innerHTML = `
    <div class="flex justify-between items-start gap-4">
      <div class="space-y-3 flex-grow min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-medium text-gray-900 truncate">${rule.websiteUrl}</h3>
          ${
            rule.websiteUrl.endsWith("/*")
              ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Pattern</span>'
              : ""
          }
          ${statusBadge}
        </div>
        <div class="space-y-2">
          ${timeRestrictionText}
          <p class="text-sm flex items-center gap-1.5 text-gray-500 min-w-0">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span class="flex-shrink-0">Redirects to:</span> 
            ${redirectDisplay}
          </p>
        </div>
      </div>
      <div class="flex gap-1.5">
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
