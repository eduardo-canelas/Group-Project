import React, { startTransition, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Alert, GhostChip, GlassCard, PrimaryButton, SecondaryButton, SectionHeading, TextArea } from './ui';
import api from '../lib/api';

function formatWarning(message) {
  if (!message) {
    return '';
  }

  return `Live fallback mode: ${message}`;
}

function buildAssistantReply(briefing) {
  if (!briefing) {
    return null;
  }

  const bullets = (briefing.recommendations || [])
    .slice(0, 3)
    .map((item) => item.title || item.detail)
    .filter(Boolean);

  const footer = [
    briefing.operationalPulse,
    briefing.riskPackages?.length ? `${briefing.riskPackages.length} risk package${briefing.riskPackages.length === 1 ? '' : 's'} tracked.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    headline: briefing.headline,
    summary: briefing.executiveSummary || briefing.narrative || briefing.operationalPulse,
    bullets,
    footer,
  };
}

export default function AIAssistant({
  kicker = '',
  title,
  description,
  suggestions,
  perspective,
  className = '',
}) {
  const [prompt, setPrompt] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scope = useRef(null);

  useGSAP(
    () => {
      if (!briefing) {
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return;
      }

      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('.briefing-chat-message', { autoAlpha: 0, y: 18, duration: 0.34, stagger: 0.08 })
        .from('.briefing-chat-suggestions > *', { autoAlpha: 0, y: 10, duration: 0.24, stagger: 0.04 }, '-=0.18');

      return () => timeline.kill();
    },
    { scope, dependencies: [briefing], revertOnUpdate: true },
  );

  const reply = useMemo(() => buildAssistantReply(briefing), [briefing]);

  const handleAsk = async (nextPrompt) => {
    const finalPrompt = (nextPrompt ?? prompt).trim();
    if (!finalPrompt) {
      setError('Type a question first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/ai/ops-briefing', {
        prompt: finalPrompt,
        perspective,
      });

      startTransition(() => {
        setBriefing(response.data.briefing);
        setMeta({
          source: response.data.source,
          model: response.data.model,
          generatedAt: response.data.generatedAt,
          warning: response.data.warning,
        });
        setPrompt(finalPrompt);
      });
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      const details = requestError.response?.data?.details || requestError.response?.data?.error;
      setError([message, details].filter(Boolean).join(': ') || 'AI briefing is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={scope}>
      <GlassCard className={`briefing-console briefing-chat-console ${className}`.trim()}>
        <div className="briefing-console-glow" />

        <div className="relative z-10 flex flex-col gap-4">
          <SectionHeading
            as="h3"
            stacked
            kicker={kicker}
            title={title}
            description={description}
          />

          <div className="briefing-chat-suggestions flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="briefing-suggestion"
                onClick={() => handleAsk(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="briefing-input-shell briefing-chat-input-shell">
            <TextArea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="briefing-textarea briefing-chat-textarea"
              placeholder="Ask about risks, routes, drivers, or handoff..."
            />

            <div className="mt-3 flex flex-wrap gap-3">
              <PrimaryButton type="button" onClick={() => handleAsk()} disabled={loading}>
                {loading ? 'Thinking...' : 'Send'}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setBriefing(null);
                  setMeta(null);
                  setPrompt('');
                }}
                disabled={loading || (!briefing && !prompt)}
              >
                Clear
              </SecondaryButton>
            </div>
          </div>

          {loading ? (
            <div className="briefing-loading-shell briefing-chat-message briefing-chat-message-assistant" aria-live="polite">
              <p className="text-sm font-semibold text-[color:var(--text)]">Thinking...</p>
              <div className="briefing-loading-bar is-short" />
              <div className="briefing-loading-bar" />
            </div>
          ) : null}

          {error ? <Alert tone="error">{error}</Alert> : null}
          {meta?.warning ? <Alert tone="info">{formatWarning(meta.warning)}</Alert> : null}

          {!briefing && !loading ? (
            <div className="briefing-chat-empty">
              <p>AI assistant is ready for a quick question.</p>
            </div>
          ) : null}

          {briefing && reply ? (
            <div className="briefing-shell briefing-chat-shell">
              <div className="briefing-chat-message briefing-chat-message-user">
                <p className="briefing-chat-label">You</p>
                <p className="briefing-chat-copy">{prompt}</p>
              </div>

              <div className="briefing-chat-message briefing-chat-message-assistant">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="briefing-chat-label">AI assistant</p>
                  <GhostChip>{meta?.generatedAt ? new Date(meta.generatedAt).toLocaleTimeString() : 'Just now'}</GhostChip>
                </div>

                {reply.headline ? <p className="briefing-chat-headline">{reply.headline}</p> : null}
                {reply.summary ? <p className="briefing-chat-copy">{reply.summary}</p> : null}

                {reply.bullets.length ? (
                  <div className="briefing-chat-bullets">
                    {reply.bullets.map((item) => (
                      <p key={item} className="briefing-chat-bullet">{item}</p>
                    ))}
                  </div>
                ) : null}

                {reply.footer ? <p className="briefing-chat-footnote">{reply.footer}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
