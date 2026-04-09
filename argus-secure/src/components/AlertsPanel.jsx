import { useState, useEffect, useRef, useCallback } from "react";
import { callArgusAI } from "../utils/api.js";

const GOLD = "#C9A84C";
const CARD = "#131920";
const BORDER = "#1E2A38";
const TEXT = "#E8EDF2";
const MUTED = "#8A9BB0";
const DIM = "#3D5166";

const SEVERITY_STYLES = {
  high:   { borderColor: "#FC8181", bg: "#FC818112", badge: "#FC8181", label: "HIGH" },
  medium: { borderColor: GOLD,      bg: `${GOLD}12`, badge: GOLD,      label: "MED"  },
  low:    { borderColor: "#2D3748", bg: "#1E2A38",   badge: MUTED,     label: "LOW"  },
};

const FALLBACK_ALERTS = [
  {
    id: "a1",
    severity: "high",
    sector: "Automotive",
    headline: "EV price war intensifies: BYD cuts Seagull below $10K",
    detail: "BYD's aggressive pricing is forcing European and US OEMs to accelerate their own cost-reduction programs.",
    action: "Watch Tesla, VW and Stellantis response in next 72h",
    read: false,
  },
  {
    id: "a2",
    severity: "high",
    sector: "Real Estate",
    headline: "Dubai residential prices hit all-time high — 23% YoY",
    detail: "Q1 2026 transaction volume surpassed AED 100B for the first time, driven by Golden Visa demand.",
    action: "Monitor cash buyer ratios and mortgage approval rates",
    read: false,
  },
  {
    id: "a3",
    severity: "medium",
    sector: "Travel",
    headline: "China outbound tourism surges 40% — capacity crunch emerging",
    detail: "Seat availability to Japan, Thailand and UAE is tightening fast; hotel rates up 18% vs pre-COVID.",
    action: "Track seat load factors on Asia-Pacific routes",
    read: false,
  },
  {
    id: "a4",
    severity: "medium",
    sector: "Automotive",
    headline: "EU EV tariffs create opening for Korean brands in China's gap",
    detail: "Hyundai and Kia are positioning aggressively in the European mid-market as Chinese brands face headwinds.",
    action: "Monitor Hyundai Ioniq 6 and Kia EV6 registrations in DE, FR, UK",
    read: false,
  },
  {
    id: "a5",
    severity: "low",
    sector: "Real Estate",
    headline: "German residential prices stabilise after 18-month correction",
    detail: "Frankfurt and Munich show first positive MoM readings since Q3 2023 as rate expectations shift.",
    action: "Watch Q2 transaction volumes for confirmation of trend reversal",
    read: false,
  },
];

const ALERT_SYSTEM_PROMPT = `You are Argus market intelligence. Generate 5 current market alerts for a professional investor/analyst covering automotive, real estate, or travel sectors. Return ONLY a JSON array with exactly 5 items: [{"id":"a1","severity":"high|medium|low","sector":"Automotive|Real Estate|Travel","headline":"concise headline under 80 chars","detail":"1 sentence of specific detail","action":"1 sentence on what to watch"}]. No markdown, no explanation.`;

export default function AlertsPanel({ onSearch, onAlertCountChange }) {
  const [alerts, setAlerts] = useState(FALLBACK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const unreadCount = alerts.filter(a => !a.read).length;

  useEffect(() => {
    onAlertCountChange?.(unreadCount);
  }, [unreadCount]);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const result = await callArgusAI(
        "Generate 5 market alerts for today. Focus on latest developments in automotive, real estate, and travel sectors.",
        ALERT_SYSTEM_PROMPT,
        800
      );
      if (Array.isArray(result) && result.length >= 3) {
        if (mountedRef.current) {
          setAlerts(result.map(a => ({ ...a, read: false })));
          setLastRefresh(new Date());
        }
      }
    } catch {
      // Keep fallback alerts
    }
    if (mountedRef.current) setLoading(false);
  }

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 minutes
    timerRef.current = setInterval(fetchAlerts, 30 * 60 * 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, []);

  function markRead(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }

  const timeLabel = lastRefresh
    ? `Updated ${Math.round((Date.now() - lastRefresh) / 60000)}m ago`
    : "Updating…";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "0 0 12px", borderBottom: `1px solid ${BORDER}`, marginBottom: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Intelligence Alerts</span>
            {unreadCount > 0 && (
              <span style={{ background: "#E53E3E", color: "white", fontSize: 9, fontWeight: 700, borderRadius: 10, padding: "1px 7px" }}>
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            style={{ fontSize: 10, color: MUTED, background: "none", border: "none", cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {loading ? "…" : "↻"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: DIM }}>
            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: loading ? GOLD : "#48BB78", marginRight: 5, verticalAlign: "middle" }} />
            {loading ? "Fetching…" : timeLabel}
          </span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 10, color: DIM, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Alerts list */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10 }}>

        {loading && alerts.length === 0 && Array(5).fill(0).map((_, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
            {[60, 90, 75].map((w, j) => (
              <div key={j} style={{ height: 10, background: BORDER, borderRadius: 3, marginBottom: 6, width: `${w}%`, animation: "skeleton 1.5s infinite" }} />
            ))}
          </div>
        ))}

        {alerts.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
          return (
            <div
              key={alert.id}
              style={{
                background: alert.read ? CARD : style.bg,
                border: `1px solid ${alert.read ? BORDER : style.borderColor}`,
                borderLeft: `3px solid ${style.borderColor}`,
                borderRadius: 8,
                padding: 14,
                opacity: alert.read ? 0.65 : 1,
                transition: "all 0.2s",
              }}
              onClick={() => markRead(alert.id)}
            >
              {/* Badge row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 7px",
                  borderRadius: 10, letterSpacing: 0.8,
                  background: `${style.badge}20`,
                  border: `1px solid ${style.badge}40`,
                  color: style.badge,
                }}>
                  {style.label}
                </span>
                <span style={{ fontSize: 9, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {alert.sector}
                </span>
                {!alert.read && (
                  <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: style.badge, flexShrink: 0 }} />
                )}
              </div>

              {/* Headline */}
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.4, marginBottom: 8 }}>
                {alert.headline}
              </div>

              {/* Detail */}
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.55, marginBottom: 10 }}>
                {alert.detail}
              </div>

              {/* Action + Dig deeper */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 10, color: DIM, lineHeight: 1.45, flex: 1 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>Watch: </span>{alert.action}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead(alert.id);
                    onSearch?.(`${alert.sector}: ${alert.headline}`);
                  }}
                  style={{
                    flexShrink: 0,
                    padding: "4px 10px",
                    background: "none",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 20,
                    color: GOLD,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = `${GOLD}10`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "none"; }}
                >
                  Dig deeper →
                </button>
              </div>
            </div>
          );
        })}

        {!loading && alerts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 13, color: MUTED }}>No alerts</div>
            <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>Argus is monitoring the market</div>
          </div>
        )}
      </div>
      <style>{`@keyframes skeleton{0%{opacity:0.6}50%{opacity:0.3}100%{opacity:0.6}}`}</style>
    </div>
  );
}
