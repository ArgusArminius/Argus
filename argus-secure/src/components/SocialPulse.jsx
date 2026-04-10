import { useState, useEffect, useRef, useCallback } from "react";
import { callArgusAI } from "../utils/api.js";

const GOLD = "#C9A84C";
const CARD = "#131920";
const BORDER = "#1E2A38";
const TEXT = "#E8EDF2";
const MUTED = "#8A9BB0";
const DIM = "#3D5166";

const REGIONS = ["China", "US", "Europe", "Japan", "UAE"];

const PLATFORMS = [
  { id: "xhs",      label: "XHS",       icon: "🍠", region: "China", color: "#FF2D55" },
  { id: "wechat",   label: "WeChat",    icon: "💚", region: "China", color: "#07C160" },
  { id: "weibo",    label: "Weibo",     icon: "🔴", region: "China", color: "#E6162D" },
  { id: "douyin",   label: "Douyin",    icon: "🎵", region: "China", color: "#010101" },
  { id: "tiktok",   label: "TikTok",    icon: "🎵", region: "Global", color: "#010101" },
  { id: "instagram",label: "Instagram", icon: "📸", region: "Global", color: "#E1306C" },
  { id: "youtube",  label: "YouTube",   icon: "▶️", region: "Global", color: "#FF0000" },
  { id: "reddit",   label: "Reddit",    icon: "🤖", region: "US", color: "#FF4500" },
  { id: "x",        label: "X",         icon: "𝕏",  region: "Global", color: "#000000" },
  { id: "facebook", label: "Facebook",  icon: "👤", region: "Global", color: "#1877F2" },
];

// Simulated platform activity heatmap (hour 6-24 × Mon-Sun)
// Values 0-100 representing activity level
function generateActivityHeatmap(platformId) {
  const seed = platformId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hours = Array.from({ length: 18 }, (_, h) => h + 6); // 06:00 - 23:00
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, di) =>
    hours.map((hour, hi) => {
      let base = 40;
      if (hour >= 12 && hour <= 14) base += 20;
      if (hour >= 19 && hour <= 22) base += 30;
      if (di >= 5) base += 10; // weekends
      if (platformId === "douyin" || platformId === "tiktok") {
        if (hour >= 20 && hour <= 23) base += 20;
      }
      const noise = ((seed * (di + 1) * (hi + 1)) % 29) - 14;
      return Math.max(5, Math.min(100, base + noise));
    })
  );
}

// Fallback trending topics per platform/region
const FALLBACK_TOPICS = {
  China: [
    { topic: "EV market expansion", hashtag: "#新能源汽车", sentiment: "bullish", momentum: "up" },
    { topic: "Housing policy easing", hashtag: "#楼市政策", sentiment: "neutral", momentum: "up" },
    { topic: "AI chip development", hashtag: "#芯片国产化", sentiment: "bullish", momentum: "up" },
    { topic: "Luxury goods slowdown", hashtag: "#奢侈品消费", sentiment: "bearish", momentum: "down" },
    { topic: "Cross-border e-commerce", hashtag: "#跨境电商", sentiment: "bullish", momentum: "up" },
    { topic: "Tourism recovery", hashtag: "#旅游复苏", sentiment: "bullish", momentum: "up" },
    { topic: "Real estate developers", hashtag: "#地产债务", sentiment: "bearish", momentum: "flat" },
    { topic: "Semiconductor exports", hashtag: "#半导体", sentiment: "neutral", momentum: "up" },
  ],
  US: [
    { topic: "Fed rate outlook", hashtag: "#FedPolicy", sentiment: "neutral", momentum: "flat" },
    { topic: "EV adoption trends", hashtag: "#EVs", sentiment: "bullish", momentum: "up" },
    { topic: "Housing affordability", hashtag: "#HousingCrisis", sentiment: "bearish", momentum: "flat" },
    { topic: "AI stock rally", hashtag: "#AIStocks", sentiment: "bullish", momentum: "up" },
    { topic: "Crypto ETF flows", hashtag: "#BitcoinETF", sentiment: "bullish", momentum: "up" },
    { topic: "Retail inventory glut", hashtag: "#Retail", sentiment: "bearish", momentum: "down" },
    { topic: "Travel demand surge", hashtag: "#TravelBoom", sentiment: "bullish", momentum: "up" },
    { topic: "Auto loan delinquencies", hashtag: "#AutoLoans", sentiment: "bearish", momentum: "down" },
  ],
  Europe: [
    { topic: "EV mandate pressure", hashtag: "#GreenDeal", sentiment: "neutral", momentum: "flat" },
    { topic: "ECB rate decision", hashtag: "#ECB", sentiment: "neutral", momentum: "flat" },
    { topic: "German recession fears", hashtag: "#GermanyGDP", sentiment: "bearish", momentum: "down" },
    { topic: "Luxury tourism boom", hashtag: "#LuxuryTravel", sentiment: "bullish", momentum: "up" },
    { topic: "Chinese EV tariffs", hashtag: "#EVTariffs", sentiment: "bearish", momentum: "flat" },
    { topic: "Housing starts rebound", hashtag: "#PropertyEU", sentiment: "neutral", momentum: "up" },
    { topic: "Energy transition", hashtag: "#EnergyEU", sentiment: "neutral", momentum: "up" },
    { topic: "Luxury spending resilience", hashtag: "#Luxury", sentiment: "bullish", momentum: "up" },
  ],
  Japan: [
    { topic: "Yen weakness", hashtag: "#円安", sentiment: "bearish", momentum: "down" },
    { topic: "Tourism inbound surge", hashtag: "#訪日外国人", sentiment: "bullish", momentum: "up" },
    { topic: "Toyota hybrid demand", hashtag: "#ハイブリッド", sentiment: "bullish", momentum: "up" },
    { topic: "Real estate foreigners", hashtag: "#不動産投資", sentiment: "neutral", momentum: "up" },
    { topic: "BOJ rate hike", hashtag: "#日銀", sentiment: "neutral", momentum: "flat" },
    { topic: "Luxury goods imports", hashtag: "#ブランド品", sentiment: "neutral", momentum: "flat" },
    { topic: "Semiconductor revival", hashtag: "#半導体", sentiment: "bullish", momentum: "up" },
    { topic: "EV adoption slow", hashtag: "#電気自動車", sentiment: "bearish", momentum: "flat" },
  ],
  UAE: [
    { topic: "Dubai property surge", hashtag: "#DubaiRealEstate", sentiment: "bullish", momentum: "up" },
    { topic: "Golden visa demand", hashtag: "#GoldenVisa", sentiment: "bullish", momentum: "up" },
    { topic: "Luxury car market", hashtag: "#LuxuryCars", sentiment: "bullish", momentum: "up" },
    { topic: "Crypto hub ambitions", hashtag: "#DubaiCrypto", sentiment: "bullish", momentum: "up" },
    { topic: "Tourism records", hashtag: "#VisitDubai", sentiment: "bullish", momentum: "up" },
    { topic: "Oil price sensitivity", hashtag: "#OPEC", sentiment: "neutral", momentum: "flat" },
    { topic: "E-commerce expansion", hashtag: "#NoonShopping", sentiment: "bullish", momentum: "up" },
    { topic: "AI investment zone", hashtag: "#AIHub", sentiment: "bullish", momentum: "up" },
  ],
};

// Viral content per region
const VIRAL_CONTENT = {
  China: [
    { platform: "XHS", icon: "🍠", headline: "BYD Seagull EV review goes viral — 8M views in 48h", engagement: "8.2M", sentiment: "bullish" },
    { platform: "Douyin", icon: "🎵", headline: "Luxury apartment tour in Shenzhen sparks debate on housing costs", engagement: "5.4M", sentiment: "neutral" },
    { platform: "Weibo", icon: "🔴", headline: "NIO's battery swap network expansion announcement trending", engagement: "3.1M", sentiment: "bullish" },
    { platform: "WeChat", icon: "💚", headline: "Cross-border travel spike to Japan — hotel prices surge thread", engagement: "2.8M", sentiment: "neutral" },
    { platform: "Bilibili", icon: "📺", headline: "DeepSeek AI chip benchmarks vs NVIDIA — 4M views", engagement: "4.1M", sentiment: "bullish" },
  ],
  US: [
    { platform: "X", icon: "𝕏", headline: "Tesla price cuts spark 'EV price war' debate — 45K reposts", engagement: "1.2M", sentiment: "bearish" },
    { platform: "Reddit", icon: "🤖", headline: "r/personalfinance: 'Is now a good time to buy a house?' — 28K comments", engagement: "890K", sentiment: "neutral" },
    { platform: "YouTube", icon: "▶️", headline: "Rivian R2 full reveal — 6.8M views in 72h", engagement: "6.8M", sentiment: "bullish" },
    { platform: "Instagram", icon: "📸", headline: "Miami penthouses listed at $40M going viral in real estate accounts", engagement: "450K", sentiment: "neutral" },
    { platform: "TikTok", icon: "🎵", headline: "'I make $80K and can't afford rent' video sparks housing debate", engagement: "12.4M", sentiment: "bearish" },
  ],
  Europe: [
    { platform: "X", icon: "𝕏", headline: "EU EV tariff debate — BYD response goes viral across tech community", engagement: "780K", sentiment: "neutral" },
    { platform: "Instagram", icon: "📸", headline: "Barcelona Airbnb ban protests attract global attention", engagement: "2.1M", sentiment: "bearish" },
    { platform: "YouTube", icon: "▶️", headline: "BMW vs BYD head-to-head comparison — 4.2M views", engagement: "4.2M", sentiment: "neutral" },
    { platform: "Reddit", icon: "🤖", headline: "r/europe: 'German auto industry crisis — what happened?'", engagement: "340K", sentiment: "bearish" },
    { platform: "TikTok", icon: "🎵", headline: "South of France property prices shocking Gen Z — 8.9M views", engagement: "8.9M", sentiment: "bearish" },
  ],
  Japan: [
    { platform: "X", icon: "𝕏", headline: "Yen at 155 — foreign real estate buyers flooding Tokyo market thread", engagement: "520K", sentiment: "neutral" },
    { platform: "YouTube", icon: "▶️", headline: "Japan tourism guide for foreigners — 12M views this month", engagement: "12M", sentiment: "bullish" },
    { platform: "Instagram", icon: "📸", headline: "Kyoto sakura season packed — overtourism debate goes global", engagement: "3.8M", sentiment: "neutral" },
    { platform: "Reddit", icon: "🤖", headline: "r/JapanFinance: buying property as a foreigner — record traffic", engagement: "280K", sentiment: "bullish" },
    { platform: "TikTok", icon: "🎵", headline: "'I moved to Japan for $1,200/mo rent' video — 22M views", engagement: "22M", sentiment: "bullish" },
  ],
  UAE: [
    { platform: "Instagram", icon: "📸", headline: "Palm Jumeirah penthouse listed at $65M — viral luxury listing", engagement: "4.2M", sentiment: "bullish" },
    { platform: "X", icon: "𝕏", headline: "Dubai real estate beats London and New York — ROI thread goes viral", engagement: "890K", sentiment: "bullish" },
    { platform: "TikTok", icon: "🎵", headline: "'Moving to Dubai from UK — my $3K/mo lifestyle' — 18M views", engagement: "18M", sentiment: "bullish" },
    { platform: "YouTube", icon: "▶️", headline: "Ferrari vs Lamborghini on Dubai streets compilation — 9M views", engagement: "9M", sentiment: "neutral" },
    { platform: "Instagram", icon: "📸", headline: "Expo 2030 Riyadh preview — regional investor interest spiking", engagement: "1.8M", sentiment: "bullish" },
  ],
};

const SENTIMENT_COLOR = { bullish: "#48BB78", neutral: "#C9A84C", bearish: "#FC8181" };
const MOMENTUM_ICON = { up: "↑", down: "↓", flat: "→" };
const MOMENTUM_COLOR = { up: "#48BB78", down: "#FC8181", flat: MUTED };

function SentimentGauge({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct > 65 ? "#48BB78" : pct > 40 ? GOLD : "#FC8181";
  const angle = (pct / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const nx = 50 + 35 * Math.sin(rad);
  const ny = 50 - 35 * Math.cos(rad);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={100} height={58} viewBox="0 0 100 60">
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke={BORDER} strokeWidth={8} strokeLinecap="round" />
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 126} 126`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <line x1="50" y1="50" x2={nx} y2={ny} stroke={color} strokeWidth={2} strokeLinecap="round" style={{ transition: "all 0.8s ease" }} />
        <circle cx="50" cy="50" r="3" fill={color} />
        <text x="50" y="38" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{pct}</text>
      </svg>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, textTransform: "uppercase" }}>
        {pct > 65 ? "Positive" : pct > 40 ? "Neutral" : "Negative"} Sentiment
      </div>
    </div>
  );
}

function ActivityHeatmap({ platformId }) {
  const data = generateActivityHeatmap(platformId);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = ["6am", "", "", "9am", "", "", "12pm", "", "", "3pm", "", "", "6pm", "", "", "9pm", "", "11pm"];
  const maxVal = 100;

  return (
    <div style={{ overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `28px repeat(18, 1fr)`, gap: 2, fontSize: 8, color: DIM, alignItems: "center", marginBottom: 4 }}>
        <div />
        {hours.map((h, i) => <div key={i} style={{ textAlign: "center" }}>{h}</div>)}
      </div>
      {days.map((day, di) => (
        <div key={day} style={{ display: "grid", gridTemplateColumns: `28px repeat(18, 1fr)`, gap: 2, marginBottom: 2, alignItems: "center" }}>
          <div style={{ fontSize: 8, color: DIM, textAlign: "right", paddingRight: 4 }}>{day}</div>
          {data[di].map((val, hi) => {
            const alpha = Math.round((val / maxVal) * 200).toString(16).padStart(2, "0");
            return (
              <div key={hi} style={{
                height: 10, borderRadius: 1,
                background: `#C9A84C${alpha}`,
                transition: "background 0.2s",
              }} title={`${day} ${6 + hi}:00 — activity ${val}`} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function SocialPulse() {
  const [region, setRegion] = useState("China");
  const [activePlatform, setActivePlatform] = useState("weibo");
  const [topics, setTopics] = useState(null);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [sentimentScore, setSentimentScore] = useState(62);
  const cacheRef = useRef({});
  const refreshTimerRef = useRef(null);

  const platform = PLATFORMS.find(p => p.id === activePlatform) || PLATFORMS[0];
  const viralItems = VIRAL_CONTENT[region] || VIRAL_CONTENT.China;
  const fallbackTopics = FALLBACK_TOPICS[region] || FALLBACK_TOPICS.China;

  async function fetchTopics(reg, plat) {
    const cacheKey = `${reg}-${plat}`;
    if (cacheRef.current[cacheKey]) {
      setTopics(cacheRef.current[cacheKey]);
      return;
    }
    setTopicsLoading(true);
    const systemPrompt = "You are Argus social intelligence. Generate realistic trending topics. Return ONLY valid JSON array.";
    const prompt = `Generate 8 trending topics on ${plat} in ${reg} today related to automotive, real estate, consumer goods, or economic news. Return JSON array: [{"topic":"...","hashtag":"...","sentiment":"bullish|neutral|bearish","momentum":"up|down|flat"}]`;
    try {
      const result = await callArgusAI(prompt, systemPrompt, 600);
      const data = Array.isArray(result) ? result : fallbackTopics;
      setTopics(data);
      cacheRef.current[cacheKey] = data;
      // Compute sentiment from topics
      const bullish = data.filter(t => t.sentiment === "bullish").length;
      const bearish = data.filter(t => t.sentiment === "bearish").length;
      const score = Math.round(40 + (bullish - bearish) * 8);
      setSentimentScore(Math.max(10, Math.min(95, score)));
    } catch {
      setTopics(fallbackTopics);
      setSentimentScore(62);
    }
    setTopicsLoading(false);
  }

  useEffect(() => {
    setTopics(null);
    fetchTopics(region, platform.label);
    // Refresh every 15 min
    clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => {
      const key = `${region}-${platform.label}`;
      delete cacheRef.current[key];
      fetchTopics(region, platform.label);
    }, 15 * 60 * 1000);
    return () => clearInterval(refreshTimerRef.current);
  }, [region, activePlatform]);

  const displayTopics = topics || fallbackTopics;

  const hashtagUrl = (platform, hashtag) => {
    const tag = hashtag.replace(/^#/, "");
    const urls = {
      weibo: `https://s.weibo.com/weibo?q=%23${encodeURIComponent(tag)}%23`,
      xhs: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(tag)}`,
      douyin: `https://www.douyin.com/search/${encodeURIComponent(tag)}`,
      wechat: `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(tag)}`,
      tiktok: `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`,
      instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`,
      x: `https://x.com/search?q=%23${encodeURIComponent(tag)}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(tag)}`,
      reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(tag)}`,
      facebook: `https://www.facebook.com/search/posts?q=${encodeURIComponent(tag)}`,
    };
    return urls[platform] || `https://www.google.com/search?q=${encodeURIComponent(hashtag)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Region tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegion(r)} style={{
            padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
            fontSize: 12, fontWeight: region === r ? 700 : 400,
            background: region === r ? GOLD : CARD,
            border: `1px solid ${region === r ? GOLD : BORDER}`,
            color: region === r ? "#0C0F14" : MUTED,
          }}>{r}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Platform tabs + topic list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Platform selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setActivePlatform(p.id)} style={{
                padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
                fontSize: 11, fontWeight: activePlatform === p.id ? 700 : 400,
                background: activePlatform === p.id ? "#1E2A38" : "transparent",
                border: `1px solid ${activePlatform === p.id ? MUTED : BORDER}`,
                color: activePlatform === p.id ? TEXT : DIM,
              }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Trending topics */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>
                {platform.icon} {platform.label} Trending — {region}
              </span>
              <button onClick={() => { delete cacheRef.current[`${region}-${platform.label}`]; fetchTopics(region, platform.label); }}
                style={{ fontSize: 10, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                {topicsLoading ? "…" : "↻"}
              </button>
            </div>
            <div style={{ maxHeight: 280, overflow: "auto" }}>
              {displayTopics.map((topic, i) => (
                <a key={i} href={hashtagUrl(activePlatform, topic.hashtag)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1E2A38"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 10, color: DIM, width: 18 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{topic.topic}</div>
                      <span style={{ fontSize: 10, color: GOLD }}>{topic.hashtag}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <span style={{ fontSize: 10, color: SENTIMENT_COLOR[topic.sentiment] || MUTED, fontWeight: 600 }}>
                        {topic.sentiment}
                      </span>
                      <span style={{ fontSize: 12, color: MOMENTUM_COLOR[topic.momentum] || MUTED, fontWeight: 700 }}>
                        {MOMENTUM_ICON[topic.momentum] || "→"}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment + Activity Heatmap */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Sentiment meter */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 20 }}>
            <SentimentGauge score={sentimentScore} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Social Sentiment</div>
              <div style={{ fontSize: 12, color: MUTED }}>
                {region} · All platforms<br />
                <span style={{ color: TEXT, fontWeight: 600 }}>
                  {sentimentScore > 65 ? "Predominantly positive signals" :
                   sentimentScore > 40 ? "Mixed sentiment — monitor closely" :
                   "Negative pressure detected"}
                </span>
              </div>
            </div>
          </div>

          {/* Activity heatmap */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
              {platform.icon} {platform.label} — 7-Day Activity Heatmap
            </div>
            <ActivityHeatmap platformId={activePlatform} />
          </div>
        </div>
      </div>

      {/* Viral content tracker */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>🔥 Viral Content — {region}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 0 }}>
          {viralItems.map((item, i) => (
            <div key={i} style={{ padding: "12px 16px", borderRight: "1px solid #1E2A38", borderBottom: "1px solid #1E2A38" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: MUTED }}>{item.platform}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${SENTIMENT_COLOR[item.sentiment]}20`, color: SENTIMENT_COLOR[item.sentiment], fontWeight: 700 }}>
                  {item.sentiment}
                </span>
              </div>
              <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.45, marginBottom: 8 }}>{item.headline}</div>
              <div style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>{item.engagement} engagements</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
