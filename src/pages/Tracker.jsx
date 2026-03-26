import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { STAGES } from "../data/constants";

const EMPTY_FORM = {
  company: "",
  role: "",
  link: "",
  stage: "wishlist",
  salary: "",
  notes: "",
};

export default function Tracker() {
  const {
    activeProfile,
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    moveApplication,
    logDailyActivity,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterStage, setFilterStage] = useState("all");

  const myApps = useMemo(
    () => applications.filter((a) => a.profile === activeProfile),
    [applications, activeProfile],
  );

  const grouped = useMemo(() => {
    const groups = {};
    STAGES.forEach((s) => (groups[s.id] = []));
    const list =
      filterStage === "all"
        ? myApps
        : myApps.filter((a) => a.stage === filterStage);
    list.forEach((a) => {
      if (groups[a.stage]) groups[a.stage].push(a);
    });
    // Sort each group by updatedAt desc
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) =>
        (b.updatedAt || b.date || "").localeCompare(
          a.updatedAt || a.date || "",
        ),
      ),
    );
    return groups;
  }, [myApps, filterStage]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (app) => {
    setEditId(app.id);
    setForm({
      company: app.company,
      role: app.role,
      link: app.link || "",
      stage: app.stage,
      salary: app.salary || "",
      notes: app.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.company.trim() || !form.role.trim()) return;

    if (editId) {
      updateApplication(editId, form);
    } else {
      addApplication({ ...form, profile: activeProfile });
      logDailyActivity();
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this application?")) {
      deleteApplication(id);
    }
  };

  const handleMove = (id, newStage) => {
    moveApplication(id, newStage);
  };

  const stageIdx = (stageId) => STAGES.findIndex((s) => s.id === stageId);

  return (
    <div className="tracker-page">
      <div className="page-header">
        <h2>📋 Application Tracker</h2>
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
          <button className="btn btn-accent" onClick={openAdd}>
            ＋ Add Application
          </button>
        </div>
      </div>

      {/* Kanban */}
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
              {grouped[stage.id].map((app) => (
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
                  <div className="kcard-moves">
                    {stageIdx(app.stage) > 0 && (
                      <button
                        className="move-btn"
                        onClick={() =>
                          handleMove(app.id, STAGES[stageIdx(app.stage) - 1].id)
                        }
                      >
                        ← {STAGES[stageIdx(app.stage) - 1].icon}
                      </button>
                    )}
                    {stageIdx(app.stage) < STAGES.length - 1 && (
                      <button
                        className="move-btn"
                        onClick={() =>
                          handleMove(app.id, STAGES[stageIdx(app.stage) + 1].id)
                        }
                      >
                        {STAGES[stageIdx(app.stage) + 1].icon} →
                      </button>
                    )}
                  </div>
                  <span className="kcard-date">
                    {app.updatedAt || app.date}
                  </span>
                </div>
              ))}
              {grouped[stage.id].length === 0 && (
                <div className="kanban-empty">No items</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
                  placeholder="Company name"
                />
              </div>
              <div className="field">
                <label>Role *</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Job title"
                />
              </div>
              <div className="field">
                <label>Job Link</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                />
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
                  placeholder="e.g. 30-40 LPA"
                />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes..."
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
