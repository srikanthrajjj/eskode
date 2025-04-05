import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ArrowLeft, Paperclip, Phone, Video, MoreVertical, Image, Smile, Mic } from 'lucide-react';
import websocketService from '../services/websocketService';

export interface PoliceChatMessage {
  id: string;
  sender: 'admin' | 'officer';
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface PoliceChatViewProps {
  messages: PoliceChatMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

const PoliceChatView = ({
  messages,
  onSendMessage,
  onClose
}: PoliceChatViewProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAdminTyping]);

  // Listen for typing indicator from WebSocket
  useEffect(() => {
    const unsubscribe = websocketService.onMessage(message => {
      if (message.type === 'TYPING_INDICATOR' && message.senderId === 'admin-user') {
        setIsAdminTyping(message.payload.isTyping);
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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setIsTyping(false);
      websocketService.sendTypingIndicator(false);
    }
  };

  // Render the message list
  const renderMessages = () => {
    if (!messages || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No messages yet</h3>
          <p className="text-gray-500 max-w-xs">
            Start a conversation with the admin team to get assistance with your cases.
          </p>
        </div>
      );
    }

    // Group messages by date
    const messagesByDate: { [date: string]: PoliceChatMessage[] } = {};
    messages.forEach(msg => {
      // Extract date from timestamp or use today
      const msgDate = new Date().toLocaleDateString();
      if (!messagesByDate[msgDate]) {
        messagesByDate[msgDate] = [];
      }
      messagesByDate[msgDate].push(msg);
    });

    return Object.entries(messagesByDate).map(([date, msgs]) => (
      <div key={date} className="mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
            {date}
          </div>
        </div>

        {msgs.map((msg, index) => {
          const isOfficer = msg.sender === 'officer';
          const showAvatar = index === 0 || msgs[index - 1]?.sender !== msg.sender;

          return (
            <div key={msg.id || index} className={`flex ${isOfficer ? 'justify-end' : 'justify-start'} mb-3`}>
              {!isOfficer && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 mr-2 overflow-hidden flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">A</span>
                </div>
              )}

              <div className={`max-w-xs md:max-w-md ${isOfficer ? 'order-1' : 'order-2'}`}>
                {showAvatar && (
                  <div className={`text-xs mb-1 ${isOfficer ? 'text-right' : 'text-left'}`}>
                    <span className="font-medium">{msg.senderName}</span>
                  </div>
                )}

                <div className="flex items-end">
                  <div
                    className={`rounded-2xl py-2 px-3 ${isOfficer
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>

                <div className={`flex items-center text-xs mt-1 ${isOfficer ? 'justify-end' : 'justify-start'}`}>
                  <span className={isOfficer ? 'text-gray-500' : 'text-gray-500'}>
                    {msg.timestamp}
                  </span>
                  {isOfficer && msg.read && (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                </div>
              </div>

              {isOfficer && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 ml-2 overflow-hidden flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">S</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  // Custom icon component for message square
  const MessageSquare = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md h-[85vh] flex flex-col shadow-2xl">
        {/* Chat Header */}
        <div className="bg-blue-600 p-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 p-1.5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-lg">A</span>
              </div>
              <div>
                <h2 className="font-semibold text-white">Admin Support</h2>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                  <p className="text-xs text-blue-100">
                    {isAdminTyping ? (
                      <span>typing...</span>
                    ) : (
                      <span>Online</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-white hover:bg-blue-700 p-1.5 rounded-full transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="text-white hover:bg-blue-700 p-1.5 rounded-full transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button className="text-white hover:bg-blue-700 p-1.5 rounded-full transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {renderMessages()}

          {/* Typing indicator */}
          {isAdminTyping && (
            <div className="flex justify-start">
              <div className="flex items-center bg-gray-100 rounded-full py-1 px-3 mt-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 bg-white rounded-b-xl border-t border-gray-100 shadow-inner">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
            <div className="flex items-center gap-1">
              <button className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <button className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <Image className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-2 py-2 focus:outline-none text-gray-700"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />

            {newMessage.trim() ? (
              <button
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={handleSendMessage}
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-2 flex justify-center">
            <div className="text-xs text-gray-400 flex items-center">
              <span className="mr-1">End-to-end encrypted</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceChatView;
