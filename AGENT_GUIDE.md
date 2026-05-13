# Sultan Agent — Next Agent Guide

## Project Overview
Sultan Agent ek Expo React Native personal AI app hai.
GitHub Repo: `godofthunder7890-crypto/sultan-agent`

---

## Accounts & Credentials

| Service | Account | Notes |
|---------|---------|-------|
| GitHub | godofthunder7890-crypto | Repo owner |
| Expo / EAS | blcobra858 (xhhk891@gmail.com) | Build account |
| Telegram Bot | @Sultan_Overlord_Bot | APK notifications |

## Secrets (Already set in both GitHub repo AND Replit)
- `EXPO_TOKEN` — blcobra858 account ka EAS token
- `TELEGRAM_BOT_TOKEN` — Sultan_Overlord_Bot ka token
- `TELEGRAM_CHAT_ID` — User ka personal chat ID
- `GITHUB_ACCESS_TOKEN` — GitHub PAT (Replit secret only, NOT in repo)

---

## EAS Project
- **Project ID:** `72bd2537-674f-4d3b-b6b3-6969b43350f0`
- **Owner:** `blcobra858`
- **Dashboard:** https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds
- **Android package:** `com.sultan.agent`
- **Keystore:** Already configured on EAS (Build Credentials GZ6AiSW0sb)

---

## GitHub Actions Workflow

File: `.github/workflows/build-apk.yml`
Triggers on: every push to `main` branch + manual `workflow_dispatch`

**Kya karta hai:**
1. EAS pe Android APK build submit karta hai (production profile)
2. Build FINISH hone ka wait karta hai (max 20 min)
3. APK ready hone pe **seedha Telegram pe APK file bhejta hai** (`sendDocument`)
4. Agar APK > 49MB ho toh download link bhejta hai
5. Build fail pe Telegram pe failure message bhejta hai

---

## Fixes Applied (History)

| Fix | File | Reason |
|-----|------|--------|
| EAS account changed to blcobra858 | app.json | Old account ka access nahi tha |
| New projectId set | app.json | New EAS project create kiya |
| Node 20.19.4 specified | eas.json | EBADENGINE error (required >=20.19.4) |
| assets/images/icon.png added | assets/images/ | Prebuild fail ho raha tha (file missing) |
| Telegram APK direct send | workflow | User ne link ki jagah APK maanga |

---

## Key Files

```
sultan-agent/
├── app.json                          # Expo config (owner=blcobra858, projectId, package)
├── eas.json                          # EAS build config (node: 20.19.4)
├── google-services.json              # Firebase config (already in repo)
├── assets/images/icon.png            # App icon (added to fix prebuild)
├── .github/workflows/build-apk.yml  # Auto-build + Telegram APK notification
├── app/                             # Expo Router screens
├── components/                      # React Native components
├── context/                         # AI, audio context
└── constants/                       # App constants
```

---

## How to Update Files on GitHub (IMPORTANT)

**Shell base64 ya curl se kaam NAHI karta** — content truncate hota hai.
Hamesha Node.js https module use karo:

```javascript
const https = require('https');
const fs = require('fs');

// Step 1: Current SHA lo
const getOpts = {
  hostname: 'api.github.com',
  path: '/repos/godofthunder7890-crypto/sultan-agent/contents/PATH',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + process.env.GITHUB_ACCESS_TOKEN,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Sultan-Agent-Bot'
  }
};

// Step 2: PUT with base64 content + sha
const body = JSON.stringify({
  message: "commit message",
  content: Buffer.from(fileContent).toString('base64'),
  sha: existingSHA  // required for updates, omit for new files
});
// PUT to same path
```

---

## Commands for Next Agent

```bash
# Latest GitHub Actions runs check karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh run list --repo godofthunder7890-crypto/sultan-agent --limit 5

# Specific run ke logs dekho
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh run view RUN_ID --repo godofthunder7890-crypto/sultan-agent --log

# EAS builds check karo
EXPO_TOKEN=$EXPO_TOKEN eas build:list --platform android --limit 3

# Manual GitHub Actions build trigger karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh workflow run build-apk.yml --repo godofthunder7890-crypto/sultan-agent

# EAS build error GraphQL se dekho
# buildId EAS dashboard se lo: https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds
EXPO_TOKEN=$EXPO_TOKEN node -e "
const https = require('https');
const q = JSON.stringify({ query: \`{ builds { byId(buildId: \"BUILD_ID\") { status error { errorCode message } logFiles } } }\` });
const r = https.request({ hostname: 'api.expo.dev', path: '/graphql', method: 'POST', headers: { 'Authorization': 'Bearer ' + process.env.EXPO_TOKEN, 'Content-Type': 'application/json' } }, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(d)); });
r.write(q); r.end();
"
```

---

## Current Status (Last Updated: May 13, 2026)

- GitHub Actions workflow: **Working**
- Telegram notification: **Working** (APK direct bhejta hai)
- EAS build: **Being fixed** — assets/images/icon.png add kiya, Node 20.19.4 set kiya
- Next build should succeed now

---

## EAS Build Failure Debugging

Agar EAS build fail ho toh:
1. GitHub Actions run ke logs dekho — EAS build ID milega
2. EAS dashboard pe jaao: https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds
3. Failed build click karo → "Build logs" tab
4. "PREBUILD" phase mein errors dekho
5. Common errors:
   - `EBADENGINE` → eas.json mein node version check karo
   - `Cannot find module` → package install issue
   - `Error: The file ... does not exist` → assets missing hain
