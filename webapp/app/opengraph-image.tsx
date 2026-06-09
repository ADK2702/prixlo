import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Épicerie Promo — Meilleurs prix épicerie Canada';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Merchant color bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 48, borderRadius: 8, overflow: 'hidden' }}>
          {['#c8102e','#00843d','#ffd200','#0071ce'].map((c, i) => (
            <div key={i} style={{ width: 60, height: 8, background: c }} />
          ))}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 80, fontWeight: 900, color: '#fff',
          letterSpacing: '-2px', marginBottom: 16,
        }}>
          🛒 Épicerie Promo
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 32, color: '#94a3b8', fontWeight: 400, textAlign: 'center',
          maxWidth: 800,
        }}>
          Comparez les prix des circulaires en temps réel
        </div>

        {/* Merchant pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {[
            { name: 'IGA', bg: '#c8102e' },
            { name: 'Metro', bg: '#00843d' },
            { name: 'Maxi', bg: '#ffd200', fg: '#1e293b' },
            { name: 'Walmart', bg: '#0071ce' },
          ].map(({ name, bg, fg }) => (
            <div key={name} style={{
              background: bg, color: fg ?? '#fff',
              padding: '10px 28px', borderRadius: 40,
              fontSize: 22, fontWeight: 700,
            }}>{name}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
