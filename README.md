# ♔ Mate-Moi si tu peux

Le tournoi d'échecs hebdomadaire entre amis : chacun affronte chacun, plusieurs parties par adversaire,
puis une finale entre les deux meilleurs désigne le **Roi de la Semaine**.

SvelteKit · SQLite (Drizzle) · Tailwind · un seul serveur Node sur Fly.io.

## Les règles, telles que l'app les applique

- **Phase de groupes** : chaque paire joue plusieurs parties, selon le nombre de joueurs au
  lancement de la semaine : **3** jusqu'à 4 joueurs, **2** pour 5 ou 6, **1** à partir de 7
  (soit 6 à 10 parties chacun jusqu'à 7 joueurs). Couleurs alternées (la Blanche en plus change de
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
npm run player -- add Frank 482915 # les joueurs et leurs codes ne sont jamais dans le dépôt
npm run dev                        # http://localhost:5173
npm test                           # le moteur du tournoi
npm run check                      # types
```

La base est `data/mate-moi.db` (ignorée par git). Après un changement de
`src/lib/server/db/schema.ts` : `npm run db:generate`, puis commiter le dossier `drizzle/` ;
les migrations s'appliquent au démarrage.

Joueurs : `npm run player -- add|pin <nom> <code>`, `activate|deactivate <nom>`, `list`.
Un joueur désactivé garde son historique mais n'entre plus dans les nouvelles semaines.

## Les codes

- Le code donné avec `add` ou `pin` est **provisoire** : à la connexion suivante, le joueur doit
  choisir le sien (6 à 8 chiffres, pas de suite ni de chiffre répété). Personne d'autre ne le connaît.
- Chacun peut le changer quand il veut en touchant son nom en haut à droite ; ses autres appareils
  sont alors déconnectés.
- **Code oublié** : `player pin <nom> <code provisoire>`. Cela lève aussi un éventuel blocage.
- 5 codes faux de suite bloquent le joueur 15 minutes. Le compteur est en base : redémarrer le
  serveur ne le remet pas à zéro.

## Mon profil

Toucher son nom en haut à droite ouvre **Mon profil** : changer son nom (il change partout, même
dans l'historique), sa **devise** (60 caractères, affichée quand on est couronné, sur l'aperçu
WhatsApp, à la connexion et chez les Rois) et son code.

## Admins et invitations

- Le premier admin se nomme en ligne de commande, une fois :
  `fly ssh console -C "sh -c 'cd /app && node scripts/player.ts promote <nom>'"`.
- Ensuite tout se fait dans l'onglet **Admin** de l'app :
  - **Créer un lien d'invitation** : à envoyer sur WhatsApp. Il sert une seule fois et expire au
    bout de 48 h. Le nouveau joueur choisit lui-même son nom et son code.
  - **Nouveau code provisoire** pour un code oublié (le joueur est déconnecté et en choisit un
    nouveau à la connexion), **Désactiver / Réactiver**, **Nommer / Retirer admin**.
  - **Télécharger toute la ligue** : la sauvegarde complète, un seul fichier `.db`.
- Seuls les admins invitent. Un admin ne peut ni se désactiver ni se retirer ses propres droits.

## Arriver en cours de semaine

- **Pendant la phase de groupes** : le nouveau joueur entre tout de suite. Ses parties contre
  chacun s'ajoutent à la semaine, autant que les autres en jouent entre eux cette semaine-là, qui reste un tournoi complet où tout le monde affronte tout le
  monde autant de fois : le classement reste juste. La finale attend que ses parties soient jouées.
- **Pendant le barrage ou la finale** : il commence la semaine suivante.
- Pas de semaine en cours : il fera partie de la prochaine.

## Sauvegarde et restauration

Toute la ligue tient dans **un seul fichier SQLite**. La sauvegarde (onglet Admin) en est une
copie cohérente, prise pendant que l'app tourne.

**Restaurer** : déposer le fichier sous le nom `restore.db` à côté de la base, puis redémarrer.
Au démarrage, l'app le met en place et garde l'ancienne base à côté
(`mate-moi.db.before-restore-<date>`).

```sh
# Fly.io
fly ssh sftp shell          # puis : put mate-moi-2026-11-25.db /data/restore.db
fly machine restart

# Sur un VPS avec Docker (volume monté sur /data)
cp mate-moi-2026-11-25.db /chemin/du/volume/restore.db && docker restart mate-moi
```

**Changer de serveur** (Fly.io → VPS) : télécharger la sauvegarde, la restaurer sur le nouveau
serveur comme ci-dessus, et **reprendre le même `PIN_PEPPER`** (sinon plus aucun code ne
fonctionne). Ne le connaissant plus ? Restaurer quand même, puis donner un code provisoire à
chacun avec `player pin`.

⚠️ La sauvegarde contient les codes (chiffrés) : à garder privée.

## Déployer (Fly.io)

```sh
fly launch --no-deploy --copy-config        # garde fly.toml ; change "app" si le nom est pris
fly volumes create mate_moi_data --size 1 --region cdg
fly secrets set PIN_PEPPER=$(openssl rand -hex 32)
fly deploy
fly ssh console -C "sh -c 'cd /app && node scripts/player.ts add Frank 482915'"
fly ssh console -C "sh -c 'cd /app && node scripts/player.ts promote Frank'"
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
