import React, { useState, useEffect, useRef } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import api from '../../services/api';
import MathText from '../../components/common/MathText';
import { marked } from 'marked';

// Configure marked to handle options safely
marked.setOptions({
    breaks: true,
    gfm: true,
});

export default function PowerAI() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Mobile toggle
    const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false); // Desktop toggle
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const res = await api.get('ai/chats');
            setChats(res.data);
        } catch (err) {
            console.error("Failed to fetch chats", err);
        }
    };

    const loadChat = async (id) => {
        setIsLoading(true);
        try {
            const res = await api.get(`ai/chats/${id}`);
            setMessages(res.data.messages || []);
            setCurrentChatId(id);
            if (window.innerWidth < 1024) setIsHistoryOpen(false);
        } catch (err) {
            console.error("Failed to load chat", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentChatId(null);
        if (window.innerWidth < 1024) setIsHistoryOpen(false);
    };

    const deleteChat = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat history?")) return;
        try {
            await api.delete(`ai/chats/${id}`);
            if (currentChatId === id) handleNewChat();
            fetchChats();
        } catch (err) {
            console.error("Failed to delete chat", err);
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('ai/chat', { 
                message: currentInput,
                chat_id: currentChatId
            });
            const aiMsg = { role: 'ai', content: res.data.reply, timestamp: new Date().toISOString() };
            setMessages(prev => [...prev, aiMsg]);
            
            if (!currentChatId) {
                setCurrentChatId(res.data.chat_id);
                fetchChats();
            }
        } catch (err) {
            console.error("AI Chat failed", err);
            setMessages(prev => [...prev, { role: 'error', content: "AI brain is currently recalibrating. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickPrompt = (text) => {
        setInput(text);
    };

    return (
        <div className="max-w-[1600px] mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] flex gap-4 animate-in fade-in duration-700 -mt-2 md:-mt-4 relative overflow-hidden">
            
            {/* History Overlay (Mobile) */}
            {isHistoryOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsHistoryOpen(false)}
                ></div>
            )}

            {/* History Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white backdrop-blur-xl border-r border-gray-100 transition-all duration-300 transform
                ${isHistoryOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
                lg:relative lg:bg-transparent lg:border-none lg:p-0
                ${isHistoryCollapsed ? 'lg:w-0' : 'lg:w-80'}
                flex flex-col gap-4 overflow-hidden
            `}>
                <div className={`bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm flex flex-col h-full transition-opacity duration-300 ${isHistoryCollapsed ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">AI History</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={handleNewChat} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600" title="New Chat">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => setIsHistoryCollapsed(true)} className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400" title="Collapse Sidebar">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {chats.length === 0 ? (
                            <div className="text-center py-8 opacity-40">
                                <p className="text-[10px] font-bold uppercase tracking-widest">No history yet</p>
                            </div>
                        ) : (
                            chats.map(chat => (
                                <div 
                                    key={chat.id} 
                                    onClick={() => loadChat(chat.id)}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex flex-col overflow-hidden">
                                        <span className={`text-[12px] font-bold truncate ${currentChatId === chat.id ? 'text-gray-900 font-black' : 'text-gray-600'}`}>{chat.title || 'New Chat'}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{new Date(chat.updated_at).toLocaleDateString()}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteChat(chat.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-gray-400"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-sm relative z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => {
                            if (window.innerWidth < 1024) setIsHistoryOpen(!isHistoryOpen);
                            else setIsHistoryCollapsed(!isHistoryCollapsed);
                        }} className="p-2 hover:bg-gray-100 rounded-lg group">
                            <svg className={`w-5 h-5 text-gray-600 transition-transform ${(!isHistoryCollapsed || isHistoryOpen) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 leading-none">
                                Power AI
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full border border-gray-200 font-bold hidden xs:inline">Experimental</span>
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Chat Optimized View</p>
                        </div>
                    </div>
                </div>

                {/* Chat Canvas */}
                <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-inner overflow-hidden flex flex-col relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-8 py-8 text-center animate-in fade-in zoom-in duration-700">
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight max-w-lg mx-auto p-4 md:p-0">
                                    Inkiito <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 uppercase italic">Intelligence</span>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                    <button onClick={() => quickPrompt("Can you summarize the main causes of the French Revolution?")} className="p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-gray-300 hover:shadow-md transition-all">
                                        <p className="text-[12px] text-gray-600 font-medium">Summarize the main causes of the French Revolution</p>
                                    </button>
                                    <button onClick={() => quickPrompt("Write a simple Python script to solve quadratic equations.")} className="p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-gray-300 hover:shadow-md transition-all">
                                        <p className="text-[12px] text-gray-600 font-medium">Write a Python script for quadratic equations</p>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex justify-center w-full py-8 px-4 ${msg.role === 'ai' ? 'bg-gray-50/30' : 'bg-white'}`}>
                                        <div className="max-w-4xl w-full flex gap-4 md:gap-6">
                                            {/* Avatar Area */}
                                            <div className="shrink-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-200' : 'bg-gradient-to-br from-gray-700 to-gray-900'}`}>
                                                    {msg.role === 'user' ? (
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content Area - ChatGPT Style */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                                                    {msg.role === 'user' ? 'You' : 'Inkiito Agent'}
                                                </div>
                                                <div className={`ai-content text-[15px] font-normal leading-relaxed text-gray-800 prose prose-slate max-w-none`}>
                                                    <style>{`
                                                        .ai-content h1 { font-size: 1.5rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; color: #111827; }
                                                        .ai-content h2 { font-size: 1.25rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111827; }
                                                        .ai-content h3 { font-size: 1.1rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #111827; }
                                                        .ai-content ul { list-style-type: bullet; margin-left: 1.5rem; margin-bottom: 1rem; }
                                                        .ai-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
                                                        .ai-content li { margin-bottom: 0.5rem; }
                                                        .ai-content p { margin-bottom: 1rem; line-height: 1.75; }
                                                        .ai-content code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.875em; border: 1px solid #e5e7eb; }
                                                        .ai-content pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
                                                        .ai-content pre code { background: transparent; border: none; padding: 0; color: inherit; font-size: 0.9em; }
                                                        .ai-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; italic; color: #6b7280; margin: 1.5rem 0; }
                                                    `}</style>
                                                    <MathText text={msg.content} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex justify-center w-full py-8 px-4 bg-gray-50/30">
                                <div className="max-w-4xl w-full flex gap-6">
                                    <div className="shrink-0">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center animate-pulse">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 items-center mt-3">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Matrix */}
                    <div className="p-4 md:p-6 bg-white relative z-20">
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSend} className="relative group">
                                <div className="relative flex items-center border border-gray-200 rounded-2xl shadow-sm focus-within:border-gray-400 focus-within:shadow-md transition-all bg-white overflow-hidden">
                                    <input 
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full pl-5 pr-14 py-4 outline-none font-medium text-gray-900 placeholder:text-gray-400 text-[15px]"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-2 px-2">
                                        <button 
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <p className="mt-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inkiito AI can make mistakes. Check important info.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
