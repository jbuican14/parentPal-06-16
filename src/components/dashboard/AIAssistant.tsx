import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User as UserIcon, Calendar, Clock, MapPin } from 'lucide-react';
import { User } from '../../App';
import { FamilyEvent } from '../Dashboard';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: {
    label: string;
    action: () => void;
  }[];
}

interface AIAssistantProps {
  events: FamilyEvent[];
  user: User | null;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ events, user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your ParentPal AI assistant. I can help you manage your family's schedule, answer questions about upcoming events, and provide parenting tips. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase();
    
    // Schedule-related queries
    if (message.includes('schedule') || message.includes('today') || message.includes('tomorrow')) {
      const todayEvents = events.filter(e => e.date === 'Today');
      const tomorrowEvents = events.filter(e => e.date === 'Tomorrow');
      
      if (message.includes('today')) {
        if (todayEvents.length === 0) {
          return "You don't have any events scheduled for today. Enjoy your free time!";
        }
        return `You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today:\n\n${todayEvents.map(e => `• ${e.title} at ${e.time}`).join('\n')}`;
      }
      
      if (message.includes('tomorrow')) {
        if (tomorrowEvents.length === 0) {
          return "No events scheduled for tomorrow. It's looking like a relaxed day!";
        }
        return `Tomorrow you have ${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? 's' : ''}:\n\n${tomorrowEvents.map(e => `• ${e.title} at ${e.time}`).join('\n')}`;
      }
    }
    
    // Conflict-related queries
    if (message.includes('conflict') || message.includes('overlap')) {
      const conflictEvents = events.filter(e => e.hasConflict);
      if (conflictEvents.length === 0) {
        return "Good news! I don't see any scheduling conflicts in your current calendar.";
      }
      return `I found ${conflictEvents.length} scheduling conflict${conflictEvents.length > 1 ? 's' : ''}:\n\n${conflictEvents.map(e => `• ${e.title} on ${e.date}`).join('\n')}\n\nWould you like help resolving these conflicts?`;
    }
    
    // Event-specific queries
    if (message.includes('soccer') || message.includes('practice')) {
      const soccerEvents = events.filter(e => e.title.toLowerCase().includes('soccer'));
      if (soccerEvents.length > 0) {
        const event = soccerEvents[0];
        return `Emma's soccer practice is scheduled for ${event.date} at ${event.time} at ${event.location}. Don't forget to pack water and shin guards!`;
      }
    }
    
    if (message.includes('school') || message.includes('teacher')) {
      const schoolEvents = events.filter(e => e.type === 'school');
      if (schoolEvents.length > 0) {
        return `Here are your upcoming school events:\n\n${schoolEvents.map(e => `• ${e.title} on ${e.date} at ${e.time}`).join('\n')}`;
      }
    }
    
    // Parenting tips
    if (message.includes('tip') || message.includes('advice') || message.includes('help')) {
      const tips = [
        "Here's a parenting tip: Try to establish consistent routines for better family organization. Kids thrive on predictability!",
        "Parenting tip: Use visual calendars for younger children so they can see what's coming up in their week.",
        "Remember: It's okay to say no to some activities. Family downtime is just as important as scheduled events.",
        "Tip: Prepare the night before! Lay out clothes, pack bags, and prep lunches to make mornings smoother.",
        "Consider involving kids in schedule planning - it helps them develop time management skills and feel more in control."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Default responses
    const defaultResponses = [
      "I'm here to help with your family scheduling! You can ask me about today's events, upcoming activities, or request parenting tips.",
      "I can help you manage your family calendar, resolve scheduling conflicts, and provide organization tips. What would you like to know?",
      "Feel free to ask me about your schedule, specific events, or if you need any parenting advice!",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const response = await generateResponse(inputMessage);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      suggestedActions: inputMessage.toLowerCase().includes('conflict') ? [
        {
          label: 'View Conflicts',
          action: () => alert('This would show detailed conflict view')
        },
        {
          label: 'Suggest Times',
          action: () => alert('This would suggest alternative times')
        }
      ] : undefined
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What's on my schedule today?",
    "Do I have any conflicts?",
    "What school events are coming up?",
    "Give me a parenting tip"
  ];

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-full mr-3">
            <Bot className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-600">Ask me about your family schedule</p>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-3">Quick questions to get started:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' 
                ? 'bg-indigo-600' 
                : 'bg-gray-100'
            }`}>
              {message.type === 'user' ? (
                <UserIcon className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div className={`flex-1 max-w-xs lg:max-w-md ${
              message.type === 'user' ? 'text-right' : ''
            }`}>
              <div className={`rounded-2xl px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.suggestedActions && (
                <div className="mt-2 space-x-2">
                  {message.suggestedActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your schedule..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;