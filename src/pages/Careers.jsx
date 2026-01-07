/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import React, { useState } from 'react';
import { BiChevronDown, BiCodeAlt, BiPaint, BiCheckCircle, BiXCircle, BiUpload, BiLoaderAlt } from 'react-icons/bi';
import { supabase } from '../lib/supabaseClient';
import './Careers.css';

const Careers = () => {
    const [expandedPos, setExpandedPos] = useState(null);
    const [step, setStep] = useState(1); // 1: Form, 2: Test, 3: Task (if passed), 4: Success/Fail
    const [loading, setLoading] = useState(false);
    const [appId, setAppId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        contact: '',
        position: 'FlutterFlow / UI Developer',
        experience: 'Junior',
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
            title: "FlutterFlow / UI Developer",
            icon: <BiCodeAlt />,
            responsibilities: [
                "Build UI screens in FlutterFlow",
                "Work with adaptive layouts",
                "Implement designs based on provided structure",
                "Follow technical tasks and deadlines"
            ],
            requirements: [
                "Experience with FlutterFlow",
                "Understanding of UI/UX basics",
                "Attention to detail",
                "Ability to work with tasks and instructions"
            ]
        },
        {
            id: 2,
            title: "Designer / Content Assistant",
            icon: <BiPaint />,
            responsibilities: [
                "Create visuals using Stitch and Canva",
                "Prepare assets for web and mobile projects",
                "Assist with text formatting and content structure"
            ],
            requirements: [
                "Basic design sense",
                "Ability to follow brand guidelines",
                "Responsibility and consistency"
            ]
        }
    ];

    const toolsList = ["FlutterFlow", "Antigravity", "Supabase", "Firebase", "Stitch", "GPT / Gemini"];

    const questions = [
        {
            id: 1,
            text: "If a task description changes after approval, what should you do?",
            options: [
                { id: 'A', text: "Continue old version" },
                { id: 'B', text: "Ask for clarification before proceeding", correct: true }
            ]
        },
        {
            id: 2,
            text: "What is more important in production work?",
            options: [
                { id: 'A', text: "Speed without accuracy" },
                { id: 'B', text: "Accuracy and consistency", correct: true }
            ]
        },
        {
            id: 3,
            text: "If you don’t understand a task, what is the correct action?",
            options: [
                { id: 'A', text: "Guess" },
                { id: 'B', text: "Ask questions", correct: true }
            ]
        },
        {
            id: 4,
            text: "What does responsibility mean in team work?",
            options: [
                { id: 'A', text: "Doing only what is interesting" },
                { id: 'B', text: "Completing agreed tasks on time", correct: true }
            ]
        },
        {
            id: 5,
            text: "How do you treat feedback?",
            options: [
                { id: 'A', text: "Ignore it" },
                { id: 'B', text: "Use it to improve", correct: true }
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
            alert('Error uploading file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="careers-page">
            {/* Hero */}
            <section className="careers-hero">
                <div className="container">
                    <h1>Join Our Digital Team</h1>
                    <h4>We are building web, mobile, automation and SaaS products using modern tools and AI.</h4>
                    <p className="tech-note">We work with Antigravity, FlutterFlow, Supabase, Firebase, AI (GPT / Gemini), and modern no-code & low-code solutions.</p>
                </div>
            </section>

            {/* Positions */}
            <section className="careers-section">
                <div className="container">
                    <h2 className="section-title">Open Positions</h2>
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
                                        <h4>Responsibilities:</h4>
                                        <ul>
                                            {pos.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                                        </ul>
                                        <h4>Requirements:</h4>
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
                    <h2 className="section-title">Hiring Process</h2>
                    <div className="hiring-steps">
                        {[
                            { step: 1, title: 'Application' },
                            { step: 2, title: 'Logic Test' },
                            { step: 3, title: 'Practical Task' },
                            { step: 4, title: 'Short Interview' }
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
                                <h3 style={{ marginBottom: '2rem', textAlign: 'center' }}>Application Form</h3>

                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input required name="full_name" className="form-control" value={formData.full_name} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input required type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Telegram / Contact</label>
                                    <input required name="contact" className="form-control" value={formData.contact} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Position</label>
                                    <select name="position" className="form-control" value={formData.position} onChange={handleInputChange}>
                                        <option>FlutterFlow / UI Developer</option>
                                        <option>Designer / Content Assistant</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Experience Level</label>
                                    <select name="experience" className="form-control" value={formData.experience} onChange={handleInputChange}>
                                        <option>Junior</option>
                                        <option>Middle</option>
                                        <option>Senior</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tools you have worked with</label>
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
                                    <label>Why do you want to work with us?</label>
                                    <textarea required name="why_us" className="form-control" rows="3" value={formData.why_us} onChange={handleInputChange}></textarea>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-primary">Next Step</button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Test */}
                        {step === 2 && (
                            <div>
                                <h3 style={{ marginBottom: '2rem', textAlign: 'center' }}>Logic & Attention Test</h3>
                                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Please answer carefully. Accuracy matches our values.</p>

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
                                        {loading ? <BiLoaderAlt className="animate-spin" /> : "Submit Test"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Practical Task */}
                        {step === 3 && (
                            <div>
                                <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Great job! You passed the test.</h3>
                                <p style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--accent-blue)' }}>One last step: Show us your skills.</p>

                                <div className="task-instructions">
                                    <h4>Practical Task:</h4>
                                    {formData.position.includes('FlutterFlow') ? (
                                        <p>Create a simple 3-screen app layout with responsive design. You can use FlutterFlow or just a design tool, but FF is preferred.</p>
                                    ) : (
                                        <p>Create a simple UI block or visual using Stitch / Canva that represents "Automation".</p>
                                    )}
                                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>Please upload a zip file or a PDF with link/screenshots.</p>
                                </div>

                                <div className="form-group">
                                    <label>Upload Task Solution</label>
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
                                        {loading ? <BiLoaderAlt className="animate-spin" /> : "Submit Application"}
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
                                            <h3>Application Received!</h3>
                                            <p>Thank you for completing the process. We have received your task and details. We will review your submission and contact you soon.</p>
                                        </>
                                    ) : (
                                        <>
                                            <BiXCircle className="status-icon" style={{ color: 'var(--text-secondary)' }} />
                                            <h3>Thank you for applying.</h3>
                                            <p>Unless you'd like to try again, we have received your details. We will contact you if you pass the first stage.</p>
                                        </>
                                    )}
                                    <button
                                        className="btn-primary"
                                        onClick={() => window.location.href = '/'}
                                    >
                                        Return to Home
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
