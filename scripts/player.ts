// Manage players from the command line — names and PINs never live in the repository.
//
// The codes set here are TEMPORARY: the player must choose their own at the next login.
//
//   npm run player -- add Frank 482915
//   npm run player -- pin Frank 739104   (forgotten code: also lifts a lockout)
//   npm run player -- list
//   npm run player -- deactivate Frank   (archive: keeps their history, leaves them out of new weeks)
//   npm run player -- activate Frank     (restore an archived player, from the next week)
//   npm run player -- delete Frank       (name, code, motto gone; games kept as "deleted player")
//   npm run player -- promote Frank      (admin: invites, codes, backups at /admin)
//   npm run player -- demote Frank
//
// `deactivate` and `delete` refuse a player who is in the open week: taking them out of it means
// dropping or forfeiting their games and moving the week on, which is the league engine's job
// (`advance` in src/lib/server/league.ts), not something to copy here. Use the Admin tab then.
//
// In production: fly ssh console -C "sh -c 'cd /app && node scripts/player.ts add Frank 482915'"
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PIN_PATTERN, hashPin } from '../src/lib/server/pin.ts';

// On the server (/data is the Fly.io volume), a PIN hashed without the pepper would never
// match at login, so refuse rather than create players nobody can sign in as.
if (existsSync('/data') && !process.env.PIN_PEPPER) {
	console.error('PIN_PEPPER is not set. Run: fly secrets set PIN_PEPPER=$(openssl rand -hex 32)');
	process.exit(1);
}

const path = process.env.DATABASE_PATH ?? 'data/mate-moi.db';
mkdirSync(dirname(path), { recursive: true });
const sqlite = new Database(path);
sqlite.pragma('foreign_keys = ON');
migrate(drizzle(sqlite), { migrationsFolder: process.env.MIGRATIONS_PATH ?? 'drizzle' });

const [command, name, pin] = process.argv.slice(2);

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

function requirePin(p: string | undefined): string {
	if (!p || !PIN_PATTERN.test(p)) fail('The PIN must be 6 to 8 digits.');
	return p;
}

function requireName(n: string | undefined): string {
	const trimmed = n?.trim();
	if (!trimmed) fail('A name is required.');
	return trimmed;
}

function changed(info: { changes: number }, n: string) {
	if (info.changes === 0) fail(`No player called "${n}".`);
}

/** The player called `n` (deleted players have no name left), or exit. */
function playerId(n: string): number {
	const row = sqlite.prepare('SELECT id FROM players WHERE name = ? AND deleted_at IS NULL').get(n) as
		| { id: number }
		| undefined;
	if (!row) fail(`No player called "${n}".`);
	return row.id;
}

/** See the comment at the top: the Admin tab settles a leaver's games in the open week. */
function refuseIfInOpenWeek(id: number, n: string) {
	const playing = sqlite
		.prepare(
			`SELECT 1 FROM games g JOIN weeks w ON w.id = g.week_id
			 WHERE w.closed_at IS NULL AND (g.white_id = ? OR g.black_id = ?) LIMIT 1`
		)
		.get(id, id);
	if (playing)
		fail(`${n} is playing in the current week. Archive or delete them from the Admin tab, which also settles their games.`);
}

switch (command) {
	case 'add': {
		const n = requireName(name);
		const p = requirePin(pin);
		if (n.startsWith('~')) fail('A name cannot start with "~".');
		try {
			sqlite
				.prepare('INSERT INTO players (name, pin_hash, must_change_pin) VALUES (?, ?, 1)')
				.run(n, hashPin(p));
		} catch {
			fail(`"${n}" already exists.`);
		}
		console.log(`Added ${n}. The code is temporary: they choose their own at first login.`);
		break;
	}
	case 'pin': {
		const n = requireName(name);
		changed(
			sqlite
				.prepare(
					'UPDATE players SET pin_hash = ?, must_change_pin = 1, failed_logins = 0, locked_until = NULL WHERE name = ? AND deleted_at IS NULL'
				)
				.run(hashPin(requirePin(pin)), n),
			n
		);
		// A new PIN signs the player out everywhere.
		sqlite.prepare('DELETE FROM sessions WHERE player_id = (SELECT id FROM players WHERE name = ?)').run(n);
		console.log(`Temporary PIN set for ${n}; they choose their own at next login.`);
		break;
	}
	case 'activate':
	case 'deactivate': {
		const n = requireName(name);
		const id = playerId(n);
		if (command === 'deactivate') refuseIfInOpenWeek(id, n);
		sqlite.prepare('UPDATE players SET active = ? WHERE id = ?').run(command === 'activate' ? 1 : 0, id);
		console.log(`${n} ${command === 'activate' ? 'restored' : 'archived'}.`);
		break;
	}
	case 'delete': {
		// The same as deleteAccount in src/lib/server/accounts.ts.
		const n = requireName(name);
		const id = playerId(n);
		refuseIfInOpenWeek(id, n);
		const erased = sqlite.transaction(() => {
			sqlite.prepare('DELETE FROM sessions WHERE player_id = ?').run(id);
			sqlite.prepare('DELETE FROM invites WHERE created_by_id = ? AND used_at IS NULL').run(id);
			const played = sqlite.prepare('SELECT 1 FROM games WHERE white_id = ? OR black_id = ? LIMIT 1').get(id, id);
			if (!played) {
				sqlite.prepare('DELETE FROM invites WHERE created_by_id = ? OR used_by_id = ?').run(id, id);
				sqlite.prepare('DELETE FROM players WHERE id = ?').run(id);
				return true;
			}
			sqlite
				.prepare(
					`UPDATE players SET deleted_at = unixepoch(), active = 0, is_admin = 0, slogan = NULL, name = ?,
					 pin_hash = 'deleted:', must_change_pin = 0, failed_logins = 0, locked_until = NULL WHERE id = ?`
				)
				.run(`~deleted-${id}`, id);
			return false;
		})();
		console.log(
			erased ? `${n} deleted (no games: nothing kept).` : `${n} deleted; their games stay, as "deleted player".`
		);
		break;
	}
	case 'promote':
	case 'demote': {
		const n = requireName(name);
		changed(sqlite.prepare('UPDATE players SET is_admin = ? WHERE name = ?').run(command === 'promote' ? 1 : 0, n), n);
		console.log(`${n} is ${command === 'promote' ? 'now an admin' : 'no longer an admin'}.`);
		break;
	}
	case 'list': {
		const rows = sqlite
			.prepare('SELECT id, name, active, is_admin FROM players WHERE deleted_at IS NULL ORDER BY name')
			.all() as {
			id: number;
			name: string;
			active: number;
			is_admin: number;
		}[];
		for (const r of rows)
			console.log(`${r.id}\t${r.name}${r.is_admin ? '\t(admin)' : ''}${r.active ? '' : '\t(archived)'}`);
		if (!rows.length) console.log('No players yet.');
		break;
	}
	default:
		fail('Usage: player add|pin <name> <pin> · player activate|deactivate|delete|promote|demote <name> · player list');
}
