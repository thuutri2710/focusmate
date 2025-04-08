import React from 'react';
import { BlockRule, BlockingMode } from '../../types';
import { formatTime } from '../../utils/uiUtils';
import { DAY_LABELS } from '../../constants';

interface RuleItemProps {
  rule: BlockRule;
  onEdit: (rule: BlockRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onEdit, onDelete, onToggle }) => {
  // Format rule details based on mode
  const getRuleDetails = () => {
    switch (rule.mode) {
      case BlockingMode.TIME_LIMIT:
        return rule.timeLimit ? (
          <span className="text-xs text-gray-500">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {formatTime(rule.timeLimit)}/day
            </span>
          </span>
        ) : null;
      
      case BlockingMode.SCHEDULE:
        if (!rule.schedule) return null;
        
        const days = rule.schedule.days.map(day => DAY_LABELS[day]).join(', ');
        
        return (
          <span className="text-xs text-gray-500">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {days}
            </span>
          </span>
        );
      
      default:
        return (
          <span className="text-xs text-gray-500">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
              Always blocked
            </span>
          </span>
        );
    }
  };

  return (
    <div className={`rounded border ${rule.active ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
      {/* Header with domain and actions */}
      <div className="px-3 py-2 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center">
          {rule.active && (
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" title="Active"></div>
          )}
          <div className="font-medium text-sm">{rule.domain}</div>
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          <button
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            onClick={() => onEdit(rule)}
            title="Edit rule"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            onClick={() => onDelete(rule.id)}
            title="Delete rule"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className={`p-1 transition-colors ${rule.active ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => onToggle(rule.id, !rule.active)}
            title={rule.active ? 'Deactivate rule' : 'Activate rule'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              {rule.active ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm4-3a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Details section */}
      <div className="px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {getRuleDetails()}
          
          {/* Created date */}
          <span className="text-xs text-gray-400">
            Created: {new Date(rule.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RuleItem;
