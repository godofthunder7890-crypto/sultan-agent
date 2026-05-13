import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { COL, fsDelete, fsGet, fsGetAll, fsSet } from "@/lib/firebase";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  model?: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  description: string;
  amount: number;
  status: "planning" | "active" | "completed" | "on-hold";
  date: string;
};

export type SmmOrder = {
  id: string;
  panel: string;
  service: string;
  quantity: number;
  unitPrice: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  date: string;
};

export type Memory = {
  id: string;
  text: string;
  createdAt: number;
  tags: string[];
};

export type Settings = {
  selectedModel: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  userName: string;
  groqKey: string;
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  jarvixPersonality: string;
  openaiKey: string;
  geminiKey: string;
  serperKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramAiReply: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  selectedModel: "llama-3.3-70b-versatile",
  githubToken: "",
  githubOwner: "",
  githubRepo: "sultan-agent",
  userName: "Sultan",
  groqKey: "",
  elevenlabsApiKey: "",
  elevenlabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
  jarvixPersonality: "JARVIS",
  openaiKey: "",
  geminiKey: "",
  serperKey: "",
  telegramBotToken: "",
  telegramChatId: "",
  telegramAiReply: false,
};

export const MODELS = [
  // Groq — Free, Ultra Fast
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Fast)", provider: "Groq" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq" },
  { id: "gemma2-9b-it", name: "Gemma2 9B", provider: "Groq" },
  // OpenAI
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  // Google Gemini
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "Gemini" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Gemini" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Gemini" },
];

type AppContextType = {
  messages: Message[];
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  clearMessages: () => void;
  projects: Project[];
  addProject: (p: Omit<Project, "id" | "date">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  orders: SmmOrder[];
  addOrder: (o: Omit<SmmOrder, "id" | "date">) => void;
  updateOrder: (id: string, o: Partial<SmmOrder>) => void;
  deleteOrder: (id: string) => void;
  memory: Memory[];
  addMemory: (text: string, tags?: string[]) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  searchMemory: (query: string) => Memory[];
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  models: typeof MODELS;
  pushToGitHub: (data: object, path: string) => Promise<boolean>;
  firebaseReady: boolean;
};

const AppContext = createContext<AppContextType | null>(null);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function safeB64(str: string): string {
  // btoa is available in React Native globally; handles UTF-8 via encodeURIComponent
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    // Manual UTF-8 to base64 fallback
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 128) bytes.push(c);
      else if (c < 2048) bytes.push((c >> 6) | 192, (c & 63) | 128);
      else bytes.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
    }
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
      out +=
        CHARS[a >> 2] +
        CHARS[((a & 3) << 4) | (b >> 4)] +
        (i + 1 < bytes.length ? CHARS[((b & 15) << 2) | (c >> 6)] : "=") +
        (i + 2 < bytes.length ? CHARS[c & 63] : "=");
    }
    return out;
  }
}

async function localLoad<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function localSave(key: string, value: unknown) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [memory, setMemory] = useState<Memory[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Load: local cache first, then Firebase sync
  useEffect(() => {
    (async () => {
      // 1. Load from AsyncStorage immediately (fast)
      const [m, p, o, s, mem] = await Promise.all([
        localLoad<Message[]>("messages", []),
        localLoad<Project[]>("projects", []),
        localLoad<SmmOrder[]>("orders", []),
        localLoad<Settings>("settings", DEFAULT_SETTINGS),
        localLoad<Memory[]>("memory", []),
      ]);
      setMessages(m);
      setProjects(p);
      setOrders(o);
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setMemory(mem);

      // 2. Sync from Firebase (background)
      try {
        const [fbMessages, fbProjects, fbOrders, fbMemory] = await Promise.all([
          fsGetAll<Message>(COL.MESSAGES),
          fsGetAll<Project>(COL.PROJECTS),
          fsGetAll<SmmOrder>(COL.ORDERS),
          fsGetAll<Memory>(COL.MEMORY),
        ]);

        if (fbMessages.length > 0) {
          // Only overwrite local if Firebase has newer data
          const lastFbTs = Math.max(...fbMessages.map(msg => msg.timestamp));
          const lastLocalTs = m.length > 0 ? Math.max(...m.map(msg => msg.timestamp)) : 0;
          if (lastFbTs >= lastLocalTs) {
            const sorted = fbMessages.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(sorted);
            localSave("messages", sorted);
          }
        }
        if (fbProjects.length > 0) {
          setProjects(fbProjects);
          localSave("projects", fbProjects);
        }
        if (fbOrders.length > 0) {
          setOrders(fbOrders);
          localSave("orders", fbOrders);
        }
        if (fbMemory.length > 0) {
          const sorted = fbMemory.sort((a, b) => b.createdAt - a.createdAt);
          setMemory(sorted);
          localSave("memory", sorted);
        }

        // Load settings from Firebase
        const fbSettings = await fsGet<Settings>(COL.SETTINGS, "main");
        if (fbSettings) {
          const merged = { ...DEFAULT_SETTINGS, ...fbSettings };
          setSettings(merged);
          localSave("settings", merged);
        }

        setFirebaseReady(true);
      } catch (e) {
        console.warn("[Firebase] Sync failed, using local data:", e);
        setFirebaseReady(false);
      }
    })();
  }, []);

  // ── Messages ─────────────────────────────────────
  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const newMsg: Message = { ...msg, id: genId(), timestamp: Date.now() };
    setMessages(prev => {
      const updated = [...prev, newMsg];
      localSave("messages", updated);
      fsSet(COL.MESSAGES, newMsg.id, newMsg as unknown as Record<string, unknown>);
      return updated;
    });
  }, []);

  const clearMessages = useCallback(async () => {
    // Delete from Firebase
    const snap = messages;
    for (const m of snap) {
      await fsDelete(COL.MESSAGES, m.id);
    }
    setMessages([]);
    localSave("messages", []);
  }, [messages]);

  // ── Projects ─────────────────────────────────────
  const addProject = useCallback((p: Omit<Project, "id" | "date">) => {
    const newP: Project = { ...p, id: genId(), date: new Date().toISOString().split("T")[0] };
    setProjects(prev => {
      const updated = [newP, ...prev];
      localSave("projects", updated);
      fsSet(COL.PROJECTS, newP.id, newP as unknown as Record<string, unknown>);
      return updated;
    });
  }, []);

  const updateProject = useCallback((id: string, p: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(x => (x.id === id ? { ...x, ...p } : x));
      localSave("projects", updated);
      const proj = updated.find(x => x.id === id);
      if (proj) fsSet(COL.PROJECTS, id, proj as unknown as Record<string, unknown>);
      return updated;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(x => x.id !== id);
      localSave("projects", updated);
      fsDelete(COL.PROJECTS, id);
      return updated;
    });
  }, []);

  // ── Orders ───────────────────────────────────────
  const addOrder = useCallback((o: Omit<SmmOrder, "id" | "date">) => {
    const newO: SmmOrder = { ...o, id: genId(), date: new Date().toISOString().split("T")[0] };
    setOrders(prev => {
      const updated = [newO, ...prev];
      localSave("orders", updated);
      fsSet(COL.ORDERS, newO.id, newO as unknown as Record<string, unknown>);
      return updated;
    });
  }, []);

  const updateOrder = useCallback((id: string, o: Partial<SmmOrder>) => {
    setOrders(prev => {
      const updated = prev.map(x => (x.id === id ? { ...x, ...o } : x));
      localSave("orders", updated);
      const order = updated.find(x => x.id === id);
      if (order) fsSet(COL.ORDERS, id, order as unknown as Record<string, unknown>);
      return updated;
    });
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => {
      const updated = prev.filter(x => x.id !== id);
      localSave("orders", updated);
      fsDelete(COL.ORDERS, id);
      return updated;
    });
  }, []);

  // ── Memory ───────────────────────────────────────
  const addMemory = useCallback(async (text: string, tags: string[] = []) => {
    const newMem: Memory = { id: genId(), text, createdAt: Date.now(), tags };
    setMemory(prev => {
      const updated = [newMem, ...prev];
      localSave("memory", updated);
      return updated;
    });
    await fsSet(COL.MEMORY, newMem.id, newMem as unknown as Record<string, unknown>);
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    setMemory(prev => {
      const updated = prev.filter(x => x.id !== id);
      localSave("memory", updated);
      return updated;
    });
    await fsDelete(COL.MEMORY, id);
  }, []);

  const searchMemory = useCallback((query: string): Memory[] => {
    if (!query.trim()) return memory;
    const q = query.toLowerCase();
    return memory.filter(m => m.text.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)));
  }, [memory]);

  // ── Settings ─────────────────────────────────────
  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...s };
      localSave("settings", updated);
      fsSet(COL.SETTINGS, "main", updated as unknown as Record<string, unknown>);
      return updated;
    });
  }, []);

  // ── GitHub Sync ──────────────────────────────────
  const pushToGitHub = useCallback(async (data: object, filePath: string): Promise<boolean> => {
    if (!settings.githubToken || !settings.githubOwner) return false;
    try {
      const content = safeB64(JSON.stringify(data, null, 2));
      const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${filePath}`;
      const existing = await fetch(url, {
        headers: { Authorization: `Bearer ${settings.githubToken}`, "User-Agent": "Sultan-Agent" },
      }).then(r => r.json());
      const body: Record<string, string> = {
        message: `Update ${filePath} — ${new Date().toLocaleString()}`,
        content,
      };
      if (existing.sha) body.sha = existing.sha;
      await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${settings.githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "Sultan-Agent",
        },
        body: JSON.stringify(body),
      });
      return true;
    } catch {
      return false;
    }
  }, [settings]);

  return (
    <AppContext.Provider
      value={{
        messages, addMessage, clearMessages,
        projects, addProject, updateProject, deleteProject,
        orders, addOrder, updateOrder, deleteOrder,
        memory, addMemory, deleteMemory, searchMemory,
        settings, updateSettings,
        models: MODELS,
        pushToGitHub,
        firebaseReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
