import { supabase } from './supabaseClient';

export const fetchSupabaseTranslations = async () => {
    try {
        const { data, error } = await supabase
            .from('translations')
            .select('*');

        if (error) {
            console.error('Error fetching translations:', error);
            return {};
        }

        // Transform flat list to nested object for i18next
        // data: [{ key: 'hero.title', language_code: 'en', value: 'Hello' }, ...]
        // output: { en: { translation: { hero: { title: 'Hello' } } }, ... }

        const resources = {};

        data.forEach(item => {
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
                    current[k] = current[k] || {};
                    current = current[k];
                }
            }
        });

        return resources;
    } catch (err) {
        console.error('Unexpected error fetching translations:', err);
        return {};
    }
};
