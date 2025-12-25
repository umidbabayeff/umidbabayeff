import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, NavLink } from 'react-router-dom';
import { FaCode, FaLayerGroup, FaCog, FaSignOutAlt, FaTachometerAlt, FaLanguage, FaMicrochip, FaShareAlt, FaUserTie, FaBriefcase, FaTasks, FaCalendarDay, FaInbox, FaTrophy } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import StarBackground from '../../components/common/StarBackground';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/admin/login');
            }
            setLoading(false);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading) {
        return <div className="admin-loading">Loading...</div>;
    }

    return (
        <div className="admin-container">
            <StarBackground />
            <aside className="admin-sidebar">
                <div className="admin-logo">Admin Panel</div>
                <nav className="admin-nav">
                    <ul>
                        <li>
                            <NavLink to="/admin/dashboard" className="admin-nav-item">
                                <FaTachometerAlt /> Dashboard
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/translations" className="admin-nav-item">
                                <FaLanguage /> Translations
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/services" className="admin-nav-item">
                                <FaCode /> Services
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/benefits" className="admin-nav-item">
                                <FaLayerGroup /> Benefits
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/technologies" className="admin-nav-item">
                                <FaMicrochip /> Technologies
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/socials" className="admin-nav-item">
                                <FaShareAlt /> Socials
                            </NavLink>
                        </li>

                        <div className="admin-nav-divider"></div>
                        <div className="admin-nav-label">CRM</div>

                        <li>
                            <NavLink to="/admin/today" className="admin-nav-item">
                                <FaCalendarDay /> Today
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/daily-review" className="admin-nav-item">
                                <FaTrophy /> Daily Review
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/weekly-review" className="admin-nav-item">
                                <FaCalendarDay /> Weekly Review
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/messages" className="admin-nav-item">
                                <FaInbox /> Inbox
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/admin/clients" className="admin-nav-item">
                                <FaUserTie /> Clients
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/projects" className="admin-nav-item">
                                <FaBriefcase /> Projects
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/templates" className="admin-nav-item">
                                <FaLayerGroup /> Templates
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/tasks" className="admin-nav-item">
                                <FaTasks /> Tasks
                            </NavLink>
                        </li>
                    </ul>
                </nav>
                <button onClick={handleLogout} className="admin-logout-btn">
                    <FaSignOutAlt /> Logout
                </button>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
