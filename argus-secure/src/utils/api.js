// ─────────────────────────────────────────────────────────────
// Argus Shared AI Helper
// Calls /api/ai (Vercel serverless proxy to Anthropic)
// ─────────────────────────────────────────────────────────────

export async function callArgusAI(prompt, systemPrompt, maxTokens = 1000) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemPrompt, maxTokens }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "AI call failed");
  if (data.error) throw new Error(data.error);
  return data.result;
}
