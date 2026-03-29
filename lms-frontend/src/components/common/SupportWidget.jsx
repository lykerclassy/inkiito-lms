import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';
import Button from '../common/Button';

export default function SupportWidget() {
    const { user } = useContext(AuthContext);
    const { showNotification } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState('new');
    const prevResolvedRef = useRef(0);
    const pollingRef = useRef(null);

    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        priority: 'medium'
    });

    const isStaff = user && ['admin', 'developer', 'principal', 'deputy_principal', 'dos', 'teacher', 'class_teacher'].includes(user.role);

    // Fetch tickets silently (used for both open and polling)
    const fetchMyTickets = async (silent = false) => {
        if (!user) return;
        try {
            const res = await api.get('tickets');
            const incoming = res.data;

            if (!isStaff) {
                // Count how many NEW resolved tickets we didn't see before
                const resolvedNow = incoming.filter(t => t.status === 'resolved' || t.status === 'closed').length;
                const newReplies = resolvedNow - prevResolvedRef.current;
                if (newReplies > 0 && !silent) {
                    showNotification(`✅ Developer responded to ${newReplies} of your ticket${newReplies > 1 ? 's' : ''}! Check support history.`, 'success');
                    setUnreadCount(prev => prev + newReplies);
                }
                prevResolvedRef.current = resolvedNow;
            }

            setTickets(incoming);
        } catch {
            // Silently fail for background polls
        }
    };

    // Start polling when user is logged in — every 60s
    useEffect(() => {
        if (!user) return;
        fetchMyTickets(true); // Initial silent fetch
        pollingRef.current = setInterval(() => fetchMyTickets(false), 60000);
        return () => clearInterval(pollingRef.current);
    }, [user]);

    // When widget opens, refresh and clear unread badge
    useEffect(() => {
        if (isOpen) {
            fetchMyTickets(true);
            setUnreadCount(0);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('tickets', formData);
            showNotification('Inquiry submitted! The developer will respond shortly.', 'success');
            setFormData({ subject: '', message: '', priority: 'medium' });
            setActiveTab('history');
            fetchMyTickets(true);
        } catch {
            showNotification('Failed to send. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            
            {/* The Floating Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95
                    ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-school-primary hover:bg-red-700'}
                    text-white
                `}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <div className="relative">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-green-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-school-primary animate-bounce px-1">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* The Support Modal */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[90vw] sm:w-[420px] max-h-[calc(100vh-140px)] bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col">
                    
                    {/* Header */}
                    <div className="bg-school-primary p-6 text-white relative flex-shrink-0">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">Campus Support</h3>
                        <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest mt-1">Direct Developer Inquiry Line</p>
                        
                        {/* Tabs */}
                        <div className="mt-6 flex bg-black/10 rounded-xl p-1 gap-1">
                            <button 
                                onClick={() => setActiveTab('new')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'new' ? 'bg-white text-school-primary shadow-sm' : 'text-white/60 hover:text-white'}`}
                            >
                                New inquiry
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-school-primary shadow-sm' : 'text-white/60 hover:text-white'}`}
                            >
                                History ({tickets.length})
                            </button>
                        </div>
                    </div>

                    {/* Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
                        
                        {activeTab === 'new' ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">What's the difficulty?</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. My computer assignment isn't loading"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-school-primary outline-none text-xs font-bold placeholder:text-gray-400"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Priority</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-school-primary outline-none text-[10px] font-black uppercase tracking-widest"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                        <option value="critical">Critical (Blocking work)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Problem Details</label>
                                    <textarea 
                                        required
                                        rows="4"
                                        placeholder="Provide as much detail as possible..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-school-primary outline-none text-xs font-medium"
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    className="w-full rounded-2xl py-4 font-black uppercase tracking-widest text-[10px]"
                                    isLoading={isSubmitting}
                                >
                                    Transmit Inquiry
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-3 pb-4">
                                {tickets.length === 0 ? (
                                    <div className="text-center py-16 opacity-30 grayscale flex flex-col items-center">
                                         <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        <p className="text-xs font-black uppercase tracking-widestitalic ">No signal history</p>
                                    </div>
                                ) : (
                                    tickets.map(ticket => (
                                        <div key={ticket.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2 group hover:bg-white hover:border-school-primary/20 transition-all">
                                            <div className="flex justify-between items-start">
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                                                    ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                                    ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    [{ticket.status}]
                                                </span>
                                                <span className="text-[7px] text-gray-400 font-bold uppercase">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-xs text-gray-900 leading-tight">{ticket.subject}</h4>
                                            
                                            {ticket.developer_response && (
                                                <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-50 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                                    <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest mb-1 italic">Developer Intelligence:</p>
                                                    <p className="text-[10px] text-gray-700 font-medium leading-relaxed italic">{ticket.developer_response}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer (Fixed) */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center flex-shrink-0">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Inkiito Engine: Core Support v2.1</p>
                    </div>
                </div>
            )}
        </div>
    );
}
