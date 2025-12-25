import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { FaTasks, FaSearch, FaFilter, FaCheckSquare, FaEdit, FaTrash, FaClock, FaPlus } from 'react-icons/fa';
import './TasksManager.css';

const TasksManager = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProjectSteps, setSelectedProjectSteps] = useState([]);
    const [newTaskForm, setNewTaskForm] = useState({
        title: '',
        description: '',
        project_id: '',
        step_id: '',
        status: 'todo',
        priority: 'medium',
        scheduled_date: '',
        start_time: '',
        end_time: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const fetchTasksAndProjects = async () => {
            setLoading(true);
            const [tasksRes, projectsRes] = await Promise.all([
                supabase.from('tasks').select(`*, projects (title, id), steps (title)`).order('created_at', { ascending: false }),
                supabase.from('projects').select('id, title').eq('status', 'active')
            ]);

            if (tasksRes.error) console.error('Error fetching tasks:', tasksRes.error);
            else setTasks(tasksRes.data || []);

            if (projectsRes.error) console.error('Error fetching projects:', projectsRes.error);
            else setProjects(projectsRes.data || []);

            setLoading(false);
        };

        fetchTasksAndProjects();
    }, []);

    // Fetch steps when project is selected in modal
    useEffect(() => {
        const fetchSteps = async () => {
            if (!newTaskForm.project_id) {
                setSelectedProjectSteps([]);
                return;
            }
            const { data } = await supabase.from('steps').select('id, title').eq('project_id', newTaskForm.project_id).order('order');
            setSelectedProjectSteps(data || []);
        };
        fetchSteps();
    }, [newTaskForm.project_id]);

    // ... (useEffect for projects/tasks)

    // ... (useEffect for steps)

    const handleCreateOrUpdateTask = async (e) => {
        e.preventDefault();

        const payload = {
            title: newTaskForm.title,
            description: newTaskForm.description || null,
            project_id: newTaskForm.project_id || null,
            step_id: newTaskForm.step_id || null,
            status: newTaskForm.status,
            priority: newTaskForm.priority,
            scheduled_date: newTaskForm.scheduled_date || null,
            start_time: newTaskForm.start_time || null,
            end_time: newTaskForm.end_time || null
        };

        if (editingId) {
            // Update
            const { data, error } = await supabase
                .from('tasks')
                .update(payload)
                .eq('id', editingId)
                .select(`*, projects (title, id), steps (title)`)
                .single();

            if (error) {
                alert('Error updating task');
                console.error(error);
            } else {
                setTasks(tasks.map(t => t.id === editingId ? data : t));
                closeModal();
            }
        } else {
            // Create
            const { data, error } = await supabase
                .from('tasks')
                .insert([payload])
                .select(`*, projects (title, id), steps (title)`)
                .single();

            if (error) {
                alert('Error creating task');
                console.error(error);
            } else {
                setTasks([data, ...tasks]);
                closeModal();
            }
        }
    };

    const openEditModal = (task) => {
        setEditingId(task.id);
        setNewTaskForm({
            title: task.title,
            description: task.description || '',
            project_id: task.project_id || '',
            step_id: task.step_id || '',
            status: task.status,
            priority: task.priority,
            scheduled_date: task.scheduled_date || '',
            start_time: task.start_time || '',
            end_time: task.end_time || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setNewTaskForm({
            title: '', description: '', project_id: '', step_id: '',
            status: 'todo', priority: 'medium', scheduled_date: '', start_time: '', end_time: ''
        });
    };

    const handleToggleStatus = async (task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

        const { error } = await supabase
            .from('tasks')
            .update({
                status: newStatus,
                completed_at: completedAt
            })
            .eq('id', task.id);

        if (!error) {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.projects?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>Tasks</h1>
                    <p>Global view of all tasks across projects</p>
                </div>
                <button className="crm-btn-primary" onClick={() => {
                    setEditingId(null);
                    setNewTaskForm({
                        title: '', description: '', project_id: '', step_id: '',
                        status: 'todo', priority: 'medium', scheduled_date: '', start_time: '', end_time: ''
                    });
                    setShowModal(true);
                }}>
                    <FaPlus /> Add Task
                </button>
            </div>

            <div className="crm-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search tasks or projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                    </select>
                </div>
            </div>

            <div className="tasks-manager-list">
                {loading ? <p>Loading tasks...</p> : filteredTasks.length === 0 ? <p>No tasks found.</p> : filteredTasks.map(task => (
                    <div key={task.id} className={`global-task-item status-${task.status}`}>
                        <div className="task-main-info">
                            {/* ... (Checkbox and Details) */}
                            <input
                                type="checkbox"
                                checked={task.status === 'done'}
                                onChange={() => handleToggleStatus(task)}
                            />
                            <div className="task-details">
                                <span className="task-title">{task.title}</span>
                                <div className="task-meta">
                                    {task.projects && (
                                        <Link to={`/admin/projects/${task.projects.id}`} className="project-tag">
                                            {task.projects.title}
                                        </Link>
                                    )}
                                    {task.steps && <span className="step-tag">{task.steps.title}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="task-extra-info">
                            <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                            {task.scheduled_date && (
                                <span className="deadline-tag">
                                    <FaClock /> {new Date(task.scheduled_date).toLocaleDateString()}
                                </span>
                            )}
                            <button className="icon-btn" onClick={() => openEditModal(task)} title="Edit Task">
                                <FaEdit />
                            </button>
                            <button className="icon-btn delete" onClick={() => handleDelete(task.id)} title="Delete Task">
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Task Modal */}
            {showModal && (
                <div className="crm-modal-overlay">
                    <div className="crm-modal">
                        <h2>{editingId ? 'Edit Task' : 'New Global Task'}</h2>
                        <form onSubmit={handleCreateOrUpdateTask}>
                            <div className="form-group">
                                <label>Title</label>
                                <input required value={newTaskForm.title} onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Project</label>
                                <select value={newTaskForm.project_id} onChange={e => setNewTaskForm({ ...newTaskForm, project_id: e.target.value, step_id: '' })}>
                                    <option value="">No Project (Personal)</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            {newTaskForm.project_id && (
                                <div className="form-group">
                                    <label>Step (Optional)</label>
                                    <select value={newTaskForm.step_id} onChange={e => setNewTaskForm({ ...newTaskForm, step_id: e.target.value })}>
                                        <option value="">No Step</option>
                                        {selectedProjectSteps.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                    </select>
                                </div>
                            )}
                            {/* ... (Priority, Status, Date) */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={newTaskForm.priority} onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={newTaskForm.status} onChange={e => setNewTaskForm({ ...newTaskForm, status: e.target.value })}>
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" value={newTaskForm.scheduled_date} onChange={e => setNewTaskForm({ ...newTaskForm, scheduled_date: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="crm-btn-primary">{editingId ? 'Save Changes' : 'Create Task'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksManager;
