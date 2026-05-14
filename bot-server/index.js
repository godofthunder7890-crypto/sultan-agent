// Sultan Agent Bot Server v6.0 — God Mode
// 24/7 Railway | Groq→Gemini→OpenAI fallback | Firebase sync | Voice | Memory

const https  = require('https');
const http   = require('http');
const { Buffer } = require('buffer');

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const GROQ    = process.env.GROQ_API_KEY    || '';
const GEMINI  = process.env.GEMINI_API_KEY  || '';
const OPENAI  = process.env.OPENAI_API_KEY  || '';
const SERPER  = process.env.SERPER_API_KEY  || '';
const ADMIN   = process.env.ADMIN_CHAT_ID   || process.env.TELEGRAM_CHAT_ID || '';
const PORT    = parseInt(process.env.PORT   || '3000');
const FB_KEY  = process.env.FIREBASE_API_KEY    || 'AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s';
const FB_ID   = process.env.FIREBASE_PROJECT_ID || 'v11345';
const FB_USER = process.env.FIREBASE_USER_ID    || 'sultan';

// ─── Health Check ─────────────────────────────────────────────────────────────
http.createServer((_, res) => {
  const up = process.uptime();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    bot: 'Sultan Agent v6.0 — God Mode',
    uptime: Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm',
    ai: GROQ ? 'Groq⚡+Gemini🔮+OpenAI🧠' : GEMINI ? 'Gemini🔮' : OPENAI ? 'OpenAI🧠' : 'none',
    firebase: 'connected (' + FB_ID + ')',
    voice: GROQ ? 'Whisper enabled' : 'need Groq key',
    search: SERPER ? 'Web search enabled' : 'disabled',
    version: '6.0',
  }));
}).listen(PORT, () => log('✅ Health check on port', PORT));

function log(...a) { console.log(new Date().toISOString().slice(11,19), ...a); }

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function httpJSON(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ _raw: d }); } });
    });
    req.on('error', reject);
    if (body) req.end(body); else req.end();
  });
}
function httpDownload(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// ─── Telegram API ─────────────────────────────────────────────────────────────
async function tg(method, body) {
  const data = body ? JSON.stringify(body) : null;
  return httpJSON({
    hostname: 'api.telegram.org',
    path: '/bot' + TOKEN + '/' + method,
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}
  }, data);
}

async function tgMultipart(fields, fileBuffer, filename, mimetype) {
  const boundary = 'SultanBound' + Date.now();
  const parts = [];
  for (const [k, v] of Object.entries(fields))
    parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + k + '"\r\n\r\n' + v + '\r\n');
  parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + filename + '"\r\nContent-Type: ' + mimetype + '\r\n\r\n');
  const bodyBuf = Buffer.concat([Buffer.from(parts.join('')), fileBuffer, Buffer.from('\r\n--' + boundary + '--\r\n')]);
  return httpJSON({
    hostname: 'api.groq.com', path: '/openai/v1/audio/transcriptions', method: 'POST',
    headers: { 'Authorization': 'Bearer ' + GROQ, 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': bodyBuf.length }
  }, bodyBuf);
}

// ─── Firebase REST ────────────────────────────────────────────────────────────
function toFS(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string')       fields[k] = { stringValue: v };
    else if (typeof v === 'number')  fields[k] = { integerValue: String(Math.floor(v)) };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (v != null)              fields[k] = { stringValue: String(v) };
  }
  return { fields };
}
function fromFS(doc) {
  const o = { _id: doc.name?.split('/').pop() || '' };
  for (const [k, v] of Object.entries(doc.fields || {}))
    o[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.doubleValue ?? '';
  return o;
}
function fbSave(col, id, data) {
  const body = JSON.stringify(toFS(data));
  const keys = Object.keys(data).map(k => 'updateMask.fieldPaths=' + k).join('&');
  httpJSON({
    hostname: 'firestore.googleapis.com',
    path: '/v1/projects/' + FB_ID + '/databases/(default)/documents/' + col + '/' + id + '?key=' + FB_KEY + '&' + keys,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, body).catch(() => {});
}
const fbCache = new Map();
async function fbGet(col) {
  const now = Date.now();
  const cached = fbCache.get(col);
  if (cached && now - cached.ts < 30000) return cached.data;
  try {
    const r = await httpJSON({
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/' + FB_ID + '/databases/(default)/documents/' + col + '?key=' + FB_KEY + '&pageSize=100',
      method: 'GET'
    });
    const data = (r.documents || []).map(fromFS);
    fbCache.set(col, { data, ts: now });
    return data;
  } catch { return cached?.data || []; }
}
function fbInvalidate(col) { fbCache.delete(col); }

// ─── Web Search ───────────────────────────────────────────────────────────────
async function webSearch(query) {
  if (!SERPER) return 'Web search key nahi hai. Settings mein SERPER_API_KEY daalo.';
  try {
    const body = JSON.stringify({ q: query, num: 5 });
    const r = await httpJSON({
      hostname: 'google.serper.dev', path: '/search', method: 'POST',
      headers: { 'X-API-KEY': SERPER, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    const results = (r.organic || []).slice(0, 4)
      .map((x, i) => (i+1) + '. ' + x.title + '\n' + x.snippet + '\nSource: ' + x.link)
      .join('\n\n');
    return results || 'Koi result nahi mila.';
  } catch(e) { return 'Search fail: ' + e.message; }
}

// ─── AI System ────────────────────────────────────────────────────────────────
const AI_SYSTEM = `You are Sultan Agent v6.0 — God Mode AI for Sultan, CEO of MA Engineering, Pakistan.
You are JARVIX — Sultan ka personal AI — ChatGPT + Gemini + Replit Agent combined:
- Expert in civil/structural engineering, BOQ, project quotations, Pakistan construction (PKR rates 2025)
- SMM panel expert (Instagram/YouTube followers, views, pricing, profit analysis)
- Full-stack coding expert (write, debug, review, explain any language — React Native, Node.js, Python, etc.)
- Business strategy, profit calculations, market analysis, investment advice
- Personal assistant (research, notes, reminders, planning, web search)
- Firebase & Railway deployment expert
Personality: Direct, confident, expert. Like JARVIS — warm to Sultan.
Language: ALWAYS reply in the EXACT same language Sultan uses (Urdu/English/Hinglish).
Format: Use Markdown. Code in code blocks. Bullet points for lists.
Special commands:
- /search [query] — web search karo
- /code [task] — code likho
- /calc [expression] — calculate karo
- /yaad [baat] — memory mein save karo
- /projects — engineering projects dekho
- /smm — SMM orders dekho
- /report — daily report`;

const chatHistory = new Map();
function addHist(cid, role, content) {
  if (!chatHistory.has(cid)) chatHistory.set(cid, []);
  const h = chatHistory.get(cid);
  h.push({ role, content });
  if (h.length > 30) h.splice(0, h.length - 30);
}
function getHist(cid) { return chatHistory.get(cid) || []; }
function clearHist(cid) { chatHistory.delete(cid); }

async function aiGroq(msgs) {
  if (!GROQ) throw new Error('no key');
  const body = JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: AI_SYSTEM }, ...msgs], max_tokens: 2048, temperature: 0.8 });
  const r = await httpJSON({ hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST', headers: { 'Authorization': 'Bearer ' + GROQ, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  if (r.choices?.[0]?.message?.content) return { text: r.choices[0].message.content, by: 'Groq ⚡' };
  throw new Error(r.error?.message || 'Groq failed');
}
async function aiGemini(msgs) {
  if (!GEMINI) throw new Error('no key');
  const contents = msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const body = JSON.stringify({ contents, systemInstruction: { parts: [{ text: AI_SYSTEM }] }, generationConfig: { maxOutputTokens: 2048, temperature: 0.8 } });
  const r = await httpJSON({ hostname: 'generativelanguage.googleapis.com', path: '/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  if (r.candidates?.[0]?.content?.parts?.[0]?.text) return { text: r.candidates[0].content.parts[0].text, by: 'Gemini 🔮' };
  throw new Error('Gemini failed');
}
async function aiOpenAI(msgs) {
  if (!OPENAI) throw new Error('no key');
  const body = JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: AI_SYSTEM }, ...msgs], max_tokens: 2048, temperature: 0.8 });
  const r = await httpJSON({ hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST', headers: { 'Authorization': 'Bearer ' + OPENAI, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  if (r.choices?.[0]?.message?.content) return { text: r.choices[0].message.content, by: 'OpenAI 🧠' };
  throw new Error('OpenAI failed');
}

async function callAI(cid, userText) {
  addHist(cid, 'user', userText);
  const msgs = getHist(cid);
  let result = null;
  let errors = [];
  if (GROQ)   { try { result = await aiGroq(msgs);   } catch(e) { errors.push('Groq: ' + e.message); log('[Groq]', e.message); } }
  if (!result && GEMINI) { try { result = await aiGemini(msgs); } catch(e) { errors.push('Gemini: ' + e.message); log('[Gemini]', e.message); } }
  if (!result && OPENAI) { try { result = await aiOpenAI(msgs); } catch(e) { errors.push('OpenAI: ' + e.message); log('[OpenAI]', e.message); } }
  if (result) {
    addHist(cid, 'assistant', result.text);
    fbSave('users/' + FB_USER + '/telegram', String(Date.now()), {
      type: 'ai_reply', text: result.text.slice(0, 400), provider: result.by,
      chatId: String(cid), timestamp: Date.now(), role: 'assistant'
    });
  }
  return result;
}

// ─── Voice Transcription ──────────────────────────────────────────────────────
async function transcribeVoice(fileId) {
  if (!GROQ) return null;
  try {
    const fi = await tg('getFile', { file_id: fileId });
    if (!fi.ok) return null;
    const audio = await httpDownload('https://api.telegram.org/file/bot' + TOKEN + '/' + fi.result.file_path);
    const r = await tgMultipart({ model: 'whisper-large-v3', response_format: 'text' }, audio, 'voice.ogg', 'audio/ogg');
    return (r._raw || r.text || '').trim() || null;
  } catch(e) { log('[Whisper]', e.message); return null; }
}

// ─── Keyboards ────────────────────────────────────────────────────────────────
const KB = {
  main: { inline_keyboard: [
    [{ text: '💬 AI Chat',      callback_data: 'flow_ai'    }, { text: '🔍 Web Search',  callback_data: 'flow_search' }],
    [{ text: '🏗️ Engineering', callback_data: 'menu_eng'   }, { text: '📊 SMM Panel',    callback_data: 'menu_smm'   }],
    [{ text: '🧠 Memory',       callback_data: 'menu_mem'   }, { text: '🛠️ Tools',         callback_data: 'menu_tools' }],
    [{ text: '📅 Daily Report', callback_data: 'cmd_report' }, { text: '🟢 Status',       callback_data: 'cmd_status' }],
  ]},
  eng: { inline_keyboard: [
    [{ text: '📁 Projects',     callback_data: 'cmd_projects' }, { text: '🧱 Materials',   callback_data: 'menu_mat'   }],
    [{ text: '📝 AI Quotation', callback_data: 'flow_quote'   }, { text: '💰 Profit Calc', callback_data: 'flow_profit'}],
    [{ text: '⬅️ Main Menu',    callback_data: 'menu_main'    }],
  ]},
  mat: { inline_keyboard: [
    [{ text: '🏗️ Cement', callback_data: 'mat_cement' }, { text: '⚙️ Steel', callback_data: 'mat_steel' }],
    [{ text: '🧱 Brick',  callback_data: 'mat_brick'  }, { text: '🪣 Sand',  callback_data: 'mat_sand'  }],
    [{ text: '🎨 Paint',  callback_data: 'mat_paint'  }, { text: '🟫 Tile',  callback_data: 'mat_tile'  }],
    [{ text: '⬅️ Back',   callback_data: 'menu_eng'   }],
  ]},
  smm:   { inline_keyboard: [[{ text: '📊 Dashboard', callback_data: 'cmd_smm' }, { text: '➕ Add Order', callback_data: 'flow_order' }], [{ text: '⬅️ Main', callback_data: 'menu_main' }]] },
  mem:   { inline_keyboard: [[{ text: '📋 All Memories', callback_data: 'cmd_memories' }, { text: '💾 Save Note', callback_data: 'flow_save' }], [{ text: '🗑️ Clear All', callback_data: 'cmd_clearmem' }, { text: '⬅️ Main', callback_data: 'menu_main' }]] },
  tools: { inline_keyboard: [
    [{ text: '🧮 Calculator', callback_data: 'flow_calc' }, { text: '⏰ Reminder', callback_data: 'flow_remind' }],
    [{ text: '🌤️ Weather', callback_data: 'flow_weather' }, { text: '🔍 Web Search', callback_data: 'flow_search' }],
    [{ text: '💸 Log Expense', callback_data: 'flow_expense' }, { text: '💰 Budget Check', callback_data: 'flow_budget' }],
    [{ text: '⬅️ Main', callback_data: 'menu_main' }],
  ]},
  back:  { inline_keyboard: [[{ text: '⬅️ Main Menu', callback_data: 'menu_main' }]] },
};

const MENU_TEXTS = {
  main:  '🤖 *Sultan Agent v6.0 — God Mode*\n\n_ChatGPT + Gemini + Web Search — Sirf Sultan ke liye_ 🔥\n\nKuch bhi poocho ya neeche se choose karo:',
  eng:   '🏗️ *MA Engineering Panel*\n\nProjects, materials, quotations, profit — sab yahan!',
  smm:   '📊 *SMM Panel*\n\nOrders track karo, revenue dekho!',
  mem:   '🧠 *Memory — Firebase Sync*\n\n_App + Bot dono mein dikhta hai!_',
  tools: '🛠️ *Tools — God Mode*\n\nCalculator, Reminders, Weather, Web Search!',
};

const MATERIALS = {
  cement: { price: 1350, unit: 'bag (50kg)', emoji: '🏗️' },
  steel:  { price: 280,  unit: 'kg',         emoji: '⚙️' },
  brick:  { price: 28,   unit: 'piece',      emoji: '🧱' },
  sand:   { price: 6000, unit: 'ton',        emoji: '🪣' },
  paint:  { price: 750,  unit: 'litre',      emoji: '🎨' },
  tile:   { price: 200,  unit: 'sqft',       emoji: '🟫' },
};

const userState = new Map();
const reminders = [];

const send = (cid, text, kb) => tg('sendMessage', { chat_id: cid, text, parse_mode: 'Markdown', reply_markup: kb || KB.back });
const typing = cid => tg('sendChatAction', { chat_id: cid, action: 'typing' }).catch(() => {});
const edit   = (cid, mid, text, kb) => tg('editMessageText', { chat_id: cid, message_id: mid, text, parse_mode: 'Markdown', reply_markup: kb || KB.back });

// ─── Daily Report ─────────────────────────────────────────────────────────────
async function dailyReport(cid) {
  const [projects, orders, memory] = await Promise.all([
    fbGet('users/' + FB_USER + '/projects'),
    fbGet('users/' + FB_USER + '/orders'),
    fbGet('users/' + FB_USER + '/memory'),
  ]);
  const date = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Karachi' });
  const active  = projects.filter(p => ['active', 'Active'].includes(p.status));
  const revenue = orders.reduce((s, o) => s + (parseFloat(o.unitPrice||0) * parseFloat(o.quantity||1)), 0);
  const totalProj = projects.reduce((s, p) => s + parseFloat(p.amount||0), 0);
  return send(cid,
    '🌅 *Daily Report — Sultan Agent v6.0*\n📅 ' + date +
    '\n\n🏗️ *Engineering*\nProjects: ' + projects.length + ' total | ' + active.length + ' active\n' +
    (active.slice(0,3).map(p=>'• ' + p.name + ' — PKR ' + parseFloat(p.amount||0).toLocaleString()).join('\n') || '• Koi active project nahi') +
    '\nTotal Revenue: PKR ' + totalProj.toLocaleString() +
    '\n\n📊 *SMM*\nOrders: ' + orders.length + ' | Revenue: PKR ' + revenue.toLocaleString() +
    '\n\n🧠 Memory: ' + memory.length + ' items' +
    '\n\n🤖 AI: ' + (GROQ?'Groq ⚡ ':'')+  (GEMINI?'Gemini 🔮 ':'') + (OPENAI?'OpenAI 🧠':'') +
    '\n🔍 Search: ' + (SERPER?'ON ✅':'OFF') +
    '\n🚂 Railway: 24/7 Online ✅',
    KB.main);
}

function scheduleDailyReport() {
  const now = new Date(), next = new Date();
  next.setUTCHours(2, 0, 0, 0); // 7 AM PKT
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(async () => { if (ADMIN) await dailyReport(ADMIN).catch(()=>{}); scheduleDailyReport(); }, next - now);
}

// ─── Callback Handler ─────────────────────────────────────────────────────────
async function handleCB(query) {
  const cid  = query.message.chat.id;
  const mid  = query.message.message_id;
  const data = query.data;
  await tg('answerCallbackQuery', { callback_query_id: query.id });

  // Menu navigation — instant
  if (['menu_main','menu_eng','menu_smm','menu_mem','menu_tools'].includes(data)) {
    const key = data.slice(5);
    const kb = { eng: KB.eng, smm: KB.smm, mem: KB.mem, tools: KB.tools }[key] || KB.main;
    return edit(cid, mid, MENU_TEXTS[key] || MENU_TEXTS.main, kb);
  }
  if (data === 'menu_mat') return edit(cid, mid, '🧱 *Material Rates 2025*\n\nJo chahiye select karo:', KB.mat);

  // Status
  if (data === 'cmd_status') {
    const up = process.uptime(), h = Math.floor(up/3600), m = Math.floor((up%3600)/60);
    return edit(cid, mid,
      '🟢 *Sultan Agent v6.0 — ONLINE*\n\n' +
      '⏱ Uptime: ' + h + 'h ' + m + 'm\n' +
      '🤖 AI: ' + (GROQ?'Groq ⚡ ':'')+  (GEMINI?'Gemini 🔮 ':'') + (OPENAI?'OpenAI 🧠':'❌ No AI!') + '\n' +
      '🔍 Web Search: ' + (SERPER?'✅ ON':'❌ OFF') + '\n' +
      '🔥 Firebase: ' + FB_ID + ' ✅\n' +
      '🎙️ Voice: ' + (GROQ?'✅ Whisper':'❌ Need Groq') + '\n' +
      '🚂 Railway: 24/7 ✅\n' +
      '📦 Version: v6.0 God Mode',
      KB.main);
  }

  // Daily report
  if (data === 'cmd_report') return dailyReport(cid);

  // Projects
  if (data === 'cmd_projects') {
    const projects = await fbGet('users/' + FB_USER + '/projects');
    if (!projects.length) return send(cid, '📁 *Projects*\n\nKoi project nahi. App mein add karo ya /add kaho.', KB.eng);
    const lines = projects.slice(0, 10).map(p =>
      '• *' + p.name + '* — ' + (p.status||'?') + '\n  Client: ' + (p.client||'?') + ' | PKR ' + parseFloat(p.amount||0).toLocaleString()
    ).join('\n\n');
    return send(cid, '🏗️ *Engineering Projects*\n\n' + lines + '\n\nTotal: ' + projects.length, KB.eng);
  }

  // SMM dashboard
  if (data === 'cmd_smm') {
    const orders = await fbGet('users/' + FB_USER + '/orders');
    const revenue = orders.reduce((s, o) => s + (parseFloat(o.unitPrice||0) * parseFloat(o.quantity||1)), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    if (!orders.length) return send(cid, '📊 *SMM Dashboard*\n\nKoi order nahi abhi.', KB.smm);
    const lines = orders.slice(0, 8).map(o =>
      '• ' + (o.service||'?') + ' × ' + o.quantity + '\n  PKR ' + (parseFloat(o.unitPrice||0)*parseFloat(o.quantity||1)).toLocaleString() + ' | ' + (o.status||'?')
    ).join('\n');
    return send(cid, '📊 *SMM Dashboard*\n\n' + lines + '\n\n💰 Revenue: PKR ' + revenue.toLocaleString() + '\n⏳ Pending: ' + pending + ' | ✅ Done: ' + completed, KB.smm);
  }

  // Memories
  if (data === 'cmd_memories') {
    const memory = await fbGet('users/' + FB_USER + '/memory');
    if (!memory.length) return send(cid, '🧠 *Memory*\n\nKoi memory nahi. "yaad rakh: [baat]" kaho ya Save karo.', KB.mem);
    const lines = memory.slice(0, 10).map((m, i) => (i+1) + '. ' + (m.text||'?').slice(0,100)).join('\n');
    return send(cid, '🧠 *Memories — Last ' + Math.min(memory.length,10) + '*\n\n' + lines + '\n\nTotal: ' + memory.length, KB.mem);
  }

  if (data === 'cmd_clearmem') {
    return send(cid, '⚠️ Confirm: /clearmem — sari memories delete hongi Firebase se.', KB.mem);
  }

  // Material rates
  const matKey = ['cement','steel','brick','sand','paint','tile'].find(k => data === 'mat_' + k);
  if (matKey) {
    const mat = MATERIALS[matKey];
    userState.set(cid, { flow: 'mat_qty', type: matKey });
    return send(cid, mat.emoji + ' *' + matKey.charAt(0).toUpperCase() + matKey.slice(1) + '*\nRate: PKR ' + mat.price.toLocaleString() + '/' + mat.unit + '\n\nKitna chahiye? (sirf number likho)', KB.back);
  }

  // Flow starters
  const flowMap = {
    flow_ai:     { flow: 'ai',      msg: '💬 *AI Chat — God Mode*\n\nKuch bhi poocho! Urdu/English/Hinglish — sab chalega.\n\n_Type your message:_' },
    flow_search: { flow: 'search',  msg: '🔍 *Web Search*\n\nKya search karna hai?' },
    flow_quote:  { flow: 'quote',   msg: '📝 *AI Quotation Generator*\n\nProject details do:\n_Example: 3 bedroom house, 1000 sqft, Lahore_' },
    flow_profit: { flow: 'profit',  msg: '💰 *Profit Calculator*\n\n2 numbers do: selling_price cost\n_Example: 150000 95000_' },
    flow_order:  { flow: 'order',   msg: '➕ *Add SMM Order*\n\nFormat: service quantity unit_price\n_Example: Instagram Followers 1000 0.5_' },
    flow_save:   { flow: 'save',    msg: '💾 *Save to Memory*\n\nKya save karna hai? Firebase mein store hoga.' },
    flow_calc:   { flow: 'calc',    msg: '🧮 *Calculator*\n\nExpression likho:\n_Example: 380 * 100 + 5000_' },
    flow_remind: { flow: 'remind',  msg: '⏰ *Set Reminder*\n\nFormat: 30m Ya message\n_Example: 2h Meeting hai_' },
    flow_weather:{ flow: 'weather', msg: '🌤️ *Weather*\n\nKis city ka weather chahiye?' },
    flow_expense:{ flow: 'expense', msg: '💸 *Log Expense*\n\nFormat: amount description\n_Example: 5000 Cement bags_' },
    flow_budget: { flow: 'budget',  msg: '💰 *Budget Check*\n\n2 numbers: total spent\n_Example: 100000 65000_' },
  };
  if (flowMap[data]) {
    userState.set(cid, { flow: flowMap[data].flow });
    return send(cid, flowMap[data].msg, KB.back);
  }
}

// ─── Text Handler ─────────────────────────────────────────────────────────────
async function handleText(msg) {
  const cid  = msg.chat.id;
  const text = msg.text || '';
  const lower = text.toLowerCase().trim();

  // Commands
  if (text === '/start' || text === '/menu') {
    userState.delete(cid);
    return send(cid, MENU_TEXTS.main, KB.main);
  }
  if (text === '/status') return send(cid, '🟢 Sultan Agent v6.0 Online | AI: ' + (GROQ?'Groq⚡':'') + (GEMINI?' Gemini🔮':'') + (OPENAI?' OpenAI🧠':''), KB.main);
  if (text === '/report') return dailyReport(cid);
  if (text === '/clear') { clearHist(cid); return send(cid, '🧹 Chat history cleared!', KB.main); }
  if (text === '/clearmem') {
    const memory = await fbGet('users/' + FB_USER + '/memory');
    for (const m of memory) {
      await httpJSON({
        hostname: 'firestore.googleapis.com',
        path: '/v1/projects/' + FB_ID + '/databases/(default)/documents/users/' + FB_USER + '/memory/' + m._id + '?key=' + FB_KEY,
        method: 'DELETE', headers: {}
      }, null).catch(()=>{});
    }
    fbInvalidate('users/' + FB_USER + '/memory');
    return send(cid, '🗑️ Sari memories delete ho gayi!', KB.main);
  }

  // Special prefixes
  if (lower.startsWith('/search ') || lower.startsWith('search: ')) {
    const q = text.slice(text.indexOf(' ')+1);
    typing(cid);
    const results = await webSearch(q);
    const aiResult = await callAI(cid, 'Web search results for "' + q + '":\n\n' + results + '\n\nIn results ko summary mein batao.');
    return aiResult
      ? send(cid, '🔍 *' + q + '*\n\n' + aiResult.text + '\n\n_— ' + aiResult.by + '_', KB.main)
      : send(cid, '🔍 *Search Results:*\n\n' + results, KB.main);
  }

  if (lower.startsWith('yaad rakh') || lower.startsWith('remember:') || lower.startsWith('/yaad ')) {
    const note = text.replace(/^(yaad rakh|remember:|/yaads*)/i, '').trim();
    if (note) {
      fbSave('users/' + FB_USER + '/memory', String(Date.now()), { text: note, createdAt: Date.now(), tags: [], source: 'telegram' });
      fbInvalidate('users/' + FB_USER + '/memory');
      return send(cid, '🧠 *Yaad kar liya!*\n\n_"' + note + '"_\n\n🔥 Firebase + App mein save ✅', KB.main);
    }
  }

  // Flow state
  const state = userState.get(cid);
  if (state) {
    const flow = state.flow;
    userState.delete(cid);

    if (flow === 'ai') {
      typing(cid);
      const result = await callAI(cid, text);
      return result
        ? send(cid, result.text + '\n\n_— ' + result.by + '_', KB.main)
        : send(cid, '❌ AI unavailable. Keys check karo.', KB.main);
    }

    if (flow === 'search') {
      typing(cid);
      const results = await webSearch(text);
      const aiResult = await callAI(cid, 'Web search results for "' + text + '":\n\n' + results + '\n\nIn results ko summary mein batao.');
      return aiResult
        ? send(cid, '🔍 *' + text + '*\n\n' + aiResult.text + '\n\n_— ' + aiResult.by + '_', KB.main)
        : send(cid, '🔍 *Search Results:*\n\n' + results, KB.main);
    }

    if (flow === 'quote') {
      typing(cid);
      const result = await callAI(cid, 'MA Engineering project ke liye detailed quotation banao: ' + text + '. PKR mein rates do, 2025 Pakistan market rates. Professional format mein.');
      return result
        ? send(cid, '📝 *Project Quotation*\n\n' + result.text + '\n\n_— ' + result.by + '_', KB.eng)
        : send(cid, '❌ AI unavailable.', KB.eng);
    }

    if (flow === 'profit') {
      const parts = text.trim().split(/\s+/);
      if (parts.length < 2) return send(cid, '⚠️ 2 numbers chahiye: selling cost\nExample: 150000 95000');
      const p = parseFloat(parts[0]), c = parseFloat(parts[1]);
      if (isNaN(p)||isNaN(c)) return send(cid, '⚠️ Sirf numbers likho.');
      const profit = p - c, margin = ((profit/p)*100).toFixed(1);
      const bars = Math.floor(Math.min(100, Math.abs(parseFloat(margin)))/10);
      const bar = '▓'.repeat(bars) + '░'.repeat(10-bars);
      const emoji = profit < 0 ? '❌' : parseFloat(margin) > 30 ? '🚀' : parseFloat(margin) > 15 ? '✅' : '⚠️';
      return send(cid, '💰 *Profit Analysis*\n\nSelling: PKR ' + p.toLocaleString() + '\nCost:    PKR ' + c.toLocaleString() + '\nProfit:  PKR ' + profit.toLocaleString() + '\n\n[' + bar + '] ' + margin + '% ' + emoji, KB.main);
    }

    if (flow === 'order') {
      const parts = text.trim().split(/\s+/);
      if (parts.length < 3) return send(cid, '⚠️ Format: service quantity unit_price');
      const unitPrice = parseFloat(parts[parts.length-1]), quantity = parseInt(parts[parts.length-2]);
      const service = parts.slice(0,-2).join(' ');
      fbSave('users/' + FB_USER + '/orders', String(Date.now()), { service, quantity, unitPrice, status: 'pending', date: new Date().toISOString().split('T')[0] });
      fbInvalidate('users/' + FB_USER + '/orders');
      return send(cid, '📦 *Order Added!*\n\n' + service + '\nQty: ' + quantity.toLocaleString() + ' | Rate: PKR ' + unitPrice + '/unit\nTotal: PKR ' + (quantity*unitPrice).toLocaleString() + '\n\n🔥 App mein bhi dikh jayega ✅', KB.smm);
    }

    if (flow === 'save') {
      fbSave('users/' + FB_USER + '/memory', String(Date.now()), { text, createdAt: Date.now(), tags: [], source: 'telegram' });
      fbInvalidate('users/' + FB_USER + '/memory');
      return send(cid, '🧠 *Saved!*\n\n_"' + text + '"_\n\n🔥 App sync ✅', KB.mem);
    }

    if (flow === 'expense') {
      const match = text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (!match) return send(cid, '⚠️ Format: amount description\nExample: 5000 Cement bags');
      const [,amt,desc] = match;
      fbSave('users/' + FB_USER + '/memory', String(Date.now()), { text: '💸 PKR ' + amt + ' — ' + desc, createdAt: Date.now(), tags: ['expense'], source: 'telegram' });
      fbInvalidate('users/' + FB_USER + '/memory');
      return send(cid, '💸 *Expense Logged!*\n\nPKR ' + parseFloat(amt).toLocaleString() + ' — ' + desc + '\n🔥 App save ✅', KB.main);
    }

    if (flow === 'budget') {
      const [t,s] = text.split(/\s+/).map(Number);
      if (isNaN(t)||isNaN(s)) return send(cid, '⚠️ Format: total spent\nExample: 100000 65000');
      const rem = t-s, pct = Math.min(100,(s/t*100)).toFixed(1);
      const bars = Math.floor(parseFloat(pct)/10);
      const bar = '▓'.repeat(bars) + '░'.repeat(10-bars);
      const st = rem<0?'❌ Over budget!':parseFloat(pct)>85?'🔴 Almost khatam!':parseFloat(pct)>60?'🟡 Theek hai':'🟢 Safe';
      return send(cid, '💰 *Budget Check*\n\nTotal: PKR ' + t.toLocaleString() + '\nSpent: PKR ' + s.toLocaleString() + '\nBacha: PKR ' + Math.abs(rem).toLocaleString() + (rem<0?' (OVER!)':'') + '\n\n[' + bar + '] ' + pct + '%\n' + st, KB.main);
    }

    if (flow === 'calc') {
      try {
        const safe = text.replace(/[^0-9+\-*/.() ]/g,'');
        const res = new Function('return (' + safe + ')')();
        return send(cid, '🧮 `' + text + '` = *' + Number(res).toLocaleString() + '*', KB.main);
      } catch { return send(cid, '❌ Invalid. Example: 380 * 100'); }
    }

    if (flow === 'weather') {
      typing(cid);
      const result = await callAI(cid, text + ' ka abhi ka weather kya hai? Temperature, humidity, wind detail mein batao. Agar real data nahi hai to best estimate do.');
      return result ? send(cid, result.text, KB.main) : send(cid, '🌤️ Weather unavailable.', KB.main);
    }

    if (flow === 'remind') {
      const match = text.match(/^(\d+)(m|h|d)\s+(.+)$/i);
      if (!match) return send(cid, '⚠️ Format: 30m Message\nExample: 2h Meeting hai');
      const [,num,unit,message] = match;
      const ms = {m:60000,h:3600000,d:86400000}[unit.toLowerCase()];
      reminders.push({ chatId: cid, text: message, fireAt: Date.now()+parseInt(num)*ms });
      const label = num + ' ' + (unit==='m'?'minute':unit==='h'?'ghante':'din');
      return send(cid, '⏰ *Reminder Set!*\n\n_"' + message + '"_\n' + label + ' baad yaad dilaaunga ✅', KB.main);
    }

    if (flow === 'mat_qty') {
      const qty = parseFloat(text);
      const mat = MATERIALS[state.type];
      if (!mat||isNaN(qty)||qty<=0) return send(cid, '⚠️ Sirf number type karo. Example: 100');
      return send(cid, mat.emoji + ' *Material Cost*\n\n' + state.type + ' × ' + qty + ' ' + mat.unit + '\nRate: PKR ' + mat.price.toLocaleString() + '/' + mat.unit + '\n\n💰 *Total: PKR ' + (qty*mat.price).toLocaleString() + '*', KB.eng);
    }
  }

  // Default: AI chat
  typing(cid);
  const result = await callAI(cid, text);
  return result
    ? tg('sendMessage', { chat_id: cid, text: result.text + '\n\n_— ' + result.by + '_', parse_mode: 'Markdown', reply_markup: KB.main })
    : send(cid, '❌ AI unavailable. /status check karo.', KB.main);
}

// ─── Voice Handler ────────────────────────────────────────────────────────────
async function handleVoice(msg) {
  const cid = msg.chat.id;
  typing(cid);
  const text = await transcribeVoice(msg.voice.file_id);
  if (!text) return send(cid, '❌ Voice transcription fail. Groq key check karo.', KB.main);
  await tg('sendMessage', { chat_id: cid, text: '🎙️ _Transcribed: "' + text + '"_', parse_mode: 'Markdown' });
  const result = await callAI(cid, text);
  return result
    ? send(cid, result.text + '\n\n_— ' + result.by + '_', KB.main)
    : send(cid, '❌ AI unavailable.', KB.main);
}

// ─── Reminder tick ────────────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (let i = reminders.length-1; i>=0; i--) {
    if (now >= reminders[i].fireAt) {
      const r = reminders.splice(i,1)[0];
      tg('sendMessage', { chat_id: r.chatId, text: '⏰ *Reminder!*\n\n' + r.text, parse_mode: 'Markdown', reply_markup: KB.main }).catch(()=>{});
    }
  }
}, 15000);

// ─── Long Polling ─────────────────────────────────────────────────────────────
let offset = 0, errCount = 0;
async function poll() {
  try {
    const d = await tg('getUpdates', { offset, timeout: 20, limit: 20, allowed_updates: ['message','callback_query'] });
    if (!d.ok || !Array.isArray(d.result)) return;
    errCount = 0;
    for (const u of d.result) {
      offset = u.update_id + 1;
      if (u.callback_query) {
        log('[BTN]', (u.callback_query.from?.first_name||'?') + ':', u.callback_query.data);
        handleCB(u.callback_query).catch(e => log('[CB ERR]', e.message));
      } else if (u.message) {
        const m = u.message;
        log('[MSG]', (m.from?.first_name||'?') + ':', m.text?.slice(0,50) || (m.voice ? '🎙️ Voice' : '?'));
        if (m.voice)     handleVoice(m).catch(e => log('[Voice ERR]', e.message));
        else if (m.text) handleText(m).catch(e => log('[MSG ERR]', e.message));
      }
    }
  } catch(e) {
    errCount++;
    log('[Poll #' + errCount + ']', e.message);
    if (errCount > 5) await new Promise(r => setTimeout(r, 10000));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN missing!'); process.exit(1); }
  const me = await tg('getMe');
  if (!me.ok) { console.error('❌ Invalid bot token!'); process.exit(1); }
  log('✅ @' + me.result.username + ' — Sultan Agent v6.0 God Mode ONLINE');
  log('🤖 AI: ' + (GROQ?'Groq ⚡ ':'') + (GEMINI?'Gemini 🔮 ':'') + (OPENAI?'OpenAI 🧠 ':'') + (!GROQ&&!GEMINI&&!OPENAI?'❌ NO AI KEY!':''));
  log('🔍 Web Search: ' + (SERPER?'✅ Enabled':'❌ Disabled'));
  log('🔥 Firebase: ' + FB_ID);
  scheduleDailyReport();
  if (ADMIN) {
    tg('sendMessage', {
      chat_id: ADMIN,
      text: '🚀 *Sultan Agent v6.0 — God Mode ONLINE!*\n\n' +
        '🤖 AI Chain: ' + (GROQ?'Groq ⚡ → ':'') + (GEMINI?'Gemini 🔮 → ':'') + (OPENAI?'OpenAI 🧠':'') + '\n' +
        '🔍 Web Search: ' + (SERPER?'✅ ON':'❌ OFF') + '\n' +
        '🎙️ Voice: ' + (GROQ?'✅ Whisper':'❌ Need Groq') + '\n' +
        '🔥 Firebase: ' + FB_ID + ' ✅\n' +
        '🚂 Railway: 24/7 Online\n\n' +
        '✨ *New in v6.0:*\n' +
        '• Web search (Serper API)\n' +
        '• Better memory commands\n' +
        '• Longer AI context (30 msgs)\n' +
        '• Smarter AI fallback chain\n' +
        '• Updated PKR material rates 2025\n\n' +
        'Main menu neeche hai 👇',
      parse_mode: 'Markdown', reply_markup: KB.main,
    }).catch(()=>{});
  }
  while (true) { await poll(); await new Promise(r => setTimeout(r, 100)); }
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
