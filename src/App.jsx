import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { BookOpen, Bell, Receipt, Star, ChevronRight, Check, ArrowLeft, Utensils, Clock, Volume2, VolumeX, TrendingUp } from 'lucide-react';

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
      <Route path="/:slug/personal" element={<StaffDashboard />} />
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
        const restaurants = await sb(`restaurants?slug=eq.${slug}&select=*`);
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
        <MenuScreen menu={menu} accent={accent} onBack={() => setScreen('hub')} />
      ) : (
        <ActionScreen type={screen} restaurant={restaurant} table={table} accent={accent} onBack={() => setScreen('hub')} />
      )}
    </div>
  );
}

function HubScreen({ restaurant, accent, onNavigate }) {
  const items = [
    { key: 'menu', icon: BookOpen, title: 'Speisekarte', sub: 'Entdecken & genießen' },
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

function MenuScreen({ menu, accent, onBack }) {
  const grouped = menu.reduce((acc, item) => {
    const cat = item.kategorie || 'Weitere';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px 60px' }}>
      <BackHeader title="Speisekarte" accent={accent} onBack={onBack} />
      {menu.length === 0 ? (
        <div style={{ color: '#6b6252', fontSize: 13.5, textAlign: 'center', padding: '40px 0' }}>Die Speisekarte wird gerade eingerichtet.</div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', color: accent, textTransform: 'uppercase', marginBottom: 14 }}>{cat}</div>
            {items.map((item) => (
              <div key={item.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #221d15' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ color: '#f3ede0', fontSize: 15, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>{item.name}</div>
                  {item.preis && (<div style={{ color: accent, fontSize: 14, whiteSpace: 'nowrap' }}>{Number(item.preis).toFixed(2)} €</div>)}
                </div>
                {item.beschreibung && (<div style={{ color: '#8a7c5f', fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{item.beschreibung}</div>)}
              </div>
            ))}
          </div>
        ))
      )}
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
        const restaurants = await sb(`restaurants?slug=eq.${slug}&select=*`);
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
