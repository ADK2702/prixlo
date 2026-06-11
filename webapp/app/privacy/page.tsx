import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de Prixlo — comment nous collectons et utilisons vos données.',
};

const LAST_UPDATED = '10 juin 2026';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
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
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.25rem' }}>Politique de confidentialité</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: 14 }}>Dernière mise à jour : {LAST_UPDATED}</p>

        {[
          {
            title: '1. Données collectées',
            body: `Prixlo ne crée pas de compte utilisateur et ne collecte aucune donnée personnelle identifiable.
Nous recueillons uniquement des données anonymes d'utilisation (pages visitées, termes de recherche agrégés)
à des fins d'amélioration du service. Ces données ne permettent pas d'identifier un individu.`,
          },
          {
            title: '2. Cookies',
            body: `Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du site
(préférences de langue, cache de recherche locale). Aucun cookie publicitaire ou de suivi tiers n'est utilisé.`,
          },
          {
            title: '3. Données tierces',
            body: `Les prix affichés proviennent de sources publiques (circulaires, sites de détaillants).
Aucune donnée personnelle n'est transmise à des tiers.`,
          },
          {
            title: '4. Stockage local',
            body: `Votre navigateur peut stocker localement l'historique de vos recherches récentes afin
d'améliorer votre expérience. Ces données ne quittent jamais votre appareil et peuvent être
effacées à tout moment en vidant le cache de votre navigateur.`,
          },
          {
            title: '5. Sécurité',
            body: `Toutes les communications entre votre appareil et nos serveurs sont chiffrées via HTTPS.
Nous appliquons des mesures de sécurité standard pour protéger nos infrastructures.`,
          },
          {
            title: '6. Vos droits',
            body: `Conformément à la Loi 25 (Québec) et à la LPRPDE (Canada), vous avez le droit d'accéder
aux données vous concernant et d'en demander la suppression. Puisque nous ne collectons aucune
donnée personnelle, il n'y a rien à supprimer dans nos systèmes.`,
          },
          {
            title: '7. Contact',
            body: `Pour toute question relative à la confidentialité, contactez-nous à privacy@prixlo.ca`,
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--text-2)', whiteSpace: 'pre-line' }}>{body}</p>
          </section>
        ))}

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', fontSize: 14, color: 'var(--muted)' }}>
          <Link href="/about" style={{ color: 'var(--muted)' }}>À propos</Link>
          <Link href="/terms" style={{ color: 'var(--muted)' }}>Conditions d'utilisation</Link>
          <Link href="/" style={{ color: 'var(--accent)' }}>← Retour à la recherche</Link>
        </div>
      </main>
    </div>
  );
}
