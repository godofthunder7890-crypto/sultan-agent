# Sultan Agent — Replit Agent Context

> **Future agent: Isko pehle padho. Zero se mat shuru karo — sab kuch yahan hai.**

---

## Project Overview
Personal AI agent mobile app for Sultan. Expo (React Native) app with 6 tabs.

## Expo Account
- Username: `suhanshaikh78957`
- Email: `suhancontrat@gmail.com`
- Project: `@suhanshaikh78957/sultan-agent`
- EAS Project ID: `1bd4abf0-bbef-47c9-a6b0-cb72f58a243c`

## GitHub Repo
- Owner: `godofthunder7890-crypto`
- Repo: `sultan-agent`
- This root IS the Expo app (not a monorepo)

## APK Build
- GitHub Actions: `.github/workflows/build-apk.yml`
- EAS profile: `production` (APK, not AAB)
- Check builds: https://expo.dev/accounts/suhanshaikh78957/projects/sultan-agent/builds
- Build command: `eas build --platform android --profile production --non-interactive --no-wait`
- **`--no-wait` flag is REQUIRED** — it submits to EAS cloud and exits. EAS builds in background (~15 min).

## App Tabs (in order)
1. `app/(tabs)/index.tsx` — AI Chat (Groq Llama 3.3 70B)
2. `app/(tabs)/jarvix.tsx` — JARVIX Voice AI (ElevenLabs TTS + Groq STT)
3. `app/(tabs)/engineering.tsx` — MA Engineering project tracker
4. `app/(tabs)/smm.tsx` — SMM Dashboard
5. `app/(tabs)/telegram.tsx` — Telegram Bot control + AI auto-reply
6. `app/(tabs)/settings.tsx` — All API keys + settings

## Key Files
- `app/(tabs)/_layout.tsx` — Tab bar layout
- `context/AppContext.tsx` — Global state (AsyncStorage), all settings
- `constants/colors.ts` — Dark theme tokens (#080B14 bg, #38BDF8 primary, #818CF8 accent)
- `hooks/useColors.ts` — Always returns dark theme
- `babel.config.js` — Has `react-native-reanimated/plugin` (required!)
- `eas.json` — Build profiles
- `app.json` — Expo config with owner + EAS projectId

## Settings Stored (AsyncStorage via AppContext)
- `groqKey` — Groq API key
- `elevenlabsApiKey`, `elevenlabsVoiceId` — ElevenLabs voice
- `openaiKey`, `geminiKey` — AI providers
- `telegramBotToken` — Telegram bot token (@BotFather se milta hai)
- `telegramChatId` — Default chat ID
- `telegramAiReply` — boolean, AI auto-reply toggle
- `githubToken`, `githubOwner`, `githubRepo` — GitHub sync
- `userName`, `selectedModel`, `jarvixPersonality` — misc

## Firebase
- Project ID: `v11345`
- Only used for Sultan Studio (web app), NOT in this mobile app

## Critical: Do NOT Do These Things
- ❌ Do NOT use `catalog:` in package.json (pnpm monorepo syntax, fails in standalone npm)
- ❌ Do NOT add `workspace:*` dependencies (monorepo only)
- ❌ Do NOT use `expo-glass-effect` (not a real package)
- ❌ Do NOT add `react-native-worklets` separately (conflicts with reanimated 4)
- ❌ Do NOT enable `reactCompiler: true` in app.json experiments (not configured)
- ❌ Do NOT use `btoa()` in React Native for large content (use Buffer instead)
- ❌ Do NOT remove `react-native-reanimated/plugin` from babel.config.js

## Colors / Theme
- Background: `#080B14`
- Primary (cyan): `#38BDF8`
- Accent (purple): `#818CF8`
- Telegram blue: `#2AABEE`
- Always dark mode (forced)

## Hinglish Note
User communicates in Hinglish (Hindi + English mix). Respond accordingly.

## Package Manager Note
This GitHub repo uses plain `npm` for builds (not pnpm). The Replit monorepo uses pnpm.
The file you push to GitHub must have real version numbers, not `catalog:` references.

## Real Version Numbers (for package.json)
- `react`: `"18.3.1"`
- `@tanstack/react-query`: `"^5.62.16"`
- `expo`: `"~54.0.27"`
- `expo-build-properties`: `"~1.0.10"` (NOT ^55.x.x)
