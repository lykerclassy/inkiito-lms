import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function Downloadables() {
    const [resources, setResources] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedSubject, setSelectedSubject] = useState('all');

    const categories = [
        { id: 'all', label: 'All Resources', icon: '📁' },
        { id: 'notes', label: 'Lesson Notes', icon: '📝' },
        { id: 'internal_exam', label: 'Internal Papers', icon: '🏫' },
        { id: 'national_exam', label: 'National Exams', icon: '🇰🇪' },
        { id: 'assignment', label: 'Hard Assignments', icon: '🖇️' }
    ];

    useEffect(() => {
        fetchResources();
    }, [activeCategory, selectedSubject]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const params = {
                category: activeCategory,
                subject_id: selectedSubject,
                search: search
            };
            const res = await api.get('downloadables', { params });
            setResources(res.data.resources);
            setSubjects(res.data.subjects);
        } catch (err) {
            console.error("Failed to fetch downloadables", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchResources();
    };

    /**
     * LOCAL NODE DOWNLOAD HANDLER
     * Dynamically handles both local server files and external URLs.
     */
    const handleDownload = (fileUrl, title, id) => {
        setDownloadingId(id);

        try {
            // For local server files, 'file_url' is already processed by the backend 
            // to include the correct domain (localhost or production domain)
            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = getMediaUrl(fileUrl);
            downloadAnchor.setAttribute('download', title || 'document');
            downloadAnchor.setAttribute('target', '_blank'); // Open in new tab for external, usually forces download for local PDFs

            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            document.body.removeChild(downloadAnchor);

        } catch (err) {
            console.error("Download sync failed", err);
            window.location.href = getMediaUrl(fileUrl); // Ultimate fallback
        } finally {
            setTimeout(() => setDownloadingId(null), 1500);
        }
    };

    const getFileTypeIcon = (type) => {
        const typeStr = (type || '').toLowerCase();
        switch (typeStr) {
            case 'pdf': return (
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold">PDF</span>
                </div>
            );
            case 'word':
            case 'doc':
            case 'docx': return (
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold">DOC</span>
                </div>
            );
            case 'ppt':
            case 'pptx': return (
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold">PPT</span>
                </div>
            );
            default: return (
                <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold">FILE</span>
                </div>
            );
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-24">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-xl shadow-sm shadow-gray-100 border border-gray-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-school-primary rounded-xl flex items-center justify-center text-white shadow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Resource Library</h1>
                        <p className="text-gray-500 font-medium mt-1">Download documents, notes, and past papers for your subjects.</p>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <div className="flex bg-gray-100 p-2 rounded-xl overflow-x-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center gap-3 whitespace-nowrap ${activeCategory === cat.id ? 'bg-white text-school-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <span className="text-lg">{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full h-full px-6 py-4 bg-white border-2 border-transparent focus:border-school-primary rounded-lg font-bold text-sm shadow-sm outline-none transition-all text-gray-700"
                    >
                        <option value="all">Every Subject</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Search by title, subject or category..."
                    className="w-full pl-14 pr-8 py-5 bg-white border-2 border-transparent focus:border-school-primary rounded-xl font-medium text-gray-700 shadow-sm outline-none transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-school-primary transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <button type="submit" className="hidden">Search</button>
            </form>

            {/* Content Results */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh]">
                    <svg className="animate-spin h-10 w-10 text-school-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p className="text-gray-500 font-medium text-sm">Loading resources...</p>
                </div>
            ) : resources.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Resources Found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your category or subject filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map(file => (
                        <Card key={file.id} className="group hover:-translate-y-1 transition-transform duration-300 border-none shadow-sm hover:shadow-md overflow-hidden relative">
                            {/* Category Badge Offset */}
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-gray-50 text-gray-500 font-black text-[8px] px-3 py-1 rounded-full border border-gray-100">
                                    {file.category?.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="p-4 space-y-6 text-emerald-900">
                                <div className="flex items-center gap-4">
                                    {getFileTypeIcon(file.file_type)}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-school-primary transition-colors truncate">{file.title}</h3>
                                        <p className="text-xs font-semibold text-school-primary mt-1">{file.subject?.name}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                    {file.description || "A downloadable learning resource for this subject."}
                                </p>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-[10px] font-bold uppercase">{new Date(file.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(file.file_url, file.title, file.id)}
                                        disabled={downloadingId === file.id}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${downloadingId === file.id
                                            ? 'bg-gray-400 cursor-not-allowed text-white'
                                            : 'bg-school-primary hover:bg-red-700 text-white shadow-school-primary/30'
                                            }`}
                                    >
                                        {downloadingId === file.id ? 'Downloading...' : (
                                            <>
                                                Download
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Support / Help Banner */}
            <div className="bg-school-primary rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-sm overflow-hidden relative mt-8">
                <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none rotate-12">
                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                </div>
                <div className="space-y-2 relative z-10">
                    <h3 className="text-lg font-bold">Can't find a specific document?</h3>
                    <p className="text-white/80 font-medium">Ask your teachers to upload the materials you need for your subjects.</p>
                </div>
            </div>
        </div>
    );
}
