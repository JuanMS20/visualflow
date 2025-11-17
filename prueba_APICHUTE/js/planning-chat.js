export class PlanningChat {
  constructor() {
    this.modal = null;
    this.messageContainer = null;
    this.input = null;
    this.sendButton = null;
    this.acceptButton = null;
    this.messages = [];
    this.pipeline = null;
    
    this.init();
  }
  
  init() {
    this.createModal();
    this.bindEvents();
  }
  
  createModal() {
    if (!document.getElementById('planningChatModal')) {
      const modalHTML = `
        <div id="planningChatModal" class="progress-modal hidden">
          <div class="progress-content" style="max-width: 600px;">
            <div class="progress-header">
              <h2 class="progress-title">Planear Diagrama</h2>
              <p class="progress-subtitle">Pregunta a Kimi para ayudarte a planear tu diagrama</p>
            </div>
            
            <div class="chat-container" style="height: 300px; overflow-y: auto; margin-bottom: 1rem;">
              <div id="chatMessages" class="chat-messages"></div>
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
              <input 
                type="text" 
                id="chatInput" 
                class="text-input" 
                style="flex: 1; margin-bottom: 0;"
                placeholder="Pregúntale a Kimi cómo planear tu diagrama..."
              >
              <button id="sendChatMessage" class="generate-button visual" style="white-space: nowrap;">
                Enviar
              </button>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
              <button id="cancelPlanning" class="action-button">
                Cancelar
              </button>
              <button id="acceptPlan" class="generate-button visual" style="display: none;">
                Aceptar Plan
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    this.modal = document.getElementById('planningChatModal');
    this.messageContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendChatMessage');
    this.acceptButton = document.getElementById('acceptPlan');
    this.cancelButton = document.getElementById('cancelPlanning');
    
    // Inicializar con mensaje de bienvenida
    this.addMessage('assistant', '¡Hola! Soy Kimi, tu asistente para planear diagramas. ¿En qué puedo ayudarte a planear tu diagrama?');
  }
  
  bindEvents() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
    
    this.cancelButton.addEventListener('click', () => {
      this.hide();
      // Mostrar el modal de progreso original
      if (window.visualFlowApp && window.visualFlowApp.progressModal) {
        window.visualFlowApp.progressModal.show();
      }
    });
    
    this.acceptButton.addEventListener('click', () => {
      this.hide();
      // Continuar con la generación del diagrama
      if (window.visualFlowApp) {
        window.visualFlowApp.generateDiagram();
      }
    });
  }
  
  addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    messageDiv.innerHTML = `
      <div class="message-content">${content}</div>
    `;
    
    this.messageContainer.appendChild(messageDiv);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    
    // Guardar en historial
    this.messages.push({ role, content });
  }
  
  async sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;
    
    // Mostrar mensaje del usuario
    this.addMessage('user', message);
    this.input.value = '';
    
    // Mostrar "Escribiendo..."
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message assistant';
    typingIndicator.innerHTML = `
      <div class="message-content" id="typingIndicator">Escribiendo...</div>
    `;
    this.messageContainer.appendChild(typingIndicator);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    
    try {
      // Obtener referencia al servicio
      const chutesService = window.visualFlowApp?.pipeline?.chutes;
      
      if (!chutesService) {
        throw new Error('Servicio Chutes no disponible');
      }
      
      // Llamar a Kimi para obtener respuesta
      const response = await chutesService.analyzeWithKimi(message);
      
      // Eliminar "Escribiendo..."
      typingIndicator.remove();
      
      // Mostrar respuesta
      this.addMessage('assistant', response);
      
      // Mostrar botón de aceptar plan
      this.acceptButton.style.display = 'block';
    } catch (error) {
      typingIndicator.remove();
      this.addMessage('assistant', `Error: ${error.message}`);
    }
  }
  
  show() {
    if (!this.modal) {
      console.error('Modal de planificación no encontrado');
      return;
    }
    
    this.modal.classList.remove('hidden');
    this.modal.style.display = 'flex';
    this.modal.style.visibility = 'visible';
    this.modal.style.opacity = '1';
    this.modal.style.zIndex = '1000';
    
    console.log('📊 PlanningChat mostrado');
  }
  
  hide() {
    if (!this.modal) return;
    
    this.modal.classList.add('hidden');
    console.log('📊 PlanningChat ocultado');
  }
}

// Exportar para uso global
window.PlanningChat = PlanningChat;