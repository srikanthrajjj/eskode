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
  MapPin,
  Clipboard
} from 'lucide-react';
import websocketService, { WebSocketMessage } from '../services/websocketService';
import PoliceChatView, { PoliceChatMessage } from './PoliceChatView';

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
  const [showTaskRequestModal, setShowTaskRequestModal] = useState(false);
  const [taskRequestMessage, setTaskRequestMessage] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCaseName, setSelectedCaseName] = useState('');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState('');
  const [selectedCrimeType, setSelectedCrimeType] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Admin chat state
  const [adminMessages, setAdminMessages] = useState<PoliceChatMessage[]>([]);
  const [showAdminChat, setShowAdminChat] = useState(false);
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);

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

  // Listen for admin messages
  useEffect(() => {
    const unsubscribe = websocketService.onMessage((message: WebSocketMessage) => {
      if (message.type === 'ADMIN_MESSAGE' && !message.payload.taskRequest) {
        console.log('Received admin message:', message.payload);

        // Add the message to the chat
        const adminMsg: PoliceChatMessage = {
          id: message.payload.id || Date.now().toString(),
          sender: 'admin',
          senderName: message.payload.senderName || 'Admin',
          message: message.payload.message,
          timestamp: message.payload.timestamp || new Date().toLocaleTimeString(),
          read: false
        };

        setAdminMessages(prev => [...prev, adminMsg]);

        // Increment unread count if chat is not open
        if (!showAdminChat) {
          setUnreadAdminMessages(prev => prev + 1);
        }
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [showAdminChat]);

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

  // Handle sending messages to admin
  const handleSendMessageToAdmin = (message: string) => {
    if (!message.trim()) return;

    // Create message object
    const newMessage: PoliceChatMessage = {
      id: Date.now().toString(),
      sender: 'officer',
      senderName: 'S. Morgan',
      message: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    // Add to local state
    setAdminMessages(prev => [...prev, newMessage]);

    // Send via WebSocket
    websocketService.sendOfficerMessage(message);
  };

  // Handle opening admin chat
  const handleOpenAdminChat = () => {
    setShowAdminChat(true);
    setUnreadAdminMessages(0);

    // Mark messages as read
    setAdminMessages(prev =>
      prev.map(msg =>
        msg.sender === 'admin' ? { ...msg, read: true } : msg
      )
    );
  };

  // Handle closing admin chat
  const handleCloseAdminChat = () => {
    setShowAdminChat(false);
  };

  // Handle sending task requests to admin
  const handleSendTaskRequest = (caseItem: any) => {
    if (!taskRequestMessage.trim()) {
      setToastMessage('Please enter task request details');
      setToastType('error');
      setShowToast(true);
      return;
    }

    console.log('Sending task request for case:', caseItem.crimeNumber);

    // Create the task request object
    const taskRequest = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      summary: taskRequestMessage,
      offence: caseItem.type || 'UNKNOWN',
      offenceColor: caseItem.typeColor || 'bg-blue-500',
      crimeNumber: caseItem.crimeNumber,
      officerInCharge: 'DC S. Morgan',
      assignedTo: 'Pending',
      status: 'Pending',
      caseId: caseItem.id,
      victimName: caseItem.victimName
    };

    // Send task request through WebSocket to admin dashboard
    websocketService.sendMessage('ADMIN_MESSAGE', {
      taskRequest: true,
      ...taskRequest,
      recipientId: 'admin-user',
      timestamp: new Date().toISOString()
    });

    // Clear the input and close the modal
    setTaskRequestMessage('');
    setShowTaskRequestModal(false);

    // Show success toast notification
    setToastMessage(`Task request sent successfully to Admin`);
    setToastType('success');
    setShowToast(true);

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
            className="relative"
            onClick={handleOpenAdminChat}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="16" cy="12" r="1"></circle>
              <circle cx="8" cy="12" r="1"></circle>
            </svg>
            {unreadAdminMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                {unreadAdminMessages}
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
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          setSelectedCaseId(case_.id);
                          setSelectedCaseName(case_.victimName);
                          setSelectedCaseNumber(case_.crimeNumber);
                          setSelectedCrimeType(case_.type);
                          setShowTaskRequestModal(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span>Request Task</span>
                      </button>
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

      {/* Task Request Modal */}
      {showTaskRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Request Task for Admin</h2>
              <button onClick={() => setShowTaskRequestModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <span className="font-medium">Case:</span>
                  <span className="ml-2">{selectedCaseName}</span>
                </div>
                <div className="flex items-center mb-2">
                  <span className="font-medium">Crime Number:</span>
                  <span className="ml-2">{selectedCaseNumber}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Crime Type:</span>
                  <span className="ml-2">{selectedCrimeType}</span>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="taskDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Details
                </label>
                <textarea
                  id="taskDetails"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the task you need assistance with..."
                  value={taskRequestMessage}
                  onChange={(e) => setTaskRequestMessage(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowTaskRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const caseItem = cases.find(c => c.id === selectedCaseId);
                    if (caseItem) {
                      handleSendTaskRequest(caseItem);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toastMessage}
        </div>
      )}

      {/* Admin Chat Modal */}
      {showAdminChat && (
        <PoliceChatView
          messages={adminMessages}
          onSendMessage={handleSendMessageToAdmin}
          onClose={handleCloseAdminChat}
        />
      )}
    </div>
  );
}

export default PoliceApp;