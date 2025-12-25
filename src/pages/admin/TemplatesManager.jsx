import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaTrash, FaEdit, FaLayerGroup, FaList, FaChevronRight, FaSave } from 'react-icons/fa';
import './TemplatesManager.css';

const TemplatesManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTemplate, setActiveTemplate] = useState(null); // The one being edited
    const [templateSteps, setTemplateSteps] = useState([]); // Steps for the active template
    const [stepTasks, setStepTasks] = useState({}); // Map of step_id -> tasks array

    // Modal/Form State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplateForm, setNewTemplateForm] = useState({ name: '', type: 'Web Development' });



    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('project_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error) setTemplates(data || []);
            setLoading(false);
        };

        fetchTemplates();
    }, []);

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('project_templates')
            .insert([newTemplateForm])
            .select()
            .single();

        if (error) {
            alert('Error creating template');
            console.error(error);
        } else {
            setTemplates([data, ...templates]);
            setShowCreateModal(false);
            setNewTemplateForm({ name: '', type: 'Web Development' });
            openTemplateEditor(data);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Delete this template?')) return;
        const { error } = await supabase.from('project_templates').delete().eq('id', id);
        if (!error) {
            setTemplates(templates.filter(t => t.id !== id));
            if (activeTemplate?.id === id) setActiveTemplate(null);
        }
    };

    // --- Template Editor Logic ---

    const openTemplateEditor = async (template) => {
        setActiveTemplate(template);
        // Fetch steps
        const { data: steps } = await supabase
            .from('template_steps')
            .select('*')
            .eq('template_id', template.id)
            .order('order');

        setTemplateSteps(steps || []);

        // Fetch tasks for all these steps
        if (steps && steps.length > 0) {
            const stepIds = steps.map(s => s.id);
            const { data: tasks } = await supabase
                .from('template_tasks')
                .select('*')
                .in('template_step_id', stepIds)
                .order('id'); // Simple order for now

            // Group tasks by step
            const tasksMap = {};
            tasks.forEach(t => {
                if (!tasksMap[t.template_step_id]) tasksMap[t.template_step_id] = [];
                tasksMap[t.template_step_id].push(t);
            });
            setStepTasks(tasksMap);
        } else {
            setStepTasks({});
        }
    };

    const handleAddStep = async () => {
        const title = prompt('Step Title:');
        if (!title) return;

        const { data, error } = await supabase
            .from('template_steps')
            .insert([{ template_id: activeTemplate.id, title, order: templateSteps.length + 1 }])
            .select()
            .single();

        if (!error) {
            setTemplateSteps([...templateSteps, data]);
            setStepTasks({ ...stepTasks, [data.id]: [] });
        }
    };

    const handleAddTask = async (stepId) => {
        const title = prompt('Task Title:');
        if (!title) return;

        const { data, error } = await supabase
            .from('template_tasks')
            .insert([{ template_step_id: stepId, title, priority: 'medium' }])
            .select()
            .single();

        if (!error) {
            const currentTasks = stepTasks[stepId] || [];
            setStepTasks({
                ...stepTasks,
                [stepId]: [...currentTasks, data]
            });
        }
    };

    const handleDeleteStep = async (stepId) => {
        if (!window.confirm('Delete step? This will delete all tasks in it.')) return;
        await supabase.from('template_steps').delete().eq('id', stepId);
        setTemplateSteps(templateSteps.filter(s => s.id !== stepId));
        const newTasks = { ...stepTasks };
        delete newTasks[stepId];
        setStepTasks(newTasks);
    };

    const handleDeleteTask = async (stepId, taskId) => {
        await supabase.from('template_tasks').delete().eq('id', taskId);
        setStepTasks({
            ...stepTasks,
            [stepId]: stepTasks[stepId].filter(t => t.id !== taskId)
        });
    };

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>Templates</h1>
                    <p>Manage project blueprints</p>
                </div>
                {!activeTemplate && (
                    <button className="crm-btn-primary" onClick={() => setShowCreateModal(true)}>
                        <FaPlus /> New Template
                    </button>
                )}
                {activeTemplate && (
                    <button className="crm-btn-secondary" onClick={() => setActiveTemplate(null)}>
                        Back to List
                    </button>
                )}
            </div>

            {/* List View */}
            {!activeTemplate && (
                <div className="templates-grid">
                    {loading ? <p>Loading...</p> : templates.length === 0 ? <p>No templates created.</p> : templates.map(t => (
                        <div key={t.id} className="template-card">
                            <div className="template-icon">
                                <FaLayerGroup />
                            </div>
                            <h3>{t.name}</h3>
                            <span className="template-type">{t.type}</span>
                            <div className="template-actions">
                                <button className="icon-btn" onClick={() => openTemplateEditor(t)}>
                                    <FaEdit /> Edit
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDeleteTemplate(t.id)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor View */}
            {activeTemplate && (
                <div className="template-editor">
                    <div className="editor-header">
                        <h2>Editing: {activeTemplate.name}</h2>
                        <button className="crm-btn-primary sm" onClick={handleAddStep}>
                            <FaPlus /> Add Step
                        </button>
                    </div>

                    <div className="steps-container">
                        {templateSteps.length === 0 ? (
                            <div className="empty-steps">No steps defined. Add one to start.</div>
                        ) : (
                            templateSteps.map((step, index) => (
                                <div key={step.id} className="template-step-card">
                                    <div className="step-header">
                                        <h4>{index + 1}. {step.title}</h4>
                                        <button className="icon-btn delete" onClick={() => handleDeleteStep(step.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <div className="step-tasks-list">
                                        {stepTasks[step.id]?.map(task => (
                                            <div key={task.id} className="template-task-item">
                                                <span>{task.title}</span>
                                                <button className="icon-btn xs" onClick={() => handleDeleteTask(step.id, task.id)}>
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        <button className="add-task-btn" onClick={() => handleAddTask(step.id)}>
                                            + Add Task
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="crm-modal-overlay">
                    <div className="crm-modal">
                        <h2>New Template</h2>
                        <form onSubmit={handleCreateTemplate}>
                            <div className="form-group">
                                <label>Template Name</label>
                                <input
                                    autoFocus
                                    required
                                    value={newTemplateForm.name}
                                    onChange={e => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Type</label>
                                <input
                                    value={newTemplateForm.type}
                                    onChange={e => setNewTemplateForm({ ...newTemplateForm, type: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="crm-btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesManager;
