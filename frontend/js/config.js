/**
 * Configuración de VisualFlow - Frontend Directo
 *
 * IMPORTANTE: Este archivo contiene claves API sensibles.
 * - En desarrollo: Usar .env.local con Vite
 * - En producción: Rotar claves frecuentemente
 * - NUNCA subir claves reales a repositorios públicos
 */

// Configuración de APIs de Chutes AI
export const CONFIG = {
  // Claves API - Reemplazar con valores reales
  KIMI_API_KEY: '',
  QWEN_IMAGE_API_KEY: '',
  QWEN_VL_API_KEY: '',

  // Endpoints
  ENDPOINT_LLM: 'http://localhost:3000/api/chat',
  ENDPOINT_IMAGE: 'http://localhost:3000/api/image',

  // Modelos
  MODELS: {
    KIMI: 'moonshotai/Kimi-K2-Thinking',
    QWEN_IMAGE: 'qwen-image',
    QWEN_VL: 'Qwen/Qwen3-VL-235B-A22B-Instruct'
  },

  // Límites y configuración
  RATE_LIMIT: {
    MIN_INTERVAL: 5000, // 5 segundos entre llamadas
    DAILY_LIMIT: 50     // 50 diagramas por día
  },

  // Configuración de generación de imágenes
  IMAGE_CONFIG: {
    width: 1024,
    height: 1024,
    steps: 50,
    guidanceScale: 7.5,
    negativePrompt: 'texto, letras, números, palabras, blur, low quality, distortion, watermark'
  },

  // Configuración de TOON
  TOON_CONFIG: {
    delimiter: ',',
    indent: 2,
    lengthMarker: '#'
  }
};

// 🚨 SISTEMA DE LOGGING CON LOCALSTORAGE + PANEL DEBUG
export const DEBUG = {
  enabled: true,
  maxLogs: 1000,

  log: function(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;

    // Guardar en localStorage
    try {
      let logs = JSON.parse(localStorage.getItem('visualflow_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > this.maxLogs) logs.pop();
      localStorage.setItem('visualflow_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('No se pudo guardar log en localStorage:', e);
    }

    // Mostrar en consola
    console.log(`📝 ${logEntry}`);

    // Actualizar panel si existe
    this.updatePanel();
  },

  error: function(message) {
    this.log(`❌ ERROR: ${message}`);
  },

  getLogs: function() {
    try {
      return JSON.parse(localStorage.getItem('visualflow_logs') || '[]');
    } catch (e) {
      return [];
    }
  },

  clearLogs: function() {
    localStorage.removeItem('visualflow_logs');
    this.updatePanel();
  },

  updatePanel: function() {
    const panel = document.getElementById('debug-panel');
    if (panel) {
      const logs = this.getLogs();
      const content = panel.querySelector('.debug-content');
      if (content) {
        content.innerHTML = logs.join('<br>');
        content.scrollTop = 0;
      }
    }
  },

  exportLogs: function() {
    const logs = this.getLogs().join('\n');
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualflow-debug-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// ADVERTENCIA DE SEGURIDAD
console.warn(
  '%c⚠️ ADVERTENCIA DE SEGURIDAD ⚠️',
  'color: #f59e0b; font-size: 16px; font-weight: bold;'
);
console.warn(
  'Este archivo contiene claves API sensibles en el frontend.\n' +
  '• Solo usar para pruebas y desarrollo\n' +
  '• Rotar claves frecuentemente\n' +
  '• NUNCA subir claves reales a repositorios públicos\n' +
  '• Para producción, implementar backend proxy'
);

// 🚨 INICIAR LOGGING
DEBUG.log('=== VISUALFLOW INICIADO ===');
DEBUG.log('Fecha: ' + new Date().toISOString());

// Exportar para uso global
window.VISUALFLOW_CONFIG = CONFIG;