/**
 * Growth OS — Weekly Learning Schedule
 *
 * WFH days: Monday, Friday
 * Office days: Tuesday, Wednesday, Thursday
 * Weekend: Saturday, Sunday
 *
 * Learning pillars:
 *   teal   → Investing (MFs, SIPs, Indian markets, Zerodha Varsity)
 *   purple → AI fluency (prompting, tools, building AI apps)
 *   amber  → Power skills (mental models, Farnam Street, Naval)
 *   rest   → No structured learning / reflection / family
 */

export const SCHEDULE = {
  0: {
    // Sunday
    label: "Sunday",
    isWFH: false,
    isWeekend: true,
    slots: [
      {
        id: "sun-1",
        time: "Anytime",
        label: "Weekly Review",
        detail: "3 things learned, 1 to apply next week — 15 min ONLY",
        pillar: "rest",
      },
      {
        id: "sun-2",
        time: "Anytime",
        label: "WealthOS Check (optional)",
        detail: "Log transactions, check net worth",
        url: "https://mywealthforge.vercel.app/",
        pillar: "teal",
      },
      {
        id: "sun-3",
        time: "Rest of day",
        label: "Family Time with Aanya",
        detail: "No structured learning. Recharge.",
        pillar: "rest",
      },
    ],
  },
  1: {
    // Monday — WFH
    label: "Monday",
    isWFH: true,
    isWeekend: false,
    slots: [
      {
        id: "mon-1",
        time: "8:45 AM",
        label: "Morning Bonus — 45 min",
        detail: "Read: Zerodha Varsity Module 1, one chapter",
        url: "https://varsity.zerodha.com/modules/",
        pillar: "teal",
      },
      {
        id: "mon-2",
        time: "1:00 PM",
        label: "Lunch Break — 30 min",
        detail: "Listen: Paisa Vaisa podcast episode",
        url: "https://open.spotify.com/show/4P2QGlsIfhHkYhXy2HnXZo",
        pillar: "teal",
      },
      {
        id: "mon-3",
        time: "4:00 PM",
        label: "Afternoon — 15 min",
        detail: "Review one investment or SIP in your portfolio",
        url: "https://mywealthforge.vercel.app/",
        pillar: "teal",
      },
      {
        id: "mon-4",
        time: "8:30 PM",
        label: "Night — 20 min",
        detail: "Optional: Rundown AI newsletter or Farnam Street",
        url: "https://www.therundown.ai/",
        pillar: "purple",
      },
    ],
  },
  2: {
    // Tuesday — Office
    label: "Tuesday",
    isWFH: false,
    isWeekend: false,
    slots: [
      {
        id: "tue-1",
        time: "8:15 AM",
        label: "Commute — 45 min",
        detail: "Podcast: Lenny's Podcast or Lex Fridman AI",
        url: "https://www.lennyspodcast.com/",
        pillar: "purple",
      },
      {
        id: "tue-2",
        time: "10:00 AM",
        label: "Office Break — 30 min",
        detail: "Hands-on: try one Claude/Gemini technique",
        url: "https://claude.ai/",
        pillar: "purple",
      },
      {
        id: "tue-3",
        time: "5:00 PM",
        label: "Evening Commute — 50 min",
        detail: "Podcast: Rundown AI or Huberman",
        url: "https://www.therundown.ai/",
        pillar: "purple",
      },
      {
        id: "tue-4",
        time: "8:30 PM",
        label: "Night — 20 min",
        detail: "Note one AI insight. How to use at work or WealthOS?",
        pillar: "rest",
      },
    ],
  },
  3: {
    // Wednesday — Office
    label: "Wednesday",
    isWFH: false,
    isWeekend: false,
    slots: [
      {
        id: "wed-1",
        time: "8:15 AM",
        label: "Commute — 45 min",
        detail: "Podcast: Paisa Vaisa on markets, Nifty vs Sensex",
        url: "https://open.spotify.com/show/4P2QGlsIfhHkYhXy2HnXZo",
        pillar: "teal",
      },
      {
        id: "wed-2",
        time: "10:00 AM",
        label: "Office Break — 30 min",
        detail: "Read: Moneycontrol or Zerodha Varsity Module 3",
        url: "https://varsity.zerodha.com/modules/",
        pillar: "teal",
      },
      {
        id: "wed-3",
        time: "5:00 PM",
        label: "Evening Commute — 50 min",
        detail: "Podcast: Freakonomics or Hidden Brain",
        url: "https://freakonomics.com/series/freakonomics-radio/",
        pillar: "amber",
      },
      {
        id: "wed-4",
        time: "8:30 PM",
        label: "Night — 20 min",
        detail: "Rest night. No structured learning. Check WealthOS if quick.",
        pillar: "rest",
      },
    ],
  },
  4: {
    // Thursday — Office
    label: "Thursday",
    isWFH: false,
    isWeekend: false,
    slots: [
      {
        id: "thu-1",
        time: "8:15 AM",
        label: "Commute — 45 min",
        detail: "Podcast: Farnam Street / Shane Parrish",
        url: "https://fs.blog/knowledge-podcast/",
        pillar: "amber",
      },
      {
        id: "thu-2",
        time: "10:00 AM",
        label: "Office Break — 30 min",
        detail: "Read: Farnam Street mental model article",
        url: "https://fs.blog/mental-models/",
        pillar: "amber",
      },
      {
        id: "thu-3",
        time: "5:00 PM",
        label: "Evening Commute — 50 min",
        detail: "Podcast: Naval Ravikant or Psychology of Money audiobook",
        url: "https://nav.al/",
        pillar: "amber",
      },
      {
        id: "thu-4",
        time: "8:30 PM",
        label: "Night — 20 min",
        detail:
          "Write: how today's mental model applies to investments or career",
        pillar: "rest",
      },
    ],
  },
  5: {
    // Friday — WFH
    label: "Friday",
    isWFH: true,
    isWeekend: false,
    slots: [
      {
        id: "fri-1",
        time: "8:45 AM",
        label: "Morning Bonus — 45 min",
        detail: "Use Claude/Gemini to research a fund you hold",
        url: "https://claude.ai/",
        pillar: "purple",
      },
      {
        id: "fri-2",
        time: "1:00 PM",
        label: "Lunch Break — 30 min",
        detail: "WealthOS review: monthly snapshot, one small feature",
        url: "https://mywealthforge.vercel.app/",
        pillar: "teal",
      },
      {
        id: "fri-3",
        time: "4:00 PM",
        label: "Afternoon — 15 min",
        detail: "Explore one new AI tool or API capability",
        url: "https://aistudio.google.com/",
        pillar: "purple",
      },
      {
        id: "fri-4",
        time: "8:30 PM",
        label: "Night — 30-40 min",
        detail: "End of week: 3 things learned, 1 to apply, update notes",
        pillar: "rest",
      },
    ],
  },
  6: {
    // Saturday
    label: "Saturday",
    isWFH: false,
    isWeekend: true,
    slots: [
      {
        id: "sat-1",
        time: "Morning",
        label: "Long Read/Listen — 45-60 min",
        detail: "Rotate: Freakonomics, Naval Ravikant, Morgan Housel",
        url: "https://nav.al/",
        pillar: "amber",
      },
      {
        id: "sat-2",
        time: "Afternoon",
        label: "Sport",
        detail: "Badminton / run / gym",
        pillar: "rest",
      },
      {
        id: "sat-3",
        time: "Evening",
        label: "Optional — 20 min",
        detail: "Browse Zerodha Varsity or Farnam Street",
        url: "https://varsity.zerodha.com/modules/",
        pillar: "rest",
      },
    ],
  },
};

/** Pillar metadata for UI rendering */
export const PILLARS = {
  teal: {
    label: "Investing",
    color: "var(--teal)",
    dim: "var(--teal-dim)",
    border: "var(--teal-border)",
    emoji: "📈",
  },
  purple: {
    label: "AI Fluency",
    color: "var(--purple)",
    dim: "var(--purple-dim)",
    border: "var(--purple-border)",
    emoji: "🤖",
  },
  amber: {
    label: "Power Skills",
    color: "var(--amber)",
    dim: "var(--amber-dim)",
    border: "var(--amber-border)",
    emoji: "🧠",
  },
  rest: {
    label: "Rest / Reflect",
    color: "var(--muted)",
    dim: "rgba(100, 116, 139, 0.08)",
    border: "rgba(100, 116, 139, 0.15)",
    emoji: "☕",
  },
};

/** Helper: get today's schedule */
export function getTodaySchedule() {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, ...
  return SCHEDULE[day];
}

/** Helper: get day name abbreviations for the selector */
export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
