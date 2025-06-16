import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, RefreshCw, BarChart3, Clock, DollarSign } from 'lucide-react';
import { aiAgentClient } from '../../services/ai-agent-client';

interface TokenManagerProps {
  className?: string;
}

const TokenManager: React.FC<TokenManagerProps> = ({ className = '' }) => {
  const [tokenBalance, setTokenBalance] = useState({
    available: 0,
    used: 0,
    limit: 0,
    resetDate: new Date()
  });
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState({
    totalUsed: 0,
    averagePerDay: 0,
    topOperations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadTokenData();
    
    // Set up real-time updates
    aiAgentClient.on('token_usage', handleTokenUsage);
    aiAgentClient.on('token_balance_updated', handleBalanceUpdate);
    
    return () => {
      aiAgentClient.off('token_usage', handleTokenUsage);
      aiAgentClient.off('token_balance_updated', handleBalanceUpdate);
    };
  }, []);

  const loadTokenData = () => {
    try {
      const balance = aiAgentClient.getTokenBalance();
      const history = aiAgentClient.getTokenUsageHistory(50);
      const stats = aiAgentClient.getTokenUsageStats();
      
      setTokenBalance(balance);
      setUsageHistory(history);
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading token data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenUsage = (usage: any) => {
    setUsageHistory(prev => [usage, ...prev.slice(0, 49)]);
    loadTokenData(); // Refresh all data
  };

  const handleBalanceUpdate = (balance: any) => {
    setTokenBalance(balance);
  };

  const getUsagePercentage = () => {
    return tokenBalance.limit > 0 ? (tokenBalance.used / tokenBalance.limit) * 100 : 0;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getDaysUntilReset = () => {
    const now = new Date();
    const reset = new Date(tokenBalance.resetDate);
    const diffTime = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Token Balance</h3>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {tokenBalance.available.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              of {tokenBalance.limit.toLocaleString()} tokens available
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUsageColor()}`}>
            {getUsagePercentage().toFixed(1)}% used
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              getUsagePercentage() >= 90 ? 'bg-red-500' :
              getUsagePercentage() >= 75 ? 'bg-orange-500' :
              getUsagePercentage() >= 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${getUsagePercentage()}%` }}
          ></div>
        </div>

        {/* Reset Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Resets in {getDaysUntilReset()} days
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {usageStats.averagePerDay.toFixed(0)} tokens/day avg
          </div>
        </div>

        {/* Warning for low balance */}
        {tokenBalance.available < 100 && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-sm text-orange-800 font-medium">Low token balance</span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Consider upgrading your plan or reducing AI usage to avoid service interruption.
            </p>
          </div>
        )}
      </div>

      {/* Detailed View */}
      {showDetails && (
        <>
          {/* Usage Statistics */}
          <div className="px-4 pb-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Usage Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-gray-900">
                  {usageStats.totalUsed.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Total Used</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-gray-900">
                  {usageStats.averagePerDay.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Daily Average</div>
              </div>
            </div>

            {/* Top Operations */}
            {usageStats.topOperations.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Top Operations</h5>
                <div className="space-y-2">
                  {usageStats.topOperations.slice(0, 3).map((op: any, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{op.operation.replace('_', ' ')}</span>
                      <div className="flex items-center">
                        <span className="text-gray-900 font-medium mr-2">
                          {op.tokens.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({op.count}x)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Usage */}
          <div className="px-4 pb-4">
            <h4 className="font-medium text-gray-900 mb-3">Recent Usage</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {usageHistory.slice(0, 10).map((usage, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {usage.operation.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(usage.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {usage.tokensUsed.toLocaleString()}
                    </div>
                    {usage.cost && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        ${usage.cost.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {usageHistory.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No usage history yet
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex space-x-2">
              <button
                onClick={loadTokenData}
                className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={() => alert('Token purchase feature coming soon!')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Buy More Tokens
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TokenManager;