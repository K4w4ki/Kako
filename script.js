// script.js - Arquivo principal do Kako Chat
// URL da API no Vercel
const API_URL = "https://kako-kakos.vercel.app/api/chat";

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
    savedChats: JSON.parse(localStorage.getItem("kako_savedChats")) || [],
    settings: JSON.parse(localStorage.getItem("kako_settings")) || {
        typingSpeed: 50,
        soundEnabled: true,
        darkMode: true,
        autoScroll: true
    }
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

// Mostra modal de configuração inicial (MANTIDO IGUAL)
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
                
                <!-- Histórico Aprimorado -->
                <div class="history-section">
                    <div class="section-header">
                        <h3><i class="fas fa-history"></i> Histórico</h3>
                        <div class="history-controls">
                            <button id="clearHistoryBtn" class="btn-icon small" title="Limpar histórico">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button id="toggleHistoryBtn" class="btn-icon small">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chat-history" id="chatHistory">
                        <!-- Histórico será carregado aqui -->
                    </div>
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
                            <div class="profile-actions">
                                <button id="settingsBtn" class="btn-icon" title="Configurações">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Área principal -->
            <div class="main-content">
                <!-- Cabeçalho Aprimorado -->
                <div class="chat-header">
                    <div class="ai-info">
                        <div class="ai-avatar">
                            <img src="image/kako-profile.png" alt="Kako">
                            <div class="online-dot"></div>
                        </div>
                        <div class="ai-details">
                            <h3>Kako <span class="ai-badge">IA</span></h3>
                            <p class="ai-status">Online • Inteligente e brincalhão</p>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        <button id="exportChatBtn" class="btn-icon" title="Exportar conversa">
                            <i class="fas fa-download"></i>
                        </button>
                        <button id="clearChatBtn" class="btn-icon danger" title="Limpar conversa">
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
                            <div class="welcome-features">
                                <div class="feature">
                                    <i class="fas fa-image"></i>
                                    <span>Análise de imagens</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-bolt"></i>
                                    <span>Respostas rápidas</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-brain"></i>
                                    <span>Aprendizado contínuo</span>
                                </div>
                            </div>
                            
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
                
                <!-- Input area melhorada -->
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
                                placeholder="Digite sua mensagem aqui... (Shift+Enter para nova linha)"
                                rows="1"
                                maxlength="2000"
                            ></textarea>
                            <div class="input-hint">
                                <span id="charCount">0/2000</span>
                            </div>
                            
                            <div class="image-preview" id="imagePreview">
                                <!-- Preview de imagem -->
                            </div>
                        </div>
                        
                        <button id="sendMessageBtn" class="btn-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="input-footer">
                        <div class="typing-indicator" id="typingIndicator" style="display: none;">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span>hmmm...</span>
                        </div>
                        <p><i class="fas fa-lightbulb"></i> Kako consegue analisar texto em imagens</p>
                    </div>
                </div>
            </div>
            
            <!-- Modal de Configurações -->
            <div id="settingsModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-cog"></i> Configurações</h3>
                        <button class="btn-icon close-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-section">
                            <h4>Interface</h4>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="darkModeToggle" ${appState.settings.darkMode ? 'checked' : ''}>
                                    <span>Modo Escuro</span>
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="soundToggle" ${appState.settings.soundEnabled ? 'checked' : ''}>
                                    <span>Sons</span>
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="autoScrollToggle" ${appState.settings.autoScroll ? 'checked' : ''}>
                                    <span>Rolagem automática</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4>Velocidade de Digitação</h4>
                            <div class="setting-item">
                                <input type="range" id="typingSpeed" min="20" max="150" value="${appState.settings.typingSpeed}">
                                <span id="speedValue">${appState.settings.typingSpeed} cps</span>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h4>Conta</h4>
                            <div class="setting-item">
                                <button id="editProfileSettingsBtn" class="btn-secondary">
                                    <i class="fas fa-user-edit"></i> Editar Perfil
                                </button>
                            </div>
                            <div class="setting-item">
                                <button id="clearAllDataBtn" class="btn-secondary danger">
                                    <i class="fas fa-trash-alt"></i> Limpar Todos os Dados
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary save-settings">
                            <i class="fas fa-save"></i> Salvar Configurações
                        </button>
                    </div>
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
    
    // Atualiza contador de caracteres
    updateCharCount();
}

function initializeChatEvents() {
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const attachImageBtn = document.getElementById('attachImageBtn');
    const imageUpload = document.getElementById('imageUpload');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const charCount = document.getElementById('charCount');
    const typingIndicator = document.getElementById('typingIndicator');
    const typingSpeedSlider = document.getElementById('typingSpeed');
    const speedValue = document.getElementById('speedValue');
    
    // Contador de caracteres
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        updateCharCount();
    });
    
    function updateCharCount() {
        const count = messageInput.value.length;
        charCount.textContent = `${count}/2000`;
        if (count > 1800) {
            charCount.style.color = 'var(--error)';
        } else if (count > 1500) {
            charCount.style.color = 'var(--warning)';
        } else {
            charCount.style.color = 'var(--text-secondary)';
        }
    }
    
    // Envio de mensagem
    sendMessageBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
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
            updateCharCount();
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
clearChatBtn.addEventListener('click', function () {
    if (appState.chatHistory.length === 0) {
        showNotification('Não há mensagens para limpar!', 'info');
        return;
    }

    showClearChatConfirm();
});
    
    // Configurações
    settingsBtn.addEventListener('click', function() {
        document.getElementById('settingsModal').classList.add('active');
    });
    
    // Fechar modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('settingsModal').classList.remove('active');
        });
    });
    
    // Velocidade de digitação
    typingSpeedSlider.addEventListener('input', function() {
        speedValue.textContent = `${this.value} cps`;
        appState.settings.typingSpeed = parseInt(this.value);
    });
    
    // Salvar configurações
    document.querySelector('.save-settings').addEventListener('click', function() {
        appState.settings.darkMode = document.getElementById('darkModeToggle').checked;
        appState.settings.soundEnabled = document.getElementById('soundToggle').checked;
        appState.settings.autoScroll = document.getElementById('autoScrollToggle').checked;
        
        localStorage.setItem("kako_settings", JSON.stringify(appState.settings));
        document.getElementById('settingsModal').classList.remove('active');
        showNotification('Configurações salvas!', 'success');
    });
    
    // Editar perfil nas configurações
    document.getElementById('editProfileSettingsBtn').addEventListener('click', function() {
        if (confirm('Editar seu perfil? Você será redirecionado para a tela de configuração.')) {
            localStorage.removeItem("kako_hasProfile");
            location.reload();
        }
    });
    
    // Limpar todos os dados
    document.getElementById('clearAllDataBtn').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Isso inclui conversas, histórico e configurações.')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    // Limpar histórico
    document.getElementById('clearHistoryBtn').addEventListener('click', function() {
        if (appState.savedChats.length === 0) {
            showNotification('Não há histórico para limpar!', 'info');
            return;
        }
        
        if (confirm('Limpar todo o histórico de conversas?')) {
            appState.savedChats = [];
            localStorage.setItem("kako_savedChats", JSON.stringify([]));
            updateChatHistorySidebar();
            showNotification('Histórico limpo!', 'success');
        }
    });
    
    // Fechar modal ao clicar fora
    document.getElementById('settingsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
    
    // Exportar chat
    document.getElementById('exportChatBtn').addEventListener('click', function() {
        if (appState.chatHistory.length === 0) {
            showNotification('Não há conversa para exportar!', 'warning');
            return;
        }
        
        const chatText = appState.chatHistory.map(msg => 
            `${msg.role === 'user' ? appState.userName : 'Kako'} (${msg.timestamp}): ${msg.content}`
        ).join('\n\n');
        
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-kako-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Conversa exportada com sucesso!', 'success');
    });
    
    // Mostrar/ocultar histórico
    document.getElementById('toggleHistoryBtn').addEventListener('click', function() {
        const historySection = document.querySelector('.chat-history');
        const icon = this.querySelector('i');
        
        if (historySection.style.display === 'none') {
            historySection.style.display = 'block';
            icon.className = 'fas fa-chevron-down';
        } else {
            historySection.style.display = 'none';
            icon.className = 'fas fa-chevron-up';
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
            <p class="preview-hint">Imagem anexada</p>
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
    // PREVENIR MÚLTIPLOS ENVIOS SIMULTÂNEOS - CORREÇÃO CRÍTICA
    if (appState.isProcessing) {
        showNotification('Aguarde a resposta anterior...', 'warning');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message && !appState.currentImage) {
        showNotification('Digite uma mensagem ou anexe uma imagem!', 'warning');
        return;
    }
    
    // Marcar como processando
    appState.isProcessing = true;
    const sendBtn = document.getElementById('sendMessageBtn');
    sendBtn.disabled = true;
    
    try {
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
        updateCharCount();
        
        // Mostra indicador de digitação INLINE
        showTypingIndicator(true);
        scrollToBottom();
        
        // TIMEOUT DE SEGURANÇA PARA API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        try {
            // Prepara mensagens para API (apenas últimas 5 para evitar payload grande)
            const recentMessages = appState.chatHistory.slice(-5);
            const apiMessages = recentMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            
            // Chama API com timeout
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    messages: apiMessages,
                    imageData: appState.currentImage ? true : false
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Esconde indicador de digitação
            showTypingIndicator(false);
            
            // Cria mensagem da IA
            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.reply || "Olá! Eu sou o Kako. Como posso te ajudar?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString()
            };
            
            // Adiciona ao histórico
            appState.chatHistory.push(aiMessage);
            
            // Salva no localStorage
            localStorage.setItem("kako_chatHistory", JSON.stringify(appState.chatHistory));
            
            // Renderiza resposta COM EFEITO DE DIGITAÇÃO
            await renderMessageWithTypingEffect(aiMessage);
            
            // Atualiza histórico na sidebar
            updateChatHistorySidebar();
            
            if (appState.settings.soundEnabled) {
                playNotificationSound();
            }
            
            showNotification('Kako respondeu!', 'success');
            
        } catch (apiError) {
            clearTimeout(timeoutId);
            showTypingIndicator(false);
            
            console.error('API Error:', apiError);
            
            // RESPOSTA DE FALLBACK LOCAL
            const fallbackResponses = [
                "E aí! Beleza? 😄\nTô aqui pra te ajudar! O que você gostaria de saber?",
                "Olá! Tudo bem com você?\nEu sou o Kako, seu assistente virtual. Pode perguntar qualquer coisa!",
                "Opa! Tô na área! ✨\nPrecisa de ajuda com algo? Toque aqui!",
                "Oi! 👋\nQue bom te ver por aqui! Como posso te ajudar hoje?"
            ];
            
            const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            
            const fallbackMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: apiError.name === 'AbortError' 
                    ? "Poxa, a conexão está um pouco lenta! 😅\nTente novamente ou faça uma pergunta mais simples." 
                    : randomResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString()
            };
            
            appState.chatHistory.push(fallbackMessage);
            await renderMessageWithTypingEffect(fallbackMessage);
            
            showNotification('Usando respostas locais', 'info');
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
        showTypingIndicator(false);
        showNotification('Erro inesperado', 'error');
        
    } finally {
        // SEMPRE LIBERAR PARA NOVAS MENSAGENS
        appState.isProcessing = false;
        sendBtn.disabled = false;
        scrollToBottom();
        
        // Foco no input novamente
        setTimeout(() => {
            if (messageInput) messageInput.focus();
        }, 100);
    }
}

async function renderMessageWithTypingEffect(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Cria elemento da mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = `msg-${message.id}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar ai-avatar">
            <img src="image/kako-profile.png" alt="Kako">
            <div class="ai-status-dot typing"></div>
        </div>
        <div class="message-content ai-content">
            <div class="message-header">
                <span class="message-sender">Kako <span class="ai-tag">IA</span></span>
                <span class="message-time">${message.timestamp}</span>
            </div>
            <div class="message-text typing-placeholder">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // Remove os dots de digitação
    setTimeout(() => {
        const textElement = messageDiv.querySelector('.typing-placeholder');
        
        // Efeito de digitação mais rápido
        const text = message.content;
        let displayedText = '';
        
        // Velocidade ajustada para ser mais rápida
        const typingSpeed = Math.max(20, Math.min(150, appState.settings.typingSpeed));
        const delay = 1000 / typingSpeed;
        
        // Função para processar texto com efeito
        const typeWriter = async () => {
            for (let i = 0; i < text.length; i++) {
                displayedText += text[i];
                textElement.innerHTML = formatMessage(displayedText) + 
                    (i < text.length - 1 ? '<span class="typing-cursor">|</span>' : '');
                
                // Rola para baixo periodicamente
                if (i % 15 === 0) {
                    scrollToBottom();
                }
                
                // Pausa menor para pontuação
                if ('.!?'.includes(text[i])) {
                    await sleep(100);
                }
                
                await sleep(delay);
            }
            
            // Adiciona botões de reação após digitação completa
            textElement.innerHTML = formatMessage(displayedText);
            addReactionButtons(messageDiv);
            scrollToBottom();
        };
        
        typeWriter();
    }, 300);
}

function addReactionButtons(messageDiv) {
    const reactionsHTML = `
        <div class="message-reactions">
            <button class="reaction-btn" title="Útil" onclick="handleReaction(this, 'like')">
                <i class="fas fa-thumbs-up"></i>
            </button>
            <button class="reaction-btn" title="Copiar" onclick="copyMessage(this)">
                <i class="fas fa-copy"></i>
            </button>
            <button class="reaction-btn" title="Regenerar" onclick="regenerateMessage(this)">
                <i class="fas fa-redo"></i>
            </button>
        </div>
    `;
    
    const messageContent = messageDiv.querySelector('.message-content');
    messageContent.insertAdjacentHTML('beforeend', reactionsHTML);
}

// Funções auxiliares para reações
function handleReaction(button, type) {
    button.classList.toggle('active');
    const icon = button.querySelector('i');
    
    if (type === 'like') {
        if (button.classList.contains('active')) {
            icon.className = 'fas fa-thumbs-up';
            button.style.color = 'var(--primary-orange)';
            showNotification('Obrigado pelo feedback!', 'success');
        } else {
            icon.className = 'far fa-thumbs-up';
            button.style.color = '';
        }
    }
}

function copyMessage(button) {
    const messageText = button.closest('.message-content').querySelector('.message-text').textContent;
    navigator.clipboard.writeText(messageText).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = 'var(--success)';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.color = '';
        }, 2000);
        
        showNotification('Mensagem copiada!', 'success');
    });
}

function regenerateMessage(button) {
    const messageDiv = button.closest('.message');
    const messageContent = messageDiv.querySelector('.message-text').textContent;
    
    if (confirm('Regenerar esta resposta?')) {
        // Adiciona a mensagem do usuário anterior novamente
        const input = document.getElementById('messageInput');
        input.value = messageContent;
        sendMessage();
    }
}

// Funções globais para reações
window.handleReaction = handleReaction;
window.copyMessage = copyMessage;
window.regenerateMessage = regenerateMessage;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        
        // ALTERAÇÃO AQUI: Mostra o nome do usuário em vez de "Você"
        contentHTML = `
            <div class="message-content user-content">
                <div class="message-header">
                    <span class="message-sender">${appState.userName}</span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-text">${escapeHtml(message.content)}</div>
                ${message.image ? `
                    <div class="message-image">
                        <img src="${message.image}" alt="Imagem enviada">
                        <div class="image-caption">
                            <i class="fas fa-image"></i> Imagem anexada
                        </div>
                    </div>
                ` : ''}
                <div class="message-status">
                    <i class="fas fa-check-double"></i>
                </div>
            </div>
        `;
    } else {
        avatarHTML = `
            <div class="message-avatar ai-avatar">
                <img src="image/kako-profile.png" alt="Kako">
                <div class="ai-status-dot"></div>
            </div>
        `;
        
        contentHTML = `
            <div class="message-content ai-content">
                <div class="message-header">
                    <span class="message-sender">Kako <span class="ai-tag">IA</span></span>
                    <span class="message-time">${message.timestamp}</span>
                </div>
                <div class="message-text">${formatMessage(message.content)}</div>
            </div>
        `;
    }
    
    messageDiv.innerHTML = avatarHTML + contentHTML;
    messagesContainer.appendChild(messageDiv);
    
    // Adiciona efeito de envio suave para mensagens do usuário
    if (message.role === 'user') {
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
    }
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
    
    // Links
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
    }
}

function scrollToBottom() {
    if (!appState.settings.autoScroll) return;
    
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

function updateCharCount() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    
    if (!messageInput || !charCount) return;
    
    const count = messageInput.value.length;
    charCount.textContent = `${count}/2000`;
    
    if (count > 1800) {
        charCount.style.color = 'var(--error)';
    } else if (count > 1500) {
        charCount.style.color = 'var(--warning)';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
}

function updateChatHistorySidebar() {
    const chatHistoryElement = document.getElementById('chatHistory');
    
    if (appState.chatHistory.length === 0 && appState.savedChats.length === 0) {
        chatHistoryElement.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-comments"></i>
                <p>Nenhuma conversa ainda</p>
                <small>Comece conversando com o Kako!</small>
            </div>
        `;
        return;
    }
    
    let historyHTML = '';
    
    // Conversa atual
    if (appState.chatHistory.length > 0) {
        const firstMessage = appState.chatHistory[0];
        const lastMessage = appState.chatHistory[appState.chatHistory.length - 1];
        const preview = firstMessage.content.substring(0, 40) + 
                       (firstMessage.content.length > 40 ? '...' : '');
        
        historyHTML += `
            <div class="history-item current">
                <div class="history-date">Atual</div>
                <div class="history-preview">${escapeHtml(preview)}</div>
                <div class="history-meta">
                    <span class="history-time">${lastMessage.timestamp}</span>
                    <span class="history-count">${appState.chatHistory.length} msgs</span>
                </div>
            </div>
        `;
    }
    
    // Conversas salvas
    appState.savedChats.slice(-5).reverse().forEach(chat => {
        const date = new Date(chat.timestamp).toLocaleDateString();
        const time = new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const preview = chat.title;
        
        historyHTML += `
            <div class="history-item" data-chat-id="${chat.id}">
                <div class="history-date">${date === new Date().toLocaleDateString() ? 'Hoje' : date}</div>
                <div class="history-preview">${escapeHtml(preview)}</div>
                <div class="history-meta">
                    <span class="history-time">${time}</span>
                    <span class="history-count">${chat.messages.length} msgs</span>
                </div>
            </div>
        `;
    });
    
    chatHistoryElement.innerHTML = historyHTML;
    
    // Adiciona eventos aos itens do histórico
    document.querySelectorAll('.history-item:not(.current)').forEach(item => {
        item.addEventListener('click', function() {
            const chatId = this.getAttribute('data-chat-id');
            loadSavedChat(chatId);
        });
    });
}

function loadSavedChat(chatId) {
    const chat = appState.savedChats.find(c => c.id === chatId);
    if (!chat) return;
    
    // Salva conversa atual primeiro
    if (appState.chatHistory.length > 0) {
        const currentChatId = 'chat_' + Date.now();
        const chatData = {
            id: currentChatId,
            title: appState.chatHistory[0].content.substring(0, 30) + '...',
            messages: [...appState.chatHistory],
            timestamp: Date.now()
        };
        
        appState.savedChats.push(chatData);
    }
    
    // Carrega conversa salva
    appState.chatHistory = [...chat.messages];
    localStorage.setItem("kako_chatHistory", JSON.stringify(appState.chatHistory));
    
    // Recarrega interface
    loadChatHistory();
    showNotification('Conversa carregada!', 'success');
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
            updateCharCount();
        });
    });
    
    updateChatHistorySidebar();
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

function playNotificationSound() {
    // Cria um som de notificação simples
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.log('Som não disponível');
    }
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

// PAINEL DE CONFIRMAÇÃO PARA LIMPAR MENSAGENS

function showClearChatConfirm() {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

overlay.innerHTML = `
    <div class="confirm-modal">
        <div class="confirm-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>

        <h3>Limpar conversa?</h3>
        <p>
            Todas as mensagens da conversa atual serão apagadas.
            <br><strong>Essa ação não pode ser desfeita.</strong>
        </p>

        <div class="confirm-actions">
            <button class="btn-secondary" id="cancelClearChat">
                Cancelar
            </button>
            <button class="btn-primary danger" id="confirmClearChat">
                Limpar
            </button>
        </div>
    </div>
`;

    document.body.appendChild(overlay);

    // Cancelar
    overlay.querySelector('#cancelClearChat').onclick = () => {
        overlay.remove();
    };

// Confirmar (com shake)
const confirmBtn = overlay.querySelector('#confirmClearChat');

confirmBtn.onclick = () => {
    confirmBtn.classList.add('shake');

    setTimeout(() => {
        clearCurrentChat();
        overlay.remove();
        showNotification('Conversa limpa com sucesso!', 'success');
    }, 400);
};

    // Clique fora fecha
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

