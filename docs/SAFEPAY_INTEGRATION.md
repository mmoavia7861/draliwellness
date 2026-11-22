# Safepay Online Payment — Dr. Ali Hassan Health & Wellness

## Current status

This repository now includes the **Safepay hosted-checkout integration**, but
**LIVE PAYMENTS ARE DISABLED BY DEFAULT**. No merchant credentials were provided
and no sandbox end-to-end transaction has been observed.

Cash on Delivery and WhatsApp checkout remain unchanged.

## Architecture

- React checkout adds Safepay only when the storefront CMS enables online
  payments **and** the Worker status endpoint reports configured.
- The browser creates a Firestore order with `paymentStatus: pending` and
  `paymentMethod: safepay`; it never marks an order paid.
- `POST /api/payments/safepay/checkout` validates the order against the
  canonical Firestore product prices, variants, stock, coupon (if present)
  and delivery rules **server-side** before creating a payment tracker.
- Safepay's API requests use server-side merchant credentials. The browser
  redirects to **Safepay Hosted Checkout**, never collecting card numbers.
- `POST /api/payments/safepay/webhook` validates the HMAC signature of the
  raw body; validates merchant key, tracker, amount, currency and
  Safepay Reporter `TRACKER_ENDED` state. Only then, **in production**, does the Worker update
  `orders` and `orderTracking` to `paymentStatus: paid`. Sandbox tests
  record `sandbox_succeeded` privately, never as actual paid revenue.
- A returning shopper sees `/payment-result`; the page queries the
  order status but never treats a redirect as confirmed payment.
- Firestore private collections `safepayCheckouts`, `safepayTrackers`,
  and `safepayWebhookEvents` have no public access under default-deny
  rules. The service account reads/writes those collections server-side.

## Official reference

- Safepay hosted checkout: https://safepay.alihamas.pk/docs/payments/get-started/express-checkout
- Safepay API credentials: https://safepay.alihamas.pk/docs/developers/safepay/api-keys
- Safepay webhook verification: https://safepay.alihamas.pk/docs/developers/webhooks/verify-hmac-signatures
- Safepay webhook configuration: https://safepay.alihamas.pk/docs/developers/webhooks/overview
- Safepay API sandbox: https://sandbox.api.getsafepay.com

## Step 1: Obtain an approved Safepay merchant account

Create a Safepay **sandbox** merchant account, then obtain its:
- Public API key
- Private API secret key
- Sandbox webhook HMAC secret (not the same as the API secret)

Production requires separate approved merchant credentials, enabled payment
methods and a separate live webhook secret. Confirm that merchant approval
covers the actual supplements being sold and applicable legal requirements.

Do **not** paste secrets into GitHub, ChatGPT, public code, or any VITE_
variable. Never capture card PAN/CVV on this website.

## Step 2: Create scoped Firebase server credentials

Worker needs **server-side access** to the project's named Firestore database:

`watchful-adapter-wbcxw` /
`ai-studio-e97294bf-5393-4976-a852-dec4adb1854d`

Provision an appropriately scoped Google Cloud service account with just the
Firestore privileges needed to read products, orders, site settings, coupons,
and create payment-session records and payment-status updates. Avoid Owner,
Editor or broad Firebase Admin access if narrower roles can be used. If key
creation is permitted, securely download the service-account JSON and store
it ONLY as a Worker secret named `FIREBASE_SERVICE_ACCOUNT_JSON`.

Prefer keyless workload identity federation if supported in your deployment
environment; the current implementation expects the JSON service-account
credential. Protect, rotate and revoke keys according to Google Cloud policy.

## Step 3: Configure Cloudflare Worker runtime

Cloudflare Dashboard > Workers & Pages > **draliwellness** >
Settings > Variables and Secrets (**Runtime / Production**):

| Name | Type | Value |
| --- | --- | --- |
| `SAFEPAY_PUBLIC_KEY` | Secret | Safepay sandbox public API key |
| `SAFEPAY_SECRET_KEY` | Secret | Safepay sandbox secret API key |
| `SAFEPAY_WEBHOOK_SECRET` | Secret | HMAC key for the sandbox webhook |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Secret | Complete Google service account JSON |
| `SAFEPAY_ENV` | Plain text | `sandbox` |
| `SAFEPAY_ENABLED` | Plain text | `false` until sandbox verification |

Never use the **Builds** secret section instead of Runtime.

After all credentials are configured and the developer has reviewed the
integration, set `SAFEPAY_ENABLED=true` to enable sandbox flow.
Before the payment gateway is verified, keep it `false`.

## Step 4: Publish Firestore Security Rules

The repository `firestore.rules` allows `safepay` for order creation,
but users must publish those new rules to the **named database**. Never
replace rules with `allow read, write: if true`.
Rules must continue to forbid clients from setting `paymentStatus: paid`.

Note: Cloudflare deploys GitHub code. It does NOT publish Firestore rules
automatically.

## Step 5: Set the admin CMS toggle

In `https://draliwellness.com/admin`, open CMS / Store Settings →
**Commerce, Shipping & Payment Options** and enable **Online Payments**,
then save. Keep COD enabled during rollout.

The Safepay option is shown only if this CMS switch AND the Worker runtime
configuration both allow online payments. In sandbox the option is
explicitly labeled **Test Mode**.

## Step 6: Configure webhook in Safepay sandbox dashboard

Safepay Dashboard -> Developers -> Endpoints -> Add endpoint.

Use the actual worker URL on which the new code is deployed, for example
`https://ACTUAL-WORKER.workers.dev/api/payments/safepay/webhook`

Subscribe to **payment.succeeded** and relevant failure/refund events.
Only a signed `payment.succeeded` event with a matching server-verified
PKR payment results in marking the order paid.
Failure/refund handling is currently informational; **manual reconciliation
is required before enabling live production payments**.

The HMAC signature is compared against the raw webhook body. Event tokens are
logged for visibility; status transitions are idempotent for a paid order.
Verify webhook delivery and signature mode against the actual Safepay
sandbox event payload. Safepay publishes multiple API generations, and
any mismatches must be resolved in sandbox before going live.

## Step 7: Test and verify before production

Test against the **Cloudflare Worker preview**, not the GitHub Pages
custom domain, until the custom-domain deployment is switched.

1. `GET /api/payments/safepay/status` should return JSON, `enabled:false`
   when disabled and `enabled:true,environment:sandbox` after configuration.
2. When both runtime and CMS switches are on, checkout shows Safepay
   **(Test Mode)** next to COD and WhatsApp.
3. Place a sandbox order; verify the order is created as `pending`.
4. Confirm the server recalculates its entire amount and the user is
   redirected to the real Safepay sandbox checkout URL.
5. Test successful, refused, cancelled, and timed-out sandbox payments.
6. Confirm an unsigned/forged webhook returns HTTP 401 and cannot mark paid.
7. Confirm a mismatched amount, currency or tracker cannot mark paid.
8. Verify sandbox `payment.succeeded` records test success only in the
   private checkout session. In an approved production test, verify it
   updates `orders` and `orderTracking` once without altering COD orders.
9. Confirm duplicate webhook delivery cannot double-count sales.
10. Confirm Admin reporting reflects only verified paid transactions.
11. Enable Cloudflare WAF / rate limiting on POST checkout requests and
    consider CAPTCHA if abuse is detected.
12. Ensure webhooks retry/reconciliation and order inventory reservation
    are production reliable. The existing site does not yet provide
    atomic stock deduction across orders.

## Production release gate — DO NOT SKIP

A production merchant account must be approved, actual product sales must be
permitted, separately provisioned live credentials must be configured,
the Webhook must be registered at the correct live URL, sandbox tests must
pass, idempotency and concurrency must be audited, and live low-value tests
must be explicitly authorized. Only then consider setting
`SAFEPAY_ENV=production` and enabling production payments.

**Neither code changes nor an `enabled:true` flag alone mean payments
are confirmed.** The gateway has not processed any verified live transaction
during preparation of this integration.
