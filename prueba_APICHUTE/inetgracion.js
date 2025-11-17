// JavaScript para llamar a la API de Chutes
// Adaptado para interfaz web interactiva con soporte de imágenes

class ChutesAPI {
    constructor() {
        
       
        this.API_KEY = "cpk_7d264dc3847b467ea59f4da1d1d050a3.980bfcccb81f51a3ab901cf5c53fc6e0.S6Mp1WEGMU6rThOvkgw4Lih43ndh5M2O";
        this.API_URL = "https://llm.chutes.ai/v1/chat/completions";
        
        // Estado de la aplicación
        this.isLoading = false;
        this.conversationHistory = this.loadHistory();
        this.currentImage = null;
        
        // Inicializar DOM y eventos
        this.initDOM();
        this.bindEvents();
        this.updateHistoryDisplay();
    }

    initDOM() {
        // Elementos del DOM
        this.elements = {
            form: document.getElementById('apiForm'),
            promptInput: document.getElementById('promptInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            responseContainer: document.getElementById('responseContainer'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            charCount: document.getElementById('charCount'),
            statusIndicator: document.getElementById('statusIndicator'),
            historyContainer: document.getElementById('historyContainer'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            btnText: document.querySelector('.btn-text'),
            btnLoading: document.querySelector('.btn-loading'),
            // Nuevos elementos para imágenes
            imageInput: document.getElementById('imageInput'),
            imageDropZone: document.getElementById('imageDropZone'),
            imagePreview: document.getElementById('imagePreview'),
            previewImg: document.getElementById('previewImg'),
            imageName: document.getElementById('imageName'),
            removeImageBtn: document.getElementById('removeImageBtn')
        };
    }

    bindEvents() {
        // Evento de envío del formulario
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Evento de limpiar formulario
        this.elements.clearBtn.addEventListener('click', () => {
            this.clearForm();
        });

        // Evento de contador de caracteres
        this.elements.promptInput.addEventListener('input', () => {
            this.updateCharCounter();
        });

        // Evento de limpiar historial
        this.elements.clearHistoryBtn.addEventListener('click', () => {
            this.clearHistory();
        });

        // Evento de teclado (Ctrl+Enter para enviar)
        this.elements.promptInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // Eventos para manejo de imágenes
        this.elements.imageDropZone.addEventListener('click', () => {
            this.elements.imageInput.click();
        });

        this.elements.imageInput.addEventListener('change', (e) => {
            this.handleImageSelect(e.target.files[0]);
        });

        this.elements.removeImageBtn.addEventListener('click', () => {
            this.removeImage();
        });

        // Eventos de drag and drop
        this.elements.imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.imageDropZone.classList.add('dragover');
        });

        this.elements.imageDropZone.addEventListener('dragleave', () => {
            this.elements.imageDropZone.classList.remove('dragover');
        });

        this.elements.imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.imageDropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageSelect(files[0]);
            }
        });

        // Prevenir comportamiento por defecto del drag and drop en toda la página
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    async handleSubmit() {
        const prompt = this.elements.promptInput.value.trim();
        
        // Validación
        if (!prompt) {
            this.showError('Por favor, escribe una pregunta o prompt.');
            return;
        }

        if (this.isLoading) {
            return;
        }

        // Ejecutar llamada a la API
        await this.callAPI(prompt);
    }

    async callAPI(promptUsuario) {
        // Construir el contenido del mensaje (texto + imagen si existe)
        let messageContent = [];
        
        // Agregar texto
        messageContent.push({
            type: "text",
            text: promptUsuario
        });
        
        // Agregar imagen si existe
        if (this.currentImage) {
            messageContent.push({
                type: "image_url",
                image_url: {
                    url: `data:${this.currentImage.mimeType};base64,${this.currentImage.base64}`
                }
            });
        }

        // Configuración de la solicitud
        const bodyData = {
            "model": "Qwen/Qwen3-VL-235B-A22B-Instruct",
            "messages": [
                {
                    "role": "user",
                    "content": messageContent
                }
            ],
            "stream": false,
            "max_tokens": 1500,
            "temperature": 0.7
        };

        try {
            // Mostrar estado de carga
            this.setLoadingState(true);
            this.hideError();

            // Realizar la llamada a la API
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                // Manejar errores HTTP
                const errorText = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${errorText}`);
            }

            // Procesar respuesta exitosa
            const data = await response.json();
            const respuesta = data.choices[0].message.content;

            // Mostrar respuesta
            this.displayResponse(respuesta);
            
            // Guardar en historial
            this.addToHistory(promptUsuario, respuesta);
            
            // Actualizar estado
            this.setSuccessState();

        } catch (error) {
            console.error("Falló la llamada a la API:", error);
            this.showError(`Error al comunicarse con la API: ${error.message}`);
            this.setErrorState();
        } finally {
            // Restaurar estado normal
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            // Estado de carga
            this.elements.sendBtn.disabled = true;
            this.elements.sendBtn.classList.add('loading');
            this.elements.btnText.style.display = 'none';
            this.elements.btnLoading.style.display = 'inline';
            this.elements.promptInput.disabled = true;
            this.elements.responseContainer.innerHTML = '🤔 Pensando...';
            this.elements.responseContainer.classList.add('loading');
            this.elements.statusIndicator.className = 'status-indicator loading';
        } else {
            // Estado normal
            this.elements.sendBtn.disabled = false;
            this.elements.sendBtn.classList.remove('loading');
            this.elements.btnText.style.display = 'inline';
            this.elements.btnLoading.style.display = 'none';
            this.elements.promptInput.disabled = false;
            this.elements.responseContainer.classList.remove('loading');
        }
    }

    setSuccessState() {
        this.elements.statusIndicator.className = 'status-indicator success';
        setTimeout(() => {
            this.elements.statusIndicator.className = 'status-indicator';
        }, 3000);
    }

    setErrorState() {
        this.elements.statusIndicator.className = 'status-indicator error';
        setTimeout(() => {
            this.elements.statusIndicator.className = 'status-indicator';
        }, 3000);
    }

    displayResponse(response) {
        this.elements.responseContainer.innerHTML = '';
        this.elements.responseContainer.classList.remove('loading');
        
        // Crear elemento de respuesta con animación
        const responseElement = document.createElement('div');
        responseElement.className = 'fade-in';
        responseElement.textContent = response;
        
        this.elements.responseContainer.appendChild(responseElement);
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.errorMessage.classList.add('fade-in');
    }

    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }


    updateCharCounter() {
        const currentLength = this.elements.promptInput.value.length;
        this.elements.charCount.textContent = currentLength;
        
        // Cambiar color si se acerca al límite
        if (currentLength > 900) {
            this.elements.charCount.style.color = 'var(--error-color)';
        } else if (currentLength > 700) {
            this.elements.charCount.style.color = 'var(--warning-color)';
        } else {
            this.elements.charCount.style.color = 'var(--text-secondary)';
        }
    }

    // Métodos para manejar el historial
    loadHistory() {
        const saved = localStorage.getItem('chutes_conversation_history');
        return saved ? JSON.parse(saved) : [];
    }

    saveHistory() {
        localStorage.setItem('chutes_conversation_history', JSON.stringify(this.conversationHistory));
    }

    addToHistory(question, answer) {
        const historyItem = {
            id: Date.now(),
            question: question,
            answer: answer,
            timestamp: new Date().toISOString(),
            hasImage: !!this.currentImage,
            imageName: this.currentImage ? this.currentImage.name : null
        };
        
        this.conversationHistory.unshift(historyItem);
        
        // Mantener solo los últimos 20 elementos
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(0, 20);
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.conversationHistory.length === 0) {
            this.elements.historyContainer.innerHTML = `
                <div class="empty-state">
                    <p>📝 No hay conversaciones anteriores</p>
                </div>
            `;
            return;
        }

        const historyHTML = this.conversationHistory.map(item => `
            <div class="history-item slide-in ${item.hasImage ? 'has-image' : ''}">
                <div class="history-question">
                    ❓ ${this.escapeHtml(item.question)}
                    ${item.hasImage ? '<span class="history-image-indicator">📷</span>' : ''}
                </div>
                <div class="history-answer">💬 ${this.escapeHtml(item.answer)}</div>
                <div class="history-timestamp">${this.formatTimestamp(item.timestamp)}</div>
            </div>
        `).join('');

        this.elements.historyContainer.innerHTML = historyHTML;
    }

    clearHistory() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el historial de conversaciones?')) {
            this.conversationHistory = [];
            this.saveHistory();
            this.updateHistoryDisplay();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
        
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Métodos para manejo de imágenes
    async handleImageSelect(file) {
        if (!file) return;

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            this.showError('Por favor, selecciona un archivo de imagen válido.');
            return;
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showError('La imagen es demasiado grande. El tamaño máximo es 10MB.');
            return;
        }

        try {
            // Mostrar estado de carga
            this.showImageLoadingState();

            // Convertir imagen a base64
            const base64 = await this.fileToBase64(file);
            
            // Guardar información de la imagen
            this.currentImage = {
                name: file.name,
                size: file.size,
                mimeType: file.type,
                base64: base64
            };

            // Mostrar vista previa
            this.showImagePreview(file.name, base64);

        } catch (error) {
            console.error('Error al procesar la imagen:', error);
            this.showError('Error al procesar la imagen. Intenta con otra.');
            this.removeImage();
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Eliminar el prefijo "data:image/...;base64," para obtener solo el base64
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showImageLoadingState() {
        this.elements.imageDropZone.style.display = 'none';
        this.elements.imagePreview.style.display = 'flex';
        this.elements.imagePreview.classList.add('loading');
        this.elements.previewImg.src = '';
        this.elements.imageName.textContent = 'Procesando imagen...';
    }

    showImagePreview(fileName, base64) {
        this.elements.imagePreview.classList.remove('loading');
        this.elements.previewImg.src = `data:${this.currentImage.mimeType};base64,${base64}`;
        this.elements.imageName.textContent = fileName;
    }

    removeImage() {
        this.currentImage = null;
        this.elements.imageInput.value = '';
        this.elements.imageDropZone.style.display = 'flex';
        this.elements.imagePreview.style.display = 'none';
        
        // Limpiar cualquier error de imagen
        const imageError = document.querySelector('.image-upload-error');
        if (imageError) {
            imageError.remove();
        }
    }

    clearForm() {
        this.elements.promptInput.value = '';
        this.removeImage(); // También eliminar la imagen
        this.elements.responseContainer.innerHTML = `
            <div class="empty-state">
                <p>🤔 Esperando tu pregunta...</p>
                <p>Escribe algo arriba y presiona "Enviar a la IA"</p>
            </div>
        `;
        this.hideError();
        this.updateCharCounter();
        this.elements.promptInput.focus();
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia de la API
    window.chutesAPI = new ChutesAPI();
    
    // Mostrar advertencia de seguridad en la consola
    console.warn(
        '%c⚠️ ADVERTENCIA DE SEGURIDAD ⚠️',
        'color: #f59e0b; font-size: 16px; font-weight: bold;'
    );
    console.warn(
        'Esta aplicación contiene una clave API expuesta en el código JavaScript.' +
        '\nNO la uses en producción ni la compartas públicamente.' +
        '\nPara producción, implementa un backend que maneje las llamadas a la API.'
    );
    
    // Enfocar el input de entrada
    document.getElementById('promptInput').focus();
});

// Función de ejemplo para pruebas rápidas (puedes llamarla desde la consola)
async function pruebaRapida() {
    const preguntas = [
        "Hola, ¿cuál es la capital de Colombia?",
        "¿Qué es la inteligencia artificial?",
        "Explícame el concepto de machine learning"
    ];
    
    const preguntaAleatoria = preguntas[Math.floor(Math.random() * preguntas.length)];
    document.getElementById('promptInput').value = preguntaAleatoria;
    window.chutesAPI.updateCharCounter();
    
    // Esperar un momento y enviar
    setTimeout(() => {
        window.chutesAPI.handleSubmit();
    }, 500);
}

// Hacer la función disponible globalmente para pruebas
window.pruebaRapida = pruebaRapida;