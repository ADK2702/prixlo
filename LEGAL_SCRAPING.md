# Stratégie légale de collecte de données — Prixlo

## Résumé

Prixlo utilise l'**API publique de Flipp** (`flyers-ng.flippback.com`), pas du scraping HTML direct sur les sites des épiceries. Cette distinction est fondamentale sur le plan légal.

---

## 1. Pourquoi l'API Flipp est la meilleure solution

### Ce que Flipp fait
Flipp est une plateforme canadienne officielle de distribution de circulaires. Les **marchands paient Flipp** pour diffuser leurs circulaires. L'API est l'interface technique de cette diffusion publique.

### Avantages légaux
- **Données publiques** : Les prix sont destinés à être vus par le public. Ce n'est pas de l'information confidentielle.
- **Pas de ToS explicite bloquant l'accès** : L'API ne requiert pas d'authentification. Aucun login, aucun token, aucun contrat.
- **Pas de CAPTCHA** : L'API accepte les requêtes programmatiques.
- **Pratique courante** : Des dizaines d'apps comparatrices de prix utilisent Flipp partout au Canada.
- **Même données que l'app Flipp** : Prixlo ne fait qu'afficher des prix déjà publics via un outil déjà public.

---

## 2. Cadre légal canadien applicable

### Lois pertinentes

| Loi | Applicabilité | Verdict |
|-----|--------------|---------|
| **Loi sur la concurrence** | Agrégation de prix publics | ✅ Autorisée — le public bénéficie de la transparence des prix |
| **LPRPDE / Loi 25 (QC)** | Données personnelles | ✅ Aucune donnée personnelle collectée |
| **Droit d'auteur (LDA)** | Prix et noms de produits | ✅ Les faits (prix, noms) ne sont pas protégés par le droit d'auteur |
| **Computer Fraud / CFAA** | Accès non autorisé | ✅ API publique sans authentification requise |

### Jurisprudence pertinente (contexte nord-américain)
- **hiQ Labs c. LinkedIn (9th Cir., 2022)** : Le scraping de données publiques ne viole pas le CFAA si l'accès n'est pas restreint par authentification.
- **Ryanair c. Booking.com** : Différent car Ryanair imposait une authentification et des ToS explicites.

---

## 3. Règles de bonne pratique appliquées par Prixlo

### Rate Limiting
```python
# collector.py applique ces délais :
time.sleep(0.3)   # entre chaque code postal (Phase 1)
time.sleep(0.4)   # entre chaque circulaire    (Phase 2)
```
Délai moyen : ~0.35s → ~3 requêtes/seconde. Bien en dessous du seuil de charge problématique.

### Fréquence de collecte
- **1 fois par semaine** via GitHub Actions (lundi matin)
- Les circulaires changent au maximum 2x/semaine (début et fin de semaine)
- Aucune collecte en temps réel ni en continu

### User-Agent
Requêtes standards sans spoofing de navigateur. Pas de tentative de contournement.

### robots.txt
```
# https://flyers-ng.flippback.com/robots.txt
# Aucun robots.txt restrictif trouvé sur l'endpoint API
```
Vérification à renouveler lors de changements majeurs.

### Données collectées
Uniquement : `merchant, item_id, name, brand, price, valid_from, valid_to, image_url`  
**Aucune** donnée personnelle, géolocalisation d'utilisateur, ou données financières.

---

## 4. Attribution et transparence

- Prixlo affiche les prix **avec le nom du marchand**
- L'utilisateur peut cliquer pour aller acheter directement en magasin
- **Pas de commerce** : Prixlo ne vend rien, ne prend pas de commission
- Modèle = comparateur de prix public (comme Google Shopping, mais gratuit et local)

---

## 5. Risques résiduels et mitigation

| Risque | Probabilité | Mitigation |
|--------|------------|------------|
| Flipp change son API et bloque les accès | Faible | Surveiller les changements, alterner les SID aléatoires |
| Un marchand envoie une mise en demeure (C&D) | Très faible | Retirer ce marchand dans les 24h sur simple demande |
| Flipp ajoute une authentification obligatoire | Moyen (futur) | Basculer vers les APIs directes des marchands ou partnerships |
| Violation alléguée des ToS implicites | Très faible | Les ToS de Flipp sont destinées aux **marchands** qui uploadent, pas aux lecteurs |

### Politique de réponse aux C&D
Si Prixlo reçoit une demande de retrait :
1. Retirer le marchand concerné dans les **24 heures**
2. Confirmer le retrait par écrit
3. Conserver les autres marchands non concernés

---

## 6. Ce que Prixlo ne fait PAS

- ❌ Scraper les sites web des épiceries directement (ex : iga.net, metro.ca)
- ❌ Contourner des paywalls ou des systèmes d'authentification
- ❌ Collecter des données personnelles sur les consommateurs
- ❌ Revendre les données à des tiers
- ❌ Créer des faux comptes Flipp ou usurper une identité
- ❌ Collecter des images protégées par droit d'auteur (on utilise les URLs Flipp, pas les images elles-mêmes)

---

## 7. Évolution future : partnership officiel

Si Prixlo atteint une masse critique d'utilisateurs, envisager :
- **Contact Flipp Business** : Demander un accès API officiel (Flipp a un programme partenaire)
- **Contact direct marchands** : IGA, Metro, Maxi ont des flux XML/JSON pour leurs prix
- **Flyer integration APIs** : Certains marchands offrent des APIs partenaires gratuites

---

*Document rédigé : Juin 2026. À réviser annuellement ou lors de changements légaux majeurs.*
