import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Alert, GhostChip, PrimaryButton, SecondaryButton } from './ui';
import api from '../lib/api';

function WordReveal({ text }) {
  if (!text) return null;
  return (
    <>
      {text.split(' ').map((word, i) => (
        <React.Fragment key={i}>
          <span className="briefing-word">{word}</span>
          {' '}
        </React.Fragment>
      ))}
    </>
  );
}

function buildAssistantReply(briefing) {
  if (!briefing) return null;
  const riskPackages = (briefing.riskPackages || []).filter((item) => item.status !== 'delivered');
  const bullets = (briefing.recommendations || [])
    .slice(0, 3)
    .map((item) => item.title || item.detail)
    .filter(Boolean);
  const footer = [
    briefing.operationalPulse,
    riskPackages.length
      ? `${riskPackages.length} active package${riskPackages.length === 1 ? '' : 's'} tracked.`
      : '',
  ].filter(Boolean).join(' ');
  return {
    headline: briefing.headline,
    summary: briefing.executiveSummary || briefing.narrative || briefing.operationalPulse,
    bullets,
    footer,
    riskPackages,
    recommendations: briefing.recommendations || [],
  };
}

function getAssistantPackageName(item) {
  return item?.displayName || item?.description || (item?.packageId ? `Package ID ${item.packageId}` : 'this package');
}

function getAssistantPackageMeta(item) {
  return item?.packageId && item.packageId !== 'Legacy record'
    ? `Package ID: ${item.packageId}`
    : 'Package ID not listed';
}

export default function AIAssistant({
  kicker = '',
  title,
  description,
  suggestions,
  perspective,
  className = '',
  actionPlan = [],
  assistantIntent = null,
  onJumpToWorkspace,
  onFocusPackage,
}) {
  const [prompt, setPrompt] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scope = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useGSAP(
    () => {
      if (!briefing) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl
        .from('.briefing-chat-message', { autoAlpha: 0, y: 18, duration: 0.34, stagger: 0.08 })
        .from(
          '.briefing-chat-message-assistant .briefing-word',
          { autoAlpha: 0, y: 5, duration: 0.2, stagger: 0.008, ease: 'power2.out' },
          '-=0.16',
        )
        .from('.briefing-chat-suggestions > *', { autoAlpha: 0, y: 10, duration: 0.24, stagger: 0.04 }, '-=0.08');
      return () => tl.kill();
    },
    { scope, dependencies: [briefing], revertOnUpdate: true },
  );

  const reply = useMemo(() => buildAssistantReply(briefing), [briefing]);
  const guidedActions = useMemo(() => actionPlan.slice(0, 3), [actionPlan]);

  const submitPrompt = useCallback(async (promptText) => {
    const finalPrompt = promptText.trim();
    if (!finalPrompt) {
      setError('Type a question first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/ai/ops-briefing', { prompt: finalPrompt, perspective });
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
  }, [perspective]);

  const handleAsk = useCallback((nextPrompt) => {
    return submitPrompt(nextPrompt ?? prompt);
  }, [prompt, submitPrompt]);

  useEffect(() => {
    const intentPrompt = assistantIntent?.prompt?.trim();
    if (!intentPrompt) return;
    setPrompt(intentPrompt);
    textareaRef.current?.focus();
    void submitPrompt(intentPrompt);
  }, [assistantIntent?.id, assistantIntent?.prompt, submitPrompt]);

  const askAboutAction = (item) => {
    const packageName = getAssistantPackageName(item);
    const actionPrompt = [
      `Guide me through the next step for ${packageName}.`,
      item.packageId ? `Package ID: ${item.packageId}.` : '',
      item.title,
      item.nextStepDetail || item.detail,
      item.route ? `Route: ${item.route}.` : '',
    ].filter(Boolean).join(' ');
    void handleAsk(actionPrompt);
  };

  const handleCopy = () => {
    if (!reply) return;
    const text = [reply.headline, reply.summary, ...reply.bullets, reply.footer]
      .filter(Boolean)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setBriefing(null);
    setMeta(null);
    setPrompt('');
    setCopied(false);
  };

  return (
    <div ref={scope} className={`ai-command-panel ${className}`.trim()}>
      <div className="ai-command-inner">
        <div className="ai-command-header">
          <div className="ai-status-orb-wrap">
            <span className={`ai-status-orb${loading ? ' is-thinking' : ''}`} aria-hidden="true" />
          </div>
          <div className="ai-command-header-text">
            {kicker ? <p className="ai-command-kicker">{kicker}</p> : null}
            <p className="ai-command-title">{title}</p>
            {description ? <p className="ai-command-desc">{description}</p> : null}
          </div>
          {meta?.source ? (
            <GhostChip className="ai-source-chip">
              {meta.source === 'gemini' ? 'Gemini' : 'Local ops'}
            </GhostChip>
          ) : null}
        </div>

        {guidedActions.length ? (
          <div className="ai-guided-panel" aria-label="Recommended next actions">
            <div className="ai-guided-heading">
              <div>
                <p className="ai-guided-kicker">Recommended path</p>
                <p className="ai-guided-title">Start with the highest-impact task.</p>
              </div>
              <GhostChip>{guidedActions.length} steps</GhostChip>
            </div>

            <div className="ai-guided-list">
              {guidedActions.map((item, index) => (
                <article key={item.id || item.packageId || item.title} className={`ai-guided-card ai-guided-${item.priority || 'medium'}`.trim()}>
                  <div className="ai-guided-card-main">
                    <span className="ai-guided-step">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="ai-guided-card-title">{getAssistantPackageName(item)}</p>
                      <p className="ai-guided-card-copy">{[item.title || item.nextStepLabel, item.nextStepDetail || item.detail].filter(Boolean).join('. ')}</p>
                      <p className="ai-guided-card-meta">{getAssistantPackageName(item)} • {getAssistantPackageMeta(item)}</p>
                    </div>
                  </div>

                  <div className="ai-guided-card-actions">
                    <button
                      type="button"
                      className="briefing-chat-action"
                      onClick={() => onFocusPackage?.(item.id || item.packageId)}
                    >
                      Open load
                    </button>
                    <button
                      type="button"
                      className="briefing-chat-action briefing-chat-action-accent"
                      onClick={() => askAboutAction(item)}
                      disabled={loading}
                    >
                      Ask guide
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="briefing-chat-suggestions ai-chips-row">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="ai-suggestion-chip"
              onClick={() => handleAsk(suggestion)}
              disabled={loading}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="ai-input-shell">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAsk();
              }
            }}
            className="ai-textarea"
            placeholder="Ask about risks, routes, drivers, or handoff… (Press / to focus)"
            rows={3}
          />
          <div className="ai-input-actions">
            <PrimaryButton type="button" onClick={() => handleAsk()} disabled={loading}>
              {loading ? 'Thinking…' : 'Ask'}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={handleClear}
              disabled={loading || (!briefing && !prompt)}
            >
              Clear
            </SecondaryButton>
            <span className="ai-shortcut-hint">⌘↵ send</span>
          </div>
        </div>

        {loading ? (
          <div className="ai-thinking-block briefing-chat-message" aria-live="polite">
            <div className="ai-thinking-dots" aria-label="AI is thinking">
              <span />
              <span />
              <span />
            </div>
            <p className="ai-thinking-label">Analyzing network state…</p>
          </div>
        ) : null}

        {error ? <Alert tone="error">{error}</Alert> : null}

        {!briefing && !loading ? (
          <div className="ai-empty-state">
            <span className="ai-empty-icon" aria-hidden="true" />
            <p>
              Ready for a question. Use a recommended task above or press <kbd className="ai-kbd">/</kbd> from anywhere to focus.
            </p>
          </div>
        ) : null}

        {briefing && reply ? (
          <div className="briefing-shell briefing-chat-shell">
            <div className="briefing-chat-message briefing-chat-message-user">
              <p className="briefing-chat-label">You</p>
              <p className="briefing-chat-copy">{prompt}</p>
            </div>

            <div className="briefing-chat-message briefing-chat-message-assistant">
              <div className="ai-response-topbar">
                <p className="briefing-chat-label">RoutePulse AI</p>
                <div className="ai-response-meta">
                  {meta?.generatedAt ? (
                    <GhostChip className="ai-time-chip">
                      {new Date(meta.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </GhostChip>
                  ) : null}
                  <button
                    type="button"
                    className="ai-copy-btn"
                    onClick={handleCopy}
                    aria-label="Copy briefing to clipboard"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {reply.headline ? (
                <p className="briefing-chat-headline">
                  <WordReveal text={reply.headline} />
                </p>
              ) : null}
              {reply.summary ? (
                <p className="briefing-chat-copy">
                  <WordReveal text={reply.summary} />
                </p>
              ) : null}

              {reply.bullets.length ? (
                <div className="briefing-chat-bullets">
                  {reply.bullets.map((item) => (
                    <p key={item} className="briefing-chat-bullet">
                      <WordReveal text={item} />
                    </p>
                  ))}
                </div>
              ) : null}

              {reply.riskPackages.length || reply.recommendations.length || onJumpToWorkspace ? (
                <div className="briefing-chat-actions" aria-label="AI action shortcuts">
                  {reply.riskPackages.slice(0, 2).map((item) => (
                    <button
                      key={item.packageId}
                      type="button"
                      className="briefing-chat-action"
                      onClick={() => onFocusPackage?.(item.packageId)}
                    >
                      Check {getAssistantPackageName(item)}
                    </button>
                  ))}
                  {reply.recommendations.slice(0, 1).map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      className="briefing-chat-action"
                      onClick={() => {
                        const followUp = [item.title, item.detail].filter(Boolean).join('. ');
                        void handleAsk(followUp);
                      }}
                    >
                      Guide: {item.title}
                    </button>
                  ))}
                  {onJumpToWorkspace ? (
                    <button
                      type="button"
                      className="briefing-chat-action briefing-chat-action-accent"
                      onClick={onJumpToWorkspace}
                    >
                      Open update workspace
                    </button>
                  ) : null}
                </div>
              ) : null}

              {reply.footer ? <p className="briefing-chat-footnote">{reply.footer}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
