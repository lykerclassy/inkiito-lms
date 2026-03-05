import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function EnglishLearning() {
    const [activeTab, setActiveTab] = useState('vocabulary');
    const [wordData, setWordData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [spellingInput, setSpellingInput] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        generateNewWord();
    }, []);

    const generateNewWord = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/ai/vocabulary/generate');
            setWordData(res.data);
            setSpellingInput('');
            setFeedback(null);
        } catch (err) {
            console.error("AI Generation failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const handleSpellingCheck = () => {
        if (!wordData) return;
        if (spellingInput.toLowerCase().trim() === wordData.word.toLowerCase()) {
            setFeedback({ type: 'success', message: 'Perfect! AI confirms your spelling is correct.' });
            setScore(prev => prev + 10);
            setTimeout(() => generateNewWord(), 1500);
        } else {
            setFeedback({ type: 'error', message: 'Not quite. Try following the phonetic hints!' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        English AI Tutor
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] uppercase px-2 py-1 rounded-full font-bold tracking-widest animate-pulse">
                            Powered by AI
                        </span>
                    </h1>
                    <p className="text-gray-500 font-medium">Hyper-personalized language mastery for CBE & 8-4-4.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit shadow-inner">
                    <button
                        onClick={() => setActiveTab('vocabulary')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'vocabulary' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vocabulary
                    </button>
                    <button
                        onClick={() => setActiveTab('spelling')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'spelling' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Spelling Bee
                    </button>
                </div>
            </div>

            {isLoading && !wordData ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold animate-pulse">AI is spinning new vocabulary...</p>
                </div>
            ) : wordData && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'vocabulary' ? (
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-none shadow-2xl bg-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                </div>

                                <div className="p-8 md:p-12">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                                        <div className="space-y-2">
                                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-lg border border-blue-100">
                                                {wordData.category}
                                            </span>
                                            <h2 className="text-6xl font-black text-gray-900 tracking-tighter">{wordData.word}</h2>
                                            <p className="text-xl font-mono text-gray-400 italic">{wordData.phonetic}</p>
                                        </div>
                                        <button
                                            onClick={() => speak(wordData.word)}
                                            className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 shadow-xl shadow-blue-200 group"
                                        >
                                            <svg className="w-10 h-10 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Grammatical Definition</h3>
                                        <p className="text-2xl text-gray-700 leading-snug font-medium border-l-4 border-blue-500 pl-6 py-2">
                                            {wordData.definition}
                                        </p>
                                    </div>

                                    <div className="mt-16 flex flex-col sm:flex-row gap-4">
                                        <Button
                                            variant="primary"
                                            className="flex-1 py-5 text-lg shadow-xl shadow-blue-100"
                                            onClick={generateNewWord}
                                            isLoading={isLoading}
                                        >
                                            Spin New Vocabulary
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="px-8 py-5 text-gray-500 border-gray-200"
                                            onClick={() => speak(wordData.definition)}
                                        >
                                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Explain Audio
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
                                    <h4 className="text-purple-900 font-bold uppercase text-[10px] tracking-widest mb-2">Memory Tip</h4>
                                    <p className="text-purple-700 text-sm italic">"Try using {wordData.word} in a sentence about your home or school to anchor it in your long-term memory."</p>
                                </div>
                                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                                    <h4 className="text-amber-900 font-bold uppercase text-[10px] tracking-widest mb-2">Quick Challenge</h4>
                                    <p className="text-amber-700 text-sm italic">Can you identify a synonym for {wordData.word}? Write it down in your notebook!</p>
                                </div>
                                <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                                    <h4 className="text-green-900 font-bold uppercase text-[10px] tracking-widest mb-2">AI Proficiency</h4>
                                    <p className="text-green-700 text-sm italic">This word rank is 'Academic Intermediate'. Mastery adds +15 points to your lexicon score.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            <Card className="text-center py-16 shadow-2xl relative overflow-hidden ring-4 ring-blue-50">
                                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

                                <div className="mb-10">
                                    <h2 className="text-3xl font-black text-gray-900">AI Spelling Bee</h2>
                                    <p className="text-gray-500 font-medium">Type the word precisely as the AI pronounces it.</p>
                                    <div className="mt-4 flex justify-center gap-4">
                                        <div className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200">Session Score: {score}</div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <button
                                        className="w-full py-10 rounded-3xl border-4 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-3 group"
                                        onClick={() => speak(wordData.word)}
                                    >
                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        </div>
                                        <span className="text-xl font-black text-blue-600 uppercase tracking-widest">Listen to Instruction</span>
                                    </button>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Transcription..."
                                            value={spellingInput}
                                            onChange={(e) => setSpellingInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSpellingCheck()}
                                            autoFocus
                                            className="w-full p-6 border-b-8 border-gray-100 focus:border-blue-500 outline-none text-center text-4xl font-black tracking-[0.3em] text-gray-900 bg-gray-50/30 transition-all uppercase placeholder:text-gray-200 placeholder:font-normal placeholder:tracking-normal"
                                        />
                                        {feedback && (
                                            <div className={`mt-6 font-black animate-bounce text-lg ${feedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                {feedback.message}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-10">
                                        <Button className="flex-1 py-5 text-xl font-black rounded-2xl" onClick={handleSpellingCheck}>Verify Spelling</Button>
                                        <button
                                            onClick={generateNewWord}
                                            className="px-8 font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            Ask AI for New Word
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
