'use client';

import { useChat } from '@ai-sdk/react';
import { faArrowUp, faSpinner } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRef, useState } from 'react';
import { LogoMark } from '@/components/Logo';

/**
 * Basic Ask Genwel chat — text only, grounded in the user's real data via
 * server-side tools (see /api/chat). The full voice + agent version comes
 * post-launch; this is the launch v1.
 */

const SUGGESTIONS = [
  'How much did I spend on eating out this month?',
  'What are my subscriptions costing me?',
  'Where can I save money?',
  'What is my current net worth?',
];

export default function AskGenwelChat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === 'submitted' || status === 'streaming';

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput('');
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: 'smooth' }),
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <LogoMark size={32} />
            </span>
            <h2 className="text-lg font-semibold text-foreground">
              Ask Genwel anything about your money
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              It reads your real accounts, spending and subscriptions to answer.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const text = message.parts
              .filter((p) => p.type === 'text')
              .map((p) => ('text' in p ? p.text : ''))
              .join('');
            const toolCalls = message.parts.filter((p) =>
              p.type.startsWith('tool-'),
            );
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-foreground'
                  }`}
                >
                  {/* "checking your data…" indicator while tools run */}
                  {!isUser && toolCalls.length > 0 && !text && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="h-3 w-3 animate-spin"
                      />
                      Checking your accounts…
                    </p>
                  )}
                  {text && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {text}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card px-4 py-2.5">
              <FontAwesomeIcon
                icon={faSpinner}
                className="h-3.5 w-3.5 animate-spin text-muted-foreground"
              />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending, subscriptions, balances…"
          className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faArrowUp} className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Ask Genwel can be wrong and is not regulated financial advice.
      </p>
    </div>
  );
}
