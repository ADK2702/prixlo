import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Prixlo compare les prix des circulaires épicerie au Canada pour vous aider à économiser chaque semaine.',
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(244,246,251,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1rem',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16,
            }}>P</div>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Prixlo</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.5rem' }}>À propos de Prixlo</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>La façon la plus simple de comparer les prix à l'épicerie</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.75rem' }}>🎯 Notre mission</h2>
          <p style={{ lineHeight: 1.7, color: 'var(--text-2)' }}>
            Prixlo rassemble les circulaires de toutes les grandes épiceries canadiennes en un seul endroit.
            Fini les comparaisons manuelles : tapez n'importe quel produit et voyez instantanément où il est
            le moins cher cette semaine — IGA, Metro, Maxi, Walmart, Provigo, Super C, et bien d'autres.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.75rem' }}>⚡ Comment ça marche</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {[
              ['📥', 'Collecte automatique', 'Nos robots collectent les circulaires de chaque épicerie chaque semaine.'],
              ['🔍', 'Regroupement intelligent', 'Les produits similaires sont regroupés pour une comparaison facile.'],
              ['💰', 'Prix en temps réel', 'Les prix sont toujours à jour et indiquent la date d\'expiration.'],
              ['📱', 'Disponible partout', 'Web, Android, iPhone — Prixlo s\'adapte à votre appareil.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.75rem' }}>🌍 Couverture</h2>
          <p style={{ lineHeight: 1.7, color: 'var(--text-2)' }}>
            Prixlo couvre actuellement plus de <strong>50 épiceries</strong> et <strong>183 000 prix</strong> partout au Canada.
            Nous ajoutons régulièrement de nouveaux détaillants — envoyez-nous vos suggestions !
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '0.75rem' }}>📬 Nous contacter</h2>
          <p style={{ lineHeight: 1.7, color: 'var(--text-2)' }}>
            Des suggestions, une épicerie manquante, ou un bug à signaler ?<br />
            Écrivez-nous à <a href="mailto:hello@prixlo.ca" style={{ color: 'var(--accent)' }}>hello@prixlo.ca</a>
          </p>
        </section>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', fontSize: 14, color: 'var(--muted)' }}>
          <Link href="/privacy" style={{ color: 'var(--muted)' }}>Confidentialité</Link>
          <Link href="/terms" style={{ color: 'var(--muted)' }}>Conditions d'utilisation</Link>
          <Link href="/" style={{ color: 'var(--accent)' }}>← Retour à la recherche</Link>
        </div>
      </main>
    </div>
  );
}
