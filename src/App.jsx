import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { BookOpen, Bell, Receipt, Star, ChevronRight, Check, ArrowLeft, Utensils, Clock, Volume2, VolumeX, TrendingUp, Search, Leaf, ShoppingBag, X, Plus, Minus, Trash2, Sparkles, Shuffle, RotateCcw } from 'lucide-react';

const SUPABASE_URL = 'https://mljuvibendzmxbyelpcu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sanV2aWJlbmR6bXhieWVscGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjU5MTYsImV4cCI6MjEwMjA0MTkxNn0.lxNfqIvcmyx99jzRpluoZGWbm_qK-3QfEk8zMbKWYZA';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Work+Sans:wght@400;500;600&display=swap');`;

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.method === 'POST' ? { Prefer: 'return=representation' } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

const GlobalStyles = () => (
  <>
    <style>{FONT_IMPORT}</style>
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; }
      @keyframes pulse-ring { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
      @keyframes pulse-urgent { 0%, 100% { box-shadow: 0 0 0 0 rgba(214,80,60,0.35); } 50% { box-shadow: 0 0 0 6px rgba(214,80,60,0); } }
      .wave-bar { animation: pulse-ring 2.2s ease-in-out infinite; }
      .wave-bar:nth-child(2) { animation-delay: 0.15s; }
      .wave-bar:nth-child(3) { animation-delay: 0.3s; }
      .row-press:active { background: rgba(201,162,75,0.08) !important; }
      .btn-press:active { transform: scale(0.97); }
      .urgent-pulse { animation: pulse-urgent 1.6s ease-in-out infinite; }
      @keyframes orb-idle-pulse { 0%,100% { box-shadow: 0 0 0 0 var(--orb-glow); transform: scale(1); } 50% { box-shadow: 0 0 0 14px transparent; transform: scale(1.03); } }
      @keyframes orb-charge { 0% { transform: scale(1); box-shadow: 0 0 0 0 var(--orb-glow); } 100% { transform: scale(1.22); box-shadow: 0 0 50px 14px var(--orb-glow); } }
      @keyframes orb-burst-ring { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(3.2); opacity: 0; } }
      @keyframes orb-burst-shrink { 0% { transform: scale(1.22); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }
      @keyframes card-pop { 0% { transform: scale(0.55); opacity: 0; } 62% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes sparkle-fly { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } }
      .orb-idle { animation: orb-idle-pulse 2.2s ease-in-out infinite; }
      .orb-charging { animation: orb-charge 1s cubic-bezier(.4,0,.6,1) forwards; }
      .orb-burst-ring { animation: orb-burst-ring 0.6s ease-out forwards; }
      .orb-burst-shrink { animation: orb-burst-shrink 0.4s ease-in forwards; }
      .card-pop { animation: card-pop 0.55s cubic-bezier(.34,1.56,.64,1) forwards; }
      .sparkle { animation: sparkle-fly 0.7s ease-out forwards; }
      .tab-scroll::-webkit-scrollbar { display: none; }
      .tab-scroll { scrollbar-width: none; -ms-overflow-style: none; }
    `}</style>
  </>
);

function withAlpha(hex, alpha) {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(201,162,75,${alpha})`;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/:slug/personal" element={<StaffDashboardGate />} />
      <Route path="/:slug/:table" element={<HubSeite />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

function Landing() {
  return (
    <div style={{ background: '#15120d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Work Sans', sans-serif" }}>
      <GlobalStyles />
      <div style={{ color: '#8a7c5f', fontSize: 13, textAlign: 'center', padding: 20 }}>
        Bitte den QR-Code oder NFC-Chip an Ihrem Tisch verwenden.
      </div>
    </div>
  );
}

function HubSeite() {
  const { slug, table } = useParams();
  const [screen, setScreen] = useState('hub');
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const restaurants = await sb(`restaurants?slug=eq.${slug}&select=id,slug,name,review_link,primary_color`);
        if (restaurants.length === 0) {
          setError('Restaurant nicht gefunden.');
          return;
        }
        setRestaurant(restaurants[0]);
        const items = await sb(`menu_items?restaurant_id=eq.${restaurants[0].id}&order=reihenfolge.asc`);
        setMenu(items);
      } catch (e) {
        setError('Verbindung zur Datenbank fehlgeschlagen.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const accent = restaurant?.primary_color || '#c9a24b';

  const [cart, setCart] = useState({});
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, qty: (existing?.qty || 0) + 1 } };
    });
  };
  const changeQty = (id, delta) => {
    setCart((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      const qty = entry.qty + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...entry, qty } };
    });
  };
  const removeFromCart = (id) => setCart((prev) => { const n = { ...prev }; delete n[id]; return n; });

  return (
    <div style={{ background: '#15120d', minHeight: '100vh', fontFamily: "'Work Sans', sans-serif" }}>
      <GlobalStyles />
      {loading ? (
        <div style={{ color: '#8a7c5f', textAlign: 'center', padding: '80px 20px', fontSize: 13 }}>Lädt…</div>
      ) : error ? (
        <div style={{ color: '#c98a4b', textAlign: 'center', padding: '80px 20px', fontSize: 13 }}>{error}</div>
      ) : screen === 'hub' ? (
        <HubScreen restaurant={restaurant} accent={accent} onNavigate={setScreen} />
      ) : screen === 'menu' ? (
        <MenuScreen menu={menu} accent={accent} onBack={() => setScreen('hub')} cart={cart} addToCart={addToCart} changeQty={changeQty} removeFromCart={removeFromCart} />
      ) : screen === 'aipick' ? (
        <AIPickScreen menu={menu} accent={accent} onBack={() => setScreen('hub')} addToCart={addToCart} />
      ) : (
        <ActionScreen type={screen} restaurant={restaurant} table={table} accent={accent} onBack={() => setScreen('hub')} />
      )}
    </div>
  );
}

function HubScreen({ restaurant, accent, onNavigate }) {
  const items = [
    { key: 'menu', icon: BookOpen, title: 'Speisekarte', sub: 'Entdecken & genießen' },
    { key: 'aipick', icon: Sparkles, title: 'Was soll ich essen?', sub: 'Lass dich überraschen' },
    { key: 'kellner', icon: Bell, title: 'Kellner rufen', sub: 'Wir sind für Sie da' },
    { key: 'rechnung', icon: Receipt, title: 'Rechnung anfordern', sub: 'Wir bringen Ihre Rechnung' },
    { key: 'bewertung', icon: Star, title: 'Bewertung abgeben', sub: 'Ihre Meinung zählt' },
  ];
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '52px 24px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', border: `1px solid ${withAlpha(accent,0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <Utensils size={22} color={accent} />
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 600, color: '#f3ede0', letterSpacing: '0.03em' }}>WILLKOMMEN</div>
        <div style={{ width: 90, height: 1, background: withAlpha(accent,0.4), margin: '16px auto' }} />
        <div style={{ fontSize: 11.5, letterSpacing: '0.14em', color: '#a89a7d', textTransform: 'uppercase' }}>{restaurant.name}</div>
      </div>
      <div style={{ marginTop: 40, border: '1px solid #2a241b', borderRadius: 12, overflow: 'hidden' }}>
        {items.map((item, i) => (
          <button key={item.key} onClick={() => onNavigate(item.key)} className="row-press"
            style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: '18px 18px', background: 'transparent', border: 'none', borderBottom: i < items.length - 1 ? '1px solid #2a241b' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s ease' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', border: `1px solid ${withAlpha(accent,0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={17} color={accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f3ede0', fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>{item.title.toUpperCase()}</div>
              <div style={{ color: '#8a7c5f', fontSize: 11, marginTop: 2, letterSpacing: '0.03em' }}>{item.sub}</div>
            </div>
            <ChevronRight size={16} color="#5c5344" />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 44, marginBottom: 14 }}>
        {[13, 19, 25].map((h, i) => (<div key={i} className="wave-bar" style={{ width: 3, height: h, borderRadius: 2, background: accent }} />))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10.5, color: '#5c5344', letterSpacing: '0.05em' }}>SMARTPHONE HIER ANTIPPEN · KEINE APP ERFORDERLICH</div>
    </div>
  );
}

const CATEGORY_ORDER = ['Frühstück', 'Mittag & Abend', 'Dessert', 'Getränke'];

function MenuScreen({ menu, accent, onBack, cart, addToCart, changeQty, removeFromCart }) {
  const [activeTab, setActiveTab] = useState(null);
  const [query, setQuery] = useState('');
  const [onlyVeggie, setOnlyVeggie] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const presentCats = CATEGORY_ORDER.filter((c) => menu.some((m) => (m.haupt_kategorie || 'Mittag & Abend') === c));
  const tab = activeTab || presentCats[0];

  const filtered = menu.filter((item) => {
    if ((item.haupt_kategorie || 'Mittag & Abend') !== tab) return false;
    if (onlyVeggie && !item.vegetarisch) return false;
    if (query && !(`${item.name} ${item.beschreibung || ''}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.kategorie || 'Weitere';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});

  const cartEntries = Object.values(cart);
  const cartCount = cartEntries.reduce((s, e) => s + e.qty, 0);
  const cartTotal = cartEntries.reduce((s, e) => s + e.qty * Number(e.item.preis || 0), 0);

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px 100px' }}>
      <BackHeader title="Speisekarte" accent={accent} onBack={onBack} />

      {menu.length === 0 ? (
        <div style={{ color: '#6b6252', fontSize: 13.5, textAlign: 'center', padding: '40px 0' }}>Die Speisekarte wird gerade eingerichtet.</div>
      ) : (
        <>
          {/* Hauptkategorie-Reiter */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <div className="tab-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {presentCats.map((c) => (
                <button key={c} onClick={() => setActiveTab(c)} className="btn-press"
                  style={{
                    flexShrink: 0, padding: '9px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                    border: `1px solid ${tab === c ? accent : '#2a241b'}`,
                    background: tab === c ? withAlpha(accent, 0.12) : 'transparent',
                    color: tab === c ? accent : '#8a7c5f', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: "'Work Sans', sans-serif",
                  }}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 2, width: 28, background: 'linear-gradient(to right, transparent, #15120d)', pointerEvents: 'none' }} />
          </div>

          {/* Suche */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={15} color="#5c5344" style={{ position: 'absolute', left: 13, top: 12 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Gericht suchen…"
              style={{
                width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, border: '1px solid #2a241b',
                background: '#1a1610', color: '#f3ede0', fontSize: 13, outline: 'none', fontFamily: "'Work Sans', sans-serif",
              }}
            />
          </div>

          {/* Filter */}
          <button onClick={() => setOnlyVeggie((v) => !v)} className="btn-press"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, marginBottom: 22,
              border: `1px solid ${onlyVeggie ? accent : '#2a241b'}`, background: onlyVeggie ? withAlpha(accent, 0.12) : 'transparent',
              color: onlyVeggie ? accent : '#8a7c5f', fontSize: 12, cursor: 'pointer', fontFamily: "'Work Sans', sans-serif",
            }}>
            <Leaf size={12} /> Nur Vegetarisch
          </button>

          {Object.keys(grouped).length === 0 ? (
            <div style={{ color: '#6b6252', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Keine Treffer.</div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 30 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', color: accent, textTransform: 'uppercase', marginBottom: 14 }}>{cat}</div>
                {items.map((item) => {
                  const inCart = cart[item.id]?.qty || 0;
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #221d15' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ color: '#f3ede0', fontSize: 15, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>{item.name}</div>
                          {item.beliebt && <Star size={11} color={accent} fill={accent} />}
                          {item.vegetarisch && <Leaf size={11} color="#7a9e7a" />}
                        </div>
                        {item.beschreibung && (<div style={{ color: '#8a7c5f', fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{item.beschreibung}</div>)}
                        {item.preis && (<div style={{ color: accent, fontSize: 13.5, marginTop: 6 }}>{Number(item.preis).toFixed(2)} €</div>)}
                      </div>
                      <button onClick={() => addToCart(item)} className="btn-press"
                        style={{
                          alignSelf: 'center', width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          border: `1px solid ${inCart ? accent : '#2a241b'}`, background: inCart ? withAlpha(accent, 0.12) : 'transparent',
                          color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        }}>
                        <Plus size={15} />
                        {inCart > 0 && (
                          <span style={{ position: 'absolute', top: -6, right: -6, background: accent, color: '#15120d', fontSize: 10, fontWeight: 700, borderRadius: 999, width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{inCart}</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </>
      )}

      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} className="btn-press"
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', maxWidth: 392, width: 'calc(100% - 48px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12,
            background: accent, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15120d', fontWeight: 600, fontSize: 13.5 }}>
            <ShoppingBag size={16} /> {cartCount} {cartCount === 1 ? 'Artikel' : 'Artikel'} gemerkt
          </div>
          <div style={{ color: '#15120d', fontWeight: 700, fontSize: 13.5 }}>{cartTotal.toFixed(2)} €</div>
        </button>
      )}

      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={() => setCartOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1610', borderTopLeftRadius: 18, borderTopRightRadius: 18, width: '100%', maxWidth: 440, margin: '0 auto', padding: '22px 22px 30px', maxHeight: '75vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: '#f3ede0' }}>Meine Auswahl</div>
              <button onClick={() => setCartOpen(false)} className="btn-press" style={{ background: 'none', border: 'none', color: '#8a7c5f', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            {cartEntries.length === 0 ? (
              <div style={{ color: '#6b6252', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Noch nichts ausgewählt.</div>
            ) : (
              <>
                {cartEntries.map(({ item, qty }) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#f3ede0', fontSize: 14 }}>{item.name}</div>
                      <div style={{ color: '#8a7c5f', fontSize: 12 }}>{Number(item.preis).toFixed(2)} € · {qty}x</div>
                    </div>
                    <button onClick={() => changeQty(item.id, -1)} className="btn-press" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #2a241b', background: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                    <div style={{ color: '#f3ede0', fontSize: 13, minWidth: 14, textAlign: 'center' }}>{qty}</div>
                    <button onClick={() => changeQty(item.id, 1)} className="btn-press" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #2a241b', background: 'none', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                    <button onClick={() => removeFromCart(item.id)} className="btn-press" style={{ background: 'none', border: 'none', color: '#6b6252', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2a241b', paddingTop: 14, marginTop: 4 }}>
                  <div style={{ color: '#f3ede0', fontSize: 15, fontWeight: 600 }}>Gesamt</div>
                  <div style={{ color: accent, fontSize: 15, fontWeight: 600 }}>{cartTotal.toFixed(2)} €</div>
                </div>
                <div style={{ color: '#5c5344', fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
                  Dies ist nur eine Merkliste zur Übersicht. Ihre Bestellung geben Sie weiterhin beim Personal auf.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const AI_LINES = [
  'Die Bernstein-KI hat entschieden…',
  'Analysiere deinen Appetit…',
  'Berechne die perfekte Wahl…',
];

function pickWeighted(items) {
  const pool = [];
  items.forEach((it) => pool.push(it, ...(it.beliebt ? [it, it] : [])));
  return pool[Math.floor(Math.random() * pool.length)];
}

function MysteryOrb({ accent, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | charging | bursting

  const startCharge = () => {
    if (phase !== 'idle') return;
    setPhase('charging');
    setTimeout(() => setPhase('bursting'), 1000);
    setTimeout(() => onComplete(), 1550);
  };

  const orbGlow = withAlpha(accent, 0.35);

  return (
    <div style={{ textAlign: 'center', paddingTop: 10 }}>
      <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'bursting' && (
          <div className="orb-burst-ring" style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', border: `2px solid ${accent}`, '--orb-glow': orbGlow }} />
        )}
        <button
          onClick={startCharge}
          className={phase === 'idle' ? 'orb-idle btn-press' : phase === 'charging' ? 'orb-charging' : 'orb-burst-shrink'}
          style={{
            width: 90, height: 90, borderRadius: '50%', border: `1px solid ${accent}`,
            background: `radial-gradient(circle, ${withAlpha(accent,0.18)}, transparent 70%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: phase === 'idle' ? 'pointer' : 'default',
            '--orb-glow': orbGlow,
          }}>
          <Sparkles size={30} color={accent} />
        </button>
      </div>
      {phase === 'idle' && (
        <div style={{ color: '#a89a7d', fontSize: 13.5 }}>Tippen und überraschen lassen</div>
      )}
      {phase !== 'idle' && (
        <div style={{ color: '#8a7c5f', fontSize: 13 }}>{AI_LINES[0]}</div>
      )}
    </div>
  );
}

function SparkleBurst({ accent }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 70 + Math.random() * 50;
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, delay: Math.random() * 0.15 };
  });
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <span key={i} className="sparkle" style={{
          position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: accent,
          '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

function AIPickScreen({ menu, accent, onBack, addToCart }) {
  const [step, setStep] = useState('intro'); // intro | q1 | q2 | q3 | orb | result
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [added, setAdded] = useState(false);

  const pickFromAnswers = (finalAnswers) => {
    let pool = menu;
    if (finalAnswers.art === 'suess') {
      pool = menu.filter((m) => m.haupt_kategorie === 'Dessert');
    } else if (finalAnswers.art === 'herzhaft') {
      pool = menu.filter((m) => m.haupt_kategorie === 'Mittag & Abend' || m.haupt_kategorie === 'Frühstück');
    }
    if (finalAnswers.veggie === 'ja') {
      const veg = pool.filter((m) => m.vegetarisch);
      if (veg.length > 0) pool = veg;
    }
    if (finalAnswers.hunger === 'klein') {
      const sorted = [...pool].sort((a, b) => Number(a.preis) - Number(b.preis));
      pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    } else if (finalAnswers.hunger === 'gross') {
      const sorted = [...pool].sort((a, b) => Number(b.preis) - Number(a.preis));
      pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    }
    if (pool.length === 0) pool = menu;
    return pickWeighted(pool);
  };

  const revealFromQuiz = (finalAnswers) => {
    setResult(pickFromAnswers(finalAnswers));
    setAdded(false);
    setStep('result');
  };

  const revealSurprise = () => {
    setResult(pickWeighted(menu));
    setAdded(false);
    setStep('result');
  };

  const reasonText = () => {
    const bits = [];
    if (answers.art === 'suess') bits.push('auf etwas Süßes');
    if (answers.art === 'herzhaft') bits.push('auf etwas Herzhaftes');
    if (answers.veggie === 'ja') bits.push('vegetarisch sein soll');
    if (answers.hunger === 'klein') bits.push('du eher kleinen Hunger hast');
    if (answers.hunger === 'gross') bits.push('du richtig Hunger hast');
    if (bits.length === 0) return 'Weil es einfach ein Gästeliebling ist.';
    return `Weil du Lust ${bits.join(' und ')} hast – das hier trifft's genau.`;
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px 60px', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Was soll ich essen?" accent={accent} onBack={onBack} />

      {step === 'intro' && (
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: `1px solid ${withAlpha(accent,0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
            <Sparkles size={24} color={accent} />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#f3ede0', marginBottom: 8 }}>Unentschlossen?</div>
          <div style={{ color: '#8a7c5f', fontSize: 13, marginBottom: 34, lineHeight: 1.6 }}>
            Beantworte 3 kurze Fragen und die Bernstein-KI findet dein perfektes Gericht. Oder lass dich einfach direkt überraschen.
          </div>
          <button onClick={() => setStep('q1')} className="btn-press"
            style={{ width: '100%', padding: '15px', borderRadius: 10, border: `1px solid ${accent}`, background: withAlpha(accent,0.1), color: accent, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Work Sans', sans-serif", marginBottom: 28 }}>
            Quiz starten
          </button>
          <div style={{ borderTop: '1px solid #221d15', paddingTop: 26 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '0.12em', color: '#5c5344', textTransform: 'uppercase', marginBottom: 16 }}>Oder</div>
            <MysteryOrb accent={accent} onComplete={revealSurprise} />
          </div>
        </div>
      )}

      {step === 'q1' && (
        <QuizStep accent={accent} question="Süß oder herzhaft?" options={[
          { label: 'Herzhaft', value: 'herzhaft' },
          { label: 'Süß', value: 'suess' },
          { label: 'Egal', value: 'egal' },
        ]} onPick={(v) => { setAnswers((a) => ({ ...a, art: v })); setStep('q2'); }} />
      )}

      {step === 'q2' && (
        <QuizStep accent={accent} question="Vegetarisch?" options={[
          { label: 'Ja, bitte', value: 'ja' },
          { label: 'Egal', value: 'egal' },
        ]} onPick={(v) => { setAnswers((a) => ({ ...a, veggie: v })); setStep('q3'); }} />
      )}

      {step === 'q3' && (
        <QuizStep accent={accent} question="Wie hungrig bist du?" options={[
          { label: 'Kleiner Happen', value: 'klein' },
          { label: 'Normaler Hunger', value: 'mittel' },
          { label: 'Richtig hungrig', value: 'gross' },
        ]} onPick={(v) => { const final = { ...answers, hunger: v }; setAnswers(final); setStep('orb'); }} />
      )}

      {step === 'orb' && (
        <div style={{ paddingTop: 50 }}>
          <MysteryOrb accent={accent} onComplete={() => revealFromQuiz(answers)} />
        </div>
      )}

      {step === 'result' && result && (
        <div className="card-pop" key={result.id} style={{ textAlign: 'center', paddingTop: 10, position: 'relative' }}>
          <SparkleBurst accent={accent} />
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: 16 }}>Die Empfehlung für dich</div>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: `1px solid ${withAlpha(accent,0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Sparkles size={20} color={accent} />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: '#f3ede0', fontWeight: 600, marginBottom: 8 }}>{result.name}</div>
          {result.beschreibung && <div style={{ color: '#8a7c5f', fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>{result.beschreibung}</div>}
          {result.preis && <div style={{ color: accent, fontSize: 15, marginBottom: 20 }}>{Number(result.preis).toFixed(2)} €</div>}
          <div style={{ background: '#1a1610', border: '1px solid #2a241b', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#a89a7d', marginBottom: 26, lineHeight: 1.6 }}>
            {reasonText()}
          </div>

          <button onClick={() => { addToCart(result); setAdded(true); }} disabled={added} className="btn-press"
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: `1px solid ${accent}`, background: added ? withAlpha(accent,0.2) : withAlpha(accent,0.1), color: accent, fontSize: 14, fontWeight: 500, cursor: added ? 'default' : 'pointer', fontFamily: "'Work Sans', sans-serif", marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {added ? <><Check size={15} /> Zur Merkliste hinzugefügt</> : <><Plus size={15} /> Zur Merkliste hinzufügen</>}
          </button>
          <button onClick={() => { setStep(answers.art ? 'q1' : 'intro'); setResult(null); }} className="btn-press"
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: '1px solid #2a241b', background: 'transparent', color: '#8a7c5f', fontSize: 13, cursor: 'pointer', fontFamily: "'Work Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RotateCcw size={13} /> Nochmal
          </button>
        </div>
      )}
    </div>
  );
}

function QuizStep({ question, options, onPick, accent }) {
  return (
    <div style={{ paddingTop: 10 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#f3ede0', marginBottom: 24, textAlign: 'center' }}>{question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((o) => (
          <button key={o.value} onClick={() => onPick(o.value)} className="btn-press"
            style={{ padding: '15px', borderRadius: 10, border: '1px solid #2a241b', background: '#1a1610', color: '#f3ede0', fontSize: 14, cursor: 'pointer', fontFamily: "'Work Sans', sans-serif", textAlign: 'center' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionScreen({ type, restaurant, table, accent, onBack }) {
  const [status, setStatus] = useState('idle');
  const config = {
    kellner: { icon: Bell, title: 'Kellner rufen', confirm: 'Der Kellner wurde informiert und kommt gleich vorbei.' },
    rechnung: { icon: Receipt, title: 'Rechnung anfordern', confirm: 'Wir bringen Ihnen die Rechnung an den Tisch.' },
    bewertung: { icon: Star, title: 'Bewertung abgeben', confirm: null },
  }[type];

  const handleAction = async () => {
    if (type === 'bewertung') {
      window.open(restaurant.review_link, '_blank');
      return;
    }
    setStatus('sending');
    try {
      await sb('calls', {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurant.id, tisch_nummer: Number(table), type, status: 'offen' }),
      });
      setStatus('sent');
    } catch (e) {
      setStatus('idle');
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px 60px' }}>
      <BackHeader title={config.title} accent={accent} onBack={onBack} />
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', border: `1px solid ${withAlpha(accent,0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 26px' }}>
          {status === 'sent' ? <Check size={26} color={accent} /> : <config.icon size={26} color={accent} />}
        </div>
        {status === 'sent' ? (
          <div style={{ color: '#f3ede0', fontFamily: "'Cormorant Garamond', serif", fontSize: 20, lineHeight: 1.5 }}>{config.confirm}</div>
        ) : (
          <>
            <div style={{ color: '#a89a7d', fontSize: 13.5, marginBottom: 30, lineHeight: 1.6 }}>
              {type === 'bewertung' ? `Öffnet Google, damit Sie ${restaurant.name} bewerten können.` : `Wir benachrichtigen das Personal für Tisch ${table}.`}
            </div>
            <button onClick={handleAction} disabled={status === 'sending'} className="btn-press"
              style={{ padding: '15px 32px', borderRadius: 10, border: `1px solid ${accent}`, background: withAlpha(accent,0.1), color: accent, fontSize: 14, fontWeight: 500, letterSpacing: '0.02em', cursor: 'pointer', fontFamily: "'Work Sans', sans-serif", opacity: status === 'sending' ? 0.6 : 1 }}>
              {status === 'sending' ? 'Wird gesendet…' : 'Jetzt bestätigen'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BackHeader({ title, accent, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
      <button onClick={onBack} className="btn-press" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #2a241b', background: 'transparent', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft size={16} />
      </button>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#f3ede0' }}>{title}</div>
    </div>
  );
}

function ageMinutes(ts) {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
}

function nowLabel(ts) {
  const mins = ageMinutes(ts);
  if (mins < 1) return 'gerade eben';
  if (mins === 1) return 'vor 1 Min';
  return `vor ${mins} Min`;
}

function urgencyStyle(ts) {
  const mins = ageMinutes(ts);
  if (mins >= 7) return { border: '#7a3a30', bg: 'rgba(214,80,60,0.09)', dot: '#d6503c', label: 'ÜBERFÄLLIG', pulse: true };
  if (mins >= 3) return { border: '#7a5a2a', bg: 'rgba(214,150,60,0.08)', dot: '#d6963c', label: 'WIRD KRITISCH', pulse: false };
  return { border: '#2a241b', bg: '#1d1811', dot: null, label: null, pulse: false };
}

// Kurzer Ton per Web Audio API, kein externes Asset nötig
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.15);
    o.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function StaffDashboardGate() {
  const { slug } = useParams();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(`staff_unlocked_${slug}`) === '1');

  if (!unlocked) {
    return (
      <StaffLogin
        slug={slug}
        onSuccess={() => {
          sessionStorage.setItem(`staff_unlocked_${slug}`, '1');
          setUnlocked(true);
        }}
      />
    );
  }
  return <StaffDashboard />;
}

function StaffLogin({ slug, onSuccess }) {
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError(false);
    try {
      const result = await sb('rpc/verify_staff_login', {
        method: 'POST',
        body: JSON.stringify({ p_slug: slug, p_password: password }),
      });
      if (result === true) {
        onSuccess();
      } else {
        setError(true);
      }
    } catch (e2) {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ background: '#15120d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Work Sans', sans-serif", padding: 20 }}>
      <GlobalStyles />
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid #4a3f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Bell size={20} color="#c9a24b" />
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#f3ede0', marginBottom: 6 }}>Personal-Login</div>
        <div style={{ fontSize: 12, color: '#8a7c5f', marginBottom: 26 }}>Nur für autorisiertes Personal</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          autoFocus
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 10, border: `1px solid ${error ? '#7a3a30' : '#2a241b'}`,
            background: '#1a1610', color: '#f3ede0', fontSize: 14, marginBottom: 14, outline: 'none',
            fontFamily: "'Work Sans', sans-serif",
          }}
        />
        {error && <div style={{ color: '#d6503c', fontSize: 12, marginBottom: 14 }}>Falsches Passwort.</div>}
        <button type="submit" disabled={checking || !password} className="btn-press"
          style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1px solid #c9a24b', background: 'rgba(201,162,75,0.1)', color: '#c9a24b', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: checking || !password ? 0.5 : 1, fontFamily: "'Work Sans', sans-serif" }}>
          {checking ? 'Prüfe…' : 'Anmelden'}
        </button>
      </form>
    </div>
  );
}

function StaffDashboard() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [calls, setCalls] = useState([]);
  const [resolvedToday, setResolvedToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const knownIds = useRef(new Set());
  const firstLoad = useRef(true);

  const loadCalls = useCallback(async (restaurantId) => {
    try {
      const rows = await sb(`calls?restaurant_id=eq.${restaurantId}&status=eq.offen&order=created_at.asc`);
      const newIds = rows.map((r) => r.id);
      const hasNew = newIds.some((id) => !knownIds.current.has(id));
      if (hasNew && !firstLoad.current && soundOn) playChime();
      knownIds.current = new Set(newIds);
      firstLoad.current = false;
      setCalls(rows);

      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const doneToday = await sb(`calls?restaurant_id=eq.${restaurantId}&status=eq.erledigt&created_at=gte.${since.toISOString()}&select=id`);
      setResolvedToday(doneToday);
    } catch (e) {}
  }, [soundOn]);

  useEffect(() => {
    (async () => {
      try {
        const restaurants = await sb(`restaurants?slug=eq.${slug}&select=id,slug,name,review_link,primary_color`);
        if (restaurants.length > 0) {
          setRestaurant(restaurants[0]);
          await loadCalls(restaurants[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!restaurant) return;
    const interval = setInterval(() => loadCalls(restaurant.id), 3000);
    return () => clearInterval(interval);
  }, [restaurant, loadCalls]);

  const resolveCall = async (id) => {
    try {
      await sb(`calls?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'erledigt' }) });
      knownIds.current.delete(id);
      setCalls((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {}
  };

  const accent = restaurant?.primary_color || '#c9a24b';
  const overdueCount = calls.filter((c) => ageMinutes(c.created_at) >= 7).length;
  const avgWait = calls.length > 0 ? Math.round(calls.reduce((s, c) => s + ageMinutes(c.created_at), 0) / calls.length) : 0;

  return (
    <div style={{ background: '#15120d', minHeight: '100vh', fontFamily: "'Work Sans', sans-serif" }}>
      <GlobalStyles />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: '#f3ede0' }}>
            {loading ? 'Lädt…' : restaurant ? restaurant.name : 'Nicht gefunden'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setSoundOn((s) => !s)} className="btn-press" style={{ background: 'none', border: 'none', cursor: 'pointer', color: soundOn ? accent : '#5c5344' }}>
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            {restaurant && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7a9e7a' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: '#7a9e7a', display: 'inline-block' }} /> live
              </div>
            )}
          </div>
        </div>

        {!loading && restaurant && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
            <StatBox label="Offen" value={calls.length} accent={accent} />
            <StatBox label="Überfällig" value={overdueCount} accent={overdueCount > 0 ? '#d6503c' : accent} />
            <StatBox label="Ø Wartezeit" value={calls.length ? `${avgWait} Min` : '–'} accent={accent} small />
          </div>
        )}

        {!loading && calls.length === 0 && (
          <div style={{ border: '1px dashed #3a3226', borderRadius: 10, padding: '40px 20px', textAlign: 'center', color: '#6b6252', fontSize: 13.5 }}>
            Keine offenen Anfragen.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {calls.map((c) => {
            const u = urgencyStyle(c.created_at);
            return (
              <div key={c.id} className={u.pulse ? 'urgent-pulse' : ''}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: u.bg, border: `1px solid ${u.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: withAlpha(accent,0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.type === 'kellner' ? <Bell size={16} color={accent} /> : <Receipt size={16} color={accent} />}
                  </div>
                  <div>
                    <div style={{ color: '#f3ede0', fontSize: 14.5, fontWeight: 500 }}>Tisch {c.tisch_nummer} · {c.type === 'kellner' ? 'Kellner rufen' : 'Rechnung'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8a7c5f', fontSize: 11.5, marginTop: 2 }}>
                      <Clock size={11} /> {nowLabel(c.created_at)}
                      {u.label && <span style={{ color: u.dot, marginLeft: 6, fontWeight: 600, letterSpacing: '0.04em' }}>· {u.label}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => resolveCall(c.id)} className="btn-press" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #3a3226', background: 'transparent', color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {!loading && resolvedToday.length > 0 && (
          <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 8, color: '#5c5344', fontSize: 11.5 }}>
            <TrendingUp size={13} />
            {resolvedToday.length} Anfragen heute bereits erledigt
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, small }) {
  return (
    <div style={{ border: '1px solid #2a241b', borderRadius: 10, padding: '12px 10px', textAlign: 'center', background: '#1a1610' }}>
      <div style={{ fontSize: small ? 17 : 22, fontWeight: 600, color: accent, fontFamily: "'Cormorant Garamond', serif" }}>{value}</div>
      <div style={{ fontSize: 9.5, color: '#8a7c5f', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}
