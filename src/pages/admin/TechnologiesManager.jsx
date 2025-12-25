import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getIcon, getIconList } from '../../lib/IconMapper';
import './ServicesManager.css'; // Reusing styles

const TechnologiesManager = () => {
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
        { key: 'tech.categories.frontend', label: 'Frontend' },
        { key: 'tech.categories.backend', label: 'Backend' },
        { key: 'tech.categories.ai', label: 'AI & Automation' }
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
        fetchTechs();
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
            fetchTechs();
        } catch (error) {
            console.error('Error saving tech:', error);
            alert('Error saving tech');
        }
    };

    const handleEdit = (tech) => {
        setFormData({
            name: tech.name,
            category: tech.category,
            icon: tech.icon || 'react',
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
            fetchTechs();
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
            fetchTechs();
        } catch (err) {
            console.error(err);
            alert('Failed to restore');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="services-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1>Technologies Manager</h1>
                <button onClick={handleRestoreDefaults} className="btn-secondary" style={{ backgroundColor: '#10b981' }}>
                    Restore Defaults
                </button>
            </div>

            <div className="service-form-container">
                <h2>{editingId ? 'Edit Technology' : 'Add New Tech'}</h2>
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Icon</label>
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
                            {editingId ? 'Update' : 'Add'}
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
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="service-list-container">
                {categories.map(cat => (
                    <div key={cat.key} style={{ marginBottom: '40px' }}>
                        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px', color: '#fff' }}>{cat.label}</h3>
                        <div className="service-grid">
                            {techs.filter(t => t.category === cat.key).map((tech) => (
                                <div key={tech.id} className="service-card-admin">
                                    <div className="service-header">
                                        <h4>{tech.name}</h4>
                                        <span className="icon-badge">{getIcon(tech.icon)}</span>
                                    </div>
                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(tech)} className="action-btn edit">Edit</button>
                                        <button onClick={() => handleDelete(tech.id)} className="action-btn delete">Delete</button>
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
