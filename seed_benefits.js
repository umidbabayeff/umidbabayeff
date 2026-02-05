/* eslint-disable */
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import process from 'process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars manually
const envPath = join(__dirname, '.env');
/** @type {Record<string, string>} */
let envConfig = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env file', e);
}

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultBenefits = [
    // EN
    { language_code: 'en', title: 'Architecture', description: 'Scalable foundation for growth from day one.', icon: 'building' },
    { language_code: 'en', title: 'Automation', description: 'Optimized processes to save time and reduce errors.', icon: 'cogs' },
    { language_code: 'en', title: 'Scalability', description: 'Systems designed for millions of users.', icon: 'chart-line' },
    { language_code: 'en', title: 'AI Integration', description: 'Smart solutions using the latest AI technologies.', icon: 'brain' },
    // RU
    { language_code: 'ru', title: 'Архитектура', description: 'Масштабируемый фундамент для роста с первого дня.', icon: 'building' },
    { language_code: 'ru', title: 'Автоматизация', description: 'Оптимизированные процессы для экономии времени и сокращения ошибок.', icon: 'cogs' },
    { language_code: 'ru', title: 'Масштабируемость', description: 'Системы, рассчитанные на миллионы пользователей.', icon: 'chart-line' },
    { language_code: 'ru', title: 'Интеграция ИИ', description: 'Умные решения с использованием новейших технологий искусственного интеллекта.', icon: 'brain' },
    // AZ
    { language_code: 'az', title: 'Memarlıq', description: 'İlk gündən böyümək üçün miqyaslana bilən təməl.', icon: 'building' },
    { language_code: 'az', title: 'Avtomatlaşdırma', description: 'Vaxta qənaət və səhvləri azaltmaq üçün optimallaşdırılmış proseslər.', icon: 'cogs' },
    { language_code: 'az', title: 'Miqyaslılıq', description: 'Milyonlarla istifadəçi üçün nəzərdə tutulmuş sistemlər.', icon: 'chart-line' },
    { language_code: 'az', title: 'Sİ İnteqrasiyası', description: 'Ən son süni intellekt texnologiyalarından istifadə edən ağıllı həllər.', icon: 'brain' },
];

async function seed() {
    console.log('Clearing existing benefits...');
    const { error: deleteError } = await supabase.from('benefits').delete().neq('id', 0);
    if (deleteError) {
        console.error('Error clearing table:', deleteError);
    }

    console.log('Inserting default benefits...');
    const { error: insertError } = await supabase.from('benefits').insert(defaultBenefits);

    if (insertError) {
        console.error('Error inserting:', insertError);
    } else {
        console.log('Success! Benefits seeded.');
    }
}

seed();
