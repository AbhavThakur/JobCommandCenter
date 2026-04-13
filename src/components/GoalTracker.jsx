import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  Plus,
  Check,
  Trash2,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function GoalTracker() {
  const [goals, setGoals] = useLocalStorage("growthOS_goals", []);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // New goal form state
  const [form, setForm] = useState({
    title: "",
    deadline: "",
    category: "teal",
  });

  const categories = [
    { id: "teal", label: "Investing", color: "var(--teal)" },
    { id: "purple", label: "AI / Career", color: "var(--accent-bright)" },
    { id: "amber", label: "Power Skills", color: "var(--amber)" },
    { id: "green", label: "Health", color: "var(--green)" },
  ];

  const addGoal = () => {
    if (!form.title.trim()) return;
    const newGoal = {
      id: Date.now().toString(),
      title: form.title.trim(),
      deadline: form.deadline || null,
      category: form.category,
      milestones: [],
      done: false,
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    setForm({ title: "", deadline: "", category: "teal" });
    setAdding(false);
    setExpanded(newGoal.id);
  };

  const toggleDone = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    );
  };

  const deleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const addMilestone = (goalId, text) => {
    if (!text.trim()) return;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: [
                ...g.milestones,
                { id: Date.now().toString(), text: text.trim(), done: false },
              ],
            }
          : g,
      ),
    );
  };

  const toggleMilestone = (goalId, msId) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === msId ? { ...m, done: !m.done } : m,
              ),
            }
          : g,
      ),
    );
  };

  const deleteMilestone = (goalId, msId) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.filter((m) => m.id !== msId) }
          : g,
      ),
    );
  };

  const active = goals.filter((g) => !g.done);
  const completed = goals.filter((g) => g.done);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <Target size={16} color="var(--green)" />
          <h3 style={s.title}>Goals & Milestones</h3>
        </div>
        <button style={s.addBtn} onClick={() => setAdding((v) => !v)}>
          <Plus size={14} />
          New goal
        </button>
      </div>

      {adding && (
        <div style={s.addForm}>
          <input
            style={s.input}
            placeholder='Goal title (e.g. "Finish Zerodha Varsity Modules 1–5")'
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              type="date"
              value={form.deadline}
              onChange={(e) =>
                setForm((f) => ({ ...f, deadline: e.target.value }))
              }
            />
            <select
              style={{ ...s.input, flex: 1 }}
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.saveBtn} onClick={addGoal}>
              <Check size={13} /> Add goal
            </button>
            <button style={s.cancelBtn} onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {active.length === 0 && !adding && (
        <div style={s.empty}>No active goals — add one above ↑</div>
      )}

      {active.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          categories={categories}
          expanded={expanded === goal.id}
          onExpand={() => setExpanded((v) => (v === goal.id ? null : goal.id))}
          onToggleDone={() => toggleDone(goal.id)}
          onDelete={() => deleteGoal(goal.id)}
          onAddMilestone={(text) => addMilestone(goal.id, text)}
          onToggleMilestone={(msId) => toggleMilestone(goal.id, msId)}
          onDeleteMilestone={(msId) => deleteMilestone(goal.id, msId)}
        />
      ))}

      {completed.length > 0 && (
        <details style={s.completedDetails}>
          <summary style={s.completedSummary}>
            ✅ Completed ({completed.length})
          </summary>
          {completed.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              categories={categories}
              expanded={expanded === goal.id}
              onExpand={() =>
                setExpanded((v) => (v === goal.id ? null : goal.id))
              }
              onToggleDone={() => toggleDone(goal.id)}
              onDelete={() => deleteGoal(goal.id)}
              onAddMilestone={(text) => addMilestone(goal.id, text)}
              onToggleMilestone={(msId) => toggleMilestone(goal.id, msId)}
              onDeleteMilestone={(msId) => deleteMilestone(goal.id, msId)}
            />
          ))}
        </details>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  categories,
  expanded,
  onExpand,
  onToggleDone,
  onDelete,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
}) {
  const [msInput, setMsInput] = useState("");

  const cat = categories.find((c) => c.id === goal.category);
  const color = cat?.color ?? "var(--teal)";
  const msTotal = goal.milestones.length;
  const msDone = goal.milestones.filter((m) => m.done).length;
  const progress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  const deadlinePassed =
    goal.deadline && new Date(goal.deadline) < new Date() && !goal.done;

  const daysTill = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
    : null;

  return (
    <div style={{ ...s.goalCard, opacity: goal.done ? 0.6 : 1 }}>
      <div style={s.goalHeader} onClick={onExpand}>
        <div style={{ ...s.goalDot, background: color }} />
        <div style={s.goalInfo}>
          <div
            style={{
              ...s.goalTitle,
              textDecoration: goal.done ? "line-through" : "none",
            }}
          >
            {goal.title}
          </div>
          <div style={s.goalMeta}>
            {cat && <span style={{ color }}>{cat.label}</span>}
            {goal.deadline && (
              <span
                style={{
                  color: deadlinePassed ? "var(--red)" : "var(--muted)",
                }}
              >
                {deadlinePassed
                  ? "Overdue"
                  : daysTill === 0
                    ? "Due today"
                    : `${daysTill}d left`}
              </span>
            )}
            {msTotal > 0 && (
              <span style={{ color: "var(--muted)" }}>
                {msDone}/{msTotal} milestones
              </span>
            )}
          </div>
        </div>
        <div style={s.goalActions}>
          <button
            style={{
              ...s.iconBtn,
              color: goal.done ? "var(--green)" : "var(--muted)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone();
            }}
            title={goal.done ? "Mark undone" : "Mark done"}
          >
            <Check size={14} />
          </button>
          <button
            style={{ ...s.iconBtn, color: "var(--muted)" }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete goal"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? (
            <ChevronUp size={14} color="var(--muted)" />
          ) : (
            <ChevronDown size={14} color="var(--muted)" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      {msTotal > 0 && (
        <div style={s.progressBar}>
          <div
            style={{
              ...s.progressFill,
              width: `${progress}%`,
              background: color,
            }}
          />
        </div>
      )}

      {/* Milestones */}
      {expanded && (
        <div style={s.milestones}>
          {goal.milestones.map((ms) => (
            <div key={ms.id} style={s.msRow}>
              <button
                style={{
                  ...s.msCheck,
                  borderColor: ms.done ? color : "var(--surface3)",
                  background: ms.done ? color : "transparent",
                }}
                onClick={() => onToggleMilestone(ms.id)}
              >
                {ms.done && <Check size={10} color="#000" />}
              </button>
              <span
                style={{
                  ...s.msText,
                  textDecoration: ms.done ? "line-through" : "none",
                  color: ms.done ? "var(--muted)" : "var(--text2)",
                }}
              >
                {ms.text}
              </span>
              <button
                style={{
                  ...s.iconBtn,
                  color: "var(--muted)",
                  marginLeft: "auto",
                }}
                onClick={() => onDeleteMilestone(ms.id)}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {!goal.done && (
            <div style={s.msAddRow}>
              <input
                style={s.msInput}
                placeholder="Add milestone..."
                value={msInput}
                onChange={(e) => setMsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onAddMilestone(msInput);
                    setMsInput("");
                  }
                }}
              />
              <button
                style={s.msAddBtn}
                onClick={() => {
                  onAddMilestone(msInput);
                  setMsInput("");
                }}
              >
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--surface3)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { display: "flex", alignItems: "center", gap: 8 },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text)",
    margin: 0,
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "var(--green-dim)",
    border: "1px solid var(--green-border)",
    borderRadius: 8,
    color: "var(--green)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
  },
  addForm: {
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  input: {
    background: "var(--surface3)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 13,
    padding: "8px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "var(--green)",
    border: "none",
    borderRadius: 8,
    color: "#000",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    padding: "7px 14px",
  },
  cancelBtn: {
    background: "none",
    border: "1px solid var(--surface3)",
    borderRadius: 8,
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: 12,
    padding: "7px 14px",
  },
  empty: {
    color: "var(--muted)",
    fontSize: 13,
    textAlign: "center",
    padding: "12px 0",
  },
  goalCard: {
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    cursor: "default",
  },
  goalHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    cursor: "pointer",
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    marginTop: 5,
    flexShrink: 0,
  },
  goalInfo: { flex: 1 },
  goalTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text)",
    lineHeight: 1.4,
  },
  goalMeta: {
    display: "flex",
    gap: 10,
    marginTop: 3,
    fontSize: 11,
    flexWrap: "wrap",
  },
  goalActions: { display: "flex", alignItems: "center", gap: 4 },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
  },
  progressBar: {
    height: 4,
    background: "var(--surface3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  milestones: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    paddingLeft: 20,
  },
  msRow: { display: "flex", alignItems: "center", gap: 8 },
  msCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "1.5px solid",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msText: { fontSize: 13, flex: 1 },
  msAddRow: { display: "flex", gap: 6, marginTop: 4 },
  msInput: {
    flex: 1,
    background: "var(--surface3)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 12,
    padding: "6px 10px",
    outline: "none",
  },
  msAddBtn: {
    background: "var(--surface3)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text2)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px 8px",
  },
  completedDetails: { marginTop: 4 },
  completedSummary: {
    fontSize: 12,
    color: "var(--muted)",
    cursor: "pointer",
    padding: "4px 0",
    userSelect: "none",
  },
};
