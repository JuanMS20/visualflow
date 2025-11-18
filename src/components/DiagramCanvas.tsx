import { forwardRef } from 'react';
import DiagramRenderer from './DiagramRenderer';

const DiagramCanvas = forwardRef(({ diagram }: { diagram: any }, ref: any) => {
  return (
    <div className="flex-grow bg-gray-200">
      <DiagramRenderer ref={ref} diagram={diagram} />
    </div>
  );
});

DiagramCanvas.displayName = 'DiagramCanvas';

export default DiagramCanvas;
