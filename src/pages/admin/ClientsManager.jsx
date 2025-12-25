import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FaPlus, FaSearch, FaPhone, FaEnvelope, FaBuilding } from 'react-icons/fa';
import './ClientsManager.css';

const ClientsManager = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showForm, setShowForm] = useState(false);

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
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setClients(data);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase.from('clients').update(formData).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('clients').insert([formData]);
                if (error) throw error;
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({ name: '', email: '', phone: '', company: '', status: 'lead', internal_notes: '', last_contact_date: '' });
            fetchClients();
        } catch (error) {
            alert('Error saving client');
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
        if (!confirm('Are you sure?')) return;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (!error) fetchClients();
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.company?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div>
                    <h1>Clients</h1>
                    <p>Manage your leads and active clients</p>
                </div>
                <button className="crm-btn-primary" onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', email: '', phone: '', company: '', status: 'lead', internal_notes: '', last_contact_date: '' });
                    setShowForm(true);
                }}>
                    <FaPlus /> Add Client
                </button>
            </div>

            <div className="crm-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            {showForm && (
                <div className="crm-modal-overlay">
                    <div className="crm-modal">
                        <h2>{editingId ? 'Edit Client' : 'New Client'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company</label>
                                    <input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="lead">Lead</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Last Contact Date</label>
                                    <input type="date" value={formData.last_contact_date} onChange={e => setFormData({ ...formData, last_contact_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Internal Notes</label>
                                <textarea
                                    className="modal-textarea"
                                    rows="3"
                                    value={formData.internal_notes}
                                    onChange={e => setFormData({ ...formData, internal_notes: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="crm-btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="clients-grid">
                {loading ? <p>Loading...</p> : filteredClients.map(client => (
                    <div key={client.id} className={`client-card status-${client.status}`}>
                        <div className="client-header">
                            <h3>{client.name}</h3>
                            <span className={`status-badge ${client.status}`}>{client.status}</span>
                        </div>
                        {client.company && <div className="client-detail"><FaBuilding /> {client.company}</div>}
                        {client.email && <div className="client-detail"><FaEnvelope /> {client.email}</div>}
                        {client.phone && <div className="client-detail"><FaPhone /> {client.phone}</div>}

                        {client.last_contact_date && (
                            <div className="client-detail highlight-yellow">
                                <span className="label">Last Contact:</span> {new Date(client.last_contact_date).toLocaleDateString()}
                            </div>
                        )}
                        {client.internal_notes && (
                            <div className="client-notes-preview">
                                <strong>Notes:</strong> {client.internal_notes}
                            </div>
                        )}

                        <div className="card-footer">
                            <button onClick={() => handleEdit(client)}>Edit</button>
                            <button onClick={() => handleDelete(client.id)} className="text-red">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientsManager;
