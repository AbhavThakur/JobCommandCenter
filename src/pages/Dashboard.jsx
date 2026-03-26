import { useState, useMemo, useRef } from "react";
import { useStore } from "../store/useStore";
import { PROFILES, STAGES } from "../data/constants";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function Dashboard({ onNavigate }) {
  const {
    activeProfile,
    applications,
    activity,
    goalTarget,
    setGoalTarget,
    getNotes,
    setNotes,
    exportData,
    importData,
    resetAll,
  } = useStore();

  const profile = PROFILES[activeProfile];
  const [notes, setLocalNotes] = useState(getNotes(activeProfile));
  const fileRef = useRef(null);

  // Recompute notes when profile changes
  const currentNotes = getNotes(activeProfile);
  if (
    notes !== currentNotes &&
    notes === getNotes(activeProfile === "abhav" ? "wife" : "abhav")
  ) {
    setLocalNotes(currentNotes);
  }

  const myApps = useMemo(
    () => applications.filter((a) => a.profile === activeProfile),
    [applications, activeProfile],
  );

  const stats = useMemo(() => {
    const stageCounts = {};
    STAGES.forEach((s) => (stageCounts[s.id] = 0));
    myApps.forEach(
      (a) => (stageCounts[a.stage] = (stageCounts[a.stage] || 0) + 1),
    );

    const today = todayKey();
    const todayApps = activity[today] || 0;
    const week = last7Days();
    const weekTotal = week.reduce((s, d) => s + (activity[d] || 0), 0);

    return { total: myApps.length, stageCounts, todayApps, weekTotal, week };
  }, [myApps, activity]);

  const goalPct = Math.min((stats.todayApps / goalTarget) * 100, 100);
  const weekMax = Math.max(...stats.week.map((d) => activity[d] || 0), 1);

  const recent = useMemo(
    () =>
      [...myApps]
        .sort((a, b) =>
          (b.updatedAt || b.date || "").localeCompare(
            a.updatedAt || a.date || "",
          ),
        )
        .slice(0, 8),
    [myApps],
  );

  const handleNotesChange = (e) => {
    setLocalNotes(e.target.value);
    setNotes(activeProfile, e.target.value);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importData(data);
        alert("Data imported successfully!");
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (window.confirm("Reset ALL data? This cannot be undone.")) {
      resetAll();
      setLocalNotes("");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h2>{profile.name}'s Dashboard</h2>
        <p className="subtitle">{profile.subtitle}</p>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card accent">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        {STAGES.map((s) => (
          <div
            key={s.id}
            className="stat-card"
            style={{ borderColor: s.color }}
          >
            <span className="stat-num">{stats.stageCounts[s.id]}</span>
            <span className="stat-label">
              {s.icon} {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Left Column */}
        <div className="col-main">
          {/* Daily Goal */}
          <div className="card goal-card">
            <h3>Daily Goal</h3>
            <div className="goal-row">
              <svg className="goal-ring" viewBox="0 0 100 100">
                <circle className="goal-bg" cx="50" cy="50" r="42" />
                <circle
                  className="goal-fill"
                  cx="50"
                  cy="50"
                  r="42"
                  strokeDasharray={`${(goalPct / 100) * 264} 264`}
                  style={{
                    stroke: goalPct >= 100 ? "var(--green)" : "var(--accent)",
                  }}
                />
                <text x="50" y="48" textAnchor="middle" className="goal-text">
                  {stats.todayApps}/{goalTarget}
                </text>
                <text
                  x="50"
                  y="62"
                  textAnchor="middle"
                  className="goal-subtext"
                >
                  today
                </text>
              </svg>
              <div className="goal-controls">
                <label>Target per day:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="card">
            <h3>Weekly Activity</h3>
            <div className="week-chart">
              {stats.week.map((day) => {
                const val = activity[day] || 0;
                const hPct = (val / weekMax) * 100;
                const dayLabel = new Date(day + "T00:00:00").toLocaleDateString(
                  "en",
                  {
                    weekday: "short",
                  },
                );
                return (
                  <div key={day} className="week-bar-col">
                    <span className="bar-val">{val}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${hPct}%` }}
                      />
                    </div>
                    <span className="bar-day">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
            <p className="week-total">Week total: {stats.weekTotal} actions</p>
          </div>

          {/* Recent Applications */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Applications</h3>
              <button
                className="link-btn"
                onClick={() => onNavigate("tracker")}
              >
                View All →
              </button>
            </div>
            {recent.length === 0 ? (
              <p className="empty">
                No applications yet. Start tracking on the Tracker page!
              </p>
            ) : (
              <div className="recent-list">
                {recent.map((app) => {
                  const stage = STAGES.find((s) => s.id === app.stage);
                  return (
                    <div key={app.id} className="recent-item">
                      <div>
                        <strong>{app.company}</strong>
                        <span className="role">{app.role}</span>
                      </div>
                      <span
                        className="stage-badge"
                        style={{ background: stage?.color }}
                      >
                        {stage?.icon} {stage?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-side">
          {/* Quick Links */}
          <div className="card">
            <h3>Quick Links</h3>
            <div className="quick-links">
              <button onClick={() => onNavigate("search")}>
                🔍 Job Search
              </button>
              <button onClick={() => onNavigate("tracker")}>📋 Tracker</button>
              <button onClick={() => onNavigate("companies")}>
                🏢 Companies
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3>📝 Notes ({profile.name})</h3>
            <textarea
              className="notes-area"
              value={notes}
              onChange={handleNotesChange}
              placeholder={`Notes, tips, reminders for ${profile.name}...`}
              rows={8}
            />
          </div>

          {/* Data Management */}
          <div className="card">
            <h3>⚙️ Data</h3>
            <div className="data-actions">
              <button className="btn btn-accent" onClick={exportData}>
                📥 Export Backup
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => fileRef.current?.click()}
              >
                📤 Import Backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <button className="btn btn-danger" onClick={handleReset}>
                🗑️ Reset All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
