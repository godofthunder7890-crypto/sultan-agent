# Sultan Agent Ecosystem

A personal AI agent ecosystem for Sultan — consisting of a mobile app (Expo) and a web coding assistant platform (Sultan Studio).

---

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

---

## Artifacts

### 1. Sultan Agent (Mobile) — `artifacts/sultan-agent`
- **Kind:** Expo (React Native) mobile app
- **Preview path:** `/`
- **Stack:** Expo SDK 53, React Native, Groq Llama 3.3 70B, Firebase
- **Features:**
  - AI Chat tab (Groq API — `llama-3.3-70b-versatile`)
  - MA Engineering project tracker tab
  - SMM Dashboard tab
  - Settings tab (GitHub sync, API keys)
- **Firebase config:** project `gen-lang-client-0254714036`, Android appId `1:797480440142:android:26d5e12e1ea817e43e4e1f`, package `com.sultan.agent`
- **GitHub repo:** `godofthunder7890-crypto/sultan-agent`
- **Colors:** background `#080B14`, primary `#38BDF8`, accent `#818CF8`
- **Key files:**
  - `artifacts/sultan-agent/app/(tabs)/index.tsx` — AI Chat screen
  - `artifacts/sultan-agent/app/(tabs)/settings.tsx` — Settings + GitHub sync
  - `artifacts/sultan-agent/context/AppContext.tsx` — global state, Firebase, AsyncStorage
  - `artifacts/sultan-agent/constants/colors.ts` — dark theme tokens

### 2. Sultan Studio (Web) — `artifacts/sultan-studio`
- **Kind:** React + Vite web app
- **Preview path:** `/studio/`
- **Stack:** React 18, Vite, Tailwind CSS v4, shadcn/ui, Firebase Firestore, Monaco Editor
- **NO backend server** — all data in Firebase Firestore, all AI calls direct from browser
- **Features:**
  - Projects page (`/`) — list, create, delete projects linked to GitHub repos
  - Studio page (`/studio/:id`) — 3-panel: file tree (left) + Monaco editor (center) + AI chat (right)
  - Settings page (`/settings`) — manage all API keys (stored in localStorage), Firebase auto-initialized
  - Multi-AI provider chat with streaming: Groq, Gemini, Anthropic, OpenAI GPT-4o, OpenRouter DeepSeek
  - Monaco code editor with language auto-detection, file tabs, auto-save to Firestore
  - GitHub push via Contents API (one file at a time, gets SHA before update)
  - Code blocks in AI responses have "Insert to editor" and "Copy" buttons
  - Ctrl+Enter to send chat message
- **Firebase config (in `artifacts/sultan-studio/.env`):**
  - `VITE_FIREBASE_API_KEY=AIzaSyAIXaXrs_uDULhlZ2savQ-GWeG-d9Kwy1k`
  - `VITE_FIREBASE_PROJECT_ID=gen-lang-client-0254714036`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID=797480440142`
  - `VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0254714036.firebasestorage.app`
  - `VITE_FIREBASE_APP_ID=1:797480440142:android:26d5e12e1ea817e43e4e1f`
- **Firestore collections:**
  - `projects/{id}` — `{ name, githubRepo, description, createdAt, updatedAt }`
  - `projects/{id}/files/{id}` — `{ name, path, content, language, updatedAt }`
  - `projects/{id}/messages/{id}` — `{ role, content, model, timestamp }`
- **AI providers (keys in localStorage):**
  - `openaiApiKey` → OpenAI GPT-4o (`https://api.openai.com/v1/chat/completions`)
  - `openrouterApiKey` → OpenRouter DeepSeek (`https://openrouter.ai/api/v1/chat/completions`, model: `deepseek/deepseek-chat`)
  - `groqApiKey` → Groq Llama 3.3 70B (`https://api.groq.com/openai/v1/chat/completions`)
  - `geminiApiKey` → Gemini 1.5 Flash (`https://generativelanguage.googleapis.com/...`)
  - `anthropicApiKey` → Anthropic Claude Haiku (`https://api.anthropic.com/v1/messages`)
  - `githubToken` → GitHub Personal Access Token (for push)
- **Key files:**
  - `artifacts/sultan-studio/src/lib/firebase.ts` — Firebase init + Firestore helpers
  - `artifacts/sultan-studio/src/lib/ai.ts` — AI provider abstraction + streaming
  - `artifacts/sultan-studio/src/lib/github.ts` — GitHub Contents API push
  - `artifacts/sultan-studio/src/pages/studio.tsx` — main 3-panel workspace
  - `artifacts/sultan-studio/src/pages/projects.tsx` — project list + create/delete
  - `artifacts/sultan-studio/src/pages/settings.tsx` — API key management
  - `artifacts/sultan-studio/src/App.tsx` — router setup (wouter)
  - `artifacts/sultan-studio/src/index.css` — dark futuristic theme (always dark)

---

## Where things live

- `artifacts/sultan-agent/` — Expo mobile app
- `artifacts/sultan-studio/` — Web coding assistant (Sultan Studio)
- `artifacts/api-server/` — Express API server (scaffold only, not used by studio)
- `lib/db/` — Drizzle ORM schema (PostgreSQL, not used by studio)
- `lib/api-spec/` — OpenAPI spec (not used by studio)

---

## Architecture Decisions

- Sultan Studio is **100% Firebase + direct browser API calls** — no custom backend server by user's explicit request ("sab kuch chalna chiye mere Firebase se hi")
- All AI provider API keys are stored in **localStorage** (not env vars) since they're called directly from the browser
- Replit secrets (`GROQ_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `GITHUB_ACCESS_TOKEN`) are stored for reference but the web app reads from localStorage
- Monaco editor (`@monaco-editor/react`) is installed in sultan-studio package
- Firebase (`firebase` package) is installed in sultan-studio package
- Dark mode is **forced always** — `dark` class added to `<html>` on mount, no toggle

---

## Secrets Available (Replit)

- `GROQ_API_KEY` — working ✅
- `OPENAI_API_KEY` — added ✅
- `OPENROUTER_API_KEY` — added ✅
- `GEMINI_API_KEY` — updated (was quota-exceeded)
- `ANTHROPIC_API_KEY` — added (no credits on account)
- `GITHUB_ACCESS_TOKEN` — for pushing to GitHub
- `SESSION_SECRET` — for Express sessions

---

## GitHub

- Owner: `godofthunder7890-crypto`
- Repo: `sultan-agent`
- All code pushed via GitHub Contents API (not git CLI — blocked in main agent)

---

## Important: Firestore Setup Required

Before Sultan Studio works, user must enable Firestore in Firebase Console:
1. Go to console.firebase.google.com → project `gen-lang-client-0254714036`
2. Click "Firestore Database" → "Create database"
3. Choose "Start in test mode" → select region → Done

---

## User Preferences

- Language: Urdu/Hindi mixed (Hinglish) — user communicates in Hinglish
- No demo/mock server — Firebase only for the web app
- Dark futuristic UI — deep space background, cyan primary, purple accent
- All API keys should come from user's own accounts
- GitHub: push using Contents API (not git CLI)
