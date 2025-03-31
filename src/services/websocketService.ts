import { AdminChatMessage } from '../components/AdminChatView';
import { io, Socket } from 'socket.io-client';

// Types of messages that can be sent through WebSocket
export type WebSocketMessageType = 
  | 'ADMIN_MESSAGE' 
  | 'OFFICER_MESSAGE'
  | 'MESSAGE_READ'
  | 'TYPING_INDICATOR'
  | 'USER_CONNECTED'
  | 'USER_DISCONNECTED'
  | 'VICTIM_MESSAGE'
  | 'POLICE_TO_VICTIM_MESSAGE'
  | 'NEW_CASE_ADDED'
  | 'VCOP_UPDATE'
  | 'REQUEST_CASES'
  | 'CASE_LIST';

// Structure of WebSocket messages
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  senderId: string;
  timestamp: string;
}

// Callback type for message events
export type MessageCallback = (message: WebSocketMessage) => void;

// Frontend application URLs
const FRONTEND_URLS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://192.168.56.1:5173',
  'http://192.168.41.1:5173',
  'http://192.168.0.106:5173',
  'http://192.168.56.1:5174',
  'http://192.168.41.1:5174',
  'http://192.168.0.106:5174'
];

// Get WebSocket URL based on current hostname
const getWebSocketURL = () => {
  const hostname = window.location.hostname;
  const port = '3001';
  if (hostname === 'localhost') {
    return `http://localhost:${port}`;
  }
  // For network connections, use the IP address
  return `http://${hostname}:${port}`;
};

const SOCKET_SERVER_URL = import.meta.env.VITE_WS_URL || getWebSocketURL();

console.log('Using WebSocket server URL:', SOCKET_SERVER_URL);
console.log('Current frontend URL:', window.location.href);

// Socket.io connection options
const SOCKET_OPTIONS = {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket'],
  withCredentials: true,
  forceNew: true,
  autoConnect: true,
  reconnection: true
};

class WebSocketService {
  private socket: Socket | null = null;
  private messageListeners: MessageCallback[] = [];
  private connectionListeners: (() => void)[] = [];
  private disconnectionListeners: (() => void)[] = [];
  private reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  private userId: string = '';
  private userType: 'admin' | 'officer' | 'victim' = 'officer';
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  // Initialize WebSocket connection
  public connect(userId: string, userType: 'admin' | 'officer' | 'victim'): void {
    this.userId = userId;
    this.userType = userType;
    this.connectionAttempts = 0;

    console.log(`Connecting to WebSocket server as ${userType} with ID: ${userId}`);
    console.log('WebSocket URL:', SOCKET_SERVER_URL);
    
    // Close existing socket if any
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    try {
      // Connect to Socket.io server with options
      this.socket = io(SOCKET_SERVER_URL, SOCKET_OPTIONS);
      
      // Setup event listeners
      this.socket.on('connect', this.handleConnect.bind(this));
      this.socket.on('message', this.processMessage.bind(this));
      this.socket.on('disconnect', this.handleDisconnect.bind(this));
      this.socket.on('connect_error', this.handleConnectionError.bind(this));
      this.socket.on('error', this.handleConnectionError.bind(this));
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      this.handleConnectionError(error);
    }
  }

  // Handle successful connection
  private handleConnect(): void {
    console.log('WebSocket connected successfully');
    this.isConnected = true;
    this.connectionAttempts = 0;
    
    // Register user with the server
    if (this.socket) {
      this.socket.emit('register', { userId: this.userId, userType: this.userType });
    }
    
    // Notify listeners about connection
    this.connectionListeners.forEach(listener => listener());
  }

  // Handle disconnect event
  private handleDisconnect(): void {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    
    // Notify listeners about disconnection
    this.disconnectionListeners.forEach(listener => listener());
    
    // Start reconnection process if not already started
    if (!this.reconnectInterval) {
      this.startReconnectionProcess();
    }
  }

  // Handle connection error
  private handleConnectionError(error: any): void {
    console.error('WebSocket connection error:', error);
    this.isConnected = false;
    
    // Notify listeners about disconnection
    this.disconnectionListeners.forEach(listener => listener());
    
    // Start reconnection process if not already started
    if (!this.reconnectInterval) {
      this.startReconnectionProcess();
    }
  }

  // Start reconnection process
  private startReconnectionProcess(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected) {
        this.connectionAttempts++;
        
        // Check if we've reached the maximum reconnection attempts
        if (this.connectionAttempts > this.maxReconnectAttempts) {
          console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts.`);
          this.stopReconnectionProcess();
          return;
        }
        
        console.log(`Attempting to reconnect to WebSocket server (attempt ${this.connectionAttempts})...`);
        this.connect(this.userId, this.userType);
      } else {
        this.stopReconnectionProcess();
      }
    }, 3000); // Try every 3 seconds
  }

  // Stop reconnection process
  private stopReconnectionProcess(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  // Send a message through WebSocket
  public sendMessage(type: WebSocketMessageType, payload: any): void {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send message: not connected to WebSocket server');
      return;
    }
    
    const message: WebSocketMessage = {
      type,
      payload,
      senderId: this.userId,
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', message);
    
    try {
      // Send message through Socket.io (no need to stringify, Socket.IO handles it)
      this.socket.emit('message', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Process incoming WebSocket message
  private processMessage(message: WebSocketMessage): void {
    if (!message || !message.type) {
      console.warn('Received invalid message format:', message);
      return;
    }
    
    console.log(`Processing incoming ${message.type} from ${message.senderId}:`, message.payload);
    
    // Special handling for victim/police communication
    if (message.type === 'VICTIM_MESSAGE') {
      // If we are an officer, accept the message
      if (this.userType === 'officer') {
        console.log('Victim message received by officer');
      } 
      // If we are not an officer and not the recipient, ignore
      else if (message.payload.recipientId && message.payload.recipientId !== this.userId) {
        console.log(`Victim message not addressed to current user (${this.userId}), ignoring.`);
        return;
      }
    }
    
    if (message.type === 'POLICE_TO_VICTIM_MESSAGE') {
      // If we are a victim, accept the message
      if (this.userType === 'victim') {
        console.log('Police message received by victim');
      } 
      // If we are not a victim and not the recipient, ignore
      else if (message.payload.recipientId && message.payload.recipientId !== this.userId) {
        console.log(`Police message not addressed to current user (${this.userId}), ignoring.`);
        return;
      }
    }
    
    // Forward the message to all listeners
    this.notifyListeners(message);
  }

  // Notify all message listeners about new message
  private notifyListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  // Register a callback for receiving messages
  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.push(callback);
    
    // Return a function to unregister the callback
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
    };
  }

  // Register a callback for connection events
  public onConnect(callback: () => void): () => void {
    if (this.isConnected) {
      // If already connected, call the callback immediately
      callback();
    }
    
    this.connectionListeners.push(callback);
    
    // Return a function to unregister the callback
    return () => {
      this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
    };
  }

  // Register a callback for disconnection events
  public onDisconnect(callback: () => void): () => void {
    this.disconnectionListeners.push(callback);
    
    // Return a function to unregister the callback
    return () => {
      this.disconnectionListeners = this.disconnectionListeners.filter(listener => listener !== callback);
    };
  }

  // Get connection status
  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Disconnect WebSocket
  public disconnect(): void {
    console.log('Disconnecting from WebSocket server');
    
    this.stopReconnectionProcess();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    
    // Notify listeners
    this.disconnectionListeners.forEach(listener => listener());
  }

  // Send a chat message from admin to officer
  public sendAdminMessage(officerId: string, message: string): void {
    const payload = {
      id: Date.now().toString(),
      sender: 'admin',
      senderName: 'Admin',
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      recipientId: officerId
    };

    this.sendMessage('ADMIN_MESSAGE', payload);
  }

  // Send a chat message from officer to admin
  public sendOfficerMessage(message: string): void {
    const payload = {
      id: Date.now().toString(),
      sender: 'officer',
      senderName: 'S. Morgan',
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    this.sendMessage('OFFICER_MESSAGE', payload);
  }

  // Send typing indicator
  public sendTypingIndicator(isTyping: boolean): void {
    this.sendMessage('TYPING_INDICATOR', { isTyping });
  }

  // Mark messages as read
  public markMessagesAsRead(messageIds: string[]): void {
    this.sendMessage('MESSAGE_READ', { messageIds });
  }

  // Send a chat message from victim to officer
  public sendVictimMessage(message: string): void {
    const payload = {
      id: Date.now().toString(),
      sender: 'victim',
      senderName: 'Michael Parker',
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      recipientId: 'off1' // Specify the officer ID
    };

    this.sendMessage('VICTIM_MESSAGE', payload);
  }

  // Send a chat message from officer to victim
  public sendPoliceToVictimMessage(message: string): void {
    const payload = {
      id: Date.now().toString(),
      sender: 'officer',
      senderName: 'DC S. Morgan',
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      recipientId: 'victim-michael' // Specify the victim ID
    };

    this.sendMessage('POLICE_TO_VICTIM_MESSAGE', payload);
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 