import { useEffect, useState, useMemo } from "react";
import { Activity, Flame, ChevronRight, Check } from "lucide-react";
import {
  subscribeHabits,
  fetchAllRecentCheckins,
  checkInHabit,
  computeStreak,
  todayKey,
} from "../services/habitsData";

export default function HabitsWidget({ onOpen }) {
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState({});

  useEffect(() => {
    let unsub;
    try {
      unsub = subscribeHabits(setHabits, () => {});
    } catch {
      /* not signed in */
    }
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!habits.length) return;
    fetchAllRecentCheckins(30)
      .then(setCheckins)
      .catch(() => {});
  }, [habits.length]);

  const today = todayKey();
  const summary = useMemo(() => {
    let done = 0;
    let best = 0;
    habits.forEach((h) => {
      const list = checkins[h.id] || [];
      if ((list.find((c) => c.date === today)?.value || 0) > 0) done++;
      const s = computeStreak(list);
      if (s > best) best = s;
    });
    return { done, best };
  }, [habits, checkins, today]);

  const quickCheck = async (h) => {
    const list = checkins[h.id] || [];
    const cur = list.find((c) => c.date === today)?.value || 0;
    const next = cur > 0 ? 0 : h.target || 1;
    await checkInHabit(h.id, today, next);
    const map = await fetchAllRecentCheckins(30);
    setCheckins(map);
  };

  return (
    <div className="card learning-widget">
      <div className="widget-head">
        <h3>
          <Activity size={16} /> Habits
        </h3>
        {onOpen && (
          <button className="btn-link" onClick={onOpen}>
            Open <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="widget-stats">
        <div className="stat">
          <div className="stat-num">
            {summary.done}/{habits.length}
          </div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat">
          <div className="stat-num">{summary.best}</div>
          <div className="stat-label">
            <Flame size={12} /> Best
          </div>
        </div>
      </div>

      {habits.length === 0 ? (
        <p className="hint">No habits yet. Add one to start a streak.</p>
      ) : (
        <ul className="widget-list">
          {habits.slice(0, 5).map((h) => {
            const list = checkins[h.id] || [];
            const done = (list.find((c) => c.date === today)?.value || 0) > 0;
            return (
              <li key={h.id}>
                <span className="truncate">
                  {h.emoji} {h.name}
                </span>
                <button
                  className={`btn-icon ${done ? "btn-done" : ""}`}
                  onClick={() => quickCheck(h)}
                  aria-label={done ? "Uncheck" : "Check in"}
                >
                  <Check size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
