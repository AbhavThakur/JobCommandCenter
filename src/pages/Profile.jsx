import { useEffect, useRef, useState } from "react";
import { FileText, Save, Sparkles, UploadCloud, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CAREER_ROLES } from "../data/careerRoles";
import {
  getResumeDownloadUrl,
  parseResume,
  savePreferences,
  subscribeUserProfile,
  uploadResume,
} from "../services/userProfile";

const DEFAULT_PREFS = {
  roleId: "all",
  targetRoles: [],
  locations: [],
  minSalaryLpa: 0,
  experienceYears: 0,
  remoteOk: false,
  notes: "",
};

function formatDate(value) {
  if (!value) return "—";
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function Profile() {
  const { user } = useAuth();
  const isSignedIn = user && !user.isOffline;
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return undefined;
    return subscribeUserProfile(
      (next) => {
        setProfile(next);
        if (next?.preferences) {
          setPrefs({ ...DEFAULT_PREFS, ...next.preferences });
        }
      },
      (err) => setError(err.message),
    );
  }, [isSignedIn]);

  useEffect(() => {
    if (!profile?.resume?.storagePath) {
      setResumeUrl("");
      return;
    }
    getResumeDownloadUrl(profile.resume.storagePath)
      .then(setResumeUrl)
      .catch(() => setResumeUrl(""));
  }, [profile?.resume?.storagePath]);

  const parsedSkills = profile?.parsedProfile?.skills || [];
  const parsedTitles = profile?.parsedProfile?.titles || [];

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsBusy(true);
    setError("");
    setStatus("");
    try {
      await uploadResume(file);
      setStatus("Resume uploaded. Click 'Parse with AI' to extract skills.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleParse = async () => {
    setIsBusy(true);
    setError("");
    setStatus("");
    try {
      await parseResume();
      setStatus("Parsing started. Refresh in a few seconds.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSavePrefs = async () => {
    setIsBusy(true);
    setError("");
    setStatus("");
    try {
      await savePreferences(prefs);
      setStatus("Preferences saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const [locationsText, setLocationsText] = useState(() =>
    (prefs.locations || []).join(", "),
  );
  const [titlesText, setTitlesText] = useState(() =>
    (prefs.targetRoles || []).join(", "),
  );

  // Sync text fields when prefs are loaded from Firestore
  useEffect(() => {
    setLocationsText((prefs.locations || []).join(", "));
    setTitlesText((prefs.targetRoles || []).join(", "));
  }, [prefs.locations, prefs.targetRoles]);

  if (!isSignedIn) {
    return (
      <div className="empty-state">
        Sign in to set up your profile and resume.
      </div>
    );
  }

  return (
    <div
      className="profile-page"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div className="page-header">
        <h2>
          <User size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
          My Profile
        </h2>
        <p className="subtitle">
          Your resume + preferences power every AI scan, evaluation, and
          tailored CV.
        </p>
      </div>

      {/* Resume card */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 12 }}>
          <FileText
            size={16}
            style={{ verticalAlign: "middle", marginRight: 8 }}
          />
          Resume
        </h3>

        {profile?.resume?.storagePath ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div>
              <strong>{profile.resume.fileName || "resume"}</strong>
              <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                · uploaded {formatDate(profile.resume.uploadedAt)}
              </span>
            </div>
            {resumeUrl && (
              <a
                className="btn btn-sm btn-secondary"
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ width: "fit-content" }}
              >
                View resume
              </a>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>
            No resume uploaded yet. Upload a .md or .pdf file.
          </p>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.pdf,text/markdown,application/pdf"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <button
            className="btn btn-accent"
            onClick={() => fileRef.current?.click()}
            disabled={isBusy}
          >
            <UploadCloud size={15} />
            {profile?.resume?.storagePath ? "Replace resume" : "Upload resume"}
          </button>
          {profile?.resume?.storagePath && (
            <button
              className="btn btn-secondary"
              onClick={handleParse}
              disabled={isBusy}
            >
              <Sparkles size={15} />
              Parse with AI
            </button>
          )}
        </div>

        {profile?.parsedProfile && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: "var(--surface2)",
              borderRadius: 8,
            }}
          >
            <h4 style={{ marginBottom: 8 }}>AI-extracted profile</h4>
            {profile.parsedProfile.headline && (
              <p style={{ marginBottom: 8 }}>
                <strong>Headline:</strong> {profile.parsedProfile.headline}
              </p>
            )}
            {typeof profile.parsedProfile.years === "number" && (
              <p style={{ marginBottom: 8 }}>
                <strong>Experience:</strong> {profile.parsedProfile.years} years
              </p>
            )}
            {parsedTitles.length > 0 && (
              <p style={{ marginBottom: 8 }}>
                <strong>Recent titles:</strong> {parsedTitles.join(", ")}
              </p>
            )}
            {parsedSkills.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong>Skills:</strong>
                <div className="chip-row" style={{ marginTop: 4 }}>
                  {parsedSkills.slice(0, 30).map((skill) => (
                    <span key={skill} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 8 }}>
              Last parsed {formatDate(profile.resume?.parsedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Preferences card */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Job preferences</h3>
        <div className="form-grid">
          <div className="field">
            <label>Primary role</label>
            <select
              value={prefs.roleId}
              onChange={(e) => setPrefs({ ...prefs, roleId: e.target.value })}
            >
              {CAREER_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Years of experience</label>
            <input
              type="number"
              min="0"
              value={prefs.experienceYears ?? ""}
              onChange={(e) =>
                setPrefs({ ...prefs, experienceYears: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>Min Expected salary (LPA)</label>
            <input
              type="number"
              min="0"
              value={prefs.minSalaryLpa ?? ""}
              onChange={(e) =>
                setPrefs({ ...prefs, minSalaryLpa: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={prefs.remoteOk}
                onChange={(e) =>
                  setPrefs({ ...prefs, remoteOk: e.target.checked })
                }
                style={{ marginRight: 6 }}
              />
              Open to remote
            </label>
          </div>
          <div className="field full">
            <label>Target locations (comma separated)</label>
            <input
              value={locationsText}
              onChange={(e) => setLocationsText(e.target.value)}
              onBlur={() =>
                setPrefs({
                  ...prefs,
                  locations: locationsText
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Bengaluru, Hyderabad, Remote"
            />
          </div>
          <div className="field full">
            <label>Target titles (comma separated)</label>
            <input
              value={titlesText}
              onChange={(e) => setTitlesText(e.target.value)}
              onBlur={() =>
                setPrefs({
                  ...prefs,
                  targetRoles: titlesText
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Senior React Native, Mobile Lead"
            />
          </div>
          <div className="field full">
            <label>Notes for the AI evaluator</label>
            <textarea
              rows={3}
              value={prefs.notes || ""}
              onChange={(e) => setPrefs({ ...prefs, notes: e.target.value })}
              placeholder="What you want to avoid, things you optimise for, dealbreakers..."
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-accent"
            onClick={handleSavePrefs}
            disabled={isBusy}
          >
            <Save size={15} />
            Save preferences
          </button>
        </div>
      </div>

      {status && (
        <div className="card" style={{ padding: 12, color: "var(--accent)" }}>
          {status}
        </div>
      )}
      {error && (
        <div className="empty-state job-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
