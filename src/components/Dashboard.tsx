import React, { useState, useEffect } from 'react';
import { User } from '../App';
import DashboardHeader from './dashboard/DashboardHeader';
import EventParser from './dashboard/EventParser';
import FamilySchedule from './dashboard/FamilySchedule';
import QuickActions from './dashboard/QuickActions';
import VoiceInput from './dashboard/VoiceInput';
import DocumentUpload from './dashboard/DocumentUpload';
import AIAssistant from './dashboard/AIAssistant';

interface DashboardProps {
  user: User | null;
}

export interface FamilyEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string[];
  type: 'school' | 'personal' | 'medical' | 'sports';
  hasConflict?: boolean;
  description?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'parser' | 'voice' | 'documents' | 'assistant'>('schedule');
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading family data
    const loadFamilyData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock family events
      const mockEvents: FamilyEvent[] = [
        {
          id: '1',
          title: 'Soccer Practice',
          date: 'Today',
          time: '4:00 PM - 5:30 PM',
          location: 'Lincoln Park Field',
          attendees: ['Emma'],
          type: 'sports',
          description: 'Weekly soccer practice with Team Lightning'
        },
        {
          id: '2',
          title: 'Parent-Teacher Conference',
          date: 'Today',
          time: '3:30 PM - 4:00 PM',
          location: 'Room 204, Washington Elementary',
          attendees: ['Emma', 'Mom'],
          type: 'school',
          hasConflict: true,
          description: 'Quarterly progress review with Mrs. Johnson'
        },
        {
          id: '3',
          title: 'Piano Lesson',
          date: 'Tomorrow',
          time: '2:00 PM - 3:00 PM',
          location: 'Music Academy',
          attendees: ['Jake'],
          type: 'personal',
          description: 'Individual lesson with Mr. Peterson'
        },
        {
          id: '4',
          title: 'Dental Checkup',
          date: 'Tomorrow',
          time: '10:00 AM - 11:00 AM',
          location: 'Smile Dental Care',
          attendees: ['Emma'],
          type: 'medical',
          description: 'Regular cleaning and checkup'
        },
        {
          id: '5',
          title: 'Science Fair',
          date: 'Friday',
          time: '6:00 PM - 8:00 PM',
          location: 'School Gymnasium',
          attendees: ['Jake', 'Mom', 'Dad'],
          type: 'school',
          description: 'Annual science fair presentation'
        }
      ];
      
      setEvents(mockEvents);
      setIsLoading(false);
    };

    loadFamilyData();
  }, []);

  const addEvent = (newEvent: Omit<FamilyEvent, 'id'>) => {
    const event: FamilyEvent = {
      ...newEvent,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (eventId: string, updates: Partial<FamilyEvent>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ));
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700 font-medium">Loading your family dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl p-2 shadow-lg">
              <div className="flex space-x-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex-shrink-0 py-3 px-4 rounded-xl font-medium transition-colors ${
                    activeTab === 'schedule'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveTab('parser')}
                  className={`flex-shrink-0 py-3 px-4 rounded-xl font-medium transition-colors ${
                    activeTab === 'parser'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Smart Parser
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`flex-shrink-0 py-3 px-4 rounded-xl font-medium transition-colors ${
                    activeTab === 'voice'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Voice Input
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`flex-shrink-0 py-3 px-4 rounded-xl font-medium transition-colors ${
                    activeTab === 'documents'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveTab('assistant')}
                  className={`flex-shrink-0 py-3 px-4 rounded-xl font-medium transition-colors ${
                    activeTab === 'assistant'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  AI Assistant
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {activeTab === 'schedule' && (
                <FamilySchedule 
                  events={events}
                  onAddEvent={addEvent}
                  onUpdateEvent={updateEvent}
                  onDeleteEvent={deleteEvent}
                />
              )}
              {activeTab === 'parser' && (
                <EventParser onAddEvent={addEvent} />
              )}
              {activeTab === 'voice' && (
                <VoiceInput onAddEvent={addEvent} />
              )}
              {activeTab === 'documents' && (
                <DocumentUpload onAddEvent={addEvent} />
              )}
              {activeTab === 'assistant' && (
                <AIAssistant events={events} user={user} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions 
              events={events}
              onAddEvent={addEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;