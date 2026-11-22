# Dr. Ali Hassan Health & Wellness — Cloudflare Workers Static Assets

The frontend is React + Vite; its compiled output is `dist`.
The Cloudflare project named `draliwellness` was created under **Workers** (not Pages),
so it must use Workers Static Assets rather than `pages_build_output_dir`.
The root `wrangler.toml` now contains `[assets] directory = "./dist"` and
`not_found_handling = "single-page-application"` for React Router routes.

## Deploy from the EXISTING Cloudflare Workers project

Keep these Build settings:
- Git repository: `mmoavia7861/draliwellness`
- Production branch: `main`
- Build command: `bun run build`
- Deploy command: `npx wrangler deploy`
- Preview command: optional (leave unset; `npx wrangler preview` is not a required deploy command).
- Root: repository root.

Once GitHub receives this change, Cloudflare Git-connected Builds should launch a new build.
If not, in Workers & Pages -> `draliwellness` -> Deployments / Builds,
trigger a new deployment of the latest commit. Do not create a second Worker.
The initial preview URL is the actual workers.dev hostname Cloudflare assigns.

Check the preview before custom-domain migration:
- `/` homepage renders, no white screen
- `/shop` renders, and both BrainAxis product images load
- `/admin` direct navigation and refresh return the React page
- Firebase admin login and database permissions work
- Cart and COD checkout work and server-side validation remains in place
- No 404/HTML response is mistaken for an AI backend API

**Do not change `draliwellness.com` DNS yet.** The current domain is still
serving GitHub Pages. Static Workers preview testing is separate from
cutting over the live custom domain. Only attach the domain to the Worker
once the preview works, and replace existing GitHub Pages web records
according to Cloudflare’s custom domain setup. Preserve email and verification records.

## Later, separately deploy Gemini AI Guide

The *separate* AI Worker configuration lives at `workers/wrangler.toml`.
Its `GEMINI_API_KEY` must be a server-side secret. Never put it in the Vite client.
Use `npx wrangler deploy --config workers/wrangler.toml` for the AI Worker.

Static assets do NOT execute the Express server from `server.ts`.
Until the AI Worker exists, the storefront AI Guide should use its
explicitly labeled offline product-information fallback.
