import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface Project {
  id: string;
  name: string;
  githubRepo: string;
  description: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  updatedAt: Timestamp | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model: string;
  timestamp: Timestamp | null;
}

export async function getProjects(): Promise<Project[]> {
  const q = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
}

export async function createProject(data: {
  name: string;
  githubRepo: string;
  description: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "projects"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id">>
): Promise<void> {
  await updateDoc(doc(db, "projects", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  const filesSnap = await getDocs(collection(db, "projects", id, "files"));
  for (const f of filesSnap.docs) await deleteDoc(f.ref);
  const msgsSnap = await getDocs(collection(db, "projects", id, "messages"));
  for (const m of msgsSnap.docs) await deleteDoc(m.ref);
  await deleteDoc(doc(db, "projects", id));
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const q = query(
    collection(db, "projects", projectId, "files"),
    orderBy("path", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectFile));
}

export async function saveFile(
  projectId: string,
  fileId: string | null,
  data: { name: string; path: string; content: string; language: string }
): Promise<string> {
  if (fileId) {
    await setDoc(
      doc(db, "projects", projectId, "files", fileId),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return fileId;
  } else {
    const ref = await addDoc(collection(db, "projects", projectId, "files"), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }
}

export async function deleteFile(
  projectId: string,
  fileId: string
): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId, "files", fileId));
}

export async function getChatMessages(
  projectId: string
): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "projects", projectId, "messages"),
    orderBy("timestamp", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
}

export async function saveChatMessage(
  projectId: string,
  data: { role: "user" | "assistant"; content: string; model: string }
): Promise<string> {
  const ref = await addDoc(
    collection(db, "projects", projectId, "messages"),
    { ...data, timestamp: serverTimestamp() }
  );
  return ref.id;
}

export async function clearChatMessages(projectId: string): Promise<void> {
  const snap = await getDocs(
    collection(db, "projects", projectId, "messages")
  );
  for (const d of snap.docs) await deleteDoc(d.ref);
}

export function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "shell",
    bash: "shell",
    sql: "sql",
    xml: "xml",
    toml: "ini",
    env: "ini",
  };
  return map[ext] || "plaintext";
}
