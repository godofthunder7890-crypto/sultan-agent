// Sultan Agent — 24/7 Telegram Bot Server
// Deploy on Railway: railway.app
// Env vars needed: see .env.example

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_KEY     = process.env.GROQ_API_KEY     || '';
const GEMINI_KEY   = process.env.GEMINI_API_KEY   || '';
const OPENAI_KEY   = process.env.OPENAI_API_KEY   || '';
const AI_ENABLED   = process.env.AI_REPLY_ENABLED !== 'false'; // default ON
const FB_API_KEY   = process.env.FIREBASE_API_KEY || '';
const FB_PROJECT   = process.env.FIREBASE_PROJECT_ID || '';
const FB_USER_ID   = process.env.FIREBASE_USER_ID || 'sultan';

const SYSTEM_PROMPT = `You are Sultan Agent — a powerful AI assistant for Sultan, CEO of MA Engineering.
Reply concisely in the same language the user uses (Urdu/English/mix).
Be direct and helpful.`;

// ─── Telegram API ────────────────────────────────────────────────────────────
async function tg(method, body = null) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── AI with Groq → Gemini → OpenAI fallback ────────────────────────────────
async function getAIReply(messages) {
  // 1. Groq (fastest, free)
  if (GROQ_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 600,
        }),
      });
      const d = await res.json();
      if (d.choices?.[0]?.message?.content)
        return { text: d.choices[0].message.content, provider: 'Groq' };
    } catch (e) { console.warn('[Groq] failed:', e.message); }
  }

  // 2. Gemini fallback
  if (GEMINI_KEY) {
    try {
      const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, generationConfig: { maxOutputTokens: 600 } }) }
      );
      const d = await res.json();
      if (d.candidates?.[0]?.content?.parts?.[0]?.text)
        return { text: d.candidates[0].content.parts[0].text, provider: 'Gemini' };
    } catch (e) { console.warn('[Gemini] failed:', e.message); }
  }

  // 3. OpenAI fallback
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 600,
        }),
      });
      const d = await res.json();
      if (d.choices?.[0]?.message?.content)
        return { text: d.choices[0].message.content, provider: 'OpenAI' };
    } catch (e) { console.warn('[OpenAI] failed:', e.message); }
  }

  return null;
}

// ─── Firebase Firestore REST ─────────────────────────────────────────────────
async function saveToFirebase(collection, docId, data) {
  if (!FB_API_KEY || !FB_PROJECT) return;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string')  fields[k] = { stringValue: v };
      else if (typeof v === 'number') fields[k] = { integerValue: String(Math.floor(v)) };
      else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    }
    const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}/${docId}?key=${FB_API_KEY}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (e) { console.warn('[Firebase] save error:', e.message); }
}

// ─── Per-chat message history (last 10 messages) ────────────────────────────
const chatHistory = new Map();
function addToHistory(chatId, role, content) {
  if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
  const hist = chatHistory.get(chatId);
  hist.push({ role, content });
  if (hist.length > 10) hist.splice(0, hist.length - 10);
}

// ─── Long polling loop ───────────────────────────────────────────────────────
let offset = 0;

async function poll() {
  try {
    const data = await tg('getUpdates', { offset, timeout: 25, limit: 10, allowed_updates: ['message', 'channel_post'] });
    if (!data.ok || !data.result?.length) return;

    for (const update of data.result) {
      offset = update.update_id + 1;
      const msg = update.message || update.channel_post;
      if (!msg?.text) continue;

      const chatId  = msg.chat.id;
      const text    = msg.text.trim();
      const from    = msg.from?.first_name || msg.chat.title || 'User';
      const chatName = msg.chat.title || msg.chat.username || String(chatId);

      console.log(`[MSG] ${from} (${chatName}): ${text.slice(0, 80)}`);

      // Save incoming message to Firebase
      await saveToFirebase(
        `users/${FB_USER_ID}/telegram`,
        String(update.update_id),
        { chatId, chatName, text, from, date: msg.date, isBot: false }
      );

      // AI reply
      if (AI_ENABLED && !text.startsWith('/start') && !text.startsWith('/help')) {
        addToHistory(chatId, 'user', text);
        const history = chatHistory.get(chatId) || [];
        const result = await getAIReply(history);
        if (result) {
          await tg('sendMessage', { chat_id: chatId, text: result.text, parse_mode: 'Markdown' });
          addToHistory(chatId, 'assistant', result.text);
          console.log(`[AI/${result.provider}] Replied to ${from}`);

          // Save bot reply to Firebase
          await saveToFirebase(
            `users/${FB_USER_ID}/telegram`,
            String(Date.now()),
            { chatId, chatName, text: result.text, from: `Sultan Agent [${result.provider}]`, date: Math.floor(Date.now() / 1000), isBot: true }
          );
        }
      }

      // /start and /help commands
      if (text.startsWith('/start') || text.startsWith('/help')) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `*Sultan Agent Online* 🤖\n\nMain 24/7 kaam kar raha hoon.\nKuch bhi poocho — code, engineering, business, SMM.`,
          parse_mode: 'Markdown',
        });
      }
    }
  } catch (e) {
    console.error('[Poll error]:', e.message);
  }
}

// ─── Start ───────────────────────────────────────────────────────────────────
async function main() {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN env var missing! Railway mein set karo.');
    process.exit(1);
  }

  const me = await tg('getMe');
  if (!me.ok) { console.error('❌ Invalid bot token!'); process.exit(1); }

  console.log(`✅ Sultan Agent Bot online: @${me.result.username}`);
  console.log(`🤖 AI Reply: ${AI_ENABLED ? 'ON' : 'OFF'} | Groq: ${GROQ_KEY ? '✓' : '✗'} | Gemini: ${GEMINI_KEY ? '✓' : '✗'} | OpenAI: ${OPENAI_KEY ? '✓' : '✗'}`);
  console.log(`🔥 Firebase: ${FB_API_KEY ? 'Connected ✓' : 'Not configured ✗'}`);

  while (true) {
    await poll();
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
