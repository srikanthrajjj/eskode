import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Video, MessageSquare, Phone, MicOff, VideoOff } from 'lucide-react';

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

export default function CommunicationModal({
  messages,
  caseNumber,
  senderId,
  onClose,
  onSendMessage,
  newMessage,
  setNewMessage
}: Props) {
  const [mode, setMode] = useState<'text' | 'video' | 'phone'>('text');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const updateHeight = () => {
      if (chatContainerRef.current) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(newMessage);
    }
  };

  const toggleMode = (newMode: 'text' | 'video' | 'phone') => {
    if (mode !== newMode) {
      if (newMode === 'video') {
        startVideo();
      } else {
        stopVideo();
      }
      setMode(newMode);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={chatContainerRef}
        className="bg-white rounded-lg w-full h-full sm:h-auto sm:w-[95%] md:w-[32rem] max-w-lg mx-auto flex flex-col"
        style={{ 
          height: 'calc(var(--vh, 1vh) * 100)',
          maxHeight: 'calc(var(--vh, 1vh) * 100)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h3 className="font-medium">Case Communication</h3>
            <p className="text-sm text-gray-500">{caseNumber}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => toggleMode('text')}
              className={`p-2 rounded-full ${
                mode === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Text Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={() => toggleMode('video')}
              className={`p-2 rounded-full ${
                mode === 'video' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button 
              onClick={() => toggleMode('phone')}
              className={`p-2 rounded-full ${
                mode === 'phone' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Phone Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mode === 'text' ? (
            // Text Chat
            <div className="h-full p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === senderId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.sender_id === senderId
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.text}</p>
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
          ) : (
            // Video/Phone Call
            <div className="h-full bg-gray-900 relative">
              {mode === 'video' && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
              )}
              {mode === 'phone' && (
                <div className="h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Phone className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">Phone call in progress...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 rounded-full ${
                    isMuted ? 'bg-red-500' : 'bg-gray-800'
                  } text-white hover:opacity-90`}
                >
                  <MicOff className="w-5 h-5" />
                </button>
                {mode === 'video' && (
                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-3 rounded-full ${
                      isVideoOff ? 'bg-red-500' : 'bg-gray-800'
                    } text-white hover:opacity-90`}
                  >
                    <VideoOff className="w-5 h-5" />
                  </button>
                )}
                <button
                  className="p-3 rounded-full bg-red-500 text-white hover:opacity-90"
                  onClick={() => toggleMode('text')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Input (only shown in text mode) */}
        {mode === 'text' && (
          <div className="p-4 border-t shrink-0">
            <div className="flex space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none text-sm sm:text-base"
                rows={1}
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
              <button
                onClick={() => onSendMessage(newMessage)}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}