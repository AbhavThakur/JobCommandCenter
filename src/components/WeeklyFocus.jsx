import React from "react";

const FOCUS_DAYS = [
  { day: "MON", id: 1, topic: "MF basics", color: "teal" },
  { day: "TUE", id: 2, topic: "AI tool", color: "purple" },
  { day: "WED", id: 3, topic: "Markets", color: "teal" },
  { day: "THU", id: 4, topic: "Mental model", color: "amber" },
  { day: "FRI", id: 5, topic: "AI + Finance", color: "purple" },
  { day: "SAT", id: 6, topic: "Long read", color: "amber" },
  { day: "SUN", id: 0, topic: "Review", color: "gray" }
];

export default function WeeklyFocus() {
  const today = new Date().getDay();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Weekly Topic Rotation</h3>
      <div style={styles.grid}>
        {FOCUS_DAYS.map((d) => {
          const isActive = d.id === today;
          
          let colorVar = `var(--${d.color})`;
          if (d.color === "gray") colorVar = "var(--text2)";

          return (
            <div 
              key={d.id} 
              style={{
                ...styles.dayBox,
                backgroundColor: isActive ? `var(--${d.color === 'gray' ? 'surface3' : d.color + '-dim'})` : "transparent",
                borderColor: isActive ? colorVar : "var(--border)"
              }}
            >
              <div style={{...styles.dayName, color: isActive ? colorVar : "var(--muted)"}}>
                {d.day}
              </div>
              <div 
                style={{
                  ...styles.dot, 
                  backgroundColor: d.color === "gray" && !isActive ? "var(--surface3)" : colorVar,
                  border: d.color === "gray" && !isActive ? "1px solid var(--border)" : "none"
                }} 
              />
              <div style={styles.topic}>{d.topic}</div>
            </div>
          );
        })}
      </div>
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
    gap: 16
  },
  title: {
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--muted)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
    gap: 8
  },
  dayBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 4px",
    borderRadius: "10px",
    border: "1px solid transparent",
    transition: "var(--transition)",
    textAlign: "center"
  },
  dayName: {
    fontFamily: "var(--sans)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "1px",
    marginBottom: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginBottom: 6
  },
  topic: {
    fontSize: 10,
    color: "var(--muted)",
    lineHeight: 1.3
  }
};
