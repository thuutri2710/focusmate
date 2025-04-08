import React, { useState } from "react";
import { BlockRule } from "../../types";
import RuleItem from "./RuleItem";

interface ApplyingRulesTabProps {
  rules: BlockRule[];
  onEdit: (rule: BlockRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

const ApplyingRulesTab: React.FC<ApplyingRulesTabProps> = ({
  rules,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const [filter, setFilter] = useState<string>("");

  // Filter rules based on search input
  const filteredRules = rules.filter((rule) => {
    // Ensure domain exists and is a string
    const domain = rule.domain || '';
    return domain.toLowerCase().includes(filter.toLowerCase());
  });

  // Separate active and inactive rules
  const activeRules = filteredRules.filter((rule) => rule.active === true);
  const inactiveRules = filteredRules.filter((rule) => rule.active !== true);

  // Check if there are any rules at all
  const hasNoRules = rules.length === 0;

  if (hasNoRules) {
    return (
      <div className="flex flex-col items-center justify-center py-4 px-3">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-2">No Rules Yet</h2>

          <p className="text-sm text-gray-600 mb-4">
            Create your first rule to start managing distracting websites.
          </p>

          <div className="bg-white p-3 rounded border border-gray-200 mb-4 text-sm">
            <h3 className="font-medium text-gray-800 mb-2">Quick Start:</h3>
            <ol className="text-left space-y-1 text-gray-600 pl-5 list-decimal">
              <li>Go to the <span className="font-medium text-blue-600">Add Rule</span> tab</li>
              <li>Enter a website domain you want to manage</li>
              <li>Choose how you want to block or limit access</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Filter */}
      <div className="mb-3">
        <div className="relative">
          <input
            type="text"
            className="w-full py-1.5 pl-8 pr-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search rules..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Rules Count Summary */}
      <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
        <div>
          <span className="font-medium">{rules.length}</span> total rule{rules.length !== 1 ? 's' : ''}
        </div>
        <div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 mr-1">
            <span className="font-medium">{activeRules.length}</span> active
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
            <span className="font-medium">{inactiveRules.length}</span> inactive
          </span>
        </div>
      </div>

      {/* Active Rules */}
      {activeRules.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Active Rules
            </h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {activeRules.length} {activeRules.length === 1 ? 'rule' : 'rules'}
            </span>
          </div>
          
          <div className="bg-green-50 p-2 rounded border border-green-100 mb-2">
            <div className="text-xs text-green-700 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              These rules are currently being enforced
            </div>
          </div>
          
          <div className="space-y-3">
            {activeRules.map((rule) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Rules */}
      {inactiveRules.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 text-gray-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm4-3a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Inactive Rules
          </h3>
          <div className="space-y-1.5">
            {inactiveRules.map((rule) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Rules Found */}
      {filteredRules.length === 0 && filter !== "" && (
        <div className="text-center py-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-gray-500">No rules found matching "{filter}"</p>
          <button 
            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
            onClick={() => setFilter("")}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty States - Only show if not filtering */}
      {filter === "" && (
        <>
          {activeRules.length === 0 && (
            <div className="mb-4 p-3 border border-gray-100 rounded bg-gray-50 text-center">
              <p className="text-xs text-gray-500">No active rules</p>
            </div>
          )}
          
          {inactiveRules.length === 0 && (
            <div className="p-3 border border-gray-100 rounded bg-gray-50 text-center">
              <p className="text-xs text-gray-500">No inactive rules</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApplyingRulesTab;
