import { createRuleElement } from './ruleElement.js';
import { EMPTY_STATES } from '../../constants/templates.js';

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
    this.container.innerHTML = this.isActiveView ? EMPTY_STATES.NO_APPLYING_RULES : EMPTY_STATES.NO_RULES;
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
