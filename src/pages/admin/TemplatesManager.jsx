/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-return */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaTrash, FaEdit, FaLayerGroup } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './TemplatesManager.css';

const TemplatesManager = () => {
    const { t } = useTranslation();
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

        void fetchTemplates();
    }, []);

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('project_templates')
            .insert([newTemplateForm])
            .select()
            .single();

        if (error) {
            alert(t('admin.templates.create_error', 'Error creating template'));
            console.error(error);
        } else {
            setTemplates([data, ...templates]);
            setShowCreateModal(false);
            setNewTemplateForm({ name: '', type: 'Web Development' });
            void openTemplateEditor(data);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm(t('admin.templates.delete_confirm', 'Delete this template?'))) return;
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
        const title = prompt(t('admin.templates.step_title_prompt', 'Step Title:'));
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
        const title = prompt(t('admin.templates.task_title_prompt', 'Task Title:'));
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
        if (!window.confirm(t('admin.templates.delete_step_confirm', 'Delete step? This will delete all tasks in it.'))) return;
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
                    <h1>{t('admin.templates.title', 'Templates')}</h1>
                    <p>{t('admin.templates.subtitle', 'Manage project blueprints')}</p>
                </div>
                {!activeTemplate && (
                    <button className="crm-btn-primary" onClick={() => setShowCreateModal(true)}>
                        <FaPlus /> {t('admin.templates.new_btn', 'New Template')}
                    </button>
                )}
                {activeTemplate && (
                    <button className="crm-btn-secondary" onClick={() => setActiveTemplate(null)}>
                        {t('admin.templates.back_btn', 'Back to List')}
                    </button>
                )}
            </div>

            {/* List View */}
            {!activeTemplate && (
                <div className="templates-grid">
                    {loading ? <p>{t('admin.templates.loading', 'Loading...')}</p> : templates.length === 0 ? <p>{t('admin.templates.empty', 'No templates created.')}</p> : templates.map(t => (
                        <div key={t.id} className="template-card">
                            <div className="template-header">
                                <h3>{t.name}</h3>
                                <div className="template-icon">
                                    <FaLayerGroup />
                                </div>
                            </div>
                            <div className="template-meta">
                                <span className="template-type">{t.type}</span>
                                <div className="template-actions">
                                    <button className="icon-btn" onClick={() => void openTemplateEditor(t)}>
                                        <FaEdit />
                                    </button>
                                    <button className="icon-btn delete" onClick={() => void handleDeleteTemplate(t.id)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor View */}
            {activeTemplate && (
                <div className="template-editor">
                    <div className="editor-header">
                        <h2>{t('admin.templates.editing', 'Editing:')} {activeTemplate.name}</h2>
                        <button className="crm-btn-primary sm" onClick={() => void handleAddStep()}>
                            <FaPlus /> {t('admin.templates.add_step', 'Add Step')}
                        </button>
                    </div>

                    <div className="steps-container">
                        {templateSteps.length === 0 ? (
                            <div className="empty-steps">{t('admin.templates.empty_steps', 'No steps defined. Add one to start.')}</div>
                        ) : (
                            templateSteps.map((step, index) => (
                                <div key={step.id} className="template-step-card">
                                    <div className="step-header">
                                        <h4>{index + 1}. {step.title}</h4>
                                        <button className="icon-btn delete" onClick={() => void handleDeleteStep(step.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <div className="step-tasks-list">
                                        {stepTasks[step.id]?.map(task => (
                                            <div key={task.id} className="template-task-item">
                                                <span>{task.title}</span>
                                                <button className="icon-btn xs" onClick={() => void handleDeleteTask(step.id, task.id)}>
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        <button className="add-task-btn" onClick={() => void handleAddTask(step.id)}>
                                            + {t('admin.templates.add_task', 'Add Task')}
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
                        <h2>{t('admin.templates.modal.title', 'New Template')}</h2>
                        <form onSubmit={(e) => void handleCreateTemplate(e)}>
                            <div className="form-group">
                                <label>{t('admin.templates.modal.name_label', 'Template Name')}</label>
                                <input
                                    autoFocus
                                    required
                                    value={newTemplateForm.name}
                                    onChange={e => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('admin.templates.modal.type_label', 'Default Type')}</label>
                                <input
                                    value={newTemplateForm.type}
                                    onChange={e => setNewTemplateForm({ ...newTemplateForm, type: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>{t('admin.templates.modal.cancel', 'Cancel')}</button>
                                <button type="submit" className="crm-btn-primary">{t('admin.templates.modal.create', 'Create')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesManager;
