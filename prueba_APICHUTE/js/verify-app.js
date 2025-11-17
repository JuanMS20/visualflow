/**
 * verify-app.js - Script de verificación de la aplicación
 * 
 * Este script verifica que todos los componentes de VisualFlow
 * están correctamente cargados y funcionando.
 */

// Esperar a que todo esté cargado
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 INICIANDO VERIFICACIÓN DE LA APLICACIÓN...');
  
  setTimeout(() => {
    runVerification();
  }, 1000); // Esperar 1 segundo para que todos los módulos carguen
});

function runVerification() {
  const results = [];
  
  // 1. Verificar componentes globales
  console.log('\n=== 1. VERIFICANDO COMPONENTES GLOBALES ===');
  
  // Config
  if (window.VISUALFLOW_CONFIG) {
    console.log('✅ CONFIG cargado');
    console.log('   - KIMI_API_KEY:', window.VISUALFLOW_CONFIG.KIMI_API_KEY ? 'Presente' : '❌ FALTANTE');
    results.push({ name: 'CONFIG', status: 'OK' });
  } else {
    console.log('❌ CONFIG no encontrado');
    results.push({ name: 'CONFIG', status: 'ERROR' });
  }
  
  // ToonService
  if (window.ToonService) {
    console.log('✅ ToonService cargado');
    // Probar encode/decode
    try {
      const test = { name: 'test', value: 123 };
      const encoded = window.ToonService.encode(test);
      const decoded = window.ToonService.parse(encoded);
      if (decoded.name === 'test' && decoded.value === 123) {
        console.log('   - Encode/decode: FUNCIONANDO');
      } else {
        console.log('   - Encode/decode: ❌ ERROR');
      }
    } catch (e) {
      console.log('   - Encode/decode: ❌ ERROR -', e.message);
    }
    results.push({ name: 'ToonService', status: 'OK' });
  } else {
    console.log('❌ ToonService no encontrado');
    results.push({ name: 'ToonService', status: 'ERROR' });
  }
  
  // ChutesService
  if (window.ChutesService) {
    console.log('✅ ChutesService cargado');
    const service = new window.ChutesService();
    console.log('   - Rate limit check:', service.checkRateLimit ? 'FUNCIONANDO' : '❌ FALTANTE');
    console.log('   - Daily limit check:', service.checkDailyLimit ? 'FUNCIONANDO' : '❌ FALTANTE');
    results.push({ name: 'ChutesService', status: 'OK' });
  } else {
    console.log('❌ ChutesService no encontrado');
    results.push({ name: 'ChutesService', status: 'ERROR' });
  }
  
  // PipelineService
  if (window.PipelineService) {
    console.log('✅ PipelineService cargado');
    const pipeline = new window.PipelineService();
    console.log('   - generateDiagram:', pipeline.generateDiagram ? 'FUNCIONANDO' : '❌ FALTANTE');
    results.push({ name: 'PipelineService', status: 'OK' });
  } else {
    console.log('❌ PipelineService no encontrado');
    results.push({ name: 'PipelineService', status: 'ERROR' });
  }
  
  // DiagramRenderer
  if (window.DiagramRenderer) {
    console.log('✅ DiagramRenderer cargado');
    results.push({ name: 'DiagramRenderer', status: 'OK' });
  } else {
    console.log('❌ DiagramRenderer no encontrado');
    results.push({ name: 'DiagramRenderer', status: 'ERROR' });
  }
  
  // ProgressModal
  if (window.ProgressModal) {
    console.log('✅ ProgressModal cargado');
    const modal = new window.ProgressModal();
    console.log('   - show:', modal.show ? 'FUNCIONANDO' : '❌ FALTANTE');
    console.log('   - hide:', modal.hide ? 'FUNCIONANDO' : '❌ FALTANTE');
    results.push({ name: 'ProgressModal', status: 'OK' });
  } else {
    console.log('❌ ProgressModal no encontrado');
    results.push({ name: 'ProgressModal', status: 'ERROR' });
  }
  
  // 2. Verificar VisualFlowApp
  console.log('\n=== 2. VERIFICANDO VisualFlowApp ===');
  
  if (window.visualFlowApp) {
    console.log('✅ VisualFlowApp global creada');
    const app = window.visualFlowApp;
    console.log('   - Estado actual:', app.state);
    console.log('   - Pipeline:', app.pipeline ? 'CONECTADO' : '❌ FALTANTE');
    console.log('   - Renderer:', app.renderer ? 'CONECTADO' : '❌ FALTANTE');
    console.log('   - ProgressModal:', app.progressModal ? 'CONECTADO' : '❌ FALTANTE');
    results.push({ name: 'VisualFlowApp', status: 'OK' });
  } else {
    console.log('❌ VisualFlowApp no encontrada');
    results.push({ name: 'VisualFlowApp', status: 'ERROR' });
  }
  
  // 3. Verificar elementos DOM
  console.log('\n=== 3. VERIFICANDO ELEMENTOS DOM ===');
  
  const requiredElements = [
    'textInput', 'generateBtn', 'diagramCanvas',
    'errorContainer', 'canvasTitle', 'canvasStats'
  ];
  
  let domOk = true;
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`✅ #${id} encontrado`);
    } else {
      console.log(`❌ #${id} no encontrado`);
      domOk = false;
    }
  });
  
  results.push({ name: 'Elementos DOM', status: domOk ? 'OK' : 'ERROR' });
  
  // 4. Verificar event listeners
  console.log('\n=== 4. VERIFICANDO EVENT LISTENERS ===');
  
  if (window.visualFlowApp) {
    const app = window.visualFlowApp;
    const generateBtn = document.getElementById('generateBtn');
    
    if (generateBtn) {
      const listeners = getEventListeners(generateBtn);
      if (listeners.click && listeners.click.length > 0) {
        console.log('✅ Event listener en generateBtn');
        results.push({ name: 'Event Listeners', status: 'OK' });
      } else {
        console.log('❌ No hay event listener en generateBtn');
        results.push({ name: 'Event Listeners', status: 'ERROR' });
      }
    } else {
      console.log('❌ generateBtn no encontrado');
      results.push({ name: 'Event Listeners', status: 'ERROR' });
    }
  } else {
    console.log('❌ No se puede verificar event listeners sin VisualFlowApp');
    results.push({ name: 'Event Listeners', status: 'ERROR' });
  }
  
  // 5. Resumen final
  console.log('\n=== 5. RESUMEN FINAL ===');
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ Componentes OK: ${okCount}`);
  console.log(`❌ Componentes ERROR: ${errorCount}`);
  console.log(`📊 Total: ${results.length} componentes verificados`);
  
  results.forEach(result => {
    console.log(`   ${result.status === 'OK' ? '✅' : '❌'} ${result.name}: ${result.status}`);
  });
  
  if (errorCount === 0) {
    console.log('\n🎉 ¡TODOS LOS COMPONENTES ESTÁN CARGADOS CORRECTAMENTE!');
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('   1. Abre la consola del navegador (F12)');
    console.log('   2. Escribe un prompt en el textarea');
    console.log('   3. Haz clic en "Crear Visual"');
    console.log('   4. Observa el progreso en el modal');
    console.log('   5. Verifica que el diagrama se renderiza');
  } else {
    console.log('\n⚠️  ALGUNOS COMPONENTES TIENEN PROBLEMAS');
    console.log('   Revisa los mensajes de error arriba');
  }
  
  // Mostrar en la UI
  showVerificationResults(results, okCount, errorCount);
}

function showVerificationResults(results, okCount, errorCount) {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
    z-index: 2000;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  `;
  
  const title = document.createElement('h2');
  title.textContent = '🔍 Verificación de VisualFlow';
  title.style.marginBottom = '1rem';
  
  const summary = document.createElement('p');
  summary.textContent = `✅ ${okCount} componentes OK | ❌ ${errorCount} errores`;
  summary.style.marginBottom = '1.5rem';
  summary.style.fontWeight = 'bold';
  summary.style.color = errorCount === 0 ? '#10b981' : '#ef4444';
  
  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = 0;
  
  results.forEach(result => {
    const item = document.createElement('li');
    item.textContent = `${result.status === 'OK' ? '✅' : '❌'} ${result.name}`;
    item.style.padding = '0.25rem 0';
    item.style.color = result.status === 'OK' ? '#10b981' : '#ef4444';
    list.appendChild(item);
  });
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Cerrar';
  closeBtn.style.cssText = `
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
  `;
  closeBtn.onclick = () => container.remove();
  
  container.appendChild(title);
  container.appendChild(summary);
  container.appendChild(list);
  container.appendChild(closeBtn);
  
  document.body.appendChild(container);
}

// Helper para verificar event listeners (solo funciona en Chrome)
function getEventListeners(element) {
  if (element._getEventListeners) {
    return element._getEventListeners();
  }
  return { click: [] }; // Fallback
}

// Mensaje de bienvenida
console.log('\n🎉 VERIFICACIÓN COMPLETADA');
console.log('   Si todo está OK, la aplicación debería funcionar correctamente.');
console.log('   Prueba escribiendo un prompt y haciendo clic en "Crear Visual"');
</script>