import { useState } from "react";
import Sidebar from "./components/Sidebar";
import GrowthDashboard from "./pages/GrowthDashboard";
import Career from "./pages/Career";
import HealthPage from "./pages/HealthPage";
import WealthPage from "./pages/WealthPage";
import AILabPage from "./pages/AILabPage";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGate from "./components/AuthGate";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <ErrorBoundary>
      <AuthGate>
        <Sidebar page={page} setPage={setPage} />
        <div className="gos-main">
          {page === "home" && <GrowthDashboard />}
          {page === "career" && <Career />}
          {page === "health" && <HealthPage />}
          {page === "wealth" && <WealthPage />}
          {page === "ailab" && <AILabPage />}
        </div>
      </AuthGate>
    </ErrorBoundary>
  );
}
