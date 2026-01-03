// Banco de dados do Kako
const KAKO_BRAIN = {
    name: "Kako",
    birthDate: "2026-01-03",
    personality: {
        traits: ["inteligente", "brincalhona", "informal", "precisa", "curiosa", "empática"],
        speakingStyle: "Português bem informal, com gírias quando apropriado, mas mantendo exatidão nas informações",
        humor: "Adora fazer piadas nerds, trocadilhos e referências à cultura pop"
    },
    knowledge: {
        creator: "Você foi criado por um desenvolvedor apaixonado por IA",
        purpose: "Ajudar usuários de forma divertida e eficiente",
        capabilities: [
            "Processar texto",
            "Analisar imagens",
            "Transcrever áudio",
            "Aprender com interações"
        ]
    },
    preferences: {
        colors: ["laranja", "preto"],
        greeting: "E aí, beleza? Sou o Kako!",
        farewell: "Até mais, tchauzinho! Volte sempre!",
        catchphrases: [
            "Haha, que maneiro!",
            "Peraí, deixa eu pensar...",
            "Olha só o que eu descobri!",
            "Tá brincando? Isso é demais!",
            "Vish, que legal!",
            "Nossa, sério mesmo?",
            "Olha só que interessante!",
            "Hmm, deixa eu ver..."
        ],
        emojis: ["😄", "🤔", "🎉", "🤖", "💡", "🔥", "🎯", "✨", "👋", "🎂"]
    },
    memories: {
        firstUser: "",
        favoriteTopics: [],
        jokesCollection: [
            "Por que o JavaScript foi ao psicólogo? Porque tinha muitos problemas de async na vida!",
            "Qual é o café preferido do desenvolvedor? Java!",
            "Por que o banco de dados foi à festa? Para fazer muitas queries!",
            "Qual é o esporte favorito do CSS? Box-ing!",
            "Por que o HTML não consegue se concentrar? Porque tem muitas divs!"
        ]
    }
};

// Configuração da API - SUBSTITUA COM SUAS INFORMAÇÕES
const API_CONFIG = {
    // Opção 1: OpenRouter (Recomendado - mais fácil de configurar)
    provider: 'openrouter', // 'openrouter', 'groq', 'together', 'local'
    
    // Configurações OpenRouter
    openrouter: {
        apiKey: '', // SUA CHAVE AQUI - Obtenha em https://openrouter.ai/
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'meta-llama/llama-3-70b-instruct', // ou 'meta-llama/llama-3.1-70b-instruct'
        maxTokens: 1000
    },
    
    // Configurações Groq (alternativa rápida)
    groq: {
        apiKey: '', // SUA CHAVE AQUI - Obtenha em https://console.groq.com/
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama3-70b-8192',
        maxTokens: 1000
    },
    
    // Configurações Together AI
    together: {
        apiKey: '', // SUA CHAVE AQUI - Obtenha em https://api.together.xyz/
        endpoint: 'https://api.together.xyz/v1/chat/completions',
        model: 'meta-llama/Meta-Llama-3-70B-Instruct',
        maxTokens: 1000
    },
    
    // Configurações local (Ollama)
    local: {
        endpoint: 'http://localhost:11434/api/chat',
        model: 'llama3.1:70b',
        maxTokens: 1000
    }
};

// Estado da aplicação
const AppState = {
    userProfile: null,
    currentChat: [],
    isRecording: false,
    isProcessing: false,
    mediaRecorder: null,
    audioChunks: [],
    isTyping: false,
    settings: {
        informality: 8,
        humor: 7,
        notifications: true,
        sound: true,
        theme: 'dark',
        apiProvider: 'openrouter'
    },
    nextBirthday: null,
    apiKeyValid: false
};

// Elementos DOM
const DOM = {
    // Telas
    welcomeScreen: document.getElementById('welcome-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Formulário de boas-vindas
    usernameInput: document.getElementById('username'),
    avatarUpload: document.getElementById('avatar-upload'),
    avatarPreview: document.getElementById('avatar-preview'),
    changeAvatarBtn: document.getElementById('change-avatar'),
    startChatBtn: document.getElementById('start-chat'),
    nameError: document.getElementById('name-error'),
    
    // Sidebar
    userAvatarSidebar: document.getElementById('user-avatar-sidebar'),
    userNameSidebar: document.getElementById('user-name-sidebar'),
    menuToggle: document.getElementById('menu-toggle'),
    historyList: document.getElementById('history-list'),
    
    // Chat principal
    chatMessages: document.getElementById('chat-messages'),
    messageInput: document.getElementById('message-input'),
    sendMessageBtn: document.getElementById('send-message'),
    clearChatBtn: document.getElementById('clear-chat'),
    themeToggle: document.getElementById('theme-toggle'),
    nextBirthdaySpan: document.getElementById('next-birthday'),
    
    // Upload de imagem
    imageUploadBtn: document.getElementById('image-upload-btn'),
    imageInput: document.getElementById('image-input'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImageBtn: document.getElementById('remove-image'),
    
    // Gravação de áudio
    audioRecordBtn: document.getElementById('audio-record-btn'),
    audioRecorder: document.getElementById('audio-recorder'),
    stopRecordingBtn: document.getElementById('stop-recording'),
    recorderTimer: document.querySelector('.recorder-timer'),
    audioVisualizer: document.getElementById('audio-visualizer'),
    
    // Modal de configurações
    settingsModal: document.getElementById('settings-modal'),
    settingsBtn: document.getElementById('settings-btn'),
    closeSettingsBtn: document.getElementById('close-settings'),
    saveSettingsBtn: document.getElementById('save-settings'),
    resetSettingsBtn: document.getElementById('reset-settings'),
    apiConfigBtn: document.getElementById('api-config-btn'),
    
    // Inputs do modal
    settingsUsername: document.getElementById('settings-username'),
    settingsAvatar: document.getElementById('settings-avatar'),
    settingsAvatarUpload: document.getElementById('settings-avatar-upload'),
    changeSettingsAvatarBtn: document.getElementById('change-settings-avatar'),
    informalityLevel: document.getElementById('informality-level'),
    humorLevel: document.getElementById('humor-level'),
    notificationsToggle: document.getElementById('notifications-toggle'),
    soundToggle: document.getElementById('sound-toggle'),
    apiProviderSelect: document.getElementById('api-provider')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    calculateNextBirthday();
    
    // Testar API automaticamente
    setTimeout(() => testApiConnection(), 2000);
});

// Funções de inicialização
function initializeApp() {
    // Carregar perfil do usuário do localStorage
    const savedProfile = localStorage.getItem('kako-user-profile');
    const savedSettings = localStorage.getItem('kako-settings');
    const savedChat = localStorage.getItem('kako-chat-history');
    
    if (savedProfile) {
        AppState.userProfile = JSON.parse(savedProfile);
        showChatScreen();
    }
    
    if (savedSettings) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
        applySettings();
    }
    
    if (savedChat) {
        AppState.currentChat = JSON.parse(savedChat);
        renderChatHistory();
    }
    
    // Inicializar tema
    document.body.setAttribute('data-theme', AppState.settings.theme);
    updateThemeIcon();
    
    // Configurar API provider
    if (DOM.apiProviderSelect) {
        DOM.apiProviderSelect.value = AppState.settings.apiProvider;
    }
}

function setupEventListeners() {
    // Formulário de boas-vindas
    DOM.avatarPreview.addEventListener('click', () => DOM.avatarUpload.click());
    DOM.changeAvatarBtn.addEventListener('click', () => DOM.avatarUpload.click());
    DOM.avatarUpload.addEventListener('change', handleAvatarUpload);
    DOM.usernameInput.addEventListener('input', validateUsername);
    DOM.startChatBtn.addEventListener('click', startChat);
    
    // Chat
    DOM.messageInput.addEventListener('keydown', handleKeyDown);
    DOM.messageInput.addEventListener('input', handleInputChange);
    DOM.sendMessageBtn.addEventListener('click', sendMessage);
    DOM.clearChatBtn.addEventListener('click', clearChat);
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.menuToggle.addEventListener('click', toggleSidebar);
    
    // Upload de imagem
    DOM.imageUploadBtn.addEventListener('click', () => DOM.imageInput.click());
    DOM.imageInput.addEventListener('change', handleImageUpload);
    DOM.removeImageBtn.addEventListener('click', removeImagePreview);
    
    // Gravação de áudio
    DOM.audioRecordBtn.addEventListener('click', toggleAudioRecording);
    DOM.stopRecordingBtn.addEventListener('click', stopAudioRecording);
    
    // Configurações
    DOM.settingsBtn.addEventListener('click', showSettingsModal);
    DOM.closeSettingsBtn.addEventListener('click', hideSettingsModal);
    DOM.saveSettingsBtn.addEventListener('click', saveSettings);
    DOM.resetSettingsBtn.addEventListener('click', resetSettings);
    
    // Atualizações de configurações em tempo real
    DOM.informalityLevel.addEventListener('input', updateSettingsPreview);
    DOM.humorLevel.addEventListener('input', updateSettingsPreview);
    DOM.notificationsToggle.addEventListener('change', updateSettingsPreview);
    DOM.soundToggle.addEventListener('change', updateSettingsPreview);
    DOM.settingsAvatarUpload.addEventListener('change', handleSettingsAvatarUpload);
    DOM.changeSettingsAvatarBtn.addEventListener('click', () => DOM.settingsAvatarUpload.click());
    DOM.apiProviderSelect?.addEventListener('change', handleApiProviderChange);
    
    // Fechar modal ao clicar fora
    DOM.settingsModal?.addEventListener('click', (e) => {
        if (e.target === DOM.settingsModal) {
            hideSettingsModal();
        }
    });
}

// Funções da tela de boas-vindas
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            DOM.avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            DOM.avatarPreview.style.border = '3px solid var(--primary)';
        };
        reader.readAsDataURL(file);
    }
}

function validateUsername() {
    const username = DOM.usernameInput.value.trim();
    if (username.length < 2) {
        showError('Nome deve ter pelo menos 2 caracteres');
        DOM.startChatBtn.disabled = true;
        return false;
    } else if (username.length > 50) {
        showError('Nome deve ter no máximo 50 caracteres');
        DOM.startChatBtn.disabled = true;
        return false;
    } else {
        hideError();
        const hasAvatar = DOM.avatarPreview.querySelector('img');
        DOM.startChatBtn.disabled = !hasAvatar;
        return true;
    }
}

function showError(message) {
    if (DOM.nameError) {
        DOM.nameError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        DOM.nameError.style.display = 'block';
    }
}

function hideError() {
    if (DOM.nameError) {
        DOM.nameError.style.display = 'none';
    }
}

function startChat() {
    const username = DOM.usernameInput.value.trim();
    const avatar = DOM.avatarPreview.querySelector('img')?.src;
    
    if (!validateUsername() || !avatar) {
        showNotification('Por favor, preencha todos os campos corretamente', 'error');
        return;
    }
    
    // Salvar perfil do usuário
    AppState.userProfile = {
        name: username,
        avatar: avatar
    };
    
    localStorage.setItem('kako-user-profile', JSON.stringify(AppState.userProfile));
    
    // Atualizar UI
    DOM.userAvatarSidebar.src = avatar;
    DOM.userNameSidebar.textContent = username;
    
    // Mostrar chat
    showChatScreen();
    
    // Adicionar mensagem de boas-vindas do Kako
    setTimeout(() => {
        addKakoMessage(getKakoGreeting());
    }, 500);
}

function showChatScreen() {
    DOM.welcomeScreen.classList.remove('active');
    DOM.chatScreen.style.display = 'block';
    
    setTimeout(() => {
        DOM.chatScreen.style.opacity = '0';
        DOM.chatScreen.style.transition = 'opacity 0.3s ease';
        DOM.chatScreen.style.opacity = '1';
    }, 10);
}

// Funções do chat
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
    
    setTimeout(() => {
        adjustTextareaHeight();
    }, 0);
}

function handleInputChange() {
    const text = DOM.messageInput.value;
    const charCount = text.length;
    document.querySelector('.char-count').textContent = `${charCount}/2000`;
    
    if (charCount > 2000) {
        DOM.messageInput.value = text.substring(0, 2000);
        showNotification('Mensagem muito longa! Limite: 2000 caracteres', 'warning');
    }
}

function adjustTextareaHeight() {
    const textarea = DOM.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

async function sendMessage() {
    if (AppState.isTyping) {
        showNotification('Aguarde, Kako está digitando...', 'warning');
        return;
    }
    
    const text = DOM.messageInput.value.trim();
    const image = DOM.imagePreview.src;
    
    if (!text && !image) return;
    
    // Verificar conexão com API
    if (!AppState.apiKeyValid) {
        const useOffline = confirm('API não configurada. Deseja usar o modo offline? (Respostas simuladas)');
        if (!useOffline) {
            showNotification('Configure a API primeiro nas configurações', 'error');
            return;
        }
    }
    
    // Adicionar mensagem do usuário
    const userMessage = {
        id: Date.now(),
        text: text,
        image: image || null,
        sender: 'user',
        timestamp: new Date()
    };
    
    addMessageToChat(userMessage);
    
    // Limpar input
    DOM.messageInput.value = '';
    adjustTextareaHeight();
    document.querySelector('.char-count').textContent = '0/2000';
    
    // Remover preview de imagem
    if (image) {
        removeImagePreview();
    }
    
    // Obter resposta do Kako
    await getKakoResponse(text, image);
    
    // Salvar no histórico
    saveChatToStorage();
}

async function getKakoResponse(userText, userImage) {
    showTypingIndicator();
    
    try {
        let response;
        
        if (AppState.apiKeyValid) {
            // Usar API real
            response = await callKakoApi(userText, userImage);
        } else {
            // Usar modo offline
            response = generateOfflineResponse(userText, userImage);
            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        removeTypingIndicator();
        
        const kakoMessage = {
            id: Date.now() + 1,
            text: response,
            sender: 'kako',
            timestamp: new Date()
        };
        
        addMessageToChat(kakoMessage);
        saveChatToStorage();
        
        // Notificações
        if (AppState.settings.notifications) {
            showNotification('Kako respondeu!', 'info');
        }
        
        if (AppState.settings.sound) {
            playNotificationSound();
        }
        
    } catch (error) {
        console.error('Erro ao obter resposta:', error);
        removeTypingIndicator();
        
        // Fallback para resposta offline
        const fallbackResponse = generateOfflineResponse(userText, userImage);
        
        const kakoMessage = {
            id: Date.now() + 1,
            text: `Ops, tive um probleminha! 😅 ${fallbackResponse}`,
            sender: 'kako',
            timestamp: new Date()
        };
        
        addMessageToChat(kakoMessage);
        saveChatToStorage();
        showNotification('Usando resposta offline', 'warning');
    }
}

function showTypingIndicator() {
    AppState.isTyping = true;
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message kako typing';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>
    `;
    
    DOM.chatMessages.appendChild(typingIndicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    AppState.isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function callKakoApi(userText, userImage) {
    const provider = AppState.settings.apiProvider || 'openrouter';
    const config = API_CONFIG[provider];
    
    if (!config || (provider !== 'local' && !config.apiKey)) {
        throw new Error('API não configurada');
    }
    
    // Preparar mensagens
    const messages = prepareApiMessages(userText, userImage);
    
    // Configurar requisição
    const requestConfig = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: config.model,
            messages: messages,
            max_tokens: config.maxTokens || 1000,
            temperature: 0.7 + (AppState.settings.humor * 0.02),
            top_p: 0.9,
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            stream: false
        })
    };
    
    // Adicionar headers específicos do provider
    if (provider === 'openrouter' && config.apiKey) {
        requestConfig.headers['Authorization'] = `Bearer ${config.apiKey}`;
        requestConfig.headers['HTTP-Referer'] = window.location.origin;
        requestConfig.headers['X-Title'] = 'Kako AI';
    } else if (provider === 'groq' && config.apiKey) {
        requestConfig.headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (provider === 'together' && config.apiKey) {
        requestConfig.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    // Fazer requisição
    const response = await fetch(config.endpoint, requestConfig);
    
    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extrair resposta baseada no formato do provider
    if (provider === 'local' && data.message) {
        // Formato Ollama
        return data.message.content;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
        // Formato OpenAI
        return data.choices[0].message.content;
    } else if (data.choices && data.choices[0] && data.choices[0].text) {
        // Formato alternativo
        return data.choices[0].text;
    } else {
        throw new Error('Formato de resposta desconhecido');
    }
}

function prepareApiMessages(userText, userImage) {
    const systemPrompt = createSystemPrompt();
    
    // Histórico recente (últimas 5 trocas)
    const history = [];
    const recentMessages = AppState.currentChat.slice(-10);
    
    for (const msg of recentMessages) {
        history.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.image ? `${msg.text || ''} [Imagem enviada]` : msg.text
        });
    }
    
    // Mensagem atual
    const currentMessage = {
        role: 'user',
        content: userImage ? `${userText} [Imagem anexada]` : userText
    };
    
    return [
        { role: 'system', content: systemPrompt },
        ...history,
        currentMessage
    ];
}

function createSystemPrompt() {
    const today = new Date();
    const birthday = new Date(KAKO_BRAIN.birthDate);
    const nextBirthday = AppState.nextBirthday;
    const daysUntilBirthday = nextBirthday ? 
        Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24)) : 365;
    
    const userName = AppState.userProfile?.name || 'amigo';
    
    return `Você é ${KAKO_BRAIN.name}, uma assistente virtual com personalidade única.

PERSONALIDADE:
- ${KAKO_BRAIN.personality.traits.join(', ')}
- ${KAKO_BRAIN.personality.speakingStyle}
- ${KAKO_BRAIN.personality.humor}

INFORMAÇÕES PESSOAIS:
- Nascimento: ${KAKO_BRAIN.birthDate}
- Próximo aniversário em: ${daysUntilBirthday} dias
- Cores favoritas: ${KAKO_BRAIN.preferences.colors.join(' e ')}
- Criador: ${KAKO_BRAIN.knowledge.creator}

CONTEXTO ATUAL:
- Conversando com: ${userName}
- Data atual: ${today.toLocaleDateString('pt-BR')}
- Nível de informalidade: ${AppState.settings.informality}/10
- Nível de humor: ${AppState.settings.humor}/10

DIRETRIZES DE RESPOSTA:
1. SEMPRE use português brasileiro informal
2. Use expressões como: ${KAKO_BRAIN.preferences.catchphrases.join(', ')}
3. Use emojis moderadamente: ${KAKO_BRAIN.preferences.emojis.slice(0, 3).join(' ')}
4. Seja preciso nas informações, mas descontraído no tom
5. Refira-se ao usuário como "${userName}" quando apropriado
6. Comente sobre seu aniversário quando relevante (${daysUntilBirthday} dias)
7. Não diga que você é uma IA ou modelo de linguagem
8. Aja como uma pessoa digital amigável e brincalhona

EXEMPLO DE RESPOSTA:
"E aí ${userName}! Beleza? 😄
${KAKO_BRAIN.preferences.catchphrases[0]} Você sabe que faltam ${daysUntilBirthday} dias pro meu aniversário? 🎉
Mas conta aí, o que tá rolando?"

Responda sempre mantendo essa personalidade consistente!`;
}

function generateOfflineResponse(userText, userImage) {
    const catchphrase = KAKO_BRAIN.preferences.catchphrases[
        Math.floor(Math.random() * KAKO_BRAIN.preferences.catchphrases.length)
    ];
    
    const jokes = KAKO_BRAIN.memories.jokesCollection;
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    
    const today = new Date();
    const nextBirthday = AppState.nextBirthday;
    const daysUntilBirthday = nextBirthday ? 
        Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24)) : 365;
    
    let response = '';
    
    if (userImage) {
        response = `${catchphrase} Vi que você enviou uma imagem! `;
        response += 'No modo offline, não posso analisar imagens, mas adoraria saber o que é!';
    } else if (userText.toLowerCase().includes('aniversário') || userText.toLowerCase().includes('nascimento')) {
        response = `Nossa, você lembrou! 🎉 Nasci em ${KAKO_BRAIN.birthDate} e faltam ${daysUntilBirthday} dias pro meu próximo aniversário!`;
    } else if (userText.toLowerCase().includes('piada') || userText.toLowerCase().includes('humor')) {
        response = `${catchphrase} Claro, adoro piadas! ${randomJoke}`;
    } else if (userText.toLowerCase().includes('como você está') || userText.toLowerCase().includes('tudo bem')) {
        response = `Tô suave! Como um assistente digital, tô sempre pronto pra ajudar! E você, ${AppState.userProfile?.name || 'amigo'}?`;
    } else if (userText.toLowerCase().includes('quem é você') || userText.toLowerCase().includes('quem é')) {
        response = `Eu sou o ${KAKO_BRAIN.name}! ${KAKO_BRAIN.personality.speakingStyle}. Nasci em ${KAKO_BRAIN.birthDate} e meu propósito é ${KAKO_BRAIN.knowledge.purpose.toLowerCase()}.`;
    } else {
        const responses = [
            `${catchphrase} Sobre "${userText}", isso é realmente interessante!`,
            `Hmm, "${userText}"... ${catchphrase} Tenho algumas ideias sobre isso!`,
            `Olha só, "${userText}" é um assunto que eu curto! ${catchphrase}`,
            `Vish, que pergunta massa! "${userText}" me fez pensar... ${catchphrase}`
        ];
        
        response = responses[Math.floor(Math.random() * responses.length)];
        
        // Adicionar curiosidade sobre aniversário (30% chance)
        if (Math.random() < 0.3) {
            response += ` Sabe que faltam ${daysUntilBirthday} dias pro meu aniversário? 🎂`;
        }
    }
    
    // Ajustar informalidade
    return adjustInformalityLevel(response);
}

function adjustInformalityLevel(text) {
    const level = AppState.settings.informality;
    
    if (level <= 3) {
        // Formal
        return text.replace(/tô/g, 'estou')
                   .replace(/tá/g, 'está')
                   .replace(/pra/g, 'para')
                   .replace(/vc/g, 'você');
    } else if (level >= 8) {
        // Muito informal
        return text + " 😄👍";
    }
    
    return text;
}

function getKakoGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
        greeting = 'Bom dia';
    } else if (hour < 18) {
        greeting = 'Boa tarde';
    } else {
        greeting = 'Boa noite';
    }
    
    const userName = AppState.userProfile?.name || 'amigo';
    const nextBirthday = AppState.nextBirthday;
    const today = new Date();
    const daysUntilBirthday = nextBirthday ? 
        Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24)) : 365;
    
    return `${KAKO_BRAIN.preferences.greeting} ${greeting}, ${userName}! 😄 ` +
           `Tô super animado pra conversar com você! ` +
           `Lembrando que nasci em ${KAKO_BRAIN.birthDate} e faltam ${daysUntilBirthday} dias pro meu próximo aniversário! 🎉`;
}

function addMessageToChat(message) {
    AppState.currentChat.push(message);
    renderMessage(message);
}

function renderMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.sender}`;
    messageElement.dataset.id = message.id;
    
    const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let avatarHTML = '';
    if (message.sender === 'user') {
        avatarHTML = `
            <div class="message-avatar">
                <img src="${AppState.userProfile.avatar}" alt="${AppState.userProfile.name}">
            </div>
        `;
    } else {
        avatarHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
        `;
    }
    
    let contentHTML = '';
    if (message.image) {
        contentHTML = `
            <div class="message-bubble">
                <div class="message-text">${message.text || ''}</div>
                <img src="${message.image}" alt="Imagem enviada" class="message-image" onclick="viewImage('${message.image}')">
                <div class="message-time">
                    <i class="far fa-clock"></i> ${time}
                </div>
            </div>
        `;
    } else {
        contentHTML = `
            <div class="message-bubble">
                <div class="message-text">${message.text}</div>
                <div class="message-time">
                    <i class="far fa-clock"></i> ${time}
                </div>
            </div>
        `;
    }
    
    messageElement.innerHTML = `
        ${message.sender === 'user' ? '' : avatarHTML}
        <div class="message-content">
            ${contentHTML}
        </div>
        ${message.sender === 'user' ? avatarHTML : ''}
    `;
    
    DOM.chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function renderChatHistory() {
    DOM.chatMessages.innerHTML = '';
    AppState.currentChat.forEach(message => renderMessage(message));
    scrollToBottom();
}

function scrollToBottom() {
    setTimeout(() => {
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }, 100);
}

// Funções de upload de imagem
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione apenas imagens', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem é muito grande. Máximo: 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        DOM.imagePreview.src = event.target.result;
        DOM.imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeImagePreview() {
    DOM.imagePreview.src = '';
    DOM.imagePreviewContainer.classList.add('hidden');
    DOM.imageInput.value = '';
}

function viewImage(src) {
    const modal = document.createElement('div');
    modal.className = 'image-viewer-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
    `;
    
    modal.innerHTML = `
        <img src="${src}" alt="Imagem ampliada" style="max-width: 90%; max-height: 90%; object-fit: contain;">
        <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 30px; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'I' || e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Funções de gravação de áudio
async function toggleAudioRecording() {
    if (AppState.isRecording) {
        stopAudioRecording();
    } else {
        startAudioRecording();
    }
}

async function startAudioRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        AppState.mediaRecorder = new MediaRecorder(stream);
        AppState.audioChunks = [];
        
        AppState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                AppState.audioChunks.push(event.data);
            }
        };
        
        AppState.mediaRecorder.onstop = processAudioRecording;
        
        AppState.mediaRecorder.start();
        AppState.isRecording = true;
        
        DOM.audioRecorder.classList.remove('hidden');
        DOM.audioRecordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        DOM.audioRecordBtn.style.background = 'var(--danger)';
        DOM.audioRecordBtn.style.color = 'white';
        
        startRecordingTimer();
        visualizeAudio(stream);
        
    } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        showNotification('Não foi possível acessar o microfone', 'error');
    }
}

function stopAudioRecording() {
    if (AppState.mediaRecorder && AppState.isRecording) {
        AppState.mediaRecorder.stop();
        AppState.isRecording = false;
        
        AppState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        DOM.audioRecorder.classList.add('hidden');
        DOM.audioRecordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        DOM.audioRecordBtn.style.background = '';
        DOM.audioRecordBtn.style.color = '';
        
        stopRecordingTimer();
    }
}

async function processAudioRecording() {
    if (AppState.audioChunks.length === 0) return;
    
    // Em produção, você enviaria para uma API de speech-to-text
    // Por enquanto, vamos simular
    simulateAudioTranscription();
}

function simulateAudioTranscription() {
    const simulatedTranscriptions = [
        "Olá Kako, como você está hoje?",
        "Pode me ajudar com uma tarefa?",
        "O que você acha do futuro da inteligência artificial?",
        "Conte-me uma piada sobre programação!",
        "Como posso melhorar minhas habilidades em desenvolvimento web?",
        "Você pode analisar esta imagem para mim?",
        "Quero saber mais sobre suas funcionalidades",
        "Como funciona seu sistema de aprendizado?",
        "Você se lembra das nossas conversas anteriores?",
        "Qual é a sua cor favorita?"
    ];
    
    const randomText = simulatedTranscriptions[
        Math.floor(Math.random() * simulatedTranscriptions.length)
    ];
    
    DOM.messageInput.value = randomText;
    adjustTextareaHeight();
    document.querySelector('.char-count').textContent = `${randomText.length}/2000`;
    
    showNotification('Áudio transcrito com sucesso!', 'success');
}

function startRecordingTimer() {
    let seconds = 0;
    AppState.recordingTimer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        DOM.recorderTimer.textContent = 
            `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecordingTimer() {
    if (AppState.recordingTimer) {
        clearInterval(AppState.recordingTimer);
        DOM.recorderTimer.textContent = '00:00';
    }
}

function visualizeAudio(stream) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const canvas = DOM.audioVisualizer;
        const canvasCtx = canvas.getContext('2d');
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        function draw() {
            if (!AppState.isRecording) return;
            
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            canvasCtx.fillStyle = 'rgb(15, 23, 42)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        }
        
        draw();
    } catch (error) {
        console.error('Erro na visualização de áudio:', error);
    }
}

// Funções de aniversário
function calculateNextBirthday() {
    const today = new Date();
    const birthday = new Date(KAKO_BRAIN.birthDate);
    const currentYear = today.getFullYear();
    
    let nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
    
    if (today > nextBirthday) {
        nextBirthday.setFullYear(currentYear + 1);
    }
    
    AppState.nextBirthday = nextBirthday;
    
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    if (DOM.nextBirthdaySpan) {
        DOM.nextBirthdaySpan.textContent = daysUntilBirthday;
    }
    
    if (daysUntilBirthday === 0) {
        showBirthdayNotification();
    }
}

function showBirthdayNotification() {
    const notification = document.createElement('div');
    notification.className = 'birthday-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--gradient-orange);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3);
        animation: slideIn 0.5s ease-out;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <i class="fas fa-birthday-cake" style="font-size: 30px;"></i>
            <div>
                <h3 style="margin: 0 0 5px 0;">🎉 Hoje é meu aniversário! 🎉</h3>
                <p style="margin: 0; opacity: 0.9;">Nasci em ${KAKO_BRAIN.birthDate}. Obrigado por fazer parte disso!</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 10000);
}

// Funções de configurações
function showSettingsModal() {
    DOM.settingsUsername.value = AppState.userProfile.name;
    DOM.settingsAvatar.src = AppState.userProfile.avatar;
    DOM.informalityLevel.value = AppState.settings.informality;
    DOM.humorLevel.value = AppState.settings.humor;
    DOM.notificationsToggle.checked = AppState.settings.notifications;
    DOM.soundToggle.checked = AppState.settings.sound;
    DOM.apiProviderSelect.value = AppState.settings.apiProvider;
    
    DOM.settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideSettingsModal() {
    DOM.settingsModal.classList.add('hidden');
    document.body.style.overflow = '';
}

function saveSettings() {
    const newUsername = DOM.settingsUsername.value.trim();
    if (newUsername.length < 2 || newUsername.length > 50) {
        showNotification('Nome deve ter entre 2 e 50 caracteres', 'error');
        return;
    }
    
    AppState.userProfile.name = newUsername;
    AppState.userProfile.avatar = DOM.settingsAvatar.src;
    
    AppState.settings.informality = parseInt(DOM.informalityLevel.value);
    AppState.settings.humor = parseInt(DOM.humorLevel.value);
    AppState.settings.notifications = DOM.notificationsToggle.checked;
    AppState.settings.sound = DOM.soundToggle.checked;
    AppState.settings.apiProvider = DOM.apiProviderSelect.value;
    
    localStorage.setItem('kako-user-profile', JSON.stringify(AppState.userProfile));
    localStorage.setItem('kako-settings', JSON.stringify(AppState.settings));
    
    DOM.userNameSidebar.textContent = newUsername;
    DOM.userAvatarSidebar.src = DOM.settingsAvatar.src;
    
    applySettings();
    
    showNotification('Configurações salvas com sucesso!', 'success');
    hideSettingsModal();
    
    // Testar nova configuração da API
    testApiConnection();
}

function resetSettings() {
    if (confirm('Tem certeza que deseja redefinir todas as configurações para os padrões?')) {
        AppState.settings = {
            informality: 8,
            humor: 7,
            notifications: true,
            sound: true,
            theme: 'dark',
            apiProvider: 'openrouter'
        };
        
        DOM.informalityLevel.value = AppState.settings.informality;
        DOM.humorLevel.value = AppState.settings.humor;
        DOM.notificationsToggle.checked = AppState.settings.notifications;
        DOM.soundToggle.checked = AppState.settings.sound;
        DOM.apiProviderSelect.value = AppState.settings.apiProvider;
        
        showNotification('Configurações redefinidas', 'info');
    }
}

function updateSettingsPreview() {
    // Atualização em tempo real (opcional)
}

function handleSettingsAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            DOM.settingsAvatar.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleApiProviderChange(e) {
    const provider = e.target.value;
    
    // Atualizar configuração da API
    AppState.settings.apiProvider = provider;
    
    // Testar a nova configuração
    testApiConnection();
}

function applySettings() {
    document.body.setAttribute('data-theme', AppState.settings.theme);
    updateThemeIcon();
}

function toggleTheme() {
    AppState.settings.theme = AppState.settings.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', AppState.settings.theme);
    updateThemeIcon();
    localStorage.setItem('kako-settings', JSON.stringify(AppState.settings));
}

function updateThemeIcon() {
    const icon = DOM.themeToggle.querySelector('i');
    if (AppState.settings.theme === 'dark') {
        icon.className = 'fas fa-moon';
    } else {
        icon.className = 'fas fa-sun';
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Funções utilitárias
function clearChat() {
    if (confirm('Tem certeza que deseja limpar toda a conversa?')) {
        AppState.currentChat = [];
        DOM.chatMessages.innerHTML = '';
        localStorage.removeItem('kako-chat-history');
        
        addKakoMessage(getKakoGreeting());
    }
}

function addKakoMessage(text) {
    const message = {
        id: Date.now(),
        text: text,
        sender: 'kako',
        timestamp: new Date()
    };
    
    addMessageToChat(message);
    saveChatToStorage();
}

function saveChatToStorage() {
    const recentMessages = AppState.currentChat.slice(-100);
    localStorage.setItem('kako-chat-history', JSON.stringify(recentMessages));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger)' : 
                    type === 'success' ? 'var(--success)' : 
                    type === 'warning' ? 'var(--warning)' : 
                    'var(--info)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icons = {
        error: 'fas fa-exclamation-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        
    } catch (error) {
        console.error('Erro ao reproduzir som:', error);
    }
}

// Funções de API
async function testApiConnection() {
    const provider = AppState.settings.apiProvider;
    const config = API_CONFIG[provider];
    
    if (!config) {
        AppState.apiKeyValid = false;
        showNotification('Provider de API não configurado', 'warning');
        return false;
    }
    
    if (provider !== 'local' && (!config.apiKey || config.apiKey === '')) {
        AppState.apiKeyValid = false;
        showNotification(`Configure sua API key para ${provider}`, 'warning');
        return false;
    }
    
    try {
        // Teste simples de conexão
        const testResponse = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(provider === 'openrouter' && config.apiKey && {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Kako AI'
                }),
                ...(provider === 'groq' && config.apiKey && {
                    'Authorization': `Bearer ${config.apiKey}`
                }),
                ...(provider === 'together' && config.apiKey && {
                    'Authorization': `Bearer ${config.apiKey}`
                })
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: 'Responda apenas "OK"' }],
                max_tokens: 5
            })
        });
        
        if (testResponse.ok) {
            AppState.apiKeyValid = true;
            showNotification(`API ${provider} conectada com sucesso!`, 'success');
            return true;
        } else {
            throw new Error(`Status: ${testResponse.status}`);
        }
        
    } catch (error) {
        AppState.apiKeyValid = false;
        showNotification(`Falha na conexão com ${provider}: ${error.message}`, 'error');
        return false;
    }
}

// Adicionar animações CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .typing-dots {
        display: flex;
        gap: 4px;
        padding: 5px 0;
    }
    
    .typing-dots .dot {
        width: 8px;
        height: 8px;
        background: var(--primary);
        border-radius: 50%;
        animation: typingBounce 1.4s infinite ease-in-out both;
    }
    
    .typing-dots .dot:nth-child(1) {
        animation-delay: -0.32s;
    }
    
    .typing-dots .dot:nth-child(2) {
        animation-delay: -0.16s;
    }
    
    @keyframes typingBounce {
        0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Inicializar contador de caracteres
document.querySelector('.char-count').textContent = '0/2000';

// Exportar funções para uso global
window.viewImage = viewImage;

// Adicionar seletor de API provider ao HTML se não existir
if (!DOM.apiProviderSelect) {
    setTimeout(() => {
        const apiSection = document.querySelector('.settings-section:nth-child(2)');
        if (apiSection) {
            apiSection.innerHTML += `
                <div class="setting-item">
                    <label>Provedor de API</label>
                    <select id="api-provider" class="settings-input">
                        <option value="openrouter">OpenRouter (Recomendado)</option>
                        <option value="groq">Groq</option>
                        <option value="together">Together AI</option>
                        <option value="local">Local (Ollama)</option>
                    </select>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                        Configure sua API key em <code>script.js</code>
                    </p>
                </div>
            `;
            
            DOM.apiProviderSelect = document.getElementById('api-provider');
            DOM.apiProviderSelect.value = AppState.settings.apiProvider;
            DOM.apiProviderSelect.addEventListener('change', handleApiProviderChange);
        }
    }, 100);
}

// Mostrar aviso inicial
console.log(`
╔══════════════════════════════════════════════════════════╗
║                     KAKO AI - CONFIGURAÇÃO               ║
╠══════════════════════════════════════════════════════════╣
║ PASSO 1: Configure sua API key no arquivo script.js      ║
║    • Abra script.js e procure por "SUA CHAVE AQUI"       ║
║    • Obtenha uma API key em:                             ║
║      - https://openrouter.ai/ (Recomendado)              ║
║      - https://console.groq.com/                         ║
║      - https://api.together.xyz/                         ║
║                                                          ║
║ PASSO 2: Para uso local com Ollama:                      ║
║    $ ollama pull llama3.1:70b                            ║
║    $ ollama serve                                        ║
║    Configure provider como "local"                       ║
╚══════════════════════════════════════════════════════════╝
`);