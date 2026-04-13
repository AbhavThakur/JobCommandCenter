import { useState, useRef, useEffect } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { ExternalLink, AlertTriangle, X, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const WEALTH_OS_URL = "https://mywealthforge.vercel.app/";

export default function WealthCard() {
  const { user } = useAuth() ?? {};
  const [data, setData] = useLocalStorage("growthOS_wealth_snapshot", {
    netWorth: "0",
    sip: "0",
    savingsRate: "0",
    lastUpdated: new Date().toISOString(),
  });

  const [ulipDismissed, setUlipDismissed] = useLocalStorage(
    "growthOS_ulip_dismissed",
    false,
  );
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  // Lazy initializer: runs once at mount (not during re-renders) — React 19 purity compliant
  const [isStale, setIsStale] = useState(
    () =>
      Math.floor(
        (Date.now() - new Date(data.lastUpdated).getTime()) / 86_400_000,
      ) > 30,
  );
  const [daysSinceUpdate] = useState(() =>
    Math.floor(
      (Date.now() - new Date(data.lastUpdated).getTime()) / 86_400_000,
    ),
  );

  const handleSyncFromFirestore = async () => {
    if (!db || !user?.uid || user?.isOffline) return;
    setSyncing(true);
    setSyncError("");
    try {
      // Try WealthOS Firestore path: households/{uid}/profile or users/{uid}/growthOS/wealthSnapshot
      const snap = await getDoc(
        doc(db, "users", user.uid, "growthOS", "wealthSnapshot"),
      );
      if (snap.exists()) {
        const d = snap.data();
        setData((prev) => ({
          ...prev,
          netWorth: String(d.netWorth ?? prev.netWorth),
          sip: String(d.sip ?? prev.sip),
          savingsRate: String(d.savingsRate ?? prev.savingsRate),
          lastUpdated: new Date().toISOString(),
        }));
        setIsStale(false);
      } else {
        setSyncError("No synced data found — update from WealthOS first");
      }
    } catch {
      setSyncError("Sync failed — check your Firebase connection");
    } finally {
      setSyncing(false);
    }
  };

  const handleBlur = (e, field) => {
    setEditing(null);
    if (e.target.value !== data[field]) {
      setData((prev) => ({
        ...prev,
        [field]: e.target.value,
        lastUpdated: new Date().toISOString(),
      }));
      setIsStale(false); // just saved → no longer stale
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === "Enter") {
      handleBlur(e, field);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>💰 Wealth Snapshot</h3>
        <span
          style={{
            ...styles.updated,
            color: isStale ? "var(--amber)" : undefined,
          }}
        >
          {isStale
            ? `⚠️ ${daysSinceUpdate}d ago`
            : `Updated ${new Date(data.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
        </span>
      </div>

      {!ulipDismissed && (
        <div style={styles.alertBanner}>
          <AlertTriangle size={14} color="var(--amber)" />
          <span style={styles.alertText}>
            ULIP started Oct 2022 — review lock-in status
          </span>
          <button
            style={styles.alertClose}
            onClick={() => setUlipDismissed(true)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div style={styles.metrics}>
        <Metric
          label="Net Worth"
          value={data.netWorth}
          prefix="₹"
          field="netWorth"
          editing={editing}
          setEditing={setEditing}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <Metric
          label="Monthly SIP"
          value={data.sip}
          prefix="₹"
          field="sip"
          editing={editing}
          setEditing={setEditing}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <Metric
          label="Savings Rate"
          value={data.savingsRate}
          suffix="%"
          field="savingsRate"
          editing={editing}
          setEditing={setEditing}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </div>

      {syncError && <div style={styles.syncError}>{syncError}</div>}

      {/* Actions */}
      <div style={styles.actions}>
        {user && !user.isOffline && db && (
          <button
            style={{ ...styles.syncBtn, opacity: syncing ? 0.6 : 1 }}
            onClick={handleSyncFromFirestore}
            disabled={syncing}
            title="Sync from WealthOS Firestore"
          >
            <RefreshCw
              size={13}
              style={{
                animation: syncing ? "spin 0.8s linear infinite" : "none",
              }}
            />
            {syncing ? "Syncing…" : "Sync"}
          </button>
        )}
        <a
          href={WEALTH_OS_URL}
          target="_blank"
          rel="noreferrer"
          style={styles.btn}
        >
          Open WealthOS <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  prefix,
  suffix,
  field,
  editing,
  setEditing,
  onBlur,
  onKeyDown,
}) {
  const isEditing = editing === field;
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const displayValue = `${prefix || ""}${Number(value).toLocaleString("en-IN")}${suffix || ""}`;

  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      {isEditing ? (
        <div style={styles.inputWrapper}>
          {prefix && <span style={styles.inputPrefix}>{prefix}</span>}
          <input
            ref={inputRef}
            defaultValue={value}
            onBlur={(e) => onBlur(e, field)}
            onKeyDown={(e) => onKeyDown(e, field)}
            style={styles.metricInput}
            type="number"
          />
          {suffix && <span style={styles.inputSuffix}>{suffix}</span>}
        </div>
      ) : (
        <span
          style={styles.metricValue}
          onClick={() => setEditing(field)}
          title="Click to edit"
        >
          {displayValue}
        </span>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    height: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text)",
  },
  updated: {
    fontSize: 10,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  alertBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--amber-dim)",
    border: "1px solid var(--amber-border)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
  },
  alertText: {
    fontSize: 12,
    color: "var(--amber)",
    fontWeight: 500,
    flex: 1,
  },
  alertClose: {
    background: "none",
    border: "none",
    color: "var(--amber)",
    opacity: 0.6,
    cursor: "pointer",
    display: "flex",
    padding: 2,
  },
  metrics: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1,
  },
  metric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--surface2)",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
  },
  metricLabel: {
    fontSize: 13,
    color: "var(--text2)",
    fontWeight: 500,
  },
  metricValue: {
    fontFamily: "var(--mono)",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--teal)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 4,
    transition: "background 0.2s",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  metricInput: {
    width: 100,
    background: "var(--surface3)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 8px",
    color: "var(--teal)",
    fontFamily: "var(--mono)",
    fontSize: 14,
    fontWeight: 600,
    outline: "none",
    textAlign: "right",
  },
  inputPrefix: {
    color: "var(--muted)",
    fontSize: 14,
    fontFamily: "var(--mono)",
  },
  inputSuffix: {
    color: "var(--muted)",
    fontSize: 14,
    fontFamily: "var(--mono)",
  },
  btn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "var(--teal)",
    color: "#0d0f12",
    fontWeight: 600,
    fontSize: 13,
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    textDecoration: "none",
    fontFamily: "var(--sans)",
    transition: "opacity 0.2s",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: "auto",
  },
  syncBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(45,212,191,0.08)",
    border: "1px solid var(--teal-border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    color: "var(--teal)",
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  syncError: {
    fontSize: 11,
    color: "var(--amber)",
    background: "var(--amber-dim)",
    border: "1px solid var(--amber-border)",
    borderRadius: 6,
    padding: "8px 10px",
  },
};
