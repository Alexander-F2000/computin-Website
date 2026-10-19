#!/usr/bin/env bash
# =============================================================================
# validate.sh — Barrière de release du SITE (règles globales G1/G2/G4)
#
# Enveloppe `site-hunt.sh` (checks statiques, déterministes, OFFLINE) et
# NORMALISE son verdict vers la convention globale du garde opencode :
#     0 = PRET        (rien à signaler)
#     1 = CONDITIONS  (non bloquant — jamais retourné pour un vrai échec)
#     2 = BLOQUE      (bloque la release)
#
# Pourquoi une enveloppe : `site-hunt.sh` sort **1** pour des findings
# bloquants/majeurs. Or, dans la convention globale, **1 = CONDITIONS =
# NON bloquant** : branché tel quel, un vrai échec du site ne bloquerait rien.
# On le remonte donc explicitement en **2**.
#
# Volontairement ONLINE-FREE : `verify-release.sh` (version EN LIGNE) reste
# hors du chemin bloquant — c'est un smoke post-déploiement. Il s'exécute via
# `bash site-hunt.sh --full` ou via la CI (workflow site-hunt.yml).
#
# Usage : bash .opencode/validate.sh
# Exit  : 0 PRET / 1 CONDITIONS / 2 BLOQUE
#
# NOTE — pourquoi ce fichier est sous `.opencode/` et non à la racine :
# GitHub Pages sert TOUT le repo (README.md, verify-release.sh, site-hunt.sh
# sont téléchargeables), SAUF les fichiers/dossiers commençant par un point
# (filtrés par Jekyll : .github/, .gitattributes → 404). Le placer ici le rend
# NON servi (404) tout en le versionnant, pour que la barrière voyage avec le repo.
# =============================================================================
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

# ---- 1) Arbre git propre : ce qui est poussé doit être ce qui a été vérifié ----
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  dirty="$(git status --porcelain)"
  if [ -n "$dirty" ]; then
    echo "BLOQUE — arbre git sale : commit non effectué(s) :"
    printf '%s\n' "$dirty" | sed 's/^/  /'
    echo "  → pousser livrerait un site différent de ce qui vient d'être vérifié (G1)."
    exit 2
  fi
fi

# ---- 2) Checks statiques du site (offline, déterministes) ----
out="$(bash site-hunt.sh 2>&1)"; rc=$?
if [ "$rc" -ne 0 ]; then
  printf '%s\n' "$out"
  echo "BLOQUE — site-hunt.sh a signalé des findings (exit $rc)."
  exit 2
fi

echo "PRET — arbre propre + checks statiques du site OK."
exit 0
