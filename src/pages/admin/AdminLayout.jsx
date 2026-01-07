import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import { FaCode, FaLayerGroup, FaCog, FaSignOutAlt, FaTachometerAlt, FaLanguage, FaMicrochip, FaShareAlt, FaUserTie, FaBriefcase, FaTasks, FaCalendarDay, FaInbox, FaTrophy, FaBars, FaTimes, FaUserPlus } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import StarBackground from '../../components/common/StarBackground';
import { useTranslation } from 'react-i18next';
import './AdminLayout.css';

const AdminLayout = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                void navigate('/admin/login');
            } else {
                setLoading(false);
            }
        };

        void checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                void navigate('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        void navigate('/');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Simple language toggler
    const toggleLanguage = () => {
        const currentLang = i18n.language.split('-')[0];
        const nextLang = currentLang === 'en' ? 'ru' : (currentLang === 'ru' ? 'az' : 'en');
        void i18n.changeLanguage(nextLang);
    };

    if (loading) {
        return <div className="admin-loading">{t('admin.common.loading', 'Loading...')}</div>;
    }

    return (
        <div className="admin-container">
            <StarBackground />

            {/* Universal Header with Burger Menu */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-header-logo"></div>
                    <button className="admin-toggle-btn" onClick={toggleSidebar}>
                        {isSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <div className="admin-header-right">
                    <button onClick={toggleLanguage} className="admin-header-lang-btn">
                        <FaLanguage /> <span>{i18n.language.toUpperCase()}</span>
                    </button>
                    <button onClick={() => void handleLogout()} className="admin-header-logout-btn">
                        <FaSignOutAlt /> <span>{t('admin.common.logout', 'Logout')}</span>
                    </button>
                </div>
            </div>

            {/* Overlay */}
            <div
                className={`admin-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            ></div>

            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-logo">Admin Panel</div>
                    <button className="close-sidebar-btn" onClick={closeSidebar}>
                        <FaTimes />
                    </button>
                </div>
                <nav className="admin-nav">
                    <ul>
                        <li>
                            <NavLink to="/admin/dashboard" className="admin-nav-item admin-type" onClick={closeSidebar}>
                                <FaTachometerAlt /> <span>{t('admin.nav.dashboard', 'Dashboard')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/translations" className="admin-nav-item admin-type" onClick={closeSidebar}>
                                <FaLanguage /> <span>{t('admin.nav.translations', 'Translations')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/services" className="admin-nav-item admin-type" onClick={closeSidebar}>
                                <FaCode /> <span>{t('admin.nav.services', 'Services')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/benefits" className="admin-nav-item admin-type" onClick={closeSidebar}>
                                <FaLayerGroup /> <span>{t('admin.nav.benefits', 'Benefits')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/technologies" className="admin-nav-item admin-type" onClick={closeSidebar}>
                                <FaMicrochip /> <span>{t('admin.nav.technologies', 'Technologies')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/socials" className="admin-nav-item admin-type" onClick={closeSidebar}>
                                <FaShareAlt /> <span>{t('admin.nav.socials', 'Socials')}</span>
                            </NavLink>
                        </li>

                        <div className="admin-nav-divider"></div>
                        <div className="admin-nav-label">CRM</div>

                        <li>
                            <NavLink to="/admin/today" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaCalendarDay /> <span>{t('admin.nav.today', 'Today')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/daily-review" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaTrophy /> <span>{t('admin.nav.daily_review', 'Daily Review')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/weekly-review" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaCalendarDay /> <span>{t('admin.nav.weekly_review', 'Weekly Review')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/messages" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaInbox /> <span>{t('admin.nav.inbox', 'Inbox')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/applications" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaUserPlus /> <span>{t('admin.nav.hiring', 'Hiring')}</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/clients" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaUserTie /> <span>{t('admin.nav.clients', 'Clients')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/projects" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaBriefcase /> <span>{t('admin.nav.projects', 'Projects')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/templates" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaLayerGroup /> <span>{t('admin.nav.templates', 'Templates')}</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/tasks" className="admin-nav-item crm-type" onClick={closeSidebar}>
                                <FaTasks /> <span>{t('admin.nav.tasks', 'Tasks')}</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
