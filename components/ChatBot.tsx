
import React, { useState, useRef, useEffect } from 'react';
import { chatAssistant } from '../services/geminiService';
import { ChatMessage, Conversation } from '../types';

const CHAT_STORAGE_KEY = 'jozef_general_chats';

const ChatBot: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Conversation[];
        setConversations(parsed.sort((a, b) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to parse chat history", e);
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

  const saveChat = (id: string, msgs: ChatMessage[]) => {
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
        const title = msgs[0]?.text.slice(0, 35) + (msgs[0]?.text.length > 35 ? '...' : '') || 'Conversation';
        updated = [{
          id,
          title,
          messages: msgs,
          timestamp: Date.now()
        }, ...prev];
      }
      
      const sorted = updated.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    const activeId = currentId || crypto.randomUUID();
    if (!currentId) setCurrentId(activeId);
    
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await chatAssistant(currentInput, messages);
      const updatedMessages: ChatMessage[] = [...newMessages, { role: 'model', text: response }];
      setMessages(updatedMessages);
      saveChat(activeId, updatedMessages);
    } catch (err: any) {
      const errorMsg: ChatMessage = { role: 'model', text: "Error: " + err.message };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveChat(activeId, updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentId(null);
    setMessages([]);
    setInput('');
    setIsSidebarOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
    if (currentId === id) startNewChat();
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Sidebar - History */}
      <aside className={`flex-shrink-0 flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'fixed inset-0 z-[60] bg-black p-6' : 'hidden md:flex md:w-64 border-r border-zinc-900/50 pr-4'}`}>
        <div className="flex justify-between items-center md:hidden mb-4">
          <h2 className="text-lg font-bold">History</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400">✕</button>
        </div>
        
        <button 
          onClick={startNewChat}
          className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
        >
          <span>+</span> New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Conversations</label>
          {conversations.length === 0 ? (
            <p className="text-[10px] text-zinc-700 px-2 italic">No history yet</p>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => { setCurrentId(conv.id); setIsSidebarOpen(false); }}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                  currentId === conv.id 
                    ? 'bg-zinc-900 border-zinc-700 text-white shadow-xl shadow-white/5' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-950 hover:text-zinc-300'
                }`}
              >
                <div className="text-xs font-medium truncate pr-6">{conv.title}</div>
                <button 
                  onClick={(e) => deleteChat(e, conv.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full max-h-[calc(100vh-12rem)] md:max-h-none">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-zinc-900 rounded-lg text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
              <p className="text-zinc-500 text-xs tracking-widest uppercase font-black">Powered by Gemini 3 Flash</p>
            </div>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 bg-black/40 rounded-3xl border border-zinc-800/40 p-4 md:p-8 overflow-y-auto space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-8">
              <div className="text-6xl mb-6">💬</div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">System Initialized</h3>
              <p className="max-w-xs text-[11px] leading-relaxed">Fast, smart, and efficient. Ask anything.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'bg-zinc-900/50 border border-zinc-800 text-zinc-100'
              }`}>
                <div className={`text-[8px] mb-2 font-black uppercase tracking-widest opacity-40`}>
                  {msg.role === 'user' ? 'USER_PROMPT' : 'JOZEF_AI'}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="mt-4 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-5 pr-20 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-700 resize-none min-h-[56px] max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 bottom-2 p-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-10 active:scale-95 shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
