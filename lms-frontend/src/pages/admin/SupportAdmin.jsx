import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';

const PRIORITY_MAP = {
    low:      { label: 'Low',      cls: 'bg-gray-100 text-gray-600' },
    medium:   { label: 'Medium',   cls: 'bg-blue-100 text-blue-700' },
    high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700' },
    critical: { label: 'CRITICAL', cls: 'bg-red-100 text-red-700 animate-pulse' },
};

const STATUS_MAP = {
    open:        { label: 'Open',        cls: 'bg-red-100 text-red-600' },
    in_progress: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-700' },
    on_hold:     { label: 'On Hold',     cls: 'bg-gray-100 text-gray-600' },
    resolved:    { label: 'Resolved',    cls: 'bg-green-100 text-green-700' },
    closed:      { label: 'Closed',      cls: 'bg-gray-200 text-gray-500' },
};

export default function SupportAdmin() {
    const { user } = useContext(AuthContext);
    const { showNotification } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [response, setResponse] = useState('');
    const [newStatus, setNewStatus] = useState('resolved');
    const [statusFilter, setStatusFilter] = useState('open');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const prevTicketCountRef = useRef(0);
    const pollingRef = useRef(null);

    useEffect(() => {
        fetchTickets(true);
        // Poll every 30 seconds for new tickets
        pollingRef.current = setInterval(() => fetchTickets(false), 30000);
        return () => clearInterval(pollingRef.current);
    }, []);

    const fetchTickets = async (showLoader = false) => {
        if (showLoader) setIsLoading(true);
        try {
            const res = await api.get('tickets');
            const incoming = res.data;

            // Notify developer of NEW tickets since last poll
            const openCount = incoming.filter(t => t.status === 'open').length;
            if (!showLoader && openCount > prevTicketCountRef.current) {
                const diff = openCount - prevTicketCountRef.current;
                showNotification(`📬 ${diff} new support ticket${diff > 1 ? 's' : ''} arrived!`, 'info');
            }
            prevTicketCountRef.current = openCount;

            setTickets(incoming);
            // Refresh selected ticket data if it's open
            if (selectedTicket) {
                const refreshed = incoming.find(t => t.id === selectedTicket.id);
                if (refreshed) setSelectedTicket(refreshed);
            }
        } catch (err) {
            console.error("Ticket fetch failed");
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`tickets/${selectedTicket.id}`, {
                developer_response: response,
                status: newStatus,
            });
            showNotification(`Ticket marked as "${newStatus}" — user has been notified!`, 'success');
            setSelectedTicket(null);
            setResponse('');
            fetchTickets(false);
        } catch (err) {
            showNotification('Failed to update ticket.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickStatus = async (ticket, status) => {
        try {
            await api.put(`tickets/${ticket.id}`, { status });
            showNotification(`Ticket status set to "${status}".`, 'success');
            fetchTickets(false);
            if (selectedTicket?.id === ticket.id) setSelectedTicket(null);
        } catch {
            showNotification('Failed to update status.', 'error');
        }
    };

    const openCount   = tickets.filter(t => t.status === 'open').length;
    const urgentCount = tickets.filter(t => t.priority === 'critical' && t.status === 'open').length;

    const filteredTickets = tickets.filter(t =>
        statusFilter === 'all' ? true : t.status === statusFilter
    );

    if (isLoading) return <PageLoader message="Scanning Campus Channels..." />;

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                        Support <span className="text-school-primary">Command Centre</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Campus inquiries · Developer ticket management · Live polling every 30s
                    </p>
                </div>

                {/* KPI Chips */}
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-2xl">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-black text-red-700 uppercase tracking-widest">{openCount} Open</span>
                    </div>
                    {urgentCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-300 rounded-2xl animate-pulse">
                            <span className="text-xs font-black text-orange-700 uppercase tracking-widest">⚠ {urgentCount} Critical</span>
                        </div>
                    )}
                    <button
                        onClick={() => fetchTickets(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </header>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
                {['all', 'open', 'in_progress', 'on_hold', 'resolved', 'closed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
                            statusFilter === f
                                ? 'bg-school-primary text-white border-school-primary shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-school-primary/40'
                        }`}
                    >
                        {f.replace('_', ' ')}
                        {f !== 'all' && (
                            <span className="ml-2 opacity-70">
                                ({tickets.filter(t => t.status === f).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Tickets List */}
                <div className="lg:col-span-2 space-y-4">
                    {filteredTickets.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-20 text-center opacity-30 grayscale">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-xl font-black uppercase italic tracking-widest">Clear Signal</p>
                            <p className="text-sm font-medium">No tickets in this category.</p>
                        </Card>
                    ) : (
                        filteredTickets.map(ticket => (
                            <Card
                                key={ticket.id}
                                onClick={() => { setSelectedTicket(ticket); setResponse(ticket.developer_response || ''); setNewStatus('resolved'); }}
                                className={`cursor-pointer transition-all group hover:shadow-md hover:border-school-primary/30 ${selectedTicket?.id === ticket.id ? 'border-school-primary/60 shadow-lg shadow-red-500/5' : ''}`}
                            >
                                {/* Row 1: User + Status */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-school-primary/20 to-indigo-100 flex items-center justify-center font-black text-sm text-school-primary border border-school-primary/10">
                                            {ticket.user?.name ? ticket.user.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm uppercase tracking-tight leading-none">{ticket.user?.name || 'Anonymous'}</h4>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{ticket.user?.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${STATUS_MAP[ticket.status]?.cls}`}>
                                            {STATUS_MAP[ticket.status]?.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${PRIORITY_MAP[ticket.priority]?.cls}`}>
                                            {PRIORITY_MAP[ticket.priority]?.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 2: Subject + Message */}
                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest italic mb-1">{ticket.subject}</p>
                                <p className="text-sm text-gray-600 font-medium line-clamp-2">{ticket.message}</p>

                                {/* Row 3: Footer */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                        {new Date(ticket.created_at).toLocaleString()}
                                    </span>
                                    {/* Quick Actions */}
                                    {ticket.status === 'open' && (
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleQuickStatus(ticket, 'in_progress')}
                                                className="px-2 py-1 text-[8px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all"
                                            >
                                                In Progress
                                            </button>
                                            <button
                                                onClick={() => handleQuickStatus(ticket, 'on_hold')}
                                                className="px-2 py-1 text-[8px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                                            >
                                                Hold
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Response Panel */}
                <div className="lg:col-span-1">
                    {selectedTicket ? (
                        <Card className="sticky top-24 border-school-primary shadow-xl shadow-red-500/10 animate-in slide-in-from-right-5 fade-in duration-300 space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-school-primary italic">Resolution Workbench</p>
                                    <h3 className="text-lg font-black italic uppercase tracking-tighter leading-none mt-0.5">{selectedTicket.user?.name}</h3>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-800 transition-colors p-1">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Original Problem */}
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[8px] font-black text-school-primary uppercase tracking-widest mb-2 italic">Subject: {selectedTicket.subject}</p>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed italic">"{selectedTicket.message}"</p>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                {/* Status Control */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Set Ticket Status</label>
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-school-primary outline-none text-[10px] font-black uppercase tracking-widest text-gray-700"
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value)}
                                    >
                                        <option value="in_progress">In Progress</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                {/* Response Text */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Developer Response <span className="text-school-primary">*</span></label>
                                    <textarea
                                        required
                                        rows="6"
                                        placeholder="Write a clear, helpful response for the user..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-school-primary outline-none text-sm font-medium leading-relaxed"
                                        value={response}
                                        onChange={e => setResponse(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full py-3 rounded-2xl font-black uppercase tracking-widest text-xs"
                                    isLoading={isSubmitting}
                                >
                                    {isSubmitting ? 'Transmitting...' : `Send Response & Mark as ${newStatus}`}
                                </Button>
                            </form>

                            {/* Prior developer response if any */}
                            {selectedTicket.developer_response && (
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl"></div>
                                    <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-2 italic">Previous Response on Record:</p>
                                    <p className="text-xs text-gray-700 font-medium italic leading-relaxed">{selectedTicket.developer_response}</p>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <div className="sticky top-24 p-12 border-2 border-dashed border-gray-200 rounded-[2rem] text-center flex flex-col items-center opacity-40 space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest">Click a ticket to open<br/>the response workbench</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
