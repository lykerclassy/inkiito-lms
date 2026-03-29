import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useContext } from 'react';

export default function ResourceManager() {
    const [resources, setResources] = useState([]);
    const [subjectTitles, setSubjectTitles] = useState([]);
    const [academicLevels, setAcademicLevels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
    const { showNotification, askConfirmation } = useNotification();
    const { user: currentUser } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null,
        external_url: '',
        file_type: 'pdf',
        category: 'notes',
        subject_title_id: '',
        academic_level_id: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [resRes, titlesRes, levelsRes] = await Promise.all([
                api.get('admin/downloadables'),
                api.get('subjects/titles'),
                api.get('academic-levels')
            ]);

            setResources(resRes.data.resources || []);
            setSubjectTitles(titlesRes.data || []);
            setAcademicLevels(levelsRes.data || []);

            // Initial selection
            if (titlesRes.data?.length > 0) {
                const defaultTitle = currentUser?.taught_subjects?.[0]?.subject_title_id || titlesRes.data[0].id;
                setFormData(prev => ({ ...prev, subject_title_id: defaultTitle }));
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
        uploadData.append('subject_title_id', formData.subject_title_id);
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
                headers: { 'Content-Type': 'multipart/form-data' }
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
            showNotification("Successfully added to the library.", "success");
        } catch (err) {
            showNotification(err.response?.data?.message || "Failed to publish resource.", "error");
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

    if (isLoading) return <PageLoader />;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 italic uppercase">Resource Library</h1>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Manage & Publish Learning Resources</p>
                </div>
                <Button 
                    onClick={() => setShowModal(true)}
                    className="bg-school-primary hover:bg-school-primary-dark text-white rounded-2xl px-8 py-4 shadow-lg shadow-school-primary/20 transform active:scale-95 transition-all font-black uppercase text-xs tracking-widest italic"
                >
                    Publish Resource
                </Button>
            </div>

            <Card className="rounded-[40px] shadow-sm border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Resource Name</th>
                                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Class Level</th>
                                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400">Subject</th>
                                <th className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-gray-400 text-center">Action</th>
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
                                        {r.subject_title?.name || 'General'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <a
                                                href={getMediaUrl(r.file_url)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-school-primary hover:bg-school-primary/5 rounded-xl transition-all"
                                                title="View/Download"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {resources.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <div className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">Library is empty</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* PUBLISH MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="px-8 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase italic">Publish Resource</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Add material to the digital library</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-3 bg-white text-gray-400 hover:text-gray-900 rounded-2xl shadow-sm transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddResource} className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full max-w-xs mx-auto mb-8">
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
                                        <option value="reference">Reference Material</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Class Level (Optional)</label>
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
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Subject Title</label>
                                    <select
                                        value={formData.subject_title_id}
                                        onChange={(e) => setFormData({ ...formData, subject_title_id: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-black italic uppercase text-[10px]"
                                        required
                                    >
                                        <option value="">Select Subject Title...</option>
                                        {subjectTitles.filter(t => {
                                            if (!currentUser) return false;
                                            if (['admin', 'developer', 'principal', 'dos'].includes(currentUser.role)) return true;
                                            return currentUser.taught_subjects?.some(ts => ts.subject_title_id == t.id);
                                        }).map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
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
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-school-primary hover:bg-school-primary/5 transition-all group"
                                            >
                                                <div className="flex flex-col items-center justify-center py-5">
                                                    <svg className="w-8 h-8 text-gray-300 group-hover:text-school-primary transition-colors mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-school-primary-dark">
                                                        {formData.file ? formData.file.name : "Choose File to Upload"}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    ) : (
                                        <input
                                            type="url"
                                            value={formData.external_url}
                                            onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                            placeholder="https://example.com/resource"
                                            className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-school-primary transition-all font-bold italic text-xs text-blue-600 underline"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-school-primary hover:bg-school-primary-dark text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest italic shadow-lg shadow-school-primary/20 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Uploading Resource..." : "Publish Resource"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
