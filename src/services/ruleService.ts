import { StorageService } from "./storage";
import { BlockRule } from "../types";

export class RuleService {
  static async getRulesWithTimeSpent(): Promise<BlockRule[]> {
    const rules = await StorageService.getAllRules();
    return Promise.all(
      rules.map(async (rule) => ({
        ...rule,
        timeSpentToday: await StorageService.getTimeSpentToday(rule.domain),
      }))
    );
  }

  static async addRule(rule: BlockRule): Promise<void> {
    await StorageService.addRule(rule);
    document.dispatchEvent(new Event("rulesUpdated"));
  }

  static async updateRule(id: string, updates: Partial<BlockRule>): Promise<void> {
    await StorageService.updateRule(id, updates);
    document.dispatchEvent(new Event("rulesUpdated"));
  }

  static async deleteRule(ruleId: string): Promise<void> {
    await StorageService.deleteRule(ruleId);
    document.dispatchEvent(new Event("rulesUpdated"));
  }

  static async clearAllRules(): Promise<void> {
    await StorageService.resetAllData();
    document.dispatchEvent(new Event("rulesUpdated"));
  }
}
