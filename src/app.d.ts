import type { Locale } from '#lib/i18n/index.ts';
import type { Player } from '#lib/server/db/schema.ts';
import type { Theme } from '#lib/theme.ts';

declare global {
	namespace App {
		interface Locals {
			player: Player | null;
			/** The language pages are written in: `mm_lang` cookie, else Accept-Language, else French. */
			locale: Locale;
			/** The colour theme: `mm_theme` cookie (set on the profile), else `auto` (the device's). */
			theme: Theme;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
