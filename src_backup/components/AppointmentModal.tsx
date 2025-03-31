import { useState } from 'react';

interface Appointment {
  id: string;
  type: string;
  date: string;
  time: string;
  relatedTo: string;
  relatedCase: string;
  relatedCrimeType: string;
  color?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id'>) => void;
  caseName: string;
  caseNumber: string;
  crimeType: string;
}

const AppointmentModal = ({
  isOpen,
  onClose,
  onSave,
  caseName,
  caseNumber,
  crimeType
}: AppointmentModalProps) => {
  const [appointmentType, setAppointmentType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const appointment: Omit<Appointment, 'id'> = {
      type: appointmentType,
      date: date,
      time: time,
      relatedTo: caseName,
      relatedCase: caseNumber,
      relatedCrimeType: crimeType,
      color: 'bg-blue-500'
    };

    onSave(appointment);
    onClose();
    
    // Reset form
    setAppointmentType('');
    setDate('');
    setTime('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md relative">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create New Appointment</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Appointment Type
                </label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type</option>
                  <option value="VICTIM STATEMENT">Victim Statement</option>
                  <option value="CASE REVIEW">Case Review</option>
                  <option value="SCENE REVISIT">Scene Revisit</option>
                  <option value="EVIDENCE REVIEW">Evidence Review</option>
                  <option value="WITNESS INTERVIEW">Witness Interview</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium text-sm text-gray-700">Case Details</h3>
                <p className="text-sm text-gray-600">Related to: {caseName}</p>
                <p className="text-sm text-gray-600">Case Number: {caseNumber}</p>
                <p className="text-sm text-gray-600">Crime Type: {crimeType}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal; 