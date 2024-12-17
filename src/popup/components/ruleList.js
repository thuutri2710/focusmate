import { createRuleElement } from './ruleElement.js';
import { createEmptyStateElement } from '../../utils/domUtils.js';
import { DOM_IDS } from '../../constants/index.js';

export class RuleList {
  constructor(containerId, isActiveView = false) {
    this.container = document.getElementById(containerId);
    this.isActiveView = isActiveView;
  }

  clear() {
    this.container.innerHTML = '';
  }

  renderEmptyState() {
    this.clear();
    this.container.appendChild(createEmptyStateElement());
  }

  renderRules(rules) {
    this.clear();
    
    if (!rules || rules.length === 0) {
      this.renderEmptyState();
      return;
    }

    rules.forEach(rule => {
      const ruleElement = createRuleElement(rule, this.isActiveView);
      this.container.appendChild(ruleElement);
    });
  }
}
