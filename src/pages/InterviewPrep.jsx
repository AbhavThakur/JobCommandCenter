import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  Filter,
  RotateCcw,
  Sparkles,
  Code,
  MessageSquare,
  Cpu,
  ClipboardList,
} from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  DSA_CATEGORIES,
  DSA_DIFFICULTIES,
  DSA_STATUSES,
  DSA_STARTER_TOPICS,
  BEHAVIORAL_PROMPTS,
  SYSTEM_DESIGN_CASES,
  MOCK_TYPES,
} from "../data/interviewPresets";

const REVIEW_DUE_DAYS = 7;

function daysSince(iso) {
  if (!iso) return Infinity;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtRelative(iso) {
  if (!iso) return "Not revised";
  const d = daysSince(iso);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const TABS = [
  { id: "dsa", label: "DSA", icon: Code },
  { id: "behavioral", label: "Behavioral", icon: MessageSquare },
  { id: "system", label: "System Design", icon: Cpu },
  { id: "mocks", label: "Mocks", icon: ClipboardList },
];

export default function InterviewPrep() {
  const [tab, setTab] = useState("dsa");

  return (
    <div className="interview-prep-page">
      <div className="page-header">
        <h2>Interview Prep</h2>
        <p className="subtitle">
          Track DSA, behavioral stories, system design, and mock sessions in one
          place.
        </p>
      </div>

      <div className="ip-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`ip-tab ${tab === t.id ? "ip-tab-active" : ""}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dsa" && <DsaTab />}
      {tab === "behavioral" && <BehavioralTab />}
      {tab === "system" && <SystemDesignTab />}
      {tab === "mocks" && <MocksTab />}
    </div>
  );
}

/* ----------------------------------------------------------------- DSA */

function DsaTab() {
  const [topics, setTopics] = useLocalStorage("growthOS_dsa_topics", []);
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(DSA_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState({
    status: "all",
    difficulty: "all",
    category: "all",
    q: "",
  });

  const add = () => {
    if (!topic.trim()) return;
    const now = new Date().toISOString();
    setTopics((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        topic: topic.trim(),
        category,
        difficulty,
        status: "Pending",
        link: link.trim() || null,
        createdAt: now,
        lastRevised: null,
      },
    ]);
    setTopic("");
    setLink("");
  };

  const update = (id, patch) =>
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );

  const markRevised = (id) =>
    update(id, { status: "Revised", lastRevised: new Date().toISOString() });

  const remove = (id) => setTopics((prev) => prev.filter((t) => t.id !== id));

  const seedStarter = () => {
    if (
      topics.length > 0 &&
      !confirm("This will add 30 starter topics. Continue?")
    )
      return;
    const now = new Date().toISOString();
    const existing = new Set(topics.map((t) => t.topic.toLowerCase()));
    const seed = DSA_STARTER_TOPICS.filter(
      (s) => !existing.has(s.topic.toLowerCase()),
    ).map((s) => ({
      id: `${Date.now()}-${s.topic}`,
      ...s,
      status: "Pending",
      link: null,
      createdAt: now,
      lastRevised: null,
    }));
    setTopics((prev) => [...prev, ...seed]);
  };

  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return topics.filter((t) => {
      if (filter.status !== "all" && t.status !== filter.status) return false;
      if (filter.difficulty !== "all" && t.difficulty !== filter.difficulty)
        return false;
      if (filter.category !== "all" && t.category !== filter.category)
        return false;
      if (q && !t.topic.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topics, filter]);

  const stats = useMemo(() => {
    const total = topics.length;
    const confident = topics.filter((t) => t.status === "Confident").length;
    const revised = topics.filter((t) => t.status === "Revised").length;
    const pending = topics.filter((t) => t.status === "Pending").length;
    const dueForReview = topics.filter(
      (t) =>
        t.status === "Revised" && daysSince(t.lastRevised) >= REVIEW_DUE_DAYS,
    ).length;
    return { total, confident, revised, pending, dueForReview };
  }, [topics]);

  return (
    <div className="ip-section">
      <div className="ip-stats">
        <Stat label="Total" value={stats.total} />
        <Stat label="Confident" value={stats.confident} color="var(--green)" />
        <Stat label="Revised" value={stats.revised} color="var(--teal)" />
        <Stat label="Pending" value={stats.pending} color="var(--amber)" />
        <Stat
          label={`Due (>${REVIEW_DUE_DAYS}d)`}
          value={stats.dueForReview}
          color="var(--red)"
        />
      </div>

      <div className="card">
        <h3>Add a problem</h3>
        <div className="ip-add-grid">
          <input
            type="text"
            placeholder="Problem name (e.g. Two Sum)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {DSA_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DSA_DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            type="url"
            placeholder="Link (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button className="btn btn-accent" onClick={add} type="button">
            <Plus size={14} /> Add
          </button>
        </div>
        {topics.length === 0 && (
          <button
            className="btn btn-secondary mt-10"
            onClick={seedStarter}
            type="button"
          >
            <Sparkles size={14} /> Seed with 30 starter problems
          </button>
        )}
      </div>

      <div className="card">
        <div className="ip-filter-bar">
          <div className="ip-filter-left">
            <Filter size={14} />
            <input
              type="text"
              className="ip-search"
              placeholder="Search topics…"
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="all">All status</option>
            {DSA_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={filter.difficulty}
            onChange={(e) =>
              setFilter((f) => ({ ...f, difficulty: e.target.value }))
            }
          >
            <option value="all">All difficulty</option>
            {DSA_DIFFICULTIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={filter.category}
            onChange={(e) =>
              setFilter((f) => ({ ...f, category: e.target.value }))
            }
          >
            <option value="all">All categories</option>
            {DSA_CATEGORIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="hint">
            {topics.length === 0
              ? "No topics yet. Add one above or seed the starter pack."
              : "No topics match these filters."}
          </p>
        ) : (
          <ul className="ip-list">
            {filtered
              .slice()
              .sort((a, b) => {
                const order = { Pending: 0, Revised: 1, Confident: 2 };
                return order[a.status] - order[b.status];
              })
              .map((t) => {
                const overdue =
                  t.status === "Revised" &&
                  daysSince(t.lastRevised) >= REVIEW_DUE_DAYS;
                return (
                  <li
                    key={t.id}
                    className={`ip-item ip-status-${t.status.toLowerCase()}`}
                  >
                    <div className="ip-item-main">
                      <div className="ip-item-title">
                        {t.link ? (
                          <a
                            href={t.link}
                            target="_blank"
                            rel="noreferrer"
                            className="ip-link"
                          >
                            {t.topic} <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span>{t.topic}</span>
                        )}
                      </div>
                      <div className="ip-item-meta">
                        <span
                          className={`ip-pill ip-diff-${t.difficulty.toLowerCase()}`}
                        >
                          {t.difficulty}
                        </span>
                        <span className="ip-pill ip-pill-muted">
                          {t.category}
                        </span>
                        <span className="ip-pill-text">
                          Last: {fmtRelative(t.lastRevised)}
                          {overdue && (
                            <strong className="overdue"> · due</strong>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="ip-item-actions">
                      <button
                        type="button"
                        title="Mark revised"
                        className="btn-icon"
                        onClick={() => markRevised(t.id)}
                      >
                        <RotateCcw size={14} />
                      </button>
                      <select
                        value={t.status}
                        onChange={(e) =>
                          update(t.id, { status: e.target.value })
                        }
                      >
                        {DSA_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        title="Delete"
                        className="btn-icon btn-icon-danger"
                        onClick={() => remove(t.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Behavioral */

function BehavioralTab() {
  const [stories, setStories] = useLocalStorage("growthOS_ip_stories", []);
  const [draft, setDraft] = useState({
    prompt: BEHAVIORAL_PROMPTS[0],
    situation: "",
    task: "",
    action: "",
    result: "",
  });
  const [customPrompt, setCustomPrompt] = useState("");
  const [editId, setEditId] = useState(null);

  const save = () => {
    const promptText =
      draft.prompt === "__custom__" ? customPrompt.trim() : draft.prompt;
    if (!promptText) return;
    if (!draft.situation.trim() && !draft.action.trim()) return;
    const payload = {
      ...draft,
      prompt: promptText,
      updatedAt: new Date().toISOString(),
    };
    if (editId) {
      setStories((prev) =>
        prev.map((s) => (s.id === editId ? { ...s, ...payload } : s)),
      );
    } else {
      setStories((prev) => [...prev, { id: `${Date.now()}`, ...payload }]);
    }
    reset();
  };

  const reset = () => {
    setDraft({
      prompt: BEHAVIORAL_PROMPTS[0],
      situation: "",
      task: "",
      action: "",
      result: "",
    });
    setCustomPrompt("");
    setEditId(null);
  };

  const edit = (s) => {
    const known = BEHAVIORAL_PROMPTS.includes(s.prompt);
    setDraft({
      prompt: known ? s.prompt : "__custom__",
      situation: s.situation || "",
      task: s.task || "",
      action: s.action || "",
      result: s.result || "",
    });
    setCustomPrompt(known ? "" : s.prompt);
    setEditId(s.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (id) => setStories((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="ip-section">
      <div className="card">
        <h3>{editId ? "Edit STAR story" : "New STAR story"}</h3>
        <label className="ip-label">Prompt</label>
        <select
          className="ip-full"
          value={draft.prompt}
          onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
        >
          {BEHAVIORAL_PROMPTS.map((p) => (
            <option key={p}>{p}</option>
          ))}
          <option value="__custom__">— Custom prompt —</option>
        </select>
        {draft.prompt === "__custom__" && (
          <input
            type="text"
            className="ip-full mt-8"
            placeholder="Enter your own prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        )}
        <div className="ip-star-grid">
          <StarField
            label="Situation"
            value={draft.situation}
            onChange={(v) => setDraft((d) => ({ ...d, situation: v }))}
          />
          <StarField
            label="Task"
            value={draft.task}
            onChange={(v) => setDraft((d) => ({ ...d, task: v }))}
          />
          <StarField
            label="Action"
            value={draft.action}
            onChange={(v) => setDraft((d) => ({ ...d, action: v }))}
          />
          <StarField
            label="Result"
            value={draft.result}
            onChange={(v) => setDraft((d) => ({ ...d, result: v }))}
          />
        </div>
        <div className="row form-actions">
          {editId && (
            <button type="button" className="btn" onClick={reset}>
              Cancel
            </button>
          )}
          <button type="button" className="btn btn-accent" onClick={save}>
            {editId ? "Save changes" : "Save story"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Your stories ({stories.length})</h3>
        {stories.length === 0 ? (
          <p className="hint">
            No stories yet. Start with "Tell me about a time you failed."
          </p>
        ) : (
          <ul className="ip-story-list">
            {stories.map((s) => (
              <li key={s.id} className="ip-story">
                <div className="ip-story-head">
                  <strong>{s.prompt}</strong>
                  <div className="ip-item-actions">
                    <button
                      className="btn-icon"
                      type="button"
                      onClick={() => edit(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      type="button"
                      onClick={() => remove(s.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <dl className="ip-star-dl">
                  {["situation", "task", "action", "result"].map(
                    (k) =>
                      s[k] && (
                        <div key={k}>
                          <dt>{k[0].toUpperCase() + k.slice(1)}</dt>
                          <dd>{s[k]}</dd>
                        </div>
                      ),
                  )}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StarField({ label, value, onChange }) {
  return (
    <div>
      <label className="ip-label">{label}</label>
      <textarea
        className="ip-full"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Describe the ${label.toLowerCase()}…`}
      />
    </div>
  );
}

/* --------------------------------------------------------- System Design */

function SystemDesignTab() {
  const [cases, setCases] = useLocalStorage("growthOS_ip_system_design", []);
  const [custom, setCustom] = useState("");

  const presetState = useMemo(() => {
    const map = new Map(cases.map((c) => [c.name, c]));
    return SYSTEM_DESIGN_CASES.map((p) => ({
      ...p,
      status: map.get(p.name)?.status || "not-started",
      notes: map.get(p.name)?.notes || "",
    }));
  }, [cases]);

  const setStatus = (name, status, area) => {
    setCases((prev) => {
      const idx = prev.findIndex((c) => c.name === name);
      if (idx === -1) return [...prev, { name, area, status, notes: "" }];
      const next = [...prev];
      next[idx] = { ...next[idx], status };
      return next;
    });
  };

  const setNotes = (name, notes, area) => {
    setCases((prev) => {
      const idx = prev.findIndex((c) => c.name === name);
      if (idx === -1)
        return [...prev, { name, area, status: "not-started", notes }];
      const next = [...prev];
      next[idx] = { ...next[idx], notes };
      return next;
    });
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    setCases((prev) => [
      ...prev,
      { name: custom.trim(), area: "Custom", status: "not-started", notes: "" },
    ]);
    setCustom("");
  };

  const remove = (name) =>
    setCases((prev) => prev.filter((c) => c.name !== name));
  const customCases = cases.filter(
    (c) => !SYSTEM_DESIGN_CASES.some((p) => p.name === c.name),
  );

  const studied = cases.filter((c) => c.status !== "not-started").length;

  return (
    <div className="ip-section">
      <div className="ip-stats">
        <Stat label="Cases studied" value={studied} color="var(--teal)" />
        <Stat
          label="Total available"
          value={SYSTEM_DESIGN_CASES.length + customCases.length}
        />
      </div>

      <div className="card">
        <h3>Add custom case</h3>
        <div className="row">
          <input
            type="text"
            className="ip-full"
            placeholder="e.g. Design Stripe payments"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
          />
          <button className="btn btn-accent" type="button" onClick={addCustom}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Case library</h3>
        <ul className="ip-sd-list">
          {presetState.map((c) => (
            <SystemDesignRow
              key={c.name}
              caseItem={c}
              onStatus={(s) => setStatus(c.name, s, c.area)}
              onNotes={(n) => setNotes(c.name, n, c.area)}
            />
          ))}
          {customCases.map((c) => (
            <SystemDesignRow
              key={c.name}
              caseItem={c}
              custom
              onStatus={(s) => setStatus(c.name, s, c.area)}
              onNotes={(n) => setNotes(c.name, n, c.area)}
              onDelete={() => remove(c.name)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SystemDesignRow({ caseItem, custom, onStatus, onNotes, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`ip-sd-row ip-sd-${caseItem.status}`}>
      <div className="ip-sd-head">
        <button
          type="button"
          className="ip-sd-title"
          onClick={() => setOpen((o) => !o)}
        >
          <span>{caseItem.name}</span>
          <span className="ip-pill ip-pill-muted">{caseItem.area}</span>
        </button>
        <div className="ip-item-actions">
          <select
            value={caseItem.status}
            onChange={(e) => onStatus(e.target.value)}
          >
            <option value="not-started">Not started</option>
            <option value="studied">Studied</option>
            <option value="practiced">Practiced</option>
          </select>
          {custom && onDelete && (
            <button
              className="btn-icon btn-icon-danger"
              type="button"
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <textarea
          className="ip-full mt-8"
          rows={4}
          placeholder="Notes — components, tradeoffs, capacity estimates…"
          value={caseItem.notes}
          onChange={(e) => onNotes(e.target.value)}
        />
      )}
    </li>
  );
}

/* --------------------------------------------------------- Mocks */

function MocksTab() {
  const [mocks, setMocks] = useLocalStorage("growthOS_ip_mocks", []);
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: MOCK_TYPES[0],
    company: "",
    score: 3,
    notes: "",
  });

  const add = () => {
    setMocks((prev) => [{ id: `${Date.now()}`, ...draft }, ...prev]);
    setDraft({
      date: new Date().toISOString().slice(0, 10),
      type: MOCK_TYPES[0],
      company: "",
      score: 3,
      notes: "",
    });
  };

  const remove = (id) => setMocks((prev) => prev.filter((m) => m.id !== id));

  const avg = mocks.length
    ? (
        mocks.reduce((sum, m) => sum + Number(m.score || 0), 0) / mocks.length
      ).toFixed(1)
    : "—";

  return (
    <div className="ip-section">
      <div className="ip-stats">
        <Stat label="Mocks logged" value={mocks.length} />
        <Stat label="Avg score" value={avg} color="var(--accent-bright)" />
        <Stat
          label="Last 30d"
          value={mocks.filter((m) => daysSince(m.date) <= 30).length}
          color="var(--teal)"
        />
      </div>

      <div className="card">
        <h3>Log a session</h3>
        <div className="ip-mock-grid">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
          />
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
          >
            {MOCK_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Company / interviewer (optional)"
            value={draft.company}
            onChange={(e) =>
              setDraft((d) => ({ ...d, company: e.target.value }))
            }
          />
          <select
            value={draft.score}
            onChange={(e) =>
              setDraft((d) => ({ ...d, score: Number(e.target.value) }))
            }
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Score: {n}/5
              </option>
            ))}
          </select>
          <button className="btn btn-accent" type="button" onClick={add}>
            <Plus size={14} /> Log
          </button>
        </div>
        <textarea
          className="ip-full mt-8"
          rows={3}
          placeholder="What went well? What to improve?"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
        />
      </div>

      <div className="card">
        <h3>History</h3>
        {mocks.length === 0 ? (
          <p className="hint">No mocks logged yet. Schedule one this week.</p>
        ) : (
          <ul className="ip-mock-list">
            {mocks.map((m) => (
              <li key={m.id} className="ip-mock">
                <div>
                  <div className="ip-mock-head">
                    <strong>{m.type}</strong>
                    {m.company && <span className="muted">@ {m.company}</span>}
                    <span className="ip-pill ip-pill-muted">{m.date}</span>
                    <span className="ip-pill ip-score">{m.score}/5</span>
                  </div>
                  {m.notes && <p className="ip-mock-notes">{m.notes}</p>}
                </div>
                <button
                  className="btn-icon btn-icon-danger"
                  type="button"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Shared bits */

function Stat({ label, value, color }) {
  return (
    <div className="ip-stat">
      <div className="ip-stat-num" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="ip-stat-label">{label}</div>
    </div>
  );
}
