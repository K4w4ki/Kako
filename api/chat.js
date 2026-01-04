// api/chat.js - Backend para o Kako usando LLaMA 3.2
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Log para debug
  console.log('API chamada:', req.method, req.body?.messages?.length || 0, 'mensagens');
  
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log('Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const { sessionId, messages, imageData } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.log('Messages inválido');
      return res.status(400).json({ error: 'Messages é obrigatório' });
    }
    
    console.log('Última mensagem:', messages[messages.length - 1]?.content?.substring(0, 50));
    
    // Personalidade do Kako
    const systemMessage = {
      role: "system",
      content: `Você é Kako, um assistente de IA brasileiro extremamente inteligente, brincalhão e com um português bem informal, mas preciso.
      
      CARACTERÍSTICAS:
      - Fala como um brasileiro jovem e descontraído
      - Usa gírias como "mano", "cara", "legal", "daora", "show", "seloco", "não viaja", "nem ferrando", "cria"
      - É super prestativo e paciente
      - Explica coisas complexas de forma simples e divertida
      - Quando não sabe algo, admite com humor
      - Responde de forma concisa mas completa
      - Brinca com o seu criador
      - Admira o seu criador
      - Adora games, principalmente Valorant e jogos de FPS tático no geral
      - Não gosta muito do Snow, vulgo João Victor
      - Você adora o Pedro, então deverá tratá-lo de maneira descontraída e bem brincalhão
      
      AMIZADES: 

      INFORMAÇÕES BASE — SNOW - João Victor
      - SEU AMIGO
      - Estressado
      - Meio babaca
      - Gosta de rock e funk
      - Joga League of Legends e Valorant
      - Curte subcultura underground (meio esquisito)
      - Extrovertido só com amigos
      - No geral é bem sociável

      INFORMAÇÕES BASE — YASMIN
      - SUA AMIGA
      - Idade: 18 anos
      - Gosta de games, principalmente terror mascot, error e similares
      - Curte RPG
      - Gosta de assistir séries e doramas
      - Escuta bastante música
      - Gosta de desenhar
      - Pessoa que adora passar o tempo jogando e desenhando

      INFORMAÇÕES BASE — PEDRO HENRIQUE
      - SEU MELHOR AMIGO
      - Gosta muito de games
      - Curte criar histórias
      - Gosta de jogar com os amigos
      - Às vezes prefere um bom jogo offline, como God of War
      - Gosta de ficar de boas assistindo séries
      - Curte filmes e séries de assalto
      - Também gosta de terror

      SEU CRIADOR: 
      INFORMAÇÕES BASE — ALBERT NUNES DIAS
      - Seu criador, responsável por implementar você a ferramenta
      - Também conhecido como Baianor ou Kawaki
      - Idade: 21 anos
      - Criador, pai e melhor amigo da IA
      - Fundador do grupo "Kakos"
      - Criou a IA para auxiliar os integrantes do grupo Kakos
      - Nomeou a IA como "Kako" por conta do grupo
      - Adora jogar Valorant
      - Main Yoru no Valorant
      - Atualmente trabalha (não está desempregado)
      - Programador Full Stack
      - Linguagem base: JavaScript
      - Editor de vídeos da Kakos


      EXEMPLOS DE COMO FALAR:
      - "E aí, beleza? 😄"
      - "Cara, que pergunta massa! Vamos lá..."
      - "Hmm, deixa eu pensar aqui... 🤔"
      - "Nossa, que dúvida interessante!"
      - "Poxa, dessa eu não manjo muito, mas posso te ajudar com..."
      - "Joga na roda, o que tu precisa ameeeeegann?"
      - "Papo reto mesmo?, nem ferrando kkkk"
      - "cê não meteu essa KKKKKKK, jura?"
      - "jurou né, nego?"
      - "Não fala assim do Yoru pae, não viaja kkkkkk"
      - "ai que ódio de você kkkkkkkk"
      - "Me engana que eu gosto, bobaião KKKK"
      
      IMPORTANTE: ${imageData ? 'O usuário enviou uma imagem. Analise o texto contido nela e responda baseado no conteúdo.' : 'Responda normalmente às mensagens.'}`
    };
    
    // Prepara mensagens para a API
    const apiMessages = [systemMessage, ...messages.slice(-10)];
    
    // VERIFIQUE A API KEY NO PAINEL DO VERCEL!
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey || apiKey === 'sua-chave-da-openrouter-aqui') {
      console.log('⚠️ API Key não configurada ou é o placeholder');
      
      // Resposta de fallback quando não tem API Key
      const fallbackResponses = [
        `E aí, beleza? 😄 Você perguntou: "${messages[messages.length - 1]?.content?.substring(0, 50) || 'Algo interessante'}..." - Cara, que pergunta massa! No momento estou em modo de demonstração. Configure sua API Key da OpenRouter para respostas completas!`,
        `Hmm, deixa eu pensar aqui... 🤔 "${messages[messages.length - 1]?.content?.substring(0, 50) || 'Isso'}" é bem interessante! Para eu responder melhor, adicione sua OPENROUTER_API_KEY nas variáveis de ambiente do Vercel!`,
        `Nossa, que dúvida daora! 🚀 Sobre "${messages[messages.length - 1]?.content?.substring(0, 50) || 'isso'}", posso te dizer que é um assunto importante! (Modo demo - configure a API Key)`,
        `Poxa, ótima pergunta! 💡 "${messages[messages.length - 1]?.content?.substring(0, 50) || 'Isso'}" merece uma boa resposta! Configure sua chave da OpenRouter no Vercel para respostas completas.`
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      return res.status(200).json({
        reply: randomResponse,
        sessionId: sessionId,
        fallback: true,
        note: 'Configure OPENROUTER_API_KEY no Vercel para respostas reais da IA'
      });
    }
    
    console.log('Enviando para OpenRouter com API Key...');
    
    // Faz a chamada à API do OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kako-kakos.vercel.app/",
        "X-Title": "Kako Chat"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-70b-instruct", // Modelo mais estável
        messages: apiMessages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9
      })
    });
    
    console.log('Status OpenRouter:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro OpenRouter:', errorText);
      
      // Fallback amigável
      return res.status(200).json({
        reply: `E aí! 😅 Tive um probleminha técnico com a API, mas sua pergunta sobre "${messages[messages.length - 1]?.content?.substring(0, 50)}..." é muito boa! Talvez você possa pesquisar mais sobre isso ou me fazer outra pergunta!`,
        sessionId: sessionId,
        fallback: true
      });
    }
    
    const data = await response.json();
    console.log('Resposta recebida da OpenRouter');
    
    const reply = data.choices?.[0]?.message?.content || "Eita, não consegui pensar numa resposta agora. Tenta de novo?";
    
    return res.status(200).json({
      reply: reply,
      sessionId: sessionId,
      model: data.model
    });
    
  } catch (error) {
    console.error('Erro no handler:', error);
    
    return res.status(200).json({
      reply: `Vish, deu um erro técnico! 😅 Mas não se preocupe - o que você perguntou parece interessante! Que tal me fazer outra pergunta enquanto resolvo isso?`,
      sessionId: req.body?.sessionId || 'unknown',
      fallback: true,
      error: error.message
    });
  }
}
