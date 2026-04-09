import { useState, useEffect, useRef } from "react";
import { callArgusAI } from "../utils/api.js";
import { downloadCSV, exportBrief } from "../utils/export.js";
import NewsFeed from "./NewsFeed.jsx";

const GOLD = "#C9A84C";
const BG = "#0C0F14";
const CARD = "#131920";
const BORDER = "#1E2A38";
const TEXT = "#E8EDF2";
const MUTED = "#8A9BB0";
const DIM = "#3D5166";

const MARKETS = ["Global", "China", "Europe", "US", "UAE", "SEA"];

const MARKET_KPI = {
  Global: { medianPrice: "$380K", yoyChange: "+4.2%", yoyDir: "up", daysOnMarket: 38, volume: "1.2M units/mo" },
  China:  { medianPrice: "¥2.4M", yoyChange: "-2.8%", yoyDir: "down", daysOnMarket: 55, volume: "820K units/mo" },
  Europe: { medianPrice: "€285K", yoyChange: "+2.1%", yoyDir: "up", daysOnMarket: 48, volume: "310K units/mo" },
  US:     { medianPrice: "$412K", yoyChange: "+6.8%", yoyDir: "up", daysOnMarket: 31, volume: "520K units/mo" },
  UAE:    { medianPrice: "AED 1.8M", yoyChange: "+18.4%", yoyDir: "up", daysOnMarket: 22, volume: "28K units/mo" },
  SEA:    { medianPrice: "$195K", yoyChange: "+7.1%", yoyDir: "up", daysOnMarket: 42, volume: "180K units/mo" },
};

const CITY_LEADERBOARD = {
  Global: [
    { city: "Dubai", country: "UAE", priceM2: 4800, yoy: "+18.4%", dir: "up", spark: [3200,3600,3900,4100,4400,4800] },
    { city: "Singapore", country: "SGP", priceM2: 15200, yoy: "+9.2%", dir: "up", spark: [12800,13200,13600,14100,14700,15200] },
    { city: "Miami", country: "US", priceM2: 5900, yoy: "+12.1%", dir: "up", spark: [4800,5000,5200,5400,5700,5900] },
    { city: "London", country: "UK", priceM2: 12800, yoy: "+2.4%", dir: "up", spark: [12000,12100,12300,12400,12600,12800] },
    { city: "Tokyo", country: "JPN", priceM2: 8200, yoy: "+5.8%", dir: "up", spark: [7400,7500,7700,7800,8000,8200] },
    { city: "Paris", country: "FRA", priceM2: 9800, yoy: "-1.2%", dir: "down", spark: [10400,10200,10100,10000,9900,9800] },
    { city: "New York", country: "US", priceM2: 13400, yoy: "+3.8%", dir: "up", spark: [12400,12600,12800,13000,13200,13400] },
    { city: "Frankfurt", country: "DEU", priceM2: 5400, yoy: "-3.1%", dir: "down", spark: [5900,5800,5700,5600,5500,5400] },
    { city: "Shanghai", country: "CHN", priceM2: 6200, yoy: "-4.8%", dir: "down", spark: [7000,6800,6600,6500,6300,6200] },
    { city: "Sydney", country: "AUS", priceM2: 9100, yoy: "+7.2%", dir: "up", spark: [8100,8200,8400,8700,8900,9100] },
  ],
  UAE: [
    { city: "Dubai Marina", country: "UAE", priceM2: 5800, yoy: "+22.1%", dir: "up", spark: [4200,4600,4900,5100,5500,5800] },
    { city: "Palm Jumeirah", country: "UAE", priceM2: 8200, yoy: "+19.4%", dir: "up", spark: [6100,6700,7100,7400,7900,8200] },
    { city: "Downtown Dubai", country: "UAE", priceM2: 7100, yoy: "+17.2%", dir: "up", spark: [5400,5800,6100,6400,6800,7100] },
    { city: "Abu Dhabi", country: "UAE", priceM2: 3900, yoy: "+11.8%", dir: "up", spark: [3200,3400,3500,3600,3800,3900] },
    { city: "JBR", country: "UAE", priceM2: 4800, yoy: "+14.3%", dir: "up", spark: [3700,4000,4200,4400,4600,4800] },
    { city: "Business Bay", country: "UAE", priceM2: 4200, yoy: "+16.1%", dir: "up", spark: [3200,3500,3700,3900,4100,4200] },
    { city: "Jumeirah", country: "UAE", priceM2: 5100, yoy: "+13.7%", dir: "up", spark: [3900,4200,4400,4600,4900,5100] },
    { city: "DIFC", country: "UAE", priceM2: 6200, yoy: "+20.5%", dir: "up", spark: [4600,5000,5400,5700,5900,6200] },
    { city: "Sharjah", country: "UAE", priceM2: 2100, yoy: "+8.4%", dir: "up", spark: [1800,1900,1950,2000,2050,2100] },
    { city: "RAK", country: "UAE", priceM2: 1800, yoy: "+12.2%", dir: "up", spark: [1400,1500,1600,1650,1720,1800] },
  ],
};

// Rental yield comparison — top 8 cities
const RENTAL_YIELDS = [
  { city: "Dubai",     yield: 6.8 },
  { city: "Singapore", yield: 3.2 },
  { city: "Miami",     yield: 5.1 },
  { city: "Berlin",    yield: 2.8 },
  { city: "London",    yield: 3.6 },
  { city: "Tokyo",     yield: 4.2 },
  { city: "Bangkok",   yield: 5.8 },
  { city: "Istanbul",  yield: 6.1 },
];

// Heatmap districts (city pricing tiers, 4x3 grid)
const HEATMAP_DATA = {
  US: [
    { label: "UES New York", value: 95 }, { label: "SoHo", value: 88 },
    { label: "Beverly Hills", value: 100 }, { label: "Palo Alto", value: 96 },
    { label: "Back Bay Boston", value: 72 }, { label: "River North Chicago", value: 61 },
    { label: "LoDo Denver", value: 58 }, { label: "South Beach Miami", value: 84 },
    { label: "Capitol Hill Seattle", value: 75 }, { label: "Midtown Atlanta", value: 52 },
    { label: "Montrose Houston", value: 45 }, { label: "Scottsdale AZ", value: 63 },
  ],
  UAE: [
    { label: "Palm Jumeirah", value: 100 }, { label: "DIFC", value: 88 },
    { label: "Downtown", value: 92 }, { label: "Marina", value: 85 },
    { label: "JBR", value: 76 }, { label: "Business Bay", value: 72 },
    { label: "Jumeirah", value: 80 }, { label: "Al Barsha", value: 55 },
    { label: "Deira", value: 38 }, { label: "International City", value: 25 },
    { label: "Abu Dhabi", value: 65 }, { label: "Sharjah", value: 42 },
  ],
  Europe: [
    { label: "Monaco", value: 100 }, { label: "Mayfair London", value: 95 },
    { label: "8th Paris", value: 90 }, { label: "Mitte Berlin", value: 72 },
    { label: "Vienna 1st", value: 75 }, { label: "Zurich Altstadt", value: 88 },
    { label: "Amsterdam Centrum", value: 82 }, { label: "Barcelona Eixample", value: 68 },
    { label: "Milan Brera", value: 78 }, { label: "Munich Maxvorstadt", value: 74 },
    { label: "Stockholm Ostermalm", value: 70 }, { label: "Dublin 4", value: 65 },
  ],
};

function Sparkline({ data, color = GOLD, height = 28, width = 64 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`);
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function HeatCell({ label, value }) {
  const alpha = Math.round((value / 100) * 255).toString(16).padStart(2, "0");
  const bg = `#C9A84C${alpha}`;
  const textColor = value > 60 ? "#0C0F14" : TEXT;
  return (
    <div style={{ background: bg, borderRadius: 4, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 9, color: textColor, fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 11, color: textColor, fontWeight: 700, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export default function RealEstatePanel() {
  const [market, setMarket] = useState("Global");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiCacheRef = useRef({});

  const kpi = MARKET_KPI[market] || MARKET_KPI.Global;
  const cities = CITY_LEADERBOARD[market] || CITY_LEADERBOARD.Global;
  const heatmap = HEATMAP_DATA[market] || HEATMAP_DATA.Europe;
  const maxYield = Math.max(...RENTAL_YIELDS.map(r => r.yield));

  async function fetchAISummary(mkt) {
    if (aiCacheRef.current[mkt]) { setAiSummary(aiCacheRef.current[mkt]); return; }
    setAiLoading(true);
    const systemPrompt = "You are Argus, a real estate market intelligence specialist. Provide concise, data-driven insights.";
    const prompt = `Write a 2-3 sentence real estate market intelligence brief for the ${mkt} market. Include: current price trend direction, key demand driver, and one risk factor. Be specific with numbers where possible. Return only the sentences, no JSON.`;
    try {
      const result = await callArgusAI(prompt, systemPrompt, 400);
      const text = result?.raw || (typeof result === "string" ? result : "Brief unavailable.");
      setAiSummary(text);
      aiCacheRef.current[mkt] = text;
    } catch { setAiSummary("Real estate brief unavailable — configure ANTHROPIC_API_KEY."); }
    setAiLoading(false);
  }

  useEffect(() => { fetchAISummary(market); }, [market]);

  const selectStyle = { padding: "7px 12px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, cursor: "pointer", fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>

        {/* Market tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {MARKETS.map(m => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: market === m ? 700 : 400,
                background: market === m ? GOLD : CARD,
                border: `1px solid ${market === m ? GOLD : BORDER}`,
                color: market === m ? "#0C0F14" : MUTED,
                transition: "all 0.15s",
              }}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => exportBrief({ title: `Real Estate — ${market}`, vertical: "Real Estate", market, aiSummary })}
            style={{ marginLeft: "auto", padding: "7px 14px", background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            📤 Export
          </button>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Median Price", value: kpi.medianPrice, color: GOLD },
            { label: "YoY Change", value: kpi.yoyChange, color: kpi.yoyDir === "up" ? "#48BB78" : "#FC8181" },
            { label: "Days on Market", value: kpi.daysOnMarket + "d", color: TEXT },
            { label: "Transaction Volume", value: kpi.volume, color: MUTED },
          ].map(item => (
            <div key={item.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* City Leaderboard + AI Brief */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* City leaderboard */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>City Price Growth Leaderboard</span>
              <button onClick={() => downloadCSV(cities.map(c => ({ City: c.city, Country: c.country, "Price/m²": c.priceM2, "YoY": c.yoy })), "city-leaderboard.csv")} style={{ fontSize: 10, color: MUTED, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>CSV ↓</button>
            </div>
            <div style={{ overflow: "auto", maxHeight: 280 }}>
              {cities.map((city, i) => (
                <div key={city.city} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1E2A38"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ width: 18, fontSize: 10, color: DIM }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: TEXT }}>{city.city}</span>
                  <span style={{ fontSize: 10, color: DIM }}>{city.country}</span>
                  <Sparkline data={city.spark} color={city.dir === "up" ? "#48BB78" : "#FC8181"} />
                  <span style={{ fontSize: 11, color: city.dir === "up" ? "#48BB78" : "#FC8181", fontWeight: 700, width: 50, textAlign: "right" }}>{city.yoy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Brief + Rental Yields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: "uppercase" }}>AI Market Brief</span>
                <button onClick={() => fetchAISummary(market)} style={{ fontSize: 10, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>{aiLoading ? "…" : "↻"}</button>
              </div>
              {aiLoading
                ? [100, 88, 70].map((w, i) => <div key={i} style={{ height: 11, background: BORDER, borderRadius: 3, marginBottom: 6, width: `${w}%`, animation: "skeleton 1.5s infinite" }} />)
                : <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7 }}>{aiSummary || "Loading…"}</p>
              }
            </div>

            {/* Rental yield bar chart */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Gross Rental Yield — Top Cities</div>
              {RENTAL_YIELDS.map(r => (
                <div key={r.city} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: MUTED, width: 75 }}>{r.city}</span>
                  <div style={{ flex: 1, height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${(r.yield / maxYield) * 100}%`, height: "100%", background: GOLD, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, width: 36, textAlign: "right" }}>{r.yield}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* District Heatmap */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>District Price Heatmap — {market} (0–100 index)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {heatmap.map(cell => <HeatCell key={cell.label} {...cell} />)}
          </div>
        </div>
      </div>

      {/* Right: News */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <NewsFeed vertical="realestate" />
      </div>
      <style>{`@keyframes skeleton{0%{opacity:0.6}50%{opacity:0.3}100%{opacity:0.6}}`}</style>
    </div>
  );
}
