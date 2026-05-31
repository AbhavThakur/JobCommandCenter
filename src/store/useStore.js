import { create } from "zustand";

const LS_NOTES = "jcc_notes";
const LS_GOAL = "jcc_goal";
const LS_ACTIVITY = "jcc_activity";

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lightweight client-only store for app-wide local state.
 * Persistent app data (jobs, pipeline, learning, profile) lives in Firestore
 * under users/{uid}/... — see src/services/*.js.
 */
export const useStore = create((set, get) => ({
  // ─── Notes (per-context bag, used by Career sub-pages) ───
  getNotes: (key) => {
    const notes = loadJSON(LS_NOTES, {});
    return notes[key] || "";
  },
  setNotes: (key, text) => {
    const notes = loadJSON(LS_NOTES, {});
    notes[key] = text;
    saveJSON(LS_NOTES, notes);
  },

  // ─── Goal target + daily activity ping (used by DailyScore) ───
  goalTarget: loadJSON(LS_GOAL, 5),
  activity: loadJSON(LS_ACTIVITY, {}),

  setGoalTarget: (target) => {
    saveJSON(LS_GOAL, target);
    set({ goalTarget: target });
  },

  logDailyActivity: () => {
    const today = todayKey();
    const activity = { ...get().activity };
    activity[today] = (activity[today] || 0) + 1;
    saveJSON(LS_ACTIVITY, activity);
    set({ activity });
  },
}));
