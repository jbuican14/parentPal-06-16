import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User as UserIcon, Calendar, Clock, MapPin, Settings, BarChart3 } from 'lucide-react';
import { Profile } from '../../hooks/useProfile';
import { FamilyEvent } from '../Dashboard';
import { aiService, AIResponse } from '../../services/ai-service';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: {
    label: string;
    action: () => void;
  }[];
  isLoading?: boolean;
}

interface AIAssistantProps {
  events: FamilyEvent[];
  user: Profile | null;
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
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      // Use AI service to generate response
      const response: AIResponse<string> = await aiService.generateChatResponse(
        inputMessage,
        { events, user }
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.success 
          ? response.data! 
          : response.error || 'Sorry, I encountered an error. Please try again.',
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
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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

  const aiStats = aiService.getStats();

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Ask me about your family schedule</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="AI Stats"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => aiService.clearCache()}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Clear Cache"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        
        {showStats && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>Cache Size: {aiStats.cacheSize}</div>
              <div>Model: {aiStats.config.model}</div>
              <div>Rate Limit: {aiStats.config.rateLimitPerMinute}/min</div>
              <div>Status: {aiStats.isInitialized ? 'Ready' : 'Initializing'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Quick questions to get started:</p>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-xs sm:text-sm bg-indigo-50 text-indigo-700 px-2 sm:px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 sm:space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
              message.type === 'user' 
                ? 'bg-indigo-600' 
                : 'bg-gray-100'
            }`}>
              {message.type === 'user' ? (
                <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              ) : (
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              )}
            </div>
            <div className={`flex-1 max-w-xs sm:max-w-sm lg:max-w-md ${
              message.type === 'user' ? 'text-right' : ''
            }`}>
              <div className={`rounded-2xl px-3 sm:px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              {message.suggestedActions && (
                <div className="mt-2 space-x-1 sm:space-x-2">
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
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-3 sm:px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your schedule..."
            className="flex-1 border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;