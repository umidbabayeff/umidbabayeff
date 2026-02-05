
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * @typedef {Object} VercelRequest
 * @property {string} method
 * @property {Object} body
 * @property {string} [body.typeWebhook]
 * @property {Object} [body.senderData]
 * @property {string} [body.senderData.chatId]
 * @property {Object} [body.messageData]
 * @property {Object} [body.messageData.textMessageData]
 * @property {string} [body.messageData.textMessageData.textMessage]
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const payload = req.body;

    // Verify structure from Green-API
    if (!payload?.typeWebhook) {
        // Respond quickly to verification or empty requests
        return res.status(200).send('OK');
    }

    try {
        if (payload.typeWebhook === 'incomingMessageReceived') {
            const senderData = payload.senderData;
            const messageData = payload.messageData;

            // Extract phone number (remove @c.us if present)
            const waChatId = senderData.chatId; // e.g., 79991234567@c.us
            // We need to map this phone number to a client in our database
            // Assuming 'phone' in clients table matches the format or we clean it up. 
            // For simplicity, let's assume strict matching or simple cleaning.

            // Clean phone number: remove non-digits
            const phoneNumber = waChatId.replace(/\D/g, '');

            // Find client by phone
            // NOTE: This relies on phone numbers being unique and formatted correctly in the clients table.
            // You might need a more robust matching logic.
            /** @type {{ data: { id: string }, error: any }} */
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .ilike('phone', `%${phoneNumber}%`) // Simple partial match, adjust as needed
                .limit(1)
                .single();

            if (clientError || !client) {
                console.log(`Client not found for phone: ${phoneNumber}`);
                return res.status(200).send('Client not found, message ignored');
            }

            // Find or create chat
            /** @type {{ data: { id: string } | null, error: { code: string } | null }} */
            let { data: chat, error: chatError } = await supabase
                .from('whatsapp_chats')
                .select('id')
                .eq('client_id', client.id)
                .single();

            // Handle potential error explicitly if needed, or ignore since we just check !chat
            if (chatError && /** @type {{ code: string }} */ (chatError).code !== 'PGRST116') {
                // Log or handle real errors that aren't "not found"
                console.error("Error finding chat:", chatError);
            }

            if (!chat) {
                const incomingText = messageData.textMessageData?.textMessage ?? '';
                /** @type {{ data: { id: string } | null, error: any }} */
                const { data: newChat, error: createError } = await supabase
                    .from('whatsapp_chats')
                    .insert([{ client_id: client.id, last_message: incomingText }])
                    .select()
                    .single();
                if (createError) throw createError;
                chat = newChat;
            }

            // Insert message
            const text = messageData.textMessageData?.textMessage ?? 'Media message (not supported yet)';

            const { error: msgError } = await supabase
                .from('whatsapp_messages')
                .insert([
                    {
                        chat_id: chat.id,
                        text: text,
                        sender_type: 'client',
                        status: 'delivered', // Incoming is always delivered to us
                    }
                ]);

            if (msgError) throw msgError;
        }

        return res.status(200).send('OK');

    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: /** @type {Error} */ (error).message });
    }
}
