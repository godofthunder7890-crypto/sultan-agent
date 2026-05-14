# Sultan Agent — Complete Agent Guide v5.0

## Naye Agent Ke Liye — Sirf GITHUB_ACCESS_TOKEN Do, Baki Sab Yahan Hai

---

## ACCOUNTS & CREDENTIALS

| Service | Account | Details |
|---------|---------|---------|
| GitHub Repo | godofthunder7890-crypto | sultan-agent repo |
| Expo / EAS | blcobra858 | xhhk891@gmail.com |
| Telegram Bot | @Sultan_Overlord_Bot | Sultan ke liye personal bot |
| Firebase | v11345 | API key: AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s |
| Railway | godofthunder7890@gmail.com | sultan-agent-bot project |

## GITHUB SECRETS (Sab set hain)
- `EXPO_TOKEN` — EAS build token
- `TELEGRAM_BOT_TOKEN` — Bot token
- `TELEGRAM_CHAT_ID` — Sultan ka chat ID
- `RAILWAY_API_KEY` — Railway deploy token

## RAILWAY PROJECT (Already set up)
- Project ID: `1450a2ad-ffe6-478f-97ae-4cabdd0f5dea`
- Service ID: `4e6ab161-cc6c-4945-81f6-b6242b4eb1f0`
- Environment ID: `b591b4fe-3105-4155-aa48-aed73d794e5b`
- Project: sultan-agent-bot
- GitHub: godofthunder7890-crypto/sultan-agent (main branch)
- Start: `cd bot-server && node index.js`
- Firebase: v11345 connected ✅
- Monitor: railway.app

## FIREBASE (Same project for App + Bot)
- Project ID: v11345
- API Key: AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
- Collections: users/sultan/messages, projects, orders, memory, settings, telegram

## EAS BUILD INFO
- Project ID: `72bd2537-674f-4d3b-b6b3-6969b43350f0`
- Owner: blcobra858
- Android Package: com.sultan.agent
- Keystore: Set (GZ6AiSW0sb)
- Dashboard: https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds

---

## GITHUB FILES (Updated v5.0)

```
sultan-agent/
├── AGENT_GUIDE.md              ← Yeh file
├── railway.toml                ← Root Railway config (bot-server deploy)
├── .github/workflows/
│   └── build-apk.yml          ← Auto APK build + Railway bot deploy
├── bot-server/
│   ├── index.js               ← Bot v5.0 (ChatGPT AI + Voice + Firebase)
│   ├── railway.toml           ← Bot-level Railway config
│   └── package.json
├── app/(tabs)/
│   ├── index.tsx              ← Chat screen v5.0 (ChatGPT UI + Quick Actions)
│   ├── settings.tsx           ← Settings (API keys)
│   └── ...
├── context/AppContext.tsx      ← App state + Firebase sync
├── lib/
│   ├── firebase.ts            ← Firebase config (v11345)
│   └── ai.ts                  ← AI caller (Groq/Gemini/OpenAI)
└── google-services.json       ← Firebase Android config
```

---

## WORKFLOW — AUTO DEPLOY

```
GitHub main branch pe koi bhi push
        ↓
GitHub Actions auto-trigger
        ↓
Job 1: Railway bot deploy (env vars set + deploy trigger)
Job 2: EAS APK build start
        ↓
Bot: railway.app pe live 24/7
APK: expo.dev pe ready (~15-20 min)
```

---

## FILE UPDATE KARNE KA TARIKA (IMPORTANT!)

Shell base64 kaam NAHI karta — hamesha Node.js use karo:

```javascript
const https = require('https');
const token = process.env.GITHUB_ACCESS_TOKEN;
// GET sha → PUT with Buffer.from(content).toString('base64')
```

---

## BOT COMMANDS

```
/start  — Main menu (inline buttons)
/status — Bot + Firebase + AI status
/report — Daily report
/clear  — Clear AI chat history
yaad rakh [baat] — Firebase memory mein save
```

## APP API KEYS (Settings Tab mein daalo)
- Groq API Key: groq.com/keys (FREE - required for AI + Voice)
- Gemini API Key: aistudio.google.com (optional)
- OpenAI API Key: platform.openai.com (optional)
- ElevenLabs: elevenlabs.io (JARVIX voice ke liye)
