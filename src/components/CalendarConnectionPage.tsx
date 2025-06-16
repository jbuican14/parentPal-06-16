import React, { useState } from 'react';
import { Calendar, Check, ArrowRight, Shield, Bell, Eye, Zap, Users } from 'lucide-react';

interface CalendarConnectionPageProps {
  onConnect: (calendarType: 'google' | 'apple') => void;
  onSkip: () => void;
}

const CalendarConnectionPage: React.FC<CalendarConnectionPageProps> = ({ onConnect, onSkip }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedType, setConnectedType] = useState<'google' | 'apple' | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);

  const handleConnect = async (type: 'google' | 'apple') => {
    setIsConnecting(true);
    setConnectionProgress(0);
    
    // Simulate connection process with progress
    const progressSteps = [
      { progress: 20, message: 'Authenticating...' },
      { progress: 50, message: 'Syncing calendar data...' },
      { progress: 80, message: 'Setting up smart features...' },
      { progress: 100, message: 'Connection complete!' }
    ];
    
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setConnectionProgress(step.progress);
    }
    
    setConnectedType(type);
    setIsConnecting(false);
    
    // Proceed to dashboard after brief delay
    setTimeout(() => {
      onConnect(type);
    }, 1500);
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
                    <p className="text-sm text-gray-500">Most popular choice</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full mr-2">
                    Recommended
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => handleConnect('apple')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center">
                  <div className="bg-gray-100 p-2 rounded-lg mr-4">
                    <Calendar className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Connect Apple Calendar</h3>
                    <p className="text-sm text-gray-500">iCloud sync</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          )}
        </div>

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