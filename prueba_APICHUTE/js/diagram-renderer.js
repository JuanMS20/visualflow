/**
 * DiagramRenderer - Renderiza diagramas TOON en canvas HTML5
 * 
 * Características:
 * - Renderizado de nodos (oval, rect, diamond, circle, hexagon)
 * - Dibujo de conexiones (solid, dashed, arrow)
 * - Soporte para imágenes en nodos
 * - Interacción (zoom, pan, drag)
 * - Exportación SVG/PNG
 */

export class DiagramRenderer {
  /**
   * @param {string|HTMLCanvasElement} canvas - Canvas o selector
   * @param {Object} options - Opciones de renderizado
   */
  constructor(canvas, options = {}) {
    this.canvas = typeof canvas === 'string' 
      ? document.getElementById(canvas) 
      : canvas;
    
    if (!this.canvas) {
      throw new Error('Canvas no encontrado');
    }

    this.ctx = this.canvas.getContext('2d');
    this.options = {
      zoom: 1,
      offset: { x: 0, y: 0 },
      nodeSize: 60,
      fontSize: 14,
      lineWidth: 2,
      ...options
    };

    // Estado
    this.diagram = null;
    this.images = new Map(); // Cache de imágenes
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.selectedNode = null;
    this.hoveredNode = null;

    // Setup inicial
    this.setupCanvas();
    this.bindEvents();
  }

  /**
   * Configura el canvas para alta resolución
   */
  setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  /**
   * Bindea eventos de interacción
   */
  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
    
    window.addEventListener('resize', () => {
      this.setupCanvas();
      if (this.diagram) this.render();
    });
  }

  // ==================== RENDERIZADO PRINCIPAL ====================

  /**
   * Renderiza un diagrama desde string JSON u objeto
   * @param {string|Object} jsonInput - Diagrama en formato JSON
   */
  renderFromJson(jsonInput) {
    try {
      const { JsonService } = window;
      if (!JsonService) {
        throw new Error('JsonService no está disponible');
      }

      // Parsear si es string, usar directamente si es objeto
      this.diagram = typeof jsonInput === 'string' ? JsonService.parse(jsonInput) : jsonInput;
      this.render();
    } catch (error) {
      console.error('Error parseando JSON:', error);
      this.renderError(error.message);
    }
  }

  /**
   * Renderiza un diagrama desde string TOON (método de compatibilidad)
   * @param {string} toonString - Diagrama en formato TOON (obsoleto)
   */
  renderFromToon(toonString) {
    console.warn('⚠️ renderFromToon es obsoleto. Usar renderFromJson en su lugar.');
    // Intentar convertir TOON a JSON básico
    try {
      this.diagram = this.convertToonToBasicJson(toonString);
      this.render();
    } catch (error) {
      console.error('Error convirtiendo TOON a JSON:', error);
      this.renderError(error.message);
    }
  }

  /**
   * Convierte formato TOON básico a JSON (compatibilidad)
   * @param {string} toonString - String TOON
   * @returns {Object} Diagrama JSON básico
   */
  convertToonToBasicJson(toonString) {
    const lines = toonString.split('\n');
    const diagram = {
      diagram: {
        type: 'flowchart',
        title: 'Diagrama',
        theme: 'modern',
        layout: 'vertical',
        nodes: [],
        connections: [],
        metadata: {
          verified: true,
          hasImages: false,
          generatedAt: new Date().toISOString()
        }
      }
    };

    let currentSection = null;
    let nodeIndex = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.includes('title:')) {
        diagram.diagram.title = trimmed.split(':')[1]?.replace(/"/g, '').trim() || 'Diagrama';
      } else if (trimmed.includes('nodes[')) {
        currentSection = 'nodes';
      } else if (trimmed.includes('connections[')) {
        currentSection = 'connections';
      } else if (currentSection === 'nodes' && trimmed.includes(',')) {
        const parts = trimmed.split(',');
        if (parts.length >= 3) {
          diagram.diagram.nodes.push({
            id: parts[0] || `node-${nodeIndex}`,
            type: parts[1] || 'rect',
            label: parts[2]?.replace(/"/g, '') || '',
            style: parts[3] || 'fill:#3b82f6',
            position: { x: 0, y: nodeIndex * 120 },
            image: null,
            imageUrl: null
          });
          nodeIndex++;
        }
      } else if (currentSection === 'connections' && trimmed.includes(',')) {
        const parts = trimmed.split(',');
        if (parts.length >= 3) {
          diagram.diagram.connections.push({
            from: parts[0] || '',
            to: parts[1] || '',
            type: parts[2] || 'solid'
          });
        }
      }
    }

    return diagram;
  }

  /**
   * Renderiza el diagrama actual
   */
  render() {
    if (!this.diagram) {
      console.warn('⚠️ No hay diagrama para renderizar');
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Obtener nodos y conexiones del JSON
    const nodes = this.diagram.nodes || this.diagram.diagram?.nodes || [];
    const connections = this.diagram.connections || this.diagram.diagram?.connections || [];
    
    console.log(`🎨 Renderizando ${nodes.length} nodos y ${connections.length} conexiones`);
    
    // Dibujar conexiones primero (detrás de los nodos)
    connections.forEach(conn => this.drawConnection(conn));
    
    // Dibujar nodos
    nodes.forEach(node => this.drawNode(node));
    
    // Dibujar información de debug si está habilitado
    if (this.options.debug) {
      this.drawDebugInfo();
    }
  }

  // ==================== DIBUJO DE NODOS ====================

  /**
   * Dibuja un nodo individual
   * @param {Object} node - Datos del nodo
   */
  drawNode(node) {
    const x = (node.position?.x || 0) * this.options.zoom + this.options.offset.x;
    const y = (node.position?.y || 0) * this.options.zoom + this.options.offset.y;
    const size = this.options.nodeSize * this.options.zoom;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Dibujar forma según tipo
    const shapeType = node.type || 'rect';
    switch (shapeType) {
      case 'oval':
        this.drawOval(size, node);
        break;
      case 'rect':
        this.drawRectangle(size, node);
        break;
      case 'diamond':
        this.drawDiamond(size, node);
        break;
      case 'circle':
        this.drawCircle(size, node);
        break;
      case 'hexagon':
        this.drawHexagon(size, node);
        break;
      case 'parallelogram':
        this.drawParallelogram(size, node);
        break;
      default:
        this.drawRectangle(size, node);
    }

    // Dibujar imagen si existe
    if (node.imageUrl || node.image) {
      const imageUrl = node.imageUrl || node.image;
      this.drawImage(imageUrl, size);
    }

    // Dibujar texto
    this.drawText(node.label || node.title || '', size);

    this.ctx.restore();
  }

  /**
   * Dibuja una elipse (oval)
   */
  drawOval(size, node) {
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, size, size * 0.6, 0, 0, 2 * Math.PI);
    this.applyNodeStyle(node);
  }

  /**
   * Dibuja un rectángulo
   */
  drawRectangle(size, node) {
    const width = size * 1.5;
    const height = size * 0.8;
    this.ctx.beginPath();
    this.ctx.rect(-width/2, -height/2, width, height);
    this.applyNodeStyle(node);
  }

  /**
   * Dibuja un diamante (rombo)
   */
  drawDiamond(size, node) {
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(size, 0);
    this.ctx.lineTo(0, size);
    this.ctx.lineTo(-size, 0);
    this.ctx.closePath();
    this.applyNodeStyle(node);
  }

  /**
   * Dibuja un círculo
   */
  drawCircle(size, node) {
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size, 0, 2 * Math.PI);
    this.applyNodeStyle(node);
  }

  /**
   * Dibuja un hexágono
   */
  drawHexagon(size, node) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.applyNodeStyle(node);
  }

  /**
   * Dibuja un paralelogramo (para input/output)
   */
  drawParallelogram(size, node) {
    const width = size * 1.5;
    const height = size * 0.8;
    const skew = size * 0.3;
    
    this.ctx.beginPath();
    this.ctx.moveTo(-width/2 + skew, -height/2);
    this.ctx.lineTo(width/2 + skew, -height/2);
    this.ctx.lineTo(width/2 - skew, height/2);
    this.ctx.lineTo(-width/2 - skew, height/2);
    this.ctx.closePath();
    this.applyNodeStyle(node);
  }

  /**
   * Aplica estilo (fill y stroke) a un nodo
   */
  applyNodeStyle(node) {
    // Parsear estilo del nodo
    const style = node.style || '';
    const fillColor = this.extractColor(style, 'fill:') || '#3b82f6';
    const strokeColor = this.extractColor(style, 'stroke:') || '#2563eb';
    
    // Aplicar fill
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    
    // Aplicar stroke
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = this.options.lineWidth * this.options.zoom;
    this.ctx.stroke();
  }

  /**
   * Extrae color del estilo
   */
  extractColor(style, prefix) {
    const match = style.match(new RegExp(`${prefix}([^;\\s]+)`));
    return match ? match[1] : null;
  }

  /**
   * Dibuja imagen en el nodo
   */
  drawImage(imageUrl, size) {
    // 🔍 DEBUG ULTRA-DETALLADO
    console.log(`🖼️ DIBUJAR IMAGEN - URL recibida: ${imageUrl}`);
    console.log(`📏 Tamaño: ${size}`);
    console.log(`🎯 Tipo de URL: ${typeof imageUrl}`);
    
    if (!imageUrl) {
      console.warn('⚠️ imageUrl es null/undefined');
      this.drawImagePlaceholder(size);
      return;
    }
    
    // Verificar si la imagen ya está cacheada
    if (this.images.has(imageUrl)) {
      const img = this.images.get(imageUrl);
      console.log(`✅ Imagen encontrada en cache. Estado: complete=${img.complete}`);
      if (img.complete) {
        this.drawCachedImage(img, size);
        return;
      }
    }
    
    // Cargar nueva imagen
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // 🔍 DEBUG: Eventos de carga
    img.onload = () => {
      console.log(`✅ Imagen cargada exitosamente: ${imageUrl}`);
      console.log(`📐 Dimensiones: ${img.width}x${img.height}`);
      this.images.set(imageUrl, img);
      // Re-renderizar cuando la imagen cargue
      setTimeout(() => this.render(), 0);
    };
    
    img.onerror = (error) => {
      console.error(`❌ ERROR CRÍTICO cargando imagen: ${imageUrl}`);
      console.error('Error detalle:', error);
      
      // 🔍 DEBUG: Intentar diagnosticar el error
      if (imageUrl.startsWith('blob:')) {
        console.warn('⚠️ La URL es un blob - puede haber expirado');
      }
      if (imageUrl.startsWith('data:')) {
        console.warn('⚠️ La URL es data URI - verificando formato...');
        console.log('Primeros 100 chars:', imageUrl.substring(0, 100));
      }
      
      // Dibujar placeholder en caso de error
      this.drawImagePlaceholder(size);
    };
    
    console.log(`⏳ Iniciando carga de imagen: ${imageUrl}`);
    img.src = imageUrl;
    
    // Dibujar placeholder mientras carga
    this.drawImagePlaceholder(size);
  }

  /**
   * Dibuja imagen cacheada
   */
  drawCachedImage(img, size) {
    const imgSize = size * 0.8;
    this.ctx.drawImage(img, -imgSize/2, -imgSize/2, imgSize, imgSize);
  }

  /**
   * Dibuja placeholder mientras carga la imagen
   */
  drawImagePlaceholder(size) {
    const imgSize = size * 0.8;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(-imgSize/2, -imgSize/2, imgSize, imgSize);
    
    // Dibujar ícono de imagen
    this.ctx.fillStyle = '#6b7280';
    this.ctx.font = `${imgSize * 0.5}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🖼️', 0, 0);
  }

  /**
   * Dibuja texto del nodo
   */
  drawText(text, size) {
    this.ctx.fillStyle = '#111827';
    this.ctx.font = `${this.options.fontSize * this.options.zoom}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Posicionar texto debajo del nodo
    const textY = size + (20 * this.options.zoom);
    this.ctx.fillText(text, 0, textY);
  }

  // ==================== DIBUJO DE CONEXIONES ====================

  /**
   * Dibuja una conexión entre nodos
   */
  drawConnection(conn) {
    const nodes = this.diagram.nodes || this.diagram.diagram?.nodes || [];
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) {
      console.warn(`⚠️ Conexión inválida: ${conn.from} → ${conn.to}`);
      return;
    }
    
    const fromX = (fromNode.position?.x || 0) * this.options.zoom + this.options.offset.x;
    const fromY = (fromNode.position?.y || 0) * this.options.zoom + this.options.offset.y;
    const toX = (toNode.position?.x || 0) * this.options.zoom + this.options.offset.x;
    const toY = (toNode.position?.y || 0) * this.options.zoom + this.options.offset.y;
    
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    
    // Estilo de conexión
    const connType = conn.type || 'solid';
    this.ctx.strokeStyle = '#9ca3af';
    this.ctx.lineWidth = this.options.lineWidth * this.options.zoom;
    
    if (connType === 'dashed') {
      this.ctx.setLineDash([5 * this.options.zoom, 5 * this.options.zoom]);
    } else {
      this.ctx.setLineDash([]);
    }
    
    this.ctx.stroke();
    
    // Dibujar flecha si es necesario
    if (connType === 'arrow' || conn.label) {
      this.drawArrow(fromX, fromY, toX, toY, conn.label);
    }
  }

  /**
   * Dibuja flecha y etiqueta
   */
  drawArrow(fromX, fromY, toX, toY, label) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 10 * this.options.zoom;
    
    // Dibujar punta de flecha
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    
    // Dibujar etiqueta si existe
    if (label) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      
      this.ctx.fillStyle = '#374151';
      this.ctx.font = `${12 * this.options.zoom}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, midX, midY - 10 * this.options.zoom);
    }
  }

  // ==================== INTERACCIÓN ====================

  /**
   * Maneja mouse down
   */
  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.isDragging = true;
    this.lastMousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    this.canvas.style.cursor = 'grabbing';
  }

  /**
   * Maneja mouse move
   */
  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    if (this.isDragging) {
      // Panning
      this.options.offset.x += currentPos.x - this.lastMousePos.x;
      this.options.offset.y += currentPos.y - this.lastMousePos.y;
      this.lastMousePos = currentPos;
      this.render();
    } else {
      // Hover detection
      this.checkHover(currentPos);
    }
  }

  /**
   * Maneja mouse up
   */
  onMouseUp() {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }

  /**
   * Maneja wheel (zoom)
   */
  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom centrado en el mouse
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, this.options.zoom * zoomFactor));
    
    if (newZoom !== this.options.zoom) {
      const scaleChange = newZoom / this.options.zoom;
      this.options.offset.x = mouseX - (mouseX - this.options.offset.x) * scaleChange;
      this.options.offset.y = mouseY - (mouseY - this.options.offset.y) * scaleChange;
      this.options.zoom = newZoom;
      
      this.render();
    }
  }

  /**
   * Detecta hover sobre nodos
   */
  checkHover(mousePos) {
    if (!this.diagram) return;
    
    const nodes = this.diagram.nodes || this.diagram.diagram?.nodes || [];
    let hoveredNode = null;
    
    for (const node of nodes) {
      const x = (node.position?.x || 0) * this.options.zoom + this.options.offset.x;
      const y = (node.position?.y || 0) * this.options.zoom + this.options.offset.y;
      const size = this.options.nodeSize * this.options.zoom;
      
      const distance = Math.sqrt(
        Math.pow(mousePos.x - x, 2) + Math.pow(mousePos.y - y, 2)
      );
      
      if (distance <= size) {
        hoveredNode = node;
        break;
      }
    }
    
    if (hoveredNode !== this.hoveredNode) {
      this.hoveredNode = hoveredNode;
      this.canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
      this.render();
    }
  }

  // ==================== EXPORTACIÓN ====================

  /**
   * Exporta como PNG
   */
  exportPNG() {
    if (!this.diagram) {
      throw new Error('No hay diagrama para exportar');
    }
    
    this.canvas.toBlob(blob => {
      this.downloadFile(blob, 'diagram.png', 'image/png');
    });
  }

  /**
   * Exporta como SVG
   */
  exportSVG() {
    if (!this.diagram) {
      throw new Error('No hay diagrama para exportar');
    }
    
    const svg = this.generateSVG();
    this.downloadFile(svg, 'diagram.svg', 'image/svg+xml');
  }

  /**
   * Genera SVG del diagrama
   */
  generateSVG() {
    const nodes = this.diagram.nodes || this.diagram.diagram?.nodes || [];
    const connections = this.diagram.connections || this.diagram.diagram?.connections || [];
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">\n`;
    svg += `  <defs>\n    <style>\n      .node { fill: #3b82f6; stroke: #2563eb; stroke-width: 2 }\n      .text { font-family: sans-serif; font-size: 14px; text-anchor: middle }\n    </style>\n  </defs>\n`;
    
    // Conexiones
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (fromNode && toNode) {
        const fromX = fromNode.position?.x || 0;
        const fromY = fromNode.position?.y || 0;
        const toX = toNode.position?.x || 0;
        const toY = toNode.position?.y || 0;
        svg += `  <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="#9ca3af" stroke-width="2"/>\n`;
      }
    });
    
    // Nodos
    nodes.forEach(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      svg += `  <circle cx="${x}" cy="${y}" r="30" class="node"/>\n`;
      svg += `  <text x="${x}" y="${y + 50}" class="text">${node.label || ''}</text>\n`;
    });
    
    svg += `</svg>`;
    return svg;
  }

  /**
   * Descarga un archivo
   */
  downloadFile(content, filename, type) {
    const blob = content instanceof Blob 
      ? content 
      : new Blob([content], { type });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==================== UTILIDADES ====================

  /**
   * Resetea la vista (zoom y offset)
   */
  resetView() {
    this.options.zoom = 1;
    this.options.offset = { x: 0, y: 0 };
    this.render();
  }

  /**
   * Ajusta la vista para que todo el diagrama sea visible
   */
  fitToScreen() {
    if (!this.diagram) return;
    
    const nodes = this.diagram.nodes || this.diagram.diagram?.nodes || [];
    if (nodes.length === 0) return;
    
    // Calcular bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    
    // Calcular zoom y offset para centrar
    const padding = 50;
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = (canvasRect.width - padding * 2) / (maxX - minX);
    const scaleY = (canvasRect.height - padding * 2) / (maxY - minY);
    
    this.options.zoom = Math.min(scaleX, scaleY) * 0.9;
    this.options.offset = {
      x: canvasRect.width / 2 - (minX + maxX) / 2 * this.options.zoom,
      y: canvasRect.height / 2 - (minY + maxY) / 2 * this.options.zoom
    };
    
    this.render();
  }

  /**
   * Dibuja información de debug
   */
  drawDebugInfo() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    const nodes = this.diagram.nodes || this.diagram.diagram?.nodes || [];
    const connections = this.diagram.connections || this.diagram.diagram?.connections || [];
    
    const info = [
      `Zoom: ${this.options.zoom.toFixed(2)}x`,
      `Offset: (${this.options.offset.x.toFixed(0)}, ${this.options.offset.y.toFixed(0)})`,
      `Nodes: ${nodes.length}`,
      `Connections: ${connections.length}`
    ];
    
    info.forEach((line, i) => {
      this.ctx.fillText(line, 10, 10 + i * 20);
    });
    
    this.ctx.restore();
  }

  /**
   * Renderiza un mensaje de error
   */
  renderError(message) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Error al renderizar diagrama', this.canvas.width / 4, this.canvas.height / 4);
    
    this.ctx.fillStyle = '#6b7280';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText(message, this.canvas.width / 4, this.canvas.height / 4 + 30);
    this.ctx.restore();
  }

  /**
   * Limpia el canvas completamente
   */
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.diagram = null;
    this.images.clear();
  }
}

// Exportar para uso global
window.DiagramRenderer = DiagramRenderer;

// Tests básicos
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 DiagramRenderer cargado. Ejecutando tests...');
  
  // Test 1: Crear instancia
  try {
    const canvas = document.createElement('canvas');
    const renderer = new DiagramRenderer(canvas);
    console.assert(renderer instanceof DiagramRenderer, 'Test instancia falló');
  } catch (error) {
    console.error('❌ Test instancia falló:', error);
  }
  
  console.log('✅ Tests de DiagramRenderer completados');
}