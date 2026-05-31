/**
 * cloudSync.js — Mirror localStorage `growthOS_*` keys to Firestore.
 *
 * Strategy: write-behind sync. On each localStorage write to a tracked key,
 * push to users/{uid}/clientState/{key}. On sign-in, hydrate localStorage
 * from Firestore (most-recent-write-wins, by updatedAt vs local stamp).
 *
 * No component code needs to change. Existing useLocalStorage hook keeps
 * working; we just intercept localStorage.setItem.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const TRACKED_PREFIX = "growthOS_";
const STAMP_KEY = "growthOS_cloudSync_stamp";
const DEBOUNCE_MS = 1200;

let installed = false;
let originalSetItem = null;
let originalRemoveItem = null;
let pending = new Map(); // key -> timeout id
let unsubAuth = null;
let unsubSnapshot = null;

function isTracked(key) {
  return typeof key === "string" && key.startsWith(TRACKED_PREFIX);
}

function uid() {
  return auth?.currentUser?.uid || null;
}

function stateDoc(key) {
  return doc(db, "users", uid(), "clientState", key);
}

function nowIso() {
  return new Date().toISOString();
}

function pushKey(key) {
  if (!uid() || !db) return;
  const value = localStorage.getItem(key);
  if (value === null) {
    setDoc(stateDoc(key), {
      deleted: true,
      updatedAt: serverTimestamp(),
      localStamp: nowIso(),
    }).catch(() => {});
    return;
  }
  setDoc(stateDoc(key), {
    value, // store raw JSON string
    deleted: false,
    updatedAt: serverTimestamp(),
    localStamp: nowIso(),
  }).catch(() => {});
}

function schedulePush(key) {
  if (pending.has(key)) clearTimeout(pending.get(key));
  const t = setTimeout(() => {
    pending.delete(key);
    pushKey(key);
  }, DEBOUNCE_MS);
  pending.set(key, t);
}

/**
 * Hydrate localStorage from Firestore once on sign-in.
 * Conflict resolution: cloud wins if its localStamp is newer than what we
 * have locally (we track per-key stamps in a single hint doc).
 */
async function hydrateFromCloud() {
  if (!uid() || !db) return;
  try {
    const snap = await getDocs(collection(db, "users", uid(), "clientState"));
    let count = 0;
    snap.forEach((d) => {
      const data = d.data();
      const key = d.id;
      if (!isTracked(key)) return;
      const localStamp = localStorage.getItem(`${STAMP_KEY}:${key}`);
      const cloudStamp = data.localStamp;
      if (localStamp && cloudStamp && localStamp >= cloudStamp) return;
      if (data.deleted) {
        if (originalRemoveItem) originalRemoveItem.call(localStorage, key);
        else localStorage.removeItem(key);
      } else if (typeof data.value === "string") {
        if (originalSetItem)
          originalSetItem.call(localStorage, key, data.value);
        else localStorage.setItem(key, data.value);
      }
      if (cloudStamp) localStorage.setItem(`${STAMP_KEY}:${key}`, cloudStamp);
      // Dispatch a synthetic storage event so React hooks re-read.
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: data.deleted ? null : data.value,
        }),
      );
      count++;
    });
    if (count > 0) {
      // Notify the app: components using useLocalStorage need to re-read.
      window.dispatchEvent(
        new CustomEvent("cloudsync:hydrated", { detail: { count } }),
      );
    }
  } catch {
    /* offline or rules block — no-op */
  }
}

/**
 * Live-subscribe to cloud changes so other devices see updates.
 */
function subscribeRemote() {
  if (!uid() || !db || unsubSnapshot) return;
  unsubSnapshot = onSnapshot(
    collection(db, "users", uid(), "clientState"),
    (snap) => {
      let changed = 0;
      snap.docChanges().forEach((ch) => {
        const data = ch.doc.data();
        const key = ch.doc.id;
        if (!isTracked(key)) return;
        const localStamp = localStorage.getItem(`${STAMP_KEY}:${key}`);
        const cloudStamp = data.localStamp;
        if (!cloudStamp) return;
        if (localStamp && localStamp >= cloudStamp) return;
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: data.deleted ? null : data.value,
          }),
        );
        if (data.deleted) {
          if (originalRemoveItem) originalRemoveItem.call(localStorage, key);
        } else if (typeof data.value === "string") {
          if (originalSetItem)
            originalSetItem.call(localStorage, key, data.value);
        }
        localStorage.setItem(`${STAMP_KEY}:${key}`, cloudStamp);
        changed++;
      });
      if (changed > 0) {
        window.dispatchEvent(
          new CustomEvent("cloudsync:remote", { detail: { count: changed } }),
        );
      }
    },
    () => {},
  );
}

/**
 * Install the cloud sync layer. Call once at app start (after Firebase init).
 */
export function installCloudSync() {
  if (installed) return;
  installed = true;

  // Patch localStorage to intercept writes.
  originalSetItem = localStorage.setItem.bind(localStorage);
  originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = function patchedSetItem(key, value) {
    originalSetItem(key, value);
    if (isTracked(key)) {
      schedulePush(key);
      originalSetItem(`${STAMP_KEY}:${key}`, nowIso());
    }
  };
  localStorage.removeItem = function patchedRemoveItem(key) {
    originalRemoveItem(key);
    if (isTracked(key)) {
      schedulePush(key);
      originalSetItem(`${STAMP_KEY}:${key}`, nowIso());
    }
  };

  // React to auth changes.
  unsubAuth = auth?.onAuthStateChanged?.(async (u) => {
    if (unsubSnapshot) {
      unsubSnapshot();
      unsubSnapshot = null;
    }
    if (!u) return;
    await hydrateFromCloud();
    subscribeRemote();
  });
}

export function uninstallCloudSync() {
  if (!installed) return;
  if (unsubAuth) unsubAuth();
  if (unsubSnapshot) unsubSnapshot();
  if (originalSetItem) localStorage.setItem = originalSetItem;
  if (originalRemoveItem) localStorage.removeItem = originalRemoveItem;
  installed = false;
}

/**
 * Export all user data as a JSON blob (download).
 */
export async function exportEverything() {
  if (!uid() || !db) throw new Error("Sign in required.");
  const out = { exportedAt: nowIso(), clientState: {}, firestore: {} };
  // Local state mirror.
  const snap = await getDocs(collection(db, "users", uid(), "clientState"));
  snap.forEach((d) => {
    out.clientState[d.id] = d.data();
  });
  // Firestore root doc.
  const userSnap = await getDoc(doc(db, "users", uid()));
  if (userSnap.exists()) out.firestore.user = userSnap.data();
  // Subcollections we know about.
  for (const name of [
    "jobs",
    "pipeline",
    "searchRuns",
    "learning",
    "flashcards",
    "habits",
  ]) {
    const s = await getDocs(collection(db, "users", uid(), name));
    out.firestore[name] = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return out;
}
