import React from 'react';
import { Calendar, CheckCircle, AlertCircle, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Profile } from '../../lib/supabase';

interface DashboardHeaderProps {
  user: Profile | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              Welcome back, {user?.name || 'Parent'}!
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Here's what's happening with your family today
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Calendar Status */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              {user?.calendar_connected ? (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    <span className="hidden sm:inline">
                      {user.calendar_type === 'google' ? 'Google' : 'Apple'} Calendar
                    </span>
                    <span className="sm:hidden">Connected</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    <span className="hidden sm:inline">No calendar connected</span>
                    <span className="sm:hidden">Not connected</span>
                  </span>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center justify-between sm:justify-start space-x-3">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-full">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;