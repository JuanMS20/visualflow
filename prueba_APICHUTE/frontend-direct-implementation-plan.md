# 🚀 Plan de Implementación - Frontend Directo TOON

## 📋 Objetivo
Crear una aplicación VisualFlow completamente funcional **sin backend**, usando TOON en todo el frontend y llamadas directas a las APIs de Chutes AI.

**Stack**: HTML + CSS + JavaScript vanilla + TOON

---

## 🎯 Arquitectura Frontend Directo

```
frontend/
├── index.html              # Interfaz VisualFlow
├── css/
│   └── styles.css          # Estilos mejorados
├── js/
│   ├── config.js           # Variables de entorno (build-time)
│   ├── toon-service.js     # Parser/Encoder TOON
│   ├── chutes-service.js   # Llamadas directas a APIs
│   ├── pipeline-service.js # Orquestación multi-modelo
│   ├── diagram-renderer.js # Render TOON → Canvas
│   └── app.js              # Lógica principal
└── assets/
    └── templates/          # Templates TOON predefinidos
```

---

## 🔑 Gestión de Claves API (Frontend Directo)

### **Opción 1: Variables de Entorno Build-Time (Recomendado)**

```javascript
// .env.local (no subir al repo)
VITE_KIMI_API_KEY=cpk_7d264dc3847b467ea59f4da1d1d050a3...
VITE_QWEN_IMAGE_KEY=cpk_7d264dc3847b467ea59f4da1d1d050a3...
VITE_QWEN_VL_KEY=cpk_7d264dc3847b467ea59f4da1d1d050a3...

// js/config.js
export const CONFIG = {
  KIMI_API_KEY: import.meta.env.VITE_KIMI_API_KEY,
  QWEN_IMAGE_KEY: import.meta.env.VITE_QWEN_IMAGE_KEY,
  QWEN_VL_API_KEY: import.meta.env.VITE_QWEN_VL_KEY,
  ENDPOINT_LLM: 'https://llm.chutes.ai/v1/chat/completions',
  ENDPOINT_IMAGE: 'https://image.chutes.ai/generate'
};
```

**Setup con Vite**:
```bash
npm install -D vite
# vite.config.js
export default {
  root: '.',
  build: {
    outDir: 'dist'
  }
}
```

### **Opción 2: Archivo de Configuración (Simple)**

```javascript
// js/config.js (gitignore)
export const CONFIG = {
  KIMI_API_KEY: 'cpk_7d264dc3847b467ea59f4da1d1d050a3...',
  QWEN_IMAGE_KEY: 'cpk_7d264dc3847b467ea59f4da1d1d050a3...',
  QWEN_VL_API_KEY: 'cpk_7d264dc3847b467ea59f4da1d1d050a3...',
  // ...
};
```

---

## 📡 Servicios de IA (Frontend Directo)

### **1. ToonService (Parser/Encoder)**

```javascript
// js/toon-service.js
import { encode } from 'https://cdn.skypack.dev/@byjohann/toon';

export class ToonService {
  static encode(data, options = {}) {
    return encode(data, {
      delimiter: ',',
      indent: 2,
      lengthMarker: '#',
      ...options
    });
  }

  static parse(toonString) {
    // Implementación simplificada para frontend
    const lines = toonString.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: 0 }];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const indent = this.countIndent(line);
      const trimmed = line.trim();
      
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      
      if (trimmed.includes('[') && trimmed.includes(']{')) {
        this.parseTableLine(trimmed, stack[stack.length - 1].obj);
      } else if (trimmed.includes('[') && trimmed.includes(']:')) {
        this.parseArrayLine(trimmed, stack[stack.length - 1].obj);
      } else if (trimmed.endsWith(':')) {
        const key = trimmed.slice(0, -1);
        const newObj = {};
        stack[stack.length - 1].obj[key] = newObj;
        stack.push({ obj: newObj, indent });
      } else if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        stack[stack.length - 1].obj[key] = this.parseValue(value);
      }
    }
    
    return result;
  }

  static countIndent(line) {
    return line.match(/^(\s*)/)[1].length;
  }

  static parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (/^-?\d+$/.test(value)) return parseInt(value);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    return value;
  }

  static parseTableLine(line, obj) {
    const match = line.match(/^(\w+)\[(\d+)\]\{([^}]+)\}:$/);
    if (match) {
      const [, key, count, fields] = match;
      obj[key] = {
        __table: true,
        count: parseInt(count),
        fields: fields.split(','),
        rows: []
      };
    }
  }

  static parseArrayLine(line, obj) {
    const match = line.match(/^(\w+)\[(\d+)\]:\s*(.+)$/);
    if (match) {
      const [, key, count, values] = match;
      obj[key] = values.split(',').map(v => this.parseValue(v.trim()));
    }
  }
}
```

### **2. ChutesService (Llamadas Directas)**

```javascript
// js/chutes-service.js
import { CONFIG } from './config.js';
import { ToonService } from './toon-service.js';

export class ChutesService {
  constructor() {
    this.kimiKey = CONFIG.KIMI_API_KEY;
    this.qwenImageKey = CONFIG.QWEN_IMAGE_KEY;
    this.qwenVLKey = CONFIG.QWEN_VL_API_KEY;
  }

  // Llamada a Kimi K2
  async callKimi(messages, options = {}) {
    const response = await fetch(CONFIG.ENDPOINT_LLM, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.kimiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshotai/Kimi-K2-Thinking',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Llamada a Qwen Image
  async callQwenImage(prompts) {
    const promises = prompts.map(prompt => 
      fetch(CONFIG.ENDPOINT_IMAGE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.qwenImageKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-image',
          prompt: prompt,
          negative_prompt: 'texto, letras, números, palabras, blur, low quality',
          width: 1024,
          height: 1024,
          num_inference_steps: 50,
          guidance_scale: 7.5
        })
      }).then(r => r.json())
    );

    const results = await Promise.all(promises);
    return results.map((data, i) => ({
      id: `img-${i}`,
      url: data.images[0], // URL de la imagen generada
      prompt: prompts[i],
      status: 'success'
    }));
  }

  // Llamada a Qwen 3 VL
  async callQwenVL(messages) {
    const response = await fetch(CONFIG.ENDPOINT_LLM, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.qwenVLKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-VL-235B-A22B-Instruct',
        messages: messages,
        temperature: 0.5,
        max_tokens: 1500,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Qwen VL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

### **3. PipelineService (Orquestación)**

```javascript
// js/pipeline-service.js
import { ChutesService } from './chutes-service.js';
import { ToonService } from './toon-service.js';

export class PipelineService {
  constructor() {
    this.chutes = new ChutesService();
  }

  async generateDiagram(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Paso 1: Análisis con Kimi K2
      const analysisToon = await this.analyzeConcept(prompt);
      
      // Paso 2: Generar imágenes con Qwen Image
      const images = await this.generateImages(analysisToon);
      
      // Paso 3: Verificar y organizar con Qwen 3 VL
      const finalToon = await this.organizeLayout(analysisToon, images);
      
      // Paso 4: Calcular estadísticas
      const stats = {
        generationTime: Date.now() - startTime,
        tokensSaved: this.calculateTokenSavings(analysisToon, finalToon)
      };
      
      return {
        success: true,
        diagram: finalToon,
        images: images,
        stats: stats
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeConcept(prompt) {
    const systemPrompt = `
      Eres el coordinador de creación de diagramas visuales.
      Analiza el prompt y devuelve TOON con descomposición.
      
      IMPORTANTE: Responde SOLO en formato TOON, sin explicaciones.
      
      Estructura de salida:
      analysis:
        concept: "Concepto principal"
        needsImages: true|false
        elements[N]{id,title,description}:
          id1,Titulo1,Descripción breve
          id2,Titulo2,Descripción breve
        promptsToGenerate[N]:
          "Prompt para imagen 1"
          "Prompt para imagen 2"
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Crea un diagrama para: ${prompt}` }
    ];

    const response = await this.chutes.callKimi(messages);
    return ToonService.parse(response);
  }

  async generateImages(analysisToon) {
    if (!analysisToon.analysis?.promptsToGenerate) {
      return [];
    }

    const prompts = analysisToon.analysis.promptsToGenerate;
    const imageResults = await this.chutes.callQwenImage(prompts);
    
    // Convertir a formato TOON
    return {
      images: imageResults.map(img => ({
        id: img.id,
        url: img.url,
        status: img.status
      }))
    };
  }

  async organizeLayout(analysisToon, images) {
    const systemPrompt = `
      Eres el organizador final de diagramas.
      Recibe análisis TOON e imágenes, devuelve diagrama TOON estructurado.
      
      IMPORTANTE: Responde SOLO en formato TOON.
      
      Incluye:
      - nodes con posiciones (x,y)
      - connections entre nodos
      - imageUrl en cada nodo
      - metadata con layout
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: ToonService.encode(analysisToon.analysis) },
          ...images.images.map(img => ({
            type: 'image_url',
            image_url: { url: img.url }
          }))
        ]
      }
    ];

    const response = await this.chutes.callQwenVL(messages);
    return ToonService.parse(response);
  }

  calculateTokenSavings(analysis, final) {
    const analysisStr = ToonService.encode(analysis);
    const finalStr = ToonService.encode(final);
    return Math.floor((1 - finalStr.length / analysisStr.length) * 100);
  }
}
```

---

## 🎨 DiagramRenderer (Canvas)

```javascript
// js/diagram-renderer.js
export class DiagramRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.zoom = 1;
    this.offset = { x: 0, y: 0 };
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    
    this.setupEventListeners();
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  renderFromToon(toonString) {
    const diagramData = ToonService.parse(toonString);
    if (diagramData.diagram) {
      this.renderDiagram(diagramData.diagram);
    }
  }

  renderDiagram(diagram) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dibujar conexiones primero
    if (diagram.connections) {
      diagram.connections.forEach(conn => {
        this.drawConnection(conn, diagram.nodes);
      });
    }
    
    // Dibujar nodos
    if (diagram.nodes) {
      diagram.nodes.forEach(node => {
        this.drawNode(node);
      });
    }
  }

  drawNode(node) {
    const x = (node.position?.x || 0) * this.zoom + this.offset.x;
    const y = (node.position?.y || 0) * this.zoom + this.offset.y;
    const size = 60 * this.zoom;
    
    // Dibujar forma según tipo
    this.ctx.save();
    this.ctx.translate(x, y);
    
    switch(node.type) {
      case 'oval':
        this.drawOval(size, node);
        break;
      case 'rect':
        this.drawRectangle(size, node);
        break;
      case 'diamond':
        this.drawDiamond(size, node);
        break;
      case 'circle':
        this.drawCircle(size, node);
        break;
      case 'hexagon':
        this.drawHexagon(size, node);
        break;
    }
    
    // Dibujar imagen si existe
    if (node.imageUrl) {
      this.drawImage(x, y, node.imageUrl, size);
    }
    
    // Dibujar texto
    this.drawText(x, y, node.label, size);
    
    this.ctx.restore();
  }

  drawOval(size, node) {
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size, size * 0.6, 0, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.getFillColor(node.style);
    this.ctx.fill();
    this.ctx.strokeStyle = this.getStrokeColor(node.style);
    this.ctx.lineWidth = 2 * this.zoom;
    this.ctx.stroke();
  }

  drawRectangle(size, node) {
    const width = size * 1.5;
    const height = size * 0.8;
    this.ctx.beginPath();
    this.ctx.rect(-width/2, -height/2, width, height);
    this.ctx.fillStyle = this.getFillColor(node.style);
    this.ctx.fill();
    this.ctx.strokeStyle = this.getStrokeColor(node.style);
    this.ctx.lineWidth = 2 * this.zoom;
    this.ctx.stroke();
  }

  drawDiamond(size, node) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(size, 0);
    this.ctx.lineTo(0, size);
    this.ctx.lineTo(-size, 0);
    this.ctx.closePath();
    this.ctx.fillStyle = this.getFillColor(node.style);
    this.ctx.fill();
    this.ctx.strokeStyle = this.getStrokeColor(node.style);
    this.ctx.lineWidth = 2 * this.zoom;
    this.ctx.stroke();
  }

  drawCircle(size, node) {
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.getFillColor(node.style);
    this.ctx.fill();
    this.ctx.strokeStyle = this.getStrokeColor(node.style);
    this.ctx.lineWidth = 2 * this.zoom;
    this.ctx.stroke();
  }

  drawHexagon(size, node) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = this.getFillColor(node.style);
    this.ctx.fill();
    this.ctx.strokeStyle = this.getStrokeColor(node.style);
    this.ctx.lineWidth = 2 * this.zoom;
    this.ctx.stroke();
  }

  drawImage(x, y, imageUrl, size) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgSize = size * 0.8;
      this.ctx.save();
      this.ctx.drawImage(img, x - imgSize/2, y - imgSize/2, imgSize, imgSize);
      this.ctx.restore();
    };
    img.src = imageUrl;
  }

  drawText(x, y, text, size) {
    this.ctx.fillStyle = '#111827';
    this.ctx.font = `${14 * this.zoom}px -apple-system, BlinkMacSystemFont, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y + size + 20 * this.zoom);
  }

  drawConnection(conn, nodes) {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return;
    
    const fromX = (fromNode.position.x || 0) * this.zoom + this.offset.x;
    const fromY = (fromNode.position.y || 0) * this.zoom + this.offset.y;
    const toX = (toNode.position.x || 0) * this.zoom + this.offset.x;
    const toY = (toNode.position.y || 0) * this.zoom + this.offset.y;
    
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.strokeStyle = '#9ca3af';
    this.ctx.lineWidth = 2 * this.zoom;
    
    if (conn.type === 'dashed') {
      this.ctx.setLineDash([5 * this.zoom, 5 * this.zoom]);
    } else {
      this.ctx.setLineDash([]);
    }
    
    this.ctx.stroke();
    
    // Dibujar flecha si es necesario
    if (conn.type === 'arrow') {
      this.drawArrow(fromX, fromY, toX, toY);
    }
  }

  drawArrow(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 10 * this.zoom;
    
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  getFillColor(style) {
    const colors = {
      'fill:#3b82f6': '#3b82f6',
      'fill:#10b981': '#10b981',
      'fill:#f59e0b': '#f59e0b',
      'fill:#ef4444': '#ef4444',
      'fill:#a855f7': '#a855f7',
      'fill:#6b7280': '#6b7280'
    };
    return colors[style] || '#3b82f6';
  }

  getStrokeColor(style) {
    const colors = {
      'fill:#3b82f6': '#2563eb',
      'fill:#10b981': '#059669',
      'fill:#f59e0b': '#d97706',
      'fill:#ef4444': '#dc2626',
      'fill:#a855f7': '#9333ea',
      'fill:#6b7280': '#4b5563'
    };
    return colors[style] || '#2563eb';
  }

  // Event handlers para interacción
  onMouseDown(e) {
    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastMousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    this.offset.x += currentPos.x - this.lastMousePos.x;
    this.offset.y += currentPos.y - this.lastMousePos.y;
    
    this.lastMousePos = currentPos;
    this.renderDiagram(this.currentDiagram);
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(0.5, Math.min(3, this.zoom * delta));
    this.renderDiagram(this.currentDiagram);
  }

  // Exportación
  exportSVG() {
    // Implementación de exportación a SVG
    const svg = this.generateSVG(this.currentDiagram);
    this.downloadFile(svg, 'diagram.svg', 'image/svg+xml');
  }

  exportPNG() {
    this.canvas.toBlob(blob => {
      this.downloadFile(blob, 'diagram.png', 'image/png');
    });
  }

  downloadFile(content, filename, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 📱 Integración en index.html

```javascript
// js/app.js
import { PipelineService } from './pipeline-service.js';
import { DiagramRenderer } from './diagram-renderer.js';
import { ToonService } from './toon-service.js';

class VisualFlowApp {
  constructor() {
    this.pipeline = new PipelineService();
    this.renderer = new DiagramRenderer('diagramCanvas');
    this.currentDiagram = null;
    this.isLoading = false;
    
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.elements = {
      textInput: document.getElementById('textInput'),
      generateBtn: document.getElementById('generateBtn'),
      canvas: document.getElementById('diagramCanvas'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      errorContainer: document.getElementById('errorContainer'),
      errorText: document.getElementById('errorText'),
      exportBtn: document.getElementById('exportBtn'),
      themeButtons: document.querySelectorAll('.theme-button')
    };
  }

  bindEvents() {
    this.elements.generateBtn.addEventListener('click', () => this.generateDiagram());
    this.elements.exportBtn.addEventListener('click', () => this.exportDiagram());
    this.elements.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.generateDiagram();
      }
    });
    
    this.elements.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.changeTheme(btn.dataset.theme));
    });
  }

  async generateDiagram() {
    const prompt = this.elements.textInput.value.trim();
    
    if (!prompt) {
      this.showError('Por favor, ingresa un texto para generar el diagrama');
      return;
    }

    this.setLoading(true);
    this.hideError();

    try {
      const result = await this.pipeline.generateDiagram(prompt);
      
      if (result.success) {
        this.currentDiagram = result.diagram;
        this.renderer.renderFromToon(ToonService.encode(result.diagram));
        this.showSuccess('Diagrama generado exitosamente');
      } else {
        this.showError(result.error || 'Error al generar el diagrama');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showError(`Error: ${error.message}`);
    } finally {
      this.setLoading(false);
    }
  }

  exportDiagram() {
    if (!this.currentDiagram) {
      this.showError('No hay diagrama para exportar');
      return;
    }
    
    this.renderer.exportPNG();
    this.showSuccess('Diagrama exportado como PNG');
  }

  changeTheme(theme) {
    // Cambiar tema y regenerar si hay diagrama
    if (this.currentDiagram) {
      // Lógica para cambiar tema
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.elements.generateBtn.disabled = loading;
    this.elements.loadingSpinner.classList.toggle('hidden', !loading);
  }

  showError(message) {
    this.elements.errorText.textContent = message;
    this.elements.errorContainer.classList.remove('hidden');
  }

  hideError() {
    this.elements.errorContainer.classList.add('hidden');
  }

  showSuccess(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.visualFlow = new VisualFlowApp();
});
```

---

## 📦 Setup del Proyecto

### **package.json**
```json
{
  "name": "visualflow-toon-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  },
  "dependencies": {
    "@byjohann/toon": "^1.0.0"
  }
}
```

### **vite.config.js**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  }
});
```

### **index.html (actualizado)**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VisualFlow - Generador de Diagramas IA</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <!-- ... contenido del header ... -->
  </header>

  <!-- Main Content -->
  <main class="main-content">
    <div class="main-container">
      <div class="content-wrapper">
        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- ... controles ... -->
        </aside>

        <!-- Canvas -->
        <div class="canvas-container">
          <div class="canvas-wrapper">
            <div class="canvas-header">
              <h3 class="canvas-title" id="canvasTitle">Tu Visual</h3>
              <button id="exportBtn" class="action-button hidden">💾 Exportar</button>
            </div>
            <div class="canvas-area">
              <canvas id="diagramCanvas" class="diagram-canvas"></canvas>
              <div id="loadingSpinner" class="loading-spinner hidden"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Scripts -->
  <script type="module" src="js/config.js"></script>
  <script type="module" src="js/toon-service.js"></script>
  <script type="module" src="js/chutes-service.js"></script>
  <script type="module" src="js/pipeline-service.js"></script>
  <script type="module" src="js/diagram-renderer.js"></script>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

---

## 🚀 Plan de Implementación (Frontend Directo)

### **Día 1: Setup y ToonService**
- [ ] Configurar Vite
- [ ] Crear `.env.local` con claves API
- [ ] Implementar ToonService (encode/decode)
- [ ] Tests básicos de TOON

### **Día 2: Servicios IA**
- [ ] Implementar ChutesService (Kimi, Qwen Image, Qwen VL)
- [ ] Probar llamadas directas a APIs
- [ ] Manejo de errores
- [ ] Rate limiting en frontend

### **Día 3: Pipeline y Renderizado**
- [ ] Implementar PipelineService
- [ ] Crear DiagramRenderer (canvas)
- [ ] Integrar renderizado TOON → Canvas
- [ ] Soporte para imágenes en nodos

### **Día 4: UI/UX**
- [ ] Refactorizar index.html
- [ ] Añadir loading states
- [ ] Implementar exportación SVG/PNG
- [ ] Animaciones y transiciones

### **Día 5: Testing y Optimización**
- [ ] Probar pipeline end-to-end
- [ ] Optimizar performance
- [ ] Añadir validaciones
- [ ] Documentación

---

## ⚠️ Consideraciones de Seguridad (Frontend Directo)

### **1. Rotación de Claves**
```javascript
// js/config.js
// Cambiar cada 7 días durante pruebas
export const CONFIG = {
  KIMI_API_KEY: 'cpk_...', // Rotar frecuentemente
  // ...
};
```

### **2. Rate Limiting en Frontend**
```javascript
// js/pipeline-service.js
class PipelineService {
  constructor() {
    this.lastCall = 0;
    this.minInterval = 5000; // 5 segundos entre llamadas
  }

  async generateDiagram(prompt) {
    const now = Date.now();
    if (now - this.lastCall < this.minInterval) {
      throw new Error('Por favor, espera un momento antes de generar otro diagrama');
    }
    this.lastCall = now;
    // ... resto del código
  }
}
```

### **3. Limitar Uso**
```javascript
// Guardar en localStorage
const DAILY_LIMIT = 50; // 50 diagramas por día
const today = new Date().toDateString();
const usage = JSON.parse(localStorage.getItem('dailyUsage') || '{}');

if (usage.date !== today) {
  usage.date = today;
  usage.count = 0;
}

if (usage.count >= DAILY_LIMIT) {
  throw new Error('Límite diario alcanzado');
}

usage.count++;
localStorage.setItem('dailyUsage', JSON.stringify(usage));
```

---

## 🎯 Resultado Esperado

**Después de 5 días tendrás**:
- ✅ Aplicación VisualFlow funcional en frontend
- ✅ Pipeline multi-modelo TOON completo
- ✅ Generación real de diagramas con imágenes IA
- ✅ Renderizado en canvas interactivo
- ✅ Exportación SVG/PNG
- ✅ UI/UX premium
- ✅ Todo en TOON (60% menos tokens)

**¿Listo para comenzar la implementación?**

**Próximo paso**: Crear el primer archivo (`js/config.js` o `js/toon-service.js`)