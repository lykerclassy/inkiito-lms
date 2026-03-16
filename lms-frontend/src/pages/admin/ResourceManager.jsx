import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNotification } from '../../contexts/NotificationContext';

export default function ResourceManager() {
    const [resources, setResources] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [academicLevels, setAcademicLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const { showNotification, askConfirmation } = useNotification();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null,
        external_url: '',
        file_type: 'pdf',
        category: 'notes',
        subject_id: '',
        academic_level_id: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // We use the existing endpoints to build the hierarchy
            const [resRes, subRes, curriculumRes] = await Promise.all([
                api.get('admin/downloadables'),
                api.get('subjects'),
                api.get('science-labs/curriculums') // This endpoint returns all curriculums in ScienceLabController
            ]);

            setResources(resRes.data.resources || []);

            // 1. Process Subjects (they already come with academicLevel)
            const allSubjects = subRes.data.subjects || subRes.data || [];
            setSubjects(allSubjects);

            // 2. Fetch Academic Levels correctly
            // If the curriculums endpoint works, we use it. If not, we extract from subjects.
            let levels = [];
            if (curriculumRes.data && Array.isArray(curriculumRes.data)) {
                // Since our science-labs/curriculums returns basic curriculum objects, 
                // we might need to fetch subjects' academic levels instead if levels aren't nested.
                // However, our Subject model has academicLevel relationship.
                const uniqueLevelIds = new Set();
                allSubjects.forEach(s => {
                    if (s.academic_level && !uniqueLevelIds.has(s.academic_level.id)) {
                        uniqueLevelIds.add(s.academic_level.id);
                        levels.push(s.academic_level);
                    }
                });
            }

            setAcademicLevels(levels.sort((a, b) => a.name.localeCompare(b.name)));

            // Initial selection
            if (allSubjects.length > 0) {
                setFormData(prev => ({ ...prev, subject_id: allSubjects[0].id }));
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase();
            let type = 'pdf';
            if (['doc', 'docx'].includes(ext)) type = 'word';
            if (['ppt', 'pptx'].includes(ext)) type = 'ppt';

            setFormData({
                ...formData,
                file: file,
                file_type: type
            });
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();

        if (uploadMode === 'file' && !formData.file) {
            showNotification("Please select a file to upload!", "warning");
            return;
        }

        if (uploadMode === 'url' && !formData.external_url) {
            showNotification("Please provide a valid URL!", "warning");
            return;
        }

        setIsSubmitting(true);

        const uploadData = new FormData();
        uploadData.append('title', formData.title);
        uploadData.append('description', formData.description || '');
        uploadData.append('file_type', formData.file_type);
        uploadData.append('category', formData.category);
        uploadData.append('subject_id', formData.subject_id);
        if (formData.academic_level_id) {
            uploadData.append('academic_level_id', formData.academic_level_id);
        }

        if (uploadMode === 'file') {
            uploadData.append('file', formData.file);
        } else {
            uploadData.append('external_url', formData.external_url);
        }

        try {
            await api.post('admin/downloadables', uploadData, {
                headers: { 'Content-Type': undefined }
            });

            setFormData({
                ...formData,
                title: '',
                description: '',
                file: null,
                external_url: ''
            });
            setShowModal(false);
            fetchInitialData();
            showNotification("Successfully added to the library library.", "success");
        } catch (err) {
            showNotification(err.response?.data?.message || "Sync to our local server failed.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("This will permanently remove this document from the library and cannot be undone.", "Delete Resource?");
        if (!confirmed) return;

        try {
            await api.delete(`admin/downloadables/${id}`);
            fetchInitialData();
            showNotification("Resource deleted successfully.", "success");
        } catch (err) {
            showNotification("Failed to delete resource", "error");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Resource Library</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] mt-1 tracking-wider opacity-70">Manage study materials and school archives</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 shadow-lg shadow-red-100 uppercase text-[10px] font-black tracking-widest py-4 px-6 bg-school-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    Add Resource
                </Button>
            </div>

            {/* Main Table Content */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <svg className="animate-spin h-10 w-10 text-school-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Loading Resources...</p>
                </div>
            ) : (
                <Card className="overflow-hidden no-padding border-none shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Document</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Download</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {resources.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-gray-900 group-hover:text-school-primary transition-colors italic uppercase text-xs tracking-tight">{r.title}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{r.category?.replace(/_/g, ' ')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-school-secondary rounded-lg text-[10px] font-bold border border-indigo-100 uppercase italic">
                                                {r.academic_level?.name || 'All Levels'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                            {r.subject?.name || 'General'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <a
                                                href={getMediaUrl(r.file_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                download={r.title}
                                                className="text-school-secondary hover:text-indigo-700 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                            >
                                                Download
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {resources.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-400 font-black italic tracking-widest uppercase text-[10px] opacity-30">
                                            Library is empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Responsive Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 md:p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-sm w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 relative min-h-screen md:min-h-0 flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 md:px-5 py-6 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-school-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </div>
                                <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Add New Resource</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all p-2 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleAddResource} className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)] md:max-h-[80vh] p-6 md:p-4 space-y-6">

                            {/* Upload Choice */}
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('file')}
                                    className={`flex-1 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${uploadMode === 'file' ? 'bg-white text-school-primary shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('url')}
                                    className={`flex-1 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${uploadMode === 'url' ? 'bg-white text-school-primary shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Link URL
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Document Title</label>
                                    <input
                                        type="text" required value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black italic uppercase text-xs"
                                        placeholder="e.g. Physics Formula Sheet"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black italic uppercase text-[10px]"
                                    >
                                        <option value="notes">Lesson Notes</option>
                                        <option value="internal_exam">Internal Paper</option>
                                        <option value="national_exam">National Exam</option>
                                        <option value="assignment">Assignment</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Class/Grade</label>
                                    <select
                                        value={formData.academic_level_id}
                                        onChange={(e) => setFormData({ ...formData, academic_level_id: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black italic uppercase text-[10px]"
                                    >
                                        <option value="">All Form/Grade</option>
                                        {academicLevels.map(level => (
                                            <option key={level.id} value={level.id}>{level.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Subject</label>
                                    <select
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black italic uppercase text-[10px]"
                                        required
                                    >
                                        <option value="">Select Subject...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.academic_level?.name || 'General'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        {uploadMode === 'file' ? 'Select File' : 'Resource Website URL'}
                                    </label>
                                    {uploadMode === 'file' ? (
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                required={uploadMode === 'file'}
                                                onChange={handleFileChange}
                                                className="w-full px-5 py-8 border-2 border-dashed border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black uppercase text-[10px] text-gray-400 bg-gray-50/30"
                                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type="url" required={uploadMode === 'url'}
                                            value={formData.external_url}
                                            onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                            className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black italic text-xs"
                                            placeholder="https://example.com/notes.pdf"
                                        />
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1">Brief Summary</label>
                                    <textarea
                                        rows="2" value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold"
                                        placeholder="Optional context for students..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Sticky Modal Footer */}
                            <div className="pt-6 border-t flex flex-col md:flex-row gap-4 sticky bottom-0 bg-white md:relative pb-4 md:pb-0">
                                <Button className="flex-1 py-4 text-[10px] font-black shadow-lg shadow-red-100 uppercase tracking-widest bg-school-primary" type="submit" isLoading={isSubmitting}>
                                    Save Resource
                                </Button>
                                <Button variant="outline" className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-2 border-gray-200" onClick={() => setShowModal(false)} type="button">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
