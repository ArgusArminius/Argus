// Vercel serverless function — sits between the browser and Anthropic
// The API key never leaves this server. The browser never sees it.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the query and context from the browser request
  const { query, countryName, allSources, customNames } = req.body;

  if (!query) {
    return res.status(400).json({ error: "No query provided" });
  }

  // API key lives here on the server — never sent to browser
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const prompt = `You are the AI brain of Argus — a multi-source search platform with one search bar that searches everything at once.

User query: "${query}"
${countryName ? `Country/Region: ${countryName}` : "No specific region selected."}
${allSources && allSources.length ? `Built-in platforms: ${allSources.join(", ")}` : "Use global platforms."}
${customNames && customNames.length ? `User's custom sources (always generate at least 1 result from each of these): ${customNames.join(", ")}` : ""}

Your job:
1. Decide which categories are RELEVANT to this query. Not all 6 need results — be smart. "BMW 3 Series" is mainly cars + maybe news. "Bali trip" is mainly flights + hotels + news. "Berlin apartment" is mainly real estate. Always include news as a default.
2. Generate 2-4 results per relevant category, and 1-2 news items as default.
3. Use real local platform names from the available platforms list where possible.
4. If user has custom sources, always include at least 1 result sourced from each of them.

Return ONLY a valid JSON array, no markdown, no explanation.

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
    for cars: Year, Mileage, Fuel, Gearbox, Registration, Owners
    for realestate: Type(Buy/Rent), Rooms, Size, Floor, Available
    for hotels: Stars, Rating, Breakfast, Pool
    for flights: Duration, Stops, Departs, Class
    for ecommerce: Condition, Age, Warranty
    for news: Topic, Region, Read, Published
  },
  "rating": number 1-5 or null,
  "reviews": number or null
}`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(500).json({ error: data.error?.message || "Anthropic error" });
    }

    const txt = data.content.map((b) => b.text || "").join("").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(txt);

    return res.status(200).json({ results: parsed });

  } catch (err) {
    return res.status(500).json({ error: "Search failed: " + err.message });
  }
}
