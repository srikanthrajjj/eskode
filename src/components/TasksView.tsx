import { useState, useEffect } from 'react';
import { FiChevronDown, FiMessageSquare, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import websocketService from '../services/websocketService';

interface Task {
  id: string;
  date?: string;
  summary?: string;
  title?: string;
  description?: string;
  offence?: string;
  offenceColor?: string;
  crimeNumber?: string;
  officerInCharge?: string;
  assignedTo: string;
  status?: 'Pending' | 'Completed' | 'In Progress';
  victimName?: string;
  priority?: string;
  dueDate?: string;
}

interface TasksViewProps {
  extraCases?: {
    id: string;
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    assignedTo: string;
    offence: string;
    crimeNumber: string;
    officerInCharge: string;
  }[];
}

const TasksView = ({ extraCases = [] }: TasksViewProps) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Try to load tasks from localStorage
    const savedTasks = localStorage.getItem('eskode_tasks');
    if (savedTasks) {
      return JSON.parse(savedTasks);
    }

    // Default tasks if none in localStorage
    return [
      {
        id: 'task1',
        date: '01/05/2021',
        summary: 'Obtain a Statement from Witness from',
        offence: 'SEC 47 ASSAULT',
        offenceColor: 'bg-red-500',
        crimeNumber: 'CRI/123452/21',
        officerInCharge: 'PC 12345',
        assignedTo: 'Pending',
        status: 'Pending'
      },
      {
        id: 'task2',
        date: '02/05/2021',
        summary: 'Review CCTV footage',
        offence: 'BURGLARY OTD',
        offenceColor: 'bg-yellow-500',
        crimeNumber: 'CRI/124567/21',
        officerInCharge: 'PC 12345',
        assignedTo: 'DC Smith',
        status: 'In Progress'
      },
      {
        id: 'task3',
        date: '03/05/2021',
        summary: 'Collect forensic evidence from scene',
        offence: 'HARASSMENT',
        offenceColor: 'bg-blue-500',
        crimeNumber: 'CRI/125678/21',
        officerInCharge: 'PC 54321',
        assignedTo: 'DS Johnson',
        status: 'Pending'
      },
      {
        id: 'task4',
        date: '04/05/2021',
        summary: 'Interview suspect',
        offence: 'THEFT',
        offenceColor: 'bg-green-500',
        crimeNumber: 'CRI/126789/21',
        officerInCharge: 'PC 54321',
        assignedTo: 'Pending',
        status: 'Pending'
      },
      {
        id: 'task5',
        date: '05/05/2021',
        summary: 'File case report',
        offence: 'ASSAULT WOUNDING',
        offenceColor: 'bg-orange-500',
        crimeNumber: 'CRI/127890/21',
        officerInCharge: 'PC 12345',
        assignedTo: 'DC Wilson',
        status: 'Completed'
      }
    ];
  });

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eskode_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Add extra cases to tasks when the prop changes
  useEffect(() => {
    if (extraCases && extraCases.length > 0) {
      const formattedExtraCases = extraCases.map(extraCase => ({
        id: extraCase.id,
        summary: extraCase.title,
        description: extraCase.description,
        assignedTo: extraCase.assignedTo,
        status: 'Pending' as const,
        date: extraCase.dueDate ? new Date(extraCase.dueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        offenceColor: extraCase.priority === 'high' ? 'bg-red-500' :
                     extraCase.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500',
        offence: extraCase.offence || 'UNSPECIFIED',
        crimeNumber: extraCase.crimeNumber || 'NO REF',
        officerInCharge: extraCase.officerInCharge || 'UNASSIGNED'
      }));

      setTasks(prevTasks => {
        const existingIds = new Set(prevTasks.map(t => t.id));
        const newCases = formattedExtraCases.filter(c => !existingIds.has(c.id));
        const updatedTasks = [...prevTasks, ...newCases];
        localStorage.setItem('eskode_tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });
    }
  }, [extraCases]);

  // Listen for task requests from officers
  useEffect(() => {
    const messageCallback = websocketService.onMessage((message) => {
      console.log('TasksView received message:', message);

      // Check if this is a task request from an officer
      if (message.type === 'ADMIN_MESSAGE' && message.payload.taskRequest) {
        console.log('Received task request:', message.payload);

        // Format the task data
        const newTask: Task = {
          id: message.payload.id || `task-${Date.now()}`,
          date: message.payload.date || new Date().toLocaleDateString('en-GB'),
          summary: message.payload.summary || 'New Task',
          offence: message.payload.offence || 'UNSPECIFIED',
          offenceColor: message.payload.offenceColor || 'bg-blue-500',
          crimeNumber: message.payload.crimeNumber || 'NO REF',
          officerInCharge: message.payload.officerInCharge || 'UNASSIGNED',
          assignedTo: 'Pending',
          status: 'Pending',
          victimName: message.payload.victimName
        };

        // Add the new task to the tasks list and save to localStorage
        setTasks(prev => {
          const updatedTasks = [newTask, ...prev];
          localStorage.setItem('eskode_tasks', JSON.stringify(updatedTasks));
          return updatedTasks;
        });
      }
    });

    return () => {
      messageCallback();
    };
  }, []);

  // Filter tasks based on active tab
  const inboxTasks = tasks.filter(task => task.status !== 'Completed');
  const outboxTasks = tasks.filter(task => task.status === 'Completed');
  const displayedTasks = activeTab === 'inbox' ? inboxTasks : outboxTasks;

  // Add function to handle task assignment
  const handleAssignTask = (taskId: string, assignee: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, assignedTo: assignee, status: 'In Progress' } : task
    ));
  };

  // Add function to mark task as completed
  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: 'Completed' } : task
    ));
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Completed':
        return <FiCheckCircle className="text-green-500 mr-2" />;
      case 'In Progress':
        return <FiClock className="text-blue-500 mr-2" />;
      default:
        return <FiAlertCircle className="text-yellow-500 mr-2" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Tab navigation - Improved styling */}
      <div className="flex border-b">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors duration-150 ease-in-out border-b-2 ${
            activeTab === 'inbox'
              ? 'border-primary-600 text-primary-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('inbox')}
        >
          Task Inbox
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
            {inboxTasks.length}
          </span>
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors duration-150 ease-in-out border-b-2 ${
            activeTab === 'outbox'
              ? 'border-primary-600 text-primary-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('outbox')}
        >
          Task Outbox
          <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
            {outboxTasks.length}
          </span>
        </button>
      </div>

      {/* Task table - Improved UI - More compact */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="w-1/3 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Offence
              </th>
              <th scope="col" className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Crime #
              </th>
              <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Officer
              </th>
              <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned
              </th>
              {activeTab === 'inbox' && (
                <th scope="col" className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedTasks.length > 0 ? (
              displayedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                    {task.date}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 truncate max-w-xs">
                    <div className="font-medium text-sm">{task.summary}</div>
                    {task.victimName && (
                      <div className="text-xs text-gray-500 italic">
                        Victim: {task.victimName}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className={`inline-flex text-xs leading-5 font-medium rounded-full px-2 py-0.5 text-white ${task.offenceColor}`}>
                      {task.offence}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-blue-600 font-medium">
                    {task.crimeNumber}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="flex items-center">
                      {task.officerInCharge}
                      <FiMessageSquare className="ml-1 text-blue-500 cursor-pointer" />
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {task.assignedTo === 'Pending' ? (
                      <div className="relative inline-block text-left group">
                        <div>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-full rounded-md border border-yellow-300 shadow-sm px-2 py-1 bg-white text-xs font-medium text-yellow-700 hover:bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                            id="assign-menu-button"
                            aria-expanded="true"
                            aria-haspopup="true"
                          >
                            <span className="mr-1">Assign</span>
                            <FiChevronDown className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                        <div
                          className="origin-top-left absolute left-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="assign-menu-button"
                          tabIndex={-1}
                        >
                          <div className="py-1" role="none">
                            <button
                              onClick={() => handleAssignTask(task.id, 'DC Smith')}
                              className="text-gray-700 block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors duration-150"
                              role="menuitem"
                              tabIndex={-1}
                              id="assign-menu-item-0"
                            >
                              DC Smith
                            </button>
                            <button
                              onClick={() => handleAssignTask(task.id, 'DS Johnson')}
                              className="text-gray-700 block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors duration-150"
                              role="menuitem"
                              tabIndex={-1}
                              id="assign-menu-item-1"
                            >
                              DS Johnson
                            </button>
                            <button
                              onClick={() => handleAssignTask(task.id, 'DC Wilson')}
                              className="text-gray-700 block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors duration-150"
                              role="menuitem"
                              tabIndex={-1}
                              id="assign-menu-item-2"
                            >
                              DC Wilson
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {getStatusIcon(task.status || 'Pending')}
                        <span className="text-xs font-medium text-gray-700">{task.assignedTo}</span>
                      </div>
                    )}
                  </td>
                  {activeTab === 'inbox' && (
                    <td className="px-2 py-2 whitespace-nowrap text-xs">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <FiCheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-2 py-3 text-center text-xs text-gray-500">
                  No tasks found in this category
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TasksView;