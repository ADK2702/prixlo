import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://epiceriepromo.ca';
const SITE_NAME = 'Épicerie Promo';
const DESCRIPTION =
  'Comparez les prix des circulaires épicerie au Canada : IGA, Metro, Maxi, Walmart et plus. Trouvez le meilleur prix chaque semaine.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Meilleurs prix épicerie Canada`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    'épicerie', 'promo', 'circulaire', 'prix', 'Canada',
    'IGA', 'Metro', 'Maxi', 'Walmart', 'comparateur',
    'rabais', 'flyer', 'promotion', 'nourriture',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'fr_CA',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Meilleurs prix épicerie Canada`,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Épicerie Promo — comparateur de prix',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Meilleurs prix épicerie Canada`,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1 },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
