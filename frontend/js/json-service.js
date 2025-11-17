/**
 * JsonService - Servicio para manejo de JSON en VisualFlow
 * 
 * Reemplaza al complejo formato TOON con JSON estándar
 * para mayor compatibilidad y facilidad de uso.
 * 
 * @version 1.0.0
 * @author VisualFlow Team
 */

export class JsonService {
  /**
   * Codifica un objeto JavaScript a JSON string
   * @param {any} data - Objeto a codificar
   * @param {Object} options - Opciones de codificación
   * @returns {string} String JSON
   */
  static encode(data, options = {}) {
    const config = {
      indent: 2,
      sortKeys: false,
      ...options
    };

    try {
      if (config.sortKeys && typeof data === 'object' && data !== null) {
        data = this.sortObjectKeys(data);
      }
      
      return JSON.stringify(data, null, config.indent);
    } catch (error) {
      console.error('Error codificando JSON:', error);
      throw new Error(`Error codificando JSON: ${error.message}`);
    }
  }

  /**
   * Parsea un string JSON a objeto JavaScript
   * @param {string} jsonString - String JSON
   * @returns {any} Objeto JavaScript
   */
  static parse(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return null;
    }

    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parseando JSON:', error);
      throw new Error(`Error parseando JSON: ${error.message}`);
    }
  }

  /**
   * Crea un diagrama JSON desde un análisis
   * @param {Object} analysis - Análisis del concepto
   * @param {Array} images - Imágenes generadas
   * @returns {string} Diagrama en formato JSON
   */
  static createDiagram(analysis, images = []) {
    const elements = analysis.analysis?.elements || [];
    const concept = analysis.analysis?.concept || 'Diagrama';
    const theme = analysis.analysis?.style || 'modern';
    
    const diagram = {
      diagram: {
        type: 'flowchart',
        title: concept,
        theme: theme,
        layout: 'vertical',
        nodes: elements.map((el, i) => ({
          id: el.id || `node-${i}`,
          type: 'rect',
          label: el.title || el.description || '',
          style: this.getNodeStyle(theme, i),
          position: {
            x: 0,
            y: i * 120
          },
          image: images[i]?.url || null,
          imageUrl: images[i]?.url || null
        })),
        connections: this.createConnections(elements),
        metadata: {
          verified: true,
          hasImages: images.length > 0,
          generatedAt: new Date().toISOString(),
          imageCount: images.length
        }
      }
    };

    return this.encode(diagram);
  }

  /**
   * Crea conexiones entre nodos
   * @param {Array} elements - Elementos del diagrama
   * @returns {Array} Array de conexiones
   */
  static createConnections(elements) {
    const connections = [];
    
    for (let i = 0; i < elements.length - 1; i++) {
      connections.push({
        from: elements[i].id || `node-${i}`,
        to: elements[i + 1].id || `node-${i + 1}`,
        type: 'solid'
      });
    }
    
    return connections;
  }

  /**
   * Obtiene estilo para un nodo según el tema
   * @param {string} theme - Tema del diagrama
   * @param {number} index - Índice del nodo
   * @returns {string} Estilo CSS del nodo
   */
  static getNodeStyle(theme, index) {
    const themes = {
      modern: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      minimal: ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'],
      colorful: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      corporate: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7']
    };

    const colors = themes[theme] || themes.modern;
    const color = colors[index % colors.length];
    
    return `fill:${color};stroke:#ffffff;stroke-width:2`;
  }

  /**
   * Valida una estructura JSON contra un schema
   * @param {string|Object} jsonInput - JSON string u objeto
   * @param {Object} schema - Schema de validación
   * @returns {boolean} true si es válido
   */
  static validate(jsonInput, schema) {
    try {
      const data = typeof jsonInput === 'string' ? this.parse(jsonInput) : jsonInput;
      return this.validateSchema(data, schema);
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida un objeto contra un schema básico
   * @param {Object} data - Datos a validar
   * @param {Object} schema - Schema de validación
   * @returns {boolean} true si es válido
   */
  static validateSchema(data, schema) {
    if (!schema || !data) return true;
    
    // Validación básica de campos requeridos
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          console.error(`Campo requerido faltante: ${field}`);
          return false;
        }
      }
    }
    
    // Validación de tipos
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data && fieldSchema.type) {
          const expectedType = fieldSchema.type;
          const actualType = typeof data[field];
          
          if (expectedType === 'array' && !Array.isArray(data[field])) {
            console.error(`Campo ${field} debe ser array, es ${actualType}`);
            return false;
          }
          
          if (expectedType !== 'array' && actualType !== expectedType) {
            console.error(`Campo ${field} debe ser ${expectedType}, es ${actualType}`);
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Ordena las claves de un objeto recursivamente
   * @param {Object} obj - Objeto a ordenar
   * @returns {Object} Objeto con claves ordenadas
   */
  static sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sorted = {};
      const keys = Object.keys(obj).sort();
      
      for (const key of keys) {
        sorted[key] = this.sortObjectKeys(obj[key]);
      }
      
      return sorted;
    }
    
    return obj;
  }

  /**
   * Formatea un JSON string para mejor legibilidad
   * @param {string} jsonString - String JSON
   * @returns {string} JSON formateado
   */
  static format(jsonString) {
    try {
      const data = this.parse(jsonString);
      return this.encode(data, { indent: 2, sortKeys: true });
    } catch (error) {
      console.error('Error formateando JSON:', error);
      return jsonString;
    }
  }

  /**
   * Compara dos objetos JSON
   * @param {Object} obj1 - Primer objeto
   * @param {Object} obj2 - Segundo objeto
   * @returns {boolean} true si son iguales
   */
  static equals(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /**
   * Clona un objeto JSON
   * @param {Object} obj - Objeto a clonar
   * @returns {Object} Objeto clonado
   */
  static clone(obj) {
    return this.parse(this.encode(obj));
  }

  /**
   * Fusiona dos objetos JSON
   * @param {Object} target - Objeto target
   * @param {Object} source - Objeto source
   * @returns {Object} Objeto fusionado
   */
  static merge(target, source) {
    const result = this.clone(target);
    
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.merge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Obtiene un valor desde un path (dot notation)
   * @param {Object} obj - Objeto
   * @param {string} path - Path (ej: 'diagram.nodes.0.label')
   * @returns {any} Valor encontrado
   */
  static getValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Establece un valor en un path (dot notation)
   * @param {Object} obj - Objeto
   * @param {string} path - Path (ej: 'diagram.nodes.0.label')
   * @param {any} value - Valor a establecer
   */
  static setValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Crea un diagrama JSON de ejemplo para testing
   * @returns {string} Diagrama JSON de ejemplo
   */
  static createExampleDiagram() {
    const example = {
      diagram: {
        type: 'flowchart',
        title: 'Proceso de Aprendizaje',
        theme: 'modern',
        layout: 'vertical',
        nodes: [
          {
            id: 'step1',
            type: 'rect',
            label: 'Adquirir conocimiento',
            style: 'fill:#3b82f6;stroke:#ffffff;stroke-width:2',
            position: { x: 0, y: 0 },
            image: null,
            imageUrl: null
          },
          {
            id: 'step2',
            type: 'rect',
            label: 'Practicar y reflexionar',
            style: 'fill:#10b981;stroke:#ffffff;stroke-width:2',
            position: { x: 0, y: 120 },
            image: null,
            imageUrl: null
          },
          {
            id: 'step3',
            type: 'rect',
            label: 'Aplicar y dominar',
            style: 'fill:#f59e0b;stroke:#ffffff;stroke-width:2',
            position: { x: 0, y: 240 },
            image: null,
            imageUrl: null
          }
        ],
        connections: [
          { from: 'step1', to: 'step2', type: 'solid' },
          { from: 'step2', to: 'step3', type: 'solid' }
        ],
        metadata: {
          verified: true,
          hasImages: false,
          generatedAt: new Date().toISOString(),
          imageCount: 0
        }
      }
    };

    return this.encode(example);
  }
}

// Exportar para uso global
window.JsonService = JsonService;

// Tests básicos
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 JsonService cargado. Ejecutando tests...');
  
  // Test 1: Encode/Decode simple
  const test1 = { name: 'Ada', age: 30 };
  const encoded1 = JsonService.encode(test1);
  const decoded1 = JsonService.parse(encoded1);
  console.assert(decoded1.name === 'Ada' && decoded1.age === 30, 'Test 1 falló');
  
  // Test 2: Crear diagrama
  const analysis = {
    analysis: {
      concept: 'Test Diagram',
      elements: [
        { id: 'el1', title: 'Element 1' },
        { id: 'el2', title: 'Element 2' }
      ]
    }
  };
  const diagramJson = JsonService.createDiagram(analysis);
  const diagram = JsonService.parse(diagramJson);
  console.assert(diagram.diagram.title === 'Test Diagram', 'Test 2 falló');
  
  // Test 3: Validación
  const schema = {
    required: ['name'],
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  };
  console.assert(JsonService.validate(test1, schema) === true, 'Test 3 falló');
  
  console.log('✅ Tests de JsonService completados');
}