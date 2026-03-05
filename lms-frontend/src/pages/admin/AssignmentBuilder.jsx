import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/common/Button';

export default function AssignmentBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [activeId, setActiveId] = useState(null); 
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const response = await api.get('/assignments');
                const currentData = response.data.find(a => a.id === parseInt(id));
                if (!currentData) throw new Error("Assignment not found");
                
                setAssignment(currentData);
                
                try {
                    const parsedBlocks = typeof currentData.content === 'string' 
                        ? JSON.parse(currentData.content) 
                        : (currentData.content || []);
                    
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

    // --- SAVE ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put(`/assignments/${id}/update-content`, { blocks });
            alert("Assessment saved successfully!");
        } catch (err) {
            alert("Failed to save content.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-gray-500 font-medium">Loading Builder...</div>;
    if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;

    return (
        <div className="min-h-screen bg-[#f0ebf8] pt-8 pb-32">
            <div className="max-w-4xl mx-auto flex gap-4 relative px-4">
                
                {/* MAIN CANVAS */}
                <div className="flex-1 space-y-4">
                    
                    {/* Top Header Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-8 border-t-purple-600 p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment?.title || 'Untitled Assessment'}</h1>
                        <p className="text-sm text-gray-600 mb-6">{assignment?.subject?.name || 'Subject'} • Due: {assignment?.due_date || 'No Date'}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Total Points: {blocks.reduce((sum, b) => sum + (Number(b.points) || 0), 0)}</span>
                            <div className="space-x-3">
                                <Button variant="secondary" onClick={() => navigate('/admin/assignments')}>Cancel</Button>
                                <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Save Assessment</Button>
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
                                className={`bg-white rounded-xl transition-all duration-200 cursor-pointer relative ${
                                    isActive 
                                    ? 'shadow-md border border-gray-200 scale-[1.01]' 
                                    : 'shadow-sm border border-transparent hover:border-gray-300'
                                }`}
                            >
                                {isActive && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500 rounded-l-xl"></div>}
                                
                                <div className="p-6">
                                    {isActive ? (
                                        // ==============================
                                        // ACTIVE EDIT MODE
                                        // ==============================
                                        <div className="space-y-4 ml-2">
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                <input 
                                                    type="text" 
                                                    className="flex-1 w-full bg-gray-50 hover:bg-gray-100 focus:bg-gray-50 p-3 border-b-2 border-transparent focus:border-blue-500 rounded-t outline-none text-base font-medium transition-colors"
                                                    placeholder={block.type?.includes('info') ? "Title" : "Question"}
                                                    value={block.title || ''}
                                                    onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                    autoFocus
                                                />
                                                <select 
                                                    className="w-full sm:w-56 p-3 border border-gray-300 rounded-md outline-none focus:border-blue-500 bg-white shadow-sm font-medium text-gray-700"
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
                                                        <option value="image_info">Image / Diagram</option>
                                                        <option value="video_info">Video embed</option>
                                                    </optgroup>
                                                </select>
                                            </div>

                                            <div className="pt-2 pb-2">
                                                
                                                {(block.type === 'text_info' || block.type === 'short_answer' || block.type === 'paragraph') && (
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-transparent border-b border-gray-300 py-2 outline-none focus:border-blue-500 text-sm"
                                                        placeholder={block.type === 'text_info' ? "Description (optional)" : `${block.type === 'short_answer' ? 'Short answer' : 'Long answer'} description/sub-text`}
                                                        disabled={block.type !== 'text_info'}
                                                        value={block.type === 'text_info' ? (block.description || '') : ''}
                                                        onChange={(e) => updateBlock(block.id, 'description', e.target.value)}
                                                    />
                                                )}

                                                {/* --- ANSWER KEY: SHORT ANSWER --- */}
                                                {block.type === 'short_answer' && (
                                                    <div className="mt-4 p-4 border border-green-200 bg-green-50/50 rounded-lg">
                                                        <label className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Correct Answer (Auto-marking)
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full p-2.5 border border-green-300 rounded outline-none focus:ring-2 focus:ring-green-500 bg-white text-green-900 font-medium"
                                                            placeholder="Type the exact correct answer..."
                                                            value={block.correctAnswer || ''}
                                                            onChange={(e) => updateBlock(block.id, 'correctAnswer', e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                {(block.type === 'multiple_choice' || block.type === 'checkboxes') && (
                                                    <div className="space-y-3 mt-4">
                                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Options (Click checkmark to set answer key)</div>
                                                        {(block.options || []).map((opt, idx) => {
                                                            
                                                            // Determine if this option is currently marked as correct
                                                            const isCorrect = block.type === 'multiple_choice' 
                                                                ? block.correctAnswer === opt 
                                                                : (Array.isArray(block.correctAnswer) && block.correctAnswer.includes(opt));

                                                            return (
                                                                <div key={idx} className="flex items-center gap-3 group">
                                                                    
                                                                    {/* Answer Key Toggle Button */}
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); toggleCorrectOption(block.id, opt, block.type); }}
                                                                        title="Mark as correct answer"
                                                                        className={`p-1 rounded-full transition-colors ${isCorrect ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-green-400 hover:bg-gray-50'}`}
                                                                    >
                                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                                    </button>

                                                                    <input 
                                                                        type="text" 
                                                                        className={`flex-1 bg-transparent border-b py-1 outline-none transition-colors ${isCorrect ? 'border-green-300 font-medium text-green-900' : 'border-transparent hover:border-gray-200 focus:border-blue-500'}`}
                                                                        value={opt || ''}
                                                                        onChange={(e) => updateOption(block.id, idx, e.target.value)}
                                                                    />
                                                                    
                                                                    {(block.options || []).length > 1 && (
                                                                        <button onClick={() => removeOption(block.id, idx)} className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <div className="flex items-center gap-3 mt-2 pl-9">
                                                            <button onClick={() => addOption(block.id)} className="text-sm text-gray-500 hover:text-blue-600 border-b border-transparent hover:border-blue-600 transition-colors pb-0.5">
                                                                Add option
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {(block.type === 'image_info' || block.type === 'video_info') && (
                                                    <div className="space-y-3 mt-4">
                                                        <input 
                                                            type="url" 
                                                            className="w-full p-3 border border-gray-200 rounded-md outline-none focus:border-blue-500"
                                                            placeholder={`Paste ${block.type === 'image_info' ? 'Image' : 'YouTube Video'} URL here...`}
                                                            value={block.url || ''}
                                                            onChange={(e) => updateBlock(block.id, 'url', e.target.value)}
                                                        />
                                                        {block.url && block.type === 'image_info' && (
                                                            <div className="mt-4 flex justify-center bg-gray-50 rounded-lg border border-gray-200 p-2"><img src={block.url} alt="Preview" className="max-h-48 object-contain" /></div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* BOTTOM FOOTER CONTROLS */}
                                            <div className="border-t border-gray-200 pt-4 flex flex-wrap items-center justify-end gap-4 text-gray-600">
                                                {!block.type?.includes('info') && (
                                                    <div className="flex items-center gap-2 mr-auto bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
                                                        <label className="text-sm font-medium">Points</label>
                                                        <input 
                                                            type="number" min="0" 
                                                            className="w-14 bg-transparent outline-none font-bold text-center text-blue-600"
                                                            value={block.points || 0}
                                                            onChange={(e) => updateBlock(block.id, 'points', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                                
                                                <button onClick={() => duplicateBlock(block.id)} title="Duplicate" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                                
                                                <button onClick={() => removeBlock(block.id)} title="Delete" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                                
                                                {!block.type?.includes('info') && (
                                                    <>
                                                        <div className="h-6 w-px bg-gray-300"></div>
                                                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateBlock(block.id, 'required', !block.required)}>
                                                            <span className="text-sm font-medium select-none">Required</span>
                                                            <div className={`w-8 h-4 rounded-full transition-colors relative ${block.required ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                                                <div className={`absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white transition-all shadow-sm ${block.required ? 'right-0.5' : 'left-0.5'}`}></div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // ==============================
                                        // INACTIVE PREVIEW MODE
                                        // ==============================
                                        <div className="opacity-90 ml-2">
                                            {block.title && (
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className={`font-medium text-gray-900 ${block.type === 'text_info' ? 'text-xl' : 'text-base'}`}>
                                                        {block.title} {block.required && <span className="text-red-500">*</span>}
                                                    </h3>
                                                    {/* Show points in preview */}
                                                    {!block.type.includes('info') && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{block.points} pts</span>}
                                                </div>
                                            )}

                                            {block.type === 'text_info' && <p className="text-sm text-gray-600 whitespace-pre-wrap">{block.description || ''}</p>}
                                            {block.type === 'short_answer' && (
                                                <div>
                                                    <div className="border-b border-dashed border-gray-300 w-1/2 pb-1 text-sm text-gray-400">Short answer text</div>
                                                    {block.correctAnswer && <p className="text-xs text-green-600 mt-2 font-medium">✓ Key: {block.correctAnswer}</p>}
                                                </div>
                                            )}
                                            {block.type === 'paragraph' && <div className="border-b border-dashed border-gray-300 w-full pb-8 text-sm text-gray-400">Long answer text</div>}
                                            
                                            {block.type === 'multiple_choice' && (
                                                <div className="space-y-2">
                                                    {(block.options || []).map((opt, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border-2 ${block.correctAnswer === opt ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}></div>
                                                            <span className={`text-sm ${block.correctAnswer === opt ? 'text-green-700 font-medium' : 'text-gray-700'}`}>{opt || `Option ${i+1}`}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {block.type === 'checkboxes' && (
                                                <div className="space-y-2">
                                                    {(block.options || []).map((opt, i) => {
                                                        const isCorrect = Array.isArray(block.correctAnswer) && block.correctAnswer.includes(opt);
                                                        return (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 rounded border-2 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}></div>
                                                                <span className={`text-sm ${isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}>{opt || `Option ${i+1}`}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {block.type === 'image_info' && block.url && (
                                                <div className="mt-2 bg-gray-50 rounded p-2 inline-block border border-gray-200"><img src={block.url} alt="Preview" className="max-h-32 object-contain" /></div>
                                            )}
                                            {block.type === 'video_info' && block.url && (
                                                <div className="mt-2 w-full max-w-sm aspect-video bg-gray-200 rounded flex items-center justify-center text-gray-500">Video Preview</div>
                                            )}
                                            {block.type === 'file_upload' && (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm text-blue-600 bg-white">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    Add File / Link
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FLOATING ACTION SIDEBAR */}
                <div className="w-12 shrink-0">
                    <div className="sticky top-6 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col items-center py-2 space-y-1">
                        <button onClick={() => addBlock('multiple_choice')} title="Add question" className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                        <button onClick={() => addBlock('text_info')} title="Add title and description" className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors font-serif font-bold text-lg leading-none">
                            Tt
                        </button>
                        <button onClick={() => addBlock('image_info')} title="Add image" className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => addBlock('video_info')} title="Add video" className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}