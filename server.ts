import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildAssistantSystemInstruction,
  extractReadableErrorMessage,
  validateAssistantInput,
} from './src/utils/assistant.ts';
import {
  buildStudioSystemInstruction,
  extractGroundingSources,
  parseGroundingSourcesJson,
  validateStudioChatInput,
  validateStudioSearchInput,
  validateThreadCreateInput,
} from './src/utils/studio.ts';
import { optionalAuth, requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  appendChatMessage,
  createChatThread,
  deleteChatThreadForUser,
  getOrCreateUser,
  getThreadForUser,
  listRecentSearchQueries,
  listThreadMessages,
  listUserChatThreads,
  recordSearchQuery,
} from './src/db/studioRepo.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'dr-ali-hassan-health-wellness',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/payments/capabilities', (_req, res) => {
    res.json({
      cod: true,
      whatsapp: true,
      jazzcash: Boolean(process.env.JAZZCASH_MERCHANT_ID && process.env.JAZZCASH_PASSWORD),
      easypaisa: Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY),
      card: Boolean(process.env.STRIPE_SECRET_KEY || process.env.PAYFAST_MERCHANT_ID),
    });
  });

  app.get('/api/assistant/status', (_req, res) => {
    res.json({
      enabled: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/assistant/ask', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'AI Supplement Guide is currently unavailable because GEMINI_API_KEY is not configured on the server.',
      });
    }

    const validation = validateAssistantInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const { message, history, products, site } = validation.data;
    const systemInstruction = buildAssistantSystemInstruction(products, site);
    const contents = [
      ...history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    // Only use models listed on the Gemini API free tier, never paid-only fallbacks.
    const attempts: Array<{
      model: string;
      config: { systemInstruction: string; maxOutputTokens: number };
    }> = [
      { model: 'gemini-3.1-flash-lite', config: { systemInstruction, maxOutputTokens: 512 } },
      { model: 'gemini-2.5-flash-lite', config: { systemInstruction, maxOutputTokens: 512 } },
    ];

    let lastError: unknown = null;
    for (let i = 0; i < attempts.length; i += 1) {
      const attempt = attempts[i];
      try {
        const response = await ai.models.generateContent({
          model: attempt.model,
          contents,
          config: attempt.config,
        });

        const reply = response.text?.trim();
        if (!reply) {
          return res.status(502).json({
            error:
              'No response text was returned by the AI model. Please try rephrasing your question.',
          });
        }

        return res.json({
          reply,
          model: attempt.model,
        });
      } catch (error: unknown) {
        lastError = error;
        const errObj = error as { status?: number };
        const shouldTryFreeFallback = errObj?.status === 404 || errObj?.status === 503 || errObj?.status === 504;
        if (shouldTryFreeFallback && i < attempts.length - 1) {
          console.warn(`Primary model ${attempt.model} returned ${errObj?.status}; trying fallback model.`);
          continue;
        }
        break;
      }
    }

    const errObj = lastError as { status?: number; message?: string };
    const cleanMessage = extractReadableErrorMessage(lastError);
    console.error('Gemini assistant error:', cleanMessage);
    if (errObj?.status === 429) {
      return res.status(429).json({ error: 'Free Gemini AI usage limit reached. Please try again later or use the offline product guide.' });
    }
    const status =
      typeof errObj?.status === 'number' && errObj.status >= 400 && errObj.status < 600
        ? errObj.status
        : 502;
    return res.status(status).json({ error: cleanMessage });
  });

  app.post('/api/studio/sync-user', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userRecord = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || 'user@dralihassanwellness.pk',
        typeof req.user!.name === 'string' ? req.user!.name : undefined
      );
      return res.json({ user: userRecord });
    } catch (error) {
      const msg = extractReadableErrorMessage(error, 'Unable to sync signed-in user.');
      return res.status(500).json({ error: msg });
    }
  });

  app.get('/api/studio/threads', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || 'user@dralihassanwellness.pk',
        typeof req.user!.name === 'string' ? req.user!.name : undefined
      );
      const threads = await listUserChatThreads(dbUser.id);
      return res.json({ threads });
    } catch (error) {
      const msg = extractReadableErrorMessage(error, 'Unable to load saved conversations.');
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/threads', requireAuth, async (req: AuthRequest, res) => {
    const validation = validateThreadCreateInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || 'user@dralihassanwellness.pk',
        typeof req.user!.name === 'string' ? req.user!.name : undefined
      );
      const thread = await createChatThread({
        userId: dbUser.id,
        title: validation.data.title,
        rolePreset: validation.data.rolePreset,
        model: validation.data.model,
        systemInstruction: validation.data.systemInstruction,
      });
      return res.status(201).json({ thread });
    } catch (error) {
      const msg = extractReadableErrorMessage(error, 'Unable to create conversation thread.');
      return res.status(500).json({ error: msg });
    }
  });

  app.get('/api/studio/threads/:id/messages', requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      return res.status(400).json({ error: 'Invalid conversation thread ID.' });
    }

    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || 'user@dralihassanwellness.pk',
        typeof req.user!.name === 'string' ? req.user!.name : undefined
      );
      const thread = await getThreadForUser(threadId, dbUser.id);
      if (!thread) {
        return res.status(404).json({ error: 'Conversation thread not found.' });
      }
      const rows = await listThreadMessages(thread.id);
      const messages = rows.map((row) => ({
        id: row.id,
        role: row.role === 'model' ? 'model' : 'user',
        text: row.content,
        model: row.model || undefined,
        sources: parseGroundingSourcesJson(row.groundingSourcesJson),
        createdAt: row.createdAt,
      }));
      return res.json({ thread, messages });
    } catch (error) {
      const msg = extractReadableErrorMessage(error, 'Unable to load conversation messages.');
      return res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/studio/threads/:id', requireAuth, async (req: AuthRequest, res) => {
    const threadId = Number(req.params.id);
    if (!Number.isInteger(threadId) || threadId <= 0) {
      return res.status(400).json({ error: 'Invalid conversation thread ID.' });
    }

    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || 'user@dralihassanwellness.pk',
        typeof req.user!.name === 'string' ? req.user!.name : undefined
      );
      const deleted = await deleteChatThreadForUser(threadId, dbUser.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Conversation thread not found.' });
      }
      return res.json({ ok: true });
    } catch (error) {
      const msg = extractReadableErrorMessage(error, 'Unable to delete conversation thread.');
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/studio/chat', optionalAuth, async (req: AuthRequest, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'AI Chatbot is currently unavailable because GEMINI_API_KEY is not configured.',
      });
    }

    const validation = validateStudioChatInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const rawBody = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
      string,
      unknown
    >;
    const catalogCheck = validateAssistantInput({
      message: validation.data.message,
      products: rawBody.products,
      site: rawBody.site,
    });
    const products = catalogCheck.ok ? catalogCheck.data.products : [];
    const site = catalogCheck.ok ? catalogCheck.data.site : undefined;

    try {
      let activeThreadId = validation.data.threadId;
      let dbUserId: number | null = null;
      let priorTurns = validation.data.history;

      if (req.user) {
        const dbUser = await getOrCreateUser(
          req.user.uid,
          req.user.email || 'user@dralihassanwellness.pk',
          typeof req.user.name === 'string' ? req.user.name : undefined
        );
        dbUserId = dbUser.id;

        if (activeThreadId) {
          const ownedThread = await getThreadForUser(activeThreadId, dbUser.id);
          if (!ownedThread) {
            return res.status(404).json({ error: 'Conversation thread not found.' });
          }
          const persisted = await listThreadMessages(ownedThread.id);
          priorTurns = persisted.slice(-20).map((m) => ({
            role: m.role === 'model' ? ('model' as const) : ('user' as const),
            text: m.content,
          }));
        } else {
          const created = await createChatThread({
            userId: dbUser.id,
            title: validation.data.message.slice(0, 70),
            rolePreset: validation.data.rolePreset,
            model: validation.data.model,
            systemInstruction: validation.data.systemInstruction || '',
          });
          activeThreadId = created.id;
        }
      } else if (activeThreadId) {
        return res.status(401).json({ error: 'Sign in with Google to access saved threads.' });
      }

      const systemInstruction = buildStudioSystemInstruction({
        rolePreset: validation.data.rolePreset,
        customInstruction: validation.data.systemInstruction,
        products,
        site,
      });

      const contents = [
        ...priorTurns.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
        { role: 'user' as const, parts: [{ text: validation.data.message }] },
      ];

      const chosenModel = validation.data.model;
      const config: {
        systemInstruction: string;
        maxOutputTokens?: number;
        thinkingConfig?: { thinkingLevel: ThinkingLevel };
        tools?: Array<{ googleSearch: Record<string, never> }>;
      } = {
        systemInstruction,
        maxOutputTokens: 900,
      };

      if (chosenModel === 'gemini-4-hydrogen') {
        if (validation.data.useSearchGrounding) {
          config.tools = [{ googleSearch: {} }];
        } else {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
      }

      const response = await ai.models.generateContent({
        model: chosenModel,
        contents,
        config,
      });

      const reply = response.text?.trim();
      if (!reply) {
        return res.status(502).json({
          error: 'No response was returned by the model. Please try rephrasing your prompt.',
        });
      }

      const sources = extractGroundingSources(
        response.candidates?.[0]?.groundingMetadata?.groundingChunks
      );

      if (dbUserId && activeThreadId) {
        await appendChatMessage({
          threadId: activeThreadId,
          role: 'user',
          content: validation.data.message,
        });
        await appendChatMessage({
          threadId: activeThreadId,
          role: 'model',
          content: reply,
          model: chosenModel,
          groundingSourcesJson: sources.length > 0 ? JSON.stringify(sources) : undefined,
        });
      }

      return res.json({
        reply,
        model: chosenModel,
        sources,
        threadId: activeThreadId,
      });
    } catch (error: unknown) {
      const cleanMessage = extractReadableErrorMessage(error);
      console.error('Studio chat error:', cleanMessage);
      const status =
        typeof (error as { status?: number })?.status === 'number' &&
        (error as { status: number }).status >= 400 &&
        (error as { status: number }).status < 600
          ? (error as { status: number }).status
          : 502;
      return res.status(status).json({ error: cleanMessage });
    }
  });

  app.post('/api/studio/search', optionalAuth, async (req: AuthRequest, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Google Search Grounding is currently unavailable because GEMINI_API_KEY is not configured.',
      });
    }

    const validation = validateStudioSearchInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: validation.query,
        config: {
          systemInstruction:
            'You are a health & nutrition research assistant for Dr. Ali Hassan Health & Wellness (BrainAxis). Use Google Search grounding to provide accurate, up-to-date, evidence-based summaries. Clearly cite facts, avoid diagnosing or claiming supplements cure/treat disease, and remind users that high-dose Vitamin D3 (200,000 IU) should only be used under physician advice. Keep formatting clean and scannable.',
          tools: [{ googleSearch: {} }],
        },
      });

      const summary = response.text?.trim();
      if (!summary) {
        return res.status(502).json({
          error: 'No grounded answer was returned for that search query. Please refine your query.',
        });
      }

      const sources = extractGroundingSources(
        response.candidates?.[0]?.groundingMetadata?.groundingChunks
      );

      let savedRecord = null;
      if (req.user) {
        const dbUser = await getOrCreateUser(
          req.user.uid,
          req.user.email || 'user@dralihassanwellness.pk',
          typeof req.user.name === 'string' ? req.user.name : undefined
        );
        savedRecord = await recordSearchQuery({
          userId: dbUser.id,
          query: validation.query,
          summary,
          sourcesJson: JSON.stringify(sources),
          model: 'gemini-4-hydrogen',
        });
      }

      return res.json({
        query: validation.query,
        summary,
        sources,
        model: 'gemini-4-hydrogen',
        savedId: savedRecord?.id ?? null,
      });
    } catch (error: unknown) {
      const cleanMessage = extractReadableErrorMessage(error);
      console.error('Studio search grounding error:', cleanMessage);
      const status =
        typeof (error as { status?: number })?.status === 'number' &&
        (error as { status: number }).status >= 400 &&
        (error as { status: number }).status < 600
          ? (error as { status: number }).status
          : 502;
      return res.status(status).json({ error: cleanMessage });
    }
  });

  app.get('/api/studio/searches', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dbUser = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || 'user@dralihassanwellness.pk',
        typeof req.user!.name === 'string' ? req.user!.name : undefined
      );
      const rows = await listRecentSearchQueries(dbUser.id);
      const searches = rows.map((row) => ({
        id: row.id,
        query: row.query,
        summary: row.summary,
        sources: parseGroundingSourcesJson(row.sourcesJson),
        model: row.model,
        createdAt: row.createdAt,
      }));
      return res.json({ searches });
    } catch (error) {
      const msg = extractReadableErrorMessage(error, 'Unable to load saved research history.');
      return res.status(500).json({ error: msg });
    }
  });

  app.get('/robots.txt', (_req, res) => {
    const baseUrl = process.env.APP_URL || '';
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /checkout',
        'Disallow: /account',
        baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const baseUrl = (process.env.APP_URL || 'https://dralihassanwellness.pk').replace(/\/$/, '');
    const routes = [
      '/',
      '/shop',
      '/product/brainaxis-energy-boost',
      '/product/brainaxis-sundex-d',
      '/about',
      '/services',
      '/contact',
      '/faq',
      '/ai-studio',
      '/track-order',
      '/privacy-policy',
      '/terms',
      '/shipping-policy',
      '/refund-policy',
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(xml);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
