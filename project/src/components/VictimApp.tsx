import React, { useState, useEffect } from 'react';
import { 
  Menu,
  Phone,
  Video,
  MessageSquare,
  FileText,
  Copy,
  Info,
  X,
  HandshakeIcon,
  Play,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ChatWindow from './ChatWindow';

interface Props {
  onBack: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: Date;
  read: boolean;
  case_number?: string;
}

interface Case {
  crimeNumber: string;
  status: 'Ongoing' | 'Closed';
  type: string;
  typeColor: string;
  officer: {
    name: string;
    status: 'Online' | 'Offline';
    role: string;
  };
  hasMessages?: boolean;
}

function VictimApp({ onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatCase, setActiveChatCase] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const victim = {
    name: 'S. Khanom',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  };

  const cases: Case[] = [
    {
      crimeNumber: 'CRI12366/21',
      status: 'Ongoing',
      type: 'SEC 47 ASSAULT',
      typeColor: 'bg-red-100 text-red-800',
      officer: {
        name: 'DC S. Morgan',
        status: 'Online',
        role: 'VCOP'
      },
      hasMessages: true
    },
    {
      crimeNumber: 'CRI10366/19',
      status: 'Closed',
      type: 'BURGLARY',
      typeColor: 'bg-yellow-100 text-yellow-800',
      officer: {
        name: 'DC S. Michael',
        status: 'Offline',
        role: 'VCOP'
      }
    }
  ];

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('victim-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatCase) return;

    try {
      const messageData = {
        sender_id: `victim-${activeChatCase}`,
        receiver_id: cases.find(c => c.crimeNumber === activeChatCase)?.officer.name.split(' ')[1] || '',
        text: newMessage,
        case_number: activeChatCase,
        read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data[0]]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getCaseMessages = (caseNumber: string) => {
    return messages.filter(msg => 
      msg.case_number === caseNumber && 
      (msg.sender_id === `victim-${caseNumber}` || msg.receiver_id === `victim-${caseNumber}`)
    );
  };

  const getUnreadCount = (caseNumber: string) => {
    return messages.filter(msg => 
      msg.case_number === caseNumber && 
      msg.receiver_id === `victim-${caseNumber}` && 
      !msg.read
    ).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {activeChatCase && (
        <ChatWindow
          messages={getCaseMessages(activeChatCase)}
          caseNumber={activeChatCase}
          senderId={`victim-${activeChatCase}`}
          onClose={() => setActiveChatCase(null)}
          onSendMessage={handleSendMessage}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
        />
      )}

      {/* Header */}
      <header className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack}>
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold">{victim.name}</h2>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow">
          <HandshakeIcon className="w-5 h-5" />
          <span>Help</span>
        </button>
      </header>

      {/* Alert */}
      <div className="m-4 p-4 bg-red-100 rounded-lg relative">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-red-800 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-800">Community Alert - Burglary</h3>
            <p className="text-red-800">A burglary was reported to Charlottesville Police on December 03, 2022 at 4:57 AM.</p>
          </div>
        </div>
        <button className="absolute top-4 right-4">
          <X className="w-5 h-5 text-red-800" />
        </button>
      </div>

      {/* Cases */}
      <div className="space-y-4 p-4">
        {cases.map((case_, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            {/* Status Badge */}
            <div className="flex justify-center mb-4">
              <span className={`px-4 py-1 rounded-full text-sm ${
                case_.status === 'Ongoing' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {case_.status}
              </span>
            </div>

            {/* Crime Details */}
            <div className="mb-4">
              <p className="text-sm text-gray-500">Crime no</p>
              <div className="flex items-center justify-between">
                <h3 className="text-blue-600 font-medium">{case_.crimeNumber}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${case_.typeColor}`}>
                  {case_.type}
                </span>
              </div>
            </div>

            {/* Officer Details */}
            <div className="mb-4">
              <p className="text-sm text-gray-500">Officer In Charge - 
                <span className={case_.officer.status === 'Online' ? 'text-green-600' : 'text-gray-500'}>
                  {' '}{case_.officer.status}
                </span>
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium">{case_.officer.name}</span>
                <span className={`px-4 py-1 rounded-full ${
                  case_.status === 'Ongoing' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {case_.officer.role}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button className="p-3 hover:bg-gray-50 rounded-full">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  className="p-3 hover:bg-gray-50 rounded-full relative"
                  onClick={() => setActiveChatCase(case_.crimeNumber)}
                >
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  {getUnreadCount(case_.crimeNumber) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                      {getUnreadCount(case_.crimeNumber)}
                    </span>
                  )}
                </button>
                <button className="p-3 hover:bg-gray-50 rounded-full">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 hover:bg-gray-50 rounded-full">
                  <FileText className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 hover:bg-gray-50 rounded-full">
                  <Copy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* What to expect section */}
        <button className="w-full bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6" />
            <div className="text-left">
              <h3 className="font-semibold">What to expect?</h3>
              <p className="text-sm text-blue-200">Learn how policing works behind the scenes</p>
            </div>
          </div>
          <Copy className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default VictimApp;