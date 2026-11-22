/**
 * Opt-in WhatsApp order confirmation via the official Meta Cloud API.
 * Requires a verified WhatsApp Business sender, approved utility template,
 * an access token, and a private Cloudflare KV namespace.
 *
 * Never accepts unverified phone numbers or order information from a visitor.
 * Customer order status in Firestore is NOT auto-modified by a WhatsApp reply:
 * the verified reply is recorded in private KV and emailed to the store owner
 * for review before changing fulfillment status.
 */
import firebaseConfig from '../firebase-applet-config.json';

const encoder = new TextEncoder();
const allowedOrigins = new Set([
  'https://draliwellness.com',
  'https://www.draliwellness.com',
  'https://draliwellness.moavia400.workers.dev',
  'https://mmoavia7861.github.io',
]);
const orderPattern = /^DRH-[0-9]{6}-[0-9]{4}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^923[0-9]{9}$/;
const TTL = 60 * 60 * 24 * 90;

function json(value, status = 200, origin = '') {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'Vary': 'Origin',
  };
  if (allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return new Response(JSON.stringify(value), { status, headers });
}
const ready = env => Boolean(
  env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID &&
  env.WHATSAPP_TEMPLATE_NAME && env.WHATSAPP_CONFIRMATIONS &&
  env.WHATSAPP_APP_SECRET && env.WHATSAPP_VERIFY_TOKEN
);
function normalizedPhone(phone) {
  const digits = typeof phone === 'string' ? phone.replace(/[^0-9]/g, '') : '';
  if (/^03[0-9]{9}$/.test(digits)) return '92' + digits.slice(1);
  if (phonePattern.test(digits)) return digits;
  if (/^3[0-9]{9}$/.test(digits)) return '92' + digits;
  if (/^00923[0-9]{9}$/.test(digits)) return digits.slice(2);
  return null;
}
async function hashedKey(order, contact) {
  const input = order.trim().toUpperCase() + '::' + contact.trim().toLowerCase().replace(/\s+/g, '');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
function fireValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(fireValue);
  return null;
}
async function verifyRecentConsentedOrder(orderNumber, email, phone) {
  const trackingKey = await hashedKey(orderNumber, email);
  const url = new URL(
    'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(firebaseConfig.projectId) +
    '/databases/' + encodeURIComponent(firebaseConfig.firestoreDatabaseId) +
    '/documents/orderTracking/' + trackingKey
  );
  url.searchParams.set('key', firebaseConfig.apiKey);
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (response.status === 401 || response.status === 403 || response.status === 404) return null;
  if (!response.ok) throw new Error('Order tracking lookup unavailable');
  const record = await response.json();
  const fields = Object.fromEntries(
    Object.entries(record?.fields || {}).map(([key, value]) => [key, fireValue(value)])
  );
  const age = Date.now() - Date.parse(String(fields.createdAt || ''));
  const phoneHash = await hashedKey(trackingKey, phone);
  if (fields.orderNumber !== orderNumber || fields.whatsappOptIn !== true ||
      fields.whatsappPhoneHash !== phoneHash ||
      fields.status !== 'placed' || fields.paymentStatus !== 'pending' ||
      !['cod', 'whatsapp', 'easypaisa', 'jazzcash'].includes(fields.paymentMethod) ||
      !Number.isFinite(fields.totalPkr) || fields.totalPkr < 0 ||
      fields.totalPkr > 10000000 ||
      !Number.isFinite(age) || age < -120000 || age > 15 * 60 * 1000) return null;
  return { trackingKey, orderNumber, totalPkr: Math.round(fields.totalPkr), phone };
}

async function sendTemplate(env, order) {
  const version = /^v[0-9]+\.[0-9]+$/.test(env.WHATSAPP_GRAPH_API_VERSION || '')
    ? env.WHATSAPP_GRAPH_API_VERSION : 'v27.0';
  const endpoint = 'https://graph.facebook.com/' + version + '/' +
    encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID) + '/messages';
  // An approved Utility template must have exactly 2 body text placeholders
  // (order number, total PKR) and 2 quick reply buttons in this order.
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: order.orderNumber },
        { type: 'text', text: String(order.totalPkr) },
      ],
    },
    ...['CONFIRM', 'CANCEL'].map((decision, index) => ({
      type: 'button',
      sub_type: 'quick_reply',
      index: String(index),
      parameters: [{
        type: 'payload',
        payload: decision + ':' + order.trackingKey,
      }],
    })),
  ];
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.WHATSAPP_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: order.phone,
      type: 'template',
      template: {
        name: env.WHATSAPP_TEMPLATE_NAME,
        language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
        components,
      },
    }),
  });
  if (!response.ok) throw new Error('WhatsApp provider rejected request: ' + response.status);
  const result = await response.json();
  if (!Array.isArray(result.messages) || result.messages.length === 0) {
    throw new Error('WhatsApp provider did not accept the message');
  }
}

async function requestMessage(request, env, origin) {
  if (!ready(env)) return json({ enabled: false, reason: 'WhatsApp not configured' }, 503, origin);
  if (Number(request.headers.get('Content-Length') || 0) > 1500)
    return json({ error: 'Request too large' }, 413, origin);
  let input;
  try {
    const body = await request.text();
    if (body.length > 1500) return json({ error: 'Request too large' }, 413, origin);
    input = JSON.parse(body);
  } catch { return json({ error: 'Invalid request' }, 400, origin); }

  const orderNumber = typeof input?.orderNumber === 'string' ? input.orderNumber.trim() : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  const phone = normalizedPhone(input?.phone);
  if (!orderPattern.test(orderNumber) || !emailPattern.test(email) ||
      email.length > 160 || !phone) {
    return json({ error: 'Invalid order reference' }, 400, origin);
  }

  try {
    const verified = await verifyRecentConsentedOrder(orderNumber, email, phone);
    if (!verified) return json({ error: 'Order consent verification failed' }, 404, origin);
    const key = 'sent:' + verified.trackingKey;
    const existing = await env.WHATSAPP_CONFIRMATIONS.get(key);
    if (existing) return json({ accepted: true, alreadyRequested: true }, 200, origin);

    // Best-effort duplicate prevention. KV is eventually consistent, so
    // configure Cloudflare request rate limiting for this endpoint as well.
    await env.WHATSAPP_CONFIRMATIONS.put(
      key, JSON.stringify({ ...verified, state: 'sending', at: Date.now() }),
      { expirationTtl: TTL }
    );
    try {
      await sendTemplate(env, verified);
    } catch (error) {
      await env.WHATSAPP_CONFIRMATIONS.delete(key);
      throw error;
    }
    await env.WHATSAPP_CONFIRMATIONS.put(
      key, JSON.stringify({ ...verified, state: 'sent', at: Date.now() }),
      { expirationTtl: TTL }
    );
    return json({ accepted: true }, 200, origin);
  } catch (error) {
    console.error('WhatsApp confirmation request failed:', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'WhatsApp confirmation is currently unavailable' }, 502, origin);
  }
}
async function verifyMetaSignature(raw, header, secret) {
  if (!secret || typeof header !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const hex = header.slice(7);
  const expected = new Uint8Array(hex.match(/.{2}/g).map(chunk => parseInt(chunk, 16)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, expected, encoder.encode(raw));
}
async function notifyOwnerOfReply(env, order, response) {
  if (!(env.RESEND_API_KEY && env.ORDER_NOTIFICATION_FROM && env.ORDER_NOTIFICATION_TO)) return;
  const text = [
    'Dr. Ali Wellness — customer WhatsApp response',
    'Order: ' + order.orderNumber,
    'Customer WhatsApp number: +' + order.phone,
    'Customer response: ' + response,
    '',
    'Open Admin Panel > Orders to review this order.',
    'IMPORTANT: This response does not automatically change the Firestore order or mark payment paid.',
  ].join('\n');
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'wa-reply/' + order.trackingKey,
    },
    body: JSON.stringify({
      from: env.ORDER_NOTIFICATION_FROM,
      to: [env.ORDER_NOTIFICATION_TO],
      subject: 'WhatsApp ' + response + ' — ' + order.orderNumber,
      text,
    }),
  });
  if (!result.ok) throw new Error('Owner response email not delivered');
}
async function webhookPost(request, env) {
  if (!ready(env)) return json({ error: 'Not configured' }, 503);
  if (Number(request.headers.get('Content-Length') || 0) > 512 * 1024)
    return json({ error: 'Payload too large' }, 413);
  const body = await request.text();
  if (body.length > 512 * 1024) return json({ error: 'Payload too large' }, 413);
  if (!await verifyMetaSignature(body, request.headers.get('x-hub-signature-256'), env.WHATSAPP_APP_SECRET))
    return json({ error: 'Invalid signature' }, 403);
  let event;
  try { event = JSON.parse(body); } catch { return json({ error: 'Invalid JSON' }, 400); }
  for (const entry of event.entry || []) {
    for (const change of entry.changes || []) {
      if (String(change.value?.metadata?.phone_number_id || '') !==
          String(env.WHATSAPP_PHONE_NUMBER_ID)) continue;
      for (const message of change.value?.messages || []) {
        const payload = message?.button?.payload;
        if (typeof payload !== 'string') continue;
        const match = /^(CONFIRM|CANCEL):([a-f0-9]{64})$/.exec(payload);
        if (!match) continue;
        const trackingKey = match[2];
        const stored = await env.WHATSAPP_CONFIRMATIONS.get('sent:' + trackingKey, 'json');
        if (!stored || stored.state !== 'sent' || stored.phone !== normalizedPhone(message.from) ||
            !orderPattern.test(stored.orderNumber)) continue;
        const replyKey = 'reply:' + trackingKey;
        if (await env.WHATSAPP_CONFIRMATIONS.get(replyKey)) continue;
        const decision = match[1] === 'CONFIRM' ? 'CONFIRMED' : 'CANCELLED';
        await env.WHATSAPP_CONFIRMATIONS.put(
          replyKey, JSON.stringify({ orderNumber: stored.orderNumber, decision, at: Date.now() }),
          { expirationTtl: TTL }
        );
        try { await notifyOwnerOfReply(env, stored, decision); } catch {
          console.error('WhatsApp customer reply saved, but owner email failed.');
        }
      }
    }
  }
  return json({ received: true });
}

export async function whatsappOrderRouter(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  if (origin && !allowedOrigins.has(origin)) return json({ error: 'Origin not allowed' }, 403);
  if (request.method === 'OPTIONS') return json({ ok: true }, 200, origin);
  if (url.pathname === '/api/whatsapp/status' && request.method === 'GET')
    return json({ enabled: ready(env) }, 200, origin);
  if (url.pathname === '/api/whatsapp/request' && request.method === 'POST')
    return requestMessage(request, env, origin);
  if (url.pathname === '/api/whatsapp/webhook' && request.method === 'GET') {
    const valid = url.searchParams.get('hub.mode') === 'subscribe' &&
      Boolean(env.WHATSAPP_VERIFY_TOKEN) &&
      url.searchParams.get('hub.verify_token') === env.WHATSAPP_VERIFY_TOKEN;
    return valid ? new Response(url.searchParams.get('hub.challenge') || '') :
      json({ error: 'Verification failed' }, 403);
  }
  if (url.pathname === '/api/whatsapp/webhook' && request.method === 'POST')
    return webhookPost(request, env);
  return json({ error: 'Not found' }, 404, origin);
}
