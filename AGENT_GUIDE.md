# AGENT_GUIDE.md — Sultan Agent Complete Handoff
> Last Updated: 2025-05-14 | **READ THIS FIRST BEFORE ANYTHING!**

---

## ✅ CURRENT STATUS — ALL GREEN

```
Bot v6.0 God Mode         ✅ PUSHED (643 lines)
APK Auto-Download         ✅ IMPLEMENTED (EAS polling + sendDocument)
GitHub Actions Workflow   ✅ BOTH JOBS PASSING
Railway Token             ✅ VERIFIED (godofthunder7890@gmail.com)
Railway Env Vars          ⚠️  Peak hours blocked — set after 8 PM Pacific
EXPO_TOKEN on Railway     ⚠️  Will auto-set via workflow next deploy
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
- **Account:** godofthunder7890@gmail.com ← YEH WALA
- **Token:** `RAILWAY_TOKEN` (Replit + GitHub secrets — VERIFIED ✅)
- **Project IDs:**
  ```
  PROJECT_ID = 1450a2ad-ffe6-478f-97ae-4cabdd0f5dea
  SERVICE_ID = 4e6ab161-cc6c-4945-81f6-b6242b4eb1f0
  ENV_ID     = b591b4fe-3105-4155-aa48-aed73d794e5b
  ```
- **⚠️ Railway Free Tier:** vars set karne ke liye `8 PM – 8 AM Pacific` ka wait karo!
  Error: "Free-tier deploys to sfo are not available during peak hours (8 AM – 8 PM America/Los_Angeles)"
  **Fix:** Raat mein Railway vars set karo ya Railway pe upgrade karo

### Expo / EAS
- **Account:** haniyashaikh777
- **Token:** `EXPO_TOKEN` (Replit + GitHub secrets)
- **APK Track:** https://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds

### Firebase
- **Project ID:** v11345
- **API Key:** AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s
- **User:** sultan

### All Secrets (Replit + GitHub Actions)
```
TELEGRAM_BOT_TOKEN   ✅
TELEGRAM_CHAT_ID     ✅
GROQ_API_KEY         ✅
GEMINI_API_KEY       ✅
OPENAI_API_KEY       ✅
SERPER_API_KEY       ✅
ELEVENLABS_API_KEY   ✅
EXPO_TOKEN           ✅
RAILWAY_TOKEN        ✅ (godofthunder7890@gmail.com — VERIFIED)
GITHUB_ACCESS_TOKEN  ✅
```

---

## 3. COMPLETED WORK ✅

### Bot v6.0 God Mode (`bot-server/index.js`, 643 lines)
- Groq → Gemini → OpenAI fallback
- Web Search (Serper), Voice (Whisper), Firebase sync
- Engineering: quotation, profit calc, material rates 2025
- SMM: orders, revenue dashboard
- Daily report 7 AM PKT, reminders, calculator, weather
- `/apk` + "📦 Build & Get APK" button
- **APK Auto-Download:** EAS polling every 90s → sendDocument to Telegram!
  - Redirects follow karta hai (HTTP → HTTPS)
  - <= 50MB: seedha file bhejta hai
  - > 50MB: download link bhejta hai
  - 30 min timeout with status updates

### Workflow (`.github/workflows/build-apk.yml`, 185 lines)
- Job 1: Railway deploy (EXPO_TOKEN + GITHUB_ACCESS_TOKEN bhi set hota hai)
- Job 2: EAS APK build
- **Last run: ✅ BOTH JOBS SUCCESS**
- Telegram notifications fixed

### Railway Env Vars (set honge off-peak hours mein)
```
TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID, GROQ_API_KEY, GEMINI_API_KEY,
OPENAI_API_KEY, SERPER_API_KEY, ELEVENLABS_API_KEY,
EXPO_TOKEN, GITHUB_ACCESS_TOKEN,
FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_USER_ID, PORT
```

---

## 4. PENDING / NEXT TASKS ⏳

### TASK 1 — Railway Env Vars + Redeploy (PRIORITY #1)
Railway free tier peak hours restriction hai. Raat ko (after 8 PM Pacific = 9 AM Pakistan time) yeh run karo:

```bash
node << 'EOF'
const https = require('https');
const TOKEN      = process.env.RAILWAY_TOKEN;
const PROJECT_ID = '1450a2ad-ffe6-478f-97ae-4cabdd0f5dea';
const SERVICE_ID = '4e6ab161-cc6c-4945-81f6-b6242b4eb1f0';
const ENV_ID     = 'b591b4fe-3105-4155-aa48-aed73d794e5b';

const vars = {
  TELEGRAM_BOT_TOKEN:  process.env.TELEGRAM_BOT_TOKEN,
  ADMIN_CHAT_ID:       process.env.TELEGRAM_CHAT_ID,
  GROQ_API_KEY:        process.env.GROQ_API_KEY,
  GEMINI_API_KEY:      process.env.GEMINI_API_KEY,
  OPENAI_API_KEY:      process.env.OPENAI_API_KEY,
  SERPER_API_KEY:      process.env.SERPER_API_KEY,
  ELEVENLABS_API_KEY:  process.env.ELEVENLABS_API_KEY,
  EXPO_TOKEN:          process.env.EXPO_TOKEN,
  GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN,
  FIREBASE_API_KEY:    'AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s',
  FIREBASE_PROJECT_ID: 'v11345',
  FIREBASE_USER_ID:    'sultan',
  PORT:                '3000',
};

function gql(q) {
  return new Promise(res => {
    const body = JSON.stringify({ query: q });
    const req = https.request({ hostname:'backboard.railway.app', path:'/graphql/v2', method:'POST', timeout:20000,
      headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch{res({_e:d});} }); });
    req.on('error',e=>res({_e:e.message})); req.on('timeout',()=>{req.destroy();res({_e:'timeout'});}); req.end(body);
  });
}

async function setVar(name, value) {
  if (!value) return console.log('SKIP:', name);
  const safe = value.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  const r = await gql('mutation { variableUpsert(input:{projectId:"'+PROJECT_ID+'",environmentId:"'+ENV_ID+'",serviceId:"'+SERVICE_ID+'",name:"'+name+'",value:"'+safe+'"}) }');
  console.log(r.errors||r._e ? '❌ '+name+': '+(r._e||r.errors[0]?.message) : '✅ '+name);
  await new Promise(r=>setTimeout(r,400));
}

(async()=>{
  for (const [k,v] of Object.entries(vars)) await setVar(k,v);
  const dep = await gql('mutation { serviceInstanceRedeploy(environmentId:"'+ENV_ID+'",serviceId:"'+SERVICE_ID+'") }');
  console.log(dep.errors||dep._e ? '❌ Redeploy: '+(dep._e||dep.errors[0]?.message) : '✅ Redeploy triggered!');
})();
EOF
```

### TASK 2 — Verify Bot Online
After Railway redeploy, bot ka /status check karo Telegram pe.
Expected: AI Groq + Gemini + OpenAI, EXPO_TOKEN enabled, search ON.

### TASK 3 — Test APK Auto-Download End-to-End
1. `/apk` command bhejo Telegram pe
2. Bot: "Build submitted! Jab ready hogi seedha file bhejunga"
3. 10-15 min wait karo
4. Bot seedha APK file bhejega (sendDocument)

---

## 5. FILE STRUCTURE

```
sultan-agent/
├── bot-server/
│   ├── index.js          ← v6.0 God Mode (643 lines) — APK auto-download ✅
│   ├── package.json      ← start: "node index.js"
│   └── .env.example
├── .github/
│   └── workflows/
│       └── build-apk.yml ← CI/CD (185 lines) — both jobs green ✅
├── app.json              ← owner: haniyashaikh777
├── eas.json              ← production profile = APK
└── AGENT_GUIDE.md        ← THIS FILE
```

---

## 6. HOW TO PUSH CODE (ALWAYS USE THIS)

```bash
# Get SHA first
SHA=$(curl -s -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/contents/bot-server/index.js" | \
  node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).sha)")

# Push file
CONTENT=$(base64 -w 0 /tmp/myfile.js)
curl -s -X PUT \
  -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/contents/bot-server/index.js" \
  -d "{\"message\":\"your msg\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\"}"
```

---

## 7. QUICK COMMANDS

```bash
# Trigger APK build manually
curl -s -X POST -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/actions/workflows/build-apk.yml/dispatches" \
  -d '{"ref":"main"}'

# Check workflow status
curl -s -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/actions/runs?per_page=3" | \
  node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); (j.workflow_runs||[]).forEach(r=>console.log(r.conclusion==='success'?'✅':'❌',r.name,'|',r.conclusion||r.status));"

# Test Railway token
node -e "const https=require('https'); const b=JSON.stringify({query:'{me{name email}}'}); https.request({hostname:'backboard.railway.app',path:'/graphql/v2',method:'POST',timeout:15000,headers:{'Authorization':'Bearer '+process.env.RAILWAY_TOKEN,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d));}).end(b);"
```

---

## 8. SULTAN KI PREFERENCES

- **Hinglish** mein baat karo
- Kaam **seedha karo**, mat poochho
- Har change **GitHub pe push karo** (Contents API, git nahi)
- Bot **24/7 Railway** pe rehna chahiye
- APK **seedha Telegram file** milni chahiye (sendDocument)
- Railway account: **godofthunder7890@gmail.com**

---

## 9. TECH STACK

| Component | Tech |
|-----------|------|
| Bot | Node.js, zero deps, pure `https` |
| Hosting | Railway (24/7, free tier) |
| APK | Expo EAS Cloud |
| AI | Groq llama3-70b → Gemini 1.5 Flash → OpenAI gpt-4o-mini |
| DB | Firebase Firestore |
| Search | Serper API |
| Voice | Groq Whisper |
| CI/CD | GitHub Actions |
