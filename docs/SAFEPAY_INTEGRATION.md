# Safepay + Cloudflare D1: setup for Dr. Ali Hassan Health & Wellness

**State (November 22, 2026):** Code prepared in GitHub for **Safepay SANDBOX ONLY**.
The backend is fail-closed: **real live card payments are disabled by design**.
This migration does **not** move/delete the existing Firebase orders, customer
data, inventory, or Cloudflare assets. It does **not** require a
`FIREBASE_SERVICE_ACCOUNT_JSON` key or a Google Cloud billing upgrade.

## D1 and code configuration

- Existing account D1 database: **draliwellness-payments**
- ID: `ec0fd0f9-026a-4d88-ace3-d7e1c79dc1e4`
- Wrangler binding name: **PAYMENTS_DB** (in root `wrangler.toml`)
- SQL file: `migrations/0001_safepay_sessions.sql`
- Worker: `workers/site-with-ai.js` -> `workers/safepay.js`
- Public WordPress/GitHub Pages domain may be separate from Worker. The
  frontend currently calls the actual Worker origin
  `https://draliwellness.moavia400.workers.dev` and passes the allowed return origin.

## 1. Initialize the D1 tables

Open Cloudflare Dashboard -> **Storage & databases -> D1 SQL Database ->
draliwellness-payments -> Console**. Copy the entire contents of
[migrations/0001_safepay_sessions.sql](../migrations/0001_safepay_sessions.sql)
and execute it. Confirm you now see two tables:
`safepay_sessions` and `safepay_events`.

Alternative CLI (from the checked-out repository, authenticated Wrangler):

```sh
npx wrangler d1 migrations apply draliwellness-payments --remote
```

Run either the Dashboard SQL **or** Wrangler remote migration (not both
unless you understand migration tracking). If you paste SQL manually, do not
rerun migration CLI without verifying the migration history first.

## 2. Deploy the updated Worker

`wrangler.toml` includes the **same** database ID and binding. From repo root:

```sh
npm run build
npx wrangler deploy
```

Do not overwrite deployment secrets. Confirm **Workers & Pages ->
draliwellness -> Settings -> Bindings** shows D1 **PAYMENTS_DB**.

The GitHub Pages workflow builds the frontend; it does **not** automatically
deploy Cloudflare Workers or create D1 tables. Running the SQL and Worker
deployment requires access to the user's Cloudflare account.

## 3. Runtime settings: sandbox only

In Cloudflare Worker -> Settings -> **Runtime Variables and Secrets**:

| Setting | Type | Value |
| --- | --- | --- |
| `SAFEPAY_PUBLIC_KEY` | Secret | Safepay **sandbox** public API key |
| `SAFEPAY_SECRET_KEY` | Secret | Safepay **sandbox** private API key |
| `SAFEPAY_WEBHOOK_SECRET` | Secret | shared secret for the **sandbox** webhook endpoint |
| `SAFEPAY_ENV` | Plain text | `sandbox` |
| `SAFEPAY_ENABLED` | Plain text | **`false` until all tests/setup are ready** |

`FIREBASE_SERVICE_ACCOUNT_JSON` is **not used** by the D1 Safepay backend.
Remove/revoke unused private keys if previously created; do not paste secrets
into chat, GitHub, JS client bundles, or public variables.

Gateway webhook: `https://draliwellness.moavia400.workers.dev/api/payments/safepay/webhook`
and subscribe to `payment.succeeded` (use the sandbox merchant dashboard).

## 4. Enable SANDBOX after the steps above

When database tables, Worker deployment, and sandbox credentials exist:

1. Set `SAFEPAY_ENABLED=true` (runtime only, **not** production).
2. Open `https://draliwellness.moavia400.workers.dev/api/payments/safepay/status`.
   Expected `{"enabled":true,"environment":"sandbox"}`.
3. In protected `/admin` CMS enable **Online Payments** and save.
4. Checkout should display **Safepay Online Payment (Test Mode)**.
5. Use an official Safepay sandbox test card; never a real card for sandbox.
6. Check the return page and webhook deliveries in Safepay's sandbox dashboard.
7. In Cloudflare D1 -> Console, use:

```sql
SELECT order_id,amount_minor,currency,environment,status,tracker,created_at,verified_at
FROM safepay_sessions ORDER BY created_at DESC LIMIT 20;
SELECT event_id,event_type,result,created_at FROM safepay_events
ORDER BY created_at DESC LIMIT 20;
```

No cards or CVVs are stored in D1; customer emails are SHA-256 hashed. Each
order is limited to one session unless manually reconciled to prevent duplicate
charges. A webhook must have a valid SHA-512 HMAC signature and must pass an
independent Safepay Reporter check for exact tracker, PKR amount and state.

## 5. Important current restriction

**D1 is currently the independent payment truth.** The Firebase AI Studio
Starter Tier account does **not** expose the admin service-account credential
required to update private `orders/{id}` and `orderTracking/{id}` automatically.

- **The backend is deliberately SANDBOX ONLY** until secure
  Firebase-order reconciliation or a new fulfillment architecture is implemented
  and independently tested. Changing the variable to `production` leaves
  the gateway disabled.
- A sandbox `payment.succeeded` is recorded as `sandbox_succeeded` in D1
  and displayed as **Test Completed — No Real Payment**.
- Customer checkout success and redirect alone do not mark real payments paid.
- The existing Firebase Admin panel may continue to say **pending**;
  operators must reconcile using order ID/tracker before shipment. Do not ship
  just because a browser says 'success'.
- Track and verify refunds/disputes separately before production launch.
- The current order creation still happens through Firebase client rules.
  This is not yet sufficient for a fully auditable production payment and order
  reconciliation system. Production remains blocked.

## 6. Security checklist

- Only publish the existing restrictive Firebase rules; never use
  `allow read,write: if true` to get checkout working.
- Avoid logging API keys or complete personal/order data.
- Configure Cloudflare WAF/rate-limits for `POST /api/payments/safepay/checkout`,
  `POST /api/payments/safepay/order-status` and webhook routes as appropriate.
- Verify the named Firestore public catalog and order-tracking REST GETs are
  available to the Worker. If not, diagnose IAM or Firestore security rules,
  **do not open private orders to unauthenticated requests**.
- Use Cloudflare Runtime Variables, not build-time client-side variables.
- Verify Webhook request signature on the **raw** request body and match
  provider-reported amount/currency before recording successes.

## Reference

- Safepay Express Checkout: https://safepay.alihamas.pk/docs/payments/get-started/express-checkout
- Safepay signature verification: https://safepay.alihamas.pk/docs/developers/webhooks/verify-hmac-signatures
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
