#!/usr/bin/env bash
# =============================================================================
# site-hunt.sh — Chasse aux bugs du site ComPutin (wrapper)
# Miroir de bug-hunt.sh de l'app : meme esprit (detection deterministe,
# correction sure, barriere de release), applique au site web.
#
# Usage :
#   ./site-hunt.sh              # checks statiques (tools/site-hunt.mjs)
#   ./site-hunt.sh --fix        # + corrections sures (canonical/robots/sitemap)
#   ./site-hunt.sh --links      # + verifie les endpoints backend en ligne
#   ./site-hunt.sh --full       # + verify-release.sh (prouve la version EN LIGNE)
#   ./site-hunt.sh --help
#
# Exit : 0 = OK ; 1 = findings bloquants/majeurs ; 2 = usage.
# =============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="${SITE_URL:-https://alexander-f2000.github.io/computin-Website}"
BACKEND_URL="${BACKEND_URL:-https://com-putin-backend.vercel.app}"
NODE="$(command -v node || true)"

if [ -z "$NODE" ]; then echo "❌ node introuvable dans le PATH"; exit 2; fi

MODE="static"
FIX_FLAG=""
for arg in "$@"; do
  case "$arg" in
    --help|-h) MODE="help" ;;
    --fix)     FIX_FLAG="--fix" ;;
    --links)   MODE="links" ;;
    --full)    MODE="full" ;;
    *) echo "❌ argument inconnu : $arg"; MODE="help" ;;
  esac
done

if [ "$MODE" = "help" ]; then
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

echo "════════════════════════════════════════════════════════════"
echo "  site-hunt — mode : $MODE"
echo "════════════════════════════════════════════════════════════"

# ---- 1) Checks statiques (toujours) ----
# shellcheck disable=SC2086
"$NODE" "$ROOT/tools/site-hunt.mjs" $FIX_FLAG
STATIC_RC=$?

# ---- 2) Checks reseau (--links / --full) ----
LINK_RC=0
if [ "$MODE" = "links" ] || [ "$MODE" = "full" ]; then
  echo ""
  echo "── L1 · backend /api/checkUpdate ──"
  CU="$(curl -s -o /tmp/sitehunt_cu.json -w '%{http_code}' "$BACKEND_URL/api/checkUpdate" || echo 000)"
  if [ "$CU" = "200" ] && grep -q '"downloadUrl"' /tmp/sitehunt_cu.json 2>/dev/null; then
    echo "  ✅ /api/checkUpdate 200 + downloadUrl présent"
  else
    echo "  ❌ /api/checkUpdate : HTTP $CU (downloadUrl manquant ?)"; LINK_RC=1
  fi

  echo "── L2 · backend /api/download (doit rediriger vers l'APK) ──"
  DL="$(curl -sL -o /tmp/sitehunt.apk -w '%{http_code}|%{content_type}|%{size_download}' "$BACKEND_URL/api/download" || echo '000||0')"
  CTYPE="${DL#*|}"; CTYPE="${CTYPE%|*}"
  SIZE="${DL##*|}"
  case "$CTYPE" in
    application/vnd.android.package-archive*|application/octet-stream*)
      if [ "${SIZE:-0}" -gt 1000000 ]; then echo "  ✅ APK téléchargée ($SIZE octets, $CTYPE)"
      else echo "  ❌ APK trop petite ($SIZE octets)"; LINK_RC=1; fi ;;
    *) echo "  ❌ /api/download ne renvoie pas un APK (content-type=$CTYPE)"; LINK_RC=1 ;;
  esac
fi

# ---- 3) Barriere de release (--full) ----
REL_RC=0
if [ "$MODE" = "full" ]; then
  echo ""
  if [ -x "$ROOT/verify-release.sh" ]; then
    SITE_URL="$BASE_URL" BACKEND_URL="$BACKEND_URL" "$ROOT/verify-release.sh"
    REL_RC=$?
  elif [ -f "$ROOT/verify-release.sh" ]; then
    SITE_URL="$BASE_URL" BACKEND_URL="$BACKEND_URL" bash "$ROOT/verify-release.sh"
    REL_RC=$?
  else
    echo "❌ verify-release.sh introuvable"; REL_RC=2
  fi
fi

echo ""
if [ "$STATIC_RC" -eq 0 ] && [ "$LINK_RC" -eq 0 ] && [ "$REL_RC" -eq 0 ]; then
  echo "✅ site-hunt : OK"
  exit 0
fi
echo "❌ site-hunt : échec (statique=$STATIC_RC · liens=$LINK_RC · release=$REL_RC)"
exit 1
