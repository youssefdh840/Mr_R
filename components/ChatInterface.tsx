
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
      setMessages([...newMsgs, { role: 'model', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] max-w-2xl mx-auto w-full">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-8 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <div className="text-6xl mb-4">{mode === 'CHAT' ? '💬' : '🧠'}</div>
            <p className="text-xs font-black uppercase tracking-[0.3em]">System Initialized</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-6 rounded-[2rem] max-w-[90%] shadow-2xl transition-all ${
              msg.role === 'user' 
                ? 'bg-white text-black rounded-tr-none' 
                : 'bg-zinc-900/80 border border-zinc-800 text-zinc-100 rounded-tl-none'
            }`}>
              <div className={`text-[9px] font-black mb-3 uppercase tracking-widest opacity-50 ${
                msg.role === 'user' ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {msg.role === 'user' ? 'USER_PROMPT' : 'JOZEF_AI'}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-[2rem] rounded-tl-none">
               <div className="flex gap-2">
                 <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl py-5 pl-6 pr-16 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all text-sm placeholder:text-zinc-700 resize-none min-h-[64px] max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-3 bottom-3 w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-20 transition-all active:scale-95"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
