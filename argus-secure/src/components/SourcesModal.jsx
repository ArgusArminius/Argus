import { useState } from "react";

const GOLD = "#C9A84C";
const CARD = "#131920";
const BORDER = "#1E2A38";
const TEXT = "#E8EDF2";
const MUTED = "#8A9BB0";
const DIM = "#3D5166";

const CATS = [
  { id: "cars",       label: "Automotive",  icon: "🚗" },
  { id: "realestate", label: "Real Estate", icon: "🏠" },
  { id: "travel",     label: "Travel",      icon: "✈️" },
  { id: "tech",       label: "Technology",  icon: "💻" },
  { id: "general",    label: "General",     icon: "📰" },
];

// Detect if a URL is an RSS feed
async function detectFeedType(url) {
  const normalised = url.startsWith("http") ? url : `https://${url}`;
  if (normalised.includes("/feed") || normalised.includes("/rss") || normalised.endsWith(".xml") || normalised.includes("rss.")) {
    return { type: "rss", url: normalised };
  }
  return { type: "webpage", url: normalised };
}

function SourceItem({ source, onRemove }) {
  const [hovered, setHovered] = useState(false);
  const cat = CATS.find(c => c.id === source.category) || CATS[4];
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        borderBottom: `1px solid ${BORDER}`,
        background: hovered ? "#1E2A38" : "transparent",
        transition: "background 0.15s",
      }}
    >
      {/* Favicon */}
      <div style={{ width: 28, height: 28, borderRadius: 6, background: BORDER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${source.display}&sz=32`}
          alt=""
          style={{ width: 16, height: 16 }}
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {source.display}
        </div>
        <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
          {cat.icon} {cat.label}
          {source.type === "rss" && <span style={{ marginLeft: 8, color: GOLD, fontSize: 9, fontWeight: 700 }}>RSS</span>}
        </div>
      </div>

      <a
        href={source.url.startsWith("http") ? source.url : `https://${source.url}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 10, color: DIM, textDecoration: "none" }}
        onMouseEnter={e => e.currentTarget.style.color = MUTED}
        onMouseLeave={e => e.currentTarget.style.color = DIM}
      >
        ↗
      </a>

      <button
        onClick={() => onRemove(source.id)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 16, color: DIM, padding: "2px 4px", lineHeight: 1,
          transition: "color 0.15s", flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#FC8181"}
        onMouseLeave={e => e.currentTarget.style.color = DIM}
        title="Remove source"
      >
        ×
      </button>
    </div>
  );
}

export default function SourcesModal({ sources, onAdd, onRemove, onClose }) {
  const [newUrl, setNewUrl] = useState("");
  const [newCat, setNewCat] = useState("general");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    const raw = newUrl.trim();
    if (!raw) { setError("Enter a URL or domain name."); return; }

    // Extract display name
    let display = raw;
    let feedUrl = raw;
    try {
      const u = raw.startsWith("http") ? new URL(raw) : new URL(`https://${raw}`);
      display = u.hostname.replace(/^www\./, "");
      feedUrl = u.toString();
    } catch { display = raw; feedUrl = raw; }

    if (sources.find(s => s.display === display)) { setError("Already added."); return; }

    setAdding(true);
    const { type, url: resolvedUrl } = await detectFeedType(feedUrl);

    const newSource = {
      id: Date.now().toString(),
      url: resolvedUrl,
      display,
      category: newCat,
      type,
      addedAt: new Date().toISOString(),
    };

    onAdd(newSource);
    setNewUrl("");
    setError("");
    setAdding(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          zIndex: 900, backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 560, maxHeight: "80vh",
        background: "#0C0F14",
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        zIndex: 901,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>My Intelligence Sources</h2>
            <p style={{ fontSize: 12, color: DIM, margin: "4px 0 0" }}>
              {sources.length === 0 ? "No custom sources yet" : `${sources.length} source${sources.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 18, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Add source form */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Add Source</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={newUrl}
              onChange={e => { setNewUrl(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="e.g. inman.com or https://skift.com/feed/"
              style={{
                flex: 1, padding: "9px 14px",
                background: CARD, border: `1.5px solid ${error ? "#FC8181" : BORDER}`,
                borderRadius: 8, fontSize: 13, color: TEXT,
                fontFamily: "inherit", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = GOLD; }}
              onBlur={e => { e.target.style.borderColor = error ? "#FC8181" : BORDER; }}
              autoFocus
            />
            <select
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              style={{
                padding: "9px 12px", background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 8, color: TEXT, fontSize: 12, cursor: "pointer",
                fontFamily: "inherit", outline: "none", flexShrink: 0,
              }}
            >
              {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <button
              onClick={handleAdd}
              disabled={adding}
              style={{
                padding: "9px 18px", background: adding ? BORDER : GOLD,
                border: "none", borderRadius: 8,
                color: adding ? MUTED : "#0C0F14",
                fontSize: 12, fontWeight: 700, cursor: adding ? "default" : "pointer",
                fontFamily: "inherit", flexShrink: 0, transition: "all 0.15s",
              }}
            >
              {adding ? "…" : "+ Add"}
            </button>
          </div>
          {error && <div style={{ fontSize: 11, color: "#FC8181" }}>{error}</div>}
          <div style={{ fontSize: 11, color: DIM }}>
            Paste a website URL, domain, or RSS feed link · Argus will include it in relevant searches
          </div>
        </div>

        {/* Sources list */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {sources.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
              <div style={{ fontSize: 13, color: MUTED }}>No sources added yet</div>
              <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>Add websites or RSS feeds to always include in your intelligence feed</div>
            </div>
          ) : (
            sources.map(source => (
              <SourceItem key={source.id} source={source} onRemove={onRemove} />
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: DIM }}>
            Sources are saved locally to your browser. They are included in every Argus search.
          </div>
        </div>
      </div>
    </>
  );
}
