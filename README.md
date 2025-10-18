# emplitemps
# Mon Emploi du Temps — MVP


## Ce que ça fait
- Affichage semaine (lundi → dimanche, 7h–21h)
- Authentification (email + mot de passe) via sessions PHP
- CRUD de vos événements (ex: heures de conduite) stockés en SQLite
- CORS activé pour héberger frontend (GitHub Pages) et backend (Alwaysdata)


## Déploiement rapide


### 1) Backend (Alwaysdata)
1. Créez une app web PHP 8.x sur Alwaysdata, DocumentRoot = `api/public`
2. Déployez le dossier `api/` (via git ou SFTP)
3. Créez un fichier d’environnement (Variables) :
- `SQLITE_PATH` : `/home/<user>/www/api/data/app.sqlite` (chemin absolu)
- `SEED_EMAIL` : votre email
- `SEED_PASSWORD` : votre mot de passe
- `CORS_ORIGIN` : `https://<votreuser>.github.io`
4. Premier appel à `/api/auth/login` créera la DB automatiquement (migrations auto)


### 2) Frontend (GitHub Pages)
1. Poussez le dossier `frontend/` dans un repo (ex: `emplois-idris`)
2. Activez GitHub Pages (branch `main`, dossier `/frontend` ou `/` selon votre choix)
3. Éditez `frontend/app.js` → mettez `API_BASE` à `https://<votre-sousdomaine>.alwaysdata.net/api`


## Roadmap (prochaines étapes)
- Import/overlay de l’EDT public (2GA1-2) via URL iCal/ICS (merge affichage)
- Catégories/couleurs par type (Cours/TD/TP/Conduite/Perso)
- Export .ics de vos événements perso
- Multi-utilisateur (si vous ouvrez le site à d’autres)
- PWA (mode hors-ligne + ajout écran d’accueil)


## Sécurité
- Mots de passe hashés (`password_hash`)
- Sessions cookies `HttpOnly` + `Secure` si HTTPS
- Vérification d’ownership sur update/delete d’événements


## Tips
- Pour tester en local : `php -S localhost:8080 -t api/public` pour l’API et ouvrez `frontend/index.html` dans le navigateur.
- Si l’API est derrière un sous-dossier `/api`, la réécriture `.htaccess` gère le routage.