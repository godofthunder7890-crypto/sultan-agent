# Sultan Agent — AGENT GUIDE v6.0 GOD MODE
# Updated: 2026-05-14
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Yeh file next agent ko do — sab kuch yahan hai
# Actual API keys: Replit Secrets mein saved hain
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══════════════════════════════════════════
  1. ACCOUNTS & LOGINS
═══════════════════════════════════════════

GitHub       : godofthunder7890-crypto
               https://github.com/godofthunder7890-crypto/sultan-agent

Expo / EAS   : haniyashaikh777
               xhhk891@gmail.com
               https://expo.dev/accounts/haniyashaikh777

Telegram Bot : @Sultan_Overlord_Bot
               Token: Replit Secrets → TELEGRAM_BOT_TOKEN

Firebase     : Project ID = v11345
               API Key = AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
               Console: console.firebase.google.com → project v11345

Railway      : godofthunder7890@gmail.com
               Project: sultan-agent-bot
               https://railway.app → Login → sultan-agent-bot


═══════════════════════════════════════════
  2. RAILWAY PROJECT (24/7 Bot Hosting)
═══════════════════════════════════════════

Project ID     : 1450a2ad-ffe6-478f-97ae-4cabdd0f5dea
Service ID     : 4e6ab161-cc6c-4945-81f6-b6242b4eb1f0
Environment ID : b591b4fe-3105-4155-aa48-aed73d794e5b

Root dir       : bot-server
Start command  : node index.js
Auto-deploy    : GitHub main branch push se automatic
Health check   : GET / → JSON (status, uptime, AI, version)

HOW IT WORKS:
  GitHub push → Railway detects change → auto redeploy → bot restart
  Bot khud Telegram se polling karta hai (webhook nahi)


═══════════════════════════════════════════
  3. ALL API KEYS — WHERE TO FIND
═══════════════════════════════════════════

Keys 3 jagah save hain:

┌─────────────────┬─────────────────────────────────────┬────────┐
│ Key             │ Platform                            │ Status │
├─────────────────┼─────────────────────────────────────┼────────┤
│ TELEGRAM_BOT_TOKEN   │ Replit + GitHub Secrets        │  ✅    │
│ TELEGRAM_CHAT_ID     │ Replit + GitHub Secrets        │  ✅    │
│ GROQ_API_KEY         │ Replit + GitHub Secrets        │  ✅    │
│ GEMINI_API_KEY       │ Replit + GitHub Secrets        │  ✅    │
│ OPENAI_API_KEY       │ Replit + GitHub Secrets        │  ✅    │
│ SERPER_API_KEY       │ Replit + GitHub Secrets        │  ✅    │
│ ELEVENLABS_API_KEY   │ Replit + GitHub Secrets        │  ✅    │
│ EXPO_TOKEN           │ Replit + GitHub Secrets        │  ✅    │
│ RAILWAY_API_KEY      │ GitHub Secrets only            │  ✅    │
│ GITHUB_ACCESS_TOKEN  │ Replit Secrets only            │  ✅    │
└─────────────────┴─────────────────────────────────────┴────────┘

RAILWAY DASHBOARD — manually ek baar daalo:
  1. railway.app → Login → sultan-agent-bot → Variables
  2. Add/Update:
       TELEGRAM_BOT_TOKEN   → Replit se copy karo
       ADMIN_CHAT_ID        → Replit TELEGRAM_CHAT_ID se copy karo
       GROQ_API_KEY         → Replit se copy karo
       GEMINI_API_KEY       → Replit se copy karo
       OPENAI_API_KEY       → Replit se copy karo
       SERPER_API_KEY       → Replit se copy karo
       ELEVENLABS_API_KEY   → Replit se copy karo
       FIREBASE_API_KEY     → AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
       FIREBASE_PROJECT_ID  → v11345
       FIREBASE_USER_ID     → sultan
  3. Save → Railway auto-restart → Bot AI se jawab dega!


═══════════════════════════════════════════
  4. GITHUB ACTIONS CI/CD
═══════════════════════════════════════════

Workflow: .github/workflows/build-apk.yml
Trigger : Every push to main branch

JOB 1 — Deploy Bot to Railway:
  - Sab AI keys Railway pe push karta hai
  - Railway redeploy trigger karta hai
  - Telegram pe deploy notification bhejta hai

JOB 2 — Build Android APK:
  - EAS Cloud pe APK build submit karta hai
  - app.json owner auto-set karta hai (haniyashaikh777)
  - Telegram pe build status notification bhejta hai

APK Track karo:
  https://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds
  (10-15 min mein build hota hai)


═══════════════════════════════════════════
  5. EAS BUILD CONFIG
═══════════════════════════════════════════

app.json:
  owner   : haniyashaikh777   (EXPO_TOKEN se match karna chahiye)
  slug    : sultan-agent
  package : com.sultan.agent
  version : 1.1.0

eas.json profiles:
  development → developmentClient APK
  preview     → internal APK
  production  → internal APK  ← yahi use karte hain

Build command: eas build --platform android --profile production --non-interactive --no-wait


═══════════════════════════════════════════
  6. FIREBASE STRUCTURE
═══════════════════════════════════════════

Project ID : v11345
API Key    : AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
Type       : REST API (no SDK, direct HTTP calls)

Firestore Collections:
  users/sultan/projects   → Engineering projects
  users/sultan/orders     → SMM orders
  users/sultan/memory     → Notes / memories
  users/sultan/settings   → App settings
  users/sultan/telegram   → Bot messages log
  users/sultan/messages   → AI chat history

Bot aur App dono same Firebase se sync hote hain (real-time)


═══════════════════════════════════════════
  7. BOT v6.0 — FULL FEATURES
═══════════════════════════════════════════

VERSION: Sultan Agent Bot v6.0 GOD MODE
FILE   : bot-server/index.js

AI CHAIN (auto fallback):
  Groq   → llama-3.3-70b-versatile   (PRIMARY — fastest, free)
  Gemini → gemini-2.0-flash           (BACKUP)
  OpenAI → gpt-4o-mini                (FALLBACK)

COMMANDS:
  /start  /menu     → Main menu (inline buttons)
  /status           → Bot status, AI chain, uptime
  /report           → Daily Firebase data report
  /clear            → Clear AI chat history (30 msgs)
  /clearmem         → Delete all Firebase memories
  yaad rakh [X]     → Firebase memory mein save karo

FEATURES:
  AI Chat      → Multi-AI fallback, 30-msg history per user
  Web Search   → Serper API (real Google results)
  Voice        → Whisper transcription via Groq
  Engineering  → Projects, BOQ, Quotations, Material rates 2025 PKR
  SMM          → Orders, Dashboard, Revenue tracker
  Memory       → Firebase sync (App + Bot dono mein dikhta hai)
  Reminders    → /remind 30m Meeting hai
  Calculator   → Safe eval
  Budget Calc  → Total vs spent
  Profit Calc  → Margin percentage
  Daily Report → 7 AM PKT auto-send

MATERIAL RATES 2025 (PKR):
  Cement → 1350/bag(50kg)
  Steel  → 280/kg
  Brick  → 28/piece
  Sand   → 6000/ton
  Paint  → 750/litre
  Tile   → 200/sqft

AI SYSTEM PROMPT:
  Expert in civil/structural engineering, BOQ, Pakistan construction
  SMM panel (Instagram/YouTube pricing)
  Full-stack coding (React Native, Node.js, Python)
  Business strategy, Firebase/Railway deployment
  Personal assistant + web search


═══════════════════════════════════════════
  8. REACT NATIVE APP — TABS
═══════════════════════════════════════════

Tab 1 — AI Agent (index.tsx)
  Groq/Gemini/OpenAI chat, Firebase sync

Tab 2 — JARVIX (jarvix.tsx)
  ElevenLabs voice AI, mic recording

Tab 3 — Engineering (engineering.tsx)
  Project tracker, add/edit/delete, Firebase

Tab 4 — SMM Panel (smm.tsx)
  Order tracker, revenue, stats

Tab 5 — Telegram (telegram.tsx)
  Bot control, AI toggle, logs

Tab 6 — Settings (settings.tsx)
  API keys config, theme, Firebase


═══════════════════════════════════════════
  9. KEY FILES — REPO MAP
═══════════════════════════════════════════

bot-server/
  index.js              → Telegram bot v6.0 (Railway pe chalta hai)
  .env.example          → Env vars reference (no real keys)
  package.json          → v6.0, start: node index.js

app/(tabs)/
  index.tsx             → AI chat screen
  jarvix.tsx            → Voice AI (ElevenLabs)
  engineering.tsx       → Project tracker
  smm.tsx               → SMM orders
  telegram.tsx          → Bot control panel
  settings.tsx          → API keys + settings

context/
  AppContext.tsx         → Global state + Firebase sync + all types

lib/
  firebase.ts           → Firebase config + REST helpers
  ai.ts                 → AI provider logic (Groq/Gemini/OpenAI)

.github/workflows/
  build-apk.yml         → CI/CD: Railway deploy + EAS APK build

app.json                → Expo config (owner: haniyashaikh777)
eas.json                → EAS build profiles (production = APK)
AGENT_GUIDE.md          → This file


═══════════════════════════════════════════
  10. ARCHITECTURE — HOW IT ALL CONNECTS
═══════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                    Sultan's Phone                    │
  │   React Native App          Telegram Bot             │
  │   (Expo/EAS APK)            (@Sultan_Overlord_Bot)   │
  └────────────┬────────────────────────┬────────────────┘
               │                        │
               ▼                        ▼
  ┌─────────────────┐        ┌─────────────────────┐
  │ Firebase v11345 │        │  Railway 24/7        │
  │ Firestore REST  │◄──────►│  bot-server/index.js │
  │ (projects,      │        │  Groq+Gemini+OpenAI  │
  │  orders,memory) │        │  Serper Web Search   │
  └─────────────────┘        │  Whisper Voice       │
                             └─────────────────────┘
                                        │ auto-deploy
                             ┌─────────────────────┐
                             │ GitHub main branch   │
                             │ godofthunder7890-    │
                             │ crypto/sultan-agent  │
                             └─────────┬───────────┘
                                       │ push triggers
                             ┌─────────────────────┐
                             │ GitHub Actions       │
                             │ Job1: Railway deploy │
                             │ Job2: EAS APK build  │
                             │ + Telegram notify    │
                             └─────────────────────┘


═══════════════════════════════════════════
  11. QUICK START — NEW AGENT
═══════════════════════════════════════════

1. GITHUB_ACCESS_TOKEN Replit mein daalo
2. Baaki sab Replit secrets mein already hain:
   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
   GROQ_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY,
   SERPER_API_KEY, ELEVENLABS_API_KEY, EXPO_TOKEN

3. Railway dashboard pe manually Variables set karo (Section 3 dekho)

4. GitHub push karo → Auto deploy + APK build shuru ho jata hai

5. Bot test karo: @Sultan_Overlord_Bot → /start


═══════════════════════════════════════════
  12. TROUBLESHOOTING
═══════════════════════════════════════════

Bot AI se jawab nahi de raha:
  → Railway Dashboard > Variables mein AI keys check karo
  → GROQ_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY set hain?
  → /status bot pe bhejo — AI chain dekho

APK build fail:
  → expo.dev/accounts/haniyashaikh777/builds mein log dekho
  → EXPO_TOKEN sahi account ka hai? (haniyashaikh777)
  → app.json owner = haniyashaikh777 hona chahiye

Railway deploy fail:
  → GitHub Actions logs dekho
  → RAILWAY_API_KEY GitHub secrets mein set hai?

Firebase sync nahi:
  → Firebase API key: AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
  → Project ID: v11345
  → console.firebase.google.com pe Firestore rules check karo

Bot respond nahi kar raha:
  → railway.app pe service running hai?
  → Health check: GET https://[railway-url]/ → status: online?
