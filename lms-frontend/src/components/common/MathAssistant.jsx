import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

const MathAssistant = ({ onInsert, onClose }) => {
    const symbols = [
        { label: 'Fraction', latex: '\\frac{numerator}{denominator}', math: '\\frac{a}{b}' },
        { label: 'Mixed', latex: '1\\frac{1}{2}', math: '1\\frac{a}{b}' },
        { label: 'Sq Root', latex: '\\sqrt{x}', math: '\\sqrt{x}' },
        { label: 'n-th Root', latex: '\\sqrt[n]{x}', math: '\\sqrt[n]{x}' },
        { label: 'Power', latex: 'x^{n}', math: 'x^n' },
        { label: 'Subscript', latex: 'x_{n}', math: 'x_n' },
        { label: 'Times', latex: '\\times', math: '\\times' },
        { label: 'Divide', latex: '\\div', math: '\\div' },
        { label: 'Plus-Minus', latex: '\\pm', math: '\\pm' },
        { label: 'Gtr/Eq', latex: '\\geq', math: '\\geq' },
        { label: 'Less/Eq', latex: '\\leq', math: '\\leq' },
        { label: 'Not Eq', latex: '\\neq', math: '\\neq' },
        { label: 'Pi', latex: '\\pi', math: '\\pi' },
        { label: 'Degree', latex: '^{\\circ}', math: '^{\\circ}' },
        { label: 'Infinity', latex: '\\infty', math: '\\infty' },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-[280px] sm:w-80 max-w-[90vw] animate-in fade-in zoom-in-95 duration-200 z-[300]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-school-primary">Math Palette</span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {symbols.map((symbol, idx) => (
                    <button
                        key={idx}
                        onClick={() => onInsert(symbol.latex)}
                        className="flex flex-col items-center justify-center p-2 h-16 rounded-lg border border-gray-100 hover:border-school-primary hover:bg-red-50/50 transition-all group overflow-hidden"
                        title={symbol.label}
                    >
                        <div className="text-gray-800 scale-110 group-hover:scale-125 transition-transform duration-300">
                            <InlineMath math={symbol.math} />
                        </div>
                        <span className="text-[7px] font-black text-gray-400 mt-2 uppercase truncate w-full text-center group-hover:text-school-primary tracking-tighter">{symbol.label}</span>
                    </button>
                ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-[9px] text-gray-400 leading-tight">
                Click a symbol to insert it. Use <span className="font-bold text-gray-600">$...$</span> for inline and <span className="font-bold text-gray-600">$$...$$</span> for blocks.
            </div>
        </div>
    );
};

export default MathAssistant;
