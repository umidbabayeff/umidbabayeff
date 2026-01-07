/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import React, { useState } from 'react';
import { BiChevronDown, BiCodeAlt, BiPaint, BiCheckCircle, BiXCircle, BiUpload, BiLoaderAlt } from 'react-icons/bi';
import { supabase } from '../lib/supabaseClient';
import './Careers.css';
import { useTranslation } from 'react-i18next';

const Careers = () => {
    const { t } = useTranslation();
    const [expandedPos, setExpandedPos] = useState(null);
    const [step, setStep] = useState(1); // 1: Form, 2: Test, 3: Task (if passed), 4: Success/Fail
    const [loading, setLoading] = useState(false);
    const [appId, setAppId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        contact: '',
        position: 'flutterflow',
        experience: 'junior',
        tools: [''], // Initialized with string to prevent never[] inference, filtered out later or just ignored
        why_us: ''
    });

    // Test State
    const [testAnswers, setTestAnswers] = useState({});

    // File State
    const [taskFile, setTaskFile] = useState(null);

    // Data
    const positions = [
        {
            id: 1,
            title: t('careers.positions.roles.flutterflow.title'),
            icon: <BiCodeAlt />,
            responsibilities: [
                t('careers.positions.roles.flutterflow.resp_1'),
                t('careers.positions.roles.flutterflow.resp_2'),
                t('careers.positions.roles.flutterflow.resp_3'),
                t('careers.positions.roles.flutterflow.resp_4')
            ],
            requirements: [
                t('careers.positions.roles.flutterflow.req_1'),
                t('careers.positions.roles.flutterflow.req_2'),
                t('careers.positions.roles.flutterflow.req_3'),
                t('careers.positions.roles.flutterflow.req_4')
            ]
        },
        {
            id: 2,
            title: t('careers.positions.roles.designer.title'),
            icon: <BiPaint />,
            responsibilities: [
                t('careers.positions.roles.designer.resp_1'),
                t('careers.positions.roles.designer.resp_2'),
                t('careers.positions.roles.designer.resp_3'),
            ],
            requirements: [
                t('careers.positions.roles.designer.req_1'),
                t('careers.positions.roles.designer.req_2'),
                t('careers.positions.roles.designer.req_3'),
            ]
        }
    ];

    const toolsList = ["FlutterFlow", "Antigravity", "Supabase", "Firebase", "Stitch", "GPT / Gemini"];

    const questions = [
        {
            id: 1,
            text: t('careers.test.questions.q1'),
            options: [
                { id: 'A', text: t('careers.test.questions.q1_opt_a') },
                { id: 'B', text: t('careers.test.questions.q1_opt_b'), correct: true }
            ]
        },
        {
            id: 2,
            text: t('careers.test.questions.q2'),
            options: [
                { id: 'A', text: t('careers.test.questions.q2_opt_a') },
                { id: 'B', text: t('careers.test.questions.q2_opt_b'), correct: true }
            ]
        },
        {
            id: 3,
            text: t('careers.test.questions.q3'),
            options: [
                { id: 'A', text: t('careers.test.questions.q3_opt_a') },
                { id: 'B', text: t('careers.test.questions.q3_opt_b'), correct: true }
            ]
        },
        {
            id: 4,
            text: t('careers.test.questions.q4'),
            options: [
                { id: 'A', text: t('careers.test.questions.q4_opt_a') },
                { id: 'B', text: t('careers.test.questions.q4_opt_b'), correct: true }
            ]
        },
        {
            id: 5,
            text: t('careers.test.questions.q5'),
            options: [
                { id: 'A', text: t('careers.test.questions.q5_opt_a') },
                { id: 'B', text: t('careers.test.questions.q5_opt_b'), correct: true }
            ]
        }
    ];

    // Handlers
    const togglePosition = (id) => {
        setExpandedPos(expandedPos === id ? null : id);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (tool) => {
        setFormData(prev => {
            const tools = prev.tools.includes(tool)
                ? prev.tools.filter(t => t !== tool)
                : [...prev.tools, tool];
            return { ...prev, tools };
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setStep(2);
        window.scrollTo(0, document.getElementById('application-form').offsetTop);
    };

    const handleTestAnswer = (qId, optionId) => {
        setTestAnswers(prev => ({ ...prev, [qId]: optionId }));
    };

    const handleTestSubmit = async () => {
        setLoading(true);

        // precise grading
        let score = 0;
        questions.forEach(q => {
            const correctOpt = q.options.find(o => o.correct);
            if (testAnswers[q.id] === correctOpt.id) {
                score++;
            }
        });

        const passed = score >= 5; // Strict pass (5/5) based on "Logic & Attention" requirements

        try {
            // Save initial application
            const { data, error } = await supabase
                .from('career_applications')
                .insert([{
                    ...formData,
                    test_answers: testAnswers,
                    test_score: score,
                    status: passed ? 'test_passed' : 'new_candidate' // Keep as new_candidate if failed so we can review? Or just reject. Let's say new_candidate for now but we show "Thank you"
                }])
                .select()
                .single();

            if (error) throw error;

            setAppId(data.id);

            if (passed) {
                setStep(3); // Go to Task
            } else {
                setStep(4); // End (Failed)
            }
        } catch (err) {
            console.error(err);
            const msg = err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error';
            alert(`Something went wrong: ${String(msg)}`);
        } finally {
            setLoading(false);
            window.scrollTo(0, document.getElementById('application-form').offsetTop);
        }
    };

    const handleTaskUpload = async () => {
        if (!taskFile) return;
        setLoading(true);
        try {
            const fileExt = taskFile.name ? taskFile.name.split('.').pop() : 'dat';
            const fileName = `${appId}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('career-uploads')
                .upload(filePath, taskFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('career-uploads')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('career_applications')
                .update({
                    task_file_url: publicUrl,
                    status: 'task_submitted'
                })
                .eq('id', appId);

            if (dbError) throw dbError;

            setStep(5); // Success Task Submitted
        } catch (err) {
            console.error(err);
            alert(t('careers.alerts.error_upload'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="careers-page">
            {/* Hero */}
            <section className="careers-hero">
                <div className="container">
                    <h1>{t('careers.hero.title')}</h1>
                    <h4>{t('careers.hero.subtitle')}</h4>
                    <p className="tech-note">{t('careers.hero.tech_note')}</p>
                </div>
            </section>

            {/* Positions */}
            <section className="careers-section">
                <div className="container">
                    <h2 className="section-title">{t('careers.positions.title')}</h2>
                    <div className="positions-grid">
                        {positions.map(pos => (
                            <div key={pos.id} className={`position-card ${expandedPos === pos.id ? 'expanded' : ''}`}>
                                <div className="position-header" onClick={() => togglePosition(pos.id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="position-icon">{pos.icon}</div>
                                        <h3>{pos.title}</h3>
                                    </div>
                                    <BiChevronDown className="position-icon" />
                                </div>
                                {expandedPos === pos.id && (
                                    <div className="position-content">
                                        <h4>{t('careers.positions.responsibilities')}</h4>
                                        <ul>
                                            {pos.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                        <h4>{t('careers.positions.requirements')}</h4>
                                        <ul>
                                            {pos.requirements.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process */}
            <section className="careers-section">
                <div className="container">
                    <h2 className="section-title">{t('careers.process.title')}</h2>
                    <div className="hiring-steps">
                        {[
                            { step: 1, title: t('careers.process.steps.app') },
                            { step: 2, title: t('careers.process.steps.test') },
                            { step: 3, title: t('careers.process.steps.task') },
                            { step: 4, title: t('careers.process.steps.interview') }
                        ].map(s => (
                            <div key={s.step} className="hiring-step">
                                <div className="step-number">{s.step}</div>
                                <div className="step-title">{s.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Application Flow */}
            <section className="careers-section" id="application-form">
                <div className="container">
                    <div className="application-container">

                        {/* Step 1: Form */}
                        {step === 1 && (
                            <form onSubmit={handleFormSubmit}>
                                <h3 style={{ marginBottom: '2rem', textAlign: 'center' }}>{t('careers.form.title')}</h3>

                                <div className="form-group">
                                    <label>{t('careers.form.fields.name')}</label>
                                    <input required name="full_name" className="form-control" value={formData.full_name} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>{t('careers.form.fields.email')}</label>
                                    <input required type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>{t('careers.form.fields.contact')}</label>
                                    <input required name="contact" className="form-control" value={formData.contact} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>{t('careers.form.fields.position')}</label>
                                    <select name="position" className="form-control" value={formData.position} onChange={handleInputChange}>
                                        <option value="flutterflow">{t('careers.positions.roles.flutterflow.title')}</option>
                                        <option value="designer">{t('careers.positions.roles.designer.title')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('careers.form.fields.experience')}</label>
                                    <select name="experience" className="form-control" value={formData.experience} onChange={handleInputChange}>
                                        <option value="junior">{t('careers.form.levels.junior')}</option>
                                        <option value="middle">{t('careers.form.levels.middle')}</option>
                                        <option value="senior">{t('careers.form.levels.senior')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('careers.form.fields.tools')}</label>
                                    <div className="checkbox-group">
                                        {toolsList.map(tool => (
                                            <label key={tool} className="checkbox-label">
                                                <input type="checkbox" checked={formData.tools.includes(tool)} onChange={() => handleCheckboxChange(tool)} />
                                                {tool}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('careers.form.fields.why_us')}</label>
                                    <textarea required name="why_us" className="form-control" rows="3" value={formData.why_us} onChange={handleInputChange}></textarea>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-primary">{t('careers.form.buttons.next')}</button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Test */}
                        {step === 2 && (
                            <div>
                                <h3 style={{ marginBottom: '2rem', textAlign: 'center' }}>{t('careers.test.title')}</h3>
                                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>{t('careers.test.subtitle')}</p>

                                {questions.map((q, idx) => (
                                    <div key={q.id} className="test-question">
                                        <h4>{idx + 1}. {q.text}</h4>
                                        {q.options.map(opt => (
                                            <label key={opt.id} className="radio-option">
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    checked={testAnswers[q.id] === opt.id}
                                                    onChange={() => handleTestAnswer(q.id, opt.id)}
                                                />
                                                {opt.text}
                                            </label>
                                        ))}
                                    </div>
                                ))}

                                <div className="form-actions">
                                    <button
                                        className="btn-primary"
                                        onClick={() => void handleTestSubmit()}
                                        disabled={loading || Object.keys(testAnswers).length < 5}
                                    >
                                        {loading ? <BiLoaderAlt className="animate-spin" /> : t('careers.form.buttons.submit_test')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Practical Task */}
                        {step === 3 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{t('careers.task.pass_title')}</h3>
                                <p style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--accent-blue)' }}>{t('careers.task.pass_subtitle')}</p>

                                <div className="task-instructions">
                                    <h4>{t('careers.task.label')}</h4>
                                    {formData.position === 'flutterflow' ? (
                                        <p>{t('careers.task.instructions.flutterflow')}</p>
                                    ) : (
                                        <p>{t('careers.task.instructions.designer')}</p>
                                    )}
                                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>{t('careers.task.upload_instruction')}</p>
                                </div>

                                <div className="form-group">
                                    <label>{t('careers.task.upload_label')}</label>
                                    <div style={{ border: '2px dashed rgba(255,255,255,0.2)', padding: '2rem', textAlign: 'center', borderRadius: '8px' }}>
                                        <BiUpload style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                                        <input type="file" onChange={(e) => setTaskFile(e.target.files[0])} style={{ display: 'block', margin: '0 auto' }} />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        className="btn-primary"
                                        onClick={() => void handleTaskUpload()}
                                        disabled={loading || !taskFile}
                                    >
                                        {loading ? <BiLoaderAlt className="animate-spin" /> : t('careers.form.buttons.submit_app')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Failed / Step 5: Success */}
                        {/* Step 4: Failed / Step 5: Success (Modal) */}
                        {(step === 4 || step === 5) && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    {step === 5 ? (
                                        <>
                                            <BiCheckCircle className="status-icon" style={{ color: 'var(--accent-blue)' }} />
                                            <h3>{t('careers.success.title')}</h3>
                                            <p>{t('careers.success.message')}</p>
                                        </>
                                    ) : (
                                        <>
                                            <BiXCircle className="status-icon" style={{ color: 'var(--text-secondary)' }} />
                                            <h3>{t('careers.fail.title')}</h3>
                                            <p>{t('careers.fail.message')}</p>
                                        </>
                                    )}
                                    <button
                                        className="btn-primary"
                                        onClick={() => window.location.href = '/'}
                                    >
                                        {t('careers.form.buttons.home')}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
