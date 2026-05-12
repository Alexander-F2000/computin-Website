# ComPutin Website - Guide de Déploiement

## 📁 Fichiers du site

```
C:\Users\loudh\Downloads\ComPutin-Website\
├── index.html    (Page principale)
├── style.css     (Styles CSS)
└── script.js     (JavaScript)
```

---

## 🚀 Options d'Hébergement

### Option 1: GitHub Pages (Gratuit) ⭐ RECOMMANDÉ

1. **Créer un repository GitHub**
   - Va sur https://github.com/new
   - Nomme-le: `computin-website`
   - Rend-le Public
   - Clique "Create repository"

2. **Uploader les fichiers**
   - Dans ton repo, clique "Add file" > "Upload files"
   - Glisse-dépose `index.html`, `style.css`, `script.js`
   - Clique "Commit changes"

3. **Activer GitHub Pages**
   - Settings > Pages
   - Source: "Deploy from a branch"
   - Branch: "main" / (root)
   - Clique "Save"

4. **Ton site sera en ligne!**
   - URL: `https://ton-username.github.io/computin-website/`

---

### Option 2: Netlify (Gratuit)

1. Va sur https://netlify.com
2. Clique "Add new site" > "Deploy manually"
3. Glisse-dépose le dossier `ComPutin-Website`
4. C'est fait! Tu as une URL comme `https://random-name.netlify.app`

---

### Option 3: Vercel (Gratuit)

1. Va sur https://vercel.com
2. Clique "New Project" > "Import"
3. Upload le dossier
4. Déploiement automatique!

---

### Option 4: Hébergement Local (Test)

1. Installe un serveur local:
   ```bash
   # Avec Python (déjà installé)
   cd C:\Users\loudh\Downloads\ComPutin-Website
   python -m http.server 8000
   ```

2. Ouvre http://localhost:8000 dans ton navigateur

---

## 🌐 Configurer un Nom de Domaine Custom

Si tu veux utiliser `computin-app.com`:

1. **Acheter le domaine** sur:
   - Namecheap (~10$/an)
   - GoDaddy (~12$/an)
   - OVH (~9$/an)

2. **Configurer DNS**:
   - Ajoute un enregistrement CNAME:
     - Host: `www`
     - Value: `ton-site.netlify.app` (ou ton URL Netlify/Vercel)
   - Ajoute une redirection:
     - `@` → `www.tondomaine.com`

3. **Dans Netlify/Vercel**:
   - Settings > Domain Management
   - Ajoute ton domaine custom

---

## 📱 Intégration avec l'App

### Dans ton app Android, ajoute un bouton vers le site:

```kotlin
// Dans MainActivity ou Settings
val intent = Intent(Intent.ACTION_VIEW, 
    Uri.parse("https://computin-website.netlify.app"))
startActivity(intent)
```

### Lien direct de téléchargement:
```
https://computin-website.netlify.app/#download
```

---

## ✅ Checklist avant mise en ligne

- [ ] Remplacer `#` par les vrais liens
- [ ] Ajouter le lien du Play Store (quand disponible)
- [ ] Ajouter le lien de l'APK
- [ ] Mettre à jour les numéros WhatsApp/Telegram
- [ ] Vérifier que les couleurs sont correctes
- [ ] Tester sur mobile

---

## 🆘 Support

Pour modifier le site, edite simplement les fichiers:
- `index.html` - Contenu
- `style.css` - Design
- `script.js` - Interactions

Pas besoin de recompiler! Juste uploader les fichiers mis à jour.
