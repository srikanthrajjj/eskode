import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquare, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import aiService, { AIMessage } from '../services/aiService';

interface AIAssistantProps {
  position?: 'bottom-right' | 'bottom-left' | 'sidebar' | 'fullscreen' | 'content-area';
  onClose?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ position = 'bottom-right', onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<AIMessage[]>([]);
  const [autoAssist, setAutoAssist] = useState(aiService.isAutoAssistEnabled());
  const [showTemplates, setShowTemplates] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Template questions
  const templateQuestions = [
    "How do I assign a task to an officer?",
    "What's the procedure for updating a case status?",
    "How can I generate a report for all active cases?",
    "What information should be included in a victim statement?",
    "How do I prioritize incoming tasks?"
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: message
    };

    // Add user message to conversation
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Convert conversation to the format expected by the AI service
      const conversationHistory = conversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get response from AI service
      const response = await aiService.askQuestion(message, conversationHistory);

      // Add AI response to conversation
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.text
        }
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message to conversation
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateClick = async (question: string) => {
    // Add user message to conversation immediately
    const userMessage: AIMessage = {
      role: 'user',
      content: question
    };

    // Add user message to conversation
    setConversation(prev => [...prev, userMessage]);
    setShowTemplates(false);
    setIsLoading(true);

    try {
      // Convert conversation to the format expected by the AI service
      const conversationHistory = conversation.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get response from AI service
      const response = await aiService.askQuestion(question, conversationHistory);

      // Add AI response to conversation
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.text
        }
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message to conversation
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoAssist = () => {
    const newState = aiService.toggleAutoAssist();
    setAutoAssist(newState);
  };

  const clearConversation = () => {
    setConversation([]);
  };

  // Position classes based on the position prop
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'sidebar': 'top-0 right-0 h-full',
    'fullscreen': 'inset-0',
    'content-area': 'inset-0'
  };

  // Determine if we're in fullscreen or content-area mode
  const isFullscreen = position === 'fullscreen';
  const isContentArea = position === 'content-area';

  // Render the message list
  const renderMessages = () => {
    if (!conversation || conversation.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No messages yet</h3>
          <p className="text-gray-500 max-w-xs">
            Start a conversation with the AI assistant to get help with your questions.
          </p>
        </div>
      );
    }

    // Group messages by date
    const messagesByDate: { [date: string]: AIMessage[] } = {};
    conversation.forEach(msg => {
      // Extract date from timestamp or use today
      const msgDate = new Date().toLocaleDateString();
      if (!messagesByDate[msgDate]) {
        messagesByDate[msgDate] = [];
      }
      messagesByDate[msgDate].push(msg);
    });

    return Object.entries(messagesByDate).map(([date, msgs]) => (
      <div key={date} className="mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
            {date}
          </div>
        </div>

        {msgs.map((msg, index) => {
          const isUser = msg.role === 'user';
          const showAvatar = index === 0 || msgs[index - 1]?.role !== msg.role;

          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
              {!isUser && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 mr-2 overflow-hidden flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">AI</span>
                </div>
              )}

              <div className={`max-w-xs md:max-w-md ${isUser ? 'order-1' : 'order-2'}`}>
                {showAvatar && (
                  <div className={`text-xs mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    <span className="font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
                  </div>
                )}

                <div className="flex items-end">
                  <div
                    className={`rounded-2xl py-2 px-3 ${isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              </div>

              {isUser && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 ml-2 overflow-hidden flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">You</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  // Custom icon component for message square
  const MessageSquare = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  return (
    <>
      {/* Floating button when closed */}
      {!isOpen && position !== 'sidebar' && position !== 'fullscreen' && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} z-50 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors`}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* AI Assistant Widget */}
      {(isOpen || position === 'sidebar' || isFullscreen || isContentArea) && (
        <div
          className={`${
            position === 'sidebar'
              ? 'h-full w-80 border-l'
              : isFullscreen
                ? 'fixed inset-0 z-50 bg-white overflow-hidden flex flex-col'
                : isContentArea
                  ? 'h-full w-full bg-white overflow-hidden flex flex-col'
                  : `fixed ${positionClasses[position]} z-50 w-80 rounded-lg shadow-xl`
          } bg-white overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className={`bg-blue-600 text-white ${isFullscreen || isContentArea ? 'p-4' : 'p-3'} flex items-center justify-between`}>
            <div className="flex items-center">
              <Sparkles className={`${isFullscreen || isContentArea ? 'w-6 h-6' : 'w-5 h-5'} mr-2`} />
              <h3 className={`${isFullscreen || isContentArea ? 'text-xl' : ''} font-medium`}>AI Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoAssist}
                className="text-white hover:text-blue-200 transition-colors"
                title={autoAssist ? "Auto-Assist ON" : "Auto-Assist OFF"}
              >
                {autoAssist ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              {(position !== 'sidebar' && !isFullscreen && !isContentArea) && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {(isFullscreen || isContentArea) && onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className={`flex-1 overflow-y-auto ${isFullscreen || isContentArea ? 'p-6' : 'p-3'} bg-gray-50`}>
            {isFullscreen || isContentArea ? (
              <div className="max-w-3xl mx-auto">
                {renderMessages()}

                {/* Typing indicator */}
                {isAdminTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center bg-gray-100 rounded-full py-1 px-3 mt-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            ) : (
              <>
                {renderMessages()}

                {/* Typing indicator */}
                {isAdminTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center bg-gray-100 rounded-full py-1 px-3 mt-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className={`${isFullscreen || isContentArea ? 'p-4 border-t border-gray-200' : 'p-3 border-t'}`}>
            {isFullscreen || isContentArea ? (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    className="flex-1 bg-transparent border-none outline-none py-2 px-2 text-base"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    className={`p-2 rounded-full ${
                      !message.trim() || isLoading
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">
                    Auto-Assist is {autoAssist ? 'ON' : 'OFF'}
                  </span>
                </div>

                {conversation.length === 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">Try asking about:</div>
                    <div className="flex flex-wrap gap-2">
                      {templateQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleTemplateClick(question)}
                          className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversation.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={clearConversation}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear conversation
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    className="flex-1 bg-transparent border-none outline-none py-2 px-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    className={`p-2 rounded-full ${
                      !message.trim() || isLoading
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">
                    Auto-Assist is {autoAssist ? 'ON' : 'OFF'}
                  </span>
                </div>

                {conversation.length === 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-white border rounded-md text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <span>Try a sample question</span>
                      {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showTemplates && (
                      <div className="mt-1 bg-white border rounded-md overflow-hidden">
                        {templateQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleTemplateClick(question)}
                            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-blue-50 border-b last:border-b-0"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {conversation.length > 0 && (
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={clearConversation}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear conversation
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
