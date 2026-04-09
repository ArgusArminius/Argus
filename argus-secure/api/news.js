// ─────────────────────────────────────────────────────────────
// Argus News Feed — Vercel Serverless
// Dual source: RSS feeds + NewsAPI
// Supports category filtering: cars, realestate, travel, general, tech
// Auto-refreshes every 5 minutes (via client polling)
// ─────────────────────────────────────────────────────────────

const RSS_FEEDS = {
  cars: [
    "https://www.motortrend.com/feed/",
    "https://www.caranddriver.com/rss/all.xml",
    "https://www.autoblog.com/rss.xml",
    "https://electrek.co/feed/",
  ],
  realestate: [
    "https://www.inman.com/feed/",
    "https://therealdeal.com/feed/",
    "https://www.housingwire.com/feed/",
  ],
  travel: [
    "https://skift.com/feed/",
    "https://www.travelweekly.com/rss",
    "https://www.travelpulse.com/rss",
  ],
  tech: [
    "https://techcrunch.com/feed/",
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
  ],
  general: [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://www.ft.com/rss/home",
  ],
};

// Category keyword mapping for NewsAPI
const NEWSAPI_QUERIES = {
  cars: "automotive OR electric vehicle OR EV market OR car sales",
  realestate: "real estate OR housing market OR property prices OR mortgage",
  travel: "travel industry OR airline OR hotel occupancy OR tourism",
  tech: "artificial intelligence OR technology OR semiconductor OR startup",
  general: "markets OR economy OR trade OR inflation",
};

function timeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return "Recently"; }
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse RSS/Atom XML without a library
function parseRSS(xml, sourceName) {
  const items = [];
  const itemMatches = xml.matchAll(/<item[\s>]|<entry[\s>]/gi);
  const rawItems = xml.split(/<item[\s>]|<entry[\s>]/gi).slice(1);

  for (const rawItem of rawItems) {
    try {
      const getTag = (tag) => {
        const cdataMatch = rawItem.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, "i"));
        if (cdataMatch) return cdataMatch[1].trim();
        const tagMatch = rawItem.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        return tagMatch ? tagMatch[1].trim() : "";
      };

      const title = stripHtml(getTag("title"));
      const link = (getTag("link") || rawItem.match(/href="([^"]+)"/)?.[1] || "").trim();
      const description = stripHtml(getTag("description") || getTag("summary") || getTag("content:encoded") || "");
      const pubDate = getTag("pubDate") || getTag("published") || getTag("updated") || "";
      const mediaUrl = rawItem.match(/url="([^"]+\.(jpg|jpeg|png|webp))"/i)?.[1] || null;

      if (!title || !link) continue;

      items.push({
        title,
        url: link,
        description: description.slice(0, 300),
        publishedAt: pubDate,
        image: mediaUrl,
        source: sourceName,
      });
    } catch {}
  }

  return items;
}

async function fetchRSSFeed(url) {
  try {
    const sourceName = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
    const res = await fetch(url, {
      headers: { "User-Agent": "Argus Intelligence/1.0 Feed Reader" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, sourceName).slice(0, 5);
  } catch {
    return [];
  }
}

async function fetchNewsAPIByCategory(category, apiKey, page = 1) {
  try {
    const q = NEWSAPI_QUERIES[category] || NEWSAPI_QUERIES.general;
    const res = await fetch(
      `https://newsapi.org/v2/everything` +
      `?q=${encodeURIComponent(q)}` +
      `&sortBy=publishedAt` +
      `&pageSize=8` +
      `&page=${page}` +
      `&language=en` +
      `&apiKey=${apiKey}`
    );
    const data = await res.json();
    if (data.status !== "ok" || !data.articles?.length) return [];

    return data.articles
      .filter(a => a.title && a.url && a.title !== "[Removed]" && a.description)
      .map(a => ({
        title: a.title,
        url: a.url,
        description: (a.description || "").slice(0, 300),
        publishedAt: a.publishedAt,
        image: a.urlToImage || null,
        source: a.source?.name || "News",
      }));
  } catch {
    return [];
  }
}

function formatArticle(a, category, index) {
  return {
    id: `news_${category}_${Date.now()}_${index}`,
    category,
    title: a.title,
    source: a.source,
    url: a.url,
    image: a.image || null,
    description: a.description || a.title,
    publishedAt: a.publishedAt,
    timeAgo: timeAgo(a.publishedAt),
    tag: category.charAt(0).toUpperCase() + category.slice(1),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const category = (req.query.category || "general").toLowerCase();
  const page = parseInt(req.query.page || "1", 10);
  const newsApiKey = process.env.NEWSAPI_KEY;

  const rssFeeds = RSS_FEEDS[category] || RSS_FEEDS.general;

  // Fetch RSS feeds in parallel
  const rssPromises = rssFeeds.map(url => fetchRSSFeed(url));
  const rssResults = await Promise.all(rssPromises);
  const rssArticles = rssResults.flat();

  // Also fetch from NewsAPI if key available
  let newsApiArticles = [];
  if (newsApiKey) {
    newsApiArticles = await fetchNewsAPIByCategory(category, newsApiKey, page);
  }

  // Merge and deduplicate by URL
  const seen = new Set();
  const merged = [...rssArticles, ...newsApiArticles].filter(a => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Sort by publishedAt descending
  merged.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

  const articles = merged.map((a, i) => formatArticle(a, category, i));

  return res.status(200).json({
    articles,
    meta: {
      category,
      count: articles.length,
      sources: { rss: rssArticles.length, newsapi: newsApiArticles.length },
      page,
      timestamp: new Date().toISOString(),
    },
  });
}
