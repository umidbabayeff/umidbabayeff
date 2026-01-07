import { supabase } from './supabaseClient';

/**
 * @returns {Promise<Record<string, { translation: Record<string, any> }>>}
 */
export const fetchSupabaseTranslations = async () => {
    try {
        /** 
         * @typedef {Object} TranslationItem
         * @property {string} key
         * @property {string} language_code
         * @property {string} value
         */

        const { data, error } = await supabase
            .from('translations')
            .select('*');

        if (error) {
            console.error('Error fetching translations:', error);
            return {};
        }

        /** @type {Record<string, { translation: Record<string, any> }>} */
        const resources = {};

        /** @type {TranslationItem[]} */
        const translations = data || [];

        translations.forEach(item => {
            const { key, language_code, value } = item;

            if (!resources[language_code]) {
                resources[language_code] = { translation: {} };
            }

            // Handle nested keys (e.g. 'hero.title')
            const keys = key.split('.');
            let current = resources[language_code].translation;

            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (i === keys.length - 1) {
                    current[k] = value;
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    current[k] = current[k] ?? {};
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const next = current[k];
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    current = next;
                }
            }
        });

        return resources;
    } catch (err) {
        console.error('Unexpected error fetching translations:', err);
        return {};
    }
};
