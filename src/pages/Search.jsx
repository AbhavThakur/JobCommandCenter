import { useState } from "react";
import { useStore } from "../store/useStore";
import { PROFILES, LOCATIONS, EXPERIENCE_OPTIONS } from "../data/constants";

const PLATFORMS = [
  {
    name: "LinkedIn",
    icon: "🔗",
    url: (kw, loc) =>
      `https://www.linkedin.com/jobs/search/?keywords=${kw}&location=${loc}&f_E=3%2C4`,
  },
  {
    name: "Naukri",
    icon: "📄",
    url: (kw, loc, exp) =>
      `https://www.naukri.com/${kw.replace(/\s+/g, "-").toLowerCase()}-jobs-in-${loc.split(" ")[0].toLowerCase()}?experience=${exp}`,
  },
  {
    name: "CutShort",
    icon: "✂️",
    url: (kw, loc) =>
      `https://cutshort.io/jobs?q=${kw}&city=${loc.split(" ")[0]}`,
  },
  {
    name: "Wellfound",
    icon: "👼",
    url: (kw, loc) => `https://wellfound.com/jobs?q=${kw}&location=${loc}`,
  },
  {
    name: "Instahyre",
    icon: "⚡",
    url: (kw) => `https://www.instahyre.com/search-jobs/?designation=${kw}`,
  },
  {
    name: "Indeed",
    icon: "🟦",
    url: (kw, loc) => `https://www.indeed.co.in/jobs?q=${kw}&l=${loc}`,
  },
];

export default function Search() {
  const { activeProfile } = useStore();
  const profile = PROFILES[activeProfile];

  const [keyword, setKeyword] = useState(profile.defaultKw);
  const [location, setLocation] = useState("Bengaluru");
  const [experience, setExperience] = useState("5");

  // Sync keyword when profile switches
  const [lastProfile, setLastProfile] = useState(activeProfile);
  if (activeProfile !== lastProfile) {
    setKeyword(PROFILES[activeProfile].defaultKw);
    setLastProfile(activeProfile);
  }

  const encodedKw = encodeURIComponent(keyword);
  const encodedLoc = encodeURIComponent(location);

  const openPlatform = (platform) => {
    const url = platform.url(encodedKw, encodedLoc, experience);
    window.open(url, "_blank", "noopener");
  };

  const openAll = () => {
    PLATFORMS.forEach((p) => {
      window.open(
        p.url(encodedKw, encodedLoc, experience),
        "_blank",
        "noopener",
      );
    });
  };

  return (
    <div className="search-page">
      <div className="page-header">
        <h2>🔍 Job Search</h2>
        <p className="subtitle">
          Search across all major job boards for {profile.name}
        </p>
      </div>

      {/* Search Controls */}
      <div className="card search-controls">
        <div className="search-row">
          <div className="field grow">
            <label>Keyword / Role</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. React Native, Product Manager"
            />
          </div>
          <div className="field">
            <label>Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {LOCATIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              {EXPERIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-accent open-all-btn" onClick={openAll}>
          🚀 Open All Boards
        </button>
      </div>

      {/* Quick Searches */}
      <div className="card">
        <h3>Quick Searches for {profile.name}</h3>
        <div className="chip-row">
          {profile.quickSearches.map((qs) => (
            <button
              key={qs}
              className={`chip${keyword === qs ? " active" : ""}`}
              onClick={() => setKeyword(qs)}
            >
              {qs}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Cards */}
      <div className="platform-grid">
        {PLATFORMS.map((p) => (
          <button
            key={p.name}
            className="platform-card"
            onClick={() => openPlatform(p)}
          >
            <span className="platform-icon">{p.icon}</span>
            <span className="platform-name">{p.name}</span>
            <span className="platform-go">Open →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
