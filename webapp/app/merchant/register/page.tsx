'use client';
import { useState } from 'react';
import Link from 'next/link';

const COUNTRIES = [
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'US', name: '🇺🇸 États-Unis' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'BE', name: '🇧🇪 Belgique' },
  { code: 'CH', name: '🇨🇭 Suisse' },
  { code: 'GB', name: '🇬🇧 Royaume-Uni' },
  { code: 'DE', name: '🇩🇪 Allemagne' },
  { code: 'ES', name: '🇪🇸 Espagne' },
  { code: 'IT', name: '🇮🇹 Italie' },
  { code: 'AU', name: '🇦🇺 Australie' },
  { code: 'MX', name: '🇲🇽 Mexique' },
  { code: 'BR', name: '🇧🇷 Brésil' },
  { code: 'MA', name: '🇲🇦 Maroc' },
  { code: 'SN', name: '🇸🇳 Sénégal' },
  { code: 'CI', name: '🇨🇮 Côte d\'Ivoire' },
  { code: 'OTHER', name: '🌍 Autre pays' },
];

interface FormData {
  name: string;
  country: string;
  city: string;
  website_url: string;
  contact_email: string;
  contact_name: string;
  phone: string;
}

interface SuccessData {
  merchant_id: number;
  api_key: string;
  message: string;
}

export default function MerchantRegisterPage() {
  const [form, setForm] = useState<FormData>({
    name: '', country: 'CA', city: '', website_url: '',
    contact_email: '', contact_name: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const country = form.country === 'OTHER' ? 'XX' : form.country;
      const res = await fetch('/api/merchant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, country }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur inconnue.'); return; }
      setSuccess(data as SuccessData);
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: '0.95rem',
    border: '1.5px solid #d1d5db', borderRadius: 8, background: '#fff',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 600, fontSize: '0.88rem',
    color: '#374151', marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e0e4ef',
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/merchant" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1a73e8' }}>Prixlo</span>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>/ Inscrire mon magasin</span>
        </Link>
        <Link href="/" style={{ color: '#6b7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Retour</Link>
      </header>

      <main style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px 64px' }}>
        {success ? (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '40px 32px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: 12 }}>
              Demande reçue !
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>{success.message}</p>

            <div style={{
              background: '#f4f6fb', borderRadius: 10, padding: '20px',
              textAlign: 'left', marginBottom: 28,
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 6 }}>Votre clé API :</div>
              <code style={{
                display: 'block', wordBreak: 'break-all', fontSize: '0.88rem',
                color: '#111', fontFamily: 'monospace', background: '#e8f0fe',
                padding: '10px 14px', borderRadius: 6,
              }}>
                {success.api_key}
              </code>
              <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: 8 }}>
                ⚠️ Copiez et conservez cette clé — elle ne sera plus affichée.
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.7 }}>
              <strong>Prochaines étapes :</strong><br />
              1. Nous examinerons votre dossier dans les 48h<br />
              2. Vous recevrez un email de confirmation<br />
              3. Une fois approuvé, utilisez votre clé API pour soumettre vos promos
            </div>

            <Link href="/merchant" style={{
              display: 'inline-block', marginTop: 24,
              color: '#1a73e8', textDecoration: 'none', fontWeight: 600,
            }}>
              ← En savoir plus sur le portail marchand
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111', marginBottom: 8 }}>
                Inscrire votre magasin
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                Gratuit. Soumettez vos promotions en quelques minutes.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{
              background: '#fff', borderRadius: 16, padding: '32px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: 20, marginTop: 0 }}>
                Informations du magasin
              </h2>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Nom du magasin *</label>
                <input
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="ex: Épicerie Sainte-Marie" required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Pays *</label>
                  <select name="country" value={form.country} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input
                    name="city" value={form.city} onChange={handleChange}
                    placeholder="ex: Montréal"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Site web</label>
                <input
                  name="website_url" value={form.website_url} onChange={handleChange}
                  placeholder="https://monmagasin.com" type="url"
                  style={inputStyle}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: 24 }} />

              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: 20, marginTop: 0 }}>
                Contact
              </h2>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Courriel de contact *</label>
                <input
                  name="contact_email" value={form.contact_email} onChange={handleChange}
                  placeholder="contact@monmagasin.com" type="email" required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Nom du contact</label>
                  <input
                    name="contact_name" value={form.contact_name} onChange={handleChange}
                    placeholder="ex: Marie Tremblay"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input
                    name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+1 514 000-0000" type="tel"
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
                  padding: '12px 16px', color: '#dc2626', fontSize: '0.9rem', marginBottom: 20,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10,
                  background: loading ? '#93c5fd' : '#1a73e8',
                  color: '#fff', fontWeight: 700, fontSize: '1rem',
                  border: 'none', cursor: loading ? 'default' : 'pointer',
                }}
              >
                {loading ? 'Envoi en cours…' : 'Inscrire mon magasin →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
                En vous inscrivant, vous acceptez nos{' '}
                <Link href="/terms" style={{ color: '#1a73e8' }}>conditions d'utilisation</Link>.
                Votre courriel ne sera jamais partagé.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
