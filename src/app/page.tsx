"use client";

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import DiagramCanvas from '@/components/DiagramCanvas';
import ControlPanel from '@/components/ControlPanel';
import ProgressModal from '@/components/ProgressModal';

export default function Home() {
  const [diagram, setDiagram] = useState(null);
  const [progress, setProgress] = useState(0);
  const diagramCanvasRef = useRef<{ exportPNG: () => void }>(null);

  const handleExport = () => {
    if (diagramCanvasRef.current) {
      diagramCanvasRef.current.exportPNG();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <ProgressModal progress={progress} />
      <div className="flex flex-grow">
        <ControlPanel setDiagram={setDiagram} setProgress={setProgress} onExport={handleExport} />
        <main className="flex-grow p-6">
          <div className="w-full h-full bg-white rounded-lg shadow-md">
            <DiagramCanvas ref={diagramCanvasRef} diagram={diagram} />
          </div>
        </main>
      </div>
    </div>
  );
}
