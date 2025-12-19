/**
 * CHATBOT AVELINO - Sistema de Gestión IESTP "AACD"
 * Asistente virtual para ayudar a los usuarios del sistema
 */

class Avelino {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatbotUI();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }

    createChatbotUI() {
        const chatbotHTML = `
            <div class="chatbot-container">
                <button class="chatbot-toggle" id="chatbotToggle">
                    <span class="chatbot-toggle-icon">💬</span>
                    <span class="chatbot-badge" id="chatbotBadge" style="display: none;">1</span>
                </button>
                
                <div class="chatbot-window" id="chatbotWindow">
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <div class="chatbot-avatar">🤖</div>
                            <div class="chatbot-title">
                                <h3>Avelino</h3>
                                <div class="chatbot-status">
                                    <span class="status-dot"></span>
                                    <span>En línea</span>
                                </div>
                            </div>
                        </div>
                        <button class="chatbot-close" id="chatbotClose">×</button>
                    </div>
                    
                    <div class="chatbot-body" id="chatbotBody">
                        <div class="chatbot-messages" id="chatbotMessages"></div>
                        <div class="typing-indicator" id="typingIndicator">
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                        </div>
                    </div>
                    
                    <div class="chatbot-footer">
                        <div class="chatbot-input-container">
                            <input 
                                type="text" 
                                class="chatbot-input" 
                                id="chatbotInput" 
                                placeholder="Escribe tu mensaje..." 
                                autocomplete="off"
                            >
                            <button class="chatbot-send" id="chatbotSend">
                                <span>➤</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const send = document.getElementById('chatbotSend');
        const input = document.getElementById('chatbotInput');

        toggle.addEventListener('click', () => this.toggleChatbot());
        close.addEventListener('click', () => this.toggleChatbot());
        send.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChatbot() {
        const window = document.getElementById('chatbotWindow');
        const badge = document.getElementById('chatbotBadge');

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            window.classList.add('active');
            badge.style.display = 'none';
            this.scrollToBottom();
        } else {
            window.classList.remove('active');
        }
    }

    addWelcomeMessage() {
        const welcomeMsg = `¡Hola! 👋 Soy Avelino, tu asistente virtual del Sistema de Gestión de Investigación del IESTP "AACD". 

¿En qué puedo ayudarte hoy?`;

        this.addMessage(welcomeMsg, 'bot');
        this.showQuickReplies();
    }

    showQuickReplies() {
        const quickReplies = [
            '¿Cómo crear un proyecto?',
            '¿Cómo evaluar?',
            'Roles del sistema',
            'Ayuda general'
        ];

        const messagesContainer = document.getElementById('chatbotMessages');
        const repliesHTML = `
            <div class="quick-replies">
                ${quickReplies.map(reply =>
            `<button class="quick-reply-btn" onclick="avelino.handleQuickReply('${reply}')">${reply}</button>`
        ).join('')}
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', repliesHTML);
        this.scrollToBottom();
    }

    handleQuickReply(reply) {
        // Enviar como mensaje del usuario
        this.addMessage(reply, 'user');

        // Remover botones de respuesta rápida
        const quickReplies = document.querySelector('.quick-replies');
        if (quickReplies) {
            quickReplies.remove();
        }

        // Responder
        this.respondToMessage(reply);
    }

    sendMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();

        if (message === '') return;

        this.addMessage(message, 'user');
        input.value = '';

        // Simular escritura del bot
        this.showTypingIndicator();
        setTimeout(() => {
            this.hideTypingIndicator();
            this.respondToMessage(message);
        }, 1000);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        const messageHTML = `
            <div class="chatbot-message ${sender}">
                <div class="message-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
                <div class="message-bubble">
                    ${text.replace(/\n/g, '<br>')}
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        this.scrollToBottom();
    }

    respondToMessage(message) {
        const lowerMessage = message.toLowerCase();
        let response = '';

        // Respuestas basadas en palabras clave
        if (lowerMessage.includes('proyecto') || lowerMessage.includes('crear')) {
            response = `Para crear un nuevo proyecto de investigación:

1. Inicia sesión como Investigador
2. Ve al Dashboard 
3. Haz clic en "Crear Nuevo Proyecto"
4. Completa el formulario con:
   - Título del proyecto
   - Categoría (Tecnológico, Social, Ambiental, etc.)
   - Descripción y objetivos
   - Metodología
5. Haz clic en "Guardar Proyecto"

Tu proyecto será enviado para evaluación. ¿Necesitas más ayuda? 😊`;
        }
        else if (lowerMessage.includes('evaluar') || lowerMessage.includes('evaluación')) {
            response = `Para evaluar proyectos:

1. Inicia sesión como Evaluador
2. Ve a "Proyectos Pendientes"
3. Selecciona un proyecto
4. Revisa toda la información
5. Completa los criterios de evaluación:
   - Originalidad
   - Viabilidad  
   - Metodología
   - Impacto
6. Añade comentarios y observaciones
7. Asigna calificación final
8. Haz clic en "Enviar Evaluación"

¿Tienes alguna duda específica? 🎯`;
        }
        else if (lowerMessage.includes('roles') || lowerMessage.includes('rol')) {
            response = `El sistema tiene 3 roles principales:

👨‍💼 **Administrador**
- Gestionar usuarios
- Ver reportes generales
- Gestionar fechas límite
- Supervisar todo el sistema

🔬 **Investigador**
- Crear proyectos de investigación
- Editar proyectos en borrador
- Ver evaluaciones recibidas
- Subir documentos

👨‍🏫 **Evaluador**
- Revisar proyectos asignados
- Evaluar con criterios establecidos
- Aprobar o rechazar proyectos
- Dar retroalimentación

¿Sobre qué rol quieres saber más? 📋`;
        }
        else if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
            response = `Puedo ayudarte con:

📚 Información sobre el sistema
🔐 Cómo usar cada módulo
👥 Explicación de roles
📊 Gestión de proyectos
✅ Proceso de evaluación
⚙️ Configuración de cuenta

Solo escribe tu pregunta y te ayudaré lo mejor que pueda. También puedes usar el menú de ayuda en cada sección del sistema. 

¿Qué necesitas saber? 💡`;
        }
        else if (lowerMessage.includes('contraseña') || lowerMessage.includes('password')) {
            response = `Para recuperar tu contraseña:

1. Ve a la página de inicio de sesión
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa tu correo institucional
4. Recibirás un enlace de recuperación
5. Sigue las instrucciones del correo

Si no recibes el correo, contacta al administrador del sistema. 🔑`;
        }
        else if (lowerMessage.includes('gracias') || lowerMessage.includes('thank')) {
            response = `¡De nada! 😊 Estoy aquí para ayudarte cuando lo necesites. 

¿Hay algo más en lo que pueda asistirte?`;
        }
        else if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
            response = `¡Hola! 👋 ¿Cómo estás? 

Estoy aquí para ayudarte con cualquier duda sobre el Sistema de Gestión de Investigación. ¿Qué necesitas saber?`;
        }
        else {
            response = `Entiendo que preguntas sobre "${message}". 

Puedo ayudarte con:
• Crear proyectos de investigación
• Proceso de evaluación
• Roles del sistema
• Funcionalidades generales

¿Podrías reformular tu pregunta o elegir uno de estos temas? 🤔`;
        }

        this.addMessage(response, 'bot');
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('active');
    }

    scrollToBottom() {
        const body = document.getElementById('chatbotBody');
        setTimeout(() => {
            body.scrollTop = body.scrollHeight;
        }, 100);
    }
}

// Inicializar Avelino cuando el DOM esté listo
let avelino;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        avelino = new Avelino();
    });
} else {
    avelino = new Avelino();
}
