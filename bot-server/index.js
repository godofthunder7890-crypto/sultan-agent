// Sultan Agent Bot Server v6.0 — God Mode
// 24/7 Railway | Groq→Gemini→OpenAI | Firebase | Voice | APK Auto-Download

const https  = require('https');
const http   = require('http');
const { Buffer } = require('buffer');

const TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const GROQ     = process.env.GROQ_API_KEY    || '';
const GEMINI   = process.env.GEMINI_API_KEY  || '';
const OPENAI   = process.env.OPENAI_API_KEY  || '';
const SERPER   = process.env.SERPER_API_KEY  || '';
const ADMIN    = process.env.ADMIN_CHAT_ID   || process.env.TELEGRAM_CHAT_ID || '';
const PORT     = parseInt(process.env.PORT   || '3000');
const FB_KEY   = process.env.FIREBASE_API_KEY    || 'AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s';
const FB_ID    = process.env.FIREBASE_PROJECT_ID || 'v11345';
const FB_USER  = process.env.FIREBASE_USER_ID    || 'sultan';
const GH_TOKEN = process.env.GITHUB_ACCESS_TOKEN || '';
const GH_REPO  = 'godofthunder7890-crypto/sultan-agent';
const EXPO     = process.env.EXPO_TOKEN      || '';

// ─── Health Check ─────────────────────────────────────────────────────────────
http.createServer((_, res) => {
  const up = process.uptime();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online', bot: 'Sultan Agent v6.0 — God Mode',
    uptime: Math.floor(up/3600) + 'h ' + Math.floor((up%3600)/60) + 'm',
    ai: GROQ ? 'Groq⚡+Gemini🔮+OpenAI🧠' : GEMINI ? 'Gemini🔮' : OPENAI ? 'OpenAI🧠' : 'none',
    apkDownload: EXPO ? 'enabled ✅' : 'need EXPO_TOKEN',
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
    headers: { 'Authorization': 'Bearer ' + EXPO, 'User-Agent': 'SultanAgent/6.0', 'Accept': 'application/json' }
  }, null);
}

// Pending APK builds: { cid, startTime }
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
      const { cid, startTime } = pendingBuilds[i];
      if (buildStart < startTime - 120000) continue; // purani build ignore

      const elapsed = Math.floor((Date.now() - startTime) / 60000);

      if (build.status === 'finished' && build.artifacts?.buildUrl) {
        pendingBuilds.splice(i, 1);
        log('[EAS] Build finished! Downloading APK...');
        await send(cid, '✅ *APK Build Complete!*\n\nDownload ho raha hai... (yeh thodi der le sakta hai)', KB.back);
        try {
          const { buffer, size } = await httpDownload(build.artifacts.buildUrl);
          const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
          log('[EAS] APK size:', sizeMB, 'MB');
          if (buffer.length <= 50 * 1024 * 1024) {
            const r = await sendDocument(cid, buffer, 'SultanAgent-v6.apk',
              'Sultan Agent v6.0 APK — ' + sizeMB + ' MB\nInstall karo aur enjoy karo!');
            if (r.ok) {
              log('[EAS] APK sent via Telegram!');
            } else {
              log('[EAS] sendDocument error:', JSON.stringify(r));
              await send(cid, '📥 *APK Ready!*\n\nDirect link:\n' + build.artifacts.buildUrl, KB.main);
            }
          } else {
            await send(cid, '📥 *APK Ready!* (' + sizeMB + ' MB)\n\n50MB se bada hai, seedha download karo:\n' + build.artifacts.buildUrl, KB.main);
          }
        } catch(e) {
          log('[EAS] Download error:', e.message);
          await send(cid, '📥 *APK Ready!*\n\nDownload link:\n' + build.artifacts.buildUrl, KB.main);
        }

      } else if (build.status === 'errored') {
        pendingBuilds.splice(i, 1);
        await send(cid, '❌ *APK Build Fail Ho Gaya!*\n\n' + (build.error?.message || 'Unknown error') +
          '\n\nGitHub Actions dekho:\nhttps://github.com/' + GH_REPO + '/actions', KB.main);

      } else if (Date.now() - startTime > 30 * 60 * 1000) {
        pendingBuilds.splice(i, 1);
        await send(cid, '⏰ *APK Build Timeout (30 min)*\n\nExpo pe check karo:\nhttps://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds', KB.main);

      } else if (elapsed % 5 === 0 && elapsed > 0 && build.status === 'in-queue') {
        await send(cid, '⏳ APK queue mein hai... ' + elapsed + ' min ho gaye. Thoda aur wait karo.', KB.back);
      }
    }
  } catch(e) { log('[EAS poll]', e.message); }
}

// Poll every 90 seconds
setInterval(pollAndSendAPK, 90000);

// ─── GitHub Actions Trigger ───────────────────────────────────────────────────
async function triggerAPKBuild() {
  if (!GH_TOKEN) return { ok: false };
  const body = JSON.stringify({ ref: 'main' });
  return httpJSON({
    hostname: 'api.github.com',
    path: '/repos/' + GH_REPO + '/actions/workflows/build-apk.yml/dispatches',
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + GH_TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'SultanAgent/6.0', 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, body);
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
function fbInvalidate(path) { fbCache.delete(path); }
async function fbSave(path, id, data) {
  try {
    const fields = {};
    for (const [k,v] of Object.entries(data)) fields[k] = { stringValue: String(v) };
    const body = JSON.stringify({ fields });
    await httpJSON({ hostname: 'firestore.googleapis.com', method: 'PATCH',
      path: '/v1/projects/' + FB_ID + '/databases/(default)/documents/' + path + '/' + id + '?key=' + FB_KEY,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  } catch {}
}

// ─── AI Chain ─────────────────────────────────────────────────────────────────
const chatHistory = new Map();
function getHist(cid) { return chatHistory.get(cid) || []; }
function addHist(cid, role, content) {
  const h = getHist(cid); h.push({ role, content });
  if (h.length > 30) h.splice(0, h.length - 30);
  chatHistory.set(cid, h);
}
function clearHist(cid) { chatHistory.delete(cid); }

async function callGroq(cid, text) {
  const msgs = [{ role:'system', content:'Tu Sultan ka personal AI agent hai — Sultan CEO hai MA Engineering, Pakistan ka. Hinglish mein baat karo.' }, ...getHist(cid), { role:'user', content:text }];
  const body = JSON.stringify({ model:'llama3-70b-8192', messages:msgs, max_tokens:1500 });
  const r = await httpJSON({ hostname:'api.groq.com', path:'/openai/v1/chat/completions', method:'POST',
    headers:{'Authorization':'Bearer '+GROQ,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.choices?.[0]?.message?.content;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}
async function callGemini(cid, text) {
  const contents = [...getHist(cid).map(h=>({role:h.role==='assistant'?'model':'user',parts:[{text:h.content}]})), {role:'user',parts:[{text}]}];
  const body = JSON.stringify({ contents, systemInstruction:{parts:[{text:'Tu Sultan ka personal AI agent hai — Hinglish mein baat karo.'}]} });
  const r = await httpJSON({ hostname:'generativelanguage.googleapis.com',
    path:'/v1beta/models/gemini-1.5-flash:generateContent?key='+GEMINI, method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}
async function callOpenAI(cid, text) {
  const msgs = [{ role:'system', content:'Tu Sultan ka personal AI agent hai — Hinglish mein baat karo.' }, ...getHist(cid), { role:'user', content:text }];
  const body = JSON.stringify({ model:'gpt-4o-mini', messages:msgs, max_tokens:1500 });
  const r = await httpJSON({ hostname:'api.openai.com', path:'/v1/chat/completions', method:'POST',
    headers:{'Authorization':'Bearer '+OPENAI,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, body);
  const t = r?.choices?.[0]?.message?.content;
  if (t) { addHist(cid,'user',text); addHist(cid,'assistant',t); }
  return t;
}
async function callAI(cid, text) {
  if (GROQ)   { try { const t = await callGroq(cid,text);   if (t) return { text:t, by:'Groq ⚡' };   } catch(e) { log('[Groq]',e.message); } }
  if (GEMINI) { try { const t = await callGemini(cid,text); if (t) return { text:t, by:'Gemini 🔮' }; } catch(e) { log('[Gemini]',e.message); } }
  if (OPENAI) { try { const t = await callOpenAI(cid,text); if (t) return { text:t, by:'OpenAI 🧠' }; } catch(e) { log('[OpenAI]',e.message); } }
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

// ─── Keyboards ────────────────────────────────────────────────────────────────
const KB = {
  main: { inline_keyboard: [
    [{ text:'💬 AI Chat', callback_data:'flow_ai' },       { text:'🔍 Web Search',   callback_data:'flow_search' }],
    [{ text:'🏗️ Engineering', callback_data:'menu_eng' }, { text:'📊 SMM Panel',    callback_data:'menu_smm' }],
    [{ text:'🧠 Memory',   callback_data:'menu_mem' },     { text:'🛠️ Tools',        callback_data:'menu_tools' }],
    [{ text:'📊 Daily Report', callback_data:'cmd_report' },{ text:'🟢 Status',      callback_data:'cmd_status' }],
    [{ text:'📦 Build & Get APK', callback_data:'cmd_apk' }],
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
  mat: { inline_keyboard: [
    [{ text:'🏗️ Cement', callback_data:'mat_cement' },     { text:'⚙️ Steel',       callback_data:'mat_steel' }],
    [{ text:'🧱 Brick',  callback_data:'mat_brick' },      { text:'🪣 Sand',         callback_data:'mat_sand' }],
    [{ text:'🎨 Paint',  callback_data:'mat_paint' },      { text:'🟫 Tile',         callback_data:'mat_tile' }],
    [{ text:'⬅️ Back',  callback_data:'menu_eng' }],
  ]},
  tools: { inline_keyboard: [
    [{ text:'🧮 Calculator', callback_data:'flow_calc' },  { text:'⏰ Reminder',    callback_data:'flow_remind' }],
    [{ text:'🌤️ Weather',   callback_data:'flow_weather' },{ text:'🔍 Web Search',  callback_data:'flow_search' }],
    [{ text:'💸 Log Expense',callback_data:'flow_expense' },{ text:'💰 Budget',     callback_data:'flow_budget' }],
    [{ text:'📦 Build & Get APK', callback_data:'cmd_apk' }],
    [{ text:'⬅️ Main', callback_data:'menu_main' }],
  ]},
  back: { inline_keyboard: [[{ text:'⬅️ Main Menu', callback_data:'menu_main' }]] },
};

const MENU_TEXTS = {
  main:  '🤖 *Sultan Agent v6.0 — God Mode*\n\n_ChatGPT + Gemini + Web Search + APK Build — Sirf Sultan ke liye_ 🔥\n\nKuch bhi poocho ya neeche se choose karo:',
  eng:   '🏗️ *MA Engineering Panel*\n\nProjects, materials, quotations, profit — sab yahan!',
  smm:   '📊 *SMM Panel*\n\nOrders track karo, revenue dekho!',
  mem:   '🧠 *Memory — Firebase Sync*\n\n_App + Bot dono mein dikhta hai!_',
  tools: '🛠️ *Tools — God Mode*\n\nCalculator, Reminders, Weather, Web Search, APK Build!',
};

const MATERIALS = {
  cement: { price:1350, unit:'bag (50kg)', emoji:'🏗️' },
  steel:  { price:280,  unit:'kg',         emoji:'⚙️' },
  brick:  { price:28,   unit:'piece',      emoji:'🧱' },
  sand:   { price:6000, unit:'ton',        emoji:'🪣' },
  paint:  { price:750,  unit:'litre',      emoji:'🎨' },
  tile:   { price:200,  unit:'sqft',       emoji:'🟫' },
};

const userState = new Map();
const reminders = [];

const send   = (cid, text, kb) => tg('sendMessage', { chat_id:cid, text, parse_mode:'Markdown', reply_markup: kb||KB.back });
const typing = cid => tg('sendChatAction', { chat_id:cid, action:'typing' }).catch(()=>{});
const edit   = (cid, mid, text, kb) => tg('editMessageText', { chat_id:cid, message_id:mid, text, parse_mode:'Markdown', reply_markup: kb||KB.back });

// ─── APK Build Handler ────────────────────────────────────────────────────────
async function handleAPKBuild(cid) {
  if (!EXPO) {
    return send(cid, '⚠️ *EXPO_TOKEN not set!*\n\nRailway pe EXPO_TOKEN env var set karo.\n\nManual build: https://github.com/' + GH_REPO + '/actions', KB.main);
  }
  await send(cid,
    '📦 *APK Build Start Ho Rahi Hai!*\n\n' +
    '🔄 GitHub Actions pe build submit ho rahi hai...\n' +
    '⏱ ETA: 10-15 minutes\n\n' +
    '_Jab APK ready hogi, main seedha yahan file bhejunga!_ 📲', KB.back);

  try {
    await triggerAPKBuild();
    pendingBuilds.push({ cid, startTime: Date.now() });
    log('[APK] Build triggered for chat:', cid);
    await send(cid,
      '✅ *Build Submitted!*\n\n' +
      '📊 Track karo:\nGitHub: https://github.com/' + GH_REPO + '/actions\n' +
      'Expo: https://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds\n\n' +
      '_Jab APK tayar hogi — seedha yahan aayegi!_ 🚀', KB.main);
  } catch(e) {
    await send(cid, '❌ Build trigger fail: ' + e.message, KB.main);
  }
}

// ─── Daily Report ─────────────────────────────────────────────────────────────
async function dailyReport(cid) {
  const [projects, orders, memory] = await Promise.all([
    fbGet('users/'+FB_USER+'/projects'), fbGet('users/'+FB_USER+'/orders'), fbGet('users/'+FB_USER+'/memory')
  ]);
  const date = new Date().toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long', timeZone:'Asia/Karachi' });
  const active   = projects.filter(p => ['active','Active'].includes(p.status));
  const revenue  = orders.reduce((s,o) => s + (parseFloat(o.unitPrice||0)*parseFloat(o.quantity||1)), 0);
  const totalProj= projects.reduce((s,p) => s + parseFloat(p.amount||0), 0);
  return send(cid,
    '🌅 *Daily Report — Sultan Agent v6.0*\n📅 ' + date +
    '\n\n🏗️ *Engineering*\nProjects: ' + projects.length + ' total | ' + active.length + ' active\n' +
    (active.slice(0,3).map(p=>'• '+p.name+' — PKR '+parseFloat(p.amount||0).toLocaleString()).join('\n') || '• Koi active project nahi') +
    '\nTotal: PKR ' + totalProj.toLocaleString() +
    '\n\n📊 *SMM*\nOrders: ' + orders.length + ' | Revenue: PKR ' + revenue.toLocaleString() +
    '\n\n🧠 Memory: ' + memory.length + ' items' +
    '\n\n🤖 AI: '+(GROQ?'Groq ⚡ ':'')+(GEMINI?'Gemini 🔮 ':'')+(OPENAI?'OpenAI 🧠':'') +
    '\n🔍 Search: '+(SERPER?'ON ✅':'OFF') +
    '\n📦 APK Download: '+(EXPO?'✅ Auto':'⚠️ Need EXPO_TOKEN') +
    '\n🚂 Railway: 24/7 ✅', KB.main);
}
function scheduleDailyReport() {
  const now = new Date(), next = new Date();
  next.setUTCHours(2, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate()+1);
  setTimeout(async()=>{ if (ADMIN) await dailyReport(ADMIN).catch(()=>{}); scheduleDailyReport(); }, next-now);
}

// ─── Callback Handler ─────────────────────────────────────────────────────────
async function handleCB(query) {
  const cid = query.message.chat.id, mid = query.message.message_id, data = query.data;
  await tg('answerCallbackQuery', { callback_query_id: query.id });

  if (['menu_main','menu_eng','menu_smm','menu_mem','menu_tools'].includes(data)) {
    const key = data.slice(5);
    const kb = { eng:KB.eng, smm:KB.smm, mem:KB.mem, tools:KB.tools }[key] || KB.main;
    return edit(cid, mid, MENU_TEXTS[key] || MENU_TEXTS.main, kb);
  }
  if (data === 'menu_mat') return edit(cid, mid, '🧱 *Material Rates 2025*\n\nJo chahiye select karo:', KB.mat);
  if (data === 'cmd_apk')  return handleAPKBuild(cid);

  if (data === 'cmd_status') {
    const up = process.uptime(), h = Math.floor(up/3600), m = Math.floor((up%3600)/60);
    return edit(cid, mid,
      '🟢 *Sultan Agent v6.0 — ONLINE*\n\n' +
      '⏱ Uptime: '+h+'h '+m+'m\n' +
      '🤖 AI: '+(GROQ?'Groq ⚡ ':'')+(GEMINI?'Gemini 🔮 ':'')+(OPENAI?'OpenAI 🧠':'❌ No AI!') + '\n' +
      '🔍 Search: '+(SERPER?'✅ ON':'❌ OFF')+'\n' +
      '🔥 Firebase: '+FB_ID+' ✅\n' +
      '🎙️ Voice: '+(GROQ?'✅ Whisper':'❌ Need Groq')+'\n' +
      '📦 APK Download: '+(EXPO?'✅ Auto-send':'⚠️ Need EXPO_TOKEN')+'\n' +
      '🚂 Railway: 24/7 ✅\n' +
      '⏳ Pending builds: '+pendingBuilds.length+'\n' +
      '📦 Version: v6.0 God Mode', KB.main);
  }

  if (data === 'cmd_report') return dailyReport(cid);

  if (data === 'cmd_projects') {
    const projects = await fbGet('users/'+FB_USER+'/projects');
    if (!projects.length) return send(cid, '📁 *Projects*\n\nKoi project nahi.', KB.eng);
    const lines = projects.slice(0,10).map(p=>'• *'+p.name+'* — '+(p.status||'?')+'\n  Client: '+(p.client||'?')+' | PKR '+parseFloat(p.amount||0).toLocaleString()).join('\n\n');
    return send(cid, '🏗️ *Engineering Projects*\n\n'+lines+'\n\nTotal: '+projects.length, KB.eng);
  }

  if (data === 'cmd_smm') {
    const orders = await fbGet('users/'+FB_USER+'/orders');
    const revenue = orders.reduce((s,o)=>s+(parseFloat(o.unitPrice||0)*parseFloat(o.quantity||1)),0);
    const pending = orders.filter(o=>o.status==='pending').length;
    const done    = orders.filter(o=>o.status==='completed').length;
    if (!orders.length) return send(cid, '📊 *SMM Dashboard*\n\nKoi order nahi.', KB.smm);
    const lines = orders.slice(0,8).map(o=>'• '+(o.service||'?')+' × '+o.quantity+'\n  PKR '+(parseFloat(o.unitPrice||0)*parseFloat(o.quantity||1)).toLocaleString()+' | '+(o.status||'?')).join('\n');
    return send(cid, '📊 *SMM Dashboard*\n\n'+lines+'\n\n💰 Revenue: PKR '+revenue.toLocaleString()+'\n⏳ Pending: '+pending+' | ✅ Done: '+done, KB.smm);
  }

  if (data === 'cmd_memories') {
    const memory = await fbGet('users/'+FB_USER+'/memory');
    if (!memory.length) return send(cid, '🧠 *Memory*\n\nKoi memory nahi.', KB.mem);
    const lines = memory.slice(0,10).map((m,i)=>(i+1)+'. '+(m.text||'?').slice(0,100)).join('\n');
    return send(cid, '🧠 *Memories — Last '+Math.min(memory.length,10)+'*\n\n'+lines+'\n\nTotal: '+memory.length, KB.mem);
  }

  if (data === 'cmd_clearmem') return send(cid, '⚠️ Confirm: /clearmem — sari memories delete hongi.', KB.mem);

  const matKey = ['cement','steel','brick','sand','paint','tile'].find(k => data==='mat_'+k);
  if (matKey) {
    const mat = MATERIALS[matKey];
    userState.set(cid, { flow:'mat_qty', type:matKey });
    return send(cid, mat.emoji+' *'+matKey.charAt(0).toUpperCase()+matKey.slice(1)+'*\nRate: PKR '+mat.price.toLocaleString()+'/'+mat.unit+'\n\nKitna chahiye? (sirf number):', KB.back);
  }

  const flowMap = {
    flow_ai:     { flow:'ai',      msg:'💬 *AI Chat — God Mode*\n\nKuch bhi poocho! Urdu/English/Hinglish — sab chalega.' },
    flow_search: { flow:'search',  msg:'🔍 *Web Search*\n\nKya search karna hai?' },
    flow_quote:  { flow:'quote',   msg:'📝 *AI Quotation Generator*\n\nProject details do:\n_Example: 3 bedroom house, 1000 sqft, Lahore_' },
    flow_profit: { flow:'profit',  msg:'💰 *Profit Calculator*\n\n2 numbers do: selling_price cost\n_Example: 150000 95000_' },
    flow_order:  { flow:'order',   msg:'➕ *Add SMM Order*\n\nFormat: service quantity unit_price\n_Example: Instagram Followers 1000 0.5_' },
    flow_save:   { flow:'save',    msg:'💾 *Save to Memory*\n\nKya save karna hai?' },
    flow_calc:   { flow:'calc',    msg:'🧮 *Calculator*\n\nExpression likho:\n_Example: 380 * 100 + 5000_' },
    flow_remind: { flow:'remind',  msg:'⏰ *Set Reminder*\n\nFormat: 30m message\n_Example: 2h Meeting hai_' },
    flow_weather:{ flow:'weather', msg:'🌤️ *Weather*\n\nKis city ka weather chahiye?' },
    flow_expense:{ flow:'expense', msg:'💸 *Log Expense*\n\nFormat: amount description\n_Example: 5000 Cement bags_' },
    flow_budget: { flow:'budget',  msg:'💰 *Budget Check*\n\n2 numbers: total spent\n_Example: 100000 65000_' },
  };
  if (flowMap[data]) { userState.set(cid, { flow:flowMap[data].flow }); return send(cid, flowMap[data].msg, KB.back); }
}

// ─── Text Handler ─────────────────────────────────────────────────────────────
async function handleText(msg) {
  const cid = msg.chat.id, text = msg.text||'', lower = text.toLowerCase().trim();

  if (text==='/start'||text==='/menu') { userState.delete(cid); return send(cid, MENU_TEXTS.main, KB.main); }
  if (text==='/status') return send(cid, '🟢 Sultan Agent v6.0 | AI:'+(GROQ?'Groq⚡':'')+(GEMINI?' Gemini🔮':'')+(OPENAI?' OpenAI🧠':'')+'| APK:'+(EXPO?'Auto ✅':'Need EXPO_TOKEN'), KB.main);
  if (text==='/report') return dailyReport(cid);
  if (text==='/apk'||text==='/buildapk') return handleAPKBuild(cid);
  if (text==='/clear') { clearHist(cid); return send(cid, '🧹 Chat history cleared!', KB.main); }
  if (text==='/clearmem') {
    const memory = await fbGet('users/'+FB_USER+'/memory');
    for (const m of memory) {
      await httpJSON({ hostname:'firestore.googleapis.com',
        path:'/v1/projects/'+FB_ID+'/databases/(default)/documents/users/'+FB_USER+'/memory/'+m._id+'?key='+FB_KEY,
        method:'DELETE', headers:{} }, null).catch(()=>{});
    }
    fbInvalidate('users/'+FB_USER+'/memory');
    return send(cid, '🗑️ Sari memories delete ho gayi!', KB.main);
  }

  if (lower.startsWith('/search ')||lower.startsWith('search: ')) {
    const q = text.slice(text.indexOf(' ')+1); typing(cid);
    const results = await webSearch(q);
    const ai = await callAI(cid, 'Web search results for "'+q+'":\n\n'+results+'\n\nSummary do.');
    return ai ? send(cid, '🔍 *'+q+'*\n\n'+ai.text+'\n\n_— '+ai.by+'_', KB.main) : send(cid, '🔍\n'+results, KB.main);
  }

  if (lower.startsWith('yaad rakh')||lower.startsWith('remember:')||lower.startsWith('/yaad ')) {
    const note = text.replace(/^(yaad rakh|remember:|\/yaad\s*)/i,'').trim();
    if (note) {
      fbSave('users/'+FB_USER+'/memory', String(Date.now()), { text:note, createdAt:Date.now(), tags:[], source:'telegram' });
      fbInvalidate('users/'+FB_USER+'/memory');
      return send(cid, '🧠 *Yaad kar liya!*\n\n_"'+note+'"_\n\n🔥 Firebase save ✅', KB.main);
    }
  }

  const state = userState.get(cid);
  if (state) {
    const flow = state.flow; userState.delete(cid);
    if (flow==='ai') { typing(cid); const r=await callAI(cid,text); return r?send(cid,r.text+'\n\n_— '+r.by+'_',KB.main):send(cid,'❌ AI unavailable.',KB.main); }
    if (flow==='search') { typing(cid); const res=await webSearch(text); const ai=await callAI(cid,'Web search:\n\n'+res+'\n\nSummary do.'); return ai?send(cid,'🔍 *'+text+'*\n\n'+ai.text+'\n\n_— '+ai.by+'_',KB.main):send(cid,'🔍\n'+res,KB.main); }
    if (flow==='quote') { typing(cid); const r=await callAI(cid,'MA Engineering project quotation banao: '+text+'. PKR mein, 2025 Pakistan rates. Professional format.'); return r?send(cid,'📝 *Project Quotation*\n\n'+r.text+'\n\n_— '+r.by+'_',KB.eng):send(cid,'❌ AI unavailable.',KB.eng); }
    if (flow==='profit') {
      const parts=text.trim().split(/\s+/); if (parts.length<2) return send(cid,'⚠️ 2 numbers: selling cost');
      const p=parseFloat(parts[0]),c=parseFloat(parts[1]); if (isNaN(p)||isNaN(c)) return send(cid,'⚠️ Sirf numbers.');
      const profit=p-c, margin=((profit/p)*100).toFixed(1), bars=Math.floor(Math.min(100,Math.abs(parseFloat(margin)))/10);
      const bar='▓'.repeat(bars)+'░'.repeat(10-bars), emoji=profit<0?'❌':parseFloat(margin)>30?'🚀':parseFloat(margin)>15?'✅':'⚠️';
      return send(cid,'💰 *Profit Analysis*\n\nSelling: PKR '+p.toLocaleString()+'\nCost:    PKR '+c.toLocaleString()+'\nProfit:  PKR '+profit.toLocaleString()+'\n\n['+bar+'] '+margin+'% '+emoji, KB.main);
    }
    if (flow==='order') {
      const parts=text.trim().split(/\s+/); if (parts.length<3) return send(cid,'⚠️ Format: service quantity unit_price');
      const unitPrice=parseFloat(parts[parts.length-1]),quantity=parseInt(parts[parts.length-2]),service=parts.slice(0,-2).join(' ');
      fbSave('users/'+FB_USER+'/orders',String(Date.now()),{service,quantity,unitPrice,status:'pending',date:new Date().toISOString().split('T')[0]});
      fbInvalidate('users/'+FB_USER+'/orders');
      return send(cid,'📦 *Order Added!*\n\n'+service+'\nQty: '+quantity+' | Rate: PKR '+unitPrice+'\nTotal: PKR '+(quantity*unitPrice).toLocaleString()+'\n\n🔥 App sync ✅', KB.smm);
    }
    if (flow==='save') { fbSave('users/'+FB_USER+'/memory',String(Date.now()),{text,createdAt:Date.now(),tags:[],source:'telegram'}); fbInvalidate('users/'+FB_USER+'/memory'); return send(cid,'🧠 *Saved!*\n\n_"'+text+'"_\n\n🔥 App sync ✅',KB.mem); }
    if (flow==='expense') {
      const match=text.match(/^(\d+(?:\.\d+)?)\s+(.+)$/); if (!match) return send(cid,'⚠️ Format: amount description');
      const [,amt,desc]=match;
      fbSave('users/'+FB_USER+'/memory',String(Date.now()),{text:'💸 PKR '+amt+' — '+desc,createdAt:Date.now(),tags:['expense'],source:'telegram'});
      fbInvalidate('users/'+FB_USER+'/memory');
      return send(cid,'💸 *Expense Logged!*\n\nPKR '+parseFloat(amt).toLocaleString()+' — '+desc+'\n🔥 App save ✅',KB.main);
    }
    if (flow==='budget') {
      const [t,s]=text.split(/\s+/).map(Number); if (isNaN(t)||isNaN(s)) return send(cid,'⚠️ Format: total spent');
      const rem=t-s,pct=Math.min(100,(s/t*100)).toFixed(1),bars=Math.floor(parseFloat(pct)/10);
      const bar='▓'.repeat(bars)+'░'.repeat(10-bars),st=rem<0?'❌ Over budget!':parseFloat(pct)>85?'🔴 Almost khatam!':parseFloat(pct)>60?'🟡 Theek hai':'🟢 Safe';
      return send(cid,'💰 *Budget Check*\n\nTotal: PKR '+t.toLocaleString()+'\nSpent: PKR '+s.toLocaleString()+'\nBacha: PKR '+Math.abs(rem).toLocaleString()+(rem<0?' (OVER!)':'')+'\n\n['+bar+'] '+pct+'%\n'+st, KB.main);
    }
    if (flow==='calc') { try { const safe=text.replace(/[^0-9+\-*/.() ]/g,''); const r=new Function('return ('+safe+')')(); return send(cid,'🧮 `'+text+'` = *'+Number(r).toLocaleString()+'*',KB.main); } catch { return send(cid,'❌ Invalid. Example: 380 * 100'); } }
    if (flow==='weather') { typing(cid); const r=await callAI(cid,text+' ka weather detail mein batao — temperature, humidity, wind. Pakistan time zone.'); return r?send(cid,r.text,KB.main):send(cid,'🌤️ Weather unavailable.',KB.main); }
    if (flow==='remind') {
      const match=text.match(/^(\d+)(m|h|d)\s+(.+)$/i); if (!match) return send(cid,'⚠️ Format: 30m message');
      const [,num,unit,message]=match; const ms={m:60000,h:3600000,d:86400000}[unit.toLowerCase()];
      reminders.push({ chatId:cid, text:message, fireAt:Date.now()+parseInt(num)*ms });
      const label=num+' '+(unit==='m'?'minute':unit==='h'?'ghante':'din');
      return send(cid,'⏰ *Reminder Set!*\n\n_"'+message+'"_\n'+label+' baad yaad dilaaunga ✅',KB.main);
    }
    if (flow==='mat_qty') {
      const qty=parseFloat(text), mat=MATERIALS[state.type];
      if (!mat||isNaN(qty)||qty<=0) return send(cid,'⚠️ Sirf number likho. Example: 100');
      return send(cid,mat.emoji+' *Material Cost*\n\n'+state.type+' × '+qty+' '+mat.unit+'\nRate: PKR '+mat.price.toLocaleString()+'/'+mat.unit+'\n\n💰 *Total: PKR '+(qty*mat.price).toLocaleString()+'*',KB.eng);
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
  const cid = msg.chat.id; typing(cid);
  const text = await transcribeVoice(msg.voice.file_id);
  if (!text) return send(cid, '❌ Voice transcription fail. Groq key check karo.', KB.main);
  await tg('sendMessage', { chat_id:cid, text:'🎙️ _Transcribed: "'+text+'"_', parse_mode:'Markdown' });
  const result = await callAI(cid, text);
  return result ? send(cid, result.text+'\n\n_— '+result.by+'_', KB.main) : send(cid, '❌ AI unavailable.', KB.main);
}

// ─── Reminder tick ────────────────────────────────────────────────────────────
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
      if (u.callback_query) { log('[BTN]',(u.callback_query.from?.first_name||'?')+':',u.callback_query.data); handleCB(u.callback_query).catch(e=>log('[CB ERR]',e.message)); }
      else if (u.message) {
        const m=u.message;
        log('[MSG]',(m.from?.first_name||'?')+':',m.text?.slice(0,50)||(m.voice?'🎙️ Voice':'?'));
        if (m.voice) handleVoice(m).catch(e=>log('[Voice ERR]',e.message));
        else if (m.text) handleText(m).catch(e=>log('[MSG ERR]',e.message));
      }
    }
  } catch(e) { errCount++; log('[Poll #'+errCount+']',e.message); if (errCount>5) await new Promise(r=>setTimeout(r,10000)); }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN missing!'); process.exit(1); }
  const me = await tg('getMe');
  if (!me.ok) { console.error('❌ Invalid bot token!'); process.exit(1); }
  log('✅ @'+me.result.username+' — Sultan Agent v6.0 God Mode ONLINE');
  log('🤖 AI: '+(GROQ?'Groq ⚡ ':'')+(GEMINI?'Gemini 🔮 ':'')+(OPENAI?'OpenAI 🧠 ':'')+ (!GROQ&&!GEMINI&&!OPENAI?'❌ NO AI KEY!':''));
  log('📦 APK Auto-Download: '+(EXPO?'✅ ENABLED':'⚠️ Need EXPO_TOKEN'));
  log('🔍 Web Search: '+(SERPER?'✅ Enabled':'❌ Disabled'));
  log('🔥 Firebase: '+FB_ID);
  scheduleDailyReport();
  if (ADMIN) {
    tg('sendMessage', { chat_id:ADMIN,
      text:'🚀 *Sultan Agent v6.0 — God Mode ONLINE!*\n\n'+
        '🤖 AI: '+(GROQ?'Groq ⚡ → ':'')+(GEMINI?'Gemini 🔮 → ':'')+(OPENAI?'OpenAI 🧠':'')+''+
        '\n🔍 Search: '+(SERPER?'✅ ON':'❌ OFF')+
        '\n🎙️ Voice: '+(GROQ?'✅ Whisper':'❌ Need Groq')+
        '\n📦 APK Auto-Send: '+(EXPO?'✅ ON — /apk likho aur seedha file milegi!':'⚠️ Need EXPO_TOKEN')+
        '\n🔥 Firebase: '+FB_ID+' ✅'+
        '\n🚂 Railway: 24/7 Online\n\n'+
        '✨ *New in v6.0:*\n'+
        '• /apk — Build trigger karo, APK seedha yahan aayegi!\n'+
        '• Auto EAS polling — build hote hi file bhejta hai\n'+
        '• Voice transcription (Whisper)\n'+
        '• Web search (Serper)\n'+
        '• Firebase sync\n\nMain menu neeche hai 👇',
      parse_mode:'Markdown', reply_markup:KB.main,
    }).catch(()=>{});
  }
  while (true) { await poll(); await new Promise(r=>setTimeout(r,100)); }
}
main().catch(e=>{ console.error('Fatal:',e); process.exit(1); });
