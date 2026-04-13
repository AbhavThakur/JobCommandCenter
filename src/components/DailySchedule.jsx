import { useState, useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { SCHEDULE, PILLARS, DAY_LABELS } from "../data/schedule";
import {
  CheckCircle2,
  Circle,
  SkipForward,
  ExternalLink,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
} from "lucide-react";

const getTodayKey = () => new Date().toISOString().split("T")[0];
const getDayKey = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

function nextState(current) {
  if (!current || current === "pending") return "done";
  if (current === "done") return "skipped";
  return "pending";
}

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

// ─── Inline edit form for a default slot ─────────────────────────────────────
function SlotEditForm({ slot, override, onSave, onCancel }) {
  const [label, setLabel] = useState(override?.label ?? slot.label);
  const [detail, setDetail] = useState(override?.detail ?? slot.detail);
  const [url, setUrl] = useState(override?.url ?? slot.url ?? "");
  const [time, setTime] = useState(override?.time ?? slot.time);
  return (
    <div style={editStyles.form} onClick={(e) => e.stopPropagation()}>
      <div style={editStyles.row}>
        <input
          style={editStyles.input}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Time"
        />
        <input
          style={{ ...editStyles.input, flex: 2 }}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          autoFocus
        />
      </div>
      <input
        style={editStyles.input}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Description / detail"
      />
      <input
        style={editStyles.input}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Link URL (optional)"
      />
      <div style={editStyles.btnRow}>
        <button
          style={editStyles.saveBtn}
          onClick={() => onSave({ label, detail, url: url || undefined, time })}
        >
          <Check size={13} /> Save
        </button>
        <button style={editStyles.cancelBtn} onClick={onCancel}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Inline add custom task form ──────────────────────────────────────────────
function AddTaskForm({ onSave, onCancel }) {
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [url, setUrl] = useState("");
  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      id: "custom_" + Date.now(),
      label: label.trim(),
      time: time.trim() || "Any time",
      url: url.trim() || undefined,
    });
  };
  return (
    <div style={editStyles.form}>
      <div style={editStyles.row}>
        <input
          style={editStyles.input}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Time (e.g. 10:00 AM)"
        />
        <input
          style={{ ...editStyles.input, flex: 2 }}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Task description"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </div>
      <input
        style={editStyles.input}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Link URL (optional)"
      />
      <div style={editStyles.btnRow}>
        <button style={editStyles.saveBtn} onClick={handleSave}>
          <Check size={13} /> Add
        </button>
        <button style={editStyles.cancelBtn} onClick={onCancel}>
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DailySchedule() {
  const todayIndex = new Date().getDay();
  const [selectedDayVal, setSelectedDayVal] = useState(todayIndex);

  const [completions, setCompletions] = useLocalStorage(
    "growthOS_schedule_v2",
    {},
  );
  const [overrides, setOverrides] = useLocalStorage(
    "growthOS_slot_overrides",
    {},
  );
  const [customTasks, setCustomTasks] = useLocalStorage(
    "growthOS_custom_tasks",
    {},
  );
  const [dateKeys, setDateKeys] = useState({});
  const [editingSlot, setEditingSlot] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const keys = {};
    ORDERED_DAYS.forEach((dayVal) => {
      let offset = dayVal - todayIndex;
      if (todayIndex === 0 && dayVal !== 0) offset = dayVal - 7;
      else if (todayIndex !== 0 && dayVal === 0) offset = 7 - todayIndex;
      keys[dayVal] = getDayKey(offset);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateKeys(keys);
  }, [todayIndex]);

  const selectedDateKey = dateKeys[selectedDayVal] || getTodayKey();
  const dayData = SCHEDULE[selectedDayVal];
  const getSlot = (slot) => ({ ...slot, ...(overrides[slot.id] || {}) });
  const getState = (slotId) =>
    completions[`${selectedDateKey}:${slotId}`] || "pending";

  const handleToggle = (slotId, e) => {
    if (e.target.closest("a") || e.target.closest("button")) return;
    setCompletions((prev) => ({
      ...prev,
      [`${selectedDateKey}:${slotId}`]: nextState(
        prev[`${selectedDateKey}:${slotId}`],
      ),
    }));
  };
  const handleSaveOverride = (slotId, data) => {
    setOverrides((prev) => ({ ...prev, [slotId]: data }));
    setEditingSlot(null);
  };
  const handleResetOverride = (slotId, e) => {
    e.stopPropagation();
    setOverrides((prev) => {
      const n = { ...prev };
      delete n[slotId];
      return n;
    });
    setEditingSlot(null);
  };

  const dayCustomTasks = customTasks[selectedDateKey] || [];
  const handleAddCustomTask = (task) => {
    setCustomTasks((prev) => ({
      ...prev,
      [selectedDateKey]: [...(prev[selectedDateKey] || []), task],
    }));
    setShowAddTask(false);
  };
  const handleToggleCustomTask = (id) =>
    setCustomTasks((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    }));
  const handleDeleteCustomTask = (id) =>
    setCustomTasks((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).filter(
        (t) => t.id !== id,
      ),
    }));

  const totalSlots = dayData.slots.length;
  const completedSlots = dayData.slots.filter(
    (s) => getState(s.id) === "done",
  ).length;
  const skippedSlots = dayData.slots.filter(
    (s) => getState(s.id) === "skipped",
  ).length;
  const completedCustom = dayCustomTasks.filter((t) => t.done).length;
  const totalAll = totalSlots + dayCustomTasks.length;
  const completedAll = completedSlots + completedCustom;
  const progressPct = totalAll === 0 ? 0 : (completedAll / totalAll) * 100;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3>Daily Schedule</h3>
          {dayData.isWFH && <span style={styles.wfhBadge}>🏠 WFH</span>}
        </div>
        <div style={styles.daySelector}>
          {ORDERED_DAYS.map((d) => {
            const isSelected = selectedDayVal === d;
            const isToday = todayIndex === d;
            return (
              <button
                key={d}
                style={{
                  ...styles.dayPill,
                  ...(isSelected ? styles.dayPillActive : {}),
                  ...(isToday && !isSelected ? styles.dayPillToday : {}),
                }}
                onClick={() => {
                  setSelectedDayVal(d);
                  setEditingSlot(null);
                  setShowAddTask(false);
                }}
              >
                {DAY_LABELS[d]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div style={styles.progressContainer}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>Progress</span>
          <span style={styles.progressFraction}>
            {completedAll}/{totalAll} done
            {skippedSlots > 0 && (
              <span style={styles.skippedCount}> · {skippedSlots} skipped</span>
            )}
          </span>
        </div>
        <div style={styles.progressBarBg}>
          <div
            style={{ ...styles.progressBarFill, width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Default slots */}
      <div style={styles.slotList}>
        {dayData.slots.map((rawSlot) => {
          const slot = getSlot(rawSlot);
          const isEditing = editingSlot === slot.id;
          const state = getState(slot.id);
          const isDone = state === "done";
          const isSkipped = state === "skipped";
          const pillar = PILLARS[rawSlot.pillar] || PILLARS.rest;
          const hasOverride = !!overrides[slot.id];
          return (
            <div key={slot.id}>
              {isEditing ? (
                <SlotEditForm
                  slot={rawSlot}
                  override={overrides[slot.id]}
                  onSave={(data) => handleSaveOverride(slot.id, data)}
                  onCancel={() => setEditingSlot(null)}
                />
              ) : (
                <div
                  style={{
                    ...styles.slotItem,
                    opacity: isDone || isSkipped ? 0.55 : 1,
                    borderColor: isDone
                      ? "var(--teal-border)"
                      : isSkipped
                        ? "transparent"
                        : "var(--border)",
                    background: isDone ? "var(--teal-dim)" : undefined,
                  }}
                  onClick={(e) => handleToggle(slot.id, e)}
                >
                  <div style={styles.checkIcon}>
                    {isDone && (
                      <CheckCircle2
                        color="var(--teal)"
                        fill="var(--teal-dim)"
                        size={20}
                      />
                    )}
                    {isSkipped && (
                      <SkipForward color="var(--muted)" size={20} />
                    )}
                    {!isDone && !isSkipped && (
                      <Circle color="var(--muted)" size={20} />
                    )}
                  </div>
                  <div style={styles.slotContent}>
                    <div
                      style={{
                        ...styles.slotTitle,
                        textDecoration:
                          isDone || isSkipped ? "line-through" : "none",
                        color: isSkipped ? "var(--muted)" : undefined,
                      }}
                    >
                      <span style={styles.slotTime}>{slot.time}</span>
                      <span style={styles.slotSep}>·</span>
                      <span>{slot.label}</span>
                      {hasOverride && (
                        <span style={styles.editedBadge}>edited</span>
                      )}
                    </div>
                    <div style={styles.slotDetail}>
                      <span>{slot.detail}</span>
                      <div style={styles.slotRight}>
                        <span
                          style={{
                            ...styles.pillarBadge,
                            color: pillar.color,
                            background: pillar.dim,
                            borderColor: pillar.border,
                          }}
                        >
                          {pillar.emoji} {pillar.label}
                        </span>
                        {slot.url && (
                          <a
                            href={slot.url}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.linkBtn}
                            title="Open resource"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          style={styles.editBtn}
                          title="Edit slot"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSlot(slot.id);
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        {hasOverride && (
                          <button
                            style={styles.resetBtn}
                            title="Reset to default"
                            onClick={(e) => handleResetOverride(slot.id, e)}
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom tasks */}
      <div style={styles.customSection}>
        <div style={styles.customSectionHeader}>
          <span style={styles.customSectionTitle}>
            My tasks · {dayData.label}
          </span>
          {!showAddTask && (
            <button
              style={styles.addTaskBtn}
              onClick={() => setShowAddTask(true)}
            >
              <Plus size={13} /> Add task
            </button>
          )}
        </div>
        {showAddTask && (
          <AddTaskForm
            onSave={handleAddCustomTask}
            onCancel={() => setShowAddTask(false)}
          />
        )}
        {dayCustomTasks.length === 0 && !showAddTask && (
          <div style={styles.emptyCustom}>
            No custom tasks yet. Hit + to add one.
          </div>
        )}
        <div style={styles.customList}>
          {dayCustomTasks.map((task) => (
            <div
              key={task.id}
              style={{ ...styles.customTask, opacity: task.done ? 0.5 : 1 }}
            >
              <button
                style={styles.customCheck}
                onClick={() => handleToggleCustomTask(task.id)}
              >
                {task.done ? (
                  <CheckCircle2
                    color="var(--teal)"
                    fill="var(--teal-dim)"
                    size={18}
                  />
                ) : (
                  <Circle color="var(--muted)" size={18} />
                )}
              </button>
              <div style={styles.customTaskContent}>
                <span
                  style={{
                    ...styles.customTaskLabel,
                    textDecoration: task.done ? "line-through" : "none",
                  }}
                >
                  <span style={styles.slotTime}>{task.time}</span>
                  <span style={styles.slotSep}>·</span>
                  {task.label}
                </span>
                {task.url && (
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.linkBtn}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <button
                style={styles.deleteTaskBtn}
                onClick={() => handleDeleteCustomTask(task.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.hint}>
        Tap slot: ⬜ → ✅ done → ⏭ skipped · ✏️ to edit any slot
      </div>
    </div>
  );
}

const editStyles = {
  form: {
    background: "var(--surface2)",
    border: "1px solid var(--teal-border)",
    borderRadius: "var(--radius)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  row: { display: "flex", gap: 8 },
  input: {
    flex: 1,
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    padding: "7px 10px",
    fontSize: 13,
    fontFamily: "var(--sans)",
    outline: "none",
  },
  btnRow: { display: "flex", gap: 8, justifyContent: "flex-end" },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "var(--teal)",
    border: "none",
    borderRadius: "var(--radius-sm)",
    color: "#0d0f12",
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
  cancelBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--muted)",
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "var(--sans)",
  },
};

const styles = {
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    height: "100%",
  },
  header: { display: "flex", flexDirection: "column", gap: 12 },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wfhBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    background: "var(--amber-dim)",
    color: "var(--amber)",
    border: "1px solid var(--amber-border)",
    borderRadius: 8,
    letterSpacing: "0.02em",
  },
  daySelector: {
    display: "flex",
    gap: 6,
    width: "100%",
    justifyContent: "space-between",
  },
  dayPill: {
    flex: 1,
    padding: "6px 0",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    borderRadius: 8,
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "var(--transition)",
  },
  dayPillActive: {
    background: "var(--teal)",
    color: "#0d0f12",
    borderColor: "var(--teal)",
  },
  dayPillToday: { borderColor: "var(--teal-border)", color: "var(--teal)" },
  progressContainer: { display: "flex", flexDirection: "column", gap: 6 },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 600,
  },
  progressLabel: {
    color: "var(--text2)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: 10,
  },
  progressFraction: { color: "var(--teal)", fontFamily: "var(--mono)" },
  progressBarBg: {
    height: 6,
    background: "var(--surface3)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "var(--teal)",
    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  skippedCount: { color: "var(--muted)", fontFamily: "var(--mono)" },
  slotList: { display: "flex", flexDirection: "column", gap: 8 },
  slotItem: {
    display: "flex",
    gap: 12,
    cursor: "pointer",
    padding: "10px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    transition: "all 0.15s",
  },
  checkIcon: { flexShrink: 0, marginTop: 2 },
  slotContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  slotTitle: {
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  slotTime: {
    fontFamily: "var(--mono)",
    fontWeight: 500,
    color: "var(--text2)",
    fontSize: 12,
  },
  slotSep: { color: "var(--muted)", margin: "0 2px" },
  slotDetail: {
    fontSize: 12,
    color: "var(--muted)",
    lineHeight: 1.5,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },
  slotRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  pillarBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 6,
    border: "1px solid transparent",
  },
  linkBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--teal)",
    background: "var(--teal-dim)",
    border: "1px solid var(--teal-border)",
    borderRadius: 6,
    padding: "2px 5px",
    textDecoration: "none",
    flexShrink: 0,
  },
  editBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--muted)",
    cursor: "pointer",
    padding: "2px 5px",
    flexShrink: 0,
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--muted)",
    cursor: "pointer",
    padding: "2px 6px",
    fontSize: 11,
    flexShrink: 0,
  },
  editedBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: "1px 5px",
    background: "var(--purple-dim)",
    color: "var(--purple)",
    border: "1px solid var(--purple-border)",
    borderRadius: 4,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  customSection: {
    borderTop: "1px solid var(--border)",
    paddingTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  customSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customSectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  addTaskBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--teal)",
    cursor: "pointer",
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "var(--sans)",
  },
  emptyCustom: {
    fontSize: 12,
    color: "var(--muted)",
    textAlign: "center",
    padding: "8px 0",
  },
  customList: { display: "flex", flexDirection: "column", gap: 6 },
  customTask: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  customCheck: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  customTaskContent: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  customTaskLabel: {
    fontSize: 13,
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontWeight: 500,
    flex: 1,
  },
  deleteTaskBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  hint: {
    fontSize: 11,
    color: "var(--muted)",
    textAlign: "center",
    fontFamily: "var(--mono)",
    borderTop: "1px solid var(--border)",
    paddingTop: 12,
  },
};
