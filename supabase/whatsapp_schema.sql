-- Create tables for WhatsApp integration
CREATE TABLE IF NOT EXISTS public.whatsapp_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES public.whatsapp_chats(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('admin', 'client')) NOT NULL,
    status TEXT DEFAULT 'sent',
    -- 'sent', 'delivered', 'read'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
-- Create policies (modify as needed for your auth model)
CREATE POLICY "Allow authenticated users to read chats" ON public.whatsapp_chats FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert chats" ON public.whatsapp_chats FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update chats" ON public.whatsapp_chats FOR
UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read messages" ON public.whatsapp_messages FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert messages" ON public.whatsapp_messages FOR
INSERT TO authenticated WITH CHECK (true);
-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime
ADD TABLE public.whatsapp_messages;
-- Trigger to update last_message on new message
CREATE OR REPLACE FUNCTION public.handle_new_whatsapp_message() RETURNS TRIGGER AS $$ BEGIN
UPDATE public.whatsapp_chats
SET last_message = NEW.text,
    updated_at = NEW.created_at
WHERE id = NEW.chat_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_new_whatsapp_message
AFTER
INSERT ON public.whatsapp_messages FOR EACH ROW EXECUTE FUNCTION public.handle_new_whatsapp_message();