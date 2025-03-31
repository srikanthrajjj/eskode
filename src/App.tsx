import { FaComment, FaPhone, FaSearch, FaVideo, FaCog, FaRegClock, FaBars } from 'react-icons/fa';
import { FiBell, FiMessageSquare, FiArrowLeft, FiClock, FiPaperclip, FiSend, FiCheckCircle, FiInfo, FiArrowRight, FiVideo, FiMic, FiHelpCircle, FiClipboard, FiCheckSquare, FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import { MdOutlineContactPage } from 'react-icons/md';
import { IoMdAdd } from 'react-icons/io';
import { HiDotsVertical } from 'react-icons/hi';
import { BsFileEarmarkText, BsCalendar3, BsChatDots } from 'react-icons/bs';
import { RiWifiLine, RiBattery2Fill } from 'react-icons/ri';
import { BiSignal4 } from 'react-icons/bi';

import ChatView from './components/ChatView';
import AdminDashboard from './components/AdminDashboard';
import VictimApp from './components/VictimApp';
import SplashScreen from './components/SplashScreen';
import NotesModal from './components/NotesModal';
import DocumentsModal from './components/DocumentsModal';
import AppointmentModal from './components/AppointmentModal';
import { useState, useEffect, useRef } from 'react';
import websocketService, { WebSocketMessage } from './services/websocketService';

// Import AdminChatMessage type
import { AdminChatMessage } from './components/AdminChatView';

// Define interfaces for our data
interface Case {
  id: string;
  victimName: string;
  dateOfBirth: string;
  address: string;
  crimeType: string;
  crimeNumber: string;
  hasNotifications?: boolean;
  color?: string;
  isOperation?: boolean;
  operationStats?: {
    victimCount: number;
  };
}

// Database of dummy cases for lookup by crime number
const dummyCases: Case[] = [
  {
    id: 'db1',
    victimName: 'MICHAEL PARKER',
    dateOfBirth: '12/04/1985',
    address: '45 Elmwood Ave, London SW2 8LP, UK',
    crimeType: 'THEFT',
    crimeNumber: 'CRI45678/23',
    color: 'bg-blue-500'
  },
  {
    id: 'db2',
    victimName: 'SARAH JENKINS',
    dateOfBirth: '23/07/1990',
    address: '12 Maple Street, London E14 9RQ, UK',
    crimeType: 'BURGLARY',
    crimeNumber: 'CRI56789/23',
    color: 'bg-red-500'
  },
  {
    id: 'db3',
    victimName: 'JAMES WILSON',
    dateOfBirth: '05/11/1978',
    address: '78 Oak Lane, London N1 7GF, UK',
    crimeType: 'ASSAULT',
    crimeNumber: 'CRI67890/23',
    color: 'bg-purple-500'
  },
  {
    id: 'db4',
    victimName: 'EMMA THOMPSON',
    dateOfBirth: '18/02/1982',
    address: '34 Pine Road, London W2 5BT, UK',
    crimeType: 'FRAUD',
    crimeNumber: 'CRI78901/23',
    color: 'bg-green-500'
  },
  {
    id: 'db5',
    victimName: 'ROBERT BROWN',
    dateOfBirth: '29/09/1975',
    address: '56 Cedar Avenue, London SE1 3HJ, UK',
    crimeType: 'VANDALISM',
    crimeNumber: 'CRI89012/23',
    color: 'bg-orange-400'
  },
  {
    id: 'db6',
    victimName: 'LISA DAVIS',
    dateOfBirth: '03/05/1988',
    address: '23 Birch Close, London NW3 2RT, UK',
    crimeType: 'THEFT',
    crimeNumber: 'CRI90123/23',
    color: 'bg-blue-500'
  },
  {
    id: 'db7',
    victimName: 'DANIEL MARTIN',
    dateOfBirth: '14/12/1992',
    address: '67 Willow Street, London E1 6FB, UK',
    crimeType: 'ASSAULT WOUNDING',
    crimeNumber: 'CRI01234/23',
    color: 'bg-red-500'
  },
  {
    id: 'db8',
    victimName: 'OLIVIA CLARK',
    dateOfBirth: '27/03/1980',
    address: '89 Ash Road, London SW9 7KL, UK',
    crimeType: 'BURGLARY',
    crimeNumber: 'CRI12345/23',
    color: 'bg-purple-500'
  },
  {
    id: 'db9',
    victimName: 'WILLIAM HARRIS',
    dateOfBirth: '09/08/1973',
    address: '12 Spruce Avenue, London W10 5NM, UK',
    crimeType: 'FRAUD',
    crimeNumber: 'CRI23456/23',
    color: 'bg-green-500'
  },
  {
    id: 'db10',
    victimName: 'SOPHIA JACKSON',
    dateOfBirth: '21/01/1995',
    address: '45 Chestnut Lane, London SE15 8PQ, UK',
    crimeType: 'VANDALISM',
    crimeNumber: 'CRI34567/23',
    color: 'bg-orange-400'
  }
];

interface Appointment {
  id: string;
  type: string;
  date: string;
  time: string;
  relatedTo: string;
  relatedCase: string;
  relatedCrimeType: string;
  color?: string;
}

interface AdminMessage {
  id: string;
  sender: 'admin' | 'officer';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

type AppView = 'splash' | 'police' | 'admin' | 'victim';

function App() {
  // App navigation state
  const [currentView, setCurrentView] = useState<AppView>('splash');
  
  // Add Record Modal state
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Force update helper
  const [, updateState] = useState({});
  const forceUpdate = () => updateState({});
  
  // Websocket connection status
  const [wsConnected, setWsConnected] = useState(false);

  // Admin-Police messaging system
  const [adminMessages, setAdminMessages] = useState<Record<string, AdminChatMessage[]>>({
    'off1': [
      {
        id: 'msg1',
        sender: 'admin',
        senderName: 'Admin',
        message: 'Hello DC Morgan, I need an update on the JOHN LINDEN case.',
        timestamp: '09:45 AM',
        read: true
      },
      {
        id: 'msg2',
        sender: 'officer',
        senderName: 'S. Morgan',
        message: 'Good morning. I\'ve scheduled a follow-up interview for tomorrow. The initial evidence suggests a strong case.',
        timestamp: '09:48 AM',
        read: true
      }
    ]
  });
  
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);
  const [showAdminMessageList, setShowAdminMessageList] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isOfficerTyping, setIsOfficerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debounced typing indicator handler
  const handleTypingIndicatorChange = (text: string) => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator if state changed
    if (text && !isTyping) {
      setIsTyping(true);
      websocketService.sendTypingIndicator(true);
    }
    
    // Set timeout to clear typing indicator after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        websocketService.sendTypingIndicator(false);
      }
    }, 2000); // 2 seconds after user stops typing
  };
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Initialize WebSocket connection based on the current view
    const initWebSocket = () => {
      // Determine user ID and type based on the current view
      let userId = '';
      let userType: 'admin' | 'officer' | 'victim' = 'officer'; // Default
      
      if (currentView === 'admin') {
        userId = 'admin-user';
        userType = 'admin';
      } else if (currentView === 'police') {
        userId = 'off1'; // First officer ID
        userType = 'officer';
      } else if (currentView === 'victim') {
        userId = 'victim-michael';
        userType = 'victim';
      }
      
      console.log(`Initializing WebSocket as ${userType} with ID: ${userId}`);
      
      // Disconnect any existing connection before establishing a new one
      websocketService.disconnect();
      
      // Connect to WebSocket with user ID and type
      websocketService.connect(userId, userType);
      
      // Set up event listeners
      const connectCallback = websocketService.onConnect(() => {
        console.log('WebSocket connected');
        setWsConnected(true);
      });
      
      const messageCallback = websocketService.onMessage(handleWebSocketMessage);
      
      const disconnectCallback = websocketService.onDisconnect(() => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
      });
      
      // Return a cleanup function
      return () => {
        connectCallback();
        messageCallback();
        disconnectCallback();
      };
    };
    
    // Initialize WebSocket
    const cleanup = initWebSocket();
    
    // Clean up on component unmount
    return () => {
      cleanup();
      websocketService.disconnect();
    };
  }, [currentView]);
  
  // Reconnect if disconnected unexpectedly
  useEffect(() => {
    if (!wsConnected && (currentView === 'admin' || currentView === 'police')) {
      // Set up a reconnection interval
      const reconnectInterval = setInterval(() => {
        if (!wsConnected) {
          console.log('Attempting to reconnect...');
          const userId = currentView === 'admin' ? 'admin-user' : 'off1';
          const userType = currentView === 'admin' ? 'admin' : 'officer';
          websocketService.connect(userId, userType);
        } else {
          clearInterval(reconnectInterval);
        }
      }, 3000); // Try every 3 seconds
      
      return () => {
        clearInterval(reconnectInterval);
      };
    }
  }, [wsConnected, currentView]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log(`Received WebSocket message of type: ${message.type} from ${message.senderId}`, message);
    
    switch (message.type) {
      case 'ADMIN_MESSAGE':
        // Handle admin message
        console.log('Processing ADMIN_MESSAGE with payload:', message.payload);
        handleIncomingAdminMessage(message.payload);
        break;
        
      case 'OFFICER_MESSAGE':
        // Handle officer message
        console.log('Processing OFFICER_MESSAGE with payload:', message.payload);
        handleIncomingOfficerMessage(message.payload);
        break;
        
      case 'VICTIM_MESSAGE':
        // Handle victim message
        console.log('Processing VICTIM_MESSAGE with payload:', message.payload);
        // Check if this message is intended for current user (if recipientId is specified)
        if (!message.payload?.recipientId || 
            message.payload.recipientId === 'off1' || 
            (message.payload.recipientId && message.payload.recipientId.startsWith('off'))) {
          handleIncomingVictimMessage(message.payload);
        } else {
          console.log('Ignoring VICTIM_MESSAGE - not addressed to current user');
        }
        break;
        
      case 'TYPING_INDICATOR':
        // Handle typing indicator
        console.log('Processing TYPING_INDICATOR with payload:', message.payload);
        
        // Check if we should handle this typing indicator based on sender
        if (message.senderId?.startsWith('admin')) {
          // Admin is typing, update state for officer view
          setIsOfficerTyping(message.payload?.isTyping);
        } 
        else if (message.senderId?.startsWith('victim')) {
          // Only handle if we're in police view and viewing the relevant case
          if (currentView === 'police' && message.payload?.recipientId === 'off1') {
            console.log('Victim is typing:', message.payload?.isTyping);
            // Update victim typing state here if needed
            // You might need to add a state for victim typing indicators
          }
        }
        else if (message.senderId?.startsWith('off')) {
          // Officer is typing, update state for admin or victim view
          if (currentView === 'victim') {
            setIsOfficerTyping(message.payload?.isTyping);
          }
        }
        break;
        
      case 'MESSAGE_READ':
        // Mark messages as read
        console.log('Processing MESSAGE_READ with payload:', message.payload);
        handleMessagesRead(message.payload.messageIds);
        break;
        
      default:
        // Ignore other message types for now
        console.log('Ignoring message type:', message.type);
        break;
    }
  };
  
  // Handle incoming admin message
  const handleIncomingAdminMessage = (payload: AdminChatMessage & { recipientId: string }) => {
    console.log('Handling admin message:', payload);
    const { recipientId } = payload;
    
    setAdminMessages(prev => {
      console.log('Previous admin messages:', prev);
      const existingMessages = prev[recipientId] || [];
      console.log('Existing messages for recipient:', existingMessages);
      
      const updatedMessages = {
        ...prev,
        [recipientId]: [...existingMessages, payload]
      };
      
      console.log('Updated admin messages:', updatedMessages);
      return updatedMessages;
    });
    
    // Update unread count if we're in police view
    if (currentView === 'police' && !showAdminMessageList) {
      setUnreadAdminMessages(prev => prev + 1);
    }
  };
  
  // Handle incoming officer message
  const handleIncomingOfficerMessage = (payload: AdminChatMessage) => {
    console.log('Handling officer message:', payload);
    
    setAdminMessages(prev => {
      console.log('Previous admin messages:', prev);
      const existingMessages = prev['off1'] || [];
      console.log('Existing messages for officer:', existingMessages);
      
      const updatedMessages = {
        ...prev,
        'off1': [...existingMessages, payload]
      };
      
      console.log('Updated admin messages:', updatedMessages);
      return updatedMessages;
    });
  };

  // Handle incoming victim message
  const handleIncomingVictimMessage = (payload: any) => {
    console.log('Handling victim message in police app:', payload);
    
    // Get the caseId from the payload or use default
    const caseId = payload.caseId || 'case1';
    
    // Create a formatted message
    const victimMessage = {
      id: payload.id || Date.now().toString(),
      sender: 'victim',
      senderName: payload.senderName || 'Michael Parker',
      message: payload.message,
      timestamp: payload.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    
    console.log('Formatted victim message to store:', victimMessage);
    console.log('Current victimMessages state:', victimMessages);
    
    // Store the message in the victimMessages state
    setVictimMessages(prevMessages => {
      const caseMessages = prevMessages[caseId] || [];
      const updatedMessages = {
        ...prevMessages,
        [caseId]: [...caseMessages, victimMessage]
      };
      
      console.log('Updated victimMessages:', updatedMessages);
      return updatedMessages;
    });
    
    // Force update UI to show notification
    const caseToUpdate = cases.find(c => c.id === caseId);
    if (caseToUpdate) {
      caseToUpdate.hasNotifications = true;
      // Create a new cases array to trigger re-render
      setCases([...cases]);
      console.log('Updated cases with notification:', cases);
    }
    
    // If we're looking at the chat view, mark as read
    if (showChatView && selectedCaseId === caseId) {
      // Mark message as read
      websocketService.sendMessage('MESSAGE_READ', { 
        messageIds: [victimMessage.id],
        recipientId: 'victim-michael'
      });
    }
  };

  // Handle messages being marked as read
  const handleMessagesRead = (messageIds: string[]) => {
    setAdminMessages(prev => {
      const updated = { ...prev };
      
      // Update all messages with the given IDs
      Object.keys(updated).forEach(officerId => {
        updated[officerId] = updated[officerId].map(msg => 
          messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        );
      });
      
      return updated;
    });
  };

  // Update unread message count
  useEffect(() => {
    let count = 0;
    Object.values(adminMessages).forEach(messages => {
      messages.forEach(msg => {
        if (msg.sender === 'admin' && !msg.read && currentView === 'police') {
          count++;
        }
      });
    });
    
    // Set the count
    setUnreadAdminMessages(count);
    
    // If there are unread messages and we're looking at the list, mark them as read
    if (count > 0 && showAdminMessageList && currentView === 'police') {
      // Mark all messages from admin as read via WebSocket
      const unreadMessageIds = getUnreadAdminMessageIds();
      websocketService.markMessagesAsRead(unreadMessageIds);
      
      // Mark them as read locally
      setAdminMessages(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(officerId => {
          updated[officerId] = updated[officerId].map(msg => ({
            ...msg,
            read: msg.sender === 'admin' ? true : msg.read
          }));
        });
        return updated;
      });
    }
    
    // Play notification sound if we have new messages and we're in the police app
    if (count > 0 && currentView === 'police' && !showAdminMessageList) {
      // Add notification sound here if needed
      console.log('New message notification!');
      
      // Make the notification icon pulse
      const bellIcon = document.getElementById('bell-notification');
      if (bellIcon) {
        bellIcon.classList.add('animate-pulse');
        setTimeout(() => {
          bellIcon.classList.remove('animate-pulse');
        }, 2000);
      }
    }
  }, [adminMessages, currentView, showAdminMessageList]);
  
  // Get IDs of unread admin messages
  const getUnreadAdminMessageIds = (): string[] => {
    const unreadIds: string[] = [];
    
    Object.values(adminMessages).forEach(messages => {
      messages.forEach(msg => {
        if (msg.sender === 'admin' && !msg.read) {
          unreadIds.push(msg.id);
        }
      });
    });
    
    return unreadIds;
  };

  // Police app states
  const [activeTab, setActiveTab] = useState('cases');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [showCrimeSummaryView, setShowCrimeSummaryView] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCaseName, setSelectedCaseName] = useState('');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState('');
  const [selectedCrimeType, setSelectedCrimeType] = useState('');
  const [selectedCommunicationMethod, setSelectedCommunicationMethod] = useState<string | null>(null);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  // Add state for expanded appointment cards
  const [expandedAppointmentIds, setExpandedAppointmentIds] = useState<string[]>([]);
  const [victimMessages, setVictimMessages] = useState<Record<string, Array<{
    id: string;
    sender: string;
    senderName: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>>>({
    'case1': [
      {
        id: 'vmsg1',
        sender: 'officer',
        senderName: 'S. Morgan',
        message: 'Hello Mr. Linden, I wanted to check if you had any questions about your case?',
        timestamp: '10:30 AM',
        read: true
      }
    ]
  });
  
  // Sample appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'apt1',
      type: 'VICTIM STATEMENT',
      date: '15/04/2025',
      time: '14:30',
      relatedTo: 'JOHN LINDEN',
      relatedCase: 'CRI12145/21',
      relatedCrimeType: 'SEC 47 ASSAULT',
      color: 'bg-blue-500'
    },
    {
      id: 'apt2',
      type: 'CASE REVIEW',
      date: '18/04/2025',
      time: '10:00',
      relatedTo: 'SGT. WILSON',
      relatedCase: 'Department Review',
      relatedCrimeType: 'Central Office',
      color: 'bg-gray-500'
    }
  ]);

  // Change cases from a constant to a state with ZOORIE operation
  const [cases, setCases] = useState<Case[]>(() => {
    // Try to get cases from localStorage
    const savedCases = localStorage.getItem('police_cases');
    const defaultCases = [
      {
        id: 'op-zoorie',
        victimName: 'ZOORIE',
        dateOfBirth: '',
        address: '',
        crimeType: 'CYBER CRIME',
        crimeNumber: 'OP-ZOORIE-2024',
        color: 'bg-orange-400',
        isOperation: true,
        operationStats: {
          victimCount: 6
        }
      },
      {
        id: 'case1',
        victimName: 'JOHN LINDEN',
        dateOfBirth: '30/11/1986',
        address: '12 New town Rd, London NW1 9LN, UK',
        crimeType: 'SEC 47 ASSAULT',
        crimeNumber: 'CRI12145/21',
        hasNotifications: true,
        color: 'bg-red-500'
      },
      {
        id: 'case2',
        victimName: 'AIDAN SHAH',
        dateOfBirth: '11/11/1966',
        address: '12 Winston Rd, London NW1 9LN, UK',
        crimeType: 'ASSAULT WOUNDING',
        crimeNumber: 'CRI12366/21',
        color: 'bg-orange-400'
      }
    ];

    // If there are saved cases, parse them and ensure ZOORIE operation is always included
    if (savedCases) {
      const parsedCases = JSON.parse(savedCases);
      // Check if ZOORIE operation exists in saved cases
      if (!parsedCases.find((c: Case) => c.id === 'op-zoorie')) {
        // Add ZOORIE operation if it doesn't exist
        parsedCases.unshift(defaultCases[0]);
      }
      return parsedCases;
    }

    return defaultCases;
  });

  // Sort cases to ensure Zoorie op is at the bottom
  const sortedCases = [...cases].sort((a, b) => {
    if (a.victimName === 'ZOORIE OP') return 1;
    if (b.victimName === 'ZOORIE OP') return -1;
    return 0;
  });

  const handleOpenNotes = (caseId: string, caseName: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseName(caseName);
    setShowNotesModal(true);
  };

  const handleOpenDocuments = (caseId: string, caseName: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseName(caseName);
    setShowDocumentsModal(true);
  };

  const handleOpenCommunication = (method: string, caseId: string, caseName: string) => {
    setSelectedCommunicationMethod(method);
    setSelectedCaseId(caseId);
    setSelectedCaseName(caseName);
    
    // Find the case to get additional info
    const selectedCase = cases.find(c => c.id === caseId);
    if (selectedCase) {
      setSelectedCaseNumber(selectedCase.crimeNumber);
      setSelectedCrimeType(selectedCase.crimeType);
    }

    if (method === 'message') {
      setShowChatView(true);
    } else {
      // For demo purposes, just alert for other communication methods
    console.log(`Opening ${method} for ${caseName}`);
    alert(`Opening ${method} for ${caseName}`);
    }
  };

  const handleOpenCrimeSummary = (caseId: string, caseName: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseName(caseName);
    
    // Find the case to get additional info
    const selectedCase = cases.find(c => c.id === caseId);
    if (selectedCase) {
      setSelectedCaseNumber(selectedCase.crimeNumber);
      setSelectedCrimeType(selectedCase.crimeType);
    }
    
    setShowCrimeSummaryView(true);
  };

  const handleOpenCalendar = (caseId: string, caseName: string, caseNumber: string, crimeType: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseName(caseName);
    setSelectedCaseNumber(caseNumber);
    setSelectedCrimeType(crimeType);
    setShowAppointmentModal(true);
  };

  const handleSaveAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
    const appointment: Appointment = {
      ...newAppointment,
      id: `apt${appointments.length + 1}`,
    };
    setAppointments([...appointments, appointment]);
    
    // Send appointment notification to victim app
    const appointmentNotification = {
      id: Date.now().toString(),
      type: 'APPOINTMENT_NOTIFICATION',
      appointmentType: appointment.type,
      date: appointment.date,
      time: appointment.time,
      caseName: appointment.relatedTo,
      caseNumber: appointment.relatedCase,
      crimeType: appointment.relatedCrimeType,
      officerName: 'DC S. Morgan',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipientId: 'victim-michael' // Send to Michael Parker
    };
    
    // Send the notification through the WebSocket
    websocketService.sendMessage('POLICE_TO_VICTIM_MESSAGE', {
      ...appointmentNotification,
      message: `New appointment scheduled: ${appointment.type} on ${appointment.date} at ${appointment.time}`,
      appointmentNotification: true,
      sender: 'officer',
      senderName: 'DC S. Morgan'
    });
    
    console.log('Appointment notification sent to victim:', appointmentNotification);
  };

  // Handle navigation between app views
  const handleSelectPoliceApp = () => {
    setCurrentView('police');
  };

  const handleSelectAdminDashboard = () => {
    setCurrentView('admin');
  };

  const handleSelectVictimApp = () => {
    setCurrentView('victim');
  };

  const handleBackToSplash = () => {
    setCurrentView('splash');
  };

  // Handle chat view back button
  const handleChatBack = () => {
    setShowChatView(false);
  };

  // Handle crime summary view back button
  const handleCrimeSummaryBack = () => {
    setShowCrimeSummaryView(false);
  };

  // Handle sending message from Admin to Officer
  const handleSendMessageToOfficer = (officerId: string, message: string) => {
    // Special case for marking messages as read
    if (message === "__MARK_READ__") {
      // Get IDs of unread officer messages
      const unreadIds: string[] = [];
      const officerMessages = adminMessages[officerId] || [];
      
      officerMessages.forEach(msg => {
        if (msg.sender === 'officer' && !msg.read) {
          unreadIds.push(msg.id);
        }
      });
      
      // Mark messages as read through WebSocket
      websocketService.markMessagesAsRead(unreadIds);
      
      // Update local state
      setAdminMessages(prev => {
        const existingMessages = prev[officerId] || [];
        return {
          ...prev,
          [officerId]: existingMessages.map(msg => 
            msg.sender === 'officer' ? { ...msg, read: true } : msg
          )
        };
      });
      
      return;
    }
    
    // Create a message object for the admin's message
    const adminMessage: AdminChatMessage & { recipientId: string } = {
      id: Date.now().toString(),
      sender: 'admin' as 'admin',
      senderName: 'Admin',
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      recipientId: officerId
    };
    
    // Update local state immediately with the admin's message
    setAdminMessages(prev => {
      const existingMessages = prev[officerId] || [];
      return {
        ...prev,
        [officerId]: [...existingMessages, adminMessage]
      };
    });
    
    // Send message through WebSocket
    websocketService.sendAdminMessage(officerId, message);
  };

  // Handle sending message from Officer to Admin
  const handleSendMessageToAdmin = (message: string) => {
    // Send message through WebSocket
    websocketService.sendOfficerMessage(message);
    
    // Clear reply message
    setReplyMessage('');
  };

  // Mark admin messages as read when police officer views them
  const handleViewAdminMessages = () => {
    setShowAdminMessageList(true);
    
    // Mark all messages from admin as read via WebSocket
    const unreadMessageIds = getUnreadAdminMessageIds();
    websocketService.markMessagesAsRead(unreadMessageIds);
  };

  const handleSendReply = () => {
    if (replyMessage.trim()) {
      handleSendMessageToAdmin(replyMessage);
      setReplyMessage('');
      
      // Reset typing indicator when sending a message
      if (isTyping) {
        setIsTyping(false);
        websocketService.sendTypingIndicator(false);
        
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };

  // Handle sending message from Officer to Victim
  const handleSendMessageToVictim = (message: string) => {
    // Create the message with all required fields
    const newMessage = {
      id: Date.now().toString(),
      sender: 'officer',
      senderName: 'S. Morgan',
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      recipientId: 'victim-michael', // Important! Specify the victim ID
      caseId: selectedCaseId || 'case1' // Include the case ID
    };
    
    // Log the outgoing message
    console.log('Sending message to victim:', newMessage);
    
    // Send message through WebSocket
    websocketService.sendMessage('POLICE_TO_VICTIM_MESSAGE', newMessage);
    
    // Add message to local state
    setVictimMessages(prev => {
      const caseId = selectedCaseId || 'case1';
      const existingMessages = prev[caseId] || [];
      return {
        ...prev,
        [caseId]: [...existingMessages, newMessage]
      };
    });
  };

  // Add the handleAddCase function back
  const handleAddCase = () => {
    setShowAddCaseModal(true);
  };

  // Modify the handleSubmitNewCase function
  const handleSubmitNewCase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const crimeNumber = crimeNumberInput;

    if (!crimeNumber.trim()) {
      alert('Please enter a crime number');
      return;
    }

    // Create a new case using matching case data if available
    const newCase: Case = matchingCase ? {
      ...matchingCase,
      id: `case${cases.length + 1}`,
      hasNotifications: false
    } : {
      id: `case${cases.length + 1}`,
      victimName: 'MICHAEL PARKER',
      dateOfBirth: '12/04/1985',
      address: '45 Elmwood Ave, London SW2 8LP, UK',
      crimeType: 'THEFT',
      crimeNumber: crimeNumber,
      hasNotifications: false,
      color: 'bg-blue-500'
    };

    // Add new case to the beginning of the array
    const updatedCases = [newCase, ...cases];
    setCases(updatedCases);
    saveCasesToStorage(updatedCases);

    // Show success message
    setSuccessMessage('The case has been added and sent the link to victim');
    setShowSuccessMessage(true);

    // Notify victim app about the new case via WebSocket
    const newCasePayload = {
      id: newCase.id,
      crimeNumber: newCase.crimeNumber,
      crimeType: newCase.crimeType,
      victimName: newCase.victimName,
      officerName: 'DC S. Morgan',
      timestamp: new Date().toISOString()
    };

    console.log('Sending new case message:', newCasePayload);
    websocketService.sendMessage('NEW_CASE_ADDED', newCasePayload);

    // Reset state and close modal after 2 seconds
    setTimeout(() => {
      setShowAddCaseModal(false);
      setShowSuccessMessage(false);
      setSuccessMessage('');
      setCrimeNumberInput('');
      setMatchingCase(null);
    }, 2000);
  };

  // Add a function to save cases to localStorage
  const saveCasesToStorage = (casesToSave: Case[]) => {
    try {
      // Ensure ZOORIE operation is always present
      if (!casesToSave.find(c => c.id === 'op-zoorie')) {
        casesToSave.unshift({
          id: 'op-zoorie',
          victimName: 'ZOORIE',
          dateOfBirth: '',
          address: '',
          crimeType: 'CYBER CRIME',
          crimeNumber: 'OP-ZOORIE-2024',
          color: 'bg-orange-400',
          isOperation: true,
          operationStats: {
            victimCount: 6
          }
        });
      }
      localStorage.setItem('police_cases', JSON.stringify(casesToSave));
    } catch (error) {
      console.error('Error saving cases to localStorage:', error);
    }
  };

  // Connection status notification
  const ConnectionStatus = () => {
    if (currentView !== 'admin' && currentView !== 'police') return null;

  return (
      <div className={`fixed bottom-4 right-4 rounded-lg px-4 py-2 shadow-lg transition-all duration-300 
        ${wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        ${wsConnected ? 'opacity-0 transform translate-y-10' : 'opacity-100 transform translate-y-0'}`}
        style={{ zIndex: 9999, transition: 'opacity 0.5s, transform 0.5s' }}
      >
        {wsConnected ? (
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Connected to server
          </span>
        ) : (
          <span className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            Connecting to server...
          </span>
        )}
      </div>
    );
  };

  // Add a function to send a specific case to the victim app
  const handleSendCaseToVictim = (caseItem: Case) => {
    console.log('Sending case to victim app:', caseItem);
    
    // Notify victim app about the case via WebSocket
    websocketService.sendMessage('NEW_CASE_ADDED', {
      id: caseItem.id,
      crimeNumber: caseItem.crimeNumber,
      crimeType: caseItem.crimeType,
      victimName: caseItem.victimName,
      officerName: 'DC S. Morgan',
      timestamp: new Date().toISOString()
    });
    
    // Show a temporary success message
    alert(`Case ${caseItem.crimeNumber} sent to victim app successfully`);
  };

  // Add new state for VCOP modal
  const [showVCOPModal, setShowVCOPModal] = useState(false);
  const [vcopUpdateMessage, setVCOPUpdateMessage] = useState('');

  // Add function to handle sending VCOP updates
  const handleSendVCOPUpdate = (caseItem: Case) => {
    if (!vcopUpdateMessage.trim()) {
      alert('Please enter an update message');
      return;
    }

    console.log('Sending VCOP update to victim:', caseItem.victimName);
    
    // Create the update object - use same structure as police-to-victim messages
    const vcopUpdate = {
      id: Date.now().toString(),
      caseId: caseItem.id,
      crimeNumber: caseItem.crimeNumber,
      victimName: caseItem.victimName,
      message: vcopUpdateMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      read: false,
      senderName: 'DC S. Morgan',
      recipientId: 'victim-michael'
    };

    // Send VCOP update using POLICE_TO_VICTIM_MESSAGE type instead
    // This ensures it uses the same routing logic as other messages
    websocketService.sendMessage('POLICE_TO_VICTIM_MESSAGE', {
      ...vcopUpdate,
      sender: 'officer',
      officerName: 'DC S. Morgan',
      vcopUpdate: true, // Add flag to identify as VCOP update
      victimId: 'victim-michael'
    });

    // Clear the input and close the modal
    setVCOPUpdateMessage('');
    setShowVCOPModal(false);

    // Show success message
    alert(`VCOP update sent successfully to ${caseItem.victimName}`);
  };

  // Add state for task request modal and message
  const [showTaskRequestModal, setShowTaskRequestModal] = useState(false);
  const [taskRequestMessage, setTaskRequestMessage] = useState('');

  // Add function to handle submitting task requests
  const handleSendTaskRequest = (caseItem: Case) => {
    if (!taskRequestMessage.trim()) {
      alert('Please enter task request details');
      return;
    }

    console.log('Sending task request for case:', caseItem.crimeNumber);
    
    // Create the task request object
    const taskRequest = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      summary: taskRequestMessage,
      offence: caseItem.crimeType || 'UNKNOWN',
      offenceColor: caseItem.color || 'bg-blue-500',
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

    // Show success message
    alert(`Task request sent successfully to Admin`);
  };

  // Toggle case card expansion
  const toggleCardExpansion = (caseId: string) => {
    setExpandedCardIds(prev => {
      if (prev.includes(caseId)) {
        return prev.filter(id => id !== caseId);
      } else {
        return [...prev, caseId];
      }
    });
  };

  // Add function to toggle appointment card expansion
  const toggleAppointmentCardExpansion = (appointmentId: string) => {
    setExpandedAppointmentIds(prev => {
      if (prev.includes(appointmentId)) {
        return prev.filter(id => id !== appointmentId);
      } else {
        return [...prev, appointmentId];
      }
    });
  };

  // Add ZOORIE related cases
  const zoorieRelatedCases: Case[] = [
    {
      id: 'zoorie-1',
      victimName: 'SARAH WILLIAMS',
      dateOfBirth: '15/03/1992',
      address: '23 Tech Lane, London EC2A 4BQ',
      crimeType: 'CYBER FRAUD',
      crimeNumber: 'ZOORIE/001/24',
      color: 'bg-red-500'
    },
    {
      id: 'zoorie-2',
      victimName: 'DAVID CHEN',
      dateOfBirth: '22/07/1988',
      address: '45 Digital Ave, London E1 6BT',
      crimeType: 'DATA THEFT',
      crimeNumber: 'ZOORIE/002/24',
      color: 'bg-blue-500'
    },
    {
      id: 'zoorie-3',
      victimName: 'RACHEL KUMAR',
      dateOfBirth: '08/11/1995',
      address: '78 Cloud Street, London SW1P 3AT',
      crimeType: 'IDENTITY THEFT',
      crimeNumber: 'ZOORIE/003/24',
      color: 'bg-purple-500'
    },
    {
      id: 'zoorie-4',
      victimName: 'MARK TAYLOR',
      dateOfBirth: '30/09/1983',
      address: '12 Cyber Road, London N1 9GF',
      crimeType: 'CYBER STALKING',
      crimeNumber: 'ZOORIE/004/24',
      color: 'bg-green-500'
    },
    {
      id: 'zoorie-5',
      victimName: 'EMMA PATEL',
      dateOfBirth: '17/04/1990',
      address: '56 Network Lane, London W2 1NY',
      crimeType: 'CYBER FRAUD',
      crimeNumber: 'ZOORIE/005/24',
      color: 'bg-orange-400'
    },
    {
      id: 'zoorie-6',
      victimName: 'JAMES WILSON',
      dateOfBirth: '03/12/1987',
      address: '89 Data Drive, London SE1 7PB',
      crimeType: 'DATA BREACH',
      crimeNumber: 'ZOORIE/006/24',
      color: 'bg-blue-500'
    }
  ];

  // Add new state for ZOORIE view
  const [showZoorieView, setShowZoorieView] = useState(false);

  // Add handler for ZOORIE operation click
  const handleZoorieClick = () => {
    setShowZoorieView(true);
  };

  // Add handler for back from ZOORIE view
  const handleZoorieBack = () => {
    setShowZoorieView(false);
  };

  // Add new state for ZOORIE update input
  const [zoorieUpdateInput, setZoorieUpdateInput] = useState('');

  // Add handler for sending ZOORIE updates
  const handleSendZoorieUpdate = () => {
    if (!zoorieUpdateInput.trim()) return;

    // Send update to all ZOORIE victims
    zoorieRelatedCases.forEach(caseItem => {
      const message = {
        type: 'POLICE_TO_VICTIM_MESSAGE',
        vcopUpdate: true,
        content: zoorieUpdateInput,
        victimId: caseItem.id,
        recipientId: caseItem.id,
        timestamp: new Date().toISOString(),
        crimeNumber: caseItem.crimeNumber
      };
      
      websocketService.sendMessage('POLICE_TO_VICTIM_MESSAGE', message);
    });

    // Clear input after sending
    setZoorieUpdateInput('');

    // Show success message
    alert('Updates have been sent to all ZOORIE victims');
  };

  // Add new state for kebab menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Add handler for kebab menu
  const handleExportOption = (caseId: string, option: 'all' | 'selected' | 'other') => {
    const caseItem = cases.find(c => c.id === caseId);
    if (!caseItem) return;

    switch (option) {
      case 'all':
        alert(`Exporting all data for case: ${caseItem.crimeNumber}`);
        break;
      case 'selected':
        alert(`Exporting selected data for case: ${caseItem.crimeNumber}`);
        break;
      case 'other':
        alert(`Exporting to other system for case: ${caseItem.crimeNumber}`);
        break;
    }
    setOpenMenuId(null);
  };

  // Add new state for case details
  const [matchingCase, setMatchingCase] = useState<Case | null>(null);
  const [crimeNumberInput, setCrimeNumberInput] = useState('');

  // Render the appropriate view based on current state
  if (currentView === 'splash') {
    return (
      <SplashScreen
        onSelectPoliceApp={handleSelectPoliceApp}
        onSelectAdminDashboard={handleSelectAdminDashboard}
        onSelectVictimApp={handleSelectVictimApp}
      />
    );
  }

  if (currentView === 'admin') {
    return (
      <>
        <AdminDashboard 
          onBack={handleBackToSplash} 
          onSendMessageToOfficer={handleSendMessageToOfficer}
          officerMessages={adminMessages}
        />
        <ConnectionStatus />
      </>
    );
  }

  if (currentView === 'victim') {
    return (
      <>
        <VictimApp onBack={handleBackToSplash} />
        <ConnectionStatus />
      </>
    );
  }

  // Police App UI (simplified for fix)
  return (
    <>
    <div className="max-w-md mx-auto bg-gray-100 h-screen flex flex-col">
      {/* Status Bar */}
      <div className="bg-black text-white p-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBackToSplash}
              className="text-xs text-white bg-primary-600 px-2 py-1 rounded-full"
            >
              Back to Home
            </button>
          </div>
        <div className="flex items-center gap-1">
          <BiSignal4 className="text-white" />
            <RiWifiLine className={`${wsConnected ? 'text-green-400' : 'text-red-400'}`} />
          <RiBattery2Fill className="text-white" />
          <span className="text-xs">12:30</span>
        </div>
      </div>

        {/* Add Case Modal */}
        {showAddCaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Add New Person Record</h2>
              
              <form onSubmit={handleSubmitNewCase}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Crime Number
                  </label>
                  <input
                    name="crimeNumber"
                    type="text"
                    placeholder="Enter crime number (e.g. CRI45678/23)"
                    required
                    value={crimeNumberInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCrimeNumberInput(value);
                      // Find matching case from dummyCases
                      const match = dummyCases.find(c => c.crimeNumber.toLowerCase() === value.toLowerCase());
                      setMatchingCase(match || null);
                    }}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    disabled={showSuccessMessage}
                  />
                </div>

                {/* Show matching case details if found */}
                {matchingCase && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">Case Details Found:</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Victim Name:</span> {matchingCase.victimName}</p>
                      <p><span className="font-semibold">Date of Birth:</span> {matchingCase.dateOfBirth}</p>
                      <p><span className="font-semibold">Address:</span> {matchingCase.address}</p>
                      <p><span className="font-semibold">Crime Type:</span> {matchingCase.crimeType}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg flex items-center justify-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FiCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-green-700 font-medium">{successMessage}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCaseModal(false);
                      setCrimeNumberInput('');
                      setMatchingCase(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    disabled={showSuccessMessage}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={showSuccessMessage}
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showChatView ? (
          <ChatView
            victimName={selectedCaseName}
            caseNumber={selectedCaseNumber}
            crimeType={selectedCrimeType}
            onBack={handleChatBack}
            onSendMessageToVictim={handleSendMessageToVictim}
            victimMessages={(victimMessages[selectedCaseId || 'case1'] || []) as any}
          />
        ) : showCrimeSummaryView ? (
          <div className="flex-1 flex flex-col bg-gray-100">
            {/* Crime Summary Header */}
            <div className="bg-white p-4 flex justify-between items-center shadow-sm">
              <button
                onClick={handleCrimeSummaryBack}
                className="flex items-center text-blue-600"
              >
                &lt; Back
              </button>
              <button
                className="border border-blue-600 rounded-full text-blue-600 px-4 py-1"
              >
                Add Witness
              </button>
            </div>

            {/* Crime Summary Content */}
            <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-lg mb-2">MO- Crime Summary</h2>
              <p className="text-gray-800 mb-4">
                Known male offender following an argument punches the victim in the face repeatedly causing a black eye and bloody nose.
              </p>
              <div className="text-sm">
                <p className="flex justify-between py-1">
                  <span className="font-semibold">Date of Offence:</span>
                  <span>12/05/2021 13:12:00hrs</span>
                </p>
                <p className="flex justify-between py-1">
                  <span className="font-semibold">Place of Offence:</span>
                  <span>12 Winston Rd, London NW1 9LN</span>
                </p>
              </div>
            </div>

            {/* Witnesses List */}
            <div className="mt-4">
              {/* Witness 1 */}
              <div className="bg-white mb-4 mx-4 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Witness</p>
                <h3 className="font-bold text-lg">Zam Rahman</h3>
                <div className="flex justify-between mt-2">
                  <button className="relative p-2 bg-blue-100 rounded-full">
                    <FiMessageSquare className="text-blue-600 text-xl" />
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">2</span>
                  </button>
                  <button className="p-2 bg-blue-100 rounded-full">
                    <FaPhone className="text-blue-600 text-xl" />
                  </button>
                  <button className="p-2 bg-blue-100 rounded-full">
                    <FaVideo className="text-blue-600 text-xl" />
                  </button>
                  <button className="p-2 bg-amber-100 rounded-full">
                    <MdOutlineContactPage className="text-amber-600 text-xl" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full">
                    <HiDotsVertical className="text-gray-600 text-xl" />
                  </button>
                </div>
              </div>

              {/* Witness 2 */}
              <div className="bg-white mb-4 mx-4 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Witness</p>
                <h3 className="font-bold text-lg">Zaina Rahman</h3>
                <div className="flex justify-between mt-2">
                  <button className="relative p-2 bg-blue-100 rounded-full">
                    <FiMessageSquare className="text-blue-600 text-xl" />
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">2</span>
                  </button>
                  <button className="p-2 bg-blue-100 rounded-full">
                    <FaPhone className="text-blue-600 text-xl" />
                  </button>
                  <button className="p-2 bg-blue-100 rounded-full">
                    <FaVideo className="text-blue-600 text-xl" />
                  </button>
                  <button className="p-2 bg-amber-100 rounded-full">
                    <MdOutlineContactPage className="text-amber-600 text-xl" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full">
                    <HiDotsVertical className="text-gray-600 text-xl" />
                  </button>
                </div>
              </div>

              {/* Witness 3 */}
              <div className="bg-white mb-4 mx-4 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Witness</p>
                <h3 className="font-bold text-lg">Srikanth Raj</h3>
                <div className="flex justify-between mt-2">
                  <button className="relative p-2 bg-blue-100 rounded-full">
                    <FiMessageSquare className="text-blue-600 text-xl" />
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full">2</span>
                  </button>
                  <button className="p-2 bg-blue-100 rounded-full">
                    <FaPhone className="text-blue-600 text-xl" />
                  </button>
                  <button className="p-2 bg-blue-100 rounded-full">
                    <FaVideo className="text-blue-600 text-xl" />
                  </button>
                  <button className="p-2 bg-amber-100 rounded-full">
                    <MdOutlineContactPage className="text-amber-600 text-xl" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full">
                    <HiDotsVertical className="text-gray-600 text-xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : showAdminMessageList ? (
          <div className="flex-1 overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Admin Messages</h2>
              <button 
                onClick={() => setShowAdminMessageList(false)}
                className="text-blue-600"
              >
                Close
              </button>
            </div>
            
            {adminMessages['off1'] && adminMessages['off1'].length > 0 ? (
              <div className="space-y-3">
                {adminMessages['off1'].map((msg, idx) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg ${msg.sender === 'admin' ? 'bg-blue-100 ml-10' : 'bg-gray-100 mr-10'}`}
                  >
                    {msg.sender === 'officer' && (
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0 mr-2 overflow-hidden">
                          <img 
                            src="https://randomuser.me/api/portraits/men/32.jpg" 
                            alt="DC S. Morgan"
                            className="w-full h-full object-cover"
                          />
            </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold">{msg.senderName}</span>
                            <span className="text-xs text-gray-500">{msg.timestamp}</span>
          </div>
                          <p className="mt-1">{msg.message}</p>
                        </div>
                      </div>
                    )}
                    
                    {msg.sender === 'admin' && (
          <div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold">{msg.senderName}</span>
                          <span className="text-xs text-gray-500">{msg.timestamp}</span>
          </div>
                        <p className="mt-1">{msg.message}</p>
        </div>
                    )}
          </div>
                ))}
                
                {/* Typing Indicator */}
                {isOfficerTyping && (
                  <div className="flex items-center space-x-1 ml-10 p-2">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-xs text-gray-500 ml-1">Admin is typing...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">No messages from admin</div>
            )}
            
            {/* Message Input */}
            <div className="mt-4 flex items-center gap-2 bg-white rounded-full p-2 border">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => {
                  setReplyMessage(e.target.value);
                  handleTypingIndicatorChange(e.target.value);
                }}
                onBlur={() => {
                  if (isTyping) {
                    setIsTyping(false);
                    websocketService.sendTypingIndicator(false);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendReply();
                  }
                }}
                placeholder="Type a reply..."
                className="flex-1 outline-none px-2"
              />
              <button 
                onClick={handleSendReply}
                className="bg-blue-600 text-white p-2 rounded-full"
              >
                <FaComment />
              </button>
            </div>
          </div>
        ) : showZoorieView ? (
          <div className="flex-1 flex flex-col">
            {/* ZOORIE Header */}
            <div className="bg-blue-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleZoorieBack}
                  className="text-blue-600 flex items-center"
                >
                  <FiArrowLeft className="mr-1" /> Back
                </button>
                <h1 className="text-lg font-bold">Operation ZOORIE</h1>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">Total Victims</span>
                  <h2 className="text-2xl font-bold">{zoorieRelatedCases.length}</h2>
                </div>
                <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">
                  CYBER CRIME
                </div>
              </div>
            </div>

            {/* ZOORIE Update Input - Moved to top */}
            <div className="bg-white p-4 border-b">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={zoorieUpdateInput}
                  onChange={(e) => setZoorieUpdateInput(e.target.value)}
                  placeholder="Type update for all victims..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendZoorieUpdate();
                    }
                  }}
                />
                <button
                  onClick={handleSendZoorieUpdate}
                  disabled={!zoorieUpdateInput.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    zoorieUpdateInput.trim() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </div>
            </div>

            {/* ZOORIE Cases List */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {zoorieRelatedCases.map((caseItem) => (
                  <div key={caseItem.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold">{caseItem.victimName}</h3>
                          <div className="text-sm text-gray-500 mt-1">DOB: {caseItem.dateOfBirth}</div>
                          <div className="text-sm text-gray-500">{caseItem.address}</div>
                        </div>
                      </div>
                      
                      <div className="flex mt-3">
                        <div className={`${caseItem.color} text-white text-xs px-2 py-1 rounded-sm`}>
                          {caseItem.crimeType}
                        </div>
                        <div className="ml-2 text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded-sm">
                          {caseItem.crimeNumber}
                        </div>
                      </div>
                    </div>

                    <div className="border-t">
                      <div className="flex items-center justify-between px-4 py-2">
                        {/* Message */}
                        <button className="flex items-center justify-center">
                          <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                            <FiMessageSquare className="w-[17px] h-[17px] text-blue-600" />
                          </div>
                        </button>
                        
                        {/* Phone */}
                        <button className="flex items-center justify-center">
                          <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                            <FaPhone className="w-[17px] h-[17px] text-blue-600" />
                          </div>
                        </button>
                        
                        {/* Video */}
                        <button className="flex items-center justify-center">
                          <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                            <FaVideo className="w-[17px] h-[17px] text-blue-600" />
                          </div>
                        </button>

                        {/* Document Store */}
                        <button className="flex items-center justify-center">
                          <div className="w-[36px] h-[36px] bg-yellow-100 rounded-full flex items-center justify-center">
                            <MdOutlineContactPage className="w-[17px] h-[17px] text-amber-600" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Search Bar - New Header Design */}
            <div className="bg-gray-100 border-b border-gray-200">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between p-3">
                <button className="p-2">
                  <FaBars className="text-gray-800 text-xl" />
                </button>
                
                <div className="flex items-center space-x-2 flex-1 mx-4">
                  <div className="relative">
                    <img 
                      src="https://randomuser.me/api/portraits/men/32.jpg" 
                      alt="DC S. Morgan"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="font-bold text-black">S.Morgan</h2>
                    <span className="text-xs text-gray-500">DC 12345</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div 
                    className="relative cursor-pointer" 
                    onClick={() => {
                      handleViewAdminMessages();
                    }}
                  >
                    <FaComment className="text-gray-800 text-xl" />
                    {/* Add notification badge for unread messages */}
                    {unreadAdminMessages > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {unreadAdminMessages}
                      </div>
                    )}
                  </div>
                  <div 
                    className="text-blue-600 text-xl cursor-pointer"
                    onClick={handleAddCase}
                  >
                    <IoMdAdd />
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex px-4 pt-2">
        <button
                  className={`flex-1 py-3 font-medium rounded-tl-lg rounded-tr-lg ${activeTab === 'cases' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
          onClick={() => setActiveTab('cases')}
        >
          Active Cases
                  <span className="ml-2 bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center text-xs">
            {cases.length}
          </span>
        </button>
        <button
                  className={`flex-1 py-3 font-medium rounded-tl-lg rounded-tr-lg ${activeTab === 'appointments' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
                  <span className="ml-2 bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center text-xs">
            {appointments.length}
          </span>
        </button>
      </div>

              {/* Search Bar */}
              <div className="px-5 py-3">
                <div className="bg-white rounded-full border border-gray-300 flex items-center p-2">
                  <FaSearch className="text-gray-400 mx-2" />
            <input
              type="text"
              placeholder="Search victim names or crime numbers"
                    className="bg-transparent text-gray-800 placeholder-gray-400 outline-none w-full text-sm"
            />
                  {/* Removing the search icon div */}
          </div>
          </div>
        </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'cases' && (
                <div className="p-4 space-y-4">
              {sortedCases.map((caseItem) => (
  <div key={caseItem.id} className="bg-white rounded-lg shadow overflow-hidden">
    {caseItem.isOperation ? (
      // For ZOORIE operation card - removing the Send updates button
      <div className="bg-blue-100 cursor-pointer" onClick={handleZoorieClick}>
        <div className="p-4">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center">
                <h3 className="font-bold">{caseItem.victimName}</h3>
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                  OP NAME
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {caseItem.operationStats?.victimCount} victims are in this operation
              </p>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === caseItem.id ? null : caseItem.id);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <HiDotsVertical className="text-gray-600 text-xl" />
              </button>
              {openMenuId === caseItem.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportOption(caseItem.id, 'all');
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      Export all data
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportOption(caseItem.id, 'selected');
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      Export selected data
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportOption(caseItem.id, 'other');
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      Export to other
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex mt-3">
            <div className={`${caseItem.color || 'bg-blue-500'} text-white text-xs px-2 py-1 rounded-sm`}>
              {caseItem.crimeType}
            </div>
            <div 
              className="ml-2 text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded-sm cursor-pointer hover:bg-gray-300"
              onClick={() => handleOpenCrimeSummary(caseItem.id, caseItem.victimName)}
            >
              {caseItem.crimeNumber}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <>
        <div className="p-4">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">{caseItem.victimName}</h3>
              <div className="text-sm text-gray-500 mt-1">DOB: {caseItem.dateOfBirth}</div>
              <div className="text-sm text-gray-500">{caseItem.address}</div>
            </div>
            {/* Add kebab menu for regular cases */}
            <div className="relative">
                    <button
                onClick={() => setOpenMenuId(openMenuId === caseItem.id ? null : caseItem.id)}
                className="p-1 hover:bg-gray-100 rounded-full"
                    >
                <HiDotsVertical className="text-gray-600 text-xl" />
                    </button>
              {openMenuId === caseItem.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border">
                  <div className="py-1">
                        <button
                      onClick={() => handleExportOption(caseItem.id, 'all')}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                      Export all data
                        </button>
                        <button
                      onClick={() => handleExportOption(caseItem.id, 'selected')}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                      Export selected data
                        </button>
                        <button
                      onClick={() => handleExportOption(caseItem.id, 'other')}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                      Export to other
                        </button>
                      </div>
                    </div>
              )}
            </div>
          </div>

          <div className="flex mt-3">
            <div className={`${caseItem.color || 'bg-blue-500'} text-white text-xs px-2 py-1 rounded-sm`}>
                          {caseItem.crimeType}
                        </div>
            <div 
              className="ml-2 text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded-sm cursor-pointer hover:bg-gray-300"
              onClick={() => handleOpenCrimeSummary(caseItem.id, caseItem.victimName)}
            >
              {caseItem.crimeNumber}
                      </div>
                      </div>
                    </div>

        <div className="border-t">
          {/* Main Action Row - Always visible */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Message */}
                        <button
              className="flex items-center justify-center"
              onClick={() => {
                setSelectedCaseId(caseItem.id);
                setSelectedCaseName(caseItem.victimName);
                setShowChatView(true);
              }}
            >
              <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                <FiMessageSquare className="w-[17px] h-[17px] text-blue-600" />
                      </div>
                        </button>
            
            {/* Phone */}
                        <button
              className="flex items-center justify-center"
                          onClick={() => handleOpenCommunication('call', caseItem.id, caseItem.victimName)}
                        >
              <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                <FaPhone className="w-[17px] h-[17px] text-blue-600" />
                        </div>
                        </button>
            
            {/* Video */}
                        <button
              className="flex items-center justify-center"
                          onClick={() => handleOpenCommunication('video', caseItem.id, caseItem.victimName)}
                        >
              <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                <FaVideo className="w-[17px] h-[17px] text-blue-600" />
                      </div>
            </button>

            {/* Document Store */}
                    <button
              className="flex items-center justify-center"
              onClick={() => {
                setSelectedCaseId(caseItem.id);
                setSelectedCaseName(caseItem.victimName);
                setShowNotesModal(true);
              }}
            >
              <div className="w-[36px] h-[36px] bg-yellow-100 rounded-full flex items-center justify-center">
                <BsFileEarmarkText className="w-[17px] h-[17px] text-amber-600" />
                    </div>
                    </button>

            {/* Toggle button */}
                    <button
              onClick={() => toggleCardExpansion(caseItem.id)} 
              className="flex items-center justify-center"
            >
              <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center">
                {expandedCardIds.includes(caseItem.id) ? 
                  <FiChevronUp className="w-[17px] h-[17px] text-gray-600" /> : 
                  <FiChevronDown className="w-[17px] h-[17px] text-gray-600" />
                }
                  </div>
                    </button>
          </div>

          {/* Secondary Row - Collapsible */}
          {expandedCardIds.includes(caseItem.id) && (
                  <div className="flex border-t">
              {/* Document Store */}
                    <button
                className="flex-1 py-2.5 flex flex-col items-center justify-center text-blue-600 text-[8px]"
                onClick={() => {
                  setSelectedCaseId(caseItem.id);
                  setSelectedCaseName(caseItem.victimName);
                  setShowDocumentsModal(true);
                }}
              >
                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center mb-1">
                  <MdOutlineContactPage className="w-[17px] h-[17px]" />
                </div>
                <span>Document Store</span>
                      </button>

              {/* Create Appointment */}
                        <button
                className="flex-1 py-2.5 flex flex-col items-center justify-center text-blue-600 border-l text-[8px]"
                onClick={() => {
                  setSelectedCaseId(caseItem.id);
                  setSelectedCaseName(caseItem.victimName);
                  setSelectedCaseNumber(caseItem.crimeNumber);
                  setSelectedCrimeType(caseItem.crimeType);
                  setShowAppointmentModal(true);
                }}
              >
                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center mb-1">
                  <BsCalendar3 className="w-[17px] h-[17px]" />
                </div>
                <span>Create Appointment</span>
                        </button>
              
              {/* Send VCOP Update */}
                        <button
                className="flex-1 py-2.5 flex flex-col items-center justify-center text-blue-600 border-l text-[8px]"
                onClick={() => {
                  setSelectedCaseId(caseItem.id);
                  setSelectedCaseName(caseItem.victimName);
                  setShowVCOPModal(true);
                }}
              >
                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center mb-1">
                  <FiHelpCircle className="w-[17px] h-[17px]" />
                </div>
                <span>Send VCOP Update</span>
                        </button>

              {/* Request Task */}
                        <button
                className="flex-1 py-2.5 flex flex-col items-center justify-center text-blue-600 border-l text-[8px]"
                onClick={() => {
                  setSelectedCaseId(caseItem.id);
                  setSelectedCaseName(caseItem.victimName);
                  setSelectedCaseNumber(caseItem.crimeNumber);
                  setSelectedCrimeType(caseItem.crimeType);
                  setShowTaskRequestModal(true);
                }}
              >
                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center mb-1">
                  <FiClipboard className="w-[17px] h-[17px]" />
                </div>
                <span>Request Task</span>
                        </button>
                      </div>
          )}
                    </div>
      </>
    )}
                </div>
              ))}
            </div>
              )}
              
              {activeTab === 'appointments' && (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold">Upcoming Appointments</h2>
          </div>

                  {appointments.length > 0 ? (
                    <div className="space-y-3">
              {appointments.map(appointment => {
                // Explicitly return the JSX element
                return (
                        <div key={appointment.id} className="bg-white rounded-lg shadow overflow-hidden">
                          {/* Add padding wrapper for content */}
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <div className={`${appointment.color || 'bg-blue-500'} text-white text-xs px-2 py-1 rounded-sm mb-2 inline-block`}>
                                  {appointment.type}
                        </div>
                                <span className="font-medium">{appointment.relatedTo}</span>
                                <span className="text-sm text-gray-500">{appointment.relatedCase}</span>
                                <span className="text-sm text-gray-500">{appointment.relatedCrimeType}</span>
                        </div>
                              <div className="text-right">
                                <div className="font-bold">{appointment.date}</div>
                                <div className="text-blue-600">{appointment.time}</div>
                      </div>
                            </div>
                          </div> {/* End content padding wrapper */}
                  
                          {/* Replicate Action button row structure from Active Cases */}
                          <div className="border-t">
                            {/* Change justify-around to justify-between */}
                            <div className="flex items-center justify-between px-4 py-2"> 
                              {/* Message Button (Icon Style) */}
                              <button
                                className="flex items-center justify-center"
                                onClick={() => handleOpenCommunication('message', appointment.id, appointment.relatedTo)}
                              >
                                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center" title="Message">
                                  <FiMessageSquare className="w-[17px] h-[17px] text-blue-600" />
                                </div>
                              </button>

                              {/* Call Button (Icon Style) */}
                              <button
                                className="flex items-center justify-center"
                                onClick={() => handleOpenCommunication('call', appointment.id, appointment.relatedTo)}
                              >
                                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center" title="Call">
                                  <FaPhone className="w-[17px] h-[17px] text-blue-600" />
                                </div>
                              </button>

                              {/* Video Button (Icon Style) */}
                              <button
                                className="flex items-center justify-center"
                                onClick={() => handleOpenCommunication('video', appointment.id, appointment.relatedTo)}
                              >
                                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center" title="Video">
                                  <FaVideo className="w-[17px] h-[17px] text-blue-600" />
                                </div>
                              </button>

                              {/* Reschedule Button (Icon Style) */}
                              <button
                                className="flex items-center justify-center"
                                onClick={() => handleOpenCalendar(
                                  appointment.id, 
                                  appointment.relatedTo, 
                                  appointment.relatedCase, 
                                  appointment.relatedCrimeType
                                )}
                              >
                                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center" title="Reschedule">
                                  <BsCalendar3 className="w-[17px] h-[17px] text-blue-600" />
                                </div>
                              </button>

                              {/* Change 4th button to Notes icon with yellow/amber colors and correct onClick */}
                              <button
                                className="flex items-center justify-center"
                                onClick={() => handleOpenNotes(appointment.id, appointment.relatedTo)}
                              >
                                <div className="w-[36px] h-[36px] bg-yellow-100 rounded-full flex items-center justify-center" title="Notes">
                                  <BsFileEarmarkText className="w-[17px] h-[17px] text-amber-600" />
                                </div>
                              </button>

                              {/* Add Expand/Collapse toggle button */}
                              <button
                                onClick={() => toggleAppointmentCardExpansion(appointment.id)} 
                                className="flex items-center justify-center"
                              >
                                <div className="w-[36px] h-[36px] bg-gray-200 rounded-full flex items-center justify-center" title={expandedAppointmentIds.includes(appointment.id) ? "Collapse" : "Expand"}>
                                  {expandedAppointmentIds.includes(appointment.id) ? 
                                    <FiChevronUp className="w-[17px] h-[17px] text-gray-600" /> : 
                                    <FiChevronDown className="w-[17px] h-[17px] text-gray-600" />
                                  }
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Add Expanded content area for Appointments (Optional - can add actions later) */}
                          {expandedAppointmentIds.includes(appointment.id) && (
                            <div className="border-t p-4 text-sm text-gray-600">
                              {/* Add secondary actions like Reschedule, Docs etc. here if needed */}
                              Expanded content for appointment {appointment.id}...
                              {/* Example: Reschedule button */}
                              <button 
                                onClick={() => handleOpenCalendar(appointment.id, appointment.relatedTo, appointment.relatedCase, appointment.relatedCrimeType)}
                                className="mt-2 text-blue-600"
                              >
                                Reschedule Appointment
                              </button>
                            </div>
                          )}
                        </div>
                      );
              })}
            </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10">No appointments scheduled</div>
                  )}
          </div>
              )}
        </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showNotesModal && (
      <NotesModal
        isOpen={showNotesModal}
        caseId={selectedCaseId}
        caseName={selectedCaseName}
          onClose={() => setShowNotesModal(false)} 
      />
      )}

      {showDocumentsModal && (
      <DocumentsModal
        isOpen={showDocumentsModal}
        caseId={selectedCaseId}
        caseName={selectedCaseName}
          onClose={() => setShowDocumentsModal(false)} 
        />
      )}
      
      {showAppointmentModal && (
        <AppointmentModal 
          isOpen={showAppointmentModal}
          caseName={selectedCaseName}
          caseNumber={selectedCaseNumber}
          crimeType={selectedCrimeType}
          onClose={() => setShowAppointmentModal(false)}
          onSave={handleSaveAppointment}
        />
      )}
      
      {showAddCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Person Record</h2>
            
            <form onSubmit={handleSubmitNewCase}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Crime Number
                </label>
                <input
                  name="crimeNumber"
                  type="text"
                  placeholder="Enter crime number (e.g. CRI45678/23)"
                  required
                  value={crimeNumberInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCrimeNumberInput(value);
                    // Find matching case from dummyCases
                    const match = dummyCases.find(c => c.crimeNumber.toLowerCase() === value.toLowerCase());
                    setMatchingCase(match || null);
                  }}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  disabled={showSuccessMessage}
                />
              </div>

              {/* Show matching case details if found */}
              {matchingCase && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">Case Details Found:</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Victim Name:</span> {matchingCase.victimName}</p>
                    <p><span className="font-semibold">Date of Birth:</span> {matchingCase.dateOfBirth}</p>
                    <p><span className="font-semibold">Address:</span> {matchingCase.address}</p>
                    <p><span className="font-semibold">Crime Type:</span> {matchingCase.crimeType}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg flex items-center justify-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-green-700 font-medium">{successMessage}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCaseModal(false);
                    setCrimeNumberInput('');
                    setMatchingCase(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={showSuccessMessage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={showSuccessMessage}
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showVCOPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 max-w-md">
            <h2 className="text-xl font-bold mb-3">Send VCOP Update</h2>
            <p className="text-sm text-gray-600 mb-3">
              Sending update to: {selectedCaseName} ({cases.find(c => c.id === selectedCaseId)?.crimeNumber})
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Message
              </label>
              <textarea
                value={vcopUpdateMessage}
                onChange={(e) => setVCOPUpdateMessage(e.target.value)}
                placeholder="Enter your VCOP update here..."
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowVCOPModal(false);
                  setVCOPUpdateMessage('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const caseItem = cases.find(c => c.id === selectedCaseId);
                  if (caseItem) {
                    handleSendVCOPUpdate(caseItem);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send Update
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showTaskRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 max-w-md">
            <h2 className="text-xl font-bold mb-3">Send Task Request</h2>
            <p className="text-sm text-gray-600 mb-3">
              Sending request to: {selectedCaseName} ({cases.find(c => c.id === selectedCaseId)?.crimeNumber})
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Request Details
              </label>
              <textarea
                value={taskRequestMessage}
                onChange={(e) => setTaskRequestMessage(e.target.value)}
                placeholder="Enter your task request details here..."
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTaskRequestModal(false);
                  setTaskRequestMessage('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ConnectionStatus />
    </>
  );
}

export default App;
