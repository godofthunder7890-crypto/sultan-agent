// Sultan Agent Bot Server v5.0 — 24/7 Railway Edition
// ChatGPT + Gemini + Replit Agent jaisi AI, Voice Messages, App+Bot Firebase Sync

const https  = require('https');
const http   = require('http');
const { Buffer } = require('buffer');

// ─── Config ──────────────────────────────────────────────────────────────────
const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const GROQ    = process.env.GROQ_API_KEY    || '';
const GEMINI  = process.env.GEMINI_API_KEY  || '';
const OPENAI  = process.env.OPENAI_API_KEY  || '';
const ADMIN   = process.env.ADMIN_CHAT_ID   || '';
const PORT    = parseInt(process.env.PORT   || '3000');
const WEATHER = process.env.WEATHER_API_KEY || '';
// Firebase — same project as mobile app
const FB_KEY  = process.env.FIREBASE_API_KEY    || 'AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s';
const FB_ID   = process.env.FIREBASE_PROJECT_ID || 'v11345';
const FB_USER = process.env.FIREBASE_USER_ID    || 'sultan';

// ─── Health Check Server (Railway 24/7 alive) ─────────────────────────────────
http.createServer((_, res) => {
  const up = process.uptime();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online', bot: 'Sultan Agent v5.0',
    uptime: `${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m`,
    ai: GROQ ? 'Groq' : GEMINI ? 'Gemini' : OPENAI ? 'OpenAI' : 'none',
    firebase: FB_KEY ? `connected (${FB_ID})` : 'not set',
    voice: GROQ ? 'Whisper enabled' : 'need Groq key',
  }));
}).listen(PORT, () => log('Health check server on port', PORT));

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
    path: `/bot${TOKEN}/${method}`,
    method: data ? 'POST' : 'GET',
    headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}
  }, data);
}

async function tgMultipart(fields, fileBuffer, filename, mimetype) {
  const boundary = 'SultanBound' + Date.now();
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`);
  }
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`);
  const bodyBuf = Buffer.concat([Buffer.from(parts.join('')), fileBuffer, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  return httpJSON({
    hostname: 'api.groq.com', path: '/openai/v1/audio/transcriptions', method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ}`, 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': bodyBuf.length }
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
async function fbSave(col, id, data) {
  try {
    const body = JSON.stringify(toFS(data));
    const keys = Object.keys(data).map(k => 'updateMask.fieldPaths=' + k).join('&');
    return httpJSON({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FB_ID}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}&${keys}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
  } catch {}
}
async function fbGet(col) {
  try {
    const r = await httpJSON({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${FB_ID}/databases/(default)/documents/${col}?key=${FB_KEY}`,
      method: 'GET'
    });
    return (r.documents || []).map(fromFS);
  } catch { return []; }
}

// ─── AI System ────────────────────────────────────────────────────────────────
const AI_SYSTEM = `You are Sultan Agent v5.0 — an ultra-powerful personal AI for Sultan, CEO of MA Engineering, Pakistan.

You are JARVIX — Sultan ka personal AI — like ChatGPT + Gemini + Replit Agent combined:
- Expert in civil/structural engineering, BOQ, project quotations, Pakistan construction (PKR rates)
- SMM panel expert (Instagram/YouTube followers, views, pricing strategies, profit analysis)
- Full-stack coding expert (write, debug, review, explain any language)
- Business strategy, profit calculations, market analysis, investment advice
- Personal assistant (research, notes, reminders, planning)

Personality: Direct, confident, expert. Like JARVIS for Tony Stark — but warm and friendly.
Language: ALWAYS reply in the EXACT same language Sultan uses:
  - Urdu → Reply in Urdu
  - English → Reply in English
  - Hinglish/Roman Urdu → Reply in same mix
Format: Use proper Markdown. Code in code blocks. Use bullet points for lists.
Be genuinely helpful — not robotic. Celebrate wins. Keep it real.`;

const chatHistory = new Map();
function addHist(chatId, role, content) {
  if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
  const h = chatHistory.get(chatId);
  h.push({ role, content });
  if (h.length > 24) h.splice(0, h.length - 24);
}
function getHist(chatId) { return chatHistory.get(chatId) || []; }

async function aiGroq(msgs) {
  const body = JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: AI_SYSTEM }, ...msgs], max_tokens: 1500, temperature: 0.8 });
  const r = await httpJSON({ hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST', headers: { 'Authorization': `Bearer ${GROQ}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  if (r.choices?.[0]?.message?.content) return { text: r.choices[0].message.content, by: 'Groq ⚡' };
  throw new Error(r.error?.message || 'Groq failed');
}
async function aiGemini(msgs) {
  const contents = msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const body = JSON.stringify({ contents, systemInstruction: { parts: [{ text: AI_SYSTEM }] }, generationConfig: { maxOutputTokens: 1500, temperature: 0.8 } });
  const r = await httpJSON({ hostname: 'generativelanguage.googleapis.com', path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI}`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  if (r.candidates?.[0]?.content?.parts?.[0]?.text) return { text: r.candidates[0].content.parts[0].text, by: 'Gemini 🔮' };
  throw new Error('Gemini failed');
}
async function aiOpenAI(msgs) {
  const body = JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: AI_SYSTEM }, ...msgs], max_tokens: 1500, temperature: 0.8 });
  const r = await httpJSON({ hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST', headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  if (r.choices?.[0]?.message?.content) return { text: r.choices[0].message.content, by: 'OpenAI 🧠' };
  throw new Error('OpenAI failed');
}

async function callAI(chatId, userText) {
  addHist(chatId, 'user', userText);
  const msgs = getHist(chatId);
  let result = null;
  if (GROQ)            { try { result = await aiGroq(msgs);   } catch(e) { log('[Groq]',   e.message); } }
  if (!result && GEMINI) { try { result = await aiGemini(msgs); } catch(e) { log('[Gemini]', e.message); } }
  if (!result && OPENAI) { try { result = await aiOpenAI(msgs); } catch(e) { log('[OpenAI]', e.message); } }
  if (result) {
    addHist(chatId, 'assistant', result.text);
    fbSave(`users/${FB_USER}/telegram`, String(Date.now()), {
      type: 'ai_reply', text: result.text.slice(0, 400), provider: result.by,
      chatId: String(chatId), timestamp: Date.now(), role: 'assistant'
    }).catch(() => {});
  }
  return result;
}

// ─── Voice Transcription (Groq Whisper) ──────────────────────────────────────
async function transcribeVoice(fileId) {
  if (!GROQ) return null;
  try {
    const fi = await tg('getFile', { file_id: fileId });
    if (!fi.ok) return null;
    const audio = await httpDownload(`https://api.telegram.org/file/bot${TOKEN}/${fi.result.file_path}`);
    const r = await tgMultipart({ model: 'whisper-large-v3', response_format: 'text' }, audio, 'voice.ogg', 'audio/ogg');
    return (r._raw || r.text || '').trim() || null;
  } catch(e) { log('[Whisper]', e.message); return null; }
}

// ─── Keyboards & Menus ────────────────────────────────────────────────────────
const KB = {
  main: { inline_keyboard: [
    [{ text: '💬 AI Chat',      callback_data: 'flow_ai'    }, { text: '🏗️ Engineering', callback_data: 'menu_eng'   }],
    [{ text: '📊 SMM Panel',    callback_data: 'menu_smm'   }, { text: '💸 Finance',      callback_data: 'menu_fin'   }],
    [{ text: '🧠 Memory',       callback_data: 'menu_mem'   }, { text: '🛠️ Tools',         callback_data: 'menu_tools' }],
    [{ text: '📅 Daily Report', callback_data: 'cmd_report' }, { text: '🟢 Status',       callback_data: 'cmd_status' }],
  ]},
  eng: { inline_keyboard: [
    [{ text: '📁 Projects',      callback_data: 'cmd_projects' }],
    [{ text: '🧱 Material Cost', callback_data: 'menu_mat'     }],
    [{ text: '📝 AI Quotation',  callback_data: 'flow_quote'   }],
    [{ text: '💰 Profit Calc',   callback_data: 'flow_profit'  }],
    [{ text: '⬅️ Main Menu',     callback_data: 'menu_main'    }],
  ]},
  mat: { inline_keyboard: [
    [{ text: '🏗️ Cement', callback_data: 'mat_cement' }, { text: '⚙️ Steel', callback_data: 'mat_steel' }],
    [{ text: '🧱 Brick',  callback_data: 'mat_brick'  }, { text: '🪣 Sand',  callback_data: 'mat_sand'  }],
    [{ text: '🎨 Paint',  callback_data: 'mat_paint'  }, { text: '🟫 Tile',  callback_data: 'mat_tile'  }],
    [{ text: '⬅️ Back',   callback_data: 'menu_eng'   }],
  ]},
  smm:   { inline_keyboard: [[{ text: '📊 Dashboard', callback_data: 'cmd_smm' }], [{ text: '➕ Add Order', callback_data: 'flow_order' }], [{ text: '⬅️ Main', callback_data: 'menu_main' }]] },
  fin:   { inline_keyboard: [[{ text: '💸 Log Expense', callback_data: 'flow_expense' }], [{ text: '💰 Budget Check', callback_data: 'flow_budget' }], [{ text: '⬅️ Main', callback_data: 'menu_main' }]] },
  mem:   { inline_keyboard: [[{ text: '🧠 See Memories', callback_data: 'cmd_memories' }], [{ text: '💾 Save Something', callback_data: 'flow_save' }], [{ text: '⬅️ Main', callback_data: 'menu_main' }]] },
  tools: { inline_keyboard: [[{ text: '🧮 Calculator', callback_data: 'flow_calc' }, { text: '⏰ Reminder', callback_data: 'flow_remind' }], [{ text: '🌤️ Weather', callback_data: 'flow_weather' }], [{ text: '⬅️ Main', callback_data: 'menu_main' }]] },
  back:  { inline_keyboard: [[{ text: '⬅️ Main Menu', callback_data: 'menu_main' }]] },
};

const MENU_TEXTS = {
  main:  '🤖 *Sultan Agent v5.0*\n\n_ChatGPT + Gemini + Replit Agent — Sirf Sultan ke liye_ 🔥\n\nKuch bhi poocho ya neeche se choose karo:',
  eng:   '🏗️ *MA Engineering Panel*\n\nProjects, materials, quotations, profit — sab yahan!',
  smm:   '📊 *SMM Panel*\n\nOrders track karo, revenue dekho!',
  fin:   '💸 *Finance Manager*\n\nExpenses log karo, budget check karo!',
  mem:   '🧠 *Memory — Firebase Sync*\n\n_App + Bot dono mein dikh ta hai!_',
  tools: '🛠️ *Tools*\n\nCalculator, Reminders, Weather!',
};

function menuKb(key) {
  return { eng: KB.eng, smm: KB.smm, fin: KB.fin, mem: KB.mem, tools: KB.tools, mat: KB.mat }[key] || KB.main;
}

const MATERIALS = {
  cement: { price: 1200, unit: 'bag (50kg)', emoji: '🏗️' },
  steel:  { price: 220,  unit: 'kg',         emoji: '⚙️' },
  brick:  { price: 25,   unit: 'piece',      emoji: '🧱' },
  sand:   { price: 5000, unit: 'ton',        emoji: '🪣' },
  paint:  { price: 650,  unit: 'litre',      emoji: '🎨' },
  tile:   { price: 180,  unit: 'sqft',       emoji: '🟫' },
};

const userState = new Map();
const reminders = [];

// ─── Send helpers ─────────────────────────────────────────────────────────────
const send = (cid, text, kb) => tg('sendMessage', { chat_id: cid, text, parse_mode: 'Markdown', reply_markup: kb || KB.back });
const typing = cid => tg('sendChatAction', { chat_id: cid, action: 'typing' }).catch(() => {});
const edit = (cid, mid, text, kb) => tg('editMessageText', { chat_id: cid, message_id: mid, text, parse_mode: 'Markdown', reply_markup: kb || KB.back });

// ─── Daily Report ─────────────────────────────────────────────────────────────
async function dailyReport(cid) {
  const [projects, orders, memory] = await Promise.all([
    fbGet(`users/${FB_USER}/projects`), fbGet(`users/${FB_USER}/orders`), fbGet(`users/${FB_USER}/memory`),
  ]);
  const date = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Karachi' });
  const active = projects.filter(p => ['active', 'Active'].includes(p.status));
  const revenue = orders.reduce((s, o) => s + (parseFloat(o.unitPrice || 0) * parseFloat(o.quantity || 1)), 0);
  return send(cid,
    `🌅 *Sultan Agent — Daily Report*\n📅 ${date}\n\n🏗️ *Engineering*\n${active.slice(0,3).map(p => '• ' + p.name).join('\n') || '• Koi active project nahi'}\nTotal: ${projects.length} | Active: ${active.length}\n\n📊 *SMM Panel*\nOrders: ${orders.length} | Revenue: PKR ${revenue.toLocaleString()}\n\n🧠 *Memory*\n${memory.length} cheezein saved\n\n🤖 AI: ${GROQ ? 'Groq ⚡' : GEMINI ? 'Gemini 🔮' : 'OpenAI 🧠'} | 🚂 Railway: 24/7 Online`,
    KB.main);
}

function scheduleDailyReport() {
  const now = new Date(), next = new Date();
  next.setUTCHours(2, 0, 0, 0); // 7 AM PKT
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(async () => { if (ADMIN) await dailyReport(ADMIN).catch(() => {}); scheduleDailyReport(); }, next - now);
  log('Next daily report:', next.toISOString());
}

// ─── Callback handler ─────────────────────────────────────────────────────────
async function handleCB(query) {
  const cid  = query.message.chat.id;
  const mid  = query.message.message_id;
  const data = query.data;
  await tg('answerCallbackQuery', { callback_query_id: query.id });

  // Menu navigation
  if (data.startsWith('menu_')) {
    const key = data.slice(5);
    return edit(cid, mid, MENU_TEXTS[key] || MENU_TEXTS.main, menuKb(key));
  }

  if (data === 'cmd_status') {
    const up = process.uptime(), h = Math.floor(up/3600), m = Math.floor((up%3600)/60);
    return edit(cid, mid,
      `🟢 *Sultan Agent v5.0 — Online!*\n\n⏱️ Uptime: ${h}h ${m}m\n🤖 AI: ${GROQ ? 'Groq ⚡' : ''}${GEMINI ? ' Gemini 🔮' : ''}${OPENAI ? ' OpenAI 🧠' : ''}${!GROQ && !GEMINI && !OPENAI ? '❌ No key' : ''}\n🔥 Firebase: ${FB_KEY ? `${FB_ID} ✅` : '❌ Not set'}\n🎙️ Voice: ${GROQ ? 'Whisper ✅' : '❌ Need Groq'}\n📱 App Sync: Real-time ✅\n🚂 Railway: 24/7 ✅`,
      KB.back);
  }

  if (data === 'cmd_report') return dailyReport(cid);

  if (data === 'cmd_projects') {
    const ps = await fbGet(`users/${FB_USER}/projects`);
    if (!ps.length) return edit(cid, mid, '🏗️ *Projects*\n\nApp se project add karo — yahan dikh jayega!', KB.eng);
    const list = ps.slice(0, 8).map((p, i) => `${i+1}. *${p.name}* — ${p.status || 'Active'}${p.amount ? ' | PKR ' + parseInt(p.amount).toLocaleString() : ''}`).join('\n');
    return edit(cid, mid, `🏗️ *Projects* (${ps.length})\n\n${list}`, KB.eng);
  }

  if (data === 'cmd_smm') {
    const os = await fbGet(`users/${FB_USER}/orders`);
    const rev = os.reduce((s, o) => s + (parseFloat(o.unitPrice || 0) * parseFloat(o.quantity || 1)), 0);
    return edit(cid, mid,
      `📊 *SMM Dashboard*\n\nTotal: ${os.length} orders\nPending: ${os.filter(o => o.status === 'pending').length}\nDone: ${os.filter(o => o.status === 'completed').length}\nRevenue: PKR ${rev.toLocaleString()}\n\n${os.slice(0, 5).map(o => `• ${o.service || 'Order'} — ${o.status || 'pending'}`).join('\n') || '• Koi order nahi'}`,
      KB.smm);
  }

  if (data === 'cmd_memories') {
    const ms = await fbGet(`users/${FB_USER}/memory`);
    if (!ms.length) return edit(cid, mid, '🧠 *Memory*\n\nKoi memory nahi. "Yaad rakh [baat]" likh kar save karo!', KB.mem);
    const list = ms.slice(-8).reverse().map((m, i) => `${i+1}. ${(m.text || m.content || '').slice(0, 80)}`).join('\n');
    return edit(cid, mid, `🧠 *Memories* (${ms.length})\n\n${list}`, KB.mem);
  }

  // Material buttons
  if (data.startsWith('mat_')) {
    const type = data.slice(4);
    const mat = MATERIALS[type];
    if (!mat) return;
    userState.set(cid, { flow: 'mat_qty', data: { type } });
    return edit(cid, mid, `${mat.emoji} *${type.charAt(0).toUpperCase() + type.slice(1)}*\n\nRate: PKR ${mat.price.toLocaleString()} / ${mat.unit}\n\nKitna chahiye? Number type karo:`, KB.back);
  }

  // Flow triggers
  const FLOW_TEXTS = {
    flow_ai:      '💬 *AI Chat Mode*\n\nMujhse kuch bhi poocho — coding, engineering, SMM, business, ya kuch bhi!\n\n🎙️ Voice message bhi bhej sakte ho!',
    flow_quote:   '📝 *AI Quotation*\n\nProject describe karo:\nExample: 2 bedroom house Lahore 1500 sqft',
    flow_profit:  '💰 *Profit Calc*\n\nFormat: selling_price cost\nExample: 50000 32000',
    flow_order:   '📦 *SMM Order Add*\n\nFormat: service quantity unit_price\nExample: Instagram Followers 10000 0.5',
    flow_expense: '💸 *Expense Log*\n\nFormat: amount description\nExample: 5000 Cement bags',
    flow_budget:  '💰 *Budget Check*\n\nFormat: total spent\nExample: 100000 65000',
    flow_save:    '💾 *Save Memory*\n\nJo yaad rakhna hai woh likho:',
    flow_calc:    '🧮 *Calculator*\n\nMath expression:\nExample: 380 * 500 + 250 * 20',
    flow_weather: '🌤️ *Weather*\n\nCity ka naam:\nExample: Lahore',
    flow_remind:  '⏰ *Reminder*\n\nFormat: 30m Meeting hai ya 2h Lunch',
  };

  if (FLOW_TEXTS[data]) {
    userState.set(cid, { flow: data.slice(5), step: 0 });
    return edit(cid, mid, FLOW_TEXTS[data], KB.back);
  }
}

// ─── Text handler ─────────────────────────────────────────────────────────────
async function handleText(msg) {
  const cid  = msg.chat.id;
  const text = (msg.text || '').trim();
  const from = msg.from?.first_name || 'User';

  // Save to Firebase (so app can see bot messages)
  fbSave(`users/${FB_USER}/telegram`, String(Date.now()), {
    type: 'incoming', text: text.slice(0, 300), from,
    chatId: String(cid), timestamp: Date.now(), role: 'user'
  }).catch(() => {});

  // Commands
  if (text === '/start' || text === '/menu') {
    return send(cid, `👋 *Salaam ${from}!*\n\n${MENU_TEXTS.main}`, KB.main);
  }
  if (text === '/status') {
    const up = process.uptime(), h = Math.floor(up/3600), m = Math.floor((up%3600)/60);
    return send(cid, `🟢 *Sultan Agent v5.0*\nUptime: ${h}h ${m}m\nAI: ${GROQ ? 'Groq ⚡' : GEMINI ? 'Gemini 🔮' : OPENAI ? 'OpenAI 🧠' : '❌'}\nFirebase: ${FB_KEY ? '✅' : '❌'}`, KB.main);
  }
  if (text === '/report') return dailyReport(cid);
  if (text === '/clear') { chatHistory.delete(cid); return send(cid, '🗑️ Chat history clear!', KB.main); }

  // Memory shortcuts
  const low = text.toLowerCase();
  const isMemory = low.startsWith('yaad rakh ') || low.startsWith('remember ') || low.startsWith('note karo ');
  if (isMemory) {
    const offset = low.startsWith('yaad rakh ') ? 10 : low.startsWith('remember ') ? 9 : 11;
    const content = text.slice(offset).trim();
    if (content) {
      await typing(cid);
      await fbSave(`users/${FB_USER}/memory`, String(Date.now()), { text: content, createdAt: Date.now(), tags: [], source: 'telegram' });
      addHist(cid, 'user', text);
      const mems = await fbGet(`users/${FB_USER}/memory`);
      const replyText = `🧠 *Yaad kar liya!*\n\n_"${content}"_\n\n🔥 Firebase + App mein sync ho gaya!\nTotal memories: ${mems.length}`;
      addHist(cid, 'assistant', replyText);
      return send(cid, replyText, KB.main);
    }
  }

  // Active flow
  const state = userState.get(cid);
  if (state) { userState.delete(cid); return handleFlow(cid, state.flow, text, state.data || {}); }

  // Default: full AI chat (like ChatGPT/Gemini)
  await typing(cid);
  const result = await callAI(cid, text);
  if (result) {
    return tg('sendMessage', { chat_id: cid, text: `${result.text}\n\n_— ${result.by}_`, parse_mode: 'Markdown', reply_markup: KB.main });
  }
  return send(cid,
    '❌ *AI abhi available nahi.*\n\nRailway mein koi ek API key set karo:\n• GROQ\\_API\\_KEY (free, best)\n• GEMINI\\_API\\_KEY\n• OPENAI\\_API\\_KEY',
    KB.main);
}

// ─── Voice handler ────────────────────────────────────────────────────────────
async function handleVoice(msg) {
  const cid = msg.chat.id;
  await typing(cid);

  if (!GROQ) {
    return send(cid, '🎙️ Voice messages ke liye GROQ\\_API\\_KEY chahiye (Railway mein set karo).\nText message bhejo.', KB.back);
  }

  const transcript = await transcribeVoice(msg.voice.file_id);
  if (!transcript) return send(cid, '❌ Voice samajh nahi aaya. Dobara try karo ya text likho.', KB.back);

  // Show what was heard
  await tg('sendMessage', { chat_id: cid, text: `🎙️ *Suna:* _"${transcript}"_`, parse_mode: 'Markdown' });

  // Save voice to Firebase
  fbSave(`users/${FB_USER}/telegram`, String(Date.now()), {
    type: 'voice', text: transcript.slice(0, 300), from: msg.from?.first_name || 'User',
    chatId: String(cid), timestamp: Date.now(), role: 'user'
  }).catch(() => {});

  // Memory shortcut from voice
  const low = transcript.toLowerCase();
  if (low.startsWith('yaad rakh ') || low.startsWith('remember ')) {
    const content = transcript.slice(low.startsWith('yaad rakh ') ? 10 : 9).trim();
    await fbSave(`users/${FB_USER}/memory`, String(Date.now()), { text: content, createdAt: Date.now(), tags: [], source: 'voice' });
    return send(cid, `🧠 *Voice se yaad kar liya!*\n\n_"${content}"_\n\n🔥 Firebase + App sync ✅`, KB.main);
  }

  // AI reply to voice
  await typing(cid);
  const result = await callAI(cid, transcript);
  if (result) {
    return tg('sendMessage', { chat_id: cid, text: `${result.text}\n\n_— ${result.by}_`, parse_mode: 'Markdown', reply_markup: KB.main });
  }
  return send(cid, `🎙️ Suna: _"${transcript}"_\n\n❌ AI available nahi.`, KB.main);
}

// ─── Flow handler ─────────────────────────────────────────────────────────────
async function handleFlow(cid, flow, input, data = {}) {
  await typing(cid);

  if (flow === 'ai') {
    const result = await callAI(cid, input);
    return result
      ? tg('sendMessage', { chat_id: cid, text: `${result.text}\n\n_— ${result.by}_`, parse_mode: 'Markdown', reply_markup: KB.main })
      : send(cid, '❌ AI unavailable. API key check karo.', KB.main);
  }

  if (flow === 'quote') {
    const prompt = `Engineering project ka professional quotation banao (Pakistani PKR rates): "${input}". Materials list, labor cost, timeline, aur total amount include karo.`;
    const result = await callAI(cid, prompt);
    return result ? tg('sendMessage', { chat_id: cid, text: result.text, parse_mode: 'Markdown', reply_markup: KB.eng }) : send(cid, '❌ AI unavailable.', KB.eng);
  }

  if (flow === 'profit') {
    const [p, c] = input.split(/\s+/).map(Number);
    if (isNaN(p) || isNaN(c)) return send(cid, '⚠️ Format: selling_price cost\nExample: 50000 32000');
    const profit = p - c;
    const margin = ((profit / p) * 100).toFixed(1);
    const emoji = parseFloat(margin) > 30 ? '🟢' : parseFloat(margin) > 15 ? '🟡' : '🔴';
    const bars = Math.floor(parseFloat(margin) / 10);
    const bar = '▓'.repeat(Math.min(bars, 10)) + '░'.repeat(Math.max(0, 10 - bars));
    return send(cid, `💰 *Profit Analysis*\n\nSelling: PKR ${p.toLocaleString()}\nCost:    PKR ${c.toLocaleString()}\nProfit:  PKR ${profit.toLocaleString()}\n\n[${bar}] ${margin}% ${emoji}`, KB.main);
  }

  if (flow === 'order') {
    const parts = input.trim().split(/\s+/);
    if (parts.length < 3) return send(cid, '⚠️ Format: service quantity unit_price\nExample: Instagram Followers 10000 0.5');
    const unitPrice = parseFloat(parts[parts.length - 1]);
    const quantity  = parseInt(parts[parts.length - 2]);
    const service   = parts.slice(0, -2).join(' ');
    await fbSave(`users/${FB_USER}/orders`, String(Date.now()), {
      service, quantity, unitPrice, status: 'pending',
      date: new Date().toISOString().split('T')[0]
    });
    return send(cid, `📦 *Order Added!*\n\n${service}\nQty: ${quantity.toLocaleString()} | Rate: PKR ${unitPrice}/unit\nTotal: PKR ${(quantity * unitPrice).toLocaleString()}\n\n🔥 App mein bhi dikh jayega ✅`, KB.smm);
  }

  if (flow === 'save') {
    await fbSave(`users/${FB_USER}/memory`, String(Date.now()), { text: input, createdAt: Date.now(), tags: [], source: 'telegram' });
    return send(cid, `🧠 *Saved!*\n\n_"${input}"_\n\n🔥 App + Bot sync ✅`, KB.mem);
  }

  if (flow === 'expense') {
    const match = input.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!match) return send(cid, '⚠️ Format: amount description\nExample: 5000 Cement bags');
    const [, amt, desc] = match;
    await fbSave(`users/${FB_USER}/memory`, String(Date.now()), {
      text: `💸 PKR ${amt} — ${desc}`, createdAt: Date.now(), tags: ['expense'], source: 'telegram'
    });
    return send(cid, `💸 *Expense Logged!*\n\nPKR ${parseFloat(amt).toLocaleString()} — ${desc}\n🔥 App mein save ✅`, KB.fin);
  }

  if (flow === 'budget') {
    const [t, s] = input.split(/\s+/).map(Number);
    if (isNaN(t) || isNaN(s)) return send(cid, '⚠️ Format: total spent\nExample: 100000 65000');
    const rem  = t - s;
    const pct  = Math.min(100, (s / t * 100)).toFixed(1);
    const bars = Math.floor(parseFloat(pct) / 10);
    const bar  = '▓'.repeat(bars) + '░'.repeat(10 - bars);
    const st   = rem < 0 ? '❌ Over budget!' : parseFloat(pct) > 85 ? '🔴 Almost khatam!' : parseFloat(pct) > 60 ? '🟡 Theek hai' : '🟢 Safe';
    return send(cid, `💰 *Budget Check*\n\nTotal: PKR ${t.toLocaleString()}\nSpent: PKR ${s.toLocaleString()}\nBacha: PKR ${Math.abs(rem).toLocaleString()}${rem < 0 ? ' (OVER!)' : ''}\n\n[${bar}] ${pct}%\n${st}`, KB.main);
  }

  if (flow === 'calc') {
    try {
      const safe = input.replace(/[^0-9+\-*/.() ]/g, '');
      // eslint-disable-next-line no-new-func
      const res = new Function(`return (${safe})`)();
      return send(cid, `🧮 \`${input}\` = *${Number(res).toLocaleString()}*`, KB.main);
    } catch { return send(cid, '❌ Invalid. Example: 380 * 100'); }
  }

  if (flow === 'weather') {
    const city = input.trim();
    const result = await callAI(cid, `${city} ka abhi ka weather kya hai? Temperature, humidity, wind speed, aur overall condition batao in detail.`);
    return result ? send(cid, result.text, KB.main) : send(cid, '🌤️ Weather info available nahi.', KB.main);
  }

  if (flow === 'remind') {
    const match = input.match(/^(\d+)(m|h|d)\s+(.+)$/i);
    if (!match) return send(cid, '⚠️ Format: 30m Meeting hai ya 2h Lunch');
    const [, num, unit, message] = match;
    const ms = { m: 60000, h: 3600000, d: 86400000 }[unit.toLowerCase()];
    reminders.push({ chatId: cid, text: message, fireAt: Date.now() + parseInt(num) * ms });
    const label = `${num} ${unit === 'm' ? 'minute' : unit === 'h' ? 'ghante' : 'din'}`;
    return send(cid, `⏰ *Reminder Set!*\n\n_"${message}"_\n${label} baad yaad dilaaunga ✅`, KB.main);
  }

  if (flow === 'mat_qty') {
    const qty = parseFloat(input);
    const mat = MATERIALS[data.type];
    if (!mat || isNaN(qty) || qty <= 0) return send(cid, '⚠️ Sirf number type karo. Example: 100');
    return send(cid, `${mat.emoji} *Material Cost*\n\n${data.type} × ${qty} ${mat.unit}\nRate: PKR ${mat.price.toLocaleString()}/${mat.unit}\n\n💰 *Total: PKR ${(qty * mat.price).toLocaleString()}*`, KB.eng);
  }

  // Fallback: AI
  const result = await callAI(cid, input);
  return result
    ? tg('sendMessage', { chat_id: cid, text: `${result.text}\n\n_— ${result.by}_`, parse_mode: 'Markdown', reply_markup: KB.main })
    : send(cid, '❌ AI unavailable.', KB.main);
}

// ─── Reminder tick ────────────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (let i = reminders.length - 1; i >= 0; i--) {
    if (now >= reminders[i].fireAt) {
      const r = reminders.splice(i, 1)[0];
      tg('sendMessage', { chat_id: r.chatId, text: `⏰ *Reminder!*\n\n${r.text}`, parse_mode: 'Markdown', reply_markup: KB.main }).catch(() => {});
    }
  }
}, 30000);

// ─── Long polling — 24/7 with auto-recovery ───────────────────────────────────
let offset = 0, errCount = 0;
async function poll() {
  try {
    const d = await tg('getUpdates', { offset, timeout: 25, limit: 10, allowed_updates: ['message', 'callback_query'] });
    if (!d.ok || !Array.isArray(d.result)) return;
    errCount = 0;
    for (const u of d.result) {
      offset = u.update_id + 1;
      if (u.callback_query) {
        log('[BTN]', (u.callback_query.from?.first_name || 'User') + ':', u.callback_query.data);
        await handleCB(u.callback_query).catch(e => log('[CB Error]', e.message));
      } else if (u.message) {
        const m = u.message;
        log('[MSG]', (m.from?.first_name || 'User') + ':', m.text?.slice(0, 50) || (m.voice ? '🎙️ Voice' : ''));
        if (m.voice)      await handleVoice(m).catch(e => log('[Voice Error]', e.message));
        else if (m.text)  await handleText(m).catch(e => log('[MSG Error]', e.message));
      }
    }
  } catch(e) {
    errCount++;
    log(`[Poll Error #${errCount}]`, e.message);
    if (errCount > 3) await new Promise(r => setTimeout(r, 8000));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN missing! Railway mein set karo.'); process.exit(1); }
  const me = await tg('getMe');
  if (!me.ok) { console.error('❌ Invalid bot token!'); process.exit(1); }

  log(`✅ @${me.result.username} — Sultan Agent v5.0 ONLINE`);
  log(`🤖 AI: ${GROQ ? 'Groq ⚡ (primary)' : ''}${GEMINI ? ' Gemini 🔮' : ''}${OPENAI ? ' OpenAI 🧠' : ''}${!GROQ && !GEMINI && !OPENAI ? '❌ NO AI KEY!' : ''}`);
  log(`🔥 Firebase: ${FB_ID} (${FB_KEY ? 'connected' : 'not set'})`);
  log(`🎙️  Voice: ${GROQ ? 'Whisper enabled' : 'Need Groq key'}`);

  scheduleDailyReport();

  if (ADMIN) {
    await tg('sendMessage', {
      chat_id: ADMIN,
      text: `✅ *Sultan Agent v5.0 Online!*\n\n🤖 AI: ${GROQ ? 'Groq ⚡' : GEMINI ? 'Gemini 🔮' : OPENAI ? 'OpenAI 🧠' : '❌ No key'}\n🔥 Firebase: ${FB_ID} ✅\n🎙️ Voice: ${GROQ ? '✅ Enabled (Whisper)' : '❌ Need Groq key'}\n📱 App Sync: Real-time ✅\n🚂 Railway: 24/7 Online\n\nMain menu neeche hai 👇`,
      parse_mode: 'Markdown',
      reply_markup: KB.main,
    }).catch(() => {});
  }

  // 24/7 polling loop
  while (true) {
    await poll();
    await new Promise(r => setTimeout(r, 400));
  }
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
