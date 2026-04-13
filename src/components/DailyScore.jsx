/**
 * DailyScore — Today's completion % + consecutive streak.
 * Reads from growthOS_schedule_v2 and growthOS_custom_tasks.
 */
import { useMemo } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { SCHEDULE } from "../data/schedule";

const PILLAR_COLORS = {
  teal: "var(--teal)",
  purple: "var(--accent-bright)",
  amber: "var(--amber)",
  rest: "var(--muted)",
};

function getDateKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function weekdayForDate(dateStr) {
  return new Date(dateStr + "T00:00:00").getDay(); // 0=Sun
}

function getDayCompletion(dateKey, completions, customTasks) {
  const dayVal = weekdayForDate(dateKey);
  const dayData = SCHEDULE[dayVal];
  if (!dayData) return null;

  const slots = dayData.slots || [];
  const customs = customTasks[dateKey] || [];

  let total = 0;
  let done = 0;
  let byPillar = {};

  slots.forEach((slot) => {
    const state = completions[`${dateKey}:${slot.id}`] || "pending";
    if (state !== "skipped") {
      total++;
      const p = slot.pillar || "rest";
      byPillar[p] = (byPillar[p] || 0) + (state === "done" ? 1 : 0);
      if (state === "done") done++;
    }
  });

  // custom tasks count as done
  customs.forEach((t) => {
    total++;
    if (t.done) done++;
  });

  return {
    total,
    done,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
    byPillar,
  };
}

export default function DailyScore() {
  const [completions] = useLocalStorage("growthOS_schedule_v2", {});
  const [customTasks] = useLocalStorage("growthOS_custom_tasks", {});

  const todayKey = useMemo(() => getDateKey(0), []);

  const today = useMemo(
    () => getDayCompletion(todayKey, completions, customTasks),
    [todayKey, completions, customTasks],
  );

  // Streak: consecutive days (going backward from yesterday) that had ≥1 done slot
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= 60; i++) {
      const key = getDateKey(-i);
      const result = getDayCompletion(key, completions, customTasks);
      if (result && result.done > 0) count++;
      else break;
    }
    return count;
  }, [completions, customTasks]);

  if (!today) return null;

  const { pct, done, total } = today;
  const circumference = 2 * Math.PI * 28;
  const dash = (pct / 100) * circumference;

  const ringColor =
    pct >= 80
      ? "var(--teal)"
      : pct >= 50
        ? "var(--amber)"
        : "var(--accent-bright)";

  return (
    <div style={s.row}>
      {/* Ring */}
      <div style={s.ringWrap}>
        <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={36}
            cy={36}
            r={28}
            fill="none"
            stroke="var(--surface3)"
            strokeWidth={6}
          />
          <circle
            cx={36}
            cy={36}
            r={28}
            fill="none"
            stroke={ringColor}
            strokeWidth={6}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div style={s.ringLabel}>
          <div style={{ ...s.pct, color: ringColor }}>{pct}%</div>
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.mainStat}>
          <span style={s.statVal}>{done}</span>
          <span style={s.statOf}>/{total}</span>
          <span style={s.statLabel}> slots done today</span>
        </div>
        <div style={s.streakRow}>
          <span style={s.flame}>🔥</span>
          <span style={s.streakNum}>{streak}</span>
          <span style={s.streakLabel}>day streak</span>
        </div>

        {/* Pillar dots */}
        <div style={s.pillars}>
          {Object.entries(today.byPillar).map(([pillar, doneCount]) => (
            <span
              key={pillar}
              style={{ ...s.pillarDot, background: PILLAR_COLORS[pillar] }}
              title={`${pillar}: ${doneCount} done`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "var(--surface-solid)",
    border: "1px solid var(--surface3)",
    borderRadius: "var(--radius-lg)",
    padding: "16px 20px",
  },
  ringWrap: {
    position: "relative",
    flexShrink: 0,
  },
  ringLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pct: {
    fontSize: 15,
    fontWeight: 800,
    fontFamily: "var(--mono)",
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  mainStat: {
    fontSize: 14,
    color: "var(--text)",
  },
  statVal: {
    fontWeight: 800,
    fontSize: 18,
    color: "var(--text)",
  },
  statOf: {
    color: "var(--muted)",
    fontSize: 14,
  },
  statLabel: {
    color: "var(--text2)",
    fontSize: 13,
  },
  streakRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  flame: { fontSize: 14 },
  streakNum: {
    fontWeight: 800,
    fontSize: 16,
    color: "var(--amber)",
  },
  streakLabel: {
    fontSize: 12,
    color: "var(--muted)",
  },
  pillars: {
    display: "flex",
    gap: 5,
    marginTop: 2,
  },
  pillarDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    opacity: 0.8,
  },
};
