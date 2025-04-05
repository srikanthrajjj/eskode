import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Case {
  id: string;
  victim_name: string;
  crime_number: string;
  date_of_birth: string;
  address: string;
  type: string;
}

interface Props {
  onClose: () => void;
  onSubmit: (caseData: {
    victimName: string;
    dateOfBirth: string;
    address: string;
    type: string;
  }) => void;
}

export default function NewCaseModal({ onClose, onSubmit }: Props) {
  const [caseData, setCaseData] = useState({
    victimName: '',
    dateOfBirth: '',
    address: '',
    type: 'ASSAULT WOUNDING'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [existingCases, setExistingCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const crimeTypes = [
    { label: 'ASSAULT WOUNDING', color: 'bg-orange-100 text-orange-800' },
    { label: 'SEC 47 ASSAULT', color: 'bg-red-100 text-red-800' },
    { label: 'BURGLARY OTD', color: 'bg-yellow-100 text-yellow-800' },
    { label: 'ROBBERY', color: 'bg-purple-100 text-purple-800' },
    { label: 'THEFT', color: 'bg-blue-100 text-blue-800' }
  ];

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = existingCases.filter(
        case_ =>
          case_.victim_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          case_.crime_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCases(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery, existingCases]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setExistingCases(data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleSubmit = () => {
    if (!caseData.victimName || !caseData.dateOfBirth || !caseData.address) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit(caseData);
    onClose();
  };

  const populateFromCase = (selectedCase: Case) => {
    setCaseData({
      victimName: selectedCase.victim_name,
      dateOfBirth: selectedCase.date_of_birth,
      address: selectedCase.address,
      type: selectedCase.type
    });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Create New Case</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search existing cases..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && filteredCases.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCases.map((case_) => (
                  <button
                    key={case_.id}
                    onClick={() => populateFromCase(case_)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{case_.victim_name}</div>
                      <div className="text-sm text-gray-500">{case_.crime_number}</div>
                    </div>
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-3 text-sm text-gray-500">or create new case</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Victim Name
            </label>
            <input
              type="text"
              value={caseData.victimName}
              onChange={(e) => setCaseData(prev => ({ ...prev, victimName: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter victim name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={caseData.dateOfBirth}
              onChange={(e) => setCaseData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={caseData.address}
              onChange={(e) => setCaseData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crime Type
            </label>
            <select
              value={caseData.type}
              onChange={(e) => setCaseData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {crimeTypes.map((type) => (
                <option key={type.label} value={type.label}>
                  {type.label}
                </option>
              ))}
            </select>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Case</span>
          </button>
        </div>
      </div>
    </div>
  );
}