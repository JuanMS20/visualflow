/**
 * ProgressModal - Muestra el progreso del pipeline multi-modelo en tiempo real
 * 
 * Características:
 * - Barra de progreso animada
 * - Pasos del pipeline (Kimi → Qwen Image → Qwen VL → Final)
 * - Tiempo transcurrido
 * - Tokens estimados
 * - Mensajes de estado
 */

export class ProgressModal {
  constructor() {
    this.modal = null;
    this.progressBar = null;
    this.stepsContainer = null;
    this.timeElement = null;
    this.tokensElement = null;
    this.messageElement = null;
    
    this.startTime = null;
    this.updateInterval = null;
    
    // Definición de pasos del pipeline
    this.pipelineSteps = {
      idle: {
        name: 'Esperando',
        description: 'Listo para comenzar',
        icon: '⏳',
        progress: 0
      },
      analyzing: {
        name: 'Analizando con Kimi K2',
        description: 'Descomponiendo el concepto en elementos visuales',
        icon: '🧠',
        progress: 15
      },
      generating: {
        name: 'Generando imágenes',
        description: 'Creando imágenes con Qwen Image (paralelo)',
        icon: '🎨',
        progress: 50
      },
      verifying: {
        name: 'Organizando diagrama',
        description: 'Verificando y estructurando con Qwen 3 VL',
        icon: '👁️',
        progress: 85
      },
      complete: {
        name: '¡Completado!',
        description: 'Diagrama generado exitosamente',
        icon: '✅',
        progress: 100
      },
      error: {
        name: 'Error',
        description: 'Ocurrió un problema durante la generación',
        icon: '❌',
        progress: 0
      }
    };
    
    this.init();
  }

  init() {
    this.createModal();
    console.log('✅ ProgressModal inicializado');
  }

  /**
   * Crea el modal en el DOM
   */
  createModal() {
    // Crear estructura del modal si no existe
    if (!document.getElementById('progressModal')) {
      const modalHTML = `
        <div id="progressModal" class="progress-modal hidden">
          <div class="progress-content">
            <div class="progress-header">
              <h2 class="progress-title">Generando Diagrama IA</h2>
              <p class="progress-subtitle">Pipeline multi-modelo en progreso...</p>
            </div>
            
            <div class="progress-bar-container">
              <div id="progressBar" class="progress-bar"></div>
            </div>
            
            <div class="progress-steps" id="progressSteps">
              <!-- Los pasos se generarán dinámicamente -->
            </div>
            
            <div class="progress-stats">
              <span id="progressTime">Tiempo: 0s</span>
              <span id="progressTokens">Tokens: 0</span>
            </div>
            
            <div class="progress-time" id="progressMessage">
              Iniciando generación...
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Guardar referencias
    this.modal = document.getElementById('progressModal');
    this.progressBar = document.getElementById('progressBar');
    this.stepsContainer = document.getElementById('progressSteps');
    this.timeElement = document.getElementById('progressTime');
    this.tokensElement = document.getElementById('progressTokens');
    this.messageElement = document.getElementById('progressMessage');
    
    // Generar pasos
    this.renderSteps();
  }

  /**
   * Renderiza los pasos del pipeline
   */
  renderSteps() {
    if (!this.stepsContainer) return;
    
    const stepsHTML = Object.entries(this.pipelineSteps).map(([key, step]) => `
      <div class="progress-step pending" data-step="${key}" id="step-${key}">
        <div class="step-icon pending">${step.icon}</div>
        <div class="step-info">
          <div class="step-name">${step.name}</div>
          <div class="step-description">${step.description}</div>
        </div>
      </div>
    `).join('');
    
    this.stepsContainer.innerHTML = stepsHTML;
  }

  /**
   * Muestra el modal y comienza el progreso
   */
  show() {
    if (!this.modal) {
      console.error('Modal no encontrado');
      return;
    }
    
    // 🔥 FORZAR VISIBILIDAD INMEDIATA
    this.modal.classList.remove('hidden');
    this.modal.style.display = 'flex';
    this.modal.style.visibility = 'visible';
    this.modal.style.opacity = '1';
    this.modal.style.zIndex = '1000';
    
    // Resetear estado
    this.resetSteps();
    this.updateProgress(5);  // Iniciar con 5% para garantizar visibilidad
    this.updateMessage('Iniciando generación...');
    
    this.startTime = Date.now();
    this.updateTimer();
    
    // Iniciar actualización del tiempo cada segundo
    this.updateInterval = setInterval(() => this.updateTimer(), 1000);
    
    console.log('📊 ProgressModal mostrado forzosamente');
    console.log('📊 Modal element:', this.modal);
    console.log('📊 Modal classes:', this.modal.className);
    console.log('📊 Modal style:', this.modal.style.cssText);
  }

  /**
   * Oculta el modal y limpia el estado
   */
  hide() {
    if (!this.modal) return;
    
    this.modal.classList.add('hidden');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.startTime = null;
    this.resetSteps();
    
    console.log('📊 ProgressModal ocultado');
  }

  /**
   * Actualiza el estado de un paso
   * @param {string} stepKey - Clave del paso
   * @param {string} status - Estado: pending, active, completed, error
   */
  updateStep(stepKey, status = 'active') {
    const stepElement = document.getElementById(`step-${stepKey}`);
    if (!stepElement) return;
    
    // Resetear clases
    stepElement.className = `progress-step ${status}`;
    
    // Actualizar icono
    const icon = stepElement.querySelector('.step-icon');
    if (icon) {
      icon.className = `step-icon ${status}`;
    }
    
    // Scroll al paso activo
    if (status === 'active' && this.stepsContainer) {
      stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    console.log(`📊 Paso ${stepKey} actualizado a: ${status}`);
  }

  /**
   * Actualiza la barra de progreso
   * @param {number} percentage - Porcentaje (0-100)
   */
  updateProgress(percentage) {
    if (!this.progressBar) return;
    
    this.progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  }

  /**
   * Actualiza el mensaje de estado
   * @param {string} message - Mensaje a mostrar
   */
  updateMessage(message) {
    if (!this.messageElement) return;
    
    this.messageElement.textContent = message;
  }

  /**
   * Actualiza el contador de tokens
   * @param {number} tokens - Número de tokens
   */
  updateTokens(tokens) {
    if (!this.tokensElement) return;
    
    this.tokensElement.textContent = `Tokens: ${tokens}`;
  }

  /**
   * Actualiza el tiempo transcurrido
   */
  updateTimer() {
    if (!this.startTime || !this.timeElement) return;
    
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeElement.textContent = `Tiempo: ${elapsed}s`;
  }

  /**
   * Maneja el cambio de estado del pipeline
   * @param {Object} pipelineState - Estado del pipeline
   */
  handlePipelineStateChange(pipelineState) {
    const { step, progress, error } = pipelineState.state;
    
    // Actualizar paso actual
    if (step && this.pipelineSteps[step]) {
      // Marcar paso actual como activo
      this.updateStep(step, error ? 'error' : 'active');
      
      // Marcar pasos anteriores como completados
      const stepKeys = Object.keys(this.pipelineSteps);
      const currentIndex = stepKeys.indexOf(step);
      
      for (let i = 0; i < currentIndex; i++) {
        this.updateStep(stepKeys[i], 'completed');
      }
      
      // Actualizar barra de progreso con transición suave
      const targetProgress = this.pipelineSteps[step].progress;
      
      // Mostrar claramente el paso actual
      this.updateStep(step, 'active');
      
      // Actualizar mensaje
      const stepInfo = this.pipelineSteps[step];
      this.updateMessage(stepInfo.description);
      
      // Actualizar barra de progreso con transición suave
      const currentProgress = parseFloat(this.progressBar.style.width || '0');
      
      // Si el progreso actual es menor que el objetivo, animar la transición
      if (targetProgress > currentProgress) {
        console.log(`📈 Progreso: ${currentProgress}% → ${targetProgress}%`);
        this.updateProgress(targetProgress);
      } else {
        console.log(`⚠️ Progreso no actualizado: ${currentProgress}% >= ${targetProgress}%`);
      }
      
      // Marcar pasos anteriores como completados
// Eliminado código duplicado que causaba redeclaración de variables
      
      // Si hay error, mostrarlo
      if (error) {
        this.updateMessage(`❌ Error: ${error}`);
        this.updateStep(step, 'error');
      }
    }
    
    // Si el pipeline está completo, marcar todos los pasos como completados
    if (step === 'complete') {
      const completeStepKeys = Object.keys(this.pipelineSteps);
      completeStepKeys.forEach(key => {
        if (key !== 'idle' && key !== 'error') {
          this.updateStep(key, 'completed');
        }
      });
      this.updateProgress(100);
      this.updateMessage('¡Diagrama generado exitosamente!');
      
      // Auto-hide después de 2 segundos
      setTimeout(() => this.hide(), 2000);
    }
  }

  /**
   * Resetea todos los pasos a pending
   */
  resetSteps() {
    Object.keys(this.pipelineSteps).forEach(key => {
      this.updateStep(key, 'pending');
    });
    this.updateProgress(0);
    this.updateMessage('Iniciando generación...');
    this.updateTokens(0);
  }

  /**
   * Muestra un error específico
   * @param {string} errorMessage - Mensaje de error
   */
  showError(errorMessage) {
    this.updateStep('error', 'error');
    this.updateMessage(`❌ Error: ${errorMessage}`);
    this.updateProgress(0);
    
    // Auto-hide después de 5 segundos
    setTimeout(() => this.hide(), 5000);
  }

  /**
   * Actualiza el progreso basado en el estado del pipeline
   * @param {string} step - Paso actual
   * @param {number} customProgress - Progreso personalizado (opcional)
   */
  setProgressFromStep(step, customProgress = null) {
    if (customProgress !== null) {
      this.updateProgress(customProgress);
      return;
    }
    
    if (this.pipelineSteps[step]) {
      this.updateProgress(this.pipelineSteps[step].progress);
    }
  }
}

// Exportar para uso global
window.ProgressModal = ProgressModal;

// NOTA: Eliminada auto-inicialización para evitar que se muestre al cargar la página
// El modal se crea manualmente desde VisualFlowApp cuando se genera un diagrama