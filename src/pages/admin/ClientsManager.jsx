/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import WhatsAppChat from '../../components/WhatsAppChat';
import { FaPlus, FaSearch, FaPhone, FaEnvelope, FaBuilding, FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './ClientsManager.css';

const ClientsManager = () => {
    const { t, i18n } = useTranslation();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'chat'

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'lead',
        internal_notes: '',
        last_contact_date: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        void fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setClients(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase.from('clients').update(formData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('clients').insert([formData]).select().single();
                if (error) throw error;

                // Automation: Send Welcome Message
                if (window.confirm(t('admin.clients.send_welcome_q', 'Send welcome WhatsApp message?'))) {
                    void handleSendWelcome(data);
                }
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', email: '', phone: '', company: '', status: 'lead', internal_notes: '', last_contact_date: '' });
            void fetchClients();
        } catch (error) {
            alert(t('admin.clients.save_error', 'Error saving client'));
            console.error(error);
        }
    };

    const handleEdit = (client) => {
        setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            status: client.status,
            internal_notes: client.internal_notes || '',
            last_contact_date: client.last_contact_date || ''
        });
        setEditingId(client.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t('admin.clients.confirm_delete', 'Are you sure?'))) return;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (!error) void fetchClients();
    };

    const handleSendWelcome = async (client) => {
        if (!client.phone) {
            alert('Client has no phone number');
            return;
        }

        // Format phone number: remove non-digits, strip leading 0, default to 994 for AZ
        let cleanPhone = client.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.substring(1);
        }
        if (cleanPhone.length === 9) {
            cleanPhone = '994' + cleanPhone;
        }

        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: cleanPhone + '@c.us',
                    message: t('admin.clients.welcome_msg', 'Hello! This is Parketera, we received your request.'),
                    clientId: client.id
                }),
            });

            const result = await response.json();
            if (response.ok) {
                // alert('Welcome message sent!'); 
                setActiveTab('chat');
            } else {
                const proceed = window.confirm(`Failed to send message: ${result.error || response.statusText}. Open chat anyway?`);
                if (proceed) setActiveTab('chat');
            }
        } catch (error) {
            console.error(error);
            const proceed = window.confirm('Error sending message (API may not be running locally). Open chat anyway?');
            if (proceed) setActiveTab('chat');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.company?.toLowerCase().includes(filter.toLowerCase())
    );

    const getStatusLabel = (status) => {
        switch (status) {
            case 'lead': return t('admin.clients.status.lead', 'Lead');
            case 'active': return t('admin.clients.status.active', 'Active');
            case 'paused': return t('admin.clients.status.paused', 'Paused');
            case 'archived': return t('admin.clients.status.archived', 'Archived');
            default: return String(status || '');
        }
    };

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>{t('admin.clients.title', 'Clients')}</h1>
                    <p>{t('admin.clients.subtitle', 'Manage your leads and active clients')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`crm-btn-secondary ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <FaWhatsapp /> WhatsApp
                    </button>
                    <button
                        className={`crm-btn-secondary ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        List
                    </button>
                    <button className="crm-btn-primary" onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', email: '', phone: '', company: '', status: 'lead', internal_notes: '', last_contact_date: '' });
                        setShowForm(true);
                    }}>
                        <FaPlus /> {t('admin.clients.add_btn', 'Add Client')}
                    </button>
                </div>
            </div>

            {activeTab === 'chat' ? (
                <WhatsAppChat />
            ) : (
                <>
                    <div className="crm-controls">
                        <div className="search-bar">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder={t('admin.clients.search_placeholder', 'Search clients...')}
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    {showForm && (
                        <div className="crm-modal-overlay">
                            <div className="crm-modal">
                                <h2>{editingId ? t('admin.clients.modal.edit_title', 'Edit Client') : t('admin.clients.modal.new_title', 'New Client')}</h2>
                                <form onSubmit={(e) => void handleSubmit(e)}>
                                    <div className="form-group">
                                        <label>{t('admin.clients.modal.name', 'Name *')}</label>
                                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('admin.clients.modal.email', 'Email')}</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('admin.clients.modal.phone', 'Phone')}</label>
                                            <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('admin.clients.modal.company', 'Company')}</label>
                                            <input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('admin.clients.modal.status', 'Status')}</label>
                                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="lead">{t('admin.clients.status.lead', 'Lead')}</option>
                                                <option value="active">{t('admin.clients.status.active', 'Active')}</option>
                                                <option value="paused">{t('admin.clients.status.paused', 'Paused')}</option>
                                                <option value="archived">{t('admin.clients.status.archived', 'Archived')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('admin.clients.modal.last_contact', 'Last Contact Date')}</label>
                                            <input type="date" value={formData.last_contact_date} onChange={e => setFormData({ ...formData, last_contact_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.clients.modal.notes', 'Internal Notes')}</label>
                                        <textarea
                                            className="modal-textarea"
                                            rows="3"
                                            value={formData.internal_notes}
                                            onChange={e => setFormData({ ...formData, internal_notes: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setShowForm(false)}>{t('admin.clients.modal.cancel', 'Cancel')}</button>
                                        <button type="submit" className="crm-btn-primary">{t('admin.clients.modal.save', 'Save')}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="clients-grid">
                        {loading ? <p>{t('admin.clients.loading', 'Loading...')}</p> : filteredClients.map(client => (
                            <div key={client.id} className={`client-card status-${client.status}`}>
                                <div className="client-header">
                                    <h3>{client.name}</h3>
                                    <span className={`status-badge ${client.status}`}>{getStatusLabel(client.status)}</span>
                                </div>
                                {client.company && <div className="client-detail"><FaBuilding /> {client.company}</div>}
                                {client.email && <div className="client-detail"><FaEnvelope /> {client.email}</div>}
                                {client.phone && <div className="client-detail"><FaPhone /> {client.phone}</div>}

                                {client.last_contact_date && (
                                    <div className="client-detail highlight-yellow">
                                        <span className="label">{t('admin.clients.card.last_contact', 'Last Contact:')}</span> {new Date(client.last_contact_date).toLocaleDateString(i18n.language)}
                                    </div>
                                )}
                                {client.internal_notes && (
                                    <div className="client-notes-preview">
                                        <strong>{t('admin.clients.card.notes', 'Notes:')}</strong> {client.internal_notes}
                                    </div>
                                )}

                                <div className="card-footer">
                                    <button onClick={() => handleEdit(client)}>{t('admin.clients.card.edit', 'Edit')}</button>
                                    <button onClick={() => { void handleSendWelcome(client); }} className="text-green" title="Send Welcome WhatsApp">
                                        <FaWhatsapp /> Welcome
                                    </button>
                                    <button onClick={() => { void handleDelete(client.id); }} className="text-red">{t('admin.clients.card.delete', 'Delete')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ClientsManager;
