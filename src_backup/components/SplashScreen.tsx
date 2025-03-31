import { useState, useEffect } from 'react';
import { FiShield, FiSettings, FiUser } from 'react-icons/fi';

interface SplashScreenProps {
  onSelectPoliceApp: () => void;
  onSelectAdminDashboard: () => void;
  onSelectVictimApp: () => void;
}

const SplashScreen = ({ onSelectPoliceApp, onSelectAdminDashboard, onSelectVictimApp }: SplashScreenProps) => {
  const [hoveredButton, setHoveredButton] = useState<'police' | 'admin' | 'victim' | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    // Animate logo with a slight delay
    setTimeout(() => {
      setLogoAnimated(true);
    }, 300);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-10 floating-particle"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 15 + 8}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: i % 3 === 0 ? '0 0 10px 2px rgba(255, 255, 255, 0.3)' : 'none'
            }}
          />
        ))}
      </div>

      {/* Background glow effects */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary-500 rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className={`mb-8 text-center transform transition-all duration-1000 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-3 relative">
          <span className={`inline-block transition-all duration-700 ${logoAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                style={{ transitionDelay: '0.4s' }}>E</span>
          <span className={`inline-block transition-all duration-700 ${logoAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                style={{ transitionDelay: '0.5s' }}>s</span>
          <span className={`inline-block transition-all duration-700 ${logoAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                style={{ transitionDelay: '0.6s' }}>k</span>
          <span className={`inline-block transition-all duration-700 ${logoAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                style={{ transitionDelay: '0.7s' }}>o</span>
          <span className={`inline-block transition-all duration-700 ${logoAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                style={{ transitionDelay: '0.8s' }}>d</span>
          <span className={`inline-block transition-all duration-700 ${logoAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
                style={{ transitionDelay: '0.9s' }}>e</span>
        </h1>
        <p className={`text-xl text-primary-100 max-w-xl mx-auto transition-all duration-1000 ${logoAnimated ? 'opacity-100' : 'opacity-0'}`}
           style={{ transitionDelay: '1s' }}>
          Streamlining Justice, Empowering Law Enforcement.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center px-4">
        {/* Police App Card */}
        <button
          className={`w-full md:w-1/3 bg-white rounded-2xl p-5 shadow-lg transform transition-all duration-500 relative overflow-hidden ${
            hoveredButton === 'police' ? 'scale-105 shadow-xl' : ''
          } ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          style={{ transitionDelay: '0.1s' }}
          onClick={onSelectPoliceApp}
          onMouseEnter={() => setHoveredButton('police')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {/* Glow effect on hover */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-primary-300 to-primary-400 opacity-0 transition-opacity duration-500 ${hoveredButton === 'police' ? 'opacity-10' : ''}`}
          ></div>
          
          <div className="bg-primary-100 text-primary-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 relative">
            <div className={`absolute inset-0 rounded-full bg-primary-200 transform scale-0 transition-transform duration-500 ${hoveredButton === 'police' ? 'scale-110' : ''}`}></div>
            <FiShield className={`text-2xl transition-all duration-500 relative z-10 ${hoveredButton === 'police' ? 'rotate-12 scale-125' : ''}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Police App</h2>
          <p className="text-sm text-gray-600 text-center mb-4">
            Access case management, appointments, and field operations for officers.
          </p>
          <div className={`mt-4 bg-primary-600 text-white rounded-full py-2 px-6 text-center font-medium transition-all duration-500 ${
            hoveredButton === 'police' ? 'bg-primary-700 shadow-lg' : ''
          }`}>
            Enter App
          </div>
        </button>

        {/* Victim App Card */}
        <button
          className={`w-full md:w-1/3 bg-white rounded-2xl p-5 shadow-lg transform transition-all duration-500 relative overflow-hidden ${
            hoveredButton === 'victim' ? 'scale-105 shadow-xl' : ''
          } ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          style={{ transitionDelay: '0.2s' }}
          onClick={onSelectVictimApp}
          onMouseEnter={() => setHoveredButton('victim')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {/* Glow effect on hover */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-400 opacity-0 transition-opacity duration-500 ${hoveredButton === 'victim' ? 'opacity-10' : ''}`}
          ></div>
          
          <div className="bg-blue-100 text-blue-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 relative">
            <div className={`absolute inset-0 rounded-full bg-blue-200 transform scale-0 transition-transform duration-500 ${hoveredButton === 'victim' ? 'scale-110' : ''}`}></div>
            <FiUser className={`text-2xl transition-all duration-500 relative z-10 ${hoveredButton === 'victim' ? 'rotate-12 scale-125' : ''}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Victim App</h2>
          <p className="text-sm text-gray-600 text-center mb-4">
            Track your case status, receive updates, and communicate with officers.
          </p>
          <div className={`mt-4 bg-blue-600 text-white rounded-full py-2 px-6 text-center font-medium transition-all duration-500 ${
            hoveredButton === 'victim' ? 'bg-blue-700 shadow-lg' : ''
          }`}>
            Enter App
          </div>
        </button>

        {/* Admin Dashboard Card */}
        <button
          className={`w-full md:w-1/3 bg-white rounded-2xl p-5 shadow-lg transform transition-all duration-500 relative overflow-hidden ${
            hoveredButton === 'admin' ? 'scale-105 shadow-xl' : ''
          } ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          style={{ transitionDelay: '0.3s' }}
          onClick={onSelectAdminDashboard}
          onMouseEnter={() => setHoveredButton('admin')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {/* Glow effect on hover */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 opacity-0 transition-opacity duration-500 ${hoveredButton === 'admin' ? 'opacity-10' : ''}`}
          ></div>
          
          <div className="bg-gray-100 text-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 relative">
            <div className={`absolute inset-0 rounded-full bg-gray-200 transform scale-0 transition-transform duration-500 ${hoveredButton === 'admin' ? 'scale-110' : ''}`}></div>
            <FiSettings className={`text-2xl transition-all duration-500 relative z-10 ${hoveredButton === 'admin' ? 'animate-spin-slow' : ''}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Admin Dashboard</h2>
          <p className="text-sm text-gray-600 text-center mb-4">
            Manage users, monitor system activity, and configure department settings.
          </p>
          <div className={`mt-4 bg-gray-800 text-white rounded-full py-2 px-6 text-center font-medium transition-all duration-500 ${
            hoveredButton === 'admin' ? 'bg-gray-900 shadow-lg' : ''
          }`}>
            Enter Dashboard
          </div>
        </button>
      </div>

      <div className={`mt-8 text-center text-primary-100 text-sm transform transition-all duration-1000 ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
           style={{ transitionDelay: '0.4s' }}>
        <p>© 2023 Eskode - Case Management System</p>
        <p className="mt-1">Version 1.0.0</p>
      </div>

      {/* Add global style tag */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0);
            }
            25% {
              transform: translateY(-20px) translateX(10px);
            }
            50% {
              transform: translateY(-10px) translateX(20px);
            }
            75% {
              transform: translateY(-30px) translateX(-10px);
            }
          }
          
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default SplashScreen; 