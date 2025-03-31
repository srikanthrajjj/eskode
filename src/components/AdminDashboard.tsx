import { useState, useEffect } from 'react';
import { FiUsers, FiBarChart2, FiSettings, FiFileText, FiBell, FiSearch, FiHome, FiLogOut, FiFolder, FiClock, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import TasksView from './TasksView';
import OfficersView from './OfficersView';
import AdminChatView, { AdminChatMessage } from './AdminChatView';
import websocketService, { WebSocketMessage } from '../services/websocketService';

// Import Officer interface
interface Officer {
  id: string;
  name: string;
  position: string;
  badgeNumber: string;
  image: string;
  assignedCases: number;
}

interface AdminDashboardProps {
  onBack: () => void;
  onSendMessageToOfficer: (officerId: string, message: string) => void;
  officerMessages: Record<string, AdminChatMessage[]>;
}

const AdminDashboard = ({ 
  onBack, 
  onSendMessageToOfficer = () => {}, 
  officerMessages = {} 
}: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [activeChatOfficer, setActiveChatOfficer] = useState<Officer | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [officersTyping, setOfficersTyping] = useState<Record<string, boolean>>({});
  const [sidebarTab, setSidebarTab] = useState('officers');
  const [selectedDateOffset, setSelectedDateOffset] = useState(1); // Day offset from today (0 = today)

  // Count unread messages from officers
  useEffect(() => {
    const counts: Record<string, number> = {};
    
    Object.entries(officerMessages).forEach(([officerId, messages]) => {
      const unreadCount = messages.filter(
        msg => msg.sender === 'officer' && !msg.read
      ).length;
      
      if (unreadCount > 0) {
        counts[officerId] = unreadCount;
      }
    });
    
    setUnreadMessages(counts);
  }, [officerMessages]);
  
  // Connect to WebSocket as admin and handle message events
  useEffect(() => {
    // Track whether component is mounted
    let isMounted = true;
    
    // Listen for all incoming messages
    const unsubscribeMessages = websocketService.onMessage((message: WebSocketMessage) => {
      if (!isMounted) return;
      
      console.log('AdminDashboard received message:', message.type);
      
      // Handle typing indicators from officers
      if (message.type === 'TYPING_INDICATOR' && message.senderId !== 'admin-user') {
        const officerId = message.senderId;
        
        if (isMounted) {
          setOfficersTyping(prev => ({
            ...prev,
            [officerId]: message.payload.isTyping
          }));
        }
      }
      
      // Handle incoming officer messages
      if (message.type === 'OFFICER_MESSAGE') {
        // Show notification that an officer sent a message
        const officerId = message.senderId || 'off1';
        
        if (isMounted) {
          setUnreadMessages(prev => ({
            ...prev,
            [officerId]: (prev[officerId] || 0) + 1
          }));
        }
      }
    });
    
    // Return cleanup function
    return () => {
      isMounted = false;
      unsubscribeMessages();
    };
  }, []);
  
  // Reset typing indicator when chat is closed
  useEffect(() => {
    if (!activeChatOfficer) {
      // Clear typing indicators when chat is closed
      setOfficersTyping({});
    }
  }, [activeChatOfficer]);

  // Mock data for dashboard stats
  const stats = [
    { 
      id: 'responseTime', 
      title: 'Response Time Efficiency', 
      value: '24 min', 
      icon: FiClock, 
      color: 'bg-blue-500',
      change: '+12%',
      changeColor: 'text-green-500'
    },
    { 
      id: 'resolutionRate', 
      title: 'Case Resolution Rate', 
      value: '78%', 
      icon: FiCheckCircle, 
      color: 'bg-green-500',
      change: '+5%',
      changeColor: 'text-green-500'
    },
    { 
      id: 'officerPerformance', 
      title: 'Officer Performance & Wellbeing', 
      value: '91%', 
      icon: FiUsers, 
      color: 'bg-purple-500',
      change: '+4%',
      changeColor: 'text-green-500'
    },
    { 
      id: 'communityTrust', 
      title: 'Community Engagement & Public Trust', 
      value: '85%', 
      icon: FiMessageSquare, 
      color: 'bg-orange-500',
      change: '+3.8%',
      changeColor: 'text-green-500'
    },
  ];

  // Officer click handler
  const handleOfficerClick = (officer: Officer) => {
    console.log('Officer clicked:', officer.id);
    console.log('Current messages:', officerMessages);
    
    // Set the active officer for chat
    setActiveChatOfficer(officer);
    
    // Mark messages as read - special command
    onSendMessageToOfficer(officer.id, "__MARK_READ__");
  };

  const handleSendMessage = (message: string) => {
    if (activeChatOfficer) {
      onSendMessageToOfficer(activeChatOfficer.id, message);
    }
  };

  const handleCloseChat = () => {
    setActiveChatOfficer(null);
  };

  // Calculate total unread messages
  const totalUnreadMessages = Object.values(unreadMessages).reduce((a, b) => a + b, 0);

  // Generate dates for the next 7 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      let dayLabel;
      if (i === 0) {
        dayLabel = 'Today';
      } else if (i === 1) {
        dayLabel = 'Tomorrow';
      } else {
        dayLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      dates.push({
        day: dayLabel,
        date: date.getDate(),
        dateObj: date,
        offset: i
      });
    }
    
    return dates;
  };
  
  const dates = generateDates();

  // DateSelector Component
  const DateSelector = () => {
    return (
      <>
        {dates.map((date) => (
          <button
            key={date.offset}
            onClick={() => setSelectedDateOffset(date.offset)}
            className={`flex flex-col items-center justify-center min-w-[84px] h-[108px] mx-1 rounded-lg ${
              selectedDateOffset === date.offset
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black'
            }`}
          >
            <span className="text-sm font-medium">{date.day}</span>
            <span className="text-3xl font-bold mt-1">{date.date}</span>
            <div className="flex mt-1">
              {/* Dots indicating appointments on this day - for illustration */}
              {date.offset === 1 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                </>
              )}
              {date.offset === 0 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                </>
              )}
              {date.offset === 3 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                  <div className="w-1 h-1 rounded-full bg-current mx-[1px]"></div>
                </>
              )}
            </div>
          </button>
        ))}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div 
        className={`bg-white shadow-lg transition-all duration-300 ease-in-out z-10 ${
          isSidebarHovered ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className={`flex items-center justify-center h-16 border-b ${isSidebarHovered ? 'px-4' : 'px-0'}`}>
          {isSidebarHovered ? (
            <h1 className="text-3xl font-semibold text-primary-700">Eskode</h1>
          ) : (
            <h1 className="text-3xl font-semibold text-primary-700">E</h1>
          )}
        </div>
        <div className="p-2">
          <div className="flex flex-col space-y-2">
            <button
              className={`flex items-center p-3 rounded-16px ${
                activeTab === 'dashboard' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
              } ${isSidebarHovered ? 'justify-start' : 'justify-center'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <FiHome className="text-lg" />
              {isSidebarHovered && <span className="ml-3">Dashboard</span>}
            </button>
            <button
              className={`flex items-center p-3 rounded-16px ${
                activeTab === 'analytics' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
              } ${isSidebarHovered ? 'justify-start' : 'justify-center'}`}
              onClick={() => setActiveTab('analytics')}
            >
              <FiBarChart2 className="text-lg" />
              {isSidebarHovered && <span className="ml-3">Analytics</span>}
            </button>
            <button
              className={`flex items-center p-3 rounded-16px ${
                activeTab === 'documents' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
              } ${isSidebarHovered ? 'justify-start' : 'justify-center'}`}
              onClick={() => setActiveTab('documents')}
            >
              <FiFolder className="text-lg" />
              {isSidebarHovered && <span className="ml-3">Documents</span>}
            </button>
            <div className="border-t my-2"></div>
            <button
              className={`flex items-center p-3 rounded-16px text-red-500 hover:bg-red-50 ${
                isSidebarHovered ? 'justify-start' : 'justify-center'
              }`}
              onClick={onBack}
            >
              <FiLogOut className="text-lg" />
              {isSidebarHovered && <span className="ml-3">Back to Home</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-primary-600">
              <FiBell />
              {totalUnreadMessages > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {totalUnreadMessages}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-2">
              <img
                src="https://randomuser.me/api/portraits/women/45.jpg"
                alt="Admin"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="font-medium text-gray-700">Admin User</span>
            </div>
          </div>
        </div>

        {/* Content with right sidebar */}
        <div className="flex h-[calc(100%-64px)]">
          {/* Main content area */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'dashboard' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                </div>
                
                {/* Stats cards - Made smaller and more compact */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${stat.color} text-white mr-3`}>
                            <Icon className="text-lg" />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">{stat.title}</p>
                            <div className="flex items-baseline">
                              <h3 className="text-xl font-bold text-gray-800 mr-2">{stat.value}</h3>
                              <span className={`text-xs ${stat.changeColor}`}>{stat.change}</span>
                          </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Task Management Section - Given more vertical space */}
                <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-280px)] overflow-hidden">
                  <TasksView extraCases={[
                    {
                      id: 'task5',
                      title: 'Follow up on witness statement',
                      description: 'Contact witness John Smith for additional details regarding case #CRI78901',
                      priority: 'medium',
                      dueDate: '2024-04-10',
                      assignedTo: 'DC Morgan',
                      offence: 'WITNESS STATEMENT',
                      crimeNumber: 'CRI/78901/24',
                      officerInCharge: 'PC 12345'
                    },
                    {
                      id: 'task6',
                      title: 'Evidence Review Required',
                      description: 'Review CCTV footage from Manchester Central Station - Case #CRI78902',
                      priority: 'high',
                      dueDate: '2024-04-11',
                      assignedTo: 'DC Wilson',
                      offence: 'EVIDENCE REVIEW',
                      crimeNumber: 'CRI/78902/24',
                      officerInCharge: 'PC 54321'
                    },
                    {
                      id: 'task7',
                      title: 'Update Case Files',
                      description: 'Document recent developments in fraud case #CRI78903',
                      priority: 'low',
                      dueDate: '2024-04-12',
                      assignedTo: 'DC Thompson',
                      offence: 'FRAUD',
                      crimeNumber: 'CRI/78903/24',
                      officerInCharge: 'PC 12345'
                    },
                    {
                      id: 'task8',
                      title: 'Victim Support Meeting',
                      description: 'Schedule follow-up meeting with victim in case #CRI78904',
                      priority: 'medium',
                      dueDate: '2024-04-13',
                      assignedTo: 'DC Peters',
                      offence: 'VICTIM SUPPORT',
                      crimeNumber: 'CRI/78904/24',
                      officerInCharge: 'PC 54321'
                    },
                    {
                      id: 'task9',
                      title: 'Court Preparation',
                      description: 'Prepare documentation for upcoming court hearing - Case #CRI78905',
                      priority: 'high',
                      dueDate: '2024-04-14',
                      assignedTo: 'DC Morgan',
                      offence: 'COURT PREP',
                      crimeNumber: 'CRI/78905/24',
                      officerInCharge: 'PC 12345'
                    }
                  ]} />
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h2>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Total Cases</h3>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-gray-800 mr-2">346</span>
                      <span className="text-green-500 text-sm">+12.5%</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">vs previous month</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Resolved Cases</h3>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-gray-800 mr-2">284</span>
                      <span className="text-green-500 text-sm">+8.2%</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">vs previous month</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Avg. Resolution Time</h3>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-gray-800 mr-2">18.3</span>
                      <span className="text-green-500 text-sm">-2.1</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">days (improving)</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Public Satisfaction</h3>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-gray-800 mr-2">85%</span>
                      <span className="text-green-500 text-sm">+3.8%</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">based on feedback</p>
                  </div>
                </div>
                
                {/* Cases Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Key Performance Metrics</h3>
                    <div className="space-y-6">
                      {/* Case Resolution Rate */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Case Resolution Rate</span>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Target: 85%</span>
                          <span className="text-green-500">+5% vs last month</span>
                        </div>
                      </div>
                      
                      {/* Average Response Time */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Average Response Time</span>
                          <span className="text-sm font-medium">24 min</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-green-600 h-3 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Target: 30 min</span>
                          <span className="text-green-500">-3 min vs last month</span>
                        </div>
                      </div>
                      
                      {/* Victim Satisfaction */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Victim Satisfaction</span>
                          <span className="text-sm font-medium">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-purple-600 h-3 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Target: 80%</span>
                          <span className="text-green-500">+2% vs last month</span>
                        </div>
                      </div>
                      
                      {/* Case Clearance Rate */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Case Clearance Rate</span>
                          <span className="text-sm font-medium">67%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-yellow-500 h-3 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Target: 75%</span>
                          <span className="text-yellow-500">No change vs last month</span>
                        </div>
                      </div>
                      
                      {/* Officer Productivity */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Officer Productivity</span>
                          <span className="text-sm font-medium">91%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: '91%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Target: 85%</span>
                          <span className="text-green-500">+4% vs last month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Case Types Distribution</h3>
                    <div className="h-64 flex items-center justify-center">
                      <div className="space-y-4 w-full">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Theft</span>
                            <span className="text-sm font-medium">35%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Assault</span>
                            <span className="text-sm font-medium">22%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '22%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Fraud</span>
                            <span className="text-sm font-medium">18%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '18%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Vandalism</span>
                            <span className="text-sm font-medium">15%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Other</span>
                            <span className="text-sm font-medium">10%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Officer Performance & Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top Performing Officers</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="S. Morgan" className="w-10 h-10 rounded-full mr-3"/>
                          <div>
                            <h4 className="font-medium">S. Morgan</h4>
                            <p className="text-xs text-gray-500">DC 12345</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-500 font-medium mr-2">94%</span>
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Top Performer</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="M. Johnsom" className="w-10 h-10 rounded-full mr-3"/>
                          <div>
                            <h4 className="font-medium">M. Johnsom</h4>
                            <p className="text-xs text-gray-500">PC 134234</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-500 font-medium mr-2">91%</span>
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Excellent</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img src="https://randomuser.me/api/portraits/men/22.jpg" alt="K. Tedd" className="w-10 h-10 rounded-full mr-3"/>
                          <div>
                            <h4 className="font-medium">K. Tedd</h4>
                            <p className="text-xs text-gray-500">DC 143424</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-500 font-medium mr-2">88%</span>
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Great</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-16px shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Public Feedback</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <h4 className="font-medium mr-2">John D.</h4>
                            <div className="flex">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">"Officer Morgan handled my case professionally and kept me informed throughout the process."</p>
                          <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <h4 className="font-medium mr-2">Sarah M.</h4>
                            <div className="flex">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">"I appreciate how quickly my case was resolved. The online communication system was very helpful."</p>
                          <p className="text-xs text-gray-500 mt-1">5 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Document Storage</h2>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <button className="bg-blue-600 text-white py-3 px-5 rounded-lg flex items-center font-medium mb-8">
                    Add forms
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Statement Forms Column */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-6">Statement Forms</h3>
                      
                      <div className="space-y-4">
                        {/* Form 1 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
                          <div className="mr-4 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <a href="#" className="text-lg text-gray-800 hover:text-blue-600 underline">Statement_form.docx</a>
                        </div>
                        
                        {/* Form 2 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
                          <div className="mr-4 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <a href="#" className="text-lg text-gray-800 hover:text-blue-600 underline">Child_abduction_notice.docx</a>
                        </div>
                        
                        {/* Form 3 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
                          <div className="mr-4 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <a href="#" className="text-lg text-gray-800 hover:text-blue-600 underline">Child abduction parent/guardian Proforma statement.docx</a>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interview/Consent Forms Column */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-6">Interview / Consent Forms</h3>
                      
                      <div className="space-y-4">
                        {/* Form 1 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
                          <div className="mr-4 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <a href="#" className="text-lg text-gray-800 hover:text-blue-600 underline">Interview_Consent.docx</a>
                        </div>
                        
                        {/* Form 2 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
                          <div className="mr-4 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <a href="#" className="text-lg text-gray-800 hover:text-blue-600 underline">Medical_consent_form.docx</a>
                        </div>
                        
                        {/* Form 3 */}
                        <div className="bg-white p-6 rounded-lg shadow-sm flex items-center">
                          <div className="mr-4 text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <a href="#" className="text-lg text-gray-800 hover:text-blue-600 underline">Video_Interview_form.docx</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Officers list or Chat */}
          <div className="w-80 border-l border-gray-200 flex flex-col">
            {activeChatOfficer ? (
              <AdminChatView 
                officer={activeChatOfficer}
                messages={officerMessages[activeChatOfficer.id] || []}
                onSendMessage={handleSendMessage}
                onClose={handleCloseChat}
              />
            ) : (
              <>
                {/* Tabs - keep only these top tabs */}
                <div className="flex bg-gray-100 p-2">
                  <button
                    className={`flex-1 py-3 font-medium rounded-full ${
                      sidebarTab === 'officers' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                    } transition-colors`}
                    onClick={() => setSidebarTab('officers')}
                  >
                    My Officers
                  </button>
                  <button
                    className={`flex-1 py-3 font-medium rounded-full ${
                      sidebarTab === 'appointments' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                    } transition-colors ml-2`}
                    onClick={() => setSidebarTab('appointments')}
                  >
                    Appointments
                  </button>
                </div>
                
                {/* Content based on selected tab */}
                {sidebarTab === 'officers' && (
                  <OfficersView 
                    onOfficerChatClick={handleOfficerClick} 
                    unreadMessages={unreadMessages}
                    officersTyping={officersTyping}
                  />
                )}
                
                {sidebarTab === 'appointments' && (
                  <div className="overflow-auto p-3">
                    <h2 className="text-lg font-semibold mb-3">Upcoming Appointments</h2>
                    
                    {/* Date selector */}
                    <div className="flex overflow-x-auto pb-2 mb-4 hide-scrollbar">
                      <DateSelector />
                    </div>
                    
                    <div className="space-y-3">
                      {/* Filter appointments based on selected date */}
                      {(() => {
                        const selectedDate = dates.find(d => d.offset === selectedDateOffset)?.dateObj;
                        if (!selectedDate) return null;

                        // Filter appointments based on selected date
                        const filteredAppointments = [
                          {
                            type: 'VICTIM STATEMENT',
                            name: 'John Linden',
                            caseNumber: 'CRI12145/21',
                            officer: 'DC S. Morgan',
                            date: '15/04/2023',
                            time: '14:30',
                            color: 'bg-blue-500'
                          },
                          {
                            type: 'CASE REVIEW',
                            name: 'Aidan Shah',
                            caseNumber: 'CRI12366/21',
                            officer: 'DC T. Wilson',
                            date: '16/04/2023',
                            time: '10:15',
                            color: 'bg-green-500'
                          },
                          {
                            type: 'EVIDENCE REVIEW',
                            name: 'Sarah Johnson',
                            caseNumber: 'CRI10987/23',
                            officer: 'DC R. Peters',
                            date: '17/04/2023',
                            time: '09:00',
                            color: 'bg-purple-500'
                          },
                          {
                            type: 'COURT PREPARATION',
                            name: 'Michael Chen',
                            caseNumber: 'CRI11245/23',
                            officer: 'DC S. Morgan',
                            date: '18/04/2023',
                            time: '13:00',
                            color: 'bg-red-500'
                          },
                          {
                            type: 'WITNESS INTERVIEW',
                            name: 'Emma Roberts',
                            caseNumber: 'CRI12789/23',
                            officer: 'DC L. Johnson',
                            date: '20/04/2023',
                            time: '15:45',
                            color: 'bg-yellow-500'
                          },
                          // Today's appointments
                          {
                            type: 'VICTIM SUPPORT',
                            name: 'David Wilson',
                            caseNumber: 'CRI13456/23',
                            officer: 'DC S. Morgan',
                            date: new Date().toLocaleDateString('en-GB'),
                            time: '09:30',
                            color: 'bg-blue-500'
                          },
                          {
                            type: 'EVIDENCE COLLECTION',
                            name: 'Lisa Anderson',
                            caseNumber: 'CRI13567/23',
                            officer: 'DC T. Wilson',
                            date: new Date().toLocaleDateString('en-GB'),
                            time: '11:00',
                            color: 'bg-purple-500'
                          },
                          {
                            type: 'CASE BRIEFING',
                            name: 'Robert Brown',
                            caseNumber: 'CRI13678/23',
                            officer: 'DC R. Peters',
                            date: new Date().toLocaleDateString('en-GB'),
                            time: '14:00',
                            color: 'bg-green-500'
                          },
                          // Tomorrow's appointments
                          {
                            type: 'WITNESS STATEMENT',
                            name: 'Jennifer Smith',
                            caseNumber: 'CRI13789/23',
                            officer: 'DC L. Johnson',
                            date: new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-GB'),
                            time: '10:00',
                            color: 'bg-yellow-500'
                          },
                          {
                            type: 'SUSPECT INTERVIEW',
                            name: 'Thomas Lee',
                            caseNumber: 'CRI13890/23',
                            officer: 'DC S. Morgan',
                            date: new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-GB'),
                            time: '13:30',
                            color: 'bg-red-500'
                          },
                          {
                            type: 'CASE UPDATE',
                            name: 'Maria Garcia',
                            caseNumber: 'CRI13901/23',
                            officer: 'DC T. Wilson',
                            date: new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-GB'),
                            time: '15:00',
                            color: 'bg-blue-500'
                          }
                        ].filter(appointment => {
                          const appointmentDate = new Date(appointment.date.split('/').reverse().join('-'));
                          return appointmentDate.getDate() === selectedDate.getDate() &&
                                 appointmentDate.getMonth() === selectedDate.getMonth() &&
                                 appointmentDate.getFullYear() === selectedDate.getFullYear();
                        });

                        if (filteredAppointments.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              No appointments scheduled for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                          );
                        }

                        return filteredAppointments.map((appointment, index) => (
                          <div key={index} className="bg-white rounded-lg shadow-sm p-3">
                        <div className="flex justify-between items-start">
                          <div>
                                <div className={`${appointment.color} text-white text-xs px-2 py-1 rounded-sm inline-block mb-1`}>
                                  {appointment.type}
                          </div>
                                <h3 className="font-medium text-sm">{appointment.name}</h3>
                                <p className="text-xs text-gray-500">Case #{appointment.caseNumber}</p>
                                <p className="text-xs text-gray-500">Officer: {appointment.officer}</p>
                          </div>
                          <div className="text-right">
                                <div className="font-bold text-sm">{appointment.date}</div>
                                <div className="text-blue-600 text-xs">{appointment.time}</div>
                          </div>
                        </div>
                      </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 