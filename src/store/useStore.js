import { create } from "zustand";
import { DEFAULT_COMPANIES } from "../data/companies";

const LS_APPS = "jcc_applications";
const LS_NOTES = "jcc_notes";
const LS_GOAL = "jcc_goal";
const LS_ACTIVITY = "jcc_activity";
const LS_CUSTOM_COMPANIES = "jcc_custom_companies";
const LS_PROFILE = "jcc_profile";

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

export const useStore = create((set, get) => ({
  // ─── Profile ───
  activeProfile: localStorage.getItem(LS_PROFILE) || "abhav",
  switchProfile: (id) => {
    localStorage.setItem(LS_PROFILE, id);
    set({ activeProfile: id });
  },

  // ─── Applications ───
  applications: loadJSON(LS_APPS, []),

  addApplication: (app) => {
    const id =
      "app_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const newApp = { ...app, id, date: todayKey(), updatedAt: todayKey() };
    const updated = [...get().applications, newApp];
    saveJSON(LS_APPS, updated);
    set({ applications: updated });
  },

  updateApplication: (id, data) => {
    const updated = get().applications.map((a) =>
      a.id === id ? { ...a, ...data, updatedAt: todayKey() } : a,
    );
    saveJSON(LS_APPS, updated);
    set({ applications: updated });
  },

  deleteApplication: (id) => {
    const updated = get().applications.filter((a) => a.id !== id);
    saveJSON(LS_APPS, updated);
    set({ applications: updated });
  },

  moveApplication: (id, newStage) => {
    const updated = get().applications.map((a) =>
      a.id === id ? { ...a, stage: newStage, updatedAt: todayKey() } : a,
    );
    saveJSON(LS_APPS, updated);
    set({ applications: updated });
  },

  // ─── Notes ───
  getNotes: (profile) => {
    const notes = loadJSON(LS_NOTES, {});
    return notes[profile] || "";
  },
  setNotes: (profile, text) => {
    const notes = loadJSON(LS_NOTES, {});
    notes[profile] = text;
    saveJSON(LS_NOTES, notes);
  },

  // ─── Goal & Activity ───
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

  // ─── Custom Companies ───
  customCompanies: loadJSON(LS_CUSTOM_COMPANIES, []),

  addCompany: (company) => {
    const updated = [...get().customCompanies, { ...company, custom: true }];
    saveJSON(LS_CUSTOM_COMPANIES, updated);
    set({ customCompanies: updated });
  },

  deleteCompany: (name) => {
    const updated = get().customCompanies.filter((c) => c.name !== name);
    saveJSON(LS_CUSTOM_COMPANIES, updated);
    set({ customCompanies: updated });
  },

  getAllCompanies: () => [...DEFAULT_COMPANIES, ...get().customCompanies],

  // ─── Export / Import / Reset ───
  exportData: () => {
    const state = get();
    const data = {
      applications: state.applications,
      customCompanies: state.customCompanies,
      activity: state.activity,
      notes: loadJSON(LS_NOTES, {}),
      goalTarget: state.goalTarget,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-hunt-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: (jsonData) => {
    if (jsonData.applications) {
      saveJSON(LS_APPS, jsonData.applications);
    }
    if (jsonData.customCompanies) {
      saveJSON(LS_CUSTOM_COMPANIES, jsonData.customCompanies);
    }
    if (jsonData.activity) {
      saveJSON(LS_ACTIVITY, jsonData.activity);
    }
    if (jsonData.notes) {
      saveJSON(LS_NOTES, jsonData.notes);
    }
    if (jsonData.goalTarget) {
      saveJSON(LS_GOAL, jsonData.goalTarget);
    }
    set({
      applications: jsonData.applications || [],
      customCompanies: jsonData.customCompanies || [],
      activity: jsonData.activity || {},
      goalTarget: jsonData.goalTarget || 5,
    });
  },

  resetAll: () => {
    [LS_APPS, LS_NOTES, LS_GOAL, LS_ACTIVITY, LS_CUSTOM_COMPANIES].forEach(
      (k) => localStorage.removeItem(k),
    );
    set({
      applications: [],
      customCompanies: [],
      activity: {},
      goalTarget: 5,
    });
  },
}));
