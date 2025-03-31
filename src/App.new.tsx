import React from 'react';
import { FaPhone, FaVideo } from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';

interface Props {
  caseItems: any[];
  activeTab: string;
  appointments: any[];
  handleOpenCommunication: (type: string, id: string, name: string) => void;
}

export const AppContent: React.FC<Props> = ({
  caseItems,
  activeTab,
  appointments,
  handleOpenCommunication
}) => {
  return (
    <div>
      <div>
        {caseItems.map((caseItem) => (
          <div key={caseItem.id}>
            <div className="border-t flex">
              <button
                className="flex-1 py-3 flex items-center justify-center text-blue-600"
                onClick={() => handleOpenCommunication('message', caseItem.id, caseItem.victimName)}
              >
                <FiMessageSquare className="mr-1" />
                Message
              </button>

              <button
                className="flex-1 py-3 flex items-center justify-center text-blue-600 border-l border-r"
                onClick={() => handleOpenCommunication('call', caseItem.id, caseItem.victimName)}
              >
                <FaPhone className="mr-1" />
                Call
              </button>

              <button
                className="flex-1 py-3 flex items-center justify-center text-blue-600"
                onClick={() => handleOpenCommunication('video', caseItem.id, caseItem.victimName)}
              >
                <FaVideo className="mr-1" />
                Video
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Upcoming Appointments</h2>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow p-4">
                  {/* Appointment content */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              No appointments scheduled
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 