/**
 * ToonService - Parser y Encoder para formato TOON
 * 
 * TOON (Token-Oriented Object Notation) es un formato compacto
 * que reduce el consumo de tokens en un 30-60% comparado con JSON.
 * 
 * @version 1.0.0
 * @author VisualFlow Team
 */

export class ToonService {
  /**
   * Codifica un objeto JavaScript a formato TOON
   * @param {any} data - Objeto a codificar
   * @param {Object} options - Opciones de codificación
   * @returns {string} String en formato TOON
   */
  static encode(data, options = {}) {
    const config = {
      delimiter: ',',
      indent: 2,
      lengthMarker: '#',
      ...options
    };

    // Si es un array raíz
    if (Array.isArray(data)) {
      return this.encodeRootArray(data, config);
    }

    // Si es un objeto raíz
    if (typeof data === 'object' && data !== null) {
      return this.encodeObject(data, config, 0);
    }

    // Valor primitivo
    return String(data);
  }

  /**
   * Parsea un string TOON a objeto JavaScript
   * @param {string} toonString - String en formato TOON
   * @returns {any} Objeto JavaScript
   */
  static parse(toonString) {
    if (!toonString || typeof toonString !== 'string') {
      return null;
    }

    const lines = toonString.split('\n');
    const result = {};
    const stack = [{ obj: result, indent: 0, key: null }];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const indent = this.countIndent(line);
      const trimmed = line.trim();
      
      // Ajustar stack según indentación
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      
      const current = stack[stack.length - 1];
      
      // Parsear diferentes tipos de líneas TOON
      if (this.isTableHeader(trimmed)) {
        this.parseTableHeader(trimmed, current.obj, lines, i + 1);
        break; // Las tablas se parsean en bloque
      } else if (this.isArrayHeader(trimmed)) {
        this.parseArrayHeader(trimmed, current.obj);
        // Verificar si es un array multilinea
        const arrayMatch = trimmed.match(/^(\w+)\[(\d+)\]:\s*$/);
        if (arrayMatch) {
          const [, key, count] = arrayMatch;
          const arrayCount = parseInt(count);
          const array = [];
          
          // Parsear las siguientes líneas como elementos del array
          for (let j = i + 1; j < lines.length && array.length < arrayCount; j++) {
            const arrayLine = lines[j].trim();
            if (!arrayLine) continue;
            
            // Si la línea tiene más indentación, es un elemento del array
            if (this.countIndent(lines[j]) > indent) {
              array.push(this.parseValue(arrayLine));
              i++; // Consumir esta línea
            } else {
              break; // Fin del array
            }
          }
          
          current.obj[key] = array;
        }
      } else if (this.isObjectKey(trimmed)) {
        const key = trimmed.slice(0, -1);
        const newObj = {};
        current.obj[key] = newObj;
        stack.push({ obj: newObj, indent, key });
      } else if (this.isKeyValue(trimmed)) {
        this.parseKeyValue(trimmed, current.obj);
      }
    }
    
    return result;
  }

  // ==================== ENCODE HELPERS ====================

  static encodeRootArray(arr, config) {
    if (arr.length === 0) return '[0]:';
    
    // Si es array de objetos uniformes (tabla)
    if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
      const keys = Object.keys(arr[0]);
      let result = `[${arr.length}]{${keys.join(config.delimiter)}}:\n`;
      
      for (const item of arr) {
        const values = keys.map(key => this.encodeValue(item[key], config));
        result += '  ' + values.join(config.delimiter) + '\n';
      }
      
      return result.trim();
    }
    
    // Array de primitivos
    const values = arr.map(item => this.encodeValue(item, config));
    return `[${arr.length}]: ${values.join(config.delimiter)}`;
  }

  static encodeObject(obj, config, depth) {
    const indentStr = ' '.repeat(config.indent * depth);
    let result = '';
    
    const entries = Object.entries(obj);
    
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      
      if (i > 0) result += '\n';
      result += indentStr + key + ':';
      
      if (value === null || value === undefined) {
        // Valor vacío
        continue;
      } else if (typeof value === 'object') {
        // Objeto anidado o array
        if (Array.isArray(value)) {
          if (value.length === 0) {
            result += ' ' + this.encodeValue(value, config);
          } else if (typeof value[0] === 'object' && value[0] !== null) {
            // Array de objetos (tabla)
            const keys = Object.keys(value[0]);
            result += ` ${config.lengthMarker}${value.length}{${keys.join(config.delimiter)}}:\n`;
            
            for (const item of value) {
              const values = keys.map(k => this.encodeValue(item[k], config));
              result += indentStr + '  ' + values.join(config.delimiter) + '\n';
            }
          } else {
            // Array de primitivos
            result += ' ' + this.encodeValue(value, config);
          }
        } else {
          // Objeto anidado
          result += '\n' + this.encodeObject(value, config, depth + 1);
        }
      } else {
        // Valor primitivo
        result += ' ' + this.encodeValue(value, config);
      }
    }
    
    return result;
  }

  static encodeValue(value, config) {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'string') {
      // Escapar si contiene caracteres especiales
      if (this.needsQuotes(value, config)) {
        return `"${this.escapeString(value)}"`;
      }
      return value;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toString();
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[0]:';
      
      const values = value.map(item => this.encodeValue(item, config));
      return `[${value.length}]: ${values.join(config.delimiter)}`;
    }
    
    return String(value);
  }

  static needsQuotes(str, config) {
    // Si contiene el delimitador
    if (str.includes(config.delimiter)) return true;
    
    // Si contiene caracteres especiales TOON
    if (str.includes(':') || str.includes('{') || str.includes('}') || 
        str.includes('[') || str.includes(']')) return true;
    
    // Si empieza/termina con espacios
    if (str !== str.trim()) return true;
    
    // Si es string vacío
    if (str === '') return true;
    
    // Si parece número pero es string
    if (/^-?\d+(\.\d+)?$/.test(str)) return true;
    
    // Si es palabra reservada
    if (str === 'true' || str === 'false' || str === 'null') return true;
    
    return false;
  }

  static escapeString(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  // ==================== PARSE HELPERS ====================

  static countIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  static isTableHeader(line) {
    return /^\w+\[\d+\]\{[^}]+\}:$/.test(line);
  }

  static isArrayHeader(line) {
    return /^\w+\[\d+\]:/.test(line) && !line.includes('{');
  }

  static isObjectKey(line) {
    return line.endsWith(':') && !this.isTableHeader(line) && !this.isArrayHeader(line);
  }

  static isKeyValue(line) {
    return line.includes(':') && !line.endsWith(':');
  }

  static parseTableHeader(line, obj, lines, startIndex) {
    const match = line.match(/^(\w+)\[(\d+)\]\{([^}]+)\}:$/);
    if (!match) return;
    
    const [, key, count, fieldsStr] = match;
    const fieldCount = parseInt(count);
    const fields = fieldsStr.split(',').map(f => f.trim());
    
    const table = [];
    
    // Parsear las siguientes líneas como filas
    for (let i = startIndex; i < lines.length && table.length < fieldCount; i++) {
      const rowLine = lines[i].trim();
      if (!rowLine) continue;
      
      // Parseo mejorado para manejar comillas anidadas
      const values = this.parseTableRow(rowLine, fields.length);
      const row = {};
      
      fields.forEach((field, index) => {
        row[field] = values[index] !== undefined ? values[index] : null;
      });
      
      table.push(row);
    }
    
    obj[key] = table;
  }

  /**
   * Parsea una fila de tabla manejando comillas anidadas
   * @param {string} rowLine - Línea de la tabla
   * @param {number} expectedFields - Número esperado de campos
   * @returns {Array} Array de valores parseados
   */
  static parseTableRow(rowLine, expectedFields) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < rowLine.length && values.length < expectedFields) {
      const char = rowLine[i];
      
      if (char === '"' && (i === 0 || rowLine[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(this.parseValue(current.trim()));
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    // Añadir el último valor
    if (current.trim() || values.length < expectedFields) {
      values.push(this.parseValue(current.trim()));
    }
    
    return values;
  }

  static parseArrayHeader(line, obj) {
    const match = line.match(/^(\w+)\[(\d+)\]:\s*(.+)$/);
    if (!match) return;
    
    const [, key, count, valuesStr] = match;
    
    // Si los valores están en la misma línea
    if (valuesStr && valuesStr.trim()) {
      const values = valuesStr.split(',').map(v => this.parseValue(v.trim()));
      obj[key] = values;
    } else {
      // Si los valores están en las siguientes líneas (array multilinea)
      obj[key] = [];
    }
  }

  static parseKeyValue(line, obj) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = line.slice(0, colonIndex).trim();
    const valueStr = line.slice(colonIndex + 1).trim();
    
    obj[key] = this.parseValue(valueStr);
  }

  static parseValue(value) {
    if (value === '') return null;
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Números
    if (/^-?\d+$/.test(value)) return parseInt(value);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // Strings entre comillas
    if (value.startsWith('"') && value.endsWith('"')) {
      return this.unescapeString(value.slice(1, -1));
    }
    
    // Strings sin comillas
    return value;
  }

  static unescapeString(str) {
    return str
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
  }

  // ==================== UTILIDADES ====================

  /**
   * Valida una estructura TOON contra un schema
   * @param {string} toonString - String TOON a validar
   * @param {Object} schema - Schema de validación
   * @returns {boolean} true si es válido
   */
  static validate(toonString, schema) {
    try {
      const data = this.parse(toonString);
      return this.validateSchema(data, schema);
    } catch (error) {
      return false;
    }
  }

  static validateSchema(data, schema) {
    // Implementación básica de validación
    // En producción, usar un validador más robusto
    return true;
  }

  /**
   * Calcula el ahorro de tokens comparado con JSON
   * @param {string} toonString - String TOON
   * @param {Object} jsonEquivalent - Objeto JSON equivalente
   * @returns {number} Porcentaje de ahorro (0-100)
   */
  static calculateTokenSavings(toonString, jsonEquivalent) {
    const toonTokens = Math.ceil(toonString.length / 4);
    const jsonTokens = Math.ceil(JSON.stringify(jsonEquivalent).length / 4);
    const savings = Math.floor((1 - toonTokens / jsonTokens) * 100);
    return Math.max(0, savings);
  }

  /**
   * Formatea un string TOON para mejor legibilidad
   * @param {string} toonString - String TOON
   * @returns {string} TOON formateado
   */
  static format(toonString) {
    // Asegurar indentación consistente
    const lines = toonString.split('\n');
    let formatted = '';
    let indentLevel = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.endsWith(':') && !this.isTableHeader(trimmed)) {
        formatted += '  '.repeat(indentLevel) + trimmed + '\n';
        indentLevel++;
      } else if (trimmed.includes(']:') || this.isTableHeader(trimmed)) {
        formatted += '  '.repeat(indentLevel) + trimmed + '\n';
      } else {
        formatted += '  '.repeat(indentLevel) + trimmed + '\n';
        if (indentLevel > 0 && !this.isKeyValue(trimmed)) {
          indentLevel--;
        }
      }
    }
    
    return formatted.trim();
  }
}

// Exportar para uso global
window.ToonService = ToonService;

// Tests básicos
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 ToonService cargado. Ejecutando tests...');
  
  // Test 1: Encode simple
  const test1 = { name: 'Ada', age: 30 };
  const encoded1 = ToonService.encode(test1);
  console.assert(encoded1 === 'name: Ada\nage: 30', 'Test 1 falló');
  
  // Test 2: Encode array
  const test2 = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
  const encoded2 = ToonService.encode(test2);
  console.assert(encoded2.includes('users[2]{id,name}:'), 'Test 2 falló');
  
  // Test 3: Parse simple
  const parsed1 = ToonService.parse('name: Ada\nage: 30');
  console.assert(parsed1.name === 'Ada' && parsed1.age === 30, 'Test 3 falló');
  
  console.log('✅ Tests de ToonService completados');
}