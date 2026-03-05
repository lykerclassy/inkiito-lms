import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function LessonBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [lesson, setLesson] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const response = await api.get(`/lessons/${id}`);
                setLesson(response.data);
                
                const parsedBlocks = response.data.blocks.map(b => ({
                    ...b,
                    content: typeof b.content === 'string' ? JSON.parse(b.content) : b.content
                }));
                setBlocks(parsedBlocks);
            } catch (err) {
                console.error("Failed to fetch lesson details", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
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
        if (type === 'quiz') defaultContent = { question: '', options: ['', '', '', ''], correct_answer: '' };
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
            await api.put(`/lessons/${id}/blocks`, { blocks });
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
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    if (isLoading) return <div className="p-8 text-gray-500">Loading editor...</div>;
    if (!lesson) return <div className="p-8 text-red-500">Lesson not found.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10">
                <div>
                    <button 
                        onClick={() => navigate('/admin/curriculum')}
                        className="text-sm text-gray-500 hover:text-blue-600 mb-1 flex items-center gap-1 font-medium"
                    >
                        &larr; Back to Curriculum
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Editing: {lesson.title}</h1>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="secondary" onClick={() => navigate(`/student/lessons/${id}`)}>
                        Preview as Student
                    </Button>
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {blocks.map((block, index) => (
                    <Card key={block.id} className="relative group border-2 border-transparent hover:border-blue-100 transition-colors">
                        
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                                {block.type.replace('_', ' ')}
                            </span>
                            <button onClick={() => removeBlock(index)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Delete Block">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        {block.type === 'text' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Text Content</label>
                                <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                                    <ReactQuill 
                                        theme="snow"
                                        modules={quillModules}
                                        value={block.content.html || ''}
                                        onChange={(content) => updateBlockContent(index, { ...block.content, html: content })}
                                        className="h-48 pb-10"
                                    />
                                </div>
                            </div>
                        )}

                        {block.type === 'image' && (
                            <div className="space-y-4 mt-8">
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

            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mt-8">
                <h3 className="text-gray-600 font-medium mb-4">Add Content Block</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" onClick={() => addNewBlock('text')}>+ Text Paragraph</Button>
                    <Button variant="outline" onClick={() => addNewBlock('image')}>+ Image</Button>
                    <Button variant="outline" onClick={() => addNewBlock('quiz')}>+ Multiple Choice Quiz</Button>
                    <Button variant="primary" onClick={() => addNewBlock('code_editor')}>
                        + Interactive Code Exercise
                    </Button>
                </div>
            </div>

        </div>
    );
}