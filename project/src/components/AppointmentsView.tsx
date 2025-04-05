import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, MessageSquare, Phone, X, CheckCircle2, AlertCircle } from 'lucide-react';

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
  appointments: Appointment[];
  onContactClick: (type: 'video' | 'message' | 'phone', appointment: Appointment) => void;
  onCancel: (appointmentId: string) => void;
  onReschedule: (appointmentId: string, newDate: string, newTime: string) => void;
}

export default function AppointmentsView({ appointments, onContactClick, onCancel, onReschedule }: Props) {
  const [rescheduleModal, setRescheduleModal] = useState<{
    id: string;
    date: string;
    time: string;
  } | null>(null);
  
  const [successMessage, setSuccessMessage] = useState<{
    appointmentId: string;
    date: string;
    time: string;
  } | null>(null);

  const [cancelConfirmation, setCancelConfirmation] = useState<string | null>(null);

  const handleRescheduleSubmit = () => {
    if (rescheduleModal) {
      onReschedule(rescheduleModal.id, rescheduleModal.date, rescheduleModal.time);
      setSuccessMessage({
        appointmentId: rescheduleModal.id,
        date: rescheduleModal.date,
        time: rescheduleModal.time
      });
      setRescheduleModal(null);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
  };

  const handleCancelConfirm = (appointmentId: string) => {
    onCancel(appointmentId);
    setCancelConfirmation(null);
  };

  return (
    <div className="px-4 space-y-4">
      {/* Cancel Confirmation Modal */}
      {cancelConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-start mb-4">
              <div className="mr-3 mt-0.5">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Are you sure you want to cancel this appointment? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCancelConfirmation(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => handleCancelConfirm(cancelConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
              <button 
                onClick={() => setRescheduleModal(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleModal.date}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev!, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleModal.time}
                  onChange={(e) => setRescheduleModal(prev => ({ ...prev!, time: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setRescheduleModal(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {appointments.map((appointment) => (
        <div 
          key={appointment.id} 
          className={`bg-white rounded-lg p-4 shadow-sm ${
            appointment.status === 'cancelled' ? 'opacity-75' : ''
          }`}
        >
          {/* Status Badge */}
          {appointment.status === 'cancelled' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              <span>This appointment has been cancelled</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && successMessage.appointmentId === appointment.id && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center text-green-700">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
              <span>
                Appointment rescheduled to{' '}
                {new Date(successMessage.date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} at {successMessage.time}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">{appointment.title}</h3>
              <p className="text-sm text-gray-500">Case: {appointment.caseNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.typeColor}`}>
              {appointment.type}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{new Date(appointment.date).toLocaleDateString('en-GB', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span>{appointment.time}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{appointment.location}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Victim</p>
                <p className="font-medium">{appointment.victimName}</p>
              </div>
              {appointment.status !== 'cancelled' && (
                <div className="flex space-x-2">
                  <button 
                    className="p-2 hover:bg-gray-50 rounded-full"
                    onClick={() => onContactClick('video', appointment)}
                  >
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    className="p-2 hover:bg-gray-50 rounded-full"
                    onClick={() => onContactClick('message', appointment)}
                  >
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    className="p-2 hover:bg-gray-50 rounded-full"
                    onClick={() => onContactClick('phone', appointment)}
                  >
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {appointment.status !== 'cancelled' && (
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setRescheduleModal({
                    id: appointment.id,
                    date: appointment.date,
                    time: appointment.time
                  })}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setCancelConfirmation(appointment.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}