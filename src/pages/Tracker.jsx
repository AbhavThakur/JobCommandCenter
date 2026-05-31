import { useEffect, useMemo, useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { STAGES } from "../data/constants";
import {
  deletePipelineEntry,
  getCareerStorageUrl,
  subscribeCareerJobs,
  subscribePipeline,
  upsertPipelineEntry,
} from "../services/careerData";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  company: "",
  role: "",
  link: "",
  stage: "wishlist",
  salary: "",
  notes: "",
  jobId: "",
};

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
    <a className="kcard-link" href={url} target="_blank" rel="noreferrer">
      {Icon && <Icon size={12} />} {children}
    </a>
  );
}

export default function Tracker() {
  const { user } = useAuth();
  const isSignedIn = user && !user.isOffline;

  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterStage, setFilterStage] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSignedIn) {
      setApps([]);
      return undefined;
    }
    return subscribePipeline(setApps, (err) => setError(err.message));
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setJobs([]);
      return undefined;
    }
    return subscribeCareerJobs("all", setJobs, () => {});
  }, [isSignedIn]);

  const jobsById = useMemo(() => {
    const m = new Map();
    jobs.forEach((j) => m.set(j.id, j));
    return m;
  }, [jobs]);

  const grouped = useMemo(() => {
    const groups = {};
    STAGES.forEach((s) => (groups[s.id] = []));
    const list =
      filterStage === "all"
        ? apps
        : apps.filter((a) => a.stage === filterStage);
    list.forEach((a) => {
      const stage = a.stage in groups ? a.stage : "wishlist";
      groups[stage].push(a);
    });
    return groups;
  }, [apps, filterStage]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (app) => {
    setEditId(app.id);
    setForm({
      company: app.company || "",
      role: app.role || "",
      link: app.link || "",
      stage: app.stage || "wishlist",
      salary: app.salary || "",
      notes: app.notes || "",
      jobId: app.jobId || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.company.trim() || !form.role.trim()) return;
    try {
      await upsertPipelineEntry({ id: editId || undefined, ...form });
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await deletePipelineEntry(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMove = async (app, newStage) => {
    try {
      await upsertPipelineEntry({ ...app, stage: newStage });
    } catch (err) {
      setError(err.message);
    }
  };

  const stageIdx = (stageId) => STAGES.findIndex((s) => s.id === stageId);

  return (
    <div className="tracker-page">
      <div className="page-header">
        <h2>Application Tracker</h2>
        <div className="header-actions">
          <select
            className="filter-select"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.label}
              </option>
            ))}
          </select>
          <button
            className="btn btn-accent"
            onClick={openAdd}
            disabled={!isSignedIn}
          >
            + Add Application
          </button>
        </div>
      </div>

      {error && <p className="hint hint-error">{error}</p>}
      {!isSignedIn && (
        <p className="hint">Sign in to use the cloud-synced pipeline.</p>
      )}

      <div className="kanban">
        {STAGES.map((stage) => (
          <div key={stage.id} className="kanban-col">
            <div className="kanban-header" style={{ borderColor: stage.color }}>
              <span>
                {stage.icon} {stage.label}
              </span>
              <span className="kanban-count">{grouped[stage.id].length}</span>
            </div>
            <div className="kanban-cards">
              {grouped[stage.id].map((app) => {
                const job = app.jobId ? jobsById.get(app.jobId) : null;
                return (
                  <div key={app.id} className="kanban-card">
                    <div className="kcard-top">
                      <strong>{app.company}</strong>
                      <div className="kcard-actions">
                        <button title="Edit" onClick={() => openEdit(app)}>
                          ✏️
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(app.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <span className="kcard-role">{app.role}</span>
                    {app.salary && (
                      <span className="kcard-salary">💰 {app.salary}</span>
                    )}
                    {app.link && (
                      <a
                        className="kcard-link"
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Job →
                      </a>
                    )}
                    {job && (
                      <div className="kcard-attachments">
                        {typeof job.score === "number" && (
                          <span className="badge">Score {job.score}</span>
                        )}
                        <StorageLink
                          storagePath={job.reportStoragePath}
                          icon={FileText}
                        >
                          Report
                        </StorageLink>
                        <StorageLink
                          storagePath={job.pdfStoragePath}
                          icon={FileDown}
                        >
                          Tailored CV
                        </StorageLink>
                      </div>
                    )}
                    <div className="kcard-moves">
                      {stageIdx(app.stage) > 0 && (
                        <button
                          className="move-btn"
                          onClick={() =>
                            handleMove(app, STAGES[stageIdx(app.stage) - 1].id)
                          }
                        >
                          ← {STAGES[stageIdx(app.stage) - 1].icon}
                        </button>
                      )}
                      {stageIdx(app.stage) < STAGES.length - 1 && (
                        <button
                          className="move-btn"
                          onClick={() =>
                            handleMove(app, STAGES[stageIdx(app.stage) + 1].id)
                          }
                        >
                          {STAGES[stageIdx(app.stage) + 1].icon} →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {grouped[stage.id].length === 0 && (
                <div className="kanban-empty">No items</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editId ? "Edit Application" : "Add Application"}</h3>
            <div className="form-grid">
              <div className="field">
                <label>Company *</label>
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Role *</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Job Link</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Linked Job (optional)</label>
                <select
                  value={form.jobId}
                  onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                >
                  <option value="">— None —</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.companyName} · {j.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Salary / CTC</label>
                <input
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleSave}>
                {editId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
