import { useState } from 'react';
import { FiX, FiCalendar, FiClock, FiTag, FiInfo, FiChevronDown, FiUser, FiFileText, FiMapPin, FiFolder, FiUsers } from 'react-icons/fi';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const appointment: Omit<Appointment, 'id'> = {
      type: appointmentType,
      date: date,
      time: time,
      relatedTo: caseName,
      relatedCase: caseNumber,
      relatedCrimeType: crimeType,
      color: getAppointmentColor(appointmentType)
    };

    onSave(appointment);
    onClose();
    
    // Reset form
    setAppointmentType('');
    setDate('');
    setTime('');
  };

  const getAppointmentColor = (type: string): string => {
    switch (type) {
      case 'VICTIM STATEMENT':
        return 'bg-blue-500';
      case 'CASE REVIEW':
        return 'bg-purple-500';
      case 'SCENE REVISIT':
        return 'bg-green-500';
      case 'EVIDENCE REVIEW':
        return 'bg-amber-500';
      case 'WITNESS INTERVIEW':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const appointmentTypes = [
    { 
      value: 'VICTIM STATEMENT', 
      label: 'Victim Statement', 
      description: 'Record a formal statement from the victim',
      icon: <FiUser className="w-5 h-5" />,
      color: 'text-blue-500'
    },
    { 
      value: 'CASE REVIEW', 
      label: 'Case Review', 
      description: 'Review case progress and next steps',
      icon: <FiFileText className="w-5 h-5" />,
      color: 'text-purple-500'
    },
    { 
      value: 'SCENE REVISIT', 
      label: 'Scene Revisit', 
      description: 'Return to the scene for additional investigation',
      icon: <FiMapPin className="w-5 h-5" />,
      color: 'text-green-500'
    },
    { 
      value: 'EVIDENCE REVIEW', 
      label: 'Evidence Review', 
      description: 'Review collected evidence with the victim',
      icon: <FiFolder className="w-5 h-5" />,
      color: 'text-amber-500'
    },
    { 
      value: 'WITNESS INTERVIEW', 
      label: 'Witness Interview', 
      description: 'Interview witnesses related to the case',
      icon: <FiUsers className="w-5 h-5" />,
      color: 'text-red-500'
    }
  ];

  if (!isOpen) return null;

  // Get tomorrow's date in YYYY-MM-DD format for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">New Appointment</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {/* Case Details Card - Moved to top for better context */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <FiInfo className="text-blue-500 mr-2" />
                <h3 className="font-medium text-gray-900 text-sm">Case Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Related to</div>
                  <div className="font-medium text-gray-900">{caseName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Case Number</div>
                  <div className="font-medium text-gray-900">{caseNumber}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Crime Type</div>
                  <div className="font-medium text-gray-900">{crimeType}</div>
                </div>
              </div>
            </div>

            {/* Appointment Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <FiTag className="mr-2" />
                Type
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm flex items-center justify-between bg-white"
                >
                  <div className="flex items-center">
                    {appointmentType ? (
                      <>
                        {appointmentTypes.find(t => t.value === appointmentType)?.icon}
                        <span className="ml-2">
                          {appointmentTypes.find(t => t.value === appointmentType)?.label}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">Select appointment type</span>
                    )}
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {appointmentTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setAppointmentType(type.value);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm flex items-center hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <span className={type.color}>{type.icon}</span>
                        <div className="ml-2">
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiCalendar className="mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={minDate}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiClock className="mr-2" />
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal; 