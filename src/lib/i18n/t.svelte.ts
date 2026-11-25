// Translations in components: `t('week.label', { n: 3 })`. The locale comes from the root layout's
// data (`page.data.locale`), so the text follows it reactively.
import { page } from '$app/state';
import { DATE_LOCALE, DEFAULT_LOCALE, isLocale, translator, type MessageKey, type Params } from './index.ts';

/** The page's language. */
export const locale = () => (isLocale(page.data.locale) ? page.data.locale : DEFAULT_LOCALE);

/** The tag `Intl` formats dates with for the page's language. */
export const dateLocale = () => DATE_LOCALE[locale()];

export const t = (key: MessageKey, params?: Params) => translator(locale())(key, params);
