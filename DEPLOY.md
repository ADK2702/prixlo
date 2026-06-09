# Déploiement — Épicerie Promo

Stack: **Vercel** (frontend) + **Supabase** (PostgreSQL) + **GitHub Actions** (refresh hebdo)

---

## 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → New project
2. Choisir une région proche (ex: `us-east-1` pour l'Est du Canada)
3. Noter le **mot de passe** de la base de données
4. Attendre ~2 minutes que le projet démarre

## 2. Migrer la base de données locale vers Supabase

```bat
REM Dans une fenêtre CMD :
set SUPABASE_URL=postgresql://postgres:[MOT_DE_PASSE]@db.[REF].supabase.co:5432/postgres
cd "C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo"
migrate_to_supabase.bat
```

> Le REF et l'URL complet se trouvent dans Supabase → Settings → Database → Connection string (URI)

Vérifier dans Supabase → Table Editor que les tables `prices`, `merchants`, `product_clusters` ont des données.

## 3. Récupérer les URLs de connexion Supabase

Dans Supabase → Settings → Database :

| Usage | URL | Port |
|-------|-----|------|
| GitHub Actions (import direct) | **Direct connection** | 5432 |
| Vercel / serverless | **Transaction Pooler** | 6543 |

## 4. Déployer sur Vercel

### 4a. Pousser le code sur GitHub

```bat
cd "C:\Users\asus2\OneDrive\Documents\Claude\Projects\epicerie promo"
git init
git add .
git commit -m "Initial commit — Épicerie Promo"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/epicerie-promo.git
git push -u origin main
```

### 4b. Connecter à Vercel

1. Aller sur [vercel.com](https://vercel.com) → New Project
2. Importer le repo GitHub `epicerie-promo`
3. Vercel détecte automatiquement Next.js
4. **Root Directory** → `webapp`
5. Cliquer **Deploy** (premier déploiement sans DB pour tester le build)

### 4c. Ajouter les variables d'environnement

Dans Vercel → Project → Settings → Environment Variables :

| Nom | Valeur |
|-----|--------|
| `DATABASE_URL` | URL Transaction Pooler Supabase (port **6543**) |
| `NEXT_PUBLIC_SITE_URL` | `https://ton-domaine.ca` (ou URL Vercel si pas de domaine custom) |

Puis **Redeploy** pour appliquer.

### 4d. Domaine custom (optionnel)

1. Vercel → Project → Settings → Domains → Add domain
2. Entrer ton domaine (ex: `epiceriepromo.ca`)
3. Ajouter les DNS records indiqués chez ton registraire :
   - Type `A` → `76.76.21.21`
   - Type `CNAME` `www` → `cname.vercel-dns.com`

## 5. Configurer GitHub Actions pour le refresh hebdo

### 5a. Ajouter le secret DATABASE_URL

Dans GitHub → repo → Settings → Secrets and variables → Actions → New secret :

| Nom | Valeur |
|-----|--------|
| `DATABASE_URL` | URL **Direct connection** Supabase (port 5432) |

> Utiliser le Direct connection ici (pas le pooler) car le script Python fait des opérations longues.

### 5b. Vérifier le workflow

Le fichier `.github/workflows/refresh.yml` s'exécute automatiquement chaque lundi à 06h00 UTC.

Pour déclencher manuellement : GitHub → Actions → "Weekly Price Refresh" → Run workflow.

## 6. Checklist finale

- [ ] `migrate_to_supabase.bat` exécuté avec succès
- [ ] Vercel déployé et app accessible
- [ ] Variable `DATABASE_URL` (pooler) ajoutée à Vercel
- [ ] Variable `NEXT_PUBLIC_SITE_URL` ajoutée à Vercel
- [ ] Domaine custom configuré (DNS propagé ~24h)
- [ ] Secret `DATABASE_URL` (direct) ajouté à GitHub
- [ ] Workflow Actions testé manuellement une fois
- [ ] `run_normalize.bat` exécuté localement (clusters créés)

## Commandes utiles

```bat
REM Tester l'app localement avec la DB Supabase
set DATABASE_URL=postgresql://postgres:[MOT_DE_PASSE]@db.[REF].supabase.co:5432/postgres
cd webapp && npm run dev

REM Forcer un refresh manuel depuis la machine locale
refresh_weekly.bat
```

## Architecture

```
GitHub (code) ──push──▶ Vercel (Next.js)
                              │
                         API Routes (/api/search, /api/cluster, /api/merchants)
                              │
                         Supabase PostgreSQL
                              ▲
GitHub Actions ──hebdo──▶ import_db.py + normalize_products.py
```
