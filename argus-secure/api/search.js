// Argus Search — Dual AI Backend
//
// Routing logic:
//   China user           → DeepSeek always (GFW-safe)
//   Non-China + Claude key set → Claude (best quality)
//   Non-China, Claude fails or no key → DeepSeek fallback
//   Both fail → demo results (never crashes for user)

const DEMO_RESULTS = [
  { id:"d1", category:"cars", title:"BMW 3 Series 320d — Demo Mode", source:"AutoScout24", price:"€22,500", priceRaw:22500, location:"Munich, DE", description:"Add an API key to get real AI results.", details:{ Year:"2021", Mileage:"45,000 km", Fuel:"Diesel", Gearbox:"Automatic", Registration:"03/2021", Owners:"1" }, rating:4.7, reviews:312 },
  { id:"d2", category:"realestate", title:"2BR Apartment — Demo Mode", source:"Rightmove", price:"£1,850/mo", priceRaw:1850, location:"London, UK", description:"Add an API key to get real AI results.", details:{ Type:"Rent", Rooms:"2", Size:"68 m²", Floor:"3rd", Available:"Now" }, rating:4.5, reviews:89 },
  { id:"d3", category:"hotels", title:"City Center Hotel — Demo Mode", source:"Booking.com", price:"€129/night", priceRaw:129, location:"Barcelona, ES", description:"Add an API key to get real AI results.", details:{ Stars:"4", Rating:"8.6", Breakfast:"Included", Pool:"Yes" }, rating:4.6, reviews:1420 },
  { id:"d4", category:"flights", title:"London to Barcelona — Demo Mode", source:"Skyscanner", price:"€89", priceRaw:89, location:"LHR → BCN", description:"Add an API key to get real AI results.", details:{ Duration:"2h 15m", Stops:"Direct", Departs:"08:30", Class:"Economy" }, rating:null, reviews:null },
  { id:"d5", category:"news", title:"Global Markets Update — Demo Mode", source:"Reuters", price:null, priceRaw:null, location:"Global", description:"Add an API key to get real AI results.", details:{ Topic:"Markets", Region:"Global", Read:"3 min", Published:"Today" }, rating:null, reviews:null },
];

function buildPrompt(query, countryName, allSources, customNames) {
  return `You are the AI brain of Argus — a multi-source search platform with one search bar that searches everything at once.

User query: "${query}"
${countryName ? `Country/Region: ${countryName}` : "No specific region selected."}
${allSources && allSources.length ? `Built-in platforms: ${allSources.join(", ")}` : "Use global platforms."}
${customNames && customNames.length ? `User's custom sources (always include at least 1 result from each): ${customNames.join(", ")}` : ""}

Your job:
1. Decide which categories are RELEVANT. "BMW 3 Series" → cars + news. "Bali trip" → flights + hotels + news. "Berlin apartment" → real estate + news. Always include 1-2 news items.
2. Generate 2-4 results per relevant category.
3. Use real platform names relevant to the country/region.
4. If user has custom sources, always include at least 1 result from each.

Return ONLY a valid JSON array. No markdown, no explanation.

Each item:
{
  "id": "unique string",
  "category": "cars|realestate|hotels|flights|ecommerce|news",
  "title": "specific realistic listing title",
  "source": "real platform name",
  "price": "formatted price string or null",
  "priceRaw": number or null,
  "location": "city, country",
  "description": "1-2 sentences",
  "details": {
    for cars: { "Year": "", "Mileage": "", "Fuel": "", "Gearbox": "", "Registration": "", "Owners": "" }
    for realestate: { "Type": "Buy or Rent", "Rooms": "", "Size": "", "Floor": "", "Available": "" }
    for hotels: { "Stars": "", "Rating": "", "Breakfast": "", "Pool": "" }
    for flights: { "Duration": "", "Stops": "", "Departs": "", "Class": "" }
    for ecommerce: { "Condition": "", "Age": "", "Warranty": "" }
    for news: { "Topic": "", "Region": "", "Read": "", "Published": "" }
  },
  "rating": number 1-5 or null,
  "reviews": number or null
}`;
}

function isFromChina(req) {
  const country =
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    "";
  return country.toUpperCase() === "CN";
}

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
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Claude error");
  const txt = data.content.map((b) => b.text || "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(txt);
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
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "You are the AI brain of Argus, a multi-source global search platform. Return valid JSON arrays only — no markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "DeepSeek error");
  const txt = (data.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim();
  return JSON.parse(txt);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, countryName, allSources, customNames } = req.body;
  if (!query) return res.status(400).json({ error: "No query provided" });

  const claudeKey   = process.env.ANTHROPIC_API_KEY;   // optional — add later
  const deepseekKey = process.env.DEEPSEEK_API_KEY;    // primary now
  const chinaUser   = isFromChina(req);
  const prompt      = buildPrompt(query, countryName, allSources, customNames);

  let results = null;
  let aiUsed  = "demo";

  if (chinaUser) {
    // ── China users: DeepSeek only (Claude blocked by GFW) ───
    if (deepseekKey) {
      try {
        results = await callDeepSeek(deepseekKey, prompt);
        aiUsed  = "deepseek";
      } catch (err) {
        console.error("DeepSeek failed (China):", err.message);
      }
    }
  } else {
    // ── Non-China: Claude first (if key exists), then DeepSeek ─
    if (claudeKey) {
      try {
        results = await callClaude(claudeKey, prompt);
        aiUsed  = "claude";
      } catch (err) {
        console.error("Claude failed, falling back to DeepSeek:", err.message);
      }
    }
    if (!results && deepseekKey) {
      try {
        results = await callDeepSeek(deepseekKey, prompt);
        aiUsed  = "deepseek";
      } catch (err) {
        console.error("DeepSeek also failed:", err.message);
      }
    }
  }

  // ── Final fallback: demo results — app never crashes ─────────
  if (!results) {
    results = DEMO_RESULTS;
    aiUsed  = "demo";
  }

  return res.status(200).json({ results, meta: { aiUsed, chinaUser } });
}
