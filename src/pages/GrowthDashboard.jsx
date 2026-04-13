import { useState, useEffect } from "react";
import RaceRadar from "../components/RaceRadar";
import DailySchedule from "../components/DailySchedule";
import WealthCard from "../components/WealthCard";
import { useAuth } from "../context/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "Late night grind", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "⚡" };
  if (h < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "🌙" };
}

function fmtDate(d) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function GrowthDashboard() {
  const { user } = useAuth() ?? {};
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { text, emoji } = getGreeting();
  const firstName =
    user?.email?.split("@")[0] ?? (user?.isOffline ? null : null);

  return (
    <div>
      {/* Greeting header */}
      <div style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.greeting}>
            <span style={styles.greetEmoji}>{emoji}</span>
            <h1 style={styles.greetText}>
              {text}
              {firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
          <div style={styles.dateLine}>
            <span style={styles.dateText}>{fmtDate(now)}</span>
            <span style={styles.dateDot}>&middot;</span>
            <span style={styles.timeText}>
              {now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div style={styles.statusChips}>
          <div style={styles.chip}>
            <span style={styles.chipDot} />
            <span>Focus mode</span>
          </div>
        </div>
      </div>

      {/* Full width row 1 — Race / Active Goal */}
      <RaceRadar />

      {/* Row 2: Schedule (2/3) + Wealth snapshot (1/3) */}
      <div style={styles.gridRow2}>
        <div style={styles.col2of3}>
          <DailySchedule />
        </div>
        <div style={styles.col1of3}>
          <WealthCard />
        </div>
      </div>
    </div>
  );
}

const styles = {
  hero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
    padding: "4px 0",
  },
  heroLeft: { display: "flex", flexDirection: "column", gap: 6 },
  greeting: { display: "flex", alignItems: "center", gap: 10 },
  greetEmoji: { fontSize: 26 },
  greetText: {
    fontFamily: "var(--sans)",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    background: "linear-gradient(135deg, var(--text) 30%, var(--text2) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  dateLine: { display: "flex", alignItems: "center", gap: 8, paddingLeft: 2 },
  dateText: { fontSize: 13, color: "var(--muted)", fontWeight: 500 },
  dateDot: { color: "var(--muted)", fontSize: 16 },
  timeText: { fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)" },
  statusChips: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingTop: 6,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(45,212,191,0.08)",
    border: "1px solid rgba(45,212,191,0.18)",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--teal)",
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--teal)",
    boxShadow: "0 0 6px rgba(45,212,191,0.7)",
    animation: "pulse 2s ease-in-out infinite",
  },
  gridRow2: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  gridRow3: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 40,
  },
  col2of3: { flex: "2 1 400px" },
  col1of3: { flex: "1 1 200px" },
  colHalf: { flex: "1 1 300px" },
};
