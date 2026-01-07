/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import './TranslationManager.css';

const TranslationManager = () => {
    const { t } = useTranslation();
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingKey, setEditingKey] = useState(null);
    const [editValues, setEditValues] = useState({ en: '', ru: '', az: '' });

    // Fetch all translations with pagination
    const fetchTranslations = async () => {
        let allData = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('translations')
                .select('*')
                .range(from, from + limit - 1)
                .order('key');

            if (error) {
                console.error('Error fetching translations:', error);
                hasMore = false;
            } else {
                allData = [...allData, ...data];
                if (data.length < limit) {
                    hasMore = false;
                } else {
                    from += limit;
                }
            }
        }

        // Group by key
        const grouped = {};
        allData.forEach(item => {
            if (!grouped[item.key]) {
                grouped[item.key] = { key: item.key, en: '', ru: '', az: '' };
            }
            grouped[item.key][item.language_code] = item.value;
        });
        setTranslations(Object.values(grouped));
        setLoading(false);
    };

    useEffect(() => {
        const loadRequests = async () => {
            await fetchTranslations();
        };
        void loadRequests();
    }, []);

    const handleEditClick = (item) => {
        setEditingKey(item.key);
        setEditValues({
            en: item.en || '',
            ru: item.ru || '',
            az: item.az || ''
        });
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValues({ en: '', ru: '', az: '' });
    };

    const handleSave = async (key) => {
        // Upsert for each language
        const updates = [
            { key, language_code: 'en', value: editValues.en },
            { key, language_code: 'ru', value: editValues.ru },
            { key, language_code: 'az', value: editValues.az }
        ];

        // Filter out empty values if you want, or keep them to clear translation
        // For simplicity, we upsert all. 
        // Note: 'translations' table must have unique constraint on (key, language_code)

        const { error } = await supabase
            .from('translations')
            .upsert(updates, { onConflict: 'key, language_code' });

        if (error) {
            console.error('Error saving translation:', error);
            alert(t('admin.translations.errors.save_error', 'Error saving translation'));
        } else {
            setEditingKey(null);
            await fetchTranslations();
        }
    };

    const handleAddNew = () => {
        const newKey = prompt(t('admin.translations.prompts.new_key', 'Enter new translation key (e.g. hero.title):'));
        if (newKey) {
            // Check if exists
            if (translations.find(t => t.key === newKey)) {
                alert(t('admin.translations.errors.key_exists', 'Key already exists!'));
                return;
            }
            // Add locally to list so we can edit it
            setTranslations([{ key: newKey, en: '', ru: '', az: '' }, ...translations]);
            setEditingKey(newKey);
            setEditValues({ en: '', ru: '', az: '' });
        }
    };

    const flattenObject = (obj, prefix = '') => {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    const handleSyncFromFiles = async () => {
        if (!confirm(t('admin.translations.prompts.sync_confirm', 'Are you sure? This will overwrite DB with local JSON files.'))) return;
        setLoading(true);
        try {
            const langs = ['en', 'ru', 'az'];
            const allUpdates = [];

            for (const lang of langs) {
                const response = await fetch(`/locales/${lang}/translation.json?v=${new Date().getTime()}`);
                const json = await response.json();
                const flattened = flattenObject(json);

                Object.entries(flattened).forEach(([key, value]) => {
                    allUpdates.push({
                        key,
                        language_code: lang,
                        value: String(value)
                    });
                });
            }

            // Batch upsert (Supabase limits might apply, so maybe chunk it if too huge, but 1000 rows should be fine)
            // Splitting into chunks of 500 just in case
            const chunkSize = 500;
            for (let i = 0; i < allUpdates.length; i += chunkSize) {
                const chunk = allUpdates.slice(i, i + chunkSize);
                const { error } = await supabase
                    .from('translations')
                    .upsert(chunk, { onConflict: 'key, language_code' });
                if (error) throw error;
            }

            alert(t('admin.translations.alerts.sync_success', 'Synced successfully!'));
            await fetchTranslations();
        } catch (err) {
            console.error(err);
            alert('Error syncing: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredTranslations = translations.filter(item =>
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.en.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="translation-manager">
            <h1>{t('admin.translations.title', 'Translation Manager')}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Total Keys Loaded: {translations.length} {loading && '(Loading...)'}
            </p>

            <div className="controls">
                <input
                    type="text"
                    placeholder={t('admin.translations.search_placeholder', 'Search keys or text...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={handleAddNew} className="btn-primary">{t('admin.translations.add_btn', 'Add New Key')}</button>
                <button onClick={() => void handleSyncFromFiles()} className="btn-secondary" style={{ marginLeft: '10px' }}>Sync JSON to DB</button>
            </div>

            {loading ? <p>{t('admin.common.loading', 'Loading...')}</p> : (
                <div className="table-container">
                    <table className="translation-table">
                        <thead>
                            <tr>
                                <th>{t('admin.translations.table.key', 'Key')}</th>
                                <th>{t('admin.translations.table.english', 'English')}</th>
                                <th>{t('admin.translations.table.russian', 'Russian')}</th>
                                <th>{t('admin.translations.table.azerbaijani', 'Azerbaijani')}</th>
                                <th>{t('admin.translations.table.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTranslations.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No translations found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                            {filteredTranslations.map(item => (
                                <tr key={item.key} className={editingKey === item.key ? 'editing-row' : ''}>
                                    <td>{item.key}</td>

                                    {editingKey === item.key ? (
                                        <>
                                            <td data-label="English"><textarea value={editValues.en} onChange={e => setEditValues({ ...editValues, en: e.target.value })} /></td>
                                            <td data-label="Russian"><textarea value={editValues.ru} onChange={e => setEditValues({ ...editValues, ru: e.target.value })} /></td>
                                            <td data-label="Azerbaijani"><textarea value={editValues.az} onChange={e => setEditValues({ ...editValues, az: e.target.value })} /></td>
                                            <td data-label="Actions">
                                                <button onClick={() => void handleSave(item.key)} className="action-btn save">{t('admin.translations.actions.save', 'Save')}</button>
                                                <button onClick={handleCancel} className="action-btn cancel">{t('admin.translations.actions.cancel', 'Cancel')}</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="cell-content" data-label="English">{item.en}</td>
                                            <td className="cell-content" data-label="Russian">{item.ru}</td>
                                            <td className="cell-content" data-label="Azerbaijani">{item.az}</td>
                                            <td data-label="Actions">
                                                <button onClick={() => handleEditClick(item)} className="action-btn edit">{t('admin.translations.actions.edit', 'Edit')}</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TranslationManager;
