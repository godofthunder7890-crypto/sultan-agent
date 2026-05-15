// Sultan Agent Bot Server v7.0 — God Mode ALL AI
// 24/7 Railway | Groq→Gemini→OpenAI→Claude | Firebase | Voice | APK Auto-Download

const https  = require('https');
const http   = require('http');
const { Buffer } = require('buffer');

const TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const GROQ     = process.env.GROQ_API_KEY    || '';
const GEMINI   = process.env.GEMINI_API_KEY  || '';
const OPENAI   = process.env.OPENAI_API_KEY  || '';
const CLAUDE   = process.env.ANTHROPIC_API_KEY || '';
const SERPER   = process.env.SERPER_API_KEY  || '';
const ADMIN    = process.env.ADMIN_CHAT_ID   || process.env.TELEGRAM_CHAT_ID || '';
const PORT     = parseInt(process.env.PORT   || '3000');
const FB_KEY   = process.env.FIREBASE_API_KEY    || 'AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s';
const FB_ID    = process.env.FIREBASE_PROJECT_ID || 'v11345';
const FB_USER  = process.env.FIREBASE_USER_ID    || 'sultan';
const GH_TOKEN = process.env.GITHUB_ACCESS_TOKEN || '';
const GH_REPO  = 'godofthunder7890-crypto/sultan-agent';
const EXPO     = process.env.EXPO_TOKEN      || '';

// Stats
let msgCount = 0, cbCount = 0, aiCallCount = 0;
const startTime = Date.now();

// ─── Health Check ─────────────────────────────────────────────────────────────
http.createServer((_, res) => {
  const up = process.uptime();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online', bot: 'Sultan Agent v7.0 — God Mode ALL AI',
    uptime: Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm',
    ai: [GROQ?'Groq⚡':null, GEMINI?'Gemini🔮':null, OPENAI?'OpenAI🧠':null, CLAUDE?'Claude🎭':null].filter(Boolean).join(' + ') || 'none',
    apkDownload: EXPO ? 'enabled ✅' : 'need EXPO_TOKEN',
    messages: msgCount, aiCalls: aiCallCount,
    version: '7.0',
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.end(body); else req.end();
  });
}

function httpDownload(url) {
  return new Promise((resolve, reject) => {
    const get = (u, redirects) => {
      if (redirects > 5) return reject(new Error('too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, redirects + 1);
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), size: parseInt(res.headers['content-length'] || '0') }));
      }).on('error', reject);
    };
    get(url, 0);
  });
}

// ─── Telegram API ─────────────────────────────────────────────────────────────
async function tg(method, body) {
  const json = JSON.stringify(body);
  return httpJSON({
    hostname: 'api.telegram.org', path: '/bot' + TOKEN + '/' + method, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) }
  }, json);
}

async function send(cid, text, kb) {
  return tg('sendMessage', { chat_id: cid, text, parse_mode: 'Markdown', reply_markup: kb });
}

async function typing(cid) {
  return tg('sendChatAction', { chat_id: cid, action: 'typing' });
}

async function sendDocument(cid, buffer, filename, caption) {
  const boundary = '----TGBoundary' + Date.now();
  const meta = Buffer.from(
    '--' + boundary + '\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n' + cid +
    '\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="caption"\r\n\r\n' + (caption||'') +
    '\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="document"; filename="' + filename + '"\r\nContent-Type: application/vnd.android.package-archive\r\n\r\n'
  );
  const foot = Buffer.from('\r\n--' + boundary + '--\r\n');
  const body = Buffer.concat([meta, buffer, foot]);
  return httpJSON({
    hostname: 'api.telegram.org', path: '/bot' + TOKEN + '/sendDocument', method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length }
  }, body);
}

// ─── EAS / Expo API ───────────────────────────────────────────────────────────
async function expoAPI(path) {
  return httpJSON({
    hostname: 'api.expo.dev', path, method: 'GET',
    headers: { 'Authorization': 'Bearer ' + EXPO, 'User-Agent': 'SultanAgent/7.0', 'Accept': 'application/json' }
  }, null);
}

const pendingBuilds = [];

async function pollAndSendAPK() {
  if (!pendingBuilds.length || !EXPO) return;
  try {
    const projRes = await expoAPI('/v2/projects?account=haniyashaikh777&slug=sultan-agent');
    const appId = projRes?.data?.[0]?.id;
    if (!appId) { log('[EAS] Could not get project ID'); return; }
    const buildsRes = await expoAPI('/v2/builds?appId=' + appId + '&platform=android&limit=1');
    const build = buildsRes?.data?.[0];
    if (!build) return;
    const buildStart = new Date(build.createdAt).getTime();
    for (let i = pendingBuilds.length - 1; i >= 0; i--) {
      const { cid, startTime: st } = pendingBuilds[i];
      if (buildStart < st - 120000) continue;
      const elapsed = Math.floor((Date.now() - st) / 60000);
      if (build.status === 'finished' && build.artifacts?.buildUrl) {
        pendingBuilds.splice(i, 1);
        await send(cid, '✅ *APK Build Complete!*\n\nDownload ho raha hai...', KB.back);
        try {
          const { buffer } = await httpDownload(build.artifacts.buildUrl);
          const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
          if (buffer.length <= 50 * 1024 * 1024) {
            const r = await sendDocument(cid, buffer, 'SultanAgent-v7.apk', 'Sultan Agent v7.0 — ' + sizeMB + ' MB');
            if (!r.ok) await send(cid, '📥 *APK Ready!*\n\n' + build.artifacts.buildUrl, KB.main);
          } else {
            await send(cid, '📥 *APK Ready!* (' + sizeMB + ' MB)\n\n' + build.artifacts.buildUrl, KB.main);
          }
        } catch(e) {
          await send(cid, '📥 *APK Ready!*\n\n' + build.artifacts.buildUrl, KB.main);
        }
      } else if (build.status === 'errored') {
        pendingBuilds.splice(i, 1);
        await send(cid, '❌ *APK Build Fail!*\n\n' + (build.error?.message||'Unknown'), KB.main);
      } else if (Date.now() - st > 30 * 60 * 1000) {
        pendingBuilds.splice(i, 1);
        await send(cid, '⏰ *APK Timeout (30 min)*\n\nhttps://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds', KB.main);
      } else if (elapsed % 5 === 0 && elapsed > 0) {
        await send(cid, '⏳ APK queue mein... ' + elapsed + ' min', KB.back);
      }
    }
  } catch(e) { log('[EAS poll]', e.message); }
}

setInterval(pollAndSendAPK, 90000);

// ─── GitHub Actions Trigger ───────────────────────────────────────────────────
async function triggerAPKBuild() {
  if (!GH_TOKEN) return { ok: false };
  const body = JSON.stringify({ ref: 'main' });
  return httpJSON({
    hostname: 'api.github.com',
    path: '/repos/' + GH_REPO + '/actions/workflows/build-apk.yml/dispatches',
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + GH_TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'SultanAgent/7.0', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, body);
}

async function handleAPKBuild(cid) {
  await send(cid, '📦 *APK Build Trigger Ho Raha Hai...*\n\nGitHub Actions pe job submit kar raha hoon!', KB.back);
  const r = await triggerAPKBuild();
  if (r && !r.message) {
    pendingBuilds.push({ cid, startTime: Date.now() });
    await send(cid, '✅ *Build Submitted!*\n\n10-15 min mein APK seedha yahan aayegi!\n\nTrack: https://github.com/' + GH_REPO + '/actions', KB.back);
  } else {
    await send(cid, '❌ Build trigger fail: ' + (r?.message||'Unknown error') + '\n\nManual: https://github.com/' + GH_REPO + '/actions', KB.main);
  }
}

// ─── Web Search ───────────────────────────────────────────────────────────────
async function webSearch(q) {
  if (!SERPER) return '❌ Serper API key nahi.';
  try {
    const body = JSON.stringify({ q, num: 5 });
    const r = await httpJSON({
      hostname: 'google.serper.dev', path: '/search', method: 'POST',
      headers: { 'X-API-KEY': SERPER, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    if (!r.organic?.length) return 'No results.';
    return r.organic.slice(0,5).map((x,i) => (i+1) + '. *' + x.title + '*\n' + x.snippet + '\n🔗 ' + x.link).join('\n\n');
  } catch(e) { return '❌ Search error: ' + e.message; }
}

// ─── GitHub API ───────────────────────────────────────────────────────────────
async function getGitHubCommits() {
  if (!GH_TOKEN) return null;
  try {
    return httpJSON({
      hostname: 'api.github.com',
      path: '/repos/' + GH_REPO + '/commits?per_page=5',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + GH_TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'SultanAgent/7.0' }
    }, null);
  } catch { return null; }
}

// ─── Firebase ─────────────────────────────────────────────────────────────────
const fbCache = new Map();
async function fbGet(path) {
  if (fbCache.has(path) && Date.now() - fbCache.get(path).t < 30000) return fbCache.get(path).d;
  try {
    const r = await httpJSON({ hostname: 'firestore.googleapis.com', method: 'GET',
      path: '/v1/projects/' + FB_ID + '/databases/(default)/documents/' + path + '?key=' + FB_KEY, headers: {} }, null);
    const docs = (r.documents||[]).map(doc => {
      const id = doc.name.split('/').pop();
      const out = { _id: id };
      for (const [k,v] of Object.entries(doc.fields||{})) out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? '';
      return out;
    });
    fbCache.set(path, { d: docs, t: Date.now() });
    return docs;
  } catch { return []; }
}
function fbInvalidate(p) { fbCache.delete(p); }
async function fbSave(path, id, data) {
  try {
    const fields = {};
    for (const [k,v] of Object.entries(data)) fields[k] = { stringValue: String(v) };
    const body = JSON.stringify({ fields });
    await httpJSON({ hostname: 'firestore.googleapis.com', method: 'PATCH',
      path: '/v1/projects/' + FB_ID + '/databases/(default)/documents/' + path + '/' + id + '?key=' + FB_KEY,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
    fbInvalidate(path);
  } catch {}
}

// ─── AI Chain — ALL MODELS ────────────────────────────────────────────────────
const chatHistory = new Map();
// Per-user selected model preference
const userModel = new Map();

const AI_MODELS = [
  { id: 'groq',   label: 'Groq Llama3 ⚡',    emoji: '⚡', check: () => !!GROQ },
  { id: 'gemini', label: 'Gemini 1.5 Flash 🔮', emoji: '🔮', check: () => !!GEMINI },
  { id: 'openai', label: 'GPT-4o Mini 🧠',      emoji: '🧠', check: () => !!OPENAI },
  { id: 'claude', label: 'Claude Haiku 🎭',      emoji: '🎭', check: () => !!CLAUDE },
];

function getHist(cid) { return chatHistory.get(cid) || []; }
function addHist(cid, role, content) {
  const h = getHist(cid); h.push({ role, content });
  if (h.length > 30) h.splice(0, h.length - 30);
  chatHistory.set(cid, h);
}
function clearHist(cid) { chatHistory.delete(cid); }

const SYSTEM = 'Tu Sultan ka personal AI agent hai — Sultan CEO hai MA Engineering Pakistan ka. Hinglish mein baat karo (Urdu+English mix). Direct, fast, expert.';

async function callGroq(cid, text) {
  const msgs = [{ role:'system', content: SYSTEM }, ...getHist(cid), { role:'user', content:text }];
  const body = JSON.stringify({ model:'llama3-70b-8192', messages:msgs, max_tokens:1500 });
  const r = await httpJSON({ hostname:'api.groq.com', path:'/openai/v1/chat/completions', method:'POST',
    headers:{'Authorization':'Bearer '+GROQ,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.choices?.[0]?.message?.content;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}

async function callGemini(cid, text) {
  const contents = [...getHist(cid).map(h=>({role:h.role==='assistant'?'model':'user',parts:[{text:h.content}]})), {role:'user',parts:[{text}]}];
  const body = JSON.stringify({ contents, systemInstruction:{parts:[{text: SYSTEM}]} });
  const r = await httpJSON({ hostname:'generativelanguage.googleapis.com',
    path:'/v1beta/models/gemini-1.5-flash:generateContent?key='+GEMINI, method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}

async function callOpenAI(cid, text) {
  const msgs = [{ role:'system', content: SYSTEM }, ...getHist(cid), { role:'user', content:text }];
  const body = JSON.stringify({ model:'gpt-4o-mini', messages:msgs, max_tokens:1500 });
  const r = await httpJSON({ hostname:'api.openai.com', path:'/v1/chat/completions', method:'POST',
    headers:{'Authorization':'Bearer '+OPENAI,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.choices?.[0]?.message?.content;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}

async function callClaude(cid, text) {
  const msgs = [...getHist(cid), { role:'user', content:text }];
  const body = JSON.stringify({ model:'claude-3-5-haiku-20241022', messages:msgs, max_tokens:1500, system: SYSTEM });
  const r = await httpJSON({ hostname:'api.anthropic.com', path:'/v1/messages', method:'POST',
    headers:{'x-api-key':CLAUDE,'anthropic-version':'2023-06-01','Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.content?.[0]?.text;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}

async function callAI(cid, text, preferredModel) {
  aiCallCount++;
  const pref = preferredModel || userModel.get(cid) || 'auto';

  // If user selected specific model, try that first
  if (pref !== 'auto') {
    try {
      let t = null;
      if (pref === 'groq'   && GROQ)   t = await callGroq(cid, text);
      if (pref === 'gemini' && GEMINI) t = await callGemini(cid, text);
      if (pref === 'openai' && OPENAI) t = await callOpenAI(cid, text);
      if (pref === 'claude' && CLAUDE) t = await callClaude(cid, text);
      if (t) return { text:t, by: AI_MODELS.find(m=>m.id===pref)?.label || pref };
    } catch(e) { log('['+pref+']', e.message); }
  }

  // Auto fallback chain: Groq → Gemini → OpenAI → Claude
  if (GROQ)   { try { const t = await callGroq(cid,text);   if (t) return { text:t, by:'Groq Llama3 ⚡'    }; } catch(e) { log('[Groq]',e.message); } }
  if (GEMINI) { try { const t = await callGemini(cid,text); if (t) return { text:t, by:'Gemini 1.5 Flash 🔮' }; } catch(e) { log('[Gemini]',e.message); } }
  if (OPENAI) { try { const t = await callOpenAI(cid,text); if (t) return { text:t, by:'GPT-4o Mini 🧠'    }; } catch(e) { log('[OpenAI]',e.message); } }
  if (CLAUDE) { try { const t = await callClaude(cid,text); if (t) return { text:t, by:'Claude Haiku 🎭'   }; } catch(e) { log('[Claude]',e.message); } }
  return null;
}

// ─── Voice ────────────────────────────────────────────────────────────────────
async function transcribeVoice(fileId) {
  if (!GROQ) return null;
  try {
    const fRes = await tg('getFile', { file_id: fileId });
    if (!fRes.ok) return null;
    const { buffer: audioBuffer } = await httpDownload('https://api.telegram.org/file/bot' + TOKEN + '/' + fRes.result.file_path);
    const boundary = '----FormBoundary' + Date.now();
    const header = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="voice.ogg"\r\nContent-Type: audio/ogg\r\n\r\n');
    const modelPart = Buffer.from('\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n--' + boundary + '--\r\n');
    const formData = Buffer.concat([header, audioBuffer, modelPart]);
    const r = await httpJSON({ hostname:'api.groq.com', path:'/openai/v1/audio/transcriptions', method:'POST',
      headers:{'Authorization':'Bearer '+GROQ,'Content-Type':'multipart/form-data; boundary='+boundary,'Content-Length':formData.length} }, formData);
    return r?.text || null;
  } catch(e) { log('[Voice]', e.message); return null; }
}

// ─── Materials ────────────────────────────────────────────────────────────────
const MATERIALS = {
  cement: { price:1350, unit:'bag', emoji:'🏗️' },
  steel:  { price:290,  unit:'kg',  emoji:'⚙️' },
  brick:  { price:18,   unit:'piece',emoji:'🧱' },
  sand:   { price:4500, unit:'ton', emoji:'🪣' },
  paint:  { price:850,  unit:'ltr', emoji:'🎨' },
  tile:   { price:120,  unit:'sqft',emoji:'⬜' },
};

// ─── Keyboards ────────────────────────────────────────────────────────────────
const KB = {
  main: { inline_keyboard: [
    [{ text:'💬 AI Chat',      callback_data:'flow_ai' },     { text:'🔍 Web Search',   callback_data:'flow_search' }],
    [{ text:'🏗️ Engineering',  callback_data:'menu_eng' },    { text:'📊 SMM Panel',    callback_data:'menu_smm' }],
    [{ text:'🧠 Memory',       callback_data:'menu_mem' },    { text:'🛠️ Tools',         callback_data:'menu_tools' }],
    [{ text:'🤖 AI Model',     callback_data:'menu_model' },  { text:'📊 Daily Report', callback_data:'cmd_report' }],
    [{ text:'🟢 Status',       callback_data:'cmd_status' },  { text:'📈 Stats',         callback_data:'cmd_stats' }],
    [{ text:'🐙 GitHub',       callback_data:'cmd_github' },  { text:'🗺️ Roadmap',       callback_data:'cmd_roadmap' }],
    [{ text:'📦 Build & Get APK', callback_data:'cmd_apk' }],
  ]},
  model: { inline_keyboard: [
    [{ text:'⚡ Groq Llama3 (Fastest)',    callback_data:'setmodel_groq'   }],
    [{ text:'🔮 Gemini 1.5 Flash (Smart)', callback_data:'setmodel_gemini' }],
    [{ text:'🧠 GPT-4o Mini (OpenAI)',     callback_data:'setmodel_openai' }],
    [{ text:'🎭 Claude Haiku (Anthropic)', callback_data:'setmodel_claude' }],
    [{ text:'🔄 Auto (Groq→Gemini→OpenAI→Claude)', callback_data:'setmodel_auto' }],
    [{ text:'⬅️ Main', callback_data:'menu_main' }],
  ]},
  eng: { inline_keyboard: [
    [{ text:'📁 Projects', callback_data:'cmd_projects' },  { text:'🧱 Materials',   callback_data:'menu_mat' }],
    [{ text:'📝 Quotation', callback_data:'flow_quote' },   { text:'💰 Profit Calc', callback_data:'flow_profit' }],
    [{ text:'⬅️ Main', callback_data:'menu_main' }],
  ]},
  smm: { inline_keyboard: [
    [{ text:'📊 Dashboard', callback_data:'cmd_smm' },     { text:'➕ Add Order',   callback_data:'flow_order' }],
    [{ text:'⬅️ Main', callback_data:'menu_main' }],
  ]},
  mem: { inline_keyboard: [
    [{ text:'🧠 Memories', callback_data:'cmd_memories' }, { text:'💾 Save Note',   callback_data:'flow_save' }],
    [{ text:'🗑️ Clear All', callback_data:'cmd_clearmem' },{ text:'⬅️ Main',        callback_data:'menu_main' }],
  ]},
  tools: { inline_keyboard: [
    [{ text:'🧮 Calculator', callback_data:'flow_calc' },   { text:'⏰ Reminder',   callback_data:'flow_remind' }],
    [{ text:'🌤️ Weather',    callback_data:'flow_weather' },{ text:'💸 Log Expense',callback_data:'flow_expense' }],
    [{ text:'💰 Budget Check',callback_data:'flow_budget' },{ text:'⬅️ Main',       callback_data:'menu_main' }],
  ]},
  mat: { inline_keyboard: [
    [{ text:'🏗️ Cement', callback_data:'mat_cement' }, { text:'⚙️ Steel',  callback_data:'mat_steel' }],
    [{ text:'🧱 Brick',  callback_data:'mat_brick' },  { text:'🪣 Sand',   callback_data:'mat_sand'  }],
    [{ text:'🎨 Paint',  callback_data:'mat_paint' },  { text:'⬜ Tile',   callback_data:'mat_tile'  }],
    [{ text:'⬅️ Back',  callback_data:'menu_eng' }],
  ]},
  back: { inline_keyboard: [[{ text:'⬅️ Main Menu', callback_data:'menu_main' }]] },
};

// ─── Menu Texts ───────────────────────────────────────────────────────────────
const MENU_TEXTS = {
  main: '*Sultan Agent v7.0 — God Mode ALL AI* 🚀\n\n🤖 Available AIs:\n' +
    (GROQ   ? '⚡ Groq Llama3-70B — fastest\n' : '') +
    (GEMINI ? '🔮 Gemini 1.5 Flash — smart\n' : '') +
    (OPENAI ? '🧠 GPT-4o Mini — reliable\n' : '') +
    (CLAUDE ? '🎭 Claude Haiku — creative\n' : '') +
    '\nKya karna hai?',
};

// ─── User State ───────────────────────────────────────────────────────────────
const userState = new Map();
const reminders = [];

// ─── Daily Report ─────────────────────────────────────────────────────────────
async function dailyReport(cid) {
  const [orders, memory] = await Promise.all([
    fbGet('users/' + FB_USER + '/orders'),
    fbGet('users/' + FB_USER + '/memory'),
  ]);
  const pending = orders.filter(o => o.status === 'pending');
  const totalRev = orders.reduce((s, o) => s + (parseFloat(o.quantity||0) * parseFloat(o.unitPrice||0)), 0);
  const up = process.uptime();
  const availableAIs = [GROQ?'Groq⚡':null, GEMINI?'Gemini🔮':null, OPENAI?'OpenAI🧠':null, CLAUDE?'Claude🎭':null].filter(Boolean);
  const txt = '📊 *Sultan Agent — Daily Report*\n\n' +
    '🤖 Bot: v7.0 God Mode | Uptime: ' + Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm\n' +
    '🧠 AI: ' + availableAIs.join(' + ') + '\n\n' +
    '📦 SMM Orders: ' + orders.length + ' total | ' + pending.length + ' pending\n' +
    '💰 Total Revenue: PKR ' + totalRev.toLocaleString() + '\n' +
    '🧠 Memory items: ' + memory.length + '\n' +
    '📨 Messages today: ' + msgCount + ' | AI calls: ' + aiCallCount + '\n\n' +
    '_Generated: ' + new Date().toLocaleString('en-PK', {timeZone:'Asia/Karachi'}) + ' PKT_';
  return send(cid, txt, KB.main);
}

function scheduleDailyReport() {
  if (!ADMIN) return;
  function msUntil7AM() {
    const now = new Date();
    const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    const next = new Date(pkt);
    next.setHours(7, 0, 0, 0);
    if (next <= pkt) next.setDate(next.getDate() + 1);
    return next - pkt;
  }
  setTimeout(function tick() {
    dailyReport(ADMIN).catch(() => {});
    setTimeout(tick, 24 * 3600 * 1000);
  }, msUntil7AM());
}

// ─── Callback Handler ─────────────────────────────────────────────────────────
async function handleCB(cb) {
  cbCount++;
  const cid = cb.message.chat.id, data = cb.data;
  await tg('answerCallbackQuery', { callback_query_id: cb.id });

  if (data === 'menu_main') { userState.delete(cid); return send(cid, MENU_TEXTS.main, KB.main); }
  if (data === 'menu_eng')   return send(cid, '🏗️ *MA Engineering*\n\nKya karna hai?', KB.eng);
  if (data === 'menu_smm')   return send(cid, '📊 *SMM Panel*\n\nKya karna hai?', KB.smm);
  if (data === 'menu_mem')   return send(cid, '🧠 *Memory System*', KB.mem);
  if (data === 'menu_tools') return send(cid, '🛠️ *Tools*\n\nKya use karna hai?', KB.tools);
  if (data === 'menu_mat')   return send(cid, '🧱 *Material Rates 2025*\n\nKaunsa material?', KB.mat);
  if (data === 'menu_model') {
    const cur = userModel.get(cid) || 'auto';
    return send(cid, '🤖 *AI Model Select Karo*\n\nCurrent: *' + cur.toUpperCase() + '*\n\n' +
      'Available:\n' +
      (GROQ   ? '✅ Groq Llama3 ⚡\n' : '❌ Groq (key nahi)\n') +
      (GEMINI ? '✅ Gemini 🔮\n' : '❌ Gemini (key nahi)\n') +
      (OPENAI ? '✅ GPT-4o Mini 🧠\n' : '❌ OpenAI (key nahi)\n') +
      (CLAUDE ? '✅ Claude Haiku 🎭\n' : '❌ Claude (key nahi)\n'), KB.model);
  }

  // Model selection
  if (data.startsWith('setmodel_')) {
    const model = data.replace('setmodel_', '');
    userModel.set(cid, model);
    const label = model === 'auto' ? 'Auto (Groq→Gemini→OpenAI→Claude)' : AI_MODELS.find(m=>m.id===model)?.label || model;
    return send(cid, '✅ *Model set: ' + label + '*\n\nAb is model se baat karo!', KB.main);
  }

  if (data === 'cmd_apk') return handleAPKBuild(cid);
  if (data === 'cmd_report') return dailyReport(cid);

  if (data === 'cmd_status') {
    const up = process.uptime();
    const cur = userModel.get(cid) || 'auto';
    return send(cid,
      '🟢 *Sultan Agent v7.0 — Status*\n\n' +
      '🤖 AI Engines:\n' +
      (GROQ   ? '  ✅ Groq Llama3-70B ⚡\n' : '  ❌ Groq (GROQ_API_KEY nahi)\n') +
      (GEMINI ? '  ✅ Gemini 1.5 Flash 🔮\n' : '  ❌ Gemini (GEMINI_API_KEY nahi)\n') +
      (OPENAI ? '  ✅ GPT-4o Mini 🧠\n' : '  ❌ OpenAI (OPENAI_API_KEY nahi)\n') +
      (CLAUDE ? '  ✅ Claude Haiku 🎭\n' : '  ❌ Claude (ANTHROPIC_API_KEY nahi)\n') +
      '\n🔍 Web Search: ' + (SERPER ? '✅ Serper' : '❌ koi key nahi') +
      '\n🎙️ Voice (Whisper): ' + (GROQ ? '✅' : '❌') +
      '\n📦 APK Auto-Send: ' + (EXPO ? '✅' : '❌ EXPO_TOKEN nahi') +
      '\n🔥 Firebase: ' + FB_ID + ' ✅' +
      '\n⏱️ Uptime: ' + Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm' +
      '\n🤖 Your model: ' + cur.toUpperCase(),
      KB.main);
  }

  if (data === 'cmd_stats') {
    const up = process.uptime();
    return send(cid,
      '📈 *Bot Stats*\n\n' +
      '💬 Messages processed: ' + msgCount + '\n' +
      '🔘 Button clicks: ' + cbCount + '\n' +
      '🤖 AI calls made: ' + aiCallCount + '\n' +
      '⏱️ Uptime: ' + Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm ' + Math.floor((up%60)) + 's\n' +
      '🧠 Active chats: ' + chatHistory.size + '\n' +
      '⏰ Reminders queued: ' + reminders.length,
      KB.main);
  }

  if (data === 'cmd_github') {
    typing(cid);
    const commits = await getGitHubCommits();
    if (!commits || commits.message) return send(cid, '❌ GitHub fetch fail. Token check karo.', KB.main);
    const lines = commits.slice(0,5).map((c,i) => {
      const msg = (c.commit.message||'').split('\n')[0].slice(0,60);
      const date = c.commit.author.date.slice(0,10);
      return (i+1) + '. `' + msg + '`\n   _' + date + ' by ' + (c.commit.author.name||'?') + '_';
    }).join('\n\n');
    return send(cid, '🐙 *Latest GitHub Commits*\n\n' + lines + '\n\n🔗 https://github.com/' + GH_REPO, KB.main);
  }

  if (data === 'cmd_roadmap') {
    return send(cid,
      '🗺️ *Sultan Agent — Roadmap*\n\n' +
      '✅ *Done:*\n' +
      '• Multi-AI (Groq+Gemini+OpenAI+Claude)\n' +
      '• Memory System (Firebase sync)\n' +
      '• Web Search (Serper)\n' +
      '• Voice Transcription (Whisper)\n' +
      '• APK Auto-Download (EAS polling)\n' +
      '• Daily Report 7 AM PKT\n' +
      '• Engineering tools (quotation, materials)\n' +
      '• SMM Dashboard\n' +
      '• Calculator, Reminders, Budget\n\n' +
      '🔄 *Next Up:*\n' +
      '• PDF/Document reader\n' +
      '• Image generation (DALL-E)\n' +
      '• Crypto price tracker\n' +
      '• Google Calendar integration\n' +
      '• Auto-post Instagram/Twitter\n\n' +
      '🔗 Full: https://github.com/' + GH_REPO + '/blob/main/FEATURES_ROADMAP.md',
      KB.main);
  }

  if (data === 'cmd_smm') {
    const orders = await fbGet('users/' + FB_USER + '/orders');
    if (!orders.length) return send(cid, '📊 *SMM Dashboard*\n\nKoi orders nahi abhi.', KB.smm);
    const total = orders.reduce((s,o) => s + (parseFloat(o.quantity||0)*parseFloat(o.unitPrice||0)), 0);
    const pending = orders.filter(o=>o.status==='pending').length;
    const lines = orders.slice(0,5).map((o,i) => (i+1)+'. '+o.service+' × '+(o.quantity||'?')+' — PKR '+(parseFloat(o.quantity||0)*parseFloat(o.unitPrice||0)).toLocaleString()).join('\n');
    return send(cid, '📊 *SMM Dashboard*\n\n'+lines+'\n\n💰 Total: PKR '+total.toLocaleString()+'\n📦 Pending: '+pending, KB.smm);
  }

  if (data === 'cmd_projects') {
    const projects = await fbGet('users/' + FB_USER + '/projects');
    if (!projects.length) return send(cid, '📁 *Projects*\n\nKoi projects nahi. Add karo!', KB.eng);
    const lines = projects.slice(0,5).map((p,i)=>(i+1)+'. *'+(p.name||'?')+'* — '+(p.status||'?')).join('\n');
    return send(cid, '📁 *MA Engineering Projects*\n\n'+lines, KB.eng);
  }

  if (data === 'cmd_memories') {
    const memory = await fbGet('users/'+FB_USER+'/memory');
    if (!memory.length) return send(cid, '🧠 *Memory*\n\nKoi memory nahi.', KB.mem);
    const lines = memory.slice(-10).reverse().map((m,i)=>(i+1)+'. '+(m.text||'?').slice(0,80)).join('\n');
    return send(cid, '🧠 *Memories — Last '+Math.min(memory.length,10)+'*\n\n'+lines+'\n\nTotal: '+memory.length, KB.mem);
  }

  if (data === 'cmd_clearmem') return send(cid, '⚠️ Confirm: /clearmem — sari memories delete hongi.', KB.mem);

  const matKey = ['cement','steel','brick','sand','paint','tile'].find(k => data==='mat_'+k);
  if (matKey) {
    const mat = MATERIALS[matKey];
    userState.set(cid, { flow:'mat_qty', type:matKey });
    return send(cid, mat.emoji+' *'+matKey.charAt(0).toUpperCase()+matKey.slice(1)+'*\nRate: PKR '+mat.price.toLocaleString()+'/'+mat.unit+'\n\nKitna chahiye?', KB.back);
  }

  const flowMap = {
    flow_ai:     { flow:'ai',      msg:'💬 *AI Chat*\n\nKuch bhi poocho! Auto mode: Groq→Gemini→OpenAI→Claude' },
    flow_search: { flow:'search',  msg:'🔍 *Web Search*\n\nKya search karna hai?' },
    flow_quote:  { flow:'quote',   msg:'📝 *AI Quotation*\n\nProject details do:\n_Example: 3 bedroom house, 1000 sqft, Lahore_' },
    flow_profit: { flow:'profit',  msg:'💰 *Profit Calculator*\n\n2 numbers: selling_price cost\n_Example: 150000 95000_' },
    flow_order:  { flow:'order',   msg:'➕ *Add SMM Order*\n\nFormat: service quantity unit_price\n_Example: Instagram Followers 1000 0.5_' },
    flow_save:   { flow:'save',    msg:'💾 *Save to Memory*\n\nKya save karna hai?' },
    flow_calc:   { flow:'calc',    msg:'🧮 *Calculator*\n\n_Example: 380 * 100 + 5000_' },
    flow_remind: { flow:'remind',  msg:'⏰ *Set Reminder*\n\nFormat: 30m message\n_Example: 2h Meeting hai_' },
    flow_weather:{ flow:'weather', msg:'🌤️ *Weather*\n\nKis city ka?' },
    flow_expense:{ flow:'expense', msg:'💸 *Log Expense*\n\nFormat: amount description\n_Example: 5000 Cement bags_' },
    flow_budget: { flow:'budget',  msg:'💰 *Budget Check*\n\n2 numbers: total spent\n_Example: 100000 65000_' },
  };
  if (flowMap[data]) { userState.set(cid, { flow:flowMap[data].flow }); return send(cid, flowMap[data].msg, KB.back); }
}

// ─── Text Handler ─────────────────────────────────────────────────────────────
async function handleText(msg) {
  msgCount++;
  const cid = msg.chat.id, text = msg.text||'', lower = text.toLowerCase().trim();

  if (text==='/start'||text==='/menu') { userState.delete(cid); return send(cid, MENU_TEXTS.main, KB.main); }
  if (text==='/status') {
    const up = process.uptime();
    return send(cid,
      '🟢 *Sultan Agent v7.0 — Status*\n\n' +
      (GROQ   ? '✅ Groq Llama3-70B ⚡\n' : '❌ Groq (key nahi)\n') +
      (GEMINI ? '✅ Gemini 1.5 Flash 🔮\n' : '❌ Gemini (key nahi)\n') +
      (OPENAI ? '✅ GPT-4o Mini 🧠\n' : '❌ OpenAI (key nahi)\n') +
      (CLAUDE ? '✅ Claude Haiku 🎭\n' : '❌ Claude (key nahi)\n') +
      '\n🔍 Search: '+(SERPER?'✅':'❌')+' | 🎙️ Voice: '+(GROQ?'✅':'❌')+' | 📦 APK: '+(EXPO?'✅':'❌')+
      '\n⏱️ Uptime: '+Math.floor(up/3600)+'h '+Math.floor((up%3600)/60)+'m',
      KB.main);
  }
  if (text==='/report') return dailyReport(cid);
  if (text==='/stats') {
    const up = process.uptime();
    return send(cid, '📈 *Stats*\n\n💬 Messages: '+msgCount+'\n🤖 AI calls: '+aiCallCount+'\n⏱️ Uptime: '+Math.floor(up/3600)+'h '+Math.floor((up%3600)/60)+'m', KB.main);
  }
  if (text==='/apk'||text==='/buildapk') return handleAPKBuild(cid);
  if (text==='/github') {
    typing(cid);
    const commits = await getGitHubCommits();
    if (!commits || commits.message) return send(cid, '❌ GitHub fetch fail.', KB.main);
    const lines = commits.slice(0,5).map((c,i)=>(i+1)+'. `'+(c.commit.message||'').split('\n')[0].slice(0,60)+'` _'+c.commit.author.date.slice(0,10)+'_').join('\n');
    return send(cid, '🐙 *Latest Commits*\n\n'+lines, KB.main);
  }
  if (text==='/roadmap') {
    return send(cid, '🗺️ Type /roadmap ya menu se dekho.', KB.main);
  }
  if (text==='/model') {
    return send(cid, '🤖 *AI Model Choose Karo:*', KB.model);
  }
  if (text==='/clear') { clearHist(cid); return send(cid, '🧹 Chat cleared!', KB.main); }
  if (text==='/clearmem') {
    const memory = await fbGet('users/'+FB_USER+'/memory');
    for (const m of memory) {
      await httpJSON({ hostname:'firestore.googleapis.com',
        path:'/v1/projects/'+FB_ID+'/databases/(default)/documents/users/'+FB_USER+'/memory/'+m._id+'?key='+FB_KEY,
        method:'DELETE', headers:{} }, null).catch(()=>{});
    }
    fbInvalidate('users/'+FB_USER+'/memory');
    return send(cid, '🗑️ Sari memories delete!', KB.main);
  }

  if (lower.startsWith('/search ')||lower.startsWith('search: ')) {
    const q = text.slice(text.indexOf(' ')+1);
    typing(cid);
    const results = await webSearch(q);
    const ai = await callAI(cid, 'Web search results for "'+q+'":\n\n'+results+'\n\nClear summary do.');
    return ai ? send(cid, '🔍 *'+q+'*\n\n'+ai.text+'\n\n_— '+ai.by+'_', KB.main) : send(cid, '🔍\n'+results, KB.main);
  }

  if (lower.startsWith('yaad rakh')||lower.startsWith('remember:')||lower.startsWith('/yaad ')) {
    const note = text.replace(/^(yaad rakh|remember:|\/yaad\s*)/i,'').trim();
    if (note) {
      fbSave('users/'+FB_USER+'/memory', String(Date.now()), { text:note, createdAt:Date.now(), tags:[], source:'telegram' });
      return send(cid, '🧠 *Yaad kar liya!*\n\n_"'+note+'"_\n\n🔥 Firebase save ✅', KB.main);
    }
  }

  const state = userState.get(cid);
  if (state) {
    const flow = state.flow; userState.delete(cid);
    if (flow==='ai') { typing(cid); const r=await callAI(cid,text); return r?send(cid,r.text+'\n\n_— '+r.by+'_',KB.main):send(cid,'❌ AI unavailable.',KB.main); }
    if (flow==='search') { typing(cid); const res=await webSearch(text); const ai=await callAI(cid,'Search:\n\n'+res+'\n\nSummary do.'); return ai?send(cid,'🔍 *'+text+'*\n\n'+ai.text+'\n\n_— '+ai.by+'_',KB.main):send(cid,res,KB.main); }
    if (flow==='quote') { typing(cid); const r=await callAI(cid,'MA Engineering quotation banao: '+text+'. PKR mein, 2025 Pakistan rates.'); return r?send(cid,'📝 *Quotation*\n\n'+r.text+'\n\n_— '+r.by+'_',KB.eng):send(cid,'❌ AI unavailable.',KB.eng); }
    if (flow==='profit') {
      const [p,c]=[parseFloat(text.split(/\s+/)[0]),parseFloat(text.split(/\s+/)[1])];
      if (isNaN(p)||isNaN(c)) return send(cid,'⚠️ 2 numbers do: selling cost');
      const profit=p-c,margin=((profit/p)*100).toFixed(1),bars=Math.floor(Math.min(100,Math.abs(parseFloat(margin)))/10);
      const bar='▓'.repeat(bars)+'░'.repeat(10-bars),em=profit<0?'❌':parseFloat(margin)>30?'🚀':parseFloat(margin)>15?'✅':'⚠️';
      return send(cid,'💰 *Profit Analysis*\n\nSelling: PKR '+p.toLocaleString()+'\nCost:    PKR '+c.toLocaleString()+'\nProfit:  PKR '+profit.toLocaleString()+'\n\n['+bar+'] '+margin+'% '+em,KB.main);
    }
    if (flow==='order') {
      const parts=text.trim().split(/\s+/); if(parts.length<3) return send(cid,'⚠️ Format: service quantity unit_price');
      const unitPrice=parseFloat(parts[parts.length-1]),quantity=parseInt(parts[parts.length-2]),service=parts.slice(0,-2).join(' ');
      fbSave('users/'+FB_USER+'/orders',String(Date.now()),{service,quantity,unitPrice,status:'pending',date:new Date().toISOString().split('T')[0]});
      return send(cid,'📦 *Order Added!*\n\n'+service+'\nQty: '+quantity+' | Rate: '+unitPrice+'\nTotal: PKR '+(quantity*unitPrice).toLocaleString()+'\n🔥 Synced ✅',KB.smm);
    }
    if (flow==='save') { fbSave('users/'+FB_USER+'/memory',String(Date.now()),{text,createdAt:Date.now(),tags:[],source:'telegram'}); return send(cid,'🧠 *Saved!*\n_"'+text+'"_\n🔥 Synced ✅',KB.mem); }
    if (flow==='expense') {
      const match=text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/); if (!match) return send(cid,'⚠️ Format: amount description');
      fbSave('users/'+FB_USER+'/memory',String(Date.now()),{text:'💸 PKR '+match[1]+' — '+match[2],createdAt:Date.now(),tags:['expense'],source:'telegram'});
      return send(cid,'💸 *Expense Logged!*\nPKR '+parseFloat(match[1]).toLocaleString()+' — '+match[2]+'\n🔥 Saved ✅',KB.main);
    }
    if (flow==='budget') {
      const [t,s]=text.split(/\s+/).map(Number); if(isNaN(t)||isNaN(s)) return send(cid,'⚠️ Format: total spent');
      const rem=t-s,pct=Math.min(100,(s/t*100)).toFixed(1),bars=Math.floor(parseFloat(pct)/10);
      const bar='▓'.repeat(bars)+'░'.repeat(10-bars),st=rem<0?'❌ Over budget!':parseFloat(pct)>85?'🔴 Almost!':parseFloat(pct)>60?'🟡 Theek hai':'🟢 Safe';
      return send(cid,'💰 *Budget*\n\nTotal: PKR '+t.toLocaleString()+'\nSpent: PKR '+s.toLocaleString()+'\nBacha: PKR '+Math.abs(rem).toLocaleString()+(rem<0?' (OVER!)':'')+'\n['+bar+'] '+pct+'%\n'+st,KB.main);
    }
    if (flow==='calc') { try { const r=new Function('return ('+text.replace(/[^0-9+\-*/.() ]/g,'')+')')(); return send(cid,'🧮 `'+text+'` = *'+Number(r).toLocaleString()+'*',KB.main); } catch { return send(cid,'❌ Invalid expression.'); } }
    if (flow==='weather') { typing(cid); const r=await callAI(cid,text+' ka weather batao — temperature, humidity, wind. Pakistan time.'); return r?send(cid,r.text,KB.main):send(cid,'❌ AI unavailable.',KB.main); }
    if (flow==='remind') {
      const match=text.match(/^(\d+)(m|h|d)\s+(.+)$/i); if (!match) return send(cid,'⚠️ Format: 30m message');
      const [,num,unit,message]=match; const ms={m:60000,h:3600000,d:86400000}[unit.toLowerCase()];
      reminders.push({ chatId:cid, text:message, fireAt:Date.now()+parseInt(num)*ms });
      return send(cid,'⏰ *Reminder Set!*\n\n_"'+message+'"_\n'+num+' '+(unit==='m'?'min':unit==='h'?'ghante':'din')+' baad ✅',KB.main);
    }
    if (flow==='mat_qty') {
      const qty=parseFloat(text), mat=MATERIALS[state.type];
      if (!mat||isNaN(qty)||qty<=0) return send(cid,'⚠️ Sirf number. Example: 100');
      return send(cid,mat.emoji+' *'+state.type+'* × '+qty+' '+mat.unit+'\nRate: PKR '+mat.price.toLocaleString()+'/'+mat.unit+'\n\n💰 *Total: PKR '+(qty*mat.price).toLocaleString()+'*',KB.eng);
    }
  }

  typing(cid);
  const result = await callAI(cid, text);
  return result
    ? tg('sendMessage', { chat_id:cid, text:result.text+'\n\n_— '+result.by+'_', parse_mode:'Markdown', reply_markup:KB.main })
    : send(cid, '❌ AI unavailable. /status check karo.', KB.main);
}

// ─── Voice Handler ────────────────────────────────────────────────────────────
async function handleVoice(msg) {
  msgCount++;
  const cid = msg.chat.id; typing(cid);
  const text = await transcribeVoice(msg.voice.file_id);
  if (!text) return send(cid, '❌ Voice transcription fail. Groq key check karo.', KB.main);
  await tg('sendMessage', { chat_id:cid, text:'🎙️ _Transcribed: "'+text+'"_', parse_mode:'Markdown' });
  const result = await callAI(cid, text);
  return result ? send(cid, result.text+'\n\n_— '+result.by+'_', KB.main) : send(cid, '❌ AI unavailable.', KB.main);
}

// ─── Reminder Tick ────────────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (let i=reminders.length-1; i>=0; i--) {
    if (now >= reminders[i].fireAt) {
      const r = reminders.splice(i,1)[0];
      tg('sendMessage', { chat_id:r.chatId, text:'⏰ *Reminder!*\n\n'+r.text, parse_mode:'Markdown', reply_markup:KB.main }).catch(()=>{});
    }
  }
}, 15000);

// ─── Long Polling ─────────────────────────────────────────────────────────────
let offset=0, errCount=0;
async function poll() {
  try {
    const d = await tg('getUpdates', { offset, timeout:20, limit:20, allowed_updates:['message','callback_query'] });
    if (!d.ok||!Array.isArray(d.result)) return;
    errCount=0;
    for (const u of d.result) {
      offset = u.update_id+1;
      if (u.callback_query) { log('[BTN]',(u.callback_query.from?.first_name||'?')+':',u.callback_query.data); handleCB(u.callback_query).catch(e=>log('[CB]',e.message)); }
      else if (u.message) {
        const m=u.message;
        log('[MSG]',(m.from?.first_name||'?')+':',m.text?.slice(0,50)||(m.voice?'🎙️ Voice':'?'));
        if (m.voice) handleVoice(m).catch(e=>log('[Voice]',e.message));
        else if (m.text) handleText(m).catch(e=>log('[MSG]',e.message));
      }
    }
  } catch(e) { errCount++; log('[Poll #'+errCount+']',e.message); if (errCount>5) await new Promise(r=>setTimeout(r,10000)); }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN missing!'); process.exit(1); }
  const me = await tg('getMe');
  if (!me.ok) { console.error('❌ Invalid bot token!'); process.exit(1); }
  log('✅ @'+me.result.username+' — Sultan Agent v7.0 God Mode ALL AI ONLINE');
  log('🤖 AI: '+(GROQ?'Groq⚡ ':'')+( GEMINI?'Gemini🔮 ':'')+( OPENAI?'OpenAI🧠 ':'')+( CLAUDE?'Claude🎭 ':'')+ (!GROQ&&!GEMINI&&!OPENAI&&!CLAUDE?'❌ NO AI KEY!':''));
  log('📦 APK Auto-Download: '+(EXPO?'✅ ENABLED':'⚠️ Need EXPO_TOKEN'));
  log('🔍 Web Search: '+(SERPER?'✅ Enabled':'❌ Disabled'));
  log('🔥 Firebase: '+FB_ID);
  scheduleDailyReport();
  if (ADMIN) {
    tg('sendMessage', { chat_id:ADMIN,
      text:'🚀 *Sultan Agent v7.0 — God Mode ALL AI!*\n\n' +
        '🤖 AI Engines:\n' +
        (GROQ   ? '  ✅ Groq Llama3-70B ⚡ (fastest)\n' : '  ❌ Groq\n') +
        (GEMINI ? '  ✅ Gemini 1.5 Flash 🔮\n' : '  ❌ Gemini\n') +
        (OPENAI ? '  ✅ GPT-4o Mini 🧠\n' : '  ❌ OpenAI\n') +
        (CLAUDE ? '  ✅ Claude Haiku 🎭\n' : '  ❌ Claude (ANTHROPIC_API_KEY add karo)\n') +
        '\n🆕 *New in v7.0:*\n' +
        '• /model — AI choose karo (Groq/Gemini/OpenAI/Claude)\n' +
        '• /github — Latest commits dekho\n' +
        '• /stats — Bot usage stats\n' +
        '• /roadmap — Feature roadmap\n' +
        '• Auto fallback: Groq→Gemini→OpenAI→Claude\n\n' +
        '✅ Railway pe deploy | 24/7 online\n\nMain menu neeche hai 👇',
      parse_mode:'Markdown', reply_markup:KB.main,
    }).catch(()=>{});
  }
  while (true) { await poll(); await new Promise(r=>setTimeout(r,100)); }
}
main().catch(e=>{ console.error('Fatal:',e); process.exit(1); });
