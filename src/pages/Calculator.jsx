import React, { useState, useMemo } from 'react';
import { services, types, features } from '../data/calculatorData';
import { BiChevronRight, BiChevronLeft, BiCheck, BiRefresh } from 'react-icons/bi';
import FinalCTA from '../components/home/FinalCTA';
import './Calculator.css';

import { useTranslation } from 'react-i18next';
// ... imports

const Calculator = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // Calculate total price effect
    useMemo(() => {
        let price = 0;
        if (selectedService) {
            const service = services.find(s => s.id === selectedService);
            if (service) price += service.basePrice;
        }

        if (selectedType) {
            const type = types.find(t => t.id === selectedType);
            if (type) price *= type.multiplier;
        }

        selectedFeatures.forEach(featId => {
            const feature = features.find(f => f.id === featId);
            if (feature) price += feature.price;
        });

        setTotalPrice(Math.round(price));
    }, [selectedService, selectedType, selectedFeatures]);

    const toggleFeature = (id) => {
        setSelectedFeatures(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        );
    };

    const handleNext = () => {
        setStep(prev => Math.min(prev + 1, 4));
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const resetCalculator = () => {
        setStep(1);
        setSelectedService(null);
        setSelectedType(null);
        setSelectedFeatures([]);
        setTotalPrice(0);
    };

    return (
        <div className="calculator-page">
            <div className="container">
                <div className="calculator-header">
                    <h1>{t('calc.header.title')}</h1>
                    <p>{t('calc.header.subtitle')}</p>
                </div>

                <div className="calculator-container">
                    {/* Progress Bar */}
                    <div className="progress-bar">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>{t('calc.steps.service')}</div>
                        <div className={`progress-line ${step >= 2 ? 'filled' : ''}`}></div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>{t('calc.steps.scale')}</div>
                        <div className={`progress-line ${step >= 3 ? 'filled' : ''}`}></div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>{t('calc.steps.features')}</div>
                        <div className={`progress-line ${step >= 4 ? 'filled' : ''}`}></div>
                        <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>{t('calc.steps.estimate')}</div>
                    </div>

                    <div className="calculator-content">
                        {/* Step 1: Services */}
                        {step === 1 && (
                            <div className="step-grid">
                                {services.map(s => (
                                    <div
                                        key={s.id}
                                        className={`calc-card ${selectedService === s.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedService(s.id)}
                                    >
                                        <s.icon className="calc-icon" />
                                        <h3>{t(s.title)}</h3>
                                        <p>{t(s.description)}</p>
                                        <div className="price-tag">{t('calc.from')} ${s.basePrice}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step 2: Types */}
                        {step === 2 && (
                            <div className="step-grid">
                                {types.map(typeItem => (
                                    <div
                                        key={typeItem.id}
                                        className={`calc-card ${selectedType === typeItem.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedType(typeItem.id)}
                                    >
                                        <h3>{t(typeItem.title)}</h3>
                                        <p>{t(typeItem.description)}</p>
                                        <div className="price-tag">x{typeItem.multiplier} {t('calc.multiplier')}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step 3: Features */}
                        {step === 3 && (
                            <div className="features-grid">
                                {features.filter(f => f.type === 'all' || (selectedService && (f.type === selectedService || (selectedService === 'web' && f.type === 'web') || (selectedService === 'ai' && f.type === 'ai')))).map(f => (
                                    <div
                                        key={f.id}
                                        className={`feature-item ${selectedFeatures.includes(f.id) ? 'selected' : ''}`}
                                        onClick={() => toggleFeature(f.id)}
                                    >
                                        <div className="checkbox">
                                            {selectedFeatures.includes(f.id) && <BiCheck />}
                                        </div>
                                        <span>{t(f.title)}</span>
                                        <span className="feature-price">+${f.price}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step 4: Estimate */}
                        {step === 4 && (
                            <div className="estimate-result">
                                <h2>{t('calc.result.title')}</h2>
                                <div className="total-price">${totalPrice.toLocaleString()}</div>
                                <p className="disclaimer">{t('calc.result.disclaimer')}</p>

                                <div className="result-actions">
                                    <button className="btn btn-secondary" onClick={resetCalculator}>
                                        <BiRefresh /> {t('calc.result.start_over')}
                                    </button>
                                    <button className="btn btn-primary" onClick={() => window.location.href = '/contact'}>
                                        {t('calc.result.book')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="calculator-footer">
                        {step > 1 && (
                            <button className="btn btn-outline" onClick={handleBack}>
                                <BiChevronLeft /> {t('calc.nav.back')}
                            </button>
                        )}

                        <div className="spacer"></div>

                        {step < 4 && (
                            <button
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={(step === 1 && !selectedService) || (step === 2 && !selectedType)}
                            >
                                {t('calc.nav.next')} <BiChevronRight />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <FinalCTA />
        </div>
    );
};

export default Calculator;
