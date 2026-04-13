/**
 * Progress Page — Weekly & Monthly analytics across all Growth OS pillars.
 * Charts: Schedule completion, Gym volume, Activity km, Learning streak,
 *         Pillar breakdown, Savings rate trend.
 */
import { useMemo, useState } from "react";
import { Chart, DonutChart } from "../components/Chart";
import { SCHEDULE } from "../data/schedule";

// ─── ISO week helpers ─────────────────────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

function getPastWeeks(n) {
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weeks.push(getISOWeek(d));
  }
  return weeks;
}

function getMonday(isoWeek) {
  const [year, w] = isoWeek.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(
    jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (w - 1) * 7,
  );
  return monday;
}

function shortWeekLabel(isoWeek) {
  const mon = getMonday(isoWeek);
  return mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ls(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Data extractors ──────────────────────────────────────────────────────────
function scheduleCompletionForWeek(isoWeek) {
  const completions = ls("growthOS_schedule_v2") || {};
  const customTasks = ls("growthOS_custom_tasks") || {};
  const mon = getMonday(isoWeek);
  let done = 0;
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    const dayVal = d.getUTCDay();
    const dayData = SCHEDULE[dayVal];
    if (!dayData) continue;
    (dayData.slots || []).forEach((slot) => {
      const state = completions[`${dateKey}:${slot.id}`] || "pending";
      if (state !== "skipped") {
        total++;
        if (state === "done") done++;
      }
    });
    (customTasks[dateKey] || []).forEach((t) => {
      total++;
      if (t.done) done++;
    });
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function gymVolumeForWeek(isoWeek) {
  const sessions = ls(`growthOS_gym2_${isoWeek}`) || {};
  let volume = 0;
  Object.values(sessions).forEach((daySession) => {
    Object.values(daySession).forEach((ex) => {
      (ex.sets || []).forEach((set) => {
        const sets = parseFloat(set.sets) || 1;
        const reps = parseFloat(set.reps) || 0;
        const kg = parseFloat(set.weight) || 0;
        volume += sets * reps * kg;
      });
    });
  });
  return Math.round(volume);
}

function activityKmForWeek(isoWeek) {
  const log = ls(`growthOS_activity_${isoWeek}`) || [];
  return log.reduce((total, day) => {
    if (day.type === "Run") return total + parseFloat(day.distance || 0);
    return total;
  }, 0);
}

function learningStreakDaysForWeek(isoWeek) {
  const completions = ls("growthOS_schedule_v2") || {};
  const mon = getMonday(isoWeek);
  let days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    const dayVal = d.getUTCDay();
    const dayData = SCHEDULE[dayVal];
    if (!dayData) continue;
    const hasLearning = (dayData.slots || []).some((slot) => {
      const pillar = slot.pillar;
      const state = completions[`${dateKey}:${slot.id}`];
      return (
        (pillar === "teal" || pillar === "purple" || pillar === "amber") &&
        state === "done"
      );
    });
    if (hasLearning) days++;
  }
  return days;
}

function pillarBreakdownForWeek(isoWeek) {
  const completions = ls("growthOS_schedule_v2") || {};
  const mon = getMonday(isoWeek);
  const byPillar = { teal: 0, purple: 0, amber: 0 };
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    const dayVal = d.getUTCDay();
    const dayData = SCHEDULE[dayVal];
    if (!dayData) continue;
    (dayData.slots || []).forEach((slot) => {
      const p = slot.pillar;
      if (
        (p === "teal" || p === "purple" || p === "amber") &&
        completions[`${dateKey}:${slot.id}`] === "done"
      ) {
        byPillar[p]++;
      }
    });
  }
  return byPillar;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, sub, color = "var(--teal)" }) {
  return (
    <div style={ss.statCard}>
      <div style={{ ...ss.statVal, color }}>{value}</div>
      {unit && <div style={ss.statUnit}>{unit}</div>}
      <div style={ss.statLabel}>{label}</div>
      {sub && <div style={ss.statSub}>{sub}</div>}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={ss.section}>
      <div style={ss.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = ["12 Weeks", "6 Weeks", "4 Weeks"];

export default function ProgressPage() {
  const [tabIdx, setTabIdx] = useState(0);
  const weekCount = [12, 6, 4][tabIdx];

  const weeks = useMemo(() => getPastWeeks(weekCount), [weekCount]);
  const labels = useMemo(() => weeks.map(shortWeekLabel), [weeks]);

  // Schedule completion
  const completionData = useMemo(
    () => weeks.map(scheduleCompletionForWeek),
    [weeks],
  );

  // Gym volume
  const gymData = useMemo(() => weeks.map(gymVolumeForWeek), [weeks]);

  // Activity km
  const kmData = useMemo(
    () => weeks.map((w) => Math.round(activityKmForWeek(w) * 10) / 10),
    [weeks],
  );

  // Learning streak days
  const streakData = useMemo(
    () => weeks.map(learningStreakDaysForWeek),
    [weeks],
  );

  // Pillar breakdown for current week
  const pillarBreakdown = useMemo(
    () => pillarBreakdownForWeek(weeks[weeks.length - 1]),
    [weeks],
  );

  // Savings rate from localStorage (single value, monthly updated)
  const wealthSnap = useMemo(() => ls("growthOS_wealth_snapshot"), []);

  // Summary stats (current/last week)
  const latestWeek = weeks[weeks.length - 1];
  const statsCompletion = scheduleCompletionForWeek(latestWeek);
  const statsGym = gymVolumeForWeek(latestWeek);
  const statsKm = activityKmForWeek(latestWeek);
  const statsStreak = learningStreakDaysForWeek(latestWeek);

  const donutData = [
    { name: "Investing", value: pillarBreakdown.teal, color: "var(--teal)" },
    {
      name: "AI / Career",
      value: pillarBreakdown.purple,
      color: "var(--accent-bright)",
    },
    {
      name: "Power Skills",
      value: pillarBreakdown.amber,
      color: "var(--amber)",
    },
  ].filter((d) => d.value > 0);

  return (
    <div style={ss.page}>
      {/* Header */}
      <div style={ss.header}>
        <h2 style={ss.pageTitle}>Progress</h2>
        <p style={ss.subtitle}>Weekly trends across every growth pillar.</p>
      </div>

      {/* Tab selector */}
      <div style={ss.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t}
            style={{ ...ss.tab, ...(tabIdx === i ? ss.tabActive : {}) }}
            onClick={() => setTabIdx(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* This week summary */}
      <Section title="📊 This Week at a Glance">
        <div style={ss.statRow}>
          <StatCard
            label="Schedule done"
            value={`${statsCompletion}%`}
            color={
              statsCompletion >= 80
                ? "var(--green)"
                : statsCompletion >= 50
                  ? "var(--amber)"
                  : "var(--red)"
            }
          />
          <StatCard
            label="Gym volume"
            value={statsGym > 0 ? (statsGym / 1000).toFixed(1) : "—"}
            unit={statsGym > 0 ? "T" : ""}
            sub="tonnes lifted"
            color="var(--accent-bright)"
          />
          <StatCard
            label="Running"
            value={statsKm > 0 ? statsKm.toFixed(1) : "—"}
            unit={statsKm > 0 ? "km" : ""}
            color="var(--teal)"
          />
          <StatCard
            label="Learning days"
            value={`${statsStreak}/7`}
            color="var(--amber)"
          />
        </div>
      </Section>

      {/* Schedule completion */}
      <Section title="✅ Schedule Completion % (week over week)">
        <Chart
          categories={labels}
          series={[
            {
              name: "Completion %",
              data: completionData,
              type: "bar",
              color: "var(--teal)",
            },
          ]}
          height={200}
          yAxisLabel={(v) => `${v}%`}
        />
      </Section>

      {/* Learning streak */}
      <Section title="📚 Learning Days per Week">
        <Chart
          categories={labels}
          series={[
            {
              name: "Learning days",
              data: streakData,
              type: "bar",
              color: "var(--amber)",
            },
          ]}
          height={180}
          yAxisLabel={(v) => `${v}d`}
        />
      </Section>

      {/* Pillar breakdown — donut */}
      <Section
        title={`🎯 Learning Pillar Breakdown — ${shortWeekLabel(latestWeek)}`}
      >
        {donutData.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <DonutChart data={donutData} height={180} />
            <div style={ss.legend}>
              {donutData.map((d) => (
                <div key={d.name} style={ss.legendRow}>
                  <span style={{ ...ss.legendDot, background: d.color }} />
                  <span style={ss.legendLabel}>{d.name}</span>
                  <span style={{ ...ss.legendVal, color: d.color }}>
                    {d.value} slots
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={ss.empty}>No learning slots completed this week yet.</div>
        )}
      </Section>

      {/* Gym volume */}
      <Section title="🏋️ Gym Volume per Week (sets × reps × kg)">
        {gymData.some((v) => v > 0) ? (
          <Chart
            categories={labels}
            series={[
              {
                name: "Volume kg",
                data: gymData,
                type: "line",
                smooth: true,
                area: true,
                color: "var(--accent-bright)",
              },
            ]}
            height={200}
          />
        ) : (
          <div style={ss.empty}>
            No gym sessions logged yet — log sets in the Health page.
          </div>
        )}
      </Section>

      {/* Running km */}
      <Section title="🏃 Running km per Week">
        {kmData.some((v) => v > 0) ? (
          <Chart
            categories={labels}
            series={[
              {
                name: "km",
                data: kmData,
                type: "line",
                smooth: true,
                area: true,
                color: "var(--teal)",
              },
            ]}
            height={180}
          />
        ) : (
          <div style={ss.empty}>
            No runs logged yet — log in Activity Log on the Health page.
          </div>
        )}
      </Section>

      {/* Savings rate */}
      <Section title="💰 Wealth Snapshot">
        {wealthSnap ? (
          <div style={ss.statRow}>
            <StatCard
              label="Net Worth"
              value={`₹${Number(wealthSnap.netWorth || 0).toLocaleString("en-IN")}`}
              color="var(--teal)"
            />
            <StatCard
              label="Monthly SIP"
              value={`₹${Number(wealthSnap.sip || 0).toLocaleString("en-IN")}`}
              color="var(--accent-bright)"
            />
            <StatCard
              label="Savings Rate"
              value={`${wealthSnap.savingsRate || 0}%`}
              color="var(--green)"
            />
          </div>
        ) : (
          <div style={ss.empty}>
            Sync from WealthOS on the Wealth page to see your numbers here.
          </div>
        )}
      </Section>
    </div>
  );
}

const ss = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    paddingBottom: 40,
  },
  header: { marginBottom: 4 },
  pageTitle: {
    fontFamily: "var(--sans)",
    fontSize: 24,
    fontWeight: 800,
    color: "var(--text)",
    margin: 0,
  },
  subtitle: { fontSize: 14, color: "var(--muted)", marginTop: 4 },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: {
    background: "var(--surface2)",
    border: "1px solid var(--surface3)",
    borderRadius: 8,
    color: "var(--text2)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 16px",
  },
  tabActive: {
    background: "var(--teal-dim)",
    borderColor: "var(--teal-border)",
    color: "var(--teal)",
  },
  section: {
    background: "var(--surface-solid)",
    border: "1px solid var(--surface3)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  sectionTitle: {
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "0.01em",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    padding: "14px 16px",
    textAlign: "center",
  },
  statVal: { fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)" },
  statUnit: { fontSize: 12, color: "var(--muted)", marginTop: 1 },
  statLabel: {
    fontSize: 11,
    color: "var(--muted)",
    marginTop: 4,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  statSub: { fontSize: 10, color: "var(--muted)", marginTop: 2 },
  legend: { display: "flex", flexDirection: "column", gap: 10 },
  legendRow: { display: "flex", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  legendLabel: { fontSize: 13, color: "var(--text2)", flex: 1 },
  legendVal: { fontSize: 13, fontWeight: 700 },
  empty: { fontSize: 13, color: "var(--muted)", padding: "12px 0" },
};
