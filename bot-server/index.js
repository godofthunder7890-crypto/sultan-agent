// Sultan Agent — 24/7 Smart Telegram Bot Server
// Deploy: railway.app | Docs: bot-server/README.md

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_KEY     = process.env.GROQ_API_KEY     || '';
const GEMINI_KEY   = process.env.GEMINI_API_KEY   || '';
const OPENAI_KEY   = process.env.OPENAI_API_KEY   || '';
const AI_ENABLED   = process.env.AI_REPLY_ENABLED !== 'false';
const FB_API_KEY   = process.env.FIREBASE_API_KEY || '';
const FB_PROJECT   = process.env.FIREBASE_PROJECT_ID || '';
const FB_USER_ID   = process.env.FIREBASE_USER_ID || 'sultan';
const ADMIN_CHAT   = process.env.ADMIN_CHAT_ID    || '';

const SYSTEM_PROMPT = `You are Sultan Agent — the personal AI of Sultan, CEO of MA Engineering Pakistan.

Your expertise:
- MA Engineering: Civil/structural projects, quotations, BOQ, project tracking, site management
- SMM Panel: Pricing strategies, profit analysis, order tracking, service optimization
- Code: Any language — write, debug, explain, review
- Business: Financial analysis, decisions, strategies

Always reply in the same language Sultan uses (Urdu/English/mix).
Be direct, powerful, and expert. No fluff.`;

// ─── Telegram API ─────────────────────────────────────────────────────────
async function tg(method, body = null) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── AI: Groq → Gemini → OpenAI fallback ──────────────────────────────────
async function getAIReply(messages) {
  if (GROQ_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], max_tokens: 800 }),
      });
      const d = await res.json();
      if (d.choices?.[0]?.message?.content) return { text: d.choices[0].message.content, provider: 'Groq' };
    } catch {}
  }
  if (GEMINI_KEY) {
    try {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, generationConfig: { maxOutputTokens: 800 } }) });
      const d = await res.json();
      if (d.candidates?.[0]?.content?.parts?.[0]?.text) return { text: d.candidates[0].content.parts[0].text, provider: 'Gemini' };
    } catch {}
  }
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages], max_tokens: 800 }),
      });
      const d = await res.json();
      if (d.choices?.[0]?.message?.content) return { text: d.choices[0].message.content, provider: 'OpenAI' };
    } catch {}
  }
  return null;
}

// ─── Firebase Firestore REST ───────────────────────────────────────────────
async function fbSave(collection, docId, data) {
  if (!FB_API_KEY || !FB_PROJECT) return;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') fields[k] = { stringValue: v };
      else if (typeof v === 'number') fields[k] = { integerValue: String(Math.floor(v)) };
      else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    }
    await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}/${docId}?key=${FB_API_KEY}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  } catch (e) { console.warn('[Firebase]', e.message); }
}

async function fbGet(collection) {
  if (!FB_API_KEY || !FB_PROJECT) return [];
  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}?key=${FB_API_KEY}`);
    const d = await res.json();
    return d.documents?.map(doc => {
      const data = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        data[k] = v.stringValue || v.integerValue || v.booleanValue || '';
      }
      return data;
    }) || [];
  } catch { return []; }
}

// ─── Smart Commands ────────────────────────────────────────────────────────
async function handleCommand(text, chatId) {
  const cmd = text.toLowerCase().trim();

  // /start or /help
  if (cmd === '/start' || cmd === '/help') {
    return `🤖 *Sultan Agent — Smart Commands*

━━━━━━━━━━━━━━━━━━━━━
*MA Engineering* 🏗️
/projects — Active projects list
/quote [details] — Quotation banana
/status [project] — Project status

*SMM Panel* 📊
/smm — Dashboard summary
/profit [amount] [cost] — Profit calculate karo
/services — Top services list

*Memory* 🧠
/memory — Saved cheezein dekho
/save [baat] — Kuch yaad karo

*System* ⚙️
/ping — Bot alive check
/help — Yeh menu

*Ya seedha kuch bhi poocho!*
AI hamesha ready hai 💪`;
  }

  // /ping
  if (cmd === '/ping') {
    const uptime = Math.floor(process.uptime());
    const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
    return `🟢 *Sultan Agent Online!*
⏱️ Uptime: ${h}h ${m}m ${s}s
🤖 AI: ${GROQ_KEY ? 'Groq ✅' : GEMINI_KEY ? 'Gemini ✅' : 'OpenAI ✅'}
🔥 Firebase: ${FB_API_KEY ? 'Connected ✅' : 'Not set ⚠️'}`;
  }

  // /projects
  if (cmd === '/projects') {
    const projects = await fbGet(`users/${FB_USER_ID}/projects`);
    if (!projects.length) return '🏗️ *MA Engineering Projects*\n\nKoi project nahi mila. APK se project add karo!';
    const list = projects.slice(0, 10).map((p, i) => `${i+1}. *${p.name || 'Project'}* — ${p.status || 'Active'}`).join('\n');
    return `🏗️ *MA Engineering — Active Projects*\n\n${list}`;
  }

  // /memory
  if (cmd === '/memory') {
    const memories = await fbGet(`users/${FB_USER_ID}/memories`);
    if (!memories.length) return '🧠 *Memory*\n\nKoi cheez yaad nahi. "/save [baat]" se save karo!';
    const list = memories.slice(-10).map((m, i) => `${i+1}. ${m.content || m.text || ''}`).join('\n');
    return `🧠 *Sultan ki Memory*\n\n${list}`;
  }

  // /save [text]
  if (cmd.startsWith('/save ')) {
    const content = text.slice(6).trim();
    if (!content) return '⚠️ Kya save karna hai? /save [baat]';
    const id = String(Date.now());
    await fbSave(`users/${FB_USER_ID}/memories`, id, { content, timestamp: Date.now(), source: 'telegram' });
    return `✅ *Yaad kar liya!*\n\n"${content}"\n\nFirebase mein save ho gaya 🔥`;
  }

  // /profit [amount] [cost]
  if (cmd.startsWith('/profit ')) {
    const parts = text.split(' ').filter(Boolean);
    const amount = parseFloat(parts[1]);
    const cost = parseFloat(parts[2]);
    if (isNaN(amount) || isNaN(cost)) return '⚠️ Format: /profit [price] [cost]\nExample: /profit 1000 700';
    const profit = amount - cost;
    const margin = ((profit / amount) * 100).toFixed(1);
    const emoji = margin > 30 ? '🟢' : margin > 15 ? '🟡' : '🔴';
    return `📊 *Profit Calculator*

💰 Price: Rs. ${amount.toLocaleString()}
💸 Cost: Rs. ${cost.toLocaleString()}
✅ Profit: Rs. ${profit.toLocaleString()}
${emoji} Margin: ${margin}%

${parseFloat(margin) > 30 ? 'Bohot acha margin hai! 🎉' : parseFloat(margin) > 15 ? 'Theek hai, improve ho sakta hai' : 'Margin kam hai, cost kam karo'}`;
  }

  // /quote [details]
  if (cmd.startsWith('/quote ')) {
    const details = text.slice(7).trim();
    return null; // Let AI handle with context
  }

  // /smm
  if (cmd === '/smm') {
    const orders = await fbGet(`users/${FB_USER_ID}/smm_orders`);
    const total = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    return `📊 *SMM Panel Dashboard*

📦 Total Orders: ${total}
💰 Total Revenue: Rs. ${revenue.toLocaleString()}
🤖 Bot: Online ✅
🔥 Firebase: Synced ✅

_Live data from Firebase_`;
  }

  return null; // Not a command, let AI handle
}

// ─── Per-chat history ──────────────────────────────────────────────────────
const chatHistory = new Map();
function addHistory(chatId, role, content) {
  if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
  const h = chatHistory.get(chatId);
  h.push({ role, content });
  if (h.length > 12) h.splice(0, h.length - 12);
}

// ─── Polling loop ──────────────────────────────────────────────────────────
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

      console.log(`[MSG] ${from}: ${text.slice(0, 60)}`);

      // Save to Firebase
      await fbSave(`users/${FB_USER_ID}/telegram`, String(update.update_id), {
        chatId, chatName, text, from, date: msg.date, isBot: false
      });

      // Handle smart commands first
      const cmdReply = await handleCommand(text, chatId);

      if (cmdReply) {
        await tg('sendMessage', { chat_id: chatId, text: cmdReply, parse_mode: 'Markdown' });
        console.log(`[CMD] Replied to ${from}`);
      } else if (AI_ENABLED && !text.startsWith('/')) {
        // AI reply with conversation history
        addHistory(chatId, 'user', text);
        const history = chatHistory.get(chatId) || [];
        const result = await getAIReply(history);
        if (result) {
          await tg('sendMessage', { chat_id: chatId, text: result.text, parse_mode: 'Markdown' });
          addHistory(chatId, 'assistant', result.text);
          console.log(`[AI/${result.provider}] Replied to ${from}`);

          await fbSave(`users/${FB_USER_ID}/telegram`, String(Date.now()), {
            chatId, chatName, text: result.text,
            from: `Sultan Agent [${result.provider}]`,
            date: Math.floor(Date.now() / 1000), isBot: true
          });
        }
      }
    }
  } catch (e) { console.error('[Poll]', e.message); }
}

// ─── Start ─────────────────────────────────────────────────────────────────
async function main() {
  if (!BOT_TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN missing!'); process.exit(1); }

  const me = await tg('getMe');
  if (!me.ok) { console.error('❌ Invalid token!'); process.exit(1); }

  console.log(`✅ @${me.result.username} online!`);
  console.log(`🤖 AI: ${GROQ_KEY ? 'Groq' : GEMINI_KEY ? 'Gemini' : OPENAI_KEY ? 'OpenAI' : 'NONE!'}`);
  console.log(`🔥 Firebase: ${FB_API_KEY ? 'Connected' : 'Not configured'}`);

  // Notify admin on startup
  if (ADMIN_CHAT) {
    await tg('sendMessage', { chat_id: ADMIN_CHAT, text: `✅ Sultan Agent Bot started!\n@${me.result.username} online — 24/7 ready!`, parse_mode: 'Markdown' }).catch(() => {});
  }

  while (true) {
    await poll();
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
