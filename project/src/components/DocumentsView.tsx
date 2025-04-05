import React, { useState } from 'react';
import { FileText, Image as ImageIcon, File, AArrowDown as Pdf, Download, Trash2, X, Upload, Search } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  thumbnail?: string;
  caseNumber: string;
}

interface Props {
  onClose: () => void;
  caseNumber: string;
}

export default function DocumentsView({ onClose, caseNumber }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Victim Statement.pdf',
      type: 'pdf',
      size: '2.4 MB',
      lastModified: '2025-02-07T14:30:00',
      caseNumber
    },
    {
      id: '2',
      name: 'Crime Scene Photo 1.jpg',
      type: 'image',
      size: '3.1 MB',
      lastModified: '2025-02-07T14:32:00',
      thumbnail: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1',
      caseNumber
    },
    {
      id: '3',
      name: 'Investigation Report.docx',
      type: 'document',
      size: '1.8 MB',
      lastModified: '2025-02-07T15:00:00',
      caseNumber
    }
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <Pdf className="w-8 h-8 text-red-500" />;
      case 'image':
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'document':
        return <FileText className="w-8 h-8 text-blue-600" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Handle file upload logic here
      console.log('Files to upload:', files);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Documents</h2>
            <p className="text-sm text-gray-500">Case: {caseNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    getFileIcon(doc.type)
                  )}
                  <div className="flex gap-2">
                    <button 
                      className="p-1.5 hover:bg-gray-100 rounded-full"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-gray-100 rounded-full"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <h3 className="font-medium text-gray-900 mb-1 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{doc.size}</span>
                  <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}