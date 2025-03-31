import { useState, useRef } from 'react';
import { FiUpload, FiFile, FiX, FiCheck, FiLoader, FiImage, FiVideo, FiFileText, FiPackage } from 'react-icons/fi';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseName: string;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  preview?: string;
  type: string;
}

const documentTypes = [
  { id: 'photo', name: 'Photos', icon: FiImage, accept: 'image/*' },
  { id: 'video', name: 'Videos', icon: FiVideo, accept: 'video/*' },
  { id: 'document', name: 'Documents', icon: FiFileText, accept: '.pdf,.doc,.docx,.txt' },
  { id: 'other', name: 'Other', icon: FiPackage, accept: '*' }
];

const DocumentsModal = ({ isOpen, onClose, caseId, caseName }: DocumentsModalProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => {
        const fileType = documentTypes.find(type => 
          type.id === selectedType && 
          (type.accept === '*' || file.type.match(type.accept))
        )?.id || 'other';

        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: 'uploading' as const,
          progress: 0,
          type: fileType,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };
      });
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Simulate upload progress
      newFiles.forEach(file => {
        simulateUpload(file.id);
      });
    }
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress }
          : f
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));
      }
    }, 500);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would typically handle the file upload to your backend
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file.file);
        formData.append('types', file.type);
      });
      formData.append('caseId', caseId);
      formData.append('caseName', caseName);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Uploading files:', uploadedFiles);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle error appropriately
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/32 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-28px w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-900">Upload Documents</h2>
          <button
            onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
              <FiX className="text-xl text-gray-500" />
          </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Document Type Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                {documentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeSelect(type.id)}
                      className={`p-4 rounded-16px border-2 text-left flex items-center gap-3 transition-all duration-200 ${
                        selectedType === type.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="text-2xl text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept={selectedType ? documentTypes.find(t => t.id === selectedType)?.accept : undefined}
            />

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3 mb-6">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white rounded-12px border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {file.preview ? (
                            <img 
                              src={file.preview} 
                              alt={file.file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <FiFile className="text-gray-400 flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.file.name}
                          </p>
                        </div>
                        {file.status === 'uploading' && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-primary-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <FiLoader className="text-primary-600 animate-spin" />
                        )}
                        {file.status === 'completed' && (
                          <FiCheck className="text-green-600" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <FiX className="text-gray-500" />
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
                  <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                type="submit"
                className="px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedType || uploadedFiles.length === 0}
                  >
                Upload
                  </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentsModal;
