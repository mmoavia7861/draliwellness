import aiGuide from './ai-guide.js';

/**
 * One Cloudflare Worker for the React storefront and its Gemini AI Guide.
 * Static assets are served by Cloudflare, with the Worker invoked first
 * only for /api/assistant/*.
 */
export default {
  async fetch(request, env, ctx) {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith('/api/assistant/')) {
      return aiGuide.fetch(request, env, ctx);
    }

    // Defensive fallback for direct Worker invocations and future routes.
    // Unknown /api/ paths must never return the React index.html document.
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'API route not found.' }), {
        status: 404,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
