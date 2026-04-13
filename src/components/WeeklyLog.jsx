import { useState, useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { ChevronDown, ChevronRight, Save } from "lucide-react";

/** Get ISO week string for a given date (YYYY-Www) */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/** Get week string for N weeks ago */
function getPastISOWeek(weeksAgo) {
  const d = new Date();
  d.setDate(d.getDate() - (weeksAgo * 7));
  return getISOWeek(d);
}

export default function WeeklyLog() {
  const currentWeek = useMemo(() => getISOWeek(new Date()), []);
  const todayIsSunday = new Date().getDay() === 0;

  const [log, setLog] = useLocalStorage(`growthOS_weeklyLog_${currentWeek}`, {
    learned: "",
    apply: "",
    nextWeek: "",
    aiResearch: []
  });

  // State to hold past weeks. In a real app we'd scan all keys, 
  // but we can just compute the last 3 week keys and read them.
  const pastWeeks = useMemo(() => {
    const weeks = [];
    if (typeof window === "undefined") return weeks;
    
    for (let i = 1; i <= 3; i++) {
       const weekKey = getPastISOWeek(i);
       const raw = window.localStorage.getItem(`growthOS_weeklyLog_${weekKey}`);
       if (raw) {
         try {
           weeks.push({ key: weekKey, data: JSON.parse(raw) });
         } catch {
           // ignore invalid json
         }
       }
    }
    return weeks;
  }, []);

  const [expandedWeek, setExpandedWeek] = useState(null);
  const [savedStatus, setSavedStatus] = useState("");

  const handleChange = (field, val) => {
    setLog(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    // Actually our hook saves on every change, but users like a save button
    setSavedStatus("Saved!");
    setTimeout(() => setSavedStatus(""), 2000);
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>📓 This week's log</h3>
        {todayIsSunday && (
          <span style={styles.sundayBadge}>Review day — fill this in</span>
        )}
      </div>

      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>What I learned (from reading, podcasts, AI)</label>
          <textarea
            style={styles.textarea}
            value={log.learned || ""}
            onChange={(e) => handleChange("learned", e.target.value)}
            placeholder="Key insights..."
          />
        </div>
        
        <div style={styles.field}>
          <label style={styles.label}>I'll apply this by doing...</label>
          <textarea
            style={styles.textarea}
            value={log.apply || ""}
            onChange={(e) => handleChange("apply", e.target.value)}
            placeholder="Action step for next week..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Next week I want to understand...</label>
          <input
            type="text"
            style={styles.input}
            value={log.nextWeek || ""}
            onChange={(e) => handleChange("nextWeek", e.target.value)}
            placeholder="E.g. smallcap mutual funds, prompt chain..."
          />
        </div>

        {log.aiResearch && log.aiResearch.length > 0 && (
          <div style={styles.aiSummaries}>
            <div style={styles.aiHeader}>✨ Saved AI Summaries ({log.aiResearch.length})</div>
            {log.aiResearch.map((item, idx) => (
              <div key={idx} style={styles.aiItem}>
                • {item.substring(0, 80)}...
              </div>
            ))}
          </div>
        )}

        <div style={styles.saveRow}>
          <button style={styles.saveBtn} onClick={handleSave}>
            <Save size={16} /> Save Log
          </button>
          {savedStatus && <span style={styles.savedStatus}>{savedStatus}</span>}
        </div>
      </div>

      {pastWeeks.length > 0 && (
        <div style={styles.history}>
          <h4 style={styles.historyTitle}>Past 3 Weeks</h4>
          <div style={styles.accordion}>
            {pastWeeks.map(({ key, data }) => {
              const isExpanded = expandedWeek === key;
              return (
                <div key={key} style={styles.accordionItem}>
                  <button 
                    style={styles.accordionHeader} 
                    onClick={() => setExpandedWeek(isExpanded ? null : key)}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Week {key}
                  </button>
                  
                  {isExpanded && (
                    <div style={styles.accordionBody}>
                      <div style={styles.historySection}>
                        <strong>Learned:</strong> {data.learned || "No entry"}
                      </div>
                      <div style={styles.historySection}>
                        <strong>Apply:</strong> {data.apply || "No entry"}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    width: "100%"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text)",
  },
  sundayBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    background: "var(--teal-dim)",
    color: "var(--teal)",
    border: "1px solid var(--teal-border)",
    borderRadius: 8,
    letterSpacing: "0.02em"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text2)"
  },
  textarea: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    minHeight: 80,
    resize: "vertical",
    outline: "none"
  },
  input: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    outline: "none"
  },
  aiSummaries: {
    background: "var(--purple-dim)",
    border: "1px solid var(--purple-border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px",
  },
  aiHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--purple)",
    marginBottom: 8
  },
  aiItem: {
    fontSize: 12,
    color: "var(--text2)",
    lineHeight: 1.4,
    marginBottom: 4
  },
  saveRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 8
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--surface3)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  },
  savedStatus: {
    fontSize: 13,
    color: "var(--green)",
    fontWeight: 500
  },
  history: {
    marginTop: 12,
    paddingTop: 20,
    borderTop: "1px solid var(--border)"
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text2)",
    marginBottom: 12
  },
  accordion: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  accordionItem: {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    overflow: "hidden"
  },
  accordionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    color: "var(--text)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left"
  },
  accordionBody: {
    padding: "0 12px 12px 34px",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  historySection: {
    fontSize: 12,
    color: "var(--text2)",
    lineHeight: 1.5
  }
};
