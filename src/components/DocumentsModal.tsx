import { useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { BsFileEarmarkText } from 'react-icons/bs';
import { FiCheckCircle, FiSend } from 'react-icons/fi';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseName: string;
}

const DocumentsModal = ({ isOpen, onClose, caseId, caseName }: DocumentsModalProps) => {
  const [activeTab, setActiveTab] = useState<'documents' | 'received'>('documents');
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  if (!isOpen) return null;

  // Sample documents data
  const documents = [
    {
      id: 1,
      name: 'Medical consent form.docx',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Statement_form.docx',
      status: 'completed'
    },
    {
      id: 3,
      name: 'Video interview consent form.docx',
      status: 'pending'
    },
    {
      id: 4,
      name: 'Child abduction notice.docx',
      status: 'pending'
    },
    {
      id: 5,
      name: 'Child abduction parent/guardian Proforma statement.docx',
      status: 'pending'
    }
  ];

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center p-4">
        <button onClick={onClose} className="text-black mr-3">
          <FiArrowLeft size={20} />
        </button>
        <span className="text-base">Back</span>
      </div>

      {/* Tabs */}
      <div className="flex px-4">
        <div className="bg-white rounded-full flex w-full shadow-sm">
          <button 
            className={`flex-1 py-3 px-6 rounded-full text-center ${
              activeTab === 'documents' 
                ? 'bg-[#4263EB] text-white' 
                : 'text-gray-800'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button 
            className={`flex-1 py-3 px-6 rounded-full text-center ${
              activeTab === 'received' 
                ? 'bg-[#4263EB] text-white' 
                : 'text-gray-800'
            }`}
            onClick={() => setActiveTab('received')}
          >
            Recieved
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="px-4 mt-4">
        {activeTab === 'documents' ? (
          // Documents tab content
          documents.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg mb-2 shadow-sm border border-gray-100"
            >
              <div className="flex items-center">
                <BsFileEarmarkText className="text-[#4263EB] mr-3" size={20} />
                <span className="text-gray-800 text-sm font-medium">{doc.name}</span>
              </div>
              {doc.status === 'completed' ? (
                <FiCheckCircle className="text-green-500" size={20} />
              ) : (
                <FiSend className="text-[#4263EB]" size={20} />
              )}
            </div>
          ))
        ) : (
          // Received tab content
          <div 
            className="flex items-center justify-between p-4 bg-white rounded-lg mb-2 shadow-sm border border-gray-100"
            onClick={() => setShowPdfViewer(true)}
          >
            <div className="flex items-center">
              <BsFileEarmarkText className="text-[#4263EB] mr-3" size={20} />
              <span className="text-gray-800 text-sm font-medium">Statement_form.docx</span>
            </div>
            <FiCheckCircle className="text-green-500" size={20} />
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {showPdfViewer && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
            <div className="flex items-center">
              <button onClick={() => setShowPdfViewer(false)} className="text-white mr-4">
                <FiArrowLeft size={24} />
              </button>
              <h3 className="text-lg">HUANG WANSHAN</h3>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="h-[calc(100vh-64px)] bg-gray-100 p-4">
            <iframe
              src="/dummy-statement.pdf"
              className="w-full h-full bg-white"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsModal;
