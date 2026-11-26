import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
	integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

export const players = sqliteTable(
	'players',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull().unique(),
		/** `salt:hash`, scrypt — see `pin.ts`. */
		pinHash: text('pin_hash').notNull(),
		/** Inactive players keep their history but are left out of new weeks. */
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		/**
		 * A code set from the CLI is temporary: the player must choose their own before
		 * anything else. Defaults to true so existing players are asked once after this lands.
		 */
		mustChangePin: integer('must_change_pin', { mode: 'boolean' }).notNull().default(true),
		/** Wrong codes in a row; reset on success. Stored so a restart does not forgive them. */
		failedLogins: integer('failed_logins').notNull().default(0),
		lockedUntil: integer('locked_until', { mode: 'timestamp' }),
		/** Admins invite players, reset codes, and download backups (`/admin`). */
		isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
		/** A short motto the player writes (≤ 60 characters), shown when they are crowned. */
		slogan: text('slogan'),
		/**
		 * The player deleted their account (or an admin did): name, code and slogan are gone, the
		 * games stay, shown as "deleted player". Also inactive. See `accounts.ts`.
		 */
		deletedAt: integer('deleted_at', { mode: 'timestamp' }),
		/**
		 * The league's owner (at most one, set from the CLI: `player owner <name>`). Always an admin;
		 * nobody can demote, archive or delete them from the app. They hand it on with "transfer".
		 */
		isOwner: integer('is_owner', { mode: 'boolean' }).notNull().default(false),
		createdAt: createdAt()
	},
	(t) => [
		// At most one owner: the database refuses a second one.
		uniqueIndex('players_one_owner').on(t.isOwner).where(sql`${t.isOwner} = 1`)
	]
);

/** A one-time link that lets a newcomer create their own player. */
export const invites = sqliteTable('invites', {
	/** SHA-256 of the link's token; the token itself is shown once and never stored. */
	id: text('id').primaryKey(),
	createdById: integer('created_by_id')
		.notNull()
		.references(() => players.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	usedAt: integer('used_at', { mode: 'timestamp' }),
	usedById: integer('used_by_id').references(() => players.id),
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
	/**
	 * The group stage ends here (start + 7 days, admins may move it): pending results count as
	 * reported, unplayed group games are closed `0-0` (`sweep`). Play-off and final have none.
	 */
	deadline: integer('deadline', { mode: 'timestamp' }),
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
		result: text('result', { enum: ['1-0', '0-1', '1/2-1/2', '0-0'] }),
		reportedById: integer('reported_by_id').references(() => players.id),
		reportedAt: integer('reported_at', { mode: 'timestamp' }),
		confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),
		/** Confirmed by the clock, not the opponent: nobody answered for 48 h (`sweep` in league.ts). */
		autoConfirmed: integer('auto_confirmed', { mode: 'boolean' }).notNull().default(false),
		createdAt: createdAt()
	},
	(t) => [index('games_week_idx').on(t.weekId)]
);

/** A browser that receives push notifications for a player (Web Push, `push.ts`). */
export const pushSubscriptions = sqliteTable(
	'push_subscriptions',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		playerId: integer('player_id')
			.notNull()
			.references(() => players.id, { onDelete: 'cascade' }),
		/** The push service's URL for this browser: one row per browser. */
		endpoint: text('endpoint').notNull().unique(),
		p256dh: text('p256dh').notNull(),
		auth: text('auth').notNull(),
		/** The language the player used when subscribing: notifications are written in it. */
		locale: text('locale').notNull(),
		createdAt: createdAt()
	},
	(t) => [index('push_subscriptions_player_idx').on(t.playerId)]
);

export type Player = typeof players.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Week = typeof weeks.$inferSelect;
export type GameRow = typeof games.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
