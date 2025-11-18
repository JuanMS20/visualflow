"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface Node {
  id: string;
  type: string;
  label: string;
  style: string;
  position: { x: number; y: number };
  imageUrl?: string;
}

interface Connection {
  from: string;
  to: string;
  type: string;
  label?: string;
}

interface Diagram {
  nodes: Node[];
  connections: Connection[];
}

const DiagramRenderer = forwardRef(({ diagram }: { diagram: Diagram | null }, ref: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<any>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderer.current = new DiagramRendererLogic(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (renderer.current && diagram) {
      renderer.current.render(diagram);
    }
  }, [diagram]);

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      if (renderer.current) {
        renderer.current.exportPNG();
      }
    },
  }));

  return <canvas id="diagramCanvas" ref={canvasRef} className="w-full h-full bg-gray-200"></canvas>;
});

DiagramRenderer.displayName = 'DiagramRenderer';

export default DiagramRenderer;

class DiagramRendererLogic {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: any;
  diagram: Diagram | null = null;
  images: Map<string, HTMLImageElement> = new Map();
  isDragging = false;
  lastMousePos = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.options = {
      zoom: 1,
      offset: { x: 0, y: 0 },
      nodeSize: 60,
      fontSize: 14,
      lineWidth: 2,
    };
    this.setupCanvas();
    this.bindEvents();
  }

  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
  }

  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.lastMousePos = { x: e.offsetX, y: e.offsetY };
  }

  onMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      this.options.offset.x += e.offsetX - this.lastMousePos.x;
      this.options.offset.y += e.offsetY - this.lastMousePos.y;
      this.lastMousePos = { x: e.offsetX, y: e.offsetY };
      this.render();
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.options.zoom = Math.max(0.1, Math.min(5, this.options.zoom * zoomFactor));
    this.render();
  }

  render(diagram?: Diagram) {
    if (diagram) {
      this.diagram = diagram;
    }
    if (!this.diagram) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.diagram.connections.forEach(conn => this.drawConnection(conn));
    this.diagram.nodes.forEach(node => this.drawNode(node));
  }

  drawNode(node: Node) {
    const x = node.position.x * this.options.zoom + this.options.offset.x;
    const y = node.position.y * this.options.zoom + this.options.offset.y;
    const size = this.options.nodeSize * this.options.zoom;

    this.ctx.save();
    this.ctx.translate(x, y);

    switch (node.type) {
      case 'oval':
        this.drawOval(size, node);
        break;
      case 'rect':
        this.drawRectangle(size, node);
        break;
      default:
        this.drawRectangle(size, node);
    }

    if (node.imageUrl) {
      this.drawImage(node.imageUrl, size);
    }

    this.drawText(node.label, size);

    this.ctx.restore();
  }

  drawOval(size: number, node: Node) {
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size, size * 0.6, 0, 0, 2 * Math.PI);
    this.applyNodeStyle(node);
  }

  drawRectangle(size: number, node: Node) {
    const width = size * 1.5;
    const height = size * 0.8;
    this.ctx.beginPath();
    this.ctx.rect(-width / 2, -height / 2, width, height);
    this.applyNodeStyle(node);
  }

  applyNodeStyle(node: Node) {
    const style = node.style || '';
    const fillColor = this.extractColor(style, 'fill:') || '#3b82f6';
    const strokeColor = this.extractColor(style, 'stroke:') || '#2563eb';

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = this.options.lineWidth * this.options.zoom;
    this.ctx.stroke();
  }

  extractColor(style: string, prefix: string) {
    const match = style.match(new RegExp(`${prefix}([^;\\s]+)`));
    return match ? match[1] : null;
  }

  drawImage(imageUrl: string, size: number) {
    if (this.images.has(imageUrl)) {
      const img = this.images.get(imageUrl);
      if (img?.complete) {
        this.ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
    } else {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        this.images.set(imageUrl, img);
        this.render();
      };
    }
  }

  drawText(text: string, size: number) {
    this.ctx.fillStyle = '#000';
    this.ctx.font = `${this.options.fontSize * this.options.zoom}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, 0, size * 0.7);
  }

  drawConnection(conn: Connection) {
    if (!this.diagram) return;
    const fromNode = this.diagram.nodes.find(n => n.id === conn.from);
    const toNode = this.diagram.nodes.find(n => n.id === conn.to);

    if (fromNode && toNode) {
      const fromX = fromNode.position.x * this.options.zoom + this.options.offset.x;
      const fromY = fromNode.position.y * this.options.zoom + this.options.offset.y;
      const toX = toNode.position.x * this.options.zoom + this.options.offset.x;
      const toY = toNode.position.y * this.options.zoom + this.options.offset.y;

      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);

      this.ctx.strokeStyle = '#9ca3af';
      this.ctx.lineWidth = this.options.lineWidth * this.options.zoom;

      if (conn.type === 'dashed') {
        this.ctx.setLineDash([5, 5]);
      } else {
        this.ctx.setLineDash([]);
      }

      this.ctx.stroke();

      if (conn.type === 'arrow') {
        this.drawArrow(fromX, fromY, toX, toY);
      }
    }
  }

  drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 10 * this.options.zoom;

    this.ctx.save();
    this.ctx.translate(toX, toY);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-size, -size / 2);
    this.ctx.lineTo(-size, size / 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  exportPNG() {
    const link = document.createElement('a');
    link.download = 'diagram.png';
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}
