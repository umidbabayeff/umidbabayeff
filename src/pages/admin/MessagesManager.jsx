/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaInbox, FaSearch, FaUserPlus, FaCheck, FaBuilding, FaTag, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './MessagesManager.css';

const MessagesManager = () => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Convert Modal State
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedMsg, setSelectedMsg] = useState(null);
    const [convertForm, setConvertForm] = useState({
        clientName: '',
        clientEmail: '',
        clientCompany: '',
        projectTitle: '',
        projectType: '',
        projectPrice: 0
    });

    useEffect(() => {
        void fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching messages:', error);
        else setMessages(data || []);
        setLoading(false);
    };

    const handleOpenConvert = (msg) => {
        setSelectedMsg(msg);
        setConvertForm({
            clientName: msg.name ?? '',
            clientEmail: msg.email ?? '',
            clientCompany: msg.company ?? '',
            projectTitle: `${t('admin.inbox.defaults.project_for', 'Project for')} ${msg.company ?? msg.name}`,
            projectType: msg.type ?? t('admin.inbox.defaults.web_dev', 'Web Development'),
            projectPrice: 0
        });
        setShowConvertModal(true);
    };

    const handleConvert = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Client
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    name: convertForm.clientName,
                    email: convertForm.clientEmail,
                    company: convertForm.clientCompany,
                    status: 'lead'
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Create Project
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert([{
                    client_id: client.id,
                    title: convertForm.projectTitle,
                    type: convertForm.projectType,
                    price: convertForm.projectPrice,
                    status: 'active'
                }])
                .select()
                .single();

            if (projectError) throw projectError;

            // 3. Create Default Steps
            const defaultSteps = [
                { title: t('admin.inbox.defaults.steps.discovery', 'Discovery & Planning'), order: 1 },
                { title: t('admin.inbox.defaults.steps.design', 'Design & Prototyping'), order: 2 },
                { title: t('admin.inbox.defaults.steps.development', 'Development'), order: 3 },
                { title: t('admin.inbox.defaults.steps.content', 'Content Integration'), order: 4 },
                { title: t('admin.inbox.defaults.steps.testing', 'Testing & QA'), order: 5 },
                { title: t('admin.inbox.defaults.steps.deployment', 'Deployment'), order: 6 }
            ];

            const stepsToInsert = defaultSteps.map(s => ({
                project_id: project.id,
                title: s.title,
                "order": s.order,
                status: 'not_started'
            }));

            const { error: stepsError } = await supabase
                .from('steps')
                .insert(stepsToInsert);

            if (stepsError) throw stepsError;

            // Success
            alert(t('admin.inbox.alerts.success', 'Client, Project, and Steps created successfully!'));

            // Update local state and DB status
            const { error: updateError } = await supabase
                .from('messages')
                .update({ is_converted: true })
                .eq('id', selectedMsg.id);

            if (updateError) {
                console.error('Error updating message status:', updateError);
            } else {
                setMessages(messages.map(m => m.id === selectedMsg.id ? { ...m, is_converted: true } : m));
            }

            setShowConvertModal(false);

        } catch (error) {
            console.error('Error converting:', error);
            alert(t('admin.inbox.alerts.process_error', 'Failed to process conversion: ') + error.message);
        }
    };

    const handleUndoConvert = async (msg) => {
        if (!window.confirm(t('admin.inbox.alerts.confirm_undo', 'Mark this message as not converted? This won\'t delete the created project/client.'))) return;

        const { error } = await supabase
            .from('messages')
            .update({ is_converted: false })
            .eq('id', msg.id);

        if (error) {
            console.error('Error undoing conversion:', error);
            alert(t('admin.inbox.alerts.undo_error', 'Failed to undo'));
        } else {
            setMessages(messages.map(m => m.id === msg.id ? { ...m, is_converted: false } : m));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.inbox.alerts.confirm_delete', 'Are you sure you want to delete this message? This cannot be undone.'))) return;

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting message:', error);
            alert(t('admin.inbox.alerts.delete_error', 'Failed to delete message'));
        } else {
            setMessages(messages.filter(m => m.id !== id));
        }
    };

    const filteredMessages = messages.filter(msg =>
        (msg.name?.toLowerCase().includes(searchTerm.toLowerCase())) ??
        (msg.email?.toLowerCase().includes(searchTerm.toLowerCase())) ??
        (msg.message?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>{t('admin.inbox.title', 'Inbox')}</h1>
                    <p>{t('admin.inbox.subtitle', 'Manage inquiries and convert them to projects')}</p>
                </div>
            </div>

            <div className="crm-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder={t('admin.inbox.search_placeholder', 'Search messages...')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="messages-grid">
                {loading ? <p>{t('admin.inbox.loading', 'Loading messages...')}</p> : filteredMessages.length === 0 ? <p>{t('admin.inbox.empty', 'No messages found.')}</p> : filteredMessages.map(msg => (
                    <div key={msg.id} className={`message-card-full ${msg.is_converted ? 'converted' : ''}`}>
                        <div className="msg-top-row">
                            <div className="msg-sender">
                                <h3>{msg.name}</h3>
                                <span className="msg-email-tag">{msg.email}</span>
                            </div>
                            <span className="msg-date-badge">{new Date(msg.created_at).toLocaleDateString(i18n.language)}</span>
                        </div>

                        <div className="msg-details-row">
                            {msg.company && (
                                <span className="detail-tag">
                                    <FaBuilding /> {msg.company}
                                </span>
                            )}
                            {msg.type && (
                                <span className="detail-tag">
                                    <FaTag /> {msg.type}
                                </span>
                            )}
                        </div>

                        <div className="msg-body">
                            {msg.message}
                        </div>

                        <div className="msg-actions-right">
                            {msg.is_converted ? (
                                <div className="converted-actions">
                                    <span className="converted-badge"><FaCheck /> {t('admin.inbox.converted', 'Converted')}</span>
                                    <button className="crm-btn-secondary" onClick={() => void handleUndoConvert(msg)}>
                                        {t('admin.inbox.undo_btn', 'Undo')}
                                    </button>
                                </div>
                            ) : (
                                <button className="crm-btn-primary convert-btn" onClick={() => handleOpenConvert(msg)}>
                                    <FaUserPlus /> {t('admin.inbox.convert_btn', 'Convert to Project')}
                                </button>
                            )}
                            <button className="crm-btn-danger icon-btn-large" onClick={() => void handleDelete(msg.id)} title={t('admin.inbox.delete_title', 'Delete Message')}>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Conversion Modal */}
            {
                showConvertModal && (
                    <div className="crm-modal-overlay">
                        <div className="crm-modal">
                            <h2>{t('admin.inbox.modal.title', 'Convert Inquiry')}</h2>
                            <p>{t('admin.inbox.modal.desc', 'Create a new client and project for')} <strong>{selectedMsg?.name}</strong>.</p>

                            <form onSubmit={(e) => void handleConvert(e)}>
                                <div className="form-group-section">
                                    <h3>{t('admin.inbox.modal.client_details', 'Client Details')}</h3>
                                    <div className="form-group">
                                        <label>{t('admin.inbox.modal.name', 'Name')}</label>
                                        <input required value={convertForm.clientName} onChange={e => setConvertForm({ ...convertForm, clientName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.inbox.modal.email', 'Email')}</label>
                                        <input required value={convertForm.clientEmail} onChange={e => setConvertForm({ ...convertForm, clientEmail: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.inbox.modal.company', 'Company')}</label>
                                        <input value={convertForm.clientCompany} onChange={e => setConvertForm({ ...convertForm, clientCompany: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group-section">
                                    <h3>{t('admin.inbox.modal.project_details', 'Project Details')}</h3>
                                    <div className="form-group">
                                        <label>{t('admin.inbox.modal.project_title', 'Project Title')}</label>
                                        <input required value={convertForm.projectTitle} onChange={e => setConvertForm({ ...convertForm, projectTitle: e.target.value })} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('admin.inbox.modal.type', 'Type')}</label>
                                            <input value={convertForm.projectType} onChange={e => setConvertForm({ ...convertForm, projectType: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('admin.inbox.modal.price', 'Price Estimate')}</label>
                                            <input type="number" value={convertForm.projectPrice} onChange={e => setConvertForm({ ...convertForm, projectPrice: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowConvertModal(false)}>{t('admin.inbox.modal.cancel', 'Cancel')}</button>
                                    <button type="submit" className="crm-btn-primary">{t('admin.inbox.modal.create_btn', 'Create Client & Project')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MessagesManager;
