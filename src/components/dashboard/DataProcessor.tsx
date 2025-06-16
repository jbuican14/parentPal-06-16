import React, { useState, useCallback } from 'react';
import { Upload, Mic, Type, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { aiAgentClient } from '../../services/ai-agent-client';

interface ProcessingJob {
  id: string;
  type: 'voice' | 'document' | 'text';
  status: 'pending' | 'processing' | 'completed' | 'error';
  input: any;
  output?: any;
  error?: string;
  tokensUsed?: number;
  startTime: Date;
  endTime?: Date;
}

interface DataProcessorProps {
  onEventExtracted: (events: any[]) => void;
  className?: string;
}

const DataProcessor: React.FC<DataProcessorProps> = ({ onEventExtracted, className = '' }) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const createJob = (type: ProcessingJob['type'], input: any): ProcessingJob => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      status: 'pending',
      input,
      startTime: new Date()
    };
  };

  const updateJob = (id: string, updates: Partial<ProcessingJob>) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ));
  };

  const processVoiceData = useCallback(async (audioBlob: Blob) => {
    const job = createJob('voice', { audioBlob, size: audioBlob.size });
    setJobs(prev => [job, ...prev]);

    try {
      updateJob(job.id, { status: 'processing' });
      
      const result = await aiAgentClient.processVoiceData(audioBlob, {
        language: 'en-US',
        extractEvents: true
      });

      updateJob(job.id, {
        status: 'completed',
        output: result,
        endTime: new Date(),
        tokensUsed: result.tokenUsage?.tokensUsed
      });

      if (result.events && result.events.length > 0) {
        onEventExtracted(result.events);
      }

    } catch (error: any) {
      updateJob(job.id, {
        status: 'error',
        error: error.message,
        endTime: new Date()
      });
    }
  }, [onEventExtracted]);

  const processDocument = useCallback(async (file: File) => {
    const job = createJob('document', { fileName: file.name, fileSize: file.size, fileType: file.type });
    setJobs(prev => [job, ...prev]);

    try {
      updateJob(job.id, { status: 'processing' });
      
      const result = await aiAgentClient.processDocument(file, {
        extractEvents: true,
        extractActionItems: true
      });

      updateJob(job.id, {
        status: 'completed',
        output: result,
        endTime: new Date(),
        tokensUsed: result.tokenUsage?.tokensUsed
      });

      if (result.events && result.events.length > 0) {
        onEventExtracted(result.events);
      }

    } catch (error: any) {
      updateJob(job.id, {
        status: 'error',
        error: error.message,
        endTime: new Date()
      });
    }
  }, [onEventExtracted]);

  const processText = useCallback(async (text: string, operation: string = 'parse_events') => {
    const job = createJob('text', { text: text.substring(0, 100) + '...', length: text.length });
    setJobs(prev => [job, ...prev]);

    try {
      updateJob(job.id, { status: 'processing' });
      
      const result = await aiAgentClient.processText(text, operation, {
        extractEvents: true
      });

      updateJob(job.id, {
        status: 'completed',
        output: result,
        endTime: new Date(),
        tokensUsed: result.tokenUsage?.tokensUsed
      });

      if (result.events && result.events.length > 0) {
        onEventExtracted(result.events);
      }

    } catch (error: any) {
      updateJob(job.id, {
        status: 'error',
        error: error.message,
        endTime: new Date()
      });
    }
  }, [onEventExtracted]);

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        processVoiceData(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Store recorder reference for stopping
      (window as any).currentRecorder = mediaRecorder;

    } catch (error: any) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      setIsRecording(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        processDocument(file);
      });
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => {
        processDocument(file);
      });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // Text Processing
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processText(textInput.trim());
      setTextInput('');
    }
  };

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Zap className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Data Processor</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Process voice, documents, and text to extract calendar events
        </p>
      </div>

      {/* Input Methods */}
      <div className="p-4 space-y-4">
        {/* Voice Input */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Mic className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-900">Voice Input</span>
            </div>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            {isRecording 
              ? 'Recording... Speak about your events and appointments'
              : 'Click to start recording voice notes about events'
            }
          </p>
        </div>

        {/* Document Upload */}
        <div 
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragActive 
              ? 'border-indigo-400 bg-indigo-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Upload Documents</h4>
            <p className="text-sm text-gray-600 mb-3">
              Drag and drop files here, or click to browse
            </p>
            <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors">
              Choose Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Text Input */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Type className="w-5 h-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">Text Input</span>
          </div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste email content, schedules, or any text containing event information..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {textInput.length} characters
            </span>
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Process Text
            </button>
          </div>
        </div>
      </div>

      {/* Processing Jobs */}
      {jobs.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Processing Queue</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {jobs.map((job) => (
              <div key={job.id} className={`border rounded-lg p-3 ${getStatusColor(job.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(job.status)}
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {job.type} Processing
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDuration(job.startTime, job.endTime)}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-1">
                  {job.type === 'voice' && `Audio: ${(job.input.size / 1024).toFixed(1)}KB`}
                  {job.type === 'document' && `File: ${job.input.fileName} (${(job.input.fileSize / 1024).toFixed(1)}KB)`}
                  {job.type === 'text' && `Text: ${job.input.text} (${job.input.length} chars)`}
                </div>

                {job.status === 'completed' && job.output && (
                  <div className="text-sm text-green-700">
                    ✓ Extracted {job.output.events?.length || 0} events
                    {job.tokensUsed && ` • Used ${job.tokensUsed} tokens`}
                  </div>
                )}

                {job.status === 'error' && (
                  <div className="text-sm text-red-700">
                    ✗ Error: {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataProcessor;