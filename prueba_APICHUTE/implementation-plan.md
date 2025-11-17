# 🚀 Plan de Implementación - VisualFlow IA Diagramas

## 📋 Resumen Ejecutivo

Convertir VisualFlow en una aplicación IA completamente funcional con pipeline multi-modelo, generación real de diagramas con imágenes, y una experiencia de usuario premium.

**Stack Tecnológico**:
- **Backend**: Node.js + Express
- **Frontend**: HTML5/CSS3/JS vanilla (mantener actual)
- **APIs**: Chutes AI (Kimi K2, Qwen Image, Qwen 3 VL)
- **Formato**: TOON (optimizado)
- **Almacenamiento**: Redis para caché + localStorage

---

## 🏗️ Arquitectura Backend Proxy

### **Estructura de Directorios**
```
backend/
├── src/
│   ├── config/
│   │   ├── api-keys.js          # Variables de entorno
│   │   └── models-config.js     # Configuración modelos
│   ├── controllers/
│   │   ├── diagram-controller.js
│   │   └── image-controller.js
│   ├── services/
│   │   ├── chutes-api-service.js
│   │   ├── pipeline-orchestrator.js
│   │   └── toon-service.js
│   ├── routes/
│   │   └── api.js
│   ├── middleware/
│   │   ├── error-handler.js
│   │   └── rate-limiter.js
│   └── utils/
│       ├── image-processor.js
│       └── validators.js
├── .env                         # Claves API (gitignore)
├── server.js                    # Entry point
└── package.json
```

### **Endpoints API**

#### `POST /api/diagram/generate`
**Descripción**: Endpoint principal para generar diagramas
```javascript
// Request
{
  "prompt": "Diagrama de qué es C++",
  "mode": "visual",
  "template": "mindmap",
  "theme": "modern-blue",
  "image": "base64..." // opcional
}

// Response
{
  "success": true,
  "data": {
    "diagramId": "uuid",
    "toonStructure": "diagram:...",
    "images": [
      {
        "elementId": "paradigm",
        "imageUrl": "/api/images/generated/...",
        "description": "Multi-paradigma"
      }
    ],
    "layout": "grid",
    "stats": {
      "tokensSaved": 340,
      "generationTime": 4500
    }
  }
}
```

#### `POST /api/diagram/variations`
**Descripción**: Generar variaciones de un diagrama existente

#### `POST /api/diagram/optimize`
**Descripción**: Optimizar diagrama existente con IA

#### `GET /api/diagram/export/:id`
**Descripción**: Exportar diagrama como SVG/PNG

#### `GET /api/images/:id`
**Descripción**: Servir imágenes generadas

---

## 🤖 Pipeline Multi-Modelo

### **Flujo de Trabajo Completo**

```mermaid
graph TD
    A[Usuario envía prompt] --> B[Backend recibe request]
    B --> C[PipelineOrchestrator.iniciar()]
    
    C --> D{¿Necesita imágenes?}
    D -->|Sí| E[1. Kimi K2: Análisis]
    D -->|No| N[Generar diagrama textual]
    
    E --> F[2. Descomponer conceptos]
    F --> G[3. Generar prompts Qwen Image]
    G --> H[4. Llamadas paralelas a Qwen Image]
    H --> I[5. Verificar imágenes]
    I --> J[6. Crear estructura TOON]
    
    J --> K[7. Qwen 3 VL: Organizar layout]
    N --> K
    
    K --> L[8. Guardar en Redis]
    L --> M[9. Devolver respuesta JSON]
    
    M --> N[Frontend renderiza diagrama]
```

### **Clase PipelineOrchestrator**

```javascript
class PipelineOrchestrator {
  constructor() {
    this.kimiService = new KimiK2Service();
    this.qwenImageService = new QwenImageService();
    this.qwenVLService = new QwenVLService();
    this.toonService = new ToonService();
  }

  async generateDiagram(prompt, options = {}) {
    const startTime = Date.now();
    
    // Paso 1: Análisis con Kimi K2
    const analysis = await this.kimiService.analyzeConcept(prompt);
    
    // Paso 2: Generar imágenes si es necesario
    let images = [];
    if (analysis.needsImages) {
      const imagePrompts = await this.kimiService.generateImagePrompts(analysis);
      images = await this.generateImagesParallel(imagePrompts);
    }
    
    // Paso 3: Crear estructura TOON
    const toonStructure = this.toonService.createStructure(analysis, images);
    
    // Paso 4: Organizar layout final con Qwen 3 VL
    const finalLayout = await this.qwenVLService.organizeLayout(
      toonStructure, 
      images
    );
    
    // Paso 5: Guardar y devolver
    return {
      diagramId: uuid(),
      structure: finalLayout,
      images: images,
      stats: {
        generationTime: Date.now() - startTime,
        tokensSaved: this.calculateTokensSaved(analysis)
      }
    };
  }

  async generateImagesParallel(prompts) {
    const promises = prompts.map(prompt => 
      this.qwenImageService.generateImage(prompt)
    );
    return await Promise.all(promises);
  }
}
```

---

## 📊 Implementación Formato TOON

### **Clase ToonService**

```javascript
class ToonService {
  // Codificar objeto JavaScript a formato TOON
  encode(diagramObject) {
    let toon = `diagram:\n`;
    toon += `  type: ${diagramObject.type}\n`;
    toon += `  title: "${diagramObject.title}"\n`;
    toon += `  theme: ${diagramObject.theme}\n`;
    toon += `  layout: ${diagramObject.layout}\n\n`;
    
    // Nodos
    toon += `  nodes[${diagramObject.nodes.length}]{id,type,label,style,position,metadata}:\n`;
    diagramObject.nodes.forEach(node => {
      toon += `    ${node.id},${node.type},"${node.label}",${node.style},{x:${node.position.x},y:${node.position.y}},{${this.formatMetadata(node.metadata)}}\n`;
    });
    
    // Conexiones
    if (diagramObject.connections.length > 0) {
      toon += `\n  connections[${diagramObject.connections.length}]{from,to,type,label,style}:\n`;
      diagramObject.connections.forEach(conn => {
        toon += `    ${conn.from},${conn.to},${conn.type},"${conn.label || ''}",${conn.style || 'solid'}\n`;
      });
    }
    
    return toon;
  }

  // Decodificar TOON a objeto JavaScript
  decode(toonString) {
    // Implementación de parsing con regex
    const diagram = {
      type: this.extractValue(toonString, 'type'),
      title: this.extractValue(toonString, 'title'),
      nodes: this.extractNodes(toonString),
      connections: this.extractConnections(toonString)
    };
    return diagram;
  }

  // Calcular ahorro de tokens vs JSON
  calculateTokenSavings(diagramObject) {
    const jsonTokens = JSON.stringify(diagramObject).length / 4;
    const toonTokens = this.encode(diagramObject).length / 4;
    return Math.floor((1 - toonTokens / jsonTokens) * 100);
  }
}
```

---

## 🎨 Mejoras Frontend VisualFlow

### **Nueva Estructura HTML**
```html
<!-- Canvas interactivo con Kontra.js o similar -->
<div class="diagram-canvas" id="diagramCanvas">
  <canvas id="renderCanvas"></canvas>
  
  <!-- Controles flotantes -->
  <div class="canvas-toolbar">
    <button id="zoomIn">🔍+</button>
    <button id="zoomOut">🔍-</button>
    <button id="fitToScreen">🎯</button>
    <button id="exportDiagram">💾</button>
  </div>
</div>

<!-- Modal de variaciones -->
<div id="variationsModal" class="modal">
  <div class="modal-content">
    <h3>Variaciones del Diagrama</h3>
    <div class="variations-grid" id="variationsGrid"></div>
  </div>
</div>
```

### **Clase DiagramRenderer**

```javascript
class DiagramRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.diagram = null;
    this.zoom = 1;
    this.offset = { x: 0, y: 0 };
    this.selectedNode = null;
    
    this.initEventListeners();
  }

  // Renderizar diagrama TOON en canvas
  render(diagramToon) {
    this.diagram = this.parseToon(diagramToon);
    this.resizeCanvas();
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dibujar conexiones
    this.diagram.connections.forEach(conn => {
      this.drawConnection(conn);
    });
    
    // Dibujar nodos
    this.diagram.nodes.forEach(node => {
      this.drawNode(node);
    });
  }

  drawNode(node) {
    const { x, y } = this.worldToScreen(node.position);
    
    switch(node.type) {
      case 'oval':
        this.drawOval(x, y, node);
        break;
      case 'rect':
        this.drawRectangle(x, y, node);
        break;
      case 'diamond':
        this.drawDiamond(x, y, node);
        break;
    }
    
    // Dibujar texto
    this.ctx.fillStyle = '#111827';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(node.label, x, y);
  }

  // Exportar como SVG
  exportSVG() {
    const svg = this.generateSVG(this.diagram);
    this.downloadFile(svg, 'diagram.svg', 'image/svg+xml');
  }

  // Exportar como PNG
  exportPNG() {
    this.canvas.toBlob(blob => {
      this.downloadFile(blob, 'diagram.png', 'image/png');
    });
  }
}
```

---

## 🎨 Sistema de Temas Avanzado

### **Temas Predefinidos**
```javascript
const THEMES = {
  'modern-blue': {
    name: 'Moderno Azul',
    nodeStyles: {
      oval: { fill: '#3b82f6', stroke: '#2563eb' },
      rect: { fill: '#f3f4f6', stroke: '#d1d5db' },
      diamond: { fill: '#a855f7', stroke: '#9333ea' }
    },
    connectionStyle: { stroke: '#9ca3af', width: 2 },
    background: '#f9fafb'
  },
  'professional': {
    name: 'Profesional',
    nodeStyles: {
      oval: { fill: '#1f2937', stroke: '#111827' },
      rect: { fill: '#ffffff', stroke: '#6b7280' },
      diamond: { fill: '#dc2626', stroke: '#b91c1c' }
    },
    connectionStyle: { stroke: '#4b5563', width: 1.5 },
    background: '#ffffff'
  },
  'colorful': {
    name: 'Colorido',
    nodeStyles: {
      oval: { fill: '#10b981', stroke: '#059669' },
      rect: { fill: '#f59e0b', stroke: '#d97706' },
      diamond: { fill: '#ef4444', stroke: '#dc2626' },
      circle: { fill: '#8b5cf6', stroke: '#7c3aed' },
      hexagon: { fill: '#ec4899', stroke: '#db2777' }
    },
    connectionStyle: { stroke: '#6366f1', width: 2, dashed: true },
    background: 'linear-gradient(135deg, #fef3c7, #ede9fe)'
  }
};
```

---

## 📦 Endpoints de Servicios IA

### **Kimi K2 Service**
```javascript
class KimiK2Service {
  constructor() {
    this.apiKey = process.env.KIMI_API_KEY;
    this.endpoint = 'https://llm.chutes.ai/v1/chat/completions';
    this.model = 'moonshotai/Kimi-K2-Thinking';
  }

  async analyzeConcept(prompt) {
    const systemPrompt = `
      Eres el coordinador de creación de diagramas visuales. Tu tarea es:
      1. Analizar la solicitud del usuario
      2. Descomponer en elementos visuales necesarios
      3. Determinar si se necesitan imágenes
      4. Devolver estructura JSON con elementos
    `;

    const response = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response);
  }

  async generateImagePrompts(analysis) {
    // Generar prompts específicos para cada elemento visual
    return analysis.elements.map(element => 
      `Diagrama visual de ${element.title}, ${element.description}, 
       sin texto, estilo ${analysis.style}, colores modernos, 
       elementos visuales únicamente, NO TEXTO, NO LETRAS`
    );
  }

  async callAPI(messages) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

### **Qwen Image Service**
```javascript
class QwenImageService {
  constructor() {
    this.apiKey = process.env.QWEN_IMAGE_API_KEY;
    this.endpoint = 'https://image.chutes.ai/generate';
  }

  async generateImage(prompt) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
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
    });

    const data = await response.json();
    
    // Guardar imagen en disco y devolver URL
    const imageUrl = await this.saveImage(data.images[0]);
    return {
      url: imageUrl,
      prompt: prompt,
      elementId: this.generateElementId(prompt)
    };
  }

  async saveImage(base64Image) {
    const filename = `image_${Date.now()}.png`;
    const filepath = path.join(__dirname, '../public/images', filename);
    
    await fs.writeFile(filepath, Buffer.from(base64Image, 'base64'));
    return `/images/${filename}`;
  }
}
```

### **Qwen VL Service**
```javascript
class QwenVLService {
  constructor() {
    this.apiKey = process.env.QWEN_VL_API_KEY;
    this.endpoint = 'https://llm.chutes.ai/v1/chat/completions';
    this.model = 'Qwen/Qwen3-VL-235B-A22B-Instruct';
  }

  async organizeLayout(toonStructure, images) {
    const systemPrompt = `
      Eres el verificador final de diagramas. Tu tarea es:
      1. Analizar las imágenes generadas
      2. Verificar que representan correctamente el concepto
      3. Organizar todo en una estructura visual coherente
      4. Crear layout final profesional
      5. Devolver TOON estructurado
    `;

    const content = [
      { type: 'text', text: toonStructure },
      ...images.map(img => ({
        type: 'image_url',
        image_url: { url: `http://localhost:3000${img.url}` }
      }))
    ];

    const response = await this.callAPI(systemPrompt, content);
    return response;
  }

  async callAPI(systemPrompt, content) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

---

## 🎯 Plan de Implementación por Fases

### **Fase 1: Backend Proxy y Seguridad (2 días)**
- [ ] Configurar proyecto Node.js con Express
- [ ] Implementar variables de entorno con dotenv
- [ ] Crear middleware de autenticación
- [ ] Implementar rate limiting
- [ ] Configurar CORS para frontend
- [ ] Crear endpoints básicos de salud

### **Fase 2: Servicios IA (3 días)**
- [ ] Implementar KimiK2Service con análisis de conceptos
- [ ] Implementar QwenImageService con generación paralela
- [ ] Implementar QwenVLService con verificación visual
- [ ] Crear PipelineOrchestrator
- [ ] Implementar manejo de errores y reintentos
- [ ] Añadir logging y monitoreo

### **Fase 3: Formato TOON (2 días)**
- [ ] Implementar ToonService con encode/decode
- [ ] Crear validación de estructura TOON
- [ ] Implementar cálculo de ahorro de tokens
- [ ] Crear tests unitarios para parsing
- [ ] Documentar formato TOON extendido

### **Fase 4: Frontend Integración (4 días)**
- [ ] Refactorizar VisualFlow para usar backend
- [ ] Implementar DiagramRenderer con canvas
- [ ] Añadir sistema de temas dinámicos
- [ ] Crear modal de variaciones
- [ ] Implementar exportación SVG/PNG
- [ ] Añadir animaciones y transiciones
- [ ] Optimizar responsive design

### **Fase 5: Mejoras UI/UX (2 días)**
- [ ] Implementar drag & drop de imágenes
- [ ] Añadir sistema de plantillas
- [ ] Crear historial de diagramas
- [ ] Implementar auto-guardado
- [ ] Añadir tutoriales interactivos
- [ ] Optimizar performance

### **Fase 6: Testing y Documentación (2 días)**
- [ ] Tests unitarios para servicios
- [ ] Tests de integración
- [ ] Tests E2E con Playwright
- [ ] Documentación API con Swagger
- [ ] README completo
- [ ] Guía de despliegue

---

## 📦 Dependencias

### **Backend**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "redis": "^4.6.7",
    "uuid": "^9.0.0",
    "joi": "^17.9.2",
    "winston": "^3.10.0",
    "express-rate-limit": "^6.8.1",
    "helmet": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3"
  }
}
```

### **Frontend**
```json
{
  "dependencies": {
    "kontra": "^9.3.0",          // Para canvas interactivo
    "html2canvas": "^1.4.1",    // Para exportación
    "svg.js": "^2.7.1"          // Para manipulación SVG
  }
}
```

---

## 🎨 Diseño UI/UX Mejorado

### **Nuevas Características Visuales**
1. **Canvas Interactivo**: Zoom, pan, selección de nodos
2. **Animaciones**: Transiciones suaves, loading states
3. **Toolbar Flotante**: Contexual según elemento seleccionado
4. **Mini-map**: Navegación rápida en diagramas grandes
5. **Real-time Preview**: Vista previa mientras se genera
6. **Dark Mode**: Tema oscuro completo
7. **Micro-interacciones**: Hover effects, tooltips

### **Sistema de Plantillas**
- **Proceso**: 🔄 Flujos de trabajo
- **Story**: 📖 Narrativas visuales
- **Mindmap**: 🗺️ Mapas mentales
- **Comparison**: ⚖️ Comparaciones
- **Timeline**: 📅 Líneas de tiempo
- **Org Chart**: 👥 Organigramas
- **Network**: 🕸️ Diagramas de red

---

## 🔧 Configuración de Despliegue

### **Environment Variables (.env)**
```bash
# API Keys
KIMI_API_KEY=your_kimi_key_here
QWEN_IMAGE_API_KEY=your_qwen_image_key_here
QWEN_VL_API_KEY=your_qwen_vl_key_here

# Server
PORT=3000
NODE_ENV=production

# Redis
REDIS_URL=redis://localhost:6379

# CORS
FRONTEND_URL=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Docker Setup**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 📊 Métricas de Éxito

- **Tiempo de generación**: < 30 segundos por diagrama
- **Reducción de tokens**: 60% con formato TOON
- **Uptime**: 99.9%
- **Satisfacción usuario**: > 90%
- **Error rate**: < 1%
- **Cobertura tests**: > 80%

---

## 🚀 Próximos Pasos Inmediatos

1. **Hoy**: Configurar backend proxy y variables de entorno
2. **Mañana**: Implementar servicios IA básicos
3. **Día 3**: Crear PipelineOrchestrator y ToonService
4. **Día 4**: Integrar frontend con backend real
5. **Día 5**: Añadir renderizado de diagramas con imágenes reales

**Estimación total**: 15 días para versión 1.0 completa y funcional

---

## 💡 Notas Adicionales

- **Caching**: Implementar Redis para almacenar diagramas generados
- **Colas**: Usar BullMQ para procesamiento asíncrono de imágenes
- **WebSockets**: Para actualizaciones en tiempo real durante generación
- **Analytics**: Añadir tracking de uso y performance
- **Feedback**: Sistema de rating para mejorar prompts

---

**Documento preparado para implementación inmediata. ¿Listo para comenzar?**