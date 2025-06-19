import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import DashboardHeader from './dashboard/DashboardHeader';
import EventParser from './dashboard/EventParser';
import FamilySchedule from './dashboard/FamilySchedule';
import QuickActions from './dashboard/QuickActions';
import VoiceInput from './dashboard/VoiceInput';
import DocumentUpload from './dashboard/DocumentUpload';
import AIAssistant from './dashboard/AIAssistant';
import TokenManager from './dashboard/TokenManager';
import DataProcessor from './dashboard/DataProcessor';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { events, loading: eventsLoading, addEvent, updateEvent, deleteEvent } = useEvents();
  const [activeTab, setActiveTab] = useState<'schedule' | 'parser' | 'voice' | 'documents' | 'assistant' | 'processor'>('schedule');

  if (profileLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading your family dashboard...</p>
        </div>
      </div>
    );
  }

  const handleAddEvent = async (eventData: any) => {
    try {
      await addEvent({
        title: eventData.title,
        description: eventData.description || '',
        event_date: eventData.date,
        event_time: eventData.time,
        location: eventData.location,
        attendees: eventData.attendees || [],
        event_type: eventData.type || 'personal',
        has_conflict: eventData.hasConflict || false,
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: any) => {
    try {
      await updateEvent(eventId, {
        title: updates.title,
        description: updates.description,
        event_date: updates.date,
        event_time: updates.time,
        location: updates.location,
        attendees: updates.attendees,
        event_type: updates.type,
        has_conflict: updates.hasConflict,
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleEventExtracted = (extractedEvents: any[]) => {
    extractedEvents.forEach(event => {
      handleAddEvent({
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        attendees: event.attendees || [],
        type: event.type === 'meeting' ? 'school' : 
              event.title.toLowerCase().includes('sports') ? 'sports' : 'school',
        description: event.description
      });
    });
  };

  // Transform database events to component format
  const transformedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: event.event_date,
    time: event.event_time,
    location: event.location,
    attendees: event.attendees,
    type: event.event_type,
    hasConflict: event.has_conflict,
    description: event.description,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader user={profile} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl p-2 shadow-lg">
              <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    activeTab === 'schedule'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveTab('processor')}
                  className={`flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    activeTab === 'processor'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="hidden sm:inline">AI Processor</span>
                  <span className="sm:hidden">AI</span>
                </button>
                <button
                  onClick={() => setActiveTab('parser')}
                  className={`flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    activeTab === 'parser'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="hidden sm:inline">Smart Parser</span>
                  <span className="sm:hidden">Parser</span>
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    activeTab === 'voice'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Voice
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    activeTab === 'documents'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="hidden sm:inline">Documents</span>
                  <span className="sm:hidden">Docs</span>
                </button>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-colors text-sm sm:text-base ${
                    activeTab === 'assistant'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="hidden sm:inline">AI Assistant</span>
                  <span className="sm:hidden">Chat</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {activeTab === 'schedule' && (
                <FamilySchedule 
                  events={transformedEvents}
                  onAddEvent={handleAddEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}
              {activeTab === 'processor' && (
                <DataProcessor 
                  onEventExtracted={handleEventExtracted}
                  className="border-0 shadow-none rounded-none"
                />
              )}
              {activeTab === 'parser' && (
                <EventParser onAddEvent={handleAddEvent} />
              )}
              {activeTab === 'voice' && (
                <VoiceInput onAddEvent={handleAddEvent} />
              )}
              {activeTab === 'documents' && (
                <DocumentUpload onAddEvent={handleAddEvent} />
              )}
              {activeTab === 'assistant' && (
                <AIAssistant events={transformedEvents} user={profile} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <TokenManager />
            <QuickActions 
              events={transformedEvents}
              onAddEvent={handleAddEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;