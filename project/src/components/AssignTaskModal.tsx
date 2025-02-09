import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';

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

interface Props {
  onClose: () => void;
  onAssign: (officerId: string) => void;
  officers: Officer[];
  taskSummary: string;
  crimeNumber: string;
}

export default function AssignTaskModal({ onClose, onAssign, officers, taskSummary, crimeNumber }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);

  const filteredOfficers = officers.filter(officer => 
    officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.officer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.division.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = () => {
    if (selectedOfficer) {
      onAssign(selectedOfficer);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-lg">Assign Task</h3>
            <p className="text-sm text-gray-500">Crime: {crimeNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Task Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{taskSummary}</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search officers by name, ID, rank, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Officers List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredOfficers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No officers found matching your search
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOfficers.map((officer) => (
                  <div
                    key={officer.id}
                    onClick={() => setSelectedOfficer(officer.officer_id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      selectedOfficer === officer.officer_id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={officer.image_url}
                        alt={officer.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-medium">{officer.name}</h4>
                        <p className="text-sm text-gray-500">{officer.officer_id}</p>
                        <p className="text-xs text-gray-400">{officer.rank} • {officer.division}</p>
                      </div>
                    </div>
                    {selectedOfficer === officer.officer_id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
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
            onClick={handleAssign}
            disabled={!selectedOfficer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Task
          </button>
        </div>
      </div>
    </div>
  );
}