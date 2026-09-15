# ComPutIn Website — Contexte projet

> **Ce dépôt** : site vitrine officiel ComPutIn (`computin-Website`, branche `master`).
> Remote : `git@github.com:Alexander-F2000/computin-Website.git`

## Source de vérité du pricing
La grille tarifaire vient du **backend officiel** (`ComPutin-Backend/src/services/subscriptionService.js`) :
**2 plans × 3 durées — seul l'annuel a −12 %**

| planId | Niveau | Durée | Prix | Ancien | Badge |
|--------|--------|-------|------|--------|-------|
| `essentiel_mensuel` | Essentiel | 30 j | 1 500 G | — | — |
| `essentiel_trimestriel` | Essentiel | 90 j | 4 500 G | — | — |
| `essentiel_annuel` | Essentiel | 365 j | 15 840 G | 18 000 | −12 % |
| `pro_mensuel` | Pro | 30 j | 4 500 G | — | Populaire |
| `pro_trimestriel` | Pro | 90 j | 13 500 G | — | Populaire |
| `pro_annuel` | Pro | 365 j | 47 520 G | 54 000 | −12 % |

⚠️ Pas de `Basic`/`Entreprise`, pas de −20 %. IDs legacy (`mensuel`/`trimestriel`/`annuel`) refusés par le backend.

## Fichiers
- `index.html` — toutes les sections + schema JSON-LD MobileApplication
- `style.css` — design system (palette : #121212, #1E1E24, #2A2A32, #3A3A44, #0D0D10 ; accents : #FF7A00, #4CAF50, #2563EB, #7C3AED, #DC2626)
- `script.js` — compteurs stats + menu mobile + FAQ
- `PITCHS-COMPUTIN.md` — TOUS les textes marketing exportables (source pour n'importe quelle IA)

## Règles du projet
- **Testimonials supprimés** (étaient fictifs) — ne pas les recréer sans vraies preuves
- **Badge hero** : « Version 3.14.2 » (pas « N°1 en Haïti »)
- Faits app vérifiés : plan gratuit = 50 tx / 70 articles ; AES-GCM ; Android 7.0+ ; v3.14.2 ; APK ~3 Mo ; export PDF/Excel ; prévisions 30 j ; MonCash réel ; 4 devises (HTG/USD/EUR/CAD) ; types de vente Normale/En gros/Lot ; navigation 4 onglets
- CTA download : « plan gratuit avec 50 transactions, sans carte bancaire »
- GitHub Pages pas encore activé (`has_pages: false`) — activation manuelle Settings → Pages → Deploy from branch master, ou token GH

## Validation locale
```bash
cd C:/Users/loudh/Downloads/ComPutin-Website
python -m http.server 8901   # puis curl -s -o /dev/null -w "%{http_code}" http://localhost:8901/index.html
```