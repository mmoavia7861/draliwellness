import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FormattedAiText } from './FormattedAiText';
import {
  type AssistantMessage,
  serializeCatalogForAssistant,
} from '../utils/assistant';

const QUICK_PROMPTS = [
  'Compare Energy Boost vs SUNDEX-D',
  'How should SUNDEX-D 200,000 IU be taken?',
  'Delivery charges & Cash on Delivery across Pakistan?',
  'Energy Boost rozana kaise lena hai?',
];

export const AiAssistantWidget: React.FC<{
  inputRef?: React.RefObject<HTMLInputElement | null>;
}> = ({ inputRef }) => {
  const { liveProducts, siteSettings } = useStore();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? internalInputRef;

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const catalogPayload = useMemo(
    () => serializeCatalogForAssistant(liveProducts, siteSettings),
    [liveProducts, siteSettings]
  );

  const askQuestion = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || loading) return;

    setErrorMessage(null);
    const nextHistory = [...messages, { role: 'user' as const, text: trimmed }];
    setMessages(nextHistory);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          products: catalogPayload.products,
          site: catalogPayload.site,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error || `Unable to reach AI Supplement Guide (HTTP ${response.status}).`
        );
      }

      setMessages([...nextHistory, { role: 'model', text: data.reply }]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to generate an AI response right now. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void askQuestion(question);
  };

  const handleClear = () => {
    setMessages([]);
    setErrorMessage(null);
    resolvedInputRef.current?.focus();
  };

  return (
    <div
      id="ai-wellness-guide"
      className="scroll-mt-24 bg-white border border-[#174D40]/15 rounded-2xl overflow-hidden shadow-xs"
    >
      <div className="bg-[#FAF8F2] border-b border-[#174D40]/12 px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#174D40] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#174D40]">
                BrainAxis AI Supplement Guide
              </h3>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8F1EB] text-[#174D40]">
                Instant Q&amp;A
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#252B29]/75">
              Ask about Energy Boost, SUNDEX-D® 200,000 IU label directions, or Cash on Delivery in English or Roman Urdu.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
          <Link
            to="/ai-studio"
            className="h-9 px-3 rounded-lg border border-[#174D40]/20 bg-white text-xs font-semibold text-[#174D40] hover:bg-[#E8F1EB]/60 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Full Studio &amp; Web Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="h-9 px-3 rounded-lg border border-[#174D40]/20 bg-white text-xs font-medium text-[#174D40] hover:bg-[#E8F1EB]/60 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        {/* Starter Questions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#252B29]/60">
            Suggested Questions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => void askQuestion(prompt)}
                className="text-left text-xs font-medium px-3 py-2 rounded-lg border border-[#174D40]/18 bg-[#FAF8F2] text-[#174D40] hover:bg-[#E8F1EB] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Thread */}
        {messages.length > 0 && (
          <div
            aria-live="polite"
            className="max-h-80 overflow-y-auto space-y-3 rounded-xl border border-[#174D40]/12 bg-[#FAF8F2] p-4"
          >
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-[#E8F1EB] text-[#174D40] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#174D40] text-white whitespace-pre-line'
                      : 'bg-white border border-[#174D40]/12 text-[#252B29]'
                  }`}
                >
                  {msg.role === 'model' ? <FormattedAiText text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#174D40] pt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking BrainAxis product facts...</span>
              </div>
            )}
          </div>
        )}

        {messages.length === 0 && loading && (
          <div className="rounded-xl border border-[#174D40]/12 bg-[#FAF8F2] p-4 flex items-center gap-2.5 text-sm text-[#174D40]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking BrainAxis product facts...</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-[#9B2C2C]/25 bg-[#FFF5F5] px-4 py-3 text-xs sm:text-sm text-[#9B2C2C] flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="ai-guide-input" className="sr-only">
            Ask a question about BrainAxis supplements or delivery
          </label>
          <input
            ref={resolvedInputRef}
            id="ai-guide-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={800}
            placeholder="Ask about Energy Boost, SUNDEX-D 200,000 IU, pricing, or delivery..."
            className="w-full sm:flex-1 h-11 px-4 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm text-[#252B29] placeholder:text-[#252B29]/50 focus:outline-none focus:border-[#174D40] focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="h-11 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Ask AI</span>
          </button>
        </form>

        <p className="text-[11px] text-[#252B29]/65 flex items-start gap-1.5 leading-relaxed">
          <ShieldAlert className="w-3.5 h-3.5 text-[#C7A46A] shrink-0 mt-0.5" />
          <span>
            AI answers summarize published BrainAxis product labels and shipping policies. They do not diagnose conditions or replace advice from a registered healthcare professional.
          </span>
        </p>
      </div>
    </div>
  );
};
