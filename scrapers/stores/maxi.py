"""
scrapers/stores/maxi.py — Circulaire Maxi/Provigo via API Loblaw
================================================================
Maxi et Provigo (groupe Loblaw) utilisent Flipp pour leurs circulaires
numériques. Ce module cible spécifiquement ces bannières.

Bannières couvertes: Maxi, Maxi & Cie, Provigo, No Frills,
                     Real Canadian Superstore, Loblaws, Zehrs

Usage autonome:
  python -m scrapers.stores.maxi
"""

from __future__ import annotations
import time
import requests

FLIPP_API   = "https://flipp.com/api/2.0/publications"
FLIPP_ITEMS = "https://flipp.com/api/2.0/flyers/{flyer_id}/items"
LOCALE      = "fr-ca"
POSTAL_CODES = [
    ("QC-Montreal",  "H2X1Y4"),
    ("QC-Quebec",    "G1R1J5"),
    ("QC-Laval",     "H7T2H2"),
    ("QC-Longueuil", "J4H1A1"),
    ("ON-Toronto",   "M5V2H1"),
    ("ON-Ottawa",    "K1P1J1"),
    ("ON-Hamilton",  "L8P1A1"),
    ("AB-Calgary",   "T2P1A1"),
    ("BC-Vancouver", "V6B1A1"),
]
TARGET_MERCHANTS = {
    "Maxi", "Maxi & Cie", "Provigo", "No Frills",
    "Real Canadian Superstore", "Loblaws", "Zehrs", "Your Independent Grocer",
}

HEADERS = {
    "User-Agent": "PrixloBot/1.0 (prixlo.ca; hello@prixlo.ca)",
    "Accept":     "application/json",
    "Referer":    "https://flipp.com/",
}


def _get_flyers(postal: str) -> list[dict]:
    try:
        r = requests.get(
            FLIPP_API,
            params={"locale": LOCALE, "postal_code": postal},
            headers=HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        return r.json() if isinstance(r.json(), list) else []
    except Exception:
        return []


def _get_items(flyer_id: int | str) -> list[dict]:
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
    seen_flyers: set[int] = set()
    results: list[dict] = []

    for region, postal in POSTAL_CODES:
        flyers = _get_flyers(postal)
        target_flyers = [
            f for f in flyers
            if any(t in (f.get("merchant", {}).get("name", "") if isinstance(f.get("merchant"), dict)
                         else str(f.get("merchant_name", "")))
                   for t in TARGET_MERCHANTS)
        ]

        for flyer in target_flyers:
            fid = flyer.get("id") or flyer.get("flyer_id")
            if not fid or fid in seen_flyers:
                continue
            seen_flyers.add(fid)

            merchant_name = (
                flyer.get("merchant", {}).get("name")
                if isinstance(flyer.get("merchant"), dict)
                else flyer.get("merchant_name", "Maxi")
            ) or "Maxi"

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

            time.sleep(0.3)

    return results


if __name__ == "__main__":
    import json
    items = collect()
    print(json.dumps(items, ensure_ascii=False, indent=2))
    print(f"\n✅ Maxi/Loblaw: {len(items)} items collectés", flush=True)
