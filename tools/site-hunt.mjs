#!/usr/bin/env node
// =============================================================================
// site-hunt.mjs — Chasse aux bugs du site ComPutin
// Esprit identique au bug-hunt.sh de l'app : detection deterministe de motifs
// a risque, correction SURE optionnelle (--fix), code de sortie exploitable
// comme barriere (regles globales G1/G2/G4).
// =============================================================================

import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const INDEX = join(ROOT, 'index.html')
const SCRIPT = join(ROOT, 'script.js')
const FA_CSS = join(ROOT, 'assets', 'vendor', 'fontawesome', 'fa-subset.css')

const argv = process.argv.slice(2)
const FIX = argv.includes('--fix')
const JSON_OUT = argv.includes('--json')
const HELP = argv.includes('--help') || argv.includes('-h')

const ALLOW_EXTERNAL_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com'])

const FORBIDDEN_SIGNALS = [
  { signal: '/api/latestApk', why: "Renvoie du JSON, pas l'APK — utiliser /api/download" },
  { signal: 'cdnjs.cloudflare.com', why: 'CDN tiers : heberger en local' },
  { signal: 'cdn.jsdelivr.net', why: 'CDN tiers : heberger en local' },
  { signal: 'unpkg.com', why: 'CDN tiers : heberger en local' },
]

// Icônes Font Awesome 6 Brands connues
const BRANDS = new Set([
  'fa-android',
  'fa-facebook-f',
  'fa-instagram',
  'fa-x-twitter',
  'fa-youtube',
  'fa-telegram-plane',
  'fa-whatsapp',
  'fa-google-play',
  'fa-linkedin-in',
  'fa-tiktok',
  'fa-threads',
  'fa-github',
])

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{200D}\u{FE0F}]/gu

const findings = []
function add(id, severity, name, detail, line) {
  findings.push({ id, severity, name, detail, line: line ?? null })
}
function lineOf(content, index) {
  return content.slice(0, index).split('\n').length
}
function firstLine(content, needle) {
  const i = content.indexOf(needle)
  return i === -1 ? null : lineOf(content, i)
}

if (HELP) {
  console.log(`site-hunt — chasse aux bugs du site ComPutin
Usage:
  node tools/site-hunt.mjs [--fix] [--json]
  --fix   applique les corrections sures
  --json  sortie JSON
Exit: 0 OK · 1 blocker/major · 2 erreur`)
  process.exit(0)
}

if (!existsSync(INDEX)) {
  console.error(`❌ index.html introuvable : ${INDEX}`)
  process.exit(2)
}
const html = readFileSync(INDEX, 'utf-8')
const js = existsSync(SCRIPT) ? readFileSync(SCRIPT, 'utf-8') : ''
const allContent = html + '\n' + js

// ------------------------------------------------------------------ helpers
const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0]
function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'))
  return m ? m[1] : ''
}
function metaContent(name) {
  const re = new RegExp(`<meta[^>]*(?:name|property)\\s*=\\s*"${name}"[^>]*>`, 'i')
  const m = head.match(re)
  return m ? attr(m[0], 'content') : ''
}
function allTags(re) {
  return html.match(re) || []
}
function externalHost(url) {
  const m = url.match(/^https?:\/\/([^/]+)/i)
  return m ? m[1].toLowerCase() : null
}
function localPathForImage(url) {
  if (!url) return null
  let p = url
  const m = url.match(/^https?:\/\/[^/]+(\/.*)$/i)
  if (m) p = m[1]
  p = p.split(/[?#]/)[0]
  p = p.replace(/^\/computin-Website\//i, '/').replace(/^\//, '')
  const f = join(ROOT, decodeURIComponent(p))
  return existsSync(f) ? f : null
}
function imageSize(file) {
  try {
    const b = readFileSync(file)
    if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) {
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue }
        const mk = b[i + 1]
        if (mk === 0xc0 || mk === 0xc1 || mk === 0xc2) {
          return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }
        }
        i += 2 + b.readUInt16BE(i + 2)
      }
    }
  } catch {}
  return null
}
function ldBlocks() {
  const blocks = []
  const re = /<script[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) {
    try {
      const obj = JSON.parse(m[1])
      blocks.push(Array.isArray(obj) ? obj : [obj])
    } catch {}
  }
  return blocks.flat()
}
function ldTypes(b) {
  const t = b['@type']
  return Array.isArray(t) ? t : t ? [t] : []
}

// ================================================= S9b — prefixe Font Awesome correct (fas/fab)
{
  const re = /<(i|span)[^>]*class\s*=\s*"([^"]*)"/gi
  let m
  let badCount = 0
  let fixedHtml = html
  let fixedJs = js
  while ((m = re.exec(allContent))) {
    const cls = m[2].split(/\s+/)
    const name = cls.find((c) => c.startsWith('fa-') && c !== 'fab' && c !== 'fas' && c !== 'far' && c !== 'fal' && c !== 'fat' && c !== 'fass' && c !== 'fa-brands' && c !== 'fa-solid' && c !== 'fa-regular')
    if (!name) continue
    const prefix = cls.find((c) => c === 'fas' || c === 'fab' || c === 'far' || c === 'fal')
    if (!prefix && cls.includes('fa-brands')) {
      // will be handled conceptually
    }
    if (prefix === 'fas' && BRANDS.has(name)) {
      badCount++
      add('S9b', 'major', 'Mauvais préfixe Font Awesome', `fa-${name} utilisé en 'fas' alors que c'est une icône Brands (fab)`, lineOf(html + '\n' + js, m.index))
      if (FIX) {
        const before = m[0]
        const after = before.replace(/class\s*=\s*"/, 'class="').replace(/\bfas\s+/, 'fab ').replace(/\bfab\s+fab\b/, 'fab')
        // simpler
        const fixed = before.replace(/\bfas\b\s+(fa-[a-z0-9-]+)/, 'fab $1')
        if (fixed !== before) {
          const idx = (m.input === html ? fixedHtml : fixedJs).indexOf(before)
          if (idx !== -1) {
            if (m.input === html) fixedHtml = fixedHtml.replace(before, fixed)
            else fixedJs = fixedJs.replace(before, fixed)
          }
        }
      }
    }
    if (prefix === 'fab' && !BRANDS.has(name) && name.startsWith('fa-')) {
      // ne pas corriger automatiquement ici (par prudence)
    }
  }
  if (FIX) {
    if (fixedHtml !== html) {
      writeFileSync(INDEX, fixedHtml)
      findings.filter(f => f.id === 'S9b' && f.severity === 'major').forEach(f => { f.detail = f.detail + ' [AUTO-CORRIGE]' })
    }
    if (fixedJs !== js && existsSync(SCRIPT)) {
      writeFileSync(SCRIPT, fixedJs)
    }
  }
}

// ================================================= S10 — emojis
{
  const m = allContent.match(EMOJI_RE)
  if (m) {
    const idx = (html + js).search(EMOJI_RE)
    add('S10', 'major', 'Emoji détecté', `« ${m[0]} » — utiliser une icône Font Awesome (règle CLAUDE.md)`, lineOf(html + '\n' + js, idx))
  }
}

// ================================================= S11 — canonical
{
  const hasCanonical = /<link[^>]*rel\s*=\s*"canonical"/i.test(head)
  if (!hasCanonical) {
    add('S11', 'minor', 'Canonical absent', '<link rel="canonical"> manquant', null)
  }
}

// ================================================ S12 — robots / sitemap
{
  if (!existsSync(join(ROOT, 'robots.txt'))) add('S12', 'major', 'robots.txt absent', 'Créer robots.txt (+ directive Sitemap:)', null)
  if (!existsSync(join(ROOT, 'sitemap.xml'))) add('S12', 'major', 'sitemap.xml absent', 'Générer sitemap.xml pour Search Console', null)
}

// ============================================ S13 — Open Graph / S14 lang
{
  for (const p of ['og:title', 'og:description', 'og:image']) {
    if (!metaContent(p)) add('S13', 'minor', `Open Graph ${p} manquant`, `Ajouter <meta property="${p}">`, null)
  }
  if (!/<html[^>]*\slang\s*=/i.test(html)) add('S14', 'blocker', 'Attribut lang absent', '<html lang="fr"> requis', null)
}

// ============================================== S15 — og:image 1200x630
{
  const ogImage = metaContent('og:image')
  if (ogImage) {
    const file = localPathForImage(ogImage)
    const size = file ? imageSize(file) : null
    if (size) {
      const ratio = size.w / size.h
      if (Math.abs(ratio - 1200 / 630) > 0.05) {
        add('S15', 'minor', 'og:image au mauvais format', `${size.w}×${size.h} (attendu ~1200×630)`, firstLine(html, 'og:image'))
      }
    }
  }
}

// ==================================================== S16 — FAQPage
{
  if (/id\s*=\s*"faq"/i.test(html)) {
    const blocks = ldBlocks()
    const hasFaq = blocks.some((b) => ldTypes(b).includes('FAQPage'))
    if (!hasFaq) {
      add('S16', 'major', 'FAQ sans balisage FAQPage', 'Section #faq présente mais aucun JSON-LD FAQPage', firstLine(html, 'id="faq"'))
    }
  }
}

// ============================================ S17 — hôte canonical (info)
{
  const url = metaContent('og:url') || (head.match(/rel\s*=\s*"canonical"[^>]*href\s*=\s*"([^"]*)"/i) || [])[1] || ''
  const host = externalHost(url)
  if (host && host.endsWith('.github.io')) {
    add('S17', 'nit', 'Domaine par défaut (github.io)', 'Prévoir un domaine custom (ex. computin-app.com)', null)
  }
}

// ==================================================== corrections sures
const fixed = []
function insertCanonical() {
  if (/<link[^>]*rel\s*=\s*"canonical"/i.test(head)) return
  const url = metaContent('og:url') || 'https://alexander-f2000.github.io/computin-Website/'
  const tag = `    <link rel="canonical" href="${url}">`
  const newHtml = html.replace(/(\n\s*<title>[\s\S]*?<\/title>)/i, `$1\n${tag}`)
  if (newHtml !== html) {
    writeFileSync(INDEX, newHtml)
    fixed.push('S11 canonical ajouté')
  }
}
function writeRobotsSitemap() {
  const url = metaContent('og:url') || 'https://alexander-f2000.github.io/computin-Website/'
  if (!existsSync(join(ROOT, 'robots.txt'))) {
    writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}\n`, 'utf-8')
    fixed.push('S12 robots.txt créé')
  }
  if (!existsSync(join(ROOT, 'sitemap.xml'))) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${url}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`
    writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf-8')
    fixed.push('S12 sitemap.xml créé')
  }
}

if (FIX) {
  insertCanonical()
  writeRobotsSitemap()
}

// ============================================================== rapport
const ORDER = { blocker: 0, major: 1, minor: 2, nit: 3 }
findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])

if (JSON_OUT) {
  console.log(JSON.stringify({ findings, fixed }, null, 2))
} else {
  const counts = { blocker: 0, major: 0, minor: 0, nit: 0 }
  for (const f of findings) counts[f.severity]++
  const icon = { blocker: '⛔', major: '⚠️ ', minor: '🔸', nit: '🔹' }
  console.log('============================================================')
  console.log('  SITE-HUNT — Chasse aux bugs du site ComPutin')
  console.log('============================================================')
  if (findings.length === 0) {
    console.log('  ✅ Aucun motif à risque détecté.')
  } else {
    for (const f of findings) {
      const at = f.line ? ` (ligne ${f.line})` : ''
      console.log(`  ${icon[f.severity]} ${f.id} ${f.severity}: ${f.name}${at}`)
      console.log(`      ↳ ${f.detail}`)
    }
  }
  if (fixed.length) {
    console.log('  ---')
    for (const x of fixed) console.log(`  🔧 ${x}`)
  }
  console.log('  ---')
  console.log(`  Bilan : ${counts.blocker} blocker · ${counts.major} major · ${counts.minor} minor · ${counts.nit} nit`)
  const fail = counts.blocker + counts.major
  console.log(fail > 0 ? `  ❌ ${fail} problème(s) bloquant(s)/majeur(s).` : '  ✅ OK.')
  console.log('============================================================')
}

process.exit(findings.some((f) => f.severity === 'blocker' || f.severity === 'major') ? 1 : 0)
