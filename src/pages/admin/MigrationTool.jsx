/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const MigrationTool = () => {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, msg]);

    const flattenObject = (obj, prefix = '') => {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                // For arrays, we could store as JSON string or handle differently.
                // Current system expects strings. If array, JSON.stringify.
                const val = typeof obj[k] === 'string' ? obj[k] : JSON.stringify(obj[k]);
                acc[pre + k] = val;
            }
            return acc;
        }, {});
    };

    const runMigration = async () => {
        setStatus('running');
        setLogs([]);
        addLog('Starting migration...');

        const languages = ['en', 'ru', 'az'];

        try {
            for (const lang of languages) {
                addLog(`Fetching ${lang}.json...`);
                const response = await fetch(`/locales/${lang}/translation.json`);
                if (!response.ok) throw new Error(`Failed to fetch ${lang}`);

                const json = await response.json();
                const flattened = flattenObject(json);
                const count = Object.keys(flattened).length;
                addLog(`Parsed ${count} keys for ${lang}. Uploading...`);

                const rows = Object.entries(flattened).map(([key, value]) => ({
                    key,
                    language_code: lang,
                    value
                }));

                // Batch insert (Supabase limits batch size, let's do 100 at a time)
                const BATCH_SIZE = 100;
                for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                    const batch = rows.slice(i, i + BATCH_SIZE);
                    const { error } = await supabase
                        .from('translations')
                        .upsert(batch, { onConflict: 'key, language_code' });

                    if (error) {
                        console.error(error);
                        addLog(`Error uploading batch ${i}: ${error.message}`);
                    }
                }
                addLog(`Finished ${lang}`);
            }
            addLog('Migration Complete!');
            setStatus('success');
        } catch (err) {
            console.error(err);
            addLog(`Migration Failed: ${err.message}`);
            setStatus('error');
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h1>Content Migration</h1>
            <p>This tool will read your local JSON files (en, ru, az) and upload them to Supabase.</p>
            <p><strong>Warning:</strong> This will overwrite existing keys in the database.</p>

            <button
                onClick={() => void runMigration()}
                disabled={status === 'running'}
                className="btn-primary"
                style={{ marginTop: '20px' }}
            >
                {status === 'running' ? 'Migrating...' : 'Start Migration'}
            </button>

            <div style={{ marginTop: '20px', background: '#333', padding: '10px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>
                {logs.map((log, i) => (
                    <div key={i} style={{ fontFamily: 'monospace' }}>{log}</div>
                ))}
            </div>
        </div>
    );
};

export default MigrationTool;
