import { useState } from "react";

const NAV_ITEMS = [
  { id: "news",       label: "News",        icon: "📰" },
  { id: "cars",       label: "Automotive",  icon: "🚗" },
  { id: "realestate", label: "Real Estate", icon: "🏠" },
  { id: "hotels",     label: "Hotels",      icon: "🏨" },
  { id: "flights",    label: "Flights",     icon: "✈️" },
  { id: "shop",       label: "Shop",        icon: "🛍️" },
  { id: "social",     label: "Social Pulse",icon: "📡" },
];

const styles = {
  nav: {
    width: 220,
    flexShrink: 0,
    background: "#0C0F14",
    borderRight: "1px solid #1E2A38",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
    paddingTop: 8,
  },
  section: {
    padding: "0 12px",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#3D5166",
    textTransform: "uppercase",
    padding: "16px 8px 8px",
  },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    cursor: "pointer",
    background: active ? "#131920" : "transparent",
    border: active ? "1px solid #1E2A38" : "1px solid transparent",
    marginBottom: 2,
    transition: "all 0.15s",
    textDecoration: "none",
  }),
  navIcon: {
    fontSize: 15,
    width: 20,
    textAlign: "center",
    flexShrink: 0,
  },
  navLabel: (active) => ({
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? "#E8EDF2" : "#8A9BB0",
    letterSpacing: 0.1,
  }),
  alertBadge: {
    marginLeft: "auto",
    background: "#E53E3E",
    color: "white",
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 10,
    padding: "1px 6px",
    minWidth: 18,
    textAlign: "center",
  },
  divider: {
    height: 1,
    background: "#1E2A38",
    margin: "8px 12px",
  },
  footer: {
    marginTop: "auto",
    padding: "12px 12px 16px",
    borderTop: "1px solid #1E2A38",
  },
  footerText: {
    fontSize: 10,
    color: "#3D5166",
    textAlign: "center",
  },
};

export default function Navigation({ selectedVertical, onSelect, alertCount = 0 }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <nav style={styles.nav}>
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Intelligence</div>
        {NAV_ITEMS.map(item => {
          const active = selectedVertical === item.id;
          const hovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              style={{
                ...styles.navItem(active),
                background: active ? "#131920" : hovered ? "rgba(19,25,32,0.5)" : "transparent",
              }}
              onClick={() => onSelect(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel(active)}>{item.label}</span>
              {item.id === "news" && alertCount > 0 && (
                <span style={styles.alertBadge}>{alertCount}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.sectionLabel}>My Workspace</div>
        <div
          style={{
            ...styles.navItem(false),
            background: hoveredId === "sources" ? "rgba(19,25,32,0.5)" : "transparent",
          }}
          onMouseEnter={() => setHoveredId("sources")}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onSelect("sources")}
        >
          <span style={styles.navIcon}>🔗</span>
          <span style={styles.navLabel(false)}>My Sources</span>
        </div>
        <div
          style={{
            ...styles.navItem(false),
            background: hoveredId === "export" ? "rgba(19,25,32,0.5)" : "transparent",
          }}
          onMouseEnter={() => setHoveredId("export")}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onSelect("export")}
        >
          <span style={styles.navIcon}>📤</span>
          <span style={styles.navLabel(false)}>Export</span>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerText}>ARGUS v2.0 · April 2026</div>
      </div>
    </nav>
  );
}
