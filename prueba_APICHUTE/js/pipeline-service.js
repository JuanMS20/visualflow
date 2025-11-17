/**
 * PipelineService - Orquestación del pipeline multi-modelo TOON
 * 
 * Coordina el flujo completo:
 * 1. Kimi K2: Análisis del concepto → TOON
 * 2. Qwen Image: Generación de imágenes → URLs
 * 3. Qwen 3 VL: Verificación y organización → Diagrama final TOON
 */

import { ChutesService } from './chutes-service.js';
import { JsonService } from './json-service.js';

export class PipelineService {
  constructor() {
    this.chutes = new ChutesService();
    this.generationId = this.generateId();
    
    // Estado del pipeline
    this.state = {
      step: 'idle', // idle → analyzing → generating → verifying → complete
      progress: 0,
      analysis: null,
      images: [],
      diagram: null,
      error: null,
      startTime: null
    };
  }

  /**
   * Genera un diagrama completo usando el pipeline multi-modelo
   * @param {string} prompt - Prompt del usuario
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Object>} Resultado con diagrama TOON e imágenes
   */
  async generateDiagram(prompt, options = {}) {
    this.resetState();
    this.state.startTime = Date.now();
    
    console.log('🚀 === INICIANDO PIPELINE MULTI-MODELO CORRECTO ===');
    console.log('📝 Prompt usuario:', prompt);
    console.log('🎯 Flujo esperado: Kimi K2 → Qwen Image → Qwen 3 VL');
    
    try {
      // PASO 1: Kimi K2 - Coordinación completa
      console.log('\n🧠 === PASO 1: KIMI K2 - COORDINACIÓN ===');
      this.updateState('analyzing', 10);
      
      console.log('🔍 Kimi K2 debe:');
      console.log('  1. Analizar concepto');
      console.log('  2. Descomponer en elementos');
      console.log('  3. Generar prompts para Qwen Image');
      console.log('  4. Determinar si necesita imágenes');
      
      const analysisResponse = await this.analyzeConcept(prompt);
      console.log('📋 Respuesta Kimi K2:', analysisResponse);
      
      this.state.analysis = this.parseAnalysisResponse(analysisResponse);
      console.log('🔧 Análisis parseado:', JSON.stringify(this.state.analysis, null, 2));
      
      // Validar análisis
      if (!this.validateAnalysis(this.state.analysis)) {
        throw new Error('Análisis inválido: estructura incompleta');
      }
      
      console.log('✅ Paso 1 completado - Análisis válido');
      
      // PASO 2: Qwen Image - Generación de imágenes
      console.log('\n🎨 === PASO 2: QWEN IMAGE - GENERACIÓN ===');
      let images = [];
      
      if (this.state.analysis.analysis?.needsImages) {
        console.log('🖼️ Kimi K2 determinó que necesita imágenes');
        this.updateState('generating', 40);
        
        console.log('📸 Prompts para Qwen Image:', this.state.analysis.analysis.promptsToGenerate);
        images = await this.generateImages(this.state.analysis);
        this.state.images = images;
        
        console.log('✅ Paso 2 completado - Imágenes generadas:', images.length);
      } else {
        console.log('⚠️ Kimi K2 determinó que NO necesita imágenes');
        console.log('❌ ESTE ES UN PROBLEMA - Debería generar imágenes para diagramas visuales');
      }
      
      // PASO 3: Qwen 3 VL - Verificación y organización
      console.log('\n👁️ === PASO 3: QWEN 3 VL - VERIFICACIÓN ===');
      this.updateState('verifying', 70);
      
      console.log('🔍 Qwen 3 VL debe:');
      console.log('  1. Recibir imágenes de Qwen Image');
      console.log('  2. Analizar visualmente cada imagen');
      console.log('  3. Verificar que no tengan texto');
      console.log('  4. Organizar layout final');
      console.log('  5. Crear estructura TOON/JSON final');
      
      // PASAR A QWEN 3 VL: Análisis + Imágenes para verificación
      const finalDiagram = await this.callQwenVL(this.state.analysis, images);
      this.state.diagram = typeof finalDiagram === 'string' ? JsonService.parse(finalDiagram) : finalDiagram;
      
      console.log('✅ Paso 3 completado - Diagrama final creado');
      
      // PASO 4: Finalización
      console.log('\n🎉 === PASO 4: FINALIZACIÓN ===');
      this.updateState('complete', 100);
      
      const stats = this.calculateStats();
      console.log('📊 Estadísticas finales:', stats);
      
      console.log('🏁 === PIPELINE COMPLETADO ===');
      
      return {
        success: true,
        diagram: this.state.diagram,
        images: images,
        stats: stats,
        generationId: this.generationId
      };

    } catch (error) {
      console.error('❌ === ERROR EN PIPELINE ===');
      console.error('Error:', error);
      console.error('Step:', this.state.step);
      console.error('Stack:', error.stack);
      
      this.updateState('error', 0, error.message);
      
      return {
        success: false,
        error: error.message,
        step: this.state.step,
        generationId: this.generationId
      };
    }
  }

  /**
   * Paso 1: Análisis del concepto con Kimi K2
   * @param {string} prompt - Prompt original
   * @returns {Promise<string>} Respuesta de análisis (JSON o texto)
   */
  async analyzeConcept(prompt) {
    try {
      console.log('🧠 Analizando concepto con Kimi K2...');
      
      const analysisResponse = await this.chutes.analyzeConcept(prompt);
      
      console.log('✅ Análisis completado:', analysisResponse);
      return analysisResponse;
      
    } catch (error) {
      throw new Error(`Error en análisis Kimi: ${error.message}`);
    }
  }

  /**
   * Parsea la respuesta de análisis de Kimi
   * @param {string} response - Respuesta de Kimi
   * @returns {Object} Análisis parseado
   */
  parseAnalysisResponse(response) {
    try {
      // Intentar parsear como JSON primero
      if (response.trim().startsWith('{')) {
        return JsonService.parse(response);
      }
      
      // Si no es JSON, intentar extraer estructura YAML/TOON y convertir a JSON
      const lines = response.split('\n');
      const analysis = {
        analysis: {
          concept: '',
          needsImages: false,
          elements: [],
          promptsToGenerate: [],
          style: 'modern'
        }
      };
      
      let currentSection = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Detectar secciones
        if (trimmed.toLowerCase().includes('concept:')) {
          analysis.analysis.concept = trimmed.split(':')[1]?.trim() || '';
        } else if (trimmed.toLowerCase().includes('needsimages')) {
          analysis.analysis.needsImages = trimmed.toLowerCase().includes('true');
        } else if (trimmed.toLowerCase().includes('elements') || trimmed.toLowerCase().includes('nodes')) {
          currentSection = 'elements';
        } else if (trimmed.toLowerCase().includes('prompts')) {
          currentSection = 'prompts';
        } else if (trimmed.toLowerCase().includes('style')) {
          analysis.analysis.style = trimmed.split(':')[1]?.trim() || 'modern';
        } else if (currentSection === 'elements' && trimmed.includes('"')) {
          // Extraer elemento
          const parts = trimmed.split('"');
          if (parts.length >= 3) {
            analysis.analysis.elements.push({
              id: `el${analysis.analysis.elements.length + 1}`,
              title: parts[1] || '',
              description: parts[3] || ''
            });
          }
        } else if (currentSection === 'prompts' && trimmed.includes('"')) {
          // Extraer prompt
          const promptMatch = trimmed.match(/"([^"]+)"/);
          if (promptMatch) {
            analysis.analysis.promptsToGenerate.push(promptMatch[1]);
          }
        }
      }
      
      return analysis;
      
    } catch (error) {
      console.error('Error parseando respuesta:', error);
      // Retornar estructura básica en caso de error
      return {
        analysis: {
          concept: 'Diagrama',
          needsImages: false,
          elements: [{ id: 'el1', title: 'Elemento', description: '' }],
          promptsToGenerate: [],
          style: 'modern'
        }
      };
    }
  }

  /**
   * Paso 2: Generación de imágenes con Qwen Image
   * @param {Object} analysis - Análisis parseado
   * @returns {Promise<Array>} Array de imágenes generadas
   */
  async generateImages(analysis) {
    try {
      console.log('🎨 Generando imágenes con Qwen Image...');
      
      // Validar que promptsToGenerate sea un array
      let prompts = analysis.analysis?.promptsToGenerate || [];
      
      if (!Array.isArray(prompts)) {
        console.warn('promptsToGenerate no es un array, intentando convertir...');
        // Si es un string, intentar dividir por líneas
        if (typeof prompts === 'string') {
          prompts = prompts.split('\n').filter(p => p.trim());
        } else {
          prompts = [];
        }
      }
      
      if (prompts.length === 0) {
        console.warn('No se encontraron prompts para generar imágenes');
        return [];
      }
      
      console.log(`📸 Generando ${prompts.length} imágenes en paralelo...`);
      
      const imageResults = await this.chutes.callQwenImage(prompts);
      
      // Filtrar solo imágenes exitosas
      const successfulImages = imageResults.filter(img => img.status === 'success');
      
      console.log(`✅ Imágenes generadas: ${successfulImages.length}/${prompts.length}`);
      
      return successfulImages;
      
    } catch (error) {
      throw new Error(`Error en generación de imágenes: ${error.message}`);
    }
  }

  /**
   * Paso 3: Llamada a Qwen 3 VL para verificación y organización final
   * @param {Object} analysis - Análisis parseado de Kimi K2
   * @param {Array} images - Imágenes generadas por Qwen Image
   * @returns {Promise<string|Object>} Diagrama final verificado en JSON
   */
  async verifyWithQwenVL(analysis, images) {
    try {
      console.log('👁️ === QWEN 3 VL: VERIFICACIÓN Y ORGANIZACIÓN FINAL ===');
      
      console.log('📋 Análisis recibido:', analysis);
      console.log('🖼️ Imágenes recibidas:', images.length);
      
      if (images.length === 0) {
        console.warn('⚠️ No hay imágenes para verificar');
        // Crear diagrama sin imágenes
        return JsonService.createDiagram(analysis, []);
      }
      
      console.log('📸 Detalles de imágenes:');
      images.forEach((img, i) => {
        console.log(`  ${i + 1}. URL: ${img.url}, Prompt: ${img.prompt}, Status: ${img.status}`);
      });
      
      // 🔍 DEBUG: Verificar estructura de análisis
      console.log('🔍 Estructura de análisis:', JSON.stringify(analysis, null, 2));
      
      // Preparar prompt para Qwen 3 VL
      const prompt = `Analiza estas ${images.length} imágenes y organiza el diagrama final.
      
      Análisis previo: ${JSON.stringify(analysis)}
      
      Imágenes generadas: ${JSON.stringify(images.map(img => ({url: img.url, prompt: img.prompt})))}
      
      Devuelve un JSON con:
      1. nodes: array de nodos con id, type, label, position, style (con imageUrl), imageUrl
      2. connections: array de conexiones
      3. metadata: información adicional
      
      IMPORTANTE:
      - Cada nodo debe tener style.imageUrl con la URL completa de la imagen
      - También guarda la URL en imageUrl directo (propiedad principal)
      - Usa las URLs reales proporcionadas: ${images.map(img => img.url).join(', ')}
      - Responde EXCLUSIVAMENTE con JSON válido, sin explicaciones adicionales.`;

      console.log('📝 Prompt para Qwen 3 VL:', prompt.substring(0, 300) + '...');
      
      // Llamar a Qwen 3 VL
      console.log('🔧 Llamando a this.chutes.callQwenVL...');
      const result = await this.chutes.callQwenVL(prompt);
      
      console.log('✅ Qwen 3 VL completó la verificación');
      console.log('📊 Resultado de Qwen 3 VL:', result);
      
      // 🔍 DEBUG: Verificar si el resultado tiene JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const diagramJson = JSON.parse(jsonMatch[0]);
        console.log('📋 Diagrama JSON parseado:', diagramJson);
        
        // 🔍 DEBUG: Verificar dónde están las URLs
        console.log('🔍 ANTES de asignar URLs:');
        console.log('📸 Imágenes disponibles:', images);
        console.log('📋 Nodos antes de asignación:', diagramJson.nodes);
        
        // Asegurar que las URLs de imágenes estén en los nodos
        if (diagramJson.nodes && images.length > 0) {
          diagramJson.nodes.forEach((node, index) => {
            console.log(`🔍 Procesando nodo ${index}:`, node);
            
            if (images[index] && images[index].url) {
              node.style = node.style || {};
              node.style.imageUrl = images[index].url;
              
              // 🔍 DEBUG: También guardar en imageUrl directo por si acaso
              node.imageUrl = images[index].url;
              
              console.log(`✅ Asignada URL a nodo ${node.id}: ${images[index].url}`);
              console.log(`📋 Nodo final:`, node);
            } else {
              console.warn(`⚠️ No hay imagen para nodo ${index}`);
            }
          });
        }
        
        // 🔍 DEBUG: Verificar resultado final
        console.log('📊 DIAGRAMA FINAL con URLs:', diagramJson);
        
        return diagramJson;
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en Qwen 3 VL:', error);
      // Fallback: crear diagrama sin verificación
      return JsonService.createDiagram(analysis, images);
    }
  }

  /**
   * Crea un diagrama textual cuando no hay imágenes
   * @param {Object} analysis - Análisis parseado
   * @returns {string} Diagrama JSON textual
   */
  createTextualDiagram(analysis) {
    console.log('📝 Creando diagrama JSON textual...');
    return JsonService.createDiagram(analysis, []);
  }

  /**
   * Valida la estructura del análisis
   * @param {Object} analysis - Análisis parseado
   * @returns {boolean} true si es válido
   */
  validateAnalysis(analysis) {
    if (!analysis || !analysis.analysis) {
      console.error('Análisis inválido: estructura incompleta');
      return false;
    }
    
    const analysisData = analysis.analysis;
    
    // Validar campos requeridos con más flexibilidad
    if (!analysisData.concept) {
      console.error('Análisis inválido: falta campo concept');
      return false;
    }
    
    // Elements puede ser array o string, validar que exista
    if (!analysisData.elements) {
      console.error('Análisis inválido: falta campo elements');
      return false;
    }
    
    // promptsToGenerate puede ser array o string, pero debe existir
    if (!analysisData.promptsToGenerate) {
      console.warn('Análisis: falta campo promptsToGenerate, se continuará sin imágenes');
      analysisData.promptsToGenerate = [];
    }
    
    // Asegurar que elements sea array
    if (!Array.isArray(analysisData.elements)) {
      if (typeof analysisData.elements === 'string') {
        // Intentar parsear si es string JSON
        try {
          analysisData.elements = JSON.parse(analysisData.elements);
        } catch {
          // Convertir a array simple si no se puede parsear
          analysisData.elements = [{id: 'el1', title: analysisData.elements, description: ''}];
        }
      } else {
        analysisData.elements = [];
      }
    }
    
    // Asegurar que promptsToGenerate sea array
    if (!Array.isArray(analysisData.promptsToGenerate)) {
      if (typeof analysisData.promptsToGenerate === 'string') {
        analysisData.promptsToGenerate = analysisData.promptsToGenerate.split('\n').filter(p => p.trim());
      } else {
        analysisData.promptsToGenerate = [];
      }
    }
    
    console.log('✅ Análisis validado y normalizado:', {
      concept: analysisData.concept,
      elementsCount: analysisData.elements.length,
      promptsCount: analysisData.promptsToGenerate.length
    });
    
    return true;
  }

  /**
   * Calcula estadísticas de la generación
   * @returns {Object} Estadísticas
   */
  calculateStats() {
    if (!this.state.startTime) {
      return { generationTime: 0, tokensSaved: 0 };
    }
    
    const generationTime = Date.now() - this.state.startTime;
    
    // Calcular ahorro de tokens (estimado)
    const tokensSaved = Math.floor(generationTime / 50); // Estimación simple
    
    return {
      generationTime,
      tokensSaved,
      imagesGenerated: this.state.images.length,
      stepsCompleted: this.state.step
    };
  }

  /**
   * Genera un ID único para la generación
   * @returns {string} ID único
   */
  generateId() {
    return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Actualiza el estado del pipeline
   * @param {string} step - Paso actual
   * @param {number} progress - Progreso (0-100)
   * @param {string} error - Mensaje de error (opcional)
   */
  updateState(step, progress, error = null) {
    this.state.step = step;
    this.state.progress = progress;
    if (error) this.state.error = error;
    
    console.log(`🔔 Pipeline state updated: ${step} (${progress}%)`);
    console.log(`📡 Disparando evento pipeline-state-change...`);
    
    // Notificar cambio de estado
    this.notifyStateChange();
    
    console.log(`✅ Evento disparado para: ${step}`);
  }

  /**
   * Resetea el estado del pipeline
   */
  resetState() {
    this.state = {
      step: 'idle',
      progress: 0,
      analysis: null,
      images: [],
      diagram: null,
      error: null,
      startTime: null
    };
    this.generationId = this.generateId();
  }

  /**
   * Notifica cambios de estado (para UI)
   */
  notifyStateChange() {
    console.log(`📡 Preparando evento para: ${this.state.step} (${this.state.progress}%)`);
    
    // Disparar evento personalizado
    const event = new CustomEvent('pipeline-state-change', {
      detail: {
        state: this.state,
        generationId: this.generationId
      }
    });
    
    console.log(`📡 Evento creado: pipeline-state-change`, event.detail);
    document.dispatchEvent(event);
    console.log(`✅ Evento dispatchEvent() ejecutado`);
  }

  /**
   * Obtiene el estado actual del pipeline
   * @returns {Object} Estado actual
   */
  getState() {
    return {
      ...this.state,
      generationId: this.generationId
    };
  }

  /**
   * Cancela la generación en curso
   */
  cancel() {
    console.log('🛑 Cancelando generación...');
    this.updateState('cancelled', 0, 'Generación cancelada por el usuario');
    // Nota: En frontend directo, no podemos cancelar llamadas HTTP fácilmente
    // Esto es una limitación del approach sin backend
  }
}

// Exportar para uso global
window.PipelineService = PipelineService;

// Tests básicos
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 PipelineService cargado. Ejecutando tests...');
  
  const pipeline = new PipelineService();
  
  // Test 1: Generar ID
  const id1 = pipeline.generateId();
  const id2 = pipeline.generateId();
  console.assert(id1 !== id2, 'Test ID generación falló');
  
  // Test 2: Estado inicial
  const state = pipeline.getState();
  console.assert(state.step === 'idle', 'Test estado inicial falló');
  
  // Test 3: Reset estado
  pipeline.updateState('analyzing', 50);
  pipeline.resetState();
  const resetState = pipeline.getState();
  console.assert(resetState.step === 'idle', 'Test reset estado falló');
  
  console.log('✅ Tests de PipelineService completados');
}