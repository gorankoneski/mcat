'use client';

import { useEffect, useRef, useState } from 'react';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

export default function CounselorChat({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput('');

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Counselor failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          content: `⚠️ Error: ${err instanceof Error ? err.message : 'unknown'}`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
            Start by asking about a concept you&apos;re stuck on, pasting a
            passage you found hard, or sharing your most recent exam result.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'self-end max-w-[85%] rounded-2xl bg-blue-600 px-4 py-2 text-white'
                : 'self-start max-w-[85%] whitespace-pre-wrap rounded-2xl border border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900'
            }
          >
            {m.content}
            {m.role === 'assistant' && busy && m === messages[messages.length - 1] && (
              <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="sticky bottom-0 flex gap-2 bg-white pb-2 pt-4 dark:bg-neutral-950"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask about a concept, a passage, or your exam result…"
          rows={3}
          className="flex-1 rounded-md border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Send
        </button>
      </form>
    </main>
  );
}
