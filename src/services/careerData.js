/**
 * careerData.js — Firestore service for the Career section.
 *
 * Schema:
 *   companies/{id}              — global, shared catalog
 *   users/{uid}/jobs/{id}       — per-user job entries
 *   users/{uid}/searchRuns/{id} — per-user async scan runs
 *   users/{uid}/pipeline/{id}   — per-user application tracker
 *   users/{uid}/reports/{id}    — per-user eval report metadata
 *
 * The worker (career-ops) uses firebase-admin and bypasses Firestore rules.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { DEFAULT_COMPANIES } from "../data/companies";
import seedCompaniesData from "../data/seedCompanies";

const CAREER_API_BASE_URL = import.meta.env.VITE_CAREER_API_BASE_URL?.replace(
  /\/$/,
  "",
);

function requireFirestore() {
  if (!db) throw new Error("Firebase is not configured for career data.");
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

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function sortJobs(a, b) {
  return (
    toMillis(b.lastScannedAt || b.firstSeenAt || b.updatedAt) -
    toMillis(a.lastScannedAt || a.firstSeenAt || a.updatedAt)
  );
}

function sortCompanies(a, b) {
  return (a.name || "").localeCompare(b.name || "");
}

function roleConstraints(roleId) {
  return roleId && roleId !== "all"
    ? [where("roleIds", "array-contains", roleId)]
    : [];
}

function slugify(value) {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

// ─── Companies (global catalog) ──────────────────────────────────────────

export function subscribeCareerCompanies(roleId = "all", onChange, onError) {
  if (!db) {
    onChange([]);
    onError?.(new Error("Firebase not configured."));
    return () => {};
  }
  return onSnapshot(
    query(collection(db, "companies"), ...roleConstraints(roleId), limit(200)),
    (snap) => onChange(snap.docs.map(withId).sort(sortCompanies)),
    onError,
  );
}

// ─── Jobs (per-user) ─────────────────────────────────────────────────────

export function subscribeCareerJobs(roleId = "all", onChange, onError) {
  if (!db || !auth?.currentUser) {
    onChange([]);
    onError?.(new Error("Sign in required."));
    return () => {};
  }
  try {
    return onSnapshot(
      query(userCol("jobs"), ...roleConstraints(roleId), limit(200)),
      (snap) => onChange(snap.docs.map(withId).sort(sortJobs)),
      onError,
    );
  } catch (err) {
    onError?.(err);
    return () => {};
  }
}

export async function saveJobForUser(job) {
  const id = job.id || slugify(`${job.companyName}-${job.title}-${Date.now()}`);
  await setDoc(
    userDoc("jobs", id),
    {
      ...job,
      id,
      status: job.status || "saved",
      roleIds: job.roleIds || [],
      firstSeenAt: job.firstSeenAt || serverTimestamp(),
      lastScannedAt: job.lastScannedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

export async function updateJob(jobId, patch) {
  await updateDoc(userDoc("jobs", jobId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteJob(jobId) {
  await deleteDoc(userDoc("jobs", jobId));
}

// ─── Search runs (per-user) ──────────────────────────────────────────────

export async function createCareerSearchRun({
  roleId,
  query: searchQuery,
  location,
  radiusKm,
  companyId,
}) {
  const uid = requireUid();
  const docRef = await addDoc(userCol("searchRuns"), {
    roleId: roleId || "all",
    query: (searchQuery || "").trim(),
    location: (location || "Bengaluru").trim(),
    radiusKm: Number(radiusKm) || 20,
    companyId: companyId || null,
    status: "queued",
    resultCount: 0,
    error: null,
    requestedBy: uid,
    createdAt: serverTimestamp(),
    startedAt: null,
    completedAt: null,
  });

  if (!CAREER_API_BASE_URL) return docRef.id;

  const token = await auth?.currentUser?.getIdToken?.();
  const response = await fetch(`${CAREER_API_BASE_URL}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ searchRunId: docRef.id, userId: uid }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Search created but worker trigger failed: ${text || response.statusText}`,
    );
  }
  return docRef.id;
}

export function subscribeCareerSearchRun(searchRunId, onChange, onError) {
  if (!searchRunId || !db || !auth?.currentUser) {
    onChange(null);
    return () => {};
  }
  return onSnapshot(
    userDoc("searchRuns", searchRunId),
    (snap) => onChange(snap.exists() ? withId(snap) : null),
    onError,
  );
}

export function subscribeCareerSearchRuns(onChange, onError) {
  if (!db || !auth?.currentUser) {
    onChange([]);
    return () => {};
  }
  return onSnapshot(
    query(userCol("searchRuns"), limit(20)),
    (snap) => {
      const runs = snap.docs
        .map(withId)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onChange(runs);
    },
    onError,
  );
}

// ─── Pipeline (kanban applications, per-user) ─────────────────────────────

export function subscribePipeline(onChange, onError) {
  if (!db || !auth?.currentUser) {
    onChange([]);
    return () => {};
  }
  return onSnapshot(
    query(userCol("pipeline"), limit(500)),
    (snap) => {
      const items = snap.docs
        .map(withId)
        .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
      onChange(items);
    },
    onError,
  );
}

export async function upsertPipelineEntry(entry) {
  const id =
    entry.id || `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(
    userDoc("pipeline", id),
    {
      ...entry,
      id,
      stage: entry.stage || "wishlist",
      createdAt: entry.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

export async function deletePipelineEntry(id) {
  await deleteDoc(userDoc("pipeline", id));
}

// ─── Storage helpers ─────────────────────────────────────────────────────

export async function getCareerStorageUrl(storagePath) {
  if (!storagePath) return null;
  if (/^https?:\/\//.test(storagePath)) return storagePath;
  if (!storage) throw new Error("Firebase Storage is not configured.");
  return getDownloadURL(ref(storage, storagePath));
}

// ─── Seed: shared companies catalog ──────────────────────────────────────

function uniqueSeedCompanies() {
  const byId = new Map();
  for (const company of [...DEFAULT_COMPANIES, ...seedCompaniesData]) {
    const id = company.id || slugify(company.name);
    const existing = byId.get(id);
    byId.set(id, {
      ...existing,
      ...company,
      id,
      roleIds: company.roleIds ||
        existing?.roleIds || ["mobile_frontend", "product_manager"],
      tags: [...new Set([...(existing?.tags || []), ...(company.tags || [])])],
      priority: Math.max(existing?.priority || 0, company.priority || 1),
      seededAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return [...byId.values()];
}

export async function seedCompaniesCatalog() {
  const firestore = requireFirestore();
  const companies = uniqueSeedCompanies();
  const batchSize = 450;
  let synced = 0;
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    await Promise.all(
      batch.map(({ id, ...data }) =>
        setDoc(doc(firestore, "companies", id), data, { merge: true }),
      ),
    );
    synced += batch.length;
  }
  return { syncedCompanies: synced };
}

// Back-compat alias.
export const seedCareerData = seedCompaniesCatalog;

export async function getCareerCompanies(roleId = "all") {
  const firestore = requireFirestore();
  const snapshot = await getDocs(
    query(
      collection(firestore, "companies"),
      ...roleConstraints(roleId),
      limit(200),
    ),
  );
  return snapshot.docs.map(withId).sort(sortCompanies);
}
