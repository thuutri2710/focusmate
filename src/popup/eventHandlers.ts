import { showElement, hideElement } from "../utils/uiUtils";
import { DOM_IDS, BLOCKING_MODES, EVENTS, ATTRIBUTES, CSS_CLASSES, TABS } from "../constants";

export function setupBlockingModeHandler(): void {
  const blockingModeElement = document.getElementById(
    DOM_IDS.BLOCKING_MODE_SELECT
  ) as HTMLSelectElement;
  blockingModeElement?.addEventListener(EVENTS.CHANGE, (e) => {
    const target = e.target as HTMLSelectElement;
    if (target.value === BLOCKING_MODES.SCHEDULE) {
      showElement(DOM_IDS.SCHEDULE_CONTAINER);
      hideElement(DOM_IDS.TIME_LIMIT_CONTAINER);
    } else if (target.value === BLOCKING_MODES.TIME_LIMIT) {
      hideElement(DOM_IDS.SCHEDULE_CONTAINER);
      showElement(DOM_IDS.TIME_LIMIT_CONTAINER);
    } else {
      // BLOCK mode
      hideElement(DOM_IDS.SCHEDULE_CONTAINER);
      hideElement(DOM_IDS.TIME_LIMIT_CONTAINER);
    }
  });
}

export function setupTabSwitchHandler(): void {
  const tabs = document.querySelectorAll(`[${ATTRIBUTES.ROLE}="${ATTRIBUTES.TAB}"]`);
  tabs.forEach((tab) => {
    tab.addEventListener(EVENTS.CLICK, (e) => {
      const target = e.currentTarget as HTMLElement; // Changed from e.target to e.currentTarget
      const targetId = target.getAttribute(ATTRIBUTES.ARIA_CONTROLS);

      // Update tab states
      tabs.forEach((t) => {
        const tabElement = t as HTMLElement;
        const panelId = tabElement.getAttribute(ATTRIBUTES.ARIA_CONTROLS);
        const panel = document.getElementById(panelId || "");

        if (tabElement === target) {
          tabElement.setAttribute(ATTRIBUTES.ARIA_SELECTED, "true");
          tabElement.classList.add(...CSS_CLASSES.TAB.SELECTED.ADD);
          tabElement.classList.remove(...CSS_CLASSES.TAB.SELECTED.REMOVE);
          panel?.classList.remove(CSS_CLASSES.HIDDEN);
        } else {
          tabElement.setAttribute(ATTRIBUTES.ARIA_SELECTED, "false");
          tabElement.classList.remove(...CSS_CLASSES.TAB.UNSELECTED.REMOVE);
          tabElement.classList.add(...CSS_CLASSES.TAB.UNSELECTED.ADD);
          panel?.classList.add(CSS_CLASSES.HIDDEN);
        }
      });

      // Reset form when switching to Add Rule tab
      if (targetId === TABS.ADD_RULE) {
        const form = document.getElementById(DOM_IDS.ADD_RULE_CONTENT) as HTMLFormElement;
        form?.reset();

        // Update button text
        const submitButton = document.getElementById(DOM_IDS.ADD_RULE_BTN) as HTMLButtonElement;
        if (submitButton) submitButton.textContent = "Add Rule";

        // Hide delete button
        const deleteButton = document.getElementById(DOM_IDS.CANCEL_EDIT_BTN) as HTMLButtonElement;
        if (deleteButton) deleteButton.classList.add(CSS_CLASSES.HIDDEN);
      }
    });
  });
}
