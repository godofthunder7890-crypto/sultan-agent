import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  telegramBotToken: "",
  telegramChatId: "",
  telegramAiReply: false,
};

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Fast)", provider: "Groq" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq" },
  { id: "gemma2-9b-it", name: "Gemma2 9B", provider: "Groq" },
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
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  models: typeof MODELS;
  pushToGitHub: (data: object, path: string) => Promise<boolean>;
};

const AppContext = createContext<AppContextType | null>(null);

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const [m, p, o, s] = await Promise.all([
          AsyncStorage.getItem("messages"),
          AsyncStorage.getItem("projects"),
          AsyncStorage.getItem("orders"),
          AsyncStorage.getItem("settings"),
        ]);
        if (m) setMessages(JSON.parse(m));
        if (p) setProjects(JSON.parse(p));
        if (o) setOrders(JSON.parse(o));
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
      } catch {}
    })();
  }, []);

  const save = useCallback(async (key: string, value: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }, []);

  const addMessage = useCallback(
    (msg: Omit<Message, "id" | "timestamp">) => {
      const newMsg: Message = { ...msg, id: genId(), timestamp: Date.now() };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        save("messages", updated);
        return updated;
      });
    },
    [save]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    save("messages", []);
  }, [save]);

  const addProject = useCallback(
    (p: Omit<Project, "id" | "date">) => {
      const newP: Project = {
        ...p,
        id: genId(),
        date: new Date().toISOString().split("T")[0],
      };
      setProjects((prev) => {
        const updated = [newP, ...prev];
        save("projects", updated);
        return updated;
      });
    },
    [save]
  );

  const updateProject = useCallback(
    (id: string, p: Partial<Project>) => {
      setProjects((prev) => {
        const updated = prev.map((x) => (x.id === id ? { ...x, ...p } : x));
        save("projects", updated);
        return updated;
      });
    },
    [save]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const updated = prev.filter((x) => x.id !== id);
        save("projects", updated);
        return updated;
      });
    },
    [save]
  );

  const addOrder = useCallback(
    (o: Omit<SmmOrder, "id" | "date">) => {
      const newO: SmmOrder = {
        ...o,
        id: genId(),
        date: new Date().toISOString().split("T")[0],
      };
      setOrders((prev) => {
        const updated = [newO, ...prev];
        save("orders", updated);
        return updated;
      });
    },
    [save]
  );

  const updateOrder = useCallback(
    (id: string, o: Partial<SmmOrder>) => {
      setOrders((prev) => {
        const updated = prev.map((x) => (x.id === id ? { ...x, ...o } : x));
        save("orders", updated);
        return updated;
      });
    },
    [save]
  );

  const deleteOrder = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const updated = prev.filter((x) => x.id !== id);
        save("orders", updated);
        return updated;
      });
    },
    [save]
  );

  const updateSettings = useCallback(
    (s: Partial<Settings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...s };
        save("settings", updated);
        return updated;
      });
    },
    [save]
  );

  const pushToGitHub = useCallback(
    async (data: object, filePath: string): Promise<boolean> => {
      if (!settings.githubToken || !settings.githubOwner) return false;
      try {
        const content = btoa(
          unescape(encodeURIComponent(JSON.stringify(data, null, 2)))
        );
        const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${filePath}`;
        const existing = await fetch(url, {
          headers: { Authorization: `Bearer ${settings.githubToken}` },
        }).then((r) => r.json());
        await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${settings.githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Update ${filePath} - ${new Date().toLocaleString()}`,
            content,
            sha: existing.sha,
          }),
        });
        return true;
      } catch {
        return false;
      }
    },
    [settings]
  );

  return (
    <AppContext.Provider
      value={{
        messages,
        addMessage,
        clearMessages,
        projects,
        addProject,
        updateProject,
        deleteProject,
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        settings,
        updateSettings,
        models: MODELS,
        pushToGitHub,
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
