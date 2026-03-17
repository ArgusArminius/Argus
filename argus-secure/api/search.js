// ─────────────────────────────────────────────────────────────
// Argus Search Backend — Full Stack
//
// AI routing:
//   China user             → DeepSeek (GFW-safe)
//   Non-China + Claude key → Claude (best quality)
//   Claude fails / no key  → DeepSeek fallback
//   All fail               → Demo results (never crashes)
//
// News routing:
//   China user             → Juhe 聚合数据 (juhe.cn) — Chinese news, GFW-safe
//   Non-China              → NewsAPI.org — global English news
//   Neither key set        → AI-generated news (demo quality)
//
// Future (Month 6 — B2B terminal):
//   Webz.io                → Enterprise news intelligence layer
//                            170+ languages, 3.5M articles/day
//                            Add WEBZ_TOKEN env var when ready
// ─────────────────────────────────────────────────────────────

const DEMO_RESULTS = [
  { id:"d1", category:"cars",       title:"BMW 3 Series 320d",          source:"AutoScout24",  url:"https://www.autoscout24.com/lst/bmw/3er",             price:"€22,500",    priceRaw:22500, location:"Munich, DE",    description:"Demo mode — add your DeepSeek API key for real AI results.", details:{ Year:"2021", Mileage:"45,000 km", Fuel:"Diesel", Gearbox:"Automatic", Registration:"03/2021", Owners:"1" }, rating:4.7, reviews:312  },
  { id:"d2", category:"realestate", title:"2BR Apartment City Centre",  source:"Rightmove",    url:"https://www.rightmove.co.uk",                        price:"£1,850/mo",  priceRaw:1850,  location:"London, UK",    description:"Demo mode — add your DeepSeek API key for real AI results.", details:{ Type:"Rent", Rooms:"2", Size:"68 m²", Floor:"3rd", Available:"Now" }, rating:4.5, reviews:89   },
  { id:"d3", category:"hotels",     title:"Grand Hotel Barcelona",      source:"Booking.com",  url:"https://www.booking.com/searchresults.html?ss=Barcelona", price:"€129/night", priceRaw:129, location:"Barcelona, ES", description:"Demo mode — add your DeepSeek API key for real AI results.", details:{ Stars:"4", Rating:"8.6", Breakfast:"Included", Pool:"Yes" }, rating:4.6, reviews:1420 },
  { id:"d4", category:"flights",    title:"London → Barcelona Direct",  source:"Skyscanner",   url:"https://www.skyscanner.com",                         price:"€89",        priceRaw:89,    location:"LHR → BCN",     description:"Demo mode — add your DeepSeek API key for real AI results.", details:{ Duration:"2h 15m", Stops:"Direct", Departs:"08:30", Class:"Economy" }, rating:null, reviews:null },
  { id:"d5", category:"news",       title:"Global Markets Update",      source:"Reuters",      url:"https://www.reuters.com",                            price:null,         priceRaw:null,  location:"Global",         description:"Demo mode — add NewsAPI or Juhe key for real news.",         details:{ Topic:"Markets", Region:"Global", Read:"3 min", Published:"Today" }, rating:null, reviews:null },
];

// ─────────────────────────────────────────────────────────────
// AI PROMPT
// ─────────────────────────────────────────────────────────────
function buildPrompt(query, countryName, allSources, customNames) {
  return `You are the AI brain of Argus — a multi-source global search platform.

User query: "${query}"
${countryName ? `Country/Region: ${countryName}` : "No specific region."}
${allSources && allSources.length ? `Platforms: ${allSources.join(", ")}` : "Use global platforms."}
${customNames && customNames.length ? `Custom sources (include 1+ result from each): ${customNames.join(", ")}` : ""}

RULES:
1. Only include categories RELEVANT to the query. Be selective.
   "BMW 3 Series" → cars only. "Bali trip" → flights + hotels. "Berlin apartment" → real estate.
2. Generate 4-6 results per relevant category.
3. Use real platform names for the region.
4. Include a REAL search URL per result pointing to actual platform search pages.
5. Do NOT include news — handled by dedicated news APIs.
6. Prices must be realistic for the market.
7. Descriptions must be specific — 2-3 sentences.

Return ONLY a valid JSON array. No markdown, no explanation.

Each item MUST have ALL these fields:
{
  "id": "unique_string",
  "category": "cars|realestate|hotels|flights|ecommerce",
  "title": "specific realistic title",
  "source": "real platform name",
  "url": "https://real-search-url.com/path",
  "price": "€22,500 or null",
  "priceRaw": 22500,
  "location": "City, Country",
  "description": "2-3 specific sentences",
  "details": {
    for cars:       { "Year": "2021", "Mileage": "45,000 km", "Fuel": "Diesel", "Gearbox": "Automatic", "Registration": "03/2021", "Owners": "1" }
    for realestate: { "Type": "Rent", "Rooms": "3", "Size": "85 m²", "Floor": "2nd", "Available": "Now" }
    for hotels:     { "Stars": "4", "Rating": "8.8", "Breakfast": "Included", "Pool": "Yes" }
    for flights:    { "Duration": "2h 15m", "Stops": "Direct", "Departs": "08:30", "Class": "Economy" }
    for ecommerce:  { "Condition": "Like New", "Age": "6 months", "Warranty": "Yes" }
  },
  "rating": 4.7,
  "reviews": 312
}`;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function isFromChina(req) {
  const c = (
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    ""
  ).toUpperCase();
  return c === "CN";
}

function timeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1)  return "Just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return "Recently"; }
}

// ─────────────────────────────────────────────────────────────
// AI CALLERS
// ─────────────────────────────────────────────────────────────
async function callClaude(apiKey, prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Claude error");
  return JSON.parse(
    data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim()
  );
}

async function callDeepSeek(apiKey, prompt) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: "You are the AI brain of Argus. Return ONLY valid JSON arrays. No markdown. No explanation. Always include real URLs.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "DeepSeek error");
  return JSON.parse(
    (data.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim()
  );
}

// ─────────────────────────────────────────────────────────────
// NEWS: NewsAPI.org — global English news
// ─────────────────────────────────────────────────────────────
async function fetchNewsAPI(query, apiKey) {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${apiKey}`
    );
    const data = await res.json();
    if (data.status !== "ok" || !data.articles?.length) return [];

    return data.articles
      .filter(a => a.title && a.url && a.title !== "[Removed]" && a.description)
      .slice(0, 4)
      .map((a, i) => ({
        id:          `news_global_${i}`,
        category:    "news",
        title:       a.title,
        source:      a.source?.name || "News",
        url:         a.url,
        image:       a.urlToImage || null,
        price:       null,
        priceRaw:    null,
        location:    "Global",
        description: a.description,
        details: {
          Topic:     query.split(" ").slice(0, 3).join(" "),
          Region:    "Global",
          Read:      "3 min",
          Published: timeAgo(a.publishedAt),
        },
        rating:  null,
        reviews: null,
      }));
  } catch (err) {
    console.error("NewsAPI failed:", err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// NEWS: Juhe 聚合数据 — Chinese news (GFW-safe)
// Docs: https://www.juhe.cn/docs/api/id/235
// Covers: domestic CN, international, sports, entertainment, tech
// Updates every 5-30 minutes
// ─────────────────────────────────────────────────────────────
async function fetchJuheNews(query, apiKey) {
  try {
    // Juhe news categories: top=头条 guonei=国内 guoji=国际
    // sports=体育 entertain=娱乐 tech=科技 finance=财经
    // Pick category based on query keywords — default to top headlines
    const categoryMap = {
      "finance": "财经", "stock": "财经", "market": "财经", "economy": "财经",
      "tech": "科技",    "ai": "科技",    "phone": "科技",  "car": "科技",
      "sport": "体育",   "football": "体育", "basketball": "体育",
      "film": "娱乐",    "movie": "娱乐",  "music": "娱乐",
    };

    const queryLower = query.toLowerCase();
    let type = "top"; // default: top headlines
    for (const [kw, cat] of Object.entries(categoryMap)) {
      if (queryLower.includes(kw)) { type = cat; break; }
    }

    const url = `http://v.juhe.cn/toutiao/index?type=${encodeURIComponent(type)}&key=${apiKey}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.error_code !== 0 || !data.result?.data?.length) {
      console.error("Juhe error:", data.reason || "unknown");
      return [];
    }

    return data.result.data
      .slice(0, 4)
      .map((a, i) => ({
        id:          `news_cn_${i}`,
        category:    "news",
        title:       a.title,
        source:      a.author_name || "新闻",
        url:         a.url,
        image:       a.thumbnail_pic_s || null,
        price:       null,
        priceRaw:    null,
        location:    "中国",
        description: a.title, // Juhe doesn't always return a description
        details: {
          Topic:     type === "top" ? "头条" : type,
          Region:    "中国",
          Read:      "3 分钟",
          Published: timeAgo(a.date),
        },
        rating:  null,
        reviews: null,
      }));
  } catch (err) {
    console.error("Juhe failed:", err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// NEWS: Webz.io — RESERVED FOR B2B TERMINAL (Month 6)
// Uncomment when WEBZ_TOKEN is added to Vercel env vars
// 170+ languages, 3.5M articles/day, enterprise grade
// https://webz.io/products/news-api
// ─────────────────────────────────────────────────────────────
// async function fetchWebz(query, token) {
//   try {
//     const res = await fetch(
//       `https://api.webz.io/newsApiLite?token=${token}&q=${encodeURIComponent(query)}&sort=published&order=desc&size=5`
//     );
//     const data = await res.json();
//     if (!data.posts?.length) return [];
//     return data.posts.slice(0, 4).map((p, i) => ({
//       id:          `news_webz_${i}`,
//       category:    "news",
//       title:       p.title,
//       source:      p.thread?.site_full || "News",
//       url:         p.url,
//       image:       p.thread?.main_image || null,
//       price:       null,
//       priceRaw:    null,
//       location:    p.thread?.country || "Global",
//       description: p.text?.slice(0, 200) || p.title,
//       details: {
//         Topic:     query.split(" ").slice(0, 3).join(" "),
//         Region:    p.thread?.country || "Global",
//         Read:      "3 min",
//         Published: timeAgo(p.published),
//       },
//       rating: null, reviews: null,
//     }));
//   } catch (err) {
//     console.error("Webz failed:", err.message);
//     return [];
//   }
// }

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, countryName, allSources, customNames } = req.body;
  if (!query) return res.status(400).json({ error: "No query provided" });

  const claudeKey   = process.env.ANTHROPIC_API_KEY;  // optional — add when available
  const deepseekKey = process.env.DEEPSEEK_API_KEY;   // primary AI now
  const newsApiKey  = process.env.NEWSAPI_KEY;         // global English news
  const juheKey     = process.env.JUHE_API_KEY;        // Chinese news (juhe.cn)
  // const webzToken  = process.env.WEBZ_TOKEN;         // B2B — Month 6

  const chinaUser   = isFromChina(req);
  const prompt      = buildPrompt(query, countryName, allSources, customNames);

  // ── Step 1: Get AI results ──────────────────────────────────
  let results = null;
  let aiUsed  = "demo";

  if (chinaUser) {
    // China: DeepSeek only (Claude blocked by GFW)
    if (deepseekKey) {
      try   { results = await callDeepSeek(deepseekKey, prompt); aiUsed = "deepseek"; }
      catch (e) { console.error("DeepSeek (CN) failed:", e.message); }
    }
  } else {
    // Non-China: Claude first, DeepSeek fallback
    if (claudeKey) {
      try   { results = await callClaude(claudeKey, prompt); aiUsed = "claude"; }
      catch (e) { console.error("Claude failed:", e.message); }
    }
    if (!results && deepseekKey) {
      try   { results = await callDeepSeek(deepseekKey, prompt); aiUsed = "deepseek"; }
      catch (e) { console.error("DeepSeek fallback failed:", e.message); }
    }
  }

  // Final AI fallback
  if (!results) { results = DEMO_RESULTS; aiUsed = "demo"; }

  // ── Step 2: Get real news and inject ───────────────────────
  // China users → Juhe (Chinese news, no VPN needed)
  // Global users → NewsAPI (English news)
  // Both run in parallel with AI call results above

  let newsSource = "ai";
  let realNews   = [];

  if (chinaUser && juheKey) {
    realNews   = await fetchJuheNews(query, juheKey);
    newsSource = realNews.length ? "juhe" : "ai";
  } else if (!chinaUser && newsApiKey) {
    realNews   = await fetchNewsAPI(query, newsApiKey);
    newsSource = realNews.length ? "newsapi" : "ai";
  }

  // Replace any AI-generated news with real news
  if (realNews.length) {
    results = [
      ...results.filter(r => r.category !== "news"),
      ...realNews,
    ];
  }

  // ── Step 3: Return ──────────────────────────────────────────
  return res.status(200).json({
    results,
    meta: {
      aiUsed,
      newsSource,
      chinaUser,
      // webzReady: false,  // flip to true in Month 6 when WEBZ_TOKEN added
    },
  });
}
