import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './TranslationManager.css';

const TranslationManager = () => {
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingKey, setEditingKey] = useState(null);
    const [editValues, setEditValues] = useState({ en: '', ru: '', az: '' });

    // Fetch all translations
    const fetchTranslations = useCallback(async () => {
        // setLoading(true); // avoided to prevent sync setState in effect
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
    }, []);

    useEffect(() => {
        fetchTranslations();
    }, [fetchTranslations]);

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
            alert('Error saving translation');
        } else {
            setEditingKey(null);
            fetchTranslations();
        }
    };

    const handleAddNew = () => {
        const newKey = prompt('Enter new translation key (e.g. hero.title):');
        if (newKey) {
            // Check if exists
            if (translations.find(t => t.key === newKey)) {
                alert('Key already exists!');
                return;
            }
            // Add locally to list so we can edit it
            setTranslations([{ key: newKey, en: '', ru: '', az: '' }, ...translations]);
            setEditingKey(newKey);
            setEditValues({ en: '', ru: '', az: '' });
        }
    };

    const filteredTranslations = translations.filter(t =>
        t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.en.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="translation-manager">
            <h1>Translation Manager</h1>

            <div className="controls">
                <input
                    type="text"
                    placeholder="Search keys or text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={handleAddNew} className="btn-primary">Add New Key</button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="table-container">
                    <table className="translation-table">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>English</th>
                                <th>Russian</th>
                                <th>Azerbaijani</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTranslations.map(item => (
                                <tr key={item.key} className={editingKey === item.key ? 'editing-row' : ''}>
                                    <td>{item.key}</td>

                                    {editingKey === item.key ? (
                                        <>
                                            <td><textarea value={editValues.en} onChange={e => setEditValues({ ...editValues, en: e.target.value })} /></td>
                                            <td><textarea value={editValues.ru} onChange={e => setEditValues({ ...editValues, ru: e.target.value })} /></td>
                                            <td><textarea value={editValues.az} onChange={e => setEditValues({ ...editValues, az: e.target.value })} /></td>
                                            <td>
                                                <button onClick={() => handleSave(item.key)} className="action-btn save">Save</button>
                                                <button onClick={handleCancel} className="action-btn cancel">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="cell-content">{item.en}</td>
                                            <td className="cell-content">{item.ru}</td>
                                            <td className="cell-content">{item.az}</td>
                                            <td>
                                                <button onClick={() => handleEditClick(item)} className="action-btn edit">Edit</button>
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
