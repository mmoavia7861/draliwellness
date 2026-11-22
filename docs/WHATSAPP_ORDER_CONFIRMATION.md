# Dr Ali Wellness — customer WhatsApp order confirmation (staged)

**Not live until Meta WhatsApp Business Cloud API, approved template, Cloudflare KV, and Firebase rules are configured.** This branch is prepared as a draft PR only. Existing orders, email notifications and current admin access remain unchanged until cutover.

## Desired journey

1. Customer places an order on draliwellness.com and optionally ticks an explicit WhatsApp order confirmation consent checkbox (off by default).
2. The checkout stores the order in private Firestore /orders and a privacy-minimized /orderTracking document containing opt-in=true and a one-way phone fingerprint (NOT the phone).
3. After the order is saved, the browser requests a one-time confirmation from the Cloudflare Worker. It sends only if the recipient number matches the stored fingerprint and the order is recent, pending and opted in.
4. The official Meta WhatsApp Cloud API sends a pre-approved **Utility** template containing order ID and PKR total, plus two Quick Reply buttons: **Confirm Order** and **Cancel Order**.
5. When customer taps one, Meta sends a signed webhook to the Worker. Worker validates Meta signature and the responding WhatsApp number, records the answer in Cloudflare KV and emails an alert to existing owner inbox configured by `ORDER_NOTIFICATION_TO`.
6. Merchant reviews the answer and updates the order in Firebase Admin -> Orders. **The webhook does not automatically update Firestore order/payment statuses**, because there is no privileged server write identity yet. In particular, customer pressing Confirm never marks their payment "Paid".

## Suggested approved Meta template

- Name: `brainaxis_order_confirm_v1` (must match the actual approved name)
- Language: `en`
- Category: **UTILITY**
- Text body:

  `Thank you for your order with Dr. Ali Hassan Health & Wellness. Order {{1}} for PKR {{2}} is waiting for your confirmation. Would you like to confirm or cancel it?`

- Buttons (in exactly this order): **Confirm Order** (quick reply) and **Cancel Order** (quick reply).
- Keep product/medical details out of WhatsApp content to protect privacy.
- Template approval and exact category are decided by Meta; no unapproved messages will be sent.

Official reference: https://developers.facebook.com/documentation/business-messaging/whatsapp/overview

## Prerequisites

A Meta Business portfolio, WhatsApp Business Account, registered Cloud API sending number, phone-number ID, long-lived system-user messaging token, approved template, Meta app secret, and webhook verify token. The sender number is NOT the customer's number. Do not paste tokens or app secrets into GitHub or chats. WhatsApp utility template messages may be billed based on Meta's current pricing, so check rates before enabling.

### Cloudflare Worker Runtime Variables and Secrets

In Workers & Pages -> draliwellness -> Settings -> Variables and Secrets (RUNTIME, not BUILD):

| Name | Type | Value |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Secret | Meta WhatsApp Cloud API bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | Text | WhatsApp business sender phone number ID, not phone digits |
| `WHATSAPP_TEMPLATE_NAME` | Text | Approved template name `brainaxis_order_confirm_v1` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Text | Approved language, e.g. `en` |
| `WHATSAPP_APP_SECRET` | Secret | Meta app secret for signed webhook verification |
| `WHATSAPP_VERIFY_TOKEN` | Secret | A random token you choose for webhook setup |
| `WHATSAPP_GRAPH_API_VERSION` | Text | Optional, e.g. `v27.0` |
| `WHATSAPP_CONFIRMATIONS` | KV namespace binding | Private namespace for send dedupe and customer replies |

Cloudflare KV is required to limit duplicate sends and track replies. **Create a new private KV namespace** in Cloudflare, e.g. `draliwellness-whatsapp-confirmations`. Then add its binding to the Wrangler configuration using the real namespace id before merging:

```toml
[[kv_namespaces]]
binding = "WHATSAPP_CONFIRMATIONS"
id = "REPLACE_WITH_YOUR_CREATED_NAMESPACE_ID"
```

Do not commit this placeholder as if it were a real binding. Worker runtime variables must also be added in Cloudflare; the code does not provision a Meta account, KV or secrets.

### Meta webhook

Set webhook callback:

`https://draliwellness.com/api/whatsapp/webhook`

Or when custom domain traffic isn't routed to the Worker:

`https://draliwellness.moavia400.workers.dev/api/whatsapp/webhook`

Use the same `WHATSAPP_VERIFY_TOKEN` in Meta's webhook setup; subscribe to the WhatsApp `messages` event. The server verifies `X-Hub-Signature-256` with `WHATSAPP_APP_SECRET`, and only accepts quick replies from the same customer WhatsApp number on the matching sent order.

### Firebase rules (IMPORTANT)

This feature adds `whatsappOptIn` to /orders and `whatsappOptIn` + hashed `whatsappPhoneHash` to /orderTracking. The staged `firestore.rules` change must be published to the **correct named Firestore database** for the website. In the existing Firebase config this is **ai-studio-e97294bf-5393-4976-a852-dec4adb1854d** under project **watchful-adapter-wbcxw**.

**DO NOT merge or deploy checkout code before deploying compatible Firestore rules**, or new order writes may fail. Never change rules to allow public reads of private customer orders. Coordinate separately with the staged admin email migration PR; both edit firestore.rules.

## Smoke tests

- Re-run all existing unit tests, Worker module checks and build on PR.
- Without consent, checkout saves as usual, does NOT send a WhatsApp message.
- With consent and a valid PK phone, a new order saves and requests one template.
- Invalid phone + consent is blocked client-side.
- Without Meta credentials or KV, the order should still save, and the Worker returns WhatsApp disabled.
- Invalid/old order IDs, wrong email, wrong phone, no opt-in and duplicates do NOT send.
- Quick reply Yes/No must be from the correct phone via signed Meta webhook.
- Signed quick reply generates an owner email; the order remains placed/payment pending until a merchant updates it manually.
- Test in Meta's supported sandbox / test number before sending to production customers.
- Enable Cloudflare rate limiting on `/api/whatsapp/request`. KV has eventual consistency and cannot guarantee exactly-once delivery in concurrent edge requests.
- Confirm the store's privacy notice reflects transactional WhatsApp opt-in and response retention.

## Reliability constraints

This is a best-effort browser-triggered notification after Firebase commit, not a guaranteed transactional outbox: browser closure/network outage may skip notification. The order is still stored. For guaranteed retries and durable exactly-once intent, move sending into a trusted server-side event/queue backend later. Meta send API acceptance is not proof of delivery. The webhook stores responses in KV and emails the owner but does NOT update Firestore status automatically.

Do not use unapproved templates or third-party unofficial WhatsApp automation tools for automatic customer messaging.
