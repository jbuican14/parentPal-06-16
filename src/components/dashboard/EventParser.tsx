import React, { useState } from 'react';
import { Zap, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Copy, Sparkles } from 'lucide-react';
import { FamilyEvent } from '../Dashboard';
import { aiService, ParsedEvent } from '../../services/ai-service';

interface EventParserProps {
  onAddEvent: (event: Omit<FamilyEvent, 'id'>) => void;
}

const EventParser: React.FC<EventParserProps> = ({ onAddEvent }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const sampleEmails = [
    {
      title: "School Field Trip Email",
      content: `Dear Parents,

The 4th grade class will be going on a field trip to the Science Museum on Friday, March 15th, 2024. We will depart from school at 9:00 AM and return by 3:00 PM.

Please ensure your child brings:
- Packed lunch
- Permission slip (due by March 13th)
- Comfortable walking shoes

Location: Natural History Museum, 123 Museum Drive, Downtown

Contact Mrs. Johnson at 555-0123 with any questions.

Best regards,
Washington Elementary School`
    },
    {
      title: "Parent-Teacher Conference",
      content: `Hello Ms. Smith,

I hope this email finds you well. I would like to schedule a parent-teacher conference to discuss Emma's progress this semester.

Available time slots:
- Tuesday, March 19th at 3:30 PM
- Wednesday, March 20th at 4:00 PM  
- Thursday, March 21st at 2:15 PM

Please let me know which time works best for you. The meeting will be held in Room 204.

Thank you,
Mr. Davis
5th Grade Teacher`
    },
    {
      title: "Soccer Team Newsletter",
      content: `Team Lightning Parents,

Upcoming games and events:

Saturday, March 23rd - Game vs Eagles at 10:00 AM, Lincoln Park Field #2
Wednesday, March 27th - Practice at 4:00 PM, Lincoln Park Field #1
Saturday, March 30th - Tournament at Riverside Complex, games start at 8:00 AM

Team dinner: Friday, April 5th at 6:00 PM at Mario's Pizza
Please RSVP by April 1st.

Coach Mike`
    }
  ];

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setParsedEvents([]);
    setError('');
    
    try {
      const response = await aiService.parseEvents(inputText);
      
      if (response.success && response.data) {
        setParsedEvents(response.data);
        const avgConfidence = response.data.reduce((sum, event) => sum + event.confidence, 0) / response.data.length;
        setConfidence(avgConfidence * 100);
      } else {
        setError(response.error || 'Failed to parse events');
      }
    } catch (error: any) {
      console.error('Error parsing events:', error);
      setError('An error occurred while parsing events. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSampleClick = (sample: typeof sampleEmails[0]) => {
    setInputText(sample.content);
    setParsedEvents([]);
    setConfidence(0);
    setError('');
  };

  const addEventToCalendar = (event: ParsedEvent) => {
    const familyEvent: Omit<FamilyEvent, 'id'> = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      attendees: event.attendees,
      type: event.type === 'meeting' ? 'school' : 
            event.title.toLowerCase().includes('soccer') ? 'sports' : 'school',
      description: event.description
    };
    
    onAddEvent(familyEvent);
    
    // Show success feedback
    const button = document.querySelector(`[data-event-title="${event.title}"]`) as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Added!';
      button.disabled = true;
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'deadline':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'meeting':
        return <Clock className="w-5 h-5 text-green-600" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-blue-50 border-blue-200';
      case 'deadline':
        return 'bg-orange-50 border-orange-200';
      case 'meeting':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Zap className="w-6 h-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Smart Event Parser</h2>
        <div className="ml-auto flex items-center text-sm text-gray-600">
          <Sparkles className="w-4 h-4 mr-1" />
          AI-Powered
        </div>
      </div>

      {/* Enhanced Description */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-indigo-900 mb-2">How it works</h3>
        <p className="text-indigo-800 text-sm mb-3">
          Paste any text containing event information and our AI will automatically extract dates, times, locations, and create calendar events for your family.
        </p>
        <div className="text-xs text-indigo-700">
          ✓ School emails & newsletters • ✓ Sports schedules • ✓ Medical appointments • ✓ Permission slips
        </div>
      </div>

      {/* Sample Emails */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Try with sample content:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {sampleEmails.map((sample, index) => (
            <button
              key={index}
              onClick={() => handleSampleClick(sample)}
              className="p-3 text-sm bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">{sample.title}</div>
              <div className="text-gray-600 text-xs">Click to load sample</div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="email-content" className="block text-sm font-medium text-gray-700">
            Paste your content here:
          </label>
          <button
            onClick={() => navigator.clipboard.readText().then(text => setInputText(text))}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            <Copy className="w-4 h-4 mr-1" />
            Paste from clipboard
          </button>
        </div>
        <textarea
          id="email-content"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Paste your school email, newsletter, sports schedule, or any text containing event information..."
        />
        <div className="mt-2 text-right text-sm text-gray-500">
          {inputText.length} characters
        </div>
      </div>

      {/* Parse Button */}
      <div className="mb-6">
        <button
          onClick={handleParse}
          disabled={!inputText.trim() || isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing with AI...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Parse Events
            </>
          )}
        </button>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <h3 className="font-semibold text-blue-800">AI Processing in Progress</h3>
              <p className="text-blue-700 text-sm">Analyzing text patterns, extracting dates and events...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {parsedEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {parsedEvents.length} event{parsedEvents.length > 1 ? 's' : ''}
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              {confidence.toFixed(0)}% confidence
            </div>
          </div>
          
          <div className="space-y-4">
            {parsedEvents.map((event, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${getEventColor(event.type)} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getEventIcon(event.type)}
                    <h4 className="font-semibold text-gray-900 ml-2">{event.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border capitalize">
                      {event.type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full border">
                      {(event.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {event.date}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {event.time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <p className="mt-2 text-gray-700">{event.description}</p>
                  {event.attendees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.attendees.map((attendee, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-1 rounded-full border">
                          {attendee}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => addEventToCalendar(event)}
                    data-event-title={event.title}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Add to Calendar
                  </button>
                  <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Set Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isProcessing && !error && inputText.trim() && parsedEvents.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">No events detected</h3>
          <p className="text-gray-600 text-sm">
            Try pasting content with clear dates, times, and event information. 
            Our AI works best with structured text like emails and newsletters.
          </p>
        </div>
      )}
    </div>
  );
};

export default EventParser;