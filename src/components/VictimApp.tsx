import { useState, useEffect, useRef, useMemo } from 'react';
import { FiX, FiInfo, FiPhone, FiMessageSquare, FiVideo, FiFileText, FiChevronDown, FiArrowLeft, FiHelpCircle, FiSend, FiPaperclip, FiMic, FiBell, FiClipboard, FiSearch, FiPlay } from 'react-icons/fi';
import { BsCheck, BsCheckAll, BsEmojiSmile, BsFileEarmarkText } from 'react-icons/bs';
import { RiHandHeartLine } from 'react-icons/ri';
import websocketService from '../services/websocketService';
import { Toast } from './Toast';
import ChatView from './ChatView';
import DocumentsModal from './DocumentsModal';

interface VictimMessage {
  id: string;
  sender: 'victim' | 'officer';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Case {
  id: string;
  crimeNumber: string;
  crimeType: string;
  officerName: string;
  isOnline: boolean;
}

// Add VCOP update interface
interface VCOPUpdate {
  id: string;
  caseId: string;
  crimeNumber: string;
  victimName: string;
  message: string;
  timestamp: string;
  date: string;
  officerName: string;
  read: boolean;
}

// Add interface for appointment notifications
interface AppointmentNotification {
  id: string;
  type: string;
  appointmentType: string;
  date: string;
  time: string;
  caseName: string;
  caseNumber: string;
  crimeType: string;
  officerName: string;
  timestamp: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface SupportOrganization {
  id: string;
  name: string;
  logo: React.ReactNode;
  contacts: {
    call: string;
    email: string;
    website: string;
  };
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' }
];

const supportOrganizations: SupportOrganization[] = [
  {
    id: 'vs',
    name: 'Victim Support',
    logo: (
      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
        <span className="text-lg">VS</span>
      </div>
    ),
    contacts: {
      call: '#',
      email: '#',
      website: '#'
    }
  },
  {
    id: 'scope',
    name: 'Scope UK',
    logo: (
      <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      </div>
    ),
    contacts: {
      call: '#',
      email: '#',
      website: '#'
    }
  },
  {
    id: 'maggie',
    name: 'Maggie Olivers Foundation',
    logo: (
      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
    ),
    contacts: {
      call: '#',
      email: '#',
      website: '#'
    }
  },
  {
    id: 'lgbt',
    name: 'LGBT Foundation',
    logo: (
      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
        <span className="text-sm">LGBT+</span>
      </div>
    ),
    contacts: {
      call: '#',
      email: '#',
      website: '#'
    }
  },
  {
    id: 'dv',
    name: 'Domestic Violence UK',
    logo: (
      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
        </svg>
      </div>
    ),
    contacts: {
      call: '#',
      email: '#',
      website: '#'
    }
  },
  {
    id: 'rnid',
    name: 'RNID',
    logo: (
      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
        <span className="text-lg">RNID</span>
      </div>
    ),
    contacts: {
      call: '#',
      email: '#',
      website: '#'
    }
  }
];

interface VictimAppProps {
  onBack: () => void;
}

const VictimApp = ({ onBack }: VictimAppProps) => {
  const [showAlert, setShowAlert] = useState(true);
  const [showChatView, setShowChatView] = useState(false);
  const [messages, setMessages] = useState<VictimMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [vcopUpdates, setVCOPUpdates] = useState<VCOPUpdate[]>([]);
  const [hasNewVCOPUpdates, setHasNewVCOPUpdates] = useState(false);
  const [showVCOPModal, setShowVCOPModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [appointmentNotifications, setAppointmentNotifications] = useState<AppointmentNotification[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchOrg, setSearchOrg] = useState('');
  const [showWhatToExpectModal, setShowWhatToExpectModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showCrimeSummaryModal, setShowCrimeSummaryModal] = useState(false);
  const [selectedCrime, setSelectedCrime] = useState<Case | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('VictimApp: Initializing WebSocket connection');
    
    // Connect to WebSocket when the component mounts
    websocketService.connect('victim-michael', 'victim');
    
    // Set up event listeners
    const connectCallback = websocketService.onConnect(() => {
      console.log('VictimApp: Connected to WebSocket server');
      setWsConnected(true);
      
      // Request initial case data
      console.log('VictimApp: Requesting initial case data');
      websocketService.sendMessage('REQUEST_CASES', {
        victimId: 'victim-michael'
      });
    });
    
    const messageCallback = websocketService.onMessage((message) => {
      console.log('VictimApp: Received message:', message);
      
      if (message.type === 'NEW_CASE_ADDED') {
        console.log('VictimApp: Processing new case:', message.payload);
        
        // Create a new case object
        const newCase: Case = {
          id: message.payload.id,
          crimeNumber: message.payload.crimeNumber,
          crimeType: message.payload.crimeType,
          officerName: message.payload.officerName,
          isOnline: true
        };
        
        // Add the new case to the cases array
        setCases(prevCases => {
          console.log('VictimApp: Current cases:', prevCases);
          // Check if case already exists
          if (prevCases.some(c => c.id === newCase.id)) {
            console.log('VictimApp: Case already exists, skipping');
            return prevCases;
          }
          console.log('VictimApp: Adding new case:', newCase);
          return [newCase, ...prevCases]; // Add new case at the beginning
        });
        
        // Show success toast
        setToastMessage('New case has been added to your account');
        setToastType('success');
        setShowToast(true);
      }
      
      if (message.type === 'CASE_LIST') {
        console.log('VictimApp: Received case list:', message.payload);
        // Set the initial cases from the server
        const newCases = message.payload.cases.map((caseData: any) => ({
          id: caseData.id,
          crimeNumber: caseData.crimeNumber,
          crimeType: caseData.crimeType,
          officerName: caseData.officerName,
          isOnline: true
        }));
        console.log('VictimApp: Setting cases:', newCases);
        setCases(newCases);
        setIsLoading(false);
      }
      
      if (message.type === 'POLICE_TO_VICTIM_MESSAGE') {
        // Check if the message is for this victim
        if (!message.payload.recipientId || message.payload.recipientId === 'victim-michael') {
          console.log('VictimApp: Processing message from police:', message.payload);
          
          // Add message to state - ensure we mark it as unread
          const officerMessage: VictimMessage = {
            id: message.payload.id || Date.now().toString(),
            sender: 'officer',
            senderName: message.payload.senderName || 'DC S. Morgan',
            message: message.payload.message,
            timestamp: message.payload.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
          };
          
          setMessages(prev => [...prev, officerMessage]);
          
          // If we're not in the chat view, count as unread
          if (!showChatView) {
            // Could add unread count logic here if needed
          } else {
            // If in chat view, mark as read
            websocketService.sendMessage('MESSAGE_READ', {
              messageIds: [officerMessage.id],
              recipientId: 'off1' // Send read receipt to the officer
            });
          }
        } else {
          console.log('VictimApp: Ignoring message not addressed to this victim');
        }
      }
      
      if (message.type === 'MESSAGE_READ') {
        // Mark messages as read
        setMessages(prev => 
          prev.map(msg => 
            message.payload.messageIds.includes(msg.id) 
              ? { ...msg, read: true } 
              : msg
          )
        );
      }
    });
    
    const disconnectCallback = websocketService.onDisconnect(() => {
      console.log('VictimApp: Disconnected from WebSocket server');
      setWsConnected(false);
    });
    
    // Return cleanup function
    return () => {
      connectCallback();
      messageCallback();
      disconnectCallback();
    };
  }, [showChatView]);

  // Add a timeout to handle loading state
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('VictimApp: Loading timeout reached, forcing loading state to false');
        setIsLoading(false);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const handlePinSubmit = () => {
    if (pin === '0000') {
      setIsPinAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      setPinError('');
    }
  };

  // Add PIN screen before language selection
  if (!isPinAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Enter PIN</h1>
          <div className="space-y-4">
            <div className="flex justify-center">
              <input
                type="password"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                maxLength={4}
                className="text-center text-2xl tracking-widest w-48 py-2 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="••••"
              />
            </div>
            {pinError && (
              <p className="text-red-500 text-sm text-center">{pinError}</p>
            )}
            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                pin.length === 4
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Select Your Language</h1>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  console.log('VictimApp: Language selected:', lang.code);
                  setSelectedLanguage(lang.code);
                  setIsLoading(true);
                }}
                className="flex items-center space-x-2 w-full p-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200"
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-sm text-gray-900 truncate">{lang.name}</p>
                  <p className="text-xs text-gray-500 truncate">{lang.nativeName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cases...</p>
        </div>
      </div>
    );
  }

  // Filter organizations based on search
  const filteredOrganizations = supportOrganizations.filter(org =>
    org.name.toLowerCase().includes(searchOrg.toLowerCase())
  );

  // Add this before the return statement
  const handleCrimeNumberClick = (caseItem: Case) => {
    setSelectedCrime(caseItem);
    setShowCrimeSummaryModal(true);
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: VictimMessage = {
        id: Date.now().toString(),
        sender: 'victim',
        senderName: 'Michael Parker',
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      
      // Add to local state first
      setMessages(prev => [...prev, newMsg]);
      
      // Send message through WebSocket
      websocketService.sendMessage('VICTIM_MESSAGE', {
        id: newMsg.id,
        sender: newMsg.sender,
        senderName: newMsg.senderName,
        message: newMsg.message,
        timestamp: newMsg.timestamp,
        read: newMsg.read,
        recipientId: 'off1',
        caseId: activeCase?.id
      });
      
      setNewMessage('');
      
      // Reset typing indicator when sending a message
      if (isTyping) {
        setIsTyping(false);
        websocketService.sendTypingIndicator(false);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
      
      // Focus the input after sending
      inputRef.current?.focus();
    }
  };

  // Render the main victim app dashboard after language selection
  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3">
            <FiArrowLeft className="text-gray-800 text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">MICHAEL PARKER</h1>
        </div>
        <button 
          className="flex items-center gap-2 text-gray-800 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors"
          onClick={() => setShowHelpModal(true)}
        >
          <RiHandHeartLine className="text-xl text-blue-600" />
          <span className="font-medium text-blue-600">Help</span>
        </button>
      </div>

      {/* Community Alert */}
      {showAlert && (
        <div className="mx-4 mt-4 bg-red-100 rounded-lg p-4 relative">
          <div className="flex gap-3">
            <div className="bg-red-800 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              <FiInfo />
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Community Alert - Burglary</h3>
              <p className="text-sm text-gray-700 mt-1">
                A burglary was reported to Charlottesville Police on December 03, 2022 at 4:57 AM.
              </p>
            </div>
          </div>
          <button 
            className="absolute top-3 right-3" 
            onClick={() => setShowAlert(false)}
          >
            <FiX className="text-gray-700" />
          </button>
        </div>
      )}

      {/* Case Cards */}
      {cases.map((caseItem) => (
        <div key={caseItem.id} className="m-4 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-3">
              Ongoing
            </div>
            
            <div className="mb-3">
              <div className="text-sm text-gray-500 mb-1">Crime no</div>
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => handleCrimeNumberClick(caseItem)}
                  className="text-blue-600 font-bold text-lg hover:text-blue-700 transition-colors"
                >
                  {caseItem.crimeNumber}
                </button>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">{caseItem.crimeType}</span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Officer In Charge - {caseItem.isOnline && <span className="text-green-600">Online</span>}</div>
                  <div className="font-bold">{caseItem.officerName}</div>
                </div>
                <button 
                  onClick={() => setShowVCOPModal(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium relative"
                >
                  VCOP
                  {hasNewVCOPUpdates && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex border-t">
            <button className="flex-1 py-2 flex flex-col items-center justify-center text-blue-600 text-xs">
              <FiPhone className="text-sm mb-1" />
              <span>Call</span>
            </button>
            <button 
              className="flex-1 py-2 flex flex-col items-center justify-center text-blue-600 relative text-xs"
              onClick={() => setShowChatView(true)}
            >
              <FiMessageSquare className="text-sm mb-1" />
              <span>Chat</span>
              {messages.length > 0 && messages.some(msg => msg.sender === 'officer' && !msg.read) && (
                <span className="absolute top-0 right-1/4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {messages.filter(msg => msg.sender === 'officer' && !msg.read).length}
                </span>
              )}
            </button>
            <button className="flex-1 py-2 flex flex-col items-center justify-center text-blue-600 text-xs">
              <FiVideo className="text-sm mb-1" />
              <span>Video</span>
            </button>
            <button 
              className="flex-1 py-2 flex flex-col items-center justify-center text-blue-600 text-xs"
              onClick={() => {
                setActiveCase(caseItem);
                setShowDocumentsModal(true);
              }}
            >
              <BsFileEarmarkText className="text-sm mb-1" />
              <span>Documents</span>
            </button>
          </div>
        </div>
      ))}

      {/* No cases message */}
      {cases.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
          <div className="bg-gray-100 rounded-full p-6 mb-4">
            <FiFileText className="text-gray-400 text-4xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Cases</h3>
          <p className="text-gray-500 text-sm">
            When a case is assigned to you, it will appear here. You'll be able to communicate with your assigned officer.
          </p>
        </div>
      )}

      {/* What to expect banner */}
      <div className="mx-4 mt-auto mb-4">
        <button 
          className="bg-blue-600 text-white rounded-full py-3 px-4 w-full flex items-center justify-center gap-3"
          onClick={() => setShowWhatToExpectModal(true)}
        >
          <div className="bg-white text-blue-600 rounded-full p-1">
            <FiInfo className="text-lg" />
          </div>
          <div className="text-left">
            <div className="font-medium">What to expect?</div>
            <div className="text-xs opacity-80">Learn how policing works behind the scenes</div>
          </div>
        </button>
      </div>

      {/* What to Expect Modal */}
      {showWhatToExpectModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-md mx-auto min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                <button onClick={() => setShowWhatToExpectModal(false)} className="mr-3">
                  <FiArrowLeft className="text-gray-800 text-xl" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">How Policing Works</h1>
              </div>
            </div>

            {/* Video Content */}
            <div className="flex-1 p-4">
              <div className="space-y-6">
                {/* Video 1 */}
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="relative aspect-video bg-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-105">
                        <FiPlay className="text-2xl text-blue-600 ml-1" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <h3 className="text-white font-medium">Initial Police Response</h3>
                      <p className="text-gray-200 text-sm">Learn about what happens when you first contact the police</p>
                    </div>
                  </div>
                </div>

                {/* Video 2 */}
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="relative aspect-video bg-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-105">
                        <FiPlay className="text-2xl text-blue-600 ml-1" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <h3 className="text-white font-medium">Investigation Process</h3>
                      <p className="text-gray-200 text-sm">Understanding how police investigate your case</p>
                    </div>
                  </div>
                </div>

                {/* Video 3 */}
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="relative aspect-video bg-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-105">
                        <FiPlay className="text-2xl text-blue-600 ml-1" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                      <h3 className="text-white font-medium">Support and Next Steps</h3>
                      <p className="text-gray-200 text-sm">Your journey through the criminal justice system</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-blue-800 mb-2">About These Videos</h4>
                  <p className="text-sm text-blue-600">
                    These informational videos will help you understand the policing process, what to expect during your case, and how we support victims throughout their journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat View Modal */}
      {showChatView && (
        <div className="fixed inset-0 bg-white z-50">
          <ChatView 
            onBack={() => setShowChatView(false)}
            victimName="DC S. Morgan"
            caseNumber="CRI45678/23"
            crimeType="SEC 47 ASSAULT"
          />
        </div>
      )}

      {/* VCOP Modal */}
      {showVCOPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold flex items-center">
                <span className="text-blue-600 mr-2 px-2 py-1 bg-blue-100 rounded-md">VCOP</span> 
                Updates
              </h2>
              <button 
                onClick={() => setShowVCOPModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              {vcopUpdates.length > 0 ? (
                <div className="space-y-4">
                  {vcopUpdates.map(update => (
                    <div 
                      key={update.id} 
                      className="bg-blue-50 p-3 rounded-lg border border-blue-100"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm">{update.officerName}</span>
                        <div className="text-xs text-gray-500">
                          <div>{update.date}</div>
                          <div>{update.timestamp}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-gray-800">{update.message}</div>
                      {!update.read && (
                        <div className="mt-1 text-xs text-blue-600">New Update</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">No VCOP updates yet</div>
              )}
            </div>
            
            <button
              onClick={() => setShowVCOPModal(false)}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && activeCase && (
        <div className="fixed inset-0 bg-white z-50">
          <DocumentsModal
            isOpen={showDocumentsModal}
            onClose={() => setShowDocumentsModal(false)}
            caseId={activeCase.id}
            caseName={activeCase.crimeNumber}
          />
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-md mx-auto min-h-screen flex flex-col">
            {/* Help Modal Header */}
            <div className="bg-white p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                <button onClick={() => setShowHelpModal(false)} className="mr-3">
                  <FiArrowLeft className="text-gray-800 text-xl" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">You are NEVER alone</h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search support organizations"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchOrg}
                  onChange={(e) => setSearchOrg(e.target.value)}
                />
              </div>
            </div>

            {/* Organizations List */}
            <div className="flex-1 p-4">
              <div className="space-y-4">
                {filteredOrganizations.map((org) => (
                  <div key={org.id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-4">
                      {org.logo}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        <div className="flex gap-4 mt-2">
                          <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">Call</button>
                          <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">Email</button>
                          <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">Website</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Crime Summary Modal */}
      {showCrimeSummaryModal && selectedCrime && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCrime.crimeNumber}</h2>
                <p className="text-sm text-gray-500 mt-1">Crime Summary</p>
              </div>
              <button 
                onClick={() => setShowCrimeSummaryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Crime Type</p>
                    <p className="font-medium text-gray-900">{selectedCrime.crimeType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Officer In Charge</p>
                    <p className="font-medium text-gray-900">{selectedCrime.officerName}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Incident Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Date Reported</p>
                      <p className="font-medium text-gray-900">March 30, 2025</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">Charlottesville, Main Street</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-900">Theft of personal belongings reported at the specified location. Initial statement has been recorded and investigation is ongoing.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Case Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">Current Status</span>
                      <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        Ongoing
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">March 30, 2025 - 15:27</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCrimeSummaryModal(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <Toast 
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default VictimApp; 