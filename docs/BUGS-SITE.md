# BUGS-SITE — Registre des bugs du site ComPutin (G5)

> Miroir de `docs/BUGS.md` de l'app. Chaque incident produit une **règle** + un
> **garde-fou automatique** (script/barrière). Le site EST la vérité (G3).
>
> Système de détection : `./site-hunt.sh` (statique + `--fix` + `--links` + `--full`).
> Barrière de release : `./verify-release.sh` (prouve la version EN LIGNE).

---

## Le système « site-hunt »

| Composant | Fichier | Rôle |
|---|---|---|
| Scanner déterministe | `tools/site-hunt.mjs` | Règles S1–S14 (aucune dépendance) |
| Wrapper | `site-hunt.sh` | modes `static` / `--fix` / `--links` / `--full` |
| Barrière de release | `verify-release.sh` | **G1/G2** : éléments critiques présents EN LIGNE |
| CI | `.github/workflows/site-hunt.yml` | lance la chasse à chaque push |
| Knowledge global | `~/.config/opencode/bug-knowledge/patterns.json` | règles `web` (BH-012+) auto-scannées par le plugin |

### Règles déterministes

| ID | Sévérité | Détecte |
|---|---|---|
| S1 | blocker/major | JSON-LD absent / invalide / sans `@type` |
| S2 | major | meta description absente ou > 160 car. |
| S3 | blocker/minor | `<title>` absente ou hors plage 30–65 |
| S4 | blocker | 0 ou > 1 `<h1>` |
| S5 | minor | saut de niveau de titre (ex. h2 → h4) |
| S6 | major/minor | `<img>` sans `alt` / sans `width`+`height` (CLS) |
| S7 | major | ressource tierce (CDN) hors allowlist (Google Fonts) |
| S8 | blocker | asset local référencé mais absent du disque (404) |
| S8' | blocker | `/api/latestApk` réintroduit (renvoie du JSON, pas l'APK) |
| S9 | blocker | icône utilisée absente de `fa-subset.css` |
| S10 | major | emoji dans le HTML (règle CLAUDE.md : icônes FA uniquement) |
| S11 | minor | `<link rel="canonical">` absent |
| S12 | major | `robots.txt` / `sitemap.xml` absents |
| S13 | minor | Open Graph incomplet |
| S14 | blocker | attribut `<html lang>` absent |
| S15 | minor | `og:image` au mauvais format (attendu ~1200×630) |
| S16 | major | section `#faq` présente mais balisage `FAQPage` absent |
| S17 | nit | hôte `github.io` (rappelle de prévoir un domaine custom) |

### Modes

```bash
./site-hunt.sh            # statique (exit 1 si blocker/major)
./site-hunt.sh --fix      # + corrections sûres (S11 canonical, S12 robots/sitemap)
./site-hunt.sh --links    # + endpoints backend en ligne
./site-hunt.sh --full     # + verify-release.sh (barrière EN LIGNE)
```

---

## Incidents de référence

### SITE-1 (2026-10-09) — Bouton de téléchargement pointait vers du JSON
- **Symptôme** : le bouton « Télécharger » renvoyait `/api/latestApk` = JSON 725 o, pas l'APK.
- **Cause racine** : le front utilisait l'endpoint de métadonnées (`latestApk`) au lieu d'un endpoint de téléchargement réel.
- **Correctif** : route backend stable `GET /api/download` (302 → dernière APK) ; le site pointe vers `/api/download`.
- **Garde-fou** : `S — plus de /api/latestApk` (règle ci-dessus) + `verify-release.sh` vérifie que `/api/download` renvoie bien un APK.
- **Preuve** : `/api/download` → 302 → `/ComPutin-v41.apk` → 200 `application/vnd.android.package-archive` (3 205 240 o).

### SITE-2 (2026-10-09) — Dépendances CDN tierces (cdnjs/jsdelivr)
- **Symptôme** : Font Awesome + GSAP chargés depuis des CDN tiers → dépendance externe, latence, risque de panne/SEO.
- **Correctif** : sous-ensemble Font Awesome local (`fa-subset.css`, 15 914 o vs 102 641 o) + GSAP/ScrollTrigger servis localement.
- **Garde-fou** : règles S7 (ressource tierce) et S9 (icône absente du sous-ensemble).

### SITE-3 (2026-10-09) — Rails SEO manquants
- **Symptôme** : `robots.txt` et `sitemap.xml` en 404 ; pas de `canonical` ; meta description > 160 car. ; saut h2→h4.
- **Correctif** : `site-hunt.sh --fix` a généré `canonical` + `robots.txt` + `sitemap.xml` ; description raccourcie ; titres footer passés en `h3` (+ CSS `.footer-col h3`).
- **Garde-fou** : règles S2, S5, S11, S12 + `verify-release.sh` (robots/sitemap en 200 en ligne).

### SITE-4 (2026-10-09) — Rich results FAQ + image de partage au mauvais format
- **Symptôme** : la section `#faq` (7 questions) n'avait **aucun** balisage `FAQPage` → pas d'éligibilité aux rich results ; l'image de partage social (`og:image`) était un **capture téléphone 640×1297** (portrait) → rendu rogné sur Facebook/LinkedIn/X.
- **Correctif** : ajout d'un bloc JSON-LD `FAQPage` (7 `Question`/`Answer` = contenu réel de la page) ; génération de `assets/og-image.png` **1200×630** via `tools/make_og_image.py` (identité reprise de `style.css`) et mise à jour de `og:image` + `twitter:image` (+ `og:image:width/height/alt`).
- **Garde-fou** : règles S15 (format `og:image`) et S16 (FAQ ⇒ `FAQPage`), + `verify-release.sh` (JSON-LD présent en ligne).
- **Détail utile** : `tools/make_og_image.py` est le générateur réutilisable de l'image OG (relancer après tout changement de marque).

## SITE-5 — Icône Google Play mal préfixée (fas au lieu de fab) — 2026-10-10

**Symptôme** : « je ne vois plus les émoticônes/icônes sur le site » — l'icône Google Play du bouton « Google Play » n'apparaissait pas.

**Cause racine** : `index.html:534` utilisait `<i class="fas fa-google-play"></i>` alors que `fa-google-play` (U+F3AB) est une icône **Font Awesome Brands**, donc doit utiliser `fab`. Le glyphe est absent de `fa-solid-900.woff2` mais présent dans `fa-brands-400.woff2`.

**Correctif** : passer `fas` → `fab` pour `fa-google-play`.

**Preuve** :
- Vérification croisée CSS ↔ polices (fontTools) : toutes les icônes HTML+JS rendent après correction.
- `fa-times` injecté par `script.js` est bien présent dans le subset.
- Aucune émoticône résiduelle (déjà supprimées par commit 01f11c0).
- site-hunt après correctif : `0 blocker · 0 major · 0 minor · 1 nit (S17 github.io)` → ✅ OK.

**Commit lié** : à commiter avec le fix (index.html).
