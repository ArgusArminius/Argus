import { useState, useEffect, useRef } from "react";

const CATEGORY_MAP = {
  news:       "general",
  cars:       "cars",
  realestate: "realestate",
  hotels:     "travel",
  flights:    "travel",
  shop:       "general",
  social:     "tech",
};

const CATEGORY_LABELS = {
  general: "Markets",
  cars: "Automotive",
  realestate: "Real Estate",
  travel: "Travel",
  tech: "Technology",
};

function timeAgoDisplay(timeAgoStr, publishedAt) {
  if (timeAgoStr) return timeAgoStr;
  if (!publishedAt) return "Recently";
  try {
    const diff = Date.now() - new Date(publishedAt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return "Recently"; }
}

function NewsCard({ article, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          gap: 14,
          padding: hovered ? "14px 10px" : "14px 0",
          borderBottom: "1px solid #1E2A38",
          cursor: "pointer",
          transition: "all 0.15s",
          borderRadius: hovered ? 6 : 0,
          background: hovered ? "#131920" : "transparent",
        }}
      >
        {/* Rank + source badge */}
        <div style={{ flexShrink: 0, width: 24, paddingTop: 2 }}>
          <span style={{ fontSize: 10, color: "#3D5166", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "#C9A84C",
              flexShrink: 0,
            }}>
              {article.source}
            </span>
            {article.tag && (
              <span style={{
                fontSize: 9,
                padding: "1px 7px",
                background: "#1E2A38",
                borderRadius: 10,
                color: "#8A9BB0",
                fontWeight: 600,
              }}>
                {article.tag}
              </span>
            )}
            <span style={{ fontSize: 10, color: "#3D5166", marginLeft: "auto", flexShrink: 0 }}>
              {timeAgoDisplay(article.timeAgo, article.publishedAt)}
            </span>
          </div>

          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: hovered ? "#E8EDF2" : "#C8D4E0",
            lineHeight: 1.45,
            marginBottom: 6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {article.title}
          </div>

          {article.description && (
            <div style={{
              fontSize: 11,
              color: "#8A9BB0",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {article.description}
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {article.image && (
          <div style={{
            flexShrink: 0,
            width: 72,
            height: 56,
            borderRadius: 6,
            overflow: "hidden",
            background: "#1E2A38",
          }}>
            <img
              src={article.image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.parentElement.style.display = "none"; }}
            />
          </div>
        )}
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #1E2A38" }}>
      <div style={{ width: 24 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 10, width: "30%", background: "#1E2A38", borderRadius: 4, marginBottom: 10, animation: "skeleton 1.5s infinite" }} />
        <div style={{ height: 13, width: "90%", background: "#1E2A38", borderRadius: 4, marginBottom: 6, animation: "skeleton 1.5s infinite" }} />
        <div style={{ height: 13, width: "70%", background: "#1E2A38", borderRadius: 4, marginBottom: 8, animation: "skeleton 1.5s infinite" }} />
        <div style={{ height: 11, width: "85%", background: "#1E2A38", borderRadius: 4, animation: "skeleton 1.5s infinite" }} />
      </div>
    </div>
  );
}

export default function NewsFeed({ vertical = "news", onSearch }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsSince, setSecondsSince] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const intervalRef = useRef(null);
  const tickRef = useRef(null);

  const category = CATEGORY_MAP[vertical] || "general";

  async function fetchNews(pageNum = 1, append = false) {
    if (pageNum === 1) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?category=${category}&page=${pageNum}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch news");

      const fresh = data.articles || [];
      if (append) {
        setArticles(prev => {
          const existingUrls = new Set(prev.map(a => a.url));
          const newOnes = fresh.filter(a => !existingUrls.has(a.url));
          return [...prev, ...newOnes];
        });
        if (fresh.length === 0) setHasMore(false);
      } else {
        setArticles(fresh);
        setHasMore(fresh.length >= 8);
      }
      setLastUpdated(new Date());
      setSecondsSince(0);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
    setLoadingMore(false);
  }

  // Initial load + auto-refresh every 5 min
  useEffect(() => {
    setPage(1);
    setArticles([]);
    setHasMore(true);
    fetchNews(1, false);

    intervalRef.current = setInterval(() => {
      fetchNews(1, false);
      setPage(1);
    }, 5 * 60 * 1000);

    tickRef.current = setInterval(() => {
      setSecondsSince(s => s + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(tickRef.current);
    };
  }, [vertical]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchNews(next, true);
  };

  const updatedLabel = lastUpdated
    ? secondsSince < 60
      ? `Updated ${secondsSince}s ago`
      : `Updated ${Math.floor(secondsSince / 60)}m ago`
    : null;

  return (
    <div style={{ flex: 1 }}>
      <style>{`
        @keyframes skeleton {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#E8EDF2", letterSpacing: 0.5 }}>
            {CATEGORY_LABELS[category] || "News"} Feed
          </h2>
          {!loading && articles.length > 0 && (
            <span style={{ fontSize: 10, color: "#3D5166" }}>— {articles.length} articles</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {updatedLabel && (
            <span style={{ fontSize: 10, color: "#3D5166" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#48BB78", marginRight: 5, verticalAlign: "middle" }} />
              {updatedLabel}
            </span>
          )}
          <button
            onClick={() => fetchNews(1, false)}
            disabled={loading}
            style={{ padding: "4px 10px", background: "none", border: "1px solid #1E2A38", borderRadius: 20, color: "#8A9BB0", fontSize: 10, cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div style={{
          padding: 16, background: "#131920", border: "1px solid #2D3748",
          borderRadius: 8, marginBottom: 12,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ color: "#FC8181", fontSize: 13 }}>⚠</span>
          <span style={{ fontSize: 12, color: "#8A9BB0" }}>
            Could not load live news — showing cached data. {error}
          </span>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}

      {/* Empty state */}
      {!loading && !error && articles.length === 0 && (
        <div style={{ padding: "48px 0", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 14, color: "#8A9BB0", marginBottom: 6 }}>No articles found</div>
          <div style={{ fontSize: 12, color: "#3D5166" }}>Try refreshing or check back later</div>
        </div>
      )}

      {/* Articles list */}
      {!loading && articles.map((article, i) => (
        <NewsCard key={`${article.url}-${i}`} article={article} index={i} />
      ))}

      {/* Load more */}
      {!loading && articles.length > 0 && hasMore && (
        <div style={{ paddingTop: 16, textAlign: "center" }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: "8px 24px",
              background: loadingMore ? "#1E2A38" : "#131920",
              border: "1px solid #1E2A38",
              borderRadius: 20,
              color: loadingMore ? "#3D5166" : "#8A9BB0",
              fontSize: 12,
              cursor: loadingMore ? "default" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.borderColor = "#C9A84C"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2A38"; }}
          >
            {loadingMore ? "Loading…" : "Load more articles →"}
          </button>
        </div>
      )}
    </div>
  );
}
