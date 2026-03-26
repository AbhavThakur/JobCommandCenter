import { useState } from "react";
import { useStore } from "./store/useStore";
import { PROFILES } from "./data/constants";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Tracker from "./pages/Tracker";
import Companies from "./pages/Companies";

const PAGES = ["dashboard", "search", "tracker", "companies"];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const { activeProfile, switchProfile } = useStore();

  return (
    <>
      <nav className="topnav">
        <div className="nav-brand">
          <div className="dot" />
          <span>Job Command Center</span>
        </div>
        <div className="nav-tabs">
          {PAGES.map((p) => (
            <button
              key={p}
              className={`nav-tab${page === p ? " active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="profile-switcher">
            {Object.keys(PROFILES).map((id) => (
              <button
                key={id}
                className={`profile-btn${activeProfile === id ? " active" : ""}`}
                onClick={() => switchProfile(id)}
              >
                {id === "abhav" ? "Abhav" : "Wife (PM)"}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <div className="main">
        {page === "dashboard" && <Dashboard onNavigate={setPage} />}
        {page === "search" && <Search />}
        {page === "tracker" && <Tracker />}
        {page === "companies" && <Companies />}
      </div>
    </>
  );
}
