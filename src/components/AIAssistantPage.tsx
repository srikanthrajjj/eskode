import React from 'react';
import { ArrowLeft } from 'lucide-react';
import AIAssistant from './AIAssistant';

interface AIAssistantPageProps {
  onBack: () => void;
}

const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <AIAssistant position="fullscreen" onClose={onBack} />
        </main>
      </div>
    </div>
  );
};

export default AIAssistantPage;
