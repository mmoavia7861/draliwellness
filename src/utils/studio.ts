import {
  buildAssistantSystemInstruction,
  type AssistantMessage,
  type AssistantProductBrief,
  type AssistantSiteBrief,
} from './assistant';

export type StudioChatModelId = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

export type StudioRolePresetId =
  | 'advisor'
  | 'researcher'
  | 'fast_helper'
  | 'custom';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface StudioRolePreset {
  id: StudioRolePresetId;
  label: string;
  description: string;
  defaultModel: StudioChatModelId;
  defaultSearchGrounding: boolean;
  defaultInstruction: string;
}

export const STUDIO_CHAT_MODELS: ReadonlyArray<{
  id: StudioChatModelId;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    badge: 'General & Search',
    description: 'Balanced reasoning with Google Search grounding support.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash-Lite',
    badge: 'Fast Reply',
    description: 'Low-latency assistant for quick dosage, delivery, and catalog Q&A.',
  },
];

export const STUDIO_ROLE_PRESETS: ReadonlyArray<StudioRolePreset> = [
  {
    id: 'advisor',
    label: 'BrainAxis Supplement Advisor',
    description: 'Grounded strictly on BrainAxis Energy Boost, SUNDEX-D® 200,000 IU, and store policies.',
    defaultModel: 'gemini-4-hydrogen',
    defaultSearchGrounding: false,
    defaultInstruction:
      'Focus on accurate BrainAxis Energy Boost (30 tablets, once daily) and SUNDEX-D® 200,000 IU (1 softgel, physician-guided) label facts, pricing, and Cash on Delivery across Pakistan.',
  },
  {
    id: 'researcher',
    label: 'Wellness Research Explorer',
    description: 'Uses Google Search grounding for up-to-date nutritional guidelines and scientific references.',
    defaultModel: 'gemini-4-hydrogen',
    defaultSearchGrounding: true,
    defaultInstruction:
      'Act as an evidence-informed wellness and nutrition research assistant for Dr. Ali Hassan Health & Wellness. Use web sources to summarize general nutritional concepts clearly, distinguish general nutrition science from BrainAxis product labels, never diagnose or claim supplements treat or cure diseases, and always advise consulting a registered physician for high-dose Vitamin D3 (200,000 IU).',
  },
  {
    id: 'fast_helper',
    label: 'Quick Order & Label Helper',
    description: 'Fast answers on shipping thresholds, order tracking, and bilingual English / Roman Urdu questions.',
    defaultModel: 'gemini-3.1-flash-lite',
    defaultSearchGrounding: false,
    defaultInstruction:
      'Give concise, friendly answers in English or Roman Urdu (matching the user) about BrainAxis pricing, nationwide Pakistan Cash on Delivery, order tracking steps, and simple daily supplement directions.',
  },
  {
    id: 'custom',
    label: 'Custom Assistant Role',
    description: 'Customize the assistant role and tone using your own system instruction.',
    defaultModel: 'gemini-4-hydrogen',
    defaultSearchGrounding: false,
    defaultInstruction:
      'You are a helpful wellness and customer support assistant for Dr. Ali Hassan Health & Wellness (BrainAxis supplements). Be clear, respectful, and cautious about medical claims.',
  },
];

const MAX_STUDIO_MESSAGE_LENGTH = 1500;
const MAX_STUDIO_HISTORY_TURNS = 20;
const MAX_STUDIO_HISTORY_TEXT = 2500;
const MAX_SYSTEM_INSTRUCTION_LENGTH = 2000;
const MAX_SEARCH_QUERY_LENGTH = 500;
const MAX_THREAD_TITLE_LENGTH = 100;

export function resolveChatModel(input: unknown): StudioChatModelId {
  if (input === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
  return 'gemini-4-hydrogen';
}

export function resolveRolePresetId(input: unknown): StudioRolePresetId {
  if (
    input === 'advisor' ||
    input === 'researcher' ||
    input === 'fast_helper' ||
    input === 'custom'
  ) {
    return input;
  }
  return 'advisor';
}

export function buildStudioSystemInstruction(options: {
  rolePreset: StudioRolePresetId;
  customInstruction?: string;
  products?: AssistantProductBrief[];
  site?: AssistantSiteBrief;
}): string {
  const baseCatalogInstruction = buildAssistantSystemInstruction(
    options.products ?? [],
    options.site
  );

  const preset =
    STUDIO_ROLE_PRESETS.find((p) => p.id === options.rolePreset) ?? STUDIO_ROLE_PRESETS[0];

  const customNote =
    typeof options.customInstruction === 'string'
      ? options.customInstruction.trim().slice(0, MAX_SYSTEM_INSTRUCTION_LENGTH)
      : '';

  const roleDirective = customNote || preset.defaultInstruction;

  return [
    baseCatalogInstruction,
    '',
    `ACTIVE CONVERSATION ROLE (${preset.label.toUpperCase()}):`,
    roleDirective,
    'Always preserve conversation continuity across multi-turn follow-up messages.',
  ].join('\n');
}

export function isSafeHttpUrl(rawUri: unknown): rawUri is string {
  if (typeof rawUri !== 'string') return false;
  const trimmed = rawUri.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractGroundingSources(groundingChunks: unknown): GroundingSource[] {
  if (!Array.isArray(groundingChunks)) return [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of groundingChunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const web = (chunk as { web?: { uri?: unknown; title?: unknown } }).web;
    if (!web || !isSafeHttpUrl(web.uri)) continue;

    const uri = web.uri.trim();
    if (seen.has(uri)) continue;
    seen.add(uri);

    const rawTitle = typeof web.title === 'string' ? web.title.trim() : '';
    let title = rawTitle;
    if (!title) {
      try {
        title = new URL(uri).hostname;
      } catch {
        title = uri;
      }
    }
    sources.push({ title: title.slice(0, 160), uri });
  }

  return sources;
}

export function parseGroundingSourcesJson(rawJson: string | null | undefined): GroundingSource[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    const results: GroundingSource[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const entry = item as { title?: unknown; uri?: unknown };
      if (isSafeHttpUrl(entry.uri)) {
        results.push({
          title:
            typeof entry.title === 'string' && entry.title.trim()
              ? entry.title.trim().slice(0, 160)
              : new URL(entry.uri).hostname,
          uri: entry.uri.trim(),
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

export interface ValidatedStudioChatRequest {
  threadId?: number;
  message: string;
  history: AssistantMessage[];
  model: StudioChatModelId;
  rolePreset: StudioRolePresetId;
  systemInstruction?: string;
  useSearchGrounding: boolean;
}

export function validateStudioChatInput(
  payload: unknown
): { ok: true; data: ValidatedStudioChatRequest } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = payload as Record<string, unknown>;
  const rawMessage = typeof record.message === 'string' ? record.message.trim() : '';
  if (!rawMessage) {
    return { ok: false, error: 'Please enter a message before sending.' };
  }
  if (rawMessage.length > MAX_STUDIO_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message is too long (maximum ${MAX_STUDIO_MESSAGE_LENGTH} characters).`,
    };
  }

  let threadId: number | undefined;
  if (record.threadId !== undefined && record.threadId !== null && record.threadId !== '') {
    const parsedId = Number(record.threadId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return { ok: false, error: 'Invalid threadId.' };
    }
    threadId = parsedId;
  }

  const history: AssistantMessage[] = [];
  if (Array.isArray(record.history)) {
    for (const entry of record.history.slice(-MAX_STUDIO_HISTORY_TURNS)) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const role = item.role === 'model' ? 'model' : item.role === 'user' ? 'user' : null;
      const text =
        typeof item.text === 'string' ? item.text.trim().slice(0, MAX_STUDIO_HISTORY_TEXT) : '';
      if (role && text) {
        history.push({ role, text });
      }
    }
  }

  const model = resolveChatModel(record.model);
  const rolePreset = resolveRolePresetId(record.rolePreset);
  const systemInstruction =
    typeof record.systemInstruction === 'string'
      ? record.systemInstruction.trim().slice(0, MAX_SYSTEM_INSTRUCTION_LENGTH)
      : undefined;

  // Search grounding is supported cleanly on gemini-4-hydrogen
  const requestedSearch = Boolean(record.useSearchGrounding);
  const useSearchGrounding = requestedSearch && model === 'gemini-4-hydrogen';

  return {
    ok: true,
    data: {
      threadId,
      message: rawMessage,
      history,
      model,
      rolePreset,
      systemInstruction: systemInstruction || undefined,
      useSearchGrounding,
    },
  };
}

export interface ValidatedThreadCreateRequest {
  title: string;
  rolePreset: StudioRolePresetId;
  model: StudioChatModelId;
  systemInstruction: string;
}

export function validateThreadCreateInput(
  payload: unknown
): { ok: true; data: ValidatedThreadCreateRequest } | { ok: false; error: string } {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const rolePreset = resolveRolePresetId(record.rolePreset);
  const preset =
    STUDIO_ROLE_PRESETS.find((p) => p.id === rolePreset) ?? STUDIO_ROLE_PRESETS[0];

  const rawTitle = typeof record.title === 'string' ? record.title.trim() : '';
  const title = (rawTitle || `${preset.label} Chat`).slice(0, MAX_THREAD_TITLE_LENGTH);
  const model = resolveChatModel(record.model || preset.defaultModel);
  const rawInstr =
    typeof record.systemInstruction === 'string' ? record.systemInstruction.trim() : '';
  const systemInstruction = (rawInstr || preset.defaultInstruction).slice(
    0,
    MAX_SYSTEM_INSTRUCTION_LENGTH
  );

  return {
    ok: true,
    data: {
      title,
      rolePreset,
      model,
      systemInstruction,
    },
  };
}

export function validateStudioSearchInput(
  payload: unknown
): { ok: true; query: string } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const rawQuery = (payload as Record<string, unknown>).query;
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  if (!query) {
    return { ok: false, error: 'Please enter a wellness or nutrition question to search.' };
  }
  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      ok: false,
      error: `Search query must be under ${MAX_SEARCH_QUERY_LENGTH} characters.`,
    };
  }
  return { ok: true, query };
}
