'use client'

import React, { useRef, useEffect } from 'react';
import { Send, Terminal, MessageCircle, Mail, MoreVertical, X, Sparkles } from 'lucide-react';

type TriggerId = 'whatsapp' | 'telegram' | 'email';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStrip, MAX_QUERY_LENGTH } from '@/hooks/useCommandStrip';
import ProjectStatusCard from '@/components/telemetry-cards/ProjectStatusCard';
import FinancialMetricCard from '@/components/telemetry-cards/FinancialMetricCard';

interface CommandStripProps {
  projectName?: string;
  projectStage?: string;
}

const CommandStrip: React.FC<CommandStripProps> = ({ projectName = '', projectStage = '' }) => {
  const {
    query,
    setQuery,
    isProcessing,
    messages,
    showTriggers,
    handleSend,
    handleTrigger,
    toggleTriggers,
    clearMessages,
  } = useCommandStrip({ projectName, projectStage });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] safe-area-inset-bottom" role="region" aria-label="Command Strip">
      {/* Response Display Area (Mobile-First) */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="custom-scrollbar max-h-[60vh] overflow-y-auto border-t border-white/[0.07] bg-background/92 px-6 py-8 backdrop-blur-3xl"
            ref={scrollRef}
          >
            <div className="mx-auto max-w-2xl space-y-6 pb-4">
              <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={13} className="text-gold" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-gold">
                    Executive Intelligence Sync
                  </span>
                </div>
                <button
                  onClick={clearMessages}
                  aria-label="Clear transcript"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-[#cec9c1] transition-all duration-300 hover:border-teal/30 hover:text-teal"
                >
                  <X size={13} />
                </button>
              </div>

              {messages.map((m) => {
                // v6 UIMessage: concatenate all text parts for display
                const textContent = m.parts
                  .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                  .map((p) => p.text)
                  .join('');

                return (
                <div key={m.id} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] rounded-[1.2rem] rounded-tr-md border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                      <p className="font-sans text-[13px] leading-6 text-white/85">{textContent}</p>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      {textContent && (
                        <div className="max-w-[90%] rounded-[1.2rem] rounded-tl-md border border-gold/20 bg-[linear-gradient(180deg,rgba(196,163,90,0.08),rgba(12,12,12,0.85))] px-4 py-3">
                          <p className="font-mono text-[12px] leading-[1.6] text-gold/95">{textContent}</p>
                        </div>
                      )}

                      {/* Generative UI cards from tool parts (v6: type `tool-<name>`) */}
                      {m.parts.map((part, idx) => {
                        if (!part.type.startsWith('tool-')) return null;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const p = part as any;
                        const toolName = part.type.slice(5);
                        const key = p.toolCallId ?? `${m.id}-${idx}`;

                        if (p.state === 'output-available') {
                          const result = p.output;
                          if (toolName === 'getProjectStatus' && !result?.error) {
                            return <ProjectStatusCard key={key} {...result} />;
                          }
                          if (toolName === 'getFinancialMetrics' && !result?.error) {
                            return <FinancialMetricCard key={key} {...result} />;
                          }
                          if (result?.error) {
                            return (
                              <div
                                key={key}
                                className="rounded-[1rem] border border-signal-error/25 bg-signal-error/[0.06] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-signal-error"
                              >
                                ERROR &middot; {result.error}
                              </div>
                            );
                          }
                          return null;
                        }

                        if (p.state === 'output-error') {
                          return (
                            <div
                              key={key}
                              className="rounded-[1rem] border border-signal-error/25 bg-signal-error/[0.06] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-signal-error"
                            >
                              ERROR &middot; {p.errorText}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={key}
                            className="flex animate-pulse items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gold/50"
                          >
                            <Terminal size={12} />
                            Executing {toolName}...
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                );
              })}

              {isProcessing && !messages[messages.length - 1]?.parts.some((p) => p.type === 'text') && (
                <div className="flex animate-pulse items-center gap-3 text-gold/60">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(196,163,90,0.65)]"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.26em]">
                    Agent thinking...
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-white/[0.07] bg-background/85 px-5 py-5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <form onSubmit={handleSend} className="flex items-center gap-3" role="search">
            <button
              type="button"
              onClick={toggleTriggers}
              aria-label="Toggle trigger shortcuts"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                showTriggers
                  ? 'border-gold/30 bg-gold/[0.08] text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'border-white/[0.08] bg-white/[0.02] text-[#cec9c1] hover:border-teal/30 hover:bg-teal/[0.04] hover:text-teal'
              }`}
            >
              <MoreVertical size={17} />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isProcessing ? 'Syncing...' : 'Query executive agent...'}
                disabled={isProcessing}
                aria-label="Command query"
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.02] px-5 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-white placeholder:text-white/25 outline-none transition-all focus:border-gold/40 focus:ring-1 focus:ring-gold/20 disabled:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              aria-label="Send query"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold text-black shadow-[0_0_24px_rgba(196,163,90,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              <Send size={17} />
            </button>
          </form>

          {/* Trigger shortcuts — three-tier hover with semantic icon colours */}
          <AnimatePresence>
            {showTriggers && (
              <motion.nav
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { id: 'whatsapp' as const, icon: MessageCircle, label: 'WhatsApp', iconTone: 'text-signal-live' },
                  { id: 'telegram' as const, icon: Send, label: 'Telegram', iconTone: 'text-teal' },
                  { id: 'email' as const, icon: Mail, label: 'Email', iconTone: 'text-gold' },
                ].map((trigger) => (
                  <button
                    key={trigger.id}
                    onClick={() => handleTrigger(trigger.id as TriggerId)}
                    className="group flex flex-col items-center justify-center gap-2 rounded-[1.2rem] border border-white/[0.08] bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal/25 hover:bg-teal/[0.04]"
                  >
                    <trigger.icon size={22} className={`${trigger.iconTone} transition-transform group-hover:scale-105`} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#888] group-hover:text-white">
                      {trigger.label}
                    </span>
                  </button>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CommandStrip;
