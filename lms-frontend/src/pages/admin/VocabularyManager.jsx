import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function VocabularyManager() {
    const { user: currentUser } = useContext(AuthContext);
    const [vocabularies, setVocabularies] = useState([]);
    const [stats, setStats] = useState({ count: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { showNotification, askConfirmation } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        word: '',
        definition: '',
        phonetic: '',
        category: 'General'
    });

    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const canManageHub = (user) => {
        if (!user) return false;
        if (['admin', 'developer', 'principal', 'deputy_principal', 'dos'].includes(user.role)) return true;

        // Teachers who teach English
        const subjects = user.taught_subjects || user.taughtSubjects || [];
        return subjects.some(s => {
            const name = (s.name || s).toLowerCase();
            return name.includes('english');
        });
    };

    useEffect(() => {
        fetchVocabularies(currentPage);
    }, [currentPage]);

    const fetchVocabularies = async (page = 1) => {
        setIsLoading(true);
        try {
            const res = await api.get(`admin/vocabularies?page=${page}`);
            setVocabularies(res.data.vocabularies);
            setStats({ count: res.data.count });
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Failed to fetch vocabularies", err);
        } finally {
            setIsLoading(false);
        }
    };



    const handleAddWord = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('admin/vocabularies', formData);
            setFormData({ word: '', definition: '', phonetic: '', category: 'General' });
            setShowModal(false);
            fetchVocabularies(currentPage);
            showNotification("Word added to the bank.", "success");
        } catch (err) {
            showNotification(err.response?.data?.message || "Failed to add word", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAiReplenish = async () => {
        setIsGenerating(true);
        try {
            const res = await api.post('admin/ai-replenish', { count: 8 });
            showNotification(res.data.message, "success");
            fetchVocabularies(1);
        } catch (err) {
            showNotification(err.response?.data?.message || "AI Replenishment failed", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await askConfirmation("Are you sure you want to remove this word from the bank?", "Remove word?");
        if (!confirmed) return;
        try {
            await api.delete(`admin/vocabularies/${id}`);
            fetchVocabularies(currentPage);
            showNotification("Word removed.", "success");
        } catch (err) {
            showNotification("Failed to delete word", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vocabulary Bank</h1>
                    <p className="text-gray-500">Manage the words stored in your permanent library.</p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-100 flex-1 sm:flex-none text-center">
                        {stats.count} Words in Bank
                    </div>
                    {canManageHub(currentUser) && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={handleAiReplenish}
                                isLoading={isGenerating}
                                className="flex-1 sm:flex-none whitespace-nowrap border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                AI Generate
                            </Button>
                            <Button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none whitespace-nowrap">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Add Manually
                            </Button>
                        </div>
                    )}
                </div>
            </div>


            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading vocabulary bank...</p>
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase ">Word</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase ">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase ">Definition</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase ">Phonetic</th>
                                    {canManageHub(currentUser) && (
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase  text-right">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vocabularies.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 font-bold">{v.word}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium uppercase ">
                                                {v.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">{v.definition}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">{v.phonetic || '-'}</td>
                                        {canManageHub(currentUser) && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(v.id)}
                                                    className="text-red-400 hover:text-red-600 p-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {vocabularies.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No words in the bank yet. Click 'Add Word Manually' to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination && pagination.last_page > 1 && (
                        <div className="bg-gray-50 border-t p-4 flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                Showing page {pagination.current_page} of {pagination.last_page}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    disabled={pagination.current_page === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    disabled={pagination.current_page === pagination.last_page}
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm max-w-lg w-full overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-5 py-6 bg-gray-50 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add to Vocabulary Bank</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddWord} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Word</label>
                                    <input
                                        type="text" required value={formData.word}
                                        onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                        placeholder="e.g. Ubiquitous"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        <option>General</option>
                                        <option>Science</option>
                                        <option>Technology</option>
                                        <option>Literature</option>
                                        <option>Philosophy</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phonetic Transcription</label>
                                <input
                                    type="text" value={formData.phonetic}
                                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="e.g. /juːˈbɪkwɪtəs/"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Definition</label>
                                <textarea
                                    required rows="3" value={formData.definition}
                                    onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="Brief explanation..."
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button className="flex-1" type="submit" isLoading={isSubmitting}>Save to Bank</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
