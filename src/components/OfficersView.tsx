import { useState } from 'react';

interface Officer {
  id: string;
  name: string;
  position: string;
  badgeNumber: string;
  image: string;
  assignedCases: number;
}

interface OfficersViewProps {
  onOfficerChatClick: (officer: Officer) => void;
  unreadMessages?: Record<string, number>;
  officersTyping?: Record<string, boolean>;
}

const OfficersView = ({ onOfficerChatClick, unreadMessages = {}, officersTyping = {} }: OfficersViewProps) => {
  // Sample officers data
  const officers: Officer[] = [
    {
      id: 'off1',
      name: 'S. Morgan',
      position: 'DC',
      badgeNumber: '12345',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      assignedCases: 7
    },
    {
      id: 'off2',
      name: 'M. Johnsom',
      position: 'PC',
      badgeNumber: '134234',
      image: 'https://randomuser.me/api/portraits/women/65.jpg',
      assignedCases: 7
    },
    {
      id: 'off3',
      name: 'K. Tedd',
      position: 'DC',
      badgeNumber: '143424',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      assignedCases: 6
    },
    {
      id: 'off4',
      name: 'L. Victoria',
      position: 'PC',
      badgeNumber: '12345',
      image: 'https://randomuser.me/api/portraits/women/76.jpg',
      assignedCases: 5
    },
    {
      id: 'off5',
      name: 'S. Jhanvi',
      position: 'PC',
      badgeNumber: '234234',
      image: 'https://randomuser.me/api/portraits/women/45.jpg',
      assignedCases: 2
    },
    {
      id: 'off6',
      name: 'L. Johnson',
      position: 'PC',
      badgeNumber: '435234',
      image: 'https://randomuser.me/api/portraits/men/67.jpg',
      assignedCases: 1
    },
    {
      id: 'off7',
      name: 'I. Johnson',
      position: 'PC',
      badgeNumber: '435231',
      image: 'https://randomuser.me/api/portraits/men/85.jpg',
      assignedCases: 1
    },
    {
      id: 'off8',
      name: 'K. Randy',
      position: 'PC',
      badgeNumber: '33443',
      image: 'https://randomuser.me/api/portraits/men/54.jpg',
      assignedCases: 1
    },
    {
      id: 'off9',
      name: 'Z. Adams',
      position: 'DC',
      badgeNumber: '54343',
      image: 'https://randomuser.me/api/portraits/men/42.jpg',
      assignedCases: 1
    }
  ];

  return (
    <div className="bg-gray-100 h-full flex flex-col">
      {/* Officers List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 space-y-3">
          {officers.map((officer) => (
            <div 
              key={officer.id} 
              className={`flex items-center justify-between p-3 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
                unreadMessages[officer.id] 
                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                  : officersTyping[officer.id]
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'bg-white'
              }`}
              onClick={() => onOfficerChatClick(officer)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={officer.image}
                    alt={officer.name}
                    className={`w-12 h-12 rounded-full object-cover ${
                      unreadMessages[officer.id] 
                        ? 'ring-2 ring-blue-500' 
                        : officersTyping[officer.id] 
                          ? 'ring-2 ring-green-500' 
                          : ''
                    }`}
                  />
                </div>
                <div>
                  <h3 className={`font-medium ${
                    unreadMessages[officer.id] 
                      ? 'text-blue-700' 
                      : officersTyping[officer.id] 
                        ? 'text-green-700'
                        : 'text-gray-900'
                  }`}>{officer.name}</h3>
                  <p className="text-xs text-gray-500">{officer.position} {officer.badgeNumber}</p>
                  {unreadMessages[officer.id] && (
                    <p className="text-xs text-blue-600 mt-1">New message</p>
                  )}
                  {officersTyping[officer.id] && (
                    <p className="text-xs text-green-600 mt-1 animate-pulse">typing...</p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-blue-600 p-2 rounded-full hover:bg-blue-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OfficersView; 