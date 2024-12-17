import { StorageService } from "./storage.js";

export class RuleService {
  static async getRulesWithTimeSpent() {
    const rules = await StorageService.getRules();
    console.log(rules);
    return Promise.all(
      rules.map(async (rule) => ({
        ...rule,
        timeSpentToday: await StorageService.getTimeSpentToday(rule.id),
      }))
    );
  }

  static async addRule(rule) {
    await StorageService.saveRule(rule);
    document.dispatchEvent(new Event("rulesUpdated"));
  }

  static async updateRule(updatedRule) {
    await StorageService.saveRule(updatedRule);
    document.dispatchEvent(new Event("rulesUpdated"));
  }

  static async deleteRule(ruleId) {
    await StorageService.deleteRule(ruleId);
    document.dispatchEvent(new Event("rulesUpdated"));
  }

  static async clearAllRules() {
    await StorageService.clearAllRules();
    document.dispatchEvent(new Event("rulesUpdated"));
  }
}
