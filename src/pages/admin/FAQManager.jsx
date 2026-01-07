/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaEdit, FaTrash } from 'react-icons/fa';
import './FAQManager.css';

const FAQManager = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('en');
    const [formData, setFormData] = useState({ question: '', answer: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchFaqs = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('faqs')
            .select('*')
            .eq('language_code', language)
            .order('id', { ascending: true });

        if (error) console.error('Error fetching FAQs:', error);
        else setFaqs(data);
        setLoading(false);
    }, [language]);

    useEffect(() => {
        void fetchFaqs();
    }, [fetchFaqs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('faqs')
                    .update({ ...formData, language_code: language })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('faqs')
                    .insert([{ ...formData, language_code: language }]);
                if (error) throw error;
            }
            setFormData({ question: '', answer: '' });
            setEditingId(null);
            await fetchFaqs();
        } catch (error) {
            console.error('Error saving FAQ:', error);
            alert('Error saving FAQ');
        }
    };

    const handleEdit = (faq) => {
        setFormData({ question: faq.question, answer: faq.answer });
        setEditingId(faq.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const { error } = await supabase
                .from('faqs')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await fetchFaqs();
        } catch (error) {
            console.error('Error deleting FAQ:', error);
        }
    };

    const handleImport = async () => {
        if (!window.confirm('This will DELETE all existing FAQs and import from translation.json. Are you sure?')) return;
        setLoading(true);
        try {
            // 1. Delete all existing
            const { error: delError } = await supabase.from('faqs').delete().neq('id', 0);
            if (delError) {
                console.error('Delete error:', delError);
                // Continue anyway
            }

            const languages = ['en', 'ru', 'az'];
            let allFaqs = [];
            let debugLog = '';

            // 2. Read from JSONs
            for (const lang of languages) {
                try {
                    const response = await fetch(`/locales/${lang}/translation.json`);
                    if (!response.ok) {
                        debugLog += `Failed to fetch ${lang}: ${response.status}\n`;
                        continue;
                    }
                    const json = await response.json();

                    if (json.faq && Array.isArray(json.faq.items)) {
                        const rows = json.faq.items.map(item => ({
                            question: item.question,
                            answer: item.answer,
                            language_code: lang
                        }));
                        allFaqs = [...allFaqs, ...rows];
                        debugLog += `Found ${rows.length} items in ${lang}.\n`;
                    } else {
                        debugLog += `Structure 'faq.items' missing in ${lang}.\n`;
                    }
                } catch (err) {
                    debugLog += `Error parsing ${lang}: ${err.message}\n`;
                }
            }

            // 3. Insert into DB
            if (allFaqs.length > 0) {
                alert(`Preparing to insert ${allFaqs.length} items...\n` + debugLog);
                const { error: insertError } = await supabase.from('faqs').insert(allFaqs);
                if (insertError) throw insertError;

                alert(`SUCCESS! Imported ${allFaqs.length} FAQs.\nRefresh the page if you don't see them immediately.`);
                await fetchFaqs(); // Refresh list
            } else {
                alert('No FAQs found to import.\nLog:\n' + debugLog);
            }

        } catch (error) {
            console.error('Import error:', error);
            alert('CRITICAL IMPORT ERROR: ' + error.message + '\nCheck console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="faq-manager">
            <div className="faq-header-row">
                <h1>FAQ Manager</h1>
                <button onClick={() => void handleImport()} className="btn-secondary" style={{ backgroundColor: '#6366f1' }}>
                    Import from JSON
                </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                Diagnostics:
                URL Configured: {import.meta.env.VITE_SUPABASE_URL ? 'Yes' : 'No'} |
                Loading: {loading ? 'Yes' : 'No'} |
                FAQs Count: {faqs.length}
            </div>

            <div className="language-selector">
                <label>Language: </label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                    <option value="az">Azerbaijani</option>
                </select>
            </div>

            <div className="faq-form-container">
                <h2>{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h2>
                <form onSubmit={(e) => void handleSubmit(e)} className="faq-form">
                    <div className="form-group">
                        <label>Question</label>
                        <input
                            type="text"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Answer</label>
                        <textarea
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-buttons">
                        <button type="submit" className="btn-primary">
                            {editingId ? 'Update' : 'Add'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ question: '', answer: '' });
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="faq-list-container" style={{ marginTop: '40px' }}>
                <h2>Existing FAQs ({language.toUpperCase()})</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="faq-table">
                        <thead>
                            <tr>
                                <th>Question</th>
                                <th>Answer</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {faqs.map((faq) => (
                                <tr key={faq.id}>
                                    <td data-label="Question">{faq.question}</td>
                                    <td data-label="Answer">{faq.answer.substring(0, 50)}...</td>
                                    <td data-label="Actions">
                                        <button onClick={() => handleEdit(faq)} className="action-btn edit" aria-label="Edit">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => void handleDelete(faq.id)} className="action-btn delete" aria-label="Delete">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {faqs.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center' }}>No FAQs found for this language.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div >
    );
};

export default FAQManager;
