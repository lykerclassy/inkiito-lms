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
    const [isLoading, setIsLoading] = useState(true);

    const [difficulty, setDifficulty] = useState("beginner"); // "beginner", "intermediate", "advanced"
    const [testDuration, setTestDuration] = useState(30); // 30s for beginner
    const [timeLeft, setTimeLeft] = useState(30);

    const inputRef = useRef(null);
    const userInputRef = useRef("");
    const targetTextRef = useRef("");
    const startTimeRef = useRef(null);
    const isFinishedRef = useRef(false);

    useEffect(() => {
        userInputRef.current = userInput;
        targetTextRef.current = targetText;
        startTimeRef.current = startTime;
        isFinishedRef.current = isFinished;
    });

    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            if (isFinishedRef.current) {
                clearInterval(interval);
                return;
            }

            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = testDuration - elapsed;

            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                finishTest(userInputRef.current, true);
            } else {
                setTimeLeft(remaining);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [startTime]);

    useEffect(() => {
        setupNewTest();
        fetchUserStats();
    }, []);

    const setupNewTest = (newDifficulty = difficulty, newDuration = testDuration) => {
        let selectedCategory;
        let numSentences;

        if (newDifficulty === "beginner") {
            selectedCategory = "beginner";
            numSentences = newDuration <= 30 ? 1 : 2; // Keep paragraphs very short for beginners
        } else if (newDifficulty === "intermediate") {
            const possible = ["beginner", "motivation"];
            selectedCategory = possible[Math.floor(Math.random() * possible.length)];
            numSentences = newDuration <= 30 ? 2 : 4;
        } else {
            const possible = ["computing", "science"];
            selectedCategory = possible[Math.floor(Math.random() * possible.length)];
            numSentences = newDuration <= 60 ? 4 : 8; // Complex/longer paragraphs
        }

        const texts = TYPING_CONTENT[selectedCategory];

        let newTextArray = [];
        // Pull random sentences from the category to build the paragraph length
        for (let i = 0; i < numSentences; i++) {
            newTextArray.push(texts[Math.floor(Math.random() * texts.length)]);
        }

        // Prevent duplicate adjacent sentences
        let finalArray = [];
        newTextArray.forEach((sentence, idx) => {
            if (idx === 0 || finalArray[finalArray.length - 1] !== sentence) {
                finalArray.push(sentence);
            }
        });

        let newText = finalArray.join(" ");

        setDifficulty(newDifficulty);
        setTestDuration(newDuration);
        setCategory(selectedCategory);
        setTargetText(newText);
        setUserInput("");
        setStartTime(null);
        setIsFinished(false);
        setTestResult(null);
        setTimeLeft(newDuration);
        isFinishedRef.current = false;
        startTimeRef.current = null;
    };

    const fetchUserStats = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('typing-scores');
            setHistory(res.data.scores || []);
            setGlobalStats(res.data.stats || null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const startTest = () => {
        setupNewTest();
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const handleInput = (e) => {
        if (isFinishedRef.current) return;

        const value = e.target.value;
        if (!startTime) {
            setStartTime(Date.now());
        }
        setUserInput(value);

        if (value.length >= targetText.length) {
            finishTest(value);
        }
    };

    const finishTest = async (finalInput, isTimeUp = false) => {
        if (isFinishedRef.current) return;
        isFinishedRef.current = true;
        setIsFinished(true);

        const currentTargetText = targetTextRef.current;
        const currentStartTime = startTimeRef.current;

        if (!currentStartTime) return;

        const durationSeconds = isTimeUp ? testDuration : Math.max(1, Math.floor((Date.now() - currentStartTime) / 1000));
        const durationMinutes = durationSeconds / 60;

        // Calculate WPM: (chars / 5) / minutes
        const typedLength = finalInput.length;
        const wpm = durationMinutes > 0 ? Math.round((typedLength / 5) / durationMinutes) : 0;

        // Calculate Accuracy
        let correctChars = 0;
        for (let i = 0; i < typedLength; i++) {
            if (currentTargetText[i] === finalInput[i]) correctChars++;
        }
        const accuracy = typedLength > 0 ? parseFloat(((correctChars / typedLength) * 100).toFixed(1)) : 0;

        setStats({ wpm, accuracy });
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
            await api.post('typing-scores', {
                wpm,
                accuracy,
                duration_seconds: durationSeconds
            });
            fetchUserStats();
        } catch (err) {
            console.error("Failed to save typing score", err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 font-medium uppercase text-sm">Syncing typing profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-12">
            <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight italic uppercase">Keyboarding Excellence</h1>
                <p className="text-gray-500 font-medium mt-1">Master your typing speed and accuracy for the digital age.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Testing Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight italic">Practice Session</h3>
                                <div className={`px-4 py-1.5 rounded-full font-black text-lg transition-colors duration-300 ${!startTime ? 'bg-gray-100 text-gray-400' :
                                    timeLeft > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600 animate-pulse'
                                    }`}>
                                    {!startTime ? `${testDuration}s` : `${timeLeft}s`}
                                </div>
                                <span className="text-xs font-bold text-school-primary bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hidden sm:block">
                                    {category}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
                                {/* Difficulty Selector */}
                                <div className="flex items-center gap-1 border border-gray-200 p-1 rounded-xl bg-gray-50 flex-wrap flex-1 min-w-[200px] sm:flex-none">
                                    {['beginner', 'intermediate', 'advanced'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => !startTime ? setupNewTest(level, testDuration) : null}
                                            disabled={startTime && !isFinished}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${difficulty === level
                                                ? 'bg-white text-school-primary shadow-sm border border-gray-100'
                                                : 'text-gray-400 hover:text-gray-600'
                                                } ${startTime && !isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>

                                {/* Timer Selector */}
                                <div className="flex items-center gap-1 border border-gray-200 p-1 rounded-xl bg-gray-50 flex-wrap flex-1 min-w-[200px] sm:flex-none">
                                    {[15, 30, 60, 120].map(timeSecs => (
                                        <button
                                            key={timeSecs}
                                            onClick={() => !startTime ? setupNewTest(difficulty, timeSecs) : null}
                                            disabled={startTime && !isFinished}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${testDuration === timeSecs
                                                ? 'bg-white text-school-primary shadow-sm border border-gray-100'
                                                : 'text-gray-400 hover:text-gray-600'
                                                } ${startTime && !isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {timeSecs}s
                                        </button>
                                    ))}
                                </div>

                                <Button variant="outline" onClick={startTest} className="w-full sm:w-auto flex-shrink-0 !py-2.5 sm:!py-1.5">
                                    {isFinished ? "Retry" : "Restart"}
                                </Button>
                            </div>
                        </div> {/* This closing div was missing */}

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 text-lg leading-relaxed select-none h-48 overflow-y-auto font-mono custom-scrollbar">
                            {targetText.split("").map((char, i) => {
                                let color = "text-gray-400";
                                if (i < userInput.length) {
                                    color = userInput[i] === char ? "text-emerald-600 bg-emerald-50/50" : "text-red-500 bg-red-100/50 border-b-2 border-red-500";
                                } else if (i === userInput.length && startTime && !isFinished) {
                                    color = "text-gray-800 bg-gray-200 animate-pulse border-b-2 border-gray-800"; // highlight current cursor
                                }
                                return <span key={i} className={color}>{char}</span>;
                            })}
                        </div>

                        {!isFinished ? (
                            <textarea
                                ref={inputRef}
                                value={userInput}
                                onChange={handleInput}
                                disabled={isFinished}
                                placeholder={startTime ? "Keep typing..." : "Click 'Start Test' below, or just click here and start typing to begin the timer!"}
                                className="w-full h-24 p-4 border-2 border-gray-200 font-mono rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg resize-none transition-all shadow-sm"
                            />
                        ) : (
                            <div className="bg-school-primary rounded-xl p-4 text-white grid grid-cols-2 gap-4 text-center animate-in fade-in zoom-in duration-300">
                                <div className="bg-white/10 p-4 rounded-lg">
                                    <span className="block text-5xl font-black mb-1">{stats.wpm}</span>
                                    <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Words Per Minute</span>
                                </div>
                                <div className="bg-white/10 p-4 rounded-lg">
                                    <span className="block text-5xl font-black mb-1">{stats.accuracy}%</span>
                                    <span className="text-white/80 text-xs uppercase tracking-widest font-bold">Accuracy</span>
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
                            <div className="bg-white rounded-3xl shadow-sm max-w-md w-full overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                                <div className="bg-school-primary p-4 text-center text-white relative">
                                    <div className="absolute top-4 right-4 text-white/30 text-xl font-bold italic select-none">TIME UP!</div>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-1">Time's Up!</h3>
                                    <p className="text-white/80 text-sm">{testDuration} seconds completed. See your results below.</p>
                                </div>

                                <div className="p-4">
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                                            <span className="block text-lg font-bold text-gray-900">{testResult.wpm}</span>
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Speed (WPM)</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                                            <span className="block text-lg font-bold text-gray-900">{testResult.accuracy}%</span>
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Accuracy</span>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50 text-emerald-800 rounded-xl p-4 mb-8 flex items-center gap-3 border border-emerald-100">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Time Taken</p>
                                            <p className="text-lg font-bold leading-none">{testResult.duration} Seconds</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button className="w-full py-4 text-lg shadow-lg bg-school-primary text-white" onClick={startTest}>
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
                    <Card className="bg-school-primary border-none shadow-sm text-white">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            Career Progress
                        </h3>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                <div>
                                    <span className="text-white/60 text-[10px] tracking-widest uppercase font-bold block mb-1">Lifetime Average</span>
                                    <span className="text-xl font-bold">{globalStats?.average_wpm || 0} <small className="text-xs font-normal text-white/70 tracking-widest uppercase">WPM</small></span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                <div>
                                    <span className="text-white/60 text-[10px] tracking-widest uppercase font-bold block mb-1">Peak Speed</span>
                                    <span className="text-xl font-bold">{globalStats?.max_wpm || 0} <small className="text-xs font-normal text-white/70 tracking-widest uppercase">WPM</small></span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-white/20 pb-2">
                                <div>
                                    <span className="text-white/60 text-[10px] tracking-widest uppercase font-bold block mb-1">Overall Accuracy</span>
                                    <span className="text-xl font-bold">{globalStats?.average_accuracy || 0}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/10 rounded-xl text-xs font-medium leading-relaxed text-white/90">
                            <p>💡 Tip: Focus on accuracy first. Speed will naturally follow as your fingers build muscle memory.</p>
                        </div>
                    </Card>

                    <Card title="Lab Requirements">
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                                <p className="text-sm text-gray-600 mt-1">Complete at least 5 speed tests this term.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                                <p className="text-sm text-gray-600 mt-1">Maintain an average accuracy above 95%.</p>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
