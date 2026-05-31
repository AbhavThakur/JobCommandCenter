import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Flame, Check, Edit2, X } from "lucide-react";
import {
  subscribeHabits,
  addHabit,
  updateHabit,
  deleteHabit,
  checkInHabit,
  fetchAllRecentCheckins,
  computeStreak,
  todayKey,
} from "../services/habitsData";

const COLORS = ["teal", "amber", "green", "purple", "red", "blue"];
const EMOJIS = ["✅", "💧", "📚", "🏃", "🧘", "💪", "🍎", "💤", "💻", "🎯"];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let unsub;
    try {
      unsub = subscribeHabits(
        (data) => {
          setHabits(data);
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        },
      );
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  // refresh aggregate check-ins on habit list change
  useEffect(() => {
    if (!habits.length) {
      setCheckins({});
      return;
    }
    fetchAllRecentCheckins(30)
      .then(setCheckins)
      .catch(() => {});
  }, [habits.length]);

  const today = todayKey();

  const refresh = async () => {
    try {
      const map = await fetchAllRecentCheckins(30);
      setCheckins(map);
    } catch {
      /* ignore */
    }
  };

  const onToggle = async (habit) => {
    const list = checkins[habit.id] || [];
    const current = list.find((c) => c.date === today);
    const next = current?.value ? 0 : habit.target || 1;
    await checkInHabit(habit.id, today, next);
    await refresh();
  };

  return (
    <div className="habits-page">
      <div className="page-header">
        <h2>Habits</h2>
        <p className="subtitle">
          Daily check-ins, streaks, and the building blocks of your day.
        </p>
      </div>

      <div className="learning-toolbar">
        <div className="hint">
          {habits.length} habit{habits.length !== 1 ? "s" : ""} ·{" "}
          {Object.values(checkins).reduce(
            (n, l) => n + (l.find((c) => c.date === today)?.value > 0 ? 1 : 0),
            0,
          )}{" "}
          done today
        </div>
        <button
          className="btn btn-accent"
          onClick={() => setShowForm((s) => !s)}
        >
          <Plus size={16} /> New habit
        </button>
      </div>

      {error && <div className="card error">{error}</div>}
      {showForm && (
        <HabitForm
          onSaved={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="card">Loading…</div>
      ) : habits.length === 0 ? (
        <p className="hint">
          No habits yet. Add water, reading, walking — anything you want to do
          daily.
        </p>
      ) : (
        <div className="habits-grid">
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              checkins={checkins[h.id] || []}
              today={today}
              onToggle={() => onToggle(h)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HabitForm({ onSaved, onCancel }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [color, setColor] = useState("teal");
  const [target, setTarget] = useState(1);
  const [targetUnit, setTargetUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await addHabit({ name, emoji, color, target, targetUnit });
      setName("");
      onSaved?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card learning-form" onSubmit={submit}>
      <div className="row">
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)}>
          {EMOJIS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Habit name * (e.g. Drink water)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="row">
        <input
          type="number"
          min={1}
          placeholder="Target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <input
          type="text"
          placeholder="Unit (e.g. glasses, pages)"
          value={targetUnit}
          onChange={(e) => setTargetUnit(e.target.value)}
        />
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {err && <p className="error">{err}</p>}
      <div className="row form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-accent" disabled={saving}>
          {saving ? "Saving…" : "Add habit"}
        </button>
      </div>
    </form>
  );
}

function HabitCard({ habit, checkins, today, onToggle, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const streak = useMemo(() => computeStreak(checkins), [checkins]);
  const doneToday = (checkins.find((c) => c.date === today)?.value || 0) > 0;

  // 14-day heatmap
  const heatmap = useMemo(() => {
    const map = new Map(checkins.map((c) => [c.date, c.value]));
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, value: map.get(key) || 0 });
    }
    return days;
  }, [checkins]);

  const onDelete = async () => {
    if (!confirm(`Delete habit "${habit.name}"?`)) return;
    await deleteHabit(habit.id);
    onRefresh?.();
  };

  return (
    <div className={`card habit-card color-${habit.color}`}>
      <div className="habit-head">
        <div className="habit-title">
          <span className="habit-emoji">{habit.emoji}</span>
          {editing ? (
            <EditName habit={habit} onDone={() => setEditing(false)} />
          ) : (
            <strong>{habit.name}</strong>
          )}
        </div>
        <div className="habit-actions">
          <button className="btn-icon" onClick={() => setEditing((v) => !v)}>
            {editing ? <X size={14} /> : <Edit2 size={14} />}
          </button>
          <button className="btn-icon" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="habit-stats">
        <div className="stat">
          <Flame size={14} /> <strong>{streak}</strong>
          <span className="hint">day streak</span>
        </div>
        <div className="stat">
          <strong>{habit.target}</strong>
          <span className="hint">/ day {habit.targetUnit}</span>
        </div>
      </div>

      <div className="heatmap" aria-label="14-day heatmap">
        {heatmap.map((d) => (
          <span
            key={d.key}
            className={`hm-cell ${d.value > 0 ? "on" : ""} ${d.key === today ? "today" : ""}`}
            title={`${d.key}: ${d.value || 0}`}
          />
        ))}
      </div>

      <button
        className={`btn btn-block ${doneToday ? "btn-green" : "btn-accent"}`}
        onClick={onToggle}
      >
        <Check size={14} /> {doneToday ? "Done today" : "Check in"}
      </button>
    </div>
  );
}

function EditName({ habit, onDone }) {
  const [val, setVal] = useState(habit.name);
  const save = async () => {
    if (val.trim() && val !== habit.name) {
      await updateHabit(habit.id, { name: val.trim() });
    }
    onDone();
  };
  return (
    <input
      type="text"
      value={val}
      autoFocus
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && save()}
    />
  );
}
