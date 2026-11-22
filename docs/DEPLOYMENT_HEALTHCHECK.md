# Deployment and live-site diagnostics — Dr. Ali Hassan Health & Wellness

## Current hosting architectures

- GitHub Actions workflow `.github/workflows/pages.yml` publishes a React + Vite static artifact to GitHub Pages.
- Cloudflare Worker `draliwellness` uses `wrangler.toml` and serves the Vite `dist` folder via Workers Static Assets. It also routes `/api/orders/*`.
- These deployments are **not** the same thing. A GitHub Pages success does not verify the Cloudflare Worker or the live custom domain.
- The current Worker intentionally returns **HTTP 410** for `/api/assistant/*`; the AI Guide was retired in a separate commit on 2026-11-22. An outdated AI deployment instruction in another document must not be used to silently re-enable it.

## GitHub Pages and Cloudflare DNS cutover

1. In GitHub repository **Settings → Pages**, confirm the custom domain `draliwellness.com` and enforce HTTPS when available. For **GitHub Actions** custom workflows, GitHub explicitly states a CNAME file is *not required* and existing CNAME files are ignored.
2. Confirm Cloudflare DNS matches the prior provider: A records `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` CNAME pointing to `mmoavia7861.github.io`. Start with DNS-only while testing GitHub Pages HTTPS.
3. Preserve any valid pre-existing MX/TXT/SPF/DKIM/DMARC/verification records. Do not add random MX records or change email routing unless the business uses a configured email provider.
4. Confirm DNSSEC/DS in Spaceship is disabled for the transition. Only then switch registrar NS to the exact Cloudflare-assigned nameservers, and request Cloudflare verification.
5. Verify domain and SSL externally with `Resolve-DnsName draliwellness.com -Type NS`, `Resolve-DnsName draliwellness.com -Type A` on Windows, then `https://draliwellness.com/`, `/shop`, `/admin`, `/sitemap.xml` and `/robots.txt`.
6. If using Cloudflare Worker for the **main domain** instead of GitHub Pages, attach the domain to the deployed Worker in Cloudflare, verify Worker assets and order notification routes, and remove any conflicting legacy GitHub origin mapping only after preview testing. Do not assume both can own the same apex route.

## Live checks beyond GitHub Actions

- Confirm the Firestore **named database** matches `firebase-applet-config.json` and its *actual published* security rules. Repository `firestore.rules` does not auto-publish.
- Admin: verified login, view both persisted products, create/edit a test record with valid Firestore rules, then remove only the test record.
- Checkout: real COD order persisted to Firestore and orderTracking atomically, no duplicate orders from double submit, all prices and discounts correct, and payment status remains pending for manual wallet transfers until the merchant verifies receipt.
- Notification: `/api/orders/notification-status` showing enabled is **configuration only**; actual email delivery requires a verified Resend sender and real provider logs.
- AI Guide: do not mistake the intentional 410 response for a connectivity regression.
- Medical product pages must preserve SUNDEX-D **200,000 IU high-dose clinical-supervision warning**.

## CI coverage

GitHub Actions validates TypeScript, existing Node-style logic tests under Bun, the parseability of critical Worker API modules, build artifact, robots directives, sitemap canonical URLs, and GitHub Pages static deployment.

**Limitations:** CI does not publish Firebase rules or Cloudflare zone changes. An external live-site browser/HTTP check is mandatory before declaring the custom domain operational.
