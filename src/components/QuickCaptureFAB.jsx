import { useEffect, useRef, useState } from "react";
import { Plus, X, BookOpen, Brain, Activity, Briefcase } from "lucide-react";
import { addLearningItem, addFlashcard } from "../services/learningData";
import { addHabit } from "../services/habitsData";

/**
 * Floating quick-capture button. Click to choose:
 *   - Note (journal)
 *   - Learning item
 *   - Flashcard
 *   - Habit
 *   - Job (URL paste)
 *
 * Keyboard: Cmd/Ctrl+K opens it.
 */
export default function QuickCaptureFAB({ onOpenLearning }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // null | 'note' | 'learning' | 'flash' | 'habit'
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && openRef.current) {
        setOpen(false);
        setMode(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reset = () => {
    setText("");
    setText2("");
    setMode(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!text.trim()) return;
    setBusy(true);
    try {
      if (mode === "note") {
        const today = new Date().toISOString().slice(0, 10);
        const k = `growthOS_journal_${today}`;
        const cur = JSON.parse(localStorage.getItem(k) || '""');
        const next = cur ? `${cur}\n\n${text.trim()}` : text.trim();
        localStorage.setItem(k, JSON.stringify(next));
        flash("Journal updated");
      } else if (mode === "learning") {
        await addLearningItem({ kind: "book", title: text, status: "todo" });
        flash("Added to library");
      } else if (mode === "flash") {
        if (!text2.trim()) {
          setBusy(false);
          return;
        }
        await addFlashcard({ front: text, back: text2 });
        flash("Flashcard created");
      } else if (mode === "habit") {
        await addHabit({ name: text });
        flash("Habit added");
      }
      close();
    } catch (err) {
      flash(err.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="fab"
        aria-label="Quick capture (Cmd+K)"
        onClick={() => setOpen(true)}
        title="Quick capture (⌘K)"
      >
        <Plus size={22} />
      </button>

      {toast && <div className="fab-toast">{toast}</div>}

      {open && (
        <div className="fab-modal" onClick={close}>
          <div className="fab-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="fab-head">
              <strong>Quick capture</strong>
              <button className="btn-icon" onClick={close}>
                <X size={16} />
              </button>
            </div>

            {!mode && (
              <div className="fab-options">
                <FabOpt
                  icon={<BookOpen size={18} />}
                  label="Journal note"
                  onClick={() => setMode("note")}
                />
                <FabOpt
                  icon={<BookOpen size={18} />}
                  label="Learning item"
                  onClick={() => setMode("learning")}
                />
                <FabOpt
                  icon={<Brain size={18} />}
                  label="Flashcard"
                  onClick={() => setMode("flash")}
                />
                <FabOpt
                  icon={<Activity size={18} />}
                  label="Habit"
                  onClick={() => setMode("habit")}
                />
              </div>
            )}

            {mode && (
              <form onSubmit={submit} className="fab-form">
                {mode === "flash" ? (
                  <>
                    <textarea
                      placeholder="Front (question)"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={2}
                      autoFocus
                    />
                    <textarea
                      placeholder="Back (answer)"
                      value={text2}
                      onChange={(e) => setText2(e.target.value)}
                      rows={2}
                    />
                  </>
                ) : (
                  <textarea
                    placeholder={
                      mode === "note"
                        ? "What's on your mind?"
                        : mode === "learning"
                          ? "Title of the book/course/paper"
                          : "Habit name (e.g. Read 30 min)"
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={mode === "note" ? 4 : 2}
                    autoFocus
                  />
                )}
                <div className="row form-actions">
                  <button type="button" className="btn" onClick={reset}>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-accent"
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FabOpt({ icon, label, onClick }) {
  return (
    <button className="fab-opt" onClick={onClick} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}
