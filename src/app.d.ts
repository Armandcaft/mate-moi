import type { Player } from '#lib/server/db/schema.ts';

declare global {
	namespace App {
		interface Locals {
			player: Player | null;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
