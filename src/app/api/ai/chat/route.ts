import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { openai } from '@/lib/openai';

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------
const ChatRequestSchema = z.object({
  message: z
    .string({ required_error: 'Message is required.' })
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(4000, 'Message must be at most 4000 characters.'),

  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(8000),
      }),
    )
    .max(40, 'Conversation history must not exceed 40 messages.')
    .default([]),

  // Optional context injected by the client (e.g. current property/tenant)
  context: z
    .object({
      propertyTitle: z.string().optional(),
      tenantName: z.string().optional(),
      currentPage: z.string().optional(),
    })
    .optional()
    .nullable(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
function buildSystemPrompt(context?: ChatRequest['context']): string {
  const contextSection = context
    ? `
## Current Context
${context.currentPage ? `- Page: ${context.currentPage}` : ''}
${context.propertyTitle ? `- Property: ${context.propertyTitle}` : ''}
${context.tenantName ? `- Tenant: ${context.tenantName}` : ''}
`.trim()
    : '';

  return `You are an expert AI assistant embedded in **RealEstate AI** — a production-grade property management platform.

## Your Role
You help landlords, property managers, real estate agents, and tenants with:
- **Property management** — listings, pricing strategy, occupancy optimization
- **Tenant relations** — screening criteria, lease renewals, communication templates
- **Maintenance coordination** — prioritization, vendor selection, cost estimation
- **Financial guidance** — rent setting, late fees, ROI analysis, expense tracking
- **Legal & compliance** — Fair Housing Act basics, lease clauses, best practices
- **Document drafting** — professional emails, notices, lease addendums, reminders

## Behavior Guidelines
- Be **concise, professional, and actionable** — avoid filler text
- Use **markdown formatting** (bold, bullets, numbered lists, code blocks) for clarity
- When giving legal or financial advice, always include a **brief disclaimer** to consult a qualified professional
- If asked about a specific tenant, property, or payment, acknowledge that you don't have real-time database access and suggest the user check the relevant dashboard section
- Keep responses focused on real estate and property management topics
- If a request is off-topic, politely redirect to how you can help with property management

## Response Format
- Use **bold** for key terms and important points
- Use numbered lists for step-by-step instructions
- Use bullet points for feature lists or considerations
- Use code blocks for templates, email drafts, or structured documents
- Keep paragraphs short (2–3 sentences max)
${contextSection}

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
}

// ---------------------------------------------------------------------------
// POST /api/ai/chat
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest): Promise<NextResponse | Response> {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 },
      );
    }

    // ── Parse & validate body ────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload.' },
        { status: 400 },
      );
    }

    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, error: firstError?.message ?? 'Validation failed.' },
        { status: 422 },
      );
    }

    const { message, history, context } = parsed.data;

    // ── Build messages array ─────────────────────────────────────────────────
    // Keep the last N turns to stay within context window
    const MAX_HISTORY_TURNS = 20;
    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildSystemPrompt(context) },
      ...trimmedHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // ── OpenAI streaming call ────────────────────────────────────────────────
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
      user: session.user.id, // for OpenAI abuse monitoring
    });

    // ── SSE stream response ──────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            const finishReason = chunk.choices[0]?.finish_reason;

            if (delta) {
              // Emit as SSE data event
              const sseData = `data: ${JSON.stringify({
                choices: [{ delta: { content: delta } }],
              })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }

            if (finishReason === 'stop' || finishReason === 'length') {
              // Emit done signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              break;
            }

            // Handle content filter
            if (finishReason === 'content_filter') {
              const errEvent = `data: ${JSON.stringify({
                choices: [
                  {
                    delta: {
                      content:
                        '\n\n*This response was filtered by the content policy. Please rephrase your question.*',
                    },
                  },
                ],
              })}\n\n`;
              controller.enqueue(encoder.encode(errEvent));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              break;
            }
          }
        } catch (streamError) {
          // Emit an error SSE event so the client can handle it gracefully
          console.error('[POST /api/ai/chat] Stream error:', streamError);
          const errMsg =
            (streamError as Error).message || 'Stream interrupted unexpectedly.';
          const errEvent = `data: ${JSON.stringify({
            error: errMsg,
          })}\n\n`;
          controller.enqueue(encoder.encode(errEvent));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },

      cancel() {
        // Client disconnected — abort the OpenAI stream
        stream.controller.abort();
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // disable Nginx buffering
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[POST /api/ai/chat]', error);

    // Handle OpenAI-specific errors
    const err = error as { status?: number; message?: string; code?: string };

    if (err.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error:
            'OpenAI rate limit reached. Please wait a moment and try again.',
        },
        { status: 429 },
      );
    }

    if (err.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error:
            'OpenAI API key is invalid or missing. Please check your configuration.',
        },
        { status: 500 },
      );
    }

    if (err.code === 'context_length_exceeded') {
      return NextResponse.json(
        {
          success: false,
          error:
            'The conversation is too long. Please start a new chat or reduce the message length.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 },
    );
  }
}
