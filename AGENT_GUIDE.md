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

## GITHUB SECRETS — Sab Set Hain ✅ (v6.0 update)

| Secret | Status | Use |
|--------|--------|-----|
| EXPO_TOKEN | ✅ | EAS APK build |
| TELEGRAM_BOT_TOKEN | ✅ | Bot token |
| TELEGRAM_CHAT_ID | ✅ | Sultan chat ID |
| RAILWAY_API_KEY | ✅ | Railway deploy |
| GROQ_API_KEY | ✅ NEW | Main AI — Llama 3.3 70B |
| GEMINI_API_KEY | ✅ NEW | Backup AI — Gemini 2.0 Flash |
| OPENAI_API_KEY | ✅ NEW | Fallback — GPT-4o Mini |
| ELEVENLABS_API_KEY | ✅ NEW | JARVIX voice |
| SERPER_API_KEY | ✅ NEW | Web search |

## RAILWAY PROJECT

- Project ID: `1450a2ad-ffe6-478f-97ae-4cabdd0f5dea`
- Service ID: `4e6ab161-cc6c-4945-81f6-b6242b4eb1f0`
- Environment ID: `b591b4fe-3105-4155-aa48-aed73d794e5b`
- Root dir: bot-server
- Start: `node index.js`
- Health: GET / → JSON status

## FIREBASE

- Project ID: v11345
- API Key: AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
- Collections: users/sultan/projects, orders, memory, telegram, settings, messages

## EAS BUILD

- Project ID: `72bd2537-674f-4d3b-b6b3-6969b43350f0`
- Owner: blcobra858
- Package: com.sultan.agent
- Profile: production
- Track: https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds

## BOT v6.0 — GOD MODE

### AI Chain (auto fallback)
Groq ⚡ (llama-3.3-70b) → Gemini 🔮 (gemini-2.0-flash) → OpenAI 🧠 (gpt-4o-mini)

### Features
- Web search (Serper API)
- Voice transcription (Whisper via Groq)
- Firebase real-time sync (App + Bot)
- 30-message chat history per user
- Daily report 7 AM PKT
- In-memory reminders
- Material rates 2025 (PKR)

### Commands
```
/start /menu  — Main menu
/status       — Bot + AI status
/report       — Daily report
/clear        — Clear AI history
/clearmem     — Clear Firebase memories
/search q     — Web search
/yaad baat    — Save memory
```

## KEY FILES

| File | Purpose |
|------|---------|
| bot-server/index.js | Telegram bot (Railway deploy) |
| .github/workflows/build-apk.yml | CI/CD — deploy bot + build APK |
| app/(tabs)/index.tsx | AI chat screen |
| context/AppContext.tsx | Global state + Firebase sync |
| lib/firebase.ts | Firebase config |
| lib/ai.ts | AI provider logic |
| AGENT_GUIDE.md | This file — complete reference |
