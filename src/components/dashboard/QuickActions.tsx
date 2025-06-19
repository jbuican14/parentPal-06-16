import React, { useState } from 'react';
import { Calendar, Clock, Bell, Users, MessageCircle, Settings, Plus, AlertTriangle } from 'lucide-react';
import { FamilyEvent } from '../Dashboard';

interface QuickActionsProps {
  events: FamilyEvent[];
  onAddEvent: (event: Omit<FamilyEvent, 'id'>) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ events, onAddEvent }) => {
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const quickActions = [
    {
      icon: Calendar,
      title: 'Add Event',
      description: 'Create a new family event',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      action: () => setShowAddEventModal(true)
    },
    {
      icon: Bell,
      title: 'Set Reminder',
      description: 'Never forget important dates',
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      action: () => alert('Reminder feature coming soon!')
    },
    {
      icon: Users,
      title: 'Family Members',
      description: 'Manage family profiles',
      color: 'bg-green-50 border-green-200 text-green-700',
      action: () => alert('Family management coming soon!')
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Ask about your schedule',
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      action: () => alert('Switch to AI Assistant tab to chat!')
    }
  ];

  const getUpcomingEvents = () => {
    return events
      .filter(event => event.date === 'Today' || event.date === 'Tomorrow')
      .sort((a, b) => {
        if (a.date === 'Today' && b.date === 'Tomorrow') return -1;
        if (a.date === 'Tomorrow' && b.date === 'Today') return 1;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 3);
  };

  const getConflictCount = () => {
    return events.filter(event => event.hasConflict).length;
  };

  const upcomingEvents = getUpcomingEvents();
  const conflictCount = getConflictCount();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="space-y-2 sm:space-y-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`w-full p-3 sm:p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-105 ${action.color}`}
            >
              <div className="flex items-center">
                <action.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <h4 className="font-medium text-sm sm:text-base truncate">{action.title}</h4>
                  <p className="text-xs sm:text-sm opacity-75 truncate">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conflicts Alert */}
      {conflictCount > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-2" />
            <h3 className="font-semibold text-orange-800 text-sm sm:text-base">Schedule Conflicts</h3>
          </div>
          <p className="text-orange-700 text-xs sm:text-sm mb-3">
            {conflictCount} event{conflictCount > 1 ? 's have' : ' has'} scheduling conflicts that need attention.
          </p>
          <button className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm font-medium">
            Review Conflicts →
          </button>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Next Up</h3>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{event.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {event.date} at {event.time.split(' - ')[0]}
                  </p>
                </div>
                <div className="flex flex-col items-end ml-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.type === 'school' ? 'bg-blue-100 text-blue-700' :
                    event.type === 'sports' ? 'bg-green-100 text-green-700' :
                    event.type === 'medical' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {event.type}
                  </span>
                  {event.hasConflict && (
                    <AlertTriangle className="w-3 h-3 text-orange-500 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs sm:text-sm">No upcoming events</p>
        )}
      </div>

      {/* Family Status */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Family Status</h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm sm:text-base">Emma</span>
            <span className="text-xs sm:text-sm text-green-600 font-medium">At School</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm sm:text-base">Jake</span>
            <span className="text-xs sm:text-sm text-green-600 font-medium">At School</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm sm:text-base">Mom</span>
            <span className="text-xs sm:text-sm text-blue-600 font-medium">At Work</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm sm:text-base">Dad</span>
            <span className="text-xs sm:text-sm text-blue-600 font-medium">At Work</span>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">This Week</h3>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Events</span>
            <span className="font-medium">{events.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">School Events</span>
            <span className="font-medium">{events.filter(e => e.type === 'school').length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sports Activities</span>
            <span className="font-medium">{events.filter(e => e.type === 'sports').length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Medical Appointments</span>
            <span className="font-medium">{events.filter(e => e.type === 'medical').length}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
        <button className="w-full flex items-center text-gray-700 hover:text-indigo-600 transition-colors">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
          <span className="font-medium text-sm sm:text-base">Settings & Preferences</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;