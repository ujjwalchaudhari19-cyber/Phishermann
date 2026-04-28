import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Send, Cpu, AlertTriangle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://phishermann.onrender.com";

const STARTER_QUESTIONS = [
  "What is phishing?",
  "How do I stay safe online?",
  "What should I do if I clicked a suspicious link?",
  "How do I identify a scam SMS?"
];

export default function Chat() {
  const { currentUser, getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getToken();
      const res = await axios.post(
        `${API}/chat`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Comm link failure. Retrying protocol...";
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: errorMsg,
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!currentUser) return null;

  return (
    <>
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand hover:bg-brand-hover text-dark-900 border-2 border-dark-900 flex items-center justify-center z-50 shadow-[4px_4px_0_#050505] transition-transform hover:translate-y-1 hover:shadow-[2px_2px_0_#050505] active:translate-y-2 active:shadow-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Terminal"
      >
        {isOpen ? <X size={24} strokeWidth={2.5} /> : <Terminal size={24} strokeWidth={2.5} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-dark-900 border-2 border-dark-600 flex flex-col z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="bg-dark-800 border-b-2 border-dark-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-brand animate-pulse"><Cpu size={20} /></div>
                <div>
                  <h3 className="font-sans font-bold text-white uppercase tracking-wider leading-none">Phishermann AI</h3>
                  <span className="font-mono text-[10px] text-brand uppercase tracking-widest">Sys_Terminal Active</span>
                </div>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center">
                  <div className="bg-dark-800 border border-dark-600 p-4 mb-4">
                    <p className="font-mono text-sm text-gray-300 leading-relaxed">
                      &gt; Initializing cybersecurity assistant...<br/>
                      &gt; Ready for queries. How can I assist?
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {STARTER_QUESTIONS.map((q, i) => (
                      <button 
                        key={i} 
                        className="text-left bg-transparent border border-dark-600 hover:border-brand hover:text-brand text-gray-400 font-mono text-xs p-3 transition-colors uppercase tracking-wide"
                        onClick={() => sendMessage(q)}
                      >
                        &gt; {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 font-mono text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-dark-700 text-white border border-dark-500' 
                        : msg.isError 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/50' 
                          : 'bg-brand/10 text-brand border border-brand/30'
                    }`}>
                      {msg.isError && <AlertTriangle size={14} className="inline mr-2 -mt-1" />}
                      <span className={msg.sender === 'bot' ? 'leading-relaxed' : ''}>{msg.text}</span>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-brand/10 border border-brand/30 p-3">
                    <div className="w-1.5 h-4 bg-brand animate-pulse"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form className="border-t-2 border-dark-600 p-4 bg-dark-800 flex gap-2" onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Enter command or query..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-dark-900 border border-dark-600 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-brand transition-colors"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-brand hover:bg-brand-hover text-dark-900 px-4 py-2 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
