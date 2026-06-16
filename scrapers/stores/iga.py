"""
scrapers/stores/iga.py — Circulaire IGA via API publique Flipp
==============================================================
IGA utilise la plateforme Flipp pour ses circulaires. Ce module
cible spécifiquement les marchands IGA (et IGA extra) pour obtenir
leurs données sans scanner tous les codes postaux.

Usage autonome:
  python -m scrapers.stores.iga > iga_items.json

Sortie: liste de dicts compatibles avec le format CSV du collector.py
  [{ merchant, region, flyer_id, item_id, name, brand,
     price, valid_from, valid_to, image_url }, ...]
"""

from __future__ import annotations
import time
import requests

FLIPP_API    = "https://flipp.com/api/2.0/publications"
FLIPP_ITEMS  = "https://flipp.com/api/2.0/flyers/{flyer_id}/items"
LOCALE       = "fr-ca"
POSTAL_CODES = [
    ("QC-Montreal",  "H2X1Y4"),
    ("QC-Quebec",    "G1R1J5"),
    ("QC-Laval",     "H7T2H2"),
    ("ON-Toronto",   "M5V2H1"),
    ("ON-Ottawa",    "K1P1J1"),
    ("AB-Calgary",   "T2P1A1"),
    ("BC-Vancouver", "V6B1A1"),
]
TARGET_MERCHANTS = {"IGA", "IGA extra", "Marché IGA"}

HEADERS = {
    "User-Agent":   "PrixloBot/1.0 (prixlo.ca; hello@prixlo.ca)",
    "Accept":       "application/json",
    "Referer":      "https://flipp.com/",
}


def _get_flyers(postal: str) -> list[dict]:
    """Retourne les publications disponibles pour un code postal."""
    try:
        r = requests.get(
            FLIPP_API,
            params={"locale": LOCALE, "postal_code": postal, "lang": "fr"},
            headers=HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        return r.json() if isinstance(r.json(), list) else []
    except Exception:
        return []


def _get_items(flyer_id: int | str) -> list[dict]:
    """Retourne les items d'un circulaire."""
    try:
        r = requests.get(
            FLIPP_ITEMS.format(flyer_id=flyer_id),
            headers=HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("items", data) if isinstance(data, dict) else data
    except Exception:
        return []


def collect() -> list[dict]:
    """
    Collecte les items IGA pour tous les codes postaux cibles.
    Déduplique par (flyer_id, item_id).
    """
    seen_flyers: set[int] = set()
    results: list[dict] = []

    for region, postal in POSTAL_CODES:
        flyers = _get_flyers(postal)
        iga_flyers = [
            f for f in flyers
            if any(t in (f.get("merchant", {}).get("name", "") if isinstance(f.get("merchant"), dict)
                         else str(f.get("merchant_name", "")))
                   for t in TARGET_MERCHANTS)
        ]

        for flyer in iga_flyers:
            fid = flyer.get("id") or flyer.get("flyer_id")
            if not fid or fid in seen_flyers:
                continue
            seen_flyers.add(fid)

            merchant_name = (
                flyer.get("merchant", {}).get("name")
                if isinstance(flyer.get("merchant"), dict)
                else flyer.get("merchant_name", "IGA")
            ) or "IGA"

            items = _get_items(fid)
            for item in items:
                price_raw = item.get("current_price") or item.get("price")
                try:
                    price = float(price_raw) if price_raw else None
                except (ValueError, TypeError):
                    price = None

                results.append({
                    "merchant":   merchant_name,
                    "region":     region,
                    "flyer_id":   fid,
                    "item_id":    item.get("id", ""),
                    "name":       (item.get("name") or item.get("description") or "").strip(),
                    "brand":      (item.get("brand") or "").strip(),
                    "price":      price,
                    "valid_from": (item.get("valid_from") or flyer.get("valid_from") or "")[:10],
                    "valid_to":   (item.get("valid_to")   or flyer.get("valid_to")   or "")[:10],
                    "image_url":  item.get("large_image_url") or item.get("image_url") or "",
                })

            time.sleep(0.3)  # Respecter le rate limit

    return results


if __name__ == "__main__":
    import json
    items = collect()
    print(json.dumps(items, ensure_ascii=False, indent=2))
    print(f"\n✅ IGA: {len(items)} items collectés", flush=True)
