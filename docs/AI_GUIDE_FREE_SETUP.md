# BrainAxis AI Guide — Gemini Free Tier Setup

The React storefront and BrainAxis AI Guide now share the same Cloudflare Worker, `draliwellness`. The Worker routes `/api/assistant/*` to Gemini and serves the Vite `dist` frontend through static assets. The old Express server in `server.ts` is not used by Cloudflare.

## Current single-Worker setup

The main Cloudflare Worker is **draliwellness**, configured by the root
`wrangler.toml` and `workers/site-with-ai.js`. It combines the static React
site with `workers/ai-guide.js` under `/api/assistant/*`. No second Worker,
separate API URL, or Vite API base variable is needed on this deployment.

1. Let Git-connected Cloudflare Builds deploy the latest main branch.
   Existing build command: `bun run build`; deploy command:
   `npx wrangler deploy`.
2. In Cloudflare -> Workers & Pages -> `draliwellness` -> Settings ->
   Variables and Secrets, add `GEMINI_API_KEY` as **Secret** (not plain text).
   Keep this key private; do not include it in source code or VITE variables.
3. Deploy/Save the secret and verify the actual `https://<worker>.workers.dev/api/assistant/status`
   URL returns JSON with `enabled: true`. Before the key is added, status
   reports `enabled: false`.
4. Visit the actual storefront Worker preview URL, open AI Guide, and test
   short English and Roman Urdu questions and SUNDEX-D high-dose caution.
5. Before making the API publicly available at scale, enable edge rate
   limiting and quota alerts. This repository's optional KV guard is not a
   substitute for a hard Cloudflare rate-limit rule.

## Already changed in this repository

- The Express backend and Cloudflare Worker use `gemini-3.1-flash-lite` as
  the preferred free-tier text model, with `gemini-2.5-flash-lite` as a
  free-tier fallback for 404/503/504 only. No paid-only automatic fallbacks.
- The public AI Guide first probes `/api/assistant/status` and shows an
  explicitly marked **offline product information** mode while no backend
  exists or a free-tier quota is exhausted. This fallback is **not AI**.
- The key stays server-side; it must never be a `VITE_` environment variable.

## Alternative: separate AI Worker (not needed for current setup)

1. Obtain a Gemini Developer API key in [Google AI Studio](https://aistudio.google.com/apikey).
   Use a Google Cloud project with the free-tier quotas you intend to use.
   Free tier is quota-limited; model use on a paid-tier project can be billed.
2. In a terminal with Node.js, authenticate to Cloudflare:
   `npx wrangler login`
3. From the repository root, save the key securely:
   `npx wrangler secret put GEMINI_API_KEY --config workers/wrangler.toml`
   Paste the key in the terminal prompt, **never** in GitHub code or public chat.
4. Deploy the Worker:
   `npx wrangler deploy --config workers/wrangler.toml`
   Save the exact `https://...workers.dev` URL printed by Wrangler.
5. Only for separate-Worker deployments, configure the storefront build variable
   `VITE_AI_GUIDE_API_BASE_URL` to the AI Worker URL. Leave it empty for the
   single-Worker setup above.
   This is a public endpoint address, not the secret key.
6. Redeploy the current frontend host so Vite embeds the Worker URL.
7. Test the site's AI Guide: status should show `Gemini Flash-Lite · Free tier`
   and successful chats should answer via the Worker. Test both English
   and Roman Urdu. For SUNDEX-D 200,000 IU, verify the physician caution.

## Cloudflare custom-domain alternative

If the domain is in Cloudflare DNS, route `draliwellness.com/api/assistant/*`
to the Worker using the Cloudflare dashboard. In that case the site may use
same-origin API paths and `VITE_AI_GUIDE_API_BASE_URL` may stay empty.
Do not point the whole website to the Worker; only `/api/assistant/*`.

## Security and rate limiting

The Worker restricts browser origins, request size, history size, and model
choices. Origin checks alone are **not** anti-abuse controls because an
external script can spoof Origin. Before public launch:
- Add a Cloudflare WAF / Rate Limiting rule to restrict POST
  `/api/assistant/ask` requests.
- Optionally bind a Workers KV namespace as `AI_RATE_KV` and configure a
  `RATE_LIMIT_SALT` secret for an extra, approximate per-IP limit. KV writes
  are eventually consistent; the WAF should be the hard rate limit.
- Watch the Google AI Studio per-model API quotas and keep billing disabled
  if zero spend is essential.
- Never ask customers for identifiable medical histories or lab results
  in the chat. Google free-tier data handling differs from paid tiers.

## Important limitations

The Cloudflare Worker in this folder provides **only the homepage AI
Supplement Guide endpoints** (`/api/assistant/status`, `/api/assistant/ask`).
The optional Full Studio, saved chats and web-grounding endpoints under
`/api/studio/*` still require the full authenticated Node backend.
Keep `VITE_ENABLE_AI_STUDIO=false` on the static build.

This repository code and Worker configuration do not by themselves activate
live Gemini. Actual activation requires a deployed Worker and a private API
key, and should be verified in a real browser afterward.
