import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import PoliceApp from './components/PoliceApp';
import VictimApp from './components/VictimApp';
import ChatBubble from './components/ChatBubble';
import ToastContainer from './components/ToastContainer';
import { supabase } from './lib/supabase';
import { useToast } from './hooks/useToast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: Date;
  case_number?: string;
}

function App() {
  const [view, setView] = useState<'landing' | 'police' | 'admin' | 'victim'>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<{
    officerId: string;
    officerName: string;
  } | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          setMessages(data.map(msg => ({
            ...msg,
            timestamp: new Date(msg.created_at)
          })));
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        showToast('Failed to load messages. Please try again.', 'error');
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            timestamp: new Date(payload.new.created_at)
          };
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{
        officerId: string;
        officerName: string;
      }>;
      setActiveChat(customEvent.detail);
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  const handleSendMessage = async (officerId: string, text: string) => {
    try {
      const messageData = {
        sender_id: view === 'admin' ? 'admin' : officerId,
        receiver_id: view === 'admin' ? officerId : 'admin',
        text,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) throw error;

      if (data) {
        const newMessage = {
          ...data[0],
          timestamp: new Date(data[0].created_at)
        };
        setMessages(prev => [...prev, newMessage]);
        showToast('Message sent successfully', 'success');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');
    }
  };

  const getOfficerMessages = (officerId: string) => {
    return messages.filter(msg => 
      (msg.sender_id === 'admin' && msg.receiver_id === officerId) ||
      (msg.sender_id === officerId && msg.receiver_id === 'admin')
    );
  };

  if (view === 'admin') {
    return (
      <>
        <AdminDashboard 
          onBack={() => setView('landing')} 
          onSendMessage={handleSendMessage}
          messages={messages}
          showToast={showToast}
        />
        {activeChat && (
          <ChatBubble
            officerName={activeChat.officerName}
            officerId={activeChat.officerId}
            messages={getOfficerMessages(activeChat.officerId).map(msg => ({
              id: msg.id,
              text: msg.text,
              timestamp: msg.timestamp.toISOString(),
              isOutgoing: msg.sender_id === 'admin'
            }))}
            onSendMessage={(text) => handleSendMessage(activeChat.officerId, text)}
            onClose={() => setActiveChat(null)}
          />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (view === 'police') {
    return (
      <>
        <PoliceApp 
          onBack={() => setView('landing')} 
          messages={messages}
          officerId="DCI 12321"
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (view === 'victim') {
    return (
      <>
        <VictimApp onBack={() => setView('landing')} showToast={showToast} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">ESKODE</h1>
            <p className="text-gray-600">Police Management System</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setView('police')}
              className="w-full bg-blue-600 text-white rounded-lg px-6 py-4 font-medium hover:bg-blue-700 transition-colors"
            >
              Police Mobile App
            </button>
            <button
              onClick={() => setView('admin')}
              className="w-full bg-white border-2 border-blue-600 text-blue-600 rounded-lg px-6 py-4 font-medium hover:bg-blue-50 transition-colors"
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => setView('victim')}
              className="w-full bg-white border-2 border-blue-600 text-blue-600 rounded-lg px-6 py-4 font-medium hover:bg-blue-50 transition-colors"
            >
              Victim Portal
            </button>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;