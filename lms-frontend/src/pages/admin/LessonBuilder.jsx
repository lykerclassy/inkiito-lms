import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Required for Quill formula support
window.katex = katex;

// Table support is handled natively by Quill 2.x if available in modules
// We'll use a defensive check to prevent crashing if the module isn't present

// Custom Styles to fix missing icons and hidden dialogs in Quill with Tailwind 4
const QUILL_FIX_CSS = `
  .ql-toolbar .ql-formula { width: 34px !important; margin-right: 4px !important; border: 1px solid #ddd !important; border-radius: 4px !important; background: #f8f9fa !important; }
  .ql-toolbar .ql-table { width: 34px !important; margin-right: 4px !important; border: 1px solid #ddd !important; border-radius: 4px !important; background: #f8f9fa !important; }
  .ql-toolbar .ql-formula::after { content: 'fx' !important; font-weight: 900; font-family: 'Inter', sans-serif; color: #4b4da3; display: flex; align-items: center; justify-content: center; height: 100%; }
  .ql-toolbar .ql-table::after { content: '田' !important; font-weight: 900; font-size: 16px; color: #4b4da3; display: flex; align-items: center; justify-content: center; height: 100%; }
  .ql-snow .ql-tooltip { 
    z-index: 9999 !important; 
    background: white !important; 
    border: 2px solid #4b4da3 !important; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important; 
    padding: 12px !important; 
    border-radius: 12px !important;
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
  .ql-snow .ql-tooltip.ql-editing input[type=text] { 
    border: 1px solid #ddd !important; 
    padding: 8px 12px !important; 
    border-radius: 6px !important; 
    width: 250px !important;
    font-size: 14px !important;
  }
  .ql-toolbar button:hover { background: #eee !important; }
`;

export default function LessonBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Silence the findDOMNode warning in development to keep the teacher's console clean
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('findDOMNode')) return;
            originalError.apply(console, args);
        };
        return () => { console.error = originalError; };
    }, []);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const response = await api.get(`lessons/${id}`);
                setLesson(response.data);

                const parsedBlocks = response.data.blocks.map(b => {
                    let content = {};
                    try {
                        content = typeof b.content === 'string' ? JSON.parse(b.content) : b.content;
                    } catch (e) {
                        console.error("Failed to parse block content", b.content);
                    }
                    return {
                        ...b,
                        content: content || {}
                    };
                });
                setBlocks(parsedBlocks);
            } catch (err) {
                console.error("Failed to fetch lesson details", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();

        // Load KaTeX mhchem for chemical equations in the builder
        if (!document.getElementById('katex-mhchem-script')) {
            const script = document.createElement('script');
            script.id = 'katex-mhchem-script';
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, [id]);

    const updateBlockContent = (index, newContent) => {
        const updatedBlocks = [...blocks];
        updatedBlocks[index].content = newContent;
        setBlocks(updatedBlocks);
    };

    const addNewBlock = (type) => {
        let defaultContent = {};

        if (type === 'text') defaultContent = { html: '' };
        if (type === 'image') defaultContent = { url: '', caption: '' };
        if (type === 'youtube') defaultContent = { url: '' };
        if (type === 'tiktok') defaultContent = { url: '' };
        if (type === 'video') defaultContent = { url: '', caption: '' };
        if (type === 'note') defaultContent = { html: 'Enter note here...' };
        if (type === 'takeaway') defaultContent = { html: 'Enter key takeaway here...' };
        if (type === 'quiz') defaultContent = { question: '', options: ['', '', '', ''], correct_answer: '' };
        if (type === 'table') defaultContent = { 
            rows: [['Header 1', 'Header 2']], 
            config: { hasHeader: true, striped: true } 
        };
        if (type === 'code_editor') defaultContent = {
            language: 'html',
            instructions: 'Write your code here:',
            initial_code: '<h1>Hello World</h1>'
        };

        const newBlock = {
            id: `temp_${Date.now()}`,
            type: type,
            order: blocks.length + 1,
            content: defaultContent
        };

        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (index) => {
        const updatedBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(updatedBlocks);
    };

    // --- THE REAL SAVE FUNCTION ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post(`lessons/${id}/blocks`, { blocks });
            alert('Lesson blocks saved successfully!');

            // Optionally, refresh the page to get the true database IDs for any new blocks
            window.location.reload();
        } catch (error) {
            console.error("Failed to save blocks", error);
            alert("An error occurred while saving. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const quillModules = {
        toolbar: {
            container: [
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'align': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image', 'formula'],
                ['clean']
            ],
        }
    };
    // Standard Formatting for Quill
    const quillFormats = [
        'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent', 'link', 'image', 'color', 'background',
        'align', 'script', 'formula'
    ];
    
    // Inject the CSS Fix
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = QUILL_FIX_CSS;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const [showFormulaHelper, setShowFormulaHelper] = useState(false);

    const helpFormulas = [
        { label: 'Chemistry Equation', code: '\\ce{Na + HCl -> NaCl + H2}', note: 'Subscripts added automatically!' },
        { label: 'Quadratic Formula', code: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', note: 'Perfect for Math exams' },
        { label: 'Complex Fraction', code: '\\frac{numerator}{denominator}', note: 'Vertical style fraction' },
        { label: 'Square Root', code: '\\sqrt{x^2 + y^2}', note: 'Standard radical symbol' },
        { label: 'Logarithm', code: '\\log_b(x)', note: 'Base "b" of "x"' },
        { label: 'BODMAS (Large)', code: '[(2 + 3) \\times \\frac{10}{2}]^2', note: 'Large brackets auto-scale' },
        { label: 'Power/Index', code: 'x^{2n+1}', note: 'For complex exponents' }
    ];

    if (isLoading) return <PageLoader message="Initializing Academic Publisher..." color="blue" />;
    if (!lesson) return <div className="p-12 text-center text-red-500 font-bold">⚠️ Lesson not found.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">

            {/* SCIENTIFIC FORMULA ASSISTANT */}
            {showFormulaHelper && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-700 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="bg-indigo-500 p-1.5 rounded-lg text-sm">∑</span> 
                                    Scientific Formula Assistant
                                </h3>
                                <p className="text-indigo-100 text-xs mt-1">Copy any formula below and paste it into the [fx] box in the editor.</p>
                            </div>
                            <button 
                                onClick={() => setShowFormulaHelper(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                            {helpFormulas.map((f, i) => (
                                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-300 transition-all bg-gray-50 group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-gray-700">{f.label}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(f.code);
                                                alert('Formula copied! Now click [fx] and paste it.');
                                            }}
                                            className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all font-bold"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <code className="block bg-white border border-gray-200 rounded p-2 text-indigo-700 text-xs break-all mb-1 font-mono">
                                        {f.code}
                                    </code>
                                    <p className="text-[10px] text-gray-400 italic">{f.note}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold font-mono">!</div>
                            <p className="text-xs text-gray-600">
                                <strong>Teacher Tip:</strong> For Chemistry, use the <strong>\ce{"{ ... }"}</strong> code. 
                                For complex Math, use <strong>\frac</strong> for fractions. Everything renders instantly for students!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4 text-left">
                    <button
                        onClick={() => navigate('/admin/curriculum')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group flex items-center justify-center font-bold"
                    >
                        <span className="text-gray-400 group-hover:text-blue-600">&larr;</span>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Editing: {lesson.title}</h2>
                        <p className="text-xs text-indigo-600 font-semibold tracking-wider uppercase bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">Publisher Standard Editor</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setShowFormulaHelper(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <span>∑</span> Formula Helper
                    </button>
                    <button
                        onClick={() => navigate(`/student/lessons/${id}`)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                        👁️ Preview
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? '🚀 Publishing...' : '💾 Save Changes'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {blocks.map((block, index) => (
                    <Card key={block.id} className="relative group border-2 border-transparent hover:border-blue-100 transition-colors">

                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <span className="text-xs font-bold text-gray-400 uppercase  bg-gray-100 px-2 py-1 rounded">
                                {block.type.replace('_', ' ')}
                            </span>
                            <button onClick={() => removeBlock(index)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Delete Block">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        {block.type === 'text' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-bold text-gray-700">Content Editor (Word Style)</label>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Teacher's Tip: Use x₂ for H₂O and x² for Math
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-blue-500 transition-colors shadow-sm">
                                    <ReactQuill
                                        theme="snow"
                                        modules={quillModules}
                                        formats={quillFormats}
                                        value={block.content.html || ''}
                                        onChange={(content) => updateBlockContent(index, { ...block.content, html: content })}
                                        className="h-80 pb-14"
                                        placeholder="Write your lesson notes here... similar to Microsoft Word"
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    <div className="p-2 border border-dashed border-gray-200 rounded text-[10px] text-gray-500">
                                        <strong>Table:</strong> Click the table icon to insert rows/columns.
                                    </div>
                                    <div className="p-2 border border-dashed border-gray-200 rounded text-[10px] text-gray-500">
                                        <strong>Math:</strong> Click 𝑓(𝑥) for complex equations.
                                    </div>
                                    <div className="p-2 border border-dashed border-gray-200 rounded text-[10px] text-gray-500">
                                        <strong>Colors:</strong> Highlight text using the A icons.
                                    </div>
                                    <div className="p-2 border border-dashed border-gray-200 rounded text-[10px] text-gray-500">
                                        <strong>Chemistry:</strong> Use <strong>x₂</strong> for small numbers below.
                                    </div>
                                </div>
                            </div>
                        )}

                        {block.type === 'note' && (
                            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="block text-sm font-bold text-blue-900 uppercase tracking-wider">Note Content</label>
                                    <div className="bg-white rounded-lg overflow-hidden border border-blue-200">
                                        <ReactQuill
                                            theme="snow"
                                            modules={{ toolbar: [['bold', 'italic', 'link'], ['clean']] }}
                                            value={block.content.html || ''}
                                            onChange={(content) => updateBlockContent(index, { ...block.content, html: content })}
                                            className="h-32 pb-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {block.type === 'takeaway' && (
                            <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100 flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <label className="block text-sm font-bold text-amber-900 uppercase tracking-wider">Key Takeaway</label>
                                    <div className="bg-white rounded-lg overflow-hidden border border-amber-200">
                                        <ReactQuill
                                            theme="snow"
                                            modules={{ toolbar: [['bold', 'italic'], ['clean']] }}
                                            value={block.content.html || ''}
                                            onChange={(content) => updateBlockContent(index, { ...block.content, html: content })}
                                            className="h-32 pb-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {block.type === 'image' && (
                            <div className="space-y-4 mt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={block.content.url || ''}
                                            onChange={(e) => updateBlockContent(index, { ...block.content, url: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Or Upload from PC</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        updateBlockContent(index, { ...(block.content || {}), url: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {block.content?.url && (
                                    <div className="mt-4 p-2 border rounded-lg bg-gray-50 flex justify-center">
                                        <img src={getMediaUrl(block.content.url)} alt="Preview" className="max-h-40 rounded shadow-sm" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Caption (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={block.content.caption || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, caption: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {block.type === 'youtube' && (
                            <div className="space-y-4 mt-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube Video URL</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={block.content.url || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, url: e.target.value })}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                </div>
                            </div>
                        )}

                        {block.type === 'tiktok' && (
                            <div className="space-y-4 mt-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">TikTok Video URL</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={block.content.url || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, url: e.target.value })}
                                        placeholder="https://www.tiktok.com/@user/video/..."
                                    />
                                </div>
                                {block.content.url && block.content.url.includes('tiktok.com') && (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TikTok Embed Preview Active</p>
                                        <p className="text-xs text-blue-600 font-medium mt-1">Video will render fully in Student View</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {block.type === 'video' && (
                            <div className="space-y-4 mt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Video URL (Direct MP4/WebM)</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={block.content.url || ''}
                                            onChange={(e) => updateBlockContent(index, { ...block.content, url: e.target.value })}
                                            placeholder="https://example.com/video.mp4"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Or Upload Video</label>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    // Limit file size for Base64 (suggested max 50MB for this demo style)
                                                    if (file.size > 50 * 1024 * 1024) {
                                                        alert("Video file too large. Please use a URL for larger videos.");
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        updateBlockContent(index, { ...(block.content || {}), url: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {block.content?.url && (
                                    <div className="mt-4 p-2 border rounded-lg bg-gray-50 flex justify-center">
                                        <video src={getMediaUrl(block.content.url)} controls className="max-h-40 rounded shadow-sm" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Caption (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={block.content.caption || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, caption: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {block.type === 'quiz' && (
                            <div className="space-y-4 mt-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Question</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        value={block.content.question || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, question: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {block.content.options.map((opt, optIndex) => (
                                        <div key={optIndex}>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Option {optIndex + 1}</label>
                                            <input
                                                type="text"
                                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${block.content.correct_answer === opt && opt !== '' ? 'border-green-500 ring-green-200 bg-green-50' : 'border-gray-300 focus:ring-blue-500'}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOptions = [...block.content.options];
                                                    newOptions[optIndex] = e.target.value;
                                                    updateBlockContent(index, { ...block.content, options: newOptions });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer</label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={block.content.correct_answer || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, correct_answer: e.target.value })}
                                    >
                                        <option value="" disabled>Select correct option...</option>
                                        {block.content.options.map((opt, i) => opt && (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {block.type === 'table' && (
                            <div className="space-y-4 mt-8">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest text-indigo-600">📊 Scientific Data Table</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const newRows = [...block.content.rows];
                                                newRows.push(new Array(newRows[0].length).fill(''));
                                                updateBlockContent(index, { ...block.content, rows: newRows });
                                            }}
                                            className="text-xs bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all active:scale-95"
                                        >
                                            + Add Row
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const newRows = block.content.rows.map(row => [...row, '']);
                                                updateBlockContent(index, { ...block.content, rows: newRows });
                                            }}
                                            className="text-xs bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all active:scale-95"
                                        >
                                            + Add Column
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto border-2 border-gray-100 rounded-2xl shadow-inner bg-gray-50/50 p-6">
                                    <table className="min-w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm border-hidden">
                                        <tbody>
                                            {block.content.rows.map((row, rIndex) => (
                                                <tr key={rIndex}>
                                                    {row.map((cell, cIndex) => (
                                                        <td key={cIndex} className="border border-gray-100 p-0 min-w-[250px]">
                                                            <input 
                                                                type="text"
                                                                className={`w-full p-4 outline-none text-[15px] transition-all focus:bg-indigo-50/50 focus:ring-inset focus:ring-2 focus:ring-indigo-300 ${rIndex === 0 && block.content.config?.hasHeader ? 'font-bold bg-indigo-50/30 uppercase text-[11px] tracking-wider text-indigo-900 border-b border-indigo-100' : 'text-gray-700'}`}
                                                                value={cell}
                                                                onChange={(e) => {
                                                                    const newRows = [...block.content.rows];
                                                                    newRows[rIndex][cIndex] = e.target.value;
                                                                    updateBlockContent(index, { ...block.content, rows: newRows });
                                                                }}
                                                                placeholder={rIndex === 0 ? "Header..." : "Data..."}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="w-12 text-center bg-gray-50/30 border-l border-gray-100">
                                                        {block.content.rows.length > 1 && (
                                                            <button 
                                                                onClick={() => {
                                                                    const newRows = block.content.rows.filter((_, i) => i !== rIndex);
                                                                    updateBlockContent(index, { ...block.content, rows: newRows });
                                                                }}
                                                                className="text-red-300 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg active:scale-90"
                                                                title="Delete Row"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex gap-6 mt-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-600 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            checked={block.content.config?.hasHeader} 
                                            onChange={(e) => updateBlockContent(index, { ...block.content, config: { ...block.content.config, hasHeader: e.target.checked } })}
                                        />
                                        <span className="group-hover:text-indigo-600 transition-colors">FIRST ROW IS HEADER</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-600 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            checked={block.content.config?.striped} 
                                            onChange={(e) => updateBlockContent(index, { ...block.content, config: { ...block.content.config, striped: e.target.checked } })}
                                        />
                                        <span className="group-hover:text-indigo-600 transition-colors">STRIPED ROWS</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {block.type === 'code_editor' && (
                            <div className="space-y-4 mt-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Exercise Instructions</label>
                                    <textarea
                                        className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={block.content.instructions || ''}
                                        onChange={(e) => updateBlockContent(index, { ...block.content, instructions: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                                        <select
                                            className="w-full p-3 border border-gray-300 rounded-lg outline-none bg-white"
                                            value={block.content.language || 'html'}
                                            onChange={(e) => updateBlockContent(index, { ...block.content, language: e.target.value })}
                                        >
                                            <option value="html">HTML</option>
                                            <option value="css">CSS</option>
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                        </select>
                                    </div>
                                    <div className="w-2/3">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Starting Code</label>
                                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                                            <Editor
                                                height="200px"
                                                language={block.content.language || 'html'}
                                                theme="vs-dark"
                                                value={block.content.initial_code || ''}
                                                onChange={(value) => updateBlockContent(index, { ...block.content, initial_code: value })}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    scrollBeyondLastLine: false,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center mt-8">
                <h3 className="text-gray-600 font-medium mb-4">Add Content Block</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" onClick={() => addNewBlock('text')}>+ Text Paragraph</Button>
                    <Button variant="outline" onClick={() => addNewBlock('note')}>+ Resource Note</Button>
                    <Button variant="outline" onClick={() => addNewBlock('takeaway')}>+ Key Takeaway</Button>
                    <Button variant="outline" onClick={() => addNewBlock('image')}>+ Image</Button>
                    <Button variant="outline" onClick={() => addNewBlock('youtube')}>+ YouTube</Button>
                    <Button variant="outline" onClick={() => addNewBlock('tiktok')}>+ TikTok</Button>
                    <Button variant="outline" onClick={() => addNewBlock('video')}>+ Local/URL Video</Button>
                    <Button variant="outline" onClick={() => addNewBlock('quiz')}>+ Multiple Choice Quiz</Button>
                    <Button variant="outline" onClick={() => addNewBlock('table')}>+ Data Table</Button>
                    <Button variant="primary" onClick={() => addNewBlock('code_editor')}>
                        + Interactive Code Exercise
                    </Button>
                </div>
            </div>

        </div>
    );
}