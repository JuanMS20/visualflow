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

    const body = {
      model: CONFIG.MODELS.KIMI,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: false
    };

    try {
      const response = await fetch(CONFIG.ENDPOINT_LLM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kimi API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        console.error('Respuesta inesperada de Kimi API:', data);
        throw new Error('Respuesta inválida de Kimi API, no se encontraron "choices".');
      }

      this.updateUsage();
      this.lastCallTime.kimi = Date.now();

      return data.choices[0].message.content;

    } catch (error) {
      console.error('Error en llamada a Kimi:', error);
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

    try {
      const result = await this.callKimi(messages);

      // Validar estructura de respuesta
      if (typeof result === 'string') {
        const hasAnalysis = result.includes('analysis:');
        const hasNeedsImages = result.includes('needsImages:');
        const hasElements = result.includes('elements[');
        const hasPrompts = result.includes('promptsToGenerate[');

        // Si no tiene prompts, forzar generación
        if (hasElements && !hasPrompts) {
          return this.forceGeneratePrompts(result, prompt);
        }

        // Si no hay elementos ni prompts, usar modo demo
        if (!hasElements && !hasPrompts) {
          console.log('Fallback a modo demo: no se encontraron elementos ni prompts.');
          return this.generateDemoAnalysis(prompt);
        }
      }

      return result;
    } catch (error) {
      console.warn('Error en analyzeConcept, usando fallback a modo demo:', error.message);
      return this.generateDemoAnalysis(prompt);
    }
  }

  /**
   * Fuerza la generación de prompts si Kimi K2 no los crea
   * @param {string} toonResponse - Respuesta TOON sin prompts
   * @param {string} originalPrompt - Prompt original del usuario
   * @returns {string} TOON con prompts generados
   */
  forceGeneratePrompts(toonResponse, originalPrompt) {
    try {
      // Extraer elementos de la respuesta TOON
      const elementsMatch = toonResponse.match(/elements\[\d+\]\{[^}]+\}:\s*([\s\S]*?)(?=promptsToGenerate|style|$)/);
      if (!elementsMatch) {
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

      return fixedResponse;

    } catch (error) {
      return toonResponse;
    }
  }

  /**
   * Genera análisis DEMO cuando APIs no están disponibles
   * @param {string} prompt - Prompt del usuario
   * @returns {string} Análisis en formato TOON simulado
   */
  generateDemoAnalysis(prompt) {
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
    ${concepts.elements.map((el, i) => `el${i+1},"${el.title}","${el.description}"`).join('\n    ')}
  promptsToGenerate[${prompts.length}]:
    ${prompts.map(p => `"${p}"`).join('\n    ')}
  style: "modern"`;

    // Add a placeholder image for testing
    if (prompts.length > 0) {
      const placeholderUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const imageResults = prompts.map((prompt, i) => ({
        id: `img-${i}`,
        url: placeholderUrl,
        prompt: prompt,
        status: 'success',
        seed: 12345
      }));

      return {
        toon: demoAnalysis,
        images: imageResults
      };
    }

    return demoAnalysis;
  }

  /**
   * Extrae conceptos clave del prompt para el modo DEMO
   * @param {string} prompt - Prompt del usuario
   * @returns {Object} Conceptos extraídos
   */
  extractConcepts(prompt) {
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

    return { main, elements };
  }

  // ==================== LLAMADAS A QWEN IMAGE ====================

  /**
   * Llama a Qwen Image para generar múltiples imágenes en paralelo
   * @param {Array<string>} prompts - Array de prompts para imágenes
   * @returns {Promise<Array>} Array de resultados de imágenes
   */
  async callQwenImage(prompts) {
    this.checkRateLimit('qwenImage');

    const results = [];
    const delayMs = 1000; // 1 segundo entre llamadas

    for (let index = 0; index < prompts.length; index++) {
      const prompt = prompts[index];

      try {
        // Esperar antes de cada llamada (excepto la primera)
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Generar imagen individual
        const imageResult = await this.generateSingleImage(prompt, index);

        if (!imageResult.url) {
          throw new Error('URL de imagen no generada');
        }

        results.push({
          id: `img-${index}`,
          url: imageResult.url,
          prompt: prompt,
          status: 'success',
          seed: imageResult.seed
        });

      } catch (error) {
        results.push({
          id: `img-${index}`,
          url: null,
          prompt: prompt,
          status: 'error',
          error: error.message
        });
      }
    }

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
    const body = {
      model: CONFIG.MODELS.QWEN_IMAGE,
      prompt: prompt,
      negative_prompt: CONFIG.IMAGE_CONFIG.negativePrompt,
      width: CONFIG.IMAGE_CONFIG.width,
      height: CONFIG.IMAGE_CONFIG.height,
      num_inference_steps: CONFIG.IMAGE_CONFIG.steps,
      guidance_scale: CONFIG.IMAGE_CONFIG.guidanceScale
    };

    const response = await fetch(CONFIG.ENDPOINT_IMAGE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen Image error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let imageUrl = data.url || data.image_url || data.images?.[0] || data.data?.[0]?.url || data.data?.[0];

    if (!imageUrl) {
      // Imagen roja de 1x1 pixel para debugging visual
      imageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }

    return {
      url: imageUrl,
      seed: data?.seed || Math.random()
    };
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