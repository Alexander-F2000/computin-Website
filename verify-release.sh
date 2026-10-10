#!/usr/bin/env bash
# =============================================================================
# verify-release.sh — Barrière de release du SITE (règles globales G1/G2/G4)
#
# Prouve que les elements critiques sont RÉELLEMENT présents sur la version
# EN LIGNE (pas seulement dans le HTML local). Un "commit poussé" ≠ "feature
# livrée" : tant que la page publiée ne contient pas l'élément, la release
# est refusée (exit 1).
#
# Usage : ./verify-release.sh
#   SITE_URL    (defaut https://alexander-f2000.github.io/computin-Website)
#   BACKEND_URL (defaut https://com-putin-backend.vercel.app)
# Exit 0 = OK ; Exit 1 = element critique manquant → NE PAS CONSIDÉRER LIVRÉ.
# =============================================================================
set -uo pipefail

SITE_URL="${SITE_URL:-https://alexander-f2000.github.io/computin-Website}"
BACKEND_URL="${BACKEND_URL:-https://com-putin-backend.vercel.app}"
TMP="$(mktemp -d)"
HTML="$TMP/index.html"
trap 'rm -rf "$TMP"' EXIT

echo "============================================================"
echo "  verify-release — site ComPutin (version EN LIGNE)"
echo "  $SITE_URL"
echo "============================================================"

fail=0

http_code() { curl -s -o /dev/null -w '%{http_code}' "$1" || echo 000; }

# Récupère le HTML live (une seule fois).
code="$(curl -s -o "$HTML" -w '%{http_code}' "$SITE_URL/" || echo 000)"
if [ "$code" != "200" ] || [ ! -s "$HTML" ]; then
  echo "  ❌ page d'accueil : HTTP $code (HTML vide ?)"
  echo "❌ ECHEC : le site n'est pas joignable. Release non vérifiable."
  exit 1
fi
echo "  ✅ page d'accueil : HTTP 200 ($(wc -c < "$HTML" | tr -d ' ') octets)"

check_html() {
  local name="$1" needle="$2"
  if grep -qF -- "$needle" "$HTML"; then echo "  ✅ $name"
  else echo "  ❌ $name — « $needle » ABSENT du HTML EN LIGNE"; fail=1; fi
}
check_absent_html() {
  local name="$1" needle="$2"
  if grep -qF -- "$needle" "$HTML"; then echo "  ❌ $name — « $needle » ENCORE PRÉSENT en ligne"; fail=1
  else echo "  ✅ $name"; fi
}
check_http() {
  local name="$1" url="$2"
  local c; c="$(http_code "$url")"
  if [ "$c" = "200" ]; then echo "  ✅ $name (HTTP 200)"
  else echo "  ❌ $name — HTTP $c ($url)"; fail=1; fi
}

# ---- Structure / sections critiques ----
check_html "Section héro (#hero)"            'id="hero"'
check_html "Section solutions (#solutions)"  'id="solutions"'
check_html "Section tarifs (#pricing)"       'id="pricing"'
check_html "Section FAQ (#faq)"              'id="faq"'
check_html "Section téléchargement (#download)" 'id="download"'
check_html "Section contact (#contact)"      'id="contact"'

# ---- Lien de téléchargement correct (regression corrigée) ----
check_html "Lien APK = /api/download"        '/api/download'
check_absent_html "Plus de lien /api/latestApk (JSON)" '/api/latestApk'

# ---- SEO / indexation ----
check_html "Badge version (Version X.Y.Z)"   'Version '
check_html "Canonical"                        'rel="canonical"'
check_html "JSON-LD MobileApplication"        'MobileApplication'
check_html "JSON-LD FAQPage (rich results)"   '"FAQPage"'
check_html "og:image 1200x630"                 'og-image.png'
check_http "robots.txt"                       "$SITE_URL/robots.txt"
check_http "sitemap.xml"                      "$SITE_URL/sitemap.xml"

# ---- Assets locaux (perte de dépendance CDN) ----
check_http "fa-subset.css (local)"            "$SITE_URL/assets/vendor/fontawesome/fa-subset.css"
check_http "gsap.min.js (local)"              "$SITE_URL/assets/vendor/gsap.min.js"
check_http "style.css"                         "$SITE_URL/style.css"
check_absent_html "Aucun CDN jsdelivr"        'cdn.jsdelivr.net'
check_absent_html "Aucun CDN cdnjs"           'cdnjs.cloudflare.com'

# ---- Backend : la page ne sert à rien si l'APK ne se télécharge pas ----
echo "  -- backend --"
dl="$(curl -sL -o /dev/null -w '%{http_code}|%{content_type}' "$BACKEND_URL/api/download" || echo '000|')"
dcode="${dl%%|*}"; dtype="${dl#*|}"
case "$dtype" in
  application/vnd.android.package-archive*|application/octet-stream*)
    if [ "$dcode" = "200" ]; then echo "  ✅ /api/download → APK ($dtype)"
    else echo "  ❌ /api/download : HTTP $dcode"; fail=1; fi ;;
  *) echo "  ❌ /api/download ne renvoie pas d'APK (HTTP $dcode, $dtype)"; fail=1 ;;
esac

echo "============================================================"
if [ "$fail" = 1 ]; then
  echo "❌ ECHEC : des éléments critiques sont ABSENTS de la version en ligne."
  echo "   La fonctionnalité n'est PAS livrée (règle G1). NE PAS annoncer « fait »."
  exit 1
fi
echo "✅ OK : tous les éléments critiques sont présents EN LIGNE."
exit 0
