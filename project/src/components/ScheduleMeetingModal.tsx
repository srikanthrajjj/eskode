import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSubmit: (meetingData: {
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    caseNumber: string;
    victimName: string;
  }) => void;
  caseNumber: string;
  victimName: string;
}

export default function ScheduleMeetingModal({ onClose, onSubmit, caseNumber, victimName }: Props) {
  const [meeting, setMeeting] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'Statement'
  });

  const meetingTypes = [
    { label: 'Statement', color: 'bg-purple-100 text-purple-800' },
    { label: 'Court', color: 'bg-blue-100 text-blue-800' },
    { label: 'Meeting', color: 'bg-green-100 text-green-800' },
    { label: 'Interview', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const handleSubmit = async () => {
    if (!meeting.title || !meeting.date || !meeting.time || !meeting.location) {
      alert('Please fill in all fields');
      return;
    }

    try {
      onSubmit({
        ...meeting,
        caseNumber,
        victimName
      });
      onClose();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Error scheduling meeting. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Schedule Meeting</h3>
            <p className="text-sm text-gray-500">Case: {caseNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={meeting.title}
              onChange={(e) => setMeeting(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter meeting title"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={meeting.date}
                onChange={(e) => setMeeting(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={meeting.time}
                onChange={(e) => setMeeting(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={meeting.location}
                onChange={(e) => setMeeting(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter meeting location"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Type
            </label>
            <select
              value={meeting.type}
              onChange={(e) => setMeeting(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {meetingTypes.map((type) => (
                <option key={type.label} value={type.label}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Meeting with: <span className="font-medium">{victimName}</span>
            </p>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Schedule Meeting
          </button>
        </div>
      </div>
    </div>
  );
}