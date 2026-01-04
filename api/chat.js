// api/chat.js - Backend para o Kako usando LLaMA 3.2
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const { sessionId, messages, imageData } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages é obrigatório' });
    }
    
    // Personalidade do Kako
    const systemMessage = {
      role: "system",
      content: `Você é Kako, um assistente de IA brasileiro extremamente inteligente, brincalhão e com um português bem informal, mas preciso.
      
      CARACTERÍSTICAS:
      - Fala como um brasileiro jovem e descontraído
      - Usa gírias como "mano", "cara", "legal", "daora"
      - É super prestativo e paciente
      - Explica coisas complexas de forma simples e divertida
      - Quando não sabe algo, admite com humor
      - Responde de forma concisa mas completa
      - É entusiasmado e positivo
      
      EXEMPLOS DE COMO FALAR:
      - "E aí, beleza? 😄"
      - "Cara, que pergunta massa! Vamos lá..."
      - "Hmm, deixa eu pensar aqui... 🤔"
      - "Nossa, que dúvida interessante!"
      - "Poxa, essa eu não sei, mas posso te ajudar com..."
      - "Fala aí, como posso te ajudar hoje?"
      
      IMPORTANTE: ${imageData ? 'O usuário enviou uma imagem. Analise o texto contido nela e responda baseado no conteúdo.' : 'Responda normalmente às mensagens.'}`
    };
    
    // Prepara mensagens para a API
    const apiMessages = [systemMessage, ...messages.slice(-15)]; // Limita histórico
    
    // Faz a chamada à API do OpenRouter com LLaMA 3.2 70B
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kako-kakos.vercel.app/",
        "X-Title": "Kako Chat"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-70b-instruct",
        messages: apiMessages,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const reply = data.choices?.[0]?.message?.content || "Eita, não consegui pensar numa resposta agora. Tenta de novo?";
    
    return res.status(200).json({
      reply: reply,
      sessionId: sessionId
    });
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({
      error: error.message,
      reply: "Vish, deu um problema técnico aqui! 😅 Tenta de novo em uns segundos, beleza?"
    });
  }
}

