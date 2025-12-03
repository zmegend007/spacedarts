import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Trash2 } from 'lucide-react';
import { chatWithBot, GameContext } from '../services/gemini';
import { ChatMessage } from '../types';

const CHAT_STORAGE_KEY = 'dartmaster_chat_history';

interface ChatAssistantProps {
  gameContext?: GameContext;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ gameContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
    return [{ role: 'model', text: 'Oi! Need a ruling or a tip? Ask away!', timestamp: Date.now() }];
  });
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      // Filter history for API
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      history.push({ role: 'user', text: userMsg.text });

      const responseText = await chatWithBot(history, userMsg.text, gameContext);

      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  const clearHistory = () => {
    const initialMsg = { role: 'model' as const, text: 'Oi! Need a ruling or a tip? Ask away!', timestamp: Date.now() };
    setMessages([initialMsg]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-dart-accent hover:bg-red-600 text-white p-4 rounded-full shadow-lg z-50 transition-transform hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-dart-panel border border-gray-600 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-dart-neon p-4 flex justify-between items-center border-b border-gray-600">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-dart-green" />
              <h3 className="font-bold text-white">DartBot Pro</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearHistory}
                className="text-gray-400 hover:text-white"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dart-dark/90">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                    ? 'bg-dart-accent text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-400 rounded-lg p-3 text-xs italic">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-dart-panel border-t border-gray-600 flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about rules..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-dart-accent"
            />
            <button
              onClick={handleSend}
              disabled={isThinking || !inputText.trim()}
              className="bg-dart-green hover:bg-green-600 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
