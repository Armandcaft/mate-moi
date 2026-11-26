<div align="center">

<img src="static/favicon.svg" width="88" alt="" />

# Mate-Moi si tu peux

**A weekly chess league for friends. Everyone plays everyone, the top two play the final, one King of the Week.**

[![CI](https://github.com/Armandcaft/mate-moi/actions/workflows/ci.yml/badge.svg)](https://github.com/Armandcaft/mate-moi/actions/workflows/ci.yml)
[![Live](https://img.shields.io/badge/live-mate--moi.fly.dev-C9A24A?logo=flydotio&logoColor=white)](https://mate-moi.fly.dev)
![Languages](https://img.shields.io/badge/i18n-FR%20%C2%B7%20EN%20%C2%B7%20DE-C8CBD2)
![Private league](https://img.shields.io/badge/league-invite%20only-151518)

![SvelteKit](https://img.shields.io/badge/SvelteKit-3-FF3E00?logo=svelte&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-5%20runes-FF3E00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-one%20file-003B57?logo=sqlite&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)
![Vitest](https://img.shields.io/badge/tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A522.18-5FA04E?logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Fly.io](https://img.shields.io/badge/deployed%20on-Fly.io-8B5CF6?logo=flydotio&logoColor=white)

<img src="docs/screenshots/week.jpg" width="230" alt="The week: standings and games to report" />
<img src="docs/screenshots/king.jpg" width="230" alt="The King of the Week, with his motto" />
<img src="docs/screenshots/kings.jpg" width="230" alt="The Hall of Kings" />

</div>

## ♟️ How a week goes

1. **Someone starts the week.** The app schedules every pairing and picks colours.
2. **Play anywhere** (a real board, Lichess, the office). Then one player taps the winner, or *Draw*.
3. **The opponent confirms** or disputes. Only confirmed results count.
4. **The top two play the final.** A drawn final goes to Armageddon.
5. **♔ The King is crowned,** their motto shows up, and the standings go to WhatsApp as an image.

## ✨ Features

| | |
|---|---|
| 🏆 **Standings & tie-breaks** | 3 / 1 / 0 points, then head-to-head, wins, and Armageddon play-offs |
| 📈 **Scales with the group** | 3 games per opponent up to 4 players, 2 up to 6, then 1 |
| 📲 **WhatsApp previews** | the share link unfurls into a standings card, King and motto included |
| ✉️ **Invite links** | one-time, 48 h; newcomers pick their own name and code, and can join mid-week |
| 🙋 **Profiles** | change your name, your motto (60 characters), your code |
| 🛡️ **Admin tab** | invites, temporary codes, (de)activation, promotion, one-click backup |
| 🌍 **Three languages** | French (default), English, German; follows the phone, switchable anytime |
| 🌗 **Light & dark** | black-and-gold or ivory board; follows the phone, or pick one on your profile |
| 🔐 **Locked down** | peppered scrypt codes, lockout after 5 tries; only login, invitations and link previews are public |

<details>
<summary><b>📜 The exact rules</b></summary>

- **Group stage**: every pair plays 3, 2 or 1 games depending on the group size when the week
  starts. Colours alternate; who gets the extra White flips every week. Win 3, draw 1, loss 0.
- **Ties** on points, in order: points between the tied players, number of wins, then an
  Armageddon play-off (a draw counts as a win for Black), repeated until someone is ahead.
  Only the tie that decides a place in the final is played off.
- **Final**: the better-ranked player has White. A draw sends it to Armageddon, where the
  better-ranked player has Black, and with it the draw odds.
- **Joining mid-week**: during the group stage, the newcomer's games against everyone are added
  (as many as each pair plays that week), so the round-robin stays even and the final waits for
  them. During a play-off or the final, they start the next week.

The rules are pure, tested functions in [`src/lib/tournament/`](src/lib/tournament).
</details>

## 🧰 Commands

### On your computer

| Command | What it does |
|---|---|
| `npm install` | install dependencies |
| `npm run dev` | dev server on http://localhost:5173 |
| `npm test` | unit tests (rules, codes, profiles, translations) |
| `npm run check` · `check:watch` | type-check Svelte and TypeScript |
| `npm run build` then `npm start` | production build, served on port 3000 |
| `npm run preview` | preview the production build |
| `npm run db:generate` | write a migration after editing `src/lib/server/db/schema.ts` (commit `drizzle/`) |

### Players (the `player` script)

Locally: `npm run player -- <command>`. On Fly.io:
`fly ssh console -C "sh -c 'cd /app && node scripts/player.ts <command>'"`.

| Command | What it does |
|---|---|
| `add <name> <code>` | new player with a **temporary** code (6 to 8 digits); they choose their own at first login |
| `pin <name> <code>` | forgotten code: a new temporary one, also lifts a lockout |
| `promote <name>` · `demote <name>` | give or remove the admin tab |
| `deactivate <name>` · `activate <name>` | sign out and bench a player, history kept |
| `list` | everyone, with admin and inactive flags |

After the first admin exists, the **Admin tab** does all of this from the app.

### On Fly.io

| Command | What it does |
|---|---|
| `fly deploy` | deploy (or let the GitHub integration deploy on push) |
| `fly status` · `fly logs` | is it up, what is it saying |
| `fly scale count 1` | keep **one** machine: SQLite lives on one volume |
| `fly machine start` · `fly machine restart` | wake it up, or restart (also applies a restore) |
| `fly secrets set PIN_PEPPER=$(openssl rand -hex 32)` | once, **before** creating players; never change it |
| `fly volumes list` · `fly volumes snapshots list <id>` | the disk, and Fly's daily snapshots (5 days) |
| `fly ssh sftp shell` → `put backup.db /data/restore.db` | upload a backup to restore it at the next start |

<details>
<summary><b>🚀 First deployment</b></summary>

```sh
fly launch --no-deploy --copy-config        # keeps fly.toml; change "app" (and ORIGIN) if taken
fly volumes create mate_moi_data --size 1 --region cdg
fly secrets set PIN_PEPPER=$(openssl rand -hex 32)
fly deploy
fly ssh console -C "sh -c 'cd /app && node scripts/player.ts add Frank 482915'"
fly ssh console -C "sh -c 'cd /app && node scripts/player.ts promote Frank'"
```
</details>

<details>
<summary><b>💾 Backup, restore, moving to another server</b></summary>

The whole league is **one SQLite file**. *Admin → Download the whole league* gives a consistent
copy taken while the app runs.

**Restore**: put the file next to the database as `restore.db` and restart. The app swaps it in at
start-up and keeps the replaced one as `mate-moi.db.before-restore-<date>`.

```sh
fly ssh sftp shell        # then: put mate-moi-2026-11-25.db /data/restore.db
fly machine restart

# a VPS with Docker, volume mounted on /data
cp mate-moi-2026-11-25.db /path/to/volume/restore.db && docker restart mate-moi
```

**Moving servers**: restore the backup there and **reuse the same `PIN_PEPPER`**, or no code will
work (then give everyone a temporary one with `player pin`). The backup holds the hashed codes:
keep it private.

**Continuous backups** with [Litestream](https://litestream.io) to any S3-compatible storage
(R2, B2, Tigris…); a fresh volume restores itself:

```sh
fly secrets set LITESTREAM_REPLICA_URL=s3://my-bucket/mate-moi \
  LITESTREAM_ACCESS_KEY_ID=… LITESTREAM_SECRET_ACCESS_KEY=…
```
For R2 or B2, also add `endpoint:` in `litestream.yml`.
</details>

## 🗂️ Inside

```
src/lib/tournament/   the rules: schedule, standings, tie-breaks, what the week needs next
src/lib/server/       database, auth & codes, league writes, admin, profiles, preview image
src/lib/i18n/         fr / en / de dictionaries
src/routes/           week · rois · profil · code · admin · invitation · partage · og · login
scripts/player.ts     the player command line
drizzle/              migrations, applied at start-up
```

CI runs the type check, the tests, the build, and builds the Docker image and checks that it
serves `/health` and a preview image. Contributor notes: [`CLAUDE.md`](CLAUDE.md).

<div align="center"><sub>Made for a WhatsApp group of friends · ♔ Mate-moi si tu peux</sub></div>
