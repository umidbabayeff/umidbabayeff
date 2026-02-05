import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getIcon } from '../../lib/IconMapper';
import './TechStack.css';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} TechItem
 * @property {number} id
 * @property {string} name
 * @property {string} category
 * @property {string} icon
 */

const TechStack = () => {
    const { t } = useTranslation();
    const [techGroups, setTechGroups] = useState(/** @type {{ category: string, items: TechItem[] }[]} */([]));

    useEffect(() => {
        const fetchTechs = async () => {
            // We can use 'en' for all since tech names usually don't change, 
            // but if we supported translated categories via DB, we'd use lang.
            // For now, let's just fetch all and group them.
            const { data: rawData, error } = await supabase
                .from('technologies')
                .select('*')
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching techs:', error);
                return;
            }

            /** @type {TechItem[]} */
            const data = rawData;

            // Group by category
            /** @type {Record<string, TechItem[]>} */
            const groups = {
                'tech.categories.frontend': [],
                'tech.categories.backend': [],
                'tech.categories.ai': []
            };

            data.forEach(tech => {
                if (groups[tech.category]) {
                    groups[tech.category].push(tech);
                }
            });

            const formattedGroups = Object.keys(groups).map(key => ({
                category: key,
                items: groups[key]
            }));

            setTechGroups(formattedGroups);
        };

        void fetchTechs();
    }, []);

    return (
        <section className="section tech-section">
            <div className="container">
                <div className="tech-header">
                    <h1>{t('tech.title')}</h1>
                    <p>{t('tech.subtitle')}</p>
                </div>

                <div className="tech-groups">
                    {techGroups.map((group, index) => (
                        <div key={index} className="tech-group">
                            <h3>{t(group.category)}</h3>
                            <div className="tech-items">
                                {group.items.map((item, i) => (
                                    <div key={i} className="tech-item">
                                        <div className="item-icon">{getIcon(item.icon)}</div>
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TechStack;
