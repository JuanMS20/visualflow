"use client";

import { useState } from 'react';
import { generateDiagram } from '@/lib/pipeline';

export default function ControlPanel({ setDiagram, setProgress, onExport }: { setDiagram: (diagram: any) => void, setProgress: (progress: number) => void, onExport: () => void }) {
  const [mode, setMode] = useState('visual');
  const [theme, setTheme] = useState('modern-blue');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    setProgress(1); // Start the progress
    try {
      const { diagram } = await generateDiagram(text, { mode, theme }, setProgress);
      setDiagram(diagram);
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('An unknown error occurred while generating the diagram.');
      }
    } finally {
      setIsLoading(false);
      setProgress(100); // End the progress
    }
  };

  return (
    <div className="w-96 bg-white border-r border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Controls</h2>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="textInput"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., A simple flowchart with three steps..."
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode('semantic')} className={`px-4 py-2 text-sm rounded-lg ${mode === 'semantic' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Semantic</button>
              <button onClick={() => setMode('intelligent')} className={`px-4 py-2 text-sm rounded-lg ${mode === 'intelligent' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Intelligent</button>
              <button onClick={() => setMode('visual')} className={`px-4 py-2 text-sm rounded-lg ${mode === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Visual</button>
              <button onClick={() => setMode('simple')} className={`px-4 py-2 text-sm rounded-lg ${mode === 'simple' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Simple</button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTheme('modern-blue')} className={`px-4 py-2 text-sm rounded-lg ${theme === 'modern-blue' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Modern Blue</button>
              <button onClick={() => setTheme('professional')} className={`px-4 py-2 text-sm rounded-lg ${theme === 'professional' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Professional</button>
              <button onClick={() => setTheme('colorful')} className={`px-4 py-2 text-sm rounded-lg ${theme === 'colorful' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Colorful</button>
              <button onClick={() => setTheme('minimalist')} className={`px-4 py-2 text-sm rounded-lg ${theme === 'minimalist' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Minimalist</button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <button
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          onClick={onExport}
        >
          Export as PNG
        </button>
      </div>
    </div>
  );
}
