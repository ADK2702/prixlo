import requests, json, random

def sid():
    return ''.join(str(random.randint(0,9)) for _ in range(16))

FLYER_ITEMS = 'https://flyers-ng.flippback.com/api/flipp/flyers/{}/flyer_items?locale=fr&sid={}'

# Tester IGA, Metro, Maxi, Super C
test_stores = {
    'IGA': 7960255,
    'Metro': 7971321,
    'Maxi': 7964235,
    'Super C': 7962774,
}

all_items = {}

for store, flyer_id in test_stores.items():
    print(f"Fetching {store} (id:{flyer_id})...")
    r = requests.get(FLYER_ITEMS.format(flyer_id, sid()), timeout=15)
    items = r.json()
    all_items[store] = items
    print(f"  → {len(items)} items")
    if items:
        print(f"  Exemple: {json.dumps(items[0], ensure_ascii=False, indent=4)}")
        print()

# Sauvegarder
with open('items_result.json', 'w', encoding='utf-8') as f:
    json.dump(all_items, f, ensure_ascii=False, indent=2)

print("Sauvegardé dans items_result.json")
input("\nAppuie sur Entrée pour fermer...")
