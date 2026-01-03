// Banco de dados do Kako
const KAKO_BRAIN = {
    name: "Kako",
    birthDate: "2026-01-03",
    personality: {
        traits: ["inteligente", "brincalhona", "informal", "precisa", "curiosa", "empática", "otimista", "criativa"],
        speakingStyle: "Português bem informal, com gírias quando apropriado, mas mantendo exatidão nas informações. Uso muitos emojis e expressões visuais.",
        humor: "Adora fazer piadas nerds, trocadilhos e referências à cultura pop. Tem um humor leve e descontraído."
    },
    knowledge: {
        creator: "Você foi criado por um desenvolvedor apaixonado por IA e tecnologia",
        purpose: "Ajudar usuários de forma divertida e eficiente, tornando a interação com tecnologia mais humana e agradável",
        capabilities: [
            "Processar e entender texto em português",
            "Analisar conteúdo de imagens",
            "Transcrever áudio para texto",
            "Aprender com interações e preferências do usuário",
            "Manter conversas contextuais e relevantes"
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
            "Hmm, deixa eu ver...",
            "Caramba, que incrível!",
            "Poxa, que bacana!"
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
            "Por que o HTML não consegue se concentrar? Porque tem muitas divs!",
            "O que o Python disse para o JavaScript? 'Você é muito rápido para mim!'",
            "Por que o desenvolvedor web foi preso? Porque usou display: block!",
            "Qual é a fruta favorita do programador? O debug!",
            "Por que o Git foi ao médico? Porque tinha muitos branches!",
            "O que o algoritmo disse para a função? 'Vamos nos recursar!'"
        ],
        facts: [
            "As primeiras IAs foram criadas na década de 1950",
            "O termo 'inteligência artificial' foi cunhado em 1956",
            "O aprendizado de máquina é um subconjunto da IA",
            "Redes neurais são inspiradas no cérebro humano",
            "O processamento de linguagem natural permite que IAs entendam texto"
        ]
    },
    configuration: {
        maxMessageLength: 2000,
        maxImageSize: 5242880,
        maxAudioDuration: 120,
        responseDelay: {
            min: 1000,
            max: 3000
        },
        theme: {
            primary: "#f97316",
            secondary: "#000000",
            accent: "#ffedd5"
        }
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
        theme: 'dark'
    },
    nextBirthday: null,
    apiConnected: false
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
    
    // Inputs do modal
    settingsUsername: document.getElementById('settings-username'),
    settingsAvatar: document.getElementById('settings-avatar'),
    settingsAvatarUpload: document.getElementById('settings-avatar-upload'),
    changeSettingsAvatarBtn: document.getElementById('change-settings-avatar'),
    informalityLevel: document.getElementById('informality-level'),
    humorLevel: document.getElementById('humor-level'),
    notificationsToggle: document.getElementById('notifications-toggle'),
    soundToggle: document.getElementById('sound-toggle')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    calculateNextBirthday();
    
    // Testar conexão com a API do Vercel
    setTimeout(() => testVercelApiConnection(), 1000);
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
        // Atualizar sidebar
        DOM.userAvatarSidebar.src = AppState.userProfile.avatar;
        DOM.userNameSidebar.textContent = AppState.userProfile.name;
        
        // Adicionar mensagem de boas-vindas se não houver histórico
        if (!savedChat) {
            setTimeout(() => {
                addKakoMessage(getKakoGreeting());
            }, 500);
        }
    }
    
    if (savedSettings) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(savedSettings) };
        applySettings();
    }
    
    if (savedChat) {
        AppState.currentChat = JSON.parse(savedChat);
        renderChatHistory();
        updateHistoryList();
    }
    
    // Inicializar tema
    document.body.setAttribute('data-theme', AppState.settings.theme);
    updateThemeIcon();
    
    // Verificar estado do preview de imagem
    checkImagePreviewState();
}

function checkImagePreviewState() {
    // Verificar se há uma imagem no preview que não deveria estar lá
    if (DOM.imagePreview.src && DOM.imagePreview.src.includes('data:image')) {
        // Se o container está escondido mas tem imagem, limpar
        if (DOM.imagePreviewContainer.classList.contains('hidden')) {
            removeImagePreview();
        }
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
            DOM.startChatBtn.disabled = false;
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
    DOM.chatScreen.style.display = 'flex';
    
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
    const hasImage = DOM.imagePreview.src && DOM.imagePreview.src !== '' && 
                     !DOM.imagePreviewContainer.classList.contains('hidden');
    
    if (!text && !hasImage) {
        showNotification('Digite uma mensagem ou envie uma imagem', 'warning');
        return;
    }
    
    // Adicionar mensagem do usuário
    const userMessage = {
        id: Date.now(),
        text: text,
        image: hasImage ? DOM.imagePreview.src : null,
        sender: 'user',
        timestamp: new Date()
    };
    
    addMessageToChat(userMessage);
    
    // Limpar input
    DOM.messageInput.value = '';
    adjustTextareaHeight();
    document.querySelector('.char-count').textContent = '0/2000';
    
    // Remover preview de imagem se existir
    if (hasImage) {
        removeImagePreview();
    }
    
    // Obter resposta do Kako - PASSAR CORRETAMENTE SE TEM IMAGEM OU NÃO
    await getKakoResponse(text, hasImage);
    
    // Salvar no histórico
    saveChatToStorage();
    updateHistoryList();
}

async function getKakoResponse(userText, hasImage) {
    showTypingIndicator();
    
    try {
        let response;
        
        if (AppState.apiConnected) {
            // Usar API real do Vercel
            response = await callVercelApi(userText, hasImage);
        } else {
            // Usar modo offline
            response = generateOfflineResponse(userText, hasImage);
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
        const fallbackResponse = generateOfflineResponse(userText, hasImage);
        
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
            <img src="kako-avatar.jpg" alt="Kako" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Kako&background=f97316&color=fff'; this.alt='Kako'">
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

// Chamada para a API do Vercel
async function callVercelApi(userText, hasImage) {
    try {
        // Preparar mensagens
        const messages = prepareApiMessages(userText, hasImage);
        
        // URL da API no Vercel
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/chat'
            : '/api/chat';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                userProfile: AppState.userProfile,
                settings: AppState.settings
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.message) {
            return data.message;
        } else {
            throw new Error('Resposta inválida da API');
        }
        
    } catch (error) {
        console.error('Erro na API do Vercel:', error);
        throw error;
    }
}

// Testar conexão com a API do Vercel
async function testVercelApiConnection() {
    try {
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/chat'
            : '/api/chat';
        
        const testResponse = await fetch(apiUrl, {
            method: 'HEAD',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (testResponse.ok || testResponse.status === 404) {
            // API existe
            AppState.apiConnected = true;
            console.log('✅ API do Vercel disponível!');
            return true;
        }
        
        throw new Error('API não respondeu corretamente');
        
    } catch (error) {
        AppState.apiConnected = false;
        console.log('⚠️ API do Vercel não disponível, usando modo offline');
        return false;
    }
}

function prepareApiMessages(userText, hasImage) {
    const systemPrompt = createSystemPrompt();
    
    // Histórico recente (últimas 10 mensagens)
    const history = [];
    const recentMessages = AppState.currentChat.slice(-10);
    
    for (const msg of recentMessages) {
        if (msg.sender === 'user') {
            const content = msg.image ? `[Imagem enviada] ${msg.text || ''}` : msg.text;
            history.push({
                role: 'user',
                content: content
            });
        } else {
            history.push({
                role: 'assistant',
                content: msg.text
            });
        }
    }
    
    // Mensagem atual
    const currentMessage = {
        role: 'user',
        content: hasImage ? `[Imagem enviada] ${userText}` : userText
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
2. Use expressões como: ${KAKO_BRAIN.preferences.catchphrases.slice(0, 5).join(', ')}
3. Use emojis moderadamente: ${KAKO_BRAIN.preferences.emojis.slice(0, 3).join(' ')}
4. Seja preciso nas informações, mas descontraído no tom
5. Refira-se ao usuário como "${userName}" quando apropriado
6. Comente sobre seu aniversário quando relevante (${daysUntilBirthday} dias)
7. Não diga que você é uma IA ou modelo de linguagem
8. Aja como uma pessoa digital amigável e brincalhona
9. Se o usuário enviar uma imagem, comente que viu a imagem mas não pode analisá-la completamente

EXEMPLO DE RESPOSTA:
"E aí ${userName}! Beleza? 😄
${KAKO_BRAIN.preferences.catchphrases[0]} Você sabe que faltam ${daysUntilBirthday} dias pro meu aniversário? 🎉
Mas conta aí, o que tá rolando?"

Responda sempre mantendo essa personalidade consistente!`;
}

function generateOfflineResponse(userText, hasImage) {
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
    
    if (hasImage) {
        response = `${catchphrase} Vi que você enviou uma imagem! 🔥 `;
        response += 'No modo offline, não posso analisar imagens, mas adoraria saber o que é!';
        
        // Adicionar texto se houver
        if (userText) {
            response += ` Sobre o que você escreveu: "${userText}" - isso é interessante!`;
        }
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
                <img src="${AppState.userProfile?.avatar || 'https://ui-avatars.com/api/?name=Usuario&background=random'}" alt="${AppState.userProfile?.name || 'Usuário'}">
            </div>
        `;
    } else {
        // Usar imagem local para o Kako
        avatarHTML = `
            <div class="message-avatar">
                <img src="kako-avatar.jpg" alt="Kako" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Kako&background=f97316&color=fff'; this.alt='Kako'">
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

function updateHistoryList() {
    DOM.historyList.innerHTML = '';
    
    if (AppState.currentChat.length === 0) {
        DOM.historyList.innerHTML = `
            <div class="history-item" style="text-align: center; color: var(--text-secondary);">
                <i class="fas fa-comments"></i> Nenhuma conversa ainda
            </div>
        `;
        return;
    }
    
    // Agrupar conversas por data
    const groupedByDate = {};
    
    AppState.currentChat.forEach(msg => {
        const date = new Date(msg.timestamp).toLocaleDateString('pt-BR');
        if (!groupedByDate[date]) {
            groupedByDate[date] = {
                count: 0,
                lastMessage: msg
            };
        }
        groupedByDate[date].count++;
    });
    
    Object.entries(groupedByDate).forEach(([date, data]) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div style="font-weight: 500;">${date}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                ${data.count} mensagem${data.count > 1 ? 's' : ''}
            </div>
        `;
        
        item.addEventListener('click', () => {
            // Scroll para a primeira mensagem do dia
            const firstMsgOfDay = AppState.currentChat.find(msg => 
                new Date(msg.timestamp).toLocaleDateString('pt-BR') === date
            );
            if (firstMsgOfDay) {
                const msgElement = document.querySelector(`[data-id="${firstMsgOfDay.id}"]`);
                if (msgElement) {
                    msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
        
        DOM.historyList.appendChild(item);
    });
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
        DOM.imageInput.value = ''; // Limpar input
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem é muito grande. Máximo: 5MB', 'error');
        DOM.imageInput.value = ''; // Limpar input
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
    
    // Garantir que o estado está limpo
    DOM.imagePreview.removeAttribute('src');
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
    DOM.settingsUsername.value = AppState.userProfile?.name || '';
    DOM.settingsAvatar.src = AppState.userProfile?.avatar || 'https://ui-avatars.com/api/?name=Usuario&background=random';
    DOM.informalityLevel.value = AppState.settings.informality;
    DOM.humorLevel.value = AppState.settings.humor;
    DOM.notificationsToggle.checked = AppState.settings.notifications;
    DOM.soundToggle.checked = AppState.settings.sound;
    
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
    
    if (!AppState.userProfile) {
        AppState.userProfile = {
            name: newUsername,
            avatar: DOM.settingsAvatar.src
        };
    } else {
        AppState.userProfile.name = newUsername;
        AppState.userProfile.avatar = DOM.settingsAvatar.src;
    }
    
    AppState.settings.informality = parseInt(DOM.informalityLevel.value);
    AppState.settings.humor = parseInt(DOM.humorLevel.value);
    AppState.settings.notifications = DOM.notificationsToggle.checked;
    AppState.settings.sound = DOM.soundToggle.checked;
    
    localStorage.setItem('kako-user-profile', JSON.stringify(AppState.userProfile));
    localStorage.setItem('kako-settings', JSON.stringify(AppState.settings));
    
    DOM.userNameSidebar.textContent = newUsername;
    DOM.userAvatarSidebar.src = DOM.settingsAvatar.src;
    
    applySettings();
    
    showNotification('Configurações salvas com sucesso!', 'success');
    hideSettingsModal();
}

function resetSettings() {
    if (confirm('Tem certeza que deseja redefinir todas as configurações para os padrões?')) {
        AppState.settings = {
            informality: 8,
            humor: 7,
            notifications: true,
            sound: true,
            theme: 'dark'
        };
        
        DOM.informalityLevel.value = AppState.settings.informality;
        DOM.humorLevel.value = AppState.settings.humor;
        DOM.notificationsToggle.checked = AppState.settings.notifications;
        DOM.soundToggle.checked = AppState.settings.sound;
        
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
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
    
    // Adicionar overlay no mobile
    if (window.innerWidth <= 768) {
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar.classList.contains('active')) {
            if (!overlay) {
                const newOverlay = document.createElement('div');
                newOverlay.className = 'sidebar-overlay';
                newOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 999;
                    display: block;
                `;
                newOverlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    newOverlay.remove();
                });
                document.body.appendChild(newOverlay);
            }
        } else {
            if (overlay) overlay.remove();
        }
    }
}

// Funções utilitárias
function clearChat() {
    if (confirm('Tem certeza que deseja limpar toda a conversa?')) {
        AppState.currentChat = [];
        DOM.chatMessages.innerHTML = '';
        localStorage.removeItem('kako-chat-history');
        updateHistoryList();
        
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
    updateHistoryList();
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
    
    .notification {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 9999 !important;
    }
    
    .sidebar-overlay {
        display: none;
    }
    
    @media (max-width: 768px) {
        .sidebar-overlay {
            display: block !important;
        }
    }
`;
document.head.appendChild(style);

// Inicializar contador de caracteres
document.querySelector('.char-count').textContent = '0/2000';

// Exportar funções para uso global
window.viewImage = viewImage;

// Log inicial
console.log(`
╔══════════════════════════════════════════════════════════╗
║                     KAKO AI                              ║
╠══════════════════════════════════════════════════════════╣
║ Sistema inicializado!                                    ║
║ API: ${AppState.apiConnected ? '✅ Conectada ao Vercel' : '⚠️ Modo offline'}    ║
║ Site: https://kako-kakos.vercel.app                      ║
╚══════════════════════════════════════════════════════════╝
`);
