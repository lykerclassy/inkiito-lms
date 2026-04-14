import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageLoader from '../../components/common/PageLoader';
import api, { getMediaUrl } from '../../services/api';
import BlocklySandbox from '../../components/student/BlocklySandbox';

const ICT_MODULES = [
    {
        id: 'parts',
        title: 'Computer Parts & Hardware',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
        ),
        description: 'Learn to identify and understand the role of essential computer components.',
        color: 'blue'
    },
    {
        id: 'coding',
        title: 'Block-Based Coding Logic',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        description: 'Understand the fun of programming through logic blocks and sequences.',
        color: 'purple'
    },
    {
        id: 'safety',
        title: 'Internet Safety & Ethics',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        description: 'Study how to be a responsible, safe, and respectful digital citizen.',
        color: 'green'
    }
];

export default function ICTLab() {
    const [selectedModule, setSelectedModule] = useState(null);
    const [hardwareParts, setHardwareParts] = useState([]);
    const [idGame, setIdGame] = useState({ active: false, currentPart: null, score: 0, feedback: null });
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const startVoiceIdentify = () => {
        if (!window.isSecureContext) {
            alert("Speech Recognition requires a secure connection (HTTPS). Please use HTTPS.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            // Find closest match or exact match
            const spokenPart = hardwareParts.find(p => transcript.includes(p.name.toLowerCase()));
            if (spokenPart) {
                handleIdentify(spokenPart.name);
            } else {
                setIdGame(prev => ({ ...prev, feedback: { type: 'error', message: `I heard "${transcript}", but that's not it!` } }));
                setTimeout(() => setIdGame(prev => ({ ...prev, feedback: null })), 1500);
            }
        };
        recognition.start();
    };

    useEffect(() => {
        fetchHardware();
    }, []);

    const fetchHardware = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('hardware-items');
            // Ensure compatibility with existing img property vs image_url
            const formatted = res.data.map(item => ({
                ...item,
                image: getMediaUrl(item.image_url) // alias image_url to image with production URL fix
            }));
            setHardwareParts(formatted);
        } catch (err) {
            console.error("Failed to fetch hardware", err);
        } finally {
            setIsLoading(false);
        }
    };

    const startIdentificationGame = () => {
        if (hardwareParts.length === 0) return;
        const randomPart = hardwareParts[Math.floor(Math.random() * hardwareParts.length)];
        setIdGame({ active: true, currentPart: randomPart, score: 0, feedback: null });
    };

    const handleIdentify = (partName) => {
        if (partName === idGame.currentPart.name) {
            const nextParts = hardwareParts.filter(p => p.name !== idGame.currentPart.name);
            const nextPart = nextParts.length > 0
                ? nextParts[Math.floor(Math.random() * nextParts.length)]
                : hardwareParts[Math.floor(Math.random() * hardwareParts.length)];

            setIdGame(prev => ({
                ...prev,
                score: prev.score + 10,
                currentPart: nextPart,
                feedback: { type: 'success', message: 'Amazing! That is correct.' }
            }));
        } else {
            setIdGame(prev => ({
                ...prev,
                feedback: { type: 'error', message: 'Not quite! Look at the shape again.' }
            }));
        }
        setTimeout(() => setIdGame(prev => ({ ...prev, feedback: null })), 1500);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 pb-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">ICT Innovation Lab</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Empowering the next generation of digital creators</p>
                </div>
                {selectedModule && (
                    <button
                        onClick={() => setSelectedModule(null)}
                        className="text-xs font-black text-blue-600 flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                    >
                        <span>&larr;</span> Return to Lab Modules
                    </button>
                )}
            </header>

            {!selectedModule ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ICT_MODULES.map((module) => (
                        <Card
                            key={module.id}
                            className={`group cursor-pointer hover:scale-105 transition-all duration-300 border-b-8 border-b-${module.color}-500 shadow-sm overflow-hidden`}
                            onClick={() => setSelectedModule(module)}
                        >
                            <div className="p-4 space-y-4">
                                <div className={`w-9 h-9 rounded-2xl bg-${module.color}-100 text-${module.color}-600 flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                                    {module.icon}
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 leading-tight uppercase tracking-tight">{module.title}</h3>
                                <p className="text-gray-500 text-[11px] font-medium leading-relaxed">
                                    {module.description}
                                </p>
                                <div className={`pt-4 flex items-center gap-2 font-black text-${module.color}-600 text-[10px] uppercase tracking-widest`}>
                                    Initialize Lab Component
                                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="overflow-hidden bg-white shadow-sm border-none">
                        <div className={`h-2 bg-${selectedModule.color}-600`}></div>
                        <div className="p-4 md:p-5">
                            <h2 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-4">
                                <span className={`p-3 bg-${selectedModule.color}-50 text-${selectedModule.color}-600 rounded-xl`}>{selectedModule.icon}</span>
                                {selectedModule.title}
                            </h2>

                            {selectedModule.id === 'parts' && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {isLoading ? (
                                            <PageLoader message="Scanning hardware inventory..." color="blue" />
                                        ) : hardwareParts.map((part, i) => (
                                            <div key={i} className="group border border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg transition-all bg-white relative">
                                                <div className="h-48 overflow-hidden bg-gray-100 relative">
                                                    <img
                                                        src={part.image}
                                                        alt={part.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={() => {
                                                                const utterance = new SpeechSynthesisUtterance(part.name + ". " + part.description);
                                                                window.speechSynthesis.speak(utterance);
                                                            }}
                                                            className="p-4 bg-white text-blue-600 rounded-full shadow-sm scale-0 group-hover:scale-100 transition-transform duration-300"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h4 className="text-sm font-semibold text-gray-900">{part.name}</h4>
                                                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">{part.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50/50 rounded-2xl p-4 md:p-5 border-2 border-blue-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
                                            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                        </div>

                                        {!idGame.active ? (
                                            <div className="text-center py-3 space-y-6">
                                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Challenge: Identify the Hardware</h3>
                                                <p className="text-gray-500 max-w-md mx-auto">Ready to test your memory? We'll show you a picture, and you must tell us which part it is!</p>
                                                <Button variant="primary" className="px-4 py-4 text-lg shadow-sm" onClick={startIdentificationGame}>
                                                    Start Identification Challenge
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center bg-white px-6 py-3 rounded-2xl shadow-sm border border-blue-100">
                                                        <span className="text-xs font-semibold text-blue-400">Target Image</span>
                                                        <span className="text-sm font-semibold text-blue-600">Score: {idGame.score}</span>
                                                    </div>
                                                    <div className="aspect-video bg-white rounded-xl overflow-hidden shadow-sm border-4 border-white">
                                                        <img
                                                            src={idGame.currentPart.image}
                                                            alt="Identity missing"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {idGame.feedback && (
                                                        <div className={`p-4 rounded-2xl text-center font-bold animate-bounce ${idGame.feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {idGame.feedback.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-base font-bold text-gray-900 mb-6">Which part is this?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {hardwareParts.map((p, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleIdentify(p.name)}
                                                                className="p-5 bg-white border-2 border-transparent hover:border-blue-500 hover:text-blue-600 font-bold rounded-2xl transition-all shadow-sm text-left group flex items-center justify-between"
                                                            >
                                                                {p.name}
                                                                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={startVoiceIdentify}
                                                            className={`col-span-2 p-5 border-2 border-dashed rounded-2xl font-bold flex items-center justify-center gap-4 transition-all ${isListening ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-blue-200 text-blue-600 hover:border-blue-600 hover:bg-blue-50'}`}
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 3 3 3 0 01-3-3V3a3 3 0 013-3z" /></svg>
                                                            {isListening ? 'Listening...' : 'Say it out loud!'}
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => setIdGame({ ...idGame, active: false })}
                                                        className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all"
                                                    >
                                                        Quit Game
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedModule.id === 'coding' && (
                                <div className="space-y-8 py-3">
                                    <header className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-gray-100 pb-8">
                                        <div className="flex-1 space-y-3">
                                            <h3 className="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase italic">Lab Case: Logic Architecture</h3>
                                            <p className="text-gray-500 font-medium max-w-2xl">Use logical blocks to build a sequence. In programming, the order of instructions is everything! Drag blocks from the toolbox to the workspace to start your experiment.</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-purple-50 px-6 py-4 rounded-3xl border border-purple-100">
                                            <div className="w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg group">
                                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] uppercase font-black text-purple-400">Environment</span>
                                                <span className="text-sm font-black text-purple-900 tracking-tight">JavaScript V8 Sandbox</span>
                                            </div>
                                        </div>
                                    </header>

                                    <BlocklySandbox />
                                </div>
                            )}

                            {selectedModule.id === 'safety' && (
                                <div className="space-y-12 py-6">
                                    {/* Lab Video Resources */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">Lab Cinema: Ethics & Safety</h3>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual lessons for the responsible digital citizen</p>
                                            </div>
                                            <span className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                {hardwareParts.filter(p => p.type === 'safety_video').length} Lessons Available
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {hardwareParts.filter(p => p.type === 'safety_video').map((video, idx) => {
                                                const videoId = video.video_url?.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
                                                return (
                                                    <div key={idx} className="group space-y-4">
                                                        <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-lg border-2 border-transparent group-hover:border-green-500 transition-all relative">
                                                            {videoId ? (
                                                                <iframe
                                                                    className="w-full h-full"
                                                                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                                                                    title={video.name}
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                                                    <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">Cinematic Stream Unavailable</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="px-1">
                                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{video.name}</h4>
                                                            <p className="text-[11px] font-medium text-gray-500 line-clamp-2 mt-2 leading-relaxed">{video.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {hardwareParts.filter(p => p.type === 'safety_video').length === 0 && (
                                                <div className="col-span-full py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400 space-y-3">
                                                    <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No Safety Videos Uploaded Yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lab Guides & Handbooks */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2 space-y-6">
                                            <div className="space-y-1 border-b border-gray-100 pb-4">
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">Lab Library: Code of Conduct</h3>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Downloadable manuals for the digital era</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {hardwareParts.filter(p => p.type === 'safety_guide').map((guide, idx) => (
                                                    <div key={idx} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <div>
                                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight leading-tight">{guide.name}</h4>
                                                                <p className="text-[10px] font-medium text-gray-400 line-clamp-1 mt-1">{guide.description}</p>
                                                            </div>
                                                            <a 
                                                                href={getMediaUrl(guide.file_path)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                Download Guide
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                                {hardwareParts.filter(p => p.type === 'safety_guide').length === 0 && (
                                                    <div className="col-span-full py-12 bg-gray-50/50 border border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400 space-y-3">
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Handbooks coming soon...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-green-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                                <div className="relative z-10 space-y-6">
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                                                        🛡️
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black uppercase tracking-widest italic">The SMART Citizen</h4>
                                                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Our Ethics Protocol</p>
                                                    </div>
                                                    <div className="space-y-3 border-t border-white/20 pt-4">
                                                        <p className="text-[10px] font-black uppercase"><span className="bg-white text-green-600 px-2 py-1 rounded-lg mr-2">S</span> Stay Safe</p>
                                                        <p className="text-[10px] font-black uppercase"><span className="bg-white text-green-600 px-2 py-1 rounded-lg mr-2">M</span> Never Meet Up</p>
                                                        <p className="text-[10px] font-black uppercase"><span className="bg-white text-green-600 px-2 py-1 rounded-lg mr-2">A</span> Accepting Files?</p>
                                                        <p className="text-[10px] font-black uppercase"><span className="bg-white text-green-600 px-2 py-1 rounded-lg mr-2">R</span> Reliable Sources</p>
                                                        <p className="text-[10px] font-black uppercase"><span className="bg-white text-green-600 px-2 py-1 rounded-lg mr-2">T</span> Tell Someone</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black">1.1</div>
                            <span className="text-xs font-bold text-gray-500">Introduction</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-black">1.2</div>
                            <span className="text-xs font-bold text-gray-400">Lab Hands-on</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-black">1.3</div>
                            <span className="text-xs font-bold text-gray-400">Digital Quiz</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-black">🏆</div>
                            <span className="text-xs font-bold text-gray-400">Certificate</span>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-blue-600 rounded-3xl p-4 text-white flex flex-col md:flex-row items-center justify-between shadow-sm shadow-blue-200">
                <div className="space-y-2 mb-6 md:mb-0">
                    <h3 className="text-base font-bold">Ready for Lab Practical?</h3>
                    <p className="text-blue-100 font-medium">Head over to the physical lab to start your hands-on exercises.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-center border border-white/30">
                        <span className="block text-base font-bold">12/15</span>
                        <span className="text-[10px] uppercase font-bold text-blue-100">Lab Capacity</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-center border border-white/30">
                        <span className="block text-base font-bold text-green-300">OPEN</span>
                        <span className="text-[10px] uppercase font-bold text-blue-100">Lab Status</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
