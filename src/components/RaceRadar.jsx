import { useState, useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const TARGET_DATE = new Date("2026-04-26T06:00:00+05:30");
const TRAINING_WEEKS = 10; // Assumed 10-week training program
const RACE_NAME = "TCS World 10K";
const GOAL = "Sub-60 min";
const TARGET_PACE = "5:50/km";
const TAPER_THRESHOLD_DAYS = 14;

export default function RaceRadar() {
  const [now, setNow] = useState(new Date());
  const [nextGoal, setNextGoal] = useLocalStorage("growthOS_nextGoal", "");
  const [goalInput, setGoalInput] = useState("");

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const msRemaining = TARGET_DATE - now;
  const daysRemaining = Math.ceil(msRemaining / 86_400_000);
  const raceOver = msRemaining <= 0;
  const isTapering = daysRemaining <= TAPER_THRESHOLD_DAYS && !raceOver;

  // Progress ring: what % of the training program has elapsed
  const trainingStartDate = new Date(TARGET_DATE);
  trainingStartDate.setDate(trainingStartDate.getDate() - TRAINING_WEEKS * 7);
  const totalTrainingMs = TARGET_DATE - trainingStartDate;
  const elapsedMs = now - trainingStartDate;
  const progressPct = raceOver
    ? 100
    : Math.max(0, Math.min(100, (elapsedMs / totalTrainingMs) * 100));
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  // Current training week
  const currentWeek = Math.min(
    TRAINING_WEEKS,
    Math.ceil(elapsedMs / (7 * 86_400_000)),
  );

  const handleSaveGoal = () => {
    if (goalInput.trim()) {
      setNextGoal(goalInput.trim());
      setGoalInput("");
    }
  };

  // ── Post-race state ──
  if (raceOver) {
    return (
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <span style={styles.emoji}>🎉</span>
          <span style={styles.raceName}>Race Complete!</span>
        </div>
        {nextGoal ? (
          <div style={styles.postRaceGoal}>
            <div style={styles.postRaceLabel}>Next Goal</div>
            <div style={styles.postRaceValue}>{nextGoal}</div>
            <button
              style={styles.clearBtn}
              onClick={() => setNextGoal("")}
            >
              Clear & set new goal
            </button>
          </div>
        ) : (
          <div style={styles.postRaceForm}>
            <div style={styles.postRaceLabel}>What's next?</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveGoal()}
                placeholder="E.g. Half marathon, sub-2:00..."
                style={styles.goalInput}
              />
              <button style={styles.saveBtn} onClick={handleSaveGoal}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Pre-race state ──
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <span style={styles.emoji}>🏃</span>
        <span style={styles.raceName}>{RACE_NAME}</span>
        {isTapering && <span style={styles.taperBadge}>TAPERING</span>}
      </div>

      <div style={styles.body}>
        {/* Left: SVG progress ring */}
        <div style={styles.ringContainer}>
          <svg viewBox="0 0 100 100" style={styles.ring}>
            {/* Track */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="5"
            />
            {/* Progress */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="var(--teal)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: "stroke-dashoffset 0.6s ease",
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                filter: "drop-shadow(0 0 6px rgba(45, 212, 191, 0.4))",
              }}
            />
            {/* Center text */}
            <text
              x="50" y="46"
              textAnchor="middle"
              fill="var(--text)"
              fontFamily="var(--mono)"
              fontSize="20"
              fontWeight="700"
            >
              {daysRemaining}
            </text>
            <text
              x="50" y="60"
              textAnchor="middle"
              fill="var(--muted)"
              fontFamily="var(--sans)"
              fontSize="8"
              fontWeight="500"
              textTransform="uppercase"
              letterSpacing="0.1em"
            >
              {daysRemaining === 1 ? "day" : "days"}
            </text>
          </svg>
        </div>

        {/* Right: Info */}
        <div style={styles.info}>
          <div style={styles.countdown}>
            {daysRemaining} {daysRemaining === 1 ? "Day" : "Days"} to Greatness
          </div>
          <div style={styles.meta}>
            <span style={styles.metaItem}>
              🎯 {GOAL}
            </span>
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaItem}>
              Pace: {TARGET_PACE}
            </span>
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaItem}>
              Week {currentWeek}/{TRAINING_WEEKS}
            </span>
          </div>

          {isTapering && (
            <div style={styles.taperInfo}>
              <div style={styles.taperTitle}>Phase: Tapering</div>
              <div style={styles.taperText}>
                Reduce mileage, keep intensity. Focus on mobility &amp; carb-loading.
                Limit runs to 5km.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background:
      "linear-gradient(135deg, rgba(45, 212, 191, 0.06), var(--surface-solid))",
    border: "1px solid var(--teal-border)",
    borderRadius: "var(--radius-lg)",
    padding: "22px 24px",
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 20,
  },
  raceName: {
    fontFamily: "var(--sans)",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text2)",
  },
  taperBadge: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--amber-dim)",
    color: "var(--amber)",
    border: "1px solid var(--amber-border)",
    animation: "pulse 2s ease-in-out infinite",
  },
  body: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  ringContainer: {
    width: 110,
    height: 110,
    flexShrink: 0,
  },
  ring: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  countdown: {
    fontFamily: "var(--sans)",
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "var(--text)",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    fontWeight: 500,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  metaItem: {},
  metaDot: { opacity: 0.4 },
  taperInfo: {
    background: "var(--amber-dim)",
    border: "1px solid var(--amber-border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
  },
  taperTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--amber)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  taperText: {
    fontSize: 12,
    color: "var(--text2)",
    lineHeight: 1.6,
  },
  // Post-race
  postRaceGoal: {
    marginTop: 8,
  },
  postRaceForm: {
    marginTop: 8,
  },
  postRaceLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text2)",
    marginBottom: 4,
  },
  postRaceValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--teal)",
    fontFamily: "var(--sans)",
    marginBottom: 8,
  },
  goalInput: {
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 13,
    outline: "none",
  },
  saveBtn: {
    padding: "8px 16px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "var(--teal)",
    color: "#0d0f12",
    fontWeight: 600,
    fontSize: 13,
    fontFamily: "var(--sans)",
    cursor: "pointer",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
    fontFamily: "var(--sans)",
    textDecoration: "underline",
  },
};
