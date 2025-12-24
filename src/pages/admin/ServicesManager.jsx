import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './ServicesManager.css';

const ServicesManager = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('en');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'code' // default icon
    });
    const [editingId, setEditingId] = useState(null);

    const icons = ['code', 'mobile', 'database', 'settings', 'cpu', 'palette'];

    const fetchServices = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('language_code', language)
            .order('id', { ascending: true });

        if (error) console.error('Error fetching services:', error);
        else setServices(data);
        setLoading(false);
    }, [language]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('services')
                    .update({ ...formData, language_code: language })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert([{ ...formData, language_code: language }]);
                if (error) throw error;
            }
            setFormData({ title: '', description: '', icon: 'code' });
            setEditingId(null);
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Error saving service');
        }
    };

    const handleEdit = (service) => {
        setFormData({
            title: service.title,
            description: service.description,
            icon: service.icon || 'code'
        });
        setEditingId(service.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const handleRestoreDefaults = async () => {
        if (!window.confirm('This will DELETE all existing services and restore defaults. Continue?')) return;
        setLoading(true);
        try {
            await supabase.from('services').delete().neq('id', 0);

            const defaultServices = [
                // EN
                { language_code: 'en', title: 'Web Development', description: 'High-performance websites and web applications built with React, Next.js, and modern CSS.', icon: 'laptop-code' },
                { language_code: 'en', title: 'Mobile Applications', description: 'Cross-platform mobile apps that provide native-like experiences for iOS and Android.', icon: 'mobile' },
                { language_code: 'en', title: 'Backend & Databases', description: 'Secure and scalable backend architectures using cloud solutions and robust databases.', icon: 'database' },
                { language_code: 'en', title: 'Business Automation', description: 'Streamlining operations with Google Workspace automation and custom scripts.', icon: 'robot' },
                { language_code: 'en', title: 'AI Solutions', description: 'Integrating OpenAI and custom models to add intelligence to your products.', icon: 'brain' },
                { language_code: 'en', title: 'Design & Brand Identity', description: 'User-centric UI/UX design that builds trust and converts visitors.', icon: 'palette' },
                // RU
                { language_code: 'ru', title: 'Web-разработка', description: 'Высокопроизводительные сайты и веб-приложения на React, Next.js и современном CSS.', icon: 'laptop-code' },
                { language_code: 'ru', title: 'Мобильные приложения', description: 'Кроссплатформенные приложения с нативным опытом для iOS и Android.', icon: 'mobile' },
                { language_code: 'ru', title: 'Бэкенд & Базы данных', description: 'Безопасные и масштабируемые архитектуры с использованием облачных решений.', icon: 'database' },
                { language_code: 'ru', title: 'Автоматизация бизнеса', description: 'Оптимизация операций с помощью автоматизации Google Workspace и скриптов.', icon: 'robot' },
                { language_code: 'ru', title: 'Решения на базе ИИ', description: 'Интеграция OpenAI и кастомных моделей для добавления интеллекта в ваши продукты.', icon: 'brain' },
                { language_code: 'ru', title: 'Дизайн и айдентика', description: 'UI/UX, ориентированный на пользователя, который вызывает доверие и конвертирует.', icon: 'palette' },
                // AZ
                { language_code: 'az', title: 'Veb İnkişafı', description: 'React, Next.js və müasir CSS ilə qurulmuş yüksək performanslı saytlar.', icon: 'laptop-code' },
                { language_code: 'az', title: 'Mobil Tətbiqlər', description: 'iOS və Android üçün nativ təcrübə təmin edən çarpaz platformalı tətbiqlər.', icon: 'mobile' },
                { language_code: 'az', title: 'Backend və Verilənlər Bazas', description: 'Bulud həllərindən istifadə edərək təhlükəsiz və miqyaslana bilən backend.', icon: 'database' },
                { language_code: 'az', title: 'Biznes Avtomatlaşdırılması', description: 'Google Workspace avtomatlaşdırması və xüsusi skriptlərlə əməliyyatların sadələşdirilməsi.', icon: 'robot' },
                { language_code: 'az', title: 'Sİ Həlləri', description: 'Məhsullarınıza zəka əlavə etmək üçün OpenAI və xüsusi modellərin inteqrasiyası.', icon: 'brain' },
                { language_code: 'az', title: 'Dizayn və Brend İdentikliyi', description: 'İnam yaradan və ziyarətçiləri müştəriyə çevirən istifadəçi yönümlü UI/UX.', icon: 'palette' }
            ];

            const { error } = await supabase.from('services').insert(defaultServices);
            if (error) throw error;

            alert('Services restored!');
            fetchServices();
        } catch (error) {
            console.error(error);
            alert('Failed to restore services');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="services-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Services Manager</h1>
                <button onClick={handleRestoreDefaults} className="btn-secondary" style={{ backgroundColor: '#10b981' }}>
                    Restore Defaults
                </button>
            </div>

            <div className="language-selector">
                <label>Language: </label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                    <option value="az">Azerbaijani</option>
                </select>
            </div>

            <div className="service-form-container">
                <h2>{editingId ? 'Edit Service' : 'Add New Service'}</h2>
                <form onSubmit={handleSubmit} className="service-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Icon</label>
                        <select
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        >
                            {icons.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                    setFormData({ title: '', description: '', icon: 'code' });
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="service-list-container">
                <h2>Existing Services ({language.toUpperCase()})</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="service-grid">
                        {services.map((service) => (
                            <div key={service.id} className="service-card-admin">
                                <div className="service-header">
                                    <h3>{service.title}</h3>
                                    <span className="icon-badge">{service.icon}</span>
                                </div>
                                <p>{service.description}</p>
                                <div className="card-actions">
                                    <button onClick={() => handleEdit(service)} className="action-btn edit">Edit</button>
                                    <button onClick={() => handleDelete(service.id)} className="action-btn delete">Delete</button>
                                </div>
                            </div>
                        ))}
                        {services.length === 0 && <p>No services found.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServicesManager;
