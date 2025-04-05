import React, { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import websocketService from '../services/websocketService';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onTaskAdded }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [crimeNumber, setCrimeNumber] = useState('');
  const [offence, setOffence] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [victimName, setVictimName] = useState('');
  const [officerInCharge, setOfficerInCharge] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!taskTitle.trim()) {
      setError('Task title is required');
      return;
    }

    // Create task object
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      description: taskDescription,
      crimeNumber: crimeNumber || 'NO REF',
      offence: offence || 'UNSPECIFIED',
      offenceColor: 'bg-blue-500',
      priority,
      dueDate: dueDate || new Date().toLocaleDateString(),
      assignedTo: 'Pending',
      status: 'Pending',
      victimName,
      officerInCharge: officerInCharge || 'UNASSIGNED',
      date: new Date().toLocaleDateString()
    };

    // Send task via WebSocket
    websocketService.sendMessage('NEW_TASK', newTask);
    
    // Reset form
    setTaskTitle('');
    setTaskDescription('');
    setCrimeNumber('');
    setOffence('');
    setPriority('Medium');
    setDueDate('');
    setVictimName('');
    setOfficerInCharge('');
    setError('');
    
    // Close modal and notify parent
    onClose();
    if (onTaskAdded) onTaskAdded();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded flex items-center">
              <FiAlertCircle className="mr-2" />
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Task Title*
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter task title"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Crime Number
              </label>
              <input
                type="text"
                value={crimeNumber}
                onChange={(e) => setCrimeNumber(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g. CRI12345/23"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Offence
              </label>
              <input
                type="text"
                value={offence}
                onChange={(e) => setOffence(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g. THEFT"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Victim Name
              </label>
              <input
                type="text"
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter victim name"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Officer In Charge
              </label>
              <input
                type="text"
                value={officerInCharge}
                onChange={(e) => setOfficerInCharge(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g. PC 12345"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
