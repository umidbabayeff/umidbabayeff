import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './FinalCTA.css';

const FinalCTA = () => {
    const { t } = useTranslation();

    return (
        <section className="section cta-section">
            <div className="container cta-content">
                <h2>{t('cta.title')}</h2>
                <p>{t('cta.subtitle')}</p>
                <Link to="/contact" className="btn btn-primary btn-lg">
                    {t('cta.button')}
                </Link>
            </div>
        </section>
    );
};

export default FinalCTA;
