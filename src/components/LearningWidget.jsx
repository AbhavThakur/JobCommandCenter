import { useEffect, useMemo, useState } from "react";
import { BookOpen, Brain, ChevronRight } from "lucide-react";
import {
  subscribeLearningItems,
  subscribeFlashcards,
  isDue,
} from "../services/learningData";

export default function LearningWidget({ onOpen }) {
  const [items, setItems] = useState([]);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let a, b;
    try {
      a = subscribeLearningItems(setItems, () => {});
      b = subscribeFlashcards(setCards, () => {});
    } catch {
      /* not signed in */
    }
    return () => {
      a?.();
      b?.();
    };
  }, []);

  const active = useMemo(
    () => items.filter((i) => i.status === "active").slice(0, 3),
    [items],
  );
  const dueCount = useMemo(() => cards.filter(isDue).length, [cards]);

  return (
    <div className="card learning-widget">
      <div className="widget-head">
        <h3>
          <BookOpen size={16} /> Learning
        </h3>
        {onOpen && (
          <button className="btn-link" onClick={onOpen}>
            Open <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="widget-stats">
        <div className="stat">
          <div className="stat-num">{active.length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat">
          <div className="stat-num">{dueCount}</div>
          <div className="stat-label">
            <Brain size={12} /> Due
          </div>
        </div>
        <div className="stat">
          <div className="stat-num">{items.length}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {active.length > 0 ? (
        <ul className="widget-list">
          {active.map((i) => (
            <li key={i.id}>
              <span className="truncate">{i.title}</span>
              <span className="pct">{i.progress || 0}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Nothing active. Pick something to learn today.</p>
      )}
    </div>
  );
}
