import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getIcon } from '../../lib/IconMapper';
import './ServicesList.css';
import { useTranslation } from 'react-i18next';

const ServicesList = () => {
    const { t, i18n } = useTranslation();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            const lang = i18n.language.split('-')[0];
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('language_code', lang)
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching services:', error);
            } else if (data && data.length > 0) {
                setServices(/** @type {any[]} */(data));
            } else {
                // Define fallback if needed, or leave empty to show nothing
                setServices([]);
            }
            setLoading(false);
        };

        void fetchServices();
    }, [i18n.language]);

    if (loading) return null; // Or a skeleton loader

    return (
        <section className="section services-section">
            <div className="container">
                <div className="services-header">
                    <h1>{t('services.header.title')}</h1>
                    <p>{t('services.header.subtitle')}</p>
                </div>
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div key={index} className="service-card">
                            <div className="service-icon-wrapper">
                                {getIcon(service.icon)}
                            </div>
                            <h3>{service.title}</h3>
                            <p>{service.description}</p>
                            {/* Tech pills are static for now or can be added to DB later if needed */}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesList;
