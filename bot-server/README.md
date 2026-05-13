# Sultan Agent — Bot Server

Yeh folder Railway pe deploy hota hai aur Telegram bot ko **24/7 alive** rakhta hai.

---

## Kya karta hai?

- Telegram pe aane wale **har message ka AI se jawab** deta hai
- **Groq → Gemini → OpenAI** fallback chain (jo available ho woh use kare)
- Saare messages **Firebase Firestore** mein save karta hai
- Phone ya app band ho toh bhi **hamesha kaam karta hai**

---

## Railway pe Deploy Kaise Karein

1. [railway.app](https://railway.app) pe login karo (GitHub se)
2. **New Project** → **Deploy from GitHub repo** → `sultan-agent` select karo
3. **Root Directory** mein `bot-server` likhna
4. **Variables** tab mein saari env vars daalo (neeche dekho)
5. Deploy → Done

---

## Environment Variables (Railway mein set karo)

| Variable | Zaroor? | Kahan se milega? |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | REQUIRED | t.me/BotFather |
| `GROQ_API_KEY` | Ek AI key zaroor | groq.com/keys — FREE |
| `GEMINI_API_KEY` | Optional | aistudio.google.com — FREE |
| `OPENAI_API_KEY` | Optional | platform.openai.com — Paid |
| `FIREBASE_API_KEY` | Optional | Firebase Console > Project Settings |
| `FIREBASE_PROJECT_ID` | Optional | Firebase Console > Project Settings |
| `FIREBASE_USER_ID` | Optional | Default: sultan |
| `AI_REPLY_ENABLED` | Optional | true ya false (default: true) |

---

## Bot Mein Kuch Add/Edit Karna Ho?

Sab kuch **index.js** mein hai:

| Cheez | Kahan milegi |
|---|---|
| Bot ka personality / system prompt | SYSTEM_PROMPT variable (top mein) |
| AI model change karna | getAIReply() function mein model name badlo |
| Naya command add karna | /start wale block ke neeche add karo |
| Firebase save structure | saveToFirebase() function |
| Message history length | addToHistory() mein 10 change karo |

### Naya Command Add Karna (Example)

```js
if (text.startsWith('/status')) {
  await tg('sendMessage', { chat_id: chatId, text: 'Sultan Agent chal raha hai!' });
}
```

---

## Logs Kaise Dekhein

Railway dashboard → apna project → Deployments → View Logs

---

## APK aur Bot ka Rishta

```
Tera Phone (APK)  <--->  Firebase Firestore  <--->  Bot Server (Railway)
     UI                    Database                  24/7 Backend
```

APK aur Bot dono Firebase se data share karte hain.
