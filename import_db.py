"""
import_db.py — Importe le dernier CSV Flipp dans PostgreSQL.

Prérequis:
    pip install psycopg2-binary python-dotenv

Config:
    Créer un fichier .env avec DATABASE_URL (voir .env.example)

Usage:
    python import_db.py
"""

import csv, glob, os, re
from decimal import Decimal, InvalidOperation
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/epicerie")


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:255]


def parse_price(raw) -> Decimal | None:
    if not raw:
        return None
    try:
        return Decimal(str(raw))
    except InvalidOperation:
        return None


def parse_date(s: str):
    if not s:
        return None
    return s[:10] or None   # PostgreSQL accepte 'YYYY-MM-DD' directement


def main():
    # ── Trouver le CSV le plus récent ────────────────────────────────────────
    files = sorted(glob.glob("canada_flipp_*.csv"))
    if not files:
        print("Aucun fichier canada_flipp_*.csv trouvé.")
        return
    csv_file = files[-1]
    print(f"Fichier source : {csv_file}")

    # ── Lire le CSV ──────────────────────────────────────────────────────────
    rows = []
    with open(csv_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    print(f"  {len(rows):,} lignes lues")

    # ── Connexion ────────────────────────────────────────────────────────────
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    # ── Merchants ────────────────────────────────────────────────────────────
    merchant_names = sorted(set(
        r["merchant"].strip() for r in rows if r.get("merchant", "").strip()
    ))
    execute_values(
        cur,
        "INSERT INTO merchants (name, slug) VALUES %s ON CONFLICT (name) DO NOTHING",
        [(m, slugify(m)) for m in merchant_names],
    )
    cur.execute("SELECT id, name FROM merchants")
    merchant_map = {name: mid for mid, name in cur.fetchall()}
    print(f"  {len(merchant_names)} marchands")

    # ── Flyers ───────────────────────────────────────────────────────────────
    flyers_seen: dict[str, dict] = {}
    for r in rows:
        fid = r.get("flyer_id", "").strip()
        if fid and fid not in flyers_seen:
            flyers_seen[fid] = r

    flyer_data = [
        (
            int(fid),
            merchant_map.get(r["merchant"].strip()),
            r.get("region", ""),
            parse_date(r.get("valid_from", "")),
            parse_date(r.get("valid_to", "")),
        )
        for fid, r in flyers_seen.items()
        if r.get("merchant", "").strip() in merchant_map
    ]
    execute_values(
        cur,
        """INSERT INTO flyers (id, merchant_id, region, valid_from, valid_to)
           VALUES %s ON CONFLICT (id) DO NOTHING""",
        flyer_data,
    )
    print(f"  {len(flyer_data)} circulaires")

    # ── Prices ───────────────────────────────────────────────────────────────
    items = []
    for r in rows:
        iid = r.get("item_id", "").strip()
        fid = r.get("flyer_id", "").strip()
        if not iid or not fid:
            continue
        items.append((
            int(iid),
            int(fid),
            (r.get("name") or "").strip(),
            (r.get("brand") or "").strip() or None,
            parse_price(r.get("price")),
            r.get("image_url") or None,
        ))

    execute_values(
        cur,
        """INSERT INTO prices (id, flyer_id, name, brand, price, image_url)
           VALUES %s ON CONFLICT (id) DO NOTHING""",
        items,
        page_size=2000,
    )
    print(f"  {len(items):,} items importés")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✓ Import terminé.")


if __name__ == "__main__":
    main()
