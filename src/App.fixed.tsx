import { FaSearch, FaBars, FaComment, FaPhone, FaVideo, FaEllipsisV } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';
import { HiDotsVertical } from 'react-icons/hi';
import { BsFileEarmarkText, BsCalendar3 } from 'react-icons/bs';
import { RiWifiLine } from 'react-icons/ri';
import { BiSignal4 } from 'react-icons/bi';
import { RiBattery2Fill } from 'react-icons/ri';
import { FiMessageSquare, FiPaperclip, FiBell, FiHelpCircle } from 'react-icons/fi';
import { MdOutlineContactPage } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';
import NotesModal from './components/NotesModal';
import DocumentsModal from './components/DocumentsModal';
import AppointmentModal from './components/AppointmentModal';
import SplashScreen from './components/SplashScreen';
import AdminDashboard from './components/AdminDashboard';
import VictimApp from './components/VictimApp';
import ChatView from './components/ChatView';
import { AdminChatMessage } from './components/AdminChatView';
import websocketService, { WebSocketMessage } from './services/websocketService';

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
}

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
        userId = 'victim-john';
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
        if (!message.payload.recipientId || message.payload.recipientId === 'off1') {
          handleIncomingVictimMessage(message.payload);
        } else {
          console.log('Ignoring VICTIM_MESSAGE - not addressed to current user');
        }
        break;
        
      case 'TYPING_INDICATOR':
        // Handle typing indicator
        console.log('Processing TYPING_INDICATOR with payload:', message.payload);
        
        // Check if we should handle this typing indicator based on sender
        if (message.senderId.startsWith('admin')) {
          // Admin is typing, update state for officer view
          setIsOfficerTyping(message.payload.isTyping);
        } 
        else if (message.senderId.startsWith('victim')) {
          // Only handle if we're in police view and viewing the relevant case
          if (currentView === 'police' && message.payload.recipientId === 'off1') {
            console.log('Victim is typing:', message.payload.isTyping);
            // Update victim typing state here if needed
            // You might need to add a state for victim typing indicators
          }
        }
        else if (message.senderId.startsWith('off')) {
          // Officer is typing, update state for admin or victim view
          if (currentView === 'victim') {
            setIsOfficerTyping(message.payload.isTyping);
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
      senderName: payload.senderName || 'John Linden',
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
        recipientId: 'victim-john'
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

  // Load cases from localStorage on init
  const loadCasesFromStorage = () => {
    const storedCases = localStorage.getItem('cases');
    if (storedCases) {
      return JSON.parse(storedCases);
    }
    // Return 10 sample cases if no cases exist in localStorage
    return [
      {
        id: 'case1',
        victimName: 'JOHN LINDEN',
        dateOfBirth: '30/11/1986',
        address: '12 New town Rd, London NW1 9LN, UK',
        crimeType: 'SEC 47 ASSAULT',
        crimeNumber: 'CRI12145/21',
        hasNotifications: false,
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
      },
      {
        id: 'case3',
        victimName: 'MARIA JOHNSON',
        dateOfBirth: '15/04/1991',
        address: '45 Apple St, London EC2M 7PY, UK',
        crimeType: 'BURGLARY',
        crimeNumber: 'CRI12789/21',
        color: 'bg-yellow-500'
      },
      {
        id: 'case4',
        victimName: 'ROBERT WILLIAMS',
        dateOfBirth: '22/07/1978',
        address: '78 Pine Lane, London SE1 7TH, UK',
        crimeType: 'THEFT',
        crimeNumber: 'CRI12802/21',
        color: 'bg-green-500'
      },
      {
        id: 'case5',
        victimName: 'SARAH THOMPSON',
        dateOfBirth: '03/12/1989',
        address: '23 Oak Dr, London NW3 5JE, UK',
        crimeType: 'VANDALISM',
        crimeNumber: 'CRI12921/21',
        color: 'bg-blue-500'
      },
      {
        id: 'case6',
        victimName: 'DAVID PATEL',
        dateOfBirth: '17/08/1975',
        address: '56 Elm St, London SW1A 1AA, UK',
        crimeType: 'FRAUD',
        crimeNumber: 'CRI13056/21',
        color: 'bg-indigo-500'
      },
      {
        id: 'case7',
        victimName: 'JENNIFER CLARK',
        dateOfBirth: '29/05/1993',
        address: '89 Cedar Rd, London W1A 0AX, UK',
        crimeType: 'HARASSMENT',
        crimeNumber: 'CRI13145/21',
        color: 'bg-purple-500'
      },
      {
        id: 'case8',
        victimName: 'MICHAEL BROWN',
        dateOfBirth: '11/09/1982',
        address: '34 Maple Ave, London E14 9GE, UK',
        crimeType: 'PROPERTY DAMAGE',
        crimeNumber: 'CRI13278/21',
        color: 'bg-pink-500'
      },
      {
        id: 'case9',
        victimName: 'EMILY ROBERTS',
        dateOfBirth: '04/02/1990',
        address: '67 Birch Blvd, London N1C 4AG, UK',
        crimeType: 'IDENTITY THEFT',
        crimeNumber: 'CRI13389/21',
        color: 'bg-teal-500'
      },
      {
        id: 'case10',
        victimName: 'DANIEL WILSON',
        dateOfBirth: '20/06/1987',
        address: '12 Spruce St, London SE10 0DX, UK',
        crimeType: 'CYBERCRIME',
        crimeNumber: 'CRI13467/21',
        color: 'bg-cyan-500'
      }
    ];
  };

  // In your App function, update the cases state to use loadCasesFromStorage
  const [cases, setCases] = useState<Case[]>(loadCasesFromStorage());
  // Add a state for new case crime number
  const [newCaseNumber, setNewCaseNumber] = useState('');

  // Create a function to save cases to localStorage
  const saveCasesToStorage = (casesData: Case[]) => {
    localStorage.setItem('cases', JSON.stringify(casesData));
  };

  // Create a function to add a new case with just a crime number
  const handleAddCase = () => {
    if (!newCaseNumber.trim()) return;
    
    const newCase: Case = {
      id: `case${cases.length + 1}`,
      victimName: 'NEW CASE',
      dateOfBirth: new Date().toLocaleDateString(),
      address: 'To be updated',
      crimeType: 'NEW INVESTIGATION',
      crimeNumber: newCaseNumber,
      hasNotifications: false,
      color: `bg-${['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple'][Math.floor(Math.random() * 7)]}-500`
    };
    
    const updatedCases = [...cases, newCase];
    setCases(updatedCases);
    saveCasesToStorage(updatedCases);
    setNewCaseNumber(''); // Clear the input
  };

  // Add an effect to save cases to localStorage when they change
  useEffect(() => {
    saveCasesToStorage(cases);
  }, [cases]);

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
      recipientId: 'victim-john', // Important! Specify the victim ID
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

  // Add the showAddCaseModal state with the other states
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);

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
                  <div className="relative cursor-pointer" onClick={() => {
                    handleViewAdminMessages();
                  }}>
                    <FaComment className="text-gray-800 text-xl" />
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
                  <div className="bg-gray-300 rounded-full p-1">
                    <FaSearch className="text-gray-600 h-4 w-4" />
          </div>
                </div>
          </div>
        </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'cases' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Active Cases</h2>
                  
                  {/* Add Case Form */}
                  <div className="mb-4 bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter crime number"
                        className="flex-1 border p-2 rounded"
                        value={newCaseNumber}
                        onChange={(e) => setNewCaseNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCase()}
                      />
                      <button
                        onClick={handleAddCase}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Add Case
                      </button>
                    </div>
                  </div>
                  
                  {/* Cases List */}
                  <div className="p-4 space-y-4">
                    {cases.map(caseItem => (
                      <div key={caseItem.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4">
                          <div className="flex justify-between">
                            <h3 className="font-bold">{caseItem.victimName}</h3>
                            {caseItem.hasNotifications && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">DOB: {caseItem.dateOfBirth}</div>
                          <div className="text-sm text-gray-500">{caseItem.address}</div>
                          
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
                        
                        <div className="border-t flex">
                          {/* Notes Button */}
                          <button
                            className="flex-1 py-3 flex items-center justify-center text-blue-600"
                            onClick={() => handleOpenNotes(caseItem.id, caseItem.victimName)}
                          >
                            <BsFileEarmarkText className="mr-1" />
                            Notes
                          </button>
                          
                          {/* Documents Button */}
                          <button
                            className="flex-1 py-3 flex items-center justify-center text-blue-600 border-l border-r"
                            onClick={() => handleOpenDocuments(caseItem.id, caseItem.victimName)}
                          >
                            <MdOutlineContactPage className="mr-1" />
                            Docs
                          </button>

                      {/* Calendar Button */}
                      <button
                        className="flex-1 py-3 flex items-center justify-center text-blue-600"
                            onClick={() => handleOpenCalendar(caseItem.id, caseItem.victimName, caseItem.crimeNumber, caseItem.crimeType)}
                      >
                            <BsCalendar3 className="mr-1" />
                            Calendar
                      </button>
                        </div>

                        <div className="border-t flex">
                          {/* Communication buttons */}
                          <button
                            className="flex-1 py-3 flex items-center justify-center text-blue-600"
                            onClick={() => handleOpenCommunication('message', caseItem.id, caseItem.victimName)}
                          >
                            <FiMessageSquare className="mr-1" />
                            Message
                          </button>

                          <button
                            className="flex-1 py-3 flex items-center justify-center text-blue-600 border-l border-r"
                            onClick={() => handleOpenCommunication('call', caseItem.id, caseItem.victimName)}
                          >
                            <FaPhone className="mr-1" />
                            Call
                          </button>

                          <button
                            className="flex-1 py-3 flex items-center justify-center text-blue-600"
                            onClick={() => handleOpenCommunication('video', caseItem.id, caseItem.victimName)}
                          >
                            <FaVideo className="mr-1" />
                            Video
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'appointments' && (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold">Upcoming Appointments</h2>
                  </div>
                  {appointments.length > 0 ? (
                    <div className="space-y-3">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="bg-white rounded-lg shadow p-4">
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
                        
                          {/* Action buttons - First row */}
                          <div className="border-t mt-3 flex">
                            <button
                              className="flex-1 py-2 flex items-center justify-center text-blue-600"
                              onClick={() => handleOpenNotes(appointment.id, appointment.relatedTo)}
                            >
                              <BsFileEarmarkText className="mr-1" />
                              Notes
                            </button>
                          
                            <button
                              className="flex-1 py-2 flex items-center justify-center text-blue-600 border-l border-r"
                              onClick={() => handleOpenDocuments(appointment.id, appointment.relatedTo)}
                            >
                              <MdOutlineContactPage className="mr-1" />
                              Docs
                            </button>
                          
                            <button
                              className="flex-1 py-2 flex items-center justify-center text-blue-600"
                              onClick={() => handleOpenCalendar(
                                appointment.id, 
                                appointment.relatedTo, 
                                appointment.relatedCase, 
                                appointment.relatedCrimeType
                              )}
                            >
                              <BsCalendar3 className="mr-1" />
                              Reschedule
                            </button>
                          </div>

                          {/* Action buttons - Second row */}
                          <div className="border-t flex">
                            <button
                              className="flex-1 py-2 flex items-center justify-center text-blue-600"
                              onClick={() => handleOpenCommunication('message', appointment.id, appointment.relatedTo)}
                            >
                              <FiMessageSquare className="mr-1" />
                              Message
                            </button>

                            <button
                              className="flex-1 py-2 flex items-center justify-center text-blue-600 border-l border-r"
                              onClick={() => handleOpenCommunication('call', appointment.id, appointment.relatedTo)}
                            >
                              <FaPhone className="mr-1" />
                              Call
                            </button>

                            <button
                              className="flex-1 py-2 flex items-center justify-center text-blue-600"
                              onClick={() => handleOpenCommunication('video', appointment.id, appointment.relatedTo)}
                            >
                              <FaVideo className="mr-1" />
                              Video
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10">
                      No appointments scheduled
                    </div>
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
            <h2 className="text-xl font-bold mb-4">Add New Case</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // Create a new case with generated ID and add to cases
              const newCase: Case = {
                id: `case${cases.length + 1}`,
                victimName: (e.currentTarget.elements.namedItem('victimName') as HTMLInputElement).value,
                dateOfBirth: (e.currentTarget.elements.namedItem('dateOfBirth') as HTMLInputElement).value,
                address: (e.currentTarget.elements.namedItem('address') as HTMLInputElement).value,
                crimeType: (e.currentTarget.elements.namedItem('crimeType') as HTMLSelectElement).value,
                crimeNumber: (e.currentTarget.elements.namedItem('crimeNumber') as HTMLInputElement).value || 
                            `CRI${Math.floor(10000 + Math.random() * 90000)}/23`,
                hasNotifications: false,
                color: ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500'][
                  Math.floor(Math.random() * 4)
                ]
              };
              
              // Add new case to list and close modal
              setCases([newCase, ...cases]);
              setShowAddCaseModal(false);
            }}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Victim Name
                </label>
                <input
                  name="victimName"
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      />
    </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Date of Birth
                </label>
                <input
                  name="dateOfBirth"
                  type="text"
                  placeholder="DD/MM/YYYY"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Address
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Crime Type
                </label>
                <select
                  name="crimeType"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="THEFT">THEFT</option>
                  <option value="ASSAULT">ASSAULT</option>
                  <option value="BURGLARY">BURGLARY</option>
                  <option value="FRAUD">FRAUD</option>
                  <option value="VANDALISM">VANDALISM</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Crime Number
                </label>
                <input
                  name="crimeNumber"
                  type="text"
                  placeholder="e.g. CRI12345/23 (generated if empty)"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCaseModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Add Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConnectionStatus />
    </>
  );
}

export default App;
