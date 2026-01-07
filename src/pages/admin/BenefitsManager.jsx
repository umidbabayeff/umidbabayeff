/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getIcon } from '../../lib/IconMapper';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './BenefitsManager.css';

const BenefitsManager = () => {
    const { t } = useTranslation();
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('en');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'building' // default
    });
    const [editingId, setEditingId] = useState(null);

    // Initial icon list based on the user's image requests
    const icons = ['building', 'cogs', 'chart-line', 'brain', 'robot', 'lock', 'globe', 'rocket'];

    const fetchBenefits = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('benefits')
            .select('*')
            .eq('language_code', language)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching benefits:', error);
            // If table doesn't exist, we might get an error here.
        } else {
            setBenefits(data);
        }
        setLoading(false);
    }, [language]);

    useEffect(() => {
        void fetchBenefits();
    }, [fetchBenefits]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('benefits')
                    .update({ ...formData, language_code: language })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('benefits')
                    .insert([{ ...formData, language_code: language }]);
                if (error) throw error;
            }
            setFormData({ title: '', description: '', icon: 'building' });
            setEditingId(null);
            void fetchBenefits();
        } catch (error) {
            console.error('Error saving benefit:', error);
            alert('Error saving benefit');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            title: item.title,
            description: item.description,
            icon: item.icon ?? 'building'
        });
        setEditingId(item.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const { error } = await supabase
                .from('benefits')
                .delete()
                .eq('id', id);
            if (error) throw error;
            void fetchBenefits();
        } catch (error) {
            console.error('Error deleting benefit:', error);
        }
    };

    const handleRestoreDefaults = async () => {
        if (!window.confirm('This will DELETE all existing benefits and restore defaults. Continue?')) return;
        setLoading(true);
        try {
            await supabase.from('benefits').delete().neq('id', 0);

            const defaultBenefits = [
                // EN
                { language_code: 'en', title: 'Architecture', description: 'Scalable foundation for growth from day one.', icon: 'building' },
                { language_code: 'en', title: 'Automation', description: 'Optimized processes to save time and reduce errors.', icon: 'cogs' },
                { language_code: 'en', title: 'Scalability', description: 'Systems designed for millions of users.', icon: 'chart-line' },
                { language_code: 'en', title: 'AI Integration', description: 'Smart solutions using the latest AI technologies.', icon: 'brain' },
                // RU
                { language_code: 'ru', title: 'Архитектура', description: 'Масштабируемый фундамент для роста с первого дня.', icon: 'building' },
                { language_code: 'ru', title: 'Автоматизация', description: 'Оптимизированные процессы для экономии времени и сокращения ошибок.', icon: 'cogs' },
                { language_code: 'ru', title: 'Масштабируемость', description: 'Системы, рассчитанные на миллионы пользователей.', icon: 'chart-line' },
                { language_code: 'ru', title: 'Интеграция ИИ', description: 'Умные решения с использованием новейших технологий искусственного интеллекта.', icon: 'brain' },
                // AZ
                { language_code: 'az', title: 'Memarlıq', description: 'İlk gündən böyümək üçün miqyaslana bilən təməl.', icon: 'building' },
                { language_code: 'az', title: 'Avtomatlaşdırma', description: 'Vaxta qənaət və səhvləri azaltmaq üçün optimallaşdırılmış proseslər.', icon: 'cogs' },
                { language_code: 'az', title: 'Miqyaslılıq', description: 'Milyonlarla istifadəçi üçün nəzərdə tutulmuş sistemlər.', icon: 'chart-line' },
                { language_code: 'az', title: 'Sİ İnteqrasiyası', description: 'Ən son süni intellekt texnologiyalarından istifadə edən ağıllı həllər.', icon: 'brain' },
            ];

            const { error } = await supabase.from('benefits').insert(defaultBenefits);
            if (error) throw error;

            alert('Benefits restored!');
            void fetchBenefits();
        } catch (error) {
            console.error(error);
            alert('Failed to restore benefits. Make sure the "benefits" table exists in Supabase.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="benefits-manager">
            <div className="benefits-header-row">
                <h1>{t('admin.benefits.title', 'Benefits Manager')}</h1>
                <button onClick={() => void handleRestoreDefaults()} className="btn-secondary" style={{ backgroundColor: '#10b981' }}>
                    {t('admin.common.restore_defaults', 'Restore Defaults')}
                </button>
            </div>

            <div className="language-selector">
                <label>{t('admin.common.language', 'Language')}:</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                    <option value="az">Azerbaijani</option>
                </select>
            </div>

            <div className="benefit-form-container">
                <h2>{editingId ? t('admin.common.edit', 'Edit Benefit') : t('admin.benefits.add_new', 'Add New Benefit')}</h2>
                <form onSubmit={(e) => void handleSubmit(e)} className="benefit-form">
                    <div className="form-group">
                        <label>{t('admin.benefits.table.title', 'Title')}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('admin.benefits.table.icon', 'Icon')}</label>
                        <select
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        >
                            {icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('admin.benefits.table.desc', 'Description')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-buttons">
                        <button type="submit" className="btn-primary">
                            {editingId ? t('admin.common.save', 'Update') : t('admin.common.create', 'Add')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ title: '', description: '', icon: 'building' });
                                }}
                            >
                                {t('admin.common.cancel', 'Cancel')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="benefit-list-container" style={{ marginTop: '40px' }}>
                <h2>{t('admin.benefits.existing_benefits', 'Existing Benefits')} ({language.toUpperCase()})</h2>
                {loading ? (
                    <p>{t('admin.common.loading', 'Loading...')}</p>
                ) : (
                    <div className="benefit-grid">
                        {benefits.map((benefit) => (
                            <div key={benefit.id} className="benefit-card-admin">
                                <div className="benefit-header">
                                    <h3>{benefit.title}</h3>
                                    <span className="icon-badge">{getIcon(benefit.icon) ?? benefit.icon}</span>
                                </div>
                                <p>{benefit.description}</p>
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(benefit)} className="action-btn edit" aria-label="Edit">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => void handleDelete(benefit.id)} className="action-btn delete" aria-label="Delete">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {benefits.length === 0 && <p>{t('admin.benefits.no_benefits', 'No benefits found.')}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BenefitsManager;
