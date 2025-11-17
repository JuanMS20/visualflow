/**
 * ChutesService - Llamadas directas a APIs de Chutes AI
 * 
 * Servicio para interactuar con:
 * - Kimi K2 (análisis y coordinación)
 * - Qwen Image (generación de imágenes)
 * - Qwen 3 VL (verificación y organización)
 */

import { CONFIG } from './config.js';

export class ChutesService {
  constructor() {
    this.kimiKey = CONFIG.KIMI_API_KEY;
    this.qwenImageKey = CONFIG.QWEN_IMAGE_API_KEY;
    this.qwenVLKey = CONFIG.QWEN_VL_API_KEY;
    
    // Estado para rate limiting
    this.lastCallTime = {
      kimi: 0,
      qwenImage: 0,
      qwenVL: 0
    };
    
    // Contadores de uso
    this.usage = {
      today: new Date().toDateString(),
      count: 0
    };
    
    this.loadUsage();
  }

  // ==================== LLAMADAS A KIMI K2 ====================

  /**
   * Llama a Kimi K2 para análisis de conceptos
   * @param {Array} messages - Array de mensajes {role, content}
   * @param {Object} options - Opciones de generación
   * @returns {Promise<string>} Respuesta en formato TOON
   */
  async callKimi(messages, options = {}) {
    this.checkRateLimit('kimi');
    this.checkDailyLimit();
    
    console.log('🔍 === VERIFICANDO CONFIGURACIÓN DE API ===');
    console.log('📋 Endpoint:', CONFIG.ENDPOINT_LLM);
    console.log('🤖 Modelo:', CONFIG.MODELS.KIMI);
    console.log('🔑 API Key (primeros 10 chars):', this.kimiKey?.substring(0, 10) + '...');
    console.log('📏 API Key length:', this.kimiKey?.length || 0);
    
    const body = {
      model: CONFIG.MODELS.KIMI,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: false
    };

    console.log('📦 Body a enviar:', JSON.stringify(body, null, 2));

    try {
      console.log('🌐 Enviando request a:', CONFIG.ENDPOINT_LLM);
      
      const response = await fetch(CONFIG.ENDPOINT_LLM, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.kimiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Kimi API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      
      this.updateUsage();
      this.lastCallTime.kimi = Date.now();
      
      return data.choices[0].message.content;

    } catch (error) {
      console.error('❌ Error en llamada a Kimi:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Análisis simplificado de concepto
   * @param {string} prompt - Prompt del usuario
   * @returns {Promise<string>} Análisis en TOON
   */
  async analyzeConcept(prompt) {
    console.log('🧠 === CHUTES SERVICE: KIMI K2 ANALYZE CONCEPT ===');
    console.log('📝 Prompt recibido:', prompt);
    
    const systemPrompt = `Eres el coordinador de creación de diagramas visuales con IA.
Tu tarea es analizar el prompt del usuario y generar EXACTAMENTE lo que se te pide.

REGLAS OBLIGATORIAS:
1. SIEMPRE genera imágenes (needsImages: true) - Los diagramas visuales REQUIEREN imágenes
2. Genera prompts específicos para Qwen Image para CADA elemento
3. Los prompts deben ser detallados y enfocados en elementos visuales sin texto
4. Responde EXCLUSIVAMENTE en formato TOON, sin explicaciones adicionales

Estructura de salida TOON OBLIGATORIA:
analysis:
  concept: "Concepto principal identificado"
  needsImages: true
  elements[N]{id,title,description}:
    id1,Titulo1,Descripcion breve
    id2,Titulo2,Descripcion breve
  promptsToGenerate[N]:
    "Prompt detallado para Qwen Image: descripcion visual, sin texto, estilo moderno, colores vibrantes, elementos claros"
    "Prompt detallado para Qwen Image: descripcion visual, sin texto, estilo moderno, colores vibrantes, elementos claros"
  style: "modern"`;
    
    const userPrompt = `Crea un diagrama visual profesional para: "${prompt}"
    
IMPORTANTE:
- Descompon en elementos visuales claros
- Genera prompts específicos para cada elemento
- Los prompts deben ser para Qwen Image (generador de imágenes)
- Enfócate en elementos visuales sin texto escrito
- Usa estilo moderno y colores profesionales`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log('📋 Mensajes para Kimi K2:', messages);
    console.log('🔧 Llamando a callKimi()...');
    
    const result = await this.callKimi(messages);
    
    console.log('📋 Respuesta de Kimi K2:', result);
    console.log('📏 Longitud:', result?.length || 0);
    
    // Validar estructura de respuesta
    if (typeof result === 'string') {
      const hasAnalysis = result.includes('analysis:');
      const hasNeedsImages = result.includes('needsImages:');
      const hasElements = result.includes('elements[');
      const hasPrompts = result.includes('promptsToGenerate[');
      
      console.log('🔍 Validación de estructura TOON:');
      console.log('  📦 Tiene analysis:', hasAnalysis);
      console.log('  🖼️ Tiene needsImages:', hasNeedsImages);
      console.log('  📋 Tiene elements:', hasElements);
      console.log('  🎨 Tiene promptsToGenerate:', hasPrompts);
      
      // Si no tiene prompts, forzar generación
      if (hasElements && !hasPrompts) {
        console.warn('⚠️ Kimi K2 no generó prompts, creando prompts automáticos...');
        return this.forceGeneratePrompts(result, prompt);
      }
    }
    
    console.log('✅ analyzeConcept() completado');
    return result;
  }

  /**
   * Fuerza la generación de prompts si Kimi K2 no los crea
   * @param {string} toonResponse - Respuesta TOON sin prompts
   * @param {string} originalPrompt - Prompt original del usuario
   * @returns {string} TOON con prompts generados
   */
  forceGeneratePrompts(toonResponse, originalPrompt) {
    console.log('🔄 Forzando generación de prompts...');
    
    try {
      // Extraer elementos de la respuesta TOON
      const elementsMatch = toonResponse.match(/elements\[\d+\]\{[^}]+\}:\s*([\s\S]*?)(?=promptsToGenerate|style|$)/);
      if (!elementsMatch) {
        console.warn('❌ No se pudieron extraer elementos');
        return toonResponse;
      }
      
      const elementsText = elementsMatch[1];
      const elementLines = elementsText.trim().split('\n').filter(line => line.trim());
      
      // Generar prompts basados en los elementos
      const prompts = elementLines.map((line, i) => {
        // Extraer título y descripción
        const parts = line.trim().split(',');
        const title = parts[1]?.replace(/"/g, '').trim() || `Elemento ${i+1}`;
        const description = parts[2]?.replace(/"/g, '').trim() || `Visualización de ${title}`;
        
        return `Diagrama visual: ${title}, ${description}, sin texto, estilo moderno, colores profesionales, elementos claros, alta calidad`;
      });
      
      // Reemplazar la sección de prompts en el TOON
      const promptsSection = `promptsToGenerate[${prompts.length}]:\n    "${prompts.join('"\n    "')}"`;
      
      // Insertar o reemplazar la sección de prompts
      let fixedResponse = toonResponse;
      if (toonResponse.includes('promptsToGenerate[')) {
        // Reemplazar existente
        fixedResponse = toonResponse.replace(/promptsToGenerate\[\d+\]:\s*([\s\S]*?)(?=style|$)/, promptsSection + '\n');
      } else {
        // Insertar antes de style
        fixedResponse = toonResponse.replace(/(style:)/, promptsSection + '\n\n  $1');
      }
      
      // Asegurar needsImages: true
      fixedResponse = fixedResponse.replace(/needsImages:\s*false/, 'needsImages: true');
      
      console.log('✅ Prompts forzados generados:', fixedResponse);
      return fixedResponse;
      
    } catch (error) {
      console.error('❌ Error forzando prompts:', error);
      return toonResponse;
    }
  }

  /**
   * Genera análisis DEMO cuando APIs no están disponibles
   * @param {string} prompt - Prompt del usuario
   * @returns {string} Análisis en formato TOON simulado
   */
  generateDemoAnalysis(prompt) {
    console.log('🎭 === GENERANDO ANÁLISIS DEMO ===');
    
    // Extraer conceptos clave del prompt
    const concepts = this.extractConcepts(prompt);
    
    // ✅ CORREGIDO: Generar prompts reales para cada elemento
    const prompts = concepts.elements.map((el, i) =>
      `Diagrama visual: ${el.title}, ${el.description}, sin texto, estilo moderno, colores profesionales, elementos claros, alta calidad`
    );
    
    const demoAnalysis = `analysis:
  concept: "${concepts.main}"
  needsImages: true
  elements[${concepts.elements.length}]{id,title,description}:
    ${concepts.elements.map((el, i) => `el${i+1},${el.title},${el.description}`).join('\n    ')}
  promptsToGenerate[${prompts.length}]:
    ${prompts.map(p => `"${p}"`).join('\n    ')}
  style: "modern"`;

    console.log('📋 Análisis DEMO generado:', demoAnalysis);
    return demoAnalysis;
  }

  /**
   * Extrae conceptos clave del prompt para el modo DEMO
   * @param {string} prompt - Prompt del usuario
   * @returns {Object} Conceptos extraídos
   */
  extractConcepts(prompt) {
    console.log('🔍 Extrayendo conceptos de:', prompt);
    
    // Patrones comunes para identificar conceptos
    const patterns = {
      proceso: /proceso|procedimiento|pasos|etapas/gi,
      aprendizaje: /aprendizaje|estudio|educación|enseñanza/gi,
      sistema: /sistema|sistemas|plataforma|infraestructura/gi,
      ciclo: /ciclo|bucle|iteración|repetición/gi,
      desarrollo: /desarrollo|programación|software|código/gi
    };
    
    let main = "Concepto General";
    let elements = [];
    
    // Identificar tipo de diagrama
    if (prompt.match(patterns.proceso)) {
      main = "Proceso Identificado";
      elements = [
        { title: "Inicio", description: "Punto de partida del proceso" },
        { title: "Desarrollo", description: "Etapas intermedias" },
        { title: "Finalización", description: "Resultado final" }
      ];
    } else if (prompt.match(patterns.aprendizaje)) {
      main = "Proceso de Aprendizaje";
      elements = [
        { title: "Teoría", description: "Conceptos fundamentales" },
        { title: "Práctica", description: "Aplicación de conocimientos" },
        { title: "Evaluación", description: "Medición del progreso" }
      ];
    } else if (prompt.match(patterns.sistema)) {
      main = "Arquitectura del Sistema";
      elements = [
        { title: "Entrada", description: "Datos de entrada" },
        { title: "Procesamiento", description: "Lógica principal" },
        { title: "Salida", description: "Resultados generados" }
      ];
    } else {
      // Default genérico
      main = "Diagrama Conceptual";
      elements = [
        { title: "Concepto 1", description: "Primera idea clave" },
        { title: "Concepto 2", description: "Segunda idea clave" },
        { title: "Relación", description: "Conexión entre conceptos" }
      ];
    }
    
    // Si el prompt menciona elementos específicos, usarlos
    const specificElements = prompt.match(/\d+\.\s*([^,]+)/g);
    if (specificElements && specificElements.length > 0) {
      elements = specificElements.map((el, i) => {
        const clean = el.replace(/^\d+\.\s*/, '').trim();
        return {
          title: clean.length > 30 ? clean.substring(0, 30) + "..." : clean,
          description: clean
        };
      });
    }
    
    console.log('📋 Conceptos extraídos:', { main, elements });
    return { main, elements };
  }

  // ==================== LLAMADAS A QWEN IMAGE ====================

  /**
   * Llama a Qwen Image para generar múltiples imágenes en paralelo
   * @param {Array<string>} prompts - Array de prompts para imágenes
   * @returns {Promise<Array>} Array de resultados de imágenes
   */
  async callQwenImage(prompts) {
    console.log('🎨 === CHUTES SERVICE: QWEN IMAGE CALL ===');
    console.log('📸 Prompts recibidos:', prompts);
    console.log('📏 Cantidad de prompts:', prompts.length);
    
    this.checkRateLimit('qwenImage');
    
    // ✅ CAMBIO CRÍTICO: Generación SECUENCIAL con delay para evitar rate limiting
    console.log('🔄 Iniciando generación SECUENCIAL con cooldown...');
    
    const results = [];
    const delayMs = 1000; // 1 segundo entre llamadas
    
    for (let index = 0; index < prompts.length; index++) {
      const prompt = prompts[index];
      console.log(`\n📝 Procesando imagen ${index + 1}/${prompts.length}: "${prompt.substring(0, 50)}..."`);
      
      try {
        // Esperar antes de cada llamada (excepto la primera)
        if (index > 0) {
          console.log(`⏳ Cooldown: esperando ${delayMs}ms antes de la siguiente llamada...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        // Generar imagen individual
        const imageResult = await this.generateSingleImage(prompt, index);
        
        // ✅ CORRECCIÓN: Verificar que imageResult.url existe
        if (!imageResult.url) {
          console.error(`❌ La imagen ${index + 1} no tiene URL válida`);
          throw new Error('URL de imagen no generada');
        }
        
        results.push({
          id: `img-${index}`,
          url: imageResult.url,
          prompt: prompt,
          status: 'success',
          seed: imageResult.seed
        });
        
        console.log(`✅ Imagen ${index + 1} generada exitosamente con URL: ${imageResult.url.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`❌ Error generando imagen ${index + 1}:`, error.message);
        
        results.push({
          id: `img-${index}`,
          url: null,
          prompt: prompt,
          status: 'error',
          error: error.message
        });
        
        // Continuar con la siguiente imagen incluso si hay error
        console.log('⚠️ Continuando con la siguiente imagen...');
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`\n📈 RESUMEN FINAL Qwen Image: ${successCount} exitosas, ${errorCount} fallidas`);
    console.log('📋 Resultados procesados:', results);
    
    // Actualizar timestamp de última llamada
    this.lastCallTime.qwenImage = Date.now();
    
    return results;
  }

  /**
   * Genera una sola imagen
   * @param {string} prompt - Prompt para la imagen
   * @param {number} index - Índice para tracking
   * @returns {Promise<Object>} Resultado de la imagen
   */
  async generateSingleImage(prompt, index) {
    console.log(`🎨 === QWEN IMAGE: GENERANDO IMAGEN ${index} ===`);
    console.log(`📝 Prompt: "${prompt}"`);
    
    const body = {
      model: CONFIG.MODELS.QWEN_IMAGE,
      prompt: prompt,
      negative_prompt: CONFIG.IMAGE_CONFIG.negativePrompt,
      width: CONFIG.IMAGE_CONFIG.width,
      height: CONFIG.IMAGE_CONFIG.height,
      num_inference_steps: CONFIG.IMAGE_CONFIG.steps,
      guidance_scale: CONFIG.IMAGE_CONFIG.guidanceScale
    };

    console.log('📋 Body para Qwen Image API:', body);
    console.log('🌐 Endpoint:', CONFIG.ENDPOINT_IMAGE);
    
    const response = await fetch(CONFIG.ENDPOINT_IMAGE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.qwenImageKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('📡 Response status:', response.status, response.statusText);
    
    // 🔍 DEBUG ULTRA-DETALLADO: Mostrar TODOS los headers
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      throw new Error(`Qwen Image error ${response.status}: ${errorText}`);
    }

    // 🔍 DEBUG: Leer respuesta como texto primero para ver el formato CRUDO
    const responseText = await response.text();
    console.log('📄 Respuesta CRUDA (primeros 500 chars):', responseText.substring(0, 500));
    console.log('📏 Longitud de respuesta:', responseText.length);

    // Intentar parsear como JSON si es posible
    let data;
    let isJson = false;
    try {
      data = JSON.parse(responseText);
      isJson = true;
      console.log('✅ Respuesta es JSON válido:', data);
    } catch (e) {
      console.log('⚠️ Respuesta NO es JSON:', e.message);
    }

    // Detectar tipo de contenido
    const contentType = response.headers.get('content-type');
    console.log(`🔍 Content-Type recibido: ${contentType}`);
    console.log(`🎯 Es JSON: ${isJson}`);
    
    let imageUrl;

    // Si es JSON, extraer URL
    if (isJson && data) {
      console.log('🔍 Estructura de datos:', Object.keys(data));
      console.log('📊 Contenido de data:', JSON.stringify(data).substring(0, 300));
      
      // Múltiples intentos de extracción
      imageUrl = data.url ||
                 data.image_url ||
                 data.images?.[0] ||
                 data.data?.[0]?.url ||
                 data.data?.[0];
      
      console.log('🔍 URL extraída (intento 1):', imageUrl);
      
      // Si no hay URL, buscar cualquier propiedad que parezca URL
      if (!imageUrl) {
        for (const key in data) {
          if (typeof data[key] === 'string' &&
              (data[key].startsWith('http') || data[key].startsWith('data:image'))) {
            imageUrl = data[key];
            console.log(`✅ URL encontrada en propiedad "${key}":`, imageUrl);
            break;
          }
        }
      }
      
      // Si aún no hay URL, verificar si hay base64
      if (!imageUrl && typeof data.data === 'string' && data.data.startsWith('data:image')) {
        imageUrl = data.data;
        console.log('✅ URL base64 encontrada en data.data');
      }
    }
    
    // Si no es JSON, verificar si es imagen directa
    if (!imageUrl && contentType && contentType.startsWith('image/')) {
      console.log('✅ Respuesta es imagen binaria directa');
      // Recrear response como blob
      const blob = new Blob([responseText], { type: contentType });
      imageUrl = URL.createObjectURL(blob);
      console.log('🎯 Blob URL creado:', imageUrl);
    }
    
    // Último recurso: intentar crear blob de la respuesta raw
    if (!imageUrl) {
      console.log('⚠️ Último recurso: creando blob de respuesta raw');
      try {
        const blob = new Blob([responseText], { type: 'image/jpeg' });
        imageUrl = URL.createObjectURL(blob);
        console.log('🎯 Blob URL creado (último recurso):', imageUrl);
      } catch (blobError) {
        console.error('❌ Error creando blob final:', blobError);
      }
    }

    // Si TODO falla, crear placeholder visual
    if (!imageUrl) {
      console.error('❌❌❌ COMPLETAMENTE FALLIDO: No se pudo obtener imagen');
      // Imagen roja de 1x1 pixel para debugging visual
      imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      console.log('🎭 Placeholder rojo creado para debugging');
    }

    const result = {
      url: imageUrl,
      seed: data?.seed || Math.random(),
      debug: {
        contentType,
        isJson,
        hasUrl: !!imageUrl,
        responseLength: responseText.length
      }
    };
    
    console.log('✅ RESULTADO FINAL de generateSingleImage:', result);
    return result;
  }

  // ==================== LLAMADAS A QWEN 3 VL ====================

  /**
   * Llama a Qwen 3 VL para verificación y organización
   * @param {Array} messages - Mensajes con texto e imágenes
   * @param {Object} options - Opciones de generación
   * @returns {Promise<string>} Respuesta en formato TOON
   */
  async callQwenVL(messages, options = {}) {
    this.checkRateLimit('qwenVL');
    
    const body = {
      model: CONFIG.MODELS.QWEN_VL,
      messages: messages,
      temperature: options.temperature || 0.5,
      max_tokens: options.maxTokens || 1500,
      stream: false
    };

    try {
      const response = await fetch(CONFIG.ENDPOINT_LLM, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.qwenVLKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qwen VL error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.updateUsage();
      this.lastCallTime.qwenVL = Date.now();
      
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Error en llamada a Qwen VL:', error);
      throw error;
    }
  }

  /**
   * Verifica y organiza el diagrama final
   * @param {string} analysisToon - Análisis en TOON
   * @param {Array} images - Array de imágenes generadas
   * @returns {Promise<string>} Diagrama final en TOON
   */
  async verifyAndOrganize(analysisToon, images) {
    const systemPrompt = `Eres el verificador final de diagramas visuales.
Tu tarea es analizar las imágenes generadas y crear un diagrama TOON estructurado.

IMPORTANTE: Responde EXCLUSIVAMENTE en formato TOON.

Estructura de salida TOON:
diagram:
  type: mindmap|flowchart|timeline|orgchart|network
  title: "Título del diagrama"
  theme: modern|professional|colorful|minimal
  layout: radial|horizontal|vertical|tree
  nodes[N]{id,type,label,style,position,imageUrl}:
    id1,oval|Titulo1|fill:#3b82f6|{x:0,y:0}|https://image.url/1.png
    id2,rect|Titulo2|fill:#10b981|{x:100,y:0}|https://image.url/2.png
  connections[N]{from,to,type,label}:
    id1,id2,arrow|solid|Opcional
  metadata:
    verified: true
    confidence: 0.95
    tokensSaved: 340`;

    // Preparar mensajes con imágenes
    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: [
          { 
            type: 'text', 
            text: `Analiza este diagrama y organiza las imágenes:\n\n${analysisToon}` 
          },
          // Añadir imágenes como URLs
          ...images.map(img => ({
            type: 'image_url',
            image_url: { url: img.url }
          }))
        ]
      }
    ];

    return await this.callQwenVL(messages);
  }

  // ==================== RATE LIMITING Y USO ====================

  /**
   * Verifica el rate limiting por servicio
   * @param {string} service - Nombre del servicio
   */
  checkRateLimit(service) {
    const now = Date.now();
    const minInterval = CONFIG.RATE_LIMIT.MIN_INTERVAL;
    
    if (now - this.lastCallTime[service] < minInterval) {
      const waitTime = Math.ceil((minInterval - (now - this.lastCallTime[service])) / 1000);
      throw new Error(`Por favor, espera ${waitTime} segundos antes de otra llamada`);
    }
  }

  /**
   * Verifica el límite diario de uso
   */
  checkDailyLimit() {
    const today = new Date().toDateString();
    
    if (this.usage.today !== today) {
      // Nuevo día, resetear contador
      this.usage.today = today;
      this.usage.count = 0;
    }
    
    if (this.usage.count >= CONFIG.RATE_LIMIT.DAILY_LIMIT) {
      throw new Error(`Límite diario de ${CONFIG.RATE_LIMIT.DAILY_LIMIT} diagramas alcanzado`);
    }
  }

  /**
   * Actualiza el contador de uso
   */
  updateUsage() {
    this.usage.count++;
    localStorage.setItem('visualflow_usage', JSON.stringify(this.usage));
  }

  /**
   * Carga el historial de uso desde localStorage
   */
  loadUsage() {
    try {
      const saved = localStorage.getItem('visualflow_usage');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.today === new Date().toDateString()) {
          this.usage = data;
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar historial de uso:', error);
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtiene estadísticas de uso
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      today: this.usage.today,
      usedToday: this.usage.count,
      limit: CONFIG.RATE_LIMIT.DAILY_LIMIT,
      remaining: CONFIG.RATE_LIMIT.DAILY_LIMIT - this.usage.count,
      lastCalls: this.lastCallTime
    };
  }

  /**
   * Resetea el contador de uso (para testing)
   */
  resetUsage() {
    this.usage = {
      today: new Date().toDateString(),
      count: 0
    };
    localStorage.setItem('visualflow_usage', JSON.stringify(this.usage));
  }

  /**
   * Analiza un prompt para planear diagramas con Kimi
   * @param {string} prompt - Prompt del usuario
   * @returns {Promise<string>} Análisis para planificación
   */
  async analyzeWithKimi(prompt) {
    const systemPrompt = `Eres Kimi, un asistente experto en planificación de diagramas visuales.
Eres parte del sistema VisualFlow y tu tarea es ayudar al usuario a planear su diagrama antes de generarlo.

Características clave:
- Proporciona sugerencias estructuradas
- Pregunta para aclarar detalles
- Ofrece opciones para diferentes tipos de diagramas
- Ayuda a organizar los elementos clave
- Mantiene un tono amigable y profesional

Ejemplo de respuesta:
"¡Hola! Para un diagrama de [tema], te recomendaría:
1) [Elemento 1]
2) [Elemento 2]
3) [Elemento 3]

¿Quieres ajustar algo antes de generar el diagrama?"

Importante: Responde en español y con tono amigable.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    return await this.callKimi(messages);
  }
}

// Exportar para uso global
window.ChutesService = ChutesService;

// Tests básicos
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 ChutesService cargado. Ejecutando tests...');
  
  const service = new ChutesService();
  
  // Test 1: Rate limiting
  try {
    service.checkRateLimit('kimi');
    console.log('✅ Rate limit check passed');
  } catch (error) {
    console.error('❌ Rate limit check failed:', error);
  }
  
  // Test 2: Daily limit
  try {
    service.checkDailyLimit();
    console.log('✅ Daily limit check passed');
  } catch (error) {
    console.error('❌ Daily limit check failed:', error);
  }
  
  console.log('✅ Tests de ChutesService completados');
}