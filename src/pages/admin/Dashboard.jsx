import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { timeTracking } from '../../lib/timeTracking';
import { Link } from 'react-router-dom';
import { FaTasks, FaBriefcase, FaInbox, FaClock, FaArrowRight, FaPlay } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayTasks: [],
        activeProjects: [],
        inbox: [],
        timeToday: 0
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];

        try {
            const [tasksRes, projectsRes, messagesRes, timeTotal] = await Promise.all([
                // 1. Today Tasks
                supabase
                    .from('tasks')
                    .select('*, projects(title)')
                    .eq('scheduled_date', todayStr)
                    .neq('status', 'done')
                    .order('priority', { ascending: false }) // Urgent first
                    .limit(5),

                // 2. Active Projects
                supabase
                    .from('projects')
                    .select('*, clients(name)')
                    .eq('status', 'active')
                    .order('deadline', { ascending: true })
                    .limit(5),

                // 3. Inbox
                supabase
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5),

                // 4. Time Today
                timeTracking.getTodayTotal()
            ]);

            setStats({
                todayTasks: tasksRes.data || [],
                activeProjects: projectsRes.data || [],
                inbox: messagesRes.data || [],
                timeToday: timeTotal || 0
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    if (loading) return <div className="admin-loading">Loading Dashboard...</div>;

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Overview of your day</p>
                </div>
                <div className="time-stat-badge">
                    <FaClock /> <span>{formatTime(stats.timeToday)} tracked today</span>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Block 1: Today's Tasks */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><FaTasks /> Today's Focus</h2>
                        <Link to="/admin/today" className="view-all-link">View All <FaArrowRight /></Link>
                    </div>
                    <div className="dash-list">
                        {stats.todayTasks.length === 0 ? (
                            <p className="empty-text">No tasks remaining for today!</p>
                        ) : (
                            stats.todayTasks.map(task => (
                                <div key={task.id} className={`dash-list-item priority-${task.priority}`}>
                                    <div className="item-content">
                                        <span className="item-title">{task.title}</span>
                                        <span className="item-sub">
                                            {task.projects?.title} • <span className="proj-status">{task.status}</span>
                                        </span>
                                    </div>
                                    <Link to="/admin/today" className="action-icon"><FaPlay /></Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Block 2: Active Projects */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><FaBriefcase /> Active Projects</h2>
                        <Link to="/admin/projects" className="view-all-link">View All <FaArrowRight /></Link>
                    </div>
                    <div className="dash-list">
                        {stats.activeProjects.length === 0 ? (
                            <p className="empty-text">No active projects.</p>
                        ) : (
                            stats.activeProjects.map(proj => (
                                <Link key={proj.id} to={`/admin/projects/${proj.id}`} className="dash-list-item">
                                    <div className="item-content">
                                        <span className="item-title">{proj.title}</span>
                                        <span className="item-sub">
                                            {proj.clients?.name} • Due: {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'No date'}
                                        </span>
                                    </div>
                                    <span className="sc-arrow"><FaArrowRight /></span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Block 3: Inbox */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><FaInbox /> Recent Inbox</h2>
                        <Link to="/admin/messages" className="view-all-link">View All <FaArrowRight /></Link>
                    </div>
                    <div className="dash-list">
                        {stats.inbox.length === 0 ? (
                            <p className="empty-text">Inbox is empty.</p>
                        ) : (
                            stats.inbox.map(msg => (
                                <div key={msg.id} className="dash-list-item">
                                    <div className="item-content">
                                        <span className="item-title">{msg.name}</span>
                                        <span className="item-sub truncate">"{msg.message}"</span>
                                    </div>
                                    <span className="msg-time">{new Date(msg.created_at).toLocaleDateString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Block 4: Quick Actions / Time Summary (Using space for Actions) */}
                <div className="dash-card actions-card">
                    <div className="dash-card-header">
                        <h2><FaClock /> Quick Actions</h2>
                    </div>
                    <div className="quick-actions-grid">
                        <Link to="/admin/today" className="quick-action-btn">
                            <FaPlay /> Start Working
                        </Link>
                        <Link to="/admin/tasks" className="quick-action-btn secondary">
                            <FaTasks /> Manage Tasks
                        </Link>
                        <Link to="/admin/messages" className="quick-action-btn secondary">
                            <FaInbox /> Check Messages
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
