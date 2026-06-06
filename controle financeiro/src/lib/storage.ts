import type { UserProfile } from "../types";

const DB_NAME = "controle-financeiro-db";
const DB_VERSION = 1;
const STORE = "profiles";
const FALLBACK_KEY = "controle-financeiro-profiles";

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB indisponível"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

const runStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
) => {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const readFallback = (): UserProfile[] => {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || "[]") as UserProfile[];
  } catch {
    return [];
  }
};

const writeFallback = (profiles: UserProfile[]) => {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(profiles));
};

export const profileStorage = {
  async list() {
    try {
      return await runStore<UserProfile[]>("readonly", (store) => store.getAll());
    } catch {
      return readFallback();
    }
  },

  async get(id: string) {
    try {
      return await runStore<UserProfile | undefined>("readonly", (store) => store.get(id));
    } catch {
      return readFallback().find((profile) => profile.id === id);
    }
  },

  async save(profile: UserProfile) {
    try {
      await runStore<IDBValidKey>("readwrite", (store) => store.put(profile));
    } catch {
      const profiles = readFallback().filter((item) => item.id !== profile.id);
      profiles.push(profile);
      writeFallback(profiles);
    }
  },

  async remove(id: string) {
    try {
      await runStore<undefined>("readwrite", (store) => store.delete(id));
    } catch {
      writeFallback(readFallback().filter((profile) => profile.id !== id));
    }
  },

  async clear() {
    try {
      await runStore<undefined>("readwrite", (store) => store.clear());
    } catch {
      writeFallback([]);
    }
  }
};
