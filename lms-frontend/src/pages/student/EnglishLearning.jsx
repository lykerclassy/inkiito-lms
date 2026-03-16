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
    const [progress, setProgress] = useState({ mastered: 0, total: 0 });

    useEffect(() => {
        generateNewWord();
    }, []);

    const markAsLearned = async (wordId, currentScore = 0) => {
        try {
            const res = await api.post('ai/vocabulary/mark-learned', {
                word_id: wordId,
                score: currentScore
            });
            // Update local wordData to reflect mastery immediately
            setWordData(prev => ({ ...prev, is_mastered: true, mastered_count: (prev.mastered_count || 0) + 1 }));
            return res.data;
        } catch (err) {
            console.error("Failed to mark word as learned", err);
        }
    };

    const generateNewWord = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('ai/vocabulary/generate');
            setWordData(res.data);
            setSpellingInput('');
            setFeedback(null);
        } catch (err) {
            console.error("AI Generation failed", err);
            setWordData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const [isListening, setIsListening] = useState(false);

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {
        if (!window.isSecureContext) {
            alert("Speech Recognition requires a secure connection (HTTPS). Please ensure you are visiting the site via https:// instead of http://");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("Speech Recognition Error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().replace(/[^a-z]/g, '');
            setSpellingInput(transcript);
            // Auto check after a short delay
            setTimeout(() => {
                handleSpellingCheck(transcript);
            }, 500);
        };

        recognition.start();
    };

    const handleSpellingCheck = async (overriddenInput = null) => {
        if (!wordData) return;
        const input = (overriddenInput !== null ? overriddenInput : spellingInput).toLowerCase().trim();

        if (input === wordData.word.toLowerCase()) {
            setFeedback({ type: 'success', message: 'Perfect! AI confirms your spelling is correct.' });
            const newScore = score + 10;
            setScore(newScore);

            // Auto-mark as learned if they get it right in Spelling Bee
            await markAsLearned(wordData.id, 10);

            setTimeout(() => generateNewWord(), 1500);
        } else {
            setFeedback({ type: 'error', message: 'Not quite. Try following the phonetic hints!' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-xl font-bold text-gray-900 tracking-tight flex flex-wrap items-center justify-center md:justify-start gap-3">
                        English AI Tutor
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] uppercase px-2 py-1 rounded-full font-bold animate-pulse whitespace-nowrap">
                            Powered by AI
                        </span>
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                        <p className="text-sm sm:text-base text-gray-500 font-medium">Hyper-personalized language mastery.</p>
                        {wordData && (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                Mastery Score: {wordData.mastered_count} / {wordData.total_library_count}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-2xl w-full sm:w-fit justify-center shadow-inner">
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
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500 font-medium uppercase text-sm animate-pulse">AI is spinning new vocabulary...</p>
                </div>
            ) : wordData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'vocabulary' ? (
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-none shadow-sm bg-white relative">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] select-none pointer-events-none">
                                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                                </div>

                                <div className="p-4 md:p-5">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm inline-block px-3 py-1 bg-blue-50 text-blue-600 font-black rounded-lg border border-blue-100">
                                                    {wordData.category}
                                                </span>
                                                {wordData.is_mastered && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-black flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                        Mastered
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl md:text-2xl font-bold text-gray-900 break-words">{wordData.word}</h2>
                                            <p className="text-lg sm:text-xl text-gray-400 italic">{wordData.phonetic}</p>
                                        </div>
                                        <button
                                            onClick={() => speak(wordData.word)}
                                            className="w-9 h-9 md:w-20 md:h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 shadow-sm shadow-blue-200 group shrink-0"
                                        >
                                            <svg className="w-10 h-10 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        </button>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase">Grammatical Definition</h3>
                                        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-snug font-medium border-l-4 border-blue-500 pl-4 md:pl-6 py-2">
                                            {wordData.definition}
                                        </p>
                                    </div>

                                    <div className="mt-12 flex flex-col sm:flex-row gap-4">
                                        <Button
                                            variant="primary"
                                            className="flex-1 py-4 md:py-5 text-base md:text-lg shadow-sm shadow-blue-100"
                                            onClick={generateNewWord}
                                            isLoading={isLoading}
                                        >
                                            Explored! Next Word
                                        </Button>
                                        {!wordData.is_mastered ? (
                                            <Button
                                                variant="outline"
                                                className="px-6 md:px-5 py-4 md:py-5 text-green-600 border-green-200 hover:bg-green-50 font-black"
                                                onClick={() => markAsLearned(wordData.id, 0)}
                                            >
                                                I Understand This
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                className="px-6 md:px-5 py-4 md:py-5 text-gray-400 border-gray-200 cursor-not-allowed"
                                                disabled
                                            >
                                                Already Mastered
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
                                    <h4 className="text-purple-900 font-bold uppercase text-[10px] mb-2">Memory Tip</h4>
                                    <p className="text-purple-700 text-sm italic">"Try using {wordData.word} in a sentence about your home or school to anchor it in your long-term memory."</p>
                                </div>
                                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                                    <h4 className="text-amber-900 font-bold uppercase text-[10px] mb-2">Quick Challenge</h4>
                                    <p className="text-amber-700 text-sm italic">Can you identify a synonym for {wordData.word}? Write it down in your notebook!</p>
                                </div>
                                <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                                    <h4 className="text-green-900 font-bold uppercase text-[10px] mb-2">AI Proficiency</h4>
                                    <p className="text-green-700 text-sm italic">This word rank is 'Academic Intermediate'. Mastery adds +15 points to your lexicon score.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            <Card className="text-center py-5 shadow-sm relative overflow-hidden ring-4 ring-blue-50">
                                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

                                <div className="mb-10">
                                    <h2 className="text-lg font-bold text-gray-900">AI Spelling Bee</h2>
                                    <p className="text-gray-500 font-medium">Type the word precisely as the AI pronounces it.</p>
                                    <div className="mt-4 flex justify-center gap-4">
                                        <div className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-lg shadow-blue-200">Session Score: {score}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <button
                                            className="flex-1 py-3 rounded-3xl border-4 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-3 group"
                                            onClick={() => speak(wordData.word)}
                                        >
                                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                            </div>
                                            <span className="text-sm font-semibold text-blue-600">Listen</span>
                                        </button>

                                        <button
                                            className={`flex-1 py-3 rounded-3xl border-4 border-dashed transition-all flex flex-col items-center gap-3 group ${isListening ? 'border-red-500 bg-red-50 animate-pulse' : 'border-purple-200 hover:border-purple-500 hover:bg-purple-50'}`}
                                            onClick={startListening}
                                            disabled={isListening}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${isListening ? 'bg-red-500 text-white' : 'bg-purple-100 text-purple-600 group-hover:scale-110'}`}>
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 3 3 3 0 01-3-3V3a3 3 0 013-3z" /></svg>
                                            </div>
                                            <span className={`text-sm font-semibold ${isListening ? 'text-red-600' : 'text-purple-600'}`}>
                                                {isListening ? 'Listening...' : 'Speak Word'}
                                            </span>
                                        </button>
                                    </div>

                                    <div className="relative px-2">
                                        <input
                                            type="text"
                                            placeholder="Transcription..."
                                            value={spellingInput}
                                            onChange={(e) => setSpellingInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSpellingCheck()}
                                            autoFocus
                                            className="w-full p-4 md:p-6 border-b-4 md:border-b-8 border-gray-100 focus:border-blue-500 outline-none text-center text-xl sm:text-2xl md:text-xl font-bold md:tracking-[0.3em] text-gray-900 bg-gray-50/30 transition-all uppercase placeholder:text-gray-200 placeholder:font-normal placeholder:tracking-normal"
                                        />
                                        {feedback && (
                                            <div className={`mt-6 font-black animate-bounce text-lg ${feedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                {feedback.message}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-10">
                                        <Button className="flex-1 py-5 text-sm font-semibold rounded-2xl" onClick={handleSpellingCheck}>Verify Spelling</Button>
                                        <button
                                            onClick={generateNewWord}
                                            className="px-5 font-bold text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            Ask AI for New Word
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            ) : !isLoading && !wordData ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 animate-in fade-in zoom-in-95">
                    <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">English Hub is Quiet</h2>
                    <p className="text-gray-500 max-w-sm font-medium">The AI Tutor couldn't find any words at the moment. Please ensure your Gemini API key is valid or add vocabulary manually in the Admin Console.</p>
                </div>
            ) : null}
        </div>
    );
}
