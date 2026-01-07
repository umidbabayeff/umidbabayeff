/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-return */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaEnvelope, FaLink } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './SocialsManager.css';

const SocialsManager = () => {
    const { t } = useTranslation();
    const [socials, setSocials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Map keys to React Icons for display
    const iconMap = {
        'FaInstagram': <FaInstagram />,
        'FaLinkedin': <FaLinkedin />,
        'FaYoutube': <FaYoutube />,
        'FaTiktok': <FaTiktok />,
        'FaEnvelope': <FaEnvelope />,
    };

    useEffect(() => {
        const fetchSocials = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('social_links')
                .select('*')
                .order('id', { ascending: true });

            if (error) console.error('Error fetching socials:', error);
            else setSocials(data || []);
            setLoading(false);
        };
        void fetchSocials();
    }, []);

    const updateUrl = async (id, newUrl) => {
        const { error } = await supabase
            .from('social_links')
            .update({ url: newUrl })
            .eq('id', id);

        if (error) {
            alert('Error updating link');
            console.error(error);
        } else {
            // Optimistic update
            setSocials(socials.map(s => s.id === id ? { ...s, url: newUrl } : s));
        }
    };

    return (
        <div className="socials-manager">
            <h1>{t('admin.socials.title', 'Social Media Links')}</h1>
            <p className="subtitle">{t('admin.socials.subtitle', 'Manage the links displayed in the footer.')}</p>

            {loading ? (
                <p>{t('admin.common.loading', 'Loading...')}</p>
            ) : (
                <div className="socials-grid">
                    {socials.map((social) => (
                        <div key={social.id} className="social-card">
                            <div className="social-icon-wrapper">
                                {iconMap[social.icon] ?? <FaLink />}
                            </div>
                            <div className="social-info">
                                <h3>{social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}</h3>
                                <input
                                    type="text"
                                    value={social.url}
                                    onChange={(e) => {
                                        const newUrl = e.target.value;
                                        setSocials(socials.map(s => s.id === social.id ? { ...s, url: newUrl } : s));
                                    }}
                                    onBlur={(e) => void updateUrl(social.id, e.target.value)}
                                    placeholder="https://..."
                                    className="social-input"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SocialsManager;
