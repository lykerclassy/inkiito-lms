const fs = require('fs');

const file = 'c:/Users/Admin/inkiito-lms/lms-frontend/src/pages/student/ScienceLab.jsx';
let content = fs.readFileSync(file, 'utf8');

const start = content.indexOf('const BiologyExperiments =');
const end = content.indexOf('export default function ScienceLab() {');

if (start !== -1 && end !== -1) {
    const newComp = `
const VideoExperiment = ({ activeSimulation, setActiveSimulation, selectedLab }) => {
    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(activeSimulation.youtube_url);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                {videoId ? (
                    <iframe className="w-full h-full absolute inset-0" src={\`https://www.youtube.com/embed/\${videoId}\`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <p className="font-bold">No Video Provided for this Practical</p>
                    </div>
                )}
            </div>
            {activeSimulation.steps && activeSimulation.steps.length > 0 && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-xl font-black text-gray-900 border-l-4 border-blue-500 pl-4">Practical Protocols</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeSimulation.steps.map((step, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-xl flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">{idx + 1}</div>
                                <p className="text-sm text-gray-700 font-medium">{step.instruction}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Button className="w-full py-4 md:py-6 text-base md:text-lg shadow-2xl transition-all bg-blue-600 hover:bg-blue-700" onClick={() => setActiveSimulation(prev => ({ ...prev, completed: true }))}>
                Mark Practical as Completed
            </Button>
        </div>
    );
};
`;
    content = content.substring(0, start) + newComp + content.substring(end);
}

// Replace the large conditional rendering of BiologyExperiments, ChemistryExperiments, etc.
const renderPattern = /\{!activeSimulation\.completed \? \([\s\S]*?\) : \(/;
content = content.replace(renderPattern, '{!activeSimulation.completed ? (\n<VideoExperiment activeSimulation={activeSimulation} setActiveSimulation={setActiveSimulation} selectedLab={selectedLab} />\n) : (');

fs.writeFileSync(file, content);
console.log('Success');
