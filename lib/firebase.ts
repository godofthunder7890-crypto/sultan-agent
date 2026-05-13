import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBPQxmPvldjJ5Zt03E5i2xrrhFWpdpYd-s',
  authDomain: 'v11345.firebaseapp.com',
  projectId: 'v11345',
  databaseURL: 'https://v11345-default-rtdb.firebaseio.com',
  storageBucket: 'v11345.firebasestorage.app',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export const USER_ID = 'sultan';

export const COL = {
  MESSAGES: `users/${USER_ID}/messages`,
  PROJECTS: `users/${USER_ID}/projects`,
  ORDERS: `users/${USER_ID}/orders`,
  SETTINGS: `users/${USER_ID}/settings`,
  MEMORY: `users/${USER_ID}/memory`,
} as const;

export async function fsSet(col: string, id: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    await setDoc(doc(db, col, id), { ...data, _updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch (e) {
    console.warn('[Firebase] set error:', e);
    return false;
  }
}

export async function fsGet<T>(col: string, id: string): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, col, id));
    return snap.exists() ? (snap.data() as T) : null;
  } catch {
    return null;
  }
}

export async function fsGetAll<T>(col: string): Promise<(T & { id: string })[]> {
  try {
    const snap = await getDocs(collection(db, col));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as T & { id: string }));
  } catch {
    return [];
  }
}

export async function fsDelete(col: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, col, id));
    return true;
  } catch {
    return false;
  }
}
