"""
Collecteur Flipp — scan incrémental
Scanne de nouveaux codes postaux, ajoute uniquement les circulaires/items pas déjà dans le CSV existant.
"""

import requests, json, random, time, csv, glob, os
from datetime import datetime

# ─── NOUVEAUX codes postaux à ajouter ────────────────────────────────────────
NEW_POSTAL_CODES = {
    # Québec — régions manquantes
    "QC-Rimouski":           "G5L1A1",   # Bas-Saint-Laurent
    "QC-Riviere-du-Loup":   "G5R1A1",   # Bas-Saint-Laurent
    "QC-Matane":             "G4W1A1",   # Gaspésie / BSL
    "QC-Gaspe":              "G4X1A1",   # Gaspésie
    "QC-Sept-Iles":          "G4R1A1",   # Côte-Nord
    "QC-Baie-Comeau":        "G4Z1A1",   # Côte-Nord
    "QC-Val-dOr":            "J9P1A1",   # Abitibi-Témiscamingue
    "QC-Rouyn-Noranda":      "J9X1A1",   # Abitibi-Témiscamingue
    "QC-Saint-Jerome":       "J7Z1A1",   # Laurentides
    "QC-Joliette":           "J6E1A1",   # Lanaudière
    "QC-Saint-Hyacinthe":    "J2S1A1",   # Montérégie
    "QC-Granby":             "J2G1A1",   # Montérégie / Estrie
    "QC-Drummondville":      "J2B1A1",   # Centre-du-Québec
    # Ontario — régions manquantes
    "ON-Sault-Ste-Marie":    "P6A1A1",   # Nord Ontario
    "ON-North-Bay":          "P1B1A1",   # Nord Ontario
    "ON-Timmins":            "P4N1A1",   # Nord Ontario
    "ON-Peterborough":       "K9H1A1",   # Est Ontario
    "ON-Guelph":             "N1H1A1",   # Sud-Ouest Ontario
    # BC — régions manquantes
    "BC-Nanaimo":            "V9R1A1",   # Vancouver Island
    "BC-Cranbrook":          "V1C1A1",   # Kootenays
    # Alberta — régions manquantes
    "AB-Grande-Prairie":     "T8V1A1",   # Nord Alberta
    "AB-Medicine-Hat":       "T1A1A1",   # Sud Alberta
    # Nunavut
    "NU-Iqaluit":            "X0A0H0",
}

FLYERS_URL      = "https://flyers-ng.flippback.com/api/flipp/data?locale=fr&postal_code={}&sid={}"
FLYER_ITEMS_URL = "https://flyers-ng.flippback.com/api/flipp/flyers/{}/flyer_items?locale=fr&sid={}"
GROCERY_CATEGORIES = {"Groceries"}

def sid():
    return ''.join(str(random.randint(0,9)) for _ in range(16))

def get_flyers(postal_code):
    r = requests.get(FLYERS_URL.format(postal_code, sid()), timeout=15)
    r.raise_for_status()
    return r.json().get("flyers", [])

def get_items(flyer_id):
    r = requests.get(FLYER_ITEMS_URL.format(flyer_id, sid()), timeout=15)
    r.raise_for_status()
    return r.json()

def load_existing_csv():
    """Charge le CSV le plus récent, retourne (rows, seen_flyer_ids)."""
    files = sorted(glob.glob("canada_flipp_*.csv"))
    if not files:
        print("Aucun CSV existant trouvé — lancement d'un scan complet impossible ici.")
        return [], set()
    latest = files[-1]
    print(f"CSV existant : {latest}")
    rows = []
    seen_flyer_ids = set()
    with open(latest, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            rows.append(row)
            seen_flyer_ids.add(str(row['flyer_id']))
    print(f"  → {len(rows)} items, {len(seen_flyer_ids)} flyer_ids déjà chargés\n")
    return rows, seen_flyer_ids, latest

def main():
    existing_rows, seen_flyer_ids, existing_file = load_existing_csv()

    seen_flyer_type_ids = set()  # pour dédup Phase 1
    new_flyers_meta = {}
    new_items = []

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Scan de {len(NEW_POSTAL_CODES)} nouveaux codes postaux\n")

    # Phase 1 : scanner les nouveaux codes postaux
    for region, postal_code in NEW_POSTAL_CODES.items():
        print(f"  Scanning {region} ({postal_code})...", end=" ")
        try:
            flyers = get_flyers(postal_code)
            new = 0
            for f in flyers:
                cats = f.get("categories", [])
                if not GROCERY_CATEGORIES.intersection(cats):
                    continue
                ftid = f.get("flyer_type_id")
                fid  = str(f.get("id"))
                # Nouveau si pas déjà dans le CSV ET pas déjà vu dans ce scan
                if ftid and ftid not in seen_flyer_type_ids and fid not in seen_flyer_ids:
                    seen_flyer_type_ids.add(ftid)
                    new_flyers_meta[ftid] = {
                        "merchant":   f.get("merchant") or f.get("name") or "",
                        "flyer_id":   f.get("id"),
                        "region":     region,
                        "valid_from": f.get("valid_from", "")[:10],
                        "valid_to":   f.get("valid_to", "")[:10],
                    }
                    new += 1
            print(f"{new} nouveaux circulaires")
        except Exception as e:
            print(f"ERREUR: {e}")
        time.sleep(0.3)

    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] {len(new_flyers_meta)} nouveaux circulaires à fetcher\n")

    if not new_flyers_meta:
        print("Aucun nouveau circulaire trouvé — le CSV existant est déjà complet.")
        input("\nAppuie sur Entrée pour fermer...")
        return

    # Phase 2 : fetcher les nouveaux items
    for i, (ftid, meta) in enumerate(new_flyers_meta.items(), 1):
        merchant = meta["merchant"]
        flyer_id = meta["flyer_id"]
        region   = meta["region"]
        print(f"  [{i}/{len(new_flyers_meta)}] {merchant} ({region}) id:{flyer_id}...", end=" ")
        try:
            items = get_items(flyer_id)
            count = 0
            for item in items:
                new_items.append({
                    "merchant":   (merchant or "").strip(),
                    "region":     region,
                    "flyer_id":   flyer_id,
                    "item_id":    item.get("id"),
                    "name":       (item.get("name") or "").strip(),
                    "brand":      (item.get("brand") or "").strip(),
                    "price":      item.get("price", ""),
                    "valid_from": meta["valid_from"],
                    "valid_to":   meta["valid_to"],
                    "image_url":  item.get("cutout_image_url", ""),
                })
                count += 1
            print(f"{count} items")
        except Exception as e:
            print(f"ERREUR: {e}")
        time.sleep(0.4)

    # Phase 3 : append au CSV existant
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    all_rows = existing_rows + new_items

    out_csv = f"canada_flipp_{timestamp}.csv"
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["merchant","region","flyer_id","item_id","name","brand","price","valid_from","valid_to","image_url"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    merchants = sorted(set(r["merchant"] for r in all_rows))
    summary = {
        "generated_at": datetime.now().isoformat(),
        "total_items": len(all_rows),
        "new_items_added": len(new_items),
        "new_flyers_added": len(new_flyers_meta),
        "merchants": merchants,
    }
    with open(f"canada_summary_{timestamp}.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"✓ {len(new_items)} nouveaux items ajoutés")
    print(f"✓ {len(all_rows)} items total dans {out_csv}")
    print(f"✓ {len(merchants)} marchands uniques au total")
    new_merchants = sorted(set(r["merchant"] for r in new_items) - set(r["merchant"] for r in existing_rows))
    if new_merchants:
        print(f"✓ Nouveaux marchands: {', '.join(new_merchants)}")

    input("\nAppuie sur Entrée pour fermer...")

if __name__ == "__main__":
    main()
