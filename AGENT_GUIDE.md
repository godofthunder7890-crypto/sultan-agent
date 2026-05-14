# Sultan Agent — Complete Agent Guide v6.0 — God Mode

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

## GITHUB SECRETS (Sab set hain ✅)
- `EXPO_TOKEN` — EAS build token ✅
- `TELEGRAM_BOT_TOKEN` — Bot token ✅
- `TELEGRAM_CHAT_ID` — Sultan ka chat ID ✅
- `RAILWAY_API_KEY` — Railway deploy token ✅
- `GROQ_API_KEY` — Groq AI key ✅ (v6.0 mein add hua)
- `GEMINI_API_KEY` — Google Gemini key ✅ (v6.0 mein add hua)
- `OPENAI_API_KEY` — OpenAI key ✅ (v6.0 mein add hua)
- `ELEVENLABS_API_KEY` — ElevenLabs voice key ✅ (v6.0 mein add hua)
- `SERPER_API_KEY` — Web search key ✅ (v6.0 mein add hua)

## RAILWAY PROJECT (Already set up)
- Project ID: `1450a2ad-ffe6-478f-97ae-4cabdd0f5dea`
- Service ID: `4e6ab161-cc6c-4945-81f6-b6242b4eb1f0`
- Environment ID: `b591b4fe-3105-4155-aa48-aed73d794e5b`
- Project: sultan-agent-bot
- GitHub: godofthunder7890-crypto/sultan-agent (main branch)
- Root dir: bot-server
- Start: `cd bot-server && node index.js`
- Firebase: v11345 connected ✅
- Monitor: railway.app
- Health check path: /

## FIREBASE (Same project for App + Bot)
- Project ID: v11345
- API Key: AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
- Collections: users/sultan/messages, projects, orders, memory, settings, telegram

## EAS BUILD INFO
- Project ID: `72bd2537-674f-4d3b-b6b3-6969b43350f0`
- Owner: blcobra858
- Android Package: com.sultan.agent
- Build profile: production (APK)
- Track builds: https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds

## BOT v6.0 — GOD MODE FEATURES
- Multi-AI fallback: Groq ⚡ → Gemini 🔮 → OpenAI 🧠 (auto)
- Web Search: Serper API (/search query)
- Voice: Whisper transcription (Groq)
- Firebase sync: real-time App + Bot
- Memory: yaad rakh [baat] — Firebase mein save
- Engineering: Projects, BOQ, Quotations, Material rates (2025 PKR)
- SMM: Orders, Dashboard, Revenue
- Tools: Calculator, Reminders, Budget, Weather
- Daily report: 7 AM PKT auto

## BOT COMMANDS
/start — Main menu
/menu — Main menu
/status — Bot status + AI chain
/report — Daily report
/clear — Clear AI chat history
/clearmem — Clear all memories
/search [query] — Web search
/yaad [baat] — Save to memory

## APP TABS (Expo React Native)
1. AI Chat — Groq/Gemini/OpenAI
2. JARVIX — Voice AI (ElevenLabs)
3. MA Engineering — Project tracker
4. SMM Dashboard — Order tracking
5. Telegram — Bot control + AI auto-reply
6. Settings — All API keys

## KEY FILES
- `bot-server/index.js` — Telegram bot (Railway)
- `app/(tabs)/index.tsx` — AI chat screen
- `context/AppContext.tsx` — Global state + Firebase
- `lib/firebase.ts` — Firebase config
- `lib/ai.ts` — AI provider logic
- `.github/workflows/build-apk.yml` — Auto build + deploy
