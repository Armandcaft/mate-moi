# CLAUDE.md

A private weekly chess league for three friends (French UI). SvelteKit 3 + Svelte 5 runes,
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
- `src/lib/server/auth.ts`, `pin.ts` — PIN login, hashed sessions, a lockout stored on the player
  row (not in memory: Fly.io restarts the idle machine). CLI codes are temporary (`must_change_pin`);
  the hook sends such a player to `/code` until they choose their own.
- `src/routes/` — `/` (the week), `/rois` (history), `/login`, `/logout`, `/health`.
- `src/lib/server/og.ts` + `/partage/[key]` and `/og/[key].png` — the WhatsApp link preview
  (Satori + resvg). **The only public pages besides `/login`**, listed in `hooks.server.ts`; they
  show the latest standings and nothing else. `key` changes with each confirmed result so
  WhatsApp, which caches previews per link, refetches.

## Conventions

- SvelteKit 3: import from `#lib/...` with the file extension (`#lib/server/league.ts`);
  `Handle` comes from `@sveltejs/kit/hooks`.
- Only a **confirmed** result counts (`toGame` in `league.ts` hides unconfirmed ones from the engine).
- Answer "no such game" and "not your game" identically (`Partie introuvable.`).
- Theme tokens live in `src/app.css` (`@theme`). Gold is for the king and the main action only.
- No personal data in the repo: names and PINs live in the database; `PIN_PEPPER` is a Fly secret.
