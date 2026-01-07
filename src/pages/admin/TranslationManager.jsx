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

    // Fetch all translations
    const fetchTranslations = async () => {
        // setLoading(true); 
        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .order('key');

        if (error) {
            console.error('Error fetching translations:', error);
        } else {
            // Group by key
            const grouped = {};
            data.forEach(item => {
                if (!grouped[item.key]) {
                    grouped[item.key] = { key: item.key, en: '', ru: '', az: '' };
                }
                grouped[item.key][item.language_code] = item.value;
            });
            setTranslations(Object.values(grouped));
        }
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

    const filteredTranslations = translations.filter(item =>
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.en.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="translation-manager">
            <h1>{t('admin.translations.title', 'Translation Manager')}</h1>

            <div className="controls">
                <input
                    type="text"
                    placeholder={t('admin.translations.search_placeholder', 'Search keys or text...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={handleAddNew} className="btn-primary">{t('admin.translations.add_btn', 'Add New Key')}</button>
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
