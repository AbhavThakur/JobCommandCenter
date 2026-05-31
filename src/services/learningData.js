/**
 * learningData.js — Firestore service for the Learning section.
 *
 * Schema:
 *   users/{uid}/learning/{id}    — library items: books, courses, papers
 *     { kind: 'book' | 'course' | 'paper',
 *       title, author, url, status: 'todo' | 'active' | 'done' | 'paused',
 *       progress: 0..100, rating: 0..5 | null,
 *       tags: string[], notes: string,
 *       startedAt, completedAt, createdAt, updatedAt }
 *
 *   users/{uid}/flashcards/{id}  — SM-2 spaced repetition cards
 *     { front, back, deck: string,
 *       interval: number (days), ease: number (default 2.5),
 *       reps: number, lapses: number,
 *       due: ISO date string (yyyy-mm-dd),
 *       lastReviewed: ISO timestamp | null,
 *       createdAt, updatedAt }
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function requireFirestore() {
  if (!db) throw new Error("Firebase is not configured for learning data.");
  return db;
}

function requireUid() {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("Sign in required.");
  return uid;
}

function userCol(name) {
  return collection(requireFirestore(), "users", requireUid(), name);
}

function userDoc(name, id) {
  return doc(requireFirestore(), "users", requireUid(), name, id);
}

function withId(snap) {
  return { id: snap.id, ...snap.data() };
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// ─── Library items ────────────────────────────────────────────────────────

export function subscribeLearningItems(onData, onError) {
  const q = query(userCol("learning"), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(withId)),
    (err) => onError?.(err),
  );
}

export async function addLearningItem(item) {
  const now = serverTimestamp();
  const payload = {
    kind: item.kind || "book",
    title: (item.title || "").trim(),
    author: (item.author || "").trim(),
    url: (item.url || "").trim(),
    status: item.status || "todo",
    progress: Number(item.progress) || 0,
    rating: item.rating ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    notes: item.notes || "",
    startedAt: item.status === "active" ? now : null,
    completedAt: item.status === "done" ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(userCol("learning"), payload);
  return ref.id;
}

export async function updateLearningItem(id, patch) {
  const next = { ...patch, updatedAt: serverTimestamp() };
  if (patch.status === "active" && !patch.startedAt) {
    next.startedAt = serverTimestamp();
  }
  if (patch.status === "done" && !patch.completedAt) {
    next.completedAt = serverTimestamp();
    next.progress = 100;
  }
  await updateDoc(userDoc("learning", id), next);
}

export async function deleteLearningItem(id) {
  await deleteDoc(userDoc("learning", id));
}

// ─── Flashcards (SM-2 spaced repetition) ─────────────────────────────────

/**
 * SM-2 algorithm (simplified).
 * quality: 0=again, 3=hard, 4=good, 5=easy
 * Returns { interval, ease, reps, lapses, due }
 */
export function scheduleNext(card, quality) {
  let { interval = 0, ease = 2.5, reps = 0, lapses = 0 } = card;

  if (quality < 3) {
    reps = 0;
    lapses += 1;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
    ease = Math.max(
      1.3,
      ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);
  return {
    interval,
    ease: Number(ease.toFixed(2)),
    reps,
    lapses,
    due: todayKey(next),
  };
}

export function subscribeFlashcards(onData, onError) {
  const q = query(userCol("flashcards"), orderBy("due", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(withId)),
    (err) => onError?.(err),
  );
}

export async function addFlashcard(card) {
  const now = serverTimestamp();
  const payload = {
    front: (card.front || "").trim(),
    back: (card.back || "").trim(),
    deck: (card.deck || "default").trim(),
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    due: todayKey(),
    lastReviewed: null,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(userCol("flashcards"), payload);
  return ref.id;
}

export async function reviewFlashcard(card, quality) {
  const next = scheduleNext(card, quality);
  await updateDoc(userDoc("flashcards", card.id), {
    ...next,
    lastReviewed: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFlashcard(id) {
  await deleteDoc(userDoc("flashcards", id));
}

export function isDue(card, today = todayKey()) {
  return !card.due || card.due <= today;
}
