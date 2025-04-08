import React, { useState, useEffect } from "react";
import { BlockRule, BlockingMode, MessageType } from "../types";
import { StorageService } from "../services/storage";
import { extractDomain } from "../utils/urlUtils";
import { TABS } from "../constants";
import TabNavigation from "./components/TabNavigation";
import AddRuleTab from "./components/AddRuleTab";
import ApplyingRulesTab from "./components/ApplyingRulesTab";
import RuleMatchesTab from "./components/RuleMatchesTab";
import SettingsTab from "./components/SettingsTab";
import StatsTab from "./components/StatsTab";
import Toast from "./components/Toast";
import ConfirmationModal from "./components/ConfirmationModal";

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(TABS.ADD_RULE);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [editingRule, setEditingRule] = useState<BlockRule | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Load rules and current URL when popup opens
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get rules
        const allRules = await StorageService.getAllRules();
        setRules(allRules);

        // Get current tab URL
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showToast("Error loading data", "error");
      }
    };

    loadData();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Show toast notification
  const showToast = (message: string, type: "success" | "error" | "info" | "warning") => {
    setToast({ message, type });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Show confirmation modal
  const showConfirmationModal = (
    title: string,
    message: string,
    confirmLabel: string,
    cancelLabel: string,
    onConfirm: () => void
  ) => {
    setModal({
      title,
      message,
      confirmLabel,
      cancelLabel,
      onConfirm,
    });
  };

  // Handle adding a new rule
  const handleAddRule = async (rule: Omit<BlockRule, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newRule = await StorageService.addRule(rule);
      setRules([...rules, newRule]);
      showToast("Rule added successfully", "success");

      // Reset editing state
      setEditingRule(null);

      // Switch to applying rules tab
      setActiveTab(TABS.APPLYING_RULES);

      // Notify background script to update rules
      chrome.runtime.sendMessage({ type: MessageType.UPDATE_RULES });
    } catch (error) {
      console.error("Error adding rule:", error);
      showToast("Error adding rule", "error");
    }
  };

  // Handle updating a rule
  const handleUpdateRule = async (id: string, updates: Partial<BlockRule>) => {
    try {
      const updatedRule = await StorageService.updateRule(id, updates);
      if (updatedRule) {
        setRules(rules.map((rule) => (rule.id === id ? updatedRule : rule)));
        showToast("Rule updated successfully", "success");
      }

      // Reset editing state
      setEditingRule(null);

      // Notify background script to update rules
      chrome.runtime.sendMessage({ type: MessageType.UPDATE_RULES });
    } catch (error) {
      console.error("Error updating rule:", error);
      showToast("Error updating rule", "error");
    }
  };

  // Handle deleting a rule
  const handleDeleteRule = (id: string) => {
    showConfirmationModal(
      "Delete Rule",
      "Are you sure you want to delete this rule?",
      "Delete",
      "Cancel",
      async () => {
        try {
          const success = await StorageService.deleteRule(id);
          if (success) {
            setRules(rules.filter((rule) => rule.id !== id));
            showToast("Rule deleted successfully", "success");

            // Notify background script to update rules
            chrome.runtime.sendMessage({ type: MessageType.UPDATE_RULES });
          }
        } catch (error) {
          console.error("Error deleting rule:", error);
          showToast("Error deleting rule", "error");
        }

        // Close modal
        setModal(null);
      }
    );
  };

  // Handle editing a rule
  const handleEditRule = (rule: BlockRule) => {
    setEditingRule(rule);
    setActiveTab(TABS.ADD_RULE);
  };

  // Handle toggling a rule's active state
  const handleToggleRule = async (id: string, active: boolean) => {
    try {
      const updatedRule = await StorageService.updateRule(id, { active });
      if (updatedRule) {
        setRules(rules.map((rule) => (rule.id === id ? updatedRule : rule)));
        showToast(`Rule ${active ? "activated" : "deactivated"} successfully`, "success");
      }

      // Notify background script to update rules
      chrome.runtime.sendMessage({ type: MessageType.UPDATE_RULES });
    } catch (error) {
      console.error("Error toggling rule:", error);
      showToast("Error toggling rule", "error");
    }
  };

  // Handle adding current URL as a rule
  const handleAddCurrentUrl = () => {
    const domain = extractDomain(currentUrl);
    if (domain) {
      setEditingRule({
        id: "",
        domain,
        mode: BlockingMode.BLOCK,
        active: true,
        createdAt: 0,
        updatedAt: 0,
      });
      setActiveTab(TABS.ADD_RULE);
    } else {
      showToast("Invalid URL", "error");
    }
  };

  // Handle resetting stats
  const handleResetStats = () => {
    showConfirmationModal(
      "Reset Statistics",
      "Are you sure you want to reset all time usage statistics?",
      "Reset",
      "Cancel",
      async () => {
        try {
          await StorageService.resetTimeUsage();
          showToast("Statistics reset successfully", "success");

          // Notify background script
          chrome.runtime.sendMessage({ type: "reset_stats" });
        } catch (error) {
          console.error("Error resetting stats:", error);
          showToast("Error resetting statistics", "error");
        }

        // Close modal
        setModal(null);
      }
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        <svg
          className="inline-block w-8 h-8 mr-2 -mt-1"
          viewBox="-351 153 256 256"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#7CB9E8" }} />
              <stop offset="100%" style={{ stopColor: "#3457D5" }} />
            </linearGradient>
            <linearGradient id="figureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#F0F8FF" }} />
              <stop offset="100%" style={{ stopColor: "#E6E6FA" }} />
            </linearGradient>
          </defs>
          <circle cx="-223" cy="281" r="128" fill="url(#bgGradient)" opacity="0.95" />
          <circle
            cx="-223"
            cy="281"
            r="100"
            fill="none"
            stroke="url(#figureGradient)"
            strokeWidth="2"
            opacity="0.5"
          />
          <circle
            cx="-223"
            cy="281"
            r="85"
            fill="none"
            stroke="url(#figureGradient)"
            strokeWidth="2"
            opacity="0.4"
          />
          <circle
            cx="-223"
            cy="281"
            r="70"
            fill="none"
            stroke="url(#figureGradient)"
            strokeWidth="2"
            opacity="0.3"
          />
          <g opacity="0.9" transform="translate(-223,281) scale(0.45) translate(223,-281)">
            <circle cx="-222.3" cy="188.5" r="31.1" fill="url(#figureGradient)" />
            <path
              fill="url(#figureGradient)"
              d="M-106.6,332.4c-0.4-0.6-0.9-1.1-1.4-1.6l-35.3-32.8l-22.8-49c-6.2-12.5-15.2-20.3-28.6-20.3h-57.5c-13.5,0-22.4,7.8-28.6,20.3l-22.8,49l-35.3,32.8c-0.5,0.5-1,1.1-1.4,1.6c-3.6,3.1-5.9,7.7-5.9,12.8c0,9.3,7.6,16.9,16.9,16.9c5.5,0,10.3-2.6,13.4-6.7c0.3-0.2,0.6-0.5,0.8-0.7l37.4-34.8c1.4-1.4,2.5-3,3.3-4.8l11.9-25.5l-0.6,45l-52.2,28.4c-9.5,5.2-14,16.4-10.6,26.7c3.4,10.3,13.6,16.7,24.3,15.2l78.1-20.2l78.1,20.2c10.7,1.5,21-4.9,24.3-15.2c3.4-10.3-1.1-21.5-10.6-26.7l-52.2-28.5l-0.6-45l11.9,25.5c0.8,1.8,2,3.4,3.3,4.8l37.4,34.8c0.3,0.3,0.5,0.5,0.8,0.7c3.1,4,7.9,6.7,13.4,6.7c9.3,0,16.9-7.6,16.9-16.9C-100.7,340-103,335.5-106.6,332.4z"
            />
          </g>
        </svg>
        FocusMate
      </h1>

      {/* Current URL Display */}
      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">Current URL:</span>
          <span className="ml-2 text-blue-700 font-medium" title={currentUrl}>
            {extractDomain(currentUrl) || "N/A"}
          </span>
        </div>
        <button
          onClick={handleAddCurrentUrl}
          className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
        >
          Add Rule
        </button>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-4 min-h-[200px]">
        {activeTab === TABS.ADD_RULE && (
          <AddRuleTab
            initialRule={editingRule || undefined}
            onSubmit={
              editingRule?.id ? (rule) => handleUpdateRule(editingRule.id, rule) : handleAddRule
            }
            onCancel={editingRule ? () => setEditingRule(null) : undefined}
          />
        )}

        {activeTab === TABS.APPLYING_RULES && (
          <ApplyingRulesTab
            rules={rules}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggle={handleToggleRule}
          />
        )}

        {activeTab === TABS.RULE_MATCHES && (
          <RuleMatchesTab />
        )}

        {activeTab === TABS.SETTINGS && <SettingsTab />}

        {activeTab === TABS.STATS && <StatsTab onResetStats={handleResetStats} />}
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Confirmation Modal */}
      {modal && (
        <ConfirmationModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default Popup;
