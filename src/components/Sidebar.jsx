import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Sparkles,
  Dumbbell,
  BarChart2,
  Menu,
  X,
  LogOut,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "progress", label: "Progress", icon: BarChart2 },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "health", label: "Health", icon: Dumbbell },
  { id: "wealth", label: "Wealth", icon: TrendingUp },
  { id: "ailab", label: "AI Lab", icon: Sparkles },
];

export default function Sidebar({ page, setPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth() ?? {};

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleNav = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  // User avatar initials
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : user?.isOffline
      ? "LO"
      : "?";

  const sidebarContent = (
    <div style={styles.inner}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <Zap size={14} color="#2dd4bf" />
        </div>
        <div style={styles.brandWords}>
          <span style={styles.brandText}>Growth OS</span>
          <span style={styles.brandTag}>Life Command Center</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={styles.nav}>
        <div style={styles.navSection}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    ...styles.navIconWrap,
                    ...(active ? styles.navIconWrapActive : {}),
                  }}
                >
                  <Icon
                    size={15}
                    style={{
                      color: active ? "var(--teal)" : "var(--muted)",
                      flexShrink: 0,
                    }}
                  />
                </div>
                <span>{label}</span>
                {active && <div style={styles.navActiveDot} />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User profile footer */}
      <div style={styles.footer}>
        <div style={styles.userRow}>
          <div style={styles.avatar}>{initials}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>
              {user?.isOffline
                ? "Local Mode"
                : (user?.email?.split("@")[0] ?? "Unknown")}
            </div>
            <div style={styles.userEmail}>
              {user?.isOffline ? "No account" : (user?.email ?? "")}
            </div>
          </div>
          {logout && (
            <button style={styles.logoutBtn} onClick={logout} title="Sign out">
              <LogOut size={14} />
            </button>
          )}
        </div>
        <div style={styles.version}>v0.1 · Apr 2026</div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="gos-mobile-hamburger"
        style={styles.hamburger}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div style={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <button
              style={styles.mobileClose}
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="gos-sidebar" style={styles.desktop}>
        {sidebarContent}
      </aside>
    </>
  );
}

const styles = {
  desktop: {
    width: 240,
    flexShrink: 0,
    background: "linear-gradient(180deg, #0f1219 0%, #0d1017 100%)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 60,
    display: "flex",
    flexDirection: "column",
  },
  inner: { display: "flex", flexDirection: "column", height: "100%" },
  brand: {
    padding: "18px 16px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background:
      "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(45,212,191,0.06))",
    border: "1px solid rgba(45,212,191,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandWords: { display: "flex", flexDirection: "column", gap: 1 },
  brandText: {
    fontFamily: "var(--sans)",
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: "-0.02em",
    color: "var(--text)",
  },
  brandTag: {
    fontSize: 10,
    color: "var(--muted)",
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
  nav: {
    flex: 1,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  navSection: { display: "flex", flexDirection: "column", gap: 1 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "9px 10px",
    borderRadius: 10,
    background: "transparent",
    color: "var(--text2)",
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "var(--sans)",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
    position: "relative",
  },
  navItemActive: {
    background:
      "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(45,212,191,0.04))",
    color: "var(--teal)",
    fontWeight: 600,
  },
  navIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.04)",
    flexShrink: 0,
    transition: "all 0.15s",
  },
  navIconWrapActive: { background: "rgba(45,212,191,0.15)" },
  navActiveDot: {
    position: "absolute",
    right: 10,
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--teal)",
    boxShadow: "0 0 6px rgba(45,212,191,0.6)",
  },
  footer: {
    padding: "12px 12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
    minWidth: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    flexShrink: 0,
    background:
      "linear-gradient(135deg, rgba(45,212,191,0.3), rgba(99,102,241,0.3))",
    border: "1px solid rgba(45,212,191,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--teal)",
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userEmail: {
    fontSize: 10,
    color: "var(--muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    flexShrink: 0,
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s",
  },
  version: {
    fontSize: 10,
    color: "rgba(100,116,139,0.5)",
    fontFamily: "var(--mono)",
  },
  hamburger: {
    position: "fixed",
    top: 14,
    left: 14,
    zIndex: 90,
    width: 38,
    height: 38,
    borderRadius: 9,
    background: "rgba(15,18,25,0.9)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--text2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  mobileOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
  },
  mobileDrawer: {
    width: "min(280px, 80vw)",
    height: "100%",
    background: "linear-gradient(180deg, #0f1219 0%, #0d1017 100%)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
    animation: "drawerSlideIn 0.2s ease-out",
  },
  mobileClose: {
    position: "absolute",
    top: 14,
    right: 10,
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
  },
};
