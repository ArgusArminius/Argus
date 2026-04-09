import { useState, useEffect, useRef } from "react";
import { callArgusAI } from "../utils/api.js";

const SYSTEM_PROMPT = `You are Argus, a market intelligence agent. When given a search query, return structured JSON with:
- summary: string (2 sentences, concise market insight)
- key_signals: array of exactly 5 strings (bullet point insights)
- related_searches: array of exactly 4 strings (related queries)
- market_sentiment: "bullish" | "neutral" | "bearish"
- confidence: number 0-100
Return ONLY valid JSON, no markdown.`;

const SENTIMENT_COLORS = {
  bullish: "#48BB78",
  neutral: "#C9A84C",
  bearish: "#FC8181",
};

const SENTIMENT_ICONS = {
  bullish: "↑",
  neutral: "→",
  bearish: "↓",
};

function EyeLogo({ size = 24, animate = false }) {
  return (
    <svg width={size} height={size * 0.58} viewBox="0 0 100 58" style={{ overflow: "visible" }}>
      {animate && (
        <circle cx="50" cy="29" r="28" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.2">
          <animate attributeName="r" values="24;42;24" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <path d="M3 29 Q50 -10 97 29 Q50 68 3 29Z" fill="none" stroke="#C9A84C" strokeWidth="3" />
      <circle cx="50" cy="29" r="14" fill="#C9A84C" />
      <circle cx="50" cy="29" r="6.5" fill="#0C0F14" />
      <circle cx="54" cy="25" r="2.8" fill="#C9A84C" />
    </svg>
  );
}

function SkeletonPulse({ width = "100%", height = 16, style = {} }) {
  return (
    <div style={{
      width, height,
      background: "linear-gradient(90deg, #1E2A38 25%, #253342 50%, #1E2A38 75%)",
      backgroundSize: "200% 100%",
      borderRadius: 4,
      animation: "argus-skeleton 1.5s infinite",
      ...style,
    }} />
  );
}

export default function SearchResults({ query, onRelatedSearch }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastQuery = useRef(null);

  useEffect(() => {
    if (!query || query === lastQuery.current) return;
    lastQuery.current = query;
    fetchResults(query);
  }, [query]);

  async function fetchResults(q) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await callArgusAI(q, SYSTEM_PROMPT, 1000);
      if (data?.raw) {
        setError("AI response could not be parsed — API key may not be configured.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || "Failed to get AI analysis");
    }
    setLoading(false);
  }

  if (!query) return null;

  const sentiment = result?.market_sentiment || "neutral";
  const sentimentColor = SENTIMENT_COLORS[sentiment];

  return (
    <div style={{ padding: "0 0 24px" }}>
      <style>{`
        @keyframes argus-skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes argus-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Loading state */}
      {loading && (
        <div style={{ animation: "argus-fadein 0.3s ease" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "20px 0", marginBottom: 20,
          }}>
            <EyeLogo size={28} animate={true} />
            <div>
              <div style={{ fontSize: 13, color: "#C9A84C", fontWeight: 600 }}>Argus is analysing…</div>
              <div style={{ fontSize: 11, color: "#8A9BB0", marginTop: 2 }}>"{query}"</div>
            </div>
          </div>
          <div style={{ background: "#131920", border: "1px solid #1E2A38", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <SkeletonPulse height={14} width="60%" style={{ marginBottom: 12 }} />
            <SkeletonPulse height={12} width="95%" style={{ marginBottom: 8 }} />
            <SkeletonPulse height={12} width="80%" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ background: "#131920", border: "1px solid #1E2A38", borderRadius: 8, padding: 14 }}>
                <SkeletonPulse height={10} width="40%" style={{ marginBottom: 10 }} />
                <SkeletonPulse height={12} width="90%" style={{ marginBottom: 6 }} />
                <SkeletonPulse height={12} width="70%" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          background: "#131920", border: "1px solid #2D3748",
          borderRadius: 12, padding: 20, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12,
          animation: "argus-fadein 0.3s ease",
        }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, color: "#FC8181", fontWeight: 600 }}>Analysis unavailable</div>
            <div style={{ fontSize: 12, color: "#8A9BB0", marginTop: 4 }}>{error}</div>
          </div>
          <button
            onClick={() => fetchResults(query)}
            style={{ marginLeft: "auto", padding: "6px 14px", background: "#1E2A38", border: "1px solid #2D3748", borderRadius: 20, color: "#C9A84C", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={{ animation: "argus-fadein 0.4s ease" }}>
          {/* Summary card */}
          <div style={{
            background: "#131920", border: "1px solid #1E2A38",
            borderRadius: 12, padding: 20, marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <EyeLogo size={18} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8A9BB0", letterSpacing: 1, textTransform: "uppercase" }}>Argus Intelligence Summary</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: `${sentimentColor}18`,
                  border: `1px solid ${sentimentColor}40`,
                  fontSize: 11, fontWeight: 700,
                  color: sentimentColor,
                  letterSpacing: 0.5,
                }}>
                  {SENTIMENT_ICONS[sentiment]} {sentiment.toUpperCase()}
                </span>
                {result.confidence != null && (
                  <span style={{ fontSize: 11, color: "#8A9BB0" }}>
                    {result.confidence}% confidence
                  </span>
                )}
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#E8EDF2", lineHeight: 1.7 }}>
              {result.summary}
            </p>
          </div>

          {/* Signal cards */}
          {result.key_signals?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8A9BB0", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Key Signals</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                {result.key_signals.map((signal, i) => (
                  <div key={i} style={{
                    background: "#131920",
                    border: "1px solid #1E2A38",
                    borderLeft: `3px solid #C9A84C`,
                    borderRadius: 8,
                    padding: "12px 14px",
                  }}>
                    <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>SIGNAL {i + 1}</div>
                    <div style={{ fontSize: 12, color: "#E8EDF2", lineHeight: 1.5 }}>{signal}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related searches */}
          {result.related_searches?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8A9BB0", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Related Intelligence</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.related_searches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onRelatedSearch?.(s)}
                    style={{
                      padding: "7px 14px",
                      background: "#131920",
                      border: "1px solid #1E2A38",
                      borderRadius: 20,
                      color: "#8A9BB0",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "#C9A84C";
                      e.currentTarget.style.color = "#C9A84C";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "#1E2A38";
                      e.currentTarget.style.color = "#8A9BB0";
                    }}
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
