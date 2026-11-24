import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
	integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

export const players = sqliteTable('players', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	/** `salt:hash`, scrypt — see `pin.ts`. */
	pinHash: text('pin_hash').notNull(),
	/** Inactive players keep their history but are left out of new weeks. */
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	createdAt: createdAt()
});

export const sessions = sqliteTable('sessions', {
	/** SHA-256 of the cookie's token; the token itself is never stored. */
	id: text('id').primaryKey(),
	playerId: integer('player_id')
		.notNull()
		.references(() => players.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const weeks = sqliteTable('weeks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	number: integer('number').notNull().unique(),
	kingId: integer('king_id').references(() => players.id),
	closedAt: integer('closed_at', { mode: 'timestamp' }),
	createdAt: createdAt()
});

export const games = sqliteTable(
	'games',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		weekId: integer('week_id')
			.notNull()
			.references(() => weeks.id, { onDelete: 'cascade' }),
		stage: text('stage', { enum: ['group', 'playoff', 'final'] }).notNull(),
		round: integer('round').notNull(),
		whiteId: integer('white_id')
			.notNull()
			.references(() => players.id),
		blackId: integer('black_id')
			.notNull()
			.references(() => players.id),
		armageddon: integer('armageddon', { mode: 'boolean' }).notNull().default(false),
		/** As reported; it only counts once the opponent has confirmed it (`confirmedAt`). */
		result: text('result', { enum: ['1-0', '0-1', '1/2-1/2'] }),
		reportedById: integer('reported_by_id').references(() => players.id),
		reportedAt: integer('reported_at', { mode: 'timestamp' }),
		confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),
		createdAt: createdAt()
	},
	(t) => [index('games_week_idx').on(t.weekId)]
);

export type Player = typeof players.$inferSelect;
export type Week = typeof weeks.$inferSelect;
export type GameRow = typeof games.$inferSelect;
