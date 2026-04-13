import { useState } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { Sparkles, Save, Loader2, AlertCircle } from "lucide-react";

/** Get ISO week string for a given date (YYYY-Www) */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export default function AILab({ defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Hook to grab the current weekly log so we can save summaries into it
  const currentWeek = getISOWeek(new Date());
  const [, setWeeklyLog] = useLocalStorage(`growthOS_weeklyLog_${currentWeek}`, { aiResearch: [] });

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const apiKey = import.meta.env.VITE_GEMINI_KEY;
    const prompt = `You are a senior developer and investor. Analyze this article and return exactly 3 sections.
1. Investment Thesis: the core financial opportunity or risk
2. Technical Risk: engineering or product risks for tech companies involved
3. Career Impact: how this affects React Native / mobile developers like me
Be concise. Max 2 sentences per section. Use the exact section headers.

Article content:
${input}`;

    try {
      if (!apiKey) {
        // Mock mode
        await new Promise(r => setTimeout(r, 1500));
        setResult([
          { title: "Investment Thesis", content: "The market is shifting towards AI-native SaaS, threatening incumbent CRM players. Early-stage investments in edge-AI hardware show 3x potential growth in 24 months." },
          { title: "Technical Risk", content: "High dependency on specific LLM providers creates severe vendor lock-in. Open-source models require significant internal infrastructure to match proprietary speeds." },
          { title: "Career Impact", content: "React Native devs must integrate on-device ML models via native modules. Understanding vector databases and AI prompt engineering will become standard frontend requirements." }
        ]);
        setLoading(false);
        return;
      }

      // Real Gemini API call
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!res.ok) throw new Error("API request failed");
      
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      
      // Parse the 3 sections from markdown
      const sections = [];
      const blocks = text.split(/(?:1\.\s*Investment Thesis|2\.\s*Technical Risk|3\.\s*Career Impact):?/i).filter(b => b.trim());
      
      if (blocks.length >= 3) {
        sections.push({ title: "Investment Thesis", content: blocks[0].trim().replace(/^\**|\**$/g, '') });
        sections.push({ title: "Technical Risk", content: blocks[1].trim().replace(/^\**|\**$/g, '') });
        sections.push({ title: "Career Impact", content: blocks[2].trim().replace(/^\**|\**$/g, '') });
      } else {
        // Fallback if formatting was weird
        sections.push({ title: "Summary", content: text });
      }
      
      setResult(sections);
    } catch (err) {
      setError("Analysis failed. Provide VITE_GEMINI_KEY in .env to enable real API calls. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLog = () => {
    if (!result) return;
    const summaryText = result.map(s => `${s.title}: ${s.content}`).join("\n");
    setWeeklyLog(prev => ({
      ...prev,
      aiResearch: [...(prev.aiResearch || []), summaryText]
    }));
    alert("Saved to this week's log!");
  };

  if (!expanded) {
    return (
      <div 
        style={{...styles.card, cursor: "pointer"}} 
        onClick={() => setExpanded(true)}
      >
        <div style={styles.collapsedContent}>
          <Sparkles color="var(--purple)" size={20} />
          <h3 style={styles.title}>AI Lab Summarizer</h3>
          <span style={styles.expandHint}>Click to expand</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <Sparkles color="var(--purple)" size={20} />
          <h3 style={styles.title}>AI Lab</h3>
        </div>
        {!defaultExpanded && (
          <button style={styles.closeBtn} onClick={() => setExpanded(false)}>Collapse</button>
        )}
      </div>

      <div style={styles.body}>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a market article or tech news here..."
        />
        
        <button 
          style={styles.actionBtn} 
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          Analyse with Gemini
        </button>

        {error && (
          <div style={styles.error}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {result && (
          <div style={styles.results}>
            {result.map((section, idx) => (
              <div key={idx} style={styles.resultCard}>
                <h4 style={styles.resultCardTitle}>
                  {idx === 0 && "📈 "}
                  {idx === 1 && "⚠️ "}
                  {idx === 2 && "🎯 "}
                  {section.title}
                </h4>
                <p style={styles.resultCardText}>{section.content}</p>
              </div>
            ))}
            
            <button style={styles.saveBtn} onClick={handleSaveToLog}>
              <Save size={14} />
              Save to weekly log
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), var(--surface-solid))",
    border: "1px solid var(--purple-border)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    width: "100%",
    transition: "all 0.3s"
  },
  collapsedContent: {
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  header: {
    padding: "20px 24px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border)"
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text)",
  },
  expandHint: {
    marginLeft: "auto",
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 500
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  },
  body: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  textarea: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "16px",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    minHeight: 120,
    resize: "vertical",
    outline: "none"
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "var(--purple)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-sm)",
    padding: "14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start"
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "var(--red)",
    background: "var(--red-dim)",
    padding: "12px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 12
  },
  resultCard: {
    background: "var(--surface2)",
    padding: "16px",
    borderRadius: "var(--radius-sm)",
    borderLeft: "3px solid var(--purple)"
  },
  resultCardTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    color: "var(--text)"
  },
  resultCardText: {
    fontSize: 13,
    color: "var(--text2)",
    lineHeight: 1.5
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid var(--purple-border)",
    color: "var(--purple)",
    borderRadius: "var(--radius-sm)",
    padding: "10px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
    marginTop: 8
  }
};
