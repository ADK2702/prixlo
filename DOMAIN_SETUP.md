# Configurer prixlo.ca → Vercel

## Étape 1 — Acheter prixlo.ca

### Option recommandée : Namecheap
1. Aller sur **namecheap.com**
2. Chercher `prixlo.ca`
3. Si disponible (~$15-20 CAD/an), ajouter au panier
4. Pas besoin de privacy guard pour .ca (déjà inclus par défaut)
5. Payer et noter tes identifiants Namecheap

### Alternative : CIRA directement
- **cira.ca** — registraire officiel des .ca
- Tarif similaire, interface plus simple

> **Note .ca** : Les domaines .ca sont réservés aux citoyens et résidents canadiens (ou entités ayant une présence canadienne). Ton adresse canadienne suffit.

---

## Étape 2 — Ajouter le domaine dans Vercel

1. Aller sur **vercel.com/adk2702s-projects/prixlo**
2. Cliquer **Settings** → **Domains**
3. Taper `prixlo.ca` → **Add**
4. Vercel va te donner 2 options DNS — choisir **"Add A Record"**

Tu verras quelque chose comme :
```
Type   Name    Value
A      @       76.76.21.21
CNAME  www     cname.vercel-dns.com
```

---

## Étape 3 — Configurer les DNS sur Namecheap

1. **Namecheap** → Dashboard → ton domaine prixlo.ca → **Manage**
2. Onglet **"Advanced DNS"**
3. **Supprimer** tous les records existants (A, CNAME defaults)
4. **Ajouter** :

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | Automatic |
| CNAME | www | cname.vercel-dns.com | Automatic |

5. Sauvegarder

---

## Étape 4 — Attendre la propagation DNS

- Délai : **5 à 30 minutes** en général (jusqu'à 48h max)
- Vérifier sur : https://dnschecker.org/#A/prixlo.ca
- Une fois propagé, Vercel émet automatiquement un certificat SSL gratuit (Let's Encrypt)

---

## Étape 5 — Vérifier

```
https://prixlo.ca       → doit charger Prixlo
https://www.prixlo.ca   → doit rediriger vers prixlo.ca (Vercel gère ça auto)
```

---

## Ce que Vercel fait automatiquement

- ✅ Certificat SSL (HTTPS) gratuit via Let's Encrypt
- ✅ Redirection www → non-www (ou l'inverse)
- ✅ CDN global (même domaine, même déploiement)
- ✅ Pas besoin de changer le code — le déploiement reste le même

---

## Coût total

| Item | Prix estimé |
|------|------------|
| prixlo.ca (1 an) | ~15-20 $ CAD |
| Vercel (plan Hobby) | Gratuit |
| SSL | Gratuit (inclus Vercel) |
| **Total** | **~15-20 $ CAD / an** |

---

## Après le domaine : Google Search Console

Une fois prixlo.ca actif :
1. Aller sur **search.google.com/search-console**
2. Ajouter propriété `prixlo.ca`
3. Vérifier via DNS (Namecheap → ajouter TXT record)
4. Soumettre le sitemap : `https://prixlo.ca/sitemap.xml`

Cela permet à Google d'indexer le site rapidement.
