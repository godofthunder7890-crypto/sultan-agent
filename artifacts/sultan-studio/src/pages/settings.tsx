import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle, XCircle, Github, Cpu, Zap, Bot } from "lucide-react";
import { isProviderConfigured } from "@/lib/ai";
import { isGitHubConfigured } from "@/lib/github";

interface KeyField {
  key: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  helperText: string;
}

const KEY_FIELDS: KeyField[] = [
  {
    key: "openaiApiKey",
    label: "OpenAI API Key",
    placeholder: "sk-...",
    icon: <Bot size={16} />,
    helperText: "Get your key at platform.openai.com — enables GPT-4o",
  },
  {
    key: "openrouterApiKey",
    label: "OpenRouter API Key",
    placeholder: "sk-or-v1-...",
    icon: <Zap size={16} />,
    helperText: "Get your key at openrouter.ai — access DeepSeek, Claude, and 100+ models",
  },
  {
    key: "groqApiKey",
    label: "Groq API Key",
    placeholder: "gsk_...",
    icon: <Zap size={16} />,
    helperText: "Get your key at console.groq.com — free tier available",
  },
  {
    key: "geminiApiKey",
    label: "Gemini API Key",
    placeholder: "AIza...",
    icon: <Bot size={16} />,
    helperText: "Get your key at aistudio.google.com — free tier available",
  },
  {
    key: "anthropicApiKey",
    label: "Anthropic API Key",
    placeholder: "sk-ant-...",
    icon: <Cpu size={16} />,
    helperText: "Get your key at console.anthropic.com — requires credits",
  },
  {
    key: "githubToken",
    label: "GitHub Personal Access Token",
    placeholder: "ghp_...",
    icon: <Github size={16} />,
    helperText: "Needs repo scope — github.com/settings/tokens",
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded: Record<string, string> = {};
    for (const f of KEY_FIELDS) {
      loaded[f.key] = localStorage.getItem(f.key) || "";
    }
    setValues(loaded);
  }, []);

  function handleSave() {
    for (const f of KEY_FIELDS) {
      const val = values[f.key]?.trim() || "";
      if (val) {
        localStorage.setItem(f.key, val);
      } else {
        localStorage.removeItem(f.key);
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function toggleVisible(key: string) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }

  const groqOk = isProviderConfigured("groq");
  const geminiOk = isProviderConfigured("gemini");
  const anthropicOk = isProviderConfigured("anthropic");
  const githubOk = isGitHubConfigured();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="h-12 border-b border-border flex items-center px-4 gap-4">
        <Link href="/projects" data-testid="link-back-projects">
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="button-back">
            <ArrowLeft size={14} />
            Back
          </button>
        </Link>
        <span className="text-sm font-medium">Settings</span>
        <div className="ml-auto flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle size={12} /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
            data-testid="button-save-settings"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Status overview */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Provider Status</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "OpenAI", ok: isProviderConfigured("openai") },
              { label: "OpenRouter", ok: isProviderConfigured("openrouter") },
              { label: "Groq", ok: groqOk },
              { label: "Gemini", ok: geminiOk },
              { label: "Anthropic", ok: anthropicOk },
              { label: "GitHub", ok: githubOk },
            ].map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-card text-sm"
                data-testid={`status-provider-${p.label.toLowerCase()}`}
              >
                {p.ok ? (
                  <CheckCircle size={14} className="text-green-400 shrink-0" />
                ) : (
                  <XCircle size={14} className="text-muted-foreground shrink-0" />
                )}
                <span className={p.ok ? "text-foreground" : "text-muted-foreground"}>
                  {p.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {p.ok ? "Active" : "Not set"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key fields */}
        <div className="space-y-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">API Keys</h2>
          {KEY_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label
                htmlFor={`input-${f.key}`}
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <span className="text-primary">{f.icon}</span>
                {f.label}
              </label>
              <div className="relative">
                <input
                  id={`input-${f.key}`}
                  data-testid={`input-${f.key}`}
                  type={visible[f.key] ? "text" : "password"}
                  value={values[f.key] || ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 pr-10 bg-card border border-border rounded text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => toggleVisible(f.key)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`button-toggle-${f.key}`}
                >
                  {visible[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{f.helperText}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Keys are stored in your browser's localStorage and never sent to any server. All AI requests go directly from your browser to the provider.
          </p>
        </div>
      </div>
    </div>
  );
}
