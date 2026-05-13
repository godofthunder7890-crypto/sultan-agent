// Sultan Agent — PREMIUM Bot v4.0
// Inline buttons, animated menus, full command system

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

// ─── Material prices (INR) ───
const MATERIALS = {
  cement: { price: 380,  unit: 'bag (50kg)', emoji: '🏗️' },
  steel:  { price: 72,   unit: 'kg',         emoji: '⚙️' },
  brick:  { price: 8,    unit: 'piece',      emoji: '🧱' },
  sand:   { price: 1800, unit: 'ton',        emoji: '🪣' },
  gravel: { price: 1600, unit: 'ton',        emoji: '🪨' },
  paint:  { price: 220,  unit: 'litre',      emoji: '🎨' },
  tile:   { price: 55,   unit: 'sqft',       emoji: '🟫' },
  rod:    { price: 72,   unit: 'kg',         emoji: '🔩' },
  wire:   { price: 90,   unit: 'kg',         emoji: '🔌' },
  pipe:   { price: 180,  unit: 'piece',      emoji: '🔧' },
};

// ─── In-memory stores ───
const reminders   = [];
const chatHistory = new Map();
const userState   = new Map(); // for multi-step flows

// ─── Telegram API ───
async function tg(method, body = null) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── Inline keyboards ───
const KEYBOARDS = {
  main: {
    inline_keyboard: [
      [{ text: '🏗️  MA Engineering', callback_data: 'menu_engineering' }, { text: '📊  SMM Panel', callback_data: 'menu_smm' }],
      [{ text: '💸  Finance',         callback_data: 'menu_finance'     }, { text: '🧠  Memory',    callback_data: 'menu_memory'  }],
      [{ text: '🛠️  Tools',            callback_data: 'menu_tools'       }, { text: '🤖  AI Chat',   callback_data: 'menu_ai'      }],
      [{ text: '📅  Daily Report',    callback_data: 'cmd_daily'        }, { text: '📋  Export',    callback_data: 'cmd_export'   }],
      [{ text: '🟢  Status',          callback_data: 'cmd_ping'         }],
    ]
  },
  engineering: {
    inline_keyboard: [
      [{ text: '📁  Projects Dekho',     callback_data: 'cmd_projects'   }],
      [{ text: '➕  Naya Project Add',   callback_data: 'flow_add_project'}],
      [{ text: '🧱  Material Cost',      callback_data: 'menu_materials' }],
      [{ text: '📐  Area Calculate',     callback_data: 'flow_area'      }],
      [{ text: '📝  AI Quotation',       callback_data: 'flow_quote'     }],
      [{ text: '💰  Profit Calculator',  callback_data: 'flow_profit'    }],
      [{ text: '⬅️  Main Menu',          callback_data: 'menu_main'      }],
    ]
  },
  materials: {
    inline_keyboard: [
      [{ text: '🏗️ Cement',  callback_data: 'mat_cement' }, { text: '⚙️ Steel',   callback_data: 'mat_steel'  }],
      [{ text: '🧱 Brick',   callback_data: 'mat_brick'  }, { text: '🪣 Sand',    callback_data: 'mat_sand'   }],
      [{ text: '🪨 Gravel',  callback_data: 'mat_gravel' }, { text: '🎨 Paint',   callback_data: 'mat_paint'  }],
      [{ text: '🟫 Tile',    callback_data: 'mat_tile'   }, { text: '🔩 Rod/Bar', callback_data: 'mat_rod'    }],
      [{ text: '🔌 Wire',    callback_data: 'mat_wire'   }, { text: '🔧 Pipe',    callback_data: 'mat_pipe'   }],
      [{ text: '⬅️ Back',    callback_data: 'menu_engineering' }],
    ]
  },
  smm: {
    inline_keyboard: [
      [{ text: '📊  Dashboard',      callback_data: 'cmd_smm'       }],
      [{ text: '➕  Add Order',      callback_data: 'flow_add_order'}],
      [{ text: '💹  Profit Calc',    callback_data: 'flow_profit'   }],
      [{ text: '⬅️  Main Menu',      callback_data: 'menu_main'     }],
    ]
  },
  finance: {
    inline_keyboard: [
      [{ text: '💸  Log Expense',    callback_data: 'flow_expense'  }],
      [{ text: '📋  Aaj ke Kharche', callback_data: 'cmd_expenses'  }],
      [{ text: '💰  Budget Check',   callback_data: 'flow_budget'   }],
      [{ text: '💱  Live Rates',     callback_data: 'cmd_rate'      }],
      [{ text: '⬅️  Main Menu',      callback_data: 'menu_main'     }],
    ]
  },
  memory: {
    inline_keyboard: [
      [{ text: '🧠  Memories Dekho', callback_data: 'cmd_memory'   }],
      [{ text: '💾  Kuch Save Karo', callback_data: 'flow_save'    }],
      [{ text: '⬅️  Main Menu',      callback_data: 'menu_main'    }],
    ]
  },
  tools: {
    inline_keyboard: [
      [{ text: '🧮  Calculator',    callback_data: 'flow_calc'    }, { text: '🌤️  Weather',    callback_data: 'flow_weather' }],
      [{ text: '⏰  Reminder',      callback_data: 'flow_remind'  }, { text: '💱  Live Rates', callback_data: 'cmd_rate'    }],
      [{ text: '📤  Export Data',   callback_data: 'cmd_export'   }],
      [{ text: '⬅️  Main Menu',     callback_data: 'menu_main'    }],
    ]
  },
  ai: {
    inline_keyboard: [
      [{ text: '💬  Kuch Bhi Poocho', callback_data: 'flow_ai_chat'  }],
      [{ text: '📝  Project Quotation', callback_data: 'flow_quote'  }],
      [{ text: '⬅️  Main Menu',        callback_data: 'menu_main'    }],
    ]
  },
  back_main: {
    inline_keyboard: [[{ text: '⬅️  Main Menu', callback_data: 'menu_main' }]]
  },
  back_engineering: {
    inline_keyboard: [[{ text: '⬅️  Engineering', callback_data: 'menu_engineering' }]]
  },
};

// ─── Menu texts ───
const MENU_TEXTS = {
  main: `🤖 *Sultan Agent v4.0*

_Premium AI Assistant — India Edition_ 🇮🇳

Niche buttons dabao — koi command yaad nahi karna!`,

  engineering: `🏗️ *MA Engineering Panel*

Project management, material costs, quotations — sab kuch yahan hai!`,

  materials: `🧱 *Material Price Calculator*

Koi bhi material select karo — quantity poochunga aur cost calculate karunga!`,

  smm: `📊 *SMM Panel*

Social media orders, revenue tracking — ek jagah sab manage karo!`,

  finance: `💸 *Finance Manager*

Expenses log karo, budget track karo, live rates dekho!`,

  memory: `🧠 *Memory System*

Firebase mein save hota hai — kabhi nahi bhulegaa!`,

  tools: `🛠️ *Tools*

Calculator, Weather, Reminders, Exchange Rates — sab yahan!`,

  ai: `🤖 *AI Chat*

Groq + Gemini + OpenAI — best AI automatically use hoga. Kuch bhi poocho!`,
};

// ─── Firebase helpers ───
async function fbSave(col, id, data) {
  if (!FB_KEY || !FB_PROJECT) return;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string')  fields[k] = { stringValue: v };
      else if (typeof v === 'number') fields[k] = { integerValue: String(Math.floor(v)) };
      else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    }
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) }
    );
  } catch {}
}

async function fbGet(col) {
  if (!FB_KEY || !FB_PROJECT) return [];
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}?key=${FB_KEY}`
    );
    const d = await r.json();
    return (d.documents || []).map(doc => {
      const o = {};
      for (const [k, v] of Object.entries(doc.fields || {}))
        o[k] = v.stringValue || v.integerValue || v.booleanValue || '';
      return o;
    });
  } catch { return []; }
}

// ─── AI ───
const SYSTEM = `You are Sultan Agent — personal AI assistant.
Expertise: Civil/structural engineering, BOQ, quotations, project management, SMM panel, coding, business strategy.
User is from India. Reply in same language (Hindi/English/mix). Be expert, direct, and powerful. Keep responses concise.`;

async function ai(messages) {
  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYSTEM }, ...messages], max_tokens: 900 }),
      });
      const d = await r.json();
      if (d.choices?.[0]?.message?.content) return { text: d.choices[0].message.content, by: 'Groq' };
    } catch {}
  }
  if (GEMINI_KEY) {
    try {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: SYSTEM }] }, generationConfig: { maxOutputTokens: 900 } }) }
      );
      const d = await r.json();
      if (d.candidates?.[0]?.content?.parts?.[0]?.text) return { text: d.candidates[0].content.parts[0].text, by: 'Gemini' };
    } catch {}
  }
  if (OPENAI_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, ...messages], max_tokens: 900 }),
      });
      const d = await r.json();
      if (d.choices?.[0]?.message?.content) return { text: d.choices[0].message.content, by: 'OpenAI' };
    } catch {}
  }
  return null;
}

// ─── Chat history ───
function addHistory(chatId, role, content) {
  if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
  const h = chatHistory.get(chatId);
  h.push({ role, content });
  if (h.length > 12) h.splice(0, h.length - 12);
}

// ─── Send menu ───
async function sendMenu(chatId, menuKey, msgId = null) {
  const text = MENU_TEXTS[menuKey] || MENU_TEXTS.main;
  const keyboard = KEYBOARDS[menuKey] || KEYBOARDS.main;
  if (msgId) {
    return tg('editMessageText', { chat_id: chatId, message_id: msgId, text, parse_mode: 'Markdown', reply_markup: keyboard });
  }
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', reply_markup: keyboard });
}

// ─── Quick reply with back button ───
async function reply(chatId, text, keyboard = null, msgId = null) {
  const kb = keyboard || KEYBOARDS.back_main;
  if (msgId) {
    return tg('editMessageText', { chat_id: chatId, message_id: msgId, text, parse_mode: 'Markdown', reply_markup: kb });
  }
  return tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', reply_markup: kb });
}

// ─── Daily report ───
async function sendDailyReport(chatId) {
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
  const [projects, memories, expenses, orders] = await Promise.all([
    fbGet(`users/${FB_USER}/projects`),
    fbGet(`users/${FB_USER}/memories`),
    fbGet(`users/${FB_USER}/expenses`),
    fbGet(`users/${FB_USER}/smm_orders`),
  ]);
  const todayExp = expenses.filter(e => new Date(parseInt(e.timestamp || 0)).toDateString() === new Date().toDateString());
  const totalExp = todayExp.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalRev = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

  const text = `🌅 *Sultan Agent — Daily Report*
📅 ${date}

🏗️ *Engineering*
Active Projects: ${projects.length}
${projects.slice(0, 3).map(p => `• ${p.name || 'Unnamed'} — ${p.status || 'Active'}`).join('\n') || '• Koi project nahi'}

📊 *SMM Panel*
Orders: ${orders.length} | Revenue: ₹${totalRev.toLocaleString('en-IN')}

💸 *Aaj ke Kharche*
${todayExp.length ? todayExp.slice(0, 3).map(e => `• ${e.desc}: ₹${parseFloat(e.amount || 0).toLocaleString('en-IN')}`).join('\n') : '• Koi expense nahi'}
${todayExp.length ? `Total: ₹${totalExp.toLocaleString('en-IN')}` : ''}

🧠 Memories: ${memories.length} saved
🤖 AI: ${GROQ_KEY ? 'Groq' : GEMINI_KEY ? 'Gemini' : 'OpenAI'} | Bot: Online ✅

_Good morning! Aaj bhi kaam pe focus karo 💪_`;

  await tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', reply_markup: KEYBOARDS.back_main });
}

// ─── Schedule daily 6 AM IST (00:30 UTC) ───
function scheduleDailyReport() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(0, 30, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(async () => {
    if (ADMIN_CHAT) await sendDailyReport(ADMIN_CHAT);
    scheduleDailyReport();
  }, next - now);
}

// ─── Reminder tick ───
setInterval(() => {
  const now = Date.now();
  for (let i = reminders.length - 1; i >= 0; i--) {
    const r = reminders[i];
    if (now >= r.fireAt) {
      tg('sendMessage', { chat_id: r.chatId, text: `⏰ *Reminder!*\n\n${r.text}`, parse_mode: 'Markdown', reply_markup: KEYBOARDS.back_main }).catch(() => {});
      reminders.splice(i, 1);
    }
  }
}, 30000);

// ─── Handle callback queries (button presses) ───
async function handleCallback(query) {
  const chatId  = query.message.chat.id;
  const msgId   = query.message.message_id;
  const data    = query.data;
  const from    = query.from?.first_name || 'User';

  // Dismiss loading spinner
  await tg('answerCallbackQuery', { callback_query_id: query.id });

  // ── Navigation menus ──
  if (data === 'menu_main')        return sendMenu(chatId, 'main', msgId);
  if (data === 'menu_engineering') return sendMenu(chatId, 'engineering', msgId);
  if (data === 'menu_materials')   return sendMenu(chatId, 'materials', msgId);
  if (data === 'menu_smm')         return sendMenu(chatId, 'smm', msgId);
  if (data === 'menu_finance')     return sendMenu(chatId, 'finance', msgId);
  if (data === 'menu_memory')      return sendMenu(chatId, 'memory', msgId);
  if (data === 'menu_tools')       return sendMenu(chatId, 'tools', msgId);
  if (data === 'menu_ai')          return sendMenu(chatId, 'ai', msgId);

  // ── Direct commands ──
  if (data === 'cmd_ping') {
    const up = Math.floor(process.uptime());
    const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = up % 60;
    return reply(chatId,
      `🟢 *Sultan Agent v4.0 — Online!*\n\n⏱️ Uptime: ${h}h ${m}m ${s}s\n🤖 AI: ${GROQ_KEY ? 'Groq ✅' : GEMINI_KEY ? 'Gemini ✅' : OPENAI_KEY ? 'OpenAI ✅' : '❌ No key'}\n🔥 Firebase: ${FB_KEY ? 'Connected ✅' : 'Not set ⚠️'}\n📱 Version: v4.0 Premium`,
      null, msgId);
  }

  if (data === 'cmd_projects') {
    const projects = await fbGet(`users/${FB_USER}/projects`);
    if (!projects.length) {
      return reply(chatId, '🏗️ *Projects*\n\nKoi project nahi hai abhi.\n\nNeeche button se naya add karo!',
        { inline_keyboard: [[{ text: '➕ Project Add Karo', callback_data: 'flow_add_project' }], [{ text: '⬅️ Back', callback_data: 'menu_engineering' }]] }, msgId);
    }
    const list = projects.map((p, i) => `${i + 1}. *${p.name}* — ${p.status || 'Active'}${p.value ? ` | ₹${parseInt(p.value).toLocaleString('en-IN')}` : ''}`).join('\n');
    return reply(chatId, `🏗️ *MA Engineering Projects* (${projects.length})\n\n${list}`,
      { inline_keyboard: [[{ text: '➕ Naya Add', callback_data: 'flow_add_project' }], [{ text: '⬅️ Back', callback_data: 'menu_engineering' }]] }, msgId);
  }

  if (data === 'cmd_smm') {
    const orders = await fbGet(`users/${FB_USER}/smm_orders`);
    const revenue = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    const pending = orders.filter(o => o.status === 'Pending').length;
    const done    = orders.filter(o => o.status === 'Done').length;
    return reply(chatId,
      `📊 *SMM Panel Dashboard*\n\n📦 Total Orders: ${orders.length}\n⏳ Pending: ${pending} | ✅ Done: ${done}\n💰 Total Revenue: ₹${revenue.toLocaleString('en-IN')}\n\n🤖 Bot: Online ✅`,
      { inline_keyboard: [[{ text: '➕ Order Add', callback_data: 'flow_add_order' }], [{ text: '⬅️ Back', callback_data: 'menu_smm' }]] }, msgId);
  }

  if (data === 'cmd_expenses') {
    const all = await fbGet(`users/${FB_USER}/expenses`);
    const today = all.filter(e => new Date(parseInt(e.timestamp || 0)).toDateString() === new Date().toDateString());
    if (!today.length) {
      return reply(chatId, '💸 *Aaj ke Kharche*\n\nAaj koi expense nahi.\nNeeche se add karo!',
        { inline_keyboard: [[{ text: '➕ Expense Add', callback_data: 'flow_expense' }], [{ text: '⬅️ Back', callback_data: 'menu_finance' }]] }, msgId);
    }
    const total = today.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const list  = today.map((e, i) => `${i + 1}. ${e.desc || '?'}: ₹${parseFloat(e.amount || 0).toLocaleString('en-IN')}`).join('\n');
    return reply(chatId, `💸 *Aaj ke Kharche* (${today.length})\n\n${list}\n\n━━━━━━\n💰 *Total: ₹${total.toLocaleString('en-IN')}*`,
      { inline_keyboard: [[{ text: '➕ Aur Add', callback_data: 'flow_expense' }], [{ text: '⬅️ Back', callback_data: 'menu_finance' }]] }, msgId);
  }

  if (data === 'cmd_memory') {
    const mems = await fbGet(`users/${FB_USER}/memories`);
    if (!mems.length) {
      return reply(chatId, '🧠 *Memory*\n\nKuch save nahi hai.\nNeeche se kuch save karo!',
        { inline_keyboard: [[{ text: '💾 Save Karo', callback_data: 'flow_save' }], [{ text: '⬅️ Back', callback_data: 'menu_memory' }]] }, msgId);
    }
    const list = mems.slice(-10).map((m, i) => `${i + 1}. ${m.content || ''}`).join('\n');
    return reply(chatId, `🧠 *Sultan ki Memory* (${mems.length})\n\n${list}`,
      { inline_keyboard: [[{ text: '💾 Aur Save', callback_data: 'flow_save' }], [{ text: '⬅️ Back', callback_data: 'menu_memory' }]] }, msgId);
  }

  if (data === 'cmd_rate') {
    try {
      const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const d = await r.json();
      if (d.rates?.INR) {
        const inr = d.rates.INR;
        return reply(chatId,
          `💱 *Live Exchange Rates*\n\n🇺🇸 1 USD = ₹${inr.toFixed(2)}\n🇦🇪 1 AED = ₹${(inr / d.rates.AED).toFixed(2)}\n🇬🇧 1 GBP = ₹${(inr / d.rates.GBP).toFixed(2)}\n🇸🇦 1 SAR = ₹${(inr / d.rates.SAR).toFixed(2)}\n🇨🇳 1 CNY = ₹${(inr / d.rates.CNY).toFixed(2)}\n\n_Live rates — ExchangeRate API_`,
          null, msgId);
      }
    } catch {}
    return reply(chatId, '💱 Rate service abhi nahi chal rahi. Baad mein try karo.', null, msgId);
  }

  if (data === 'cmd_daily') {
    await tg('answerCallbackQuery', { callback_query_id: query.id, text: 'Report generate ho raha hai...' });
    await sendDailyReport(chatId);
    return;
  }

  if (data === 'cmd_export') {
    const [projects, expenses, orders, mems] = await Promise.all([
      fbGet(`users/${FB_USER}/projects`),
      fbGet(`users/${FB_USER}/expenses`),
      fbGet(`users/${FB_USER}/smm_orders`),
      fbGet(`users/${FB_USER}/memories`),
    ]);
    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const totalRev = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
    return reply(chatId,
      `📋 *Sultan Agent — Full Data*\n📅 ${new Date().toLocaleDateString('en-IN')}\n\n🏗️ Projects: ${projects.length} (Active: ${projects.filter(p => p.status === 'Active').length})\n📊 SMM Orders: ${orders.length} | Revenue: ₹${totalRev.toLocaleString('en-IN')}\n💸 Expenses: ${expenses.length} | Total: ₹${totalExp.toLocaleString('en-IN')}\n🧠 Memories: ${mems.length}\n\n🔥 Sab Firebase mein safe hai ✅`,
      null, msgId);
  }

  // ── Material price callbacks ──
  if (data.startsWith('mat_')) {
    const type = data.replace('mat_', '');
    const mat  = MATERIALS[type];
    if (!mat) return;
    userState.set(chatId, { flow: 'material_qty', type });
    return reply(chatId,
      `${mat.emoji} *${type.charAt(0).toUpperCase() + type.slice(1)}*\nRate: ₹${mat.price.toLocaleString('en-IN')}/${mat.unit}\n\n📝 *Quantity type karo* (sirf number):\nExample: \`100\``,
      { inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_materials' }]] }, msgId);
  }

  // ── Flow starters — ask user for input ──
  const flowPrompts = {
    flow_add_project: { state: 'add_project', text: '🏗️ *Naya Project*\n\n📝 Project ka naam type karo:', back: 'menu_engineering' },
    flow_area:        { state: 'area',         text: '📐 *Area Calculator*\n\n📝 Length aur Width type karo (space se alag):\nExample: `20 15`', back: 'menu_engineering' },
    flow_quote:       { state: 'quote',        text: '📝 *AI Quotation*\n\nProject details type karo:\nExample: `3 bedroom house, 1200 sqft, RCC construction`', back: 'menu_engineering' },
    flow_profit:      { state: 'profit',       text: '💰 *Profit Calculator*\n\nSelling price aur Cost type karo:\nExample: `50000 32000`', back: 'menu_smm' },
    flow_add_order:   { state: 'add_order',    text: '📦 *SMM Order Add*\n\nAmount aur description type karo:\nExample: `2500 Instagram 10k followers`', back: 'menu_smm' },
    flow_expense:     { state: 'expense',      text: '💸 *Expense Log*\n\nAmount aur description type karo:\nExample: `500 Cement 2 bags`', back: 'menu_finance' },
    flow_budget:      { state: 'budget',       text: '💰 *Budget Tracker*\n\nTotal budget aur spent type karo:\nExample: `100000 65000`', back: 'menu_finance' },
    flow_save:        { state: 'save',         text: '🧠 *Memory Save*\n\nKya save karna hai type karo:', back: 'menu_memory' },
    flow_calc:        { state: 'calc',         text: '🧮 *Calculator*\n\nExpression type karo:\nExample: `380 * 100 + 72 * 50`', back: 'menu_tools' },
    flow_weather:     { state: 'weather',      text: '🌤️ *Weather*\n\nCity ka naam type karo:\nExample: `Mumbai`', back: 'menu_tools' },
    flow_remind:      { state: 'remind',       text: '⏰ *Reminder Set*\n\nTime aur message type karo:\nExample: `30m Meeting hai`\nFormat: `[number][m/h/d] [message]`', back: 'menu_tools' },
    flow_ai_chat:     { state: 'ai_chat',      text: '🤖 *AI Chat Mode*\n\nKuch bhi poocho — main jawab dunga!', back: 'menu_ai' },
  };

  if (flowPrompts[data]) {
    const { state, text, back } = flowPrompts[data];
    userState.set(chatId, { flow: state });
    return reply(chatId, text, { inline_keyboard: [[{ text: '❌ Cancel', callback_data: back }]] }, msgId);
  }
}

// ─── Handle text from user (flows + commands) ───
async function handleText(msg) {
  const chatId = msg.chat.id;
  const text   = msg.text?.trim() || '';
  const from   = msg.from?.first_name || 'User';

  // Save to Firebase
  await fbSave(`users/${FB_USER}/telegram`, String(msg.message_id), {
    chatId, text: text.slice(0, 200), from, date: msg.date, isBot: false,
  });

  await tg('sendChatAction', { chat_id: chatId, action: 'typing' });

  // ── /start or /help ──
  if (text === '/start' || text === '/help') {
    return tg('sendMessage', {
      chat_id: chatId,
      text: `🤖 *Sultan Agent v4.0*\n\n_Premium AI Assistant — India Edition_ 🇮🇳\n\nNeeche buttons dabao — sab kuch ho jaayega!\nKoi command yaad karne ki zaroorat nahi! 🎯`,
      parse_mode: 'Markdown',
      reply_markup: KEYBOARDS.main,
    });
  }

  // ── /menu ──
  if (text === '/menu') {
    return tg('sendMessage', { chat_id: chatId, text: MENU_TEXTS.main, parse_mode: 'Markdown', reply_markup: KEYBOARDS.main });
  }

  // ── Check active flow ──
  const state = userState.get(chatId);
  if (state) {
    userState.delete(chatId);
    return handleFlow(chatId, state.flow, text, state);
  }

  // ── AI fallback ──
  if (AI_ENABLED) {
    addHistory(chatId, 'user', text);
    const result = await ai(chatHistory.get(chatId) || []);
    if (result) {
      addHistory(chatId, 'assistant', result.text);
      await tg('sendMessage', {
        chat_id: chatId,
        text: result.text,
        parse_mode: 'Markdown',
        reply_markup: KEYBOARDS.back_main,
      });
      return;
    }
  }

  // No response — show menu
  return tg('sendMessage', { chat_id: chatId, text: '👇 *Yahan se choose karo:*', parse_mode: 'Markdown', reply_markup: KEYBOARDS.main });
}

// ─── Flow handler (processes user input for active flows) ───
async function handleFlow(chatId, flow, input, state = {}) {
  // Helper to send result
  const send = (text, kb = null) => tg('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', reply_markup: kb || KEYBOARDS.back_main });

  if (flow === 'add_project') {
    if (!input) return send('⚠️ Naam empty hai!');
    await fbSave(`users/${FB_USER}/projects`, String(Date.now()), { name: input, status: 'Active', created: Date.now() });
    return send(`✅ *Project Added!*\n\n🏗️ ${input}\nStatus: Active\n🔥 Firebase mein save ✅`,
      { inline_keyboard: [[{ text: '📁 Projects Dekho', callback_data: 'cmd_projects' }], [{ text: '⬅️ Menu', callback_data: 'menu_engineering' }]] });
  }

  if (flow === 'material_qty') {
    const qty = parseFloat(input);
    if (isNaN(qty) || qty <= 0) return send('⚠️ Sirf number type karo.\nExample: `100`');
    const mat   = MATERIALS[state.type];
    const total = qty * mat.price;
    return send(`${mat.emoji} *Material Cost*\n\nType: ${state.type}\nQty: ${qty} ${mat.unit}\nRate: ₹${mat.price.toLocaleString('en-IN')}/${mat.unit}\n━━━━━━\n💰 *Total: ₹${total.toLocaleString('en-IN')}*`,
      KEYBOARDS.back_engineering);
  }

  if (flow === 'area') {
    const parts = input.split(/\s+/).map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return send('⚠️ Format: `length width`\nExample: `20 15`');
    const [l, w] = parts;
    const sqft = l * w;
    const sqm  = (sqft * 0.0929).toFixed(2);
    return send(`📐 *Area Calculator*\n\nLength: ${l} ft | Width: ${w} ft\n━━━━━━\n📏 *${sqft} sq ft*\n📏 *${sqm} sq meter*\n📏 *${(sqft / 9).toFixed(2)} sq yard*`,
      KEYBOARDS.back_engineering);
  }

  if (flow === 'profit') {
    const [price, cost] = input.split(/\s+/).map(Number);
    if (isNaN(price) || isNaN(cost)) return send('⚠️ Format: `selling_price cost`\nExample: `50000 32000`');
    const profit = price - cost;
    const margin = ((profit / price) * 100).toFixed(1);
    const bars   = Math.min(10, Math.floor(parseFloat(margin) / 10));
    const bar    = '▓'.repeat(bars) + '░'.repeat(10 - bars);
    const emoji  = parseFloat(margin) > 30 ? '🟢' : parseFloat(margin) > 15 ? '🟡' : '🔴';
    return send(`📊 *Profit Calculator*\n\nSelling: ₹${price.toLocaleString('en-IN')}\nCost:    ₹${cost.toLocaleString('en-IN')}\nProfit:  ₹${profit.toLocaleString('en-IN')}\n\n[${bar}] ${margin}% ${emoji}`,
      KEYBOARDS.back_main);
  }

  if (flow === 'add_order') {
    const match = input.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!match) return send('⚠️ Format: `amount description`\nExample: `2500 Instagram 10k`');
    const [, amount, desc] = match;
    await fbSave(`users/${FB_USER}/smm_orders`, String(Date.now()), { amount, desc, timestamp: Date.now(), status: 'Pending' });
    return send(`📦 *Order Added!*\n\n💰 ₹${parseFloat(amount).toLocaleString('en-IN')}\n📝 ${desc}\n🔥 Firebase ✅`,
      { inline_keyboard: [[{ text: '📊 Dashboard', callback_data: 'cmd_smm' }], [{ text: '⬅️ Menu', callback_data: 'menu_smm' }]] });
  }

  if (flow === 'expense') {
    const match = input.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!match) return send('⚠️ Format: `amount description`\nExample: `500 Cement bags`');
    const [, amount, desc] = match;
    await fbSave(`users/${FB_USER}/expenses`, String(Date.now()), { amount, desc, timestamp: Date.now() });
    return send(`💸 *Expense Logged!*\n\n₹${parseFloat(amount).toLocaleString('en-IN')} — ${desc}\n🔥 Firebase ✅`,
      { inline_keyboard: [[{ text: '📋 Aaj ka Total', callback_data: 'cmd_expenses' }], [{ text: '⬅️ Menu', callback_data: 'menu_finance' }]] });
  }

  if (flow === 'budget') {
    const [total, spent] = input.split(/\s+/).map(Number);
    if (isNaN(total) || isNaN(spent)) return send('⚠️ Format: `total spent`\nExample: `100000 65000`');
    const remaining = total - spent;
    const pct  = Math.min(100, ((spent / total) * 100)).toFixed(1);
    const bars = Math.floor(parseFloat(pct) / 10);
    const bar  = '▓'.repeat(bars) + '░'.repeat(10 - bars);
    const st   = remaining < 0 ? '❌ Over budget!' : parseFloat(pct) > 85 ? '🔴 Almost khatam!' : parseFloat(pct) > 60 ? '🟡 Theek hai' : '🟢 Safe hai';
    return send(`💰 *Budget Tracker*\n\nTotal:     ₹${total.toLocaleString('en-IN')}\nSpent:     ₹${spent.toLocaleString('en-IN')}\nBacha:     ₹${Math.abs(remaining).toLocaleString('en-IN')}${remaining < 0 ? ' (over!)' : ''}\n\n[${bar}] ${pct}%\n${st}`,
      KEYBOARDS.back_main);
  }

  if (flow === 'save') {
    if (!input) return send('⚠️ Kuch type karo save karne ke liye!');
    await fbSave(`users/${FB_USER}/memories`, String(Date.now()), { content: input, timestamp: Date.now(), source: 'telegram' });
    return send(`🧠 *Yaad kar liya!*\n\n"${input}"\n\n🔥 Firebase ✅`,
      { inline_keyboard: [[{ text: '🧠 Memories Dekho', callback_data: 'cmd_memory' }], [{ text: '⬅️ Menu', callback_data: 'menu_memory' }]] });
  }

  if (flow === 'calc') {
    try {
      const safe = input.replace(/[^0-9+\-*/.() ]/g, '');
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${safe})`)();
      if (typeof result !== 'number' || !isFinite(result)) throw new Error('invalid');
      return send(`🧮 *Calculator*\n\n\`${input}\`\n= *${result.toLocaleString('en-IN')}*`, KEYBOARDS.back_main);
    } catch {
      return send('❌ Invalid expression.\nExample: `380 * 100`');
    }
  }

  if (flow === 'weather') {
    const city = input.trim();
    if (WEATHER_KEY) {
      try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric`);
        const w = await r.json();
        if (w.main) {
          return send(`🌤️ *${city} — Weather*\n\n🌡️ ${Math.round(w.main.temp)}°C (feels ${Math.round(w.main.feels_like)}°C)\n💧 Humidity: ${w.main.humidity}%\n🌬️ Wind: ${Math.round((w.wind?.speed || 0) * 3.6)} km/h\n🌥️ ${w.weather?.[0]?.description || ''}`,
            KEYBOARDS.back_main);
        }
      } catch {}
    }
    return send(`🌤️ *${city} Weather*\n\nWeather API key set nahi hai.\n_(openweathermap.org pe free account banao)_`, KEYBOARDS.back_main);
  }

  if (flow === 'remind') {
    const match = input.match(/^(\d+)(m|h|d)\s+(.+)$/i);
    if (!match) return send('⚠️ Format: `[number][m/h/d] message`\nExample: `30m Meeting hai`');
    const [, num, unit, message] = match;
    const ms = { m: 60000, h: 3600000, d: 86400000 }[unit.toLowerCase()];
    reminders.push({ chatId, text: message, fireAt: Date.now() + parseInt(num) * ms });
    const label = `${num} ${unit === 'm' ? 'minute' : unit === 'h' ? 'ghante' : 'din'}`;
    return send(`⏰ *Reminder Set!*\n\n"${message}"\n${label} mein yaad dilaaunga ✅`, KEYBOARDS.back_main);
  }

  if (flow === 'quote') {
    const prompt = `Ek detailed construction quotation banao is project ke liye: ${input}. Include: material list with quantities, labor cost, timeline, total INR. Be specific and professional.`;
    addHistory(chatId, 'user', prompt);
    const result = await ai(chatHistory.get(chatId) || []);
    if (result) {
      addHistory(chatId, 'assistant', result.text);
      return tg('sendMessage', { chat_id: chatId, text: result.text, parse_mode: 'Markdown', reply_markup: KEYBOARDS.back_engineering });
    }
    return send('❌ AI abhi available nahi. API key check karo.', KEYBOARDS.back_engineering);
  }

  if (flow === 'ai_chat') {
    addHistory(chatId, 'user', input);
    const result = await ai(chatHistory.get(chatId) || []);
    if (result) {
      addHistory(chatId, 'assistant', result.text);
      return tg('sendMessage', {
        chat_id: chatId, text: result.text, parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '💬 Aur Poocho', callback_data: 'flow_ai_chat' }], [{ text: '⬅️ Menu', callback_data: 'menu_main' }]] }
      });
    }
    return send('❌ AI abhi available nahi.', KEYBOARDS.back_main);
  }
}

// ─── Long polling ───
let offset = 0;
async function poll() {
  try {
    const data = await tg('getUpdates', { offset, timeout: 25, limit: 10, allowed_updates: ['message', 'callback_query', 'channel_post'] });
    if (!data.ok || !data.result?.length) return;

    for (const update of data.result) {
      offset = update.update_id + 1;

      // Callback query (button press)
      if (update.callback_query) {
        console.log(`[BTN] ${update.callback_query.from?.first_name}: ${update.callback_query.data}`);
        await handleCallback(update.callback_query).catch(e => console.error('[CB Error]', e.message));
        continue;
      }

      // Text message
      const msg = update.message || update.channel_post;
      if (!msg?.text) continue;
      console.log(`[MSG] ${msg.from?.first_name || 'User'}: ${msg.text.slice(0, 60)}`);
      await handleText(msg).catch(e => console.error('[MSG Error]', e.message));
    }
  } catch (e) { console.error('[Poll]', e.message); }
}

// ─── Main ───
async function main() {
  if (!BOT_TOKEN) { console.error('TELEGRAM_BOT_TOKEN missing!'); process.exit(1); }
  const me = await tg('getMe');
  if (!me.ok) { console.error('Invalid bot token!'); process.exit(1); }

  console.log(`✅ @${me.result.username} — Sultan Agent v4.0 ONLINE`);
  console.log(`🤖 AI: ${GROQ_KEY ? 'Groq' : GEMINI_KEY ? 'Gemini' : OPENAI_KEY ? 'OpenAI' : 'NONE!'}`);
  console.log(`🔥 Firebase: ${FB_KEY ? 'Connected' : 'Not set'}`);
  console.log(`🎛️  Inline Buttons: ENABLED`);

  scheduleDailyReport();

  if (ADMIN_CHAT) {
    await tg('sendMessage', {
      chat_id: ADMIN_CHAT,
      text: `✅ *Sultan Agent v4.0 Online!*\n\n🎛️ Premium inline buttons enabled!\nNeeche menu se sab kuch karo 👇`,
      parse_mode: 'Markdown',
      reply_markup: KEYBOARDS.main,
    }).catch(() => {});
  }

  while (true) {
    await poll();
    await new Promise(r => setTimeout(r, 800));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
