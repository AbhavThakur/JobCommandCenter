import { useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { Info } from "lucide-react";

/** Get ISO week string (YYYY-Www) */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

const ACTIVITIES = ["None", "Run", "Badminton", "Gym", "Walk"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ActivityLog() {
  const currentWeek = useMemo(() => getISOWeek(new Date()), []);
  const [log, setLog] = useLocalStorage(`growthOS_activity_${currentWeek}`, [
    {}, {}, {}, {}, {}, {}, {} // 7 empty records for Mon-Sun
  ]);

  const handleChange = (dayIdx, field, value) => {
    setLog(prev => {
      const next = [...prev];
      next[dayIdx] = { ...next[dayIdx], [field]: value };
      if (field === "type" && value !== "Run") {
        delete next[dayIdx].distance;
        delete next[dayIdx].duration;
      }
      return next;
    });
  };

  // Taper logic calculation
  // Race is April 26.
  // We need to know the dates of the current week.
  // This gets slightly complex without date-fns, but simplifying:
  // If the user logs a run in April 2026 and we are within 14 days of April 26.
  const now = new Date();
  const raceDate = new Date("2026-04-26T00:00:00");
  const daysToRace = Math.ceil((raceDate - now) / 86400000);
  const isTaperPhase = daysToRace > 0 && daysToRace <= 14;

  const totalRuns = log.filter(d => d.type === "Run").length;
  const totalKm = log.reduce((acc, curr) => curr.type === "Run" ? acc + Number(curr.distance || 0) : acc, 0);
  const activeDays = log.filter(d => d.type && d.type !== "None").length;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>🏋️ Activity Log</h3>
        <span style={styles.weekInfo}>Current Week</span>
      </div>

      <div style={styles.grid}>
        {DAYS.map((dayName, idx) => {
          const entry = log[idx] || {};
          const isRun = entry.type === "Run";
          
          let paceStr = "--:--";
          if (isRun && entry.distance && entry.duration) {
            const paceDec = Number(entry.duration) / Number(entry.distance);
            const m = Math.floor(paceDec);
            const s = Math.round((paceDec - m) * 60).toString().padStart(2, "0");
            paceStr = `${m}:${s}/km`;
          }

          return (
            <div key={dayName} style={styles.row}>
              <span style={styles.dayLabel}>{dayName}</span>
              
              <select 
                style={styles.select}
                value={entry.type || "None"}
                onChange={(e) => handleChange(idx, "type", e.target.value)}
              >
                {ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {isRun ? (
                <div style={styles.runInputs}>
                  <input 
                    type="number" 
                    placeholder="km" 
                    style={styles.numInput}
                    value={entry.distance || ""}
                    onChange={(e) => handleChange(idx, "distance", e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="min" 
                    style={styles.numInput}
                    value={entry.duration || ""}
                    onChange={(e) => handleChange(idx, "duration", e.target.value)}
                  />
                  <span style={styles.pace}>{paceStr}</span>
                </div>
              ) : (
                <div style={styles.emptyRunSpace} />
              )}
            </div>
          );
        })}
      </div>

      {isTaperPhase && (
        <div style={styles.taperAlert}>
          <Info size={14} />
          <span>Taper active: Keep individual runs ≤ 5km and maintain pace.</span>
        </div>
      )}

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryVal}>{activeDays}/7</span>
          <span style={styles.summaryLabel}>Active Days</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryVal}>{totalRuns}</span>
          <span style={styles.summaryLabel}>Runs</span>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryVal}>{totalKm.toFixed(1)} km</span>
          <span style={styles.summaryLabel}>Distance</span>
        </div>
      </div>
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
    height: "100%"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text)",
  },
  weekInfo: {
    fontSize: 10,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "var(--surface2)",
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)"
  },
  dayLabel: {
    width: 32,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted)"
  },
  select: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    color: "var(--text2)",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 12,
    outline: "none",
    width: 100
  },
  runInputs: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: 1
  },
  emptyRunSpace: {
    flex: 1
  },
  numInput: {
    width: 50,
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    color: "var(--text2)",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 12,
    outline: "none",
  },
  pace: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    color: "var(--teal)",
    marginLeft: "auto",
    fontWeight: 600
  },
  taperAlert: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "var(--amber)",
    background: "var(--amber-dim)",
    padding: "8px",
    borderRadius: 6,
    fontWeight: 500
  },
  summary: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTop: "1px solid var(--border)",
    marginTop: "auto"
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text)",
    fontFamily: "var(--mono)"
  },
  summaryLabel: {
    fontSize: 10,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600
  }
};
