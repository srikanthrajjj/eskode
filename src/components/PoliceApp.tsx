import React, { useState, useEffect } from 'react';
import { 
  Menu,
  MessageSquare,
  Plus,
  Search,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  StickyNote,
  X,
  MoreVertical,
  Send,
  MapPin
} from 'lucide-react';
import websocketService from '../services/websocketService';

interface Message {
  id: string;
  sender: string;
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
  caseId?: string;
}

interface Props {
  onBack: () => void;
  messages: Message[];
  officerId: string;
}

function PoliceApp({ onBack, messages: initialMessages, officerId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('cases');
  const [expandedCases, setExpandedCases] = useState<string[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect(officerId, 'officer');

    // Update unread messages
    const unread = messages.filter(msg => !msg.read && msg.sender !== 'officer');
    setUnreadMessages(unread);

    return () => {
      // Cleanup WebSocket connection
      websocketService.disconnect();
    };
  }, [officerId, messages]);

  const handleNewCase = (caseData: any) => {
    setCases(prev => [caseData, ...prev]);
    setShowNewCaseModal(false);

    // Notify victim about new case
    websocketService.sendMessage('NEW_CASE_ADDED', {
      id: caseData.id,
      crimeNumber: caseData.crimeNumber,
      crimeType: caseData.type,
      victimName: caseData.victimName,
      officerName: 'DC S. Morgan',
      timestamp: new Date().toISOString()
    });
  };

  const toggleCaseExpansion = (caseId: string) => {
    setExpandedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="S.Morgan"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-lg font-semibold">S.Morgan</h2>
              <p className="text-sm text-gray-500">DCI 12321</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <MessageSquare className="w-6 h-6 text-gray-600" />
            {unreadMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {unreadMessages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="p-4">
        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'cases'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('cases')}
          >
            Cases
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'appointments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
        </div>

        {/* Cases list */}
        {activeTab === 'cases' && (
          <div className="space-y-4">
            {cases.map((case_, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{case_.victimName}</h3>
                    <p className="text-sm text-gray-500">{case_.crimeNumber}</p>
                  </div>
                  <button onClick={() => toggleCaseExpansion(case_.id)}>
                    {expandedCases.includes(case_.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {expandedCases.includes(case_.id) && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p>{case_.dateOfBirth}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p>{case_.address}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Crime Type</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-sm ${case_.typeColor}`}>
                        {case_.type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add New Case</h2>
              <button onClick={() => setShowNewCaseModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Add case form would go here */}
          </div>
        </div>
      )}
    </div>
  );
}

export default PoliceApp; 