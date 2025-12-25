import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaBriefcase, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import './ProjectsManager.css';

const ProjectsManager = () => {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active'); // active, draft, paused, completed, all
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        client_id: '',
        title: '',
        type: 'Web Development',
        status: 'draft',
        start_date: '',
        deadline: '',
        price: '',
        template_id: ''
    });

    const [templates, setTemplates] = useState([]);




    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select('*, clients(name), tasks(id, status)')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setProjects(data);
        setLoading(false);
    };

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name').order('name');
        setClients(data || []);
    };

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        const { data } = await supabase.from('project_templates').select('id, name').order('name');
        setTemplates(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Remove template_id from payload before inserting into projects table
            const { template_id, ...projectPayload } = formData;

            const { data: newProject, error } = await supabase
                .from('projects')
                .insert([projectPayload])
                .select()
                .single();

            if (error) throw error;

            // If a template was selected, auto-generate steps and tasks
            if (template_id) {
                await generateProjectFromTemplate(newProject.id, template_id);
            }

            setShowForm(false);
            setFormData({ client_id: '', title: '', type: 'Web Development', status: 'draft', start_date: '', deadline: '', price: '', template_id: '' });
            fetchProjects();
        } catch (error) {
            alert('Error creating project');
            console.error(error);
        }
    };

    const generateProjectFromTemplate = async (projectId, templateId) => {
        // 1. Fetch Template Steps
        const { data: steps } = await supabase.from('template_steps').select('*').eq('template_id', templateId).order('order');
        if (!steps || steps.length === 0) return;

        // 2. Fetch Template Tasks
        const { data: tasks } = await supabase.from('template_tasks').select('*').in('template_step_id', steps.map(s => s.id));
        const tasksMap = {};
        tasks?.forEach(t => {
            if (!tasksMap[t.template_step_id]) tasksMap[t.template_step_id] = [];
            tasksMap[t.template_step_id].push(t);
        });

        // 3. Create Steps and Tasks for new Project
        for (const step of steps) {
            const { data: newStep } = await supabase
                .from('steps')
                .insert([{ project_id: projectId, title: step.title, order: step.order, status: 'pending' }])
                .select()
                .single();

            if (newStep && tasksMap[step.id]) {
                const newTasks = tasksMap[step.id].map(t => ({
                    project_id: projectId,
                    step_id: newStep.id,
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    status: 'todo'
                }));
                await supabase.from('tasks').insert(newTasks);
            }
        }
    };

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(filter.toLowerCase()) ||
            p.clients?.name?.toLowerCase().includes(filter.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'all') return true;
        return p.status === statusFilter;
    });

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>Projects</h1>
                    <p>Track your active work and progress</p>
                </div>
                <button className="crm-btn-primary" onClick={() => setShowForm(true)}>
                    <FaPlus /> New Project
                </button>
            </div>

            <div className="crm-controls-row">
                <div className="filter-tabs">
                    <button className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>Active</button>
                    <button className={`filter-tab ${statusFilter === 'draft' ? 'active' : ''}`} onClick={() => setStatusFilter('draft')}>Drafts</button>
                    <button className={`filter-tab ${statusFilter === 'paused' ? 'active' : ''}`} onClick={() => setStatusFilter('paused')}>Paused</button>
                    <button className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>Archived</button>
                    <button className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                </div>

                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {showForm && (
                <div className="crm-modal-overlay">
                    <div className="crm-modal">
                        <h2>New Project</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Client *</label>
                                <select required value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                                    <option value="">Select Client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <input value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Price</label>
                                <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '10px' }}>
                                <label>Start from Template (Optional)</label>
                                <select value={formData.template_id} onChange={e => setFormData({ ...formData, template_id: e.target.value })}>
                                    <option value="">No Template (Blank Project)</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                    Selecting a template will auto-generate steps and tasks.
                                </p>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="projects-grid">
                {loading ? <p>Loading...</p> : filteredProjects.map(project => (
                    <Link to={`/admin/projects/${project.id}`} key={project.id} className="project-card-link">
                        <div className="project-card">
                            <div className="project-header">
                                <div className="project-icon">
                                    <FaBriefcase />
                                </div>
                                <div className="project-status">
                                    <span className={`status-dot ${project.status}`}></span>
                                    {project.status}
                                </div>
                            </div>
                            <h3>{project.title}</h3>
                            <p className="client-name">{project.clients?.name}</p>

                            <div className="project-meta">
                                {project.deadline && (
                                    <div className="meta-item">
                                        <FaClock />
                                        <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {project.price && (
                                    <div className="meta-item price">
                                        ${project.price}
                                    </div>
                                )}
                            </div>

                            {/* Automatic Progress from Tasks */}
                            <div className="project-card-progress">
                                <div className="progress-info">
                                    <span>Progress</span>
                                    <span>
                                        {project.tasks && project.tasks.length > 0
                                            ? Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="p-bar-track">
                                    <div
                                        className="p-bar-fill"
                                        style={{
                                            width: `${project.tasks && project.tasks.length > 0
                                                ? (project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ProjectsManager;
