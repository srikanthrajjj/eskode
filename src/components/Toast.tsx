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
  
  // Get the right icon and color based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheck className="text-white" />,
          bg: 'bg-green-500',
          iconBg: 'bg-green-600'
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="text-white" />,
          bg: 'bg-yellow-500',
          iconBg: 'bg-yellow-600'
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="text-white" />,
          bg: 'bg-red-500',
          iconBg: 'bg-red-600'
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="text-white" />,
          bg: 'bg-blue-500',
          iconBg: 'bg-blue-600'
        };
    }
  };
  
  const { icon, bg, iconBg } = getTypeStyles();
  
  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md w-11/12 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`rounded-lg flex items-center overflow-hidden ${bg}`}>
        <div className={`p-3 ${iconBg}`}>
          {icon}
        </div>
        <div className="px-4 py-3 text-white flex-1">
          {message}
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-3 text-white hover:text-gray-200"
        >
          <FiX />
        </button>
      </div>
    </div>
  );
}; 