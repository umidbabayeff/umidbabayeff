import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
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
        navigate('/admin/login');
    };

    if (loading) {
        return <div className="admin-loading">Loading...</div>;
    }

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-logo">Admin Panel</div>
                <nav className="admin-nav">
                    <ul>
                        <li><Link to="/admin/dashboard" className="admin-link">Dashboard</Link></li>
                        <li><Link to="/admin/translations" className="admin-link">Translations</Link></li>
                        <li><Link to="/admin/services" className="admin-link">Services</Link></li>
                        <li><Link to="/admin/technologies" className="admin-link">Technologies</Link></li>
                    </ul>
                </nav>
                <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
