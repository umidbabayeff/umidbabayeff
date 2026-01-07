/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import React, { useRef, useEffect } from 'react';
import {
    BiSearchAlt,
    BiLayer,
    BiPalette,
    BiCodeAlt,
    BiServer,
    BiBrain,
    BiCheckShield,
    BiRocket
} from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import './Process.css';

const steps = [
    {
        title: 'process.steps.analysis.title',
        short: 'process.steps.analysis.short',
        detail: 'process.steps.analysis.detail',
        icon: BiSearchAlt
    },
    {
        title: 'process.steps.architecture.title',
        short: 'process.steps.architecture.short',
        detail: 'process.steps.architecture.detail',
        icon: BiLayer
    },
    {
        title: 'process.steps.uxui.title',
        short: 'process.steps.uxui.short',
        detail: 'process.steps.uxui.detail',
        icon: BiPalette
    },
    {
        title: 'process.steps.dev.title',
        short: 'process.steps.dev.short',
        detail: 'process.steps.dev.detail',
        icon: BiCodeAlt
    },
    {
        title: 'process.steps.backend.title',
        short: 'process.steps.backend.short',
        detail: 'process.steps.backend.detail',
        icon: BiServer
    },
    {
        title: 'process.steps.ai.title',
        short: 'process.steps.ai.short',
        detail: 'process.steps.ai.detail',
        icon: BiBrain
    },
    {
        title: 'process.steps.testing.title',
        short: 'process.steps.testing.short',
        detail: 'process.steps.testing.detail',
        icon: BiCheckShield
    },
    {
        title: 'process.steps.launch.title',
        short: 'process.steps.launch.short',
        detail: 'process.steps.launch.detail',
        icon: BiRocket
    }
];

const Process = () => {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const isPaused = useRef(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused.current) return;

            const container = scrollRef.current;
            if (!container) return;

            const currentScroll = container.scrollLeft;
            const maxScroll = container.scrollWidth;
            const width = container.clientWidth;

            // Check if we are close to the end (Tolerance 20px)
            if ((currentScroll + width) >= (maxScroll - 20)) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: 350, behavior: 'smooth' });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="section process-section">
            <div className="container">
                <h2>{t('process.title')}</h2>
                <div
                    className="process-grid"
                    ref={scrollRef}
                    onMouseEnter={() => isPaused.current = true}
                    onMouseLeave={() => isPaused.current = false}
                    onTouchStart={() => isPaused.current = true}
                    onTouchEnd={() => isPaused.current = false}
                >
                    {steps.map((step, index) => (
                        <div key={index} className="process-step" tabIndex="0">
                            <div className="step-content">
                                <div className="step-header">
                                    <step.icon className="step-icon" />
                                    <div className="step-number">0{index + 1}</div>

                                </div>
                                <h3>{t(step.title)}</h3>
                                <p className="step-short">{t(step.short)}</p>
                                <div className="step-detail-wrapper">
                                    <p className="step-detail">{t(step.detail)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Process;
