// Manage players from the command line — names and PINs never live in the repository.
//
//   npm run player -- add Frank 1234
//   npm run player -- pin Frank 5678
//   npm run player -- list
//   npm run player -- deactivate Frank   (keeps their history, leaves them out of new weeks)
//   npm run player -- activate Frank
//
// In production: fly ssh console -C "node scripts/player.ts add Frank 1234"
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PIN_PATTERN, hashPin } from '../src/lib/server/pin.ts';

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
	if (!p || !PIN_PATTERN.test(p)) fail('The PIN must be 4 to 8 digits.');
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
			sqlite.prepare('INSERT INTO players (name, pin_hash) VALUES (?, ?)').run(n, hashPin(p));
		} catch {
			fail(`"${n}" already exists.`);
		}
		console.log(`Added ${n}.`);
		break;
	}
	case 'pin': {
		const n = requireName(name);
		changed(sqlite.prepare('UPDATE players SET pin_hash = ? WHERE name = ?').run(hashPin(requirePin(pin)), n), n);
		// A new PIN signs the player out everywhere.
		sqlite.prepare('DELETE FROM sessions WHERE player_id = (SELECT id FROM players WHERE name = ?)').run(n);
		console.log(`New PIN set for ${n}.`);
		break;
	}
	case 'activate':
	case 'deactivate': {
		const n = requireName(name);
		changed(sqlite.prepare('UPDATE players SET active = ? WHERE name = ?').run(command === 'activate' ? 1 : 0, n), n);
		console.log(`${n} ${command}d.`);
		break;
	}
	case 'list': {
		const rows = sqlite.prepare('SELECT id, name, active FROM players ORDER BY name').all() as {
			id: number;
			name: string;
			active: number;
		}[];
		for (const r of rows) console.log(`${r.id}\t${r.name}${r.active ? '' : '\t(inactive)'}`);
		if (!rows.length) console.log('No players yet.');
		break;
	}
	default:
		fail('Usage: player add|pin <name> <pin> · player activate|deactivate <name> · player list');
}
