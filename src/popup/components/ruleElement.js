export function createRuleElement(rule) {
  const div = document.createElement("div");
  div.className = "p-4 hover:bg-gray-50 rule-item";
  div.dataset.id = rule.id;

  // Format the redirect URL for display
  const redirectUrl = rule.redirectUrl || "https://www.google.com";
  const isStaticUrl = !redirectUrl.includes("*") && redirectUrl.startsWith("http");
  const redirectDisplay = isStaticUrl
    ? `<a href="${redirectUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">${redirectUrl}</a>`
    : `<span class="text-gray-700">${redirectUrl}</span>`;

  // Determine which time restriction is active and get time spent
  const timeRestrictionText = rule.dailyTimeLimit
    ? `<span class="font-medium text-purple-600">${rule.dailyTimeLimit} minutes</span> / day`
    : `<span class="font-medium text-indigo-600">${rule.startTime} - ${rule.endTime}</span>`;

  div.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <h3 class="font-medium text-gray-900">${rule.websiteUrl}</h3>
                    ${
                      rule.websiteUrl.endsWith("/*")
                        ? '<span class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">Pattern</span>'
                        : ""
                    }
                </div>
                <div class="flex flex-col gap-1">
                    <p class="text-sm">
                        <span class="text-gray-500">Limit:</span> ${timeRestrictionText}
                    </p>
                    <p class="text-sm">
                        <span class="text-gray-500">Redirects to:</span> ${redirectDisplay}
                    </p>
                    ${
                      rule.dailyTimeLimit
                        ? `
                    <p class="text-sm">
                        <span class="text-gray-500">Time spent today:</span> 
                        <span class="font-medium ${
                          rule.timeSpentToday >= rule.dailyTimeLimit
                            ? "text-red-600"
                            : "text-amber-600"
                        }">
                            ${rule.timeSpentToday || 0} minutes
                        </span>
                        <span class="text-gray-500">/ ${rule.dailyTimeLimit} minutes</span>
                    </p>
                    `
                        : ""
                    }
                </div>
            </div>
            <button class="btn-delete text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    `;

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
