import { useState, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { BookOpen, Save, Check } from "lucide-react";

const getTodayKey = () => new Date().toISOString().split("T")[0];

function fmtDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function DailyJournal() {
  const todayKey = useMemo(() => getTodayKey(), []);
  const [note, setNote] = useLocalStorage(`growthOS_journal_${todayKey}`, "");
  const [savedFlash, setSavedFlash] = useState(false);

  // Load up to last 6 previous days that have notes
  const previousNotes = useMemo(() => {
    if (typeof window === "undefined") return [];
    const result = [];
    for (let i = 1; i <= 30 && result.length < 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const raw = window.localStorage.getItem(`growthOS_journal_${key}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.trim()) result.push({ key, text: parsed });
          // eslint-disable-next-line no-unused-vars
        } catch (_E) {
          /* ignore invalid json */
        }
      }
    }
    return result;
  }, []);

  const [showHistory, setShowHistory] = useState(false);

  const handleSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <BookOpen size={16} color="var(--accent-bright)" />
          <h3 style={s.title}>Today's Learning Note</h3>
          <span style={s.date}>{fmtDate(todayKey)}</span>
        </div>
        {previousNotes.length > 0 && (
          <button style={s.histBtn} onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "Hide history" : `History (${previousNotes.length})`}
          </button>
        )}
      </div>

      <textarea
        style={s.textarea}
        placeholder="What did you read, learn, or think about today? One paragraph is enough — Zerodha Varsity chapter, AI thing you tried, podcast key idea..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div style={s.footer}>
        <span style={s.charCount}>{(note || "").length} chars</span>
        <button
          style={{ ...s.saveBtn, ...(savedFlash ? s.saveBtnFlash : {}) }}
          onClick={handleSave}
        >
          {savedFlash ? (
            <>
              <Check size={13} /> Saved
            </>
          ) : (
            <>
              <Save size={13} /> Save note
            </>
          )}
        </button>
      </div>

      {showHistory && (
        <div style={s.historyList}>
          {previousNotes.map(({ key, text }) => (
            <div key={key} style={s.histItem}>
              <div style={s.histDate}>{fmtDate(key)}</div>
              <div style={s.histText}>{text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--accent)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text)",
    margin: 0,
  },
  date: {
    fontSize: 12,
    color: "var(--muted)",
  },
  histBtn: {
    background: "none",
    border: "1px solid var(--surface3)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    color: "var(--muted)",
    cursor: "pointer",
  },
  textarea: {
    background: "var(--surface2)",
    border: "1px solid var(--surface3)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    lineHeight: 1.6,
    padding: "12px 14px",
    resize: "vertical",
    minHeight: 90,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCount: {
    fontSize: 11,
    color: "var(--muted)",
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "var(--accent)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 14px",
    transition: "var(--transition)",
  },
  saveBtnFlash: {
    background: "var(--green)",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    borderTop: "1px solid var(--surface3)",
    paddingTop: 14,
    maxHeight: 340,
    overflowY: "auto",
  },
  histItem: {
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
  },
  histDate: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--accent-bright)",
    marginBottom: 4,
  },
  histText: {
    fontSize: 13,
    color: "var(--text2)",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
};
