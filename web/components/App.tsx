'use client';
import React, { useEffect, useState } from 'react';
import { API, j } from '@/lib/api';

type Session = {
  zerodha: boolean;
  llm: boolean;
  ticker: boolean;
  stale_count: number;
  subscribed_count: number;
  universe_limit: number;
};

function Chip({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'error' | 'neutral' }) {
  const t: any = {
    ok: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300',
    warn: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300',
    error: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300',
    neutral: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${t[tone]}`}>
      {label}
    </span>
  );
}

function Header({ session, onLogin }: { session: Session | null; onLogin: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90">
      <div className="mx-auto max-w-[1200px] px-3 md:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white text-sm font-bold">
              IC
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold tracking-tight">Intraday Co-Pilot</div>
              <div className="text-[10px] text-zinc-500">Live-only • KiteTicker • NSE+BSE</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              label={`Zerodha ${session?.zerodha ? 'connected' : 'offline'}`}
              tone={session?.zerodha ? 'ok' : 'error'}
            />
            <Chip label="LLM ready" tone="ok" />
            <Chip label={`Ticker ${session?.ticker ? 'live' : 'stopped'}`} tone={session?.ticker ? 'ok' : 'warn'} />
            {session?.zerodha ? (
              <Chip label="Logged in" tone="ok" />
            ) : (
              <button
                onClick={onLogin}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Login with Zerodha
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Tabs({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const items = ['Top Algos', 'Strategies', 'Watch', 'Analyst', 'Journal', 'Policy', 'Config'];
  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-[1200px] px-3 md:px-6">
        <div className="flex flex-wrap gap-2 py-2">
          {items.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-sm ${tab === t ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function TopAlgos() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const r = await fetch(`${API}/api/plan?top=10`);
      if (r.status === 429) {
        setError(`Rate limited. Retry-After: ${r.headers.get('Retry-After')}s`);
        return;
      }
      const x = await j(r);
      setRows(x.data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="mx-auto max-w-[1200px] px-3 md:px-6 py-4 md:py-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Top Algos (live)</div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && (
        <div className="mb-2 rounded-xl bg-amber-100 text-amber-800 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Strategy</th>
              <th className="px-3 py-2">Side</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Readiness</th>
              <th className="px-3 py-2">Checks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2 font-semibold">{r.symbol}</td>
                <td className="px-3 py-2">{r.strategy}</td>
                <td className={`px-3 py-2 ${r.side === 'long' ? 'text-emerald-700' : 'text-rose-700'}`}>{r.side}</td>
                <td className="px-3 py-2 font-mono">{r.score}</td>
                <td className="px-3 py-2 capitalize">{r.readiness}</td>
                <td className="px-3 py-2 text-xs">
                  {Object.entries(r.checks || {}).map(([k, v]) => (
                    <span key={k} className={`mr-2 ${v ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {k}:{v ? '✓' : '✗'}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={7}>
                  No picks yet. Make sure the ticker/aggregator is running and active symbols are populated.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Watch() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [snaps, setSnaps] = useState<any>({});
  function addSymbol(s: string) {
    s = s.trim();
    if (!s) return;
    if (!symbols.includes(s)) setSymbols([...symbols, s]);
  }
  useEffect(() => {
    if (symbols.length === 0) return;
    const id = setInterval(async () => {
      const r = await j(await fetch(`${API}/api/live?symbols=${encodeURIComponent(symbols.join(','))}`));
      setSnaps(r.data || {});
    }, 3000);
    return () => clearInterval(id);
  }, [symbols]);
  return (
    <section className="mx-auto max-w-[1200px] px-3 md:px-6 py-4 md:py-6">
      <div className="mb-2 flex gap-2 items-center">
        <input
          placeholder="Add EXCH:SYMBOL (e.g., NSE:INFY)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addSymbol((e.target as any).value);
              (e.target as any).value = '';
            }
          }}
          className="w-72 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        />
        <span className="text-xs text-zinc-500">Polling every 3 s</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {symbols.map((s) => (
          <div key={s} className="rounded-xl border border-zinc-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{s}</div>
              <button className="text-xs text-zinc-600" onClick={() => setSymbols(symbols.filter((x) => x !== s))}>
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div className="rounded-lg bg-zinc-50 p-2">
                <div className="text-[10px] text-zinc-500">VWAPΔ</div>
                <span className="font-mono">{snaps[s]?.vwap_delta_pct ?? '—'}%</span>
              </div>
              <div className="rounded-lg bg-zinc-50 p-2">
                <div className="text-[10px] text-zinc-500">VolX</div>
                <span className="font-mono">{snaps[s]?.minute_vol_multiple ?? '—'}×</span>
              </div>
              <div className="rounded-lg bg-zinc-50 p-2">
                <div className="text-[10px] text-zinc-500">EMA9/21</div>
                <span className="font-mono">
                  {snaps[s] ? (snaps[s].ema9 > snaps[s].ema21 ? '↑' : '↓') : '—'} {snaps[s]?.ema9 ?? '—'} /{' '}
                  {snaps[s]?.ema21 ?? '—'}
                </span>
              </div>
              <div className="rounded-lg bg-zinc-50 p-2">
                <div className="text-[10px] text-zinc-500">RSI14</div>
                <span className="font-mono">{snaps[s]?.rsi14 ?? '—'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Analyst() {
  const [sym, setSym] = useState('NSE:INFY');
  const [verdict, setVerdict] = useState<any>(null);
  async function go() {
    const r = await j(await fetch(`${API}/api/analyze?symbol=${encodeURIComponent(sym)}`));
    setVerdict(r.data);
  }
  return (
    <section className="mx-auto max-w-[1200px] px-3 md:px-6 py-4 md:py-6">
      <div className="flex gap-2 items-center">
        <input
          value={sym}
          onChange={(e) => setSym(e.target.value)}
          className="w-56 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
        />
        <button onClick={go} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">
          Analyze
        </button>
      </div>
      {verdict && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-[11px] text-zinc-500">Decision</div>
            <div className="mt-1 text-xl font-bold">{String(verdict.decision || '').toUpperCase()}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-[11px] text-zinc-500">Bands</div>
            <div className="mt-1 font-mono text-lg">{(verdict.bands || []).join(' / ')}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3">
            <div className="text-[11px] text-zinc-500">Confidence</div>
            <div className="mt-1 font-mono text-lg">{verdict.confidence}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function Journal() {
  const [rows, setRows] = useState<any[]>([]);
  async function refresh() {
    setRows(await j(await fetch(`${API}/api/journal`)));
  }
  useEffect(() => {
    refresh();
  }, []);
  return (
    <section className="mx-auto max-w-[1200px] px-3 md:px-6 py-4 md:py-6">
      <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white" onClick={refresh}>
        Refresh
      </button>
      <div className="overflow-hidden rounded-xl border border-zinc-200 mt-3">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="px-3 py-2">{r.symbol}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Policy() {
  const [txt, setTxt] = useState('');
  const [loaded, setLoaded] = useState(false);
  async function load() {
    const p = await j(await fetch(`${API}/api/policy`));
    setTxt(JSON.stringify(p, null, 2));
    setLoaded(true);
  }
  async function save() {
    await fetch(`${API}/api/policy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt });
    alert('Saved');
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <section className="mx-auto max-w-[1200px] px-3 md:px-6 py-4 md:py-6">
      <div className="mb-2 flex gap-2">
        <button onClick={load} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">
          Reload
        </button>
        <button
          onClick={save}
          disabled={!loaded}
          className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
        >
          Save
        </button>
      </div>
      <textarea
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        className="h-[360px] w-full rounded-xl border border-zinc-300 p-3 font-mono text-xs"
      />
    </section>
  );
}

function Config() {
  const [cfg, setCfg] = useState<{ pinned: string[]; universe_limit: number } | null>(null);
  const [pinText, setPinText] = useState('');
  const [limit, setLimit] = useState(200);
  async function load() {
    const c = await j(await fetch(`${API}/api/config`));
    setCfg(c);
    setPinText((c.pinned || []).join(','));
    setLimit(c.universe_limit || 200);
  }
  async function save() {
    await fetch(`${API}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: pinText.split(',').map((s) => s.trim()).filter(Boolean), universe_limit: limit }),
    });
    await load();
    alert('Saved');
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <section className="mx-auto max-w-[1200px] px-3 md:px-6 py-4 md:py-6">
      <div className="grid gap-3 max-w-xl">
        <div>
          <div className="text-sm font-semibold">Pinned symbols</div>
          <input
            value={pinText}
            onChange={(e) => setPinText(e.target.value)}
            placeholder="RELIANCE,INFY,ICICIBANK"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="text-xs text-zinc-500 mt-1">Use EXCH:SYMBOL if ambiguity across exchanges.</div>
        </div>
        <div>
          <div className="text-sm font-semibold">Active universe limit</div>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value || '200'))}
            className="w-32 rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">
            Save
          </button>
          <button onClick={load} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold ring-1 ring-zinc-300">
            Reload
          </button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState('Top Algos');

  async function login() {
    const r = await j(await fetch(`${API}/kite/login_url`));
    window.location.href = r.login_url;
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await j(await fetch(`${API}/api/session`));
        setSession(s);
      } catch {}
    })();
  }, []);

  // NEW: poll session so header reflects live login state
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const s = await j(await fetch(`${API}/api/session`));
        setSession(s);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <Header session={session} onLogin={login} />
      <Tabs tab={tab} setTab={setTab} />
      {tab === 'Top Algos' && <TopAlgos />}
      {tab === 'Strategies' && <TopAlgos />}
      {tab === 'Watch' && <Watch />}
      {tab === 'Analyst' && <Analyst />}
      {tab === 'Journal' && <Journal />}
      {tab === 'Policy' && <Policy />}
      {tab === 'Config' && <Config />}
    </div>
  );
}
