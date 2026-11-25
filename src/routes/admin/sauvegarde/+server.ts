import { error } from '@sveltejs/kit';
import { backupBytes } from '#lib/server/admin.ts';

/** The whole league as one SQLite file. Restoring it: see README, "Sauvegarde et restauration". */
export const GET = async ({ locals }) => {
	if (!locals.player?.isAdmin) error(404, 'Page introuvable');
	const day = new Date().toISOString().slice(0, 10);
	return new Response(new Uint8Array(await backupBytes()), {
		headers: {
			'content-type': 'application/vnd.sqlite3',
			'content-disposition': `attachment; filename="mate-moi-${day}.db"`,
			'cache-control': 'no-store'
		}
	});
};
