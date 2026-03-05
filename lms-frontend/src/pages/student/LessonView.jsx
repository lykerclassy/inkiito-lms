import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export default function LessonView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Tracks the student's answers: { blockId: { selected: 'A', isCorrect: true } }
    const [quizState, setQuizState] = useState({});

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const response = await api.get(`/lessons/${id}`);
                setLesson(response.data);

                // Parse the JSON content safely from Laravel
                const parsedBlocks = response.data.blocks.map(b => ({
                    ...b,
                    content: typeof b.content === 'string' ? JSON.parse(b.content) : b.content
                }));
                setBlocks(parsedBlocks);
            } catch (err) {
                console.error("Failed to fetch lesson details", err);
                setError("Could not load the lesson. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    const handleQuizSubmit = async (blockId, selectedOption, correctAnswer) => {
        // Prevent re-answering if already answered
        if (quizState[blockId]) return;

        const isCorrect = selectedOption === correctAnswer;

        // 1. Update the UI instantly so the student gets immediate feedback
        setQuizState(prev => ({
            ...prev,
            [blockId]: { selected: selectedOption, isCorrect }
        }));

        // 2. Silently send the result to the Laravel backend
        try {
            await api.post('/quizzes/submit', {
                lesson_id: id,
                lesson_block_id: blockId,
                student_answer: selectedOption,
                is_correct: isCorrect
            });
        } catch (err) {
            console.error("Failed to save quiz result to database", err);
        }
    };

    if (isLoading) return <div className="p-8 text-gray-500 font-medium">Loading lesson content...</div>;
    if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;
    if (!lesson) return <div className="p-8 text-red-500 font-medium">Lesson not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 mt-4">

            {/* Header - Removed 'sticky top-0 z-10' classes here */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-gray-500 hover:text-blue-600 mb-1 flex items-center gap-1 font-medium transition-colors"
                    >
                        &larr; Back to Syllabus
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                </div>
                {!lesson.is_published && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">
                        Draft Preview
                    </span>
                )}
            </div>

            {/* Lesson Blocks (Continuous Reading View) */}
            <div className="space-y-0.5">
                {blocks.map((block, index) => {
                    const isNextBlockTextOrImage = blocks[index + 1]?.type === 'text' || blocks[index + 1]?.type === 'image';
                    const isPrevBlockTextOrImage = blocks[index - 1]?.type === 'text' || blocks[index - 1]?.type === 'image';

                    // We apply rounded corners depending on their position in a contiguous text/image block chain
                    let cardClasses = "shadow-sm border border-gray-100 bg-white";

                    if ((block.type === 'text' || block.type === 'image') && isNextBlockTextOrImage && isPrevBlockTextOrImage) {
                        cardClasses += " rounded-none border-t-0"; // Middle of a chain
                    } else if ((block.type === 'text' || block.type === 'image') && isNextBlockTextOrImage) {
                        cardClasses += " rounded-t-xl rounded-b-none"; // Start of a chain
                    } else if ((block.type === 'text' || block.type === 'image') && isPrevBlockTextOrImage) {
                        cardClasses += " rounded-b-xl rounded-t-none border-t-0"; // End of a chain
                    } else if (block.type === 'text' || block.type === 'image') {
                        cardClasses += " rounded-xl"; // Standalone text/image
                    } else {
                        cardClasses += " rounded-xl mt-6 mb-6"; // Interactive widgets get margin spacing
                    }

                    return (
                        <div key={block.id} className="block-container">

                            {/* TEXT BLOCK */}
                            {block.type === 'text' && (
                                <div className={`prose max-w-none prose-blue p-8 ${cardClasses}`}>
                                    <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
                                </div>
                            )}

                            {/* IMAGE BLOCK */}
                            {block.type === 'image' && (
                                <div className={`${cardClasses} flex flex-col items-center p-6 bg-gray-50/50`}>
                                    <img
                                        src={block.content.url}
                                        alt={block.content.caption || 'Lesson image'}
                                        className="max-w-full h-auto object-contain max-h-[500px] rounded-lg shadow-sm"
                                    />
                                    {block.content.caption && (
                                        <div className="w-full mt-3 text-center text-sm text-gray-500 italic">
                                            {block.content.caption}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* YOUTUBE BLOCK */}
                            {block.type === 'youtube' && (() => {
                                const getYouTubeId = (url) => {
                                    if (!url) return '';
                                    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                    const match = url.match(regExp);
                                    if (match && match[2].length === 11) return match[2];
                                    // Fallback if they just pasted the raw ID
                                    if (url.length === 11) return url;
                                    // Desperate fallback
                                    return url.split('v=')[1]?.substring(0, 11) || '';
                                };
                                const videoId = getYouTubeId(block.content.url);

                                return (
                                    <div className={`${cardClasses} p-4 bg-slate-900 border-none`}>
                                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-inner">
                                            {videoId ? (
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    Invalid or Missing Video URL
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* GENERIC VIDEO BLOCK */}
                            {block.type === 'video' && (
                                <div className={`${cardClasses} p-6 bg-gray-50/30 flex flex-col items-center`}>
                                    <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-black shadow-lg">
                                        <video
                                            controls
                                            className="w-full aspect-video"
                                            poster=""
                                        >
                                            <source src={block.content.url} />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                    {block.content.caption && (
                                        <p className="mt-3 text-sm text-gray-500 italic text-center">
                                            {block.content.caption}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* INTERACTIVE QUIZ BLOCK */}
                            {block.type === 'quiz' && (
                                <Card className="shadow-sm border-2 border-blue-50 bg-white">
                                    <div className="flex items-center gap-2 mb-4">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Knowledge Check</h3>
                                    </div>
                                    <p className="text-lg font-medium text-gray-900 mb-6">{block.content.question}</p>

                                    <div className="space-y-3">
                                        {block.content.options.map((option, index) => {
                                            if (!option) return null; // Skip empty options

                                            const isAnswered = !!quizState[block.id];
                                            const isSelected = quizState[block.id]?.selected === option;
                                            const isCorrectAnswer = option === block.content.correct_answer;

                                            // Determine styling based on whether the student has answered
                                            let buttonStyle = "border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700";

                                            if (isAnswered) {
                                                if (isSelected && isCorrectAnswer) {
                                                    buttonStyle = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
                                                } else if (isSelected && !isCorrectAnswer) {
                                                    buttonStyle = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                                                } else if (isCorrectAnswer) {
                                                    // Show the correct answer if they got it wrong
                                                    buttonStyle = "border-green-300 bg-green-50/50 text-green-700 border-dashed";
                                                } else {
                                                    buttonStyle = "border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={index}
                                                    disabled={isAnswered}
                                                    onClick={() => handleQuizSubmit(block.id, option, block.content.correct_answer)}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex justify-between items-center ${buttonStyle}`}
                                                >
                                                    <span>{option}</span>

                                                    {/* Visual Icons for Feedback */}
                                                    {isAnswered && isSelected && isCorrectAnswer && (
                                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    )}
                                                    {isAnswered && isSelected && !isCorrectAnswer && (
                                                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {quizState[block.id] && (
                                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${quizState[block.id].isCorrect ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                            {quizState[block.id].isCorrect ? 'Excellent! That is the correct answer. Score saved.' : 'Not quite right. Review the material and try again later.'}
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* INTERACTIVE CODE EXERCISE BLOCK */}
                            {block.type === 'code_editor' && (
                                <div className={`${cardClasses} overflow-hidden shadow-md`}>
                                    <div className="p-6 bg-slate-900 text-white border-b border-slate-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Interactive Practical</h3>
                                        </div>
                                        <p className="text-slate-200 font-medium">{block.content.instructions}</p>
                                    </div>
                                    <div className="h-[300px] w-full bg-slate-950">
                                        <Editor
                                            height="100%"
                                            language={block.content.language || 'html'}
                                            theme="vs-dark"
                                            defaultValue={block.content.initial_code || ''}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                scrollBeyondLastLine: false,
                                                padding: { top: 16 }
                                            }}
                                        />
                                    </div>
                                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                                        <Button variant="primary">Run Code</Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>

            <div className="pt-8 border-t border-gray-200 flex justify-between items-center">
                <Button variant="outline" onClick={() => navigate(-1)}>Previous Lesson</Button>
                <Button variant="primary" onClick={() => navigate(-1)}>Mark as Complete & Continue</Button>
            </div>
        </div >
    );
}