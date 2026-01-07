/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-return */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { timeTracking } from '../../lib/timeTracking';
import { Link } from 'react-router-dom';
import { FaCheck, FaPlay, FaArrowRight, FaStop, FaCalendarDay, FaClock, FaTrophy } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './TodayPage.css';

const TodayPage = () => {
    const { t, i18n } = useTranslation();
    const [tasks, setTasks] = useState({ overdue: [], morning: [], afternoon: [], evening: [], anytime: [] });
    const [loading, setLoading] = useState(true);
    const [activeTimer, setActiveTimer] = useState(null);
    const [todayTotal, setTodayTotal] = useState(0);
    const [taskDurations, setTaskDurations] = useState({});

    const refreshTasks = useCallback(async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('tasks')
            .select(`*, projects (title, id), steps (title)`)
            .or(`scheduled_date.eq.${todayStr},and(scheduled_date.lt.${todayStr},status.neq.done)`)
            .neq('status', 'done')
            .order('scheduled_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) console.error('Error fetching tasks:', error);
        else {
            const rawTasks = data || [];

            // Group tasks
            const grouped = {
                overdue: [],
                morning: [],
                afternoon: [],
                evening: [],
                anytime: []
            };

            rawTasks.forEach(task => {
                if (task.scheduled_date < todayStr) {
                    grouped.overdue.push(task);
                } else if (!task.start_time) {
                    grouped.anytime.push(task);
                } else {
                    const hour = parseInt(task.start_time.split(':')[0], 10);
                    if (hour < 12) grouped.morning.push(task);
                    else if (hour < 17) grouped.afternoon.push(task);
                    else grouped.evening.push(task);
                }
            });

            setTasks(grouped); // setTasks now stores the object

            // Fetch durations
            if (rawTasks.length > 0) {
                const durations = await timeTracking.getTaskDurations(rawTasks.map(t => t.id));
                setTaskDurations(durations);
            }
        }
    }, []);

    const refreshTimerDisplay = useCallback(async () => {
        const active = await timeTracking.getActiveTimer();
        setActiveTimer(active);
        const total = await timeTracking.getTodayTotal();
        setTodayTotal(total);
    }, []);

    const fetchData = useCallback(async () => {
        await Promise.all([refreshTasks(), refreshTimerDisplay()]);
        setLoading(false);
    }, [refreshTasks, refreshTimerDisplay]);

    useEffect(() => {
        // eslint-disable-next-line
        void fetchData();

        // Refresh active timer and totals every minute to keep UI somewhat updated
        const interval = setInterval(() => {
            void refreshTimerDisplay();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchData, refreshTimerDisplay]);

    const handleStartTask = async (task) => {
        try {
            await timeTracking.startTimer(task.id);
            // Update status if needed
            if (task.status !== 'in_progress') {
                await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', task.id);
            }
            await fetchData(); // Refresh everything
        } catch (error) {
            console.error(error);
            alert('Failed to start timer');
        }
    };

    const handleStopTimer = async () => {
        await timeTracking.stopTimer();
        await fetchData();
    };

    const handleMarkDone = async (task) => {
        // Stop timer if this task is active
        if (activeTimer && activeTimer.task_id === task.id) {
            await timeTracking.stopTimer();
        }

        const { error } = await supabase
            .from('tasks')
            .update({
                status: 'done',
                completed_at: new Date().toISOString()
            })
            .eq('id', task.id);

        if (!error) {
            await refreshTasks();
            await refreshTimerDisplay();
        }
    };

    const handleMoveToTomorrow = async (task) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const { error } = await supabase.from('tasks').update({ scheduled_date: tomorrowStr }).eq('id', task.id);
        if (!error) {
            await refreshTasks();
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0h 0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatDate = (date) => {
        return date.toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const renderTaskCard = (task, activeTimer, taskDurations, handleStartTask, handleStopTimer, handleMarkDone, handleMoveToTomorrow) => {
        const isRunning = activeTimer && activeTimer.task_id === task.id;
        return (
            <div key={task.id} className={`today-task-card priority-${task.priority} status-${task.status} ${isRunning ? 'is-running' : ''}`}>
                <div className="task-time-col">
                    {task.start_time ? (
                        <span className="time-display">{task.start_time.slice(0, 5)}</span>
                    ) : (
                        <span className="time-display placeholder">--:--</span>
                    )}
                    <div className="time-line"></div>
                </div>

                <div className="task-content-col">
                    <div className="task-header">
                        <h3 className="task-title">{task.title}</h3>
                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                        {taskDurations[task.id] > 0 && <span className="time-badge"><FaClock /> {formatTime(taskDurations[task.id] || 0)}</span>}
                    </div>
                    <div className="task-context">
                        {task.projects && (
                            <Link to={`/admin/projects/${task.projects.id}`} className="project-link">
                                {task.projects.title}
                            </Link>
                        )}
                        {task.steps && <span className="step-crumb"> / {task.steps.title}</span>}
                    </div>
                    {task.description && <p className="task-desc">{task.description}</p>}

                    {isRunning && (
                        <div className="active-indicator">
                            <FaPlay size={10} /> {t('admin.today.timer_running', 'Timer Running...')}
                        </div>
                    )}
                </div>

                <div className="task-actions-col">
                    {!isRunning ? (
                        <button
                            className="action-btn start-btn"
                            onClick={() => void handleStartTask(task)}
                            title={t('admin.today.actions.start', 'Start Task')}
                        >
                            <FaPlay /> {t('admin.today.actions.start', 'Start')}
                        </button>
                    ) : (
                        <button
                            className="action-btn stop-btn-sm"
                            onClick={() => void handleStopTimer()}
                            title={t('admin.today.actions.stop', 'Stop Timer')}
                        >
                            <FaStop /> {t('admin.today.actions.stop', 'Stop')}
                        </button>
                    )}
                    <button
                        className="action-btn done-btn"
                        onClick={() => void handleMarkDone(task)}
                        title={t('admin.today.actions.done', 'Mark as Done')}
                    >
                        <FaCheck /> {t('admin.today.actions.done', 'Done')}
                    </button>
                    <button
                        className="action-btn defer-btn"
                        onClick={() => void handleMoveToTomorrow(task)}
                        title={t('admin.today.actions.tomorrow', 'Move to Tomorrow')}
                    >
                        <FaArrowRight /> {t('admin.today.actions.tomorrow', 'Tomorrow')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>{t('admin.today.title', "Today's Agenda")}</h1>
                    <p>{formatDate(new Date())}</p>
                </div>
                <div className="today-stats">
                    <div className="stat-card">
                        <span className="label">{t('admin.today.stats.total_time', 'Total Time Today')}</span>
                        <span className="value">{formatTime(todayTotal)}</span>
                    </div>
                </div>
                <Link to="/admin/daily-review" className="crm-btn-secondary review-day-btn">
                    <FaTrophy /> {t('admin.daily_review.title', 'Review Day')}
                </Link>
            </div>

            {activeTimer && (
                <div className="active-timer-banner">
                    <div className="timer-info">
                        <span className="pulsing-dot"></span>
                        <span>{t('admin.today.running', 'Running:')} <strong>{activeTimer.tasks?.title}</strong></span>
                    </div>
                    <button className="stop-btn" onClick={() => void handleStopTimer()}><FaStop /> {t('admin.today.actions.stop', 'Stop')}</button>
                </div>
            )}

            <div className="today-tasks-list">
                {loading ? (
                    <div className="loading-state">{t('admin.common.loading', 'Loading your day...')}</div>
                ) : (
                    <>
                        {/* Overdue Section */}
                        {tasks.overdue?.length > 0 && (
                            <section className="time-group overdue">
                                <h4>{t('admin.today.sections.overdue', 'Overdue')}</h4>
                                {tasks.overdue.map(task => renderTaskCard(task, activeTimer, taskDurations, handleStartTask, handleStopTimer, handleMarkDone, handleMoveToTomorrow))}
                            </section>
                        )}

                        {/* Morning Section */}
                        {tasks.morning?.length > 0 && (
                            <section className="time-group">
                                <h4>{t('admin.today.sections.morning', 'Morning')}</h4>
                                {tasks.morning.map(task => renderTaskCard(task, activeTimer, taskDurations, handleStartTask, handleStopTimer, handleMarkDone, handleMoveToTomorrow))}
                            </section>
                        )}

                        {/* Afternoon Section */}
                        {tasks.afternoon?.length > 0 && (
                            <section className="time-group">
                                <h4>{t('admin.today.sections.afternoon', 'Afternoon')}</h4>
                                {tasks.afternoon.map(task => renderTaskCard(task, activeTimer, taskDurations, handleStartTask, handleStopTimer, handleMarkDone, handleMoveToTomorrow))}
                            </section>
                        )}

                        {/* Evening Section */}
                        {tasks.evening?.length > 0 && (
                            <section className="time-group">
                                <h4>{t('admin.today.sections.evening', 'Evening')}</h4>
                                {tasks.evening.map(task => renderTaskCard(task, activeTimer, taskDurations, handleStartTask, handleStopTimer, handleMarkDone, handleMoveToTomorrow))}
                            </section>
                        )}

                        {/* Anytime Section */}
                        {tasks.anytime?.length > 0 && (
                            <section className="time-group">
                                <h4>{t('admin.today.sections.anytime', 'Anytime')}</h4>
                                {tasks.anytime.map(task => renderTaskCard(task, activeTimer, taskDurations, handleStartTask, handleStopTimer, handleMarkDone, handleMoveToTomorrow))}
                            </section>
                        )}

                        {/* Empty State */}
                        {Object.values(tasks).flat().length === 0 && (
                            <div className="empty-state">
                                <FaCalendarDay size={40} />
                                <h3>{t('admin.today.empty.title', 'All caught up!')}</h3>
                                <p>{t('admin.today.empty.desc', 'No pending tasks scheduled for today.')}</p>
                                <Link to="/admin/tasks" className="crm-btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
                                    {t('admin.today.empty.view_all', 'View All Tasks')}
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TodayPage;
