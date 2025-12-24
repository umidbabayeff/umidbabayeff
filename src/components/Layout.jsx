import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { BiMenu, BiX } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import StarBackground from './common/StarBackground';
import ThemeToggle from './common/ThemeToggle';
import LanguageSwitcher from './common/LanguageSwitcher';
import VideoWidget from './common/VideoWidget';
import './Layout.css';

const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t } = useTranslation();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="layout">
            <StarBackground />
            <header className="navbar">
                <div className="container navbar-content">
                    <Link to="/" className="logo" onClick={closeMenu}>
                        <span className="logo-text">UMIDBABAYEFF</span>
                    </Link>

                    <nav className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                        <NavLink to="/" onClick={closeMenu} end>{t('nav.home')}</NavLink>
                        <NavLink to="/services" onClick={closeMenu}>{t('nav.services')}</NavLink>
                        <NavLink to="/technologies" onClick={closeMenu}>{t('nav.technologies')}</NavLink>
                        <NavLink to="/about" onClick={closeMenu}>{t('nav.about')}</NavLink>
                        <NavLink to="/calculator" onClick={closeMenu}>{t('nav.estimate')}</NavLink>
                        <Link to="/contact" className="btn btn-primary btn-sm" onClick={closeMenu}>{t('nav.lets_talk')}</Link>
                        <div className="mobile-lang-switch">
                            <LanguageSwitcher />
                        </div>
                    </nav>

                    <div className="navbar-actions">
                        <LanguageSwitcher />
                        <ThemeToggle />
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
                            <h3>UMIDBABAYEFF</h3>
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
                                <li><a href="#">LinkedIn</a></li>
                                <li><a href="#">Twitter</a></li>
                                <li><a href="#">Email</a></li>
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
