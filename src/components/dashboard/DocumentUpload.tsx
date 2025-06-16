import React, { useState } from 'react';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Calendar, Download } from 'lucide-react';

interface UploadedDocument {
  id: string;
  name: string;
  type: 'email' | 'flyer' | 'form' | 'newsletter';
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  extractedEvents?: {
    title: string;
    date: string;
    time: string;
    location: string;
  }[];
  summary?: string;
}

const DocumentUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([
    {
      id: '1',
      name: 'School_Newsletter_March_2024.pdf',
      type: 'newsletter',
      uploadDate: '2 hours ago',
      status: 'completed',
      summary: 'Spring events schedule including field trips, conferences, and sports activities',
      extractedEvents: [
        {
          title: 'Spring Break',
          date: 'March 25-29, 2024',
          time: 'All day',
          location: 'No school'
        },
        {
          title: 'Science Fair',
          date: 'April 5, 2024',
          time: '6:00 PM - 8:00 PM',
          location: 'School Gymnasium'
        }
      ]
    },
    {
      id: '2',
      name: 'Field_Trip_Permission_Slip.jpg',
      type: 'form',
      uploadDate: '1 day ago',
      status: 'completed',
      summary: 'Permission slip for museum field trip with deadline and requirements',
      extractedEvents: [
        {
          title: 'Museum Field Trip',
          date: 'March 15, 2024',
          time: '9:00 AM - 3:00 PM',
          location: 'Natural History Museum'
        },
        {
          title: 'Permission Slip Deadline',
          date: 'March 13, 2024',
          time: 'End of day',
          location: 'School Office'
        }
      ]
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
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update with processed results
      setUploadedDocs(prev => prev.map(doc => 
        doc.id === newDoc.id 
          ? {
              ...doc,
              status: 'completed',
              summary: 'Document processed successfully with event information extracted',
              extractedEvents: [
                {
                  title: 'Sample Event from ' + file.name,
                  date: 'March 20, 2024',
                  time: '10:00 AM',
                  location: 'Location TBD'
                }
              ]
            }
          : doc
      ));
    }
    
    setIsUploading(false);
    // Reset file input
    event.target.value = '';
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

              {doc.summary && (
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">{doc.summary}</p>
                </div>
              )}

              {doc.extractedEvents && doc.extractedEvents.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Extracted Events:</h5>
                  {doc.extractedEvents.map((event, index) => (
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
                          </div>
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  ))}
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