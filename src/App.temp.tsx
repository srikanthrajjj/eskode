import React, { useState, useEffect } from 'react';
import { FaPhone, FaVideo } from 'react-icons/fa';
import { FiMessageSquare } from 'react-icons/fi';
import { BsFileEarmarkText, BsCalendar3 } from 'react-icons/bs';
import { MdOutlineContactPage } from 'react-icons/md';

// Define the Case interface
interface Case {
  id: string;
  victimName: string;
  crimeNumber: string;
  crimeType: string;
  hasNotifications?: boolean;
  color?: string;
}

type CommunicationType = 'message' | 'call' | 'video';

// Test section with corrected syntax
const TestSection = () => {
  // Define the case items state
  const [caseItems, setCaseItems] = useState<Case[]>([]);

  // Handle communication function
  const handleOpenCommunication = (
    type: CommunicationType,
    caseId: string,
    victimName: string
  ) => {
    console.log(`Opening ${type} communication with ${victimName} for case ${caseId}`);
    // Add your communication handling logic here
  };

  return (
    <div>
      {caseItems.map((caseItem) => (
        <div key={caseItem.id} className="bg-white rounded-lg shadow p-4">
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
  );
};

export default TestSection; 