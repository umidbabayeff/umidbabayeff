import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './Dashboard.css';

const Dashboard = () => {
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) console.error('Error fetching messages:', error);
            else setRecentMessages(data);
            setLoading(false);
        };

        fetchMessages();
    }, []);

    return (
        <div className="dashboard">
            <h1>Admin Dashboard</h1>
            <p>Welcome back! Here is an overview of recent activity.</p>

            <div className="section-header">
                <h2>Recent Messages</h2>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="card-grid">
                    {recentMessages.length === 0 ? (
                        <p>No messages yet.</p>
                    ) : (
                        recentMessages.map(msg => (
                            <div key={msg.id} className="message-card">
                                <div className="msg-header">
                                    <strong>{msg.name}</strong>
                                    <span className="msg-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="msg-email">{msg.email}</div>
                                <p className="msg-content">"{msg.message}"</p>
                                <div className="msg-meta">Type: {msg.type} | Company: {msg.company || 'N/A'}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
