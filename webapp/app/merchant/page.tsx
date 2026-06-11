'use client';
import Link from 'next/link';

const features = [
  {
    icon: '🌍',
    title: 'Portée mondiale',
    desc: 'Vos promos visibles par des acheteurs partout dans le monde — Canada, France, États-Unis et bien plus.',
  },
  {
    icon: '⚡',
    title: 'Gratuit & rapide',
    desc: 'Soumettez vos promotions en quelques minutes. Approbation en moins de 24h. Plan de base 100% gratuit.',
  },
  {
    icon: '📱',
    title: 'Mobile & web',
    desc: 'Vos promos affichées sur l\'application mobile Prixlo (iOS, Android) et sur prixlo.ca.',
  },
  {
    icon: '🔒',
    title: 'Contrôle total',
    desc: 'Vous gérez vos soumissions via API ou formulaire. Modifiez ou retirez une promo à tout moment.',
  },
  {
    icon: '📊',
    title: 'Statistiques',
    desc: 'Suivez les vues et clics sur vos promotions. (Disponible sur les plans partenaire et premium.)',
  },
  {
    icon: '🤝',
    title: 'Partenariat',
    desc: 'Rejoignez un réseau de commerçants qui croient en la transparence des prix pour les consommateurs.',
  },
];

const plans = [
  {
    name: 'Gratuit',
    price: '0 $ / mois',
    highlight: false,
    perks: [
      'Jusqu\'à 50 promos par soumission',
      'Approbation 24h',
      'Visible sur prixlo.ca et l\'app',
      'API d\'accès incluse',
    ],
  },
  {
    name: 'Partenaire',
    price: 'Contactez-nous',
    highlight: true,
    perks: [
      'Jusqu\'à 200 promos par soumission',
      'Priorité d\'approbation',
      'Statistiques de base',
      'Logo du magasin mis en avant',
      'Support prioritaire',
    ],
  },
  {
    name: 'Premium',
    price: 'Contactez-nous',
    highlight: false,
    perks: [
      'Jusqu\'à 500 promos par soumission',
      'Approbation automatique',
      'Statistiques avancées',
      'Intégration directe avec votre POS',
      'Gestionnaire de compte dédié',
    ],
  },
];

export default function MerchantPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e0e4ef',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1a73e8', letterSpacing: '-0.5px' }}>
            Prixlo
          </span>
          <span style={{ color: '#6b7280', fontSize: '0.85rem', marginLeft: 8 }}>Marchands</span>
        </Link>
        <Link href="/merchant/register" style={{
          background: '#1a73e8',
          color: '#fff',
          padding: '9px 20px',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          Inscrire mon magasin →
        </Link>
      </header>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
        color: '#fff',
        padding: '72px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏪</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, margin: '0 0 20px' }}>
            Listez vos promotions<br />sur Prixlo gratuitement
          </h1>
          <p style={{ fontSize: '1.15rem', opacity: 0.9, marginBottom: 36, lineHeight: 1.6 }}>
            Rejoignez des milliers de commerçants qui soumettent leurs promos directement.
            Atteignez des acheteurs qui comparent les prix avant d'aller en magasin.
          </p>
          <Link href="/merchant/register" style={{
            background: '#fff',
            color: '#1a73e8',
            padding: '14px 32px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'inline-block',
          }}>
            Commencer — c'est gratuit
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, marginBottom: 48, color: '#111' }}>
          Pourquoi rejoindre Prixlo ?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '28px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, color: '#111' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#fff', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, marginBottom: 48, color: '#111' }}>
            Comment ça marche ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              ['1', 'Inscrivez votre magasin', 'Remplissez le formulaire en 2 minutes. Vous recevrez une clé API unique.'],
              ['2', 'Soumettez vos promos', 'Via notre formulaire web ou directement via l\'API REST (idéal pour les chaînes).'],
              ['3', 'Révision en 24h', 'Notre équipe valide vos soumissions pour la qualité et l\'exactitude des prix.'],
              ['4', 'Visible sur Prixlo', 'Vos promotions apparaissent immédiatement sur prixlo.ca et l\'application mobile.'],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#1a73e8', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                }}>
                  {num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4, color: '#111' }}>{title}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, marginBottom: 48, color: '#111' }}>
          Plans et tarifs
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {plans.map(p => (
            <div key={p.name} style={{
              background: p.highlight ? '#1a73e8' : '#fff',
              color: p.highlight ? '#fff' : '#111',
              borderRadius: 16,
              padding: '32px 24px',
              boxShadow: p.highlight ? '0 8px 32px rgba(26,115,232,0.3)' : '0 1px 4px rgba(0,0,0,0.07)',
              position: 'relative',
            }}>
              {p.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#0d7a3e', color: '#fff', padding: '4px 16px',
                  borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  ★ Populaire
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24, opacity: 0.9 }}>{p.price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.perks.map(perk => (
                  <li key={perk} style={{ display: 'flex', gap: 8, fontSize: '0.9rem', alignItems: 'flex-start' }}>
                    <span style={{ color: p.highlight ? '#fff' : '#0d7a3e', fontWeight: 700 }}>✓</span>
                    <span style={{ opacity: 0.9 }}>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 32, color: '#6b7280', fontSize: '0.9rem' }}>
          Pour les plans partenaire et premium, écrivez-nous à{' '}
          <a href="mailto:hello@prixlo.ca" style={{ color: '#1a73e8' }}>hello@prixlo.ca</a>
        </p>
      </section>

      {/* CTA */}
      <section style={{ background: '#111', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 16 }}>Prêt à rejoindre Prixlo ?</h2>
        <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: '1rem' }}>Inscription gratuite. Aucune carte de crédit requise.</p>
        <Link href="/merchant/register" style={{
          background: '#1a73e8',
          color: '#fff',
          padding: '14px 36px',
          borderRadius: 10,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          display: 'inline-block',
        }}>
          Inscrire mon magasin →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ background: '#f4f6fb', padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
        <Link href="/" style={{ color: '#6b7280', marginRight: 16, textDecoration: 'none' }}>← Retour à Prixlo</Link>
        <Link href="/privacy" style={{ color: '#6b7280', marginRight: 16, textDecoration: 'none' }}>Confidentialité</Link>
        <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Conditions</Link>
      </footer>
    </div>
  );
}
