import React, { useState, useEffect } from 'react';
import { 
  Menu,
  MessageSquare,
  Plus,
  Search,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  StickyNote,
  X,
  MoreVertical,
  Send,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AppointmentsView from './AppointmentsView';
import DocumentsView from './DocumentsView';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import NewCaseModal from './NewCaseModal';
import CommunicationModal from './CommunicationModal';
import CrimeDetailsModal from './CrimeDetailsModal';

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
  onBack: () => void;
  messages: Message[];
  officerId: string;
}

interface Case {
  victimName: string;
  crimeNumber: string;
  dateOfBirth: string;
  address: string;
  type: string;
  typeColor: string;
  created_at?: Date;
  isNew?: boolean;
}

interface Appointment {
  id: string;
  title: string;
  caseNumber: string;
  victimName: string;
  date: string;
  time: string;
  location: string;
  type: string;
  typeColor: string;
  status?: 'active' | 'cancelled';
}

interface Note {
  id: string;
  text: string;
  created_at: Date;
}

function PoliceApp({ onBack, messages: initialMessages, officerId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [activeTab, setActiveTab] = useState('cases');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [activeChatCase, setActiveChatCase] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [expandedCases, setExpandedCases] = useState<string[]>([]);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState<{
    caseNumber: string;
    victimName: string;
  } | null>(null);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [newNote, setNewNote] = useState('');
  const [activeCrimeDetails, setActiveCrimeDetails] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('officer_id', officerId)
          .order('date', { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedAppointments = data.map(meeting => ({
            id: meeting.id,
            title: meeting.title,
            caseNumber: meeting.case_number,
            victimName: meeting.victim_name,
            date: meeting.date,
            time: meeting.time,
            location: meeting.location,
            type: meeting.type,
            typeColor: meeting.type_color,
            status: meeting.status || 'active'
          }));
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [officerId]);

  useEffect(() => {
    const unread = messages.filter(msg => 
      msg.receiver_id === officerId && 
      !msg.read
    );
    setUnreadMessages(unread);
  }, [messages, officerId]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${officerId},receiver_id.eq.${officerId}`)
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
      .channel('police-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${officerId},receiver_id=eq.${officerId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    const markMessagesAsRead = async () => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', officerId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [officerId]);

  const generateCrimeNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 90000) + 10000;
    return `CRI${random}/${year}`;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'ASSAULT WOUNDING': 'bg-orange-100 text-orange-800',
      'SEC 47 ASSAULT': 'bg-red-100 text-red-800',
      'BURGLARY OTD': 'bg-yellow-100 text-yellow-800',
      'ROBBERY': 'bg-purple-100 text-purple-800',
      'THEFT': 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateCase = async (caseData: {
    victimName: string;
    dateOfBirth: string;
    address: string;
    type: string;
  }) => {
    const crimeNumber = generateCrimeNumber();
    const typeColor = getTypeColor(caseData.type);

    const newCase: Case = {
      ...caseData,
      crimeNumber,
      typeColor,
      created_at: new Date(),
      isNew: true
    };

    try {
      const { data, error } = await supabase
        .from('cases')
        .insert([{
          victim_name: caseData.victimName,
          crime_number: crimeNumber,
          date_of_birth: caseData.dateOfBirth,
          address: caseData.address,
          type: caseData.type,
          type_color: typeColor,
          officer_id: officerId
        }])
        .select();

      if (error) throw error;

      setCases(prev => [newCase, ...prev]);
      setShowNewCaseModal(false);

      setTimeout(() => {
        setCases(prev => prev.map(c => 
          c.crimeNumber === newCase.crimeNumber 
            ? { ...c, isNew: false }
            : c
        ));
      }, 5000);

    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    }
  };

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('officer_id', officerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedCases = data.map(case_ => ({
            victimName: case_.victim_name,
            crimeNumber: case_.crime_number,
            dateOfBirth: new Date(case_.date_of_birth).toLocaleDateString('en-GB'),
            address: case_.address,
            type: case_.type,
            typeColor: case_.type_color
          }));
          setCases(formattedCases);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      }
    };

    fetchCases();
  }, [officerId]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('officer_id', officerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const groupedNotes = data.reduce((acc, note) => {
            if (!acc[note.case_number]) {
              acc[note.case_number] = [];
            }
            acc[note.case_number].push(note);
            return acc;
          }, {} as Record<string, Note[]>);
          
          setNotes(groupedNotes);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [officerId]);

  const handleScheduleMeeting = async (meetingData: {
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    caseNumber: string;
    victimName: string;
  }) => {
    const typeColors = {
      'Statement': 'bg-purple-100 text-purple-800',
      'Court': 'bg-blue-100 text-blue-800',
      'Meeting': 'bg-green-100 text-green-800',
      'Interview': 'bg-yellow-100 text-yellow-800'
    };

    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert([{
          title: meetingData.title,
          date: meetingData.date,
          time: meetingData.time,
          location: meetingData.location,
          type: meetingData.type,
          type_color: typeColors[meetingData.type as keyof typeof typeColors],
          case_number: meetingData.caseNumber,
          victim_name: meetingData.victimName,
          officer_id: officerId
        }])
        .select();

      if (error) throw error;

      if (data) {
        const newAppointment = {
          id: data[0].id,
          ...meetingData,
          typeColor: typeColors[meetingData.type as keyof typeof typeColors],
          status: 'active' as const
        };

        setAppointments(prev => [newAppointment, ...prev]);
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.map(app => 
        app.id === appointmentId 
          ? { ...app, status: 'cancelled' }
          : app
      ));
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const handleRescheduleAppointment = async (appointmentId: string, newDate: string, newTime: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ 
          date: newDate,
          time: newTime
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.map(app => 
        app.id === appointmentId 
          ? { ...app, date: newDate, time: newTime }
          : app
      ));
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Failed to reschedule appointment. Please try again.');
    }
  };

  const handleContactClick = (type: 'video' | 'message' | 'phone', appointment: Appointment) => {
    setActiveChatCase(appointment.caseNumber);
  };

  const toggleCaseExpansion = (crimeNumber: string) => {
    setExpandedCases(prev => 
      prev.includes(crimeNumber) 
        ? prev.filter(num => num !== crimeNumber)
        : [...prev, crimeNumber]
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activeChatCase) return;

    try {
      const messageData = {
        sender_id: officerId,
        receiver_id: `victim-${activeChatCase}`,
        text,
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

  const handleAddNote = async (caseNumber: string) => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          case_number: caseNumber,
          text: newNote,
          officer_id: officerId
        }])
        .select();

      if (error) throw error;

      if (data) {
        setNotes(prev => ({
          ...prev,
          [caseNumber]: [...(prev[caseNumber] || []), data[0]]
        }));
        setNewNote('');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  const getCaseMessages = (caseNumber: string) => {
    return messages.filter(msg => 
      msg.case_number === caseNumber && 
      (msg.sender_id === officerId || 
       msg.receiver_id === officerId ||
       msg.sender_id === `victim-${caseNumber}` ||
       msg.receiver_id === `victim-${caseNumber}`)
    );
  };

  const getUnreadCount = (caseNumber: string) => {
    return messages.filter(msg => 
      msg.case_number === caseNumber && 
      msg.receiver_id === officerId && 
      !msg.read
    ).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="S.Morgan"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-lg font-semibold">S.Morgan</h2>
              <p className="text-sm text-gray-500">DCI 12321</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <MessageSquare className="w-6 h-6 text-gray-600" />
            {unreadMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {unreadMessages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="w-6 h-6 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {showNotifications && (
          <div className="absolute right-4 top-20 w-96 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Messages</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {unreadMessages.length > 0 ? (
                unreadMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setActiveChatCase(msg.case_number || '');
                      setShowNotifications(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            Case: {msg.case_number || 'N/A'}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No unread messages
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {showNewCaseModal && (
        <NewCaseModal
          onClose={() => setShowNewCaseModal(false)}
          onSubmit={handleCreateCase}
        />
      )}

      {showScheduleModal && (
        <ScheduleMeetingModal
          onClose={() => setShowScheduleModal(null)}
          onSubmit={handleScheduleMeeting}
          caseNumber={showScheduleModal.caseNumber}
          victimName={showScheduleModal.victimName}
        />
      )}

      {activeChatCase && (
        <CommunicationModal
          messages={getCaseMessages(activeChatCase)}
          caseNumber={activeChatCase}
          senderId={officerId}
          onClose={() => setActiveChatCase(null)}
          onSendMessage={handleSendMessage}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
        />
      )}

      {activeDocument && (
        <DocumentsView
          onClose={() => setActiveDocument(null)}
          caseNumber={activeDocument}
        />
      )}

      {activeCrimeDetails && (
        <CrimeDetailsModal
          crimeNumber={activeCrimeDetails}
          onClose={() => setActiveCrimeDetails(null)}
        />
      )}

      {activeNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-medium">Case Notes</h3>
                <p className="text-sm text-gray-500">{activeNotes}</p>
              </div>
              <button 
                onClick={() => setActiveNotes(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new note..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote(activeNotes)}
                />
                <button
                  onClick={() => handleAddNote(activeNotes)}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notes[activeNotes]?.map((note) => (
                  <div key={note.id} className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{note.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex p-4 space-x-1">
        <button
          onClick={() => setActiveTab('cases')}
          className={`flex-1 py-3 px-4 rounded-full font-medium ${
            activeTab === 'cases'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700'
          }`}
        >
          <span className="sm:text-base text-sm">Active Cases ({cases.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 py-3 px-4 rounded-full font-medium ${
            activeTab === 'appointments'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700'
          }`}
        >
          <span className="sm:text-base text-sm">
            Appointments ({appointments.filter(a => a.status !== 'cancelled').length})
          </span>
        </button>
      </div>

      <div className="px-4 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search victim names or crime numbers"
            className="w-full pl-10 pr-4 py-3 bg-white rounded-full border-none shadow-sm"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {activeTab === 'cases' ? (
        <div className="px-4 space-y-4">
          {cases.map((case_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm relative">
              {case_.isNew && (
                <div className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
                  New Case
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase">VICTIM NAME</p>
                  <h3 className="text-xl font-bold">{case_.victimName}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveCrimeDetails(case_.crimeNumber);
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    {case_.crimeNumber}
                  </a>
                  <button>
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase">DATE OF BIRTH</p>
                  <p className="font-medium">{case_.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase">ADDRESS</p>
                  <p className="font-medium">{case_.address}</p>
                </div>
              </div>

              <div className="space-y-4">
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${case_.typeColor}`}>
                  {case_.type}
                </span>
                
                <div className="grid grid-cols-5 gap-2">
                  <button 
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full relative flex items-center justify-center"
                    onClick={() => setActiveChatCase(case_.crimeNumber)}
                  >
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    {getUnreadCount(case_.crimeNumber) > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                        {getUnreadCount(case_.crimeNumber)}
                      </span>
                    )}
                  </button>
                  <button 
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center"
                    onClick={() => setShowScheduleModal({
                      caseNumber: case_.crimeNumber,
                      victimName: case_.victimName
                    })}
                  >
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </button>
                  <button 
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center"
                    onClick={() => setActiveDocument(case_.crimeNumber)}
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                  </button>
                  <button 
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center"
                    onClick={() => setActiveNotes(case_.crimeNumber)}
                  >
                    <StickyNote className="w-5 h-5 text-yellow-500" />
                  </button>
                  <button 
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center"
                    onClick={() => toggleCaseExpansion(case_.crimeNumber)}
                  >
                    {expandedCases.includes(case_.crimeNumber) ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                </div>

                {expandedCases.includes(case_.crimeNumber) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Next Appointment</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">Tomorrow, 10:00 AM</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="text-sm">Police Station</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        loadingAppointments ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading appointments...</p>
          </div>
        ) : (
          <AppointmentsView
            appointments={appointments}
            onContactClick={handleContactClick}
            onCancel={handleCancelAppointment}
            onReschedule={handleRescheduleAppointment}
          />
        )
      )}
    </div>
  );
}

export default PoliceApp;



export default PoliceApp

export default PoliceApp