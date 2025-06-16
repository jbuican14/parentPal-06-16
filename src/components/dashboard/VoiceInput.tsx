import React, { useState } from 'react';
import { Mic, MicOff, Square, Play, Pause, Calendar, Clock } from 'lucide-react';
import { aiService, ParsedEvent } from '../../services/ai-service';

interface VoiceNote {
  id: string;
  text: string;
  timestamp: string;
  duration: string;
  isProcessed: boolean;
  extractedEvents?: ParsedEvent[];
}

interface VoiceInputProps {
  onAddEvent: (event: any) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onAddEvent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([
    {
      id: '1',
      text: "Remind me to pick up Emma from soccer practice tomorrow at 5:30 PM",
      timestamp: "2 minutes ago",
      duration: "00:08",
      isProcessed: true,
      extractedEvents: [
        {
          title: "Pick up Emma from soccer practice",
          date: "Tomorrow",
          time: "5:30 PM",
          location: "Soccer Field",
          description: "Pick up from practice",
          type: "event",
          attendees: ["Emma"],
          confidence: 0.92
        }
      ]
    },
    {
      id: '2',
      text: "Jake has a piano recital this Friday at 7 PM at the music academy",
      timestamp: "5 minutes ago",
      duration: "00:12",
      isProcessed: true,
      extractedEvents: [
        {
          title: "Jake's piano recital",
          date: "Friday",
          time: "7:00 PM",
          location: "Music Academy",
          description: "Piano recital performance",
          type: "event",
          attendees: ["Jake"],
          confidence: 0.95
        }
      ]
    }
  ]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // Simulate recording timer
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Store timer reference for cleanup
    (window as any).recordingTimer = timer;
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval((window as any).recordingTimer);
    setIsProcessing(true);
    
    try {
      // Simulate voice transcription
      const mockTranscript = "Don't forget about the parent-teacher conference next Wednesday at 3 PM in room 105";
      
      // Process with AI service
      const response = await aiService.processVoiceNote(mockTranscript);
      
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        text: mockTranscript,
        timestamp: "Just now",
        duration: `00:${recordingTime.toString().padStart(2, '0')}`,
        isProcessed: true,
        extractedEvents: response.success ? response.data : []
      };
      
      setVoiceNotes(prev => [newNote, ...prev]);
    } catch (error) {
      console.error('Error processing voice note:', error);
      
      // Add note without extracted events on error
      const newNote: VoiceNote = {
        id: Date.now().toString(),
        text: "Error processing voice note",
        timestamp: "Just now",
        duration: `00:${recordingTime.toString().padStart(2, '0')}`,
        isProcessed: false
      };
      
      setVoiceNotes(prev => [newNote, ...prev]);
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addToCalendar = (event: ParsedEvent) => {
    const familyEvent = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      attendees: event.attendees,
      type: event.title.toLowerCase().includes('soccer') ? 'sports' : 
            event.title.toLowerCase().includes('school') || event.title.toLowerCase().includes('conference') ? 'school' : 'personal',
      description: event.description
    };
    
    onAddEvent(familyEvent);
    alert(`Added "${event.title}" to calendar for ${event.date} at ${event.time}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Mic className="w-6 h-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Voice Input</h2>
      </div>

      {/* Recording Interface */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
        <div className="text-center">
          <div className="mb-4">
            {!isRecording && !isProcessing ? (
              <button
                onClick={startRecording}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Mic className="w-8 h-8" />
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-full shadow-lg animate-pulse"
              >
                <Square className="w-8 h-8" />
              </button>
            ) : (
              <div className="bg-gray-200 p-6 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
          
          <div className="text-lg font-semibold text-gray-900 mb-2">
            {isRecording ? 'Recording...' : isProcessing ? 'Processing with AI...' : 'Tap to record'}
          </div>
          
          {isRecording && (
            <div className="text-2xl font-mono text-indigo-600 mb-2">
              {formatTime(recordingTime)}
            </div>
          )}
          
          <p className="text-gray-600 text-sm">
            {isRecording 
              ? 'Speak clearly about your family events and reminders'
              : isProcessing 
                ? 'Converting speech to text and extracting events...'
                : 'Tell me about appointments, events, or reminders'
            }
          </p>
        </div>
      </div>

      {/* Voice Notes History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Voice Notes</h3>
        <div className="space-y-4">
          {voiceNotes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <Mic className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{note.timestamp}</div>
                    <div className="text-xs text-gray-400">Duration: {note.duration}</div>
                  </div>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700 p-1">
                  <Play className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-gray-700 text-sm italic">"{note.text}"</p>
              </div>
              
              {note.extractedEvents && note.extractedEvents.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Extracted Events:</h5>
                  {note.extractedEvents.map((event, index) => (
                    <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h6 className="font-medium text-gray-900 mb-1">{event.title}</h6>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center mb-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              {event.date} at {event.time}
                            </div>
                            <div>{event.location}</div>
                            <div className="text-xs text-green-600 mt-1">
                              Confidence: {(event.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCalendar(event)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!note.isProcessed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-700 text-sm">Processing failed. Please try recording again.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceInput;