import { useState, useEffect } from 'react';
import { BiBuildings, BiCog, BiTrendingUp, BiBot, BiGlobe, BiRocket, BiLock, BiChip } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import './ValueProp.css';

const ValueProp = () => {
    const { t, i18n } = useTranslation();
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(true);

    // Map string icon names to React Components
    const iconMap = {
        'building': <BiBuildings />,
        'cogs': <BiCog />,
        'chart-line': <BiTrendingUp />,
        'brain': <BiBot />, // Using Bot for AI/Brain
        'robot': <BiBot />,
        'globe': <BiGlobe />,
        'rocket': <BiRocket />,
        'lock': <BiLock />,
        'cpu': <BiChip />
    };

    useEffect(() => {
        const fetchBenefits = async () => {
            setLoading(true);
            try {
                // Get current language code (e.g., 'en', 'ru')
                const lang = i18n.language || 'en';

                const { data, error } = await supabase
                    .from('benefits')
                    .select('*')
                    .eq('language_code', lang)
                    .order('id', { ascending: true });

                if (error) {
                    console.error('Error fetching benefits:', error);
                } else if (data && data.length > 0) {
                    setBenefits(data);
                } else {
                    // Fallback or empty
                    setBenefits([]);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBenefits();
    }, [i18n.language]);

    // If loading or no dynamic data, fall back to hardcoded existing logic? 
    // Or simpler: just render what we have. If empty, show nothing or hardcoded.
    // Let's rely on the Seed script having run. If empty, we show empty grid.

    return (
        <section className="section value-prop">
            <div className="container">
                <div className="value-header">
                    <h2>{t('value_prop.header')}</h2>
                    <p>{t('value_prop.subheader')}</p>
                </div>

                <div className="value-grid">
                    {benefits.length > 0 ? (
                        benefits.map((benefit) => (
                            <div key={benefit.id} className="value-card">
                                <div className="value-icon">
                                    {iconMap[benefit.icon] || <BiBuildings />}
                                </div>
                                <h3>{benefit.title}</h3>
                                <p>{benefit.description}</p>
                            </div>
                        ))
                    ) : (
                        // Fallback if DB is empty: Hardcoded original content
                        <>
                            <div className="value-card">
                                <div className="value-icon"><BiBuildings /></div>
                                <h3>{t('value_prop.cards.architecture.title')}</h3>
                                <p>{t('value_prop.cards.architecture.desc')}</p>
                            </div>
                            <div className="value-card">
                                <div className="value-icon"><BiCog /></div>
                                <h3>{t('value_prop.cards.automation.title')}</h3>
                                <p>{t('value_prop.cards.automation.desc')}</p>
                            </div>
                            <div className="value-card">
                                <div className="value-icon"><BiTrendingUp /></div>
                                <h3>{t('value_prop.cards.scalability.title')}</h3>
                                <p>{t('value_prop.cards.scalability.desc')}</p>
                            </div>
                            <div className="value-card">
                                <div className="value-icon"><BiBot /></div>
                                <h3>{t('value_prop.cards.ai.title')}</h3>
                                <p>{t('value_prop.cards.ai.desc')}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ValueProp;
