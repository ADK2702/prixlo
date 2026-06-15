"""
normalize_products.py
---------------------
Cluster similar products across merchants and assign cluster_id in the prices table.

Algorithm:
  1. Load all distinct (name, brand) pairs from prices (active + expired)
  2. Compute a normalize_key per item: lowercase, remove accents, strip sizes/quantities,
     sort words alphabetically → order-invariant key
  3. Group by (brand_key, name_key) → exact match first (handles ~90% of duplicates)
  4. Fuzzy pass within same brand_key: merge groups with token_set_ratio >= THRESHOLD
  5. Insert canonical clusters into product_clusters
  6. UPDATE prices SET cluster_id = ...

Usage:
  pip install psycopg2-binary rapidfuzz python-dotenv
  python normalize_products.py
"""

import os
import re
import unicodedata
import time
from collections import defaultdict
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "webapp", ".env.local"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres@localhost:5432/prixlo")

FUZZY_THRESHOLD = 82   # token_set_ratio threshold for merging clusters
BRAND_WEIGHT    = True  # only fuzzy-match within same brand group

# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------
SIZE_PATTERN = re.compile(
    r'\b\d+(\.\d+)?\s*'
    r'(kg|g|gr|lb|oz|l|ml|lt|litre|liter|pk|pack|ct|un|unités?|pièces?|pieces?|x\d+|\d+x)\b',
    re.IGNORECASE
)
NUMBER_PATTERN  = re.compile(r'\b\d+\b')
PUNCT_PATTERN   = re.compile(r'[^\w\s]')
SPACE_PATTERN   = re.compile(r'\s+')

STOP_WORDS = {
    'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'en', 'et', 'ou',
    'with', 'of', 'the', 'and', 'or', 'for', 'a', 'an',
    'sans', 'avec', 'à', 'au', 'aux',
}


def remove_accents(text: str) -> str:
    nfd = unicodedata.normalize('NFD', text)
    return ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')


def normalize_key(name: str, brand: str | None = None) -> str:
    """Return a canonical sort key for fuzzy grouping."""
    text = remove_accents(name).lower()
    # strip brand from name to avoid double-weighting
    if brand:
        brand_clean = remove_accents(brand).lower()
        text = text.replace(brand_clean, ' ')
    text = SIZE_PATTERN.sub(' ', text)
    text = NUMBER_PATTERN.sub(' ', text)
    text = PUNCT_PATTERN.sub(' ', text)
    words = [w for w in SPACE_PATTERN.sub(' ', text).strip().split()
             if w not in STOP_WORDS and len(w) > 1]
    return ' '.join(sorted(words))


def brand_key(brand: str | None) -> str:
    if not brand:
        return '__no_brand__'
    return remove_accents(brand).lower().strip()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("ERROR: pip install psycopg2-binary")
        return

    try:
        from rapidfuzz import fuzz
        HAS_RAPIDFUZZ = True
    except ImportError:
        print("WARNING: rapidfuzz not installed — skipping fuzzy pass. pip install rapidfuzz")
        HAS_RAPIDFUZZ = False

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    print("Loading distinct (name, brand) pairs from prices…")
    cur.execute("""
        SELECT ARRAY_AGG(pr.id) AS ids, p.name, p.brand
        FROM prices pr
        JOIN products p ON p.id = pr.product_id
        GROUP BY p.name, p.brand
        ORDER BY p.name
    """)
    rows = cur.fetchall()
    print(f"  {len(rows)} distinct (name, brand) combinations")

    # ------------------------------------------------------------------
    # Step 1: compute keys + group by exact key
    # ------------------------------------------------------------------
    # clusters: list of {ids, canonical_name, canonical_brand, name_key, brand_k}
    # exact_map: (brand_k, name_k) → cluster index
    clusters      = []
    exact_map     = {}

    for row in rows:
        bk = brand_key(row['brand'])
        nk = normalize_key(row['name'], row['brand'])
        if not nk:          # empty key → use first 3 words of name
            nk = ' '.join(sorted(remove_accents(row['name']).lower().split())[:3])

        key = (bk, nk)
        if key in exact_map:
            clusters[exact_map[key]]['ids'].extend(row['ids'])
        else:
            exact_map[key] = len(clusters)
            clusters.append({
                'ids':             list(row['ids']),
                'canonical_name':  row['name'],
                'canonical_brand': row['brand'],
                'name_key':        nk,
                'brand_k':         bk,
            })

    print(f"  After exact grouping: {len(clusters)} clusters")

    # ------------------------------------------------------------------
    # Step 2: fuzzy pass within same brand group
    # ------------------------------------------------------------------
    if HAS_RAPIDFUZZ and len(clusters) > 1:
        print("Running fuzzy merge pass…")
        t0 = time.time()

        # Group cluster indices by brand
        by_brand: dict[str, list[int]] = defaultdict(list)
        for i, cl in enumerate(clusters):
            by_brand[cl['brand_k']].append(i)

        parent = list(range(len(clusters)))   # Union-Find

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[rb] = ra

        merged = 0
        for bk, indices in by_brand.items():
            if len(indices) < 2:
                continue
            keys = [(i, clusters[i]['name_key']) for i in indices]
            for a in range(len(keys)):
                for b in range(a + 1, len(keys)):
                    if find(keys[a][0]) == find(keys[b][0]):
                        continue
                    score = fuzz.token_set_ratio(keys[a][1], keys[b][1])
                    if score >= FUZZY_THRESHOLD:
                        union(keys[a][0], keys[b][0])
                        merged += 1

        # Consolidate
        root_to_cluster: dict[int, dict] = {}
        for i, cl in enumerate(clusters):
            r = find(i)
            if r not in root_to_cluster:
                root_to_cluster[r] = {
                    'ids':             list(cl['ids']),
                    'canonical_name':  cl['canonical_name'],
                    'canonical_brand': cl['canonical_brand'],
                    'name_key':        cl['name_key'],
                }
            else:
                root_to_cluster[r]['ids'].extend(cl['ids'])

        clusters = list(root_to_cluster.values())
        print(f"  Fuzzy merged {merged} pairs → {len(clusters)} final clusters  ({time.time()-t0:.1f}s)")

    # ------------------------------------------------------------------
    # Step 3: insert clusters + update prices
    # ------------------------------------------------------------------
    print("Clearing old clusters…")
    cur.execute("UPDATE prices SET cluster_id = NULL")
    cur.execute("DELETE FROM product_clusters")
    cur.execute("ALTER SEQUENCE product_clusters_id_seq RESTART WITH 1")

    print(f"Inserting {len(clusters)} clusters…")
    insert_sql = """
        INSERT INTO product_clusters (canonical_name, canonical_brand, name_key)
        VALUES (%s, %s, %s) RETURNING id
    """
    update_sql = "UPDATE prices SET cluster_id = %s WHERE id = ANY(%s)"

    for i, cl in enumerate(clusters):
        cur.execute(insert_sql, (cl['canonical_name'], cl['canonical_brand'], cl['name_key']))
        cid = cur.fetchone()['id']
        cur.execute(update_sql, (cid, cl['ids']))
        if (i + 1) % 1000 == 0:
            print(f"  {i+1}/{len(clusters)}")

    conn.commit()

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------
    cur.execute("SELECT COUNT(*) AS n FROM product_clusters")
    nc = cur.fetchone()['n']
    cur.execute("SELECT COUNT(*) AS n FROM prices WHERE cluster_id IS NOT NULL")
    np_ = cur.fetchone()['n']
    cur.execute("""
        SELECT COUNT(*) AS multi
        FROM (
          SELECT cluster_id
          FROM prices p
          JOIN merchants m ON m.id = p.merchant_id
          WHERE cluster_id IS NOT NULL
          GROUP BY cluster_id
          HAVING COUNT(DISTINCT m.name) > 1
        ) t
    """)
    nm = cur.fetchone()['multi']

    print("\n=== Done ===")
    print(f"  Clusters created : {nc}")
    print(f"  Prices assigned  : {np_}")
    print(f"  Multi-merchant   : {nm} clusters sold by 2+ merchants")

    cur.close()
    conn.close()


if __name__ == '__m