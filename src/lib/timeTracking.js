import { supabase } from './supabaseClient';

export const timeTracking = {
    // Start a timer for a task
    startTimer: async (taskId) => {
        // 1. Stop any currently running timer
        const { data: activeLogs } = await supabase
            .from('time_logs')
            .select('*')
            .is('end_at', null);

        if (activeLogs && activeLogs.length > 0) {
            for (const log of activeLogs) {
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
        const { data: activeLogs } = await supabase
            .from('time_logs')
            .select('*')
            .is('end_at', null);

        if (activeLogs && activeLogs.length > 0) {
            for (const log of activeLogs) {
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

        const { data: logs } = await supabase
            .from('time_logs')
            .select('duration, start_at, end_at')
            .gte('start_at', startOfDay)
            .lte('start_at', endOfDay);

        if (!logs) return 0;

        let totalSeconds = 0;
        const now = new Date();

        logs.forEach(log => {
            if (log.duration) {
                totalSeconds += log.duration;
            } else if (!log.end_at) {
                // If currently running, add time elapsed so far
                const start = new Date(log.start_at);
                totalSeconds += Math.round((now - start) / 1000);
            }
        });

        return totalSeconds;
    },

    // Get durations for a list of tasks
    getTaskDurations: async (taskIds) => {
        if (!taskIds || taskIds.length === 0) return {};

        const { data: logs } = await supabase
            .from('time_logs')
            .select('task_id, duration')
            .in('task_id', taskIds)
            .not('duration', 'is', null);

        const durations = {};
        // Initialize
        taskIds.forEach(id => durations[id] = 0);

        if (logs) {
            logs.forEach(log => {
                if (durations[log.task_id] !== undefined) {
                    durations[log.task_id] += log.duration;
                }
            });
        }
        return durations;
    }
};
