/**
 * Script de diagnóstico para identificar por qué el progreso no se muestra
 * durante la generación de diagramas.
 */

export class DiagnosticTool {
  constructor() {
    this.logs = [];
    this.events = [];
    this.timestamps = [];
  }

  /**
   * Inicia el diagnóstico
   */
  start() {
    console.log('🔍 INICIANDO DIAGNÓSTICO DE PROGRESO...');
    this.log('Inicio de diagnóstico');
    
    // Monitorear eventos del pipeline
    this.monitorPipelineEvents();
    
    // Monitorear visibilidad del modal
    this.monitorModalVisibility();
    
    // Monitorear llamadas a funciones críticas
    this.monitorCriticalFunctions();
    
    // Generar reporte después de 30 segundos
    setTimeout(() => this.generateReport(), 30000);
  }

  /**
   * Monitorea eventos pipeline-state-change
   */
  monitorPipelineEvents() {
    const originalDispatchEvent = document.dispatchEvent.bind(document);
    const originalAddEventListener = document.addEventListener.bind(document);
    
    // Interceptar dispatchEvent
    document.dispatchEvent = (event) => {
      if (event.type === 'pipeline-state-change') {
        this.log(`📤 Evento dispatchEvent: ${event.type}`, {
          step: event.detail?.state?.step,
          progress: event.detail?.state?.progress,
          timestamp: Date.now()
        });
        this.events.push({
          type: 'dispatch',
          event: event.type,
          detail: event.detail,
          timestamp: Date.now()
        });
      }
      return originalDispatchEvent(event);
    };
    
    // Interceptar addEventListener
    document.addEventListener = (type, listener, options) => {
      if (type === 'pipeline-state-change') {
        this.log(`👂 Evento addEventListener: ${type}`);
        this.events.push({
          type: 'listen',
          event: type,
          timestamp: Date.now()
        });
      }
      return originalAddEventListener(type, listener, options);
    };
    
    console.log('✅ Monitoreo de eventos pipeline activado');
  }

  /**
   * Monitorea visibilidad del modal de progreso
   */
  monitorModalVisibility() {
    const checkVisibility = () => {
      const modal = document.getElementById('progressModal');
      if (modal) {
        const isHidden = modal.classList.contains('hidden');
        const display = window.getComputedStyle(modal).display;
        const visibility = window.getComputedStyle(modal).visibility;
        const opacity = window.getComputedStyle(modal).opacity;
        
        this.log('👁️ Estado del modal', {
          isHidden,
          display,
          visibility,
          opacity,
          timestamp: Date.now()
        });
      }
    };
    
    // Verificar cada 500ms
    setInterval(checkVisibility, 500);
    console.log('✅ Monitoreo de visibilidad del modal activado');
  }

  /**
   * Monitorea llamadas a funciones críticas
   */
  monitorCriticalFunctions() {
    // Monitorear VisualFlowApp.generateDiagram
    if (window.VisualFlowApp) {
      const originalGenerate = VisualFlowApp.prototype.generateDiagram;
      VisualFlowApp.prototype.generateDiagram = async function(...args) {
        diagnostic.log('🎯 VisualFlowApp.generateDiagram() llamado');
        return originalGenerate.apply(this, args);
      };
    }
    
    // Monitorear ProgressModal.show
    if (window.ProgressModal) {
      const originalShow = ProgressModal.prototype.show;
      ProgressModal.prototype.show = function(...args) {
        diagnostic.log('🎯 ProgressModal.show() llamado');
        return originalShow.apply(this, args);
      };
    }
    
    // Monitorear PipelineService.updateState
    if (window.PipelineService) {
      const originalUpdateState = PipelineService.prototype.updateState;
      PipelineService.prototype.updateState = function(...args) {
        diagnostic.log('🎯 PipelineService.updateState() llamado', {
          step: args[0],
          progress: args[1]
        });
        return originalUpdateState.apply(this, args);
      };
    }
    
    console.log('✅ Monitoreo de funciones críticas activado');
  }

  /**
   * Registra un log
   */
  log(message, data = null) {
    const timestamp = Date.now();
    const entry = {
      message,
      data,
      timestamp,
      time: new Date(timestamp).toISOString()
    };
    
    this.logs.push(entry);
    console.log(`[DIAG] ${message}`, data || '');
  }

  /**
   * Genera reporte de diagnóstico
   */
  generateReport() {
    console.log('📋 GENERANDO REPORTE DE DIAGNÓSTICO...');
    
    const report = {
      summary: {
        totalLogs: this.logs.length,
        totalEvents: this.events.length,
        duration: this.logs.length > 0 ? Date.now() - this.logs[0].timestamp : 0
      },
      logs: this.logs,
      events: this.events,
      analysis: this.analyzeIssues()
    };
    
    console.log('📊 REPORTE DE DIAGNÓSTICO:', report);
    
    // Mostrar resumen en consola
    this.printSummary(report);
    
    // Guardar en localStorage para depuración
    try {
      localStorage.setItem('visualflow_diagnostic', JSON.stringify(report));
      console.log('💾 Reporte guardado en localStorage (clave: visualflow_diagnostic)');
    } catch (e) {
      console.warn('No se pudo guardar el reporte:', e);
    }
  }

  /**
   * Analiza problemas comunes
   */
  analyzeIssues() {
    const issues = [];
    
    // Verificar si se dispararon eventos
    const dispatchEvents = this.events.filter(e => e.type === 'dispatch');
    const listenEvents = this.events.filter(e => e.type === 'listen');
    
    if (dispatchEvents.length === 0) {
      issues.push('❌ No se dispararon eventos pipeline-state-change');
    } else {
      issues.push(`✅ Se dispararon ${dispatchEvents.length} eventos`);
    }
    
    if (listenEvents.length === 0) {
      issues.push('⚠️ No se detectaron listeners para pipeline-state-change (puede ser normal)');
    }
    
    // Verificar secuencia de eventos
    if (dispatchEvents.length > 0) {
      const steps = dispatchEvents.map(e => e.detail?.state?.step).filter(Boolean);
      const expectedSequence = ['analyzing', 'generating', 'verifying', 'complete'];
      const hasValidSequence = expectedSequence.some(step => steps.includes(step));
      
      if (hasValidSequence) {
        issues.push(`✅ Secuencia de pasos detectada: ${steps.join(' → ')}`);
      } else {
        issues.push(`❌ Secuencia inesperada: ${steps.join(' → ')}`);
      }
    }
    
    // Verificar llamadas a funciones
    const hasGenerateDiagram = this.logs.some(log => log.message.includes('VisualFlowApp.generateDiagram()'));
    const hasProgressModalShow = this.logs.some(log => log.message.includes('ProgressModal.show()'));
    const hasUpdateState = this.logs.some(log => log.message.includes('PipelineService.updateState()'));
    
    if (hasGenerateDiagram) issues.push('✅ Se llamó a VisualFlowApp.generateDiagram()');
    if (hasProgressModalShow) issues.push('✅ Se llamó a ProgressModal.show()');
    if (hasUpdateState) issues.push('✅ Se llamó a PipelineService.updateState()');
    
    // Verificar modal en DOM
    const modal = document.getElementById('progressModal');
    if (modal) {
      issues.push('✅ Modal encontrado en DOM');
      
      const computedStyle = window.getComputedStyle(modal);
      issues.push(`📐 Estilo computado: display=${computedStyle.display}, visibility=${computedStyle.visibility}, opacity=${computedStyle.opacity}`);
    } else {
      issues.push('❌ Modal NO encontrado en DOM');
    }
    
    return issues;
  }

  /**
   * Imprime resumen en consola
   */
  printSummary(report) {
    console.log('\n\n' + '='.repeat(60));
    console.log('        📊 RESUMEN DE DIAGNÓSTICO');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Estadísticas:`);
    console.log(`   - Logs registrados: ${report.summary.totalLogs}`);
    console.log(`   - Eventos capturados: ${report.summary.totalEvents}`);
    console.log(`   - Duración: ${Math.floor(report.summary.duration / 1000)}s`);
    
    console.log(`\n🔍 Análisis de problemas:`);
    report.analysis.forEach(issue => {
      console.log(`   ${issue}`);
    });
    
    console.log(`\n📋 Próximos pasos:`);
    console.log(`   1. Revisa los logs completos en: diagnostic.logs`);
    console.log(`   2. Verifica el reporte en localStorage: visualflow_diagnostic`);
    console.log(`   3. Busca errores en la consola (F12)`);
    console.log(`   4. Revisa si hay múltiples instancias de ProgressModal`);
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Inicializar herramienta de diagnóstico
const diagnostic = new DiagnosticTool();

// Exportar para uso global
window.diagnostic = diagnostic;

// Auto-iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('🚀 Herramienta de diagnóstico lista. Ejecuta: diagnostic.start()');
  }, 1000);
});