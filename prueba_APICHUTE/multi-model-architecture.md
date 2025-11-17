# 🏗️ Arquitectura Multi-Modelo: Diagramas con IA

## 🎯 Roles de los Modelos

### **Kimi K2 - "El Cerebro"** 🧠
**Modelo**: `moonshotai/Kimi-K2-Thinking`  
**Endpoint**: `https://llm.chutes.ai/v1/chat/completions`  
**Rol**: Coordinador y planificador principal

**Funciones:**
- Recibe solicitud del usuario (ej: "diagrama de qué es C++")
- Descompone la tarea en subtareas
- Consulta APIs y bases de conocimiento
- Envía peticiones específicas a Qwen Image
- Verifica coherencia del contenido
- Genera estructura TOON final
- Coordina el pipeline completo

**Prompt de sistema:**
```
Eres el coordinador de creación de diagramas visuales. Tu tarea es:
1. Analizar la solicitud del usuario
2. Descomponer en elementos visuales necesarios
3. Generar prompts específicos para Qwen Image
4. Verificar que las imágenes sean coherentes
5. Crear estructura TOON final
6. No generes texto en las imágenes, solo elementos visuales
```

---

### **Qwen Image - "El Artista"** 🎨
**Modelo**: `qwen-image`  
**Endpoint**: `https://image.chutes.ai/generate`  
**Rol**: Generador de imágenes visuales

**Funciones:**
- Recibe prompts específicos de Kimi K2
- Genera imágenes sin texto (solo elementos visuales)
- Parámetros: 1024x1024, 50 steps, guidance_scale 7.5
- Estilo: limpio, profesional, sin texto

**Ejemplo de prompt:**
```json
{
  "model": "qwen-image",
  "prompt": "Diagrama visual de herencia en C++, flechas entre clases, colores modernos, sin texto, estilo minimalista",
  "negative_prompt": "texto, letras, números, blur, low quality, distortion",
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 50,
  "guidance_scale": 7.5
}
```

---

### **Qwen 3 VL - "El Organizador"** 👁️
**Modelo**: `Qwen/Qwen3-VL-235B-A22B-Instruct`  
**Endpoint**: `https://llm.chutes.ai/v1/chat/completions`  
**Rol**: Verificador y estructurador final

**Funciones:**
- Recibe imágenes generadas por Qwen Image
- Analiza visualmente cada imagen con visión
- Verifica que todo esté correcto y coherente
- Organiza todo en una estructura visual bonita
- Genera layout final estructurado
- Entrega al usuario el resultado final

**Prompt de sistema:**
```
Eres el verificador final de diagramas. Tu tarea es:
1. Analizar las imágenes generadas
2. Verificar que representan correctamente el concepto
3. Organizar todo en una estructura visual coherente
4. Crear layout final profesional
5. Asegurar que el resultado sea bonito y estructural
6. No modifiques el contenido, solo organiza la presentación
```

---

## 🔄 Pipeline de Trabajo Completo

```mermaid
graph TD
    A[Usuario: "Diagrama de qué es C++"] --> B[Kimi K2: Análisis]
    
    B --> C[Kimi K2: Descomponer en elementos]
    C --> D{¿Necesita imágenes?}
    
    D -->|Sí| E[Kimi K2: Generar prompts para Qwen Image]
    E --> F[Qwen Image: Generar imagen 1]
    E --> G[Qwen Image: Generar imagen 2]
    E --> H[Qwen Image: Generar imagen N]
    
    F --> I[Kimi K2: Verificar coherencia]
    G --> I
    H --> I
    
    I --> J[Kimi K2: Crear estructura TOON]
    J --> K[Qwen 3 VL: Analizar imágenes]
    
    K --> L[Qwen 3 VL: Organizar layout final]
    L --> M[Entregar diagrama estructurado al usuario]
    
    D -->|No| N[Kimi K2: Generar diagrama textual]
    N --> O[Qwen 3 VL: Formatear salida]
    O --> M
```

---

## 📋 Flujo de Trabajo por Ejemplo

### **Ejemplo: "Diagrama de qué es C++"**

#### **Paso 1: Kimi K2 Análisis**
```javascript
// Kimi K2 recibe: "Diagrama de qué es C++"
// Devuelve descomposición:

{
  "concept": "C++ Programming Language",
  "elements": [
    {"type": "paradigm", "title": "Paradigmas", "description": "Multi-paradigma"},
    {"type": "features", "title": "Características", "description": "POO, genéricos, etc"},
    {"type": "syntax", "title": "Sintaxis", "description": "Estructura básica"},
    {"type": "applications", "title": "Aplicaciones", "description": "Sistemas, juegos, etc"}
  ],
  "visual_elements_needed": 4,
  "style": "modern, professional, clean"
}
```

#### **Paso 2: Qwen Image Generación**
```javascript
// Kimi K2 envía prompts específicos:

// Prompt 1: Paradigmas
"Visual representation of programming paradigms in C++, clean diagram, arrows, modern colors, NO TEXT, minimalist style"

// Prompt 2: Características  
"Visual diagram of C++ features like classes, templates, inheritance, clean icons, NO TEXT, professional style"

// Prompt 3: Sintaxis
"Clean visual representation of C++ syntax structure, code blocks visualization, NO TEXT, modern design"

// Prompt 4: Aplicaciones
"Visual diagram of C++ applications: systems programming, game development, embedded systems, NO TEXT, icons only"
```

#### **Paso 3: Kimi K2 Verificación**
```javascript
// Verifica que cada imagen:
// ✅ No contiene texto
// ✅ Representa el concepto correcto
// ✅ Tiene calidad adecuada
// ✅ Estilo es consistente

// Genera estructura TOON:
diagram:
  type: mindmap
  title: "¿Qué es C++?"
  nodes[4]{id,image,description}:
    paradigm,IMG_PARADIGM,"Lenguaje multi-paradigma"
    features,IMG_FEATURES,"Soporta POO, genéricos, metaprogramación"
    syntax,IMG_SYNTAX,"Sintaxis derivada de C con extensiones"
    applications,IMG_APPLICATIONS,"Usado en sistemas, juegos, aplicaciones críticas"
```

#### **Paso 4: Qwen 3 VL Organización**
```javascript
// Recibe imágenes + estructura TOON
// Analiza cada imagen con visión
// Verifica coherencia visual
// Crea layout final estructurado
// Entrega al usuario:

"📊 Aquí está tu diagrama estructurado de 'Qué es C++':

[Imagen 1: Paradigmas] → Multi-paradigma
[Imagen 2: Características] → POO, Genéricos, etc.
[Imagen 3: Sintaxis] → Estructura C-like
[Imagen 4: Aplicaciones] → Sistemas, Juegos, Críticos

Layout organizado en grid 2x2 con títulos coherentes."
```

---

## 🛠️ Implementación Técnica

### **Configuración de Modelos**

```javascript
const CHUTES_MODELS = {
  // Kimi K2 - El cerebro
  coordinator: {
    model: "moonshotai/Kimi-K2-Thinking",
    endpoint: "https://llm.chutes.ai/v1/chat/completions",
    apiKey: "cpk_7d264dc3847b467ea59f4da1d1d050a3.980bfcccb81f51a3ab901cf5c53fc6e0.S6Mp1WEGMU6rThOvkgw4Lih43ndh5M2O",
    temperature: 0.7,
    maxTokens: 2000
  },
  
  // Qwen Image - El artista
  imageGenerator: {
    model: "qwen-image",
    endpoint: "https://image.chutes.ai/generate",
    apiKey: "cpk_7d264dc3847b467ea59f4da1d1d050a3.980bfcccb81f51a3ab901cf5c53fc6e0.S6Mp1WEGMU6rThOvkgw4Lih43ndh5M2O",
    width: 1024,
    height: 1024,
    steps: 50,
    guidanceScale: 7.5,
    negativePrompt: "texto, letras, números, blur, low quality, distortion"
  },
  
  // Qwen 3 VL - El organizador
  visualVerifier: {
    model: "Qwen/Qwen3-VL-235B-A22B-Instruct",
    endpoint: "https://llm.chutes.ai/v1/chat/completions",
    apiKey: "cpk_7d264dc3847b467ea59f4da1d1d050a3.980bfcccb81f51a3ab901cf5c53fc6e0.S6Mp1WEGMU6rThOvkgw4Lih43ndh5M2O",
    temperature: 0.5,
    maxTokens: 1500
  }
};
```

---

## 📊 Optimización con TOON

### **Uso de TOON en el Pipeline**

```javascript
// 1. Kimi K2 genera estructura TOON
const diagramStructure = encode({
  type: "mindmap",
  title: "Qué es C++",
  elements: [
    {id: "paradigm", image: "base64...", desc: "Multi-paradigma"},
    {id: "features", image: "base64...", desc: "POO, genéricos"}
  ]
});

// 2. Envia TOON a Qwen 3 VL (ahorra 60% tokens)
// 3. Qwen 3 VL decodifica y organiza
const finalDiagram = decode(toonString);
```

---

## 🎨 Estilos y Templates

### **Templates Predefinidos**

```javascript
const DIAGRAM_TEMPLATES = {
  educational: {
    style: "clean, colorful, icons",
    layout: "grid",
    maxImages: 6,
    background: "white"
  },
  professional: {
    style: "minimalist, corporate, charts",
    layout: "flow",
    maxImages: 8,
    background: "light-gray"
  },
  creative: {
    style: "artistic, gradients, illustrations",
    layout: "freeform",
    maxImages: 10,
    background: "gradient"
  }
};
```

---

## ✅ Checklist de Calidad

### **Kimi K2 Verifica:**
- [ ] Concepto descompuesto correctamente
- [ ] Prompts específicos y claros
- [ ] Coherencia entre elementos
- [ ] Estilo consistente

### **Qwen 3 VL Verifica:**
- [ ] Imágenes sin texto
- [ ] Calidad visual adecuada
- [ ] Representación correcta del concepto
- [ ] Layout estructurado y bonito

---

## 🚀 Próximos Pasos

1. **Implementar clase `DiagramOrchestrator`** (Kimi K2)
2. **Implementar clase `ImageGenerator`** (Qwen Image)
3. **Implementar clase `VisualVerifier`** (Qwen 3 VL)
4. **Integrar librería TOON**
5. **Crear interfaz de usuario para flujo de trabajo**
6. **Implementar sistema de exportación**

---

## 📈 Métricas de Éxito

- **Reducción de tokens**: 60% con TOON
- **Tiempo de generación**: <30 segundos por diagrama
- **Calidad visual**: >90% de satisfacción usuario
- **Coherencia**: 100% verificación automática
- **Sin texto en imágenes**: 100% cumplimiento