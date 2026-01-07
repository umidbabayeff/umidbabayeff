import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { BiMenu, BiX } from 'react-icons/bi';
import { FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaEnvelope } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import StarBackground from './common/StarBackground';
import ThemeToggle from './common/ThemeToggle';
import LanguageSwitcher from './common/LanguageSwitcher';
import VideoWidget from './common/VideoWidget';
import logo from '../assets/logo.png';
import logoLight from '../assets/logo-light.png';
import './Layout.css';

const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    /** 
     * @typedef {Object} Social
     * @property {number} id
     * @property {string} url
     * @property {string} icon
     * @property {string} platform
     */
    /** @type {[Social[], React.Dispatch<React.SetStateAction<Social[]>>]} */
    const [socials, setSocials] = useState([]);
    const { t } = useTranslation();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        const fetchSocials = async () => {
            const { data } = await supabase.from('social_links').select('*').order('id', { ascending: true });
            if (data) setSocials(data);
        };
        fetchSocials().catch(console.error);
    }, []);

    const iconMap = {
        'FaInstagram': <FaInstagram />,
        'FaLinkedin': <FaLinkedin />,
        'FaYoutube': <FaYoutube />,
        'FaTiktok': <FaTiktok />,
        'FaEnvelope': <FaEnvelope />
    };

    return (
        <div className="layout">
            <StarBackground />
            <header className="navbar">
                <div className="container navbar-content">
                    <Link to="/" className="logo" onClick={closeMenu}>
                        <img src={logo} alt="UMIDBABAYEFF" className="logo-img logo-dark-mode" />
                        <img src={logoLight} alt="UMIDBABAYEFF" className="logo-img logo-light-mode" />
                    </Link>

                    <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        <NavLink to="/" onClick={closeMenu} end>{t('nav.home')}</NavLink>
                        <NavLink to="/services" onClick={closeMenu}>{t('nav.services')}</NavLink>
                        <NavLink to="/technologies" onClick={closeMenu}>{t('nav.technologies')}</NavLink>
                        <NavLink to="/about" onClick={closeMenu}>{t('nav.about')}</NavLink>
                        <NavLink to="/calculator" onClick={closeMenu}>{t('nav.estimate')}</NavLink>
                        <NavLink to="/careers" onClick={closeMenu}>{t('nav.careers') || 'Careers'}</NavLink>
                        <Link to="/contact" className="btn btn-primary btn-sm" onClick={closeMenu}>{t('nav.lets_talk')}</Link>
                        <div className="mobile-menu-controls">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                    </nav>

                    <div className="navbar-actions">
                        <div className="desktop-controls">
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                        <div className="mobile-header-lang">
                            <LanguageSwitcher />
                        </div>
                        <button className="mobile-menu-btn" onClick={toggleMenu}>
                            {isMenuOpen ? <BiX /> : <BiMenu />}
                        </button>
                    </div>
                </div>
            </header>

            <main>
                <Outlet />
            </main>

            <footer className="footer">
                <div className="container footer-content-wrapper">
                    <div className="footer-content">
                        <div className="footer-col">
                            <img src={logo} alt="UMIDBABAYEFF" className="logo-img footer-logo logo-dark-mode" />
                            <img src={logoLight} alt="UMIDBABAYEFF" className="logo-img footer-logo logo-light-mode" />
                            <p>{t('footer.tagline')}</p>
                        </div>
                        <div className="footer-col">
                            <h4>{t('footer.menu')}</h4>
                            <ul>
                                <li><Link to="/">{t('nav.home')}</Link></li>
                                <li><Link to="/services">{t('nav.services')}</Link></li>
                                <li><Link to="/technologies">{t('nav.technologies')}</Link></li>
                                <li><Link to="/about">{t('nav.about')}</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>{t('footer.connect')}</h4>
                            <ul>
                                {socials.map(social => (
                                    <li key={social.id}>
                                        <a href={social.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {iconMap[social.icon] ?? <FaEnvelope />} {social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}
                                        </a>
                                    </li>
                                ))}
                                {socials.length === 0 && <li>Loading...</li>}
                            </ul>
                        </div>
                    </div>
                    <div className="container footer-bottom">
                        <p>&copy; 2025 umidbabayeff. {t('footer.rights')}</p>
                    </div>
                </div>
            </footer>

            <VideoWidget />
        </div>
    );
};

export default Layout;
