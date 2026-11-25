import type { Locale } from '#lib/i18n/index.ts';
import type { Player } from '#lib/server/db/schema.ts';

declare global {
	namespace App {
		interface Locals {
			player: Player | null;
			/** The language pages are written in: `mm_lang` cookie, else Accept-Language, else French. */
			locale: Locale;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
