import React from 'react';
import { useTranslation } from 'react-i18next';
import './Philosophy.css';

const Philosophy = () => {
    const { t } = useTranslation();

    return (
        <section className="section philosophy-section">
            <div className="container">
                <div className="philosophy-header">
                    <h1>{t('about.philosophy.title')}</h1>
                    <p>{t('about.philosophy.subtitle')}</p>
                </div>

                <div className="philosophy-content">
                    <div className="philosophy-block">
                        <h2>{t('about.philosophy.system.title')}</h2>
                        <p>{t('about.philosophy.system.desc')}</p>
                    </div>

                    <div className="philosophy-block">
                        <h2>{t('about.philosophy.automation.title')}</h2>
                        <p>{t('about.philosophy.automation.desc')}</p>
                    </div>

                    <div className="philosophy-block">
                        <h2>{t('about.philosophy.ai.title')}</h2>
                        <p>{t('about.philosophy.ai.desc')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Philosophy;
