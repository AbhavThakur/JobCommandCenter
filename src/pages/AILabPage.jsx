import { useEffect, useRef, useState } from "react";
import { Send, Briefcase, BookOpen, Activity, Sparkles } from "lucide-react";
import AILab from "../components/AILab";
import { sendChat } from "../services/userProfile";

const STARTERS = [
  "Which job in my pipeline should I focus on this week and why?",
  "What's the next thing I should learn given my goals?",
  "Review my habits and tell me what to improve.",
  "Give me a 30-minute plan to make progress today.",
];

export default function AILabPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [include, setInclude] = useState({
    jobs: true,
    learning: true,
    habits: true,
  });
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await sendChat({ messages: next, chatId, include });
      if (res.chatId) setChatId(res.chatId);
      setMessages([...next, { role: "assistant", content: res.reply || "" }]);
    } catch (e) {
      setError(e.message || "Chat failed");
      setMessages(next.slice(0, -1));
      setInput(content);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (k) => setInclude((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="ailab-page">
      <div className="ailab-head">
        <h2>
          <Sparkles size={18} /> AI Lab — Growth Coach
        </h2>
        <p className="muted">
          Chat with your personal Growth OS coach. It reads your pipeline,
          library, and habits to give you concrete next steps.
        </p>
      </div>

      <div className="chat-shell card">
        <div className="chat-tools row">
          <button
            className={`chip ${include.jobs ? "chip-on" : ""}`}
            onClick={() => toggle("jobs")}
            type="button"
          >
            <Briefcase size={12} /> Jobs
          </button>
          <button
            className={`chip ${include.learning ? "chip-on" : ""}`}
            onClick={() => toggle("learning")}
            type="button"
          >
            <BookOpen size={12} /> Learning
          </button>
          <button
            className={`chip ${include.habits ? "chip-on" : ""}`}
            onClick={() => toggle("habits")}
            type="button"
          >
            <Activity size={12} /> Habits
          </button>
        </div>

        <div className="chat-body">
          {messages.length === 0 && (
            <div className="chat-starters">
              <div className="muted small">Try a starter:</div>
              {STARTERS.map((s) => (
                <button key={s} className="starter" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg msg-${m.role}`}>
              <div className="msg-bubble">{m.content}</div>
            </div>
          ))}
          {busy && (
            <div className="msg msg-assistant">
              <div className="msg-bubble">
                <em>thinking…</em>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <div className="chat-err">{error}</div>}

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            disabled={busy}
          />
          <button
            type="submit"
            className="btn btn-accent"
            disabled={busy || !input.trim()}
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      <div className="ailab-sub">
        <h3 className="muted small">Article summarizer</h3>
        <AILab defaultExpanded={false} />
      </div>
    </div>
  );
}
