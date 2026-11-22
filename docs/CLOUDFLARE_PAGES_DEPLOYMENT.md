# Cloudflare Pages deployment: Dr. Ali Hassan Health & Wellness

This repository is React + Vite with Firebase. Cloudflare Pages hosts the compiled static website in dist. It does not automatically execute server.ts (Express) or the Gemini API.

## Stage A: deploy preview without changing live DNS

1. In Cloudflare go to Workers & Pages > Create application > Pages > Connect to Git.
2. Select GitHub repository mmoavia7861/draliwellness and branch main.
3. Name draliwellness (if available), framework React (Vite), root directory /.
4. Build command: bun run build
5. Build output directory: dist
6. Optional build variable VITE_ENABLE_AI_STUDIO=false; leave VITE_AI_GUIDE_API_BASE_URL empty until the Worker is deployed. Never put Gemini keys in a VITE_ variable.
7. Deploy and verify the assigned pages.dev URL before touching custom domain records.
8. Test homepage, shop, both product images, /admin login, Firestore reads, checkout, order status, and direct navigation to /admin. Live Gemini is not yet deployed; the offline label guide is expected.

## Stage B: cut over custom domain after successful preview

Keep draliwellness.com on GitHub Pages until Pages is fully tested. Only after approval, connect draliwellness.com in Pages > Custom domains and use the exact DNS records Cloudflare instructs you to create. Preserve MX/TXT records and other unrelated DNS values. Check Firebase Authentication Authorized domains, website SSL, and both root and www. Keep the working GitHub Pages deployment as fallback until verification is complete.

## Stage C: later deploy Gemini AI backend

The root wrangler.toml is the Pages configuration (output dist). The separate workers/wrangler.toml is the AI Guide Worker configuration. From the repository root, run:
npx wrangler secret put GEMINI_API_KEY --config workers/wrangler.toml
npx wrangler deploy --config workers/wrangler.toml

On the Cloudflare Pages project, configure the build variable VITE_AI_GUIDE_API_BASE_URL to the deployed public workers.dev origin and redeploy. Do not expose the secret key in client code.

Cloudflare Pages deployment is a frontend migration, not an automatic deployment of Express routes. The existing Firebase project retains auth and database functions.
