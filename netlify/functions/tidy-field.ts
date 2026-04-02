import type { Context } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPT = `You are helping property hosts write their registration for Sustainable Backyards 2026, a sustainable property open day event run by Sustainable Taranaki in New Zealand.

The host has spoken or typed rough notes. Clean up their text into clear, well-written sentences suitable for an event programme. Keep their authentic voice and all their content. Fix grammar, add punctuation, improve flow. Do not add information they didn't mention. Return only the tidied text, with no preamble or explanation.`;

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    const { text, fieldHint } = (await request.json()) as { text: string; fieldHint: string };

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Field: ${fieldHint}\n\nNotes to tidy:\n${text}`,
        },
      ],
    });

    const tidied = (message.content[0] as { type: string; text: string }).text.trim();

    return new Response(JSON.stringify({ tidied }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Error tidying text:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to tidy text',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    );
  }
};
