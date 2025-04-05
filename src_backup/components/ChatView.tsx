import { useState, useRef, useEffect, useMemo } from 'react';
import { FiPaperclip, FiSend, FiArrowLeft, FiPhone, FiVideo, FiImage, FiMoreVertical, FiMic } from 'react-icons/fi';
import { BsCheckAll, BsCheck, BsEmojiSmile } from 'react-icons/bs';
import websocketService from '../services/websocketService';

interface ChatMessage {
  id: string;
  sender: 'officer' | 'victim';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface ChatViewProps {
  onBack: () => void;
  victimName: string;
  caseNumber: string;
  crimeType: string;
  onSendMessageToVictim?: (message: string) => void;
  victimMessages?: ChatMessage[];
}

const ChatView = ({ 
  onBack, 
  victimName, 
  caseNumber, 
  crimeType, 
  onSendMessageToVictim,
  victimMessages = []
}: ChatViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine local messages with victim messages
  const allMessages = useMemo(() => {
    // Filter out any duplicate messages by ID
    const messageIds = new Set(localMessages.map(msg => msg.id));
    const uniqueVictimMessages = victimMessages.filter(msg => !messageIds.has(msg.id));
    
    // Combine and sort by creation order rather than just timestamp
    // For demo messages with the same timestamp, rely on their natural order
    return [...localMessages, ...uniqueVictimMessages].sort((a, b) => {
      // First try to compare by timestamp
      const timeCompare = a.timestamp.localeCompare(b.timestamp);
      
      // If timestamps are the same, use ID (which should include timestamp in ms)
      if (timeCompare === 0) {
        return parseInt(a.id) - parseInt(b.id);
      }
      
      return timeCompare;
    });
  }, [localMessages, victimMessages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: {[key: string]: ChatMessage[]} = {};
    const today = new Date().toLocaleDateString();
    
    allMessages.forEach(msg => {
      const date = today; // For demo purposes, all messages are from today
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  }, [allMessages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use a more direct scrolling method
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      } else {
        // Fallback to the smoother method
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    // Scroll whenever messages change
    scrollToBottom();
  }, [allMessages]);

  // Also scroll on initial render
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Force scroll after rendering completes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [allMessages]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'officer',
        senderName: 'DC S. Morgan',
        message: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setLocalMessages([...localMessages, newMsg]);
      
      // Send message to victim if the handler is provided
      if (onSendMessageToVictim) {
        onSendMessageToVictim(newMessage.trim());
      }
      
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

  return (
    <div className="h-full flex flex-col bg-gray-100 relative">
      {/* WhatsApp-style wallpaper background */}
      <div className="absolute inset-0 bg-[#e5ded8] opacity-80 z-0">
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `url("data:image/png;base64,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")` 
        }}></div>
      </div>

      {/* Chat Header - WhatsApp style */}
      <div className="bg-[#128C7E] text-white p-3 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            <img 
              src={`https://ui-avatars.com/api/?name=${victimName.replace(' ', '+')}&background=random`} 
              alt={victimName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-medium text-base leading-tight">{victimName}</h2>
            <div className="flex items-center text-xs text-green-100">
              <span>{isTyping ? 'typing...' : 'online'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-5">
          <button className="text-white">
            <FiVideo className="text-xl" />
          </button>
          <button className="text-white">
            <FiPhone className="text-xl" />
          </button>
          <button className="text-white">
            <FiMoreVertical className="text-xl" />
          </button>
        </div>
      </div>

      {/* Case Info Banner */}
      <div className="bg-blue-50 p-2 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{caseNumber}</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{crimeType}</span>
        </div>
      </div>

      {/* Messages Container - WhatsApp style */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 z-10">
        {Object.entries(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start a conversation</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date}>
              <div className="text-center my-2">
                <span className="text-xs bg-[#E1F2FA] text-[#3E9D9A] px-3 py-1 rounded-full shadow-sm">
                  {date === new Date().toLocaleDateString() ? 'Today' : date}
                </span>
              </div>

              {messages.map((msg, index) => {
                // Check if we need a timestamp group
                const showTimestamp = index === 0 || 
                  messages[index - 1].sender !== msg.sender ||
                  (new Date(messages[index - 1].timestamp).getTime() - new Date(msg.timestamp).getTime() > 5 * 60 * 1000);
                
                return (
                  <div key={msg.id} className="mb-1">
                    <div 
                      className={`flex ${msg.sender === 'officer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-lg py-2 px-3 shadow-sm ${
                          msg.sender === 'officer' 
                            ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center justify-end mt-1 gap-1">
                          <span className="text-xs text-gray-500">
                            {msg.timestamp}
                          </span>
                          {msg.sender === 'officer' && (
                            <span className="text-xs text-gray-500">
                              {msg.read ? <BsCheckAll className="text-blue-500" /> : <BsCheck />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-white max-w-[70%] rounded-lg rounded-tl-none p-3 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - WhatsApp style */}
      <div className="bg-[#F0F0F0] px-2 py-2 z-10">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1">
          <button className="text-[#128C7E]">
            <BsEmojiSmile className="text-xl" />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message"
            className="flex-1 py-2 focus:outline-none text-gray-800"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTypingIndicatorChange(e.target.value);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="text-[#128C7E]">
            <FiPaperclip className="text-xl" />
          </button>
          {newMessage.trim() ? (
            <button 
              onClick={handleSendMessage}
              className="bg-[#128C7E] text-white p-2 rounded-full"
            >
              <FiSend className="text-lg" />
            </button>
          ) : (
            <button className="bg-[#128C7E] text-white p-2 rounded-full">
              <FiMic className="text-lg" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatView; 