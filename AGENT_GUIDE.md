# AGENT_GUIDE.md — Sultan Agent Complete Handoff
> Last Updated: 2025-05-14 | Status: ACTIVE — Read this FIRST!

---

## 1. PROJECT OVERVIEW

Sultan (CEO, MA Engineering Pakistan) ka personal AI agent ecosystem.

- **GitHub Repo:** https://github.com/godofthunder7890-crypto/sultan-agent
- **Telegram Bot:** @sultan_agent_bot (sirf Sultan ke liye)
- **APK:** Expo EAS Cloud se build hoti hai (Android)

---

## 2. ACCOUNTS & CREDENTIALS

### GitHub
- Account: `godofthunder7890-crypto`
- Repo: `sultan-agent`
- Token: `GITHUB_ACCESS_TOKEN` (Replit secrets)

### Railway — BOT HOSTING
- **USE THIS ACCOUNT:** `godofthunder7890@gmail.com`
- Token: `RAILWAY_TOKEN` (Replit + GitHub secrets — nayi token save hai)
- Old Project IDs (is account ke):
  ```
  PROJECT_ID = 1450a2ad-ffe6-478f-97ae-4cabdd0f5dea
  SERVICE_ID = 4e6ab161-cc6c-4945-81f6-b6242b4eb1f0
  ENV_ID     = b591b4fe-3105-4155-aa48-aed73d794e5b
  ```
- Test auth: `{ me { name email } }` GraphQL query on `backboard.railway.app/graphql/v2`

### Expo / EAS — APK BUILD
- Account: `haniyashaikh777`
- Project slug: `sultan-agent`
- Token: `EXPO_TOKEN` (Replit + GitHub secrets)
- APK Track: https://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds

### Firebase
- Project ID: `v11345`
- API Key: `AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s`
- User: `sultan`

### All Secrets (Replit + GitHub secrets mein hain)
```
TELEGRAM_BOT_TOKEN   ✅
TELEGRAM_CHAT_ID     ✅  (Sultan ka personal chat ID)
GROQ_API_KEY         ✅
GEMINI_API_KEY       ✅
OPENAI_API_KEY       ✅
SERPER_API_KEY       ✅  (web search)
ELEVENLABS_API_KEY   ✅  (voice — future)
EXPO_TOKEN           ✅
RAILWAY_TOKEN        ✅  (godofthunder7890@gmail.com wali NEW token)
GITHUB_ACCESS_TOKEN  ✅
```

---

## 3. COMPLETED WORK ✅

### Bot v6.0 God Mode (`bot-server/index.js`) ✅
- Groq → Gemini → OpenAI fallback AI chain
- Web Search via Serper API
- Voice transcription via Groq Whisper
- Firebase Firestore sync (projects, orders, memory)
- Material rates 2025 PKR (cement, steel, brick, sand, paint, tile)
- Engineering: quotation generator, profit calculator
- SMM panel: orders, revenue dashboard
- Daily report (7 AM PKT auto-send)
- Reminders, calculator, weather
- `/apk` command + "📦 Build APK" button — GitHub Actions trigger karta hai
- Long polling (Railway pe 24/7)

### GitHub Actions (`.github/workflows/build-apk.yml`) ✅
- **Job 1:** Deploy Bot to Railway (env vars set + redeploy)
- **Job 2:** Build Android APK via EAS Cloud
- Telegram notifications fixed (`--data-urlencode` POST method)
- **Last run: BOTH JOBS ✅ FULL SUCCESS**
- workflow_dispatch enabled (manual trigger bhi kaam karta hai)

### GitHub Secrets — All Set ✅
All 10 secrets GitHub pe bhi push ho chuke hain.

---

## 4. PENDING TASKS ⏳ — NEXT AGENT YAHAN SE SHURU KARE

### TASK 1 — APK Direct Download via Bot (PRIORITY #1 — Sultan ne manga hai)

**Sultan chahta hai:** `/apk` ke baad bot automatically APK file Telegram pe bheje (`sendDocument`)

**Implementation plan:**

```
1. EXPO_TOKEN env var bot pe available karo (Railway pe set karo)

2. Bot mein EAS polling logic add karo:
   - /apk trigger hone pe startTime store karo
   - setInterval: har 90 seconds EAS API check karo

3. EAS API se build status lo:
   Step A — Project ID lao:
     GET https://api.expo.dev/v2/projects?account=haniyashaikh777&slug=sultan-agent
     Header: Authorization: Bearer EXPO_TOKEN

   Step B — Latest build check karo:
     GET https://api.expo.dev/v2/builds?appId=<id>&platform=android&limit=1
     Check: build.status === 'finished' && build.artifacts.buildUrl

4. APK download karo + Telegram pe bhejo:
   - File <= 50MB: sendDocument (multipart/form-data)
   - File > 50MB: direct download link bhejo

5. Telegram sendDocument code:
   boundary = '----TGBoundary' + Date.now()
   form parts: chat_id + document file
   POST https://api.telegram.org/bot<TOKEN>/sendDocument
   Content-Type: multipart/form-data; boundary=...
```

**Code skeleton (bot-server/index.js mein add karo):**
```javascript
const EXPO = process.env.EXPO_TOKEN || '';
const pendingBuilds = [];  // { cid, startTime }

async function expoAPI(path) {
  return httpJSON({
    hostname: 'api.expo.dev', path, method: 'GET',
    headers: { 'Authorization': 'Bearer ' + EXPO, 'User-Agent': 'SultanAgent/6.0' }
  }, null);
}

async function pollAndSendAPK() {
  if (!pendingBuilds.length || !EXPO) return;
  for (let i = pendingBuilds.length - 1; i >= 0; i--) {
    const { cid, startTime } = pendingBuilds[i];
    const projRes = await expoAPI('/v2/projects?account=haniyashaikh777&slug=sultan-agent');
    const appId = projRes?.data?.[0]?.id;
    if (!appId) continue;
    const buildsRes = await expoAPI('/v2/builds?appId=' + appId + '&platform=android&limit=1');
    const build = buildsRes?.data?.[0];
    if (!build) continue;
    const buildStart = new Date(build.createdAt).getTime();
    if (buildStart < startTime - 60000) continue; // purani build ignore
    if (build.status === 'finished' && build.artifacts?.buildUrl) {
      pendingBuilds.splice(i, 1);
      await send(cid, 'APK ready! Download kar raha hun...');
      const apkBuf = await httpDownload(build.artifacts.buildUrl);
      if (apkBuf.length <= 50 * 1024 * 1024) {
        await sendDocument(cid, apkBuf, 'SultanAgent-v6.apk');
      } else {
        await send(cid, 'APK download: ' + build.artifacts.buildUrl);
      }
    } else if (build.status === 'errored') {
      pendingBuilds.splice(i, 1);
      await send(cid, 'APK build fail hua: ' + (build.error?.message || 'unknown error'));
    } else if (Date.now() - startTime > 25 * 60 * 1000) {
      pendingBuilds.splice(i, 1);
      await send(cid, 'APK timeout. Expo pe check karo: https://expo.dev/accounts/haniyashaikh777/projects/sultan-agent/builds');
    }
  }
}

async function sendDocument(cid, buffer, filename) {
  const boundary = '----TGBoundary' + Date.now();
  const meta = Buffer.from(
    '--' + boundary + '\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n' + cid +
    '\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="document"; filename="' + filename + '"\r\nContent-Type: application/vnd.android.package-archive\r\n\r\n'
  );
  const end = Buffer.from('\r\n--' + boundary + '--\r\n');
  const body = Buffer.concat([meta, buffer, end]);
  return httpJSON({
    hostname: 'api.telegram.org',
    path: '/bot' + TOKEN + '/sendDocument',
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length }
  }, body);
}

// Start polling (add near bottom, before main()):
setInterval(pollAndSendAPK, 90000);

// In handleAPKBuild(), after triggering workflow:
pendingBuilds.push({ cid, startTime: Date.now() });
```

### TASK 2 — Railway Verify + Bot Running Confirm (PRIORITY #2)

```
1. RAILWAY_TOKEN test karo against old project IDs:
   node -e "
   const https = require('https');
   const body = JSON.stringify({ query: '{ project(id: \"1450a2ad-ffe6-478f-97ae-4cabdd0f5dea\") { name } }' });
   https.request({ hostname: 'backboard.railway.app', path: '/graphql/v2', method: 'POST', timeout: 20000,
     headers: { 'Authorization': 'Bearer ' + process.env.RAILWAY_TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
   }, r => { let d=''; r.on('data', c => d+=c); r.on('end', () => console.log(d)); }).end(body);
   "

2. Agar access hai: sab env vars set karo + EXPO_TOKEN bhi add karo
3. Redeploy trigger karo
4. Bot online check: /status send karo Telegram pe
```

### TASK 3 — Workflow mein EXPO_TOKEN add karo

In `.github/workflows/build-apk.yml` mein Railway vars section mein add karo:
```yaml
EXPO_TOKEN: AIzaSy...   # process.env.EXPO_TOKEN
```

---

## 5. FILE STRUCTURE

```
sultan-agent/
├── bot-server/
│   ├── index.js          ← Bot v6.0 God Mode (709 lines)
│   ├── package.json      ← start: "node index.js"
│   └── .env.example      ← All env vars reference
├── .github/
│   └── workflows/
│       └── build-apk.yml ← CI/CD (175 lines, both jobs GREEN)
├── app.json              ← Expo config (owner: haniyashaikh777)
├── eas.json              ← EAS profiles (production = APK)
└── AGENT_GUIDE.md        ← THIS FILE
```

---

## 6. HOW TO PUSH CODE TO GITHUB

**ALWAYS use GitHub Contents API — never git commands:**

```bash
# Step 1: Get SHA
SHA=$(curl -s -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/contents/bot-server/index.js" | \
  node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).sha)")

# Step 2: Push
CONTENT=$(base64 -w 0 /tmp/myfile.js)
curl -s -X PUT \
  -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/contents/bot-server/index.js" \
  -d "{\"message\":\"commit msg\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\"}"
```

---

## 7. QUICK COMMANDS

```bash
# Trigger APK build manually
curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/actions/workflows/build-apk.yml/dispatches" \
  -d '{"ref":"main"}'

# Check workflow status
curl -s -H "Authorization: Bearer $GITHUB_ACCESS_TOKEN" \
  "https://api.github.com/repos/godofthunder7890-crypto/sultan-agent/actions/runs?per_page=3" | \
  node -e "const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); (j.workflow_runs||[]).forEach(r=>console.log(r.conclusion==='success'?'✅':'❌',r.name,'|',r.conclusion||r.status));"

# Railway test
node -e "const https=require('https'); const b=JSON.stringify({query:'{me{name email}}'}); https.request({hostname:'backboard.railway.app',path:'/graphql/v2',method:'POST',timeout:15000,headers:{'Authorization':'Bearer '+process.env.RAILWAY_TOKEN,'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d));}).end(b);"
```

---

## 8. TECH STACK

| Layer | Tech |
|-------|------|
| Bot | Node.js, zero npm deps, pure `https` module |
| Hosting | Railway (24/7) |
| APK Build | Expo EAS Cloud |
| AI Primary | Groq (llama3-70b-8192) |
| AI Fallback | Gemini 1.5 Flash → OpenAI gpt-4o-mini |
| Database | Firebase Firestore |
| Search | Serper API (Google results) |
| Voice | Groq Whisper API |
| CI/CD | GitHub Actions |

---

## 9. SULTAN KI PREFERENCES

- **Hinglish** mein baat karo (Hindi + English mix)
- Kaam **seedha karo**, zyada poochho mat
- Har change **GitHub pe push karo** (Contents API use karo)
- Bot **always running** rehna chahiye (Railway 24/7)
- APK **seedha Telegram pe** milni chahiye (`sendDocument`)
- Railway: **godofthunder7890@gmail.com** wala account use karna hai

---

## 10. LAST KNOWN STATE (2025-05-14)

```
Workflow:  ✅ BOTH JOBS PASSING
Bot file:  bot-server/index.js (v6.0, 709 lines)
Workflow:  .github/workflows/build-apk.yml (175 lines)
Commands:  /start /menu /status /report /apk /clear /clearmem /search
APK:       Submitting to EAS every push ✅
Railway:   New RAILWAY_TOKEN saved, pending verification
```
