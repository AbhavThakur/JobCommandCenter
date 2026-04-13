import ActivityLog from "../components/ActivityLog";
import GymDashboard from "../components/GymDashboard";
import WeeklyFocus from "../components/WeeklyFocus";
import WeeklyLog from "../components/WeeklyLog";
import RaceRadar from "../components/RaceRadar";

export default function HealthPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Health & Fitness</h2>
        <p style={styles.subtitle}>
          Running, gym, and weekly activity — all in one place.
        </p>
      </div>

      {/* Active race goal */}
      <RaceRadar />

      {/* Gym dashboard — full width */}
      <GymDashboard />

      {/* Running activity log */}
      <ActivityLog />

      {/* Weekly topic rotation */}
      <WeeklyFocus />

      {/* Weekly reflection log */}
      <WeeklyLog />
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    paddingBottom: 40,
  },
  header: { marginBottom: 4 },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 24,
    fontWeight: 800,
    color: "var(--text)",
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "var(--muted)" },
};
