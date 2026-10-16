// script.js — Kako Chat v2
(() => {
'use strict';

/* ================= Config ================= */
const LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
const API_URL = LOCAL ? 'https://kako-kakos.vercel.app/api/chat' : '/api/chat';
const AVATAR = 'image/kako-profile.png';
const MAX_LEN = 2000;
const ACCENTS = { orange: '#ff6a1a', yellow: '#f3f23c', pink: '#ff4d8d', blue: '#4da3ff', green: '#3ddc84' };
const ACCENT_NAMES = { orange: 'Laranja', yellow: 'Amarelo', pink: 'Rosa', blue: 'Azul', green: 'Verde' };
const BANNERS = {
  ember: 'linear-gradient(135deg,#ff6a1a,#b8200a)',
  dusk: 'linear-gradient(135deg,#6d4cff,#e0409a)',
  ocean: 'linear-gradient(135deg,#1593ff,#12d6c1)',
  lime: 'linear-gradient(135deg,#f3f23c,#3ddc84)'
};
const DEFAULTS = {
  theme: 'dark', accent: 'orange', accentCustom: '#ff6a1a', fontSize: 'md', fontFamily: 'display', width: 'normal', density: 'comfortable',
  enterToSend: true, autoScroll: true, markdown: true, timestamps: true, spellcheck: true,
  sound: true, volume: 60, notify: false, history: true, retention: 0, typingSpeed: 90, context: 12,
  reduceMotion: false, highContrast: false, textSpacing: false,
  aiStyle: 'balanced', aiTone: 'playful', aiEmojis: 'few', aiLength: 'medium', aiCreativity: 55, aiLang: 'pt', aiInstructions: '', aiAbout: ''
};
const PROMPTS = [
  { i: 'fa-lightbulb', t: 'Explica rapidinho', p: 'Me explica o que é inteligência artificial de forma simples' },
  { i: 'fa-calendar-check', t: 'Organizar meu dia', p: 'Me ajuda a planejar meu dia' },
  { i: 'fa-utensils', t: 'Receita fácil', p: 'Cria uma receita fácil com ovo' },
  { i: 'fa-graduation-cap', t: 'Estudar melhor', p: 'Me dá dicas para estudar melhor' }
];
const NAV = [
  { sec: 'Conta', items: [{ id: 'profile', icon: 'fa-user', title: 'Perfil' }] },
  { sec: 'Preferências', items: [
    { id: 'appearance', icon: 'fa-palette', title: 'Aparência' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', title: 'Comportamento da IA' },
    { id: 'chat', icon: 'fa-comments', title: 'Conversa' },
    { id: 'access', icon: 'fa-universal-access', title: 'Acessibilidade' }] },
  { sec: 'Sistema', items: [
    { id: 'data', icon: 'fa-shield-halved', title: 'Privacidade e dados' },
    { id: 'keys', icon: 'fa-keyboard', title: 'Atalhos' },
    { id: 'about', icon: 'fa-circle-info', title: 'Sobre' }] }
];
const PANELS = NAV.flatMap((n) => n.items);

/* ================= Utils ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rawGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const rawSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
const jsonGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const jsonSet = (k, v) => rawSet(k, JSON.stringify(v));
const fmtTime = (t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
const bannerCss = (b) => (b && b.startsWith('data:') ? `url(${b}) center/cover` : BANNERS[b] || BANNERS.ember);
const avatarHtml = (src = S.user.avatar, name = S.user.name) =>
  src ? `<img src="${src}" alt="">` : `<span>${esc((name || '?').trim().charAt(0).toUpperCase() || '?')}</span>`;

function readImage(file, max = 1024, q = 0.82) {
  return new Promise((res, rej) => {
    if (!file || !file.type.startsWith('image/')) return rej(new Error('Selecione um arquivo de imagem.'));
    if (file.size > 12 * 1024 * 1024) return rej(new Error('A imagem é grande demais (máx. 12MB).'));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Falha ao ler o arquivo.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('Imagem inválida.'));
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ================= Estado ================= */
const S = {
  sessionId: rawGet('kako_sessionId') || (() => { const id = uid(); rawSet('kako_sessionId', id); return id; })(),
  user: { name: '', avatar: '', banner: 'ember' },
  settings: { ...DEFAULTS },
  chats: [], activeId: null,
  busy: false, revealing: false, skip: false, abort: null,
  image: null, lastImage: null, panel: 'profile', q: '', tmpAvatar: ''
};
const active = () => S.chats.find((c) => c.id === S.activeId);

function load() {
  S.settings = { ...DEFAULTS, ...jsonGet('kako_settings', {}) };
  S.user.name = (rawGet('kako_hasProfile') && rawGet('kako_userName')) || '';
  S.user.avatar = rawGet('kako_userAvatar') || '';
  const b = rawGet('kako_userBanner');
  S.user.banner = b && (b.startsWith('data:') || BANNERS[b]) ? b : 'ember';

  let chats = jsonGet('kako2_chats', null);
  if (!chats) { // migração do formato antigo
    chats = [];
    const old = (m) => ({ id: String(m.id || uid()), role: m.role, content: String(m.content || ''), t: Date.now(), img: !!m.image });
    jsonGet('kako_savedChats', []).forEach((c) => chats.push({ id: c.id || uid(), title: String(c.title || 'Conversa').replace(/\.\.\.$/, ''), messages: (c.messages || []).map(old), updated: c.timestamp || Date.now() }));
    const cur = jsonGet('kako_chatHistory', []);
    if (cur.length) chats.push({ id: uid(), title: String(cur[0].content).slice(0, 40), messages: cur.map(old), updated: Date.now() });
  }
  S.chats = chats;
  S.activeId = rawGet('kako2_active');
  if (!active()) newChat(false);
  if (purgeOld()) saveChats();
}
const saveChats = () => {
  if (!S.settings.history) return;
  const keep = S.chats.filter((c) => c.messages.length);
  if (!jsonSet('kako2_chats', keep)) toast('Armazenamento cheio: apague conversas antigas.', 'warn');
  rawSet('kako2_active', S.activeId || '');
};
const saveSettings = () => jsonSet('kako_settings', S.settings);
const saveUser = () => {
  rawSet('kako_userName', S.user.name); rawSet('kako_userAvatar', S.user.avatar);
  rawSet('kako_userBanner', S.user.banner); rawSet('kako_hasProfile', 'true');
};

function newChat(render = true) {
  const empty = S.chats.find((c) => !c.messages.length);
  const chat = empty || { id: uid(), title: 'Nova conversa', messages: [], updated: Date.now() };
  if (!empty) S.chats.push(chat);
  S.activeId = chat.id;
  rawSet('kako2_active', chat.id);
  if (render) { renderAll(); $('#input')?.focus(); }
}

/* ================= Aparência ================= */
const inkFor = (hex) => { const n = parseInt(hex.slice(1), 16); return (((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000) > 150 ? '#1a0b02' : '#ffffff'; };
function applyAppearance() {
  const s = S.settings, root = document.documentElement;
  const t = s.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : s.theme;
  const accent = s.accent === 'custom' ? (/^#[0-9a-f]{6}$/i.test(s.accentCustom) ? s.accentCustom : ACCENTS.orange) : ACCENTS[s.accent] || ACCENTS.orange;
  root.dataset.theme = t;
  root.dataset.contrast = s.highContrast ? 'high' : 'normal';
  root.dataset.motion = s.reduceMotion ? 'reduced' : 'full';
  root.dataset.font = s.fontSize; root.dataset.ff = s.fontFamily;
  root.dataset.width = s.width; root.dataset.density = s.density;
  root.dataset.spacing = s.textSpacing ? 'wide' : 'normal';
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-ink', inkFor(accent));
  $('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#f6f2ed' : '#100f0e');
}

/* ================= Markdown ================= */
function md(src) {
  if (!S.settings.markdown) return esc(src).replace(/\n/g, '<br>');
  const blocks = [];
  let t = src;
  if ((t.match(/```/g) || []).length % 2) t += '\n```';
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<div class="code"><div class="code-bar"><span>${esc(lang || 'código')}</span><button type="button" data-act="copy-code"><i class="fa-regular fa-copy"></i> Copiar</button></div><pre><code>${esc(code.replace(/\n$/, ''))}</code></pre></div>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const out = []; let list = null, para = [];
  const flushP = () => { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } };
  const flushL = () => { if (list) { out.push(`<${list.t}>${list.i.map((x) => `<li>${inline(x)}</li>`).join('')}</${list.t}>`); list = null; } };
  for (const line of t.split('\n')) {
    let m;
    if (/^\u0000\d+\u0000$/.test(line.trim())) { flushP(); flushL(); out.push(line.trim()); }
    else if ((m = line.match(/^(#{1,4})\s+(.*)/))) { flushP(); flushL(); const n = m[1].length + 2; out.push(`<h${n}>${inline(m[2])}</h${n}>`); }
    else if ((m = line.match(/^\s*([-*•]|\d+[.)])\s+(.*)/))) {
      flushP(); const tag = /\d/.test(m[1]) ? 'ol' : 'ul';
      if (list && list.t !== tag) flushL();
      list = list || { t: tag, i: [] }; list.i.push(m[2]);
    }
    else if ((m = line.match(/^>\s?(.*)/))) { flushP(); flushL(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); }
    else if (!line.trim()) { flushP(); flushL(); }
    else { flushL(); para.push(line); }
  }
  flushP(); flushL();
  return out.join('').replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
}

/* ================= Feedback ================= */
function toast(msg, type = 'info') {
  const box = $('#toasts'); if (!box) return;
  while (box.children.length >= 3) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function ask({ title, text, ok = 'Confirmar', danger = false }) {
  return new Promise((res) => {
    const d = $('#confirm');
    $('.c-title', d).textContent = title; $('.c-text', d).textContent = text;
    const b = $('.c-ok', d); b.textContent = ok; b.className = 'btn ' + (danger ? 'danger' : 'primary') + ' c-ok';
    d.returnValue = 'cancel';
    d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true });
    d.showModal();
  });
}
function blip() {
  if (!S.settings.sound || !S.settings.volume) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 760;
    g.gain.setValueAtTime(0.16 * (S.settings.volume / 100), ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.start(); o.stop(ctx.currentTime + 0.18);
  } catch { /* sem áudio */ }
}
function notifyReply(m) {
  if (S.settings.notify && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('Kako respondeu', { body: m.content.slice(0, 120), icon: AVATAR });
  }
}

/* ================= Templates ================= */
function shell() {
  return `
<div class="app">
  <div class="scrim" data-act="toggle-nav"></div>
  <aside class="side" aria-label="Conversas">
    <div class="brand"><img src="${AVATAR}" alt=""><b>Kako</b></div>
    <button class="btn primary wide" data-act="new-chat"><i class="fa-solid fa-plus"></i> Nova conversa</button>
    <label class="search"><i class="fa-solid fa-magnifying-glass"></i><input id="search" type="search" placeholder="Buscar conversas" autocomplete="off" aria-label="Buscar conversas"></label>
    <nav id="chat-list" class="chat-list"></nav>
    <div class="me">
      <div class="av" id="me-av"></div><div class="me-name" id="me-name"></div>
      <button class="icon" data-act="open-settings" aria-label="Configurações"><i class="fa-solid fa-gear"></i></button>
    </div>
  </aside>
  <main class="main" id="main">
    <header class="top">
      <button class="icon only-mobile" data-act="toggle-nav" aria-label="Abrir menu"><i class="fa-solid fa-bars"></i></button>
      <img class="top-av" src="${AVATAR}" alt="">
      <div class="top-info"><h1 id="top-title">Kako</h1><p><span class="dot"></span>Online</p></div>
      <button class="icon" data-act="export-chat" aria-label="Exportar conversa" title="Exportar conversa"><i class="fa-solid fa-download"></i></button>
      <button class="icon" data-act="clear" aria-label="Limpar conversa" title="Limpar conversa"><i class="fa-regular fa-trash-can"></i></button>
    </header>
    <div class="scroller" id="scroller"><div class="thread" id="thread" aria-live="polite"></div></div>
    <footer class="composer">
      <div class="box" id="box">
        <div class="chip" id="chip" hidden></div>
        <button class="icon" data-act="attach" aria-label="Anexar imagem" title="Anexar imagem"><i class="fa-regular fa-image"></i></button>
        <textarea id="input" rows="1" maxlength="${MAX_LEN}" placeholder="Escreva uma mensagem…" aria-label="Mensagem"></textarea>
        <button class="send" id="send" data-act="send" aria-label="Enviar"><i class="fa-solid fa-arrow-up"></i></button>
      </div>
      <div class="foot"><span id="hint"></span><span id="count"></span></div>
    </footer>
  </main>
</div>
<input type="file" id="file-image" accept="image/*" hidden>
<input type="file" id="file-avatar" accept="image/*" hidden>
<input type="file" id="file-banner" accept="image/*" hidden>
<input type="file" id="file-import" accept="application/json,.json" hidden>
<dialog id="settings" aria-labelledby="st-title"><div class="st">
  <aside class="st-side"><div class="st-top">Configurações</div>
    <label class="st-search"><i class="fa-solid fa-magnifying-glass"></i><input id="st-q" type="search" placeholder="Buscar ajustes" autocomplete="off" aria-label="Buscar ajustes"></label>
    <nav class="st-nav" id="st-nav" aria-label="Seções"></nav></aside>
  <section class="st-main"><div class="st-head"><h2 id="st-title"></h2><span class="saved" id="st-saved"><i class="fa-solid fa-check"></i> Salvo</span><button class="icon" data-act="close-settings" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button></div><div id="st-body"></div></section>
</div></dialog>
<dialog id="confirm"><form method="dialog" class="cf"><h3 class="c-title"></h3><p class="c-text"></p>
  <div class="btn-row"><button class="btn" value="cancel">Cancelar</button><button class="btn primary c-ok" value="ok"></button></div></form></dialog>
<div id="toasts" role="status"></div>`;
}

function renderSetup() {
  $('#app').innerHTML = `
<div class="setup">
  <div class="setup-art"><img src="${AVATAR}" alt="Kako"></div>
  <form class="setup-card" id="setup-form" novalidate>
    <h1>Kako</h1>
    <p class="lead">Seu parceiro de conversa com IA. Só preciso saber como te chamar.</p>
    <label class="field"><span>Seu nome</span><input id="setup-name" maxlength="30" autocomplete="given-name" placeholder="Como quer ser chamado?" required></label>
    <div class="field"><span>Foto de perfil (opcional)</span>
      <div class="setup-av"><div class="av lg" id="setup-av">${avatarHtml('', '?')}</div><button class="btn" type="button" data-act="setup-pick">Escolher foto</button></div></div>
    <button class="btn primary wide" type="submit">Começar a conversar</button>
  </form>
</div>
<input type="file" id="file-setup" accept="image/*" hidden>
<div id="toasts" role="status"></div>`;
  $('#setup-name').focus();
}

function welcomeHtml() {
  return `<section class="welcome">
  <div class="hero"><img src="${AVATAR}" alt="Kako"><div class="saw"></div></div>
  <h2>${greet()}, ${esc(S.user.name)}.</h2>
  <p>Manda a dúvida, cola um texto ou anexa uma imagem. Eu dou um jeito.</p>
  <div class="prompts">${PROMPTS.map((p) => `<button class="prompt" data-act="prompt" data-p="${esc(p.p)}"><i class="fa-solid ${p.i}"></i><b>${p.t}</b><small>${esc(p.p)}</small></button>`).join('')}</div>
</section>`;
}

function msgHtml(m) {
  const time = S.settings.timestamps ? `<time>${fmtTime(m.t)}</time>` : '';
  if (m.role === 'user') {
    return `<article class="msg user" data-id="${m.id}"><div class="bubble">${m.img ? '<div class="img-tag"><i class="fa-regular fa-image"></i> Imagem anexada</div>' : ''}<div class="msg-body">${esc(m.content).replace(/\n/g, '<br>')}</div></div>
<div class="acts">${time}<button data-act="copy-msg" aria-label="Copiar"><i class="fa-regular fa-copy"></i></button><button data-act="edit" aria-label="Editar"><i class="fa-regular fa-pen-to-square"></i></button></div></article>`;
  }
  return `<article class="msg ai" data-id="${m.id}"><img src="${AVATAR}" alt=""><div class="col"><div class="who">Kako ${time}</div><div class="msg-body">${md(m.content)}</div>
<div class="acts"><button data-act="copy-msg" aria-label="Copiar"><i class="fa-regular fa-copy"></i></button><button data-act="like" aria-label="Gostei"><i class="fa-regular fa-thumbs-up"></i></button><button data-act="regen" aria-label="Gerar de novo"><i class="fa-solid fa-rotate"></i></button></div></div></article>`;
}

/* ================= Render ================= */
function renderApp() {
  $('#app').innerHTML = shell();
  $('#hint').textContent = S.settings.enterToSend ? 'Enter envia · Shift+Enter quebra linha' : 'Ctrl+Enter envia';
  renderMe(); renderAll(); $('#input').spellcheck = !!S.settings.spellcheck; $('#input').focus();
}
function renderMe() {
  const a = $('#me-av'); if (!a) return;
  a.innerHTML = avatarHtml(); $('#me-name').textContent = S.user.name;
}
function renderAll() { renderMessages(); renderChatList(); renderHeader(); }
function renderHeader() { const h = $('#top-title'); if (h) h.textContent = active()?.title === 'Nova conversa' ? 'Kako' : active()?.title; }
function markLast() {
  const th = $('#thread'); if (!th) return;
  $$('.msg.last', th).forEach((n) => n.classList.remove('last'));
  ['.msg.ai', '.msg.user'].forEach((s) => { const all = $$(s, th); all[all.length - 1]?.classList.add('last'); });
}
function renderMessages() {
  const chat = active(), th = $('#thread'); if (!th) return;
  th.innerHTML = chat.messages.length ? chat.messages.map(msgHtml).join('') : welcomeHtml();
  markLast(); scrollDown(true);
}
function renderChatList() {
  const el = $('#chat-list'); if (!el) return;
  const q = ($('#search')?.value || '').toLowerCase().trim();
  const list = S.chats.filter((c) => c.messages.length && (!q || c.title.toLowerCase().includes(q))).sort((a, b) => b.updated - a.updated);
  if (!list.length) { el.innerHTML = `<p class="empty">${q ? 'Nada encontrado.' : 'Suas conversas aparecem aqui.'}</p>`; return; }
  const day = 864e5, today = new Date().setHours(0, 0, 0, 0);
  const label = (t) => (t >= today ? 'Hoje' : t >= today - day ? 'Ontem' : t >= today - 7 * day ? 'Últimos 7 dias' : 'Mais antigas');
  let last = '', html = '';
  for (const c of list) {
    const l = label(c.updated);
    if (l !== last) { html += `<div class="glabel">${l}</div>`; last = l; }
    html += `<div class="ci ${c.id === S.activeId ? 'on' : ''}"><button class="open" data-act="open-chat" data-id="${c.id}" title="${esc(c.title)}">${esc(c.title)}</button><button class="icon x" data-act="del-chat" data-id="${c.id}" aria-label="Excluir conversa"><i class="fa-regular fa-trash-can"></i></button></div>`;
  }
  el.innerHTML = html;
}
function scrollDown(force) {
  if (!force && !S.settings.autoScroll) return;
  const s = $('#scroller'); if (s) s.scrollTop = s.scrollHeight;
}
function showTyping(on) {
  $('#typing')?.remove();
  if (!on) return;
  $('#thread').insertAdjacentHTML('beforeend', `<article class="msg ai" id="typing" aria-label="Kako está digitando"><img src="${AVATAR}" alt=""><div class="col"><div class="dots"><i></i><i></i><i></i></div></div></article>`);
  scrollDown(true);
}
function setBusy(b) {
  S.busy = b;
  const s = $('#send'); if (!s) return;
  s.innerHTML = b ? '<i class="fa-solid fa-stop"></i>' : '<i class="fa-solid fa-arrow-up"></i>';
  s.setAttribute('aria-label', b ? 'Parar' : 'Enviar');
}
function autosize() {
  const i = $('#input'); if (!i) return;
  i.style.height = 'auto'; i.style.height = Math.min(i.scrollHeight, 180) + 'px';
  const n = i.value.length, c = $('#count');
  c.textContent = n > 1500 ? `${n}/${MAX_LEN}` : '';
  c.className = n > 1900 ? 'bad' : n > 1500 ? 'warn' : '';
  c.id = 'count';
}
function setImage(data) {
  S.image = data;
  const chip = $('#chip'); if (!chip) return;
  chip.hidden = !data;
  chip.innerHTML = data ? `<img src="${data}" alt="Pré-visualização"><span>Imagem anexada — o Kako vai analisar.</span><button class="icon" data-act="rm-image" aria-label="Remover imagem"><i class="fa-solid fa-xmark"></i></button>` : '';
  const f = $('#file-image'); if (f && !data) f.value = '';
}
async function attachFile(file) {
  try { setImage(await readImage(file)); } catch (e) { toast(e.message, 'err'); }
}

/* ================= Conversa ================= */
async function submit(text) {
  if (S.busy) return;
  const input = $('#input');
  const content = (text ?? input.value).trim();
  if (!content && !S.image) return toast('Digite uma mensagem ou anexe uma imagem.', 'warn');
  const chat = active(), image = S.image;
  const m = { id: uid(), role: 'user', content: content || 'Analise esta imagem.', t: Date.now(), img: !!image };
  chat.messages.push(m);
  if (chat.messages.length === 1) chat.title = (content || 'Imagem').replace(/\s+/g, ' ').slice(0, 42);
  chat.updated = Date.now();
  input.value = ''; autosize(); setImage(null); saveChats(); renderAll();
  await reply(image);
}

async function reply(image) {
  const chat = active();
  S.lastImage = image || null;
  $('#thread .msg.err')?.remove();
  setBusy(true); showTyping(true);
  const ctrl = new AbortController(); S.abort = ctrl;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, 40000);
  try {
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({
        sessionId: S.sessionId, chatId: chat.id, userName: S.user.name,
        messages: chat.messages.slice(-S.settings.context).map(({ role, content }) => ({ role, content })),
        prefs: aiPrefs(),
        image: image || null
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    if (data.v !== 2) throw new Error('O servidor ainda está com o chat.js antigo (ele responde 200 até em erro). Endereço chamado: ' + API_URL + '. Publique o novo em api/chat.js, faça redeploy e confira a OPENROUTER_API_KEY.');
    showTyping(false);
    const m = { id: uid(), role: 'assistant', content: String(data.reply || '').trim() || 'Fiquei sem palavras. Tenta de novo?', t: Date.now() };
    chat.messages.push(m); chat.updated = Date.now(); saveChats();
    $('#thread').insertAdjacentHTML('beforeend', msgHtml(m));
    const node = $('#thread').lastElementChild;
    node.classList.add('revealing'); markLast(); renderChatList();
    await reveal(m, node);
    node.classList.remove('revealing');
    blip(); notifyReply(m);
  } catch (e) {
    showTyping(false);
    const msg = e.name === 'AbortError' ? (timedOut ? 'A resposta demorou demais.' : 'Resposta cancelada.') : (e.message || 'Algo deu errado.');
    $('#thread').insertAdjacentHTML('beforeend', `<article class="msg ai err"><img src="${AVATAR}" alt=""><div class="col"><div class="msg-body">${esc(msg)}</div><div class="btn-row" style="margin-top:8px"><button class="btn" data-act="retry"><i class="fa-solid fa-rotate"></i> Tentar de novo</button></div></div></article>`);
    scrollDown(true);
  } finally {
    clearTimeout(timer); S.abort = null; setBusy(false); $('#input')?.focus();
  }
}

async function reveal(m, node) {
  const body = $('.msg-body', node), full = m.content, cps = S.settings.typingSpeed;
  if (S.settings.reduceMotion || cps >= 200) { body.innerHTML = md(full); scrollDown(); return; }
  S.revealing = true; S.skip = false;
  let i = 0;
  while (i < full.length && !S.skip) {
    i = Math.min(full.length, i + Math.max(1, Math.round(cps / 30)));
    body.innerHTML = md(full.slice(0, i)); scrollDown();
    await sleep(33);
  }
  S.revealing = false;
  body.innerHTML = md(full); scrollDown();
}

/* ================= Configurações ================= */
const FMT = {
  typingSpeed: (v) => (v >= 200 ? 'Instantâneo' : `${v} cps`),
  aiCreativity: (v) => `${v}%`, volume: (v) => `${v}%`, context: (v) => `${v} mensagens`
};
const tgl = (k, l, d) => `<label class="row"><span class="row-t"><b>${l}</b><small>${d}</small></span><input class="sw" type="checkbox" role="switch" data-key="${k}" ${S.settings[k] ? 'checked' : ''}></label>`;
const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" class="${S.settings[k] === v ? 'on' : ''}" data-act="set" data-key="${k}" data-val="${v}">${l}</button>`).join('')}</div>`;
const sel = (k, opts, label) => `<select class="sel" data-key="${k}" aria-label="${label}">${opts.map(([v, l]) => `<option value="${v}" ${String(S.settings[k]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
const rng = (k, min, max, step, label) => `<span class="rng"><input type="range" min="${min}" max="${max}" step="${step}" value="${S.settings[k]}" data-key="${k}" aria-label="${label}"><output>${FMT[k](S.settings[k])}</output></span>`;
const area = (k, l, d, max, ph) => `<div class="blk"><span class="row-t"><b>${l}</b><small>${d}</small></span><textarea class="ta" data-key="${k}" maxlength="${max}" rows="4" placeholder="${ph}">${esc(S.settings[k])}</textarea><div class="ta-c"><span data-for="${k}">${S.settings[k].length}/${max}</span></div></div>`;
const grp = (t, b, d = '', cls = '') => `<section class="grp"><h3>${t}</h3>${d ? `<p class="gd">${d}</p>` : ''}<div class="card ${cls}">${b}</div></section>`;
const rowc = (l, d, c) => `<div class="row"><span class="row-t"><b>${l}</b><small>${d}</small></span>${c}</div>`;
const tcard = (v, l) => `<button class="tcard ${S.settings.theme === v ? 'on' : ''}" data-act="set" data-key="theme" data-val="${v}"><div class="tmock t-${v}"><i></i><div><b></b><b></b></div></div><span>${l}</span></button>`;

function usage() {
  let b = 0;
  try { for (const k of Object.keys(localStorage)) if (k.startsWith('kako')) b += (k.length + (localStorage.getItem(k) || '').length) * 2; } catch { /* sem acesso */ }
  return b;
}
const fmtBytes = (b) => (b > 1048576 ? (b / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

function aiPrefs() {
  const s = S.settings;
  return { style: s.aiStyle, tone: s.aiTone, emojis: s.aiEmojis, length: s.aiLength, creativity: s.aiCreativity / 100, lang: s.aiLang, instructions: s.aiInstructions, about: s.aiAbout };
}

function purgeOld() {
  const d = S.settings.retention; if (!d) return false;
  const cut = Date.now() - d * 864e5, before = S.chats.length;
  S.chats = S.chats.filter((c) => c.id === S.activeId || !c.messages.length || c.updated >= cut);
  return S.chats.length !== before;
}

async function importBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast('Arquivo inválido.', 'err'); }
  if (!data || !Array.isArray(data.chats)) return toast('Este não parece um backup do Kako.', 'err');
  const ids = new Set(S.chats.map((c) => c.id)); let added = 0;
  for (const c of data.chats) {
    if (!c || !Array.isArray(c.messages) || ids.has(c.id)) continue;
    S.chats.push({
      id: String(c.id || uid()), title: String(c.title || 'Conversa').slice(0, 60), updated: +c.updated || Date.now(),
      messages: c.messages.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ id: String(m.id || uid()), role: m.role, content: m.content.slice(0, 8000), t: +m.t || Date.now(), img: !!m.img }))
    });
    added++;
  }
  if (data.settings && typeof data.settings === 'object') {
    for (const k of Object.keys(DEFAULTS)) if (k in data.settings && typeof data.settings[k] === typeof DEFAULTS[k]) S.settings[k] = data.settings[k];
    saveSettings(); applyAppearance();
  }
  saveChats(); renderAll(); renderSettings(); toast(`Backup importado: ${added} conversa(s) nova(s).`, 'ok');
}

const VIEWS = {
  profile: () => {
    const real = S.chats.filter((c) => c.messages.length);
    const total = real.reduce((n, c) => n + c.messages.length, 0);
    const mine = real.reduce((n, c) => n + c.messages.filter((m) => m.role === 'user').length, 0);
    return `
<div class="pcard"><div class="pbanner" style="background:${bannerCss(S.user.banner)}"></div><div class="pav"><div class="av">${avatarHtml()}</div></div></div>
<div class="stats"><div><b>${real.length}</b><span>conversas</span></div><div><b>${mine}</b><span>mensagens suas</span></div><div><b>${total - mine}</b><span>respostas do Kako</span></div></div>` +
    grp('Identidade', `<div class="blk"><label class="field"><span>Nome de exibição</span><input id="name-input" value="${esc(S.user.name)}" maxlength="30"></label>
<div class="btn-row" style="margin:0"><button class="btn" data-act="pick-avatar"><i class="fa-solid fa-camera"></i> Trocar foto</button>${S.user.avatar ? '<button class="btn ghost" data-act="rm-avatar">Remover foto</button>' : ''}</div></div>`, 'O Kako usa esse nome para falar com você.') +
    grp('Fundo do perfil', `<div class="blk"><div class="banners">${Object.keys(BANNERS).map((k) => `<button class="bn ${S.user.banner === k ? 'on' : ''}" style="background:${BANNERS[k]}" data-act="banner" data-val="${k}" aria-label="Fundo ${k}"></button>`).join('')}<button class="bn custom ${S.user.banner.startsWith('data:') ? 'on' : ''}" data-act="pick-banner" aria-label="Enviar imagem"><i class="fa-regular fa-image"></i></button></div></div>`);
  },
  appearance: () => {
    const custom = S.settings.accent === 'custom';
    return grp('Tema', `<div class="tcards">${tcard('dark', 'Escuro')}${tcard('light', 'Claro')}${tcard('auto', 'Automático')}</div>`, 'Automático acompanha o tema do seu sistema.') +
      grp('Cor de destaque', rowc('Paleta', 'Botões, mensagens e detalhes da interface', `<div class="sws">${Object.keys(ACCENTS).map((k) => `<button class="${S.settings.accent === k ? 'on' : ''}" style="background:${ACCENTS[k]}" data-act="set" data-key="accent" data-val="${k}" aria-label="${ACCENT_NAMES[k]}"></button>`).join('')}<label class="sw-c ${custom ? 'on' : ''}" style="${custom ? `background:${S.settings.accentCustom}` : ''}" title="Cor personalizada"><i class="fa-solid fa-eye-dropper"></i><input type="color" data-key="accentCustom" value="${S.settings.accentCustom}" aria-label="Cor personalizada"></label></div>`)) +
      grp('Tipografia e layout',
        rowc('Fonte', 'Estilo das letras em todo o app', sel('fontFamily', [['display', 'Bricolage (padrão)'], ['system', 'Sistema'], ['serif', 'Serifada']], 'Fonte')) +
        rowc('Tamanho do texto', 'Vale para toda a interface', seg('fontSize', [['sm', 'Pequeno'], ['md', 'Médio'], ['lg', 'Grande']])) +
        rowc('Largura da conversa', 'Espaço ocupado pelas mensagens', seg('width', [['narrow', 'Estreita'], ['normal', 'Normal'], ['wide', 'Ampla']])) +
        rowc('Densidade', 'Espaçamento entre mensagens', seg('density', [['compact', 'Compacta'], ['comfortable', 'Confortável']]))) +
      grp('Pré-visualização', `<div class="pv"><div class="msg user"><div class="bubble"><div class="msg-body">Bora testar esse visual?</div></div></div>
<div class="msg ai"><img src="${AVATAR}" alt=""><div class="col"><div class="who">Kako</div><div class="msg-body"><p>Fechou! Com <strong>destaque</strong> e tipografia assim, a conversa fica bem mais gostosa de ler.</p></div></div></div></div>`);
  },
  ai: () =>
    grp('Estilo das respostas',
      rowc('Tamanho', 'Limite de extensão de cada resposta', seg('aiLength', [['short', 'Curtas'], ['medium', 'Médias'], ['long', 'Longas']])) +
      rowc('Nível de detalhe', 'Quanto o Kako se aprofunda', seg('aiStyle', [['concise', 'Direto'], ['balanced', 'Equilibrado'], ['detailed', 'Detalhado']])) +
      rowc('Tom de voz', 'Personalidade das respostas', sel('aiTone', [['playful', 'Brincalhão'], ['neutral', 'Neutro'], ['professional', 'Profissional']], 'Tom')) +
      rowc('Emojis', 'Frequência de emojis', seg('aiEmojis', [['none', 'Nenhum'], ['few', 'Poucos'], ['many', 'Muitos']])) +
      rowc('Idioma', 'Idioma das respostas', sel('aiLang', [['pt', 'Português'], ['en', 'English'], ['es', 'Español']], 'Idioma'))) +
    grp('Raciocínio',
      rowc('Criatividade', 'Baixo = previsível e preciso. Alto = mais criativo e solto.', rng('aiCreativity', 0, 100, 5, 'Criatividade')) +
      rowc('Memória da conversa', 'Quantas mensagens recentes o Kako considera', rng('context', 4, 20, 2, 'Memória'))) +
    grp('Personalização',
      area('aiAbout', 'Sobre você', 'O que o Kako deve saber sobre você (profissão, interesses, nível técnico).', 300, 'Ex.: sou dev júnior e curto Valorant.') +
      area('aiInstructions', 'Instruções personalizadas', 'Como você quer que o Kako responda sempre.', 500, 'Ex.: explique com analogias e termine com um resumo.'),
      'Enviadas ao Kako junto com cada mensagem.') +
    `<div class="btn-row"><button class="btn ghost" data-act="reset-ai"><i class="fa-solid fa-rotate-left"></i> Restaurar padrões da IA</button></div>`,
  chat: () =>
    grp('Comportamento', tgl('enterToSend', 'Enter para enviar', 'Desligado: use Ctrl+Enter') + tgl('autoScroll', 'Rolagem automática', 'Acompanha as mensagens novas') + tgl('markdown', 'Formatação Markdown', 'Negrito, listas e blocos de código') + tgl('timestamps', 'Mostrar horários', 'Hora ao lado de cada mensagem') + tgl('spellcheck', 'Corretor ortográfico', 'Sublinha erros enquanto você digita')) +
    grp('Digitação', rowc('Velocidade da resposta', 'No máximo, a resposta aparece instantaneamente', rng('typingSpeed', 30, 200, 10, 'Velocidade'))) +
    grp('Avisos', tgl('sound', 'Som ao responder', 'Um toque curto quando o Kako responde') + rowc('Volume', 'Volume do toque', rng('volume', 0, 100, 10, 'Volume')) + tgl('notify', 'Notificações do navegador', 'Quando a aba não está em foco')),
  access: () =>
    grp('Visual', tgl('highContrast', 'Alto contraste', 'Bordas e textos mais fortes') + tgl('textSpacing', 'Espaçamento de texto ampliado', 'Mais espaço entre letras, palavras e linhas') + rowc('Tamanho do texto', 'Aumenta ou diminui toda a interface', seg('fontSize', [['sm', 'Pequeno'], ['md', 'Médio'], ['lg', 'Grande']]))) +
    grp('Movimento', tgl('reduceMotion', 'Reduzir movimento', 'Desativa animações e a digitação gradual'), 'O site não depende mais da preferência do Windows: só esta opção controla as animações.'),
  data: () => {
    const b = usage(), pct = Math.min(100, (b / 5242880) * 100);
    return grp('Privacidade', tgl('history', 'Salvar histórico neste dispositivo', 'Desligado: as conversas somem ao recarregar') +
        rowc('Exclusão automática', 'Remove conversas antigas sozinho', sel('retention', [[0, 'Nunca'], [7, 'Após 7 dias'], [30, 'Após 30 dias'], [90, 'Após 90 dias']], 'Exclusão automática')),
      'Tudo fica salvo apenas neste navegador.') +
      grp('Armazenamento', `<div class="blk"><div class="row-t"><b>${fmtBytes(b)} em uso</b><small>Limite aproximado do navegador: 5 MB</small></div><div class="meter"><i style="width:${pct}%"></i></div></div>`) +
      grp('Backup', rowc('Exportar tudo', 'Baixa conversas e preferências em JSON', '<button class="btn" data-act="export-all"><i class="fa-solid fa-download"></i> Exportar</button>') +
        rowc('Importar backup', 'Mescla um arquivo exportado antes', '<button class="btn" data-act="import"><i class="fa-solid fa-upload"></i> Importar</button>')) +
      grp('Zona de perigo', rowc('Apagar histórico', 'Remove todas as conversas', '<button class="btn danger" data-act="wipe-chats">Apagar</button>') +
        rowc('Restaurar configurações', 'Volta às preferências padrão', '<button class="btn" data-act="reset-settings">Restaurar</button>') +
        rowc('Apagar todos os dados', 'Perfil, conversas e preferências', '<button class="btn danger" data-act="wipe-all">Apagar tudo</button>'), '', 'danger');
  },
  keys: () => {
    const k = (...x) => x.map((i) => `<kbd>${i}</kbd>`).join('+');
    return grp('Atalhos de teclado',
      rowc('Enviar mensagem', 'No campo de texto', S.settings.enterToSend ? k('Enter') : k('Ctrl', 'Enter')) +
      rowc('Quebrar linha', 'No campo de texto', S.settings.enterToSend ? k('Shift', 'Enter') : k('Enter')) +
      rowc('Buscar conversas', 'Foca na busca da barra lateral', k('Ctrl', 'K')) +
      rowc('Nova conversa', 'Cria e abre uma conversa em branco', k('Ctrl', 'Shift', 'O')) +
      rowc('Abrir configurações', 'Em qualquer tela', k('Ctrl', ',')) +
      rowc('Fechar painéis', 'Menu lateral e janelas', k('Esc')));
  },
  about: () => `
<div class="about"><img src="${AVATAR}" alt=""><div><h4>Kako</h4><p>Versão 2.1 · assistente de IA brasileiro</p></div></div>` +
    grp('Diagnóstico', rowc('Conexão com o servidor', location.host || 'local', '<span class="pill" id="ping-out">Não testado</span>') +
      rowc('Testar agora', 'Mede o tempo de resposta da API', '<button class="btn" data-act="ping"><i class="fa-solid fa-signal"></i> Testar</button>')) +
    grp('Informações', rowc('Sessão', 'Identificador anônimo desta sessão', `<span class="pill">${S.sessionId.slice(0, 8)}</span>`) +
      rowc('Modelos', 'Escolhidos pelo servidor', '<span class="pill">LLaMA 3.3 · visão 3.2</span>') +
      rowc('Seus dados', 'Armazenamento', '<span class="pill">Somente neste navegador</span>'))
};

function renderSettings() {
  const q = S.q.trim().toLowerCase();
  $('#st-nav').innerHTML = NAV.map((n) => `<div class="st-sec">${n.sec}</div>` + n.items.map((p) => `<button class="${!q && p.id === S.panel ? 'on' : ''}" data-act="panel" data-id="${p.id}"><i class="fa-solid ${p.icon}"></i><span>${p.title}</span></button>`).join('')).join('');
  const body = $('#st-body');
  if (!q) { $('#st-title').textContent = PANELS.find((p) => p.id === S.panel).title; body.innerHTML = VIEWS[S.panel](); return; }
  $('#st-title').textContent = 'Resultados da busca';
  const tmp = document.createElement('div');
  tmp.innerHTML = PANELS.filter((p) => p.id !== 'profile').map((p) => VIEWS[p.id]()).join('');
  $$('.row,.blk', tmp).forEach((r) => { if (!r.textContent.toLowerCase().includes(q) && !(r.querySelector('textarea')?.placeholder || '').toLowerCase().includes(q)) r.remove(); });
  $$('.grp', tmp).forEach((g) => { if (!$('.row,.blk', g)) g.remove(); });
  body.innerHTML = tmp.querySelector('.grp') ? tmp.innerHTML : `<p class="empty">Nenhum ajuste encontrado para “${esc(q)}”.</p>`;
}

let savedTimer;
function flashSaved() {
  const el = $('#st-saved'); if (!el) return;
  el.classList.add('on'); clearTimeout(savedTimer); savedTimer = setTimeout(() => el.classList.remove('on'), 1400);
}

async function setSetting(k, v) {
  S.settings[k] = v; saveSettings(); applyAppearance(); flashSaved();
  if (k === 'notify' && v) {
    if (!('Notification' in window)) { toast('Seu navegador não suporta notificações.', 'warn'); S.settings.notify = false; }
    else if ((await Notification.requestPermission()) !== 'granted') { toast('Permissão negada pelo navegador.', 'warn'); S.settings.notify = false; }
    saveSettings(); renderSettings();
  }
  if (k === 'markdown' || k === 'timestamps') renderMessages();
  if (k === 'history') { v ? saveChats() : localStorage.removeItem('kako2_chats'); }
  if (k === 'retention' && purgeOld()) { saveChats(); renderAll(); toast('Conversas antigas removidas.', 'ok'); }
  if (k === 'spellcheck' && $('#input')) $('#input').spellcheck = !!v;
  if (k === 'enterToSend') { $('#hint').textContent = v ? 'Enter envia · Shift+Enter quebra linha' : 'Ctrl+Enter envia'; }
}

/* ================= Ações ================= */
const getMsg = (el) => active().messages.find((m) => m.id === el.closest('.msg')?.dataset.id);
const copy = (text, btn) => navigator.clipboard.writeText(text).then(() => {
  toast('Copiado!', 'ok');
  if (btn) { const h = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(() => (btn.innerHTML = h), 1500); }
}).catch(() => toast('Não foi possível copiar.', 'err'));

function exportText(chat) {
  return chat.messages.map((m) => `[${fmtTime(m.t)}] ${m.role === 'user' ? S.user.name : 'Kako'}: ${m.content}`).join('\n\n');
}

const ACTIONS = {
  'toggle-nav': () => document.body.classList.toggle('nav-open'),
  'new-chat': () => { document.body.classList.remove('nav-open'); newChat(); },
  'open-chat': (el) => { S.activeId = el.dataset.id; rawSet('kako2_active', S.activeId); document.body.classList.remove('nav-open'); renderAll(); },
  'del-chat': async (el) => {
    if (!(await ask({ title: 'Excluir conversa?', text: 'Essa conversa será apagada de vez.', ok: 'Excluir', danger: true }))) return;
    S.chats = S.chats.filter((c) => c.id !== el.dataset.id);
    if (!active()) { const next = [...S.chats].sort((a, b) => b.updated - a.updated)[0]; next ? (S.activeId = next.id) : newChat(false); }
    saveChats(); renderAll();
  },
  prompt: (el) => submit(el.dataset.p),
  send: () => (S.busy ? ACTIONS.stop() : submit()),
  stop: () => { if (S.revealing) S.skip = true; else S.abort?.abort(); },
  retry: () => reply(S.lastImage),
  attach: () => $('#file-image').click(),
  'rm-image': () => setImage(null),
  clear: async () => {
    const chat = active();
    if (!chat.messages.length) return toast('Não há mensagens para limpar.', 'info');
    if (!(await ask({ title: 'Limpar conversa?', text: 'Todas as mensagens desta conversa serão apagadas.', ok: 'Limpar', danger: true }))) return;
    chat.messages = []; chat.title = 'Nova conversa'; saveChats(); renderAll();
  },
  'export-chat': () => {
    const chat = active();
    if (!chat.messages.length) return toast('Não há conversa para exportar.', 'warn');
    download(`kako-${new Date().toISOString().slice(0, 10)}.txt`, exportText(chat), 'text/plain'); toast('Conversa exportada.', 'ok');
  },
  'copy-msg': (el) => { const m = getMsg(el); if (m) copy(m.content, el); },
  'copy-code': (el) => copy($('code', el.closest('.code')).textContent, el),
  like: (el) => { el.classList.toggle('on'); el.innerHTML = `<i class="${el.classList.contains('on') ? 'fa-solid' : 'fa-regular'} fa-thumbs-up"></i>`; },
  regen: () => {
    if (S.busy) return;
    const chat = active();
    if (chat.messages.at(-1)?.role === 'assistant') chat.messages.pop();
    saveChats(); renderMessages(); reply(S.lastImage);
  },
  edit: (el) => {
    if (S.busy) return;
    const chat = active(), m = getMsg(el), i = chat.messages.indexOf(m);
    chat.messages.splice(i); saveChats(); renderAll();
    const input = $('#input'); input.value = m.content; autosize(); input.focus();
  },
  'open-settings': () => { document.body.classList.remove('nav-open'); S.panel = 'profile'; S.q = ''; const q = $('#st-q'); if (q) q.value = ''; renderSettings(); $('#settings').showModal(); },
  'close-settings': () => $('#settings').close(),
  panel: (el) => { S.panel = el.dataset.id; renderSettings(); },
  set: (el) => { setSetting(el.dataset.key, el.dataset.val); renderSettings(); },
  'pick-avatar': () => $('#file-avatar').click(),
  'rm-avatar': () => { S.user.avatar = ''; saveUser(); renderSettings(); renderMe(); renderMessages(); },
  banner: (el) => { S.user.banner = el.dataset.val; saveUser(); renderSettings(); },
  'pick-banner': () => $('#file-banner').click(),
  'setup-pick': () => $('#file-setup').click(),
  import: () => $('#file-import').click(),
  'reset-ai': () => { Object.keys(DEFAULTS).filter((k) => k.startsWith('ai')).forEach((k) => (S.settings[k] = DEFAULTS[k])); S.settings.context = DEFAULTS.context; saveSettings(); renderSettings(); flashSaved(); toast('IA restaurada ao padrão.', 'ok'); },
  ping: async () => {
    const out = $('#ping-out'); if (!out) return;
    out.className = 'pill'; out.textContent = 'Testando…';
    const t0 = performance.now();
    try {
      const r = await fetch(API_URL, { method: 'OPTIONS' });
      out.className = 'pill ' + (r.ok ? 'ok' : 'bad');
      out.textContent = r.ok ? `Online · ${Math.round(performance.now() - t0)} ms` : `Servidor respondeu ${r.status}`;
    } catch { out.className = 'pill bad'; out.textContent = 'Sem conexão com o servidor'; }
  },
  'export-all': () => {
    download(`kako-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ user: { name: S.user.name }, settings: S.settings, chats: S.chats, exportedAt: new Date().toISOString() }, null, 2), 'application/json');
    toast('Backup exportado.', 'ok');
  },
  'wipe-chats': async () => {
    if (!(await ask({ title: 'Apagar todo o histórico?', text: 'Todas as conversas serão removidas permanentemente.', ok: 'Apagar', danger: true }))) return;
    S.chats = []; newChat(false); localStorage.removeItem('kako2_chats'); renderAll(); toast('Histórico apagado.', 'ok');
  },
  'reset-settings': async () => {
    if (!(await ask({ title: 'Restaurar configurações?', text: 'Suas preferências voltarão ao padrão.', ok: 'Restaurar' }))) return;
    S.settings = { ...DEFAULTS }; saveSettings(); applyAppearance(); renderSettings(); renderMessages(); toast('Configurações restauradas.', 'ok');
  },
  'wipe-all': async () => {
    if (!(await ask({ title: 'Apagar tudo?', text: 'Perfil, conversas e preferências serão removidos deste dispositivo.', ok: 'Apagar tudo', danger: true }))) return;
    Object.keys(localStorage).filter((k) => k.startsWith('kako')).forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
};

/* ================= Eventos ================= */
document.addEventListener('click', (e) => {
  const dlg = e.target;
  if (dlg.tagName === 'DIALOG') return dlg.close(); // clique no backdrop
  const el = e.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el, e);
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'input') autosize();
  else if (t.id === 'search') renderChatList();
  else if (t.id === 'st-q') { S.q = t.value; renderSettings(); }
  else if (t.type === 'range' && t.dataset.key) { setSetting(t.dataset.key, +t.value); const o = t.nextElementSibling; if (o) o.textContent = FMT[t.dataset.key](+t.value); }
  else if (t.type === 'color' && t.dataset.key) {
    S.settings.accent = 'custom'; setSetting('accentCustom', t.value);
    $$('.sws button.on').forEach((x) => x.classList.remove('on'));
    t.parentElement.classList.add('on'); t.parentElement.style.background = t.value;
  }
  else if (t.classList.contains('ta')) { const c = $(`[data-for="${t.dataset.key}"]`); if (c) c.textContent = `${t.value.length}/${t.maxLength}`; }
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  try {
    if (t.type === 'checkbox' && t.dataset.key) setSetting(t.dataset.key, t.checked);
    else if (t.type === 'range' && t.dataset.key === 'volume') blip();
    else if (t.dataset.key && (t.tagName === 'SELECT' || t.classList.contains('ta'))) { const k = t.dataset.key; setSetting(k, typeof DEFAULTS[k] === 'number' ? +t.value : t.value.trim()); }
    else if (t.id === 'file-import' && t.files[0]) { await importBackup(t.files[0]); t.value = ''; }
    else if (t.id === 'file-image' && t.files[0]) await attachFile(t.files[0]);
    else if (t.id === 'file-avatar' && t.files[0]) { S.user.avatar = await readImage(t.files[0], 256, 0.85); saveUser(); renderSettings(); renderMe(); renderMessages(); t.value = ''; }
    else if (t.id === 'file-banner' && t.files[0]) { S.user.banner = await readImage(t.files[0], 900, 0.8); saveUser(); renderSettings(); t.value = ''; }
    else if (t.id === 'file-setup' && t.files[0]) { S.tmpAvatar = await readImage(t.files[0], 256, 0.85); $('#setup-av').innerHTML = avatarHtml(S.tmpAvatar); }
    else if (t.id === 'name-input') {
      const v = t.value.trim();
      if (!v) { t.value = S.user.name; return toast('O nome não pode ficar vazio.', 'warn'); }
      S.user.name = v; saveUser(); renderMe(); renderMessages(); toast('Nome atualizado.', 'ok');
    }
  } catch (err) { toast(err.message, 'err'); }
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'setup-form') return;
  e.preventDefault();
  const name = $('#setup-name').value.trim();
  if (!name) { toast('Por favor, digite seu nome.', 'warn'); return $('#setup-name').focus(); }
  S.user.name = name; S.user.avatar = S.tmpAvatar; saveUser(); renderApp();
});
document.addEventListener('keydown', (e) => {
  if (e.target.id === 'input' && e.key === 'Enter' && !e.isComposing) {
    const send = S.settings.enterToSend ? !e.shiftKey : e.ctrlKey || e.metaKey;
    if (send) { e.preventDefault(); submit(); }
  }
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search')?.focus(); }
  if (mod && e.shiftKey && e.key.toLowerCase() === 'o' && $('#thread')) { e.preventDefault(); newChat(); }
  if (mod && e.key === ',' && $('#thread')) { e.preventDefault(); ACTIONS['open-settings'](); }
  if (e.key === 'Escape') document.body.classList.remove('nav-open');
});
document.addEventListener('paste', (e) => {
  if (e.target.id !== 'input') return;
  const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
  if (f) { e.preventDefault(); attachFile(f); }
});
document.addEventListener('dragover', (e) => { if ($('#box')) { e.preventDefault(); $('#box').classList.add('drag'); } });
document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) $('#box')?.classList.remove('drag'); });
document.addEventListener('drop', (e) => {
  if (!$('#box')) return;
  e.preventDefault(); $('#box').classList.remove('drag');
  const f = e.dataTransfer?.files?.[0]; if (f) attachFile(f);
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => S.settings.theme === 'auto' && applyAppearance());

/* ================= Boot ================= */
function boot() {
  load(); applyAppearance();
  S.user.name ? renderApp() : renderSetup();
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
