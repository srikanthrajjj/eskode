import { useState } from 'react';
import { FiChevronDown, FiMessageSquare } from 'react-icons/fi';

interface Task {
  id: string;
  date: string;
  summary: string;
  offence: string;
  offenceColor: string;
  crimeNumber: string;
  officerInCharge: string;
  assignedTo: string;
  status: 'Pending' | 'Completed' | 'In Progress';
}

const TasksView = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  
  // Sample task data
  const tasks: Task[] = [
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

  // Filter tasks based on active tab
  const inboxTasks = tasks.filter(task => task.status !== 'Completed');
  const outboxTasks = tasks.filter(task => task.status === 'Completed');
  const displayedTasks = activeTab === 'inbox' ? inboxTasks : outboxTasks;

  return (
    <div className="bg-white p-6 rounded-16px shadow-sm">
      {/* Tab navigation */}
      <div className="flex mb-6">
        <button
          className={`px-4 py-2 font-medium rounded-tl-lg rounded-bl-lg ${
            activeTab === 'inbox'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('inbox')}
        >
          Task Inbox ({inboxTasks.length})
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-tr-lg rounded-br-lg ${
            activeTab === 'outbox'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('outbox')}
        >
          Task Outbox ({outboxTasks.length})
        </button>
      </div>

      {/* Task table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Offence
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Crime Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Officer in Charge
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned to
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {task.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {task.summary}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${task.offenceColor}`}>
                    {task.offence}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {task.crimeNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    {task.officerInCharge}
                    <FiMessageSquare className="ml-2 text-blue-500 cursor-pointer" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${task.assignedTo === 'Pending' ? 'text-yellow-600' : 'text-gray-900'}`}>{task.assignedTo}</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <FiChevronDown />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TasksView; 