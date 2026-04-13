import WealthCard from "../components/WealthCard";

export default function WealthPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Wealth</h2>
        <p style={styles.subtitle}>
          WealthOS is your full finance app. This is just your snapshot.
        </p>
      </div>
      <div style={styles.content}>
        <WealthCard />
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 600,
    margin: "0 auto",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 24,
    fontWeight: 800,
    color: "var(--text)",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "var(--muted)",
  },
  content: {
    /* Set a reasonable fixed height so the card looks good full page */
    height: 400
  }
};
