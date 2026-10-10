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
- `index.html` — toutes les sections + schema JSON-LD (`MobileApplication` + `FAQPage`) + SEO (canonical, Open Graph, `og-image`)
- `style.css` — design system (palette : #121212, #1E1E24, #2A2A32, #3A3A44, #0D0D10 ; accents : #FF7A00, #4CAF50, #2563EB, #7C3AED, #DC2626)
- `script.js` — compteurs stats + menu mobile + FAQ
- `PITCHS-COMPUTIN.md` — TOUS les textes marketing exportables (source pour n'importe quelle IA)

## Règles du projet
- **Testimonials supprimés** (étaient fictifs) — ne pas les recréer sans vraies preuves
- **Badge hero** : « Version 3.24.0 » (pas « N°1 en Haïti »)
- Faits app vérifiés : plan gratuit = 50 tx / 70 articles ; AES-GCM ; Android 7.0+ ; v3.24.0 ; APK 3 205 240 o (~3 Mo) ; export PDF/Excel ; prévisions 30 j ; MonCash réel ; 4 devises (HTG/USD/EUR/CAD) ; types de vente Normale/En gros/Lot ; navigation 4 onglets
- CTA download : « plan gratuit avec 50 transactions, sans carte bancaire »
- **GitHub Pages ACTIF** — site en ligne : https://alexander-f2000.github.io/computin-Website/ (déploiement depuis `master`)

## Validation locale
```bash
cd C:/Users/loudh/Downloads/ComPutin-Website
python -m http.server 8901   # puis curl -s -o /dev/null -w "%{http_code}" http://localhost:8901/index.html
```

## Chasse aux bugs & release (site-hunt)
Système calqué sur le `bug-hunt.sh` de l'app (règles globales G1/G2/G4/G5) :

```bash
./site-hunt.sh            # scan statique (S1–S17) ; exit 1 si blocker/major
./site-hunt.sh --fix      # + corrections sûres (canonical, robots/sitemap)
./site-hunt.sh --links    # + endpoints backend en ligne
./site-hunt.sh --full     # + verify-release.sh (barrière EN LIGNE)
```

- `tools/site-hunt.mjs` — scanner déterministe (0 dépendance), règles **S1–S17** (SEO technique on-page + indexabilité).
- `verify-release.sh` — barrière : prouve que les éléments critiques sont présents **en ligne** (sections, `/api/download`, canonical, robots/sitemap 200, JSON-LD, `og-image`, APK backend).
- `tools/make_og_image.py` — régénère `assets/og-image.png` (1200×630).
- `docs/BUGS-SITE.md` — registre des incidents (G5) + table des règles.
- CI : `.github/workflows/site-hunt.yml` (scan sur push/PR ; `verify-release` sur planning).
- Règles `web` globales : `~/.config/opencode/bug-knowledge/patterns.json` (BH-012+).
- **Livraison** : `./site-hunt.sh --full` doit être vert EN LIGNE avant d'annoncer « fait » (G1/G4).