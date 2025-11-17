# Formato TOON para Estructuras de Diagramas

## 🎯 Propósito
Formato optimizado para representar diagramas visuales con mínimo consumo de tokens (30-60% menos que JSON).

## 📋 Estructura Base

```toon
diagram:
  type: flowchart|mindmap|timeline|orgchart|network
  title: "Título del Diagrama"
  description: "Descripción opcional"
  theme: modern|professional|colorful|minimal
  layout: horizontal|vertical|radial|tree
  
  nodes[COUNT]{id,type,label,style,position,metadata}:
    ID1,TYPE1,LABEL1,STYLE1,{x:X1,y:Y1},{key1:value1}
    ID2,TYPE2,LABEL2,STYLE2,{x:X2,y:Y2},{key2:value2}
  
  connections[COUNT]{from,to,type,label,style}:
    FROM1,TO1,TYPE1,LABEL1,STYLE1
    FROM2,TO2,TYPE2,LABEL2,STYLE2
  
  groups[COUNT]{id,label,nodes,style}:
    GROUP1,LABEL1,[NODES1],STYLE1
    GROUP2,LABEL2,[NODES2],STYLE2
  
  metadata:
    created: TIMESTAMP
    version: "1.0"
    tokens_saved: NUMBER
```

## 🎨 Tipos de Nodos

| Tipo | Descripción | Estilos |
|------|-------------|---------|
| `oval` | Inicio/Fin | fill, stroke, gradient |
| `rect` | Proceso | rounded, shadow, border |
| `diamond` | Decisión | rotation, gradient |
| `circle` | Estado | fill, pulse |
| `hexagon` | Subproceso | gradient, shadow |
| `parallelogram` | Input/Output | skew, gradient |

## 🔗 Tipos de Conexiones

| Tipo | Descripción |
|------|-------------|
| `solid` | Línea sólida |
| `dashed` | Línea punteada |
| `arrow` | Flecha direccional |
| `bidirectional` | Doble flecha |
| `curved` | Curva bezier |

## 💾 Ejemplos

### Diagrama de Flujo Simple
```toon
diagram:
  type: flowchart
  title: "Proceso de Login"
  theme: modern
  layout: vertical
  
  nodes[4]{id,type,label,style,position}:
    start,oval,"Inicio","fill:#4CAF50",{}
    input,parallelogram,"Usuario+Contraseña","fill:#2196F3",{}
    validate,diamond,"¿Valido?","fill:#FF9800",{}
    success,rect,"Dashboard","fill:#4CAF50",{}
    error,rect,"Error","fill:#F44336",{}
  
  connections[4]{from,to,type,label}:
    start,input,solid,""
    input,validate,solid,""
    validate,success,arrow,"Sí"
    validate,error,arrow,"No"
```

### Mapa Mental
```toon
diagram:
  type: mindmap
  title: "Plan de Proyecto"
  theme: colorful
  layout: radial
  
  nodes[6]{id,type,label,style,position,metadata}:
    central,circle,"Proyecto","fill:gradient-purple",{},{"level":0}
    research,rect,"Investigación","fill:blue",{},{"level":1}
    design,rect,"Diseño","fill:green",{},{"level":1}
    dev,rect,"Desarrollo","fill:orange",{},{"level":1}
    test,rect,"Testing","fill:red",{},{"level":1}
    deploy,rect,"Deploy","fill:purple",{},{"level":1}
  
  connections[5]{from,to,type}:
    central,research,solid
    central,design,solid
    central,dev,solid
    central,test,solid
    central,deploy,solid
```

### Línea de Tiempo
```toon
diagram:
  type: timeline
  title: "Roadmap 2024"
  theme: professional
  layout: horizontal
  
  nodes[4]{id,type,label,style,position,metadata}:
    q1,rect,"Q1: Planificación","fill:indigo",{x:0,y:0},{"date":"2024-01"}
    q2,rect,"Q2: Diseño","fill:blue",{x:100,y:0},{"date":"2024-04"}
    q3,rect,"Q3: Desarrollo","fill:green",{x:200,y:0},{"date":"2024-07"}
    q4,rect,"Q4: Lanzamiento","fill:purple",{x:300,y:0},{"date":"2024-10"}
  
  connections[3]{from,to,type}:
    q1,q2,dashed,""
    q2,q3,dashed,""
    q3,q4,dashed,""
```

## 📊 Comparación: JSON vs TOON

### JSON (245 tokens)
```json
{
  "diagram": {
    "type": "flowchart",
    "title": "Proceso de Login",
    "nodes": [
      {"id": "start", "type": "oval", "label": "Inicio", "style": "fill:#4CAF50"},
      {"id": "input", "type": "parallelogram", "label": "Usuario+Contraseña", "style": "fill:#2196F3"},
      {"id": "validate", "type": "diamond", "label": "¿Valido?", "style": "fill:#FF9800"}
    ],
    "connections": [
      {"from": "start", "to": "input", "type": "solid"},
      {"from": "input", "to": "validate", "type": "solid"}
    ]
  }
}
```

### TOON (98 tokens) - **60% menos**
```toon
diagram:
  type: flowchart
  title: Proceso de Login
  nodes[3]{id,type,label,style}:
    start,oval,Inicio,fill:#4CAF50
    input,parallelogram,Usuario+Contraseña,fill:#2196F3
    validate,diamond,¿Valido?,fill:#FF9800
  connections[2]{from,to,type}:
    start,input,solid
    input,validate,solid
```

## 🚀 Ventajas

1. **60% menos tokens** vs JSON equivalente
2. **Legible para humanos y IA**
3. **Estructura tabular** para arrays uniformes
4. **Metadata integrada** para estilos y posiciones
5. **Tipos específicos** para diagramas
6. **Fácil parsing** con librerías TOON

## 🔧 Implementación

```javascript
// Conversión TOON ↔ JavaScript Object
import { encode, decode } from '@byjohann/toon';

// Objeto JS → TOON (para enviar a API)
const toonString = encode(diagramObject);

// TOON → Objeto JS (para renderizar)
const diagramObject = decode(toonString);
```

## 📈 Optimización de Tokens

| Elemento | JSON Tokens | TOON Tokens | Ahorro |
|----------|-------------|-------------|--------|
| 10 nodos | 450 | 180 | 60% |
| 20 conexiones | 300 | 120 | 60% |
| Metadata | 80 | 30 | 62% |
| **Total típico** | **830** | **330** | **60%** |