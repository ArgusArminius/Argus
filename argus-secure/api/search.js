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
// KEYWORD EXTRACTION — parse intent signals from raw query
// ─────────────────────────────────────────────────────────────
function extractSignals(query) {
  const q = query.toLowerCase();
  const signals = {};

  // ── Category detection ──
  const catPatterns = {
    cars:       [/\b(car|cars|auto|vehicle|suv|sedan|coupe|bmw|audi|mercedes|vw|volkswagen|tesla|toyota|ford|honda|used car|gebrauchtwagen|voiture|auto)\b/i],
    realestate: [/\b(apartment|flat|house|villa|studio|wohnung|immobilie|zimmer|room|rent|buy|sale|property|real estate|miete|kauf|bedroom|BR|sqm|m²|warm|cold|kalt|nebenkosten)\b/i],
    hotels:     [/\b(hotel|hostel|airbnb|resort|motel|stay|night|accommodation|room)\b/i],
    flights:    [/\b(flight|fly|airline|airport|ticket|direct|nonstop|→|to .+ from|from .+ to)\b/i],
    ecommerce:  [/\b(buy|shop|laptop|phone|macbook|iphone|samsung|product|item|brand new|used|ebay|amazon)\b/i],
    news:       [/\b(news|article|headline|trending|breaking|report)\b/i],
  };
  const detectedCats = Object.entries(catPatterns)
    .filter(([, patterns]) => patterns.some(p => p.test(q)))
    .map(([cat]) => cat);
  if (detectedCats.length) signals.categories = detectedCats;

  // ── Price detection ──
  // "under €2000", "max 25000", "budget 500", "€1500-2500", "bis 1500"
  const priceMax = q.match(/(?:under|max|bis|below|unter|moins de|menos de|up to)\s*[€$£¥]?\s*(\d[\d,\.]*)/i);
  const priceMin = q.match(/(?:from|ab|from|desde|de|over|above|min)\s*[€$£¥]?\s*(\d[\d,\.]*)/i);
  const priceRange = q.match(/[€$£¥]?\s*(\d[\d,\.]+)\s*[-–to]+\s*[€$£¥]?\s*(\d[\d,\.]+)/i);
  if (priceMax)   signals.priceMax = parseInt(priceMax[1].replace(/[,\.]/g, ""));
  if (priceMin)   signals.priceMin = parseInt(priceMin[1].replace(/[,\.]/g, ""));
  if (priceRange) {
    signals.priceMin = parseInt(priceRange[1].replace(/[,\.]/g, ""));
    signals.priceMax = parseInt(priceRange[2].replace(/[,\.]/g, ""));
  }

  // ── Rooms detection ──
  const rooms = q.match(/(\d+)\s*(?:bedroom|zimmer|room|br|bed|pièce|habitaci)/i) ||
                q.match(/(\d+)-(?:bedroom|zimmer|room|br)/i);
  if (rooms) signals.rooms = parseInt(rooms[1]);

  // ── Rent vs buy ──
  if (/\b(rent|miete|mieten|warm|kalt|monat|monthly|per month|\/mo)\b/i.test(q)) signals.transactionType = "Rent";
  if (/\b(buy|kaufen|kauf|purchase|sale|for sale|zu verkaufen)\b/i.test(q)) signals.transactionType = "Buy";

  // ── Car specifics ──
  const yearMatch = q.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) signals.year = yearMatch[1];
  const mileage = q.match(/(?:under|max|below|bis)\s*(\d+)\s*(?:km|miles|mi)\b/i);
  if (mileage) signals.maxMileage = parseInt(mileage[1]);
  if (/\b(electric|ev|elektro|hybrid)\b/i.test(q)) signals.fuel = "Electric/Hybrid";
  if (/\b(diesel)\b/i.test(q)) signals.fuel = "Diesel";
  if (/\b(petrol|gasoline|benzin|benzine)\b/i.test(q)) signals.fuel = "Petrol";
  if (/\b(automatic|automatik|auto gearbox)\b/i.test(q)) signals.gearbox = "Automatic";
  if (/\b(manual|schaltwagen|schaltgetriebe)\b/i.test(q)) signals.gearbox = "Manual";

  // ── Hotel specifics ──
  const stars = q.match(/(\d)\s*star/i);
  if (stars) signals.stars = parseInt(stars[1]);
  if (/\b(pool|swimming)\b/i.test(q)) signals.pool = true;
  if (/\b(breakfast|frühstück|included)\b/i.test(q)) signals.breakfast = true;

  // ── Flight specifics ──
  if (/\b(direct|nonstop|non-stop)\b/i.test(q)) signals.directOnly = true;
  const flightRoute = q.match(/([a-z]{3})\s*(?:→|->|to)\s*([a-z]{3})/i);
  if (flightRoute) { signals.from = flightRoute[1].toUpperCase(); signals.to = flightRoute[2].toUpperCase(); }

  // ── Location detection ──
  const locationMatch = q.match(/\bin\s+([a-züäöß\s]+?)(?:\s+under|\s+max|\s+for|\s+with|\s+rent|\s+buy|$)/i) ||
                        q.match(/([A-ZÜÄÖa-züäöß][a-züäöß]+(?:\s+[A-Za-z]+)?),?\s+(?:germany|uk|france|spain|italy|netherlands|china|usa)/i);
  if (locationMatch) signals.location = locationMatch[1].trim();

  // ── Size detection ──
  const sizeMatch = q.match(/(\d+)\s*(?:sqm|m²|m2|square meter)/i);
  if (sizeMatch) signals.minSize = parseInt(sizeMatch[1]);

  return signals;
}

// ─────────────────────────────────────────────────────────────
// AI PROMPT — enriched with extracted signals
// ─────────────────────────────────────────────────────────────
function buildPrompt(query, countryName, allSources, customNames) {
  const signals = extractSignals(query);

  // Build a structured constraint block from detected signals
  const constraints = [];
  if (signals.categories?.length)  constraints.push(`Detected categories: ${signals.categories.join(", ")}`);
  if (signals.priceMax)            constraints.push(`Maximum price: ${signals.priceMax} (STRICT — do not exceed)`);
  if (signals.priceMin)            constraints.push(`Minimum price: ${signals.priceMin}`);
  if (signals.rooms)               constraints.push(`Rooms required: ${signals.rooms}`);
  if (signals.transactionType)     constraints.push(`Transaction type: ${signals.transactionType}`);
  if (signals.year)                constraints.push(`Year: ${signals.year}`);
  if (signals.maxMileage)          constraints.push(`Max mileage: ${signals.maxMileage} km`);
  if (signals.fuel)                constraints.push(`Fuel type: ${signals.fuel}`);
  if (signals.gearbox)             constraints.push(`Gearbox: ${signals.gearbox}`);
  if (signals.stars)               constraints.push(`Hotel stars: ${signals.stars}+`);
  if (signals.pool)                constraints.push(`Pool: required`);
  if (signals.breakfast)           constraints.push(`Breakfast: included`);
  if (signals.directOnly)          constraints.push(`Flights: direct only`);
  if (signals.from && signals.to)  constraints.push(`Flight route: ${signals.from} → ${signals.to}`);
  if (signals.minSize)             constraints.push(`Minimum size: ${signals.minSize} m²`);
  if (signals.location)            constraints.push(`Specific location: ${signals.location}`);

  const constraintBlock = constraints.length
    ? `\nEXTRACTED CONSTRAINTS (you MUST respect all of these):\n${constraints.map(c => `  • ${c}`).join("\n")}`
    : "";

  return `You are the AI brain of Argus — a multi-source global search platform.

User query: "${query}"
${countryName ? `Country/Region: ${countryName}` : "No specific region."}
${allSources && allSources.length ? `Platforms: ${allSources.join(", ")}` : "Use global platforms."}
${customNames && customNames.length ? `Custom sources (include 1+ result from each): ${customNames.join(", ")}` : ""}
${constraintBlock}

RULES:
1. Only include categories RELEVANT to the query. Be VERY selective and strict.
   - "BMW 3 Series" → cars ONLY
   - "Bali trip" → flights + hotels ONLY
   - "Berlin apartment" → real estate ONLY
   - "news" or any query containing the word "news" → return EMPTY ARRAY []
   - If the query is primarily about news/trends/articles → return EMPTY ARRAY []
2. If the query asks for NEWS of any kind, return an empty array [].
3. Generate 4-6 results per relevant category.
4. ALL results MUST satisfy the extracted constraints above — especially price limits.
5. Use real platform names for the region (ImmobilienScout24/WG-Gesucht for Germany, Rightmove for UK etc).
6. Include a REAL search URL per result with filters applied where possible.
7. Prices must be realistic for the market AND within any stated budget.
8. Descriptions must mention the specific features asked for.

Return ONLY a valid JSON array. No markdown, no explanation.

Each item MUST have ALL these fields:
{
  "id": "unique_string",
  "category": "cars|realestate|hotels|flights|ecommerce",
  "title": "specific realistic title matching the query constraints",
  "source": "real platform name",
  "url": "https://real-search-url.com/path-with-filters",
  "price": "€1,750 warm or null",
  "priceRaw": 1750,
  "location": "City, Country",
  "description": "2-3 sentences referencing the specific features requested",
  "details": {
    for cars:       { "Year": "2021", "Mileage": "45,000 km", "Fuel": "Diesel", "Gearbox": "Automatic", "Registration": "03/2021", "Owners": "1" }
    for realestate: { "Type": "Rent", "Rooms": "2", "Size": "65 m²", "Floor": "3rd", "Available": "Now" }
    for hotels:     { "Stars": "4", "Rating": "8.8", "Breakfast": "Included", "Pool": "Yes" }
    for flights:    { "Duration": "2h 15m", "Stops": "Direct", "Departs": "08:30", "Class": "Economy" }
    for ecommerce:  { "Condition": "Like New", "Age": "6 months", "Warranty": "Yes" }
  },
  "rating": 4.7,
  "reviews": 312
}`;
}

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
// NEWS: NewsAPI.org — location-aware English news
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Real-time news: pass the full user query directly to NewsAPI
// NewsAPI searches titles + descriptions across 80,000+ sources
// sortBy=publishedAt = freshest articles first, always
// ─────────────────────────────────────────────────────────────
async function fetchNewsAPI(query, apiKey, countryName, page = 1) {
  try {
    const { newsQuery, displayLocation } = extractNewsQuery(query, countryName);
    const pageSize = 5;

    const res = await fetch(
      `https://newsapi.org/v2/everything` +
      `?q=${encodeURIComponent(newsQuery)}` +
      `&sortBy=publishedAt` +
      `&pageSize=${pageSize}` +
      `&page=${page}` +
      `&language=en` +
      `&apiKey=${apiKey}`
    );
    const data = await res.json();
    if (data.status !== "ok" || !data.articles?.length) return [];

    return data.articles
      .filter(a => a.title && a.url && a.title !== "[Removed]" && a.description)
      .map((a, i) => ({
        id:          `news_global_p${page}_${i}`,
        category:    "news",
        title:       a.title,
        source:      a.source?.name || "News",
        url:         a.url,
        image:       a.urlToImage || null,
        price:       null,
        priceRaw:    null,
        location:    displayLocation,
        description: a.description,
        details: {
          Topic:     newsQuery.split(" ").slice(0, 3).join(" "),
          Region:    displayLocation,
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

  const { query, countryName, allSources, customNames, page = 1, newsOnly = false } = req.body;
  if (!query) return res.status(400).json({ error: "No query provided" });

  const claudeKey   = process.env.ANTHROPIC_API_KEY;  // optional — add when available
  const deepseekKey = process.env.DEEPSEEK_API_KEY;   // primary AI now
  const newsApiKey  = process.env.NEWSAPI_KEY;         // global English news
  const juheKey     = process.env.JUHE_API_KEY;        // Chinese news (juhe.cn)
  // const webzToken  = process.env.WEBZ_TOKEN;         // B2B — Month 6

  const chinaUser   = isFromChina(req);
  const prompt      = buildPrompt(query, countryName, allSources, customNames);

  // ── Step 1: Get AI results (skip if newsOnly request) ───────
  let results = null;
  let aiUsed  = "demo";

  if (!newsOnly) {
    if (chinaUser) {
      if (deepseekKey) {
        try   { results = await callDeepSeek(deepseekKey, prompt); aiUsed = "deepseek"; }
        catch (e) { console.error("DeepSeek (CN) failed:", e.message); }
      }
    } else {
      if (claudeKey) {
        try   { results = await callClaude(claudeKey, prompt); aiUsed = "claude"; }
        catch (e) { console.error("Claude failed:", e.message); }
      }
      if (!results && deepseekKey) {
        try   { results = await callDeepSeek(deepseekKey, prompt); aiUsed = "deepseek"; }
        catch (e) { console.error("DeepSeek fallback failed:", e.message); }
      }
    }

    // If query is news-only use empty array not demo
    if (!results) {
      const isNewsQuery = /\bnews\b|\btrend\b|\bheadline\b|\barticle\b/i.test(query);
      results = isNewsQuery ? [] : DEMO_RESULTS;
      aiUsed  = isNewsQuery ? "news-only" : "demo";
    }
  } else {
    // newsOnly=true — skip AI entirely, just fetch more news
    results = [];
    aiUsed  = "news-only";
  }

  // ── Step 2: Get real news and inject ───────────────────────
  // China users → Juhe (Chinese news, no VPN needed)
  // Global users → NewsAPI (English news, location-aware, paginated)

  let newsSource = "ai";
  let realNews   = [];

  if (chinaUser && juheKey) {
    realNews   = await fetchJuheNews(query, juheKey);
    newsSource = realNews.length ? "juhe" : "ai";
  } else if (!chinaUser && newsApiKey) {
    // Pass page number for pagination
    realNews   = await fetchNewsAPI(query, newsApiKey, countryName, page);
    newsSource = realNews.length ? "newsapi" : "ai";
  }

  // Replace or append news results
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
      page,
      // webzReady: false,  // flip to true in Month 6 when WEBZ_TOKEN added
    },
  });
}
