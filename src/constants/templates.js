import { CSS_CLASSES } from './index.js';

export const SVG = {
  EMPTY_STATE: `
    <svg class="${CSS_CLASSES.EMPTY_STATE.ICON}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2M8 3v2m0-2h8m0 0v2m0-2z" />
    </svg>
  `,
  LOGO: `
    <svg class="inline-block w-8 h-8 mr-2 -mt-1" viewBox="-351 153 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7CB9E8" />
          <stop offset="100%" style="stop-color:#3457D5" />
        </linearGradient>
        <linearGradient id="figureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F0F8FF" />
          <stop offset="100%" style="stop-color:#E6E6FA" />
        </linearGradient>
      </defs>
      <circle cx="-223" cy="281" r="128" fill="url(#bgGradient)" opacity="0.95" />
      <circle cx="-223" cy="281" r="100" fill="none" stroke="url(#figureGradient)" stroke-width="2" opacity="0.5" />
      <circle cx="-223" cy="281" r="85" fill="none" stroke="url(#figureGradient)" stroke-width="2" opacity="0.4" />
      <circle cx="-223" cy="281" r="70" fill="none" stroke="url(#figureGradient)" stroke-width="2" opacity="0.3" />
      <g opacity="0.9" transform="translate(-223,281) scale(0.45) translate(223,-281)">
        <circle cx="-222.3" cy="188.5" r="31.1" fill="url(#figureGradient)" />
        <path fill="url(#figureGradient)" d="M-106.6,332.4c-0.4-0.6-0.9-1.1-1.4-1.6l-35.3-32.8l-22.8-49c-6.2-12.5-15.2-20.3-28.6-20.3h-57.5c-13.5,0-22.4,7.8-28.6,20.3l-22.8,49l-35.3,32.8c-0.5,0.5-1,1.1-1.4,1.6c-3.6,3.1-5.9,7.7-5.9,12.8c0,9.3,7.6,16.9,16.9,16.9c5.5,0,10.3-2.6,13.4-6.7c0.3-0.2,0.6-0.5,0.8-0.7l37.4-34.8c1.4-1.4,2.5-3,3.3-4.8l11.9-25.5l-0.6,45l-52.2,28.4c-9.5,5.2-14,16.4-10.6,26.7c3.4,10.3,13.6,16.7,24.3,15.2l78.1-20.2l78.1,20.2c10.7,1.5,21-4.9,24.3-15.2c3.4-10.3-1.1-21.5-10.6-26.7l-52.2-28.5l-0.6-45l11.9,25.5c0.8,1.8,2,3.4,3.3,4.8l37.4,34.8c0.3,0.3,0.5,0.5,0.8,0.7c3.1,4,7.9,6.7,13.4,6.7c9.3,0,16.9-7.6,16.9-16.9C-100.7,340-103,335.5-106.6,332.4z" />
      </g>
    </svg>
  `
};

export const EMPTY_STATES = {
  NO_RULES: `
    <div class="${CSS_CLASSES.EMPTY_STATE.CONTAINER}">
      ${SVG.EMPTY_STATE}
      <p>No rules yet</p>
      <p class="text-sm mt-2">Add your first rule to get started</p>
    </div>
  `,
  NO_APPLYING_RULES: `
    <div class="${CSS_CLASSES.EMPTY_STATE.CONTAINER}">
      ${SVG.EMPTY_STATE}
      <p>No rules apply to this page</p>
      <p class="text-sm mt-2">Add a rule for this website to get started</p>
      <button id="addRuleForCurrent" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        Add rule for this site
      </button>
    </div>
  `
};

export const TEMPLATES = {
  EMPTY_STATE: {
    NO_RULES: `
      <div class="text-center py-8 text-gray-500">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2M8 3v2m0-2h8m0 0v2m0-2z" />
        </svg>
        <p>No rules yet</p>
        <p class="text-sm mt-2">Add your first rule to get started</p>
      </div>
    `,
    NO_APPLYING_RULES: `
      <div class="text-center py-8 text-gray-500">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2M8 3v2m0-2h8m0 0v2m0-2z" />
        </svg>
        <p>No rules apply to this page</p>
        <button id="addRuleForCurrent" class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Add rule for this page
        </button>
      </div>
    `,
    INVALID_URL: `
      <div class="text-center py-4 text-gray-500">
        <p>Invalid URL format</p>
      </div>
    `
  },
  PATTERN_MATCH_INDICATOR: `
    <div class="mt-2 text-xs text-gray-500 flex items-center gap-1">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      Pattern match
    </div>
  `,
  RULE_TEMPLATES: {
    TIME_BADGE: (startTime, endTime) => `
      <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
        ${startTime} - ${endTime}
      </div>
    `,
    STATUS_BADGE: (colorTheme, text) => `
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorTheme.badge}">
        ${text}
      </span>
    `,
    TIME_LIMIT_SECTION: (rule, colorTheme, isNearLimit, isOverLimit, timeSpent) => `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Daily Time Limit:</span>
          <div class="flex items-center gap-1.5">
            <div class="font-medium flex items-baseline">
              <span class="${colorTheme.text}">${timeSpent || 0}</span>
              <span class="text-gray-400 mx-1">/</span>
              <span class="text-gray-700">${rule.dailyTimeLimit}</span>
              <span class="text-gray-500 ml-1 text-xs">minutes</span>
            </div>
            ${isNearLimit ? RULE_TEMPLATES.STATUS_BADGE(colorTheme, isOverLimit ? "Limit reached" : "Almost reached") : ""}
          </div>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-300 bg-gradient-to-r ${colorTheme.progress}" 
            style="width: ${Math.min(100, (timeSpent || 0) / rule.dailyTimeLimit * 100)}%">
          </div>
        </div>
      </div>
    `,
    RULE_ACTIONS: `
      <div class="flex items-center space-x-2">
        <button class="edit-rule-btn text-gray-400 hover:text-gray-500">
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
          </svg>
        </button>
        <button class="delete-rule-btn text-gray-400 hover:text-gray-500">
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `,
    COLOR_THEMES: {
      NORMAL: {
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700',
        progress: 'from-gray-300 to-gray-400'
      },
      NEAR_LIMIT: {
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-700',
        progress: 'from-yellow-300 to-yellow-400'
      },
      OVER_LIMIT: {
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        progress: 'from-red-300 to-red-400'
      }
    }
  }
};
