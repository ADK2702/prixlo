"""
import_db.py — Importe le dernier CSV Flipp dans PostgreSQL (schéma normalisé).

Tables cibles:
  merchants  (name, slug, region, country)
  products   (id=item_id, name, brand, image_url, category, country, barcode)
  prices     (product_id, merchant_id, regular_price, valid_from, valid_to, source_url, country)

Prérequis:
  pip install psycopg2-binary python-dotenv

  Migrations Supabase à appliquer d'abord:
    1. webapp/scripts/schema-initial.sql
    2. webapp/scripts/migrate-multicountry.sql
    3. webapp/scripts/migrate-import-support.sql

Config:
  Fichier .env avec: DATABASE_URL=postgresql://...

Usage:
  python import_db.py
"""

import csv, glob, os, re
from decimal import Decimal, InvalidOperation
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

load_dotenv()

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/prixlo"
)


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:255]


def parse_price(raw):
    if not raw:
        return None
    try:
        return Decimal(str(raw))
    except InvalidOperation:
        return None


def parse_date(s: str):
    if not s:
        return None
    d = s.strip()[:10]
    return d if len(d) == 10 else None


def ensure_schema(cur):
    """Ensure all columns and constraints exist - idempotent, safe to re-run."""
    stmts = [
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS country CHAR(2) NOT NULL DEFAULT 'CA'",
        "ALTER TABLE merchants ADD COLUMN IF NOT EXISTS region VARCHAR(80)",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(120)",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(20)",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS country CHAR(2) NOT NULL DEFAULT 'CA'",
        "ALTER TABLE prices ADD COLUMN IF NOT EXISTS country CHAR(2) NOT NULL DEFAULT 'CA'",
    ]
    for stmt in stmts:
        cur.execute(stmt)
    cur.execute("""
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint
                         WHERE conname = 'products_barcode_key'
                           AND conrelid = 'products'::regclass)
          THEN ALTER TABLE products ADD CONSTRAINT products_barcode_key UNIQUE (barcode);
          END IF;
        END $$
    """)
    cur.execute("""
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint
                         WHERE conname = 'prices_unique_offer'
                           AND conrelid = 'prices'::regclass)
          THEN ALTER TABLE prices
                 ADD CONSTRAINT prices_unique_offer
                 UNIQUE (product_id, merchant_id, valid_from, valid_to);
          END IF;
        END $$
    """)
    print("  Schema a jour")


REGION_TO_PROVINCE = {
    "QC": "QC", "ON": "ON", "BC": "BC", "AB": "AB",
    "SK": "SK", "MB": "MB", "NB": "NB", "NS": "NS",
    "PE": "PE", "NL": "NL", "YK": "YT", "NT": "NT",
}


def region_to_province(region: str):
    if not region:
        return None
    prefix = region.split("-")[0].upper()
    return REGION_TO_PROVINCE.get(prefix)


def main():
    files = sorted(glob.glob("canada_flipp_*.csv"))
    if not files:
        print("Aucun fichier canada_flipp_*.csv trouve.")
        return
    csv_file = files[-1]
    print(f"Fichier source : {csv_file}")

    rows = []
    with open(csv_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    print(f"  {len(rows):,} lignes lues")

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    print("Verification du schema...")
    ensure_schema(cur)
    conn.commit()

    # MERCHANTS
    merchant_info = {}
    for r in rows:
        name = r.get("merchant", "").strip()
        if not name or name in merchant_info:
            continue
        merchant_info[name] = {
            "slug":    slugify(name),
            "region":  region_to_province(r.get("region", "")),
            "country": "CA",
        }

    execute_values(
        cur,
        """INSERT INTO merchants (name, slug, region, country)
           VALUES %s
           ON CONFLICT (slug) DO UPDATE SET
             name    = EXCLUDED.name,
             region  = COALESCE(EXCLUDED.region,  merchants.region),
             country = COALESCE(EXCLUDED.country, merchants.country)""",
        [
            (name, info["slug"], info["region"], info["country"])
            for name, info in merchant_info.items()
        ],
    )

    cur.execute("SELECT id, name FROM merchants")
    merchant_map = {nm: mid for mid, nm in cur.fetchall()}
    print(f"  {len(merchant_info):,} marchands ({len(merchant_map):,} en base)")

    # PRODUCTS
    products_seen = {}
    for r in rows:
        iid = r.get("item_id", "").strip()
        if not iid or iid in products_seen:
            continue
        products_seen[iid] = {
            "name":      (r.get("name") or "").strip(),
            "brand":     ((r.get("brand") or "").strip()[:120] or None),
            "image_url": r.get("image_url") or None,
        }

    product_rows = [
        (
            info["name"],
            info["brand"],
            info["image_url"],
            "Groceries",
            "CA",
            iid,
        )
        for iid, info in products_seen.items()
        if info["name"]
    ]

    execute_values(
        cur,
        """INSERT INTO products (name, brand, image_url, category, country, barcode)
           VALUES %s
           ON CONFLICT (barcode) DO UPDATE SET
             name      = EXCLUDED.name,
             brand     = COALESCE(EXCLUDED.brand,     products.brand),
             image_url = COALESCE(EXCLUDED.image_url, products.image_url)""",
        product_rows,
        page_size=2000,
    )
    print(f"  {len(product_rows):,} produits upserted")

    all_barcodes = list(products_seen.keys())
    product_map = {}
    BATCH = 5000
    for i in range(0, len(all_barcodes), BATCH):
        cur.execute(
            "SELECT id, barcode FROM products WHERE barcode = ANY(%s)",
            (all_barcodes[i:i + BATCH],),
        )
        for pid, bc in cur.fetchall():
            product_map[bc] = pid
    print(f"  {len(product_map):,} produits mappes")

    # PRICES
    price_rows = []
    skipped = 0
    for r in rows:
        iid      = r.get("item_id", "").strip()
        merchant = r.get("merchant", "").strip()

        if not iid or not merchant:
            skipped += 1
            continue

        product_id  = product_map.get(iid)
        merchant_id = merchant_map.get(merchant)

        if not product_id or not merchant_id:
            skipped += 1
            continue

        price = parse_price(r.get("price"))
        if price is None:
            skipped += 1
            continue

        valid_from = parse_date(r.get("valid_from", ""))
        valid_to   = parse_date(r.get("valid_to", ""))
        if not valid_from or not valid_to:
            skipped += 1
            continue

        price_rows.append((
            product_id,
            merchant_id,
            price,
            valid_from,
            valid_to,
            r.get("image_url") or None,
            "CA",
        ))

    execute_values(
        cur,
        """INSERT INTO prices
             (product_id, merchant_id, regular_price, valid_from, valid_to, source_url, country)
           VALUES %s
           ON CONFLICT (product_id, merchant_id, valid_from, valid_to) DO NOTHING""",
        price_rows,
        page_size=2000,
    )
    print(f"  {len(price_rows):,} prix importes ({skipped} ignores)")

    conn.commit()
    cur.close()
    conn.close()
    print("\nImport termine avec succes.")


if __name__ == "__main__":
   