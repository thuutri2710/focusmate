import React from 'react';
import { TABS } from '../../constants';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: TABS.ADD_RULE, label: 'Add Rule' },
    { id: TABS.APPLYING_RULES, label: 'Active Rules' },
    { id: TABS.RULE_MATCHES, label: 'Rule Matches' },
    { id: TABS.SETTINGS, label: 'Settings' },
    { id: TABS.STATS, label: 'Statistics' }
  ];

  return (
    <div className="mb-4 border-b border-gray-200">
      <nav className="flex space-x-8 border-b border-gray-200" aria-label="Tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-controls={tab.id}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
