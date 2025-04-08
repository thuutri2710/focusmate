import React, { useState, useEffect } from 'react';
import { TimeUsage, BlockRule } from '../../types';
import { StorageService } from '../../services/storage';
import { formatTime } from '../../utils/uiUtils';

interface TimeUsageSummary {
  totalTime: number;
  mostVisited: { domain: string; time: number }[];
  mostBlocked: { domain: string; count: number }[];
}

interface StatsTabProps {
  onResetStats: () => void;
}

const StatsTab: React.FC<StatsTabProps> = ({ onResetStats }) => {
  const [timeUsage, setTimeUsage] = useState<TimeUsage>({});
  const [rules, setRules] = useState<BlockRule[]>([]);
  const [lastReset, setLastReset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<TimeUsageSummary>({ 
    totalTime: 0,
    mostVisited: [],
    mostBlocked: [] 
  });

  // Load stats when component mounts
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const [usage, allRules, resetTime] = await Promise.all([
          StorageService.getAllTimeUsage(),
          StorageService.getAllRules(),
          StorageService.getLastResetTime()
        ]);
        
        setTimeUsage(usage);
        setRules(allRules);
        setLastReset(resetTime);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate summary statistics
  useEffect(() => {
    if (!isLoading) {
      const domains = Object.entries(timeUsage);
      const totalTime = domains.reduce((sum, [, time]) => sum + time, 0);
      const sortedByTime = [...domains].sort(([, a], [, b]) => b - a);
      const mostVisited = sortedByTime.slice(0, 5).map(([domain, time]) => ({ domain, time }));
      
      const blockedDomains = rules
        .filter(rule => rule.active)
        .map(rule => rule.domain);
      const mostBlocked = blockedDomains
        .map(domain => ({
          domain,
          count: timeUsage[domain] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setSummary({
        totalTime,
        mostVisited,
        mostBlocked
      });
    }
  }, [timeUsage, rules, isLoading]);

  // Sort domains by time spent
  const sortedDomains = Object.entries(timeUsage)
    .sort(([, timeA], [, timeB]) => timeB - timeA);

  // Format last reset time
  const formatLastReset = () => {
    if (!lastReset) return 'Never';
    return new Date(lastReset).toLocaleString();
  };

  // Check if a domain has an active rule
  const getDomainRule = (domain: string) => {
    return rules.find(rule => 
      rule.active && rule.domain === domain
    );
  };

  return (
    <div>
      {/* Header with Reset Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Usage Statistics</h3>
        <button
          onClick={onResetStats}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
        >
          Reset Stats
        </button>
      </div>
      
      {/* Last Reset Time */}
      <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last reset: {formatLastReset()}
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">
          <svg className="animate-spin h-6 w-6 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2">Loading statistics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-700 mb-2">Total Time</h4>
              <p className="text-2xl font-bold text-blue-800">{formatTime(summary.totalTime)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-700 mb-2">Sites Tracked</h4>
              <p className="text-2xl font-bold text-purple-800">{sortedDomains.length}</p>
            </div>
          </div>

          {/* Most Visited Sites */}
          {summary.mostVisited.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Visited Sites</h4>
              <div className="space-y-3">
                {summary.mostVisited.map(({ domain, time }, index) => (
                  <div key={domain} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">{domain}</span>
                        <span className="text-sm text-gray-500">{formatTime(time)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${(time / summary.totalTime) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Stats */}
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Statistics</h4>
            <div className="space-y-3">
              {sortedDomains.map(([domain, time]) => {
                const rule = getDomainRule(domain);
                const hasTimeLimit = rule?.mode === 'time_limit' && rule?.timeLimit;
                const timePercentage = hasTimeLimit 
                  ? Math.min(100, (time / rule!.timeLimit!) * 100) 
                  : 0;
                
                return (
                  <div key={domain} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{domain}</span>
                        {rule && (
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            rule.mode === 'block' ? 'bg-red-100 text-red-700' :
                            rule.mode === 'time_limit' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rule.mode}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-700 font-medium">{formatTime(time)}</div>
                    </div>
                    
                    {hasTimeLimit && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Time Used</span>
                          <span>{formatTime(time)} / {formatTime(rule!.timeLimit!)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              timePercentage >= 90 ? 'bg-red-500' : 
                              timePercentage >= 75 ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${timePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsTab;
