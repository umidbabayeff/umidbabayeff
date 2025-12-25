import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaInbox, FaSearch, FaUserPlus, FaCheck, FaBuilding, FaTag, FaPaperPlane, FaTrash } from 'react-icons/fa';
import './MessagesManager.css';

const MessagesManager = () => {
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
        fetchMessages();
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
            clientName: msg.name || '',
            clientEmail: msg.email || '',
            clientCompany: msg.company || '',
            projectTitle: `Project for ${msg.company || msg.name}`,
            projectType: msg.type || 'Web Development',
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
                { title: 'Discovery & Planning', order: 1 },
                { title: 'Design & Prototyping', order: 2 },
                { title: 'Development', order: 3 },
                { title: 'Content Integration', order: 4 },
                { title: 'Testing & QA', order: 5 },
                { title: 'Deployment', order: 6 }
            ];

            const stepsToInsert = defaultSteps.map(s => ({
                project_id: project.id,
                title: s.title,
                "order": s.order, // key is 'order', needs quoting in JS object if using direct postgres? no, supabase handles it. 
                // schema has "order" integer
                status: 'not_started'
            }));

            // Note: "order" is a reserved keyword in some contexts, but Supabase JS client usually handles object keys fine. 
            // If it fails, might need to quote it in the object? JS doesn't care.

            const { error: stepsError } = await supabase
                .from('steps')
                .insert(stepsToInsert);

            if (stepsError) throw stepsError;

            // Success
            alert('Client, Project, and Steps created successfully!');

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
            alert('Failed to process conversion: ' + error.message);
        }
    };

    const handleUndoConvert = async (msg) => {
        if (!window.confirm('Mark this message as not converted? This won\'t delete the created project/client.')) return;

        const { error } = await supabase
            .from('messages')
            .update({ is_converted: false })
            .eq('id', msg.id);

        if (error) {
            console.error('Error undoing conversion:', error);
            alert('Failed to undo');
        } else {
            setMessages(messages.map(m => m.id === msg.id ? { ...m, is_converted: false } : m));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message? This cannot be undone.')) return;

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        } else {
            setMessages(messages.filter(m => m.id !== id));
        }
    };

    const filteredMessages = messages.filter(msg =>
        (msg.name && msg.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (msg.email && msg.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (msg.message && msg.message.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>Inbox</h1>
                    <p>Manage inquiries and convert them to projects</p>
                </div>
            </div>

            <div className="crm-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="messages-grid">
                {loading ? <p>Loading messages...</p> : filteredMessages.length === 0 ? <p>No messages found.</p> : filteredMessages.map(msg => (
                    <div key={msg.id} className={`message-card-full ${msg.is_converted ? 'converted' : ''}`}>
                        <div className="msg-top-row">
                            <div className="msg-sender">
                                <h3>{msg.name}</h3>
                                <span className="msg-email-tag">{msg.email}</span>
                            </div>
                            <span className="msg-date-badge">{new Date(msg.created_at).toLocaleDateString()}</span>
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
                                    <span className="converted-badge"><FaCheck /> Converted</span>
                                    <button className="crm-btn-secondary" onClick={() => handleUndoConvert(msg)}>
                                        Undo
                                    </button>
                                </div>
                            ) : (
                                <button className="crm-btn-primary convert-btn" onClick={() => handleOpenConvert(msg)}>
                                    <FaUserPlus /> Convert to Project
                                </button>
                            )}
                            <button className="crm-btn-danger icon-btn-large" onClick={() => handleDelete(msg.id)} title="Delete Message">
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
                            <h2>Convert Inquiry</h2>
                            <p>Create a new client and project for <strong>{selectedMsg?.name}</strong>.</p>

                            <form onSubmit={handleConvert}>
                                <div className="form-group-section">
                                    <h3>Client Details</h3>
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input required value={convertForm.clientName} onChange={e => setConvertForm({ ...convertForm, clientName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input required value={convertForm.clientEmail} onChange={e => setConvertForm({ ...convertForm, clientEmail: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Company</label>
                                        <input value={convertForm.clientCompany} onChange={e => setConvertForm({ ...convertForm, clientCompany: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group-section">
                                    <h3>Project Details</h3>
                                    <div className="form-group">
                                        <label>Project Title</label>
                                        <input required value={convertForm.projectTitle} onChange={e => setConvertForm({ ...convertForm, projectTitle: e.target.value })} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Type</label>
                                            <input value={convertForm.projectType} onChange={e => setConvertForm({ ...convertForm, projectType: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Price Estimate</label>
                                            <input type="number" value={convertForm.projectPrice} onChange={e => setConvertForm({ ...convertForm, projectPrice: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowConvertModal(false)}>Cancel</button>
                                    <button type="submit" className="crm-btn-primary">Create Client & Project</button>
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
