# Automatic order email alerts — Dr. Ali Hassan Health & Wellness

The storefront stores an order in Firestore and sends a notification request to the Cloudflare Worker. The Worker sends the store owner an email through Resend. The alert is not proof of payment.

## What the email includes

With full-detail notification enabled, each email includes order number, payment method (PAYMENT PENDING), customer name, email, phone, complete street address, city, province and postal code when supplied, each product and variant with quantity/unit price/line total, subtotal, coupon/discount, shipping, total payable and optional order notes.

The browser does not supply these private fields to the email API. The server verifies a new Firestore orderTracking record and reads the matching private order with a dedicated read-only service account.

## Configure four Cloudflare Worker runtime settings

Go to Cloudflare -> Workers & Pages -> draliwellness -> Settings -> Variables and Secrets. Add under **Runtime**, not the Builds secrets area.

1. RESEND_API_KEY (Secret): transactional Resend send-only API key.
2. ORDER_NOTIFICATION_FROM (Plain text): e.g. BrainAxis Orders <orders@draliwellness.com>. Sender domain must be verified in Resend.
3. ORDER_NOTIFICATION_TO (Secret): the owner's working inbox, e.g. current Gmail until the custom business mailbox exists.
4. FIREBASE_SERVICE_ACCOUNT_JSON (Secret): full JSON for a dedicated read-only Google Cloud service account in the website's Firebase project.

Never place these credentials in GitHub, chat, public frontend VITE_ variables, or build logs.

### Resend sender setup

Visit https://resend.com/domains and verify draliwellness.com (or a dedicated sending subdomain). Add the exact SPF and DKIM records required by Resend in Cloudflare DNS. Preserve current MX records for receiving mail. Sending from a verified domain does not itself create a receiving mailbox.

### Read-only Firestore service account

1. Open https://console.cloud.google.com/iam-admin/serviceaccounts and select the same project as this Firebase site.
2. Create a dedicated service account, for example drali-order-alert-reader.
3. Grant the **Cloud Datastore Viewer** (roles/datastore.viewer) role. Do NOT use Owner, Editor or Firebase Admin.
4. In the service account's Keys page, create a JSON key only if organizational security policies allow it.
5. Paste the *entire* JSON only into the Cloudflare Runtime Secret FIREBASE_SERVICE_ACCOUNT_JSON, never into a build variable or repository.
6. Protect and rotate the key: even a read-only service account can read private customer data.

### Activation check

After saving settings, open:
https://draliwellness.moavia400.workers.dev/api/orders/notification-status

Expected when all four settings are present:
```json
{"enabled":true,"fullOrderDetailsEnabled":true}
```

If fullOrderDetailsEnabled is false, the Worker can only send the older minimal email summary. Presence of settings does not confirm provider delivery or valid permissions.

### Test end to end

Place one small COD test order. Verify order appears under /admin, then check the configured inbox and Spam for a new BrainAxis order email including full customer information and ordered items. Inspect Resend Email Logs and Cloudflare Workers Logs if delivery fails. Payments remain pending until merchant verification.

## Security and reliability

- Order documents and customer addresses must remain private in Firestore rules.
- HTTP responses and console logs must never include private order contents or secrets.
- Resend's idempotency key helps avoid duplicate alerts for the same order.
- Notification delivery is best effort: the browser calls the Worker after a successful Firestore write, so an offline browser or provider outage can prevent email delivery. The order remains safely in Firebase admin. For guaranteed retries later, use a trusted Firestore trigger plus queue/retry processing.
- This code change does not provision a mailbox or add real secrets automatically.
