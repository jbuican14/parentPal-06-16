import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, AlertTriangle, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { FamilyEvent } from '../Dashboard';

interface FamilyScheduleProps {
  events: FamilyEvent[];
  onAddEvent: (event: Omit<FamilyEvent, 'id'>) => void;
  onUpdateEvent: (eventId: string, updates: Partial<FamilyEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
}

const FamilySchedule: React.FC<FamilyScheduleProps> = ({ 
  events, 
  onAddEvent, 
  onUpdateEvent, 
  onDeleteEvent 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<FamilyEvent | null>(null);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'school':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'sports':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'medical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'personal':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'school':
        return 'School';
      case 'sports':
        return 'Sports';
      case 'medical':
        return 'Medical';
      case 'personal':
        return 'Personal';
      default:
        return 'Other';
    }
  };

  const groupEventsByDate = (events: FamilyEvent[]) => {
    const grouped = events.reduce((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {} as Record<string, FamilyEvent[]>);

    // Sort events within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  };

  const resolveConflict = (eventId: string) => {
    onUpdateEvent(eventId, { hasConflict: false });
  };

  const groupedEvents = groupEventsByDate(events);
  const conflictEvents = events.filter(e => e.hasConflict);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 mr-2" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Family Schedule</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </button>
      </div>

      {/* Conflict Alert */}
      {conflictEvents.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-2" />
            <h3 className="font-semibold text-orange-800 text-sm sm:text-base">
              {conflictEvents.length} Schedule Conflict{conflictEvents.length > 1 ? 's' : ''} Detected
            </h3>
          </div>
          <p className="text-orange-700 mt-1 text-xs sm:text-sm">
            {conflictEvents.map(e => e.title).join(', ')} {conflictEvents.length > 1 ? 'have' : 'has'} scheduling conflicts. 
            Would you like to reschedule?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {conflictEvents.map(event => (
              <button
                key={event.id}
                onClick={() => resolveConflict(event.id)}
                className="bg-orange-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Resolve {event.title}
              </button>
            ))}
            <button className="bg-white border border-orange-300 text-orange-700 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-50 transition-colors">
              Dismiss All
            </button>
          </div>
        </div>
      )}

      {/* Events by Date */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date}>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex flex-col sm:flex-row sm:items-center">
              <span>{date}</span>
              <span className="text-xs sm:text-sm font-normal text-gray-500 sm:ml-2">
                ({dateEvents.length} event{dateEvents.length > 1 ? 's' : ''})
              </span>
            </h3>
            <div className="space-y-3">
              {dateEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getEventColor(event.type)} ${
                    event.hasConflict ? 'ring-2 ring-orange-300' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>
                        {event.hasConflict && (
                          <AlertTriangle className="w-4 h-4 text-orange-500 ml-2 flex-shrink-0" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.time}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.attendees.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white rounded-full border self-start">
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setViewingEvent(event)}
                      className="bg-white border border-gray-300 text-gray-700 py-1 px-2 sm:px-3 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium flex items-center"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => setEditingEvent(event)}
                      className="bg-white border border-gray-300 text-gray-700 py-1 px-2 sm:px-3 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium flex items-center"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteEvent(event.id)}
                      className="bg-white border border-red-300 text-red-700 py-1 px-2 sm:px-3 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm font-medium flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Start by adding your first family event</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Add First Event
            </button>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{viewingEvent.title}</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{viewingEvent.date}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{viewingEvent.time}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{viewingEvent.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{viewingEvent.attendees.join(', ')}</span>
              </div>
              {viewingEvent.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{viewingEvent.description}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setViewingEvent(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewingEvent(null);
                  setEditingEvent(viewingEvent);
                }}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
              >
                Edit Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilySchedule;