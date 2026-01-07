/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { timeTracking } from '../../lib/timeTracking';
import { FaCheckCircle, FaClock, FaCalendarTimes, FaArrowRight, FaTrophy } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './DailyReview.css';

const DailyReview = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [totalTime, setTotalTime] = useState(0);

    // useEffect moved below definition


    useEffect(() => {
        const fetchDailyData = async () => {
            setLoading(true);
            // Use local date for scheduled_date comparison
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

            // 1. Fetch Completed Tasks (completed_at is today)
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const { data: completed } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', 'done')
                .gte('completed_at', startOfDay.toISOString())
                .lte('completed_at', endOfDay.toISOString())
                .order('completed_at', { ascending: false });

            // 2. Fetch Pending Tasks (scheduled <= today AND status != done)
            const { data: pending } = await supabase
                .from('tasks')
                .select('*')
                .lte('scheduled_date', todayStr)
                .neq('status', 'done')
                .order('priority', { ascending: false });

            // 3. Fetch Time Logs
            const totalSeconds = await timeTracking.getTodayTotal();

            setCompletedTasks(completed || []);
            setPendingTasks(pending || []);
            setTotalTime(totalSeconds);
            setLoading(false);
        };

        void fetchDailyData();
    }, []);

    const handleMoveAllToTomorrow = async () => {
        if (!window.confirm('Move all pending tasks to tomorrow?')) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const updates = pendingTasks.map(t => ({
            id: t.id,
            scheduled_date: tomorrowStr
        }));

        const { error } = await supabase
            .from('tasks')
            .upsert(updates);

        if (!error) {
            setPendingTasks([]);
            alert('Tasks moved to tomorrow!');
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>{t('admin.daily_review.title', 'Daily Review')}</h1>
                    <p>{t('admin.daily_review.subtitle', 'Reflect on your day and prepare for tomorrow')}</p>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">{t('admin.daily_review.loading', 'Generating report...')}</div>
            ) : (
                <div className="daily-review-grid">
                    {/* Stats Row */}
                    <div className="review-stats-row">
                        <div className="stat-card success">
                            <div className="stat-icon"><FaTrophy /></div>
                            <div className="stat-info">
                                <span className="value">{completedTasks.length}</span>
                                <span className="label">{t('admin.daily_review.stats.completed', 'Tasks Completed')}</span>
                            </div>
                        </div>
                        <div className="stat-card focus">
                            <div className="stat-icon"><FaClock /></div>
                            <div className="stat-info">
                                <span className="value">{formatTime(totalTime)}</span>
                                <span className="label">{t('admin.daily_review.stats.focus_time', 'Focus Time')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="split-view">
                        {/* Accomplished Column */}
                        <div className="review-column attempted">
                            <div className="col-header">
                                <h2><FaCheckCircle className="icon-success" /> {t('admin.daily_review.cols.accomplished', 'Accomplished')}</h2>
                                <span className="count-badge">{completedTasks.length}</span>
                            </div>
                            <div className="review-list">
                                {completedTasks.length === 0 ? (
                                    <p className="empty-msg">{t('admin.daily_review.empty_done', 'No tasks completed yet. Keep pushing!')}</p>
                                ) : (
                                    completedTasks.map(task => (
                                        <div key={task.id} className="review-item done">
                                            <span className="check-icon"><FaCheckCircle /></span>
                                            <span className="task-name">{task.title}</span>
                                            {task.completed_at && <span className="time-stamp">{new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Rollover Column */}
                        <div className="review-column pending">
                            <div className="col-header">
                                <h2><FaCalendarTimes className="icon-warn" /> {t('admin.daily_review.cols.unfinished', 'Unfinished')}</h2>
                                <span className="count-badge">{pendingTasks.length}</span>
                            </div>
                            <div className="review-list">
                                {pendingTasks.length === 0 ? (
                                    <div className="all-clear">
                                        <FaCheckCircle size={40} />
                                        <p>{t('admin.daily_review.empty_pending', 'All clear! Zero tasks left behind.')}</p>
                                    </div>
                                ) : (
                                    <>
                                        {pendingTasks.map(task => (
                                            <div key={task.id} className="review-item pending">
                                                <span className="dot-icon"></span>
                                                <span className="task-name">{task.title}</span>
                                                <span className={`priority-tag ${task.priority}`}>{task.priority}</span>
                                            </div>
                                        ))}
                                        <button className="move-all-btn" onClick={() => void handleMoveAllToTomorrow()}>
                                            <FaArrowRight /> {t('admin.daily_review.move_all', 'Move All to Tomorrow')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyReview;
