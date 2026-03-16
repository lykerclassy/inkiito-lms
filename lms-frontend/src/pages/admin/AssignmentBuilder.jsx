import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';
import MathText from '../../components/common/MathText';
import MathAssistant from '../../components/common/MathAssistant';

const MathPreview = ({ text }) => {
    if (!text || !(/(\$|\\\[|\\\(|\\\$)/.test(text))) return null;
    return (
        <div className="mt-2 p-3 bg-blue-50/40 rounded-xl border border-blue-100/30 animate-in fade-in zoom-in-95 duration-300 relative group">
            <span className="text-[9px] font-black uppercase text-blue-400 tracking-[0.2em] block mb-1.5 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 7L5 12l4 5m6-10l4 5-4 5m-2-14l-2 18" /></svg>
                Math Preview
            </span>
            <div className="text-xs font-bold text-gray-800 leading-relaxed overflow-x-auto">
                <MathText text={text} />
            </div>
        </div>
    );
};

export default function AssignmentBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [activeId, setActiveId] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [assistantConfig, setAssistantConfig] = useState(null); // { id, field, idx }

    const insertMath = (latex) => {
        if (!assistantConfig) return;
        const { id, field, idx } = assistantConfig;

        setBlocks(prev => prev.map(b => {
            if (b.id !== id) return b;

            // Format math: only wrap in $ if it's actually math content
            const formatted = (latex.includes('\\') || latex.includes('^') || latex.includes('_')) ? `$${latex}$` : latex;

            if (field === 'option' && idx !== null) {
                const newOptions = [...(b.options || [])];
                newOptions[idx] = (newOptions[idx] || '').trim() + ' ' + formatted;
                return { ...b, options: newOptions };
            }

            const currentVal = b[field] || '';
            const newVal = currentVal.trim() + ' ' + formatted;
            return { ...b, [field]: newVal.trim() };
        }));
        setAssistantConfig(null);
    };

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const response = await api.get('assignments');
                const currentData = response.data.find(a => a.id === parseInt(id));
                if (!currentData) throw new Error("Assignment not found");

                setAssignment(currentData);

                try {
                    const normalizedContent = typeof currentData.content === 'string' ? JSON.parse(currentData.content) : currentData.content;
                    const parsedBlocks = normalizedContent || [];

                    if (parsedBlocks.length === 0) {
                        const initialBlock = createNewBlock('multiple_choice');
                        setBlocks([initialBlock]);
                        setActiveId(initialBlock.id);
                    } else {
                        // NORMALIZER: Upgrade legacy blocks and ensure correctAnswer exists
                        const normalizedBlocks = parsedBlocks.map(b => ({
                            id: b.id || generateId(),
                            type: normalizeLegacyType(b.type),
                            title: b.title || b.question || '',
                            description: b.description || b.value || '',
                            options: Array.isArray(b.options) ? b.options : (normalizeLegacyType(b.type).includes('choice') ? ['Option 1'] : []),
                            required: !!b.required,
                            points: b.points || 1,
                            url: b.url || '',
                            image_url: b.image_url || '',
                            explanation: b.explanation || '',
                            // Ensure correctAnswer is an array for checkboxes, string for others
                            correctAnswer: b.correctAnswer !== undefined ? b.correctAnswer : (normalizeLegacyType(b.type) === 'checkboxes' ? [] : '')
                        }));

                        setBlocks(normalizedBlocks);
                        setActiveId(normalizedBlocks[0].id);
                    }
                } catch (e) {
                    const initialBlock = createNewBlock('multiple_choice');
                    setBlocks([initialBlock]);
                    setActiveId(initialBlock.id);
                }
            } catch (err) {
                setError("Failed to load assignment details.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssignment();
    }, [id]);

    const normalizeLegacyType = (oldType) => {
        if (!oldType) return 'text_info';
        if (oldType === 'text') return 'text_info';
        if (oldType === 'image') return 'image_info';
        if (oldType === 'video') return 'video_info';
        if (oldType === 'question_short') return 'short_answer';
        if (oldType === 'question_long') return 'paragraph';
        if (oldType === 'question_file') return 'file_upload';
        return oldType;
    };

    // --- BLOCK MANAGEMENT ---
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const createNewBlock = (type) => ({
        id: generateId(),
        type: type,
        title: '',
        description: '',
        options: (type === 'multiple_choice' || type === 'checkboxes') ? ['Option 1'] : [],
        required: false,
        points: 1,
        url: '',
        image_url: '',
        correctAnswer: type === 'checkboxes' ? [] : '' // Added correct answer field
    });

    const addBlock = (type) => {
        const newBlock = createNewBlock(type);
        const activeIndex = blocks.findIndex(b => b.id === activeId);

        const newBlocks = [...blocks];
        if (activeIndex !== -1) {
            newBlocks.splice(activeIndex + 1, 0, newBlock);
        } else {
            newBlocks.push(newBlock);
        }

        setBlocks(newBlocks);
        setActiveId(newBlock.id);
    };

    const duplicateBlock = (id) => {
        const blockToCopy = blocks.find(b => b.id === id);
        if (!blockToCopy) return;

        const newBlock = { ...blockToCopy, id: generateId() };
        const index = blocks.findIndex(b => b.id === id);

        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
        setActiveId(newBlock.id);
    };

    const removeBlock = (id) => {
        if (blocks.length === 1) return;
        const newBlocks = blocks.filter(b => b.id !== id);
        setBlocks(newBlocks);
        if (activeId === id) setActiveId(newBlocks[0].id);
    };

    const updateBlock = (id, field, value) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    // --- AUTO-MARKING & OPTIONS MANAGEMENT ---
    const updateOption = (blockId, optionIndex, value) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            const newOptions = [...(b.options || [])];
            const oldVal = newOptions[optionIndex];
            newOptions[optionIndex] = value;

            // If the teacher changes the text of an option that was marked as the correct answer,
            // we need to dynamically update the correctAnswer to match the new text so grading doesn't break.
            let newCorrectAnswer = b.correctAnswer;
            if (b.type === 'multiple_choice' && b.correctAnswer === oldVal) {
                newCorrectAnswer = value;
            } else if (b.type === 'checkboxes' && Array.isArray(b.correctAnswer)) {
                newCorrectAnswer = b.correctAnswer.map(ans => ans === oldVal ? value : ans);
            }

            return { ...b, options: newOptions, correctAnswer: newCorrectAnswer };
        }));
    };

    const addOption = (blockId) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            const currentOptions = b.options || [];
            return { ...b, options: [...currentOptions, `Option ${currentOptions.length + 1}`] };
        }));
    };

    const removeOption = (blockId, optionIndex) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            const optionToRemove = b.options[optionIndex];
            const newOptions = (b.options || []).filter((_, i) => i !== optionIndex);

            // Remove it from the correct answers if it was deleted
            let newCorrectAnswer = b.correctAnswer;
            if (b.type === 'multiple_choice' && b.correctAnswer === optionToRemove) {
                newCorrectAnswer = '';
            } else if (b.type === 'checkboxes' && Array.isArray(b.correctAnswer)) {
                newCorrectAnswer = b.correctAnswer.filter(ans => ans !== optionToRemove);
            }

            return { ...b, options: newOptions, correctAnswer: newCorrectAnswer };
        }));
    };

    const toggleCorrectOption = (blockId, opt, blockType) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;

            if (blockType === 'multiple_choice') {
                return { ...b, correctAnswer: b.correctAnswer === opt ? '' : opt };
            } else if (blockType === 'checkboxes') {
                const currentCorrect = Array.isArray(b.correctAnswer) ? [...b.correctAnswer] : [];
                const newCorrect = currentCorrect.includes(opt)
                    ? currentCorrect.filter(c => c !== opt)
                    : [...currentCorrect, opt];
                return { ...b, correctAnswer: newCorrect };
            }
            return b;
        }));
    };

    // --- IMAGE UPLOAD HANDLERS ---
    const handleImageUpload = (blockId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Ensure it's an image
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            // Converts to a Base64 encoded string perfect for inline embedding without a backend
            updateBlock(blockId, 'image_url', reader.result);
        };
        reader.onerror = () => {
            alert('Failed to read file!');
        };
        reader.readAsDataURL(file);
    };

    // --- SAVE ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post(`assignments/${id}/update-content`, { blocks });
            alert("Assessment saved successfully!");
        } catch (err) {
            alert("Failed to save content.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-4 text-gray-500 font-medium">Loading Builder...</div>;
    if (error) return <div className="p-4 text-red-500 font-medium">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 pt-8 pb-32">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 relative px-2 md:px-4">
                {/* MAIN CANVAS */}
                <div className="flex-1 space-y-4 md:space-y-6">

                    {/* Top Header Card */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between items-start gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000 -mr-32 -mt-32"></div>
                        <div className="relative z-10 w-full">
                            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2 tracking-tight">{assignment?.title || 'Untitled Assessment'}</h1>
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500 font-semibold uppercase tracking-widest">{assignment?.subject?.name || 'Subject'} • Due: {assignment?.due_date || 'No Date'}</p>
                                <div className="h-4 w-px bg-gray-200"></div>
                                <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Math Mode: Use $...$ or $$...$$
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-6 w-full relative z-10">
                            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-school-secondary animate-pulse"></span>
                                <span className="text-xs font-bold text-school-secondary uppercase tracking-widest">Points: {blocks.reduce((sum, b) => sum + (Number(b.points) || 0), 0)}</span>
                            </div>
                            <div className="space-x-3 flex">
                                <Button variant="outline" onClick={() => navigate('/admin/assignments')} className="border-gray-200 text-gray-500 hover:text-gray-900 font-bold uppercase text-[11px]">Cancel</Button>
                                <Button onClick={handleSave} isLoading={isSaving} className="bg-school-primary text-white font-bold uppercase text-[11px] px-6 shadow-sm shadow-red-900/40">Save Assessment</Button>
                            </div>
                        </div>
                    </div>

                    {/* BLOCKS MAP */}
                    {blocks.map((block) => {
                        const isActive = activeId === block.id;

                        return (
                            <div
                                key={block.id}
                                onClick={() => setActiveId(block.id)}
                                className={`bg-white rounded-3xl transition-all duration-300 cursor-pointer relative ${isActive
                                    ? 'shadow-xl shadow-gray-200/50 ring-2 ring-school-primary scale-[1.01]'
                                    : 'shadow-sm border border-gray-100 hover:border-school-primary/30 hover:shadow-md'
                                    }`}
                            >
                                <div className="p-6 md:p-8">
                                    {isActive ? (
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                <div className="flex-1 w-full bg-gray-50/50 rounded-xl border border-gray-200 focus-within:border-school-primary focus-within:ring-4 focus-within:ring-school-primary/10 transition-all flex flex-col pt-2 px-4 shadow-inner relative group/input">
                                                    <div className="flex items-center justify-between gap-4 w-full">
                                                        <textarea
                                                            className="flex-1 bg-transparent py-4 outline-none text-lg font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400 resize-none overflow-hidden"
                                                            placeholder={block.type?.includes('info') ? "Content Title" : "Enter Question Here..."}
                                                            rows="1"
                                                            style={{ height: 'auto', minHeight: '60px' }}
                                                            onInput={(e) => {
                                                                e.target.style.height = 'auto';
                                                                e.target.style.height = (e.target.scrollHeight) + 'px';
                                                            }}
                                                            value={block.title || ''}
                                                            onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                            autoFocus
                                                        ></textarea>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setAssistantConfig({ id: block.id, field: 'title' }); }}
                                                                className="p-2.5 bg-white text-gray-400 border border-gray-200 hover:text-school-primary hover:border-school-primary rounded-lg shadow-sm transition-colors"
                                                                title="Math Assistant"
                                                            >
                                                                Σ
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateBlock(block.id, 'showImageInput', !(block.showImageInput || block.image_url)); }}
                                                                className="p-2.5 bg-white text-gray-400 border border-gray-200 hover:text-school-primary hover:border-school-primary rounded-lg shadow-sm transition-colors"
                                                                title="Attach an inline image"
                                                            >
                                                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <MathPreview text={block.title} />

                                                    {assistantConfig?.id === block.id && assistantConfig?.field === 'title' && (
                                                        <div className="absolute right-0 top-full mt-2 z-[200]">
                                                            <MathAssistant onInsert={insertMath} onClose={() => setAssistantConfig(null)} />
                                                        </div>
                                                    )}

                                                    {/* IMAGE UPLOAD PANEL */}
                                                    {(block.showImageInput || block.image_url) && (
                                                        <div className="w-full border-t border-gray-200/50 py-3 bg-white -mx-4 px-4 mt-2">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:items-center">
                                                                    <input
                                                                        type="url"
                                                                        placeholder="Paste Image URL..."
                                                                        className="w-full sm:flex-1 text-sm outline-none px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-600 focus:border-school-primary focus:bg-white"
                                                                        value={block.image_url || ''}
                                                                        onChange={(e) => updateBlock(block.id, 'image_url', e.target.value)}
                                                                    />
                                                                    <span className="text-gray-400 text-[10px] font-bold uppercase px-2 text-center">OR</span>
                                                                    <label className="cursor-pointer text-sm font-semibold uppercase tracking-wide bg-school-primary text-white border border-transparent hover:bg-school-secondary px-5 py-2.5 rounded shadow-sm transition-colors flex items-center justify-center gap-2">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                                        Upload Image
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(block.id, e)} />
                                                                    </label>
                                                                </div>
                                                                {block.image_url && <img src={block.image_url} alt="Question preview" className="h-32 w-max object-contain rounded border border-gray-100 bg-gray-50" />}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <select
                                                    className="w-full md:w-56 p-4 border border-gray-200 rounded-xl outline-none focus:border-school-primary focus:ring-4 focus:ring-school-primary/10 bg-white shadow-sm font-bold text-gray-700 uppercase tracking-wide text-xs cursor-pointer"
                                                    value={block.type || 'short_answer'}
                                                    onChange={(e) => updateBlock(block.id, 'type', e.target.value)}
                                                >
                                                    <optgroup label="Auto-Graded Inputs">
                                                        <option value="short_answer">Short answer</option>
                                                        <option value="multiple_choice">Multiple choice</option>
                                                        <option value="checkboxes">Checkboxes</option>
                                                    </optgroup>
                                                    <optgroup label="Manual Graded Inputs">
                                                        <option value="paragraph">Paragraph (Essay)</option>
                                                        <option value="file_upload">File upload / Link</option>
                                                    </optgroup>
                                                    <optgroup label="Presentation">
                                                        <option value="text_info">Title and description</option>
                                                        <option value="image_info">Dedicated Image Block</option>
                                                        <option value="video_info">Dedicated Video embed</option>
                                                    </optgroup>
                                                </select>
                                            </div>

                                            <div className="pt-2 pb-2">
                                                {(block.type === 'text_info' || block.type === 'short_answer' || block.type === 'paragraph') && (
                                                    <div className="space-y-2 relative group-assistant">
                                                        <div className="flex items-start gap-2">
                                                            <textarea
                                                                rows="1"
                                                                style={{ height: 'auto', minHeight: '40px' }}
                                                                onInput={(e) => {
                                                                    e.target.style.height = 'auto';
                                                                    e.target.style.height = (e.target.scrollHeight) + 'px';
                                                                }}
                                                                className="flex-1 bg-transparent border-b border-gray-300 py-2 outline-none focus:border-blue-500 text-sm font-medium resize-none overflow-hidden"
                                                                placeholder={block.type === 'text_info' ? "Description (optional)" : `${block.type === 'short_answer' ? 'Short answer' : 'Long answer'} description/sub-text`}
                                                                disabled={block.type !== 'text_info' && block.type !== 'paragraph' && block.type !== 'short_answer'}
                                                                value={block.description || ''}
                                                                onChange={(e) => updateBlock(block.id, 'description', e.target.value)}
                                                            ></textarea>
                                                            {(block.type === 'text_info' || block.type === 'paragraph' || block.type === 'short_answer') && (
                                                                <button onClick={() => setAssistantConfig({ id: block.id, field: 'description' })} className="p-1.5 mt-1 text-gray-400 hover:text-school-primary transition-colors text-xs font-bold border border-gray-100 rounded bg-gray-50/50">Σ</button>
                                                            )}
                                                        </div>
                                                        <MathPreview text={block.type === 'text_info' ? block.description : ''} />
                                                        {assistantConfig?.id === block.id && assistantConfig?.field === 'description' && (
                                                            <div className="absolute left-0 top-10 z-[100]">
                                                                <MathAssistant onInsert={insertMath} onClose={() => setAssistantConfig(null)} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {block.type === 'short_answer' && (
                                                    <div className="mt-4 p-4 border border-green-200 bg-green-50/50 rounded-lg relative">
                                                        <label className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center justify-between">
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                Correct Answer
                                                            </div>
                                                            <button onClick={() => setAssistantConfig({ id: block.id, field: 'correctAnswer' })} className="px-2 py-0.5 bg-white border border-green-200 text-green-600 rounded text-[10px] hover:bg-green-100 transition-colors">MATH ASSISTANT Σ</button>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2.5 border border-green-300 rounded outline-none bg-white text-green-900 font-medium"
                                                            value={block.correctAnswer || ''}
                                                            onChange={(e) => updateBlock(block.id, 'correctAnswer', e.target.value)}
                                                        />
                                                        <MathPreview text={block.correctAnswer} />
                                                        {assistantConfig?.id === block.id && assistantConfig?.field === 'correctAnswer' && (
                                                            <div className="absolute left-4 top-14 z-[100]">
                                                                <MathAssistant onInsert={insertMath} onClose={() => setAssistantConfig(null)} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {(block.type === 'multiple_choice' || block.type === 'checkboxes') && (
                                                    <div className="space-y-3 mt-4">
                                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Options (Select correct answers)</div>
                                                        {(block.options || []).map((opt, idx) => {
                                                            const isCorrect = block.type === 'multiple_choice' ? block.correctAnswer === opt : (Array.isArray(block.correctAnswer) && block.correctAnswer.includes(opt));
                                                            return (
                                                                <div key={idx} className="flex items-center gap-3 group relative">
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleCorrectOption(block.id, opt, block.type); }} className={`p-1 rounded-full transition-colors ${isCorrect ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-green-400'}`}>
                                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                                    </button>
                                                                    <div className="flex-1 flex items-center gap-2 group/opt">
                                                                        <input
                                                                            type="text"
                                                                            className={`flex-1 bg-transparent border-b py-1 outline-none transition-colors ${isCorrect ? 'border-green-300 font-medium text-green-900' : 'border-transparent hover:border-gray-200'}`}
                                                                            value={opt || ''}
                                                                            onChange={(e) => updateOption(block.id, idx, e.target.value)}
                                                                        />
                                                                        <button onClick={() => setAssistantConfig({ id: block.id, field: 'option', idx })} className="opacity-0 group-hover:opacity-100 group-hover/opt:opacity-100 p-1 text-gray-400 hover:text-school-primary transition-all text-[10px] font-black border border-gray-100 rounded">Σ</button>
                                                                        <MathPreview text={opt} />
                                                                    </div>
                                                                    {assistantConfig?.id === block.id && assistantConfig?.field === 'option' && assistantConfig?.idx === idx && (
                                                                        <div className="absolute left-10 top-8 z-[100]">
                                                                            <MathAssistant onInsert={insertMath} onClose={() => setAssistantConfig(null)} />
                                                                        </div>
                                                                    )}
                                                                    {(block.options || []).length > 1 && (
                                                                        <button onClick={() => removeOption(block.id, idx)} className="text-gray-300 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <button onClick={() => addOption(block.id)} className="text-sm text-gray-400 hover:text-blue-600 ml-9">+ Add option</button>
                                                    </div>
                                                )}

                                                {(block.type === 'image_info' || block.type === 'video_info') && (
                                                    <div className="space-y-3 mt-4">
                                                <input
                                                            type="url"
                                                            className="w-full p-3 border border-gray-200 rounded-md outline-none focus:border-school-primary"
                                                            placeholder={`Paste YouTube or TikTok URL here...`}
                                                            value={block.url || ''}
                                                            onChange={(e) => updateBlock(block.id, 'url', e.target.value)}
                                                        />
                                                        {block.url && block.url.includes('tiktok.com') && (
                                                            <div className="text-[10px] font-black text-school-secondary uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                                                                TikTok Embed Detected
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {!block.type?.includes('info') && (
                                                <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl relative">
                                                    <label className="text-[10px] font-black tracking-widest text-school-secondary uppercase mb-2 block flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Answer Feedback / Reasoning
                                                        </div>
                                                        <button onClick={() => setAssistantConfig({ id: block.id, field: 'explanation' })} className="px-2 py-0.5 bg-white border border-indigo-100 text-school-secondary rounded text-[10px] hover:bg-indigo-100 transition-colors">MATH ASSISTANT Σ</button>
                                                    </label>
                                                    <textarea
                                                        className="w-full bg-white border border-indigo-100/50 p-3 rounded-lg outline-none text-sm font-semibold text-gray-700 resize-none overflow-hidden"
                                                        rows="1"
                                                        style={{ height: 'auto', minHeight: '60px' }}
                                                        onInput={(e) => {
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = (e.target.scrollHeight) + 'px';
                                                        }}
                                                        value={block.explanation || ''}
                                                        onChange={(e) => updateBlock(block.id, 'explanation', e.target.value)}
                                                    ></textarea>
                                                    <MathPreview text={block.explanation} />
                                                    {assistantConfig?.id === block.id && assistantConfig?.field === 'explanation' && (
                                                        <div className="absolute right-0 top-full mt-2 z-[200]">
                                                            <MathAssistant onInsert={insertMath} onClose={() => setAssistantConfig(null)} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="border-t border-gray-100 pt-4 mt-6 flex items-center justify-end gap-3 text-gray-500">
                                                {!block.type?.includes('info') && (
                                                    <div className="flex items-center gap-2 mr-auto bg-gray-50 rounded-lg px-4 py-2 border border-gray-200/50 text-xs font-bold uppercase">
                                                        <span className="text-gray-400">Pts</span>
                                                        <input type="number" min="0" className="w-10 bg-transparent outline-none text-school-primary text-center" value={block.points || 0} onChange={(e) => updateBlock(block.id, 'points', e.target.value)} />
                                                    </div>
                                                )}
                                                <button onClick={() => duplicateBlock(block.id)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                                                <button onClick={() => removeBlock(block.id)} className="p-2 hover:bg-red-50 hover:text-school-primary rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                {!block.type?.includes('info') && (
                                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateBlock(block.id, 'required', !block.required)}>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${block.required ? 'text-school-primary' : 'text-gray-400'}`}>Required</span>
                                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${block.required ? 'bg-school-primary' : 'bg-gray-200'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${block.required ? 'right-0.5' : 'left-0.5'}`}></div></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="opacity-95">
                                            {block.title && (
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <h3 className={`font-black text-gray-900 leading-snug tracking-tight ${block.type === 'text_info' ? 'text-3xl' : 'text-xl'}`}>
                                                        <MathText text={block.title} /> {block.required && <span className="text-school-primary ml-1 font-black text-2xl">*</span>}
                                                    </h3>
                                                    {!block.type.includes('info') && <span className="text-[10px] font-black tracking-widest uppercase text-school-primary bg-red-50 border border-red-100 px-3 py-1 rounded-full">{block.points} pts</span>}
                                                </div>
                                            )}
                                            {block.image_url && (
                                                <div className="mb-6 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 w-fit max-w-full">
                                                    <img src={block.image_url} alt="Attached Diagram" className="max-h-64 object-contain rounded-xl" />
                                                </div>
                                            )}
                                            {block.type === 'text_info' && <div className="text-base text-gray-600 leading-relaxed"><MathText text={block.description || ''} /></div>}
                                            {block.type === 'short_answer' && (
                                                <div className="mt-4">
                                                    <div className="border-b-2 border-dashed border-gray-200 w-1/2 min-w-[200px] pb-2 text-sm text-gray-400 font-semibold tracking-wide">Learner's answer...</div>
                                                    {block.correctAnswer && <div className="text-xs text-emerald-600 mt-3 font-bold bg-emerald-50 px-3 py-1 rounded-md inline-flex items-center gap-1">✓ Key: <MathText text={block.correctAnswer} /></div>}
                                                </div>
                                            )}
                                            {block.type === 'multiple_choice' && (
                                                <div className="space-y-2 mt-4">
                                                    {(block.options || []).map((opt, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border-2 ${block.correctAnswer === opt ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}></div>
                                                            <span className={`text-sm ${block.correctAnswer === opt ? 'text-green-700 font-medium' : 'text-gray-700'}`}><MathText text={opt || `Option ${i + 1}`} /></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {block.type === 'checkboxes' && (
                                                <div className="space-y-2 mt-4">
                                                    {(block.options || []).map((opt, i) => {
                                                        const isCorrect = Array.isArray(block.correctAnswer) && block.correctAnswer.includes(opt);
                                                        return (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 rounded border-2 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}></div>
                                                                <span className={`text-sm ${isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}><MathText text={opt || `Option ${i + 1}`} /></span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {block.type === 'file_upload' && (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm text-blue-600 bg-white">Add File / Link</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FLOATING ACTION SIDEBAR */}
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:static md:w-14 md:shrink-0 md:mt-0 z-30">
                    <div className="md:sticky md:top-10 bg-white border border-gray-200 rounded-full md:rounded-[2rem] shadow-2xl md:shadow-lg flex flex-row md:flex-col items-center p-2 md:py-4 space-x-2 md:space-x-0 md:space-y-3">
                        <button onClick={() => addBlock('multiple_choice')} title="Add question" className="p-3 text-gray-400 hover:text-white hover:bg-school-primary rounded-full transition-all hover:scale-110">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        </button>
                        <div className="w-px h-6 md:w-6 md:h-px bg-gray-100 mx-1 md:my-1"></div>
                        <button onClick={() => addBlock('text_info')} title="Add text block" className="p-3 text-gray-400 hover:text-white hover:bg-school-secondary rounded-full transition-all hover:scale-110 font-serif font-black text-xl">Tt</button>
                        <button onClick={() => addBlock('image_info')} title="Add image block" className="p-3 text-gray-400 hover:text-white hover:bg-school-secondary rounded-full transition-all hover:scale-110">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}