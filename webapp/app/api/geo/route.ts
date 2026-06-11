import { NextRequest, NextResponse } from 'next/server';

// Phase 7 — Geo detection for multi-country support
// Returns the user's detected country/locale based on Vercel geo headers
// Client uses this to filter results and display the right currency/flag

export interface GeoResponse {
  country: string;       // ISO 3166-1 alpha-2, e.g. "CA", "US", "FR"
  country_name: string;
  currency: string;      // ISO 4217, e.g. "CAD", "USD", "EUR"
  currency_symbol: string;
  locale: string;        // BCP-47, e.g. "fr-CA", "en-US"
  flag: string;          // emoji flag
  supported: boolean;    // whether we have data for this country
}

// Countries we have scraper data for (Phase 7 expansion)
const SUPPORTED_COUNTRIES = new Set(['CA', 'US', 'FR', 'BE', 'CH']);

const COUNTRY_MAP: Record<string, Omit<GeoResponse, 'country' | 'supported'>> = {
  CA: { country_name: 'Canada',        currency: 'CAD', currency_symbol: '$',  locale: 'fr-CA', flag: '🇨🇦' },
  US: { country_name: 'États-Unis',    currency: 'USD', currency_symbol: '$',  locale: 'en-US', flag: '🇺🇸' },
  FR: { country_name: 'France',        currency: 'EUR', currency_symbol: '€',  locale: 'fr-FR', flag: '🇫🇷' },
  BE: { country_name: 'Belgique',      currency: 'EUR', currency_symbol: '€',  locale: 'fr-BE', flag: '🇧🇪' },
  CH: { country_name: 'Suisse',        currency: 'CHF', currency_symbol: 'CHF',locale: 'fr-CH', flag: '🇨🇭' },
  GB: { country_name: 'Royaume-Uni',   currency: 'GBP', currency_symbol: '£',  locale: 'en-GB', flag: '🇬🇧' },
  DE: { country_name: 'Allemagne',     currency: 'EUR', currency_symbol: '€',  locale: 'de-DE', flag: '🇩🇪' },
  ES: { country_name: 'Espagne',       currency: 'EUR', currency_symbol: '€',  locale: 'es-ES', flag: '🇪🇸' },
  IT: { country_name: 'Italie',        currency: 'EUR', currency_symbol: '€',  locale: 'it-IT', flag: '🇮🇹' },
  AU: { country_name: 'Australie',     currency: 'AUD', currency_symbol: '$',  locale: 'en-AU', flag: '🇦🇺' },
  NZ: { country_name: 'Nouvelle-Zélande', currency: 'NZD', currency_symbol: '$', locale: 'en-NZ', flag: '🇳🇿' },
  MX: { country_name: 'Mexique',       currency: 'MXN', currency_symbol: '$',  locale: 'es-MX', flag: '🇲🇽' },
  BR: { country_name: 'Brésil',        currency: 'BRL', currency_symbol: 'R$', locale: 'pt-BR', flag: '🇧🇷' },
  JP: { country_name: 'Japon',         currency: 'JPY', currency_symbol: '¥',  locale: 'ja-JP', flag: '🇯🇵' },
  KR: { country_name: 'Corée du Sud',  currency: 'KRW', currency_symbol: '₩',  locale: 'ko-KR', flag: '🇰🇷' },
};

const DEFAULT: GeoResponse = {
  country: 'CA',
  supported: true,
  ...COUNTRY_MAP.CA,
};

export async function GET(req: NextRequest) {
  // Vercel injects x-vercel-ip-country from its edge network
  const country = (
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??           // Cloudflare fallback
    'CA'
  ).toUpperCase();

  const meta = COUNTRY_MAP[country];

  const response: GeoResponse = meta
    ? { country, supported: SUPPORTED_COUNTRIES.has(country), ...meta }
    : DEFAULT;

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Vary': 'x-vercel-ip-country',
    },
  });
}
