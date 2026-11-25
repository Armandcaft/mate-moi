// Manage players from the command line — names and PINs never live in the repository.
//
// The codes set here are TEMPORARY: the player must choose their own at the next login.
//
//   npm run player -- add Frank 482915
//   npm run player -- pin Frank 739104   (forgotten code: also lifts a lockout)
//   npm run player -- list
//   npm run player -- deactivate Frank   (keeps their history, leaves them out of new weeks)
//   npm run player -- activate Frank
//   npm run player -- promote Frank      (admin: invites, codes, backups at /admin)
//   npm run player -- demote Frank
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

switch (command) {
	case 'add': {
		const n = requireName(name);
		const p = requirePin(pin);
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
					'UPDATE players SET pin_hash = ?, must_change_pin = 1, failed_logins = 0, locked_until = NULL WHERE name = ?'
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
		changed(sqlite.prepare('UPDATE players SET active = ? WHERE name = ?').run(command === 'activate' ? 1 : 0, n), n);
		console.log(`${n} ${command}d.`);
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
		const rows = sqlite.prepare('SELECT id, name, active, is_admin FROM players ORDER BY name').all() as {
			id: number;
			name: string;
			active: number;
			is_admin: number;
		}[];
		for (const r of rows)
			console.log(`${r.id}\t${r.name}${r.is_admin ? '\t(admin)' : ''}${r.active ? '' : '\t(inactive)'}`);
		if (!rows.length) console.log('No players yet.');
		break;
	}
	default:
		fail('Usage: player add|pin <name> <pin> · player activate|deactivate|promote|demote <name> · player list');
}
