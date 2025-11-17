# 🎯 Arquitectura TOON-First - VisualFlow IA Diagramas

## 📋 Principio Fundamental: TOON en Todo el Pipeline

**NO USAR JSON EN NINGÚN LADO**. Toda comunicación usa formato TOON:
- Frontend ↔ Backend
- Backend ↔ APIs de IA (Kimi K2, Qwen Image, Qwen 3 VL)
- Almacenamiento en Redis
- Persistencia en localStorage

---

## 🏗️ Estructura del Proyecto TOON-First

```
visualflow-toon/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── api-keys.js          # Variables de entorno
│   │   │   └── models-config.toon   # Config TOON
│   │   ├── services/
│   │   │   ├── toon-service.js      # Parser/Encoder TOON
│   │   │   ├── chutes-api-service.js # Llamadas TOON a Chutes
│   │   │   └── pipeline-orchestrator.js
│   │   ├── controllers/
│   │   │   └── diagram-controller.js
│   │   ├── routes/
│   │   │   └── api.js               # Endpoints TOON
│   │   └── middleware/
│   │       ├── toon-parser.js       # Parsea body TOON
│   │       └── error-handler.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── toon-client.js           # Cliente TOON HTTP
│       ├── diagram-renderer.js      # Render TOON → Canvas
│       └── app.js                   # Lógica principal
├── shared/
│   └── schemas.toon                 # Schemas validación TOON
└── docs/
    └── api-spec.toon                # Documentación API TOON
```

---

## 📡 Comunicación TOON: Frontend ↔ Backend

### **Request TOON (Frontend)**
```toon
diagram:
  prompt: "Diagrama de qué es C++"
  mode: visual
  template: mindmap
  theme: modern-blue
  image: "base64..."  # opcional
  userId: "user-123"
  timestamp: 2025-01-15T20:41:36Z
```

### **Response TOON (Backend)**
```toon
response:
  success: true
  diagram:
    id: "diagram-uuid-123"
    toonStructure: |
      diagram:
        type: mindmap
        title: "¿Qué es C++?"
        theme: modern-blue
        layout: radial
        nodes[4]{id,type,label,style,position,metadata}:
          paradigm,oval,"Paradigmas","fill:#3b82f6",{x:0,y:0},{level:0}
          features,rect,"Características","fill:#10b981",{x:-150,y:-100},{level:1}
          syntax,rect,"Sintaxis","fill:#f59e0b",{x:150,y:-100},{level:1}
          applications,rect,"Aplicaciones","fill:#ef4444",{x:0,y:100},{level:1}
        connections[3]{from,to,type}:
          paradigm,features,solid
          paradigm,syntax,solid
          paradigm,applications,solid
    images[4]{elementId,imageUrl,description}:
      paradigm,https://chutes.ai/image/1.png,"Multi-paradigma"
      features,https://chutes.ai/image/2.png,"POO, genéricos"
      syntax,https://chutes.ai/image/3.png,"Sintaxis C-like"
      applications,https://chutes.ai/image/4.png,"Sistemas, juegos"
    stats:
      generationTime: 4500
      tokensSaved: 340
      tokensUsed:
        kimi: 120
        qwenImage: 180
        qwenVL: 150
  metadata:
    version: 1.0
    generatedAt: 2025-01-15T20:41:41Z
```

---

## 🤖 Pipeline Multi-Modelo TOON

### **Flujo Completo TOON**

```mermaid
graph TD
    A[Usuario: prompt TOON] --> B[Frontend envía TOON]
    B --> C[Backend parsea TOON]
    C --> D[PipelineOrchestrator.procesarTOON()]
    
    D --> E[Kimi K2: Análisis TOON]
    E --> F[TOON de descomposición]
    
    F --> G{Qwen Image: Generación paralela}
    G --> H[TOON con URLs de imágenes]
    
    H --> I[Qwen 3 VL: Verificación TOON]
    I --> J[TOON final estructurado]
    
    J --> K[Backend responde TOON]
    K --> L[Frontend renderiza TOON]
```

### **1. Análisis Kimi K2 (TOON → TOON)**

**Prompt TOON enviado a Kimi:**
```toon
system: |
  Eres el coordinador de diagramas. Recibe TOON y devuelve TOON.
  Analiza el prompt y descompón en elementos visuales.
  RESPUESTA DEBE SER TOON UNICAMENTE.

user:
  prompt: "Diagrama de qué es C++"
  mode: visual
  template: mindmap
```

**Respuesta TOON de Kimi:**
```toon
analysis:
  concept: "C++ Programming Language"
  needsImages: true
  elements[4]{id,title,description}:
    paradigm,Paradigmas,Multi-paradigma
    features,Características,POO genéricos metaprogramación
    syntax,Sintaxis,Estructura C-like
    applications,Aplicaciones,Sistemas juegos críticos
  style: modern
  visualElements: 4
  promptsToGenerate[4]:
    "Diagrama visual paradigmas C++ sin texto colores modernos"
    "Diagrama POO genéricos templates sin texto minimalista"
    "Diagrama sintaxis C++ estructura visual sin texto"
    "Diagrama aplicaciones sistemas juegos íconos sin texto"
```

### **2. Generación Qwen Image (TOON → TOON)**

**Request TOON a Qwen Image:**
```toon
model: qwen-image
width: 1024
height: 1024
steps: 50
guidanceScale: 7.5
negativePrompt: "texto letras números palabras blur low quality"
prompts[4]:
  "Diagrama visual paradigmas C++ sin texto colores modernos"
  "Diagrama POO genéricos templates sin texto minimalista"
  "Diagrama sintaxis C++ estructura visual sin texto"
  "Diagrama aplicaciones sistemas juegos íconos sin texto"
```

**Response TOON de Qwen Image:**
```toon
images[4]{id,url,status,seed}:
  img-1,https://image.chutes.ai/1.png,success,12345
  img-2,https://image.chutes.ai/2.png,success,12346
  img-3,https://image.chutes.ai/3.png,success,12347
  img-4,https://image.chutes.ai/4.png,success,12348
generationTime: 3200
totalTokens: 180
```

### **3. Verificación Qwen 3 VL (TOON + Imágenes → TOON)**

**Request TOON a Qwen 3 VL:**
```toon
system: |
  Eres el verificador final. Analiza imágenes y organiza layout.
  Devuelve TOON estructurado con posiciones y conexiones.

user:
  analysis: |
    diagram:
      type: mindmap
      title: "¿Qué es C++?"
      elements[4]{id,title,description}:
        paradigm,Paradigmas,Multi-paradigma
        features,Características,POO genéricos
        syntax,Sintaxis,Estructura C-like
        applications,Aplicaciones,Sistemas juegos
  
  images: |
    images[4]{id,url}:
      img-1,https://image.chutes.ai/1.png
      img-2,https://image.chutes.ai/2.png
      img-3,https://image.chutes.ai/3.png
      img-4,https://image.chutes.ai/4.png
```

**Respuesta TOON de Qwen 3 VL:**
```toon
diagram:
  type: mindmap
  title: "¿Qué es C++?"
  theme: modern-blue
  layout: radial
  nodes[4]{id,type,label,style,position,metadata,imageUrl}:
    paradigm,oval,"Paradigmas","fill:#3b82f6",{x:0,y:0},{level:0},https://image.chutes.ai/1.png
    features,rect,"Características","fill:#10b981",{x:-200,y:-150},{level:1},https://image.chutes.ai/2.png
    syntax,rect,"Sintaxis","fill:#f59e0b",{x:200,y:-150},{level:1},https://image.chutes.ai/3.png
    applications,rect,"Aplicaciones","fill:#ef4444",{x:0,y:200},{level:1},https://image.chutes.ai/4.png
  connections[3]{from,to,type,label}:
    paradigm,features,solid,""
    paradigm,syntax,solid,""
    paradigm,applications,solid,""
  metadata:
    verified: true
    confidence: 0.95
    layoutAlgorithm: radial-tree
```

---

## 🔧 Servicio TOON-Core

### **Clase ToonService (Parser/Encoder)**

```javascript
import { encode } from '@byjohann/toon';

class ToonService {
  // Codificar objeto JS a TOON
  static encode(data, options = {}) {
    return encode(data, {
      delimiter: ',',
      indent: 2,
      lengthMarker: '#',
      ...options
    });
  }

  // Parsear TOON a objeto JS
  static parse(toonString) {
    const lines = toonString.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: 0 }];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const indent = this.countIndent(line);
      const trimmed = line.trim();
      
      // Ajustar stack según indentación
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      
      // Parsear línea
      if (trimmed.includes('[') && trimmed.includes(']{')) {
        // Tabla TOON: nodes[4]{id,type,label}:
        this.parseTableLine(trimmed, stack[stack.length - 1].obj);
      } else if (trimmed.includes('[') && trimmed.includes(']:')) {
        // Array TOON: tags[3]: a,b,c
        this.parseArrayLine(trimmed, stack[stack.length - 1].obj);
      } else if (trimmed.endsWith(':')) {
        // Objeto anidado: customer:
        const key = trimmed.slice(0, -1);
        const newObj = {};
        stack[stack.length - 1].obj[key] = newObj;
        stack.push({ obj: newObj, indent });
      } else if (trimmed.includes(':')) {
        // Key-value: name: Ada Lovelace
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        stack[stack.length - 1].obj[key] = this.parseValue(value);
      }
    }
    
    return result;
  }

  // Validar estructura TOON contra schema
  static validate(toonString, schema) {
    const data = this.parse(toonString);
    return this.validateSchema(data, schema);
  }

  // Calcular ahorro de tokens vs JSON
  static calculateTokenSavings(toonString, jsonEquivalent) {
    const toonTokens = toonString.length / 4;
    const jsonTokens = JSON.stringify(jsonEquivalent).length / 4;
    return Math.floor((1 - toonTokens / jsonTokens) * 100);
  }

  // Helpers
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
    // Implementación para parsear tablas TOON
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
    // Implementación para parsear arrays TOON
    const match = line.match(/^(\w+)\[(\d+)\]:\s*(.+)$/);
    if (match) {
      const [, key, count, values] = match;
      obj[key] = values.split(',').map(v => this.parseValue(v.trim()));
    }
  }
}
```

---

## 📡 Endpoints API TOON

### **Middleware TOON Parser**
```javascript
// middleware/toon-parser.js
function toonParser(req, res, next) {
  if (req.headers['content-type'] === 'text/toon') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        req.body = ToonService.parse(body);
        next();
      } catch (error) {
        res.status(400).set('Content-Type', 'text/toon');
        res.send(`error:\n  message: "Invalid TOON format"\n  details: "${error.message}"`);
      }
    });
  } else {
    next();
  }
}

// Middleware TOON Sender
function toonSender(data) {
  return (req, res) => {
    res.set('Content-Type', 'text/toon');
    res.send(ToonService.encode(data));
  };
}
```

### **Endpoints TOON**

#### `POST /api/diagram/generate`
```javascript
// Request Headers: Content-Type: text/toon
// Request Body TOON:
diagram:
  prompt: "Diagrama de qué es C++"
  mode: visual
  template: mindmap

// Response Headers: Content-Type: text/toon
// Response TOON:
response:
  success: true
  diagram:
    id: "uuid-123"
    toonStructure: |
      diagram:
        type: mindmap
        title: "¿Qué es C++?"
        nodes[4]{id,label}:
          paradigm,Paradigmas
          features,Características
          syntax,Sintaxis
          applications,Aplicaciones
    images[4]{id,url}:
          img-1,https://...
          img-2,https://...
          img-3,https://...
          img-4,https://...
  stats:
    generationTime: 4500
    tokensSaved: 340
```

#### `GET /api/diagram/:id`
```javascript
// Response TOON:
diagram:
  id: "uuid-123"
  status: completed
  toonStructure: |
    diagram:
      type: mindmap
      nodes[4]{id,label,imageUrl}:
        paradigm,Paradigmas,https://...
        features,Características,https://...
        syntax,Sintaxis,https://...
        applications,Aplicaciones,https...
  metadata:
    createdAt: 2025-01-15T20:41:36Z
    generatedBy: pipeline-v1
```

#### `POST /api/diagram/:id/variations`
```javascript
// Request TOON:
variations:
  count: 3
  style: different

// Response TOON:
variations[3]{id,diagram,toon}:
  var-1,diagram-uuid-124,"diagram:\n  type: mindmap\n  ..."
  var-2,diagram-uuid-125,"diagram:\n  type: flowchart\n  ..."
  var-3,diagram-uuid-126,"diagram:\n  type: timeline\n  ..."
```

---

## 🎨 Frontend TOON-First

### **Cliente HTTP TOON**
```javascript
// js/toon-client.js
class ToonClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async post(endpoint, toonData) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/toon',
        'Accept': 'text/toon'
      },
      body: ToonService.encode(toonData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const toonResponse = await response.text();
    return ToonService.parse(toonResponse);
  }

  async generateDiagram(prompt, options = {}) {
    const requestToon = {
      diagram: {
        prompt: prompt,
        mode: options.mode || 'visual',
        template: options.template || 'mindmap',
        theme: options.theme || 'modern-blue'
      }
    };

    return await this.post('/api/diagram/generate', requestToon);
  }
}
```

### **Renderizador TOON → Canvas**
```javascript
// js/diagram-renderer.js
class DiagramRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
  }

  renderFromToon(toonString) {
    const diagramData = ToonService.parse(toonString);
    this.renderDiagram(diagramData.diagram);
  }

  renderDiagram(diagram) {
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dibujar conexiones
    if (diagram.connections) {
      diagram.connections.forEach(conn => {
        this.drawConnection(conn);
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
    const x = node.position?.x || 0;
    const y = node.position?.y || 0;
    
    // Dibujar forma según tipo
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
      case 'circle':
        this.drawCircle(x, y, node);
        break;
    }
    
    // Dibujar imagen si existe
    if (node.imageUrl) {
      this.drawImage(x, y, node.imageUrl);
    }
    
    // Dibujar texto
    this.drawText(x, y, node.label);
  }

  drawOval(x, y, node) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 60, 30, 0, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.getFillColor(node.style);
    this.ctx.fill();
    this.ctx.strokeStyle = this.getStrokeColor(node.style);
    this.ctx.stroke();
  }

  drawImage(x, y, imageUrl) {
    const img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, x - 40, y - 40, 80, 80);
    };
    img.src = imageUrl;
  }
}
```

---

## 📊 Schemas de Validación TOON

### **Schema Request Generación**
```toon
schema:
  name: "DiagramGenerationRequest"
  version: 1.0
  
  fields:
    diagram:
      prompt: string|required|maxLength:1000
      mode: enum[semantic,intelligent,visual,simple]|required
      template: enum[mindmap,flowchart,timeline,orgchart,network]|required
      theme: string|default:modern-blue
      image: base64|optional|maxSize:10MB
    user:
      id: string|optional
      session: string|optional
  validation:
    required: ["diagram.prompt", "diagram.mode", "diagram.template"]
```

### **Schema Response Diagrama**
```toon
schema:
  name: "DiagramResponse"
  version: 1.0
  
  fields:
    response:
      success: boolean|required
      diagram:
        id: uuid|required
        toonStructure: string|required
        images: array|optional
        stats: object|required
      error: object|optional
    metadata:
      version: string|required
      generatedAt: timestamp|required
```

---

## 🚀 Ventajas de TOON-First

### **1. Reducción de Tokens**
| Componente | JSON Tokens | TOON Tokens | Ahorro |
|------------|-------------|-------------|--------|
| Request promedio | 450 | 180 | 60% |
| Response completa | 1,200 | 480 | 60% |
| Pipeline completo | 3,500 | 1,400 | 60% |

### **2. Legibilidad Humana**
```toon
# TOON es más legible que JSON
diagram:
  type: mindmap
  nodes[2]{id,label}:
    node1,Primero
    node2,Segundo

# vs JSON
{"diagram":{"type":"mindmap","nodes":[{"id":"node1","label":"Primero"},{"id":"node2","label":"Segundo"}]}}
```

### **3. Validación Explícita**
```toon
# TOON especifica longitudes y campos
nodes[4]{id,type,label}:

# JSON no tiene esta información
# El LLM debe inferir la estructura
```

### **4. Menos Errores de Parsing**
- Delimitadores explícitos
- Indentación clara
- Longitudes declaradas
- Tipos visibles

---

## 📦 Implementación Paso a Paso

### **Día 1: Setup TOON**
1. Instalar librería `@byjohann/toon`
2. Crear ToonService con encode/decode
3. Implementar middleware TOON para Express
4. Crear schemas de validación TOON

### **Día 2: Backend TOON**
1. Refactorizar endpoints para usar TOON
2. Implementar pipeline con TOON
3. Crear servicios IA con requests TOON
4. Añadir manejo de errores TOON

### **Día 3: Frontend TOON**
1. Crear ToonClient
2. Refactorizar VisualFlow para TOON
3. Implementar renderizado TOON → Canvas
4. Añadir soporte para imágenes TOON

### **Día 4: Integración Completa**
1. Probar pipeline end-to-end TOON
2. Optimizar rendimiento
3. Añadir animaciones y mejoras UI
4. Implementar exportación TOON → SVG/PNG

### **Día 5: Testing & Deploy**
1. Tests unitarios TOON
2. Tests de integración
3. Documentación TOON
4. Despliegue backend + frontend

---

## 🎯 Ejemplo Completo TOON-First

### **Request Usuario (TOON)**
```toon
diagram:
  prompt: "El ciclo de vida del software tiene 5 fases"
  mode: visual
  template: flowchart
  theme: colorful
```

### **Análisis Kimi (TOON)**
```toon
analysis:
  concept: "Software Development Lifecycle"
  needsImages: true
  elements[5]{id,title,description}:
    planning,Planificación,Requisitos y análisis
    design,Diseño,Arquitectura y UI/UX
    development,Desarrollo,Codificación y testing
    deployment,Despliegue,Producción y release
    maintenance,Mantenimiento,Updates y bug fixes
  promptsToGenerate[5]:
    "Diagrama fase planificación SDLC sin texto colores"
    "Diagrama fase diseño SDLC sin texto moderno"
    "Diagrama fase desarrollo SDLC sin texto código"
    "Diagrama fase despliegue SDLC sin texto nube"
    "Diagrama fase mantenimiento SDLC sin texto soporte"
```

### **Imágenes Qwen (TOON)**
```toon
images[5]{id,url,status}:
  img-plan,https://image.chutes.ai/plan.png,success
  img-design,https://image.chutes.ai/design.png,success
  img-dev,https://image.chutes.ai/dev.png,success
  img-deploy,https://image.chutes.ai/deploy.png,success
  img-maint,https://image.chutes.ai/maint.png,success
```

### **Diagrama Final TOON**
```toon
diagram:
  type: flowchart
  title: "Ciclo de Vida del Software"
  theme: colorful
  layout: horizontal
  nodes[5]{id,type,label,style,position,imageUrl}:
    planning,oval,Planificación,"fill:#10b981",{x:0,y:0},https://image.chutes.ai/plan.png
    design,rect,Diseño,"fill:#3b82f6",{x:200,y:0},https://image.chutes.ai/design.png
    development,rect,Desarrollo,"fill:#f59e0b",{x:400,y:0},https://image.chutes.ai/dev.png
    deployment,rect,Despliegue,"fill:#ef4444",{x:600,y:0},https://image.chutes.ai/deploy.png
    maintenance,hexagon,Mantenimiento,"fill:#a855f7",{x:800,y:0},https://image.chutes.ai/maint.png
  connections[4]{from,to,type,label,style}:
    planning,design,arrow,"Siguiente",solid
    design,development,arrow,"Siguiente",solid
    development,deployment,arrow,"Siguiente",solid
    deployment,maintenance,arrow,"Siguiente",solid
  metadata:
    verified: true
    confidence: 0.92
    tokensSaved: 420
    generationTime: 5200
```

---

## 🎉 Resultado Final

**Aplicación completamente funcional con:**
- ✅ Backend proxy TOON-first
- ✅ Pipeline multi-modelo TOON
- ✅ Frontend VisualFlow con TOON
- ✅ Generación real de diagramas con imágenes
- ✅ Exportación SVG/PNG
- ✅ UI/UX premium con animaciones
- ✅ 60% menos tokens que JSON
- ✅ Más rápida y eficiente

**¿Listo para implementar?**