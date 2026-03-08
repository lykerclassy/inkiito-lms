import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const MathText = ({ text, className = "" }) => {
    if (!text) return null;

    // Supports:
    // Block: $$...$$ and \[...\]
    // Inline: $...$ and \(...\)
    const regex = /(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$|\\\(.*?\\\))/gs;
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (!part) return null;

                // Block Math: $$...$$
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    const math = part.slice(2, -2);
                    return <div key={i} className="my-2 overflow-x-auto overflow-y-hidden w-full pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"><BlockMath math={math} /></div>;
                }

                // Block Math: \[...\]
                if (part.startsWith('\\[') && part.endsWith('\\]')) {
                    const math = part.slice(2, -2);
                    return <div key={i} className="my-2 overflow-x-auto overflow-y-hidden w-full pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"><BlockMath math={math} /></div>;
                }

                // Inline Math: $...$
                if (part.startsWith('$') && part.endsWith('$')) {
                    const math = part.slice(1, -1);
                    return <InlineMath key={i} math={math} />;
                }

                // Inline Math: \(...\)
                if (part.startsWith('\\(') && part.endsWith('\\)')) {
                    const math = part.slice(2, -2);
                    return <InlineMath key={i} math={math} />;
                }

                // Regular Text - Trim excessive newlines
                let content = part;

                // If this is just whitespace and we're between blocks, handle it
                if (!content.trim()) {
                    const prevPart = parts[i - 1];
                    const nextPart = parts[i + 1];
                    const isPrevBlock = prevPart && (prevPart.startsWith('$$') || prevPart.startsWith('\\['));
                    const isNextBlock = nextPart && (nextPart.startsWith('$$') || nextPart.startsWith('\\['));

                    if (isPrevBlock || isNextBlock) {
                        return null; // Skip redundant empty segments between math
                    }
                }

                return <span key={i} className="whitespace-pre-wrap">{content}</span>;
            })}
        </span>
    );
};

export default MathText;
