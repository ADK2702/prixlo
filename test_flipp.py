import requests, json, random

postal_code = "H2X1Y4"  # Montréal
sid = ''.join(str(random.randint(0,9)) for _ in range(16))

url = f"https://flyers-ng.flippback.com/api/flipp/data?locale=fr&postal_code={postal_code}&sid={sid}"

print(f"Fetching: {url}\n")

try:
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()

    print(f"Keys: {list(data.keys())}")
    flyers = data.get('flyers', [])
    print(f"Nombre de circulaires: {len(flyers)}\n")

    for f in flyers:
        print(f"  - {f.get('merchant')} | id:{f.get('id')} | cats:{f.get('categories')}")

    # Sauvegarder le résultat complet
    with open("flipp_result.json", "w", encoding="utf-8") as out:
        json.dump(data, out, ensure_ascii=False, indent=2)
    print("\nRésultat complet sauvegardé dans flipp_result.json")

except Exception as e:
    print(f"Erreur: {e}")

input("\nAppuie sur Entrée pour fermer...")
