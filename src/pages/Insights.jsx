import { useEffect, useMemo, useState } from "react";
import { STAGES } from "../data/constants";
import { subscribeCareerJobs, subscribePipeline } from "../services/careerData";
import { useAuth } from "../context/AuthContext";

function bucketScore(score) {
  if (typeof score !== "number") return "unscored";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default function Insights() {
  const { user } = useAuth();
  const isSignedIn = user && !user.isOffline;
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!isSignedIn) return undefined;
    return subscribePipeline(setApps);
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return undefined;
    return subscribeCareerJobs("all", setJobs);
  }, [isSignedIn]);

  const funnel = useMemo(() => {
    const counts = Object.fromEntries(STAGES.map((s) => [s.id, 0]));
    apps.forEach((a) => {
      const stage = a.stage in counts ? a.stage : "wishlist";
      counts[stage] += 1;
    });
    return counts;
  }, [apps]);

  const responseRate = useMemo(() => {
    if (apps.length === 0) return 0;
    const responded = apps.filter(
      (a) => !["wishlist", "applied"].includes(a.stage),
    ).length;
    return Math.round((responded / apps.length) * 100);
  }, [apps]);

  const scoreBuckets = useMemo(() => {
    const b = { high: 0, mid: 0, low: 0, unscored: 0 };
    jobs.forEach((j) => (b[bucketScore(j.score)] += 1));
    return b;
  }, [jobs]);

  const topJobs = useMemo(
    () =>
      [...jobs]
        .filter((j) => typeof j.score === "number")
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5),
    [jobs],
  );

  if (!isSignedIn) {
    return (
      <div className="insights-page">
        <p className="hint">Sign in to see your insights.</p>
      </div>
    );
  }

  return (
    <div className="insights-page">
      <div className="page-header">
        <h2>Insights</h2>
        <p className="subtitle">
          A snapshot of your job-search funnel and CV-to-JD fit.
        </p>
      </div>

      <div className="kpi-row">
        <div className="card kpi-card">
          <span className="kpi-label">Total applications</span>
          <span className="kpi-value">{apps.length}</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Response rate</span>
          <span className="kpi-value">{responseRate}%</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Scored jobs in library</span>
          <span className="kpi-value">{jobs.length}</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">High-fit (≥80)</span>
          <span className="kpi-value">{scoreBuckets.high}</span>
        </div>
      </div>

      <div className="card">
        <h3>Pipeline by stage</h3>
        <div className="funnel">
          {STAGES.map((s) => (
            <div key={s.id} className="funnel-row">
              <span>
                {s.icon} {s.label}
              </span>
              <div className="funnel-bar">
                <div
                  className="funnel-fill"
                  style={{
                    width:
                      apps.length > 0
                        ? `${(funnel[s.id] / apps.length) * 100}%`
                        : "0%",
                    background: s.color,
                  }}
                />
              </div>
              <span>{funnel[s.id]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Score distribution</h3>
        <ul>
          <li>High fit (≥80): {scoreBuckets.high}</li>
          <li>Mid fit (60–79): {scoreBuckets.mid}</li>
          <li>Low fit (&lt;60): {scoreBuckets.low}</li>
          <li>Not evaluated yet: {scoreBuckets.unscored}</li>
        </ul>
      </div>

      <div className="card">
        <h3>Top 5 highest-scoring jobs</h3>
        {topJobs.length === 0 ? (
          <p className="hint">
            Evaluate some jobs from Discover to see them here.
          </p>
        ) : (
          <ul>
            {topJobs.map((j) => (
              <li key={j.id}>
                <strong>{j.companyName}</strong> · {j.title} —{" "}
                <span className="badge">{j.score}</span>
                {j.scoreReason ? ` — ${j.scoreReason}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
