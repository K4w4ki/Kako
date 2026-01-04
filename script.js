// script.js - Arquivo principal do Kako Chat
// URL da API no Vercel
const API_URL = "https://seu-projeto.vercel.app/api/chat";

// Session ID
let sessionId = localStorage.getItem("kako_sessionId");
if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("kako_sessionId", sessionId);
}

// Estado da aplicação
const appState = {
    userName: localStorage.getItem("kako_userName") || "",
    userAvatar: localStorage.getItem("kako_userAvatar") || "",
    chatHistory: JSON.parse(localStorage.getItem("kako_chatHistory")) || [],
    currentImage: null,
    isProcessing: false,
    isTyping: false,
    savedChats: JSON.parse(localStorage.getItem("kako_savedChats")) || []
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkUserProfile();
});

// Verifica se usuário já configurou perfil
function checkUserProfile() {
    const hasProfile = localStorage.getItem("kako_hasProfile");
    
    if (!hasProfile) {
        showSetupModal();
    } else {
        loadUserProfile();
        initializeChatInterface();
    }
}

// Mostra modal de configuração inicial
function showSetupModal() {
    const modalHTML = `
        <div id="setupModal" class="setup-modal">
            <div class="setup-content">
                <div class="setup-header">
                    <div class="logo">
                        <div class="logo-icon">🤖</div>
                        <h1>Kako</h1>
                    </div>
                    <p>Seu assistente IA inteligente e brincalhão</p>
                </div>
                
                <div class="setup-body">
                    <div class="form-group">
                        <label for="userName"><i class="fas fa-user"></i> Seu nome</label>
                        <input type="text" id="userName" placeholder="Como quer ser chamado?" maxlength="30">
                    </div>
                    
                    <div class="form-group">
                        <label for="avatarUpload"><i class="fas fa-camera"></i> Foto de perfil (opcional)</label>
                        <div class="avatar-upload-area" id="avatarUploadArea">
                            <div class="avatar-preview" id="avatarPreview">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="upload-actions">
                                <button id="chooseAvatarBtn" class="btn-secondary">
                                    <i class="fas fa-folder-open"></i> Escolher foto
                                </button>
                                <p class="upload-hint">Arraste uma imagem ou clique para selecionar</p>
                            </div>
                            <input type="file" id="avatarUpload" accept="image/*" hidden>
                        </div>
                    </div>
                </div>
                
                <div class="setup-footer">
                    <button id="skipPhotoBtn" class="btn-secondary">
                        <i class="fas fa-forward"></i> Pular foto
                    </button>
                    <button id="startChatBtn" class="btn-primary">
                        <i class="fas fa-comment"></i> Começar a conversar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.innerHTML = modalHTML;
    
    // Event listeners do modal
    const chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarUploadArea = document.getElementById('avatarUploadArea');
    const skipPhotoBtn = document.getElementById('skipPhotoBtn');
    const startChatBtn = document.getElementById('startChatBtn');
    const userNameInput = document.getElementById('userName');
    
    // Upload de avatar
    chooseAvatarBtn.addEventListener('click', () => avatarUpload.click());
    
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const avatarPreview = document.getElementById('avatarPreview');
                avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
                appState.userAvatar = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Drag and drop
    avatarUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    avatarUploadArea.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    
    avatarUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const avatarPreview = document.getElementById('avatarPreview');
                avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
                appState.userAvatar = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Botões
    skipPhotoBtn.addEventListener('click', function() {
        appState.userAvatar = '';
        saveProfileAndStart();
    });
    
    startChatBtn.addEventListener('click', function() {
        const userName = userNameInput.value.trim();
        if (!userName) {
            showNotification('Por favor, digite seu nome!', 'warning');
            userNameInput.focus();
            return;
        }
        appState.userName = userName;
        saveProfileAndStart();
    });
    
    // Enter para enviar
    userNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startChatBtn.click();
        }
    });
}

function saveProfileAndStart() {
    // Salva no localStorage
    localStorage.setItem("kako_userName", appState.userName);
    localStorage.setItem("kako_userAvatar", appState.userAvatar);
    localStorage.setItem("kako_hasProfile", "true");
    
    // Inicia o chat
    initializeChatInterface();
}

function loadUserProfile() {
    // Carrega dados salvos
    appState.userName = localStorage.getItem("kako_userName") || "Usuário";
    appState.userAvatar = localStorage.getItem("kako_userAvatar") || "";
}

function initializeChatInterface() {
    const chatHTML = `
        <div class="chat-app">
            <!-- Sidebar -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="app-logo">
                        <div class="logo-icon">K</div>
                        <h2>Kako Chat</h2>
                    </div>
                    <button id="newChatBtn" class="btn-new-chat">
                        <i class="fas fa-plus"></i> Nova conversa
                    </button>
                </div>
                
                <div class="chat-history" id="chatHistory">
                    <!-- Histórico será carregado aqui -->
                </div>
                
                <div class="user-profile">
                    <div class="user-info">
                        <div class="user-avatar" id="currentUserAvatar">
                            ${appState.userAvatar ? 
                                `<img src="${appState.userAvatar}" alt="${appState.userName}">` : 
                                `<i class="fas fa-user-circle"></i>`
                            }
                        </div>
                        <div class="user-details">
                            <span class="user-name">${appState.userName}</span>
                            <button id="editProfileBtn" class="btn-icon">
                                <i class="fas fa-cog"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Área principal -->
            <div class="main-content">
                <!-- Cabeçalho -->
                <div class="chat-header">
                    <div class="ai-info">
                        <div class="ai-avatar">
                            <img src="image/kako-profile.png" alt="Kako">
                        </div>
                        <div>
                            <h3>Kako</h3>
                            <p class="ai-status">Online • Inteligente e brincalhão</p>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        <button id="clearChatBtn" class="btn-icon" title="Limpar conversa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Mensagens -->
                <div class="messages-container" id="messagesContainer">
                    <div class="welcome-screen" id="welcomeScreen">
                        <div class="welcome-content">
                            <div class="welcome-avatar">
                                <img src="image/kako-profile.png" alt="Kako">
                            </div>
                            <h1>E aí, ${appState.userName}! 👋</h1>
                            <p>Eu sou o <strong>Kako</strong>, seu assistente de IA inteligente e brincalhão!</p>
                            <p>Estou aqui pra te ajudar com o que precisar. Pode perguntar qualquer coisa!</p>
                            <p class="hint"><i class="fas fa-image"></i> Dica: Você pode me enviar imagens e eu leio o texto delas!</p>
                            
                            <div class="quick-questions">
                                <h3><i class="fas fa-bolt"></i> Perguntas rápidas:</h3>
                                <div class="questions-grid">
                                    <button class="question-btn" data-question="Me explica o que é inteligência artificial de forma simples">
                                        O que é IA?
                                    </button>
                                    <button class="question-btn" data-question="Me ajuda a planejar meu dia">
                                        Planejar meu dia
                                    </button>
                                    <button class="question-btn" data-question="Cria uma receita fácil com ovo">
                                        Receita com ovo
                                    </button>
                                    <button class="question-btn" data-question="Me dá dicas para estudar melhor">
                                        Dicas de estudo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Input area -->
                <div class="input-container">
                    <div class="input-wrapper">
                        <div class="input-actions">
                            <button id="attachImageBtn" class="btn-icon" title="Anexar imagem">
                                <i class="fas fa-image"></i>
                            </button>
                            <input type="file" id="imageUpload" accept="image/*" hidden>
                        </div>
                        
                        <div class="text-input-area">
                            <textarea 
                                id="messageInput" 
                                placeholder="Mensagem para Kako... (Shift+Enter para nova linha)"
                                rows="1"
                            ></textarea>
                            
                            <div class="image-preview" id="imagePreview">
                                <!-- Preview de imagem -->
                            </div>
                        </div>
                        
                        <button id="sendMessageBtn" class="btn-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="input-footer">
                        <p><i class="fas fa-lightbulb"></i> Kako consegue analisar texto em imagens. Envie prints, documentos, etc.</p>
                    </div>
                </div>
            </div>
            
            <!-- Loading overlay -->
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>Kako está digitando...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.innerHTML = chatHTML;
    
    // Inicializa eventos do chat
    initializeChatEvents();
    
    // Carrega histórico se existir
    if (appState.chatHistory.length > 0) {
        loadChatHistory();
    } else {
        updateChatHistorySidebar();
    }
}

function initializeChatEvents() {
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const attachImageBtn = document.getElementById('attachImageBtn');
    const imageUpload = document.getElementById('imageUpload');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    
    // Envio de mensagem
    sendMessageBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Upload de imagem
    attachImageBtn.addEventListener('click', () => imageUpload.click());
    
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });
    
    // Botões de pergunta rápida
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            messageInput.value = question;
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
            messageInput.focus();
        });
    });
    
    // Nova conversa
    newChatBtn.addEventListener('click', function() {
        if (appState.chatHistory.length > 0 && 
            confirm('Iniciar uma nova conversa? O histórico atual será salvo.')) {
            startNewChat();
        } else if (appState.chatHistory.length === 0) {
            showNotification('Já estamos em uma conversa nova!', 'info');
        }
    });
    
    // Limpar conversa
    clearChatBtn.addEventListener('click', function() {
        if (appState.chatHistory.length === 0) {
            showNotification('Não há mensagens para limpar!', 'info');
            return;
        }
        
        if (confirm('Tem certeza que deseja limpar toda a conversa atual?')) {
            clearCurrentChat();
            showNotification('Conversa limpa com sucesso!', 'success');
        }
    });
    
    // Editar perfil
    editProfileBtn.addEventListener('click', function() {
        if (confirm('Editar seu perfil? Você será redirecionado para a tela de configuração.')) {
            localStorage.removeItem("kako_hasProfile");
            location.reload();
        }
    });
}

function handleImageUpload(file) {
    // Validação
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione um arquivo de imagem válido!', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem deve ter no máximo 5MB!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        appState.currentImage = event.target.result;
        showImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(imageData) {
    const previewHTML = `
        <div class="preview-container">
            <div class="preview-image">
                <img src="${imageData}" alt="Preview">
                <button class="remove-preview" onclick="removeImagePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="preview-hint">Imagem anexada • Clique no X para remover</p>
        </div>
    `;
    
    document.getElementById('imagePreview').innerHTML = previewHTML;
    document.getElementById('imagePreview').style.display = 'block';
}

function removeImagePreview() {
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imagePreview').style.display = 'none';
    appState.currentImage = null;
    document.getElementById('imageUpload').value = '';
}

// Função global para remover preview
window.removeImagePreview = removeImagePreview;

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message && !appState.currentImage) {
        showNotification('Digite uma mensagem ou anexe uma imagem!', 'warning');
        return;
    }
    
    // Remove tela de boas-vindas
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    // Cria mensagem do usuário
    const userMessage = {
        id: Date.now(),
        role: 'user',
        content: message || '[Imagem anexada]',
        image: appState.currentImage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
    };
    
    // Adiciona ao histórico
    appState.chatHistory.push(userMessage);
    
    // Renderiza mensagem
    renderMessage(userMessage);
    
    // Limpa campos
    messageInput.value = '';
    messageInput.style.height = 'auto';
    removeImagePreview();
    
    // Mostra indicador de digitação
    showTypingIndicator(true);
    
    try {
        // Prepara mensagens para API
        const apiMessages = appState.chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Chama API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionId,
                messages: apiMessages,
                imageData: appState.currentImage ? true : false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cria mensagem da IA
        const aiMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.reply || "Eita, não consegui pensar numa resposta agora. Tenta de novo?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString()
        };
        
        // Adiciona ao histórico
        appState.chatHistory.push(aiMessage);
        
        // Salva no localStorage
        localStorage.setItem("kako_chatHistory", JSON.stringify(appState.chatHistory));
        
        // Renderiza resposta
        renderMessage(aiMessage);
        
        // Atualiza histórico na sidebar
        updateChatHistorySidebar();
        
        showNotification('Kako respondeu!', 'success');
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        
        const errorMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: "Vish, deu um problema técnico aqui! 😅\n\nTenta de novo em uns segundos, beleza?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString()
        };
        
        appState.chatHistory.push(errorMessage);
        renderMessage(errorMessage);
        
        showNotification('Erro ao conectar com o servidor', 'error');
        
    } finally {
        showTypingIndicator(false);
        scrollToBottom();
    }
}

function renderMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    messageDiv.id = `msg-${message.id}`;
    
    let avatarHTML = '';
    let contentHTML = '';
    
    if (message.role === 'user') {
        avatarHTML = `
            <div class="message-avatar user-avatar">
                ${appState.userAvatar ? 
                    `<img src="${appState.userAvatar}" alt="${appState.userName}">` : 
                    `<i class="fas fa-user-circle"></i>`
                }
            </div>
        `;
        
        contentHTML = `
            <div class="message-content user-content">
                <div class="message-header">
                    <span class="message-sender">Você</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-text">${escapeHtml(message.content)}</div>
                ${message.image ? `
                    <div class="message-image">
                        <img src="${message.image}" alt="Imagem enviada">
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        avatarHTML = `
            <div class="message-avatar ai-avatar">
                <img src="image/kako-profile.png" alt="Kako">
            </div>
        `;
        
        contentHTML = `
            <div class="message-content ai-content">
                <div class="message-header">
                    <span class="message-sender">Kako</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-text">${formatMessage(message.content)}</div>
            </div>
        `;
    }
    
    messageDiv.innerHTML = avatarHTML + contentHTML;
    messagesContainer.appendChild(messageDiv);
}

function formatMessage(text) {
    // Processa formatação básica
    let formatted = escapeHtml(text);
    
    // Quebras de linha
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Negrito
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Itálico
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Código
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
    appState.isTyping = show;
}

function scrollToBottom() {
    setTimeout(() => {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, 100);
}

function loadChatHistory() {
    const messagesContainer = document.getElementById('messagesContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    messagesContainer.innerHTML = '';
    
    appState.chatHistory.forEach(message => {
        renderMessage(message);
    });
    
    scrollToBottom();
    updateChatHistorySidebar();
}

function updateChatHistorySidebar() {
    const chatHistoryElement = document.getElementById('chatHistory');
    
    if (appState.chatHistory.length === 0) {
        chatHistoryElement.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-comments"></i>
                <p>Nenhuma conversa ainda</p>
            </div>
        `;
        return;
    }
    
    // Agrupa mensagens por data
    const messagesByDate = {};
    appState.chatHistory.forEach(msg => {
        if (!messagesByDate[msg.date]) {
            messagesByDate[msg.date] = [];
        }
        messagesByDate[msg.date].push(msg);
    });
    
    let historyHTML = '';
    
    Object.keys(messagesByDate).forEach(date => {
        const firstMessage = messagesByDate[date][0];
        const preview = firstMessage.content.substring(0, 30) + 
                       (firstMessage.content.length > 30 ? '...' : '');
        
        historyHTML += `
            <div class="history-item" data-date="${date}">
                <div class="history-date">${formatDate(date)}</div>
                <div class="history-preview">${escapeHtml(preview)}</div>
                <div class="history-time">${firstMessage.timestamp}</div>
            </div>
        `;
    });
    
    chatHistoryElement.innerHTML = historyHTML;
}

function formatDate(dateString) {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    
    if (dateString === today) return 'Hoje';
    if (dateString === yesterday) return 'Ontem';
    
    return dateString;
}

function startNewChat() {
    // Salva conversa atual se tiver mensagens
    if (appState.chatHistory.length > 0) {
        const chatId = 'chat_' + Date.now();
        const chatData = {
            id: chatId,
            title: appState.chatHistory[0].content.substring(0, 30) + '...',
            messages: [...appState.chatHistory],
            timestamp: Date.now()
        };
        
        appState.savedChats.push(chatData);
        localStorage.setItem("kako_savedChats", JSON.stringify(appState.savedChats));
    }
    
    // Reseta conversa atual
    appState.chatHistory = [];
    localStorage.setItem("kako_chatHistory", JSON.stringify([]));
    
    // Recarrega interface
    loadChatHistory();
    
    // Mostra tela de boas-vindas
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-content">
                <div class="welcome-avatar">
                    <img src="image/kako-profile.png" alt="Kako">
                </div>
                <h1>Nova conversa! 🎉</h1>
                <p>Fala aí, ${appState.userName}! Qual a boa de hoje?</p>
            </div>
        </div>
    `;
    
    // Reconfigura eventos dos botões de pergunta rápida
    document.querySelectorAll('.question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            const messageInput = document.getElementById('messageInput');
            messageInput.value = question;
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
            messageInput.focus();
        });
    });
    
    showNotification('Nova conversa iniciada!', 'success');
}

function clearCurrentChat() {
    appState.chatHistory = [];
    localStorage.setItem("kako_chatHistory", JSON.stringify([]));
    
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-content">
                <div class="welcome-avatar">
                    <img src="image/kako-profile.png" alt="Kako">
                </div>
                <h1>Conversa limpa! 🧹</h1>
                <p>Pronto para começar de novo! O que você quer saber?</p>
            </div>
        </div>
    `;
    
    updateChatHistorySidebar();
}

function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'info-circle';
    if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'success') icon = 'check-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostra e depois remove
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}
