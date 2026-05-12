import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Github,
  Settings,
  X,
  File,
  RotateCcw,
  ChevronDown,
  Loader2,
  UploadCloud,
  CheckCircle,
} from "lucide-react";
import {
  getProjectFiles,
  saveFile,
  deleteFile,
  getChatMessages,
  saveChatMessage,
  clearChatMessages,
  detectLanguage,
  ProjectFile,
  ChatMessage,
  Project,
  getProjects,
} from "@/lib/firebase";
import {
  streamCompletion,
  isProviderConfigured,
  PROVIDER_LABELS,
  AIProvider,
} from "@/lib/ai";
import { pushProjectToGitHub, isGitHubConfigured } from "@/lib/github";

const PROVIDERS: AIProvider[] = ["groq", "gemini", "anthropic", "openai", "openrouter"];

function CodeBlock({
  code,
  lang,
  onInsert,
}: {
  code: string;
  lang: string;
  onInsert: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="my-2 rounded border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-muted text-xs text-muted-foreground">
        <span className="font-mono">{lang || "code"}</span>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="hover:text-foreground transition-colors"
            data-testid="button-copy-code"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => onInsert(code)}
            className="hover:text-primary transition-colors"
            data-testid="button-insert-code"
          >
            Insert
          </button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono overflow-x-auto text-foreground bg-background scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseMessage(
  content: string,
  onInsert: (code: string) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match;
  let idx = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push(
        <span key={idx++} className="whitespace-pre-wrap">
          {content.slice(last, match.index)}
        </span>
      );
    }
    parts.push(
      <CodeBlock key={idx++} code={match[2].trim()} lang={match[1]} onInsert={onInsert} />
    );
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push(
      <span key={idx++} className="whitespace-pre-wrap">
        {content.slice(last)}
      </span>
    );
  }
  return parts;
}

export default function StudioPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id || "";

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const [provider, setProvider] = useState<AIProvider>("groq");
  const [providerOpen, setProviderOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingChat, setLoadingChat] = useState(true);
  const [pushState, setPushState] = useState<"idle" | "pushing" | "done" | "error">("idle");
  const [pushProgress, setPushProgress] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [showPushModal, setShowPushModal] = useState(false);
  const [rightWidth, setRightWidth] = useState(380);
  const [leftWidth, setLeftWidth] = useState(220);

  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = openFiles.find((f) => f.id === activeFileId) || null;

  useEffect(() => {
    if (!projectId) return;
    loadData();
  }, [projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuf]);

  async function loadData() {
    setLoadingFiles(true);
    setLoadingChat(true);
    try {
      const [ps, fs, ms] = await Promise.all([
        getProjects(),
        getProjectFiles(projectId),
        getChatMessages(projectId),
      ]);
      const found = ps.find((p) => p.id === projectId) || null;
      setProject(found);
      setFiles(fs);
      setMessages(ms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFiles(false);
      setLoadingChat(false);
    }
  }

  function openFile(f: ProjectFile) {
    setOpenFiles((prev) => {
      if (prev.find((x) => x.id === f.id)) return prev;
      return [...prev, f];
    });
    setActiveFileId(f.id);
  }

  function closeTab(id: string) {
    setOpenFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });
  }

  async function handleEditorChange(val: string | undefined) {
    if (!activeFile || val === undefined) return;
    const updated = { ...activeFile, content: val };
    setOpenFiles((prev) => prev.map((f) => (f.id === activeFile.id ? updated : f)));
    setFiles((prev) => prev.map((f) => (f.id === activeFile.id ? updated : f)));
    await saveFile(projectId, activeFile.id, {
      name: updated.name,
      path: updated.path,
      content: val,
      language: updated.language,
    });
  }

  async function createNewFile() {
    const name = newFileName.trim();
    if (!name) return;
    const lang = detectLanguage(name);
    const id = await saveFile(projectId, null, {
      name,
      path: name,
      content: "",
      language: lang,
    });
    const newFile: ProjectFile = {
      id,
      name,
      path: name,
      content: "",
      language: lang,
      updatedAt: null,
    };
    setFiles((prev) => [...prev, newFile]);
    openFile(newFile);
    setNewFileName("");
    setShowNewFile(false);
  }

  async function handleDeleteFile(fileId: string) {
    await deleteFile(projectId, fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    closeTab(fileId);
  }

  function insertToEditor(code: string) {
    if (!activeFile) return;
    const newContent = activeFile.content
      ? activeFile.content + "\n" + code
      : code;
    handleEditorChange(newContent);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;
    if (!isProviderConfigured(provider)) {
      alert(`No API key for ${provider}. Go to Settings to add it.`);
      return;
    }

    setInput("");
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      model: provider,
      timestamp: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    await saveChatMessage(projectId, { role: "user", content: text, model: provider });

    const systemPrompt =
      `You are a coding assistant inside Sultan Studio. Be concise and helpful. ` +
      (activeFile
        ? `Current file: ${activeFile.name} (${activeFile.language}).\n\nFile content:\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``
        : "No file is currently open.");

    const history = messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    setStreaming(true);
    setStreamBuf("");
    abortRef.current = new AbortController();

    let full = "";
    try {
      await streamCompletion(
        provider,
        [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: text }],
        (chunk) => {
          full += chunk;
          setStreamBuf(full);
        },
        abortRef.current.signal
      );
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        full += `\n\n[Error: ${(e as Error).message}]`;
        setStreamBuf(full);
      }
    }

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: full,
      model: provider,
      timestamp: null,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setStreamBuf("");
    setStreaming(false);
    await saveChatMessage(projectId, { role: "assistant", content: full, model: provider });
  }

  async function handleClearChat() {
    await clearChatMessages(projectId);
    setMessages([]);
  }

  async function handlePush() {
    if (!project?.githubRepo) return;
    setPushState("pushing");
    try {
      const githubFiles = files.map((f) => ({ path: f.path, content: f.content }));
      await pushProjectToGitHub(
        project.githubRepo,
        githubFiles,
        commitMsg || `Update from Sultan Studio`,
        (done, total) => setPushProgress(`${done}/${total} files`)
      );
      setPushState("done");
      setTimeout(() => {
        setPushState("idle");
        setShowPushModal(false);
        setCommitMsg("");
        setPushProgress("");
      }, 2000);
    } catch (e: unknown) {
      console.error(e);
      setPushState("error");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top bar */}
      <header className="h-10 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Link href="/projects" data-testid="link-back">
          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid="button-back">
            <ArrowLeft size={14} />
          </button>
        </Link>
        <span className="font-mono text-xs font-semibold text-primary text-glow-cyan">Sultan Studio</span>
        {project && (
          <>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs font-medium text-foreground">{project.name}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {project?.githubRepo && isGitHubConfigured() && (
            <button
              onClick={() => setShowPushModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="button-push-github"
            >
              <Github size={12} />
              Push
            </button>
          )}
          <Link href="/settings" data-testid="link-settings">
            <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid="button-settings">
              <Settings size={14} />
            </button>
          </Link>
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File tree */}
        <div
          className="flex flex-col border-r border-border bg-sidebar shrink-0 overflow-hidden"
          style={{ width: leftWidth }}
        >
          <div className="h-8 flex items-center justify-between px-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</span>
            <button
              onClick={() => setShowNewFile(!showNewFile)}
              className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-new-file"
            >
              <Plus size={13} />
            </button>
          </div>

          {showNewFile && (
            <div className="px-2 py-1.5 border-b border-border">
              <input
                autoFocus
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createNewFile();
                  if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
                }}
                placeholder="filename.ts"
                className="w-full px-2 py-1 bg-background border border-primary/50 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="input-new-filename"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
            {loadingFiles ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
            ) : files.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                <p>No files yet.</p>
                <p>Click + to create one</p>
              </div>
            ) : (
              files.map((f) => (
                <div
                  key={f.id}
                  className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                    activeFileId === f.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => openFile(f)}
                  data-testid={`file-item-${f.id}`}
                >
                  <File size={12} className="shrink-0" />
                  <span className="text-xs font-mono truncate flex-1">{f.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(f.id); }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:text-destructive transition-all"
                    data-testid={`button-delete-file-${f.id}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* File tabs */}
          {openFiles.length > 0 && (
            <div className="h-8 flex items-center border-b border-border overflow-x-auto shrink-0 scrollbar-thin">
              {openFiles.map((f) => (
                <div
                  key={f.id}
                  className={`group flex items-center gap-1.5 px-3 h-full border-r border-border cursor-pointer shrink-0 transition-colors ${
                    f.id === activeFileId
                      ? "bg-background text-foreground border-b-0"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveFileId(f.id)}
                  data-testid={`tab-${f.id}`}
                >
                  <span className="text-xs font-mono">{f.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(f.id); }}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    data-testid={`button-close-tab-${f.id}`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <Editor
                key={activeFile.id}
                value={activeFile.content}
                language={activeFile.language}
                theme="vs-dark"
                onChange={handleEditorChange}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  padding: { top: 12 },
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <File size={32} strokeWidth={1} />
                <p className="text-sm">Select a file to start editing</p>
                <button
                  onClick={() => setShowNewFile(true)}
                  className="text-xs text-primary hover:underline"
                  data-testid="button-create-file-empty"
                >
                  Or create a new file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Chat */}
        <div
          className="flex flex-col border-l border-border bg-sidebar shrink-0"
          style={{ width: rightWidth }}
        >
          {/* Chat header */}
          <div className="h-8 flex items-center justify-between px-3 border-b border-border">
            <div className="relative">
              <button
                onClick={() => setProviderOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors"
                data-testid="button-provider-selector"
              >
                <span className="font-medium">{PROVIDER_LABELS[provider]}</span>
                <ChevronDown size={11} />
              </button>
              {providerOpen && (
                <div className="absolute top-7 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setProvider(p); setProviderOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                        p === provider ? "text-primary" : "text-foreground"
                      } ${!isProviderConfigured(p) ? "opacity-40" : ""}`}
                      data-testid={`button-provider-${p}`}
                    >
                      {PROVIDER_LABELS[p]}
                      {!isProviderConfigured(p) && (
                        <span className="ml-auto text-muted-foreground">No key</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleClearChat}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Clear chat"
              data-testid="button-clear-chat"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
            {loadingChat ? (
              <div className="text-xs text-muted-foreground text-center py-4">Loading...</div>
            ) : messages.length === 0 && !streamBuf ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                <p>Ask me anything about your code.</p>
                <p className="mt-1 opacity-60">Ctrl+Enter to send</p>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`${
                      m.role === "user"
                        ? "ml-4 bg-primary/10 border border-primary/20 text-foreground"
                        : "mr-4 bg-card border border-border text-foreground"
                    } rounded-lg px-3 py-2 text-xs leading-relaxed`}
                    data-testid={`message-${m.id}`}
                  >
                    {m.role === "assistant"
                      ? parseMessage(m.content, insertToEditor)
                      : <span className="whitespace-pre-wrap">{m.content}</span>}
                  </div>
                ))}
                {streamBuf && (
                  <div className="mr-4 bg-card border border-primary/30 text-foreground rounded-lg px-3 py-2 text-xs leading-relaxed">
                    {parseMessage(streamBuf, insertToEditor)}
                    <span className="inline-block w-1 h-3 bg-primary ml-0.5 animate-pulse" />
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your code... (Ctrl+Enter)"
                rows={3}
                className="w-full resize-none px-3 py-2 pr-8 bg-background border border-border rounded text-xs font-sans focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors scrollbar-thin"
                data-testid="input-chat"
              />
              <button
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                className="absolute right-2 bottom-2 p-1 rounded text-primary hover:bg-primary/10 disabled:opacity-30 transition-all"
                data-testid="button-send"
              >
                {streaming ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Push Modal */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <Github size={14} />
              Push to GitHub
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {project?.githubRepo} · {files.length} file{files.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Update from Sultan Studio"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                data-testid="input-commit-message"
              />

              {pushState === "pushing" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" />
                  Pushing {pushProgress}...
                </p>
              )}
              {pushState === "done" && (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle size={11} />
                  Pushed successfully
                </p>
              )}
              {pushState === "error" && (
                <p className="text-xs text-destructive">
                  Push failed. Check your GitHub token and repo name.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => { setShowPushModal(false); setPushState("idle"); }}
                className="flex-1 px-3 py-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                data-testid="button-cancel-push"
              >
                Cancel
              </button>
              <button
                onClick={handlePush}
                disabled={pushState === "pushing"}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 glow-cyan"
                data-testid="button-confirm-push"
              >
                <UploadCloud size={13} />
                Push
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
