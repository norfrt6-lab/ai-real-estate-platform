'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Square,
  ChevronDown,
  Lightbulb,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: boolean;
}

interface SuggestedPrompt {
  label: string;
  prompt: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------
const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: 'Draft a lease reminder',
    prompt:
      'Write a professional email reminder for a tenant whose lease expires in 30 days, encouraging them to renew.',
    icon: '📄',
  },
  {
    label: 'Analyze rent pricing',
    prompt:
      'What factors should I consider when setting the monthly rent for a 2-bedroom apartment in a mid-sized US city? Give me a framework.',
    icon: '💰',
  },
  {
    label: 'Maintenance priority guide',
    prompt:
      'Explain how to prioritize maintenance requests. When should I treat something as an emergency vs. routine?',
    icon: '🔧',
  },
  {
    label: 'Tenant screening tips',
    prompt:
      'What are the most important criteria for screening a prospective tenant while staying legally compliant (Fair Housing Act)?',
    icon: '🪪',
  },
  {
    label: 'Generate property description',
    prompt:
      'Write an SEO-optimized property listing description for a 3-bedroom, 2-bathroom house with a backyard and updated kitchen in Austin, TX. Monthly rent: $2,800.',
    icon: '🏠',
  },
  {
    label: 'Late payment policy',
    prompt:
      'Help me draft a clear and professional late payment policy to include in a lease agreement, including grace period and fee structure.',
    icon: '⚠️',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Rough word count for reading-time estimate
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Copy button (with feedback)
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. HTTP context) — silent fail
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
      title="Copy message"
      aria-label={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Markdown-lite renderer (bold, inline code, code blocks, paragraphs)
// ---------------------------------------------------------------------------
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-3 rounded-lg bg-slate-950 border border-slate-700/50 p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed"
        >
          {lang && (
            <div className="mb-2 text-xs text-slate-500 font-sans">{lang}</div>
          )}
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      i++; // skip closing ```
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-white mt-4 mb-1">
          {line.slice(4)}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-white mt-4 mb-1">
          {line.slice(3)}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold text-white mt-4 mb-2">
          {line.slice(2)}
        </h1>,
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*•] /)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*•] /)) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 ml-4 space-y-1 list-none">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <InlineContent content={item} />
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const listItems: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(lines[i].replace(/^\d+\. /, ''));
        i++;
        num++;
      }
      elements.push(
        <ol key={`ol-${i}-${num}`} className="my-2 ml-4 space-y-1 list-none">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 text-xs font-bold text-blue-400 mt-0.5">
                {idx + 1}.
              </span>
              <InlineContent content={item} />
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-4 border-slate-700" />,
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Default paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed mb-1">
        <InlineContent content={line} />
      </p>,
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// Inline formatting: **bold**, `code`, *italic*
function InlineContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="rounded bg-slate-700 px-1 py-0.5 text-xs font-mono text-blue-300"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <em key={i} className="italic text-slate-300">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const words = wordCount(message.content);
  const readingTime = Math.max(1, Math.round(words / 200));

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ${
          isUser
            ? 'bg-blue-600 ring-blue-700'
            : 'bg-violet-700 ring-violet-800'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : message.error
            ? 'bg-red-900/30 border border-red-500/30 text-red-300 rounded-tl-sm'
            : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm'
        }`}
      >
        {/* Content */}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : message.isStreaming && !message.content ? (
          /* Typing indicator */
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" />
          </div>
        ) : (
          <MarkdownContent content={message.content} />
        )}

        {/* Streaming cursor */}
        {message.isStreaming && message.content && (
          <span className="inline-block h-4 w-0.5 bg-blue-400 animate-pulse ml-0.5 align-middle" />
        )}

        {/* Footer: timestamp + actions */}
        <div
          className={`mt-2 flex items-center gap-2 ${
            isUser ? 'justify-end' : 'justify-between'
          }`}
        >
          <span
            className={`text-xs ${
              isUser ? 'text-blue-200/70' : 'text-slate-500'
            }`}
          >
            {formatTime(message.timestamp)}
            {!isUser && !message.isStreaming && words > 50 && (
              <> · {readingTime} min read</>
            )}
          </span>

          {/* Copy button (assistant messages only, when not streaming) */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const SYSTEM_WELCOME = `Hello! I'm your **RealEstate AI assistant** — powered by GPT-4. I can help you with:

- 📄 **Drafting communications** — lease reminders, tenant emails, notices
- 💰 **Rent & pricing analysis** — market insights, pricing strategy
- 🔧 **Maintenance guidance** — prioritization, vendor selection tips
- 🪪 **Tenant screening** — fair housing compliance, screening criteria
- 📊 **Portfolio insights** — occupancy, revenue optimization
- ⚖️ **Lease & legal basics** — clauses, terms, best practices

How can I help you today?`;

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: SYSTEM_WELCOME,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Show/hide scroll-to-bottom button
  function handleScroll() {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollButton(distanceFromBottom > 200);
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setInput('');
      setShowSuggestions(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Add user message
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      // Add streaming assistant placeholder
      const assistantId = generateId();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsLoading(true);

      // Build conversation history for API
      const history = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            (errData as { error?: string }).error ||
              `Request failed with status ${res.status}`,
          );
        }

        // Handle streaming response
        if (res.headers.get('Content-Type')?.includes('text/event-stream') ||
            res.headers.get('Content-Type')?.includes('text/plain')) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) throw new Error('No response body.');

          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Handle SSE format (data: ...\n\n) or plain text stream
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data) as {
                    choices?: Array<{
                      delta?: { content?: string };
                    }>;
                  };
                  const delta =
                    parsed.choices?.[0]?.delta?.content ?? '';
                  accumulated += delta;
                } catch {
                  // Plain text delta (non-JSON SSE)
                  accumulated += data;
                }
              } else if (line && !line.startsWith(':')) {
                // Plain stream chunk
                accumulated += line;
              }
            }

            const finalContent = accumulated;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: finalContent, isStreaming: true }
                  : m,
              ),
            );
          }

          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false }
                : m,
            ),
          );
        } else {
          // Non-streaming JSON response
          const data = await res.json() as { reply?: string; message?: string; content?: string };
          const reply =
            data.reply ?? data.message ?? data.content ?? 'No response.';

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: reply, isStreaming: false }
                : m,
            ),
          );
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // User cancelled — finalise what we have
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isStreaming: false,
                    content:
                      m.content ||
                      '*(Response cancelled)*',
                  }
                : m,
            ),
          );
        } else {
          const errorMsg =
            (error as Error).message ||
            'Something went wrong. Please try again.';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `❌ **Error:** ${errorMsg}`,
                    isStreaming: false,
                    error: true,
                  }
                : m,
            ),
          );
        }
      } finally {
        setIsLoading(false);
        setAbortController(null);
        textareaRef.current?.focus();
      }
    },
    [isLoading, messages],
  );

  function handleStop() {
    abortController?.abort();
  }

  function handleClearChat() {
    setMessages([
      {
        id: generateId(),
        role: 'assistant',
        content: SYSTEM_WELCOME,
        timestamp: new Date(),
      },
    ]);
    setShowSuggestions(true);
    setInput('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="flex h-[calc(100vh-4rem-3rem)] flex-col gap-0 rounded-xl border border-slate-700/50 bg-slate-900 overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/80 px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 ring-2 ring-violet-700/50">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                RealEstate AI Assistant
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Powered by GPT-4 · {messages.length - 1} message
              {messages.length !== 2 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            title="Toggle suggestions"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Suggestions</span>
          </button>
          <button
            onClick={handleClearChat}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear chat"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Messages area                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth"
      >
        {/* Gradient fade at top */}
        <div className="pointer-events-none sticky top-0 z-10 h-8 w-full bg-gradient-to-b from-slate-900 to-transparent" />

        {/* Message list */}
        <div className="space-y-5 pb-2">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-32 right-6 z-20">
          <button
            onClick={() => scrollToBottom()}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors shadow-lg"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Suggested prompts                                                    */}
      {/* ------------------------------------------------------------------ */}
      {showSuggestions && messages.length <= 2 && !isLoading && (
        <div className="border-t border-slate-700/50 bg-slate-800/40 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0" />
            <p className="text-xs font-medium text-slate-400">
              Suggested prompts
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SUGGESTED_PROMPTS.map((sp) => (
              <button
                key={sp.label}
                onClick={() => sendMessage(sp.prompt)}
                className="flex items-start gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 text-left text-xs text-slate-300 hover:border-violet-500/40 hover:bg-slate-700/60 hover:text-white transition-all duration-150 group"
              >
                <span className="text-base leading-none mt-0.5 shrink-0">
                  {sp.icon}
                </span>
                <span className="line-clamp-2 group-hover:text-white transition-colors">
                  {sp.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Input area                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-t border-slate-700/50 bg-slate-800/80 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about property management…"
              rows={1}
              disabled={isLoading}
              className="w-full resize-none rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <p className="absolute bottom-1.5 right-3 text-xs text-slate-600 pointer-events-none select-none">
              {input.length > 0 && `${input.length} · `}⏎ to send
            </p>
          </div>

          {/* Send / Stop button */}
          {isLoading ? (
            <button
              onClick={handleStop}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 transition-colors shadow-md shadow-red-900/30"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 text-white fill-white" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors shadow-md shadow-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-600"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-2 text-center text-xs text-slate-600">
          AI responses are for guidance only.
          Always consult a qualified attorney for legal advice.
        </p>
      </div>
    </div>
  );
}
