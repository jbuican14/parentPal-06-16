import React from 'react';
import { User } from '../../App';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface DashboardHeaderProps {
  user: User | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Parent'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your family today
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Calendar Status */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              {user?.calendarConnected ? (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    {user.calendarType === 'google' ? 'Google' : 'Apple'} Calendar
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">No calendar connected</span>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;