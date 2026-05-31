import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  subscribeHabits,
  fetchAllRecentCheckins,
  computeStreak,
  todayKey,
} from "../services/habitsData";
import { subscribeLearningItems } from "../services/learningData";

/**
 * Cross-pillar streaks card. Shows streak for:
 *   - Habits (best of any habit)
 *   - Journal (consecutive days with non-empty growthOS_journal_*)
 *   - Schedule (consecutive days with ≥1 done slot)
 *   - Learning (active items)
 */
export default function StreaksCard() {
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [learning, setLearning] = useState([]);
  const [completions] = useLocalStorage("growthOS_schedule_v2", {});

  useEffect(() => {
    let a, b;
    try {
      a = subscribeHabits(setHabits, () => {});
      b = subscribeLearningItems(setLearning, () => {});
    } catch {
      /* not signed in */
    }
    return () => {
      a?.();
      b?.();
    };
  }, []);

  useEffect(() => {
    if (!habits.length) return;
    fetchAllRecentCheckins(60)
      .then(setCheckins)
      .catch(() => {});
  }, [habits.length]);

  const habitStreak = useMemo(() => {
    let best = 0;
    habits.forEach((h) => {
      const s = computeStreak(checkins[h.id] || []);
      if (s > best) best = s;
    });
    return best;
  }, [habits, checkins]);

  const journalStreak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `growthOS_journal_${d.toISOString().slice(0, 10)}`;
      try {
        const raw = JSON.parse(localStorage.getItem(key) || '""');
        if (raw && raw.trim()) count++;
        else if (i === 0) continue;
        else break;
      } catch {
        if (i === 0) continue;
        break;
      }
    }
    return count;
  }, []);

  const scheduleStreak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const anyDone = Object.entries(completions).some(
        ([k, v]) => k.startsWith(dateKey + ":") && v === "done",
      );
      if (anyDone) count++;
      else if (i === 0) continue;
      else break;
    }
    return count;
  }, [completions]);

  const learningActive = learning.filter((i) => i.status === "active").length;

  const cells = [
    { label: "Habits", value: habitStreak, suffix: "d", color: "var(--teal)" },
    {
      label: "Journal",
      value: journalStreak,
      suffix: "d",
      color: "var(--accent-bright)",
    },
    {
      label: "Schedule",
      value: scheduleStreak,
      suffix: "d",
      color: "var(--amber)",
    },
    {
      label: "Learning",
      value: learningActive,
      suffix: " active",
      color: "var(--green)",
    },
  ];

  return (
    <div className="card streaks-card">
      <h3 className="streaks-title">
        <Flame size={16} /> Streaks
      </h3>
      <div className="streaks-grid">
        {cells.map((c) => (
          <div key={c.label} className="streak-cell">
            <div className="streak-num" style={{ color: c.color }}>
              {c.value}
              <span className="streak-suf">{c.suffix}</span>
            </div>
            <div className="streak-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
