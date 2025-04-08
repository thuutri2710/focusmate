import React, { useEffect, useState } from 'react';
import { BlockRule, MessageType } from '../../types';

interface MatchedRule {
  url: string;
  rule: BlockRule;
  matchTime: number;
  matchReason: string;
}

const RuleMatchesTab: React.FC = () => {
  const [matchedRules, setMatchedRules] = useState<MatchedRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial matched rules
    chrome.runtime.sendMessage(
      { type: MessageType.GET_MATCHED_RULES },
      (response) => {
        if (response && response.success) {
          setMatchedRules(response.data || []);
        }
        setLoading(false);
      }
    );

    // Listen for new rule matches
    const handleRuleMatched = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      if (message.type === MessageType.RULE_MATCHED) {
        setMatchedRules(message.payload.matchedRules || []);
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleRuleMatched);

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuleMatched);
    };
  }, []);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading rule matches...</p>
      </div>
    );
  }

  if (matchedRules.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">No rule matches detected yet.</p>
        <p className="text-gray-500 text-sm mt-2">
          Visit websites to see if your rules match them.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Recent Rule Matches</h2>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {matchedRules.map((match, index) => (
          <div
            key={index}
            className={`border rounded-md p-3 text-sm ${
              match.matchReason.includes('exceeded') || match.matchReason.includes('block')
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{formatUrl(match.url)}</span>
              <span className="text-xs text-gray-500">{formatTime(match.matchTime)}</span>
            </div>
            <div className="mt-1">
              <div>
                <span className="text-gray-600">Rule: </span>
                <span>{match.rule.domain}</span>
              </div>
              <div>
                <span className="text-gray-600">Status: </span>
                <span className={match.matchReason.includes('exceeded') || match.matchReason.includes('block mode') ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {match.matchReason}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RuleMatchesTab;
