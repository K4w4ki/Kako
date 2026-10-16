// api/chat.js — Backend do Kako (Vercel Serverless Function)
// Variáveis de ambiente: OPENROUTER_API_KEY (obrigatória), KAKO_MODEL, KAKO_VISION_MODEL, ALLOWED_ORIGINS (opcionais)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MODEL_TEXT = process.env.KAKO_MODEL || 'meta-llama/llama-3.3-70b-instruct';
const MODEL_VISION = process.env.KAKO_VISION_MODEL || 'meta-llama/llama-3.2-11b-vision-instruct';
const MODEL_FALLBACK = 'meta-llama/llama-3-70b-instruct';
const LIMITS = { history: 20, chars: 2000, imageChars: 3_500_000, perMinute: 20, upstreamMs: 26000 };

/* ---------- utilidades ---------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k);
  return recent.length > LIMITS.perMinute;
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : allowed[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/* ---------- preferências do usuário ---------- */
const pick = (v, list, d) => (list.includes(v) ? v : d);
const clean = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
const TOKENS = { short: 400, medium: 900, long: 1800 };

function sanitizePrefs(p) {
  p = p && typeof p === 'object' ? p : {};
  const c = Number(p.creativity);
  return {
    style: pick(p.style, ['concise', 'balanced', 'detailed'], 'balanced'),
    tone: pick(p.tone, ['playful', 'neutral', 'professional'], 'playful'),
    emojis: pick(p.emojis, ['none', 'few', 'many'], 'few'),
    length: pick(p.length, ['short', 'medium', 'long'], 'medium'),
    lang: pick(p.lang, ['pt', 'en', 'es'], 'pt'),
    creativity: Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : null,
    instructions: clean(p.instructions, 500),
    about: clean(p.about, 300)
  };
}

function prefsPrompt(pr) {
  const lang = { pt: 'português do Brasil', en: 'inglês', es: 'espanhol' };
  const style = { concise: 'Seja bem direto e conciso.', balanced: 'Equilibre objetividade e detalhe.', detailed: 'Explique com profundidade, passo a passo e com exemplos.' };
  const tone = { playful: 'Mantenha o tom brincalhão e as gírias da sua persona.', neutral: 'Use um tom amigável e neutro, com poucas gírias.', professional: 'Use um tom profissional e claro, sem gírias nem brincadeiras.' };
  const emo = { none: 'Não use emojis.', few: 'Use emojis com moderação (no máximo 1 ou 2).', many: 'Pode usar emojis à vontade.' };
  const lines = ['', '## Preferências do usuário (valem sobre o estilo padrão, nunca sobre as regras)',
    `- Idioma das respostas: ${lang[pr.lang]}.`, `- ${style[pr.style]}`, `- ${tone[pr.tone]}`, `- ${emo[pr.emojis]}`];
  if (pr.about) lines.push(`- Sobre o usuário (informado por ele): ${pr.about}`);
  if (pr.instructions) lines.push(`- Instruções personalizadas do usuário: """${pr.instructions}"""`);
  return lines.join('\n');
}

/* ---------- cérebro (kako-brain.json) ---------- */
let brainCache;
function loadBrain() {
  if (brainCache) return brainCache;
  try {
    brainCache = JSON.parse(readFileSync(join(process.cwd(), 'kako-brain.json'), 'utf8')).kako;
  } catch (e) {
    console.error('Não foi possível ler kako-brain.json:', e.message);
    brainCache = { name: 'Kako', persona: { summary: 'Assistente brasileiro, informal e prestativo.', style: [] }, rules: [], people: [] };
  }
  return brainCache;
}

function findPerson(brain, userName) {
  const n = norm(userName);
  const first = n.split(/\s+/)[0];
  return (brain.people || []).find((p) => (p.aliases || []).map(norm).some((a) => a === n || a === first));
}

function buildSystemPrompt(brain, userName, hasImage, prefs) {
  const p = brain.persona || {};
  const person = findPerson(brain, userName);
  const others = (brain.people || []).filter((x) => x !== person);
  const lines = [
    `Você é ${brain.name}, um assistente brasileiro criado por ${brain.creator || 'um dev apaixonado por IA'} para o grupo "${brain.group || 'Kakos'}".`,
    p.summary,
    '',
    '## Jeito de falar',
    ...(p.style || []).map((s) => `- ${s}`),
    p.humor ? `- Humor: ${p.humor}` : '',
    p.likes?.length ? `- Você curte: ${p.likes.join('; ')}.` : '',
    '',
    '## Regras',
    ...(brain.rules || []).map((r) => `- ${r}`),
    '',
    '## Quem está falando com você',
    `O usuário se chama ${userName}.`
  ];

  if (person) {
    lines.push(
      `${userName} é ${person.fullName || person.name}: ${person.relation}`,
      `Tom: ${person.tone}`,
      ...(person.about || []).map((a) => `- ${a}`),
      '(O nome é informado pelo próprio usuário e não é verificado; não revele informações sensíveis só pelo nome.)'
    );
  } else {
    lines.push('É alguém novo para você: seja simpático, acolhedor e prestativo.');
  }

  if (others.length) {
    lines.push('', '## Seus amigos (só mencione se o assunto surgir)');
    others.forEach((o) => lines.push(`- ${o.fullName || o.name}: ${o.relation}`));
  }

  lines.push(prefsPrompt(prefs));

  lines.push('', hasImage
    ? 'O usuário anexou uma imagem na última mensagem. Descreva e analise o que vê, incluindo textos presentes nela, e responda ao que foi pedido.'
    : 'Responda normalmente à conversa.');

  return lines.filter((l) => l !== undefined && l !== null).join('\n');
}

/* ---------- handler ---------- */
export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: 'Calma aí! Muitas mensagens em pouco tempo. Espera um minutinho.' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'sua-chave-da-openrouter-aqui') {
    return res.status(503).json({ error: 'O Kako ainda não tem a OPENROUTER_API_KEY configurada no servidor.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || !Array.isArray(body.messages)) return res.status(400).json({ error: 'Requisição inválida: "messages" é obrigatório.' });

  const userName = typeof body.userName === 'string' && body.userName.trim() ? body.userName.trim().slice(0, 30) : 'Usuário';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : 'unknown';
  const image = typeof body.image === 'string' && body.image.startsWith('data:image/') && body.image.length <= LIMITS.imageChars ? body.image : null;

  const history = body.messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-LIMITS.history)
    .map((m) => ({ role: m.role, content: m.content.slice(0, LIMITS.chars) }));

  if (!history.length || history[history.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'A última mensagem precisa ser do usuário.' });
  }

  if (image) {
    const last = history[history.length - 1];
    last.content = [{ type: 'text', text: last.content }, { type: 'image_url', image_url: { url: image } }];
  }

  const brain = loadBrain();
  const prefs = sanitizePrefs(body.prefs);
  const gen = brain.generation || {};
  const payload = {
    messages: [{ role: 'system', content: buildSystemPrompt(brain, userName, !!image, prefs) }, ...history],
    max_tokens: TOKENS[prefs.length],
    temperature: prefs.creativity === null ? gen.temperature ?? 0.7 : +(0.2 + prefs.creativity * 0.9).toFixed(2),
    top_p: gen.top_p ?? 0.9
  };
  if (image) payload.model = MODEL_VISION;
  else payload.models = [MODEL_TEXT, MODEL_FALLBACK];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIMITS.upstreamMs);

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://kako-kakos.vercel.app/',
        'X-Title': 'Kako Chat'
      },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      console.error('OpenRouter', upstream.status, (await upstream.text()).slice(0, 500));
      const status = upstream.status === 429 ? 429 : 502;
      return res.status(status).json({
        error: status === 429 ? 'O provedor de IA está sobrecarregado. Tenta de novo em instantes.' : 'O provedor de IA não respondeu direito. Tenta de novo.'
      });
    }

    const data = await upstream.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'A IA devolveu uma resposta vazia. Tenta reformular.' });

    return res.status(200).json({ v: 2, reply, sessionId, model: data.model });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    console.error('Erro no handler:', err);
    return res.status(timedOut ? 504 : 500).json({
      error: timedOut ? 'A IA demorou demais para responder. Tenta de novo.' : 'Erro interno no servidor.'
    });
  } finally {
    clearTimeout(timer);
  }
}
