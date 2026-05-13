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
| Telegram Bot | @Sultan_Overlord_Bot | Notifications |

## Secrets (Already set in GitHub repo + Replit)
- `EXPO_TOKEN` — blcobra858 account ka EAS token
- `TELEGRAM_BOT_TOKEN` — Sultan_Overlord_Bot ka token
- `TELEGRAM_CHAT_ID` — User ka personal chat ID
- `GITHUB_ACCESS_TOKEN` — GitHub personal access token (Replit secret only)

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

**Kya karta hai:**
1. Har `main` branch push pe automatically trigger hota hai
2. EAS pe Android APK build submit karta hai (production profile, internal distribution)
3. Build complete hone ka wait karta hai (20 attempts x 60s = max 20 min)
4. APK ready hone pe **seedha Telegram pe APK file bhejta hai** (< 49MB)
5. Agar APK badi ho (> 49MB) toh download link bhejta hai
6. Build fail hone pe failure message Telegram pe bhejta hai

**Telegram notifications:**
- Success: APK file directly send hoti hai via `sendDocument`
- Failure: Error message + EAS dashboard link

---

## Key Files in Repo

```
sultan-agent/
├── app.json          # Expo config (owner, projectId, android package)
├── eas.json          # EAS build config (Node 20.19.4 specified)
├── google-services.json  # Firebase config
├── .github/workflows/build-apk.yml  # Auto-build + Telegram notify
├── app/              # Expo Router screens
├── components/       # React Native components
├── context/          # App context (AI, audio, etc.)
└── constants/        # App constants
```

---

## Important Fixes Already Applied

1. **EAS account changed** — Old account se naye `blcobra858` account pe move kiya
2. **app.json updated** — owner=blcobra858, projectId=72bd2537-...
3. **eas.json Node version** — Node 20.19.4 set kiya (fix for EBADENGINE error)
4. **Workflow file** — Direct APK Telegram pe bhejna added

---

## How to Use GitHub API (No git push allowed)

```javascript
// File update karne ka sahi tarika (Node.js):
const https = require('https');
const fs = require('fs');

// 1. Pehle current SHA lo
// GET https://api.github.com/repos/OWNER/REPO/contents/PATH

// 2. Phir PUT karo updated content ke saath
// Content MUST be base64 encoded
const body = JSON.stringify({
  message: "commit message",
  content: Buffer.from(fileContent).toString('base64'),
  sha: currentSHA  // required for updates
});
// PUT https://api.github.com/repos/OWNER/REPO/contents/PATH
```

**Important:** `base64 -w 0` shell command se kaam nahi karta (content truncate hota hai).
Hamesha Node.js `Buffer.from(content).toString('base64')` use karo.

---

## Current Build Status

- GitHub Actions workflow: **Working** (triggers on every push to main)
- EAS build: **Being fixed** (Node version fix applied, testing in progress)
- Telegram notification: **Working** (APK/link bhejta hai)

---

## Next Steps / Known Issues

- EAS build Node.js 20.19.4 fix kiya — agle build pe test hoga
- Agar build phir fail ho: EAS dashboard pe logs dekho
  - https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds
- Agar APK > 49MB ho: Telegram mein download link aayega (file nahi)

---

## Commands for Next Agent

```bash
# GitHub repo latest runs check karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh run list --repo godofthunder7890-crypto/sultan-agent --limit 5

# Latest run logs dekho
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh run view RUN_ID --repo godofthunder7890-crypto/sultan-agent --log

# EAS builds check karo (Replit terminal se)
EXPO_TOKEN=$EXPO_TOKEN eas build:list --platform android --limit 3

# Manual build trigger karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh workflow run build-apk.yml --repo godofthunder7890-crypto/sultan-agent
```
