// Sultan Agent — MEGA Smart Bot v3.0
// Features: AI, MA Engineering, SMM, Weather, Calculator, Reminders, Expenses, Daily Reports

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_KEY   = process.env.GROQ_API_KEY   || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const AI_ENABLED = process.env.AI_REPLY_ENABLED !== 'false';
const FB_KEY     = process.env.FIREBASE_API_KEY    || '';
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || '';
const FB_USER    = process.env.FIREBASE_USER_ID    || 'sultan';
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID       || '';
const WEATHER_KEY= process.env.WEATHER_API_KEY     || '';

// Material prices (PKR)
const MATERIALS = {
  cement: { price: 1350, unit: 'bag (50kg)', emoji: '🏗️' },
  steel:  { price: 320,  unit: 'kg',         emoji: '⚙️' },
  brick:  { price: 18,   unit: 'piece',      emoji: '🧱' },
  sand:   { price: 4500, unit: 'trolley',    emoji: '🪣' },
  gravel: { price: 6000, unit: 'trolley',    emoji: '🪨' },
  paint:  { price: 850,  unit: 'litre',      emoji: '🎨' },
  tile:   { price: 120,  unit: 'sqft',       emoji: '🟫' },
  rod:    { price: 320,  unit: 'kg',         emoji: '🔩' },
  wire:   { price: 180,  unit: 'kg',         emoji: '🔌' },
  pipe:   { price: 450,  unit: 'piece',      emoji: '🔧' },
};

// Reminders in-memory
const reminders = [];
setInterval(() => {
  const now = Date.now();
  for (let i = reminders.length - 1; i >= 0; i--) {
    const r = reminders[i];
    if (now >= r.fireAt) {
      tg('sendMessage', { chat_id: r.chatId, text: `⏰ *Reminder!*\n\n${r.text}`, parse_mode: 'Markdown' }).catch(() => {});
      reminders.splice(i, 1);
    }
  }
}, 30000);

// Daily report scheduler (9 AM PKT = 4 AM UTC)
function scheduleDailyReport() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(4, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(async () => {
    if (ADMIN_CHAT) await sendDailyReport(ADMIN_CHAT);
    scheduleDailyReport();
  }, next - now);
}

async function sendDailyReport(chatId) {
  const date = new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric', timeZone:'Asia/Karachi' });
  const [projects, memories, expenses, orders] = await Promise.all([
    fbGet(`users/${FB_USER}/projects`),
    fbGet(`users/${FB_USER}/memories`),
    fbGet(`users/${FB_USER}/expenses`),
    fbGet(`users/${FB_USER}/smm_orders`),
  ]);
  const todayExp = expenses.filter(e => new Date(parseInt(e.timestamp||0)).toDateString() === new Date().toDateString());
  const totalExp = todayExp.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalRev = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

  const report = `🌅 *Sultan Agent — Daily Report*
📅 ${date}

🏗️ *MA Engineering*
Active Projects: ${projects.length}
${projects.slice(0,3).map(p => `• ${p.name || 'Unnamed'} — ${p.status || 'Active'}`).join('\n') || '• No projects yet'}

📊 *SMM Panel*
Total Orders: ${orders.length} | Revenue: Rs. ${totalRev.toLocaleString()}

💸 *Aaj ke Expenses*
${todayExp.length ? todayExp.slice(0,3).map(e => `• ${e.desc}: Rs.${parseFloat(e.amount||0).toLocaleString()}`).join('\n') : '• Koi expense nahi'}
${todayExp.length ? `Total: Rs. ${totalExp.toLocaleString()}` : ''}

🧠 Memories saved: ${memories.length}
🤖 AI: ${GROQ_KEY?'Groq':GEMINI_KEY?'Gemini':'OpenAI'} | Bot: Online

_Good morning Sultan! Aaj bhi shaan se kaam karo 💪_`;

  await tg('sendMessage', { chat_id: chatId, text: report, parse_mode: 'Markdown' });
}

// Telegram API
async function tg(method, body = null) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// AI: Groq → Gemini → OpenAI
const SYSTEM = `You are Sultan Agent — personal AI of Sultan, CEO of MA Engineering Pakistan.
Expertise: Civil/structural engineering, BOQ, quotations, project management, SMM panel, coding, business strategy.
Reply in same language as user (Urdu/English/mix). Be expert, direct, and powerful.`;

async function ai(messages) {
  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYSTEM }, ...messages], max_tokens: 1000 }),
      });
      const d = await r.json();
      if (d.choices?.[0]?.message?.content) return { text: d.choices[0].message.content, by: 'Groq' };
    } catch {}
  }
  if (GEMINI_KEY) {
    try {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: SYSTEM }] }, generationConfig: { maxOutputTokens: 1000 } }) });
      const d = await r.json();
      if (d.candidates?.[0]?.content?.parts?.[0]?.text) return { text: d.candidates[0].content.parts[0].text, by: 'Gemini' };
    } catch {}
  }
  if (OPENAI_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, ...messages], max_tokens: 1000 }),
      });
      const d = await r.json();
      if (d.choices?.[0]?.message?.content) return { text: d.choices[0].message.content, by: 'OpenAI' };
    } catch {}
  }
  return null;
}

// Firebase REST
async function fbSave(col, id, data) {
  if (!FB_KEY || !FB_PROJECT) return;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') fields[k] = { stringValue: v };
      else if (typeof v === 'number') fields[k] = { integerValue: String(Math.floor(v)) };
      else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    }
    await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  } catch {}
}

async function fbGet(col) {
  if (!FB_KEY || !FB_PROJECT) return [];
  try {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}?key=${FB_KEY}`);
    const d = await r.json();
    return (d.documents || []).map(doc => {
      const o = {};
      for (const [k, v] of Object.entries(doc.fields || {})) o[k] = v.stringValue || v.integerValue || v.booleanValue || '';
      return o;
    });
  } catch { return []; }
}

// Command handler
async function handleCommand(text, chatId, from) {
  const raw = text.trim();
  const firstWord = raw.split(' ')[0].toLowerCase();
  const args = raw.slice(firstWord.length).trim();

  if (firstWord === '/start' || firstWord === '/help') {
    return `🤖 *Sultan Agent v3.0 — Commands*

━━━━━━━━━━━━━━━━━━━━━━
🏗️ *MA Engineering*
/projects — Active projects
/add\\_project [naam] — Naya project
/quote [details] — AI quotation
/material [qty] [type] — Cost estimate
/area [length] [width] — Area calculate

📊 *SMM Panel*
/smm — Dashboard
/add\\_order [amt] [desc] — Order save
/profit [price] [cost] — Margin calc

💸 *Finance*
/expense [amt] [desc] — Log karo
/expenses — Aaj ka summary
/budget [total] [spent] — Budget %

🧠 *Memory*
/save [baat] — Firebase mein save
/memory — Saved cheezein dekho

⏰ *Reminders*
/remind 30m [baat] — 30 min baad
/remind 2h [baat] — 2 ghante baad
/remind 1d [baat] — Kal yaad dilao

🌤️ *Tools*
/weather [city] — Mausam
/calc [expression] — Calculator
/rate — USD/PKR live rates
/export — Full data summary

📋 *Reports*
/daily — Abhi report dekho

⚙️ *System*
/ping — Bot status
/clear — Chat history clear
/help — Yeh menu

_Ya seedha kuch bhi poocho — AI ready hai!_ 💪`;
  }

  if (firstWord === '/ping') {
    const up = Math.floor(process.uptime());
    const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = up % 60;
    return `🟢 *Sultan Agent Online!*
⏱️ Uptime: ${h}h ${m}m ${s}s
🤖 AI: ${GROQ_KEY ? 'Groq ✅' : GEMINI_KEY ? 'Gemini ✅' : OPENAI_KEY ? 'OpenAI ✅' : '❌ No API key'}
🔥 Firebase: ${FB_KEY ? 'Connected ✅' : 'Not set ⚠️'}
📱 Version: Sultan Agent v3.0
🌐 Node: ${process.version}`;
  }

  if (firstWord === '/daily') {
    await sendDailyReport(chatId);
    return null;
  }

  if (firstWord === '/projects') {
    const projects = await fbGet(`users/${FB_USER}/projects`);
    if (!projects.length) return '🏗️ *Projects*\n\nKoi project nahi.\n/add\\_project [naam] se pehla project add karo!';
    const list = projects.map((p, i) => `${i+1}. *${p.name}* — ${p.status || 'Active'}${p.value ? ` | Rs.${parseInt(p.value).toLocaleString()}` : ''}`).join('\n');
    return `🏗️ *MA Engineering Projects* (${projects.length})\n\n${list}`;
  }

  if (firstWord === '/add_project') {
    if (!args) return '⚠️ Format: /add\\_project [naam]\nExample: /add\\_project DHA Phase 6 House';
    await fbSave(`users/${FB_USER}/projects`, String(Date.now()), { name: args, status: 'Active', created: Date.now(), by: 'telegram' });
    return `✅ *Project Added!*\n\n🏗️ ${args}\nStatus: Active\n🔥 Firebase mein save ✅`;
  }

  if (firstWord === '/material') {
    const parts = args.split(' ');
    const qty = parseFloat(parts[0]);
    const type = parts[1]?.toLowerCase();
    if (isNaN(qty) || !type) {
      const list = Object.entries(MATERIALS).map(([k, v]) => `• ${k}: Rs.${v.price}/${v.unit}`).join('\n');
      return `⚠️ Format: /material [qty] [type]\n\n*Available:*\n${list}`;
    }
    const mat = MATERIALS[type];
    if (!mat) {
      const list = Object.entries(MATERIALS).map(([k, v]) => `• \`${k}\``).join(' | ');
      return `❌ "${type}" nahi mila.\n\nTypes: ${list}`;
    }
    const total = qty * mat.price;
    return `${mat.emoji} *Material Estimate*

Type: ${type.charAt(0).toUpperCase() + type.slice(1)}
Quantity: ${qty} ${mat.unit}
Rate: Rs. ${mat.price.toLocaleString()}/${mat.unit}
━━━━━━━━━━━━━━━
💰 *Total: Rs. ${total.toLocaleString()}*

_Rates approximate — market se confirm karo_`;
  }

  if (firstWord === '/area') {
    const parts = args.split(' ').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '⚠️ Format: /area [length] [width] [height optional]\nExample: /area 20 15\nExample: /area 20 15 10 (volume bhi)';
    const [l, w, h] = parts;
    const sqft = l * w;
    const sqm = (sqft * 0.0929).toFixed(2);
    const sqyd = (sqft / 9).toFixed(2);
    let result = `📐 *Area Calculator*

Length: ${l} ft | Width: ${w} ft
━━━━━━━━━━━━━━━
📏 *${sqft} sq ft*
📏 *${sqm} sq meter*
📏 *${sqyd} sq yard*`;
    if (h && !isNaN(h)) result += `\n\n📦 Volume: *${(l * w * h).toFixed(2)} cubic ft*\n📦 Volume: *${((l * w * h) * 0.0283).toFixed(2)} cubic meter*`;
    return result;
  }

  if (firstWord === '/profit') {
    const [price, cost] = args.split(' ').map(Number);
    if (isNaN(price) || isNaN(cost)) return '⚠️ Format: /profit [selling price] [cost]\nExample: /profit 5000 3200';
    const profit = price - cost;
    const margin = ((profit / price) * 100).toFixed(1);
    const bar = '▓'.repeat(Math.min(10, Math.floor(parseFloat(margin) / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(parseFloat(margin) / 10)));
    const emoji = parseFloat(margin) > 30 ? '🟢' : parseFloat(margin) > 15 ? '🟡' : '🔴';
    return `📊 *Profit Calculator*

💰 Selling Price: Rs. ${price.toLocaleString()}
💸 Cost Price:    Rs. ${cost.toLocaleString()}
✅ Profit:        Rs. ${profit.toLocaleString()}

[${bar}] ${margin}% ${emoji}

${parseFloat(margin) > 30 ? '🎉 Zabardast margin!' : parseFloat(margin) > 15 ? '👍 Theek hai, improve ho sakta hai' : '⚠️ Margin bohot kam hai — cost kam karo'}`;
  }

  if (firstWord === '/expense') {
    const match = args.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!match) return '⚠️ Format: /expense [amount] [description]\nExample: /expense 1500 Cement 2 bags';
    const [, amount, desc] = match;
    await fbSave(`users/${FB_USER}/expenses`, String(Date.now()), { amount, desc, timestamp: Date.now(), by: from });
    return `💸 *Expense Logged!*\n\nAmount: Rs. ${parseFloat(amount).toLocaleString()}\nDesc: ${desc}\n🔥 Firebase ✅`;
  }

  if (firstWord === '/expenses') {
    const all = await fbGet(`users/${FB_USER}/expenses`);
    const today = all.filter(e => new Date(parseInt(e.timestamp || 0)).toDateString() === new Date().toDateString());
    if (!today.length) return '💸 *Aaj ke Expenses*\n\nKoi expense log nahi hua aaj.\n/expense [amt] [desc] se add karo!';
    const total = today.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const list = today.map((e, i) => `${i+1}. ${e.desc || '?'}: Rs.${parseFloat(e.amount || 0).toLocaleString()}`).join('\n');
    return `💸 *Aaj ke Expenses* (${today.length} items)\n\n${list}\n\n━━━━━━━━━━\n💰 Total: Rs. ${total.toLocaleString()}`;
  }

  if (firstWord === '/budget') {
    const [total, spent] = args.split(' ').map(Number);
    if (isNaN(total) || isNaN(spent)) return '⚠️ Format: /budget [total] [spent]\nExample: /budget 500000 320000';
    const remaining = total - spent;
    const pct = Math.min(100, ((spent / total) * 100)).toFixed(1);
    const bars = Math.floor(parseFloat(pct) / 10);
    const bar = '▓'.repeat(bars) + '░'.repeat(10 - bars);
    const status = remaining < 0 ? '❌ Budget exceed!' : parseFloat(pct) > 90 ? '🔴 Almost khatam!' : parseFloat(pct) > 70 ? '🟡 70% use ho gaya' : '🟢 Budget safe hai';
    return `💰 *Budget Tracker*

Total:     Rs. ${total.toLocaleString()}
Spent:     Rs. ${spent.toLocaleString()}
Remaining: Rs. ${Math.abs(remaining).toLocaleString()}${remaining < 0 ? ' (over budget)' : ''}

[${bar}] ${pct}%
${status}`;
  }

  if (firstWord === '/add_order') {
    const match = args.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!match) return '⚠️ Format: /add\\_order [amount] [service description]\nExample: /add\\_order 2500 Instagram 10k followers';
    const [, amount, desc] = match;
    await fbSave(`users/${FB_USER}/smm_orders`, String(Date.now()), { amount, desc, timestamp: Date.now(), status: 'Pending', by: from });
    return `📦 *SMM Order Added!*\n\n💰 Amount: Rs. ${parseFloat(amount).toLocaleString()}\n📝 Service: ${desc}\nStatus: Pending\n🔥 Firebase ✅`;
  }

  if (firstWord === '/smm') {
    const orders = await fbGet(`users/${FB_USER}/smm_orders`);
    const revenue = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const pending = orders.filter(o => o.status === 'Pending').length;
    const done = orders.filter(o => o.status === 'Done').length;
    return `📊 *SMM Panel Dashboard*

📦 Total Orders: ${orders.length}
⏳ Pending: ${pending} | ✅ Done: ${done}
💰 Total Revenue: Rs. ${revenue.toLocaleString()}

🤖 Bot: Online ✅
🔥 Firebase: Synced ✅`;
  }

  if (firstWord === '/save') {
    if (!args) return '⚠️ Format: /save [baat]\nExample: /save Client ka number 0300-1234567';
    await fbSave(`users/${FB_USER}/memories`, String(Date.now()), { content: args, timestamp: Date.now(), source: 'telegram' });
    return `🧠 *Yaad kar liya!*\n\n"${args}"\n\n🔥 Firebase mein save ✅`;
  }

  if (firstWord === '/memory') {
    const mems = await fbGet(`users/${FB_USER}/memories`);
    if (!mems.length) return '🧠 *Memory*\n\nKoi cheez save nahi.\n/save [baat] se save karo!';
    const list = mems.slice(-12).map((m, i) => `${i+1}. ${m.content || ''}`).join('\n');
    return `🧠 *Sultan ki Memory* (${mems.length} items)\n\n${list}`;
  }

  if (firstWord === '/remind') {
    const match = args.match(/^(\d+)(m|h|d)\s+(.+)$/i);
    if (!match) return '⚠️ Format: /remind [time] [message]\nExamples:\n/remind 30m Meeting prepare karo\n/remind 2h Lunch time\n/remind 1d Project submit karna hai';
    const [, num, unit, message] = match;
    const ms = { m: 60000, h: 3600000, d: 86400000 }[unit.toLowerCase()];
    reminders.push({ chatId, text: message, fireAt: Date.now() + parseInt(num) * ms });
    const label = `${num} ${unit === 'm' ? 'minute' : unit === 'h' ? 'ghante' : 'din'}`;
    return `⏰ *Reminder Set!*\n\n"${message}"\n\n🕐 ${label} mein remind karunga ✅`;
  }

  if (firstWord === '/weather') {
    const city = args || 'Lahore';
    if (WEATHER_KEY) {
      try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric`);
        const w = await r.json();
        if (w.main) {
          return `🌤️ *${city} — Mausam*

🌡️ Temp: ${Math.round(w.main.temp)}°C (feels ${Math.round(w.main.feels_like)}°C)
💧 Humidity: ${w.main.humidity}%
🌬️ Wind: ${Math.round((w.wind?.speed || 0) * 3.6)} km/h
🌥️ ${w.weather?.[0]?.description || ''}
👁️ Visibility: ${Math.round((w.visibility || 0) / 1000)} km`;
        }
      } catch {}
    }
    return `🌤️ *${city} Weather*\n\nWeather key nahi hai.\nRailway mein WEATHER_API_KEY set karo\n_(openweathermap.org — free plan available)_`;
  }

  if (firstWord === '/calc') {
    if (!args) return '⚠️ Format: /calc [expression]\nExample: /calc 1350 * 100 + 320 * 50';
    try {
      const safe = args.replace(/[^0-9+\-*/.() ]/g, '');
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${safe})`)();
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('invalid');
      return `🧮 *Calculator*\n\n\`${args}\`\n= *${result.toLocaleString()}*`;
    } catch {
      return '❌ Invalid expression.\nExample: /calc 100 * 1350';
    }
  }

  if (firstWord === '/rate') {
    try {
      const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const d = await r.json();
      if (d.rates?.PKR) {
        const pkr = d.rates.PKR;
        return `💱 *Live Exchange Rates*

🇺🇸 1 USD = Rs. ${pkr.toFixed(2)}
🇦🇪 1 AED = Rs. ${(pkr / d.rates.AED).toFixed(2)}
🇬🇧 1 GBP = Rs. ${(pkr / d.rates.GBP).toFixed(2)}
🇸🇦 1 SAR = Rs. ${(pkr / d.rates.SAR).toFixed(2)}
🇨🇳 1 CNY = Rs. ${(pkr / d.rates.CNY).toFixed(2)}

_Live rates — ExchangeRate API_`;
      }
    } catch {}
    return '💱 Rate service abhi nahi chal rahi. Baad mein try karo.';
  }

  if (firstWord === '/clear') {
    chatHistory.delete(chatId);
    return '🗑️ Chat history clear! Fresh start karo.';
  }

  if (firstWord === '/export') {
    const [projects, expenses, orders, mems] = await Promise.all([
      fbGet(`users/${FB_USER}/projects`),
      fbGet(`users/${FB_USER}/expenses`),
      fbGet(`users/${FB_USER}/smm_orders`),
      fbGet(`users/${FB_USER}/memories`),
    ]);
    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const totalRev = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    return `📋 *Sultan Agent — Data Export*
📅 ${new Date().toLocaleDateString()}

🏗️ MA Engineering
  Projects: ${projects.length} (Active: ${projects.filter(p => p.status === 'Active').length})

📊 SMM Panel
  Orders: ${orders.length}
  Revenue: Rs. ${totalRev.toLocaleString()}

💸 Expenses
  Entries: ${expenses.length}
  Total: Rs. ${totalExp.toLocaleString()}

🧠 Memory: ${mems.length} items

🔥 Sab Firebase mein safe hai ✅`;
  }

  if (firstWord === '/quote') {
    return null; // Let AI handle with context injection
  }

  return null; // Not a command
}

// Chat history per user
const chatHistory = new Map();
function addHistory(chatId, role, content) {
  if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
  const h = chatHistory.get(chatId);
  h.push({ role, content });
  if (h.length > 14) h.splice(0, h.length - 14);
}

// Long polling
let offset = 0;
async function poll() {
  try {
    const data = await tg('getUpdates', { offset, timeout: 25, limit: 10, allowed_updates: ['message', 'channel_post'] });
    if (!data.ok || !data.result?.length) return;

    for (const update of data.result) {
      offset = update.update_id + 1;
      const msg = update.message || update.channel_post;
      if (!msg?.text) continue;

      const chatId   = msg.chat.id;
      const text     = msg.text.trim();
      const from     = msg.from?.first_name || msg.chat.title || 'User';
      const chatName = msg.chat.title || msg.chat.username || String(chatId);

      console.log(`[MSG] ${from}: ${text.slice(0, 70)}`);

      // Save to Firebase
      await fbSave(`users/${FB_USER}/telegram`, String(update.update_id), {
        chatId, chatName, text, from, date: msg.date, isBot: false,
      });

      // Typing indicator
      await tg('sendChatAction', { chat_id: chatId, action: 'typing' });

      // Handle command
      const cmdReply = await handleCommand(text, chatId, from);

      if (cmdReply !== null && cmdReply !== undefined) {
        if (cmdReply) await tg('sendMessage', { chat_id: chatId, text: cmdReply, parse_mode: 'Markdown' });
      } else if (AI_ENABLED) {
        // Inject context for /quote
        const isQuote = text.toLowerCase().startsWith('/quote ');
        const userMsg = isQuote
          ? `Ek detailed construction quotation banao is project ke liye: ${text.slice(7)}. Include karo: material list, labor cost, timeline, total PKR.`
          : text;

        addHistory(chatId, 'user', userMsg);
        await tg('sendChatAction', { chat_id: chatId, action: 'typing' });

        const result = await ai(chatHistory.get(chatId) || []);
        if (result) {
          await tg('sendMessage', { chat_id: chatId, text: result.text, parse_mode: 'Markdown' });
          addHistory(chatId, 'assistant', result.text);
          console.log(`[AI/${result.by}] → ${from}`);

          await fbSave(`users/${FB_USER}/telegram`, String(Date.now()), {
            chatId, chatName, text: result.text,
            from: `Sultan Agent [${result.by}]`,
            date: Math.floor(Date.now() / 1000), isBot: true,
          });
        }
      }
    }
  } catch (e) { console.error('[Poll]', e.message); }
}

// Main
async function main() {
  if (!BOT_TOKEN) { console.error('TELEGRAM_BOT_TOKEN missing!'); process.exit(1); }
  const me = await tg('getMe');
  if (!me.ok) { console.error('Invalid bot token!'); process.exit(1); }

  console.log(`✅ @${me.result.username} — Sultan Agent v3.0 ONLINE`);
  console.log(`🤖 AI: ${GROQ_KEY ? 'Groq' : GEMINI_KEY ? 'Gemini' : OPENAI_KEY ? 'OpenAI' : 'NONE!'}`);
  console.log(`🔥 Firebase: ${FB_KEY ? 'Connected' : 'Not set'}`);
  console.log(`⏰ Daily report: 9 AM PKT`);

  scheduleDailyReport();

  if (ADMIN_CHAT) {
    await tg('sendMessage', {
      chat_id: ADMIN_CHAT,
      text: `✅ *Sultan Agent v3.0 Online!*\n\n/help bhejo full commands dekhne ke liye 🚀`,
      parse_mode: 'Markdown',
    }).catch(() => {});
  }

  while (true) {
    await poll();
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
