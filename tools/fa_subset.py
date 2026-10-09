"""Genere un sous-ensemble de Font Awesome (6.5.1) ne contenant que les
icones reellement utilisees par le site + les regles de base necessaires."""
import re

SRC = 'assets/vendor/fontawesome/all.min.css'
OUT = 'assets/vendor/fontawesome/fa-subset.css'

USED = {
    'fa-android', 'fa-arrow-right', 'fa-arrow-up', 'fa-bars', 'fa-book',
    'fa-boxes-stacked', 'fa-calculator', 'fa-cash-register', 'fa-chart-line',
    'fa-check', 'fa-chevron-down', 'fa-circle-question', 'fa-download',
    'fa-envelope', 'fa-facebook-f', 'fa-gift', 'fa-google-play', 'fa-hard-drive',
    'fa-heart', 'fa-instagram', 'fa-lock', 'fa-mobile-alt', 'fa-pen-to-square',
    'fa-play', 'fa-shield-halved', 'fa-tag', 'fa-telegram-plane', 'fa-times',
    'fa-triangle-exclamation', 'fa-whatsapp', 'fa-x-twitter', 'fa-youtube',
}

css = open(SRC, encoding='utf-8').read()
# garde le bandeau de licence en tete
m = re.match(r'\s*/\*!.*?\*/', css, re.S)
header = m.group(0) if m else ''
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)


def parse(css):
    """Decoupe en regles de premier niveau (respecte les accolades)."""
    rules, i, n = [], 0, len(css)
    while i < n:
        while i < n and css[i] in ' \t\r\n':
            i += 1
        if i >= n:
            break
        # trouve la premiere '{'
        j = css.find('{', i)
        if j == -1:
            break
        selector = css[i:j].strip()
        depth, k = 0, j
        while k < n:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
                if depth == 0:
                    break
            k += 1
        body = css[j + 1:k]
        rules.append((selector, body))
        i = k + 1
    return rules


def is_icon_rule(selector, body):
    return ':before' in selector and 'content' in body


def keep(selector, body):
    low = selector.lower()
    # @font-face : garder seulement Free(900) et Brands(400)
    if selector.startswith('@font-face'):
        if 'Font Awesome 6 Free' in body:
            return 'font-weight:900' in body.replace(' ', '')
        if 'Font Awesome 6 Brands' in body:
            return True
        return False
    if is_icon_rule(selector, body):
        # identifie l'icone : la classe .fa-xxx dans le selecteur
        names = set(re.findall(r'\.(fa-[a-z0-9-]+)', low))
        return bool(names & USED)
    # toute autre regle = base / modificateur / keyframes / media -> garder
    return True


kept = []
for sel, body in parse(css):
    if keep(sel, body):
        kept.append(f'{sel}{{{body}}}')

out = header + '\n' + '\n'.join(kept) + '\n'
open(OUT, 'w', encoding='utf-8').write(out)

# ---- validation : chaque icone utilisee doit avoir une regle :before ----
present = set()
for sel, body in parse(css):
    if is_icon_rule(sel, body):
        for nm in re.findall(r'\.(fa-[a-z0-9-]+)', sel.lower()):
            present.add(nm)
missing = sorted(USED - present)
print(f'source={len(css)}o  subset={len(out)}o')
print('icones manquantes dans la source :', missing)
# verifie aussi que le CSS genere contient bien chaque icone
gen = open(OUT, encoding='utf-8').read()
absentes = [ic for ic in sorted(USED) if f'.{ic}:before' not in gen]
print('icones absentes du subset  :', absentes)
