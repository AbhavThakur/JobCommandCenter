import AILab from "../components/AILab";

export default function AILabPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>AI Lab</h2>
        <p style={styles.subtitle}>
          Paste technical articles to generate Senior Dev summaries powered by Gemini 2.0 Flash.
        </p>
      </div>
      
      <AILab defaultExpanded={true} />
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 800,
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
  }
};
