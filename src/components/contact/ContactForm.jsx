import React, { useState } from 'react';
import './ContactForm.css';
import SuccessModal from '../common/SuccessModal';

import { useTranslation } from 'react-i18next';

import { supabase } from '../../lib/supabaseClient';

const ContactForm = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        type: 'project',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [showModal, setShowModal] = useState(false);

    /**
     * @param {{ target: { name: string, value: string } }} e
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) return t('contact.errors.name_required') ?? 'Name is required';
        if (!formData.email.trim()) return t('contact.errors.email_required') ?? 'Email is required';

        // Simple email regex for validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) return t('contact.errors.email_invalid') ?? 'Please enter a valid email';

        if (!formData.message.trim()) return t('contact.errors.message_required') ?? 'Message is required';

        return null;
    };

    /**
     * @param {{ preventDefault: () => void }} e
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const validationError = validateForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setStatus('sending');

        try {
            // Prepare payload
            const payload = {
                name: formData.name,
                email: formData.email,
                company: formData.company,
                type: formData.type,
                message: formData.message,
                // created_at is default now()
                // status: 'new' // If your schema supports status, otherwise omit
                is_converted: false
            };

            const { error } = await supabase
                .from('messages')
                .insert([payload]);

            if (error) throw error;

            // Success: Only here do we show modal and reset
            setStatus('success');
            setShowModal(true);
            setFormData({
                name: '',
                email: '',
                company: '',
                type: 'project',
                message: ''
            });

            // Reset button state after a delay
            setTimeout(() => {
                setStatus('idle');
            }, 3000);

        } catch (error) {
            console.error('Error sending message:', error);
            setErrorMessage(t('contact.errors.generic_error') ?? 'Failed to send message. Please try again later.');
            setStatus('error');
        }
    };

    return (
        <section className="section contact-section">
            <SuccessModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={t('contact.success.title') || "Message Sent!"}
                message={t('contact.success.message') || "Thank you for reaching out. We'll get back to you shortly."}
            />

            <div className="container contact-container">
                <div className="contact-info">
                    <h1 dangerouslySetInnerHTML={{ __html: t('contact.title') }}></h1>
                    <p>{t('contact.subtitle')}</p>
                    <div className="contact-details">
                        <div className="contact-item">
                            <h3>{t('contact.details.email')}</h3>
                            <a href="mailto:hello@antigravity.studio">hello@antigravity.studio</a>
                        </div>
                        <div className="contact-item">
                            <h3>{t('contact.details.socials')}</h3>
                            <div className="social-links">
                                <a href="#">LinkedIn</a>
                                <a href="#">Twitter</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contact-form-wrapper">
                    <form onSubmit={(e) => void handleSubmit(e)} className="contact-form">
                        <div className="form-group">
                            <label htmlFor="name">{t('contact.form.name')}</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder={t('contact.form.placeholders.name')}
                                className={!formData.name && errorMessage ? 'error-input' : ''}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">{t('contact.form.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder={t('contact.form.placeholders.email')}
                                className={!formData.email && errorMessage ? 'error-input' : ''}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company">{t('contact.form.company')}</label>
                            <input
                                type="text"
                                id="company"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                placeholder={t('contact.form.placeholders.company')}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="type">{t('contact.form.type')}</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <option value="project">{t('contact.form.options.project')}</option>
                                <option value="consultation">{t('contact.form.options.consultation')}</option>
                                <option value="other">{t('contact.form.options.other')}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">{t('contact.form.details')}</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                placeholder={t('contact.form.placeholders.details')}
                                rows="5"
                                className={!formData.message && errorMessage ? 'error-input' : ''}
                            ></textarea>
                        </div>

                        {errorMessage && (
                            <div className="form-error-message">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`btn btn-primary btn-block ${status === 'success' ? 'btn-success' : ''}`}
                            disabled={status === 'sending' || status === 'success'}
                        >
                            {status === 'sending' ? t('contact.form.buttons.sending') : status === 'success' ? t('contact.form.buttons.sent') : t('contact.form.buttons.send')}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ContactForm;
