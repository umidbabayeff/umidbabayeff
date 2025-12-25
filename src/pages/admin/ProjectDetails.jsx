import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckSquare, FaFileAlt, FaHistory, FaListUl, FaInfoCircle, FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './ProjectDetails.css';

const ProjectDetails = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // Data State
    const [steps, setSteps] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [docs, setDocs] = useState([]);

    // UI State for Steps
    const [editingStepId, setEditingStepId] = useState(null);
    const [newStepTitle, setNewStepTitle] = useState('');
    const [showStepInput, setShowStepInput] = useState(false);

    // Timeline Edit State
    const [isEditingTimeline, setIsEditingTimeline] = useState(false);
    const [timelineForm, setTimelineForm] = useState({ start_date: '', deadline: '' });

    useEffect(() => {
        const fetchProjectData = async () => {
            setLoading(true);
            const { data: projData, error: projError } = await supabase
                .from('projects')
                .select('*, clients(*)')
                .eq('id', id)
                .single();

            if (projError) {
                console.error(projError);
                setLoading(false);
                return;
            }
            setProject(projData);
            setTimelineForm({
                start_date: projData.start_date || '',
                deadline: projData.deadline || ''
            });

            const [stepsRes, tasksRes, docsRes] = await Promise.all([
                supabase.from('steps').select('*').eq('project_id', id).order('order', { ascending: true }),
                supabase.from('tasks').select('*').eq('project_id', id).order('created_at'),
                supabase.from('documents').select('*').eq('project_id', id).order('created_at', { ascending: false })
            ]);

            if (stepsRes.data) setSteps(stepsRes.data);
            if (tasksRes.data) setTasks(tasksRes.data);
            if (docsRes.data) setDocs(docsRes.data);

            setLoading(false);
        };

        fetchProjectData();
    }, [id]);

    // --- Step Management Functions ---

    const handleCreateStep = async () => {
        if (!newStepTitle.trim()) return;

        const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order)) : 0;

        const { data, error } = await supabase
            .from('steps')
            .insert([{
                project_id: id,
                title: newStepTitle,
                order: maxOrder + 1,
                status: 'not_started'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating step:', error);
            alert('Failed to create step');
        } else {
            setSteps([...steps, data]);
            setNewStepTitle('');
            setShowStepInput(false);
        }
    };

    const handleDeleteStep = async (stepId) => {
        if (!window.confirm('Are you sure? This will delete the step.')) return;

        const { error } = await supabase.from('steps').delete().eq('id', stepId);
        if (error) {
            console.error('Error deleting step:', error);
        } else {
            setSteps(steps.filter(s => s.id !== stepId));
        }
    };

    const handleUpdateStepStatus = async (step, newStatus) => {
        if (newStatus === 'done') {
            const stepTasks = tasks.filter(t => t.step_id === step.id);
            const uncompletedTasks = stepTasks.filter(t => t.status !== 'done');
            if (uncompletedTasks.length > 0) {
                alert(`Cannot mark as Done. ${uncompletedTasks.length} tasks are still pending.`);
                return;
            }
        }

        const { error } = await supabase.from('steps').update({ status: newStatus }).eq('id', step.id);
        if (error) {
            console.error('Error updating step status:', error);
        } else {
            setSteps(steps.map(s => s.id === step.id ? { ...s, status: newStatus } : s));
        }
    };

    const handleUpdateStepTitle = async (stepId, title) => {
        const { error } = await supabase.from('steps').update({ title }).eq('id', stepId);
        if (!error) {
            setSteps(steps.map(s => s.id === stepId ? { ...s, title } : s));
            setEditingStepId(null);
        }
    };


    // --- Task Handlers ---

    const [showTaskInput, setShowTaskInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleToggleTaskStatus = async (task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);

        if (!error) {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } else {
            console.error('Error toggling task:', error);
        }
    };

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) return;

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                project_id: id,
                title: newTaskTitle,
                status: 'todo',
                priority: 'medium'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
        } else {
            setTasks([...tasks, data]);
            setNewTaskTitle('');
            setShowTaskInput(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    // Calculate Progress for a Step
    const getStepProgress = (stepId) => {
        const stepTasks = tasks.filter(t => t.step_id === stepId);
        if (stepTasks.length === 0) return 0;
        const doneTasks = stepTasks.filter(t => t.status === 'done');
        return Math.round((doneTasks.length / stepTasks.length) * 100);
    };

    // --- Document Handlers ---

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${id}/${fileName}`; // Organize by project ID

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { data: docData, error: dbError } = await supabase
                .from('documents')
                .insert([{
                    project_id: id,
                    type: file.type.includes('pdf') ? 'Invoice' : 'Document',
                    file_url: publicUrl,
                    status: 'draft'
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            // 4. Update UI
            setDocs([docData, ...docs]);
            alert('File uploaded successfully!');

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            e.target.value = null; // Reset input
        }
    };

    const handleDeleteDoc = async (docId, fileUrl) => {
        if (!window.confirm('Delete this document?')) return;

        try {
            // Extract path from URL. Assuming standard Supabase Storage URL structure.
            // URL: .../storage/v1/object/public/project-files/PROJECT_ID/FILENAME
            // We need "PROJECT_ID/FILENAME"
            const urlParts = fileUrl.split('project-files/');
            if (urlParts.length < 2) throw new Error('Invalid file URL format');
            const filePath = urlParts[1];

            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('project-files')
                .remove([filePath]);

            if (storageError) console.warn('Storage delete warning:', storageError);

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', docId);

            if (dbError) throw dbError;

            setDocs(docs.filter(d => d.id !== docId));
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Delete failed');
        }
    };

    if (loading) return <div className="p-10 text-white">Loading Project...</div>;
    if (!project) return <div className="p-10 text-white">Project not found</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="tab-content overview-grid">
                        <div className="info-card">
                            <h3>Project Info</h3>
                            <div className="info-row"><span className="label">Client:</span><span className="value">{project.clients?.name}</span></div>
                            <div className="info-row"><span className="label">Type:</span><span className="value">{project.type}</span></div>
                            <div className="info-row"><span className="label">Status:</span><span className="status-badge-inline">{project.status}</span></div>
                            <div className="info-row"><span className="label">Price:</span><span className="value money">${project.price}</span></div>
                        </div>
                        <div className="info-card">
                            <div className="card-header-actions">
                                <h3>Timeline</h3>
                                {!isEditingTimeline ? (
                                    <button className="icon-btn-small" onClick={() => setIsEditingTimeline(true)} title="Edit Timeline">
                                        <FaEdit />
                                    </button>
                                ) : (
                                    <div className="edit-actions-mini">
                                        <button className="icon-btn-small save" onClick={handleUpdateTimeline} title="Save"><FaSave /></button>
                                        <button className="icon-btn-small cancel" onClick={() => setIsEditingTimeline(false)} title="Cancel"><FaTimes /></button>
                                    </div>
                                )}
                            </div>

                            {isEditingTimeline ? (
                                <div className="timeline-edit-form">
                                    <div className="info-row-edit">
                                        <span className="label">Start:</span>
                                        <input
                                            type="date"
                                            value={timelineForm.start_date || ''}
                                            onChange={e => setTimelineForm({ ...timelineForm, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="info-row-edit">
                                        <span className="label">Deadline:</span>
                                        <input
                                            type="date"
                                            value={timelineForm.deadline || ''}
                                            onChange={e => setTimelineForm({ ...timelineForm, deadline: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="info-row"><span className="label">Start:</span><span className="value">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</span></div>
                                    <div className="info-row"><span className="label">Deadline:</span><span className="value">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}</span></div>
                                </>
                            )}

                            <div className="progress-section">
                                <span className="label">Total Progress: {tasks.length ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0}%</span>
                                <div className="progress-bar-wrapper">
                                    <div className="progress-bar" style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'steps':
                return (
                    <div className="tab-content">
                        <div className="tab-header-actions">
                            <h3>Project Steps</h3>
                            <button className="btn-small" onClick={() => setShowStepInput(true)}><FaPlus /> Add Step</button>
                        </div>

                        {showStepInput && (
                            <div className="new-step-input">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Step title..."
                                    value={newStepTitle}
                                    onChange={e => setNewStepTitle(e.target.value)}
                                    className="step-input"
                                />
                                <button className="btn-save" onClick={handleCreateStep}><FaSave /></button>
                                <button className="btn-cancel" onClick={() => setShowStepInput(false)}><FaTimes /></button>
                            </div>
                        )}

                        <ul className="steps-list">
                            {steps.length === 0 ? <p className="text-gray">No steps yet. Add one to get started.</p> : steps.map(step => (
                                <li key={step.id} className="step-item">
                                    <div className="step-header">
                                        <div className="step-info">
                                            <span className="step-sequence">{step.order}</span>
                                            {editingStepId === step.id ? (
                                                <input
                                                    className="edit-step-input"
                                                    defaultValue={step.title}
                                                    onBlur={(e) => handleUpdateStepTitle(step.id, e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateStepTitle(step.id, e.currentTarget.value)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="step-title" onDoubleClick={() => setEditingStepId(step.id)}>{step.title}</span>
                                            )}
                                        </div>
                                        <div className="step-actions">
                                            <div className="step-progress-mini">
                                                <span>{getStepProgress(step.id)}%</span>
                                                <div className="mini-progress-bar"><div style={{ width: `${getStepProgress(step.id)}%` }}></div></div>
                                            </div>
                                            <select
                                                value={step.status}
                                                onChange={(e) => handleUpdateStepStatus(step, e.target.value)}
                                                className={`status-select ${step.status}`}
                                            >
                                                <option value="not_started">Not Started</option>
                                                <option value="active">Active</option>
                                                <option value="done">Done</option>
                                            </select>
                                            <button className="icon-btn" onClick={() => setEditingStepId(step.id)}><FaEdit /></button>
                                            <button className="icon-btn delete" onClick={() => handleDeleteStep(step.id)}><FaTrash /></button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            case 'tasks':
                return (
                    <div className="tab-content">
                        <div className="tab-header-actions">
                            <h3>Tasks</h3>
                            <button className="btn-small" onClick={() => setShowTaskInput(true)}><FaPlus /> Add Task</button>
                        </div>

                        {showTaskInput && (
                            <div className="new-step-input"> {/* Reusing Step input styles for consistency */}
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Task title..."
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className="step-input"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                                />
                                <button className="btn-save" onClick={handleCreateTask}><FaSave /></button>
                                <button className="btn-cancel" onClick={() => setShowTaskInput(false)}><FaTimes /></button>
                            </div>
                        )}

                        <div className="tasks-list">
                            {tasks.length === 0 ? <p className="text-gray">No tasks.</p> : tasks.map(task => (
                                <div key={task.id} className="task-item">
                                    <div className="task-left">
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'done'}
                                            onChange={() => handleToggleTaskStatus(task)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span className={task.status === 'done' ? 'line-through text-gray' : ''}>{task.title}</span>
                                    </div>
                                    <div className="task-right">
                                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                                        <button className="icon-btn delete" onClick={() => handleDeleteTask(task.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'documents':
                return (
                    <div className="tab-content">
                        <div className="tab-header-actions">
                            <h3>Documents</h3>
                            <label className="btn-small crm-btn-primary" style={{ cursor: 'pointer' }}>
                                <FaPlus /> Upload Doc
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                        <div className="docs-list">
                            {docs.length === 0 ? <p className="text-gray">No documents attached.</p> : docs.map(doc => (
                                <div key={doc.id} className="doc-item">
                                    <div className="doc-info-main">
                                        <FaFileAlt className="doc-icon" />
                                        <div className="doc-text">
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="doc-link">
                                                {doc.type} <span className="doc-date">({new Date(doc.created_at).toLocaleDateString()})</span>
                                            </a>
                                            <span className="doc-url-preview">{doc.file_url.split('/').pop()}</span>
                                        </div>
                                    </div>
                                    <button className="icon-btn delete" onClick={() => handleDeleteDoc(doc.id, doc.file_url)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'activity': return <div className="tab-content"><p>Activity Log (Coming Soon)</p></div>;
            default: return null;
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project');
        } else {
            window.location.href = '/admin/projects';
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
        if (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } else {
            setProject({ ...project, status: newStatus });
        }
    };

    const handleUpdateTimeline = async () => {
        const { error } = await supabase
            .from('projects')
            .update({
                start_date: timelineForm.start_date || null,
                deadline: timelineForm.deadline || null
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating timeline:', error);
            alert('Failed to update timeline');
        } else {
            setProject({
                ...project,
                start_date: timelineForm.start_date || null,
                deadline: timelineForm.deadline || null
            });
            setIsEditingTimeline(false);
        }
    };

    return (
        <div className="project-details-page">
            <div className="details-header">
                <Link to="/admin/projects" className="back-link"><FaArrowLeft /> Back to Projects</Link>
                <div className="title-section">
                    <h1>{project.title}</h1>
                    <div className="header-actions">
                        <select
                            value={project.status}
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            className={`status-select-lg ${project.status}`}
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed (Archived)</option>
                        </select>
                        <button className="btn-danger-outline" onClick={handleDeleteProject}>
                            <FaTrash /> Delete Project
                        </button>
                    </div>
                </div>
            </div>

            <div className="project-tabs">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><FaInfoCircle /> Overview</button>
                <button className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}><FaListUl /> Steps</button>
                <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}><FaCheckSquare /> Tasks</button>
                <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}><FaFileAlt /> Documents</button>
                <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}><FaHistory /> Activity</button>
            </div>

            <div className="tab-container">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProjectDetails;
