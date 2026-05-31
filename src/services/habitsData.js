/**
 * habitsData.js — Firestore service for habits + check-ins.
 *
 * Schema:
 *   users/{uid}/habits/{id}
 *     { name, emoji, color, frequency: 'daily' | 'weekdays' | 'weekly',
 *       target: number (per period), targetUnit: string,
 *       active: boolean, createdAt, updatedAt }
 *
 *   users/{uid}/habits/{habitId}/checkins/{yyyy-mm-dd}
 *     { value: number, note: string, completedAt }
 *
 * Streak: consecutive days back from today with value > 0.
 */

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";

function requireUid() {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("Sign in required.");
  return uid;
}

function habitsCol() {
  return collection(db, "users", requireUid(), "habits");
}
function habitDoc(id) {
  return doc(db, "users", requireUid(), "habits", id);
}
function checkinsCol(habitId) {
  return collection(db, "users", requireUid(), "habits", habitId, "checkins");
}
function checkinDoc(habitId, dateKey) {
  return doc(db, "users", requireUid(), "habits", habitId, "checkins", dateKey);
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function subscribeHabits(onData, onError) {
  const q = query(habitsCol(), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

export async function addHabit(habit) {
  const now = serverTimestamp();
  await addDoc(habitsCol(), {
    name: (habit.name || "").trim(),
    emoji: habit.emoji || "✅",
    color: habit.color || "teal",
    frequency: habit.frequency || "daily",
    target: Number(habit.target) || 1,
    targetUnit: habit.targetUnit || "",
    active: habit.active !== false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateHabit(id, patch) {
  await updateDoc(habitDoc(id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteHabit(id) {
  await deleteDoc(habitDoc(id));
}

/**
 * Check in for a habit on a given date.
 * value = 0 clears (deletes the check-in).
 */
export async function checkInHabit(habitId, dateKey, value = 1, note = "") {
  const ref = checkinDoc(habitId, dateKey);
  if (!value || value <= 0) {
    await deleteDoc(ref);
    return;
  }
  await setDoc(ref, {
    date: dateKey,
    value: Number(value),
    note: note || "",
    completedAt: serverTimestamp(),
  });
}

export function subscribeCheckinsForHabit(habitId, days, onData, onError) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = todayKey(since);
  const q = query(
    checkinsCol(habitId),
    where("date", ">=", sinceKey),
    orderBy("date", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ date: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

/**
 * Compute streak (consecutive days back from today with value > 0).
 * Pass an array of {date, value} sorted desc by date.
 */
export function computeStreak(checkins) {
  if (!checkins?.length) return 0;
  const map = new Map(checkins.map((c) => [c.date, c.value]));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    if ((map.get(key) || 0) > 0) streak++;
    else if (i === 0)
      continue; // grace for today not done yet
    else break;
  }
  return streak;
}

/**
 * Fetch the last 30 days of check-ins for ALL habits via collectionGroup.
 * Returns { habitId: [{date, value}, ...] }.
 */
export async function fetchAllRecentCheckins(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = todayKey(since);
  const uid = requireUid();
  // List habits, then fetch each habit's recent checkins in parallel.
  const habitsSnap = await getDocs(habitsCol());
  const habitIds = habitsSnap.docs.map((d) => d.id);
  const results = await Promise.all(
    habitIds.map(async (id) => {
      const q = query(
        collection(db, "users", uid, "habits", id, "checkins"),
        where("date", ">=", sinceKey),
      );
      const snap = await getDocs(q);
      return [
        id,
        snap.docs
          .map((d) => ({ date: d.id, ...d.data() }))
          .sort((a, b) => (a.date < b.date ? 1 : -1)),
      ];
    }),
  );
  return Object.fromEntries(results);
}
