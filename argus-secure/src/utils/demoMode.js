// ─────────────────────────────────────────────────────────────
// Argus Demo Mode — URL-param driven partner demos
// Usage: ?demo=nio activates NIO demo mode
// ─────────────────────────────────────────────────────────────

export function getDemoMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") || null;
  } catch {
    return null;
  }
}

export const DEMO_CONFIGS = {
  nio: {
    brand: "NIO",
    headerTitle: "NIO × Argus Intelligence",
    defaultVertical: "cars",
    lockedVertical: true,
    defaultMarkets: ["China", "Europe"],
    brandedInsights: [
      { title: "NIO ET9 market position", query: "NIO ET9 positioning premium EV segment 2025" },
      { title: "Competitor pricing: BYD vs NIO", query: "BYD NIO competitor pricing battery EV China" },
      { title: "EU EV demand signals", query: "European EV demand growth signals 2025 China brands" },
    ],
    aiSystemPrompt:
      "You are Argus, NIO's exclusive market intelligence agent. Focus on EV market dynamics, competitor benchmarking (BYD, Tesla, Xpeng, Li Auto, Huawei/Aito), demand signals, and pre-purchase intent data from search trends. Prioritize China and European markets.",
    ctaText: "Schedule Partnership Call",
    ctaLink: "mailto:partnerships@argus.ai?subject=NIO%20%C3%97%20Argus%20Partnership%20Enquiry",
  },
};

export function getDemoConfig(demoKey) {
  return DEMO_CONFIGS[demoKey?.toLowerCase()] || null;
}
