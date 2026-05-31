import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  CAREER_ROLES,
  DEFAULT_CAREER_ROLE_ID,
  getCareerRole,
} from "../data/careerRoles";
import {
  createCareerSearchRun,
  deleteJob,
  getCareerStorageUrl,
  saveJobForUser,
  subscribeCareerJobs,
  subscribeCareerSearchRun,
  subscribeCareerSearchRuns,
} from "../services/careerData";
import {
  evaluateJob,
  subscribeUserProfile,
  tailorCv,
} from "../services/userProfile";
import { useAuth } from "../context/AuthContext";

const EXTERNAL_BOARDS = [
  {
    name: "LinkedIn",
    url: (kw, loc) =>
      `https://www.linkedin.com/jobs/search/?keywords=${kw}&location=${loc}&f_E=3%2C4`,
  },
  {
    name: "Naukri",
    url: (kw, loc) =>
      `https://www.naukri.com/${kw.replace(/\s+/g, "-").toLowerCase()}-jobs-in-${loc.split(",")[0].split(" ")[0].toLowerCase()}`,
  },
  {
    name: "Wellfound",
    url: (kw, loc) => `https://wellfound.com/jobs?q=${kw}&location=${loc}`,
  },
  {
    name: "Instahyre",
    url: (kw) => `https://www.instahyre.com/search-jobs/?designation=${kw}`,
  },
  {
    name: "Indeed",
    url: (kw, loc) => `https://www.indeed.co.in/jobs?q=${kw}&l=${loc}`,
  },
];

function formatDate(value) {
  if (!value) return "-";
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function ScoreBadge({ score }) {
  if (typeof score !== "number") return <span className="badge">unscored</span>;
  const tone = score >= 80 ? "good" : score >= 60 ? "warn" : "bad";
  return (
    <span className={`badge score-${tone}`} title="Match score (0–100)">
      <Star size={12} /> {score}
    </span>
  );
}

function StorageLink({ storagePath, icon: Icon, children }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!storagePath) {
      setUrl("");
      return;
    }
    let cancelled = false;
    getCareerStorageUrl(storagePath)
      .then((u) => !cancelled && setUrl(u || ""))
      .catch(() => !cancelled && setUrl(""));
    return () => {
      cancelled = true;
    };
  }, [storagePath]);
  if (!url) return null;
  return (
    <a
      className="btn btn-sm btn-secondary"
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      {Icon && <Icon size={14} />} {children}
    </a>
  );
}

function JobCard({ job, onEvaluate, onTailor, onDelete, busy }) {
  const company = job.companyName || job.company || "Unknown company";
  return (
    <article className="job-card">
      <div className="job-card-main">
        <div>
          <h3>{job.title || "Untitled role"}</h3>
          <p className="job-company">
            {company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        <ScoreBadge score={job.score} />
      </div>

      {job.scoreReason && (
        <p className="job-why">
          <Sparkles size={12} /> {job.scoreReason}
        </p>
      )}

      {Array.isArray(job.matchGaps) && job.matchGaps.length > 0 && (
        <div className="chip-row">
          {job.matchGaps.map((gap) => (
            <span key={gap} className="chip chip-warn">
              gap: {gap}
            </span>
          ))}
        </div>
      )}

      <div className="job-meta-grid">
        <span>Source: {job.sourcePortal || job.source || "career-ops"}</span>
        <span>Scanned: {formatDate(job.lastScannedAt || job.firstSeenAt)}</span>
      </div>

      <div className="job-card-actions">
        {job.applyUrl && (
          <a
            className="btn btn-sm btn-accent"
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={14} /> Apply
          </a>
        )}
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => onEvaluate(job)}
          disabled={busy}
        >
          {busy === `eval:${job.id}` ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <Sparkles size={14} />
          )}
          Evaluate
        </button>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => onTailor(job)}
          disabled={busy}
        >
          {busy === `tailor:${job.id}` ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <Wand2 size={14} />
          )}
          Tailor CV
        </button>
        <StorageLink storagePath={job.reportStoragePath} icon={FileText}>
          Report
        </StorageLink>
        <StorageLink storagePath={job.pdfStoragePath} icon={FileDown}>
          PDF
        </StorageLink>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(job)}
          title="Delete this job"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </article>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const isSignedIn = user && !user.isOffline;

  const [roleId, setRoleId] = useState(DEFAULT_CAREER_ROLE_ID);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Bengaluru");
  const [radiusKm, setRadiusKm] = useState(20);

  const [jobs, setJobs] = useState([]);
  const [searchRunId, setSearchRunId] = useState("");
  const [searchRun, setSearchRun] = useState(null);
  const [searchRuns, setSearchRuns] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pasteJdJobId, setPasteJdJobId] = useState(null);
  const [pasteJdText, setPasteJdText] = useState("");

  // Load saved preferences (role, location) on mount
  useEffect(() => {
    if (!isSignedIn) return undefined;
    return subscribeUserProfile((profile) => {
      const prefs = profile?.preferences;
      if (prefs?.roleId) setRoleId(prefs.roleId);
      if (prefs?.locations?.length) setLocation(prefs.locations[0]);
    });
  }, [isSignedIn]);

  useEffect(() => {
    const role = getCareerRole(roleId);
    setKeyword(role?.keywords?.[0] || "");
  }, [roleId]);

  useEffect(() => {
    if (!isSignedIn) {
      setJobs([]);
      return undefined;
    }
    return subscribeCareerJobs(roleId, setJobs, (err) => setError(err.message));
  }, [roleId, isSignedIn]);

  useEffect(() => {
    if (!searchRunId) return undefined;
    return subscribeCareerSearchRun(searchRunId, setSearchRun, (err) =>
      setError(err.message),
    );
  }, [searchRunId]);

  useEffect(() => {
    if (!isSignedIn) return undefined;
    return subscribeCareerSearchRuns(setSearchRuns, (err) =>
      setError(err.message),
    );
  }, [isSignedIn]);

  const visibleJobs = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((job) =>
      [job.title, job.companyName, job.location, job.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [jobs, keyword]);

  const handleStartSearch = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsSearching(true);
    try {
      const id = await createCareerSearchRun({
        roleId,
        query: keyword,
        location,
        radiusKm,
      });
      setSearchRunId(id);
      setInfo("Search queued. Results will appear below as the worker scans.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEvaluate = async (job) => {
    if (!job.id) return;
    let jd = job.jdText || job.description || "";
    if (!jd) {
      if (pasteJdJobId === job.id && pasteJdText.trim()) {
        jd = pasteJdText.trim();
      } else {
        setPasteJdJobId(job.id);
        setError("Paste the JD text below first, then click Evaluate again.");
        return;
      }
    }
    setBusy(`eval:${job.id}`);
    setError("");
    try {
      const result = await evaluateJob({
        jobId: job.id,
        jdText: jd,
        jdUrl: job.applyUrl,
      });
      setInfo(
        `Evaluated. Score ${result.score ?? "?"}/100. Report saved to your library.`,
      );
      setPasteJdJobId(null);
      setPasteJdText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleTailor = async (job) => {
    if (!job.id) return;
    let jd = job.jdText || job.description || "";
    if (!jd) {
      if (pasteJdJobId === job.id && pasteJdText.trim()) {
        jd = pasteJdText.trim();
      } else {
        setPasteJdJobId(job.id);
        setError("Paste the JD text below first, then click Tailor CV again.");
        return;
      }
    }
    setBusy(`tailor:${job.id}`);
    setError("");
    try {
      await tailorCv({
        jobId: job.id,
        jdText: jd,
        jdUrl: job.applyUrl,
      });
      setInfo("Tailored CV saved to your library.");
      setPasteJdJobId(null);
      setPasteJdText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (job) => {
    if (!job.id) return;
    if (!window.confirm(`Delete "${job.title || "this job"}"?`)) return;
    try {
      await deleteJob(job.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveExternal = async () => {
    setError("");
    setInfo("");
    try {
      const id = await saveJobForUser({
        companyName: "External link",
        title: keyword || "Pasted role",
        location,
        applyUrl: "",
        source: "manual",
        sourcePortal: "manual",
        roleIds: roleId === "all" ? [] : [roleId],
      });
      setInfo(`Saved placeholder job (id ${id}). Edit it from your pipeline.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const encKw = encodeURIComponent(keyword);
  const encLoc = encodeURIComponent(location);

  return (
    <div className="discover-page">
      <div className="page-header">
        <h2>Discover Jobs</h2>
        <p className="subtitle">
          Search external boards, run async scans, and score roles against your
          CV.
        </p>
      </div>

      <form className="card jobs-search-form" onSubmit={handleStartSearch}>
        <div className="search-row">
          <div className="field">
            <label>Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {CAREER_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field grow">
            <label>Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="React Native, Product Manager…"
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="field jobs-radius-field">
            <label>Radius (km)</label>
            <input
              type="number"
              min="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
            />
          </div>
        </div>
        <div className="button-row">
          <button
            type="submit"
            className="btn btn-accent"
            disabled={isSearching || !isSignedIn}
          >
            <Search size={15} />
            {isSearching ? "Starting…" : "Run async scan"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveExternal}
            disabled={!isSignedIn}
          >
            Save manual entry
          </button>
        </div>
      </form>

      <div className="card external-boards">
        <h3>Open external boards</h3>
        <div className="button-row">
          {EXTERNAL_BOARDS.map((b) => (
            <a
              key={b.name}
              className="btn btn-sm btn-secondary"
              href={b.url(encKw, encLoc)}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} /> {b.name}
            </a>
          ))}
        </div>
      </div>

      {info && <p className="hint hint-info">{info}</p>}
      {error && <p className="hint hint-error">{error}</p>}

      {searchRun && (
        <div className="card">
          <p>
            <strong>Latest run:</strong> {searchRun.status} —{" "}
            {searchRun.resultCount ?? 0} results
            {searchRun.error ? ` (${searchRun.error})` : ""}
          </p>
        </div>
      )}

      {pasteJdJobId && (
        <div className="card">
          <label>
            Paste the job description for the selected role:
            <textarea
              rows={6}
              value={pasteJdText}
              onChange={(e) => setPasteJdText(e.target.value)}
              placeholder="Paste the full JD here so the worker can evaluate or tailor against it."
            />
          </label>
        </div>
      )}

      <div className="jobs-list">
        {visibleJobs.length === 0 ? (
          <p className="hint">
            {isSignedIn
              ? "No jobs yet. Run a scan or save a manual entry above."
              : "Sign in to see your scored jobs."}
          </p>
        ) : (
          visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              busy={busy}
              onEvaluate={handleEvaluate}
              onTailor={handleTailor}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {searchRuns.length > 0 && (
        <details className="card">
          <summary>Recent search runs ({searchRuns.length})</summary>
          <ul>
            {searchRuns.map((run) => (
              <li key={run.id}>
                {run.status} — {run.query || "(no query)"} —{" "}
                {run.resultCount ?? 0} results · {formatDate(run.createdAt)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
