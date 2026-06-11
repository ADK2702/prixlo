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
  'IGA': '#c8102e',
  'Metro': '#00843d',
  'Maxi': '#ffd200',
  'Walmart': '#0071ce',
  'Walmart Supercentre': '#0071ce',
  'Provigo': '#e31837',
  'Super C': '#e31837',
  'Costco': '#005daa',
};

function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/lait|fromage|beurre|crème|yogourt|yogurt|crémerie/.test(n)) return '🥛';
  if (/poulet|boeuf|porc|viande|steak|agneau|veau|dinde|saucisse|jambon/.test(n)) return '🥩';
  if (/pain|baguette|brioche|croissant|muffin/.test(n)) return '🍞';
  if (/pomme|banane|orange|raisin|fraise|bleuet|melon|fruit|poire|pêche|mangue|kiwi/.test(n)) return '🍎';
  if (/légume|tomate|carotte|brocoli|laitue|oignon|poivron|salade|épinard|chou|choufleur/.test(n)) return '🥦';
  if (/poisson|saumon|thon|crevette|homard|crabe|tilapia|morue/.test(n)) return '🐟';
  if (/jus|boisson|eau|café|thé|tisane|smoothie/.test(n)) return '🧃';
  if (/céréale|gruau|riz|pâte|farine|avoine|granola/.test(n)) return '🌾';
  if (/chocolat|biscuit|gâteau|croustille|bonbon|chips|barr/.test(n)) return '🍫';
  if (/huile|vinaigrette|sauce|ketchup|mayo|moutarde|condiment/.test(n)) return '🫙';
  if (/oeuf|œuf/.test(n)) return '🥚';
  if (/détergent|savon|shampoo|papier|nettoyant|produit ménager/.test(n)) return '🧴';
  if (/pizza|lasagne|plat cuisiné|prêt/.test(n)) return '🍕';
  if (/café|expresso/.test(n)) return '☕';
  return '🛒';
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function MerchantBadge({ name }: { name: string }) {
  const bg = MERCHANT_COLORS[name] ?? '#1a73e8';
  return (
    <span style={{
      background: bg,
      color: bg === '#ffd200' ? '#1e293b' : '#fff',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '.3px',
      whiteSpace: 'nowrap',
    }}>{name}</span>
  );
}

function ProductImage({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const emoji = getCategoryEmoji(name);

  if (!url || failed) {
    return <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>;
  }
  return (
    <img
      src={url}
      alt={name}
      width={60}
      height={60}
      style={{ objectFit: 'contain', width: '100%', height: '100%', borderRadius: 6 }}
      onError={() => setFailed(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// Comparison table
// ---------------------------------------------------------------------------
function CompareTable({ groupId }: { groupId: string }) {
  const [rows, setRows] = useState<MerchantPrice[] | null>(null);

  useEffect(() => {
    fetch(`/api/cluster/${encodeURIComponent(groupId)}`)
      .then(r => r.json())
      .then(d => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, [groupId]);

  if (!rows) {
    return <p style={{ padding: '10px 0', color: 'var(--muted)', fontSize: 12 }}>Chargement…</p>;
  }
  if (!rows.length) return null;

  const bestPrice = rows[0]?.price;

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'left' }}>
            <th style={{ paddingBottom: 6, fontWeight: 600 }}>Marchand</th>
            <th style={{ paddingBottom: 6, fontWeight: 600 }}>Nom</th>
            <th style={{ paddingBottom: 6, fontWeight: 600, textAlign: 'right' }}>Prix</th>
            <th style={{ paddingBottom: 6, fontWeight: 600, textAlign: 'right' }}>Valide</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isBest = r.price != null && r.price === bestPrice;
            return (
              <tr key={r.id} style={{
                background: isBest ? 'var(--green-light)' : i % 2 === 0 ? 'transparent' : 'var(--surface-2)',
              }}>
                <td style={{ padding: '6px 4px' }}><MerchantBadge name={r.merchant} /></td>
                <td style={{
                  padding: '6px 4px', maxWidth: 200,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{r.name}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: isBest ? 'var(--green)' : 'var(--text)' }}>
                    {fmt(r.price)}
                  </span>
                  {isBest && (
                    <span style={{
                      marginLeft: 6, background: 'var(--green)', color: '#fff',
                      fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                      verticalAlign: 'middle',
                    }}>MEILLEUR</span>
                  )}
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: 'var(--muted)', fontSize: 11 }}>
                  {r.valid_from && r.valid_to
                    ? `${fmtDate(r.valid_from)} – ${fmtDate(r.valid_to)}`
                    : '—'}
                </td>
              </tr>
            );
          })}
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
      role={multi ? 'button' : undefined}
      tabIndex={multi ? 0 : undefined}
      onKeyDown={e => { if (multi && (e.key === 'Enter' || e.key === ' ')) setExpanded(x => !x); }}
      style={{
        background: 'var(--surface)',
        border: `0.5px solid ${expanded ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        boxShadow: expanded
          ? '0 0 0 2px rgba(26,115,232,.12), var(--shadow-card)'
          : 'var(--shadow-card)',
        cursor: multi ? 'pointer' : 'default',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Product image */}
        <div style={{
          width: 60, height: 60, borderRadius: 10, flexShrink: 0,
          background: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <ProductImage url={item.image_url} name={item.canonical_name} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>
            {item.canonical_name}
          </div>
          {item.canonical_brand && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>
              {item.canonical_brand}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <MerchantBadge name={item.best_merchant} />
            {item.valid_from && item.valid_to && (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                {fmtDate(item.valid_from)} – {fmtDate(item.valid_to)}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 2 }}>
          <div style={{
            fontSize: 22, fontWeight: 800, lineHeight: 1,
            color: item.best_price != null ? 'var(--green)' : 'var(--muted)',
          }}>
            {fmt(item.best_price)}
          </div>
          {multi && (
            <div style={{
              marginTop: 5, fontSize: 11, color: 'var(--accent)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
              {item.merchant_count} marchands
            </div>
          )}
          {!multi && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>meilleur prix</div>
          )}
        </div>
      </div>

      {/* Comparison table (expanded) */}
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
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto',
      paddingBottom: 6, marginBottom: 14,
      scrollbarWidth: 'none',
      msOverflowStyle: 'none' as React.CSSProperties['msOverflowStyle'],
    } as React.CSSProperties}>
      {merchants.map(m => {
        const active = selected.has(m);
        const bg = active ? (MERCHANT_COLORS[m] ?? '#1a73e8') : 'var(--surface)';
        const fg = active ? (bg === '#ffd200' ? '#1e293b' : '#fff') : 'var(--muted)';
        return (
          <button
            key={m}
            onClick={() => onToggle(m)}
            style={{
              background: bg, color: fg,
              border: `1.5px solid ${active ? bg : 'var(--border)'}`,
              padding: '5px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >{m}</button>
        );
      })}
      {selected.size > 0 && (
        <button
          onClick={() => [...selected].forEach(m => onToggle(m))}
          style={{
            background: 'transparent', color: 'var(--muted)',
            border: '1.5px solid var(--border)',
            padding: '5px 12px', borderRadius: 20,
            fontSize: 11, flexShrink: 0,
          }}
        >✕ Effacer</button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staleness banner (Phase 3)
// ---------------------------------------------------------------------------
function StalenessBanner({ daysOld }: { daysOld: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || daysOld < 8) return null;
  return (
    <div style={{
      background: 'var(--orange-light)', border: '1px solid #fcd34d',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 8, fontSize: 13, marginBottom: 16,
    }}>
      <span>
        ⚠️ Données non mises à jour depuis <strong>{daysOld} jours</strong>. Certains prix peuvent être inexacts.
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 18, padding: '0 4px', lineHeight: 1,
        }}
        aria-label="Fermer"
      >×</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick search chips
// ---------------------------------------------------------------------------
const QUICK_SEARCHES = [
  { emoji: '🥛', label: 'Lait' }, { emoji: '🥩', label: 'Poulet' },
  { emoji: '🧀', label: 'Fromage' }, { emoji: '🍞', label: 'Pain' },
  { emoji: '🥚', label: 'Oeufs' }, { emoji: '🍎', label: 'Pomme' },
];

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Newsletter banner (Phase 8)
// ---------------------------------------------------------------------------
function NewsletterBanner() {
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'ok' : 'err');
    } catch {
      setStatus('err');
    }
  }

  return (
    <section style={{
      background: 'linear-gradient(135deg, #e8f0fe 0%, #ecfdf5 100%)',
      borderTop: '1px solid var(--border)',
      padding: '32px 16px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          📬 Les meilleures promos chaque semaine
        </p>
        <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>
          On sélectionne les 10 meilleures offres pour vous. Gratuit, sans spam.
        </p>

        {status === 'ok' ? (
          <div style={{
            background: '#ecfdf5', border: '1px solid #6ee7b7',
            borderRadius: 12, padding: '14px 20px', color: '#065f46', fontWeight: 600,
          }}>
            ✅ Inscription confirmée ! On vous envoie les promos chaque mercredi.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={{
                flex: '1 1 220px', maxWidth: 320,
                padding: '12px 16px', borderRadius: 10,
                border: '1.5px solid var(--border)',
                fontSize: 15, outline: 'none',
                background: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '12px 20px', borderRadius: 10,
                background: 'var(--accent)', color: '#fff',
                border: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: 15, opacity: status === 'loading' ? 0.7 : 1,
              }}
            >
              {status === 'loading' ? '…' : "M'inscrire"}
            </button>
          </form>
        )}

        {status === 'err' && (
          <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>
            Une erreur est survenue. Réessayez dans un instant.
          </p>
        )}

        <button
          onClick={() => setDismissed(true)}
          style={{
            marginTop: 14, fontSize: 12, color: 'var(--muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Non merci
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Home() {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<ClusterResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [merchants, setMerchants] = useState<string[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [dataAge, setDataAge]     = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load merchants + health check on mount
  useEffect(() => {
    fetch('/api/merchants')
      .then(r => r.json())
      .then((d: { name: string }[]) =>
        setMerchants(Array.isArray(d) ? d.map(x => x.name) : []))
      .catch(() => {});

    fetch('/api/health')
      .then(r => r.json())
      .then((d: { days_since_update?: number }) =>
        setDataAge(typeof d.days_since_update === 'number' ? d.days_since_update : 0))
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
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
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

  const isIdle = query.length === 0;

  return (
    <>
      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: 920, width: '100%', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, background: 'var(--accent)', borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 15,
            }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>Prixlo</span>
          </a>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: '#e8f0fe', color: 'var(--accent)',
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
            }}>🍁 Canada</span>
            <a href="/about" style={{ fontSize: 12, color: 'var(--muted)' }}>À propos</a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '0 16px 80px' }}>

        {/* ── Staleness alert ── */}
        {dataAge > 0 && (
          <div style={{ paddingTop: 16 }}>
            <StalenessBanner daysOld={dataAge} />
          </div>
        )}

        {/* ── Hero (idle state) ── */}
        {isIdle && (
          <div style={{ textAlign: 'center', padding: '56px 16px 36px' }}>
            <h1 style={{
              fontSize: 34, fontWeight: 800, letterSpacing: '-0.8px',
              lineHeight: 1.2, marginBottom: 12,
            }}>
              Meilleurs prix épicerie,{' '}
              <span style={{ color: 'var(--accent)' }}>en un clic</span>
            </h1>
            <p style={{
              color: 'var(--muted)', fontSize: 15,
              maxWidth: 440, margin: '0 auto 32px',
              lineHeight: 1.5,
            }}>
              Comparez les circulaires de 50+ épiceries canadiennes et trouvez les meilleurs prix chaque semaine.
            </p>
          </div>
        )}

        {/* ── Search bar ── */}
        <div style={{ position: 'relative', marginBottom: isIdle ? 16 : 16, marginTop: isIdle ? 0 : 24 }}>
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            fontSize: 17, pointerEvents: 'none', zIndex: 1,
          }}>🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Rechercher… ex: lait, poulet, beurre"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '14px 50px 14px 48px',
              fontSize: 15,
              border: '1.5px solid var(--border)',
              borderRadius: isIdle ? 24 : 12,
              background: 'var(--surface)',
              outline: 'none',
              boxShadow: isIdle ? 'var(--shadow-md)' : 'var(--shadow)',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,.12)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = isIdle ? 'var(--shadow-md)' : 'var(--shadow)';
            }}
          />
          {loading && (
            <span style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--muted)', fontSize: 13,
            }}>⏳</span>
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setSearched(false); setResults([]); inputRef.current?.focus(); }}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: '#cbd5e1', border: 'none', borderRadius: '50%',
                width: 20, height: 20, fontSize: 12, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Effacer"
            >×</button>
          )}
        </div>

        {/* ── Stats row (idle) ── */}
        {isIdle && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 36 }}>
            <strong style={{ color: 'var(--text)' }}>183 000+</strong> produits ·{' '}
            <strong style={{ color: 'var(--text)' }}>50+</strong> épiceries ·{' '}
            Mis à jour <strong style={{ color: 'var(--text)' }}>chaque semaine</strong>
          </p>
        )}

        {/* ── Merchant filter ── */}
        <MerchantFilter merchants={merchants} selected={selected} onToggle={toggleMerchant} />

        {/* ── Results count ── */}
        {searched && !loading && results.length > 0 && (
          <div style={{
            fontSize: 13, color: 'var(--muted)', marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 8,
          }}>
            <span>
              {results.length} produit{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </span>
            <span style={{
              background: 'var(--green-light)', color: 'var(--green)',
              padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            }}>
              Meilleur : {fmt(results[0].best_price)} chez {results[0].best_merchant}
            </span>
          </div>
        )}

        {/* ── Results grid ── */}
        {results.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 10,
          }}>
            {results.map(item => <ResultCard key={item.group_id} item={item} />)}
          </div>
        )}

        {/* ── No results ── */}
        {searched && !loading && results.length === 0 && query.length >= 2 && (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 46, marginBottom: 14 }}>🤷</div>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>
              Aucun résultat pour « {query} »
            </p>
            <p style={{ fontSize: 13 }}>
              Essayez un autre mot-clé ou revenez la semaine prochaine.
            </p>
          </div>
        )}

        {/* ── Idle: quick search chips ── */}
        {isIdle && (
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'center',
            flexWrap: 'wrap', marginTop: 4,
          }}>
            {QUICK_SEARCHES.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => {
                  setQuery(label);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                style={{
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 20, padding: '7px 18px',
                  fontSize: 13, color: 'var(--text)',
                  boxShadow: 'var(--shadow)',
                }}
              >{emoji} {label}</button>
            ))}
          </div>
        )}
      </main>

      {/* ── Newsletter Banner ── */}
      <NewsletterBanner />

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '28px 16px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--muted)',
        background: 'var(--surface)',
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 20, justifyContent: 'center',
            flexWrap: 'wrap', marginBottom: 10,
          }}>
            <a href="/about" style={{ color: 'var(--muted)' }}>À propos</a>
            <a href="/privacy" style={{ color: 'var(--muted)' }}>Confidentialité</a>
            <a href="/terms" style={{ color: 'var(--muted)' }}>Conditions</a>
          </div>
          <p>© {new Date().getFullYear()} Prixlo · Données des circulaires publiques canadiennes</p>
        </div>
      </footer>
    </>
  );
}
