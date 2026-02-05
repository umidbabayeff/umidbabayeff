/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './WhatsAppChat.css';
import { FaPaperPlane, FaUserCircle, FaCheck, FaCheckDouble } from 'react-icons/fa';

/**
 * WhatsApp Chat Component
 * 
 * Displays a list of clients who have started a WhatsApp chat or can be chatted with.
 * Uses Supabase Realtime to update messages instantly.
 */
const WhatsAppChat = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchChats = async () => {
        setLoading(true);
        // Join with clients table to get names
        const { data, error } = await supabase
            .from('whatsapp_chats')
            .select(`
                *,
                clients (name, phone, company)
            `)
            .order('updated_at', { ascending: false });

        if (error) console.error('Error fetching chats:', error);
        else setChats(data || []);
        setLoading(false);
    };

    const fetchMessages = async (chatId) => {
        const { data, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching messages:', error);
        else setMessages(data || []);
    };

    // Fetch initial list of chats
    useEffect(() => {
        const loadChats = async () => {
            await fetchChats();
        };
        void loadChats();

        // Realtime subscription for CHATS list updates (e.g. new chat created)
        const chatSubscription = supabase
            .channel('public:whatsapp_chats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats' }, () => {
                void fetchChats(); // Refresh list on change
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(chatSubscription);
        };
    }, []);

    // Fetch messages when active chat changes
    useEffect(() => {
        if (!activeChat) return;

        const loadMessages = async () => {
            await fetchMessages(activeChat.id);
        };
        void loadMessages();

        // Realtime subscription for MESSAGES in the active chat
        const messageSubscription = supabase
            .channel(`chat:${activeChat.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'whatsapp_messages',
                filter: `chat_id=eq.${activeChat.id}`
            }, (payload) => {
                setMessages((prev) => [...prev, payload.new]);
                // Scroll to bottom logic here if needed
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(messageSubscription);
        };
    }, [activeChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const text = newMessage;
        setNewMessage(''); // Clear input immediately

        // 1. Optimistic UI update (optional, but good UX)
        // We'll rely on Realtime here for simplicity, or add a temporary message

        // 2. Call Vercel Function to send
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: (activeChat.clients?.phone || '') + '@c.us', // Format phone number
                    message: text,
                    clientId: activeChat.client_id
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                alert('Failed to send: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Send error:', error);
            alert('Error sending message');
        }
    };

    return (
        <div className="wa-chat-container">
            <div className="wa-sidebar">
                <div className="wa-sidebar-header">
                    <h3>WhatsApp Chats</h3>
                </div>
                <div className="wa-chat-list">
                    {loading ? <p className="loading-text">Loading...</p> : chats.map(chat => (
                        <div
                            key={chat.id}
                            className={`wa-chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                            onClick={() => setActiveChat(chat)}
                        >
                            <div className="wa-avatar">
                                <FaUserCircle />
                            </div>
                            <div className="wa-chat-info">
                                <div className="wa-chat-name">{chat.clients?.name || 'Unknown Client'}</div>
                                <div className="wa-chat-last-msg">{chat.last_message || 'No messages yet'}</div>
                            </div>
                            <div className="wa-chat-time">
                                {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                    {chats.length === 0 && !loading && (
                        <p className="no-chats">No active chats found.</p>
                    )}
                </div>
            </div>

            <div className="wa-main">
                {activeChat ? (
                    <>
                        <div className="wa-header">
                            <div className="wa-avatar">
                                <FaUserCircle />
                            </div>
                            <div className="wa-header-info">
                                <h3>{activeChat.clients?.name}</h3>
                                <span>{activeChat.clients?.phone}</span>
                            </div>
                        </div>

                        <div className="wa-messages-area">
                            {messages.map(msg => (
                                <div key={msg.id} className={`wa-message ${msg.sender_type}`}>
                                    <div className="wa-message-bubble">
                                        {msg.text}
                                        <div className="wa-message-meta">
                                            <span className="wa-time">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.sender_type === 'admin' && (
                                                <span className="wa-status">
                                                    {msg.status === 'read' ? <FaCheckDouble className="read" /> : <FaCheck />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="wa-input-area">
                            <form onSubmit={(e) => void handleSendMessage(e)}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit">
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="wa-empty-state">
                        <p>Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppChat;
