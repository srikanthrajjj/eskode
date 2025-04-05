import React from 'react';
import { X, ChevronDown, MessageSquare, Phone, Video, Copy } from 'lucide-react';

interface Witness {
  name: string;
  messageCount: number;
}

interface Props {
  crimeNumber: string;
  onClose: () => void;
}

export default function CrimeDetailsModal({ crimeNumber, onClose }: Props) {
  const witnesses: Witness[] = [
    { name: 'Zam Rahman', messageCount: 2 },
    { name: 'Zaina Rahman', messageCount: 2 },
    { name: 'Srikanth Raj', messageCount: 2 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-medium">Crime Details</h3>
            <p className="text-sm text-gray-500">{crimeNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Crime Summary */}
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">MO- Crime Summary</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-800 mb-4">
                Known male offender following an argument punches the victim in the face repeatedly causing a black eye and bloody nose.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Date of Offence : 12/05/2021 13:12:00hrs</p>
                <p>Place of Offence : 12 Winston Rd, London NW1 9LN</p>
              </div>
            </div>
          </div>

          {/* Witnesses */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Witnesses</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Witness
              </button>
            </div>
            {witnesses.map((witness, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-lg p-4 mb-3"
              >
                <div className="mb-3">
                  <span className="text-sm text-gray-500">Witness</span>
                  <h3 className="font-medium">{witness.name}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <button className="relative p-2 bg-blue-50 rounded-full">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                        {witness.messageCount}
                      </span>
                    </button>
                    <button className="p-2 bg-blue-50 rounded-full">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </button>
                    <button className="p-2 bg-blue-50 rounded-full">
                      <Video className="w-5 h-5 text-blue-600" />
                    </button>
                    <button className="p-2 bg-yellow-50 rounded-full">
                      <Copy className="w-5 h-5 text-yellow-500" />
                    </button>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}