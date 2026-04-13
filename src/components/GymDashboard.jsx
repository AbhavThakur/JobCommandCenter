import { useState, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { Plus, Trash2, Flame, CheckCircle2 } from "lucide-react";

// ─── Exercise library per muscle group ───────────────────────────────────────
const MUSCLE_GROUPS = [
  { id: "chest", label: "Chest", emoji: "💪" },
  { id: "back", label: "Back", emoji: "🔙" },
  { id: "legs", label: "Legs", emoji: "🦵" },
  { id: "shoulders", label: "Shoulders", emoji: "🏋️" },
  { id: "arms", label: "Arms", emoji: "💪" },
  { id: "core", label: "Core", emoji: "🔥" },
  { id: "cardio", label: "Cardio", emoji: "🏃" },
];

const EXERCISE_LIBRARY = {
  chest: [
    { name: "Bench Press", scheme: "4 × 8–10", emoji: "🏋️" },
    { name: "Incline DB Press", scheme: "3 × 10–12", emoji: "💪" },
    { name: "Cable Flyes", scheme: "3 × 12–15", emoji: "🔁" },
    { name: "Dips", scheme: "3 × 10–12", emoji: "⬇️" },
    { name: "Push-ups", scheme: "3 × 15–20", emoji: "⬆️" },
  ],
  back: [
    { name: "Deadlift", scheme: "4 × 5–6", emoji: "🏋️" },
    { name: "Pull-ups", scheme: "4 × 8–10", emoji: "⬆️" },
    { name: "Barbell Row", scheme: "4 × 8–10", emoji: "🔙" },
    { name: "Lat Pulldown", scheme: "3 × 12", emoji: "⬇️" },
    { name: "Seated Cable Row", scheme: "3 × 12–15", emoji: "🔗" },
  ],
  legs: [
    { name: "Squat", scheme: "4 × 8–10", emoji: "🦵" },
    { name: "Leg Press", scheme: "4 × 10–12", emoji: "🔁" },
    { name: "Romanian Deadlift", scheme: "3 × 10–12", emoji: "🏋️" },
    { name: "Lunges", scheme: "3 × 12 each", emoji: "👣" },
    { name: "Leg Curl", scheme: "3 × 12–15", emoji: "🔄" },
    { name: "Calf Raises", scheme: "4 × 15–20", emoji: "👟" },
  ],
  shoulders: [
    { name: "Overhead Press", scheme: "4 × 8–10", emoji: "🏋️" },
    { name: "Lateral Raise", scheme: "3 × 12–15", emoji: "↔️" },
    { name: "Front Raise", scheme: "3 × 12", emoji: "⬆️" },
    { name: "Face Pull", scheme: "3 × 15", emoji: "🔁" },
    { name: "Arnold Press", scheme: "3 × 10–12", emoji: "💪" },
  ],
  arms: [
    { name: "Barbell Curl", scheme: "3 × 10–12", emoji: "💪" },
    { name: "Hammer Curl", scheme: "3 × 12", emoji: "🔨" },
    { name: "Tricep Pushdown", scheme: "3 × 12–15", emoji: "⬇️" },
    { name: "Skull Crusher", scheme: "3 × 10–12", emoji: "💀" },
    { name: "Concentration Curl", scheme: "3 × 12 each", emoji: "🎯" },
    { name: "Close-grip Bench", scheme: "3 × 10–12", emoji: "🏋️" },
  ],
  core: [
    { name: "Plank", scheme: "3 × 45–60 sec", emoji: "⏱️" },
    { name: "Crunches", scheme: "3 × 20", emoji: "🔄" },
    { name: "Russian Twist", scheme: "3 × 20", emoji: "🌀" },
    { name: "Leg Raise", scheme: "3 × 15", emoji: "⬆️" },
    { name: "Ab Wheel", scheme: "3 × 10–12", emoji: "🔵" },
  ],
  cardio: [
    { name: "Run", scheme: "30–45 min", emoji: "🏃" },
    { name: "Cycling", scheme: "30 min", emoji: "🚴" },
    { name: "Jump Rope", scheme: "3 × 3 min", emoji: "⏱️" },
    { name: "Rowing Machine", scheme: "20 min", emoji: "🚣" },
    { name: "HIIT", scheme: "20 min", emoji: "🔥" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Sub-component: exercise card ────────────────────────────────────────────
function ExerciseCard({ ex, sessionEntry, onAdd, onRemove, onToggleDone }) {
  const [sets, setSets] = useState(ex.defaultSets || "");
  const [reps, setReps] = useState(ex.defaultReps || "");
  const [weight, setWeight] = useState("");

  const handleAdd = () => {
    if (!sets && !reps) return;
    onAdd(ex.name, {
      id: Date.now().toString(),
      sets: sets || "?",
      reps: reps || "?",
      weight: weight || "BW",
    });
    setSets("");
    setReps("");
    setWeight("");
  };

  const done = sessionEntry?.done;

  return (
    <div style={{ ...cardStyles.card, ...(done ? cardStyles.cardDone : {}) }}>
      <div style={cardStyles.cardHeader}>
        <div style={cardStyles.exInfo}>
          <span style={cardStyles.exEmoji}>{ex.emoji}</span>
          <div>
            <div style={cardStyles.exName}>{ex.name}</div>
            <div style={cardStyles.exScheme}>{ex.scheme}</div>
          </div>
        </div>
        <button
          style={{
            ...cardStyles.doneBtn,
            ...(done ? cardStyles.doneBtnActive : {}),
          }}
          onClick={() => onToggleDone(ex.name)}
          title={done ? "Mark undone" : "Mark done"}
        >
          <CheckCircle2 size={16} />
        </button>
      </div>

      {/* Logged sets */}
      {sessionEntry?.sets?.length > 0 && (
        <div style={cardStyles.setList}>
          {sessionEntry.sets.map((s, i) => (
            <div key={s.id} style={cardStyles.setRow}>
              <span style={cardStyles.setNum}>Set {i + 1}</span>
              <span style={cardStyles.setVal}>
                {s.sets}×{s.reps}
              </span>
              <span style={cardStyles.setWeight}>{s.weight}</span>
              <button
                style={cardStyles.removeBtn}
                onClick={() => onRemove(ex.name, s.id)}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add set inline */}
      {!done && (
        <div style={cardStyles.addSetRow}>
          <input
            style={cardStyles.mini}
            type="number"
            min="1"
            placeholder="Sets"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
          <span style={cardStyles.sep}>×</span>
          <input
            style={cardStyles.mini}
            type="number"
            min="1"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
          <input
            style={cardStyles.mini}
            type="text"
            placeholder="kg/BW"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <button style={cardStyles.addSetBtn} onClick={handleAdd}>
            <Plus size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GymDashboard() {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const currentWeek = useMemo(() => getISOWeek(new Date()), []);

  const [activeGroup, setActiveGroup] = useState("chest");
  const [sessions, setSessions] = useLocalStorage(
    `growthOS_gym2_${currentWeek}`,
    {},
  );
  const [customExName, setCustomExName] = useState("");
  const [showCustomAdd, setShowCustomAdd] = useState(false);

  // sessions structure: { "Mon": { "Bench Press": { sets: [...], done: bool } } }
  const todayKey = WEEK_DAYS[todayIdx];
  const todaySession = sessions[todayKey] || {};

  const handleAddSet = (exName, setEntry) => {
    setSessions((prev) => {
      const day = prev[todayKey] || {};
      const ex = day[exName] || { sets: [], done: false };
      return {
        ...prev,
        [todayKey]: {
          ...day,
          [exName]: { ...ex, sets: [...ex.sets, setEntry] },
        },
      };
    });
  };

  const handleRemoveSet = (exName, setId) => {
    setSessions((prev) => {
      const day = prev[todayKey] || {};
      const ex = day[exName] || { sets: [], done: false };
      return {
        ...prev,
        [todayKey]: {
          ...day,
          [exName]: { ...ex, sets: ex.sets.filter((s) => s.id !== setId) },
        },
      };
    });
  };

  const handleToggleDone = (exName) => {
    setSessions((prev) => {
      const day = prev[todayKey] || {};
      const ex = day[exName] || { sets: [], done: false };
      return {
        ...prev,
        [todayKey]: { ...day, [exName]: { ...ex, done: !ex.done } },
      };
    });
  };

  const handleAddCustom = () => {
    if (!customExName.trim()) return;
    // Add to today's session without a library entry — treat as already-present
    setSessions((prev) => {
      const day = prev[todayKey] || {};
      if (day[customExName.trim()]) return prev;
      return {
        ...prev,
        [todayKey]: {
          ...day,
          [customExName.trim()]: { sets: [], done: false, custom: true },
        },
      };
    });
    setCustomExName("");
    setShowCustomAdd(false);
  };

  // Weekly streak: count days that have at least one completed exercise
  const streak = useMemo(() => {
    return WEEK_DAYS.filter((d) => {
      const daySession = sessions[d] || {};
      return Object.values(daySession).some(
        (ex) => ex.done || ex.sets?.length > 0,
      );
    }).length;
  }, [sessions]);

  const exercisesForGroup = EXERCISE_LIBRARY[activeGroup] || [];
  // Also include custom exercises logged today that aren't in the library
  const customExercises = Object.keys(todaySession)
    .filter((name) => todaySession[name]?.custom)
    .map((name) => ({ name, emoji: "⭐", scheme: "custom" }));

  const doneCount = Object.values(todaySession).filter((ex) => ex.done).length;
  const totalLogged = Object.keys(todaySession).length;

  return (
    <div style={styles.wrap}>
      {/* ── Header ── */}
      <div style={styles.dashHeader}>
        <div>
          <h3 style={styles.title}>Today's Workout</h3>
          <div style={styles.subtitle}>
            {todayKey} ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <div style={styles.streakBadge}>
          <Flame size={16} color="var(--orange)" />
          <span style={styles.streakNum}>{streak}</span>
          <span style={styles.streakLabel}>day streak</span>
        </div>
      </div>

      {/* ── Weekly activity dots ── */}
      <div style={styles.weekRow}>
        {WEEK_DAYS.map((d, i) => {
          const daySession = sessions[d] || {};
          const hasActivity = Object.values(daySession).some(
            (ex) => ex.done || ex.sets?.length > 0,
          );
          const isToday = i === todayIdx;
          return (
            <div key={d} style={styles.weekDay}>
              <div style={styles.weekDayLabel}>{d.slice(0, 1)}</div>
              <div
                style={{
                  ...styles.weekDot,
                  background: hasActivity ? "var(--teal)" : "var(--surface3)",
                  boxShadow: isToday ? "0 0 0 2px var(--teal-border)" : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Progress summary ── */}
      {totalLogged > 0 && (
        <div style={styles.progressRow}>
          <span style={styles.progressText}>
            {doneCount}/{totalLogged} exercises completed today
          </span>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${totalLogged ? (doneCount / totalLogged) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Muscle group selector ── */}
      <div style={styles.groupRow}>
        {MUSCLE_GROUPS.map((g) => {
          const hasData = Object.keys(sessions[todayKey] || {}).some((name) => {
            const lib = Object.values(EXERCISE_LIBRARY).flat();
            const libEx = lib.find((e) => e.name === name);
            return (
              libEx &&
              (EXERCISE_LIBRARY[g.id] || []).some((e) => e.name === name)
            );
          });
          return (
            <button
              key={g.id}
              style={{
                ...styles.groupBtn,
                ...(activeGroup === g.id ? styles.groupBtnActive : {}),
              }}
              onClick={() => setActiveGroup(g.id)}
            >
              <span>{g.emoji}</span>
              <span>{g.label}</span>
              {hasData && <span style={styles.groupDot} />}
            </button>
          );
        })}
      </div>

      {/* ── Exercise cards ── */}
      <div style={styles.exGrid}>
        {exercisesForGroup.map((ex) => (
          <ExerciseCard
            key={ex.name}
            ex={ex}
            sessionEntry={todaySession[ex.name]}
            onAdd={handleAddSet}
            onRemove={handleRemoveSet}
            onToggleDone={handleToggleDone}
          />
        ))}
        {/* Custom exercises logged today */}
        {customExercises.map((ex) => (
          <ExerciseCard
            key={ex.name}
            ex={ex}
            sessionEntry={todaySession[ex.name]}
            onAdd={handleAddSet}
            onRemove={handleRemoveSet}
            onToggleDone={handleToggleDone}
          />
        ))}
      </div>

      {/* ── Add custom exercise ── */}
      {showCustomAdd ? (
        <div style={styles.customRow}>
          <input
            style={styles.customInput}
            placeholder="Exercise name (e.g. Cable Crossover)"
            value={customExName}
            onChange={(e) => setCustomExName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            autoFocus
          />
          <button style={styles.addBtn} onClick={handleAddCustom}>
            Add
          </button>
          <button
            style={styles.cancelBtn}
            onClick={() => {
              setShowCustomAdd(false);
              setCustomExName("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          style={styles.addCustomTrigger}
          onClick={() => setShowCustomAdd(true)}
        >
          <Plus size={14} />
          Add custom exercise to today
        </button>
      )}
    </div>
  );
}

// ─── Card styles ──────────────────────────────────────────────────────────────
const cardStyles = {
  card: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "border-color 0.2s",
  },
  cardDone: {
    borderColor: "var(--teal-border)",
    background: "var(--teal-dim)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exInfo: { display: "flex", gap: 10, alignItems: "flex-start" },
  exEmoji: { fontSize: 20, lineHeight: 1, marginTop: 2 },
  exName: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text)",
    fontFamily: "var(--sans)",
  },
  exScheme: {
    fontSize: 11,
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    marginTop: 2,
  },
  doneBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--muted)",
    cursor: "pointer",
    padding: "4px 6px",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  doneBtnActive: {
    color: "var(--teal)",
    borderColor: "var(--teal-border)",
    background: "var(--teal-dim)",
  },
  setList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    borderTop: "1px solid var(--border)",
    paddingTop: 8,
  },
  setRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
  },
  setNum: {
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    fontSize: 11,
    width: 40,
    flexShrink: 0,
  },
  setVal: {
    color: "var(--text)",
    fontWeight: 600,
    fontFamily: "var(--mono)",
    flex: 1,
  },
  setWeight: { color: "var(--teal)", fontFamily: "var(--mono)", fontSize: 11 },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  addSetRow: {
    display: "flex",
    gap: 4,
    alignItems: "center",
  },
  mini: {
    flex: 1,
    minWidth: 0,
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    padding: "5px 6px",
    fontSize: 12,
    fontFamily: "var(--sans)",
    textAlign: "center",
  },
  sep: { color: "var(--muted)", fontSize: 12, flexShrink: 0 },
  addSetBtn: {
    background: "var(--teal)",
    border: "none",
    borderRadius: 6,
    color: "#0d0f12",
    padding: "5px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
};

// ─── Page-level styles ────────────────────────────────────────────────────────
const styles = {
  wrap: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  dashHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text)",
  },
  subtitle: { fontSize: 12, color: "var(--muted)", marginTop: 2 },
  streakBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--orange-dim, rgba(251,191,36,0.12))",
    border: "1px solid rgba(251,191,36,0.25)",
    borderRadius: 20,
    padding: "6px 12px",
  },
  streakNum: {
    fontSize: 18,
    fontWeight: 800,
    color: "var(--orange)",
    fontFamily: "var(--mono)",
    lineHeight: 1,
  },
  streakLabel: { fontSize: 11, color: "var(--muted)" },
  weekRow: {
    display: "flex",
    gap: 8,
    padding: "8px 0",
    borderTop: "1px solid var(--border)",
    borderBottom: "1px solid var(--border)",
  },
  weekDay: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  weekDayLabel: { fontSize: 11, color: "var(--muted)", fontWeight: 600 },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  progressRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    color: "var(--text2)",
    fontFamily: "var(--mono)",
  },
  progressBarBg: {
    height: 5,
    background: "var(--surface3)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "var(--teal)",
    transition: "width 0.4s ease",
  },
  groupRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  groupBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 12px",
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--surface2)",
    color: "var(--muted)",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "var(--sans)",
    cursor: "pointer",
    transition: "all 0.15s",
    position: "relative",
  },
  groupBtnActive: {
    background: "var(--teal-dim)",
    color: "var(--teal)",
    borderColor: "var(--teal-border)",
  },
  groupDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--teal)",
    marginLeft: 2,
  },
  exGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  },
  customRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  customInput: {
    flex: 1,
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "var(--sans)",
    outline: "none",
  },
  addBtn: {
    background: "var(--teal)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "#0d0f12",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--sans)",
    flexShrink: 0,
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--muted)",
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--sans)",
    flexShrink: 0,
  },
  addCustomTrigger: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--muted)",
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "var(--sans)",
    width: "100%",
    justifyContent: "center",
  },
};
