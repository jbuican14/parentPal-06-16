import React, { useState } from 'react';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Calendar, Download } from 'lucide-react';
import { aiService, DocumentAnalysis } from '../../services/ai-service';

interface UploadedDocument {
  id: string;
  name: string;
  type: 'email' | 'flyer' | 'form' | 'newsletter';
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  analysis?: DocumentAnalysis;
}

interface DocumentUploadProps {
  onAddEvent: (event: any) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onAddEvent }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([
    {
      id: '1',
      name: 'School_Newsletter_March_2024.pdf',
      type: 'newsletter',
      uploadDate: '2 hours ago',
      status: 'completed',
      analysis: {
        summary: 'Spring events schedule including field trips, conferences, and sports activities',
        extractedEvents: [
          {
            title: 'Spring Break',
            date: 'March 25-29, 2024',
            time: 'All day',
            location: 'No school',
            description: 'Spring break vacation',
            type: 'event',
            attendees: [],
            confidence: 0.98
          },
          {
            title: 'Science Fair',
            date: 'April 5, 2024',
            time: '6:00 PM - 8:00 PM',
            location: 'School Gymnasium',
            description: 'Annual science fair presentation',
            type: 'event',
            attendees: [],
            confidence: 0.95
          }
        ],
        keyDates: ['March 25, 2024', 'April 5, 2024'],
        actionItems: ['Submit permission slip by March 13', 'RSVP for team dinner by April 1'],
        confidence: 0.89
      }
    },
    {
      id: '2',
      name: 'Field_Trip_Permission_Slip.jpg',
      type: 'form',
      uploadDate: '1 day ago',
      status: 'completed',
      analysis: {
        summary: 'Permission slip for museum field trip with deadline and requirements',
        extractedEvents: [
          {
            title: 'Museum Field Trip',
            date: 'March 15, 2024',
            time: '9:00 AM - 3:00 PM',
            location: 'Natural History Museum',
            description: 'Educational field trip',
            type: 'event',
            attendees: [],
            confidence: 0.92
          },
          {
            title: 'Permission Slip Deadline',
            date: 'March 13, 2024',
            time: 'End of day',
            location: 'School Office',
            description: 'Submit signed permission slip',
            type: 'deadline',
            attendees: [],
            confidence: 0.88
          }
        ],
        keyDates: ['March 13, 2024', 'March 15, 2024'],
        actionItems: ['Get permission slip signed', 'Pack lunch for field trip'],
        confidence: 0.90
      }
    }
  ]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      const newDoc: UploadedDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.includes('image') ? 'flyer' : 'email',
        uploadDate: 'Just now',
        status: 'processing'
      };
      
      setUploadedDocs(prev => [newDoc, ...prev]);
      
      try {
        // Read file content (simplified for demo)
        const content = await readFileContent(file);
        
        // Process with AI service
        const response = await aiService.analyzeDocument(content, file.name);
        
        // Update document with analysis results
        setUploadedDocs(prev => prev.map(doc => 
          doc.id === newDoc.id 
            ? {
                ...doc,
                status: response.success ? 'completed' : 'error',
                analysis: response.success ? response.data : undefined
              }
            : doc
        ));
        
      } catch (error) {
        console.error('Error processing document:', error);
        setUploadedDocs(prev => prev.map(doc => 
          doc.id === newDoc.id ? { ...doc, status: 'error' } : doc
        ));
      }
    }
    
    setIsUploading(false);
    // Reset file input
    event.target.value = '';
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // For demo purposes, return mock content based on file name
        if (file.name.toLowerCase().includes('newsletter')) {
          resolve('School newsletter with spring events, field trips, and important dates...');
        } else if (file.name.toLowerCase().includes('permission')) {
          resolve('Permission slip for field trip to museum on March 15th...');
        } else {
          resolve('Document content for AI analysis...');
        }
      };
      reader.readAsText(file);
    });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'flyer':
        return <Image className="w-5 h-5 text-green-600" />;
      case 'form':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'newsletter':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const addEventToCalendar = (event: any) => {
    const familyEvent = {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      attendees: event.attendees || [],
      type: event.type === 'deadline' ? 'school' : 
            event.title.toLowerCase().includes('sports') ? 'sports' : 'school',
      description: event.description
    };
    
    onAddEvent(familyEvent);
    alert(`Added "${event.title}" to calendar`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Upload className="w-6 h-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Document Upload</h2>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-6 text-center hover:border-indigo-400 transition-colors">
        <div className="mb-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Documents
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <div className="flex justify-center">
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition-colors">
            Choose Files
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Supports PDF, images, Word documents, and text files
        </p>
      </div>

      {/* Supported Document Types */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-indigo-900 mb-2">What can I process?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center text-indigo-700">
            <FileText className="w-4 h-4 mr-2" />
            School emails
          </div>
          <div className="flex items-center text-indigo-700">
            <Image className="w-4 h-4 mr-2" />
            Event flyers
          </div>
          <div className="flex items-center text-indigo-700">
            <FileText className="w-4 h-4 mr-2" />
            Permission slips
          </div>
          <div className="flex items-center text-indigo-700">
            <FileText className="w-4 h-4 mr-2" />
            Newsletters
          </div>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Uploads</h3>
        <div className="space-y-4">
          {uploadedDocs.map((doc) => (
            <div key={doc.id} className={`border-2 rounded-xl p-4 ${getStatusColor(doc.status)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {getDocumentIcon(doc.type)}
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                    <p className="text-sm text-gray-600">{doc.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(doc.status)}
                  <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                    {doc.status}
                  </span>
                </div>
              </div>

              {doc.analysis && (
                <>
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <h5 className="font-medium text-gray-900 mb-1">Summary</h5>
                    <p className="text-sm text-gray-700">{doc.analysis.summary}</p>
                    <div className="mt-2 text-xs text-green-600">
                      Confidence: {(doc.analysis.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  {doc.analysis.extractedEvents.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Extracted Events:</h5>
                      {doc.analysis.extractedEvents.map((event, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
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
                              onClick={() => addEventToCalendar(event)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                            >
                              Add to Calendar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {doc.analysis.actionItems.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium text-gray-900 mb-2">Action Items:</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {doc.analysis.actionItems.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {doc.status === 'error' && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-red-700 text-sm">
                    Failed to process document. Please try uploading again or check the file format.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;