import { ExternalLink } from "lucide-react";

const RESOURCES = [
  { tag: "Investing · Free", title: "Zerodha Varsity", desc: "Best free course for Indian investors. Start Module 1, go deep.", type: "teal", url: "https://varsity.zerodha.com" },
  { tag: "Investing · Book", title: "Psychology of Money", desc: "Morgan Housel. Why smart people make bad financial decisions.", type: "teal", url: "#" },
  { tag: "Podcast · Commute", title: "Paisa Vaisa", desc: "English personal finance podcast built for Indians.", type: "teal", url: "https://open.spotify.com/show/4P2QGlsIfhHkYhXy2HnXZo" },
  { tag: "AI · Free", title: "Claude Prompt Guide", desc: "docs.anthropic.com — official prompting techniques. Hands-on.", type: "purple", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview" },
  { tag: "Podcast · Commute", title: "Lenny's Podcast", desc: "Product + AI + growth. Perfect for senior developer context.", type: "purple", url: "https://www.lennyspodcast.com/" },
  { tag: "Newsletter", title: "The Rundown AI", desc: "5 min daily AI news digest. Read over morning chai.", type: "purple", url: "https://www.therundown.ai/" },
  { tag: "Mental Models", title: "Farnam Street", desc: "fs.blog — best writing on thinking, decisions, learning.", type: "amber", url: "https://fs.blog/" },
  { tag: "Podcast · Commute", title: "Naval Ravikant", desc: "Wealth, happiness, leverage. Short episodes, dense insight.", type: "amber", url: "https://nav.al/" },
  { tag: "Tracking", title: "WealthOS (yours!)", desc: "Update monthly. Build features as you learn more finance.", type: "teal", url: "https://mywealthforge.vercel.app/" }
];

export default function LearningToolkit() {
  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>Your Learning Toolkit</h3>
      <div style={styles.grid}>
        {RESOURCES.map((res, i) => (
          <a key={i} href={res.url !== "#" ? res.url : undefined} target="_blank" rel="noreferrer" style={styles.card}>
            <div style={{...styles.tag, color: `var(--${res.type})`}}>{res.tag}</div>
            <div style={styles.titleRow}>
              <div style={styles.title}>{res.title}</div>
              {res.url !== "#" && <ExternalLink size={14} color="var(--muted)" />}
            </div>
            <div style={styles.desc}>{res.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: 12,
    marginBottom: 20
  },
  sectionTitle: {
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 16
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16
  },
  card: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    textDecoration: "none",
    transition: "all 0.2s"
  },
  tag: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--sans)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 4
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text)"
  },
  desc: {
    fontSize: 12,
    color: "var(--text2)",
    lineHeight: 1.5,
    marginTop: 4
  }
};
