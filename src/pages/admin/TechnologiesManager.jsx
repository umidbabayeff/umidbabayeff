/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getIcon, getIconList } from '../../lib/IconMapper';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './ServicesManager.css'; // Reusing styles

const TechnologiesManager = () => {
    const { t } = useTranslation();
    const [techs, setTechs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        category: 'tech.categories.frontend',
        icon: 'react',
        language_code: 'en'
    });
    const [editingId, setEditingId] = useState(null);

    const iconList = getIconList();
    const categories = [
        { key: 'tech.categories.frontend', label: t('admin.technologies.categories.frontend', 'Frontend') },
        { key: 'tech.categories.backend', label: t('admin.technologies.categories.backend', 'Backend') },
        { key: 'tech.categories.ai', label: t('admin.technologies.categories.ai', 'AI & Automation') }
    ];

    const fetchTechs = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('technologies')
            .select('*')
            .order('id', { ascending: true });

        if (error) console.error('Error fetching techs:', error);
        else setTechs(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        void fetchTechs();
    }, [fetchTechs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('technologies')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('technologies')
                    .insert([formData]);
                if (error) throw error;
            }
            setFormData({ ...formData, name: '', icon: 'react' });
            setEditingId(null);
            void fetchTechs();
        } catch (error) {
            console.error('Error saving tech:', error);
            alert('Error saving tech');
        }
    };

    const handleEdit = (tech) => {
        setFormData({
            name: tech.name,
            category: tech.category,
            icon: tech.icon ?? 'react',
            language_code: tech.language_code
        });
        setEditingId(tech.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const { error } = await supabase
                .from('technologies')
                .delete()
                .eq('id', id);
            if (error) throw error;
            void fetchTechs();
        } catch (error) {
            console.error('Error deleting tech:', error);
        }
    };

    const handleRestoreDefaults = async () => {
        if (!window.confirm('Delete all techs and restore defaults?')) return;
        setLoading(true);
        try {
            await supabase.from('technologies').delete().neq('id', 0);

            const defaultTechs = [
                // Frontend
                { name: 'React', icon: 'react', category: 'tech.categories.frontend' },
                { name: 'Vite', icon: 'vite', category: 'tech.categories.frontend' },
                { name: 'Stitch', icon: 'layer', category: 'tech.categories.frontend' },
                { name: 'FlutterFlow', icon: 'flutter', category: 'tech.categories.frontend' },
                { name: 'TypeScript', icon: 'typescript', category: 'tech.categories.frontend' },
                { name: 'Tailwind', icon: 'tailwind', category: 'tech.categories.frontend' },
                // Backend
                { name: 'Supabase', icon: 'supabase', category: 'tech.categories.backend' },
                { name: 'Firebase', icon: 'firebase', category: 'tech.categories.backend' },
                { name: 'Google Cloud', icon: 'google-cloud', category: 'tech.categories.backend' },
                { name: 'Node.js', icon: 'node', category: 'tech.categories.backend' },
                { name: 'PostgreSQL', icon: 'postgresql', category: 'tech.categories.backend' },
                // AI
                { name: 'OpenAI', icon: 'openai', category: 'tech.categories.ai' },
                { name: 'Google Gemini', icon: 'google', category: 'tech.categories.ai' },
                { name: 'LangChain', icon: 'network', category: 'tech.categories.ai' },
                { name: 'Zapier', icon: 'zapier', category: 'tech.categories.ai' },
                { name: 'Google Workspace', icon: 'google', category: 'tech.categories.ai' }
            ];

            const { error } = await supabase.from('technologies').insert(defaultTechs);
            if (error) throw error;
            void fetchTechs();
        } catch (err) {
            console.error(err);
            alert('Failed to restore');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>{t('admin.common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="services-manager">
            <div className="technologies-header-row">
                <h1>{t('admin.technologies.title', 'Technologies Manager')}</h1>
                <button onClick={() => void handleRestoreDefaults()} className="btn-secondary" style={{ backgroundColor: '#10b981' }}>
                    {t('admin.common.restore_defaults', 'Restore Defaults')}
                </button>
            </div>

            <div className="service-form-container">
                <h2>{editingId ? t('admin.common.edit', 'Edit Technology') : t('admin.technologies.add_new', 'Add New Tech')}</h2>
                <form onSubmit={(e) => void handleSubmit(e)} className="service-form">
                    <div className="form-group">
                        <label>{t('admin.technologies.table.name', 'Name')}</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('admin.technologies.table.category', 'Category')}</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('admin.technologies.table.icon', 'Icon')}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '1.5rem', color: '#fff' }}>{getIcon(formData.icon)}</div>
                            <select
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                style={{ flex: 1 }}
                            >
                                {iconList.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                            </select>
                        </div>
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
                                    setFormData({ ...formData, name: '', icon: 'react' });
                                }}
                            >
                                {t('admin.common.cancel', 'Cancel')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="service-list-container" style={{ marginTop: '40px' }}>
                {categories.map(cat => (
                    <div key={cat.key} style={{ marginBottom: '40px' }}>
                        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px', color: '#fff' }}>{cat.label}</h3>
                        <div className="service-grid">
                            {techs.filter(t => t.category === cat.key).map((tech) => (
                                <div key={tech.id} className="service-card-admin">
                                    <div className="service-header">
                                        <h3>{tech.name}</h3>
                                        <span className="icon-badge">{getIcon(tech.icon)}</span>
                                    </div>
                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(tech)} className="action-btn edit" aria-label="Edit">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => void handleDelete(tech.id)} className="action-btn delete" aria-label="Delete">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TechnologiesManager;
