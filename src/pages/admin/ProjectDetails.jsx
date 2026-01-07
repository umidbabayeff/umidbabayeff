/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-return */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckSquare, FaFileAlt, FaHistory, FaListUl, FaInfoCircle, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaFolder, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './ProjectDetails.css';

const ProjectDetails = () => {
    const { t, i18n } = useTranslation();
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

    // Folder State
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [showFolderInput, setShowFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

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

        void fetchProjectData();
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
            alert(t('admin.project_details.steps.create_error', 'Failed to create step'));
        } else {
            setSteps([...steps, data]);
            setNewStepTitle('');
            setShowStepInput(false);
        }
    };

    const handleDeleteStep = async (stepId) => {
        if (!window.confirm(t('admin.project_details.steps.delete_confirm', 'Are you sure? This will delete the step.'))) return;

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
                alert(t('admin.project_details.steps.pending_tasks_alert', { count: uncompletedTasks.length, defaultValue: `Cannot mark as Done. ${uncompletedTasks.length} tasks are still pending.` }));
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
            alert(t('admin.project_details.tasks.create_error', 'Failed to create task'));
        } else {
            setTasks([...tasks, data]);
            setNewTaskTitle('');
            setShowTaskInput(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm(t('admin.project_details.tasks.delete_confirm', 'Delete this task?'))) return;
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

    // --- Document & Folder Handlers ---

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        console.log('Creating folder:', newFolderName, 'Under parent:', currentFolderId);

        const { data, error } = await supabase
            .from('documents')
            .insert([{
                project_id: id,
                name: newFolderName,
                is_folder: true,
                parent_id: currentFolderId,
                status: 'active',
                type: 'folder' // Explicitly set type
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating folder:', error);
            alert(`Failed to create folder: ${error.message || JSON.stringify(error)}`);
        } else {
            console.log('Folder created:', data);
            setDocs([data, ...docs]);
            setNewFolderName('');
            setShowFolderInput(false);
        }
    };

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
                    name: file.name, // Use original filename for display
                    is_folder: false,
                    parent_id: currentFolderId,
                    type: file.type.includes('pdf') ? 'Invoice' : 'Document',
                    file_url: publicUrl,
                    status: 'active'
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            // 4. Update UI
            setDocs([docData, ...docs]);
            alert(t('admin.project_details.documents.upload_success', 'File uploaded successfully!'));

        } catch (error) {
            console.error('Error uploading file:', error);
            alert(t('admin.project_details.documents.upload_failed', 'Upload failed') + ': ' + error.message);
        } finally {
            e.target.value = null; // Reset input
        }
    };

    const handleDeleteDoc = async (docId, fileUrl, isFolder) => {
        console.log('Attempting Standard Delete:', { docId, fileUrl, isFolder });

        const msg = isFolder
            ? t('admin.project_details.documents.delete_folder_confirm', 'Delete this folder and ALL its contents?')
            : t('admin.project_details.documents.delete_doc_confirm', 'Delete this document?');

        if (!window.confirm(msg)) return;

        try {
            // 1. Try to clean up storage (Client-side Best Effort)
            // If this fails, we proceed anyway.
            try {
                if (isFolder) {
                    // For folders, we'd ideally list files and delete them.
                    // To keep it robust, we'll just try to delete the DB record.
                    // Storage cleanup for folders can be done via a cron job or manual script later if needed.
                    console.log('Skipping recursive storage delete for folder robustness.');
                } else if (fileUrl) {
                    const urlParts = fileUrl.split('project-files/');
                    if (urlParts.length >= 2) {
                        const path = urlParts[1];
                        console.log('Deleting file from storage:', path);
                        await supabase.storage.from('project-files').remove([path]);
                    }
                }
            } catch (storageErr) {
                console.warn('Storage cleanup failed (ignoring):', storageErr);
            }

            // 2. Delete from DB (Relying on ON DELETE CASCADE for folders)
            console.log('Deleting from DB:', docId);
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', docId);

            if (dbError) {
                console.error('DB Delete Error:', dbError);
                // Throw the error so we see it in the alert
                throw dbError;
            }

            console.log('Delete successful');
            // Update UI
            setDocs(prev => prev.filter(d => d.id !== docId));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert(`Delete failed: ${error.message || JSON.stringify(error)}`);
        }
    };

    // Helper to get current folder path
    const getBreadcrumbs = () => {
        const path = [];
        let curr = currentFolderId;
        while (curr) {
            const folder = docs.find(d => d.id === curr);
            if (folder) {
                path.unshift(folder);
                curr = folder.parent_id;
            } else {
                break;
            }
        }
        return path;
    };

    if (loading) return <div className="p-10 text-white">{t('admin.common.loading', 'Loading...')}</div>;
    if (!project) return <div className="p-10 text-white">{t('admin.projects.create_error', 'Project not found')}</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="tab-content overview-grid">
                        <div className="info-card">
                            <h3>{t('admin.project_details.project_info', 'Project Info')}</h3>
                            <div className="info-row"><span className="label">{t('admin.project_details.client', 'Client')}:</span><span className="value">{project.clients?.name}</span></div>
                            <div className="info-row"><span className="label">{t('admin.project_details.type', 'Type')}:</span><span className="value">{project.type}</span></div>
                            <div className="info-row"><span className="label">{t('admin.project_details.status', 'Status')}:</span><span className="status-badge-inline">{t(`admin.projects.status.${project.status}`, project.status)}</span></div>
                            <div className="info-row"><span className="label">{t('admin.project_details.price', 'Price')}:</span><span className="value money">${project.price}</span></div>
                        </div>
                        <div className="info-card">
                            <div className="card-header-actions">
                                <h3>{t('admin.project_details.timeline', 'Timeline')}</h3>
                                {!isEditingTimeline ? (
                                    <button className="icon-btn-small" onClick={() => setIsEditingTimeline(true)} title={t('admin.common.edit', 'Edit')}>
                                        <FaEdit />
                                    </button>
                                ) : (
                                    <div className="edit-actions-mini">
                                        <button className="icon-btn-small save" onClick={() => void handleUpdateTimeline()} title={t('admin.common.save', 'Save')}><FaSave /></button>
                                        <button className="icon-btn-small cancel" onClick={() => setIsEditingTimeline(false)} title={t('admin.common.cancel', 'Cancel')}><FaTimes /></button>
                                    </div>
                                )}
                            </div>

                            {isEditingTimeline ? (
                                <div className="timeline-edit-form">
                                    <div className="info-row-edit">
                                        <span className="label">{t('admin.project_details.start', 'Start')}:</span>
                                        <input
                                            type="date"
                                            value={timelineForm.start_date || ''}
                                            onChange={e => setTimelineForm({ ...timelineForm, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="info-row-edit">
                                        <span className="label">{t('admin.project_details.deadline', 'Deadline')}:</span>
                                        <input
                                            type="date"
                                            value={timelineForm.deadline || ''}
                                            onChange={e => setTimelineForm({ ...timelineForm, deadline: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="info-row"><span className="label">{t('admin.project_details.start', 'Start')}:</span><span className="value">{project.start_date ? new Date(project.start_date).toLocaleDateString(i18n.language) : t('admin.common.not_set', 'Not set')}</span></div>
                                    <div className="info-row"><span className="label">{t('admin.project_details.deadline', 'Deadline')}:</span><span className="value">{project.deadline ? new Date(project.deadline).toLocaleDateString(i18n.language) : t('admin.common.not_set', 'Not set')}</span></div>
                                </>
                            )}

                            <div className="progress-section">
                                <span className="label">{t('admin.project_details.total_progress', 'Total Progress')}: {tasks.length ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0}%</span>
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
                            <h3>{t('admin.project_details.steps.title', 'Project Steps')}</h3>
                            <button className="btn-small" onClick={() => setShowStepInput(true)}><FaPlus /> {t('admin.project_details.steps.add_btn', 'Add Step')}</button>
                        </div>

                        {showStepInput && (
                            <div className="new-step-input">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('admin.project_details.steps.input_placeholder', 'Step title...')}
                                    value={newStepTitle}
                                    onChange={e => setNewStepTitle(e.target.value)}
                                    className="step-input"
                                />
                                <button className="btn-save" onClick={() => void handleCreateStep()}><FaSave /></button>
                                <button className="btn-cancel" onClick={() => setShowStepInput(false)}><FaTimes /></button>
                            </div>
                        )}

                        <ul className="steps-list">
                            {steps.length === 0 ? <p className="text-gray">{t('admin.project_details.steps.empty', 'No steps yet. Add one to get started.')}</p> : steps.map(step => (
                                <li key={step.id} className="step-item">
                                    <div className="step-header">
                                        <div className="step-info">
                                            <span className="step-sequence">{step.order}</span>
                                            {editingStepId === step.id ? (
                                                <input
                                                    className="edit-step-input"
                                                    defaultValue={step.title}
                                                    onBlur={(e) => void handleUpdateStepTitle(step.id, e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') void handleUpdateStepTitle(step.id, e.currentTarget.value); }}
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
                                                onChange={(e) => void handleUpdateStepStatus(step, e.target.value)}
                                                className={`status-select ${step.status}`}
                                            >
                                                <option value="not_started">{t('admin.project_details.status_options.not_started', 'Not Started')}</option>
                                                <option value="active">{t('admin.project_details.status_options.active', 'Active')}</option>
                                                <option value="done">{t('admin.project_details.status_options.done', 'Done')}</option>
                                            </select>
                                            <button className="icon-btn" onClick={() => setEditingStepId(step.id)}><FaEdit /></button>
                                            <button className="icon-btn delete" onClick={() => void handleDeleteStep(step.id)}><FaTrash /></button>
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
                            <h3>{t('admin.project_details.tasks.title', 'Tasks')}</h3>
                            <button className="btn-small" onClick={() => setShowTaskInput(true)}><FaPlus /> {t('admin.project_details.tasks.add_btn', 'Add Task')}</button>
                        </div>

                        {showTaskInput && (
                            <div className="new-step-input"> {/* Reusing Step input styles for consistency */}
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('admin.project_details.tasks.input_placeholder', 'Task title...')}
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className="step-input"
                                    onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateTask(); }}
                                />
                                <button className="btn-save" onClick={() => void handleCreateTask()}><FaSave /></button>
                                <button className="btn-cancel" onClick={() => setShowTaskInput(false)}><FaTimes /></button>
                            </div>
                        )}

                        <div className="tasks-list">
                            {tasks.length === 0 ? <p className="text-gray">{t('admin.project_details.tasks.empty', 'No tasks.')}</p> : tasks.map(task => (
                                <div key={task.id} className="task-item">
                                    <div className="task-left">
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'done'}
                                            onChange={() => void handleToggleTaskStatus(task)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span className={task.status === 'done' ? 'line-through text-gray' : ''}>{task.title}</span>
                                    </div>
                                    <div className="task-right">
                                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                                        <button className="icon-btn delete" onClick={() => void handleDeleteTask(task.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'documents': {
                const filteredDocs = docs.filter(d => (d.parent_id || null) === currentFolderId);
                const breadcrumbs = getBreadcrumbs();

                return (
                    <div className="tab-content">
                        <div className="tab-header-actions">
                            <h3>{t('admin.project_details.documents.title', 'Documents')}</h3>
                            <div className="doc-actions">
                                <button className="btn-small" onClick={() => setShowFolderInput(true)}>
                                    <FaPlus /> {t('admin.project_details.documents.new_folder', 'New Folder')}
                                </button>
                                <label className="btn-small crm-btn-primary" style={{ cursor: 'pointer' }}>
                                    <FaPlus /> {t('admin.project_details.documents.upload_doc', 'Upload Doc')}
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        onChange={(e) => void handleFileUpload(e)}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Breadcrumbs */}
                        <div className="breadcrumbs">
                            <span
                                className={`breadcrumb-item ${!currentFolderId ? 'active' : ''}`}
                                onClick={() => setCurrentFolderId(null)}
                            >
                                {t('admin.project_details.documents.root', 'Root')}
                            </span>
                            {breadcrumbs.map(folder => (
                                <React.Fragment key={folder.id}>
                                    <FaChevronRight className="breadcrumb-prop" />
                                    <span
                                        className={`breadcrumb-item ${currentFolderId === folder.id ? 'active' : ''}`}
                                        onClick={() => setCurrentFolderId(folder.id)}
                                    >
                                        {folder.name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>

                        {showFolderInput && (
                            <div className="new-step-input">
                                <FaFolder className="text-gray" style={{ fontSize: '1.2rem' }} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('admin.project_details.documents.folder_placeholder', 'Folder name...')}
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    className="step-input"
                                    onKeyDown={e => { if (e.key === 'Enter') void handleCreateFolder(); }}
                                />
                                <button className="btn-save" onClick={() => void handleCreateFolder()}><FaSave /></button>
                                <button className="btn-cancel" onClick={() => setShowFolderInput(false)}><FaTimes /></button>
                            </div>
                        )}

                        <div className="docs-list">
                            {filteredDocs.length === 0 ? (
                                <p className="text-gray" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                                    {t('admin.project_details.documents.empty_folder', 'This folder is empty.')}
                                </p>
                            ) : (
                                filteredDocs
                                    .sort((a, b) => (a.is_folder === b.is_folder ? 0 : a.is_folder ? -1 : 1)) // Folders first
                                    .map(doc => (
                                        <div
                                            key={doc.id}
                                            className={`doc-item ${doc.is_folder ? 'is-folder' : ''}`}
                                            onClick={() => doc.is_folder && setCurrentFolderId(doc.id)}
                                            style={{ cursor: doc.is_folder ? 'pointer' : 'default' }}
                                        >
                                            <div className="doc-info-main">
                                                {doc.is_folder ? (
                                                    <FaFolder className="doc-icon folder" style={{ color: '#fbbf24' }} />
                                                ) : (
                                                    <FaFileAlt className="doc-icon" />
                                                )}
                                                <div className="doc-text">
                                                    {doc.is_folder ? (
                                                        <span className="doc-name">{doc.name}</span>
                                                    ) : (
                                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="doc-link" onClick={e => e.stopPropagation()}>
                                                            {doc.name || doc.type}
                                                        </a>
                                                    )}
                                                    <span className="doc-date">
                                                        {new Date(doc.created_at).toLocaleDateString(i18n.language)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="icon-btn delete"
                                                onClick={(e) => { e.stopPropagation(); void handleDeleteDoc(doc.id, doc.file_url, doc.is_folder); }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                );
            }
            case 'activity': return <div className="tab-content"><p>{t('admin.project_details.activity.coming_soon', 'Activity Log (Coming Soon)')}</p></div>;
            default: return null;
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm(t('admin.project_details.actions.delete_project_confirm', 'Are you sure you want to delete this project? This action cannot be undone.'))) return;

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Error deleting project:', error);
            alert(t('admin.common.delete_error', 'Failed to delete project'));
        } else {
            window.location.href = '/admin/projects';
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
        if (error) {
            console.error('Error updating status:', error);
            alert(t('admin.common.update_error', 'Failed to update status'));
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
            alert(t('admin.project_details.timeline_error', 'Failed to update timeline'));
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
                <Link to="/admin/projects" className="back-link"><FaArrowLeft /> {t('admin.project_details.back_to_projects', 'Back to Projects')}</Link>
                <div className="title-section">
                    <h1>{project.title}</h1>
                    <div className="header-actions">
                        <select
                            value={project.status}
                            onChange={(e) => void handleUpdateStatus(e.target.value)}
                            className={`status-select-lg ${project.status}`}
                        >
                            <option value="draft">{t('admin.projects.status.draft', 'Draft')}</option>
                            <option value="active">{t('admin.projects.status.active', 'Active')}</option>
                            <option value="paused">{t('admin.projects.status.paused', 'Paused')}</option>
                            <option value="completed">{t('admin.projects.status.completed', 'Completed')}</option>
                        </select>
                        <button className="btn-danger-outline" onClick={() => void handleDeleteProject()}>
                            <FaTrash /> {t('admin.project_details.actions.delete_project', 'Delete Project')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="project-tabs">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><FaInfoCircle /> {t('admin.project_details.tabs.overview', 'Overview')}</button>
                <button className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}><FaListUl /> {t('admin.project_details.tabs.steps', 'Steps')}</button>
                <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}><FaCheckSquare /> {t('admin.project_details.tabs.tasks', 'Tasks')}</button>
                <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}><FaFileAlt /> {t('admin.project_details.tabs.documents', 'Documents')}</button>
                <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}><FaHistory /> {t('admin.project_details.tabs.activity', 'Activity')}</button>
            </div>

            <div className="tab-container">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProjectDetails;
