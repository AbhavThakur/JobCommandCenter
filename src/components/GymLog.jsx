import { useState, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { Plus, Trash2 } from "lucide-react";

function getISOWeek(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PRESET_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Pull-up",
  "Overhead Press",
  "Barbell Row",
  "Lat Pulldown",
  "Dumbbell Curl",
  "Tricep Pushdown",
  "Leg Press",
  "Lunges",
  "Plank",
  "Custom…",
];

const EMPTY_SET = { sets: "", reps: "", weight: "" };

export default function GymLog() {
  const currentWeek = useMemo(() => getISOWeek(new Date()), []);
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon…6=Sun

  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const [log, setLog] = useLocalStorage(`growthOS_gym_${currentWeek}`, {});
  const [newExercise, setNewExercise] = useState("Bench Press");
  const [customName, setCustomName] = useState("");
  const [newSet, setNewSet] = useState({ ...EMPTY_SET });

  const dayKey = DAYS[selectedDay];
  const dayEntries = log[dayKey] || [];

  const addExercise = () => {
    const name = newExercise === "Custom…" ? customName.trim() : newExercise;
    if (!name) return;
    const entry = {
      id: Date.now().toString(),
      exercise: name,
      sets: Number(newSet.sets) || 0,
      reps: Number(newSet.reps) || 0,
      weight: newSet.weight ? `${newSet.weight}kg` : "BW",
    };
    setLog((prev) => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), entry],
    }));
    setNewSet({ ...EMPTY_SET });
    if (newExercise === "Custom…") setCustomName("");
  };

  const removeEntry = (id) => {
    setLog((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((e) => e.id !== id),
    }));
  };

  const totalSets = dayEntries.reduce((acc, e) => acc + (e.sets || 0), 0);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>🏋️ Gym Session</h3>
        <span style={styles.sub}>
          {dayEntries.length} exercise{dayEntries.length !== 1 ? "s" : ""} ·{" "}
          {totalSets} sets
        </span>
      </div>

      {/* Day selector */}
      <div style={styles.dayRow}>
        {DAYS.map((d, i) => (
          <button
            key={d}
            style={{
              ...styles.dayBtn,
              ...(selectedDay === i ? styles.dayBtnActive : {}),
              ...(i === todayIdx && selectedDay !== i
                ? styles.dayBtnToday
                : {}),
            }}
            onClick={() => setSelectedDay(i)}
          >
            {d.slice(0, 1)}
          </button>
        ))}
      </div>

      {/* Add exercise row */}
      <div style={styles.addRow}>
        <select
          style={styles.select}
          value={newExercise}
          onChange={(e) => setNewExercise(e.target.value)}
        >
          {PRESET_EXERCISES.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>

        {newExercise === "Custom…" && (
          <input
            style={styles.input}
            placeholder="Exercise name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        )}

        <input
          style={{ ...styles.input, ...styles.numInput }}
          type="number"
          min="0"
          placeholder="Sets"
          value={newSet.sets}
          onChange={(e) => setNewSet((p) => ({ ...p, sets: e.target.value }))}
        />
        <span style={styles.sep}>×</span>
        <input
          style={{ ...styles.input, ...styles.numInput }}
          type="number"
          min="0"
          placeholder="Reps"
          value={newSet.reps}
          onChange={(e) => setNewSet((p) => ({ ...p, reps: e.target.value }))}
        />
        <input
          style={{ ...styles.input, ...styles.numInput }}
          type="number"
          min="0"
          placeholder="kg"
          value={newSet.weight}
          onChange={(e) => setNewSet((p) => ({ ...p, weight: e.target.value }))}
        />

        <button
          style={styles.addBtn}
          onClick={addExercise}
          title="Add exercise"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Exercise list */}
      {dayEntries.length === 0 ? (
        <div style={styles.empty}>
          No exercises logged for {dayKey}. Add one above.
        </div>
      ) : (
        <div style={styles.list}>
          {dayEntries.map((entry) => (
            <div key={entry.id} style={styles.entryRow}>
              <div style={styles.entryName}>{entry.exercise}</div>
              <div style={styles.entryMeta}>
                {entry.sets > 0 && `${entry.sets} × ${entry.reps}`}
                {entry.weight && entry.weight !== "BW"
                  ? ` @ ${entry.weight}`
                  : entry.weight === "BW"
                    ? " (BW)"
                    : ""}
              </div>
              <button
                style={styles.deleteBtn}
                onClick={() => removeEntry(entry.id)}
                title="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text)",
  },
  sub: { fontSize: 12, color: "var(--muted)" },
  dayRow: { display: "flex", gap: 6 },
  dayBtn: {
    flex: 1,
    padding: "6px 0",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  dayBtnActive: {
    background: "var(--teal-dim)",
    color: "var(--teal)",
    borderColor: "var(--teal-border)",
  },
  dayBtnToday: {
    borderColor: "rgba(255,255,255,0.15)",
    color: "var(--text2)",
  },
  addRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  select: {
    flex: "2 1 120px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "var(--sans)",
  },
  input: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "var(--sans)",
    outline: "none",
    flex: "1 1 80px",
  },
  numInput: { flex: "0 0 60px", textAlign: "center" },
  sep: { color: "var(--muted)", fontSize: 14 },
  addBtn: {
    background: "var(--teal)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "#0d0f12",
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  empty: {
    color: "var(--muted)",
    fontSize: 13,
    textAlign: "center",
    padding: "16px 0",
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  entryRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    border: "1px solid var(--border)",
  },
  entryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
  },
  entryMeta: {
    fontSize: 12,
    color: "var(--teal)",
    fontFamily: "var(--mono)",
    flexShrink: 0,
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
};
