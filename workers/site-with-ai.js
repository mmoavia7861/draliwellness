/**
 * Dr. Ali Hassan Health & Wellness storefront.
 * AI Guide feature retired: do not call Gemini or expose AI endpoints.
 * Keep the 410 response to avoid serving the SPA for stale AI URLs.
 */
import { orderMailRouter } from './order-notifications.js';

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/assistant/')) {
      return new Response(JSON.stringify({ error: 'AI Guide is no longer available.' }), {
        status: 410,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }
    if (path.startsWith('/api/orders/')) {
      return orderMailRouter(request, env);
    }
    if (path.startsWith('/api/')) {
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
