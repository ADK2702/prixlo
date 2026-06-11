'use client';
import { useState, useEffect, useCallback } from 'react';

interface Submission {
  id: number;
  merchant_id: number;
  product_name: string;
  category: string | null;
  brand: string | null;
  sale_price: number;
  regular_price: number | null;
  valid_from: string;
  valid_to: string;
  country: string;
  status: string;
  created_at: string;
  merchant_accounts: { name: string; contact_email: string } | null;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<{ id: number; reason: string } | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?status=${status}&page=${page}`, {
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) { setSubmissions([]); return; }
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } finally {
      setLoading(false);
    }
  }, [authenticated, status, page, secret]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) { setAuthError('Secret requis.'); return; }
    setAuthenticated(true);
    setAuthError('');
  };

  const handleAction = async (id: number, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ action, id, reason }),
      });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        setRejectReason(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const cellStyle: React.CSSProperties = {
    padding: '10px 14px', fontSize: '0.85rem', color: '#374151',
    borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
  };

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f4f6fb', fontFamily: 'system-ui, sans-serif',
      }}>
        <form onSubmit={handleAuth} style={{
          background: '#fff', padding: '40px 36px', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: 360,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔐</div>
            <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#111', margin: 0 }}>Admin Prixlo</h1>
          </div>
          <input
            type="password" placeholder="Secret admin"
            value={secret} onChange={e => setSecret(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', fontSize: '0.95rem',
              border: '1.5px solid #d1d5db', borderRadius: 8,
              outline: 'none', boxSizing: 'border-box', marginBottom: 16,
              fontFamily: 'inherit',
            }}
          />
          {authError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{authError}</div>}
          <button type="submit" style={{
            width: '100%', padding: '12px', background: '#1a73e8', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
          }}>
            Accéder au panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#111', color: '#fff', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
          🛡️ Admin Prixlo
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem',
              background: status === s ? '#1a73e8' : '#374151',
              color: '#fff',
            }}>
              {s === 'pending' ? '⏳ En attente' : s === 'approved' ? '✅ Approuvés' : '❌ Rejetés'}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>Chargement…</div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>
            Aucune soumission en statut « {status} ».
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontWeight: 700, color: '#111' }}>{submissions.length} soumission(s)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['ID', 'Magasin', 'Produit', 'Prix solde', 'Prix normal', 'Valide jusqu\'au', 'Pays', 'Soumis', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', fontSize: '0.78rem', fontWeight: 700,
                        color: '#6b7280', textAlign: 'left', textTransform: 'uppercase',
                        borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} style={{ background: actionLoading === s.id ? '#f0f7ff' : '#fff' }}>
                      <td style={cellStyle}>{s.id}</td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>{s.merchant_accounts?.name ?? '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.merchant_accounts?.contact_email}</div>
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 200 }}>
                        <div style={{ fontWeight: 500 }}>{s.product_name}</div>
                        {s.brand && <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.brand}</div>}
                        {s.category && <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.category}</div>}
                      </td>
                      <td style={{ ...cellStyle, color: '#0d7a3e', fontWeight: 700 }}>
                        {s.sale_price.toFixed(2)} $
                      </td>
                      <td style={cellStyle}>
                        {s.regular_price ? `${s.regular_price.toFixed(2)} $` : '—'}
                      </td>
                      <td style={cellStyle}>{s.valid_to}</td>
                      <td style={cellStyle}>{s.country}</td>
                      <td style={{ ...cellStyle, whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {new Date(s.created_at).toLocaleDateString('fr-CA')}
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(s.id, 'approve')}
                              disabled={actionLoading === s.id}
                              style={{
                                padding: '5px 12px', background: '#0d7a3e', color: '#fff',
                                border: 'none', borderRadius: 6, cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.8rem', marginRight: 6,
                              }}
                            >
                              ✓ Approuver
                            </button>
                            {rejectReason?.id === s.id ? (
                              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                                <input
                                  placeholder="Raison du rejet"
                                  value={rejectReason.reason}
                                  onChange={e => setRejectReason({ id: s.id, reason: e.target.value })}
                                  style={{ padding: '4px 8px', fontSize: '0.8rem', border: '1px solid #d1d5db', borderRadius: 4, width: 160 }}
                                />
                                <button
                                  onClick={() => handleAction(s.id, 'reject', rejectReason.reason)}
                                  disabled={!rejectReason.reason || actionLoading === s.id}
                                  style={{
                                    padding: '4px 10px', background: '#dc2626', color: '#fff',
                                    border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem',
                                  }}
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => setRejectReason(null)}
                                  style={{ padding: '4px 8px', background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRejectReason({ id: s.id, reason: '' })}
                                style={{
                                  padding: '5px 12px', background: '#dc2626', color: '#fff',
                                  border: 'none', borderRadius: 6, cursor: 'pointer',
                                  fontWeight: 600, fontSize: '0.8rem',
                                }}
                              >
                                ✕ Rejeter
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ← Précédent
              </button>
              <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>Page {page}</span>
              <button
                disabled={submissions.length < 25}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
