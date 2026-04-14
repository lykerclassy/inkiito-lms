import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

// Global Singleton for AudioContext to prevent severe memory leaks & timing drift
let globalAudioCtx = null;
const getAudioCtx = () => {
    if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
    }
    return globalAudioCtx;
};

export default function DailySpin() {
    const { user, updateUser } = useAuth();
    const { showNotification } = useNotification();
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Wheel state
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    
    // Active Game State
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // Result State
    const [result, setResult] = useState(null); // { success, message, points, feedback }
    
    // Audio Preference State
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('spin_muted') === 'true';
    });

    const toggleMute = () => {
        const newValue = !isMuted;
        setIsMuted(newValue);
        localStorage.setItem('spin_muted', newValue);
    };

    const colors = ['#d81d22', '#3b82f6', '#10b981', '#f8af18', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
    const SLICES = 8;
    const sliceDegree = 360 / SLICES;

    // === Web Audio API Sound Synthesizers ===
    const playTick = () => {
        if (isMuted) return;
        try {
            const ctx = getAudioCtx();
            
            // 1. The Low Thump
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            // 2. The Plastic Friction (Filtered White Noise)
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1200; // mid-high frequency focus
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            
            // Connect and Play
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            noise.start();
            osc.stop(ctx.currentTime + 0.05);
            noise.stop(ctx.currentTime + 0.05);
        } catch(e) { console.warn("Audio unavailable"); }
    };

    const playSuccessChime = () => {
        if (isMuted) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1);
        } catch(e) {}
    };

    const playErrorBuzz = () => {
        if (isMuted) return;
        try {
            const ctx = getAudioCtx();
            const gain = ctx.createGain();
            
            // Create a dissonant tritone effect
            const osc1 = ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(150, ctx.currentTime); // Eb3
            osc1.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.6); // pitch bend down
            
            const osc2 = ctx.createOscillator();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(160, ctx.currentTime); // E3 (dissonance)
            osc2.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.6);

            // Master envelope
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); // sharp attack
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6); // smooth decay
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);
        } catch(e) {}
    };

    // Mechanical wheel ticking effect synchronized with CSS cubic-bezier
    useEffect(() => {
        let timeout;
        let isActive = isSpinning;
        if (isActive) {
            let delay = 35; // Start spinning fast
            const startTime = Date.now();
            
            const clickLoop = () => {
                const elapsed = Date.now() - startTime;
                if (!isActive || elapsed > 3800) return; // Strict cutoff BEFORE 4000ms ensures it doesn't leak into modal
                
                playTick();
                
                // Advanced Physics Curve to flawlessly mimic 'cubic-bezier(0.1, 0.7, 0.1, 1)'
                if (elapsed < 1500) {
                    delay *= 1.01; // Constant velocity phase
                } else if (elapsed < 2800) {
                    delay *= 1.05; // Friction applies
                } else {
                    delay *= 1.25; // Hard mechanical brake at the end
                }

                timeout = setTimeout(clickLoop, delay);
            };
            timeout = setTimeout(clickLoop, delay);
        }
        return () => {
            isActive = false;
            clearTimeout(timeout);
        };
    }, [isSpinning]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('gamification/wheel');
            setQuestions(res.data);
            setIsLoading(false);
        } catch (err) {
            console.error('Failed to load wheel questions', err);
            showNotification('Could not load Daily Spin', 'error');
            setIsLoading(false);
        }
    };

    const spinWheel = () => {
        if (isSpinning || questions.length === 0) return;
        
        setIsSpinning(true);
        setResult(null);
        setSelectedAnswer('');

        // Pick a random question index
        const winningIndex = Math.floor(Math.random() * questions.length);
        
        // Calculate physics
        const extraSpins = 360 * 6;
        const sliceCenter = winningIndex * sliceDegree + (sliceDegree / 2);
        // Normalize current rotation so we don't infinitely grow string values, although CSS handles it fine. Let's grow it so transition works forward.
        const baseRotation = rotation - (rotation % 360);
        const targetRotation = baseRotation + extraSpins + (360 - sliceCenter);
        // Add random slight variation so it looks natural (-15deg to +15deg)
        const randomFudge = Math.floor(Math.random() * (sliceDegree * 0.7)) - (sliceDegree * 0.35);

        setRotation(targetRotation + randomFudge);

        // Wait for animation (4 seconds)
        setTimeout(() => {
            setIsSpinning(false);
            setSelectedQuestion(questions[winningIndex]);
            setShowModal(true);
        }, 4000);
    };

    const submitAnswer = async (e) => {
        e.preventDefault();
        if (!selectedAnswer) {
            showNotification('Please select an answer', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('gamification/spin-answer', {
                question_id: selectedQuestion.id,
                answer: selectedAnswer
            });
            
            setResult(res.data);
            setSubmitting(false);

            if (res.data.success) {
                playSuccessChime();
                // Update global user points instantly
                if (updateUser && res.data.new_total_points !== undefined) {
                    updateUser({ gamification_points: res.data.new_total_points });
                }
                showNotification('Correct! Points added.', 'success');
            } else {
                playErrorBuzz();
                showNotification('Oops, incorrect answer.', 'error');
            }
        } catch (err) {
            console.error('Failed to submit answer', err);
            showNotification('Error verifying answer', 'error');
            setSubmitting(false);
        }
    };

    const closeModalAndRefresh = () => {
        setShowModal(false);
        setResult(null);
        setSelectedQuestion(null);
        // Soft refresh to get new questions for next spin
        fetchQuestions();
    };

    if (isLoading && questions.length === 0) {
        return <div className="p-10 text-center animate-pulse font-bold text-gray-400">Loading your Daily Spin...</div>;
    }

    if (questions.length < 4) {
        return (
            <div className="p-10 text-center text-gray-500">
                <p className="font-bold text-lg mb-2">Not Enough Questions</p>
                <p className="text-sm">The curriculum needs more quizzes before the Daily Spin can activate.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 relative min-h-[calc(100vh-120px)] flex flex-col justify-center items-center">
            
            {/* Audio Toggle Controller */}
            <button 
                onClick={toggleMute}
                className="absolute top-4 right-4 p-3 bg-white hover:bg-gray-100 rounded-full shadow-sm text-gray-500 hover:text-gray-800 transition-all border border-gray-100 focus:outline-none"
                title={isMuted ? "Unmute Arcade Sounds" : "Mute Arcade Sounds"}
            >
                {isMuted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <line x1="17" y1="7" x2="23" y2="13" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="23" y1="7" x2="17" y2="13" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                )}
            </button>

            <div className="text-center mb-6 mt-2 flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">Daily Spin & Win</h1>
                <p className="text-gray-500 text-sm sm:text-base font-medium mt-1 mb-2">Test your knowledge across random subjects to earn massive points.</p>
                <div className="mt-2 bg-gray-900 text-white font-bold px-6 py-1.5 rounded-full inline-block shadow-lg">
                    My Points: <span className="text-yellow-400 text-xl font-black ml-1">{user?.gamification_points || 0}</span>
                </div>
            </div>

            {/* ARCADE WHEEL UI */}
            <div className="relative flex flex-col items-center justify-center my-4 md:my-8 w-full">
                
                {/* Pointer / Flapper */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 drop-shadow-xl">
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-600"></div>
                </div>
                
                {/* Wheel Container */}
                <div className="relative w-64 h-64 sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px] rounded-full border-[10px] sm:border-[16px] border-gray-900 shadow-[0_10px_40px_rgba(0,0,0,0.3)] bg-white overflow-hidden"
                     style={{
                         transform: `rotate(${rotation}deg)`,
                         transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none',
                         background: `conic-gradient(${questions.map((q, i) => `${colors[i % colors.length]} ${i * sliceDegree}deg ${(i + 1) * sliceDegree}deg`).join(', ')})`
                     }}>
                    
                    {/* Render Text dynamically rotated for each slice */}
                    {questions.map((q, i) => (
                        <div key={i} className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-8"
                             style={{ transform: `rotate(${i * sliceDegree + (sliceDegree / 2)}deg)`, transformOrigin: 'center' }}>
                            <div className="flex flex-col items-center">
                                <span className="text-white font-black text-xl sm:text-2xl drop-shadow-md">{q.points}</span>
                                <span className="text-white/80 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                    {q.subject?.substring(0, 10)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Center Peg */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-900 rounded-full border-4 border-white shadow-inner z-10"></div>
                </div>

                <button 
                    onClick={spinWheel} 
                    disabled={isSpinning}
                    className="mt-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xl sm:text-2xl uppercase tracking-widest px-12 sm:px-16 py-3 sm:py-4 rounded-full shadow-[0_6px_0_#991b1b] sm:shadow-[0_8px_0_#991b1b] active:shadow-[0_0px_0_#991b1b] active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSpinning ? 'Spinning...' : 'SPIN'}
                </button>
            </div>

            {/* QUESTION MODAL */}
            {showModal && selectedQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-scale-up">
                        
                        {/* Header */}
                        <div className={`p-6 border-b border-gray-100 ${result ? (result.success ? 'bg-green-50' : 'bg-red-50') : 'bg-indigo-50'}`}>
                            <h2 className="text-lg font-bold text-gray-900 capitalize">{selectedQuestion.subject} Challenge</h2>
                            <p className={`text-sm font-black uppercase tracking-widest mt-1 ${result ? (result.success ? 'text-green-600' : 'text-red-500') : 'text-indigo-600'}`}>
                                Play for {selectedQuestion.points} Points
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {!result ? (
                                <form onSubmit={submitAnswer}>
                                    <p className="text-gray-800 font-medium text-lg mb-6" dangerouslySetInnerHTML={{ __html: selectedQuestion.question_text }}></p>
                                    
                                    <div className="space-y-3 mb-8">
                                        {selectedQuestion.options && Object.entries(selectedQuestion.options).map(([key, label]) => (
                                            <label key={key} className={`flex items-start gap-4 p-4 rounded-xl border border-gray-200 cursor-pointer transition-all ${selectedAnswer === key ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'hover:border-indigo-300 hover:bg-gray-50'}`}>
                                                <input required type="radio" className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" name="answer" value={key} checked={selectedAnswer === key} onChange={(e) => setSelectedAnswer(e.target.value)} />
                                                <span className="text-gray-700 text-sm font-medium">{label}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center">
                                        {submitting ? 'Verifying...' : 'Submit Answer'}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-4">
                                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-sm ${result.success ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                                        {result.success ? (
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        ) : (
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-black mb-2 ${result.success ? 'text-green-600' : 'text-red-500'}`}>{result.message}</h3>
                                    
                                    {!result.success && result.correct_answer && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
                                            <span className="text-xs uppercase font-bold text-gray-500 tracking-widest">Correct Answer:</span>
                                            <p className="font-bold text-gray-900 mt-1">{result.correct_answer}</p>
                                        </div>
                                    )}

                                    {result.feedback && (
                                        <p className="mt-4 text-sm text-gray-600">{result.feedback}</p>
                                    )}

                                    <button onClick={closeModalAndRefresh} className="mt-8 bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md">
                                        Back to Wheel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
