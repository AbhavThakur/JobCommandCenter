import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Brain,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import {
  subscribeLearningItems,
  addLearningItem,
  updateLearningItem,
  deleteLearningItem,
  subscribeFlashcards,
  addFlashcard,
  reviewFlashcard,
  deleteFlashcard,
  isDue,
} from "../services/learningData";

const KIND_META = {
  book: { label: "Book", Icon: BookOpen },
  course: { label: "Course", Icon: GraduationCap },
  paper: { label: "Paper", Icon: FileText },
};

const STATUS_META = {
  todo: { label: "To do", Icon: PauseCircle },
  active: { label: "Active", Icon: PlayCircle },
  paused: { label: "Paused", Icon: PauseCircle },
  done: { label: "Done", Icon: CheckCircle2 },
};

export default function Learning() {
  const [tab, setTab] = useState("library");
  const [items, setItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubA, unsubB;
    try {
      unsubA = subscribeLearningItems(
        (data) => {
          setItems(data);
          setLoading(false);
        },
        (e) => setError(e.message),
      );
      unsubB = subscribeFlashcards(setCards, (e) => setError(e.message));
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
    return () => {
      unsubA?.();
      unsubB?.();
    };
  }, []);

  const dueCount = useMemo(() => cards.filter(isDue).length, [cards]);

  return (
    <div className="learning-page">
      <div className="page-header">
        <h2>Learning</h2>
        <p className="subtitle">
          Books, courses, and spaced-repetition flashcards — your knowledge OS.
        </p>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "library"}
          className={`tab ${tab === "library" ? "active" : ""}`}
          onClick={() => setTab("library")}
        >
          Library ({items.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === "review"}
          className={`tab ${tab === "review" ? "active" : ""}`}
          onClick={() => setTab("review")}
        >
          Review {dueCount > 0 && <span className="badge">{dueCount}</span>}
        </button>
      </div>

      {error && <div className="card error">{error}</div>}
      {loading && <div className="card">Loading…</div>}

      {!loading && tab === "library" && <LibraryTab items={items} />}
      {!loading && tab === "review" && <ReviewTab cards={cards} />}
    </div>
  );
}

// ─── Library tab ──────────────────────────────────────────────────────────

function LibraryTab({ items }) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (["book", "course", "paper"].includes(filter)) {
      return items.filter((i) => i.kind === filter);
    }
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  return (
    <>
      <div className="card learning-toolbar">
        <div className="filters">
          {[
            ["all", "All"],
            ["active", "Active"],
            ["todo", "To do"],
            ["done", "Done"],
            ["book", "Books"],
            ["course", "Courses"],
            ["paper", "Papers"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`chip ${filter === id ? "active" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="btn btn-accent"
          onClick={() => setShowForm((s) => !s)}
        >
          <Plus size={16} /> Add item
        </button>
      </div>

      {showForm && (
        <ItemForm
          onCancel={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}

      {filtered.length === 0 ? (
        <p className="hint">Nothing here yet. Add a book, course, or paper.</p>
      ) : (
        <div className="learning-grid">
          {filtered.map((item) => (
            <LearningCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

function ItemForm({ onSaved, onCancel }) {
  const [kind, setKind] = useState("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await addLearningItem({ kind, title, author, url, status: "todo" });
      setTitle("");
      setAuthor("");
      setUrl("");
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
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="book">Book</option>
          <option value="course">Course</option>
          <option value="paper">Paper</option>
        </select>
        <input
          type="text"
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="row">
        <input
          type="text"
          placeholder="Author / Instructor"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          type="url"
          placeholder="URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      {err && <p className="error">{err}</p>}
      <div className="row form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-accent" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function LearningCard({ item }) {
  const { Icon } = KIND_META[item.kind] || KIND_META.book;
  const [progress, setProgress] = useState(item.progress || 0);
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    setProgress(item.progress || 0);
  }, [item.progress]);

  const commitProgress = async () => {
    if (progress === item.progress) return;
    setSavingProgress(true);
    try {
      await updateLearningItem(item.id, { progress });
    } finally {
      setSavingProgress(false);
    }
  };

  const setStatus = (status) => updateLearningItem(item.id, { status });

  const onDelete = async () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await deleteLearningItem(item.id);
  };

  return (
    <div className={`card learning-card status-${item.status}`}>
      <div className="learning-card-head">
        <div className="learning-kind">
          <Icon size={16} />
          <span>{KIND_META[item.kind]?.label || item.kind}</span>
        </div>
        <button className="btn-icon" aria-label="Delete" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
      <h4 className="learning-title">
        {item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title} <ExternalLink size={12} />
          </a>
        ) : (
          item.title
        )}
      </h4>
      {item.author && <p className="hint">{item.author}</p>}

      <div className="learning-progress">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          onMouseUp={commitProgress}
          onTouchEnd={commitProgress}
          onBlur={commitProgress}
        />
        <span>{savingProgress ? "…" : `${progress}%`}</span>
      </div>

      <div className="learning-status-row">
        {Object.entries(STATUS_META).map(([id, { label, Icon: SIcon }]) => (
          <button
            key={id}
            className={`chip ${item.status === id ? "active" : ""}`}
            onClick={() => setStatus(id)}
          >
            <SIcon size={12} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Review tab (spaced repetition) ──────────────────────────────────────

function ReviewTab({ cards }) {
  const [showForm, setShowForm] = useState(false);
  const dueCards = useMemo(() => cards.filter(isDue), [cards]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setRevealed(false);
  }, [dueCards.length]);

  const current = dueCards[idx];

  const rate = async (quality) => {
    if (!current) return;
    await reviewFlashcard(current, quality);
    setRevealed(false);
    // The subscription will refresh the list; advance index is implicit
    // because reviewed card moves out of due set.
  };

  return (
    <>
      <div className="card learning-toolbar">
        <div>
          <strong>{dueCards.length}</strong> due ·{" "}
          <span className="hint">{cards.length} total</span>
        </div>
        <button
          className="btn btn-accent"
          onClick={() => setShowForm((s) => !s)}
        >
          <Plus size={16} /> New card
        </button>
      </div>

      {showForm && (
        <CardForm
          onSaved={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {dueCards.length === 0 ? (
        <div className="card review-empty">
          <Brain size={32} />
          <p>Nothing due today. Add cards or come back tomorrow.</p>
        </div>
      ) : (
        current && (
          <div className="card flashcard">
            <div className="hint">
              Deck: <strong>{current.deck}</strong> · {dueCards.length - idx}{" "}
              remaining
            </div>
            <div className="flashcard-front">{current.front}</div>
            {revealed ? (
              <>
                <hr />
                <div className="flashcard-back">{current.back}</div>
                <div className="flashcard-actions">
                  <button className="btn btn-red" onClick={() => rate(0)}>
                    Again
                  </button>
                  <button className="btn" onClick={() => rate(3)}>
                    Hard
                  </button>
                  <button className="btn btn-accent" onClick={() => rate(4)}>
                    Good
                  </button>
                  <button className="btn btn-green" onClick={() => rate(5)}>
                    Easy
                  </button>
                </div>
              </>
            ) : (
              <button
                className="btn btn-accent btn-block"
                onClick={() => setRevealed(true)}
              >
                Show answer
              </button>
            )}
            <button
              className="btn-link"
              onClick={() => deleteFlashcard(current.id)}
            >
              Delete card
            </button>
          </div>
        )
      )}
    </>
  );
}

function CardForm({ onSaved, onCancel }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [deck, setDeck] = useState("default");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await addFlashcard({ front, back, deck });
      setFront("");
      setBack("");
      onSaved?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card learning-form" onSubmit={submit}>
      <input
        type="text"
        placeholder="Deck (e.g. system-design)"
        value={deck}
        onChange={(e) => setDeck(e.target.value)}
      />
      <textarea
        placeholder="Front (question / prompt) *"
        value={front}
        onChange={(e) => setFront(e.target.value)}
        rows={2}
        required
      />
      <textarea
        placeholder="Back (answer) *"
        value={back}
        onChange={(e) => setBack(e.target.value)}
        rows={3}
        required
      />
      {err && <p className="error">{err}</p>}
      <div className="row form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-accent" disabled={saving}>
          {saving ? "Saving…" : "Add card"}
        </button>
      </div>
    </form>
  );
}
