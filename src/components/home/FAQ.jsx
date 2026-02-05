import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BiPlus, BiMinus } from 'react-icons/bi';
import { supabase } from '../../lib/supabaseClient';
import './FAQ.css';

const FAQ = () => {
    const { t, i18n } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(null);
    const [faqItems, setFaqItems] = useState([]);

    useEffect(() => {
        const fetchFaqs = async () => {
            // Get current language code (e.g. 'en-US' -> 'en')
            const lang = i18n.language.split('-')[0];

            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .eq('language_code', lang)
                .order('id', { ascending: true });

            if (error) {
                console.error('Error loading FAQs:', error);
            } else if (data && data.length > 0) {
                setFaqItems(data);
            } else {
                // Fallback to json if DB is empty
                const local = t('faq.items', { returnObjects: true });
                if (Array.isArray(local)) setFaqItems(/** @type {any[]} */(local));
            }
        };

        void fetchFaqs();
    }, [i18n.language, t]);

    const toggleAccordion = (/** @type {number} */ index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="section faq-section">
            <div className="container">
                <div className="faq-header">
                    <h2>{t('faq.title')}</h2>
                    <p>{t('faq.subtitle')}</p>
                </div>
                <div className="faq-list">
                    {faqItems.map((item, index) => (
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                            onClick={() => toggleAccordion(index)}
                        >
                            <div className="faq-question">
                                <h3>{item.question}</h3>
                                <div className="faq-icon">
                                    {activeIndex === index ? <BiMinus /> : <BiPlus />}
                                </div>
                            </div>
                            <div className="faq-answer">
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
