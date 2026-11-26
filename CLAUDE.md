# CLAUDE.md

A private weekly chess league for three friends (French UI, also in English and German). SvelteKit 3 + Svelte 5 runes,
SQLite via Drizzle (`better-sqlite3`), Tailwind 4, adapter-node, deployed to Fly.io with a volume.

## Commands

```sh
npm run dev | npm test | npm run check | npm run build
npm run player -- add <name> <pin>     # players are created only from the CLI
npm run db:generate                     # after editing the schema; commit drizzle/
```

Before committing: `npm run check` and `npm test` must pass (CI runs both, plus the Docker image).

## Layout

- `src/lib/tournament/` — the rules: schedule, standings, tie-breaks, and `nextStep`, which says
  what the week needs next. **Pure, no I/O, fully tested** (`tournament.test.ts`). Rule changes go
  here, with a test.
- `src/lib/server/league.ts` — the only code that writes games/weeks. Every write is a transaction;
  `confirmResult` calls `advance`, which inserts whatever `nextStep` asks for or crowns the king.
- **Time rules run lazily: `sweep(now)` (league.ts), no cron.** Fly.io stops the idle machine, so
  no timer can be trusted; every load/action that reads or writes the week (week page, `/rois`,
  og/partage, admin, invitation, account deletion) calls `sweep()` first. One transaction applies
  what is due, with the time it fell due (a result unanswered for 48 h: `confirmed_at` =
  `reported_at` + 48 h, `auto_confirmed`), then `advance`. Nothing due = one query. The "is it due"
  decisions are pure and take `now` (`tournament/clock.ts`); never `Date.now()` in the tournament layer.
- **`'0-0'`** is a result no player can report (`REPORTABLE`): an unplayed group game closed by
  the week's deadline (`weeks.deadline`, start + 7 days, admins move it; group stage only). It
  counts as played and lost by both, no points, 0 each in head-to-head; cards say « non jouée ».
  Anything that switches on a result must handle it (`scoreFor`, `describe`, the Hall's h2h, stats).
  Dates shown to players use `timeZone()` (`zone.svelte.ts`): UTC until hydrated, then the device's.
- `src/lib/server/auth.ts`, `pin.ts` — PIN login, hashed sessions, a lockout stored on the player
  row (not in memory: Fly.io restarts the idle machine). CLI codes are temporary (`must_change_pin`);
  the hook sends such a player to `/code` until they choose their own.
- `src/routes/` — `/` (the week), `/rois` (history), `/profil` (name, slogan), `/code`, `/login`,
  `/logout`, `/health`. Name and slogan rules: `src/lib/profile.ts` (pure, tested).
- ⚠️ **Page data reaches the browser.** A query feeding a page selects `publicColumns`
  (`PublicPlayer` in `league.ts`), never a whole player row: it holds the code hash. `/rois`
  shipped every hash to every player until this rule existed.
- `src/lib/server/admin.ts` + `/admin` — invites, temporary codes, (de)activation, promotion, the
  backup download. **Every admin load AND action checks `isAdmin` itself** (actions do not run the
  load) and answers 404. `/invitation/[token]` is public: the one-time token is the authorization.
  A newcomer joins the running week only during its group stage (`joinCurrentWeek`, adding
  `joinerSchedule`'s games so the week stays a full round-robin); after that, the next week.
- **Owner** (`players.is_owner`, a partial unique index allows one): set only from the CLI
  (`player owner <name>`, which also makes them admin). Always an admin; nobody demotes, archives
  or deletes them, in the app (`setAdmin`, `refuseOwner` in `accounts.ts`, buttons hidden) or the
  CLI; they cannot delete themselves. They hand it on with *transfer* (`transferOwnership`) to
  another active admin. They may still get a temporary code.
- Leaving: **archive** = `active` false (reversible); **delete** (`src/lib/server/accounts.ts`) =
  `deleted_at`, name `~deleted-<id>`, code unusable, sessions and unused invites gone, games kept and
  shown as « Joueur supprimé » via `playerName` (`format.ts`); a player with no game is removed
  outright. Either way they leave the open week: `advance` (league.ts) applies `departures`
  (tournament): group stage → all their group games dropped; play-off/final → their unfinished games
  forfeited, including ones created for them later; < 2 players left → week closed with no king
  (`abandoned`). The last active admin cannot delete themselves. The CLI refuses a player in the open week.
- Games per opponent: `gamesPerPairFor(players)` when a week starts (3 / 2 / 1 by group size); a
  joiner plays the running week's own count, read back with `gamesPerPairIn`, never the new size's.
- `src/lib/i18n/` — French (default and fallback), English, German. `fr.ts` is the source of truth;
  `en.ts`/`de.ts` are typed against it, so a missing key fails `npm run check`. Components call
  `t('key', params)` from `t.svelte.ts`; server code throws or returns a `Problem` (a key + params)
  and the action translates it with `say(locals.locale, …)`. The language: `mm_lang` cookie (set by
  `/lang`), else Accept-Language; WhatsApp previews (`/partage`, `/og`) take `?lang=`, else French.
  **Every new user-facing string goes into all three dictionaries.**
- Restore = `restore.db` next to the database, swapped in by `docker-entrypoint.sh` at start-up.
- `src/lib/server/og.ts` + `/partage/[key]` and `/og/[key].png` — the WhatsApp link preview
  (Satori + resvg). **Public, with `/login`, `/lang` and `/invitation/`**, listed in `hooks.server.ts`; they
  show the latest standings and nothing else. `key` changes with each confirmed result so
  WhatsApp, which caches previews per link, refetches.

## Conventions

- SvelteKit 3: import from `#lib/...` with the file extension (`#lib/server/league.ts`);
  `Handle` comes from `@sveltejs/kit/hooks`.
- Only a **confirmed** result counts (`toGame` in `league.ts` hides unconfirmed ones from the engine).
- Answer "no such game" and "not your game" identically (`league.gameNotFound`, « Partie introuvable. »).
- Theme tokens live in `src/app.css` (`@theme`). Gold is for the king and the main action only.
  Two palettes: dark (the `@theme` defaults) and light, which redefines the same variables under
  `prefers-color-scheme: light` and `[data-theme="light"]` (keep both blocks identical). The choice
  (`mm_theme` cookie, `/theme`, on `/profil`) is put on `<html>` by `hooks.server.ts`; `auto` adds
  nothing. **Never hard-code a colour in a component** (errors are `text-danger`). `og.ts` stays dark.
- No personal data in the repo: names and PINs live in the database; `PIN_PEPPER` is a Fly secret.
