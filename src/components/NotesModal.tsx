import { useState, useEffect, useRef } from 'react';
import { IoMdClose, IoMdArrowBack, IoMdCheckmarkCircle, IoMdSend } from 'react-icons/io';

interface Note {
  id: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'signed';
  signedBy?: string;
}

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseName: string;
}

const NotesModal = ({ isOpen, onClose, caseId, caseName }: NotesModalProps) => {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const noteInputRef = useRef<HTMLInputElement>(null);
  
  // Load saved notes from localStorage when component mounts
  useEffect(() => {
    const storedNotes = localStorage.getItem(`caseNotes_${caseId}`);
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    } else {
      // Demo data if no notes exist
      const demoNotes: Note[] = [
        {
          id: '1',
          text: 'spoke to Somera Khanom, she does not wish for her daughter to be spoken to and does not want her to be involved',
          timestamp: '8:55am Monday 25th Apr 2021',
          status: 'sent',
          signedBy: 'victim'
        },
        {
          id: '2',
          text: 'spoke to Somera Khanom and discussed a victim personal statement. she wishes to think about it for now',
          timestamp: '4:55pm Monday 25th Apr 2021',
          status: 'pending'
        }
      ];
      setNotes(demoNotes);
      localStorage.setItem(`caseNotes_${caseId}`, JSON.stringify(demoNotes));
    }
  }, [caseId]);

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    
    const currentDate = new Date();
    const formattedTime = currentDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedDate = `${days[currentDate.getDay()]} ${currentDate.getDate()}${getOrdinalSuffix(currentDate.getDate())} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const timestamp = `${formattedTime} ${formattedDate}`;
    
    const newNoteObj: Note = {
      id: Date.now().toString(),
      text: newNote,
      timestamp,
      status: 'sent'
    };
    
    const updatedNotes = [...notes, newNoteObj];
    setNotes(updatedNotes);
    localStorage.setItem(`caseNotes_${caseId}`, JSON.stringify(updatedNotes));
    setNewNote('');
    setShowKeyboard(false);
  };
  
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  const handleSendToVictim = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, status: 'signed' as const, signedBy: 'victim' } 
        : note
    );
    
    setNotes(updatedNotes);
    localStorage.setItem(`caseNotes_${caseId}`, JSON.stringify(updatedNotes));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md h-[80vh] flex flex-col overflow-hidden">
        {/* Mobile-style header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center border-b">
          <button 
            onClick={onClose}
            className="text-gray-600 mr-4"
          >
            <IoMdArrowBack size={24} />
          </button>
          <h3 className="font-medium">Case Notes - {caseName}</h3>
        </div>
        
        {/* Notes display area */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
          {notes.map((note) => (
            <div key={note.id} className="mb-6">
              {/* Timestamp header */}
              <div className="bg-yellow-100 text-gray-800 text-sm font-medium py-1 px-4 rounded-t-md">
                {note.timestamp}
              </div>
              
              {/* Note content */}
              <div className="bg-white p-4 rounded-b-md shadow-sm">
                <p className="text-gray-800 mb-3">{note.text}</p>
                
                <div className="flex items-center justify-between">
                  {note.status === 'sent' && (
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600 mr-3">
                        Sent <IoMdCheckmarkCircle className="ml-1 text-green-500" />
                      </span>
                      {note.signedBy && (
                        <span className="text-green-600 text-sm">Signed by {note.signedBy}</span>
                      )}
                    </div>
                  )}
                  
                  {note.status === 'pending' && (
                    <button
                      onClick={() => handleSendToVictim(note.id)}
                      className="inline-flex items-center rounded-full border border-blue-500 bg-white px-3 py-1 text-sm text-blue-600"
                    >
                      Send to victim <IoMdSend className="ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input area */}
        <div className="bg-white p-4 border-t">
          {showKeyboard ? (
            <div>
              {/* Text input */}
              <div className="flex gap-2">
                <input
                  ref={noteInputRef}
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note..."
                  className="flex-1 p-3 border rounded-md"
                  autoFocus
                />
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center justify-center"
                  onClick={handleSaveNote}
                >
                  <IoMdSend />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowKeyboard(true)}
              className="w-full p-4 bg-gray-100 text-gray-400 text-left rounded-md"
            >
              Tap to enter a note...
            </button>
          )}
          
          {/* Floating add button when keyboard is hidden */}
          {!showKeyboard && (
            <button
              onClick={() => setShowKeyboard(true)}
              className="absolute bottom-20 right-8 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-2xl text-white">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
