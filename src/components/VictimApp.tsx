import { useState, useEffect, useRef, useMemo } from 'react';
import { FiX, FiInfo, FiPhone, FiMessageSquare, FiVideo, FiFileText, FiChevronDown, FiArrowLeft, FiHelpCircle, FiSend, FiPaperclip, FiMic, FiBell, FiClipboard, FiSearch, FiPlay, FiCalendar } from 'react-icons/fi';
import { BsCheck, BsCheckAll, BsEmojiSmile, BsFileEarmarkText } from 'react-icons/bs';
import { RiHandHeartLine } from 'react-icons/ri';
import websocketService from '../services/websocketService';
import { Toast } from './Toast';
import ChatView from './ChatView';
import DocumentsModal from './DocumentsModal';
import { WebSocketMessageType, WebSocketMessage } from '../services/websocketService';

interface VictimMessage {
  id: string;
  sender: 'victim' | 'officer';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | 'voice';
  voiceUrl?: string;
  duration?: number;
  clientId?: string; // Used to prevent duplicate messages
  sentByMe?: boolean; // Flag to indicate if this message was sent by this client
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
  status: 'pending' | 'accepted' | 'rescheduled';
  appointmentNotification?: boolean;
}

interface PoliceToVictimMessage extends WebSocketMessage {
  id?: string;
  appointmentNotification?: boolean;
  appointmentType?: string;
  date?: string;
  time?: string;
  caseName?: string;
  caseNumber?: string;
  crimeNumber?: string;
  caseId?: string;
  victimName?: string;
  message?: string;
  senderName?: string;
  recipientId?: string;
  crimeType?: string;
  officerName?: string;
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
  const [showVCOPModal, setShowVCOPModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
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
  const [appointments, setAppointments] = useState<AppointmentNotification[]>([]);
  const [showAppointmentResponse, setShowAppointmentResponse] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentNotification | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('VictimApp: Initializing WebSocket connection');

    // Connect to WebSocket when the component mounts
    websocketService.connect('victim-michael', 'victim');

    // Update connection status
    const handleConnectionChange = (connected: boolean) => {
      setWsConnected(connected);
    };

    websocketService.onConnectionChange(handleConnectionChange);

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

    const messageCallback = websocketService.onMessage((message: PoliceToVictimMessage) => {
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

      if (message.type === 'POLICE_TO_VICTIM_MESSAGE' && message.appointmentNotification) {
        // Add new appointment to state with proper typing
        const newAppointment: AppointmentNotification = {
          id: message.id || '',
          type: message.type,
          appointmentType: message.appointmentType || '',
          date: message.date || '',
          time: message.time || '',
          caseName: message.caseName || '',
          caseNumber: message.caseNumber || '',
          crimeType: message.crimeType || '',
          officerName: message.officerName || '',
          timestamp: message.timestamp || '',
          status: 'pending',
          appointmentNotification: true
        };
        setAppointments(prev => [...prev, newAppointment]);
        setShowAppointmentResponse(true);
        setSelectedAppointment(newAppointment);

        // Show toast notification
        setToastMessage(`New appointment scheduled: ${message.appointmentType} on ${message.date} at ${message.time}`);
        setToastType('info');
        setShowToast(true);
      } else if (message.type === 'VCOP_UPDATE' || message.type === 'ZOORIE_UPDATE') {
        // Handle VCOP or ZOORIE updates
        console.log(`VictimApp: Processing ${message.type}:`, message);

        // Create a VCOP update object
        const vcopUpdate: VCOPUpdate = {
          id: message.id || Date.now().toString(),
          caseId: message.caseId || 'case1',
          crimeNumber: message.crimeNumber || 'CRI45678/23',
          victimName: message.victimName || 'Michael Parker',
          message: message.message || '',
          timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: message.date || new Date().toLocaleDateString(),
          officerName: message.senderName || 'DC S. Morgan',
          read: false
        };

        // Add the new VCOP update to the state
        console.log('Adding new VCOP update:', vcopUpdate);
        setVCOPUpdates(prev => {
          const newUpdates = [...prev, vcopUpdate];
          console.log('New VCOP updates state:', newUpdates);
          return newUpdates;
        });

        // Show toast notification
        setToastMessage(`New ${message.type === 'VCOP_UPDATE' ? 'VCOP' : 'ZOORIE'} update received`);
        setToastType('info');
        setShowToast(true);
      } else if (message.type === 'POLICE_TO_VICTIM_MESSAGE') {
        // Check if the message is for this victim
        if (!message.recipientId || message.recipientId === 'victim-michael') {
          console.log('VictimApp: Processing message from police:', message);

          // Check if this is a VCOP update
          if (message.payload.vcopUpdate) {
            console.log('VictimApp: Processing VCOP update');
            const vcopUpdate: VCOPUpdate = {
              id: message.payload.id,
              caseId: message.payload.caseId,
              crimeNumber: message.payload.crimeNumber,
              victimName: message.payload.victimName,
              message: message.payload.message,
              timestamp: message.payload.timestamp,
              date: message.payload.date || new Date().toLocaleDateString(),
              officerName: message.payload.senderName || 'DC S. Morgan',
              read: false
            };

            // Add the new VCOP update to the state
            console.log('Adding new VCOP update:', vcopUpdate);
            setVCOPUpdates(prev => {
              const newUpdates = [...prev, vcopUpdate];
              console.log('New VCOP updates state:', newUpdates);
              return newUpdates;
            });

            // Show toast notification
            setToastMessage('New VCOP update received');
            setToastType('info');
            setShowToast(true);
          } else {
            // Process all messages, whether from officer or victim
            // This is the ONLY place where messages are added to state
            const newMessage: VictimMessage = {
              id: message.payload.id || Date.now().toString(),
              sender: message.payload.sender,
              senderName: message.payload.sender === 'officer'
                ? (message.payload.senderName || 'DC S. Morgan')
                : 'Michael Parker',
              message: message.payload.message,
              timestamp: message.payload.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
              type: message.payload.type || 'text'
            };

            console.log('Processing message:', newMessage);

            // Add message to state, checking for duplicates by ID
            setMessages(prev => {
              // Check if we already have this message (by id)
              if (prev.some(msg => msg.id === newMessage.id)) {
                console.log('Message already exists, skipping:', newMessage.id);
                return prev;
              }
              console.log('Adding new message to state:', newMessage);
              return [...prev, newMessage];
            });

            // Show toast notification for new message
            if (message.payload.sender === 'officer') {
              setToastMessage(`New message from ${message.payload.senderName || 'DC S. Morgan'}`);
              setToastType('info');
              setShowToast(true);
            }
          }

          // If we're not in the chat view, count as unread
          if (!showChatView) {
            // Could add unread count logic here if needed
          } else {
            // If in chat view, mark as read
            websocketService.sendMessage('MESSAGE_READ', {
              messageIds: [message.payload.id],
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

  // Function to bypass PIN and language screens
  const handleSkipAuthentication = () => {
    setIsPinAuthenticated(true);
    setSelectedLanguage('en');
    setIsLoading(true);
    // Force loading to complete after a short delay
    setTimeout(() => setIsLoading(false), 500);
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
            <div className="text-center">
              <button
                onClick={handleSkipAuthentication}
                className="text-blue-600 text-sm hover:underline"
              >
                Skip Authentication
              </button>
            </div>
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
          <div className="text-center mt-4">
            <button
              onClick={handleSkipAuthentication}
              className="text-blue-600 text-sm hover:underline"
            >
              Skip Language Selection
            </button>
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

  // Function to count appointments for a specific case
  const getAppointmentsForCase = (caseNumber: string) => {
    return appointments.filter(appointment => appointment.caseNumber === caseNumber);
  };

  // Function to get the next upcoming appointment
  const getNextUpcomingAppointment = () => {
    if (appointments.length === 0) return null;

    // Filter for pending appointments
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    if (pendingAppointments.length === 0) return null;

    // Sort by date and time
    const sortedAppointments = [...pendingAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedAppointments[0];
  };

  // Get the next upcoming appointment
  const nextAppointment = getNextUpcomingAppointment();

  // Handle sending a message
  const handleSendMessage = (messageText?: string) => {
    const messageToSend = messageText || newMessage.trim();
    if (messageToSend) {
      // Generate a unique ID for this message
      const messageId = `victim-${Date.now()}`;

      // Create the message object
      const newMsg: VictimMessage = {
        id: messageId,
        sender: 'victim',
        senderName: 'Michael Parker',
        message: messageToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'text'
      };

      // IMPORTANT: We're NOT adding to local state here anymore
      // The message will be added to state when it comes back from the server

      // Send message through WebSocket
      websocketService.sendMessage('VICTIM_MESSAGE', {
        id: messageId,
        sender: 'victim',
        senderName: 'Michael Parker',
        message: messageToSend,
        timestamp: newMsg.timestamp,
        read: false,
        recipientId: 'off1',
        caseId: activeCase?.id || 'case1',
        crimeNumber: 'CRI45678/23', // Always use the same crime number for routing
        type: 'text'
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

  const handleAppointmentResponse = (appointmentId: string, response: 'accept' | 'reschedule') => {
    const updatedAppointments = appointments.map(apt => {
      if (apt.id === appointmentId) {
        return {
          ...apt,
          status: response === 'accept' ? 'accepted' as const : 'rescheduled' as const
        };
      }
      return apt;
    });
    setAppointments(updatedAppointments);
    setShowAppointmentResponse(false);
    setSelectedAppointment(null);

    // Send response to police app
    websocketService.sendMessage('VICTIM_TO_POLICE_MESSAGE' as WebSocketMessageType, {
      type: 'APPOINTMENT_RESPONSE',
      appointmentId,
      response,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'victim',
      senderName: 'Michael Parker'
    });
  };

  // Render the main victim app dashboard after language selection
  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen flex flex-col">
      {/* Status Bar */}
      <div className="bg-black text-white p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="text-xs text-white bg-blue-600 px-2 py-1 rounded-full"
          >
            Back to Home
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Server Status</span>
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
      </div>
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

      {/* Upcoming Meeting Card */}
      <div className="m-4 bg-blue-50 rounded-lg shadow-sm overflow-hidden border-l-4 border-blue-500">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FiCalendar className="text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-800">Upcoming Meeting</h3>
            </div>
            {!nextAppointment && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
            {nextAppointment && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                Awaiting Response
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-gray-900">
                {nextAppointment ? nextAppointment.appointmentType : "VICTIM STATEMENT"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Date & Time</p>
              <p className="font-medium text-gray-900">
                {nextAppointment ? `${nextAppointment.date}, ${nextAppointment.time}` : "April 15, 2025, 10:30 AM"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">With</p>
              <p className="font-medium text-gray-900">
                {nextAppointment ? nextAppointment.officerName : "DC S. Morgan"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Case</p>
              <p className="font-medium text-gray-900">
                {nextAppointment ? nextAppointment.caseName : "Theft - CRI45678/23"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (nextAppointment) {
                  handleAppointmentResponse(nextAppointment.id, 'accept');
                } else {
                  // Show toast for demo purposes
                  setToastMessage("This is a demo appointment. No action taken.");
                  setToastType("info");
                  setShowToast(true);
                }
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => {
                if (nextAppointment) {
                  handleAppointmentResponse(nextAppointment.id, 'reschedule');
                } else {
                  // Show toast for demo purposes
                  setToastMessage("This is a demo appointment. No action taken.");
                  setToastType("info");
                  setShowToast(true);
                }
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Request Reschedule
            </button>
          </div>
        </div>
      </div>

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
                <div className="flex items-center space-x-2">
                  {/* Calendar icon with appointment count */}
                  {getAppointmentsForCase(caseItem.crimeNumber).length > 0 && (
                    <button
                      className="bg-blue-50 text-blue-600 p-2 rounded-full relative"
                      onClick={() => {
                        // Scroll to appointments section
                        document.getElementById('appointments-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <FiCalendar className="text-lg" />
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getAppointmentsForCase(caseItem.crimeNumber).length}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // Set the active case for the VCOP modal
                      setActiveCase(caseItem);
                      setShowVCOPModal(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium relative"
                  >
                    VCOP
                    {/* Check for unread VCOP updates for this specific case */}
                    {vcopUpdates.some(update => !update.read && update.crimeNumber === caseItem.crimeNumber) && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {vcopUpdates.filter(update => !update.read && update.crimeNumber === caseItem.crimeNumber).length}
                      </span>
                    )}
                  </button>
                </div>
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

      {/* Upcoming Appointments Section */}
      {appointments.length > 0 && (
        <div id="appointments-section" className="m-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Appointments</h2>
          {appointments.map((appointment) => (
            <div key={appointment.id}>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900">{appointment.appointmentType}</h3>
                      {appointment.status === 'pending' && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">Awaiting Response</span>
                      )}
                      {appointment.status === 'accepted' && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Accepted</span>
                      )}
                      {appointment.status === 'rescheduled' && (
                        <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">Rescheduled</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Date: {appointment.date}</p>
                      <p>Time: {appointment.time}</p>
                      <p>Officer: {appointment.officerName}</p>
                      <p>Case: {appointment.caseName}</p>
                    </div>
                  </div>
                  {appointment.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAppointmentResponse(appointment.id, 'accept')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAppointmentResponse(appointment.id, 'reschedule')}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Request Reschedule
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {appointment.status === 'pending' && (
                <div className="mt-2 mb-4 text-sm text-yellow-600">
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending your confirmation
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
            crimeType="THEFT"
            victimMessages={messages.map(msg => ({
              ...msg,
              type: msg.type || 'text' // Ensure type is never undefined
            }))}
            onSendMessageToVictim={(message) => {
              handleSendMessage(message);
            }}
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
                onClick={() => {
                  // Mark VCOP updates for the active case as read
                  if (activeCase) {
                    setVCOPUpdates(prev => {
                      const updatedUpdates = prev.map(update =>
                        update.crimeNumber === activeCase.crimeNumber ?
                          { ...update, read: true } :
                          update
                      );
                      return updatedUpdates;
                    });
                  }
                  // Close the modal
                  setShowVCOPModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Show case information */}
              {activeCase && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Case: {activeCase.crimeNumber}</p>
                  <p className="text-sm text-gray-600">Type: {activeCase.crimeType}</p>
                </div>
              )}

              {/* Filter VCOP updates for the active case */}
              {activeCase && vcopUpdates.filter(update => update.crimeNumber === activeCase.crimeNumber).length > 0 ? (
                <div className="space-y-4">
                  {vcopUpdates
                    .filter(update => update.crimeNumber === activeCase.crimeNumber)
                    .map(update => (
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
                <div className="text-center text-gray-500 py-10">
                  {activeCase ?
                    `No VCOP updates for case ${activeCase.crimeNumber} yet` :
                    'No case selected'}
                </div>
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

      {/* Appointment Response Modal */}
      {showAppointmentResponse && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md relative">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">New Appointment Scheduled</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Appointment</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{selectedAppointment.appointmentType}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.time}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Officer</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.officerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Case</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.caseName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => handleAppointmentResponse(selectedAppointment.id, 'accept')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAppointmentResponse(selectedAppointment.id, 'reschedule')}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Request Reschedule
                  </button>
                </div>
              </div>
            </div>
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