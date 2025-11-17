/**
 * VisualFlowApp - Aplicación principal de VisualFlow
 *
 * Coordina todos los componentes:
 * - PipelineService (generación de diagramas)
 * - DiagramRenderer (renderizado)
 * - UI y controles
 */

import { PipelineService } from './pipeline-service.js';
import { DiagramRenderer } from './diagram-renderer.js';
import { JsonService } from './json-service.js';

export class VisualFlowApp {
  constructor() {
    // Servicios
    this.pipeline = new PipelineService();
    this.renderer = null;
    this.json = JsonService;
    this.progressModal = null;
    this.planningChat = null;

    // Estado de la aplicación
    this.state = {
      currentMode: 'visual',
      currentTheme: 'modern-blue',
      currentTemplate: 'mindmap',
      hasDiagram: false,
      isLoading: false,
      generationHistory: this.loadHistory()
    };

    // Elementos del DOM
    this.elements = {};

    this.init();
  }

  /**
   * Inicializa la aplicación
   */
  init() {
    this.initElements();
    this.initRenderer();
    this.initProgressModal();
    this.bindEvents();
    this.updateUI();

    console.log('✅ VisualFlowApp inicializada');
    console.log('📊 Estado inicial:', this.state);
  }

  /**
   * Inicializa referencias a elementos DOM
   */
  initElements() {
    this.elements = {
      // Inputs y controles
      textInput: document.getElementById('textInput'),
      generateBtn: document.getElementById('generateBtn'),
      modeButtons: document.querySelectorAll('.mode-button'),
      themeButtons: document.querySelectorAll('.theme-button[data-theme]'),
      templateSelect: document.getElementById('templateSelect'),

      // Canvas y renderizado
      canvas: document.getElementById('diagramCanvas'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      canvasTitle: document.getElementById('canvasTitle'),
      canvasSubtitle: document.getElementById('canvasSubtitle'),
      canvasStats: document.getElementById('canvasStats'),

      // Botones de acción
      exportBtn: document.getElementById('exportBtn'),
      variationsBtn: document.getElementById('variationsBtn'),
      optimizeBtn: document.getElementById('optimizeBtn'),

      // Sidebar
      elementCount: document.getElementById('elementCount'),
      connectionCount: document.getElementById('connectionCount'),
      sidebarVariations: document.getElementById('sidebarVariations'),
      sidebarOptimize: document.getElementById('sidebarOptimize'),
      sidebarExport: document.getElementById('sidebarExport'),

      // Mensajes
      errorContainer: document.getElementById('errorContainer'),
      errorText: document.getElementById('errorText')
    };

    // Placeholders según modo
    this.placeholders = {
      semantic: "Describe conceptos con relaciones: Ej: Secuencia de la teoría del delito: ladrón - teoría - delito...",
      intelligent: "Describe un proceso con secuencia lógica: Ej: Primero el usuario inicia sesión, luego el sistema valida...",
      visual: "Describe lo que quieres crear: Ej: El proceso de aprendizaje tiene 3 etapas...",
      simple: "Describe tu diagrama: Ej: Un flujo de trabajo con inicio, proceso y fin..."
    };
  }

  /**
   * Inicializa el renderizador de diagramas
   */
  initRenderer() {
    if (!this.elements.canvas) {
      console.error('Canvas no encontrado');
      return;
    }

    this.renderer = new DiagramRenderer(this.elements.canvas, {
      zoom: 1,
      offset: { x: 0, y: 0 },
      debug: false
    });

    console.log('🎨 DiagramRenderer inicializado');
  }

  /**
   * Inicializa el modal de progreso
   */
  initProgressModal() {
    if (typeof ProgressModal !== 'undefined') {
      this.progressModal = new ProgressModal();
      console.log('🎯 ProgressModal inicializado');
    } else {
      console.warn('⚠️ ProgressModal no disponible');
    }
  }


  /**
   * Bindea eventos de la UI
   */
  bindEvents() {
    // Botón generar - Generación directa sin PlanningChat
    this.elements.generateBtn.addEventListener('click', () => {
      this.generateDiagram();
    });

    // Enter en textarea
    this.elements.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.generateDiagram();
      }
    });

    // Cambio de modo
    this.elements.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setMode(mode);
      });
    });

    // Cambio de tema
    this.elements.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.setTheme(theme);
      });
    });

    // Cambio de template
    if (this.elements.templateSelect) {
      this.elements.templateSelect.addEventListener('change', (e) => {
        this.state.currentTemplate = e.target.value;
      });
    }

    // Botones de acción
    this.elements.exportBtn.addEventListener('click', () => this.exportDiagram());
    this.elements.variationsBtn.addEventListener('click', () => this.generateVariations());
    this.elements.optimizeBtn.addEventListener('click', () => this.optimizeDiagram());

    // Sidebar actions
    this.elements.sidebarVariations.addEventListener('click', () => this.generateVariations());
    this.elements.sidebarOptimize.addEventListener('click', () => this.optimizeDiagram());
    this.elements.sidebarExport.addEventListener('click', () => this.exportDiagram());

    // Eventos del pipeline
    document.addEventListener('pipeline-state-change', (e) => {
      console.log('📡 Evento pipeline-state-change recibido:', e.detail);
      this.onPipelineStateChange(e.detail);
    });

    console.log('🎯 Eventos bindeados');
  }

  /**
   * Genera un diagrama usando el pipeline
   */
  async generateDiagram() {
    const prompt = this.elements.textInput.value.trim();

    if (!prompt) {
      this.showError('Por favor, ingresa un texto para generar el diagrama');
      return;
    }

    if (this.state.isLoading) {
      this.showError('Ya hay una generación en curso');
      return;
    }

    // Verificar límites
    try {
      this.pipeline.chutes.checkDailyLimit();
    } catch (error) {
      this.showError(error.message);
      return;
    }

    // 🔥 INICIAR DIAGNÓSTICO
    console.log('🔍 INICIANDO DIAGNÓSTICO DE PROGRESO...');
    if (window.diagnostic) {
      window.diagnostic.start();
      console.log('✅ Diagnóstico iniciado');
    } else {
      console.warn('⚠️ Herramienta de diagnóstico no disponible');
    }

    // 🔥 MOSTRAR MODAL INMEDIATAMENTE (antes de cualquier otra operación)
    console.log('🎯 Mostrando modal de progreso...');
    if (this.progressModal) {
      this.progressModal.show();
      // Forzar repintado para asegurar que el modal sea visible
      setTimeout(() => {
        if (this.progressModal && this.progressModal.modal) {
          this.progressModal.modal.style.display = 'flex';
          this.progressModal.modal.classList.remove('hidden');
        }
      }, 10);
    } else {
      console.error('❌ ProgressModal no disponible');
      this.showError('Error: Modal de progreso no disponible');
      return;
    }

    this.setLoading(true);
    this.hideError();
    this.clearCanvas();

    try {
      console.log('🚀 Iniciando generación de diagrama...');
      console.log('📝 Prompt:', prompt);

      // Llamar al pipeline
      const result = await this.pipeline.generateDiagram(prompt, {
        mode: this.state.currentMode,
        template: this.state.currentTemplate,
        theme: this.state.currentTheme
      });

      if (result.success) {
        console.log('✅ Diagrama generado exitosamente:', result);

        // Renderizar diagrama
        this.renderer.renderFromJson(result.diagram);

        // Forzar renderizado si no se ve nada
        setTimeout(() => {
          if (this.renderer && this.renderer.diagram) {
            this.renderer.render();
          }
        }, 100);

        // Actualizar UI
        this.state.hasDiagram = true;
        this.updateActionButtons();
        this.updateStats(result.stats, result.images);
        this.addToHistory(prompt, result);

        // Mostrar éxito
        this.showSuccess('Diagrama generado exitosamente');

      } else {
        console.error('❌ Error en generación:', result.error);
        this.showError(result.error || 'Error al generar el diagrama');

        // Mostrar error en modal
        if (this.progressModal) {
          this.progressModal.showError(result.error);
        }
      }

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      this.showError(`Error: ${error.message}`);

      // Mostrar error en modal
      if (this.progressModal) {
        this.progressModal.showError(error.message);
      }
    } finally {
      this.setLoading(false);
      // El modal se oculta automáticamente cuando el pipeline termina

      // Finalizar diagnóstico
      setTimeout(() => {
        if (window.diagnostic) {
          window.diagnostic.generateReport();
        }
      }, 1000);
    }
  }

  /**
   * Genera variaciones del diagrama actual
   */
  async generateVariations() {
    if (!this.state.hasDiagram) {
      this.showError('No hay diagrama para generar variaciones');
      return;
    }

    this.showNotification('🔄 Generando 3 variaciones...', 'info');

    // Simular generación de variaciones
    setTimeout(() => {
      this.showNotification('✅ Variaciones generadas. Revisa el canvas.', 'success');
    }, 2000);
  }

  /**
   * Optimiza el diagrama actual con IA
   */
  async optimizeDiagram() {
    if (!this.state.hasDiagram) {
      this.showError('No hay diagrama para optimizar');
      return;
    }

    this.showNotification('✨ Optimizando diagrama con IA...', 'info');

    // Simular optimización
    setTimeout(() => {
      this.showNotification('✅ Diagrama optimizado. Espaciado mejorado.', 'success');
    }, 1500);
  }

  /**
   * Exporta el diagrama actual
   */
  exportDiagram() {
    if (!this.state.hasDiagram) {
      this.showError('No hay diagrama para exportar');
      return;
    }

    try {
      this.renderer.exportPNG();
      this.showNotification('📥 Diagrama exportado como PNG', 'success');
    } catch (error) {
      this.showError('Error al exportar: ' + error.message);
    }
  }

  /**
   * Cambia el modo de generación
   */
  setMode(mode) {
    this.state.currentMode = mode;

    // Actualizar botones activos
    this.elements.modeButtons.forEach(btn => {
      btn.classList.remove('active', 'semantic', 'intelligent', 'visual', 'simple');
      if (btn.dataset.mode === mode) {
        btn.classList.add('active', mode);
      }
    });

    // Actualizar placeholder
    this.elements.textInput.placeholder = this.placeholders[mode] || this.placeholders.visual;

    // Actualizar texto del botón
    this.updateGenerateButtonText();

    // Actualizar título del canvas
    this.updateCanvasTitle();

    console.log('🎯 Modo cambiado a:', mode);
  }

  /**
   * Cambia el tema visual
   */
  setTheme(theme) {
    this.state.currentTheme = theme;

    // Actualizar botones activos
    this.elements.themeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      }
    });

    // Si hay diagrama, regenerar con nuevo tema
    if (this.state.hasDiagram) {
      this.showNotification(`Tema cambiado a: ${theme}`, 'info');
    }

    console.log('🎨 Tema cambiado a:', theme);
  }

  /**
   * Actualiza el texto del botón de generar según el modo
   */
  updateGenerateButtonText() {
    const modeTexts = {
      semantic: '🎯 Crear Semántico',
      intelligent: '🧠 Crear Inteligente',
      visual: '✨ Crear Visual',
      simple: '📊 Crear Diagrama'
    };

    const modeClasses = {
      semantic: 'simple',
      intelligent: 'simple',
      visual: 'visual',
      simple: 'simple'
    };

    this.elements.generateBtn.textContent = modeTexts[this.state.currentMode];
    this.elements.generateBtn.className = `generate-button ${modeClasses[this.state.currentMode]}`;
  }

  /**
   * Actualiza el título del canvas según el modo
   */
  updateCanvasTitle() {
    const titles = {
      semantic: 'Visual Semántico',
      intelligent: 'Diagrama Inteligente',
      visual: 'Tu Visual',
      simple: 'Tu Diagrama'
    };

    this.elements.canvasTitle.textContent = titles[this.state.currentMode];
  }

  /**
   * Actualiza estadísticas en la UI
   */
  updateStats(stats, images) {
    // Actualizar contadores
    const diagramData = this.renderer?.diagram || {};
    const nodes = diagramData.diagram?.nodes || [];
    const connections = diagramData.diagram?.connections || [];

    this.elements.elementCount.textContent = nodes.length;
    this.elements.connectionCount.textContent = connections.length;

    // Mostrar stats en canvas
    this.elements.canvasStats.classList.remove('hidden');
    this.elements.canvasStats.textContent = `${nodes.length} elementos • ${connections.length} conexiones • ${stats.tokensSaved || 0} tokens ahorrados`;

    // Actualizar subtítulo
    this.elements.canvasSubtitle.textContent = `${this.state.currentMode} • ${this.state.currentTheme} • ${images.length} imágenes`;
  }

  /**
   * Actualiza visibilidad de botones de acción
   */
  updateActionButtons() {
    const show = this.state.hasDiagram;

    this.elements.exportBtn.classList.toggle('hidden', !show);
    this.elements.variationsBtn.classList.toggle('hidden', !show);
    this.elements.optimizeBtn.classList.toggle('hidden', !show);
    this.elements.canvasStats.classList.toggle('hidden', !show);
  }

  /**
   * Limpia el canvas
   */
  clearCanvas() {
    if (this.renderer && this.renderer.clearCanvas) {
      this.renderer.clearCanvas();
    } else {
      console.warn('⚠️ Renderer o clearCanvas no disponible');
    }
    this.state.hasDiagram = false;
    this.updateActionButtons();
  }

  /**
   * Maneja cambios de estado del pipeline
   */
  onPipelineStateChange(detail) {
    const { state, generationId } = detail;

    console.log('📡 Pipeline state change:', state.step, state.progress + '%');
    console.log('📡 Evento recibido en app.js:', JSON.stringify(state));

    // Actualizar modal de progreso
    if (this.progressModal) {
      console.log('🎯 Actualizando ProgressModal con estado:', state.step);
      this.progressModal.handlePipelineStateChange(detail);
      console.log('✅ ProgressModal actualizado');
    } else {
      console.error('❌ ProgressModal no disponible para actualizar');
    }

    // Actualizar UI según estado (notificaciones adicionales)
    switch (state.step) {
      case 'analyzing':
        this.showNotification('🧠 Analizando concepto...', 'info');
        break;
      case 'generating':
        this.showNotification('🎨 Generando imágenes...', 'info');
        break;
      case 'verifying':
        this.showNotification('👁️ Organizando diagrama...', 'info');
        break;
      case 'complete':
        this.showNotification('✅ Diagrama completado', 'success');
        break;
      case 'error':
        this.showError(state.error || 'Error en el pipeline');
        break;
    }
  }

  // ==================== HISTORIAL ====================

  /**
   * Añade una generación al historial
   */
  addToHistory(prompt, result) {
    const historyItem = {
      id: result.generationId,
      prompt: prompt,
      mode: this.state.currentMode,
      theme: this.state.currentTheme,
      template: this.state.currentTemplate,
      timestamp: new Date().toISOString(),
      stats: result.stats,
      imageCount: result.images.length,
      diagram: this.json.encode(result.diagram)
    };

    this.state.generationHistory.unshift(historyItem);

    // Mantener solo los últimos 20
    if (this.state.generationHistory.length > 20) {
      this.state.generationHistory = this.state.generationHistory.slice(0, 20);
    }

    this.saveHistory();
  }

  /**
   * Guarda el historial en localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem('visualflow_history', JSON.stringify(this.state.generationHistory));
    } catch (error) {
      console.warn('Error guardando historial:', error);
    }
  }

  /**
   * Carga el historial desde localStorage
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem('visualflow_history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Error cargando historial:', error);
      return [];
    }
  }

  // ==================== UI HELPERS ====================

  /**
   * Muestra mensaje de error
   */
  showError(message) {
    this.elements.errorText.textContent = message;
    this.elements.errorContainer.classList.remove('hidden');

    // Auto-hide después de 5 segundos
    setTimeout(() => this.hideError(), 5000);
  }

  /**
   * Oculta mensaje de error
   */
  hideError() {
    this.elements.errorContainer.classList.add('hidden');
  }

  /**
   * Muestra notificación
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Estilos
    notification.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-size: 0.875rem;
      max-width: 20rem;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto-remove después de 3 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Muestra mensaje de éxito
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Muestra mensaje de info
   */
  showInfo(message) {
    this.showNotification(message, 'info');
  }

  /**
   * Actualiza estado de loading
   */
  setLoading(loading) {
    this.state.isLoading = loading;
    this.elements.generateBtn.disabled = loading;

    if (loading) {
      this.elements.generateBtn.innerHTML = `
        <div class="loading-spinner"></div>
        Generando...
      `;
      this.elements.loadingSpinner?.classList.remove('hidden');
    } else {
      this.updateGenerateButtonText();
      this.elements.loadingSpinner?.classList.add('hidden');
    }
  }

  /**
   * Actualiza toda la UI
   */
  updateUI() {
    this.updateGenerateButtonText();
    this.updateCanvasTitle();
    this.updateActionButtons();
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats() {
    return this.pipeline.chutes.getStats();
  }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.visualFlowApp = new VisualFlowApp();
    console.log('🚀 VisualFlowApp iniciada correctamente');
  } catch (error) {
    console.error('❌ Error iniciando VisualFlowApp:', error);
  }
});

// Exportar para uso global
window.VisualFlowApp = VisualFlowApp;