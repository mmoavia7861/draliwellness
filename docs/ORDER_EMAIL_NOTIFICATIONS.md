# Order Notification Emails — Dr. Ali Hassan Health & Wellness

The website now requests a transactional **owner notification email** after
the customer's order is successfully saved to Firestore. This covers COD,
WhatsApp-confirmation and Safepay-pending orders. Payment status is explicitly
**pending** in this email; it is not proof of card payment.

The worker verifies a fresh, real order-tracking record in the existing
Firebase project's named database before using Resend. This approach does
**not** require a Firebase service-account JSON key or Google Cloud upgrade.

## What is already implemented

- Worker route `POST /api/orders/notify` validates an order number and email.
- Worker independently computes the same hashed tracking ID as the storefront,
  fetches the public/minimal Firestore `orderTracking` document, and verifies
  order number, pending status, method and creation time (<15 min old).
- Email sent from Resend, with an idempotency key per order, containing order
  number, payment method, total, city, item summary and buyer email.
- Email recipients/Resend key are *never* sourced from the visitor.
- Email failure never undoes an already-saved Firebase order.
- Safepay and COD order storage are unchanged.
- `GET /api/orders/notification-status` returns JSON `{enabled:false}`
  until all three email settings below exist in the Worker runtime.
- The frontend uses `https://draliwellness.moavia400.workers.dev` for
  notifications while the root domain may still be served by GitHub Pages.
  Later, you may override with public build env `VITE_ORDER_NOTIFICATION_API_URL`.

## Activation steps (only 3 Worker runtime settings)

1. Create a [Resend](https://resend.com/) account and add the domain
   `draliwellness.com` (or a dedicated sending subdomain).
2. Add exactly the DNS records displayed by Resend to **Cloudflare DNS**
   and verify the sending domain. Keep existing MX and other mail records.
3. Create a Resend API Key with **send-only** permission if available.
4. Cloudflare -> Workers & Pages -> `draliwellness` ->
   Settings -> Runtime -> Variables and Secrets. Add:
   
   | Name | Type | Example/value |
   |---|---|---|
   | `RESEND_API_KEY` | Secret | Actual Resend API key (never share) |
   | `ORDER_NOTIFICATION_FROM` | Plain text | `BrainAxis Orders <orders@draliwellness.com>` (after verifying domain) |
   | `ORDER_NOTIFICATION_TO` | Secret | Your chosen inbox address that should receive order alerts |
   
   Do not use the **Builds** secrets section.
5. Deploy / Save changes. Verify
   `https://draliwellness.moavia400.workers.dev/api/orders/notification-status`
   returns `{"enabled":true}`. This checks configuration only, NOT delivery.
6. Place an actual **small test COD order** using the website while the
   Firestore `orderTracking` data is accessible under its existing rules.
   Check the destination Inbox and Spam, plus Resend Emails/Logs.
   In case of errors, inspect Cloudflare Worker Logs. Unverified sending
   domains / sandbox sending restrictions can prevent delivery.

## Safety and limitations

- New order notification is not a card payment receipt; Safepay requires
  separately configured merchant credentials, verified webhook and server-side
  order reconciliation. Safepay remains disabled until those steps pass.
- Resend's idempotency header helps prevent duplicate notifications for
  24 hours; not a permanent global deduplication lock. The Worker only
  accepts newly placed (within 15 minutes) order notifications.
  Add Cloudflare WAF request rate limiting on `/api/orders/notify`
  if abuse occurs or before large scale.
- Owner emails deliberately exclude buyer street address and phone.
  Review complete order details in the existing protected `/admin` page.
- The Firestore client writes orders and `orderTracking` in one batch;
  the Worker only reads the tracking document. If direct REST reads are
  blocked by IAM/API policy, set up a trusted server read service rather
  than opening private order documents to the public.
- In the event the email fails, the order is **still saved in Firebase**.
  Keep Admin orders as the source of truth for fulfillment.
