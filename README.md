# ♔ Mate-Moi si tu peux

Le tournoi d'échecs hebdomadaire entre amis : chacun affronte chacun, trois parties par adversaire,
puis une finale entre les deux meilleurs désigne le **Roi de la Semaine**.

SvelteKit · SQLite (Drizzle) · Tailwind · un seul serveur Node sur Fly.io.

## Les règles, telles que l'app les applique

- **Phase de groupes** : chaque paire joue 3 parties, couleurs alternées (la Blanche en plus change de
  camp chaque semaine). Victoire 3 pts, nulle 1, défaite 0.
- **Égalités** de points, départagées dans cet ordre :
  1. les points des parties entre les joueurs à égalité (face-à-face),
  2. le nombre de victoires,
  3. un **barrage en Armageddon** (la nulle compte comme une victoire des Noirs), rejoué tant
     qu'il le faut. Seule l'égalité qui décide d'une place en finale est jouée : deux joueurs à
     égalité en tête vont tous les deux en finale.
- **Finale** : le mieux classé a les Blancs. En cas de nulle, une partie Armageddon décide ;
  le mieux classé y a les Noirs (et donc l'avantage de la nulle).
- **Résultats** : l'un des deux joueurs déclare le résultat, l'autre le confirme ou le conteste.
  Seul un résultat confirmé compte.

Les règles vivent dans `src/lib/tournament/` (fonctions pures, testées) ; changer un barème ou un
départage se fait là, `RULES` dans `types.ts`.

## Développer

```sh
npm install
npm run player -- add Frank 1234   # les joueurs et leurs codes ne sont jamais dans le dépôt
npm run dev                        # http://localhost:5173
npm test                           # le moteur du tournoi
npm run check                      # types
```

La base est `data/mate-moi.db` (ignorée par git). Après un changement de
`src/lib/server/db/schema.ts` : `npm run db:generate`, puis commiter le dossier `drizzle/` ;
les migrations s'appliquent au démarrage.

Joueurs : `npm run player -- add|pin <nom> <code>`, `activate|deactivate <nom>`, `list`.
Un joueur désactivé garde son historique mais n'entre plus dans les nouvelles semaines.

## Déployer (Fly.io)

```sh
fly launch --no-deploy --copy-config        # garde fly.toml ; change "app" si le nom est pris
fly volumes create mate_moi_data --size 1 --region cdg
fly secrets set PIN_PEPPER=$(openssl rand -hex 32)
fly deploy
fly ssh console -C "node scripts/player.ts add Frank 1234"
```

Si le nom de l'app change, mets aussi à jour `ORIGIN` dans `fly.toml`.

⚠️ Définis `PIN_PEPPER` **avant** de créer les joueurs, et ne le change plus : les codes existants
ne fonctionneraient plus (il faudrait les redéfinir avec `player pin`).

### Sauvegardes (recommandé)

Le volume est un seul disque. [Litestream](https://litestream.io) copie la base en continu vers un
stockage objet (Cloudflare R2, Backblaze B2, Tigris…) et la restaure toute seule sur un volume neuf :

```sh
fly secrets set LITESTREAM_REPLICA_URL=s3://mon-bucket/mate-moi \
  LITESTREAM_ACCESS_KEY_ID=… LITESTREAM_SECRET_ACCESS_KEY=…
```

(Pour R2/B2, ajoute aussi `endpoint:` dans `litestream.yml`.)
