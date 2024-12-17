import { RuleService } from '../services/ruleService.js';
import { validateRule } from '../utils/validation.js';
import { showElement, hideElement, getElementValue } from '../utils/domUtils.js';
import { 
  DOM_IDS, 
  BLOCKING_MODES, 
  EVENTS, 
  ATTRIBUTES, 
  CSS_CLASSES,
  MESSAGES,
  TABS 
} from '../constants/index.js';

export function setupBlockingModeHandler() {
  document.getElementById(DOM_IDS.BLOCKING_MODE).addEventListener(EVENTS.CHANGE, (e) => {
    if (e.target.value === BLOCKING_MODES.TIME_RANGE) {
      showElement(DOM_IDS.TIME_RANGE_FIELDS);
      hideElement(DOM_IDS.TIME_LIMIT_FIELDS);
    } else {
      hideElement(DOM_IDS.TIME_RANGE_FIELDS);
      showElement(DOM_IDS.TIME_LIMIT_FIELDS);
    }
  });
}

export function setupTabSwitchHandler() {
  const tabs = document.querySelectorAll(`[${ATTRIBUTES.ROLE}="${ATTRIBUTES.TAB}"]`);
  tabs.forEach(tab => {
    tab.addEventListener(EVENTS.CLICK, (e) => {
      const targetId = e.target.getAttribute(ATTRIBUTES.ARIA_CONTROLS);
      
      // Update tab states
      tabs.forEach(t => {
        const panelId = t.getAttribute(ATTRIBUTES.ARIA_CONTROLS);
        const panel = document.getElementById(panelId);
        
        if (t === e.target) {
          t.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'true');
          t.classList.add(...CSS_CLASSES.TAB.SELECTED.ADD);
          t.classList.remove(...CSS_CLASSES.TAB.SELECTED.REMOVE);
          panel.classList.remove(CSS_CLASSES.HIDDEN);
        } else {
          t.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
          t.classList.remove(...CSS_CLASSES.TAB.UNSELECTED.REMOVE);
          t.classList.add(...CSS_CLASSES.TAB.UNSELECTED.ADD);
          panel.classList.add(CSS_CLASSES.HIDDEN);
        }
      });

      // Reset form when switching to Add Rule tab
      if (targetId === TABS.CONTENT.ADD_RULE) {
        resetRuleForm();
      }
    });
  });
}

export function setupFormHandler(onRuleUpdate) {
  const form = document.getElementById(DOM_IDS.BLOCK_FORM);
  
  form.addEventListener(EVENTS.SUBMIT, async (e) => {
    e.preventDefault();
    
    const rule = {
      websiteUrl: getElementValue(DOM_IDS.WEBSITE_URL),
      redirectUrl: getElementValue(DOM_IDS.REDIRECT_URL),
      blockingMode: getElementValue(DOM_IDS.BLOCKING_MODE),
      ...(getElementValue(DOM_IDS.BLOCKING_MODE) === BLOCKING_MODES.TIME_RANGE
        ? {
            startTime: getElementValue(DOM_IDS.START_TIME),
            endTime: getElementValue(DOM_IDS.END_TIME)
          }
        : {
            dailyTimeLimit: parseInt(getElementValue(DOM_IDS.DAILY_TIME_LIMIT))
          }
      )
    };

    if (!validateRule(rule)) {
      return;
    }

    const editRuleId = form.dataset.editRuleId;
    if (editRuleId) {
      await RuleService.updateRule(editRuleId, rule);
      delete form.dataset.editRuleId;
    } else {
      await RuleService.addRule(rule);
    }

    resetRuleForm();
    if (onRuleUpdate) onRuleUpdate();
  });
}

function resetRuleForm() {
  const form = document.getElementById(DOM_IDS.BLOCK_FORM);
  form.reset();
  delete form.dataset.editRuleId;
  document.querySelector(`#${DOM_IDS.BLOCK_FORM} button[type="submit"]`).textContent = MESSAGES.BUTTONS.ADD_RULE;
  
  // Reset blocking mode
  const event = new Event(EVENTS.CHANGE);
  document.getElementById(DOM_IDS.BLOCKING_MODE).dispatchEvent(event);
}
