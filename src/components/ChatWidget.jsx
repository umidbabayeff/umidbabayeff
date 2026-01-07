/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import React, { useState, useEffect, useRef } from 'react';
import { BiX, BiSend, BiBot, BiUser } from 'react-icons/bi';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './ChatWidget.css';

const ChatWidget = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { id: 'init', role: 'assistant', content: 'Hi! I am your AI assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Load history (optional, for now just session based or fresh)
    /* 
    useEffect(() => {
        if (isOpen) {
            // fetch messages from supabase if needed
        }
    }, [isOpen]);
    */

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, { ...userMsg, id: Date.now() }]);
        setInput('');
        setLoading(true);

        try {
            // Save to DB
            await supabase.from('bot_messages').insert([
                { role: 'user', content: userMsg.content }
            ]);

            // Simulate AI Response (Place your API call here)
            // const response = await fetch('/api/chat', ...);

            // Call Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
                body: {
                    messages: [...messages, userMsg],
                    context: location.pathname
                }
            });

            if (error) throw error;

            const reply = data.reply ?? "Sorry, I couldn't get a response.";
            const aiMsg = { role: 'assistant', content: reply };

            setMessages(prev => [...prev, { ...aiMsg, id: Date.now() + 1 }]);
            setLoading(false);

            // Save AI to DB
            await supabase.from('bot_messages').insert([
                { role: 'assistant', content: reply }
            ]);

        } catch (error) {
            console.error(error);
            setLoading(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: "⚠️ Error: " + (error.message ?? "Could not connect to AI. Check Console.")
            }]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-widget-container">
            <div className="chat-header">
                <div className="chat-title">
                    <BiBot className="chat-logo" />
                    <span>AI Assistant</span>
                </div>
                <button className="chat-close" onClick={onClose}>
                    <BiX />
                </button>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-message ${msg.role}`}>
                        <div className="message-content">
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="chat-message assistant">
                        <div className="thinking-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={(e) => void handleSend(e)}>
                <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}>
                    <BiSend />
                </button>
            </form>
        </div>
    );
};

export default ChatWidget;
