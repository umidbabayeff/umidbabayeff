
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GREEN_API_ID = process.env.GREEN_API_ID_INSTANCE;
const GREEN_API_TOKEN = process.env.GREEN_API_API_TOKEN;

/**
 * @typedef {Object} VercelRequest
 * @property {string} method
 * @property {Object} body
 * @property {string} [body.chatId]
 * @property {string} [body.message]
 * @property {string} [body.clientId]
 */

/**
 * @typedef {Object} VercelResponse
 * @property {function(number): VercelResponse} status
 * @property {function(Object|string): void} json
 * @property {function(string): void} send
 */

/**
 * @param {VercelRequest} req
 * @param {VercelResponse} res
 */
export default async function handler(req, res) {
    // Debug: Check Environment Variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GREEN_API_ID || !GREEN_API_TOKEN) {
        console.error('Missing Environment Variables');
        return res.status(500).json({
            error: 'Server Misconfiguration: Missing Environment Variables',
            details: {
                hasUrl: !!SUPABASE_URL,
                hasKey: !!SUPABASE_SERVICE_ROLE_KEY,
                hasGreenId: !!GREEN_API_ID,
                hasGreenToken: !!GREEN_API_TOKEN
            }
        });
    }

    // Initialize Supabase Admin Client inside handler to handle errors gracefully
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { chatId, message, clientId } = req.body;

    if (!chatId || !message || !clientId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Send message via Green-API
        const apiUrl = `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: chatId, // Ensure this is formatted as '1234567890@c.us'
                message: message,
            }),
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = /** @type {{ message: string }} */ (await response.json());

        if (!response.ok) {
            throw new Error((data?.message) ?? 'Failed to send message via Green-API');
        }

        // 2. Save message to Supabase
        // First, find or create the chat session
        /** @type {{ data: { id: string } | null, error: { code: string } | null }} */
        let { data: chat, error: chatError } = await supabase
            .from('whatsapp_chats')
            .select('id')
            .eq('client_id', clientId)
            .single();

        if (chatError && /** @type {{ code: string }} */ (chatError).code !== 'PGRST116') { // PGRST116 is "no rows found"
            throw new Error('Error finding chat: ' + JSON.stringify(chatError));
        }

        if (!chat) {
            /** @type {{ data: { id: string } | null, error: any }} */
            const { data: newChat, error: createError } = await supabase
                .from('whatsapp_chats')
                .insert([{ client_id: clientId, last_message: message }])
                .select()
                .single();

            if (createError) throw createError;
            chat = newChat;
        }

        // Insert the message
        const { error: msgError } = await supabase
            .from('whatsapp_messages')
            .insert([
                {
                    chat_id: chat.id,
                    text: message,
                    sender_type: 'admin',
                    status: 'sent',
                },
            ]);

        if (msgError) throw msgError;

        return res.status(200).json({ success: true, apiResponse: data });

    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        const err = /** @type {Error} */ (error);
        const errorMessage = err.message ?? 'Unknown error';
        return res.status(500).json({
            error: errorMessage,
            debug: {
                receivedChatId: chatId,
                greenApiUrl: `.../sendMessage/${GREEN_API_TOKEN ? '***' : 'MISSING'}`
            }
        });
    }
}
