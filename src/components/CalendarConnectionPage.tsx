import React, { useState, useEffect } from 'react';
import { Calendar, Check, ArrowRight, Shield, Bell, Eye, Zap, Users, AlertCircle, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { googleCalendarService } from '../services/google-calendar';
import { aiAgentClient } from '../services/ai-agent-client';

interface CalendarConnectionPageProps {
  onConnect: (calendarType: 'google' | 'apple') => void;
  onSkip: () => void;
}

const CalendarConnectionPage: React.FC<CalendarConnectionPageProps> = ({ onConnect, onSkip }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedType, setConnectedType] = useState<'google' | 'apple' | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<{
    calendar: boolean;
    aiAgent: boolean;
    tokenBalance: number;
  }>({
    calendar: false,
    aiAgent: false,
    tokenBalance: 0
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check initial connection status
    checkConnectionStatus();
    
    // Set up AI agent event listeners
    aiAgentClient.on('connected', () => {
      setConnectionStatus(prev => ({ ...prev, aiAgent: true }));
    });
    
    aiAgentClient.on('disconnected', () => {
      setConnectionStatus(prev => ({ ...prev, aiAgent: false }));
    });
    
    aiAgentClient.on('token_balance_updated', (balance: any) => {
      setConnectionStatus(prev => ({ ...prev, tokenBalance: balance.available }));
    });

    // Handle OAuth callback if present
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (code) {
      handleOAuthCallback(code);
    } else if (error) {
      setError(`OAuth error: ${error}`);
    }
  }, []);

  const checkConnectionStatus = () => {
    const calendarStatus = googleCalendarService.isConnected();
    const aiAgentStatus = aiAgentClient.isConnectedToAgent();
    const tokenBalance = aiAgentClient.getTokenBalance().available;
    
    setConnectionStatus({
      calendar: calendarStatus,
      aiAgent: aiAgentStatus,
      tokenBalance
    });
  };

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    setConnectionProgress(20);
    
    try {
      const result = await googleCalendarService.handleAuthCallback(code);
      
      if (result.success) {
        setConnectionProgress(60);
        
        // Test the connection by fetching calendars
        await googleCalendarService.getCalendars();
        setConnectionProgress(80);
        
        // Update connection status
        checkConnectionStatus();
        setConnectionProgress(100);
        
        setConnectedType('google');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
          onConnect('google');
        }, 1500);
        
      } else {
        throw new Error(result.error || 'Failed to connect to Google Calendar');
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async (type: 'google' | 'apple') => {
    if (type === 'google') {
      setError('');
      
      try {
        const authUrl = googleCalendarService.getAuthUrl();
        window.location.href = authUrl;
      } catch (error: any) {
        setError(`Failed to initiate Google Calendar connection: ${error.message}`);
      }
    } else {
      // Apple Calendar integration would go here
      setError('Apple Calendar integration coming soon!');
    }
  };

  const testAIAgentConnection = async () => {
    try {
      await aiAgentClient.processText('Test connection', 'health_check');
      alert('AI Agent connection successful!');
    } catch (error: any) {
      alert(`AI Agent connection failed: ${error.message}`);
    }
  };

  if (connectedType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-100 p-4 rounded-2xl w-fit mx-auto mb-6 animate-bounce">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Calendar Connected!
          </h1>
          <p className="text-gray-600 mb-6">
            Your {connectedType === 'google' ? 'Google' : 'Apple'} Calendar is now synced with ParentPal.
          </p>
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-indigo-900 mb-2">What's next?</h3>
            <div className="text-sm text-indigo-800 space-y-1">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Smart conflict detection is now active
              </div>
              <div className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Intelligent reminders are set up
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Family schedule sync is ready
              </div>
            </div>
          </div>
          <div className="animate-pulse">
            <p className="text-indigo-600 font-semibold">Setting up your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-2xl w-fit mx-auto mb-6">
            <Calendar className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Your Calendar
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            We'll sync with your existing calendar so nothing gets missed and enable smart family scheduling features
          </p>
        </div>

        {/* Connection Status Dashboard */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Calendar</span>
              </div>
              <div className="flex items-center">
                {connectionStatus.calendar ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <span className="ml-1 text-xs text-gray-600">
                  {connectionStatus.calendar ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">AI Agent</span>
              </div>
              <div className="flex items-center">
                {connectionStatus.aiAgent ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="ml-1 text-xs text-gray-600">
                  {connectionStatus.aiAgent ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Tokens</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-indigo-600">
                  {connectionStatus.tokenBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {connectionStatus.aiAgent && (
            <div className="mt-4">
              <button
                onClick={testAIAgentConnection}
                className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Test AI Agent Connection
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-red-800">Connection Error</h3>
            </div>
            <p className="text-red-700 mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Calendar Connection Options */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          {isConnecting ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="bg-indigo-100 p-6 rounded-full w-fit mx-auto">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connecting your calendar...
              </h3>
              <p className="text-gray-600 mb-4">This may take a few moments</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${connectionProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-indigo-600">{connectionProgress}% complete</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => handleConnect('google')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center">
                  <div className="bg-red-100 p-2 rounded-lg mr-4">
                    <Calendar className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Connect Google Calendar</h3>
                    <p className="text-sm text-gray-500">Most popular choice • OAuth2 Secure</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full mr-2">
                    Recommended
                  </span>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => handleConnect('apple')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-lg mr-4">
                    <Calendar className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Connect Apple Calendar</h3>
                    <p className="text-sm text-gray-500">iCloud sync • Coming Soon</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Why connect your calendar?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Eye className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Unified View</h4>
                <p className="text-gray-600 text-sm">See all family events in one place</p>
              </div>
            </div>
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Conflict Prevention</h4>
                <p className="text-gray-600 text-sm">Avoid double-booking automatically</p>
              </div>
            </div>
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Smart Reminders</h4>
                <p className="text-gray-600 text-sm">Get notifications before important events</p>
              </div>
            </div>
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">AI-Powered Insights</h4>
                <p className="text-gray-600 text-sm">Smart scheduling suggestions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center mb-2">
            <Shield className="w-4 h-4 text-gray-600 mr-2" />
            <h4 className="font-medium text-gray-900">Your Privacy Matters</h4>
          </div>
          <p className="text-sm text-gray-600">
            We only read your calendar data to provide smart scheduling features. 
            Your information is encrypted and never shared with third parties.
            OAuth2 secure authentication ensures your credentials stay safe.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            I'll connect my calendar later
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarConnectionPage;