# AGENT_GUIDE.md — Sultan Agent Complete Handoff
> Last Updated: 2026-05-15 | **READ THIS FIRST BEFORE ANYTHING!**

---

## ✅ CURRENT STATUS — ALL GREEN

```
Bot v7.0 God Mode ALL AI   ✅ DEPLOYED (791 lines)
All AI APIs                ✅ Groq + Gemini + OpenAI + Claude
APK Auto-Download          ✅ IMPLEMENTED (EAS polling + sendDocument)
GitHub Actions Workflow    ✅ BOTH JOBS PASSING
Railway Env Vars           ✅ SET (deployed 2026-05-15)
ANTHROPIC_API_KEY          ⚠️  Add to GitHub Secrets if Claude key hai
```

---

## 1. PROJECT OVERVIEW

Sultan (CEO, MA Engineering Pakistan) ka personal AI agent ecosystem.

- **GitHub:** https://github.com/godofthunder7890-crypto/sultan-agent
- **Bot:** @sultan_agent_bot (sirf Sultan ke liye)
- **APK:** Expo EAS Cloud (Android, haniyashaikh777 account)

---

## 2. ALL ACCOUNTS & SECRETS

### Railway — Bot Hosting
- **Account:** godofthunder7890@gmail.com
- **Token:** `RAILWAY_TOKEN` (GitHub secrets ✅)
- **Project IDs:**
  ```
  PROJECT_ID = 1450a2ad-ffe6-478f-97ae-4cabdd0f5dea
  SERVICE_ID = 4e6ab161-cc6c-4945-81f6-b6242b4eb1f0
  ENV_ID     = b591b4fe-3105-4155-aa48-aed73d794e5b
  ```

### Expo / EAS
- **Account:** haniyashaikh777
- **Token:** `EXPO_TOKEN` (GitHub secrets ✅)

### Firebase
- **Project ID:** v11345
- **API Key:** AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s

### All Secrets (GitHub Actions)
```
TELEGRAM_BOT_TOKEN   ✅
TELEGRAM_CHAT_ID     ✅
GROQ_API_KEY         ✅
GEMINI_API_KEY       ✅
OPENAI_API_KEY       ✅
SERPER_API_KEY       ✅
ELEVENLABS_API_KEY   ✅
EXPO_TOKEN           ✅
RAILWAY_TOKEN        ✅
ANTHROPIC_API_KEY    ⚠️  Add karo Claude ke liye
GITHUB_ACCESS_TOKEN  ✅
```

---

## 3. COMPLETED WORK ✅

### Bot v7.0 God Mode ALL AI (`bot-server/index.js`, 791 lines)
- **ALL 4 AI Engines:** Groq Llama3-70B ⚡ → Gemini 1.5 Flash 🔮 → GPT-4o Mini 🧠 → Claude Haiku 🎭
- **Auto fallback chain:** Groq → Gemini → OpenAI → Claude
- **Per-user model selection:** /model command se koi bhi AI choose karo
- Web Search (Serper), Voice (Whisper), Firebase sync
- Engineering: quotation, profit calc, material rates 2025
- SMM: orders, revenue dashboard
- Daily report 7 AM PKT, reminders, calculator, weather
- `/apk` + APK Auto-Download (EAS polling → sendDocument)
- **New commands v7.0:**
  - `/model` — AI engine choose karo (Groq/Gemini/OpenAI/Claude/Auto)
  - `/github` — Latest 5 commits dekho
  - `/stats` — Bot usage stats (messages, AI calls, uptime)
  - `/roadmap` — Feature roadmap

### Workflow (`.github/workflows/build-apk.yml`)
- Job 1: Railway deploy (sab env vars including ANTHROPIC_API_KEY)
- Job 2: EAS APK build
- **Last run: ✅ BOTH JOBS SUCCESS (2026-05-15)**

---

## 4. BOT COMMANDS

| Command | Description |
|---------|-------------|
| /start, /menu | Main menu |
| /status | Bot + AI status |
| /model | AI engine switch karo |
| /github | Latest commits |
| /stats | Usage stats |
| /roadmap | Feature roadmap |
| /report | Daily report |
| /apk | Build + get APK |
| /search [query] | Web search |
| yaad rakh [text] | Firebase memory save |
| /clear | Chat history clear |
| /clearmem | Firebase memories clear |

---

## 5. PENDING / NEXT TASKS ⏳

### TASK 1 — Add ANTHROPIC_API_KEY (Claude)
```
GitHub repo → Settings → Secrets → New secret
Name: ANTHROPIC_API_KEY
Value: sk-ant-... (console.anthropic.com se)
```
Phir workflow manually trigger karo — Railway pe Claude key set ho jayegi.

### TASK 2 — Test All 4 AI Models
Telegram pe:
1. `/model` → Groq select → "Hello test" bhejo
2. `/model` → Gemini select → "Hello test"
3. `/model` → OpenAI select → "Hello test"
4. `/model` → Claude select → "Hello test" (ANTHROPIC_API_KEY ke baad)

### TASK 3 — APK v7.0 Build
```
/apk command Telegram pe
```
10-15 min mein file aayegi.

---

## 6. HOW TO REDEPLOY

```bash
# Trigger Railway redeploy + APK build
curl -s -X POST -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/actions/workflows/build-apk.yml/dispatches" \
  -d '{"ref":"main"}'
```

---

## 7. HOW TO PUSH CODE

```bash
SHA=$(curl -s -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/contents/bot-server/index.js" | \
  node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).sha)")

CONTENT=$(base64 -w 0 /tmp/myfile.js)
curl -s -X PUT \
  -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/contents/bot-server/index.js" \
  -d "{\"message\":\"your msg\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\"}"
```

---

## 8. FILE STRUCTURE

```
sultan-agent/
├── bot-server/
│   ├── index.js          ← v7.0 God Mode ALL AI (791 lines)
│   ├── package.json
│   └── .env.example
├── .github/
│   └── workflows/
│       └── build-apk.yml ← CI/CD with ANTHROPIC_API_KEY support
├── app/(tabs)/           ← React Native Expo app screens
├── AGENT_GUIDE.md        ← THIS FILE
└── FEATURES_ROADMAP.md   ← Future features
```

---

## 9. SULTAN KI PREFERENCES

- **Hinglish** mein baat karo
- Kaam **seedha karo**, mat poochho
- Har change **GitHub pe push karo**
- Bot **24/7 Railway** pe rehna chahiye
- APK **seedha Telegram file** milni chahiye
- Railway account: **godofthunder7890@gmail.com**

---

## 10. TECH STACK

| Component | Tech |
|-----------|------|
| Bot | Node.js, zero deps, pure `https` |
| Hosting | Railway (24/7) |
| APK | Expo EAS Cloud |
| AI | Groq⚡ → Gemini🔮 → OpenAI🧠 → Claude🎭 |
| DB | Firebase Firestore |
| Search | Serper API |
| Voice | Groq Whisper |
| CI/CD | GitHub Actions |
