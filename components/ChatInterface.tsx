import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { runChat } from '../services/geminiService';

interface ChatInterfaceProps {
  mode: 'CHAT' | 'THINK';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    const newMsgs: ChatMessage[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const response = await runChat(userText, messages, mode === 'THINK');
      setMessages([...newMsgs, { role: 'model', text: response }]);
    } catch (err: any) {
      setMessages([...newMsgs, { role: 'model', text: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] md:h-[calc(100vh-140px)] max-w-2xl mx-auto w-full">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 md:px-4 py-6 space-y-6 scroll-smooth scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
            <div className="text-6xl mb-6 drop-shadow-2xl">{mode === 'CHAT' ? '💬' : '🧠'}</div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
              {mode === 'CHAT' ? 'Flash Core' : 'Thinking Core'}
            </p>
            <p className="text-[10px] mt-4 text-zinc-500 max-w-xs leading-relaxed">
              Using AI Studio Free Tier key.<br/>Optimized for text and logic.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`group p-5 md:p-6 rounded-3xl max-w-[92%] md:max-w-[85%] shadow-xl transition-all border ${
              msg.role === 'user' 
                ? 'bg-zinc-100 text-black border-white rounded-tr-none' 
                : msg.text.startsWith('⚠️') 
                  ? 'bg-red-950/20 border-red-900/40 text-red-200 rounded-tl-none'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-100 rounded-tl-none backdrop-blur-sm'
            }`}>
              <div className={`text-[8px] font-black mb-3 uppercase tracking-[0.2em] flex items-center gap-2 ${
                msg.role === 'user' ? 'text-zinc-400' : msg.text.startsWith('⚠️') ? 'text-red-500' : 'text-zinc-600'
              }`}>
                {msg.role === 'user' ? 'USER' : 'GEMINI'}
              </div>
              <div className="text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap selection:bg-zinc-500/30">
                {msg.text}
              </div>
              {msg.text.includes("QUOTA") && (
                <button 
                  onClick={handleSwitchKey}
                  className="mt-4 w-full py-2 bg-red-500/20 text-red-300 text-[9px] font-bold uppercase rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Swap API Key
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl rounded-tl-none animate-pulse">
               <div className="flex gap-2">
                 <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-black/80 backdrop-blur-lg rounded-t-[3rem] border-t border-zinc-900">
        <div className="relative flex items-end gap-3 max-w-xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your prompt..."
            className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-[2rem] py-4 pl-6 pr-6 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-700 resize-none min-h-[56px] max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-white text-black rounded-[1.5rem] flex items-center justify-center hover:bg-zinc-200 disabled:opacity-10 transition-all active:scale-90 flex-shrink-0 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l7-7-7-7M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;