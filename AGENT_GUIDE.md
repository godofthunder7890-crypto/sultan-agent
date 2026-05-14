# Sultan Agent — Complete Agent Guide v6.0 GOD MODE
Last updated: 2026-05-14

Naye agent ke liye: Sirf GITHUB_ACCESS_TOKEN do, baaki sab yahan hai.
ACTUAL API KEYS: Replit Secrets mein saved hain.

---

## ACCOUNTS

| Service        | Account                    | Notes                      |
|----------------|----------------------------|----------------------------|
| GitHub         | godofthunder7890-crypto    | Sultan ka GitHub           |
| Expo / EAS     | haniyashaikh777            | EXPO_TOKEN se linked       |
| Telegram Bot   | @Sultan_Overlord_Bot       | Sultan ka personal bot     |
| Firebase       | v11345                     | Firestore REST API         |
| Railway        | godofthunder7890@gmail.com | sultan-agent-bot project   |

---

## KEYS KAHAN HAIN

| Platform | Location                            | Status      |
|----------|-------------------------------------|-------------|
| Replit   | Secrets tab (9 keys saved)          | Done        |
| GitHub   | Settings > Secrets > Actions        | 9 secrets   |
| Railway  | Dashboard > Variables (manual step) | See below   |

### Railway Variables — Ek Baar Manually Daalo

railway.app login karo → sultan-agent-bot → Variables section:

  TELEGRAM_BOT_TOKEN      (Replit secrets se copy karo)
  ADMIN_CHAT_ID           (Replit secrets se copy karo)
  GROQ_API_KEY            (Replit secrets se copy karo)
  GEMINI_API_KEY          (Replit secrets se copy karo)
  OPENAI_API_KEY          (Replit secrets se copy karo)
  SERPER_API_KEY          (Replit secrets se copy karo)
  ELEVENLABS_API_KEY      (Replit secrets se copy karo)
  FIREBASE_API_KEY        AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
  FIREBASE_PROJECT_ID     v11345
  FIREBASE_USER_ID        sultan

---

## RAILWAY PROJECT IDs

  Project ID     1450a2ad-ffe6-478f-97ae-4cabdd0f5dea
  Service ID     4e6ab161-cc6c-4945-81f6-b6242b4eb1f0
  Environment ID b591b4fe-3105-4155-aa48-aed73d794e5b
  Root dir       bot-server
  Start command  node index.js
  Auto-deploy    GitHub main push se automatic

---

## GITHUB SECRETS — 9 Set Hain

  EXPO_TOKEN            EAS APK build
  TELEGRAM_BOT_TOKEN    Bot token
  TELEGRAM_CHAT_ID      Sultan chat ID
  RAILWAY_API_KEY       Railway deploy hook
  GROQ_API_KEY          Main AI (Llama 3.3 70B)
  GEMINI_API_KEY        Backup AI (Gemini 2.0 Flash)
  OPENAI_API_KEY        Fallback (GPT-4o Mini)
  ELEVENLABS_API_KEY    JARVIX voice
  SERPER_API_KEY        Web search

---

## EAS BUILD INFO

  Owner      haniyashaikh777
  Slug       sultan-agent
  Package    com.sultan.agent
  Profile    production (APK internal)
  Track:     https://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds

---

## BOT v6.0 — COMMANDS

  /start /menu     Main menu with inline buttons
  /status          Bot + AI chain status + uptime
  /report          Daily Firebase data report
  /clear           Clear AI chat history
  /clearmem        Delete all Firebase memories
  yaad rakh [X]    Save note to Firebase memory

## BOT v6.0 — AI CHAIN

  Groq  (llama-3.3-70b-versatile)   PRIMARY
  Gemini (gemini-2.0-flash)          BACKUP
  OpenAI (gpt-4o-mini)               FALLBACK

## BOT v6.0 — FEATURES

  Web search (Serper API — real Google results)
  Voice transcription (Whisper via Groq)
  Firebase real-time sync — App + Bot dono
  30-message chat history per user
  Daily report 7 AM PKT (auto)
  In-memory reminders
  Material rates 2025 PKR (cement, steel, brick, sand, paint, tile)
  Engineering: Projects, Quotations, Profit calculator
  SMM: Orders, Dashboard, Revenue
  Telegram notification on every deploy + APK build

---

## KEY FILES

  bot-server/index.js              Telegram bot v6.0 (Railway)
  bot-server/.env.example          Env vars reference (no real keys)
  .github/workflows/build-apk.yml  CI/CD — deploy + APK
  app.json                         Expo config (owner: haniyashaikh777)
  eas.json                         EAS build profiles
  context/AppContext.tsx            Global state + Firebase sync
  lib/firebase.ts                  Firebase config
  AGENT_GUIDE.md                   This file

---

## CI/CD WORKFLOW

  GitHub push (main)
    Deploy job: Railway env vars update + redeploy (auto)
    APK job:    EAS Cloud APK build submit (auto)
    Telegram:   Bot pe notification (auto)

  Bot + App sync via Firebase Firestore project v11345
