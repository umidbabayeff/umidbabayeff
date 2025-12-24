import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Hero.css';

const Hero = () => {
    const { t } = useTranslation();

    return (
        <section className="hero-section">
            <div className="container hero-content">
                <div className="hero-text">
                    <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t('hero.title') }}></h1>
                    <p className="hero-subtitle" dangerouslySetInnerHTML={{ __html: t('hero.subtitle') }}></p>
                    <div className="hero-actions">
                        <Link to="/contact" className="btn btn-primary btn-lg">
                            {t('hero.cta_discuss')}
                        </Link>
                        <Link to="/contact" className="btn btn-secondary btn-lg">
                            {t('hero.cta_consult')}
                        </Link>
                    </div>
                </div>
            </div>
            <div className="hero-background">
                <div className="glow glow-1"></div>
                <div className="glow glow-2"></div>
            </div>
        </section>
    );
};

export default Hero;
