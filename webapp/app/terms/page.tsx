import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions d'utilisation de Prixlo — les règles qui gouvernent l'utilisation de notre service.",
};

const LAST_UPDATED = '10 juin 2026';

export default function TermsPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: '0.25rem' }}>{"Conditions d'utilisation"}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: 14 }}>Dernière mise à jour : {LAST_UPDATED}</p>

        {[
          {
            title: '1. Acceptation des conditions',
            body: `En utilisant Prixlo (le « Service »), vous acceptez les présentes conditions d'utilisation.
Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Service.`,
          },
          {
            title: '2. Description du service',
            body: `Prixlo est un comparateur de prix d'épicerie qui agrège des données publiques provenant
des circulaires et sites web des détaillants alimentaires. Les prix affichés sont fournis
à titre informatif uniquement et peuvent ne pas refléter les prix en magasin à la seconde près.`,
          },
          {
            title: '3. Exactitude des prix',
            body: `Prixlo s'efforce de maintenir des données à jour, mais ne garantit pas l'exactitude,
l'exhaustivité ou l'actualité des prix affichés. Vérifiez toujours le prix final auprès
du détaillant avant votre achat. Prixlo ne peut être tenu responsable des écarts de prix.`,
          },
          {
            title: '4. Propriété intellectuelle',
            body: `Le code source, le design et la marque Prixlo sont protégés. Les données de prix
appartiennent à leurs détaillants respectifs et sont utilisées à des fins d'information
publique conformément à la doctrine de l'utilisation équitable.`,
          },
          {
            title: '5. Utilisation acceptable',
            body: `Vous vous engagez à ne pas :
• Utiliser des robots ou scrapers automatisés pour extraire massivement nos données
• Surcharger nos serveurs intentionnellement
• Utiliser le Service à des fins commerciales sans accord préalable
• Contourner nos mesures de sécurité

Notre propre collecteur (PrixloBot/1.0) est identifié auprès des détaillants.`,
          },
          {
            title: '6. Limitation de responsabilité',
            body: `Prixlo est fourni « tel quel », sans garantie d'aucune sorte. En aucun cas Prixlo ne
sera responsable de pertes ou dommages résultant de l'utilisation du Service.`,
          },
          {
            title: '7. Modifications',
            body: `Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
prennent effet immédiatement après leur publication sur cette page.`,
          },
          {
            title: '8. Droit applicable',
            body: `Ces conditions sont régies par les lois de la province de Québec et du Canada.
Tout litige sera soumis à la juridiction des tribunaux du Québec.`,
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
            <p style={{ lineHeight: 1.8, color: 'var(--text-2)', whiteSpace: 'pre-line' }}>{body}</p>
          </section>
        ))}

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', fontSize: 14, color: 'var(--muted)' }}>
          <Link href="/about" style={{ color: 'var(--muted)' }}>À propos</Link>
          <Link href="/privacy" style={{ color: 'var(--muted)' }}>Confidentialité</Link>
          <Link href="/" style={{ color: 'var(--accent)' }}>← Retour à la recherche</Link>
        </div>
      </main>
    </div>
  );
}
