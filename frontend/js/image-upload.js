/**
 * ImageUploadManager - Gestión de carga de imágenes por drag & drop
 * Integración con VisualFlow TOON
 * 
 * @description Maneja carga de imágenes mediante:
 * - Drag & drop desde el escritorio
 * - Selección manual de archivos
 * - Preview de imágenes antes de añadir al diagrama
 * - Conversión a formato de nodos de VisualFlow
 */

export class ImageUploadManager {
  constructor() {
    this.uploadedImages = [];
    this.dropZone = null;
    this.fileInput = null;
    this.previewContainer = null;
    this.onImagesLoaded = null; // Callback para cuando se cargan imágenes
    
    this.init();
  }

  /**
   * Inicializa el manager y busca elementos DOM
   */
  init() {
    this.setupElements();
    this.setupEventListeners();
    console.log('✅ ImageUploadManager inicializado');
  }

  /**
   * Configura referencias a elementos DOM
   */
  setupElements() {
    this.dropZone = document.getElementById('dropZone');
    this.fileInput = document.getElementById('fileInput');
    this.previewContainer = document.getElementById('previewContainer');
    
    if (!this.dropZone || !this.fileInput) {
      console.warn('⚠️ Elementos de carga de imágenes no encontrados');
      return;
    }
  }

  /**
   * Configura todos los event listeners
   */
  setupEventListeners() {
    if (!this.dropZone) return;

    // Prevenir comportamientos por defecto en todo el documento
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.preventDefaults.bind(this), false);
      document.body.addEventListener(eventName, this.preventDefaults.bind(this), false);
    });

    // Eventos de drag & drop
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this), false);
    this.dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this), false);
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this), false);

    // Click para abrir selector de archivos
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Botón de selección (evitar bubbling)
    const selectBtn = document.getElementById('selectFiles');
    if (selectBtn) {
      selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fileInput.click();
      });
    }
  }

  /**
   * Previene comportamientos por defecto del navegador
   */
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Maneja el evento dragenter
   */
  handleDragEnter(e) {
    this.dropZone.classList.add('drag-over');
  }

  /**
   * Maneja el evento dragleave
   */
  handleDragLeave(e) {
    // Solo remover si realmente sale del dropZone (no de un hijo)
    if (!this.dropZone.contains(e.relatedTarget)) {
      this.dropZone.classList.remove('drag-over');
    }
  }

  /**
   * Maneja el evento dragover
   */
  handleDragOver(e) {
    this.dropZone.classList.add('drag-over');
  }

  /**
   * Maneja el evento drop (archivos dropeados)
   */
  handleDrop(e) {
    this.dropZone.classList.remove('drag-over');
    const dt = e.dataTransfer;
    const files = dt.files;
    
    console.log(`📁 ${files.length} archivos dropeados`);
    this.processFiles(files);
  }

  /**
   * Maneja la selección manual de archivos
   */
  handleFileSelect(e) {
    const files = e.target.files;
    console.log(`📁 ${files.length} archivos seleccionados`);
    this.processFiles(files);
    
    // Limpiar input para permitir seleccionar los mismos archivos de nuevo
    this.fileInput.value = '';
  }

  /**
   * Procesa lista de archivos y filtra solo imágenes
   */
  async processFiles(fileList) {
    const imageFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      alert('⚠️ Por favor, selecciona solo archivos de imagen (JPG, PNG, GIF, etc.)');
      return;
    }

    console.log(`🖼️ Procesando ${imageFiles.length} imágenes...`);

    for (const file of imageFiles) {
      try {
        const imageData = await this.readFile(file);
        this.uploadedImages.push(imageData);
        this.createPreview(imageData);
      } catch (error) {
        console.error(`❌ Error procesando ${file.name}:`, error);
      }
    }

    // Mostrar botón de añadir al diagrama si hay imágenes
    this.toggleAddButton();

    // Notificar al callback si existe
    if (this.onImagesLoaded) {
      this.onImagesLoaded(this.uploadedImages);
    }

    console.log(`✅ ${this.uploadedImages.length} imágenes cargadas exitosamente`);
  }

  /**
   * Lee un archivo y lo convierte a Data URL
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve({
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result, // Data URL para preview
          file: file // Archivo original para subir a servidor si es necesario
        });
      };
      
      reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Crea un elemento de preview para una imagen
   */
  createPreview(imageData) {
    if (!this.previewContainer) return;

    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.dataset.imageId = imageData.id;

    const img = document.createElement('img');
    img.src = imageData.url;
    img.alt = imageData.name;
    img.title = imageData.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Eliminar imagen';
    removeBtn.onclick = () => this.removeImage(imageData.id);

    previewItem.appendChild(img);
    previewItem.appendChild(removeBtn);
    this.previewContainer.appendChild(previewItem);
  }

  /**
   * Elimina una imagen del cargador
   */
  removeImage(imageId) {
    // Remover de array
    this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);
    
    // Remover del DOM
    const previewItem = this.previewContainer.querySelector(`[data-image-id="${imageId}"]`);
    if (previewItem) {
      previewItem.remove();
    }

    // Actualizar visibilidad del botón
    this.toggleAddButton();

    console.log(`🗑️ Imagen ${imageId} eliminada`);
  }

  /**
   * Muestra/oculta el botón de añadir al diagrama
   */
  toggleAddButton() {
    const addButton = document.getElementById('addToDiagram');
    if (addButton) {
      addButton.style.display = this.uploadedImages.length > 0 ? 'block' : 'none';
    }
  }

  /**
   * Obtiene todas las imágenes cargadas
   */
  getImages() {
    return this.uploadedImages;
  }

  /**
   * Limpia todas las imágenes cargadas
   */
  clear() {
    this.uploadedImages = [];
    if (this.previewContainer) {
      this.previewContainer.innerHTML = '';
    }
    this.toggleAddButton();
    console.log('🧹 Todas las imágenes limpiadas');
  }

  /**
   * Convierte imágenes cargadas al formato de nodos de VisualFlow
   */
  convertToNodes() {
    return this.uploadedImages.map((img, index) => ({
      id: img.id,
      type: 'image',
      label: img.name.length > 20 ? img.name.substring(0, 20) + '...' : img.name,
      style: {
        fill: '#3b82f6',
        imageUrl: img.url
      },
      position: {
        x: 100 + (index % 4) * 180,
        y: 100 + Math.floor(index / 4) * 180
      }
    }));
  }

  /**
   * Añade imágenes cargadas directamente al diagrama actual
   */
  addToDiagram(diagram) {
    if (!diagram || !diagram.nodes) {
      console.error('❌ Diagrama no válido');
      return;
    }

    const newNodes = this.convertToNodes();
    diagram.nodes.push(...newNodes);
    
    console.log(`➕ ${newNodes.length} imágenes añadidas al diagrama`);
    this.clear();
    
    return diagram;
  }
}

// Exportar para uso global
window.ImageUploadManager = ImageUploadManager;

// Auto-inicializar si los elementos existen
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dropZone')) {
      window.imageUploader = new ImageUploadManager();
      console.log('🚀 ImageUploadManager auto-inicializado');
    }
  });
}