"""
fix_constraints.py — Ajoute les contraintes UNIQUE manquantes pour import_db.py
Run: python fix_constraints.py
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DB_URL = os.getenv("DATABASE_URL", "")

conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

fixes = [
    # 1. UNIQUE on merchants.name
    ("merchants_name_key", """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'merchants_name_key' AND conrelid = 'merchants'::regclass
          ) THEN
            ALTER TABLE merchants ADD CONSTRAINT merchants_name_key UNIQUE (name);
          END IF;
        END;
        $$
    """),
    # 2. UNIQUE on products.barcode
    ("products_barcode_key", """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'products_barcode_key' AND conrelid = 'products'::regclass
          ) THEN
            ALTER TABLE products ADD CONSTRAINT products_barcode_key UNIQUE (barcode);
          END IF;
        END;
        $$
    """),
    # 3. UNIQUE on prices (product_id, merchant_id, valid_from, valid_to)
    ("prices_unique_offer", """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'prices_unique_offer' AND conrelid = 'prices'::regclass
          ) THEN
            ALTER TABLE prices
              ADD CONSTRAINT prices_unique_offer
              UNIQUE (product_id, merchant_id, valid_from, valid_to);
          END IF;
        END;
        $$
    """),
]

print("=== Fix Constraints ===")
for name, sql in fixes:
    try:
        cur.execute(sql)
        print(f"  [OK] {name}")
    except Exception as e:
        print(f"  [WARN] {name}: {e}")

# Verify
cur.execute("""
    SELECT conname, conrelid::regclass::text AS table_name
    FROM pg_constraint
    WHERE conname IN ('merchants_name_key', 'products_barcode_key', 'prices_unique_offer')
    ORDER BY table_name
""")
rows = cur.fetchall()
print("\nConstraints in DB:")
for row in rows:
    print(f"  ✓ {row[0]} on {row[1]}")

cur.close()
conn.close()
print("\nDone.")
