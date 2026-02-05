import { supabase } from './supabaseClient';

/**
 * @typedef {Object} TimeLog
 * @property {number} id
 * @property {number} task_id
 * @property {string} start_at
 * @property {string | null} end_at
 * @property {number | null} duration
 */

export const timeTracking = {
    // Start a timer for a task
    /**
     * @param {number} taskId
     */
    startTimer: async (taskId) => {
        // 1. Stop any currently running timer
        const { data: activeLogs } = await supabase
            .from('time_logs')
            .select('*')
            .is('end_at', null);

        if (activeLogs && activeLogs.length > 0) {
            /** @type {TimeLog[]} */
            const logs = activeLogs;
            for (const log of logs) {
                const endAt = new Date().toISOString();
                const startTime = new Date(log.start_at).getTime();
                const endTime = new Date(endAt).getTime();
                const duration = Math.round((endTime - startTime) / 1000); // seconds

                await supabase
                    .from('time_logs')
                    .update({ end_at: endAt, duration: duration })
                    .eq('id', log.id);
            }
        }

        // 2. Create new log
        /** @type {{ data: TimeLog, error: any }} */
        const { data, error } = await supabase
            .from('time_logs')
            .insert([{ task_id: taskId, start_at: new Date().toISOString() }])
            .select()
            .single();

        if (error) throw error;

        return data;
    },

    // Stop currently running timer
    stopTimer: async () => {
        /** @type {{ data: TimeLog[] | null, error: any }} */
        const { data: activeLogs } = await supabase
            .from('time_logs')
            .select('*')
            .is('end_at', null);

        if (activeLogs && activeLogs.length > 0) {
            /** @type {TimeLog[]} */
            const logs = activeLogs;
            for (const log of logs) {
                const endAt = new Date().toISOString();
                const startTime = new Date(log.start_at).getTime();
                const endTime = new Date(endAt).getTime();
                const duration = Math.round((endTime - startTime) / 1000);

                await supabase
                    .from('time_logs')
                    .update({ end_at: endAt, duration: duration })
                    .eq('id', log.id);
            }
        }
    },

    // Get active timer if any
    getActiveTimer: async () => {
        /** @type {{ data: TimeLog | null, error: any }} */
        const { data, error } = await supabase
            .from('time_logs')
            .select('*, tasks(title, id, projects(title))')
            .is('end_at', null)
            .maybeSingle();

        if (error) return null;
        return data;
    },

    // Calculate total time tracked today (in seconds)
    getTodayTotal: async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const startOfDay = `${todayStr}T00:00:00.000Z`;
        const endOfDay = `${todayStr}T23:59:59.999Z`;

        /** @type {{ data: TimeLog[] | null, error: any }} */
        const { data: logs } = await supabase
            .from('time_logs')
            .select('duration, start_at, end_at')
            .gte('start_at', startOfDay)
            .lte('start_at', endOfDay);

        if (!logs) return 0;

        let totalSeconds = 0;
        const now = new Date();

        /** @type {TimeLog[]} */
        const typedLogs = logs;

        typedLogs.forEach(log => {
            if (log.duration) {
                totalSeconds += log.duration;
            } else if (!log.end_at) {
                // If currently running, add time elapsed so far
                const start = new Date(log.start_at);
                totalSeconds += Math.round((now.getTime() - start.getTime()) / 1000);
            }
        });

        return totalSeconds;
    },

    // Get durations for a list of tasks
    /**
     * @param {number[]} taskIds
     */
    getTaskDurations: async (taskIds) => {
        if (!taskIds || taskIds.length === 0) return {};

        /** @type {{ data: TimeLog[] | null, error: any }} */
        const { data: logs } = await supabase
            .from('time_logs')
            .select('task_id, duration')
            .in('task_id', taskIds)
            .not('duration', 'is', null);

        /** @type {Record<number, number>} */
        const durations = {};
        // Initialize
        taskIds.forEach(id => durations[id] = 0);

        if (logs) {
            /** @type {TimeLog[]} */
            const typedLogs = logs;
            typedLogs.forEach(log => {
                const taskId = log.task_id;
                if (log.duration !== null && durations[taskId] !== undefined) {
                    durations[taskId] += log.duration;
                }
            });
        }
        return durations;
    }
};
