import { useState, useRef, useEffect } from "react";

// ─── IMAGES ──────────────────────────────────────────────────────────────────
const IMGS = {
  cars:       ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=85","https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=85","https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=85","https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=85","https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=85"],
  realestate: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=85","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=85","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=85","https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=85"],
  hotels:     ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=85","https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=85","https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=85"],
  flights:    ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=85","https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&q=85","https://images.unsplash.com/photo-1540339832862-474599807836?w=800&q=85"],
  ecommerce:  ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=85","https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&q=85","https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=85"],
  news:       ["https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=85","https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=85"],
};
const getImg = (cat, i = 0) => (IMGS[cat] || IMGS.news)[i % (IMGS[cat]?.length || 1)];

// ─── REGIONS ─────────────────────────────────────────────────────────────────
const REGIONS = {
  Europe: {
    "🇩🇪 Germany":    { cars:["Mobile.de","AutoScout24","eBay Kleinanzeigen","Autohero","Heycar"], realestate:["ImmoScout24","Immowelt","Immonet","WG-Gesucht","Kleinanzeigen Immo"], ecommerce:["eBay.de","Amazon.de","Kleinanzeigen","Vinted DE","Rebuy"], flights:["Lufthansa","Eurowings","Ryanair","easyJet","Condor"], hotels:["Booking.com","HRS","Hotel.de","Expedia DE","Trivago"], news:["Spiegel Online","Zeit Online","FAZ","Süddeutsche","Bild"] },
    "🇫🇷 France":     { cars:["LaCentrale","AutoScout24.fr","LeBonCoin","Aramisauto","Motorway FR"], realestate:["SeLoger","LeBonCoin Immo","Bien'ici","PAP","Logic-Immo"], ecommerce:["Leboncoin","Vinted","Amazon.fr","Cdiscount","Fnac"], flights:["Air France","Transavia","easyJet","Vueling","Corsair"], hotels:["Booking.com","Accor","Logis Hotels","Expedia FR","Club Med"], news:["Le Monde","Le Figaro","Libération","20 Minutes","BFM TV"] },
    "🇬🇧 UK":         { cars:["AutoTrader UK","Motors.co.uk","Gumtree Cars","eBay Motors UK","CarWow"], realestate:["Rightmove","Zoopla","OnTheMarket","Spareroom","OpenRent"], ecommerce:["eBay UK","Gumtree","Vinted UK","Amazon UK","Depop"], flights:["British Airways","easyJet","Ryanair","Jet2","TUI Airways"], hotels:["Booking.com","Hotels.com","Expedia UK","Travelodge","Premier Inn"], news:["BBC News","The Guardian","Daily Mail","The Times","Sky News"] },
    "🇳🇱 Netherlands": { cars:["AutoTrack","Marktplaats","AutoScout24.nl","Gaspedaal","Autowereld"], realestate:["Funda","Pararius","Jaap","Huislijn","Kamernet"], ecommerce:["Bol.com","Marktplaats","Coolblue","Vinted NL","Amazon.nl"], flights:["KLM","Transavia","Corendon","TUI NL","easyJet"], hotels:["Booking.com","NH Hotels","Van der Valk","Bilderberg","Expedia NL"], news:["NU.nl","De Telegraaf","NRC","de Volkskrant","RTL Nieuws"] },
    "🇪🇸 Spain":      { cars:["Coches.net","AutoScout24.es","Wallapop","Milanuncios","Motor.es"], realestate:["Idealista","Fotocasa","Habitaclia","Pisos.com","Milanuncios Inmobiliaria"], ecommerce:["Wallapop","Milanuncios","Amazon.es","El Corte Inglés","Vinted ES"], flights:["Iberia","Vueling","Ryanair","Air Europa","Volotea"], hotels:["Booking.com","Meliá","NH Hotels","Paradores","Expedia ES"], news:["El País","El Mundo","La Vanguardia","ABC","Marca"] },
    "🇮🇹 Italy":      { cars:["Autoscout24.it","Subito.it","Automobile.it","Quattroruote","AlVolante"], realestate:["Immobiliare.it","Casa.it","Idealista.it","Subito Immobili","WikiCasa"], ecommerce:["Subito.it","Vinted.it","Amazon.it","eBay.it","Trovaprezzi"], flights:["ITA Airways","Ryanair","easyJet","Neos","Wizz Air"], hotels:["Booking.com","Best Western","UNA Hotels","Jolly Hotels","Expedia IT"], news:["Corriere della Sera","Repubblica","La Stampa","Il Sole 24 Ore","ANSA"] },
    "🇵🇱 Poland":     { cars:["OtoMoto","AutoScout24.pl","Allegro Motoryzacja","OLX Motoryzacja","Mobile.de PL"], realestate:["OtoDOM","Gratka","Morizon","Gumtree Nieruchomości","Domiporta"], ecommerce:["Allegro","OLX","Vinted PL","Amazon.pl","Ceneo"], flights:["LOT Polish","Ryanair","Wizz Air","easyJet","Eurowings"], hotels:["Booking.com","Orbis","Expedia PL","Trivago PL","Hotels.com"], news:["Onet","WP.pl","Gazeta.pl","TVN24","Rzeczpospolita"] },
    "🇸🇪 Sweden":     { cars:["Blocket Bilar","AutoScout24.se","Bytbil","Kvdbil","Wayke"], realestate:["Hemnet","Blocket Bostad","Booli","Bovision","SBAB Bostad"], ecommerce:["Blocket","Tradera","Amazon.se","CDON","Vinted SE"], flights:["SAS","Norwegian","Ryanair","easyJet","Wizz Air"], hotels:["Booking.com","Nordic Choice","Scandic","Elite Hotels","Expedia SE"], news:["Aftonbladet","Expressen","DN","SVT Nyheter","Omni"] },
  },
  Americas: {
    "🇺🇸 USA":      { cars:["Cars.com","AutoTrader","CarGurus","CarMax","Craigslist Autos"], realestate:["Zillow","Realtor.com","Redfin","Trulia","Apartments.com"], ecommerce:["eBay","Craigslist","Facebook Marketplace","OfferUp","Poshmark"], flights:["Delta","United","Southwest","American Airlines","Spirit"], hotels:["Marriott","Hilton","Airbnb","Hotels.com","Expedia"], news:["NYT","WSJ","Washington Post","CNN","NPR"] },
    "🇨🇦 Canada":   { cars:["AutoTrader.ca","Kijiji Autos","CarGurus.ca","Carpages","UsedCars.ca"], realestate:["Realtor.ca","Zolo","Royal LePage","Kijiji Real Estate","Rentals.ca"], ecommerce:["Kijiji","Facebook Marketplace","Amazon.ca","Poshmark CA","Varage Sale"], flights:["Air Canada","WestJet","Porter","Flair","Swoop"], hotels:["Booking.com","Marriott","Fairmont","Hotels.com","Airbnb"], news:["Globe and Mail","CBC","Toronto Star","National Post","CTV News"] },
    "🇧🇷 Brazil":   { cars:["iCarros","WebMotors","OLX Autos","Mercado Livre Carros","AutoLine"], realestate:["ZAP Imóveis","Viva Real","OLX Imóveis","Quinto Andar","Imovelweb"], ecommerce:["Mercado Livre","OLX","Shopee BR","Magazine Luiza","Americanas"], flights:["LATAM","Gol","Azul","Passagens Promo","123Milhas"], hotels:["Booking.com","Decolar","Airbnb","Hotels.com","Trivago BR"], news:["G1 Globo","Folha de S.Paulo","UOL","Terra","Estadão"] },
    "🇲🇽 Mexico":   { cars:["Mercado Libre Autos","Seminuevos","AutoCompara","OLX Autos MX","Kavak"], realestate:["Inmuebles24","Vivanuncios","Lamudi","Metros Cúbicos","OLX Inmuebles"], ecommerce:["Mercado Libre MX","OLX","Linio","Liverpool","Amazon.mx"], flights:["Aeroméxico","Volaris","VivaAerobus","Interjet","TAR Aerolíneas"], hotels:["Booking.com","Airbnb","Despegar","Hotels.com","Hoteles.com"], news:["El Universal","Reforma","Milenio","Animal Político","Proceso"] },
  },
  "Asia-Pacific": {
    "🇨🇳 China":     { cars:["Autohome (汽车之家)","BitAuto (易车)","Guazi (瓜子二手车)","Renrenche (人人车)","58Che (58车)"], realestate:["Anjuke (安居客)","Lianjia (链家)","Fang.com (房天下)","Beike (贝壳找房)","58.com (58同城)"], ecommerce:["Taobao (淘宝)","JD.com (京东)","Pinduoduo (拼多多)","Xianyu (闲鱼)","WeChat Shops"], flights:["Trip.com (携程)","Qunar (去哪儿)","Fliggy (飞猪)","Air China","China Eastern"], hotels:["Ctrip (携程)","Meituan (美团)","Qunar (去哪儿)","Trip.com","Agoda"], news:["Baidu News (百度新闻)","Tencent News (腾讯新闻)","NetEase News (网易新闻)","Sina News (新浪新闻)","Zhihu (知乎)"] },
    "🇯🇵 Japan":     { cars:["Goo-net","Car Sensor","Yahoo Auctions Japan","Carsensor.net","Carview"], realestate:["SUUMO","Homes.co.jp","AtHome","Chintai","LIFULL HOME'S"], ecommerce:["Yahoo Auctions Japan","Mercari","Rakuten","Amazon.jp","Mercari"], flights:["ANA","JAL","Peach","Jetstar Japan","Skymark"], hotels:["Jalan","Rakuten Travel","Agoda","Booking.com","Rurubu Travel"], news:["Nikkei","Asahi Shimbun","Yomiuri","NHK","Yahoo Japan News"] },
    "🇰🇷 South Korea": { cars:["Encar (엔카)","KB Chachacha (KB차차차)","Boacar (보아카)","HeyDealer","Carguru Korea"], realestate:["Zigbang (직방)","Dabang (다방)","Naver Real Estate","KB Liiv ON","Hogangnono (호갱노노)"], ecommerce:["Coupang (쿠팡)","Naver Shopping","Bunjang (번개장터)","Karrot (당근마켓)","Gmarket"], flights:["Korean Air","Asiana Airlines","Jeju Air","Jin Air","T'way Air"], hotels:["Yanolja (야놀자)","Goodchoice (여기어때)","Booking.com","Agoda","Naver Travel"], news:["Naver News","Kakao News","Chosun Ilbo","JoongAng Ilbo","Hani"] },
    "🇦🇺 Australia": { cars:["carsales.com.au","CarsGuide","Drive","Gumtree Cars","AutoTrader AU"], realestate:["realestate.com.au","Domain","Homely","Rent.com.au","Allhomes"], ecommerce:["Gumtree","eBay.com.au","Facebook Marketplace","Catch","Kogan"], flights:["Qantas","Virgin Australia","Jetstar","Rex Airlines","Bonza"], hotels:["Booking.com","Wotif","Airbnb","lastminute.com.au","Agoda"], news:["ABC News","The Australian","SMH","Herald Sun","The Guardian AU"] },
    "🇸🇬 Singapore": { cars:["sgCarMart","CarousellAutos","OneShift","Motorist.sg","STCars"], realestate:["PropertyGuru","99.co","EdgeProp","SRX","HDB Resale Portal"], ecommerce:["Carousell","Lazada","Shopee","Qoo10","Amazon.sg"], flights:["Singapore Airlines","Scoot","Jetstar Asia","AirAsia","Batik Air"], hotels:["Booking.com","Agoda","Hotels.com","Klook","Trip.com"], news:["CNA","Straits Times","Today","Mothership","The Independent SG"] },
  },
  "Middle East & Africa": {
    "🇦🇪 UAE":         { cars:["Dubizzle Cars","YallaMotor","AutoTrader UAE","Cars.com UAE","OpenSooq"], realestate:["Bayut","Dubizzle Property","PropertyFinder","Propertyfinder.ae","JustProperty"], ecommerce:["Dubizzle","Amazon.ae","Noon","Carrefour UAE","Namshi"], flights:["Emirates","Etihad","flydubai","Air Arabia","FlyNas"], hotels:["Booking.com","Agoda","Expedia","Hotels.com","Rotana"], news:["Gulf News","Khaleej Times","The National","Arabian Business","Al Arabiya"] },
    "🇸🇦 Saudi Arabia": { cars:["Syarah (سيارة)","Hatla2ee","OpenSooq","Motory","YallaMotor SA"], realestate:["Aqar (عقار)","Ejar (إيجار)","OpenSooq Realestate","Haraj","Wasalt"], ecommerce:["Noon","Amazon.sa","Jarir","Haraj (حراج)","Namshi"], flights:["Saudia","flynas","flyadeal","Air Arabia","Qatar Airways"], hotels:["Booking.com","Agoda","Expedia","Almosafer","Rehlat"], news:["Al Arabiya","Saudi Gazette","Arab News","Sabq (سبق)","Okaz (عكاظ)"] },
  },
};

const CATS = [
  { id:"cars",       label:"Cars",        icon:"🚗" },
  { id:"realestate", label:"Real Estate", icon:"🏠" },
  { id:"hotels",     label:"Hotels",      icon:"🏨" },
  { id:"flights",    label:"Flights",     icon:"✈️" },
  { id:"ecommerce",  label:"Shop",        icon:"🛍️" },
  { id:"news",       label:"News",        icon:"📰" },
];

const SPEC_ICONS = { Year:"📅",Mileage:"🔢",Fuel:"⛽",Gearbox:"⚙️",Power:"⚡",Registration:"📋",Owners:"👤",Color:"🎨",Type:"🏷️",Rooms:"🚪",Size:"📐",Beds:"🛏️",Floor:"🏢",Available:"📆",Garden:"🌿",Garage:"🚘",Stars:"⭐",Breakfast:"☕",Pool:"🏊",Condition:"✨",Age:"🕐",Box:"📦",Warranty:"🛡️",Topic:"📌",Region:"🌍",Read:"⏱️",Published:"📅",Duration:"⏱️",Stops:"✈️",Departs:"🕐",Bag:"🎒",Airline:"✈️",Meal:"🍽️",RAM:"💾",Storage:"💿",Guests:"👥",Class:"💺",Shipping:"📦",Seller:"👤",Style:"🎨",Bikes:"🚲" };

const CARD_HEIGHTS = [220, 260, 200, 280, 240, 210, 270, 230];

// ─── SUGGESTIONS ─────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "BMW 3 Series under €25,000", "2-bedroom apartment Berlin",
  "Weekend in Barcelona", "Tesla Model 3 used",
  "Cheap flights Amsterdam → Rome", "Villa Mallorca",
  "MacBook Pro M3", "Ski chalet Austria",
];

// ─── EYE LOGO ─────────────────────────────────────────────────────────────────
function EyeLogo({ size = 48, animate = false }) {
  return (
    <svg width={size} height={size * 0.58} viewBox="0 0 100 58" style={{ overflow:"visible" }}>
      {animate && (
        <circle cx="50" cy="29" r="28" fill="none" stroke="#1a1612" strokeWidth="0.8" opacity="0.15">
          <animate attributeName="r" values="24;38;24" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.15;0;0.15" dur="3s" repeatCount="indefinite"/>
        </circle>
      )}
      <path d="M3 29 Q50 -10 97 29 Q50 68 3 29Z" fill="none" stroke="#1a1612" strokeWidth="3"/>
      <circle cx="50" cy="29" r="14" fill="#1a1612"/>
      <circle cx="50" cy="29" r="6.5" fill="#faf8f5"/>
      <circle cx="54" cy="25" r="2.8" fill="#1a1612"/>
    </svg>
  );
}

// ─── SAVE BUTTON ─────────────────────────────────────────────────────────────
function SaveBtn() {
  const [on, setOn] = useState(false);
  return (
    <button onClick={e=>{e.stopPropagation();setOn(s=>!s);}} style={{
      background:"rgba(255,255,255,0.92)", backdropFilter:"blur(6px)",
      border:"none", borderRadius:"50%", width:34, height:34,
      display:"flex", alignItems:"center", justifyContent:"center",
      cursor:"pointer", fontSize:15,
      boxShadow:"0 1px 8px rgba(0,0,0,0.14)", transition:"transform 0.15s",
    }}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
    >{on ? "❤️" : "🤍"}</button>
  );
}

// ─── RESULT CARD ─────────────────────────────────────────────────────────────
function RBCard({ r, imgH, imgIndex }) {
  const [hovered, setHovered] = useState(false);
  const cat = CATS.find(c => c.id === r.category);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:"#fff", borderRadius:18, overflow:"hidden",
        border:"1px solid #f0ece8",
        boxShadow: hovered ? "0 20px 52px rgba(0,0,0,0.14)" : "0 2px 14px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-5px)" : "none",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        cursor:"pointer", display:"flex", flexDirection:"column", height:"100%",
      }}
    >
      {/* Image */}
      {r.category !== "news" && (
        <div style={{ position:"relative", height:imgH, flexShrink:0, overflow:"hidden" }}>
          <img src={getImg(r.category, imgIndex)} alt={r.title}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
              transform: hovered ? "scale(1.06)" : "scale(1)", transition:"transform 0.6s ease" }}
          />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 55%)" }}/>
          <div style={{ position:"absolute", top:10, right:10 }}><SaveBtn /></div>
          <div style={{ position:"absolute", bottom:10, left:12, right:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ background:"rgba(255,255,255,0.16)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.28)", color:"white", fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, letterSpacing:0.5 }}>{r.source}</span>
            {r.rating && <span style={{ background:"rgba(0,0,0,0.62)", backdropFilter:"blur(4px)", color:"white", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>★ {r.rating.toFixed(1)}</span>}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding:"14px 16px 16px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ background:"#f7f3ef", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600, color:"#7a6a5a" }}>
            {cat?.icon} {cat?.label}
          </span>
          <span style={{ fontSize:11, color:"#b5a99f" }}>📍 {r.location}</span>
        </div>

        <div style={{ fontSize:14, fontWeight:700, color:"#1a1612", lineHeight:1.4,
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {r.title}
        </div>

        {/* Specs */}
        {r.category === "cars" ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 10px", padding:"10px 12px", background:"#f7f4f1", borderRadius:12 }}>
            {Object.entries(r.details).map(([k,v]) => (
              <div key={k} style={{ display:"flex", flexDirection:"column", gap:1 }}>
                <span style={{ fontSize:9, color:"#b5a99f", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{SPEC_ICONS[k]||"·"} {k}</span>
                <span style={{ fontSize:12, color:"#1a1612", fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {Object.entries(r.details).map(([k,v]) => (
              <span key={k} style={{ fontSize:10, padding:"3px 9px", borderRadius:10, background:"#f4f0ec", display:"inline-flex", gap:4 }}>
                <span style={{ color:"#b5a99f" }}>{SPEC_ICONS[k]||""}</span>
                <span style={{ color:"#a89e94" }}>{k}</span>
                <span style={{ color:"#1a1612", fontWeight:700 }}>{v}</span>
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        {r.price ? (
          <div style={{ marginTop:"auto", paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid #f0ece8" }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:"#1a1612", letterSpacing:-0.5 }}>{r.price}</div>
              {r.reviews && <div style={{ fontSize:10, color:"#b5a99f" }}>★ {r.rating?.toFixed(1)} · {r.reviews.toLocaleString()} reviews</div>}
            </div>
            <button style={{ padding:"7px 16px", background:"#1a1612", border:"none", borderRadius:20, color:"white", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
              onMouseEnter={e=>e.currentTarget.style.background="#3d3530"}
              onMouseLeave={e=>e.currentTarget.style.background="#1a1612"}
            >View →</button>
          </div>
        ) : (
          <div style={{ marginTop:"auto", paddingTop:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#b5a99f" }}>{r.details?.Read || "Article"}</span>
            <button style={{ padding:"5px 12px", background:"none", border:"1px solid #ede9e4", borderRadius:20, color:"#7a6a5a", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Read →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CRAWL LOG ────────────────────────────────────────────────────────────────
function CrawlLog({ logs, query, country }) {
  return (
    <div style={{ marginTop:20, padding:"16px 20px", background:"white", borderRadius:16, border:"1px solid #f0ece8", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <EyeLogo size={22} animate={true} />
        <span style={{ fontSize:13, fontWeight:700, color:"#1a1612" }}>Argus is searching{country ? ` in ${country.replace(/^[^\s]+\s+/,"")}` : ""}…</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{ fontSize:12, color: i === logs.length-1 ? "#c4a882" : "#b5a99f", padding:"3px 0", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color: i === logs.length-1 ? "#c4a882" : "#4CAF50", fontSize:10 }}>
            {i === logs.length-1 ? "◌" : "✓"}
          </span>
          {log}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ArgusApp() {
  const [screen, setScreen]     = useState("home");
  const [query, setQuery]       = useState("");
  const [region, setRegion]     = useState("");
  const [country, setCountry]   = useState("");
  const [results, setResults]   = useState({});
  const [loading, setLoading]   = useState(false);
  const [logs, setLogs]         = useState([]);
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy]     = useState("relevance");
  const inputRef = useRef(null);

  // ── Custom sources (saved to profile via localStorage) ──
  const [customSources, setCustomSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem("argus_custom_sources") || "[]"); }
    catch { return []; }
  });
  const [newSourceUrl,  setNewSourceUrl]  = useState("");
  const [newSourceCat,  setNewSourceCat]  = useState("cars");
  const [addingSource,  setAddingSource]  = useState(false);
  const [sourceError,   setSourceError]   = useState("");

  const saveCustomSources = (list) => {
    setCustomSources(list);
    try { localStorage.setItem("argus_custom_sources", JSON.stringify(list)); } catch {}
  };

  const addCustomSource = () => {
    const raw = newSourceUrl.trim();
    if (!raw) { setSourceError("Please enter a URL or site name."); return; }
    // Extract a clean display name from URL
    let display = raw;
    try {
      const u = raw.startsWith("http") ? new URL(raw) : new URL("https://" + raw);
      display = u.hostname.replace(/^www\./, "");
    } catch {}
    if (customSources.find(s => s.display === display)) { setSourceError("Already added."); return; }
    const updated = [...customSources, { id: Date.now().toString(), url: raw, display, category: newSourceCat }];
    saveCustomSources(updated);
    setNewSourceUrl("");
    setSourceError("");
    setAddingSource(false);
  };

  const removeCustomSource = (id) => saveCustomSources(customSources.filter(s => s.id !== id));

  const countries = region ? Object.keys(REGIONS[region] || {}) : [];
  const allSources = (region && country)
    ? Object.values(REGIONS[region]?.[country] || {}).flat()
    : [];

  const addLog = (msg) => setLogs(l => [...l, msg]);

  const runSearch = async () => {
    if (!query.trim()) { inputRef.current?.focus(); return; }
    setLoading(true);
    setLogs([]);
    setResults({});

    const countryName   = country ? country.replace(/^[^\s]+\s+/, "") : null;
    const customNames   = customSources.map(s => `${s.display} (${CATS.find(c=>c.id===s.category)?.label||s.category})`);
    const sourceList    = [...(allSources.length ? allSources : ["global platforms"]), ...customSources.map(s=>s.display)];

    addLog(`Query received: "${query}"`);
    await new Promise(r => setTimeout(r, 350));
    addLog(`Identifying relevant categories…`);
    await new Promise(r => setTimeout(r, 400));
    addLog(`Dispatching agents to ${sourceList.length} sources${customSources.length ? ` (incl. ${customSources.length} custom)` : ""}…`);
    await new Promise(r => setTimeout(r, 450));

    const cats = CATS.map(c => ({
      id: c.id,
      sources: (region && country) ? (REGIONS[region]?.[country]?.[c.id] || []) : [],
    }));

    for (const c of cats.slice(0, 3)) {
      addLog(`Crawling ${c.id}: ${(c.sources.slice(0,2).join(", ") || "global")}…`);
      await new Promise(r => setTimeout(r, 300));
    }

    addLog(`AI synthesising results…`);
    await new Promise(r => setTimeout(r, 500));

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are the AI brain of Argus — a multi-source search platform with one search bar that searches everything at once.

User query: "${query}"
${countryName ? `Country/Region: ${countryName}` : "No specific region selected."}
${allSources.length ? `Built-in platforms: ${allSources.join(", ")}` : "Use global platforms."}
${customSources.length ? `User's custom sources (always generate at least 1 result from each of these): ${customNames.join(", ")}` : ""}

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
}`
          }]
        })
      });

      const data = await res.json();
      const txt  = data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(txt);

      // Group by category
      const grouped = {};
      parsed.forEach(r => {
        if (!grouped[r.category]) grouped[r.category] = [];
        grouped[r.category].push(r);
      });

      addLog(`Found ${parsed.length} results across ${Object.keys(grouped).length} categories ✓`);
      setResults({ grouped, query, country: countryName, total: parsed.length });

    } catch (e) {
      // Fallback demo grouped by category
      const grouped = {};
      DEMO_RESULTS.forEach(r => {
        if (!grouped[r.category]) grouped[r.category] = [];
        grouped[r.category].push(r);
      });
      addLog(`Showing demo results ✓`);
      setResults({ grouped, query, country: countryName, total: DEMO_RESULTS.length });
    }

    setLoading(false);
    setScreen("results");
  };

  // Flat list for filtering
  const allResults = results.grouped ? Object.values(results.grouped).flat() : [];
  const filtered   = filterCat === "all" ? allResults : allResults.filter(r => r.category === filterCat);
  const sorted     = [...filtered].sort((a,b) => {
    if (sortBy === "price_asc")  return (a.priceRaw||999999) - (b.priceRaw||999999);
    if (sortBy === "price_desc") return (b.priceRaw||0) - (a.priceRaw||0);
    if (sortBy === "rating")     return (b.rating||0) - (a.rating||0);
    return 0;
  });
  const catCounts = CATS.reduce((acc,c) => { acc[c.id] = allResults.filter(r=>r.category===c.id).length; return acc; }, {});

  return (
    <div style={{ minHeight:"100vh", background:"#faf8f5", fontFamily:"'DM Sans','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,button{font-family:inherit;}
        input:focus,select:focus{outline:none;}
        ::-webkit-scrollbar{height:3px;width:3px;}
        ::-webkit-scrollbar-thumb{background:#d4cfc9;border-radius:4px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .fu{animation:fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards;opacity:0;}
        button:focus{outline:none;}
        .sugg:hover{background:#f0ece8!important;color:#1a1612!important;}
        .tab-btn:hover{color:#1a1612!important;}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:300, background:"rgba(250,248,245,0.95)", backdropFilter:"blur(16px)", borderBottom:"1px solid #ede9e4", height:62, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>{setScreen("home");setResults({});setLogs([]);}}>
          <EyeLogo size={30} />
          <span style={{ fontSize:21, fontWeight:800, color:"#1a1612", letterSpacing:-0.8 }}>Argus</span>
        </div>

        {screen === "results" && (
          <div style={{ flex:1, maxWidth:420, margin:"0 24px", display:"flex", alignItems:"center", gap:8, border:"1.5px solid #ede9e4", borderRadius:40, padding:"8px 16px", background:"white", cursor:"pointer", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}
            onClick={()=>{setScreen("home");setLogs([]);}}>
            <EyeLogo size={18} />
            <span style={{ fontSize:13, color:"#7a6a5a", fontWeight:500, flex:1 }}>"{results.query}"</span>
            <span style={{ fontSize:12, color:"#c0b8b2" }}>Edit search</span>
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button style={{ background:"none", border:"none", fontSize:13, color:"#1a1612", fontWeight:600, cursor:"pointer", padding:"8px 14px", borderRadius:24 }}>Sign in</button>
          <div style={{ border:"1.5px solid #ede9e4", borderRadius:24, padding:"6px 8px 6px 14px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:"white" }}>
            <span style={{ fontSize:13, color:"#7a6a5a" }}>☰</span>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"#1a1612", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"white" }}>A</div>
          </div>
        </div>
      </nav>

      {/* ══ HOME ══ */}
      {screen === "home" && (
        <div style={{ maxWidth:660, margin:"0 auto", padding:"64px 20px 80px" }}>

          {/* Hero */}
          <div style={{ textAlign:"center", marginBottom:48 }} className="fu">
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <EyeLogo size={72} animate={true} />
            </div>
            <h1 style={{ fontSize:52, fontWeight:800, color:"#1a1612", letterSpacing:-2.5, lineHeight:1.06, marginBottom:14 }}>
              The all-seeing<br/>search.
            </h1>
            <p style={{ fontSize:16, color:"#a89e94", maxWidth:360, margin:"0 auto", lineHeight:1.7 }}>
              One search. Every platform. Cars, homes, flights, hotels, shops and news — all at once.
            </p>
          </div>

          {/* ── SEARCH CARD ── */}
          <div className="fu" style={{ animationDelay:"0.1s", background:"white", borderRadius:24, border:"1.5px solid #ede9e4", boxShadow:"0 8px 40px rgba(0,0,0,0.08)", overflow:"hidden" }}>

            {/* What Argus searches — icon strip */}
            <div style={{ display:"flex", justifyContent:"center", gap:0, borderBottom:"1px solid #f5f1ee", padding:"0 8px" }}>
              {CATS.map((c, i) => (
                <div key={c.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 4px 10px", borderRight: i < CATS.length-1 ? "1px solid #f5f1ee":"none" }}>
                  <span style={{ fontSize:18, marginBottom:3 }}>{c.icon}</span>
                  <span style={{ fontSize:9, color:"#c0b8b2", fontWeight:600, letterSpacing:0.5 }}>{c.label.toUpperCase()}</span>
                </div>
              ))}
            </div>

            <div style={{ padding:"24px" }}>

              {/* Region + Country */}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <div style={{ flex:1, position:"relative" }}>
                  <select value={region} onChange={e=>{setRegion(e.target.value);setCountry("");}} style={{ width:"100%", padding:"10px 30px 10px 12px", borderRadius:12, border:"1.5px solid #ede9e4", background:"white", fontSize:13, color:region?"#1a1612":"#b5a99f", fontFamily:"inherit", appearance:"none", cursor:"pointer" }}>
                    <option value="">🌍 Select Region (optional)</option>
                    {Object.keys(REGIONS).map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                  <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#c0b8b2", pointerEvents:"none", fontSize:10 }}>▾</span>
                </div>
                <div style={{ flex:1, position:"relative" }}>
                  <select value={country} onChange={e=>setCountry(e.target.value)} disabled={!region} style={{ width:"100%", padding:"10px 30px 10px 12px", borderRadius:12, border:"1.5px solid #ede9e4", background:region?"white":"#faf8f5", fontSize:13, color:country?"#1a1612":"#b5a99f", fontFamily:"inherit", appearance:"none", cursor:region?"pointer":"default", opacity:region?1:0.55 }}>
                    <option value="">📍 Select Country (optional)</option>
                    {countries.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#c0b8b2", pointerEvents:"none", fontSize:10 }}>▾</span>
                </div>
              </div>

              {/* Main search bar */}
              <div style={{ display:"flex", alignItems:"center", border:"2px solid #1a1612", borderRadius:50, overflow:"hidden", background:"white", marginBottom:12 }}>
                <span style={{ padding:"0 16px", fontSize:18, color:"#c0b8b2", flexShrink:0 }}>
                  <EyeLogo size={22} />
                </span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runSearch()}
                  placeholder="Search for anything — cars, homes, flights, deals…"
                  style={{ flex:1, border:"none", background:"transparent", padding:"15px 0", fontSize:15, color:"#1a1612", caretColor:"#c4a882" }}
                />
                <button onClick={runSearch} style={{ margin:"6px", padding:"10px 24px", background:"#1a1612", border:"none", borderRadius:40, color:"white", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0, transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#3d3530"}
                  onMouseLeave={e=>e.currentTarget.style.background="#1a1612"}
                >Search</button>
              </div>

              {/* Suggestions */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className="sugg" onClick={()=>{ setQuery(s); setTimeout(()=>inputRef.current?.focus(),50); }} style={{ padding:"5px 13px", background:"#f7f4f1", border:"1px solid #ede9e4", borderRadius:20, fontSize:12, color:"#7a6a5a", cursor:"pointer", transition:"all 0.15s" }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Platform preview */}
              {allSources.length > 0 && (
                <div style={{ marginTop:16, padding:"12px 14px", background:"#f7f4f1", borderRadius:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#c0b8b2", letterSpacing:1.2, marginBottom:8 }}>ARGUS WILL SEARCH ACROSS</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {allSources.map(s => (
                      <span key={s} style={{ fontSize:11, padding:"2px 9px", background:"white", border:"1px solid #ede9e4", borderRadius:20, color:"#7a6a5a" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CUSTOM SOURCES ── */}
              <div style={{ marginTop:16, border:"1.5px solid #ede9e4", borderRadius:16, overflow:"hidden" }}>
                {/* Header */}
                <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#faf8f5" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14 }}>🔗</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1612" }}>My Sources</div>
                      <div style={{ fontSize:11, color:"#b5a99f" }}>
                        {customSources.length === 0 ? "No custom sources yet" : `${customSources.length} saved · always included`}
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>{ setAddingSource(s=>!s); setSourceError(""); }} style={{
                    padding:"6px 14px", background: addingSource ? "#f0ece8" : "#1a1612",
                    border:"none", borderRadius:20, color: addingSource ? "#7a6a5a" : "white",
                    fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                  }}>
                    {addingSource ? "Cancel" : "+ Add source"}
                  </button>
                </div>

                {/* Add source form */}
                {addingSource && (
                  <div style={{ padding:"14px 16px", borderTop:"1px solid #f0ece8", background:"white" }}>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <input
                        value={newSourceUrl}
                        onChange={e=>{ setNewSourceUrl(e.target.value); setSourceError(""); }}
                        onKeyDown={e=>e.key==="Enter"&&addCustomSource()}
                        placeholder="e.g. willhaben.at or https://www.autoscout24.com"
                        style={{ flex:1, padding:"9px 14px", borderRadius:10, border:`1.5px solid ${sourceError?"#e74c3c":"#ede9e4"}`, fontSize:13, color:"#1a1612", background:"#faf8f5" }}
                        autoFocus
                      />
                      <select value={newSourceCat} onChange={e=>setNewSourceCat(e.target.value)} style={{
                        padding:"9px 28px 9px 12px", borderRadius:10, border:"1.5px solid #ede9e4",
                        background:"white", fontSize:12, color:"#1a1612", fontFamily:"inherit",
                        appearance:"none", cursor:"pointer", flexShrink:0,
                        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23b5a99f' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
                        backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
                      }}>
                        {CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                      </select>
                      <button onClick={addCustomSource} style={{
                        padding:"9px 18px", background:"#1a1612", border:"none", borderRadius:10,
                        color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0,
                      }}>Add</button>
                    </div>
                    {sourceError && <div style={{ fontSize:11, color:"#e74c3c" }}>{sourceError}</div>}
                    <div style={{ fontSize:11, color:"#c0b8b2" }}>Paste a website URL or domain name · Argus will always include it in every search</div>
                  </div>
                )}

                {/* Saved sources list */}
                {customSources.length > 0 && (
                  <div style={{ borderTop:"1px solid #f0ece8" }}>
                    {customSources.map((s, i) => {
                      const cat = CATS.find(c=>c.id===s.category);
                      return (
                        <div key={s.id} style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"10px 16px",
                          borderBottom: i < customSources.length-1 ? "1px solid #faf8f5" : "none",
                          background:"white", transition:"background 0.15s",
                        }}
                          onMouseEnter={e=>e.currentTarget.style.background="#faf8f5"}
                          onMouseLeave={e=>e.currentTarget.style.background="white"}
                        >
                          {/* Favicon */}
                          <div style={{ width:28, height:28, borderRadius:8, background:"#f4f0ec", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${s.display}&sz=32`}
                              alt=""
                              style={{ width:16, height:16 }}
                              onError={e=>{ e.target.style.display="none"; }}
                            />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:"#1a1612", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.display}</div>
                            <div style={{ fontSize:11, color:"#b5a99f" }}>{cat?.icon} {cat?.label}</div>
                          </div>
                          <span style={{ fontSize:10, padding:"2px 8px", background:"#f4f0ec", borderRadius:10, color:"#7a6a5a", fontWeight:600, flexShrink:0 }}>Custom</span>
                          <button onClick={()=>removeCustomSource(s.id)} style={{
                            background:"none", border:"none", cursor:"pointer",
                            fontSize:16, color:"#d4cfc9", padding:"2px 4px", lineHeight:1,
                            transition:"color 0.15s", flexShrink:0,
                          }}
                            onMouseEnter={e=>e.currentTarget.style.color="#e74c3c"}
                            onMouseLeave={e=>e.currentTarget.style.color="#d4cfc9"}
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading / crawl log */}
          {loading && <CrawlLog logs={logs} query={query} country={country} />}
        </div>
      )}

      {/* ══ RESULTS ══ */}
      {screen === "results" && (
        <div>
          {/* Category filter bar */}
          <div style={{ background:"rgba(250,248,245,0.96)", borderBottom:"1px solid #ede9e4", padding:"0 32px", display:"flex", alignItems:"center", gap:0, overflowX:"auto", scrollbarWidth:"none" }}>
            {[{id:"all", label:"All", icon:"◉"}, ...CATS].map(c => {
              const cnt = c.id==="all" ? allResults.length : catCounts[c.id];
              if (c.id !== "all" && !cnt) return null;
              const on  = filterCat === c.id;
              return (
                <button key={c.id} className="tab-btn" onClick={()=>setFilterCat(c.id)} style={{ padding:"16px 18px 14px", border:"none", background:"none", fontSize:13, fontWeight:on?700:500, color:on?"#1a1612":"#a89e94", borderBottom:on?"2.5px solid #1a1612":"2.5px solid transparent", cursor:"pointer", whiteSpace:"nowrap", transition:"color 0.15s" }}>
                  {c.icon} {c.label}
                  {cnt > 0 && <span style={{ fontSize:11, color:on?"#7a6a5a":"#c0b8b2", marginLeft:5 }}>{cnt}</span>}
                </button>
              );
            })}
            <div style={{ marginLeft:"auto", flexShrink:0, paddingLeft:16, display:"flex", gap:8, alignItems:"center" }}>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:"7px 12px", border:"1.5px solid #ede9e4", borderRadius:10, fontSize:12, color:"#7a6a5a", background:"white", cursor:"pointer", fontFamily:"inherit" }}>
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Results summary */}
          <div style={{ padding:"22px 40px 4px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <span style={{ fontSize:15, color:"#1a1612", fontWeight:700 }}>{allResults.length} results</span>
              <span style={{ fontSize:13, color:"#a89e94" }}> for "{results.query}"
              {results.country ? ` · ${results.country}` : ""}
              {" · "}{new Set(allResults.map(r=>r.source)).size} platforms
              {customSources.length > 0 ? ` · ${customSources.length} custom` : ""}</span>
            </div>
          </div>

          {/* Cards */}
          {filterCat === "all" ? (
            // All — horizontal scrolling rows per category (RedBook)
            <div style={{ padding:"16px 0 60px" }}>
              {CATS.map(cat => {
                const items = (results.grouped?.[cat.id] || []);
                if (!items.length) return null;
                return (
                  <div key={cat.id} style={{ marginBottom:36 }}>
                    <div style={{ padding:"0 40px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <h2 style={{ fontSize:16, fontWeight:700, color:"#1a1612" }}>
                        {cat.icon} {cat.label}
                        <span style={{ fontSize:12, color:"#c0b8b2", fontWeight:500, marginLeft:6 }}>({items.length})</span>
                      </h2>
                      <button onClick={()=>setFilterCat(cat.id)} style={{ background:"none", border:"none", fontSize:12, color:"#c4a882", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        See all →
                      </button>
                    </div>
                    <div style={{ display:"flex", gap:14, overflowX:"auto", paddingLeft:40, paddingRight:40, paddingBottom:10, scrollbarWidth:"none" }}>
                      {items.map((r, i) => (
                        <div key={r.id} className="fu" style={{ animationDelay:`${i*0.07}s`, flexShrink:0, width: cat.id==="news" ? 300 : 250 }}>
                          <RBCard r={r} imgH={CARD_HEIGHTS[i % CARD_HEIGHTS.length]} imgIndex={i} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Single category — masonry grid
            <div style={{ padding:"20px 40px 60px", columns:"3 250px", columnGap:16 }}>
              {sorted.map((r, i) => (
                <div key={r.id} className="fu" style={{ animationDelay:`${i*0.05}s`, breakInside:"avoid", marginBottom:16, display:"block" }}>
                  <RBCard r={r} imgH={CARD_HEIGHTS[i % CARD_HEIGHTS.length]} imgIndex={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DEMO FALLBACK ────────────────────────────────────────────────────────────
const DEMO_RESULTS = [
  { id:"d1",  category:"cars",       title:"BMW 320d xDrive Sport Line",            source:"Mobile.de",    price:"€28,900", priceRaw:28900,  location:"Munich, DE",    description:"Full service history, panoramic roof, one owner.", details:{ Year:"2021", Mileage:"48,000 km", Fuel:"Diesel", Gearbox:"Automatic", Registration:"03/2021", Owners:"1" }, rating:4.8, reviews:124 },
  { id:"d2",  category:"cars",       title:"Volkswagen Golf 8 GTI 2.0 TSI",         source:"AutoScout24",  price:"€34,500", priceRaw:34500,  location:"Berlin, DE",    description:"Digital cockpit, CarPlay, sport pack included.", details:{ Year:"2022", Mileage:"22,000 km", Fuel:"Petrol", Gearbox:"Manual", Power:"245 PS", Registration:"07/2022" }, rating:4.9, reviews:87 },
  { id:"d3",  category:"cars",       title:"Mercedes-Benz C 220d AMG Line",         source:"Mobile.de",    price:"€41,800", priceRaw:41800,  location:"Frankfurt, DE", description:"AMG pack, 360° camera, Burmester audio system.", details:{ Year:"2022", Mileage:"31,000 km", Fuel:"Diesel", Gearbox:"Automatic", Registration:"11/2022", Owners:"1" }, rating:4.7, reviews:56 },
  { id:"d4",  category:"realestate", title:"Bright 3-Room Altbau · Prenzlauer Berg",source:"ImmoScout24",  price:"€1,850/mo",priceRaw:1850,  location:"Berlin, DE",    description:"Renovated with balcony, fitted kitchen, parquet floors.", details:{ Type:"Rent", Rooms:"3", Size:"78 m²", Floor:"3rd", Available:"Apr 1" }, rating:4.9, reviews:42 },
  { id:"d5",  category:"realestate", title:"Townhouse with Garden · Sachsenhausen", source:"Immowelt",     price:"€620,000",priceRaw:620000, location:"Frankfurt, DE", description:"4-bed townhouse, south garden, double garage.", details:{ Type:"Buy", Beds:"4", Size:"130 m²", Garden:"Yes", Garage:"2 cars" }, rating:4.6, reviews:18 },
  { id:"d6",  category:"hotels",     title:"Hotel Adlon Kempinski Berlin",           source:"Booking.com",  price:"€320/night",priceRaw:320,  location:"Berlin, DE",    description:"5-star icon next to Brandenburg Gate. Spa & pool.", details:{ Stars:"5★", Rating:"9.2", Breakfast:"Incl.", Pool:"Yes" }, rating:4.95, reviews:3241 },
  { id:"d7",  category:"hotels",     title:"25Hours Hotel The Circle",               source:"HRS",          price:"€98/night", priceRaw:98,   location:"Cologne, DE",   description:"Design boutique with rooftop bar and free bikes.", details:{ Stars:"4★", Rating:"8.7", Style:"Boutique", Bikes:"Free" }, rating:4.7, reviews:891 },
  { id:"d8",  category:"flights",    title:"Berlin → Barcelona · Fri 14 Mar",        source:"Ryanair",      price:"€49",       priceRaw:49,   location:"BER → BCN",     description:"Direct 2h 45min. Cabin bag included. 07:10 dep.", details:{ Duration:"2h 45m", Stops:"Direct", Departs:"07:10", Bag:"Cabin incl." }, rating:3.9, reviews:5200 },
  { id:"d9",  category:"flights",    title:"Munich → Amsterdam · Sun 16 Mar",        source:"Lufthansa",    price:"€118",      priceRaw:118,  location:"MUC → AMS",     description:"Flexi-ticket, full meal service.", details:{ Duration:"1h 55m", Stops:"Direct", Airline:"Lufthansa", Meal:"Yes" }, rating:4.5, reviews:8100 },
  { id:"d10", category:"ecommerce",  title:"Apple MacBook Pro M3 14\" — Like New",   source:"Kleinanzeigen",price:"€1,650",    priceRaw:1650, location:"Hamburg, DE",   description:"Dec 2023, barely used. All accessories + AppleCare.", details:{ Condition:"Like New", RAM:"18 GB", Storage:"512 GB", Age:"3 months" }, rating:4.8, reviews:1 },
  { id:"d11", category:"news",       title:"German Housing Market: What to Expect in 2025", source:"Spiegel Online", price:null, priceRaw:null, location:"Germany", description:"Analysts predict rental prices will stabilise in Q2 as construction picks up.", details:{ Topic:"Real Estate", Region:"Germany", Read:"4 min", Published:"Today" }, rating:null, reviews:null },
  { id:"d12", category:"news",       title:"EV Sales in Europe Hit Record High in February", source:"Zeit Online", price:null, priceRaw:null, location:"Europe", description:"Electric vehicles now account for 28% of new car sales across the EU.", details:{ Topic:"Automotive", Region:"Europe", Read:"3 min", Published:"Yesterday" }, rating:null, reviews:null },
];
