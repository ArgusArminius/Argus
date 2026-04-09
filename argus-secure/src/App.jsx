import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import Navigation from "./components/Navigation.jsx";
import AlertsPanel from "./components/AlertsPanel.jsx";
import SearchResults from "./components/SearchResults.jsx";
import NewsFeed from "./components/NewsFeed.jsx";
import { getDemoMode, getDemoConfig } from "./utils/demoMode.js";
import { copyShareLink } from "./utils/export.js";

// Lazy-load heavy panels for performance
const AutomotivePanel   = lazy(() => import("./components/AutomotivePanel.jsx"));
const RealEstatePanel   = lazy(() => import("./components/RealEstatePanel.jsx"));
const SocialPulse       = lazy(() => import("./components/SocialPulse.jsx"));
const SourcesModal      = lazy(() => import("./components/SourcesModal.jsx"));

// ─── Design tokens ────────────────────────────────────────────
const BG     = "#0C0F14";
const CARD   = "#131920";
const BORDER = "#1E2A38";
const GOLD   = "#C9A84C";
const TEXT   = "#E8EDF2";
const MUTED  = "#8A9BB0";
const DIM    = "#3D5166";

// ─── EyeLogo ──────────────────────────────────────────────────
function EyeLogo({ size = 28, animate = false }) {
  return (
    <svg width={size} height={size * 0.58} viewBox="0 0 100 58" style={{ overflow: "visible" }}>
      {animate && (
        <circle cx="50" cy="29" r="28" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.15">
          <animate attributeName="r" values="24;38;24" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0;0.15" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      <path d="M3 29 Q50 -10 97 29 Q50 68 3 29Z" fill="none" stroke={GOLD} strokeWidth="3" />
      <circle cx="50" cy="29" r="14" fill={GOLD} />
      <circle cx="50" cy="29" r="6.5" fill={BG} />
      <circle cx="54" cy="25" r="2.8" fill={GOLD} />
    </svg>
  );
}

// ─── Panel fallback ───────────────────────────────────────────
function PanelLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 12 }}>
      <EyeLogo size={24} animate />
      <span style={{ fontSize: 13, color: MUTED }}>Loading panel…</span>
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, margin: 16 }}>
          <div style={{ fontSize: 13, color: "#FC8181", fontWeight: 600, marginBottom: 8 }}>Panel error</div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{this.state.error.message}</div>
          <button onClick={() => this.setState({ error: null })} style={{ padding: "6px 14px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Generic placeholder panels ───────────────────────────────
function GenericPanel({ vertical, title, icon }) {
  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      <div style={{ flex: 1 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            {icon} {title} Intelligence
          </div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
            Full {title} intelligence panel coming soon. Search above to get AI-powered insights for {title.toLowerCase()} market data.
          </div>
        </div>
        <NewsFeed vertical={vertical} />
      </div>
      <div style={{ width: 300, flexShrink: 0 }}>
        <NewsFeed vertical={vertical} />
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function ArgusApp() {
  // Read initial state from URL params (share links, demo mode)
  const urlParams = new URLSearchParams(window.location.search);
  const demoKey = getDemoMode();
  const demoConfig = getDemoConfig(demoKey);

  const [vertical, setVertical] = useState(
    demoConfig?.defaultVertical ||
    urlParams.get("vertical") ||
    "news"
  );
  const [searchQuery, setSearchQuery] = useState(urlParams.get("q") || "");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [customSources, setCustomSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem("argus_custom_sources") || "[]"); }
    catch { return []; }
  });
  const [shareToast, setShareToast] = useState(false);
  const searchRef = useRef(null);

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement !== searchRef.current && !showSources) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSources]);

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setActiveSearchQuery(searchQuery.trim());
  }

  function handleRelatedSearch(q) {
    setSearchQuery(q);
    setActiveSearchQuery(q);
  }

  function handleNavSelect(id) {
    if (id === "sources") { setShowSources(true); return; }
    if (id === "export") {
      const link = copyShareLink({ vertical, q: activeSearchQuery });
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
      return;
    }
    if (demoConfig?.lockedVertical) return;
    setVertical(id);
    setActiveSearchQuery("");
  }

  function saveCustomSources(list) {
    setCustomSources(list);
    try { localStorage.setItem("argus_custom_sources", JSON.stringify(list)); } catch {}
  }

  // Panel content
  function renderMainPanel() {
    if (activeSearchQuery) {
      return (
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <SearchResults
              query={activeSearchQuery}
              onRelatedSearch={handleRelatedSearch}
            />
          </div>
          <div style={{ width: 300, flexShrink: 0 }}>
            <NewsFeed vertical={vertical} />
          </div>
        </div>
      );
    }

    switch (vertical) {
      case "cars":
        return (
          <Suspense fallback={<PanelLoader />}>
            <AutomotivePanel demoConfig={demoConfig} />
          </Suspense>
        );
      case "realestate":
        return (
          <Suspense fallback={<PanelLoader />}>
            <RealEstatePanel />
          </Suspense>
        );
      case "social":
        return (
          <Suspense fallback={<PanelLoader />}>
            <SocialPulse />
          </Suspense>
        );
      case "news":
        return (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <NewsFeed vertical="news" />
            </div>
            <div style={{ width: 280, flexShrink: 0 }}>
              <NewsFeed vertical="tech" />
            </div>
          </div>
        );
      case "hotels":
        return <GenericPanel vertical="hotels" title="Hospitality" icon="🏨" />;
      case "flights":
        return <GenericPanel vertical="flights" title="Aviation" icon="✈️" />;
      case "shop":
        return <GenericPanel vertical="shop" title="E-Commerce" icon="🛍️" />;
      default:
        return <NewsFeed vertical={vertical} />;
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      color: TEXT,
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,button,a{font-family:inherit;}
        input:focus,select:focus{outline:none;}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#1E2A38;border-radius:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes skeleton{0%,100%{opacity:0.6}50%{opacity:0.3}}
        @keyframes panelIn{from{opacity:0}to{opacity:1}}
        .panel-fade{animation:panelIn 0.2s ease;}
        button:focus{outline:none;}
        ::selection{background:#C9A84C33;color:#E8EDF2;}
      `}</style>

      {/* ── Demo Banner ── */}
      {demoConfig && (
        <div style={{
          background: `${GOLD}18`,
          borderBottom: `1px solid ${GOLD}40`,
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>
            {demoConfig.headerTitle} — Demo Mode Active
          </span>
          {demoConfig.ctaText && (
            <a
              href={demoConfig.ctaLink}
              style={{
                padding: "5px 14px",
                background: GOLD,
                borderRadius: 20,
                color: "#0C0F14",
                fontSize: 11,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {demoConfig.ctaText}
            </a>
          )}
        </div>
      )}

      {/* ── Top header ── */}
      <header style={{
        height: 56,
        flexShrink: 0,
        background: "#080B0F",
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        zIndex: 100,
        position: "sticky",
        top: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <EyeLogo size={24} />
          <span style={{ fontSize: 17, fontWeight: 800, color: TEXT, letterSpacing: -0.5 }}>
            {demoConfig ? demoConfig.headerTitle : "Argus"}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", paddingLeft: 6, borderLeft: `1px solid ${BORDER}`, marginLeft: 2 }}>
            INTELLIGENCE
          </span>
        </div>

        {/* Search bar */}
        <div style={{
          flex: 1,
          maxWidth: 560,
          display: "flex",
          alignItems: "center",
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          overflow: "hidden",
          transition: "border-color 0.15s",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = GOLD}
          onBlurCapture={e => e.currentTarget.style.borderColor = BORDER}
        >
          <span style={{ padding: "0 12px", color: MUTED, fontSize: 13, flexShrink: 0 }}>◉</span>
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder='Search markets… (press "/" to focus)'
            style={{
              flex: 1, border: "none", background: "transparent",
              padding: "10px 0", fontSize: 13, color: TEXT, caretColor: GOLD,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setActiveSearchQuery(""); }}
              style={{ padding: "0 10px", background: "none", border: "none", color: DIM, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          )}
          <button
            onClick={handleSearch}
            style={{
              padding: "10px 18px",
              background: GOLD,
              border: "none",
              color: "#0C0F14",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s",
              letterSpacing: 0.3,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#D4B05C"}
            onMouseLeave={e => e.currentTarget.style.background = GOLD}
          >
            Search
          </button>
        </div>

        {/* Right actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {/* Share link button */}
          <button
            onClick={() => {
              copyShareLink({ vertical, q: activeSearchQuery });
              setShareToast(true);
              setTimeout(() => setShareToast(false), 2500);
            }}
            style={{ padding: "6px 12px", background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
            title="Copy share link"
          >
            ⎘ Share
          </button>

          {/* My Sources */}
          <button
            onClick={() => setShowSources(true)}
            style={{
              padding: "6px 12px",
              background: customSources.length > 0 ? `${GOLD}15` : "none",
              border: `1px solid ${customSources.length > 0 ? `${GOLD}40` : BORDER}`,
              borderRadius: 8,
              color: customSources.length > 0 ? GOLD : MUTED,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🔗 Sources {customSources.length > 0 && `(${customSources.length})`}
          </button>

          {/* Alert badge */}
          {alertCount > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "#E53E3E",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "white",
              }}>
                {alertCount}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left sidebar navigation */}
        <Navigation
          selectedVertical={vertical}
          onSelect={handleNavSelect}
          alertCount={alertCount}
        />

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: "20px 24px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}>
          {/* Breadcrumb / context bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: DIM }}>
              {activeSearchQuery
                ? `Search results: "${activeSearchQuery}"`
                : `${vertical.charAt(0).toUpperCase() + vertical.slice(1)} Intelligence`
              }
            </span>
            {activeSearchQuery && (
              <button
                onClick={() => setActiveSearchQuery("")}
                style={{ fontSize: 10, color: DIM, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                ← Back
              </button>
            )}

            {/* Demo insight chips */}
            {demoConfig?.brandedInsights && !activeSearchQuery && (
              <div style={{ display: "flex", gap: 6, marginLeft: 8, flexWrap: "wrap" }}>
                {demoConfig.brandedInsights.map((insight, i) => (
                  <button
                    key={i}
                    onClick={() => { setSearchQuery(insight.query); setActiveSearchQuery(insight.query); }}
                    style={{
                      padding: "3px 12px", background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
                      borderRadius: 20, color: GOLD, fontSize: 10, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {insight.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panel content */}
          <div className="panel-fade" style={{ flex: 1 }}>
            <ErrorBoundary>
              {renderMainPanel()}
            </ErrorBoundary>
          </div>
        </main>

        {/* Right panel: Alerts */}
        <aside style={{
          width: 300,
          flexShrink: 0,
          background: "#080B0F",
          borderLeft: `1px solid ${BORDER}`,
          padding: "20px 16px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          <AlertsPanel
            onSearch={(q) => { setSearchQuery(q); setActiveSearchQuery(q); }}
            onAlertCountChange={setAlertCount}
          />
        </aside>
      </div>

      {/* ── Sources Modal ── */}
      {showSources && (
        <Suspense fallback={null}>
          <SourcesModal
            sources={customSources}
            onAdd={(source) => saveCustomSources([...customSources, source])}
            onRemove={(id) => saveCustomSources(customSources.filter(s => s.id !== id))}
            onClose={() => setShowSources(false)}
          />
        </Suspense>
      )}

      {/* ── Share toast ── */}
      {shareToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: CARD, border: `1px solid ${GOLD}`, borderRadius: 8,
          padding: "10px 20px", fontSize: 13, color: GOLD, fontWeight: 600,
          zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "fadeIn 0.2s ease",
        }}>
          ✓ Share link copied to clipboard
        </div>
      )}
    </div>
  );
}
