/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaCalendarWeek, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf, FaForward } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './WeeklyReview.css';

// Helper to calculate date ranges (pure function)
const getWeekRanges = () => {
    const now = new Date();
    const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
    if (day !== 1) now.setHours(-24 * (day - 1)); // Set to Monday
    now.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const nextWeekStart = new Date(endOfWeek);
    nextWeekStart.setDate(endOfWeek.getDate() + 1);
    nextWeekStart.setHours(0, 0, 0, 0);

    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek, nextWeekStart, nextWeekEnd };
};

const WeeklyReview = () => {
    const { t, i18n } = useTranslation();
    const [stats, setStats] = useState({
        completedCount: 0,
        hoursSpent: 0,
        projectBreakdown: {}
    });
    const [lists, setLists] = useState({
        completed: [],
        overdue: [],
        nextWeek: []
    });
    const [loading, setLoading] = useState(true);

    const queryWeeklyData = useCallback(async () => {
        const { startOfWeek, nextWeekStart, nextWeekEnd } = getWeekRanges();
        const todayStr = new Date().toLocaleDateString('en-CA');

        // 1. Fetch Completed This Week
        const { data: completed } = await supabase
            .from('tasks')
            .select('*, projects(title)')
            .eq('status', 'done')
            .gte('completed_at', startOfWeek.toISOString());

        // 2. Fetch Overdue (Not done, scheduled before today)
        const { data: overdue } = await supabase
            .from('tasks')
            .select('*, projects(title)')
            .neq('status', 'done')
            .lt('scheduled_date', todayStr);

        // 3. Fetch Next Week Planned
        const { data: nextWeek } = await supabase
            .from('tasks')
            .select('*, projects(title)')
            .gte('scheduled_date', nextWeekStart.toISOString().split('T')[0])
            .lte('scheduled_date', nextWeekEnd.toISOString().split('T')[0]);

        return { completed, overdue, nextWeek };
    }, []);

    const processAndSetData = useCallback((results) => {
        const { completed, overdue, nextWeek } = results;

        // Process Stats
        const completedCount = completed?.length ?? 0;
        const totalMinutes = completedCount * 30; // 30 mins per task
        const hoursSpent = (totalMinutes / 60).toFixed(1);

        const projectBreakdown = {};
        completed?.forEach(t => {
            const pTitle = t.projects?.title ?? t('admin.common.no_project', 'No Project');
            projectBreakdown[pTitle] ??= 0;
            projectBreakdown[pTitle] += 30; // Add 30 mins
        });

        setStats({ completedCount, hoursSpent, projectBreakdown });
        setLists({
            completed: completed ?? [],
            overdue: overdue ?? [],
            nextWeek: nextWeek ?? []
        });
        setLoading(false);
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const data = await queryWeeklyData();
                if (mounted) processAndSetData(data);
            } catch (error) {
                console.error('Error fetching weekly data:', error);
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => { mounted = false; };
    }, [queryWeeklyData, processAndSetData]);

    const handleMoveOverdueToNextWeek = async () => {
        if (!window.confirm(t('admin.weekly_review.alerts.confirm_move', 'Move overdue tasks to next Monday?'))) return;

        const { nextWeekStart } = getWeekRanges();
        const nextMonday = nextWeekStart.toISOString().split('T')[0];
        const overdueIds = lists.overdue.map(t => t.id);

        const { error } = await supabase
            .from('tasks')
            .update({ scheduled_date: nextMonday })
            .in('id', overdueIds);

        if (!error) {
            alert(t('admin.weekly_review.alerts.success', 'Tasks rescheduled!'));
            setLoading(true);
            const data = await queryWeeklyData();
            processAndSetData(data);
        } else {
            alert(t('admin.weekly_review.alerts.error', 'Error updating tasks'));
        }
    };

    if (loading) return <div className="admin-loading">{t('admin.weekly_review.loading', 'Loading Weekly Review...')}</div>;

    const { startOfWeek, endOfWeek } = getWeekRanges();

    return (
        <div className="crm-container weekly-review-container">
            <div className="crm-header">
                <div>
                    <h1>{t('admin.weekly_review.title', 'Weekly Review')}</h1>
                    <p>{startOfWeek.toLocaleDateString(i18n.language)} - {endOfWeek.toLocaleDateString(i18n.language)}</p>
                </div>
                <div className="weekly-actions">
                    {lists.overdue.length > 0 && (
                        <button className="crm-btn-warning" onClick={() => void handleMoveOverdueToNextWeek()}>
                            <FaForward /> {t('admin.weekly_review.actions.move_overdue', 'Move Overdue to Next Week')}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid three-col">
                <div className="stat-card">
                    <div className="stat-icon purple"><FaCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.completedCount}</h3>
                        <p>{t('admin.weekly_review.stats.tasks_completed', 'Tasks Completed')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><FaHourglassHalf /></div>
                    <div className="stat-info">
                        <h3>{stats.hoursSpent}h</h3>
                        <p>{t('admin.weekly_review.stats.estimated_time', 'Estimated Time')}</p>
                    </div>
                </div>
                <div className="stat-card project-breakdown">
                    <h4>{t('admin.weekly_review.stats.time_by_project', 'Time by Project')}</h4>
                    <ul>
                        {Object.entries(stats.projectBreakdown).map(([proj, mins]) => (
                            <li key={proj}>
                                <span>{proj}</span>
                                <span>{(mins / 60).toFixed(1)}h</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="review-grid">
                {/* Column 1: Accomplished */}
                <div className="review-col">
                    <h3><FaCheckCircle className="icon-success" /> {t('admin.weekly_review.cols.accomplished', 'Accomplished This Week')}</h3>
                    <div className="task-list condensed">
                        {lists.completed.length === 0 ? <p className="empty-msg">{t('admin.weekly_review.empty.completed', 'No tasks completed yet.')}</p> : (
                            lists.completed.map(task => (
                                <div key={task.id} className="review-task-item done">
                                    <span className="task-title">{task.title}</span>
                                    <span className="task-project">{task.projects?.title}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Overdue / Issues */}
                <div className="review-col">
                    <h3><FaExclamationTriangle className="icon-danger" /> {t('admin.weekly_review.cols.overdue', 'Overdue / Unfinished')}</h3>
                    <div className="task-list condensed">
                        {lists.overdue.length === 0 ? <p className="empty-msg">{t('admin.weekly_review.empty.overdue', 'All caught up!')}</p> : (
                            lists.overdue.map(task => (
                                <div key={task.id} className="review-task-item overdue">
                                    <span className="task-title">{task.title}</span>
                                    <span className="task-date">{new Date(task.scheduled_date).toLocaleDateString(i18n.language)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 3: Next Week Plan */}
                <div className="review-col">
                    <h3><FaCalendarWeek className="icon-primary" /> {t('admin.weekly_review.cols.next_week', "Next Week's Plan")}</h3>
                    <div className="task-list condensed">
                        {lists.nextWeek.length === 0 ? <p className="empty-msg">{t('admin.weekly_review.empty.next_week', 'Nothing scheduled yet.')}</p> : (
                            lists.nextWeek.map(task => (
                                <div key={task.id} className="review-task-item future">
                                    <span className="task-title">{task.title}</span>
                                    <span className="task-date">{new Date(task.scheduled_date).toLocaleDateString(i18n.language)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyReview;
