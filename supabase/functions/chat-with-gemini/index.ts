// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { messages, context } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set')
        }

        // Construct the prompt manually
        const history = messages.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n');
        const systemPrompt = `You are a helpful AI assistant for the website. 
    The user is currently browsing this page: ${context || 'Unknown'}.
    Be concise, friendly, and helpful. 
    If they ask about jobs, refer to the Careers page.
    If they ask about services, refer to the Services page.
    
    Conversation History:
    ${history}
    
    User: ${messages[messages.length - 1].content}
    Assistant:`

        // Call Gemini API via REST (No SDK needed)
        // Using 'gemini-flash-latest' as it is the stable alias that works with free tier
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        // Handle API errors
        if (!response.ok) {
            throw new Error(data.error?.message || 'Gemini API Error');
        }

        const reply = data.candidates[0].content.parts[0].text;

        return new Response(
            JSON.stringify({ reply }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        console.error("Function Error:", error);
        // RETURN ERROR AS CHAT MESSAGE so user sees it in the UI
        return new Response(
            JSON.stringify({ reply: `⚠️ GOOGLE API ERROR: ${error.message}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
