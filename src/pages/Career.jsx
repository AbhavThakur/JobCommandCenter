import { useState } from "react";
import Discover from "./Discover";
import Tracker from "./Tracker";
import Companies from "./Companies";
import Insights from "./Insights";

const SUB_PAGES = [
  { id: "insights", label: "Insights" },
  { id: "discover", label: "Discover" },
  { id: "tracker", label: "Tracker" },
  { id: "companies", label: "Companies" },
];

export default function Career() {
  const [subPage, setSubPage] = useState("insights");

  return (
    <div className="career-page">
      <div className="page-header">
        <h2>Career</h2>
        <div className="tabs">
          {SUB_PAGES.map(({ id, label }) => (
            <button
              key={id}
              className={`nav-tab${subPage === id ? " active" : ""}`}
              onClick={() => setSubPage(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="career-subpage">
        {subPage === "insights" && <Insights />}
        {subPage === "discover" && <Discover />}
        {subPage === "tracker" && <Tracker />}
        {subPage === "companies" && <Companies />}
      </div>
    </div>
  );
}
