import React, { useEffect, useState } from 'react';
import { FiX, FiInfo, FiCheck, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Delay the actual close to allow for animation
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Get the right icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="text-green-400 w-5 h-5" />;
      case 'warning':
        return <FiAlertTriangle className="text-yellow-400 w-5 h-5" />;
      case 'error':
        return <FiAlertCircle className="text-red-400 w-5 h-5" />;
      case 'info':
      default:
        return <FiInfo className="text-blue-400 w-5 h-5" />;
    }
  };

  const icon = getIcon();

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-md w-11/12 rounded-xl shadow-xl z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-black bg-opacity-90 backdrop-blur-sm rounded-xl flex items-center overflow-hidden border border-gray-800">
        <div className="p-4 flex items-center justify-center">
          {icon}
        </div>
        <div className="px-3 py-4 text-white flex-1 text-sm font-medium">
          {message}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};