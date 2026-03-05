import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

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

    useEffect(() => {
        fetchHardware();
    }, []);

    const fetchHardware = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/hardware-items');
            // Ensure compatibility with existing img property vs image_url
            const formatted = res.data.map(item => ({
                ...item,
                image: item.image_url // alias image_url to image for compatibility
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
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">ICT Innovation Lab</h1>
                    <p className="text-gray-500 font-medium">Empowering the next generation of digital creators.</p>
                </div>
                {selectedModule && (
                    <button
                        onClick={() => setSelectedModule(null)}
                        className="text-blue-600 font-bold flex items-center gap-2 hover:underline"
                    >
                        &larr; Back to Modules
                    </button>
                )}
            </header>

            {!selectedModule ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {ICT_MODULES.map((module) => (
                        <Card
                            key={module.id}
                            className={`group cursor-pointer hover:scale-105 transition-all duration-300 border-b-8 border-b-${module.color}-500 shadow-xl overflow-hidden`}
                            onClick={() => setSelectedModule(module)}
                        >
                            <div className="p-8 space-y-4">
                                <div className={`w-16 h-16 rounded-2xl bg-${module.color}-100 text-${module.color}-600 flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                                    {module.icon}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 leading-tight">{module.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {module.description}
                                </p>
                                <div className={`pt-4 flex items-center gap-2 font-bold text-${module.color}-600 text-sm`}>
                                    Start Exploring Lab
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="overflow-hidden bg-white shadow-2xl border-none">
                        <div className={`h-2 bg-${selectedModule.color}-600`}></div>
                        <div className="p-8 md:p-12">
                            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                                <span className={`p-3 bg-${selectedModule.color}-50 text-${selectedModule.color}-600 rounded-xl`}>{selectedModule.icon}</span>
                                {selectedModule.title}
                            </h2>

                            {selectedModule.id === 'parts' && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {isLoading ? (
                                            <div className="col-span-full py-10 text-center text-gray-400 font-bold">Scanning hardware inventory...</div>
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
                                                            className="p-4 bg-white text-blue-600 rounded-full shadow-xl scale-0 group-hover:scale-100 transition-transform duration-300"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h4 className="text-xl font-black text-gray-900">{part.name}</h4>
                                                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">{part.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50/50 rounded-[3rem] p-8 md:p-12 border-2 border-blue-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                        </div>

                                        {!idGame.active ? (
                                            <div className="text-center py-10 space-y-6">
                                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Challenge: Identify the Hardware</h3>
                                                <p className="text-gray-500 max-w-md mx-auto">Ready to test your memory? We'll show you a picture, and you must tell us which part it is!</p>
                                                <Button variant="primary" className="px-10 py-4 text-lg shadow-xl" onClick={startIdentificationGame}>
                                                    Start Identification Challenge
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center bg-white px-6 py-3 rounded-2xl shadow-sm border border-blue-100">
                                                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Target Image</span>
                                                        <span className="text-lg font-black text-blue-600">Score: {idGame.score}</span>
                                                    </div>
                                                    <div className="aspect-video bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
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
                                                    <h3 className="text-2xl font-black text-gray-900 mb-6">Which part is this?</h3>
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
                                <div className="space-y-12 py-10">
                                    <div className="flex flex-col md:flex-row items-center gap-12">
                                        <div className="flex-1 space-y-6">
                                            <h3 className="text-4xl font-black text-gray-900 leading-tight">Think Like a Programmer</h3>
                                            <p className="text-xl text-gray-600 leading-relaxed">Coding isn't just about typing—it's about logical sequences. Use blocks to tell the computer exactly what to do.</p>

                                            <div className="space-y-4">
                                                <div className="p-4 bg-purple-50 rounded-2xl border-l-8 border-l-purple-600 flex items-center gap-4">
                                                    <span className="text-2xl font-black text-purple-600">1</span>
                                                    <p className="font-bold text-purple-900">SEQUENCE: Putting steps in the right order.</p>
                                                </div>
                                                <div className="p-4 bg-purple-50 rounded-2xl border-l-8 border-l-purple-600 flex items-center gap-4">
                                                    <span className="text-2xl font-black text-purple-600">2</span>
                                                    <p className="font-bold text-purple-900">LOOPS: Repeating actions automatically.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-96 bg-gray-900 rounded-3xl p-8 shadow-2xl relative">
                                            <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-xs font-black animate-bounce">LIVE BLOCKS</div>
                                            <div className="space-y-3 font-mono text-xs">
                                                <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg translate-x-4">WHEN (Game Starts)</div>
                                                <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg translate-x-8">REPEAT (10 times)</div>
                                                <div className="p-3 bg-green-500 text-white rounded-xl shadow-lg translate-x-12">MOVE_FORWARD(10)</div>
                                                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg translate-x-12">PLAY_SOUND("Success")</div>
                                                <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg translate-x-8">END REPEAT</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedModule.id === 'safety' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-6">
                                    <div className="bg-green-50 rounded-3xl p-8 border border-green-100 flex flex-col items-center text-center space-y-4">
                                        <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl mb-4">
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 013 11c0-5.523 4.477-10 10-10s10 4.477 10 10a10.003 10.003 0 01-6.73 9.397m-4 0L9 21m5 0l1-2" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-black text-green-900">The SMART Citizen</h3>
                                        <div className="space-y-3 text-left w-full">
                                            <p className="text-sm font-bold text-green-700">✅ S: Stay Safe - Don't share personal info.</p>
                                            <p className="text-sm font-bold text-green-700">✅ M: Meet up? - Never meet strangers alone.</p>
                                            <p className="text-sm font-bold text-green-700">✅ A: Accepting - Think before you click links.</p>
                                            <p className="text-sm font-bold text-green-700">✅ R: Reliable - Check if info is true.</p>
                                            <p className="text-sm font-bold text-green-700">✅ T: Tell Someone - If something is wrong.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex flex-col justify-center">
                                        <h3 className="text-3xl font-black text-gray-900">Be a Digital Hero</h3>
                                        <p className="text-lg text-gray-600 leading-relaxed">In the ICT lab, we use technology to build, not to break. Respecting copyrights and being kind to others online (Netiquette) are our top priorities.</p>
                                        <Button variant="outline" className="w-fit px-8 py-4 border-2 border-green-600 text-green-600">Download Safety Guide</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-black">1.1</div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Introduction</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-black">1.2</div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lab Hands-on</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-black">1.3</div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digital Quiz</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 opacity-50 grayscale">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 font-black">🏆</div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Certificate</span>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-blue-600 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-blue-200">
                <div className="space-y-2 mb-6 md:mb-0">
                    <h3 className="text-2xl font-black">Ready for Lab Practical?</h3>
                    <p className="text-blue-100 font-medium">Head over to the physical lab to start your hands-on exercises.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-center border border-white/30">
                        <span className="block text-2xl font-black">12/15</span>
                        <span className="text-[10px] uppercase font-bold text-blue-100">Lab Capacity</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl text-center border border-white/30">
                        <span className="block text-2xl font-black text-green-300">OPEN</span>
                        <span className="text-[10px] uppercase font-bold text-blue-100">Lab Status</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
