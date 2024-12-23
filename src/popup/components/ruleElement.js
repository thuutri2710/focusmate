import { BLOCKING_MODES } from "../../constants/index.js";
import { TEMPLATES } from "../../constants/templates.js";
import { StorageService } from "../../services/storage.js";
import { loadRules } from "../popup.js";
import { showErrorToast } from "../../utils/uiUtils.js";

export async function createRuleElement(rule, isActiveView = false) {
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

  if (rule.blockingMode === BLOCKING_MODES.TIME_RANGE) {
    timeRestrictionText = TEMPLATES.RULE_TEMPLATES.TIME_BADGE(rule.startTime, rule.endTime);
    if (isActiveView) {
      statusBadge = TEMPLATES.RULE_TEMPLATES.STATUS_BADGE(
        TEMPLATES.RULE_TEMPLATES.COLOR_THEMES.NORMAL,
        "Active Now"
      );
    }
  } else {
    // Get time spent directly from storage
    const timeSpentMs = await StorageService.getTimeSpentToday(rule.websiteUrl);
    console.log("timeSpentMs", timeSpentMs);
    const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60)); // Convert ms to minutes
    const timeLeft = Math.max(0, rule.dailyTimeLimit - timeSpentMinutes);
    const progress = (timeSpentMinutes / rule.dailyTimeLimit) * 100;
    const isOverLimit = timeSpentMinutes >= rule.dailyTimeLimit;
    const isNearLimit = progress >= 80 && !isOverLimit;

    // Get color theme based on status
    const colorTheme = isOverLimit
      ? TEMPLATES.RULE_TEMPLATES.COLOR_THEMES.OVER_LIMIT
      : isNearLimit
      ? TEMPLATES.RULE_TEMPLATES.COLOR_THEMES.NEAR_LIMIT
      : TEMPLATES.RULE_TEMPLATES.COLOR_THEMES.NORMAL;

    timeRestrictionText = TEMPLATES.RULE_TEMPLATES.TIME_LIMIT_SECTION(
      rule,
      colorTheme,
      isNearLimit,
      isOverLimit,
      timeSpentMinutes
    );

    if (isActiveView) {
      if (isOverLimit || isNearLimit) {
        statusBadge = TEMPLATES.RULE_TEMPLATES.STATUS_BADGE(
          colorTheme,
          isOverLimit ? "Limit Reached" : "Near Limit"
        );
      }
    }
  }

  div.innerHTML = `
    <div class="flex justify-between items-start gap-4">
      <div class="space-y-3 flex-grow min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-900 truncate">${rule.websiteUrl}</h3>
            ${statusBadge}
          </div>
          ${TEMPLATES.RULE_TEMPLATES.RULE_ACTIONS}
        </div>
        <div class="text-sm text-gray-500">
          Redirect to: ${redirectDisplay}
        </div>
        ${timeRestrictionText || ""}
      </div>
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
