# Sultan Agent Bot Server v5.0

ChatGPT/Gemini jaisi AI + Voice Messages + Firebase Sync — 24/7 Railway pe

## Railway Mein Ye Environment Variables Set Karo

| Variable | Value | Status |
|----------|-------|--------|
| `TELEGRAM_BOT_TOKEN` | BotFather se milta hai | Required |
| `GROQ_API_KEY` | groq.com/keys (FREE) | Recommended |
| `GEMINI_API_KEY` | aistudio.google.com | Optional fallback |
| `OPENAI_API_KEY` | platform.openai.com | Optional fallback |
| `ADMIN_CHAT_ID` | Apna Telegram chat ID | Recommended |
| `FIREBASE_API_KEY` | AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s | Auto (already set) |
| `FIREBASE_PROJECT_ID` | v11345 | Auto (already set) |
| `PORT` | Railway khud set karta hai | Auto |

## Features v5.0
- Full AI Chat — ChatGPT/Gemini/Replit Agent jaisi conversation
- Voice Messages — Whisper transcription (Groq key se)
- Firebase Sync — App + Bot dono connected (v11345 project)
- App Sync — Jo app mein add ho woh bot mein dike, jo bot mein woh app mein
- Inline Menus — Engineering, SMM, Finance, Memory, Tools
- Daily Report — Roz 7 AM PKT auto-report
- Reminders, Calculator, Weather
- 24/7 Online — Railway health check server included

## Commands
/start  — Main menu
/menu   — Main menu  
/status — Bot status
/report — Daily report
/clear  — Clear AI chat history

## Railway Deploy Steps
1. Railway mein GitHub connect karo: godofthunder7890-crypto/sultan-agent
2. Root directory: bot-server
3. Environment variables set karo (table upar)
4. Deploy — Railway auto-build karega
5. ADMIN_CHAT_ID pe startup message aayega
