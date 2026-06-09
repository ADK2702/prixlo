"""
Collecteur Flipp - Canada complet
Récupère tous les circulaires d'épicerie pour ~40 codes postaux canadiens.
Déduplique par flyer_type_id pour ne fetcher chaque circulaire qu'une seule fois.
"""

import requests
import json
import random
import time
import csv
from datetime import datetime

# ─── Codes postaux représentatifs par province/région ───────────────────────
POSTAL_CODES = {
    # Québec
    "QC-Montreal":      "H2X1Y4",
    "QC-Quebec":        "G1R1J5",
    "QC-Sherbrooke":    "J1H1S5",
    "QC-Laval":         "H7T2H2",
    "QC-Longueuil":     "J4H1A1",
    "QC-Gatineau":      "J8Y3R5",
    "QC-Saguenay":      "G7H1Z9",
    "QC-Trois-Rivieres":"G9A1T9",
    # Ontario
    "ON-Toronto":       "M5V2H1",
    "ON-Ottawa":        "K1P1J1",
    "ON-Hamilton":      "L8P1A1",
    "ON-London":        "N6A1A1",
    "ON-Windsor":       "N9A1A1",
    "ON-Kingston":      "K7L2N4",
    "ON-Sudbury":       "P3A1A1",
    "ON-Thunder-Bay":   "P7B1A1",
    "ON-Barrie":        "L4M1A1",
    "ON-Kitchener":     "N2G1A1",
    # Colombie-Britannique
    "BC-Vancouver":     "V6B1A1",
    "BC-Victoria":      "V8W1A1",
    "BC-Kelowna":       "V1Y1A1",
    "BC-Prince-George": "V2L3A1",
    "BC-Kamloops":      "V2C1A1",
    # Alberta
    "AB-Calgary":       "T2P1A1",
    "AB-Edmonton":      "T5J1A1",
    "AB-Lethbridge":    "T1J1A1",
    "AB-Red-Deer":      "T4N1A1",
    # Saskatchewan
    "SK-Regina":        "S4P1A1",
    "SK-Saskatoon":     "S7K1A1",
    # Manitoba
    "MB-Winnipeg":      "R3C1A1",
    "MB-Brandon":       "R7A1A1",
    # Nouveau-Brunswick
    "NB-Moncton":       "E1C1A1",
    "NB-Fredericton":   "E3B1A1",
    "NB-Saint-John":    "E2L1A1",
    # Nouvelle-Écosse
    "NS-Halifax":       "B3H1A1",
    "NS-Sydney":        "B1P1A1",
    # Île-du-Prince-Édouard
    "PE-Charlottetown": "C1A1A1",
    # Terre-Neuve
    "NL-Saint-Johns":   "A1B1A1",
    "NL-Corner-Brook":  "A2H1A1",
    # Territoires
    "YK-Whitehorse":    "Y1A1A1",
    "NT-Yellowknife":   "X1A1A1",
}

FLYERS_URL      = "https://flyers-ng.flippback.com/api/flipp/data?locale=fr&postal_code={}&sid={}"
FLYER_ITEMS_URL = "https://flyers-ng.flippback.com/api/flipp/flyers/{}/flyer_items?locale=fr&sid={}"

GROCERY_CATEGORIES = {"Groceries"}

def sid():
    return ''.join(str(random.randint(0,9)) for _ in range(16))

def get_flyers(postal_code):
    url = FLYERS_URL.format(postal_code, sid())
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return r.json().get("flyers", [])

def get_items(flyer_id):
    url = FLYER_ITEMS_URL.format(flyer_id, sid())
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    return r.json()

def main():
    seen_flyer_type_ids = set()   # déduplication
    all_flyers_meta = {}          # flyer_type_id → {merchant, region, flyer_id}
    all_items = []

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Démarrage — {len(POSTAL_CODES)} codes postaux\n")

    # ── Phase 1 : collecter tous les circulaires uniques ───────────────────
    for region, postal_code in POSTAL_CODES.items():
        print(f"  Scanning {region} ({postal_code})...", end=" ")
        try:
            flyers = get_flyers(postal_code)
            new = 0
            for f in flyers:
                cats = f.get("categories", [])
                if not GROCERY_CATEGORIES.intersection(cats):
                    continue
                ftid = f.get("flyer_type_id")
                if ftid and ftid not in seen_flyer_type_ids:
                    seen_flyer_type_ids.add(ftid)
                    all_flyers_meta[ftid] = {
                        "merchant":   f.get("merchant"),
                        "flyer_id":   f.get("id"),
                        "region":     region,
                        "valid_from": f.get("valid_from", "")[:10],
                        "valid_to":   f.get("valid_to", "")[:10],
                    }
                    new += 1
            print(f"{new} nouveaux circulaires (total unique: {len(seen_flyer_type_ids)})")
        except Exception as e:
            print(f"ERREUR: {e}")
        time.sleep(0.3)

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] {len(all_flyers_meta)} circulaires uniques à fetcher\n")

    # ── Phase 2 : fetcher les items de chaque circulaire unique ────────────
    for i, (ftid, meta) in enumerate(all_flyers_meta.items(), 1):
        merchant  = meta["merchant"]
        flyer_id  = meta["flyer_id"]
        region    = meta["region"]
        print(f"  [{i}/{len(all_flyers_meta)}] {merchant} ({region}) id:{flyer_id}...", end=" ")
        try:
            items = get_items(flyer_id)
            count = 0
            for item in items:
                price = item.get("price", "")
                all_items.append({
                    "merchant":   merchant,
                    "region":     region,
                    "flyer_id":   flyer_id,
                    "item_id":    item.get("id"),
                    "name":       item.get("name", ""),
                    "brand":      item.get("brand", ""),
                    "price":      price,
                    "valid_from": meta["valid_from"],
                    "valid_to":   meta["valid_to"],
                    "image_url":  item.get("cutout_image_url", ""),
                })
                count += 1
            print(f"{count} items")
        except Exception as e:
            print(f"ERREUR: {e}")
        time.sleep(0.4)

    # ── Phase 3 : sauvegarder ──────────────────────────────────────────────
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    # CSV
    csv_file = f"canada_flipp_{timestamp}.csv"
    if all_items:
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_items[0].keys())
            writer.writeheader()
            writer.writerows(all_items)

    # JSON résumé
    summary = {
        "generated_at":       datetime.now().isoformat(),
        "postal_codes_scanned": len(POSTAL_CODES),
        "unique_flyers":      len(all_flyers_meta),
        "total_items":        len(all_items),
        "merchants":          sorted(set(i["merchant"] for i in all_items)),
    }
    with open(f"canada_summary_{timestamp}.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✓ {len(all_items)} items sauvegardés dans {csv_file}")
    print(f"✓ {len(summary['merchants'])} marchands uniques")
    print(f"✓ Marchands: {', '.join(summary['merchants'])}")

    input("\nAppuie sur Entrée pour fermer...")

if __name__ == "__main__":
    main()
