import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import html2pdf from 'html2pdf.js';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/Skeleton';

export default function LessonView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [schoolSettings, setSchoolSettings] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const [quizState, setQuizState] = useState({});

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const [lessonRes, settingsRes] = await Promise.all([
                    api.get(`lessons/${id}`),
                    api.get('settings').catch(() => ({ data: null }))
                ]);

                setLesson(lessonRes.data);
                if (settingsRes.data) {
                    setSchoolSettings(settingsRes.data);
                }

                const parsedBlocks = lessonRes.data.blocks.map(b => {
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
                setError("Could not load the lesson. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchLesson();

        // Load TikTok Embed Script if not already present
        if (!document.getElementById('tiktok-embed-script')) {
            const script = document.createElement('script');
            script.id = 'tiktok-embed-script';
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, [id]);

    const handleQuizSubmit = async (blockId, selectedOption, correctAnswer) => {
        if (quizState[blockId]) return;

        const isCorrect = selectedOption === correctAnswer;

        setQuizState(prev => ({
            ...prev,
            [blockId]: { selected: selectedOption, isCorrect }
        }));

        try {
            await api.post('quizzes/submit', {
                lesson_id: id,
                lesson_block_id: blockId,
                student_answer: selectedOption,
                is_correct: isCorrect
            });
        } catch (err) {
            console.error("Failed to save quiz result to database", err);
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);

        // Helper: Bypass Canvas Tainting & CORS restrictions using a public raw proxy
        const getProxiedUrl = (url) => {
            if (!url) return '';
            const fixedUrl = getMediaUrl(url);
            if (fixedUrl.startsWith('data:') || fixedUrl.startsWith('blob:') || fixedUrl.startsWith('/')) return fixedUrl;
            return `https://corsproxy.io/?${encodeURIComponent(fixedUrl)}`;
        };

        const proxifyHtmlImages = (htmlStr) => {
            if (!htmlStr) return '';
            return htmlStr.replace(/<img([^>]*)src="([^">]+)"([^>]*)>/gi, (match, prefix, url, suffix) => {
                const fixedUrl = getMediaUrl(url);
                if (fixedUrl.startsWith('data:') || fixedUrl.startsWith('blob:') || fixedUrl.startsWith('/')) return match.replace(url, fixedUrl);
                const proxyUrl = getProxiedUrl(fixedUrl);
                // Ensure crossorigin is injected so html2canvas safely loads the proxied data
                const hasCrossorigin = match.includes('crossorigin') || match.includes('crossOrigin');
                return `<img${prefix}src="${proxyUrl}" ${!hasCrossorigin ? 'crossorigin="anonymous"' : ''}${suffix}>`;
            });
        };

        // Tailwind v4 uses OKLCH color domains which natively crash html2canvas when reading ComputedStyles.
        // Solution: We compile a pure HTML DOM exclusively for the PDF engine.
        let htmlContent = `
            <div style="padding: 40px; background-color: white; font-family: 'Times New Roman', Times, serif; color: black; border: 2px solid black; box-sizing: border-box;">
                ${schoolSettings?.logo_url ? `<img src="${getProxiedUrl(schoolSettings.logo_url)}" crossorigin="anonymous" style="height: 100px; display: block; margin: 0 auto 16px; filter: grayscale(100%);" />` : ''}
                <div style="text-align: center; border-bottom: 3px double black; margin-bottom: 30px; padding-bottom: 20px;">
                    <h1 style="text-transform: uppercase; font-size: 24pt; margin: 0 0 10px; font-weight: bold; letter-spacing: 2px;">${schoolSettings?.school_name || "Academic Institution"}</h1>
                    <h2 style="font-style: italic; font-size: 16pt; margin: 0 0 10px; font-weight: bold;">Lesson Notes: ${lesson.title}</h2>
                    <p style="font-size: 11pt; margin: 0;">${new Date().toLocaleDateString()}</p>
                </div>
                
                <style>
                    .pdf-text { font-size: 14pt; line-height: 1.6; }
                    .pdf-text h1 { font-size: 24pt; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid black; padding-bottom: 5px; margin-top: 30px; }
                    .pdf-text h2 { font-size: 18pt; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid black; padding-bottom: 5px; margin-top: 25px; }
                    .pdf-text h3 { font-size: 14pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
                    .pdf-text p { margin-bottom: 15px; }
                    .pdf-text ul, .pdf-text ol { margin-bottom: 15px; padding-left: 30px; }
                    .pdf-text li { margin-bottom: 8px; }
                    .pdf-text blockquote { border-left: 4px solid #000; padding: 10px 20px; font-style: italic; background-color: #f9f9f9; margin: 20px 0; }
                    .pdf-text pre { background-color: #f0f0f0; padding: 15px; font-family: monospace; font-size: 11pt; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; margin: 20px 0; border-radius: 4px; }
                    .pdf-text code { font-family: monospace; font-size: 11pt; background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; color: #d32f2f; }
                    .pdf-text img { max-width: 100%; height: auto; }
                </style>
                <div class="pdf-text">
        `;

        blocks.forEach(block => {
            if (block.type === 'text') {
                // Ensure raw text does not trigger color overrides by isolating styles.
                htmlContent += `<div style="margin-bottom: 30px; page-break-inside: avoid; color: black;">${proxifyHtmlImages(block.content.html)}</div>`;
            } else if (block.type === 'image') {
                htmlContent += `
                    <div style="margin: 30px 0; text-align: center; page-break-inside: avoid;">
                        <img src="${getProxiedUrl(block.content?.url)}" crossorigin="anonymous" style="max-width: 100%; max-height: 500px; display: block; margin: 0 auto; border: 1px solid #ddd; padding: 4px; background: white;" alt="Lesson Visual" />
                        ${block.content?.caption ? `<p style="font-size: 11pt; color: #555; margin-top: 10px; font-style: italic;">Visual Reference: ${block.content.caption}</p>` : ''}
                    </div>
                `;
            }
        });

        htmlContent += `
                </div>
            </div>
        `;

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                imageTimeout: 15000
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opt).from(htmlContent).save();
        } catch (err) {
            console.error("PDF generation failed", err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-5 mt-10 animate-in fade-in duration-500">
                <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }
    if (error) return <div className="max-w-4xl mx-auto p-5 bg-red-50 text-school-primary font-semibold rounded-xl border border-red-100 shadow-sm shadow-red-50/50 mt-10">{error}</div>;
    if (!lesson) return <div className="max-w-4xl mx-auto p-5 bg-gray-50 text-gray-400 font-semibold rounded-xl border border-gray-100 mt-10">Lesson not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-5 pb-32 mt-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 print:mt-0 print:pb-0 print:max-w-full">

            <style>{`
                /* Print and Direct PDF Download Styles */
                @media print {
                    @page { margin: 2cm; }
                    body {
                        font-family: 'Times New Roman', Times, serif !important;
                        background-color: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    .print-document {
                        border: 2px solid black;
                        padding: 40px;
                        margin: 0;
                        box-sizing: border-box;
                    }
                }

                /* PDF GENERATOR SPECIFIC CLASSES */
                .pdf-active {
                    font-family: 'Times New Roman', Times, serif !important;
                    background-color: white !important;
                    color: black !important;
                    padding: 40px !important;
                    border: 2px solid black !important;
                    border-radius: 0 !important;
                }
                .pdf-active .no-print { display: none !important; }
                .pdf-active .print-header { display: block !important; }
                .pdf-active .print-text { color: black !important; }
                .pdf-active .print-text * { color: black !important; }
                
                .print-text {
                    font-size: 14pt !important;
                    line-height: 1.6 !important;
                    page-break-inside: avoid;
                }
                .print-text h1, .print-text h2, .print-text h3 {
                    border-bottom: 1px solid black;
                    padding-bottom: 5px;
                    margin-top: 15px !important;
                    margin-bottom: 10px !important;
                }
                .print-header {
                    text-align: center;
                    border-bottom: 3px double black;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                }
            `}</style>

            <div id="lesson-pdf-content" className="print-document">

                {/* Print-Only Academic Header */}
                <div className="hidden print-header">
                    {schoolSettings?.logo_url && <img src={getMediaUrl(schoolSettings.logo_url)} alt="School Logo" className="h-24 mx-auto mb-4 grayscale" />}
                    <h1 className="text-3xl font-bold uppercase tracking-widest">{schoolSettings?.school_name || "Academic Institution"}</h1>
                    <h2 className="text-xl font-semibold mt-4 italic">Lesson Notes: {lesson.title}</h2>
                    <p className="text-sm mt-2">{new Date().toLocaleDateString()}</p>
                </div>

                {/* Premium Header Architecture (Screen Only) */}
                <div data-html2canvas-ignore="true" className="no-print bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl group-hover:bg-school-primary/10 transition-all duration-1000 -mr-32 -mt-32"></div>
                    <div className="relative z-10 w-full">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-[10px] text-gray-400 hover:text-school-primary mb-6 flex items-center gap-3 font-semibold uppercase transition-all group/back"
                        >
                            <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover/back:bg-school-primary group-hover/back:text-white transition-all transform group-hover/back:-translate-x-1">&larr;</span>
                            Back to Subject
                        </button>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight max-w-2xl">{lesson.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 mt-6">
                            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-school-secondary animate-pulse"></span>
                                <span className="text-xs font-bold text-school-secondary uppercase tracking-widest">Lesson #{lesson.id.toString().padStart(4, '0')}</span>
                            </div>
                            {!lesson.is_published && (
                                <span className="bg-school-accent text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest ring-1 ring-yellow-200">
                                    Preview (Unpublished)
                                </span>
                            )}

                            <div className="flex-1"></div>

                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGeneratingPDF}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-school-primary transition-colors shadow-sm shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingPDF ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        GENERATING PDF...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lesson Blocks (Continuous Stream View) */}
                <div className="space-y-4 md:space-y-8 mt-10">
                    {blocks.map((block) => {
                        let cardClasses = "";

                        // Treat Text strictly as a continuous document flow (no borders, no backgrounds)
                        if (block.type === 'text') {
                            cardClasses = "py-4 md:py-6";
                        } else {
                            // Interactive widgets (Quizzes, Videos) pop out as cards
                            cardClasses = "p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white border border-gray-100 my-10 relative overflow-hidden";
                        }

                        return (
                            <div id={`block-${block.id}`} key={block.id} className="block-container group/block" data-html2canvas-ignore={['youtube', 'video', 'code_editor', 'quiz'].includes(block.type) ? "true" : undefined}>

                                {/* TEXT BLOCK */}
                                {block.type === 'text' && (
                                    <div className={`${cardClasses} print-text`}>
                                        <div
                                            className="text-[18px] text-gray-800 leading-[1.8] font-medium 
                                                [&>h1]:text-4xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:text-gray-900 [&>h1]:tracking-tight
                                                [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-12 [&>h2]:mb-6 [&>h2]:pb-2 [&>h2]:flex [&>h2]:items-center [&>h2]:gap-3
                                                [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-gray-900 [&>h3]:mt-10 [&>h3]:mb-4 
                                                [&>p]:mb-8 [&>p:last-child]:mb-0 
                                                [&>ul]:list-none [&>ul]:pl-0 [&>ul]:mb-8 [&>ul]:space-y-4 [&>ul>li]:relative [&>ul>li]:pl-8 [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-2 [&>ul>li]:before:top-[12px] [&>ul>li]:before:w-2 [&>ul>li]:before:h-2 [&>ul>li]:before:bg-school-primary [&>ul>li]:before:rounded-full [&>ul>li]:before:shadow-[0_0_8px_var(--school-primary)]
                                                [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:mb-8 [&>ol]:space-y-4 [&>ol>li]:pl-2 [&>ol>li::marker]:font-bold [&>ol>li::marker]:text-school-primary
                                                [&>strong]:text-gray-900 [&>strong]:bg-gray-100 [&>strong]:px-1.5 [&>strong]:py-0.5 [&>strong]:rounded-md
                                                [&>blockquote]:border-l-4 [&>blockquote]:border-school-primary [&>blockquote]:bg-school-primary/[0.04] [&>blockquote]:py-6 [&>blockquote]:pr-6 [&>blockquote]:pl-8 [&>blockquote]:italic [&>blockquote]:my-10 [&>blockquote]:rounded-r-2xl [&>blockquote]:text-gray-900 [&>blockquote]:font-semibold
                                                [&>pre]:bg-gray-950 [&>pre]:text-indigo-200 [&>pre]:p-6 [&>pre]:rounded-2xl [&>pre]:overflow-x-auto [&>pre]:my-8 [&>pre]:text-[15px] [&>pre]:ring-1 [&>pre]:ring-white/10 [&>pre]:shadow-xl
                                                [&_code]:font-mono [&_code]:text-[15px] [&_code]:bg-gray-100 [&_code]:text-red-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md
                                                [&>pre>code]:bg-transparent [&>pre>code]:text-inherit [&>pre>code]:px-0 [&>pre>code]:py-0"
                                            dangerouslySetInnerHTML={{ __html: block.content.html }}
                                        />
                                    </div>
                                )}

                                {/* IMAGE BLOCK */}
                                {block.type === 'image' && (
                                    <div className={`${cardClasses} p-5 flex flex-col items-center bg-gray-50/20 group-hover/block:bg-white`}>
                                        <div className="w-full relative group/img overflow-hidden rounded-xl shadow-sm shadow-gray-200 ring-8 ring-white">
                                            <img
                                                src={getMediaUrl(block.content.url)}
                                                alt={block.content.caption || 'Lesson visual'}
                                                className="w-full h-auto object-contain max-h-[700px] transition-all duration-1000 group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                        </div>
                                        {block.content.caption && (
                                            <div className="mt-8 px-5 py-3 bg-white rounded-2xl shadow-lg border border-gray-100 text-xs font-semibold text-gray-400 group-hover:text-school-primary transition-colors">
                                                Visual Reference: {block.content.caption}
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
                                        if (url.length === 11) return url;
                                        return url.split('v=')[1]?.substring(0, 11) || '';
                                    };
                                    const videoId = getYouTubeId(block.content.url);

                                    return (
                                        <div className={`${cardClasses} p-4 bg-gray-950 ring-black shadow-black/20`}>
                                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-sm shadow-black/60 ring-4 ring-white/10 group-hover/block:ring-school-primary/40 transition-all duration-700">
                                                {videoId ? (
                                                    <iframe
                                                        className="w-full h-full"
                                                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=0`}
                                                        title="Lesson Video"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                                                        <span className="font-black text-xs">Video unavailable</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* TIKTOK BLOCK */}
                                {block.type === 'tiktok' && (() => {
                                    const getTikTokId = (url) => {
                                        const matches = url?.match(/\/video\/(\d+)/);
                                        return matches ? matches[1] : null;
                                    };
                                    const videoId = getTikTokId(block.content.url);

                                    return (
                                        <div className={`${cardClasses} p-5 bg-gray-50/30 flex flex-col items-center hover:bg-white`}>
                                            <div className="w-full max-w-[325px] flex justify-center">
                                                {videoId ? (
                                                    <blockquote 
                                                        className="tiktok-embed" 
                                                        cite={block.content.url} 
                                                        data-video-id={videoId} 
                                                        style={{ maxWidth: '605px', minWidth: '325px' }}
                                                    >
                                                        <section>
                                                            <a target="_blank" title="Check on TikTok" href={block.content.url}>TikTok Video</a>
                                                        </section>
                                                    </blockquote>
                                                ) : (
                                                   <div className="w-full h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold uppercase text-[10px]">
                                                       Invalid TikTok URL
                                                   </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}


                                {block.type === 'video' && (() => {
                                    const isTikTok = (url) => {
                                        if (!url) return false;
                                        return url.includes('tiktok.com');
                                    };

                                    if (isTikTok(block.content.url)) {
                                        // TikTok Embed Logic
                                        const getTikTokId = (url) => {
                                            const matches = url.match(/\/video\/(\d+)/);
                                            return matches ? matches[1] : null;
                                        };
                                        const videoId = getTikTokId(block.content.url);

                                        return (
                                            <div className={`${cardClasses} p-5 bg-gray-50/30 flex flex-col items-center hover:bg-white`}>
                                                <div className="w-full max-w-[325px] flex justify-center">
                                                    {videoId ? (
                                                        <blockquote 
                                                            className="tiktok-embed" 
                                                            cite={block.content.url} 
                                                            data-video-id={videoId} 
                                                            style={{ maxWidth: '605px', minWidth: '325px' }}
                                                        >
                                                            <section>
                                                                <a target="_blank" title="Check on TikTok" href={block.content.url}>TikTok Video</a>
                                                            </section>
                                                        </blockquote>
                                                    ) : (
                                                       <div className="w-full h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 font-bold uppercase text-[10px]">
                                                           Invalid TikTok URL
                                                       </div>
                                                    )}
                                                </div>
                                                {block.content.caption && (
                                                    <p className="mt-8 text-xs font-semibold text-gray-400 group-hover:text-school-secondary transition-colors text-center">
                                                        {block.content.caption}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className={`${cardClasses} p-5 bg-gray-50/30 flex flex-col items-center hover:bg-white`}>
                                            <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-sm shadow-gray-200 ring-8 ring-white transition-transform duration-700 group-hover/block:scale-[1.01]">
                                                <video
                                                    key={block.content.url}
                                                    controls
                                                    className="w-full aspect-video"
                                                    poster=""
                                                >
                                                    <source src={getMediaUrl(block.content.url)} />
                                                    Your browser does not support video.
                                                </video>
                                            </div>
                                            {block.content.caption && (
                                                <p className="mt-8 text-xs font-semibold text-gray-400 group-hover:text-school-secondary transition-colors">
                                                    Caption: {block.content.caption}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* INTERACTIVE QUIZ BLOCK */}
                                {block.type === 'quiz' && (
                                    <Card className="p-6 border-none shadow-sm/50 bg-white rounded-2xl border border-indigo-100 group/quiz relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-school-secondary/5 rounded-full blur-3xl group-hover/quiz:bg-school-secondary/10 transition-all duration-1000"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-10">
                                                <div className="w-14 h-14 rounded-2xl bg-school-secondary text-white flex items-center justify-center shadow-sm shadow-indigo-200 group-hover/quiz:rotate-12 group-hover/quiz:scale-110 transition-all duration-500">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <h3 className="text-[11px] font-semibold text-school-secondary">Quiz</h3>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900 mb-12 leading-tight">{block.content.question}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {block.content.options.map((option, index) => {
                                                    if (!option) return null;

                                                    const isAnswered = !!quizState[block.id];
                                                    const isSelected = quizState[block.id]?.selected === option;
                                                    const isCorrectAnswer = option === block.content.correct_answer;

                                                    let buttonStyle = "bg-gray-50 border-gray-100 hover:border-school-secondary/40 text-gray-900 hover:bg-white hover:shadow-sm hover:-translate-y-1";

                                                    if (isAnswered) {
                                                        if (isSelected && isCorrectAnswer) {
                                                            buttonStyle = "bg-school-secondary text-white border-school-secondary shadow-sm shadow-indigo-200 ring-4 ring-indigo-100 ring-offset-4 scale-[1.02]";
                                                        } else if (isSelected && !isCorrectAnswer) {
                                                            buttonStyle = "bg-school-primary text-white border-school-primary shadow-sm shadow-red-200 ring-4 ring-red-100 ring-offset-4 scale-[1.02]";
                                                        } else if (isCorrectAnswer) {
                                                            buttonStyle = "bg-emerald-50 text-emerald-700 border-dashed border-emerald-300 opacity-80 cursor-default";
                                                        } else {
                                                            buttonStyle = "opacity-20 border-gray-200 text-gray-400 bg-gray-50/50 cursor-not-allowed";
                                                        }
                                                    }

                                                    return (
                                                        <button
                                                            key={index}
                                                            disabled={isAnswered}
                                                            onClick={() => handleQuizSubmit(block.id, option, block.content.correct_answer)}
                                                            className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all duration-500 font-semibold uppercase text-sm flex justify-between items-center group/btn ${buttonStyle}`}
                                                        >
                                                            <span className="flex-1 pr-4">{option}</span>
                                                            <div className="flex-shrink-0">
                                                                {isAnswered && isSelected && isCorrectAnswer && (
                                                                    <div className="w-8 h-8 rounded-full bg-white text-school-secondary flex items-center justify-center shadow-lg animate-in zoom-in group-hover:rotate-12">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                    </div>
                                                                )}
                                                                {isAnswered && isSelected && !isCorrectAnswer && (
                                                                    <div className="w-8 h-8 rounded-full bg-white text-school-primary flex items-center justify-center shadow-lg animate-in zoom-in group-hover:-rotate-12">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </div>
                                                                )}
                                                                {!isAnswered && (
                                                                    <div className="w-6 h-6 rounded-full border-2 border-current opacity-20 group-hover/btn:opacity-100 transition-opacity"></div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {quizState[block.id] && (
                                                <div className={`mt-12 p-4 rounded-xl text-[11px] font-semibold text-center animate-in slide-in-from-top-4 duration-500 ${quizState[block.id].isCorrect ? 'text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-50/50' : 'text-school-primary bg-red-50 border border-red-100 shadow-sm shadow-red-50/50'}`}>
                                                    <div className="flex items-center justify-center gap-4">
                                                        <span className={`w-3 h-3 rounded-full ${quizState[block.id].isCorrect ? 'bg-emerald-500 animate-ping' : 'bg-school-primary animate-pulse'}`} />
                                                        {quizState[block.id].isCorrect ? 'Correct! Well done.' : 'Incorrect. The right answer is highlighted.'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* INTERACTIVE CODE EXERCISE BLOCK */}
                                {block.type === 'code_editor' && (
                                    <div className={`${cardClasses} overflow-hidden rounded-2xl border-none shadow-sm shadow-gray-200/50 bg-gray-950 ring-1 ring-white/5 group-hover/block:ring-school-primary/30`}>
                                        <div className="p-5 bg-gray-900 text-white border-b border-white/5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-school-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-school-primary text-white flex items-center justify-center shadow-sm shadow-red-200/20 group-hover/block:scale-110 transition-transform duration-500">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                                    </div>
                                                    <h3 className="text-[11px] font-semibold text-red-100">Code Exercise</h3>
                                                </div>
                                                <p className="text-gray-300 font-bold tracking-tight text-xl leading-relaxed max-w-3xl">{block.content.instructions}</p>
                                            </div>
                                        </div>
                                        <div className="h-[500px] w-full bg-gray-950 relative">
                                            <div className="absolute top-6 right-8 z-20 flex items-center gap-4">
                                                <span className="text-[10px] font-medium text-white/30 bg-white/5 px-4 py-1 rounded-full">Language: {block.content.language || 'html'}</span>
                                            </div>
                                            <Editor
                                                height="100%"
                                                language={block.content.language || 'html'}
                                                theme="vs-dark"
                                                defaultValue={block.content.initial_code || ''}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 18,
                                                    lineNumbers: 'on',
                                                    renderLineHighlight: 'all',
                                                    cursorStyle: 'block',
                                                    scrollBeyondLastLine: false,
                                                    padding: { top: 32, bottom: 32 },
                                                    fontFamily: '"Fira Code", monospace',
                                                    fontLigatures: true
                                                }}
                                            />
                                        </div>
                                        <div className="p-4 bg-gray-900 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                                            <div className="flex gap-4">
                                                <div className="w-3 h-3 rounded-full bg-red-500/50 group-hover/block:bg-red-500 transition-colors shadow-lg shadow-red-500/20"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/50 group-hover/block:bg-yellow-500 transition-colors shadow-lg shadow-yellow-500/20"></div>
                                                <div className="w-3 h-3 rounded-full bg-indigo-500/50 group-hover/block:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"></div>
                                            </div>
                                            <Button
                                                className="w-full sm:w-auto bg-school-primary text-white font-semibold uppercase text-[11px] px-5 py-5 rounded-2xl shadow-sm shadow-red-900/40 hover:-translate-y-2 hover:scale-105 transition-all duration-500 group-active/block:translate-y-0"
                                            >
                                                <span className="flex items-center gap-3">
                                                    RUN CODE
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>

                {/* Navigation footer architecture */}
                <footer data-html2canvas-ignore="true" className="no-print pt-20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-5 py-6 rounded-lg font-semibold uppercase text-[11px] border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-900 transition-all duration-500 flex items-center gap-4 border"
                    >
                        <span className="text-lg">&larr;</span>
                        ← Previous
                    </Button>
                    <Button
                        onClick={async () => {
                            try {
                                await api.post(`lessons/${id}/complete`);
                                navigate(-1);
                            } catch (err) {
                                console.error("Completion failed", err);
                                navigate(-1); // Go back anyway to not block user
                            }
                        }}
                        className="w-full sm:w-auto px-5 py-6 rounded-lg font-semibold uppercase text-[11px] bg-school-secondary text-white shadow-sm shadow-indigo-200 hover:-translate-y-2 hover:scale-105 active:scale-95 transition-all duration-500 flex items-center gap-4"
                    >
                        Mark as Done & Continue →
                        <span className="text-lg">&rarr;</span>
                    </Button>
                </footer>
            </div>
        </div>
    );
}
