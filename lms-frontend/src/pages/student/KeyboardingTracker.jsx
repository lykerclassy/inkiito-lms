import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import confetti from 'canvas-confetti';

const TYPING_CONTENT = {
    beginner: [
        "The quick brown fox jumps over the lazy dog.",
        "Constant practice is the key to mastering the keyboard.",
        "Home row keys are A S D F and J K L semicolon.",
        "Keep your back straight and feet flat on the floor.",
        "Type with all ten fingers for maximum efficiency."
    ],
    computing: [
        "Coding is the language of the future for all learners.",
        "Algorithms are step by step instructions to solve a problem.",
        "Debugging involves finding and fixing errors in your code.",
        "Data structures help organize information in a computer.",
        "Cloud computing allows us to store files on the internet."
    ],
    science: [
        "Photosynthesis is how plants turn sunlight into energy.",
        "The solar system consists of eight planets and the sun.",
        "Water boils at one hundred degrees Celsius at sea level.",
        "Gravity is the force that pulls objects toward the earth.",
        "Cells are the basic building blocks of all living things."
    ],
    motivation: [
        "Success is the sum of small efforts repeated every day.",
        "The best way to predict the future is to create it.",
        "Do not stop until you are proud of your progress today.",
        "Mistakes are proof that you are trying your very best.",
        "Education is the most powerful weapon to change the world."
    ]
};

export default function KeyboardingTracker() {
    const [targetText, setTargetText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    const [stats, setStats] = useState({ wpm: 0, accuracy: 0 });
    const [history, setHistory] = useState([]);
    const [globalStats, setGlobalStats] = useState(null);
    const [category, setCategory] = useState("beginner");
    const [testResult, setTestResult] = useState(null); // { wpm, accuracy, duration }

    const inputRef = useRef(null);

    useEffect(() => {
        const categories = Object.keys(TYPING_CONTENT);
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        setCategory(randomCat);
        setTargetText(TYPING_CONTENT[randomCat][Math.floor(Math.random() * TYPING_CONTENT[randomCat].length)]);
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            const res = await api.get('/typing-scores');
            setHistory(res.data.scores || []);
            setGlobalStats(res.data.stats || null);
        } catch (err) {
            console.error(err);
        }
    };

    const startTest = () => {
        setUserInput("");
        setStartTime(Date.now());
        setIsFinished(false);
        setTestResult(null);

        // Pick a truly random category and text each time
        const categories = Object.keys(TYPING_CONTENT);
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const texts = TYPING_CONTENT[randomCat];
        let newText = texts[Math.floor(Math.random() * texts.length)];

        // Ensure it's not the exact same text twice in a row
        while (newText === targetText) {
            newText = texts[Math.floor(Math.random() * texts.length)];
        }

        setCategory(randomCat);
        setTargetText(newText);
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const handleInput = (e) => {
        const value = e.target.value;
        setUserInput(value);

        if (value.length === targetText.length) {
            finishTest(value);
        }
    };

    const finishTest = async (finalInput) => {
        const endTime = Date.now();
        const durationMinutes = (endTime - startTime) / 60000;
        const durationSeconds = Math.floor((endTime - startTime) / 1000);

        // Calculate WPM: (chars / 5) / minutes
        const wpm = Math.round((targetText.length / 5) / durationMinutes);

        // Calculate Accuracy
        let correctChars = 0;
        for (let i = 0; i < targetText.length; i++) {
            if (targetText[i] === finalInput[i]) correctChars++;
        }
        const accuracy = parseFloat(((correctChars / targetText.length) * 100).toFixed(1));

        setStats({ wpm, accuracy });
        setIsFinished(true);
        setStartTime(null);
        setTestResult({ wpm, accuracy, duration: durationSeconds });

        // Launch Celebration!
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2563eb', '#10b981', '#f59e0b']
        });

        // Save to backend... (rest of old logic follows)
        try {
            await api.post('/typing-scores', {
                wpm,
                accuracy,
                duration_seconds: durationSeconds
            });
            fetchUserStats();
        } catch (err) {
            console.error("Failed to save typing score", err);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Testing Area */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Keyboarding Speed Test</h2>
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                Category: {category}
                            </span>
                        </div>
                        <Button variant="outline" onClick={startTest}>
                            {isFinished ? "Try New Text" : "Restart"}
                        </Button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 font-mono text-lg leading-relaxed select-none">
                        {targetText.split("").map((char, i) => {
                            let color = "text-gray-400";
                            if (i < userInput.length) {
                                color = userInput[i] === char ? "text-green-600" : "text-red-500 bg-red-50 border-b-2 border-red-500";
                            }
                            return <span key={i} className={color}>{char}</span>;
                        })}
                    </div>

                    {!isFinished ? (
                        <textarea
                            ref={inputRef}
                            value={userInput}
                            onChange={handleInput}
                            disabled={!startTime}
                            placeholder={startTime ? "Type the text above..." : "Click 'Start Test' button to begin..."}
                            className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono resize-none transition-all"
                        />
                    ) : (
                        <div className="bg-blue-600 rounded-xl p-8 text-white grid grid-cols-2 gap-8 text-center animate-in fade-in zoom-in duration-300">
                            <div>
                                <span className="block text-4xl font-bold">{stats.wpm}</span>
                                <span className="text-blue-100 text-sm uppercase tracking-wider font-semibold">Words Per Minute</span>
                            </div>
                            <div>
                                <span className="block text-4xl font-bold">{stats.accuracy}%</span>
                                <span className="text-blue-100 text-sm uppercase tracking-wider font-semibold">Accuracy</span>
                            </div>
                        </div>
                    )}

                    {!startTime && !isFinished && (
                        <div className="mt-4">
                            <Button variant="primary" className="w-full py-4 text-lg" onClick={startTest}>Start Typing Test Now</Button>
                        </div>
                    )}
                </Card>

                {/* Celebration Modal */}
                {testResult && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white relative">
                                <div className="absolute top-4 right-4 text-white/50 text-4xl font-black italic select-none">GREAT!</div>
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-1">Testing Complete!</h3>
                                <p className="text-blue-100 text-sm">Excellent focus and coordination.</p>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                                        <span className="block text-3xl font-black text-gray-900">{testResult.wpm}</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Speed (WPM)</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                                        <span className="block text-3xl font-black text-gray-900">{testResult.accuracy}%</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Accuracy</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 text-blue-700 rounded-xl p-4 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-tight text-blue-800/50">Time Taken</p>
                                        <p className="text-lg font-bold leading-none">{testResult.duration} Seconds</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button variant="primary" className="w-full py-4 text-lg shadow-lg shadow-blue-200" onClick={startTest}>
                                        Try Another Challenge
                                    </Button>
                                    <button
                                        onClick={() => setTestResult(null)}
                                        className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        Close and view history
                                    </button>
                                </div>

                                <p className="text-center mt-6 text-xs text-gray-400 italic">
                                    "Your speed increase of {(testResult.wpm - (globalStats?.average_wpm || 0)) > 0 ? '+' : ''}{testResult.wpm - (globalStats?.average_wpm || 0)} WPM compared to average is a testament to your dedication!"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* History list */}
                {history.length > 0 && (
                    <Card title="Recent Performance">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="pb-3 px-2">Date</th>
                                        <th className="pb-3 px-2 text-center">WPM</th>
                                        <th className="pb-3 px-2 text-center">Accuracy</th>
                                        <th className="pb-3 px-2 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map(row => (
                                        <tr key={row.id}>
                                            <td className="py-3 px-2 text-sm text-gray-600">
                                                {new Date(row.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span className="font-bold text-blue-600">{row.wpm}</span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <span className="text-gray-800">{row.accuracy}%</span>
                                            </td>
                                            <td className="py-3 px-2 text-right text-gray-400 text-xs">
                                                {row.duration_seconds}s
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                <Card className="bg-gradient-to-br from-blue-700 to-blue-900 border-none shadow-xl text-white">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Career Progress
                    </h3>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-blue-600 pb-2">
                            <div>
                                <span className="text-blue-200 text-xs uppercase font-bold tracking-widest block mb-1">Lifetime Average</span>
                                <span className="text-3xl font-black">{globalStats?.average_wpm || 0} <small className="text-sm font-normal text-blue-300">WPM</small></span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-b border-blue-600 pb-2">
                            <div>
                                <span className="text-blue-200 text-xs uppercase font-bold tracking-widest block mb-1">Peak Speed</span>
                                <span className="text-3xl font-black">{globalStats?.max_wpm || 0} <small className="text-sm font-normal text-blue-300">WPM</small></span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-b border-blue-600 pb-2">
                            <div>
                                <span className="text-blue-200 text-xs uppercase font-bold tracking-widest block mb-1">Overall Accuracy</span>
                                <span className="text-3xl font-black">{globalStats?.average_accuracy || 0}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-white/10 rounded-xl text-sm leading-relaxed text-blue-100">
                        <p>💡 Tip: Focus on accuracy first. Speed will naturally follow as your fingers build muscle memory.</p>
                    </div>
                </Card>

                <Card title="Lab Requirements">
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                            <p className="text-sm text-gray-600">Complete at least 5 speed tests this term.</p>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                            <p className="text-sm text-gray-600">Maintain an average accuracy above 95%.</p>
                        </li>
                    </ul>
                </Card>
            </div>

        </div>
    );
}
