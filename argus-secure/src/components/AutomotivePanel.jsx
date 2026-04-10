import { useState, useEffect, useRef } from "react";
import { callArgusAI } from "../utils/api.js";
import { downloadCSV, exportBrief } from "../utils/export.js";
import NewsFeed from "./NewsFeed.jsx";

// ─── Plausible simulated market data ────────────────────────────────────────
const BRANDS = ["BMW", "Mercedes", "Audi", "Tesla", "BYD", "Toyota", "Volkswagen", "Ford", "NIO", "Hyundai"];
const MARKETS = ["Global", "China", "Europe", "USA", "Middle East", "SEA"];
const PLATFORMS = ["All Platforms", "AutoScout24", "Cars.com", "Autohome", "Mobile.de"];
const AGE_GROUPS = ["All Ages", "0-1 yr", "1-3 yrs", "3-5 yrs", "5+ yrs"];

// Simulated KPIs per market
const MARKET_KPI = {
  Global:       { avgPrice: "$32,400", daysOnMarket: 42, inventoryChange: "+3.2%", trend: "up" },
  China:        { avgPrice: "¥198,000", daysOnMarket: 28, inventoryChange: "+11.4%", trend: "up" },
  Europe:       { avgPrice: "€28,900", daysOnMarket: 51, inventoryChange: "-1.8%", trend: "down" },
  USA:          { avgPrice: "$38,200", daysOnMarket: 38, inventoryChange: "+5.1%", trend: "up" },
  "Middle East":{ avgPrice: "$41,500", daysOnMarket: 35, inventoryChange: "+7.3%", trend: "up" },
  SEA:          { avgPrice: "$24,800", daysOnMarket: 44, inventoryChange: "+2.9%", trend: "up" },
};

// Brand rankings by market — search volume simulated
const BRAND_RANKINGS = {
  Global:       [
    { brand:"Toyota",      volume:100, change:"+2.1%", trend:"up",   sentiment:72 },
    { brand:"Volkswagen",  volume:87,  change:"+0.4%", trend:"flat", sentiment:65 },
    { brand:"BMW",         volume:81,  change:"+3.8%", trend:"up",   sentiment:78 },
    { brand:"Ford",        volume:79,  change:"-1.2%", trend:"down", sentiment:61 },
    { brand:"Tesla",       volume:75,  change:"+8.4%", trend:"up",   sentiment:81 },
    { brand:"Mercedes",    volume:71,  change:"+1.7%", trend:"up",   sentiment:77 },
    { brand:"BYD",         volume:68,  change:"+22.1%",trend:"up",   sentiment:74 },
    { brand:"Hyundai",     volume:62,  change:"+4.5%", trend:"up",   sentiment:70 },
    { brand:"Audi",        volume:58,  change:"-0.8%", trend:"down", sentiment:68 },
    { brand:"NIO",         volume:43,  change:"+31.2%",trend:"up",   sentiment:76 },
  ],
  China:        [
    { brand:"BYD",         volume:100, change:"+28.4%",trend:"up",   sentiment:83 },
    { brand:"NIO",         volume:82,  change:"+31.2%",trend:"up",   sentiment:79 },
    { brand:"Tesla",       volume:74,  change:"+4.1%", trend:"up",   sentiment:71 },
    { brand:"Li Auto",     volume:71,  change:"+19.3%",trend:"up",   sentiment:77 },
    { brand:"Xpeng",       volume:64,  change:"+15.8%",trend:"up",   sentiment:73 },
    { brand:"Toyota",      volume:58,  change:"-3.2%", trend:"down", sentiment:60 },
    { brand:"Volkswagen",  volume:54,  change:"-7.8%", trend:"down", sentiment:55 },
    { brand:"BMW",         volume:51,  change:"+1.4%", trend:"up",   sentiment:66 },
    { brand:"AITO",        volume:47,  change:"+41.1%",trend:"up",   sentiment:80 },
    { brand:"SAIC",        volume:43,  change:"+2.9%", trend:"up",   sentiment:62 },
  ],
  Europe:       [
    { brand:"Volkswagen",  volume:100, change:"-2.1%", trend:"down", sentiment:62 },
    { brand:"BMW",         volume:91,  change:"+4.2%", trend:"up",   sentiment:79 },
    { brand:"Mercedes",    volume:88,  change:"+2.8%", trend:"up",   sentiment:78 },
    { brand:"Renault",     volume:76,  change:"-0.5%", trend:"flat", sentiment:63 },
    { brand:"Audi",        volume:72,  change:"+1.1%", trend:"up",   sentiment:71 },
    { brand:"Tesla",       volume:68,  change:"+11.2%",trend:"up",   sentiment:82 },
    { brand:"Toyota",      volume:64,  change:"+3.4%", trend:"up",   sentiment:70 },
    { brand:"Hyundai",     volume:58,  change:"+7.8%", trend:"up",   sentiment:72 },
    { brand:"Ford",        volume:54,  change:"-4.1%", trend:"down", sentiment:59 },
    { brand:"BYD",         volume:39,  change:"+88.4%",trend:"up",   sentiment:71 },
  ],
};

// Price sparkline data (last 6 months) — plausible per brand
const SPARKLINE_DATA = {
  BMW:       [41200, 41800, 42100, 41900, 43200, 44100],
  Mercedes:  [48900, 49200, 48800, 50100, 51400, 52200],
  Audi:      [38400, 38100, 38900, 39200, 38800, 39600],
  Tesla:     [42100, 40900, 39800, 38500, 37200, 36400],
  BYD:       [24800, 25200, 26100, 27400, 28900, 30200],
  Toyota:    [28900, 29100, 29400, 29800, 30100, 30800],
  Volkswagen:[28100, 27900, 28400, 28800, 29200, 29800],
  Ford:      [31200, 31800, 32400, 31900, 32100, 32800],
  NIO:       [38400, 39100, 41200, 43800, 46200, 48900],
  Hyundai:   [26800, 27200, 27800, 28400, 29100, 29800],
};

// Residual value data — indexed by [brand][age] as percentage of MSRP
const RESIDUAL_VALUES = {
  BMW:       { "0-1 yr": 82, "1-3 yrs": 67, "3-5 yrs": 54, "5+ yrs": 38 },
  Mercedes:  { "0-1 yr": 80, "1-3 yrs": 65, "3-5 yrs": 51, "5+ yrs": 36 },
  Audi:      { "0-1 yr": 79, "1-3 yrs": 63, "3-5 yrs": 50, "5+ yrs": 35 },
  Tesla:     { "0-1 yr": 77, "1-3 yrs": 61, "3-5 yrs": 48, "5+ yrs": 34 },
  BYD:       { "0-1 yr": 74, "1-3 yrs": 58, "3-5 yrs": 44, "5+ yrs": 30 },
  Toyota:    { "0-1 yr": 85, "1-3 yrs": 72, "3-5 yrs": 60, "5+ yrs": 45 },
  Volkswagen:{ "0-1 yr": 78, "1-3 yrs": 62, "3-5 yrs": 49, "5+ yrs": 34 },
  Ford:      { "0-1 yr": 76, "1-3 yrs": 60, "3-5 yrs": 46, "5+ yrs": 31 },
  NIO:       { "0-1 yr": 76, "1-3 yrs": 60, "3-5 yrs": 46, "5+ yrs": 32 },
  Hyundai:   { "0-1 yr": 80, "1-3 yrs": 65, "3-5 yrs": 52, "5+ yrs": 37 },
};

const GOLD = "#C9A84C";
const BG = "#0C0F14";
const CARD = "#131920";
const BORDER = "#1E2A38";
const TEXT = "#E8EDF2";
const MUTED = "#8A9BB0";
const DIM = "#3D5166";

function Sparkline({ data, color = GOLD, height = 32, width = 80 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ResidualBar({ value, maxVal = 100 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${(value / maxVal) * 100}%`, height: "100%", background: GOLD, borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, fontVariantNumeric: "tabular-nums", width: 36, textAlign: "right" }}>
        {value}%
      </span>
    </div>
  );
}

export default function AutomotivePanel({ demoConfig }) {
  const [market, setMarket] = useState(demoConfig?.defaultMarkets?.[0] || "Global");
  const [brand, setBrand] = useState(demoConfig?.brand || "All Brands");
  const [platform, setPlatform] = useState("All Platforms");
  const [ageGroup, setAgeGroup] = useState("All Ages");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiCacheRef = useRef({});

  const kpi = MARKET_KPI[market] || MARKET_KPI.Global;
  const rankings = BRAND_RANKINGS[market] || BRAND_RANKINGS.Global;
  const sparkBrands = BRANDS.slice(0, 6);

  // AI brief
  async function fetchAISummary(mkt, brd) {
    const cacheKey = `${mkt}-${brd}`;
    if (aiCacheRef.current[cacheKey]) {
      setAiSummary(aiCacheRef.current[cacheKey]);
      return;
    }
    setAiLoading(true);
    const systemPrompt = demoConfig?.aiSystemPrompt ||
      "You are Argus, a market intelligence agent specialising in the automotive sector.";
    const prompt = `Generate a 3-sentence automotive market intelligence brief for ${mkt} market, focusing on ${brd === "All Brands" ? "overall market conditions" : brd}. Cover: current demand, pricing pressures, and one key risk or opportunity. Be specific and data-driven. Return only the 3 sentences as plain text, no JSON.`;
    try {
      const result = await callArgusAI(prompt, systemPrompt, 400);
      const text = result?.raw || (typeof result === "string" ? result : JSON.stringify(result));
      setAiSummary(text);
      aiCacheRef.current[cacheKey] = text;
    } catch {
      setAiSummary("Market intelligence brief unavailable — configure ANTHROPIC_API_KEY.");
    }
    setAiLoading(false);
  }

  useEffect(() => { fetchAISummary(market, brand); }, [market, brand]);

  const residualBrand = brand === "All Brands" ? "BMW" : brand;
  const residualData = RESIDUAL_VALUES[residualBrand] || RESIDUAL_VALUES.BMW;
  const ageKeys = ["0-1 yr", "1-3 yrs", "3-5 yrs", "5+ yrs"];

  const selectStyle = {
    padding: "7px 12px", background: CARD, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT, fontSize: 12, cursor: "pointer",
    fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      {/* Main panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select value={market} onChange={e => setMarket(e.target.value)} style={selectStyle}>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={brand} onChange={e => setBrand(e.target.value)} style={selectStyle}>
            <option>All Brands</option>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={selectStyle}>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={selectStyle}>
            {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
          </select>
          <button
            onClick={() => exportBrief({ title: `Automotive — ${market}`, vertical: "Automotive", market, brand, aiSummary })}
            style={{ marginLeft: "auto", padding: "7px 14px", background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            📤 Export Brief
          </button>
        </div>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Avg Listing Price", value: kpi.avgPrice, sub: "Market average" },
            { label: "Days on Market", value: kpi.daysOnMarket, sub: "Median days" },
            { label: "Inventory Change", value: kpi.inventoryChange, sub: "vs last month", color: kpi.trend === "up" ? "#48BB78" : "#FC8181" },
          ].map(kpiItem => (
            <div key={kpiItem.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{kpiItem.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: kpiItem.color || GOLD, letterSpacing: -0.5 }}>{kpiItem.value}</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 4 }}>{kpiItem.sub}</div>
            </div>
          ))}
        </div>

        {/* Brand Rankings + AI Brief */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1, minHeight: 0 }}>

          {/* Brand Rankings */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>Brand Rankings — {market}</span>
              <button
                onClick={() => downloadCSV(rankings.map(r => ({ Brand: r.brand, "Search Volume": r.volume, Change: r.change, Sentiment: r.sentiment })), "brand-rankings.csv")}
                style={{ fontSize: 10, color: MUTED, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
              >CSV ↓</button>
            </div>
            <div style={{ overflow: "auto", maxHeight: 260 }}>
              {rankings.map((r, i) => (
                <div key={r.brand} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1E2A38"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ width: 20, fontSize: 10, color: DIM, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: TEXT }}>{r.brand}</span>
                  <div style={{ width: 40, height: 16, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${r.volume}%`, height: "100%", background: `${GOLD}60` }} />
                  </div>
                  <span style={{ fontSize: 10, color: r.trend === "up" ? "#48BB78" : r.trend === "down" ? "#FC8181" : MUTED, width: 50, textAlign: "right", fontWeight: 700 }}>
                    {r.change}
                  </span>
                  <span style={{ fontSize: 10, color: MUTED, width: 28, textAlign: "right" }}>{r.sentiment}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: AI Brief + Residual Value */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* AI Market Brief */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: "uppercase" }}>AI Market Brief</span>
                <button
                  onClick={() => fetchAISummary(market, brand)}
                  disabled={aiLoading}
                  style={{ fontSize: 10, color: MUTED, background: "none", border: "none", cursor: aiLoading ? "default" : "pointer", fontFamily: "inherit" }}
                >
                  {aiLoading ? "…" : "↻"}
                </button>
              </div>
              {aiLoading ? (
                <div>
                  {[100, 90, 75].map((w, i) => (
                    <div key={i} style={{ height: 11, background: BORDER, borderRadius: 3, marginBottom: 6, width: `${w}%`, animation: "skeleton 1.5s infinite" }} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7 }}>{aiSummary || "Loading…"}</p>
              )}
            </div>

            {/* Residual Value */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, flex: 1 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 }}>Residual Value — {residualBrand}</span>
                <span style={{ fontSize: 10, color: DIM, marginLeft: 8 }}>% of MSRP retained</span>
              </div>
              {ageKeys.map(age => (
                <div key={age} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: MUTED }}>{age}</span>
                  </div>
                  <ResidualBar value={residualData[age]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price Trend Sparklines */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Price Trends — Last 6 Months (USD avg)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {sparkBrands.map(b => {
              const data = SPARKLINE_DATA[b] || [];
              const last = data[data.length - 1];
              const prev = data[data.length - 2];
              const dir = last > prev ? "up" : last < prev ? "down" : "flat";
              const color = dir === "up" ? "#48BB78" : dir === "down" ? "#FC8181" : MUTED;
              return (
                <div key={b} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TEXT }}>{b}</span>
                  <Sparkline data={data} color={color} />
                  <span style={{ fontSize: 11, color, fontWeight: 700 }}>
                    {dir === "up" ? "↑" : dir === "down" ? "↓" : "→"} ${(last / 1000).toFixed(1)}k
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: News feed */}
      <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <NewsFeed vertical="cars" />
      </div>
      <style>{`@keyframes skeleton{0%{opacity:0.6}50%{opacity:0.3}100%{opacity:0.6}}`}</style>
    </div>
  );
}
