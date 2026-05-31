import { useEffect, useMemo, useState } from "react";
import { ListChecks, ChevronRight } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  subscribeHabits,
  fetchAllRecentCheckins,
  todayKey,
} from "../services/habitsData";
import {
  subscribeLearningItems,
  subscribeFlashcards,
  isDue,
} from "../services/learningData";
import { SCHEDULE } from "../data/schedule";

/**
 * "Today's top 3" — surfaces the next single action from each pillar.
 * Ranked priority: schedule slot due now, due flashcards, habit not done,
 * learning item in progress, then anything else.
 */
export default function TodayTop3({ setPage }) {
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [learning, setLearning] = useState([]);
  const [cards, setCards] = useState([]);
  const [completions] = useLocalStorage("growthOS_schedule_v2", {});

  useEffect(() => {
    const subs = [];
    try {
      subs.push(subscribeHabits(setHabits, () => {}));
      subs.push(subscribeLearningItems(setLearning, () => {}));
      subs.push(subscribeFlashcards(setCards, () => {}));
    } catch {
      /* not signed in */
    }
    return () => subs.forEach((u) => u?.());
  }, []);

  useEffect(() => {
    if (!habits.length) return;
    fetchAllRecentCheckins(7)
      .then(setCheckins)
      .catch(() => {});
  }, [habits.length]);

  const items = useMemo(() => {
    const today = todayKey();
    const dateKey = today;
    const out = [];

    // 1. Next pending schedule slot for today
    const weekday = new Date().getDay();
    const day = SCHEDULE[weekday];
    if (day?.slots) {
      const next = day.slots.find(
        (s) => (completions[`${dateKey}:${s.id}`] || "pending") === "pending",
      );
      if (next) {
        out.push({
          pillar: "Schedule",
          text: `${next.time || ""} ${next.label}`.trim(),
          action: "Open schedule",
          onAction: () => setPage?.("home"),
        });
      }
    }

    // 2. Habits not done today
    const habitNotDone = habits.find((h) => {
      const list = checkins[h.id] || [];
      return !((list.find((c) => c.date === today)?.value || 0) > 0);
    });
    if (habitNotDone) {
      out.push({
        pillar: "Habit",
        text: `${habitNotDone.emoji} ${habitNotDone.name}`,
        action: "Check in",
        onAction: () => setPage?.("habits"),
      });
    }

    // 3. Flashcards due
    const due = cards.filter(isDue).length;
    if (due > 0) {
      out.push({
        pillar: "Review",
        text: `${due} flashcard${due !== 1 ? "s" : ""} due`,
        action: "Review",
        onAction: () => setPage?.("learning"),
      });
    }

    // 4. Active learning item
    const active = learning.find((i) => i.status === "active");
    if (active && out.length < 3) {
      out.push({
        pillar: "Learning",
        text: active.title,
        action: "Continue",
        onAction: () => setPage?.("learning"),
      });
    }

    return out.slice(0, 3);
  }, [completions, habits, checkins, cards, learning, setPage]);

  if (items.length === 0) return null;

  return (
    <div className="card today-card">
      <h3 className="today-title">
        <ListChecks size={16} /> Today&apos;s focus
      </h3>
      <ul className="today-list">
        {items.map((it, idx) => (
          <li key={idx}>
            <div>
              <span className="today-pillar">{it.pillar}</span>
              <span className="today-text">{it.text}</span>
            </div>
            <button className="btn-link" onClick={it.onAction}>
              {it.action} <ChevronRight size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
