// ─────────────────────────────────────────────────────────────
// Argus AI Proxy — Vercel Serverless
// Proxies calls to Anthropic API to keep API key server-side
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, systemPrompt, maxTokens = 1000 } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ result: { raw: "API key not configured — add ANTHROPIC_API_KEY to Vercel env vars" } });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(200).json({ error: data.error?.message || "Anthropic error", result: null });
    }

    const text = data.content?.find(b => b.type === "text")?.text || "";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch { parsed = { raw: text }; }

    return res.status(200).json({ result: parsed });
  } catch (err) {
    console.error("AI proxy error:", err.message);
    return res.status(200).json({ error: err.message, result: null });
  }
}
