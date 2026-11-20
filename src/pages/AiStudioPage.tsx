import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  ChevronDown,
  ExternalLink,
  Globe,
  History,
  Loader2,
  LogIn,
  MessageSquarePlus,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { FormattedAiText } from '../components/FormattedAiText';
import { serializeCatalogForAssistant } from '../utils/assistant';
import {
  STUDIO_CHAT_MODELS,
  STUDIO_ROLE_PRESETS,
  type GroundingSource,
  type StudioChatModelId,
  type StudioRolePresetId,
} from '../utils/studio';

interface ChatThreadSummary {
  id: number;
  title: string;
  rolePreset: string;
  model: string;
  systemInstruction: string;
  updatedAt: string;
}

interface StudioChatMessage {
  id?: number;
  role: 'user' | 'model';
  text: string;
  model?: string;
  sources?: GroundingSource[];
}

interface SearchHistoryEntry {
  id?: number;
  query: string;
  summary: string;
  sources: GroundingSource[];
  model: string;
  createdAt?: string;
}

const CHAT_STARTER_PROMPTS = [
  'Compare BrainAxis Energy Boost and SUNDEX-D® 200,000 IU in detail.',
  'How should SUNDEX-D® 200,000 IU be taken, and what precautions apply?',
  'Explain nationwide Cash on Delivery and free shipping thresholds.',
  'Energy Boost rozana kab aur kaise lena behtar hai?',
];

const RESEARCH_STARTER_QUERIES = [
  'Current recommended dietary allowance for Vitamin D3 in adults',
  'Why take Vitamin D3 softgels with a meal containing healthy fats',
  'Key nutrients in daily multivitamins supporting energy and immunity',
];

export const AiStudioPage: React.FC = () => {
  const { user, authReady, liveProducts, siteSettings } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'search' ? 'search' : 'chat';

  const [activeTab, setActiveTab] = useState<'chat' | 'search'>(initialTab);

  // Chatbot State
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<StudioChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [rolePreset, setRolePreset] = useState<StudioRolePresetId>('advisor');
  const [model, setModel] = useState<StudioChatModelId>('gemini-4-hydrogen');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(
    STUDIO_ROLE_PRESETS[0].defaultInstruction
  );
  const [showInstructions, setShowInstructions] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeSearchResult, setActiveSearchResult] = useState<SearchHistoryEntry | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);

  const threadContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const catalogPayload = useMemo(
    () => serializeCatalogForAssistant(liveProducts, siteSettings),
    [liveProducts, siteSettings]
  );

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab === 'search' || paramTab === 'chat') {
      setActiveTab(paramTab);
    }
  }, [searchParams]);

  const switchTab = (next: 'chat' | 'search') => {
    setActiveTab(next);
    setSearchParams(next === 'search' ? { tab: 'search' } : {});
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!user) return { 'Content-Type': 'application/json' };
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadThreads = async () => {
    if (!user) {
      setThreads([]);
      return;
    }
    setThreadsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/studio/threads', { headers });
      if (res.ok) {
        const data = (await res.json()) as { threads?: ChatThreadSummary[] };
        setThreads(data.threads || []);
      }
    } catch {
      // Keep UI responsive if transient fetch fails
    } finally {
      setThreadsLoading(false);
    }
  };

  const loadSearchHistory = async () => {
    if (!user) {
      setSearchHistory([]);
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/studio/searches', { headers });
      if (res.ok) {
        const data = (await res.json()) as { searches?: SearchHistoryEntry[] };
        setSearchHistory(data.searches || []);
      }
    } catch {
      // ignore transient error
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (user) {
      void loadThreads();
      void loadSearchHistory();
    } else {
      setThreads([]);
      setActiveThreadId(null);
      setSearchHistory([]);
    }
  }, [user, authReady]);

  useEffect(() => {
    const el = threadContainerRef.current;
    if (el && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, chatSending]);

  const handleSelectPreset = (nextId: StudioRolePresetId) => {
    setRolePreset(nextId);
    const preset = STUDIO_ROLE_PRESETS.find((p) => p.id === nextId);
    if (preset) {
      setModel(preset.defaultModel);
      setUseSearchGrounding(preset.defaultSearchGrounding);
      setSystemInstruction(preset.defaultInstruction);
    }
  };

  const handleModelChange = (nextModel: StudioChatModelId) => {
    setModel(nextModel);
    if (nextModel !== 'gemini-4-hydrogen') {
      setUseSearchGrounding(false);
    }
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    setChatError(null);
    chatInputRef.current?.focus();
  };

  const handleOpenThread = async (thread: ChatThreadSummary) => {
    if (!user) return;
    setChatError(null);
    setActiveThreadId(thread.id);
    setRolePreset(
      (STUDIO_ROLE_PRESETS.some((p) => p.id === thread.rolePreset)
        ? thread.rolePreset
        : 'advisor') as StudioRolePresetId
    );
    setModel(
      thread.model === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen'
    );
    if (thread.systemInstruction) {
      setSystemInstruction(thread.systemInstruction);
    }

    setMessagesLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/studio/threads/${thread.id}/messages`, { headers });
      const data = (await res.json()) as {
        messages?: StudioChatMessage[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load conversation messages.');
      }
      setMessages(data.messages || []);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Unable to load conversation.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleDeleteThread = async (threadId: number) => {
    if (!user) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/studio/threads/${threadId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (activeThreadId === threadId) {
          setActiveThreadId(null);
          setMessages([]);
        }
      }
    } catch {
      setChatError('Could not delete conversation right now.');
    }
  };

  const sendChatMessage = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || chatSending) return;

    setChatError(null);
    const priorHistory = messages.map((m) => ({ role: m.role, text: m.text }));
    const optimisticUser: StudioChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, optimisticUser]);
    setChatInput('');
    setChatSending(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/studio/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          threadId: user ? activeThreadId : undefined,
          message: trimmed,
          history: priorHistory,
          model,
          rolePreset,
          systemInstruction,
          useSearchGrounding,
          products: catalogPayload.products,
          site: catalogPayload.site,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        model?: string;
        sources?: GroundingSource[];
        threadId?: number;
        error?: string;
      };

      if (!res.ok || !data.reply) {
        throw new Error(data.error || `Unable to get response (HTTP ${res.status}).`);
      }

      const modelReply: StudioChatMessage = {
        role: 'model',
        text: data.reply,
        model: data.model,
        sources: data.sources || [],
      };
      setMessages((prev) => [...prev, modelReply]);

      if (user && data.threadId && data.threadId !== activeThreadId) {
        setActiveThreadId(data.threadId);
        void loadThreads();
      } else if (user) {
        void loadThreads();
      }
    } catch (err: unknown) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to send message right now. Please try again.'
      );
    } finally {
      setChatSending(false);
    }
  };

  const runGroundedSearch = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed || searchLoading) return;

    setSearchError(null);
    setSearchQuery(trimmed);
    setSearchLoading(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/studio/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: trimmed }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        query?: string;
        summary?: string;
        sources?: GroundingSource[];
        model?: string;
        error?: string;
      };

      if (!res.ok || !data.summary) {
        throw new Error(data.error || `Search grounding failed (HTTP ${res.status}).`);
      }

      const nextResult: SearchHistoryEntry = {
        query: data.query || trimmed,
        summary: data.summary,
        sources: data.sources || [],
        model: data.model || 'gemini-4-hydrogen',
      };
      setActiveSearchResult(nextResult);

      if (user) {
        void loadSearchHistory();
      }
    } catch (err: unknown) {
      setSearchError(
        err instanceof Error ? err.message : 'Unable to run web research right now.'
      );
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title={`AI Wellness Studio — ${siteSettings.businessName}`}
        description="Multi-turn supplement chatbot with configurable assistant roles and Google Search grounded wellness research."
      />

      {/* Editorial Page Header */}
      <section className="bg-gradient-to-b from-[#E8F1EB]/70 via-[#FAF8F2] to-[#FAF8F2] border-b border-[#174D40]/12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
              Interactive Wellness Assistant &amp; Grounded Research
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
              BrainAxis AI Wellness Studio
            </h1>
            <p className="text-sm sm:text-base text-[#252B29]/75 leading-relaxed">
              Ask multi-turn follow-up questions about BrainAxis supplements, switch assistant roles, or explore verified health &amp; nutrition topics backed by live Google Search sources.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0">
            <div
              role="tablist"
              aria-label="AI Studio mode"
              className="inline-flex rounded-xl bg-white border border-[#174D40]/15 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'chat'}
                onClick={() => switchTab('chat')}
                className={`h-9 px-4 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#174D40] text-white'
                    : 'text-[#252B29]/75 hover:text-[#174D40]'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Multi-Turn Chatbot</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'search'}
                onClick={() => switchTab('search')}
                className={`h-9 px-4 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-[#174D40] text-white'
                    : 'text-[#252B29]/75 hover:text-[#174D40]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Web Research</span>
              </button>
            </div>

            {!user && authReady && (
              <Link
                to="/account"
                className="h-11 px-4 rounded-xl border border-[#174D40]/25 bg-white text-[#174D40] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#E8F1EB]/70 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Email</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20">
        {/* TAB 1: MULTI-TURN CHATBOT */}
        {activeTab === 'chat' && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar: Saved Threads */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
              <div className="bg-white border border-[#174D40]/12 rounded-2xl p-4 space-y-4">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="w-full h-10 px-4 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#113A30] transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>New Conversation</span>
                </button>

                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#252B29]/60 px-1">
                      <span>Saved Conversations</span>
                      {threadsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    </div>

                    {threads.length === 0 ? (
                      <p className="text-xs text-[#252B29]/65 px-1 py-2 leading-relaxed">
                        Your conversation threads will automatically appear here once you send your first message.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                        {threads.map((thread) => {
                          const isSelected = activeThreadId === thread.id;
                          return (
                            <li key={thread.id} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => void handleOpenThread(thread)}
                                className={`flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#E8F1EB] text-[#174D40] font-semibold'
                                    : 'text-[#252B29]/80 hover:bg-[#FAF8F2]'
                                }`}
                              >
                                <span className="block truncate">{thread.title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteThread(thread.id)}
                                aria-label={`Delete conversation '${thread.title}'`}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#252B29]/45 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#FAF8F2] border border-[#174D40]/12 p-3.5 space-y-2.5">
                    <p className="text-xs font-semibold text-[#174D40]">
                      Save conversations across visits
                    </p>
                    <p className="text-xs text-[#252B29]/70 leading-relaxed">
                      Chat freely right now, or sign in with email to save and reopen your supplement discussions anytime.
                    </p>
                    <Link
                      to="/account"
                      className="w-full h-9 rounded-lg border border-[#174D40] text-[#174D40] text-xs font-semibold hover:bg-[#174D40] hover:text-white transition-colors cursor-pointer"
                    >
                      Sign In with Email
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-[#FAF8F2] border border-[#174D40]/12 rounded-2xl p-4 space-y-2 text-xs text-[#252B29]/75">
                <p className="font-semibold text-[#174D40]">Quick Store Links</p>
                <div className="flex flex-col gap-1.5">
                  <Link
                    to="/product/brainaxis-energy-boost"
                    className="inline-flex items-center justify-between hover:text-[#174D40]"
                  >
                    <span>BrainAxis Energy Boost</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/product/brainaxis-sundex-d"
                    className="inline-flex items-center justify-between hover:text-[#174D40]"
                  >
                    <span>BrainAxis SUNDEX-D® 200,000 IU</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Chat Surface */}
            <div className="lg:col-span-8 xl:col-span-9 bg-white border border-[#174D40]/15 rounded-2xl overflow-hidden flex flex-col">
              {/* Role & Model Configuration Header */}
              <div className="bg-[#FAF8F2] border-b border-[#174D40]/12 p-4 sm:p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="studio-role-select"
                      className="text-xs font-semibold uppercase tracking-wider text-[#252B29]/70 block"
                    >
                      Assistant Role
                    </label>
                    <select
                      id="studio-role-select"
                      value={rolePreset}
                      onChange={(e) => handleSelectPreset(e.target.value as StudioRolePresetId)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white text-sm text-[#252B29] focus:outline-none focus:border-[#174D40]"
                    >
                      {STUDIO_ROLE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="studio-model-select"
                      className="text-xs font-semibold uppercase tracking-wider text-[#252B29]/70 block"
                    >
                      Response Mode
                    </label>
                    <select
                      id="studio-model-select"
                      value={model}
                      onChange={(e) => handleModelChange(e.target.value as StudioChatModelId)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white text-sm text-[#252B29] focus:outline-none focus:border-[#174D40]"
                    >
                      {STUDIO_CHAT_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} ({m.badge})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#252B29] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSearchGrounding}
                      disabled={model !== 'gemini-4-hydrogen'}
                      onChange={(e) => setUseSearchGrounding(e.target.checked)}
                      className="rounded border-[#174D40]/30 text-[#174D40]"
                    />
                    <span className={model !== 'gemini-4-hydrogen' ? 'opacity-55' : ''}>
                      Enable Google Search Grounding (web citations)
                    </span>
                  </label>

                  <button
                    type="button"
                    aria-expanded={showInstructions}
                    onClick={() => setShowInstructions((v) => !v)}
                    className="text-xs font-semibold text-[#174D40] inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>System Instructions</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showInstructions ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {showInstructions && (
                  <div className="space-y-1.5 pt-1">
                    <label
                      htmlFor="studio-system-instruction"
                      className="text-xs font-semibold text-[#174D40] block"
                    >
                      Role Guidance &amp; System Instruction
                    </label>
                    <textarea
                      id="studio-system-instruction"
                      rows={3}
                      value={systemInstruction}
                      onChange={(e) => setSystemInstruction(e.target.value)}
                      maxLength={2000}
                      placeholder="Describe how the assistant should respond..."
                      className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white text-xs sm:text-sm text-[#252B29] focus:outline-none focus:border-[#174D40]"
                    />
                  </div>
                )}
              </div>

              {/* Scrollable Conversation Thread */}
              <div
                ref={threadContainerRef}
                data-testid="studio-chat-thread"
                aria-live="polite"
                className="h-[340px] sm:h-[360px] overflow-y-auto p-5 sm:p-6 space-y-4 bg-white"
              >
                {messagesLoading ? (
                  <div className="h-full flex items-center justify-center gap-2 text-sm text-[#174D40]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#E8F1EB] text-[#174D40] flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
                        Start a Multi-Turn Conversation
                      </h2>
                      <p className="text-xs sm:text-sm text-[#252B29]/75">
                        Your follow-up messages stay in context across turns. Pick a question below or type your own.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2.5 w-full">
                      {CHAT_STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendChatMessage(prompt)}
                          className="text-left text-xs font-medium p-3 rounded-xl border border-[#174D40]/15 bg-[#FAF8F2] text-[#174D40] hover:bg-[#E8F1EB] transition-colors cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div
                        key={`${msg.id ?? idx}-${msg.role}`}
                        className={`flex gap-3 ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'model' && (
                          <div className="w-8 h-8 rounded-lg bg-[#E8F1EB] text-[#174D40] flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2.5 ${
                            msg.role === 'user'
                              ? 'bg-[#174D40] text-white whitespace-pre-line'
                              : 'bg-[#FAF8F2] border border-[#174D40]/12 text-[#252B29]'
                          }`}
                        >
                          {msg.role === 'model' ? (
                            <FormattedAiText text={msg.text} />
                          ) : (
                            msg.text
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pt-2 border-t border-[#174D40]/12 space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#174D40]">
                                Web Sources
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.sources.map((src) => (
                                  <a
                                    key={src.uri}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white border border-[#174D40]/15 text-[#174D40] hover:bg-[#E8F1EB] transition-colors"
                                  >
                                    <span className="max-w-[200px] truncate">{src.title}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {chatSending && (
                      <div className="flex items-center gap-2.5 text-xs font-medium text-[#174D40]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating reply...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {chatError && (
                <div
                  role="alert"
                  className="mx-5 mb-3 rounded-xl border border-[#9B2C2C]/25 bg-[#FFF5F5] px-4 py-2.5 text-xs sm:text-sm text-[#9B2C2C] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{chatError}</span>
                </div>
              )}

              {/* Message Composer */}
              <div className="border-t border-[#174D40]/12 bg-[#FAF8F2] p-4 sm:p-5 space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendChatMessage(chatInput);
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <label htmlFor="studio-chat-input" className="sr-only">
                    Ask a question or follow-up message
                  </label>
                  <input
                    ref={chatInputRef}
                    id="studio-chat-input"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    maxLength={1500}
                    placeholder="Ask a question or follow up on the previous answer..."
                    className="w-full sm:flex-1 h-11 px-4 rounded-lg border border-[#174D40]/20 bg-white text-sm text-[#252B29] placeholder:text-[#252B29]/50 focus:outline-none focus:border-[#174D40]"
                  />
                  <button
                    type="submit"
                    disabled={chatSending || !chatInput.trim()}
                    className="h-11 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  >
                    {chatSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Message</span>
                  </button>
                </form>

                <p className="text-[11px] text-[#252B29]/65 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#C7A46A] shrink-0 mt-0.5" />
                  <span>
                    Educational wellness guidance only. Supplements are not intended to diagnose, treat, cure, or prevent any disease. Consult a registered physician before high-dose Vitamin D3.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE SEARCH GROUNDING RESEARCH */}
        {activeTab === 'search' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-[#174D40]/15 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#174D40]">
                    <Globe className="w-4 h-4 text-[#C7A46A]" />
                    <span>Google Search Grounded Wellness Research</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#174D40]">
                    Explore Verified Nutrition &amp; Ingredient Facts
                  </h2>
                  <p className="text-sm text-[#252B29]/75">
                    Search up-to-date nutritional guidelines, Vitamin D absorption science, and wellness research with clickable web source links.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runGroundedSearch(searchQuery);
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <label htmlFor="studio-search-input" className="sr-only">
                    Search wellness and nutrition information
                  </label>
                  <input
                    id="studio-search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxLength={500}
                    placeholder="e.g., Latest RDA guidelines for Vitamin D3 adults..."
                    className="w-full sm:flex-1 h-11 px-4 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm text-[#252B29] focus:outline-none focus:border-[#174D40] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim()}
                    className="h-11 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  >
                    {searchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Search Web</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {RESEARCH_STARTER_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={searchLoading}
                      onClick={() => void runGroundedSearch(q)}
                      className="text-left text-xs font-medium px-3 py-1.5 rounded-lg border border-[#174D40]/15 bg-[#FAF8F2] text-[#174D40] hover:bg-[#E8F1EB] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {searchError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#9B2C2C]/25 bg-[#FFF5F5] px-4 py-3 text-xs sm:text-sm text-[#9B2C2C] flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{searchError}</span>
                  </div>
                )}

                {searchLoading && (
                  <div className="rounded-xl border border-[#174D40]/12 bg-[#FAF8F2] p-5 flex items-center gap-3 text-sm text-[#174D40]">
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>Searching web sources and synthesizing answer...</span>
                  </div>
                )}

                {activeSearchResult && !searchLoading && (
                  <div
                    data-testid="search-grounding-result"
                    className="rounded-2xl border border-[#174D40]/15 bg-[#FAF8F2] p-5 sm:p-6 space-y-5"
                  >
                    <div className="border-b border-[#174D40]/12 pb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#C7A46A]">
                        Grounded Summary
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#174D40] mt-1">
                        {activeSearchResult.query}
                      </h3>
                    </div>

                    <div className="text-sm text-[#252B29] leading-relaxed">
                      <FormattedAiText text={activeSearchResult.summary} />
                    </div>

                    <div className="pt-3 border-t border-[#174D40]/12 space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#174D40]">
                        Verified Web Sources ({activeSearchResult.sources.length})
                      </p>
                      {activeSearchResult.sources.length > 0 ? (
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {activeSearchResult.sources.map((source) => (
                            <li key={source.uri}>
                              <a
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#174D40]/15 text-xs font-medium text-[#174D40] hover:bg-[#E8F1EB]/70 transition-colors"
                              >
                                <span className="truncate">{source.title}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#252B29]/65">
                          No external source links were attached for this query.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search History Column */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-[#174D40]/15 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-serif font-semibold text-[#174D40]">
                  <History className="w-4 h-4 text-[#C7A46A]" />
                  <span>Recent Research</span>
                </div>

                {!user ? (
                  <div className="space-y-3 text-xs text-[#252B29]/75">
                    <p>
                      Sign in with Email to save your grounded nutrition queries and source citations for future visits.
                    </p>
                    <Link
                      to="/account"
                      className="w-full h-9 rounded-lg border border-[#174D40] text-[#174D40] text-xs font-semibold hover:bg-[#174D40] hover:text-white transition-colors cursor-pointer"
                    >
                      Sign In with Email
                    </Link>
                  </div>
                ) : searchHistory.length === 0 ? (
                  <p className="text-xs text-[#252B29]/65 leading-relaxed">
                    Your recent grounded wellness searches will appear here.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {searchHistory.map((item, idx) => (
                      <li key={item.id ?? idx}>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery(item.query);
                            setActiveSearchResult(item);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-[#174D40]/12 bg-[#FAF8F2] hover:bg-[#E8F1EB]/60 transition-colors cursor-pointer space-y-1"
                        >
                          <p className="text-xs font-semibold text-[#174D40] line-clamp-2">
                            {item.query}
                          </p>
                          <p className="text-[11px] text-[#252B29]/60">
                            {item.sources.length} source{item.sources.length === 1 ? '' : 's'}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
};
