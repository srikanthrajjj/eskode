import React, { useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: Date;
  read: boolean;
  case_number?: string;
}

interface Props {
  messages: Message[];
  caseNumber: string;
  senderId: string;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  newMessage: string;
  setNewMessage: (text: string) => void;
}

export default function ChatWindow({ 
  messages, 
  caseNumber, 
  senderId,
  onClose, 
  onSendMessage,
  newMessage,
  setNewMessage
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(newMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-medium">Case Chat</h3>
            <p className="text-sm text-gray-500">{caseNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Messages */}
        <div className="h-96 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === senderId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender_id === senderId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender_id === senderId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={() => onSendMessage(newMessage)}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}