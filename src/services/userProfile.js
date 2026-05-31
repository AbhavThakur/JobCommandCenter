import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { auth, db, storage } from "../firebase";

const CAREER_API_BASE_URL = import.meta.env.VITE_CAREER_API_BASE_URL?.replace(
  /\/$/,
  "",
);

function requireUser() {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

function userDocRef(uid) {
  if (!db) throw new Error("Firestore is not configured.");
  return doc(db, "users", uid);
}

const ALLOWED_RESUME_TYPES = {
  "text/markdown": "md",
  "text/plain": "md",
  "application/pdf": "pdf",
};

function resumeExtFor(file) {
  const fromMap = ALLOWED_RESUME_TYPES[file.type];
  if (fromMap) return fromMap;
  if (file.name?.toLowerCase().endsWith(".md")) return "md";
  if (file.name?.toLowerCase().endsWith(".pdf")) return "pdf";
  throw new Error("Only .md or .pdf resumes are supported.");
}

export async function uploadResume(file) {
  if (!storage) throw new Error("Firebase Storage is not configured.");
  const uid = requireUser();
  const ext = resumeExtFor(file);
  const storagePath = `users/${uid}/resume.${ext}`;
  const objectRef = ref(storage, storagePath);

  await uploadBytes(objectRef, file, {
    contentType:
      file.type || (ext === "pdf" ? "application/pdf" : "text/markdown"),
  });

  // Clean up the opposite-extension copy if it exists (only one resume per user).
  const otherExt = ext === "md" ? "pdf" : "md";
  try {
    await deleteObject(ref(storage, `users/${uid}/resume.${otherExt}`));
  } catch {
    // Object did not exist — ignore.
  }

  await setDoc(
    userDocRef(uid),
    {
      resume: {
        storagePath,
        contentType: file.type || null,
        size: file.size || null,
        fileName: file.name || `resume.${ext}`,
        uploadedAt: serverTimestamp(),
        parsedAt: null,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { storagePath, ext };
}

export async function getResumeDownloadUrl(storagePath) {
  if (!storagePath) return null;
  if (!storage) throw new Error("Firebase Storage is not configured.");
  return getDownloadURL(ref(storage, storagePath));
}

export async function savePreferences(preferences) {
  const uid = requireUser();
  await setDoc(
    userDocRef(uid),
    {
      preferences: {
        roleId: preferences.roleId || "all",
        targetRoles: preferences.targetRoles || [],
        locations: preferences.locations || [],
        minSalaryLpa: Number(preferences.minSalaryLpa) || null,
        experienceYears: Number(preferences.experienceYears) || null,
        remoteOk: !!preferences.remoteOk,
        notes: preferences.notes || "",
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeUserProfile(onChange, onError) {
  if (!db) {
    onChange(null);
    return () => {};
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    onChange(null);
    return () => {};
  }

  return onSnapshot(
    userDocRef(uid),
    (snapshot) => {
      onChange(
        snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
      );
    },
    onError,
  );
}

async function postToWorker(path, body) {
  if (!CAREER_API_BASE_URL) {
    throw new Error("Worker URL not configured. Set VITE_CAREER_API_BASE_URL.");
  }
  const token = await auth?.currentUser?.getIdToken?.();
  if (!token) throw new Error("Not signed in.");

  const response = await fetch(`${CAREER_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
}

/** Trigger worker to parse the uploaded resume into structured JSON. */
export function parseResume() {
  return postToWorker("/api/parse-resume", {});
}

/** Trigger worker to evaluate a job using the user's CV. */
export function evaluateJob({ jobId, jdText, jdUrl }) {
  return postToWorker("/api/evaluate", { jobId, jdText, jdUrl });
}

/** Trigger worker to generate a tailored CV PDF for a job. */
export function tailorCv({ jobId, jdText, jdUrl }) {
  return postToWorker("/api/tailor-cv", { jobId, jdText, jdUrl });
}

/** Send a chat message to the Growth OS coach. */
export function sendChat({ messages, chatId, include }) {
  return postToWorker("/api/chat", { messages, chatId, include });
}
