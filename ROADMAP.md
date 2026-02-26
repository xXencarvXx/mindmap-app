# Mind Map - Roadmap

## Phase 0 : État actuel
- Vanilla JS, ES modules, pas de build step
- localStorage pour la persistance navigateur
- DATA_VERSION pour l'invalidation du cache
- Données codées en dur dans `data.js`
- Déploiement statique GitHub Pages
- Usage personnel uniquement

## Phase 1 : Persistance serveur (chacun sa mind map)
- Backend : Supabase (auth + base de données)
- Chaque utilisateur crée un compte et obtient sa propre mind map
- Base de données PostgreSQL pour stocker les données (remplace localStorage + data.js)
- Auth : Supabase Auth (email/password, OAuth Google)
- Hébergement : Vercel ou Railway
- Pas de collaboration, chaque utilisateur voit uniquement sa mind map

## Phase 2 : Partage et commentaires
- Partage de mind map (lien public, lien privé, invitations)
- Commentaires sur les nodes
- Permissions (lecture seule, éditeur)

## Phase 3 : Collaboration temps réel
- Indicateurs de présence (qui est en ligne)
- Sync temps réel via Supabase Realtime (WebSockets)
- Gestion des conflits (dernier écrit gagne, ou merge)
- Curseurs des autres utilisateurs visibles

## Stack technique par phase

| Phase | Frontend | Backend | Données | Hébergement |
|-------|----------|---------|---------|-------------|
| 0 (actuel) | Vanilla JS | aucun | localStorage + data.js | GitHub Pages |
| 1 | Vanilla JS ou Svelte | Supabase | PostgreSQL | Vercel/Railway |
| 2 | Svelte (recommandé) | Supabase | PostgreSQL | Vercel/Railway |
| 3 | Svelte | Supabase | PostgreSQL + Realtime | Vercel/Railway |
