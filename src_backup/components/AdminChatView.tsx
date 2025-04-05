import { useState, useRef, useEffect } from 'react';
import { FiPaperclip, FiSend, FiArrowLeft, FiX, FiMinimize2 } from 'react-icons/fi';
import websocketService from '../services/websocketService';

export interface AdminChatMessage {
  id: string;
  sender: 'admin' | 'officer';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Officer {
  id: string;
  name: string;
  position: string;
  badgeNumber: string;
  image: string;
  assignedCases: number;
}

interface AdminChatViewProps {
  officer: Officer;
  messages: AdminChatMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
}

const AdminChatView = ({ 
  officer, 
  messages, 
  onSendMessage, 
  onClose, 
  onMinimize 
}: AdminChatViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isOfficerTyping, setIsOfficerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOfficerTyping]);

  // Listen for typing indicator from WebSocket
  useEffect(() => {
    const unsubscribe = websocketService.onMessage(message => {
      if (message.type === 'TYPING_INDICATOR') {
        setIsOfficerTyping(message.payload.isTyping);
      }
    });
    
    return unsubscribe;
  }, []);

  // Handle typing indicator
  useEffect(() => {
    if (newMessage && !isTyping) {
      setIsTyping(true);
      websocketService.sendTypingIndicator(true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        websocketService.sendTypingIndicator(false);
      }
    }, 2000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, isTyping]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    console.log("Messages updated in AdminChatView:", messages);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setIsTyping(false);
      websocketService.sendTypingIndicator(false);
    }
  };

  // Render the message list with debugging information
  const renderMessages = () => {
    console.log("Rendering messages:", messages);
    if (!messages || messages.length === 0) {
      return <div className="text-center text-gray-500 py-4">No messages yet</div>;
    }
    
    return messages.map((msg, index) => (
      <div key={msg.id || index} className={`mb-4 ${msg.sender === 'admin' ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-lg p-3 max-w-xs md:max-w-md ${
            msg.sender === 'admin'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p>{msg.message}</p>
          <div
            className={`text-xs mt-1 ${
              msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            {msg.timestamp}
            {msg.sender === 'admin' && msg.read && (
              <span className="ml-2">✓ Read</span>
            )}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="bg-gray-100 p-3 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
          >
            <FiArrowLeft />
          </button>
          <img
            src={officer.image}
            alt={officer.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <h2 className="font-medium text-gray-900 text-sm">{officer.name}</h2>
            <p className="text-xs text-gray-500">
              {officer.position} {officer.badgeNumber} • 
              {isOfficerTyping ? (
                <span className="text-green-500 ml-1">typing...</span>
              ) : (
                <span className="text-gray-500 ml-1">Online</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {renderMessages()}
        
        {/* Typing indicator */}
        {isOfficerTyping && (
          <div className="flex justify-start">
            <div className="flex items-center bg-gray-100 rounded-full py-1 px-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-2 border-t bg-white">
        <div className="flex items-center gap-1">
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <FiPaperclip className="text-lg" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            className={`p-1.5 rounded-full ${newMessage.trim() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChatView; 