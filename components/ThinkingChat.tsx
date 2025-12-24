
import React, { useState, useRef, useEffect } from 'react';
import { thinkingChat } from '../services/geminiService';
import { ChatMessage, Conversation } from '../types';

const STORAGE_KEY = 'lumina_thinking_chats';

const ThinkingChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Conversation[];
        setConversations(parsed.sort((a, b) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentId) {
      const conv = conversations.find(c => c.id === currentId);
      if (conv) setMessages(conv.messages);
    } else {
      setMessages([]);
    }
  }, [currentId, conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const saveConversation = (id: string, msgs: ChatMessage[]) => {
    setConversations(prev => {
      const existingIdx = prev.findIndex(c => c.id === id);
      let updated: Conversation[];
      
      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          messages: msgs,
          timestamp: Date.now()
        };
      } else {
        const title = msgs[0]?.text.slice(0, 40) + (msgs[0]?.text.length > 40 ? '...' : '') || 'New Discussion';
        updated = [{
          id,
          title,
          messages: msgs,
          timestamp: Date.now()
        }, ...prev];
      }
      
      const sorted = updated.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    });
  };

  const startNewChat = () => {
    setCurrentId(null);
    setMessages([]);
    setInput('');
    setIsHistoryOpen(false);
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
    if (currentId === id) startNewChat();
  };

  const handleSend = async () => {
    if (!input || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    const activeId = currentId || crypto.randomUUID();
    if (!currentId) setCurrentId(activeId);
    
    setInput('');
    setLoading(true);

    try {
      const response = await thinkingChat(input);
      const updatedMessages: ChatMessage[] = [...newMessages, { role: 'model', text: response }];
      setMessages(updatedMessages);
      saveConversation(activeId, updatedMessages);
    } catch (err: any) {
      const errorMsg: ChatMessage = { role: 'model', text: "Error: " + err.message };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveConversation(activeId, updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500">
      <aside className={`flex-shrink-0 flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isHistoryOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100 md:w-72'}`}>
        <button 
          onClick={startNewChat}
          className="w-full py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span> New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Recent Logic</label>
          {conversations.length === 0 ? (
            <p className="text-[10px] text-zinc-700 px-2 italic">Clean slate</p>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => { setCurrentId(conv.id); setIsHistoryOpen(false); }}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                  currentId === conv.id 
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-lg shadow-white/5' 
                    : 'bg-black border-zinc-900/50 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <div className="text-xs font-medium truncate pr-6">{conv.title}</div>
                <button 
                  onClick={(e) => deleteConversation(e, conv.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="md:hidden flex justify-center">
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 py-1 px-4 rounded-full border border-zinc-900 bg-zinc-950"
        >
          {isHistoryOpen ? 'Close History' : 'View History'}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-[500px] md:min-h-0 space-y-4">
        <header className="flex-shrink-0 hidden md:flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold">Deep Reasoning</h2>
            <p className="text-zinc-500 text-xs tracking-wide">Gemini 3 Flash • Deep Thinking Enabled</p>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 bg-zinc-900/10 rounded-3xl border border-zinc-800/40 p-4 md:p-6 overflow-y-auto space-y-6 scroll-smooth shadow-inner"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-8">
              <div className="text-5xl mb-4 grayscale">🧠</div>
              <p className="max-w-xs text-xs font-medium leading-relaxed">System ready for complex reasoning tasks on the Free Tier.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[95%] md:max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-zinc-100 text-black shadow-md' 
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-sm'
              }`}>
                <div className={`text-[9px] mb-2 font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {msg.role === 'user' ? 'PROMPT_INPUT' : 'THOUGHT_OUTPUT'}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe a complex problem..."
            className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl py-4 pl-5 pr-20 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all text-sm placeholder:text-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input}
            className="absolute right-2 top-2 bottom-2 px-5 bg-zinc-100 text-black text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-white active:scale-95 transition-all disabled:opacity-20"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThinkingChat;
