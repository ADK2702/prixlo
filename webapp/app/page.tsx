'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ClusterResult } from './api/search/route';
import type { MerchantPrice } from './api/cluster/[id]/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n: number | null) => n == null ? '—' : `$${n.toFixed(2)}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : '';

const MERCHANT_COLORS: Record<string, string> = {
  'IGA': '#c8102e', 'Metro': '#00843d', 'Maxi': '#ffd200',
  'Walmart': '#0071ce', 'Walmart Supercentre': '#0071ce',
  'Provigo': '#e31837', 'Super C': '#e31837', 'Costco': '#e31837',
};

function MerchantBadge({ name }: { name: string }) {
  const bg = MERCHANT_COLORS[name] ?? '#2563eb';
  return (
    <span style={{
      background: bg, color: bg === '#ffd200' ? '#1e293b' : '#fff',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, letterSpacing: '.3px', whiteSpace: 'nowrap',
    }}>{name}</span>
  );
}

// ---------------------------------------------------------------------------
// Comparison table (expands inside card)
// ---------------------------------------------------------------------------
function CompareTable({ groupId }: { groupId: string }) {
  const [rows, setRows] = useState<MerchantPrice[] | null>(null);

  useEffect(() => {
    fetch(`/api/cluster/${encodeURIComponent(groupId)}`)
      .then(r => r.json())
      .then(d => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, [groupId]);

  if (!rows) return <div style={{ padding: '8px 0', color: 'var(--muted)', fontSize: 12 }}>Chargement…</div>;
  if (!rows.length) return null;

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'left' }}>
            <th style={{ paddingBottom: 4, fontWeight: 600 }}>Marchand</th>
            <th style={{ paddingBottom: 4, fontWeight: 600 }}>Nom</th>
            <th style={{ paddingBottom: 4, fontWeight: 600, textAlign: 'right' }}>Prix</th>
            <th style={{ paddingBottom: 4, fontWeight: 600, textAlign: 'right' }}>Valide</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : '#f8fafc' }}>
              <td style={{ padding: '5px 4px' }}><MerchantBadge name={r.merchant} /></td>
              <td style={{ padding: '5px 4px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={{
                padding: '5px 4px', textAlign: 'right', fontWeight: 700,
                color: i === 0 ? 'var(--green)' : 'var(--text)',
              }}>{fmt(r.price)}</td>
              <td style={{ padding: '5px 4px', textAlign: 'right', color: 'var(--muted)', fontSize: 11 }}>
                {r.valid_from && r.valid_to ? `${fmtDate(r.valid_from)} – ${fmtDate(r.valid_to)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result card
// ---------------------------------------------------------------------------
function ResultCard({ item }: { item: ClusterResult }) {
  const [expanded, setExpanded] = useState(false);
  const multi = item.merchant_count > 1;

  return (
    <div
      onClick={() => multi && setExpanded(x => !x)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${expanded ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow)',
        cursor: multi ? 'pointer' : 'default',
        transition: 'border-color .15s',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.canonical_name} width={56} height={56}
            style={{ objectFit: 'contain', borderRadius: 6, flexShrink: 0 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 6, flexShrink: 0,
            background: '#f1f5f9', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22,
          }}>🛒</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>
            {item.canonical_name}
          </div>
          {item.canonical_brand && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
              {item.canonical_brand}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <MerchantBadge name={item.best_merchant} />
            {item.valid_from && item.valid_to && (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                {fmtDate(item.valid_from)} – {fmtDate(item.valid_to)}
              </span>
            )}
            {multi && (
              <span style={{
                fontSize: 11, color: 'var(--accent)', fontWeight: 600,
                background: '#eff6ff', padding: '1px 6px', borderRadius: 4,
              }}>
                {expanded ? '▲' : '▼'} {item.merchant_count} marchands
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: item.best_price != null ? 'var(--green)' : 'var(--muted)',
          }}>
            {fmt(item.best_price)}
          </div>
          {multi && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>meilleur prix</div>
          )}
        </div>
      </div>

      {/* Comparison table */}
      {expanded && <CompareTable groupId={item.group_id} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Merchant filter chips
// ---------------------------------------------------------------------------
function MerchantFilter({
  merchants, selected, onToggle,
}: {
  merchants: string[];
  selected: Set<string>;
  onToggle: (name: string) => void;
}) {
  if (!merchants.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {merchants.map(m => {
        const active = selected.has(m);
        const bg = active ? (MERCHANT_COLORS[m] ?? '#2563eb') : 'var(--surface)';
        const fg = active ? (bg === '#ffd200' ? '#1e293b' : '#fff') : 'var(--muted)';
        return (
          <button
            key={m}
            onClick={() => onToggle(m)}
            style={{
              background: bg, color: fg,
              border: `1px solid ${active ? bg : 'var(--border)'}`,
              padding: '4px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all .12s',
            }}
          >{m}</button>
        );
      })}
      {selected.size > 0 && (
        <button
          onClick={() => selected.forEach(m => onToggle(m))}
          style={{
            background: 'transparent', color: 'var(--muted)',
            border: '1px solid var(--border)', padding: '4px 10px',
            borderRadius: 20, fontSize: 11, cursor: 'pointer',
          }}
        >✕ Tout</button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Home() {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<ClusterResult[]>([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [merchants, setMerchants]       = useState<string[]>([]);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load merchant list once
  useEffect(() => {
    fetch('/api/merchants')
      .then(r => r.json())
      .then((d: { name: string }[]) => setMerchants(Array.isArray(d) ? d.map(x => x.name) : []))
      .catch(() => {});
  }, []);

  const toggleMerchant = useCallback((name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const search = useCallback(async (q: string, sel: Set<string>) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (sel.size) params.set('merchants', [...sel].join(','));
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query, selected), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected, search]);

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 16px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
          🛒 Épicerie Promo
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Meilleurs prix des circulaires — Canada
        </p>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 18, pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="search"
          placeholder="ex: lait, poulet, beurre d'arachide…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{
            width: '100%', padding: '14px 16px 14px 44px', fontSize: 16,
            border: '2px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--surface)', outline: 'none',
            boxShadow: 'var(--shadow)', transition: 'border-color .15s',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: 'var(--muted)',
          }}>⏳</span>
        )}
      </div>

      {/* Merchant filter */}
      <MerchantFilter merchants={merchants} selected={selected} onToggle={toggleMerchant} />

      {/* Stats bar */}
      {searched && !loading && (
        <div style={{
          fontSize: 13, color: 'var(--muted)', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            {results.length === 0
              ? 'Aucun résultat'
              : `${results.length} produit${results.length > 1 ? 's' : ''} — trié par prix`}
          </span>
          {results.length > 0 && (
            <span style={{
              background: '#f0fdf4', color: 'var(--green)',
              padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            }}>
              Meilleur : {fmt(results[0].best_price)} chez {results[0].best_merchant}
            </span>
          )}
        </div>
      )}

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map(item => <ResultCard key={item.group_id} item={item} />)}
      </div>

      {/* Empty */}
      {searched && !loading && results.length === 0 && query.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--muted)', fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤷</div>
          <p>Aucun produit trouvé pour <strong>"{query}"</strong></p>
          <p style={{ marginTop: 6 }}>Essayez un autre mot-clé.</p>
        </div>
      )}

      {/* Idle */}
      {!searched && query.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🥦 🥛 🍗 🧀</div>
          <p>Tapez un produit pour voir les meilleurs prix de la semaine.</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>Cliquez sur un résultat multi-marchands pour comparer les prix.</p>
        </div>
      )}
    </main>
  );
}
