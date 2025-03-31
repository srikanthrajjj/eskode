import { useState, useEffect, useRef, useMemo } from 'react';
import { FiX, FiInfo, FiPhone, FiMessageSquare, FiVideo, FiFileText, FiChevronDown, FiArrowLeft, FiHelpCircle, FiSend, FiPaperclip, FiMic } from 'react-icons/fi';
import { BsCheck, BsCheckAll, BsEmojiSmile } from 'react-icons/bs';
import websocketService from '../services/websocketService';

interface VictimMessage {
  id: string;
  sender: 'victim' | 'officer';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface VictimAppProps {
  onBack: () => void;
}

const VictimApp = ({ onBack }: VictimAppProps) => {
  const [showAlert, setShowAlert] = useState(true);
  const [showChatView, setShowChatView] = useState(false);
  const [messages, setMessages] = useState<VictimMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Connect to WebSocket when the component mounts
    websocketService.connect('victim-john', 'victim');
    
    // Set up event listeners
    const connectCallback = websocketService.onConnect(() => {
      console.log('Victim connected to WebSocket');
      setWsConnected(true);
    });
    
    const messageCallback = websocketService.onMessage((message) => {
      console.log('Victim received message:', message);
      
      if (message.type === 'POLICE_TO_VICTIM_MESSAGE') {
        // Check if the message is for this victim
        if (!message.payload.recipientId || message.payload.recipientId === 'victim-john') {
          console.log('Processing message from police:', message.payload);
          
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
          console.log('Ignoring message not addressed to this victim');
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
      console.log('Victim disconnected from WebSocket');
      setWsConnected(false);
    });
    
    // Cleanup when component unmounts
    return () => {
      connectCallback();
      messageCallback();
      disconnectCallback();
      websocketService.disconnect();
    };
  }, [showChatView]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
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
  }, [messages]);

  // Also scroll on initial render
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Force scroll after rendering completes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageToSend = newMessage.trim();
      const messageId = Date.now().toString();
      
      console.log('Sending message:', messageToSend);
      
      // Create the message object
      const newMsg: VictimMessage = {
        id: messageId,
        sender: 'victim' as 'victim',
        senderName: 'John Linden',
        message: messageToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      
      // Update local state
      setMessages(prev => [...prev, newMsg]);
      
      // Clear input
      setNewMessage('');
      
      // Send via websocket
      websocketService.sendMessage('VICTIM_MESSAGE', {
        ...newMsg,
        caseId: 'case1',
        recipientId: 'off1'
      });

      // Focus input after sending
      inputRef.current?.focus();
    }
  };
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: {[key: string]: VictimMessage[]} = {};
    const today = new Date().toLocaleDateString();
    
    // First sort messages properly by time and ID
    const sortedMessages = [...messages].sort((a, b) => {
      // First try to compare by timestamp
      const timeCompare = a.timestamp.localeCompare(b.timestamp);
      
      // If timestamps are the same, use ID (which should include timestamp in ms)
      if (timeCompare === 0) {
        return parseInt(a.id) - parseInt(b.id);
      }
      
      return timeCompare;
    });
    
    // Then group by date
    sortedMessages.forEach(msg => {
      const date = today; // For demo purposes, all messages are from today
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  }, [messages]);

  // Chat View component
  const ChatView = () => (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* WhatsApp-style wallpaper background */}
      <div className="absolute inset-0 bg-[#e5ded8] opacity-80 z-0">
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAAHgCAYAAABq5QSEAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QoXCywJo+59egAAC+hJREFUeNrt3V1T2+YBgOGHb/eEvad23ATiQNMmTbqTtEmbpulOM/0L/f8/oO30Y7dpk9ImJHS6PYeVbPkLSSB5jXRd04njGJCN9Mhw/wUgSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZKk/7egCOx+n3QP8o+8GXQrOgYAC8CJVtGN/nTrnr/3v9/RnBNg0QBwP0+eaL9RH+zDfrUmaxXwXXwZDTcjIu5t5gC9CWS1r5OdJHsj2enl1+LsTi+/yyoSvcE3VexMu/gRxf3idqb/2DgwEn3wQbEfI4BF+HFTPrqRnx18m84P9pNOzd8CvAcfFkBP+mYxtXxBWnwffFl8f/M7pCXhYZ5/ttvOH4+7jZ+LYI++C/n5p92j78X4xW4n/2S8Pchms33wNQ2gyzd0b2X99Qp0F1uA9xDjVgHkjXtpoX4Ivg1vFDdnbXhYXI+Lg5+L4LfyizPQg6P7PnzQSdITBH9WRf8svhfi4vcgvzwoLg+OOnn6Sbe1/lN6ZvNcFPiw2N97WDdLT7eFgbtI8BPAB6dO+iWKT0/uHSf4Inwo7qs8K4Kfnz+A/j29MLgY5BfjRnK6M2j/HLf3f0zP73TyT0aD1oNe/9RZ73D/uD/y0V5n9OmHndHnH3dHXz4cjJ6OOt100E3S/W486LXTdHeQPuq1029+6Ta/+SZpfrWTJF/vJcnXe620td/K9xupNTD6JuweeAMMCyA/tnR/eDzBPwD5wyL7D/JL6YXsYkxabL95f3p+mHZeZJ1W/mk6WP8xOr9DDfjxQXf0ywcHow8+OBh9OOiMPhu0s6fdJL2U7Xc3051msrebtPb2m6396CSr6FqDwTcZ/MIYw6cFP+w8weeHUd4cJPisjH9x7kF/dKqVtB/1h63H41bjcac3eCfZbf0Qndsp9h5fFFDvFfvgg+7g48NO69PB/uizfvvgkzjbT7N8mL1Yic7yRpzWGgIFNF8L4N5eFOMnBl+Ws+FnxXheLJ/X2tO8V3TfzS9EH0QX4vXkbH/Q/rE1aL/TOR5/2u2NPj7oDD/qdQaftHcHT/P9/VEezRpmZZUXdwEWgEe24udjT4Jh8Qe8KAOeF9GXt8vxrWL6Yv9OsY8urp8Lzrw3dut7W/vxe/F+/F7zvfjd0dl3O/3RO4Ne/N6gffBx3Nl/ku/v76a9/TzNR3nwIkuzPC8+L7Iiz+MsC7K8qJ3NbYI/rIK/Dn+wdl5EXxZBn9+upx+U0feC/FJ28f5+9Ievb3R/+1qjE/8mfrPxTvJO/G7z/firzuDgtHTQ+iLcG+5kB7tpHu9meXs3zaO9rJnvpYN8rwz+NZaDBcCoQ7q8QfLTwMNXoF/d548DPw5fhhfOPNhvvRvvN98ZPdy//e2t3Z2vbz+80Xg4eq3xcPB6/LDxm+aD+LVOd/B658HBw/ab+2+0vki/y1/k6d5+0t7fT9r5Xpq09/Jmfi1Py48LgNcweAPgF+J/BXra5fjk4GyYnDk8PDzbSZKzzebemd7+/pnGqHGmMxxc3Um7r/Z7B68OGgcP+s34dR7E5xvdwYPWt/n9fCfvZHv7abS/PyiWxAMBFnzRKsZwMc14MX70oH/QeBCfp1FcbXQPrrZ2D37f+k3y5eCbizvZYDvd29/Oe9t7+XbeidcG/dYawGKJ6+uYkXsB5BHLuXwvnbdkF0qT2uo9xPl4Xo4B8KoH2Xj4mwOg8VRoGcRfHmCxDcAAwwIswADDYkNYAMMyLsACLMCwAAMsgmFYgAUYFmABBljZLcACDMCwAAPMqqb/C1qAYQGGxTIsALAgAwwLsADDYhkWYFiABRiAYQEGYAEWYFiABVgBhmUYBTAsAAALMMAIMLAGwbAAKwCDBRgWYKw/sAALMAqwAAMWYAEGLMACDFiABRiwAAswYAEW4NcLsKEX4FeZ5wgAg2FxA8AwLMAA2CMCC7AAA7AAAzAsAQZgWIABGBZgAIZdGMAADIAF2G4ABmBYgAEYlgDDqMGw2iwB9mFlDLDdGGAUYGUMMIqwMgYYRVgZAywiy5g0AVbGAAOmMgZYRZUxwCrCtjHAKLwyBljFlTHAKMSKGGAR+eK3TViBVhkDLCLLFmDVSWUMsIgtW4BVJ5UxwCK2bAFWnVTGAIvYsgVYdVIZAyxiyxZg1UllDLCILVuAVSeVMcAitmwBVp1UxgCL2LIFWHVSGQMsYssWYNVJZQywiC1bgFUnlTHAIrZsAVadVMYAi9iyBVh1UhkDLGLLFmDVSWUMsIgtW4BVJ5UxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmN3/AJGozPTjDzm5AAAAAElFTkSuQmCC")` 
        }}></div>
      </div>

      {/* Chat header - WhatsApp style */}
      <header className="bg-[#128C7E] text-white p-3 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowChatView(false)} 
            className="text-white"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            <img 
              src="https://randomuser.me/api/portraits/men/32.jpg" 
              alt="DC S. Morgan"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-medium text-base leading-tight">DC S. Morgan</h2>
            <div className="flex items-center text-xs text-green-100">
              <span>online</span>
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
            <FiInfo className="text-xl" />
          </button>
        </div>
      </header>

      {/* Case Info Banner */}
      <div className="bg-blue-50 p-2 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">CRI12145/21</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">SEC 47 ASSAULT</span>
        </div>
      </div>

      {/* Messages Container - WhatsApp style */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 z-10">
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date}>
            <div className="text-center my-2">
              <span className="text-xs bg-[#E1F2FA] text-[#3E9D9A] px-3 py-1 rounded-full shadow-sm">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className="mb-1">
                <div 
                  className={`flex ${msg.sender === 'victim' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] rounded-lg py-2 px-3 shadow-sm ${
                      msg.sender === 'victim' 
                        ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className="flex items-center justify-end mt-1 gap-1">
                      <span className="text-xs text-gray-500">
                        {msg.timestamp}
                      </span>
                      {msg.sender === 'victim' && (
                        <span className="text-xs text-gray-500">
                          {msg.read ? <BsCheckAll className="text-blue-500" /> : <BsCheck />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
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
            onChange={(e) => setNewMessage(e.target.value)}
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
  
  // If chat view is active, show the chat interface
  if (showChatView) {
    return (
      <div className="max-w-md mx-auto bg-gray-100 h-screen w-full flex flex-col">
        <ChatView />
      </div>
    );
  }
  
  // Main Victim App UI
  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3">
            <FiArrowLeft className="text-gray-800 text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">John Linden</h1>
        </div>
        <button className="flex items-center gap-1 text-gray-800">
          <span>Help</span>
          <FiHelpCircle />
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

      {/* Ongoing Case */}
      <div className="m-4 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-3">
            Ongoing
          </div>
          
          <div className="mb-3">
            <div className="text-sm text-gray-500 mb-1">Crime no</div>
            <div className="flex justify-between items-center">
              <a href="#" className="text-blue-600 font-bold text-lg">CRI12145/21</a>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SEC 47 ASSAULT</span>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500 mb-1">Officer In Charge - <span className="text-green-600">Online</span></div>
                <div className="font-bold">DC S. Morgan</div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                VCOP
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex border-t">
          <button className="flex-1 py-4 flex items-center justify-center text-blue-600">
            <FiPhone className="text-xl" />
          </button>
          <button 
            className="flex-1 py-4 flex items-center justify-center bg-gray-200 text-blue-600 relative"
            onClick={() => setShowChatView(true)}
          >
            <FiMessageSquare className="text-xl" />
            {messages.length > 0 && messages.some(msg => msg.sender === 'officer' && !msg.read) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {messages.filter(msg => msg.sender === 'officer' && !msg.read).length}
              </span>
            )}
          </button>
          <button className="flex-1 py-4 flex items-center justify-center text-blue-600">
            <FiVideo className="text-xl" />
          </button>
          <button className="flex-1 py-4 flex items-center justify-center text-blue-600">
            <FiFileText className="text-xl" />
          </button>
          <button className="flex-1 py-4 flex items-center justify-center text-blue-600">
            <FiChevronDown className="text-xl" />
          </button>
        </div>
      </div>

      {/* Closed Case */}
      <div className="m-4 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="bg-gray-300 text-gray-700 text-sm font-medium px-3 py-1 rounded-full inline-block mb-3">
            Closed
          </div>
          
          <div className="mb-3">
            <div className="text-sm text-gray-500 mb-1">Crime no</div>
            <div className="flex justify-between items-center">
              <a href="#" className="text-blue-600 font-bold text-lg">CRI10366/19</a>
              <span className="bg-yellow-300 text-gray-800 text-xs font-bold px-2 py-1 rounded">BURGLARY</span>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500 mb-1">Officer In Charge</div>
                <div className="font-bold">DC S. Michael</div>
              </div>
              <button className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium">
                VCOP
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons for closed case */}
        <div className="flex border-t">
          <button className="flex-1 py-4 flex items-center justify-center text-gray-500">
            <FiPhone className="text-xl" />
          </button>
          <button className="flex-1 py-4 flex items-center justify-center text-transparent">
            {/* Empty space to maintain layout */}
          </button>
          <button className="flex-1 py-4 flex items-center justify-center text-transparent">
            {/* Empty space to maintain layout */}
          </button>
          <button className="flex-1 py-4 flex items-center justify-center text-gray-500">
            <FiFileText className="text-xl" />
          </button>
        </div>
      </div>

      {/* What to expect banner */}
      <div className="mx-4 mt-auto mb-4">
        <button className="bg-blue-600 text-white rounded-full py-3 px-4 w-full flex items-center justify-center gap-3">
          <div className="bg-white text-blue-600 rounded-full p-1">
            <FiInfo className="text-lg" />
          </div>
          <div className="text-left">
            <div className="font-medium">What to expect?</div>
            <div className="text-xs opacity-80">Learn how policing works behind the scenes</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default VictimApp; 