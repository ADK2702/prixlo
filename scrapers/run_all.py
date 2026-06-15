"""
scrapers/run_all.py - Pipeline complet Prixlo
1. Collecte circulaires via API publique Flipp (IGA, Metro, Maxi, Walmart, ++)
2. Importe dans Supabase
3. Normalise et cluster les produits
"""

import argparse
import glob
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent

STORES_COVERED = [
    "IGA", "Metro", "Maxi", "Walmart", "Provigo", "Super C",
    "FreshCo", "No Frills", "Real Canadian Superstore",
    "Loblaws", "Food Basics", "Giant Tiger",
]


def run(cmd, label):
    print("\n" + "="*60 + "\n  " + label + "\n" + "="*60)
    t0 = time.time()
    result = subprocess.run(cmd, cwd=ROOT)
    elapsed = time.time() - t0
    status = "OK" if result.returncode == 0 else "ERREUR"
    print("[" + status + "] " + label + " (" + str(round(elapsed,1)) + "s)")
    return result.returncode


def latest_csv():
    files = sorted(glob.glob(str(ROOT / "canada_flipp_*.csv")))
    return files[-1] if files else None


def main():
    parser = argparse.ArgumentParser(description="Pipeline Prixlo")
    parser.add_argument("--collect-only", action="store_true")
    parser.add_argument("--import-only", action="store_true")
    parser.add_argument("--no-normalize", action="store_true")
    args = parser.parse_args()

    print("\n" + "="*60)
    print("  PRIXLO - Pipeline de donnees")
    print("  Chaines couvertes via Flipp: " + str(len(STORES_COVERED)) + "+")
    print("="*60)

    errors = []

    if not args.import_only:
        code = run([sys.executable, str(ROOT / "collector.py")],
                   "Etape 1/3 - Collecte Flipp (Canada complet)")
        if code != 0:
            errors.append("Collecte Flipp echouee")

    if not args.collect_only:
        csv = latest_csv()
        if not csv:
            print("Aucun CSV trouve. Lancer: python collector.py")
            sys.exit(1)
        code = run([sys.executable, str(ROOT / "import_db.py")],
                   "Etape 2/3 - Import Supabase")
        if code != 0:
            errors.append("Import Supabase echoue")

    if not args.collect_only and not args.no_normalize:
        normalize = ROOT / "normalize_products.py"
        if normalize.exists():
            code = run([sys.executable, str(normalize)],
                       "Etape 3/3 - Normalisation et clustering")
            if code != 0:
                errors.append("Normalisation echouee (non bloquant)")

    print("\n" + "="*60)
    if errors:
        for e in errors:
            print("  ERREUR: " + e)
        sys.exit(1)
    else:
        print("  Pipeline Prixlo termine avec succes")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
