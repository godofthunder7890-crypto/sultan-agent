# Sultan Agent — Complete Agent Guide

## Naye Agent Ke Liye — Sirf GITHUB_ACCESS_TOKEN Do, Baki Sab Yahan Hai

---

## ACCOUNTS & CREDENTIALS

| Service | Account | Details |
|---------|---------|---------|
| GitHub Repo | godofthunder7890-crypto | sultan-agent repo |
| Expo / EAS | blcobra858 | xhhk891@gmail.com |
| Telegram Bot | @Sultan_Overlord_Bot | APK auto-bhejta hai |

## SECRETS (Sab GitHub Repo Secrets Mein Hain)
- `EXPO_TOKEN` — blcobra858 EAS token (set hai)
- `TELEGRAM_BOT_TOKEN` — Bot token (set hai)
- `TELEGRAM_CHAT_ID` — User chat ID (set hai)

**Naye Replit mein sirf yeh secret add karo:**
- `GITHUB_ACCESS_TOKEN` — GitHub PAT (user ke paas hai)

---

## EAS BUILD INFO
- Project ID: `72bd2537-674f-4d3b-b6b3-6969b43350f0`
- Owner: `blcobra858`
- Android Package: `com.sultan.agent`
- Keystore: Set hai (Build Credentials GZ6AiSW0sb)
- Dashboard: https://expo.dev/accounts/blcobra858/projects/sultan-agent/builds

---

## GITHUB FILES (Sab Updated Hain)

```
sultan-agent/
├── AGENT_GUIDE.md          ← Yeh file (next agent ke liye)
├── FEATURES_ROADMAP.md     ← 500+ features list (God Mode)
├── app.json                ← owner:blcobra858, newArchEnabled:false (Gradle fix)
├── eas.json                ← node:20.19.4 (EBADENGINE fix)
├── assets/images/icon.png  ← Added (Prebuild fix)
├── google-services.json    ← Firebase (already tha)
├── .github/workflows/
│   └── build-apk.yml      ← Auto build + Telegram APK send
├── app/(tabs)/
│   ├── index.tsx           ← Main chat screen
│   ├── jarvix.tsx          ← JARVIX AI screen
│   ├── settings.tsx        ← Settings
│   ├── engineering.tsx     ← Engineering tab
│   ├── smm.tsx             ← SMM tab
│   └── telegram.tsx        ← Telegram tab
├── context/AppContext.tsx   ← App state management
├── components/             ← Reusable components
└── constants/colors.ts     ← Theme colors
```

---

## WORKFLOW — KAISE KAAM KARTA HAI

```
GitHub main branch pe koi bhi push
        ↓
GitHub Actions auto-trigger (.github/workflows/build-apk.yml)
        ↓
EAS pe Android APK build (production profile, ~15-20 min)
        ↓
APK ready → Telegram pe seedha APK file bhejta hai
APK fail → Telegram pe failure message + EAS link
```

---

## FIXES APPLIED (History)

| Fix | File | Reason |
|-----|------|--------|
| EAS account → blcobra858 | app.json | Old account access nahi tha |
| New EAS projectId | app.json | New project create kiya |
| Node 20.19.4 | eas.json | EBADENGINE error fix |
| assets/images/icon.png | assets/ | Prebuild fail hoti thi |
| newArchEnabled: false | app.json | Gradle build fail fix |
| Direct APK to Telegram | workflow | Link ki jagah APK chahiye tha |

---

## FILE UPDATE KARNE KA TARIKA (IMPORTANT!)

**Shell base64 ya curl SE KAAM NAHI KARTA** — content truncate hota hai!
Hamesha Node.js use karo:

```javascript
const https = require('https');
const token = process.env.GITHUB_ACCESS_TOKEN;

function pushFile(path, content, message) {
  // Step 1: Current SHA lo
  https.request({
    hostname: 'api.github.com',
    path: `/repos/godofthunder7890-crypto/sultan-agent/contents/${path}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Sultan-Agent-Bot' }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      let sha = null;
      try { sha = JSON.parse(data).sha; } catch(e) {}
      
      // Step 2: Push updated content
      const body = JSON.stringify({
        message,
        content: Buffer.from(content).toString('base64'),
        ...(sha ? { sha } : {})
      });
      https.request({
        hostname: 'api.github.com',
        path: `/repos/godofthunder7890-crypto/sultan-agent/contents/${path}`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json', 'User-Agent': 'Sultan-Agent-Bot',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (putRes) => {
        let d = '';
        putRes.on('data', c => d += c);
        putRes.on('end', () => {
          const pd = JSON.parse(d);
          if (pd.commit) console.log('Pushed:', path, pd.commit.sha.substr(0,7));
          else console.log('Error:', JSON.stringify(pd).substr(0,200));
        });
      }).end(body);
    });
  }).end();
}
```

---

## USEFUL COMMANDS

```bash
# Latest builds check karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh run list --repo godofthunder7890-crypto/sultan-agent --limit 5

# Build logs dekho
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh run view RUN_ID --repo godofthunder7890-crypto/sultan-agent --log

# Manual build trigger karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh workflow run build-apk.yml --repo godofthunder7890-crypto/sultan-agent

# GitHub secret set karo
GH_TOKEN=$GITHUB_ACCESS_TOKEN gh secret set SECRET_NAME --body "value" --repo godofthunder7890-crypto/sultan-agent

# EAS build error dekho (GraphQL)
EXPO_TOKEN=$EXPO_TOKEN node -e "
const https = require('https');
const q = JSON.stringify({ query: '{builds{byId(buildId:\"BUILD_ID\"){status error{errorCode message}logFiles}}}' });
https.request({hostname:'api.expo.dev',path:'/graphql',method:'POST',headers:{'Authorization':'Bearer '+process.env.EXPO_TOKEN,'Content-Type':'application/json'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>console.log(d));}).end(q);
"
```

---

## EAS BUILD TROUBLESHOOTING

| Error | Fix |
|-------|-----|
| EBADENGINE (Node version) | eas.json mein node: "20.19.4" |
| Prebuild fail (missing file) | assets/images/icon.png add karo |
| Gradle build fail | app.json mein newArchEnabled: false |
| Keystore not found | EAS dashboard pe credentials check karo |
| EXPO_TOKEN invalid | blcobra858 account se naya token generate karo |

---

## CURRENT STATUS (May 13, 2026)

- GitHub Actions: WORKING
- Telegram notification: WORKING (APK direct bhejta hai)
- EAS build: FIXING (newArchEnabled:false fix apply kiya, build chal rahi hai)
- Features added: 0/500+ (roadmap ready, FEATURES_ROADMAP.md dekho)

---

## NEXT STEPS

1. Current build ka wait karo — Telegram pe APK aayega
2. Agar build phir fail ho → EAS dashboard logs dekho
3. FEATURES_ROADMAP.md se Phase 1 features implement karo
4. Har feature ke liye GitHub pe push karo → auto build hoga
