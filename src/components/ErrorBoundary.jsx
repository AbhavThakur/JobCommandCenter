import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Growth OS component error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={styles.center}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>{this.state.error.message}</p>
            <button
              style={styles.btn}
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "var(--bg)",
  },
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "40px 32px",
    maxWidth: 400,
    width: "100%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "var(--shadow-lg)",
  },
  icon: { fontSize: 36 },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text)",
  },
  message: {
    fontSize: 13,
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    background: "var(--surface2)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    textAlign: "left",
    wordBreak: "break-word",
  },
  btn: {
    background: "var(--teal)",
    color: "#0d0f12",
    border: "none",
    padding: "10px",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
};
