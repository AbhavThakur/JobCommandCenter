import { useState } from "react";
import Sidebar from "./components/Sidebar";
import GrowthDashboard from "./pages/GrowthDashboard";
import Career from "./pages/Career";
import HealthPage from "./pages/HealthPage";
import WealthPage from "./pages/WealthPage";
import AILabPage from "./pages/AILabPage";
import ProgressPage from "./pages/ProgressPage";
import Profile from "./pages/Profile";
import InterviewPrep from "./pages/InterviewPrep";
import Learning from "./pages/Learning";
import Habits from "./pages/Habits";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGate from "./components/AuthGate";
import QuickCaptureFAB from "./components/QuickCaptureFAB";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <ErrorBoundary>
      <AuthGate>
        <Sidebar page={page} setPage={setPage} />
        <div className="gos-main">
          {page === "home" && <GrowthDashboard setPage={setPage} />}
          {page === "progress" && <ProgressPage />}
          {page === "profile" && <Profile />}
          {page === "career" && <Career />}
          {page === "learning" && <Learning />}
          {page === "habits" && <Habits />}
          {page === "interview-prep" && <InterviewPrep />}
          {page === "health" && <HealthPage />}
          {page === "wealth" && <WealthPage />}
          {page === "ailab" && <AILabPage />}
        </div>
        <QuickCaptureFAB />
      </AuthGate>
    </ErrorBoundary>
  );
}
