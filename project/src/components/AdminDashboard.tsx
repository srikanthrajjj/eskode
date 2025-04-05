import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  FileText, 
  HelpCircle, 
  Settings,
  Search,
  Bell,
  MessageSquare,
  Menu,
  BarChart2,
  TrendingUp,
  Users,
  Download,
  Filter,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Shield,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AssignTaskModal from './AssignTaskModal';
import { PerformanceChart } from './charts/PerformanceChart';
import { CrimeChart } from './charts/CrimeChart';
import { ResourceChart } from './charts/ResourceChart';
import AppointmentsView from './AppointmentsView';

interface Officer {
  id: string;
  officer_id: string;
  name: string;
  rank: string;
  division: string;
  status: string;
  image_url: string;
  case_count?: number;
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

interface Props {
  onBack: () => void;
  onSendMessage?: (officerId: string, message: string) => void;
  messages?: Array<{id: string; text: string; timestamp: string}>;
}

function AdminDashboard({ onBack, onSendMessage, messages }: Props) {
  const [expandedSidebar, setExpandedSidebar] = useState(false);
  const [taskView, setTaskView] = useState<'inbox' | 'outbox'>('inbox');
  const [activeView, setActiveView] = useState<'dashboard' | 'reports'>('dashboard');
  const [activeReport, setActiveReport] = useState<'performance' | 'crime' | 'resource'>('performance');
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [officersTab, setOfficersTab] = useState<'officers' | 'appointments'>('officers');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [assignTask, setAssignTask] = useState<{
    crimeNumber: string;
    summary: string;
  } | null>(null);
  const [tasks, setTasks] = useState<Record<'inbox' | 'outbox', any[]>>({
    inbox: [],
    outbox: []
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const { data, error } = await supabase
          .from('officers')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        if (data) {
          setOfficers(data);
        }
      } catch (error) {
        console.error('Error fetching officers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
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
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedTasks = data.map(task => ({
            ...task,
            date: new Date(task.created_at).toLocaleDateString('en-GB'),
            crimeNumber: task.crime_number,
            officerInCharge: task.officer_in_charge,
            assignedTo: task.assigned_to || 'Pending'
          }));

          setTasks({
            inbox: formattedTasks.filter(task => !task.completed),
            outbox: formattedTasks.filter(task => task.completed)
          });
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  const handleAssignTask = async (officerId: string) => {
    if (assignTask) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ assigned_to: officerId })
          .eq('crime_number', assignTask.crimeNumber);

        if (error) throw error;

        setTasks(prev => ({
          ...prev,
          inbox: prev.inbox.map(task => 
            task.crime_number === assignTask.crimeNumber
              ? { ...task, assignedTo: officerId }
              : task
          )
        }));

        setAssignTask(null);
      } catch (error) {
        console.error('Error assigning task:', error);
        alert('Failed to assign task. Please try again.');
      }
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
    console.log('Contact clicked:', type, appointment);
  };

  const handleOfficerClick = (officer: Officer) => {
    if (onSendMessage) {
      window.dispatchEvent(new CustomEvent('openChat', { 
        detail: { 
          officerId: officer.officer_id,
          officerName: officer.name
        }
      }));
    }
  };

  const filteredOfficers = officers.filter(officer => {
    if (!searchQuery) return true;
    return (
      officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.officer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.division.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderOfficerCard = (officer: Officer) => {
    const isChiefInspector = officer.rank === 'Detective Chief Inspector';
    
    return (
      <div 
        key={officer.id} 
        className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${
          isChiefInspector ? 'bg-blue-50 border-2 border-blue-200' : ''
        }`}
        onClick={() => handleOfficerClick(officer)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={officer.image_url}
              alt={officer.name}
              className="w-10 h-10 rounded-full"
            />
            {isChiefInspector && (
              <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1">
                <Star className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">{officer.name}</h3>
              {isChiefInspector && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Chief
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{officer.officer_id}</p>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Shield className="w-3 h-3" />
              <span>{officer.rank}</span>
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          officer.status === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {officer.status}
        </span>
      </div>
    );
  };

  const renderDashboardContent = () => {
    return (
      <div className="p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Active Cases</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-blue-600">32</p>
                  <span className="ml-2 text-sm text-green-500">+4</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Response</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-blue-600">18</p>
                  <span className="ml-2 text-sm">min</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Resolution</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-blue-600">87%</p>
                  <span className="ml-2 text-sm text-green-500">↑5%</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Officers</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-blue-600">24</p>
                  <span className="ml-2 text-sm text-gray-500">/30</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setTaskView('inbox')}
                  className={`px-4 py-2 rounded-lg ${
                    taskView === 'inbox'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  Task Inbox (12)
                </button>
                <button
                  onClick={() => setTaskView('outbox')}
                  className={`px-4 py-2 rounded-lg ${
                    taskView === 'outbox'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  Task Outbox (6)
                </button>
              </div>

              <div className="bg-white rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="px-3 py-2 text-sm font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 text-sm font-medium text-gray-500">Summary</th>
                      <th className="px-3 py-2 text-sm font-medium text-gray-500">Offence</th>
                      <th className="px-3 py-2 text-sm font-medium text-gray-500">Crime Number</th>
                      <th className="px-3 py-2 text-sm font-medium text-gray-500">Officer in Charge</th>
                      <th className="px-3 py-2 text-sm font-medium text-gray-500">Assigned to</th>
                      <th className="px-3 py-2 text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks[taskView].map((task, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2 text-sm">{task.date}</td>
                        <td className="px-3 py-2 text-sm">{task.summary}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                            {task.offence}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <a href="#" className="text-sm text-blue-600 hover:underline">
                            {task.crimeNumber}
                          </a>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{task.officerInCharge}</span>
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm">{task.assignedTo}</td>
                        <td className="px-3 py-2">
                          <button 
                            onClick={() => setAssignTask({
                              crimeNumber: task.crimeNumber,
                              summary: task.summary
                            })}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              task.assignedTo !== 'Pending'
                                ? 'text-yellow-600 border border-yellow-600 hover:bg-yellow-50'
                                : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {task.assignedTo !== 'Pending' ? 'Reassign' : 'Assign'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-80">
            <div className="bg-white rounded-lg flex flex-col h-[700px]">
              <div className="flex border-b shrink-0">
                <button
                  onClick={() => setOfficersTab('officers')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    officersTab === 'officers'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Officers
                </button>
                <button
                  onClick={() => setOfficersTab('appointments')}
                  className={`flex-1 px-4 py-3 text-sm font-medium ${
                    officersTab === 'appointments'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Appointments
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  {officersTab === 'officers' ? (
                    <div className="space-y-3">
                      {loading ? (
                        <div className="text-center py-4 text-gray-500">Loading officers...</div>
                      ) : filteredOfficers.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No officers found</div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search officers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            {filteredOfficers
                              .sort((a, b) => {
                                if (a.rank === 'Detective Chief Inspector') return -1;
                                if (b.rank === 'Detective Chief Inspector') return 1;
                                return a.name.localeCompare(b.name);
                              })
                              .map(renderOfficerCard)}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {loadingAppointments ? (
                        <div className="text-center py-4 text-gray-500">Loading appointments...</div>
                      ) : appointments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No appointments found</div>
                      ) : (
                        <AppointmentsView
                          appointments={appointments}
                          onContactClick={handleContactClick}
                          onCancel={handleCancelAppointment}
                          onReschedule={handleRescheduleAppointment}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportsContent = () => {
    return (
      <div className="p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveReport('performance')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'performance'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            Performance Reports
          </button>
          <button
            onClick={() => setActiveReport('crime')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'crime'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            Crime Statistics
          </button>
          <button
            onClick={() => setActiveReport('resource')}
            className={`px-4 py-2 rounded-lg ${
              activeReport === 'resource'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            Resource Allocation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {activeReport === 'performance' && 'Officer Performance Metrics'}
                  {activeReport === 'crime' && 'Crime Rate Trends'}
                  {activeReport === 'resource' && 'Resource Utilization'}
                </h3>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Filter className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="h-80">
              {activeReport === 'performance' && <PerformanceChart />}
              {activeReport === 'crime' && <CrimeChart />}
              {activeReport === 'resource' && <ResourceChart />}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Key Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Cases</p>
                  <p className="text-2xl font-bold">248</p>
                </div>
                <span className="text-green-500 text-sm">+12% ↑</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Resolution Rate</p>
                  <p className="text-2xl font-bold">76%</p>
                </div>
                <span className="text-green-500 text-sm">+5% ↑</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Officers</p>
                  <p className="text-2xl font-bold">28</p>
                </div>
                <span className="text-red-500 text-sm">-2% ↓</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                {
                  action: 'Case Assigned',
                  details: 'DC Morgan assigned to robbery case',
                  time: '2 hours ago'
                },
                {
                  action: 'Report Filed',
                  details: 'New evidence submitted for Case #4589',
                  time: '4 hours ago'
                },
                {
                  action: 'Status Update',
                  details: 'Burglary investigation completed',
                  time: '6 hours ago'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div 
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 group hover:w-64 ${
          expandedSidebar ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setExpandedSidebar(true)}
        onMouseLeave={() => setExpandedSidebar(false)}
      >
        <div className="p-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full flex items-center p-3 rounded-lg ${
                  activeView === 'dashboard'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="w-6 h-6 flex-shrink-0" />
                <span className={`ml-3 whitespace-nowrap ${expandedSidebar ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 group-hover:opacity-100 group-hover:w-auto`}>
                  Dashboard
                </span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('reports')}
                className={`w-full flex items-center p-3 rounded-lg ${
                  activeView === 'reports'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-6 h-6 flex-shrink-0" />
                <span className={`ml-3 whitespace-nowrap ${expandedSidebar ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 group-hover:opacity-100 group-hover:w-auto`}>
                  Reports
                </span>
              </button>
            </li>
            <li>
              <a href="#" className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                <HelpCircle className="w-6 h-6 flex-shrink-0" />
                <span className={`ml-3 whitespace-nowrap ${expandedSidebar ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 group-hover:opacity-100 group-hover:w-auto`}>
                  FAQ
                </span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Settings className="w-6 h-6 flex-shrink-0" />
                <span className={`ml-3 whitespace-nowrap ${expandedSidebar ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 group-hover:opacity-100 group-hover:w-auto`}>
                  Settings
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className={`flex-1 ${expandedSidebar ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search crimes numbers, officers etc"
                className="w-96 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                3
              </span>
            </button>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
          </div> </header>

        {activeView === 'dashboard' ? renderDashboardContent() : renderReportsContent()}
      </div>

      {assignTask && (
        <AssignTaskModal
          onClose={() => setAssignTask(null)}
          onAssign={handleAssignTask}
          officers={officers}
          taskSummary={assignTask.summary}
          crimeNumber={assignTask.crimeNumber}
        />
      )}
    </div>
  );
}

export default AdminDashboard;

