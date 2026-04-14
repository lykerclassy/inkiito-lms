import React, { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';

export default function BlocklySandbox() {
    const blocklyDiv = useRef();
    const workspace = useRef();
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [executionOutput, setExecutionOutput] = useState([]);

    useEffect(() => {
        const loadScript = (id, url) => {
            return new Promise((resolve) => {
                if (document.getElementById(id)) {
                    const check = setInterval(() => {
                        if (url.includes('blockly_compressed') && window.Blockly) { clearInterval(check); resolve(); }
                        else if (url.includes('javascript_compressed') && window.javascript) { clearInterval(check); resolve(); }
                        else if (url.includes('en.js') && window.Blockly?.Msg) { clearInterval(check); resolve(); }
                        else if (url.includes('blocks_compressed') && window.Blockly?.Blocks) { clearInterval(check); resolve(); }
                        // Default timeout or fallback
                    }, 50);
                    return;
                }
                const script = document.createElement('script');
                script.id = id;
                script.src = url;
                script.async = false; // Important for order
                script.onload = () => resolve();
                document.head.appendChild(script);
            });
        };

        const init = async () => {
            if (window.Blockly && window.javascript && window.Blockly.Msg) {
                setScriptsLoaded(true);
                return;
            }

            try {
                // Must be sequential
                await loadScript('blockly-core', 'https://unpkg.com/blockly/blockly_compressed.js');
                await loadScript('blockly-blocks', 'https://unpkg.com/blockly/blocks_compressed.js');
                await loadScript('blockly-js', 'https://unpkg.com/blockly/javascript_compressed.js');
                await loadScript('blockly-en', 'https://unpkg.com/blockly/msg/en.js');
                
                // Extra safety wait
                let attempts = 0;
                const checkFinished = setInterval(() => {
                    if ((window.Blockly && window.javascript && window.Blockly.Msg) || attempts > 20) {
                        setScriptsLoaded(true);
                        clearInterval(checkFinished);
                    }
                    attempts++;
                }, 100);

            } catch (err) {
                console.error("Blockly Loading Error:", err);
            }
        };

        init();
    }, []);

    useEffect(() => {
        if (!scriptsLoaded || !blocklyDiv.current || workspace.current) return;

        const toolbox = {
            'kind': 'categoryToolbox',
            'contents': [
                {
                    'kind': 'category',
                    'name': 'Logic',
                    'colour': '#5C81A6',
                    'contents': [
                        { 'kind': 'block', 'type': 'controls_if' },
                        { 'kind': 'block', 'type': 'logic_compare' },
                        { 'kind': 'block', 'type': 'logic_operation' },
                        { 'kind': 'block', 'type': 'logic_negate' },
                        { 'kind': 'block', 'type': 'logic_boolean' },
                        { 'kind': 'block', 'type': 'logic_null' },
                        { 'kind': 'block', 'type': 'logic_ternary' }
                    ]
                },
                {
                    'kind': 'category',
                    'name': 'Loops',
                    'colour': '#5CA65C',
                    'contents': [
                        { 'kind': 'block', 'type': 'controls_repeat_ext' },
                        { 'kind': 'block', 'type': 'controls_whileUntil' },
                        { 'kind': 'block', 'type': 'controls_for' },
                        { 'kind': 'block', 'type': 'controls_forEach' },
                        { 'kind': 'block', 'type': 'controls_flow_statements' }
                    ]
                },
                {
                    'kind': 'category',
                    'name': 'Math',
                    'colour': '#5C68A6',
                    'contents': [
                        { 'kind': 'block', 'type': 'math_number' },
                        { 'kind': 'block', 'type': 'math_arithmetic' },
                        { 'kind': 'block', 'type': 'math_single' },
                        { 'kind': 'block', 'type': 'math_trig' },
                        { 'kind': 'block', 'type': 'math_constant' },
                        { 'kind': 'block', 'type': 'math_number_property' },
                        { 'kind': 'block', 'type': 'math_round' },
                        { 'kind': 'block', 'type': 'math_on_list' },
                        { 'kind': 'block', 'type': 'math_modulo' },
                        { 'kind': 'block', 'type': 'math_constrain' },
                        { 'kind': 'block', 'type': 'math_random_int' },
                        { 'kind': 'block', 'type': 'math_random_float' },
                        { 'kind': 'block', 'type': 'math_atan2' }
                    ]
                },
                {
                    'kind': 'category',
                    'name': 'Text',
                    'colour': '#5CA68D',
                    'contents': [
                        { 'kind': 'block', 'type': 'text' },
                        { 'kind': 'block', 'type': 'text_join' },
                        { 'kind': 'block', 'type': 'text_append' },
                        { 'kind': 'block', 'type': 'text_length' },
                        { 'kind': 'block', 'type': 'text_isEmpty' },
                        { 'kind': 'block', 'type': 'text_indexOf' },
                        { 'kind': 'block', 'type': 'text_charAt' },
                        { 'kind': 'block', 'type': 'text_getSubstring' },
                        { 'kind': 'block', 'type': 'text_changeCase' },
                        { 'kind': 'block', 'type': 'text_trim' },
                        { 'kind': 'block', 'type': 'text_print' },
                        { 'kind': 'block', 'type': 'text_prompt_ext' }
                    ]
                },
                {
                    'kind': 'category',
                    'name': 'Variables',
                    'colour': '#A65C81',
                    'custom': 'VARIABLE'
                },
                {
                    'kind': 'category',
                    'name': 'Functions',
                    'colour': '#9A5CA6',
                    'custom': 'PROCEDURE'
                }
            ]
        };

        if (window.Blockly) {
            workspace.current = window.Blockly.inject(blocklyDiv.current, {
                toolbox: toolbox,
                media: 'https://unpkg.com/blockly/media/',
                scrollbars: true,
                trashcan: true,
                theme: 'classic'
            });

            // Update code on change
            workspace.current.addChangeListener(() => {
                if (window.javascript && window.javascript.javascriptGenerator) {
                    const code = window.javascript.javascriptGenerator.workspaceToCode(workspace.current);
                    setGeneratedCode(code);
                }
            });
        }

    }, [scriptsLoaded]);

    const runCode = () => {
        setExecutionOutput([]);
        const output = [];
        const originalLog = console.log;
        const originalAlert = window.alert;

        // Custom log and alert to capture output
        console.log = (...args) => {
            output.push(args.map(a => String(a)).join(' '));
        };
        window.alert = (msg) => {
            output.push('[ALERT]: ' + msg);
        };

        try {
            // Using a simple eval for logic blocks, in a more restricted way would be better but this is for teaching purposes
            eval(generatedCode);
            setExecutionOutput([...output, "--- Execution Complete ---"]);
        } catch (err) {
            setExecutionOutput([...output, "[ERROR]: " + err.message]);
        } finally {
            console.log = originalLog;
            window.alert = originalAlert;
        }
    };

    if (!scriptsLoaded) return <div className="h-96 flex items-center justify-center bg-gray-50 rounded-3xl animate-pulse text-blue-600 font-bold italic uppercase tracking-widest">Waking Up Logic Engine...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                        🚀
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-tight italic bg-white/20 px-3 py-1 rounded-lg w-fit mb-4">Case #1: Architecture Genesis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                            <div className="bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <span className="text-[10px] font-black text-blue-300 block uppercase mb-2 tracking-widest">Logic Step 01</span>
                                <p className="text-[11px] font-bold leading-relaxed opacity-90">Open the <b className="text-blue-300">Text</b> category and drag the <b className="text-blue-300">"Print"</b> command to the center.</p>
                            </div>
                            <div className="bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <span className="text-[10px] font-black text-purple-300 block uppercase mb-2 tracking-widest">Logic Step 02</span>
                                <p className="text-[11px] font-bold leading-relaxed opacity-90">Find the empty <b className="text-purple-300">" "</b> text block and snap it inside your command.</p>
                            </div>
                            <div className="bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <span className="text-[10px] font-black text-green-300 block uppercase mb-2 tracking-widest">Logic Step 03</span>
                                <p className="text-[11px] font-bold leading-relaxed opacity-90">Type a message and click <b className="text-green-300">"Execute Logic"</b> to see the results!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 h-[600px]">
                {/* Blockly Workspace */}
                <div ref={blocklyDiv} className="flex-1 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm" />
                
                {/* Code & Output Panel */}
                <div className="w-full md:w-80 flex flex-col gap-4">
                    <div className="flex-1 bg-gray-900 rounded-3xl p-5 shadow-sm flex flex-col overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logic Code</h4>
                            <span className="w-2 h-2 bg-green-500 rounded-full group-hover:animate-ping"></span>
                        </div>
                        <pre className="text-[11px] font-mono text-blue-300 overflow-auto cool-scrollbar flex-1 whitespace-pre-wrap leading-relaxed">
                            {generatedCode || '// Your logical steps will appear here...'}
                        </pre>
                    </div>

                    <div className="h-48 bg-gray-50 rounded-3xl p-5 border border-gray-100 flex flex-col overflow-hidden">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Lab Results</h4>
                        <div className="flex-1 overflow-auto cool-scrollbar text-xs font-bold space-y-2">
                            {executionOutput.length === 0 ? (
                                <p className="text-gray-300 italic">Blocks logic console ready...</p>
                            ) : executionOutput.map((line, i) => (
                                <div key={i} className={`p-2 rounded-xl border border-gray-100 bg-white ${line.includes('[ERROR]') ? 'text-red-500 bg-red-50 border-red-100' : 'text-gray-700'}`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button 
                        variant="primary" 
                        className="py-4 shadow-sm shadow-blue-200 uppercase tracking-widest font-black"
                        onClick={runCode}
                    >
                        Execute Logic
                    </Button>
                </div>
            </div>
        </div>
    );
}
