import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import html2pdf from 'html2pdf.js';
import api, { getMediaUrl } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import { CardSkeleton } from '../../components/common/Skeleton';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';

// Provide global access for contrib scripts
window.katex = katex;
window.renderMathInElement = renderMathInElement;

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

    // Silence the findDOMNode warning in development to keep the console clean
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

        // Load TikTok Embed Script
        if (!document.getElementById('tiktok-embed-script')) {
            const script = document.createElement('script');
            script.id = 'tiktok-embed-script';
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.head.appendChild(script);
        }

        // Load KaTeX mhchem for chemical equations
        if (!document.getElementById('katex-mhchem-script')) {
            const script = document.createElement('script');
            script.id = 'katex-mhchem-script';
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, [id]);

    // Re-render math when blocks change
    useEffect(() => {
        if (blocks.length > 0 && typeof window.renderMathInElement === 'function') {
            // Target the main lesson container to find all math symbols
            const container = document.getElementById('lesson-blocks-container');
            if (container) {
                window.renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            }
        }
    }, [blocks]);

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
            
            // Skip proxy for local development URLs (proxy can't see your local machine)
            const isLocalAsset = fixedUrl.includes('localhost') || fixedUrl.includes('127.0.0.1');

            if (fixedUrl.startsWith('data:') || fixedUrl.startsWith('blob:') || fixedUrl.startsWith('/') || isLocalAsset) {
                return fixedUrl;
            }
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
        // Solution: We compile a pure HTML DOM exclusively for the PDF engine with academic standards.
        let htmlContent = `
            <html>
            <head>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;700&display=swap');
                    
                    body { 
                        background-color: white; 
                        margin: 0; 
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                    }

                    /* Content Styling */
                    .page-container {
                        padding: 0.5in;
                        background: white;
                        box-sizing: border-box;
                        font-family: 'Times New Roman', Times, serif;
                        color: #1a1a1a;
                        display: block;
                        width: 100%;
                    }

                    .content {
                        font-size: 12.5pt;
                        line-height: 1.7;
                    }

                    /* Prevent elements from being sliced in half by page breaks */
                    .content > div, 
                    .callout, 
                    .image-container, 
                    table, 
                    h1, h2, h3 { 
                        page-break-inside: avoid; 
                        margin-bottom: 20pt;
                    }

                    .header {
                        text-align: center;
                        border-bottom: 2pt solid #2d3436;
                        padding-bottom: 20px;
                        margin-bottom: 40px;
                    }

                    .school-logo {
                        height: 80px;
                        display: block;
                        margin: 0 auto 10px;
                        object-fit: contain;
                    }

                    .school-name {
                        font-family: 'Inter', sans-serif;
                        font-size: 20pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 3px;
                        margin: 0;
                        color: #000;
                    }

                    .subject-tag {
                        display: inline-block;
                        background: #000;
                        color: #fff;
                        padding: 3pt 10pt;
                        font-family: 'Inter', sans-serif;
                        font-size: 8pt;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-top: 5px;
                    }

                    .lesson-title {
                        font-size: 28pt;
                        font-weight: 700;
                        margin: 20px 0 10px;
                        line-height: 1.1;
                    }

                    .metadata {
                        font-size: 10pt;
                        color: #555;
                        font-style: italic;
                    }

                    .content {
                        font-size: 12.5pt;
                        line-height: 1.7;
                        flex: 1;
                    }

                    /* Professional Typography for Publisher View */
                    h1 { font-size: 24pt; border-bottom: 1pt solid #eee; padding-bottom: 5px; margin-top: 30px; }
                    h2 { font-size: 18pt; margin-top: 25px; color: #2d3436; }
                    h3 { font-size: 14pt; margin-top: 20px; font-weight: bold; }
                    p { margin-bottom: 15pt; }
                    
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20pt 0; 
                        page-break-inside: avoid;
                    }
                    th { background: #f8f9fa; border: 1pt solid #2d3436; padding: 10pt; text-align: left; font-weight: 700; }
                    td { border: 1pt solid #e0e0e0; padding: 10pt; vertical-align: top; }

                    .callout {
                        margin: 20pt 0;
                        padding: 15pt;
                        border-left: 4pt solid #000;
                        background: #fdfdfd;
                        page-break-inside: avoid;
                    }
                    .callout-label {
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: 9pt;
                        margin-bottom: 5pt;
                        display: block;
                    }

                    .math-formula { padding: 10pt; text-align: center; background: #fafafa; margin: 15pt 0; }

                    .image-container {
                        text-align: center;
                        margin: 25pt 0;
                        page-break-inside: avoid;
                    }
                    .image-container img {
                        max-width: 90%;
                        max-height: 4in;
                        border: 0.5pt solid #ddd;
                        padding: 3pt;
                        background: white;
                    }
                    .caption {
                        font-size: 10pt;
                        color: #666;
                        margin-top: 8pt;
                        font-style: italic;
                    }

                    .footer {
                        margin-top: auto;
                        padding-top: 15px;
                        border-top: 1pt solid #eee;
                        display: flex;
                        justify-content: space-between;
                        font-family: 'Inter', sans-serif;
                        font-size: 8pt;
                        color: #999;
                        font-weight: 500;
                    }
                    
                    .page-break { page-break-after: always; }
                    
                    @page { margin: 0; size: letter; }
                </style>
            </head>
            <body>
                <div class="page-container">
                    <div class="header">
                        ${(schoolSettings?.school_logo || schoolSettings?.school_logo_url) 
                            ? `<img src="${getProxiedUrl(schoolSettings.school_logo || schoolSettings.school_logo_url)}" class="school-logo" crossorigin="anonymous" />` 
                            : ''}
                        <h1 class="school-name">${schoolSettings?.school_name || "Academic Institution"}</h1>
                        <div class="subject-tag">Study Reference Material</div>
                        <h2 class="lesson-title">${lesson.title}</h2>
                        <div class="metadata">Department of Curriculum · Printed: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    
                    <div class="content">
        `;

        blocks.forEach((block, index) => {
            if (block.type === 'text') {
                htmlContent += `<div style="margin-bottom: 20pt;">${proxifyHtmlImages(block.content.html)}</div>`;
            } else if (block.type === 'note') {
                htmlContent += `
                    <div class="callout" style="border-color: #3498db; background: #f0f7fd;">
                        <span class="callout-label" style="color: #2980b9;">🎓 Pro-Tip / Note</span>
                        <div style="font-style: italic; color: #34495e;">${block.content.html}</div>
                    </div>
                `;
            } else if (block.type === 'takeaway') {
                htmlContent += `
                    <div class="callout" style="border-color: #f39c12; background: #fef9e7;">
                        <span class="callout-label" style="color: #d35400;">💡 Essential Takeaway</span>
                        <div style="font-weight: 600; color: #7e5109;">${block.content.html}</div>
                    </div>
                `;
            } else if (block.type === 'image') {
                htmlContent += `
                    <div class="image-container">
                        <img src="${getProxiedUrl(block.content?.url)}" crossorigin="anonymous" alt="Visual Reference" />
                        ${block.content?.caption ? `<div class="caption">Figure ${index + 1}: ${block.content.caption}</div>` : ''}
                    </div>
                `;
            } else if (block.type === 'table') {
                const rows = block.content.rows || [];
                const hasHeader = block.content.config?.hasHeader;
                htmlContent += `
                    <table>
                        ${hasHeader ? `
                            <thead>
                                <tr>
                                    ${rows[0].map(cell => `<th>${cell}</th>`).join('')}
                                </tr>
                            </thead>
                        ` : ''}
                        <tbody>
                            ${rows.slice(hasHeader ? 1 : 0).map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        });

        htmlContent += `
                    </div>
                    <div class="footer">
                        <div>© ${new Date().getFullYear()} ${schoolSettings?.school_name || "System"}. All Rights Reserved.</div>
                        <div>Generated via Inkiito LMS v2.0</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const opt = {
            margin: [0.75, 0.75, 0.75, 0.75], // 0.75" Safe Margin (standard is 1", reduced for boarder spacing)
            filename: `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
                imageTimeout: 20000
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            const element = document.createElement('div');
            element.innerHTML = htmlContent;
            document.body.appendChild(element); // Must be in DOM for CSS loading
            
            // Render Math (LaTeX) in the PDF element
            if (typeof window.renderMathInElement === 'function') {
                window.renderMathInElement(element, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            }

            // Wait a bit for assets and KaTeX layout to settle
            await new Promise(r => setTimeout(r, 800));

            const worker = html2pdf().set(opt).from(element);
            
            // Inject Page Borders and Page Numbers using jsPDF hooks
            await worker.toPdf().get('pdf').then((pdf) => {
                const totalPages = pdf.internal.getNumberOfPages();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    
                    // 1. Draw Professional Box Border per page (Discrete)
                    // We draw slightly inside the 1-inch margins
                    pdf.setDrawColor(45, 52, 54); // Dark gray
                    pdf.setLineWidth(0.02);
                    pdf.rect(0.25, 0.25, pageWidth - 0.5, pageHeight - 0.5); // Outer frame
                    pdf.rect(0.30, 0.30, pageWidth - 0.6, pageHeight - 0.6); // Inner thin accent

                    // 2. Page Numbers (Bottom Right)
                    pdf.setFontSize(8);
                    pdf.setTextColor(150);
                    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 0.5, pageHeight - 0.4, { align: 'right' });
                    
                    // 3. School ID (Bottom Left)
                    pdf.text(`© ${schoolSettings?.school_name || "LMS"} Reference Notes`, 0.5, pageHeight - 0.4);
                }
            }).save();

            document.body.removeChild(element);
        } catch (err) {
            console.error("PDF generation failed", err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (isLoading) return <PageLoader message="Calibrating your learning experience..." color="red" />;
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
                <div id="lesson-blocks-container" className="space-y-4 md:space-y-8 mt-10">
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
                                                [&>table]:block [&>table]:w-full [&>table]:overflow-x-auto [&>table]:border-collapse [&>table]:my-8 [&>table]:rounded-xl [&>table]:border [&>table]:border-gray-200
                                                [&_th]:bg-gray-50 [&_th]:text-gray-900 [&_th]:font-bold [&_th]:p-4 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200
                                                [&_td]:p-4 [&_td]:border-b [&_td]:border-gray-100 [&_td]:text-gray-700
                                                [&_tr:last-child_td]:border-0
                                                [&_.ql-formula]:inline-block [&_.ql-formula]:bg-indigo-50 [&_.ql-formula]:px-2 [&_.ql-formula]:py-1 [&_.ql-formula]:rounded [&_.ql-formula]:font-serif
                                                [&>pre>code]:bg-transparent [&>pre>code]:text-inherit [&>pre>code]:px-0 [&>pre>code]:py-0"
                                            dangerouslySetInnerHTML={{ __html: block.content.html }}
                                        />
                                    </div>
                                )}

                                {/* NOTE BLOCK */}
                                {block.type === 'note' && (
                                    <div className="my-10 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 relative overflow-hidden group/note">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover/note:scale-150 transition-transform duration-1000"></div>
                                        <div className="relative z-10 flex gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-200 group-hover/note:rotate-6 transition-transform">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div className="space-y-4 flex-1">
                                                 <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.2em]">Learning Resource Note</h4>
                                                 <div 
                                                     className="text-xl font-medium text-blue-900 leading-relaxed
                                                         [&_a]:text-blue-600 [&_a]:underline [&_a]:font-bold
                                                         [&_strong]:font-black [&_strong]:text-blue-950"
                                                     dangerouslySetInnerHTML={{ __html: block.content.html }} 
                                                 />
                                             </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAKEAWAY BLOCK */}
                                {block.type === 'takeaway' && (
                                    <div className="my-10 p-8 bg-amber-50 rounded-3xl border-2 border-amber-200/50 shadow-xl shadow-amber-900/5 relative overflow-hidden group/takeaway">
                                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover/takeaway:scale-150 transition-transform duration-1000"></div>
                                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                                            <div className="w-20 h-20 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xl shadow-amber-200 ring-8 ring-amber-50 group-hover/takeaway:scale-110 transition-transform duration-500">
                                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="inline-block px-4 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-2">Key Takeaway</div>
                                                <div 
                                                    className="text-2xl font-black text-amber-900 leading-tight
                                                         [&_strong]:text-amber-600"
                                                    dangerouslySetInnerHTML={{ __html: block.content.html || '' }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DATA TABLE BLOCK */}
                                {block.type === 'table' && (
                                    <div className="my-10 overflow-hidden border border-gray-200 rounded-3xl shadow-sm bg-white group/table">
                                        <div className="bg-gray-50/80 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scientific Data Table</span>
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    {block.content.config?.hasHeader && (
                                                        <tr className="bg-indigo-50/30">
                                                            {block.content.rows[0].map((cell, i) => (
                                                                <th key={i} className="px-6 py-4 border-b border-gray-200 text-left text-xs font-black text-indigo-900 uppercase tracking-wider">
                                                                    {cell}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    )}
                                                </thead>
                                                <tbody>
                                                    {block.content.rows.slice(block.content.config?.hasHeader ? 1 : 0).map((row, rIndex) => (
                                                        <tr key={rIndex} className={block.content.config?.striped && rIndex % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                                                            {row.map((cell, cIndex) => (
                                                                <td key={cIndex} className="px-6 py-4 border-b border-gray-100 text-sm text-gray-700 font-medium">
                                                                    {cell}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
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
