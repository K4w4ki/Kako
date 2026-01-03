// /api/chat.js
export default async function handler(req, res) {
    // Configurar CORS
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
        const { messages, userProfile, settings } = req.body;

        // Sua API key do Vercel Environment Variables
        const API_KEY = process.env.OPENROUTER_API_KEY || process.env.LLAMA_API_KEY;
        
        if (!API_KEY) {
            console.log('API key não configurada');
            return res.status(200).json({ 
                success: false, 
                error: 'API não configurada',
                fallback: true
            });
        }

        // Configurações da API (OpenRouter ou similar)
        const API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
        const MODEL = 'meta-llama/llama-3-70b-instruct';

        console.log('Enviando para API:', {
            model: MODEL,
            messagesCount: messages.length
        });

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://kako-kakos.vercel.app',
                'X-Title': 'Kako AI'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                max_tokens: 800,
                temperature: 0.7 + (settings?.humor || 7) * 0.02,
                top_p: 0.9,
                frequency_penalty: 0.2,
                presence_penalty: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro da API:', response.status, errorText);
            return res.status(200).json({
                success: false,
                error: `Erro da API: ${response.status}`,
                fallback: true
            });
        }

        const data = await response.json();
        console.log('Resposta da API recebida');
        
        const message = data.choices?.[0]?.message?.content || 
                       data.choices?.[0]?.text || 
                       'Ops, não consegui pensar numa resposta agora. Tenta de novo? 😅';

        return res.status(200).json({
            success: true,
            message: message
        });

    } catch (error) {
        console.error('Erro na API do Vercel:', error);
        return res.status(200).json({
            success: false,
            error: error.message,
            fallback: true
        });
    }
}