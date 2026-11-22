/**
 * Safepay + Cloudflare D1 (sandbox integration).
 * The gateway never receives/returns card numbers here.
 * There is no Firebase Admin JSON dependency.
 * D1 is the PAYMENT ledger; Firebase orders remain a separate fulfillment
 * source and must be reconciled by an authorized admin before dispatch.
 * Production is deliberately blocked pending reconciliation & live audit.
 */
import firebaseConfig from '../firebase-applet-config.json';
const enc = new TextEncoder();
const allowedOrigins = new Set([
  'https://draliwellness.com',
  'https://www.draliwellness.com',
  'https://draliwellness.moavia400.workers.dev',
  'https://mmoavia7861.github.io',
]);
const idPattern = /^DRH-[0-9]{6}-[0-9]{4}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const itemIdPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const trackerPattern = /^track_[a-zA-Z0-9-]{8,110}$/;
const fireRoot = 'https://firestore.googleapis.com/v1/projects/' +
  encodeURIComponent(firebaseConfig.projectId) + '/databases/' +
  encodeURIComponent(firebaseConfig.firestoreDatabaseId) + '/documents/';

function responseJson(body, status = 200, origin = '') {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'vary': 'Origin',
  };
  if (allowedOrigins.has(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-methods'] = 'POST,GET,OPTIONS';
    headers['access-control-allow-headers'] = 'Content-Type';
  }
  return new Response(JSON.stringify(body), {status, headers});
}
function normalEmail(value) {
  return String(value || '').trim().toLowerCase();
}
async function hashString(value) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(value));
  return Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2,'0')).join('');
}
const safeNumber = v => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
function isReady(env) {
  // Never activate a merchant account in production with this implementation:
  // the Firebase fulfillment database still requires manual reconciliation.
  return env.SAFEPAY_ENV === 'sandbox' && env.SAFEPAY_ENABLED === 'true' &&
    !!env.PAYMENTS_DB && !!env.SAFEPAY_PUBLIC_KEY &&
    !!env.SAFEPAY_SECRET_KEY && !!env.SAFEPAY_WEBHOOK_SECRET;
}
const providerRoot = 'https://sandbox.api.getsafepay.com';
async function provider(env, path, method = 'GET', body) {
  const res = await fetch(providerRoot + path, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-sfpy-merchant-secret': env.SAFEPAY_SECRET_KEY,
    },
    ...(body === undefined ? {} : {body:JSON.stringify(body)}),
  });
  let payload = {};
  try {payload = await res.json();} catch {}
  if (!res.ok || (Array.isArray(payload.status?.errors) && payload.status.errors.length)) {
    throw new Error('Safepay provider request rejected (' + res.status + ')');
  }
  return payload;
}
function decode(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decode);
  if ('mapValue' in v) return Object.fromEntries(
    Object.entries(v.mapValue?.fields || {}).map(([k,x])=>[k,decode(x)]));
  return null;
}
async function publicDoc(collection, key) {
  if (!itemIdPattern.test(collection) || !itemIdPattern.test(key)) return null;
  const url = new URL(fireRoot + collection + '/' + encodeURIComponent(key));
  url.searchParams.set('key', firebaseConfig.apiKey);
  const res = await fetch(url, {headers:{'accept':'application/json'}});
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Firestore public catalog or tracking lookup failed (' + res.status + ')');
  const payload = await res.json();
  return Object.fromEntries(Object.entries(payload.fields || {}).map(([k,v])=>[k,decode(v)]));
}
async function assertFreshOrder(body) {
  const orderId = String(body?.orderId || '');
  const email = normalEmail(body?.email);
  if (!idPattern.test(orderId) || email.length > 160 || !emailPattern.test(email))
    throw new Error('Invalid order reference or email');
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 30)
    throw new Error('Invalid cart items');
  const trackingKey = await hashString(orderId.toUpperCase() + '::' + email.replace(/\s+/g,''));
  const tracking = await publicDoc('orderTracking', trackingKey);
  if (!tracking || tracking.orderNumber !== orderId ||
      tracking.paymentMethod !== 'safepay' || tracking.paymentStatus !== 'pending' ||
      tracking.status !== 'placed')
    throw new Error('No matching pending online order was found');
  const age = Date.now() - Date.parse(tracking.createdAt);
  if (!Number.isFinite(age) || age < -120000 || age > 15 * 60 * 1000)
    throw new Error('The order is too old to initiate online checkout');
  const site = await publicDoc('siteSettings', 'main');
  if (!site || site.onlinePaymentsEnabled !== true)
    throw new Error('Online payments are not enabled in store settings');
  let subtotal = 0, count = 0;
  const summary = [];
  for (const item of items) {
    if (!item || !itemIdPattern.test(item.productId) ||
        !safeNumber(item.quantity) || item.quantity < 1 || item.quantity > 30)
      throw new Error('Invalid item or quantity');
    const product = await publicDoc('products', item.productId);
    if (!product || product.published !== true || product.complianceStatus !== 'approved')
      throw new Error('Product is not currently available');
    let price = product.pricePkr, stock = product.stock;
    if (item.variantLabel) {
      const variant = (product.variants || []).find(v =>
        typeof v.label === 'string' && v.label === item.variantLabel);
      if (!variant) throw new Error('Product variant not found');
      price = variant.pricePkr;
      stock = variant.stock;
    }
    if (!safeNumber(price) || !safeNumber(stock) || stock < item.quantity)
      throw new Error('Product stock or price is invalid');
    subtotal += price * item.quantity;
    count += item.quantity;
    summary.push(product.name + ' × ' + item.quantity);
  }
  if (!safeNumber(subtotal) || subtotal === 0 || subtotal > 10000000)
    throw new Error('Invalid checkout amount');
  let discount = 0;
  const couponCode = String(body?.couponCode || '').trim();
  if (couponCode) {
    if (!/^[A-Z0-9_-]{2,40}$/.test(couponCode))
      throw new Error('Invalid coupon code');
    const coupon = await publicDoc('coupons',couponCode);
    if (!coupon || coupon.code !== couponCode || coupon.active !== true ||
        (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) ||
        (coupon.minOrderPkr > 0 && subtotal < coupon.minOrderPkr))
      throw new Error('Coupon is unavailable');
    discount = coupon.discountType === 'percent'
      ? Math.round(subtotal * Math.min(100, Math.max(0, coupon.value)) / 100)
      : Math.min(subtotal, Math.max(0, Math.round(coupon.value)));
  }
  const remaining = subtotal - discount;
  const freeThreshold = Number(site.freeShippingThresholdPkr) || 0;
  const shipping = freeThreshold > 0 && remaining >= freeThreshold
    ? 0 : Math.max(0,Math.round(Number(site.shippingFeePkr) || 0));
  const total = remaining + shipping;
  if (!safeNumber(total) || total <= 0 || total > 10000000 ||
      tracking.totalPkr !== total || tracking.itemCount !== count ||
      !Array.isArray(tracking.itemsSummary) ||
      JSON.stringify(tracking.itemsSummary) !== JSON.stringify(summary))
    throw new Error('Order totals or item details do not match the current catalog');
  return {orderId, emailHash:await hashString(email), trackingKey, total};
}
function returnOrigin(request, body) {
  const candidate = String(body?.returnOrigin || '');
  if (allowedOrigins.has(candidate)) return candidate;
  const origin = request.headers.get('origin') || '';
  return allowedOrigins.has(origin) ? origin : new URL(request.url).origin;
}
async function startCheckout(request, env, reply) {
  if (Number(request.headers.get('content-length') || 0) > 12000)
    return reply({error:'Request too large'},413);
  const raw = await request.text();
  if (raw.length > 12000) return reply({error:'Request too large'},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid JSON'},400);}
  let data;
  try {data = await assertFreshOrder(body);}
  catch (err) {return reply({error: err instanceof Error ? err.message : 'Invalid order'},409);}
  const existing = await env.PAYMENTS_DB.prepare(
    'SELECT * FROM safepay_sessions WHERE order_id = ?').bind(data.orderId).first();
  if (existing) {
    if (existing.email_hash !== data.emailHash) return reply({error:'Order mismatch'},403);
    if (existing.status === 'pending' && existing.checkout_url &&
        Date.now() - Date.parse(existing.created_at) < 45*60*1000)
      return reply({checkoutUrl:existing.checkout_url,orderId:data.orderId,environment:'sandbox'});
    return reply({error:'Payment session exists. Contact support before attempting a new charge.'},409);
  }
  const now = new Date().toISOString();
  const insert = await env.PAYMENTS_DB.prepare(
    'INSERT OR IGNORE INTO safepay_sessions '+
    '(order_id,order_number,email_hash,tracking_key,amount_minor,currency,environment,status,created_at,updated_at) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?)'
  ).bind(data.orderId,data.orderId,data.emailHash,data.trackingKey,Math.round(data.total*100),
    'PKR','sandbox','creating',now,now).run();
  if (!insert.meta?.changes) return reply({error:'Checkout already in progress'},409);
  // A pending row is reserved BEFORE contacting Safepay, preventing duplicate
  // charge attempts for one order. Unknown outcomes require reconciliation.
  const trackerReply = await provider(env, '/order/payments/v3/', 'POST', {
    merchant_api_key:env.SAFEPAY_PUBLIC_KEY,
    intent:'CYBERSOURCE', mode:'payment', entry_mode:'raw',currency:'PKR',
    amount:Math.round(data.total*100),
    metadata:{order_id:data.orderId,source:'draliwellness'},
    include_fees:false,
  });
  const issuedTracker=trackerReply.data?.tracker || {};
  const tracker=issuedTracker.token;
  const amount=issuedTracker.purchase_totals?.quote_amount;
  if (!trackerPattern.test(tracker || '') ||
      amount?.currency !== 'PKR' ||
      Number(amount?.amount) !== Math.round(data.total * 100))
    throw new Error('Safepay tracker did not match the verified order amount');
  const auth = await provider(env,'/client/passport/v1/token','POST');
  const tbt = typeof auth.data === 'string' ? auth.data : auth.data?.token;
  if (typeof tbt !== 'string' || !tbt) throw new Error('Safepay auth token unavailable');
  const origin = returnOrigin(request,body);
  const redirect = new URL('/payment-result',origin);
  redirect.searchParams.set('order',data.orderId);
  const cancel = new URL(redirect.toString());
  cancel.searchParams.set('cancelled','1');
  const checkout = new URL(providerRoot + '/embedded/');
  for (const [k,v] of Object.entries({
    tracker,tbt,environment:'sandbox',source:'hosted',
    redirect_url:redirect.toString(),cancel_url:cancel.toString(),
  })) checkout.searchParams.set(k,v);
  const checkoutUrl = checkout.toString();
  const update = await env.PAYMENTS_DB.prepare(
    'UPDATE safepay_sessions SET tracker=?,checkout_url=?,status=?,updated_at=? '+
    'WHERE order_id=? AND status=?'
  ).bind(tracker,checkoutUrl,'pending',new Date().toISOString(),data.orderId,'creating').run();
  if (!update.meta?.changes) throw new Error('Failed to persist Safepay session');
  return reply({checkoutUrl,orderId:data.orderId,environment:'sandbox'});
}
async function orderStatus(request,env,reply) {
  const raw=await request.text();
  if (raw.length > 1024) return reply({error:'Too much data'},413);
  let payload;try{payload=JSON.parse(raw);}catch{return reply({error:'Invalid JSON'},400);}
  const id = String(payload?.order || '');
  const email = normalEmail(payload?.email);
  if (!idPattern.test(id) || email.length > 160 || !emailPattern.test(email))
    return reply({error:'Invalid payment lookup'},400);
  const row=await env.PAYMENTS_DB.prepare(
    'SELECT order_number,email_hash,status FROM safepay_sessions WHERE order_id=?'
  ).bind(id).first();
  if (!row || row.email_hash !== await hashString(email))
    return reply({error:'Payment session not found'},404);
  const paid = row.status === 'paid';
  return reply({
    orderNumber:row.order_number,
    paymentStatus:paid?'paid':row.status==='refunded'?'refunded':'pending',
    orderStatus:'placed',
    testPaid:row.status === 'sandbox_succeeded',
    reconciliationRequired:true,
  });
}
async function signatureValid(raw,signature,secret) {
  if (!/^[a-f0-9]{128}$/i.test(signature || '')) return false;
  const key = await crypto.subtle.importKey('raw',enc.encode(secret),
    {name:'HMAC',hash:'SHA-512'},false,['sign']);
  const got = new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(raw)));
  const expected = signature.toLowerCase();
  const hex=Array.from(got,v=>v.toString(16).padStart(2,'0')).join('');
  let diff=0;for(let i=0;i<128;i++)diff|=(hex.charCodeAt(i)^expected.charCodeAt(i));
  return diff===0;
}
async function receiveWebhook(request,env,reply) {
  const raw=await request.text();
  if (raw.length > 32768) return reply({error:'Payload too large'},413);
  if (!await signatureValid(raw,request.headers.get('x-sfpy-signature')||'',
    env.SAFEPAY_WEBHOOK_SECRET)) return reply({error:'Invalid signature'},401);
  let event;try{event=JSON.parse(raw);}catch{return reply({error:'Invalid payload'},400);}
  if (event.merchant_api_key !== env.SAFEPAY_PUBLIC_KEY)
    return reply({error:'Merchant mismatch'},403);
  const tracker=String(event.data?.tracker||'');
  const eventId=String(event.token||'');
  if (!trackerPattern.test(tracker)||!/^evt_[a-zA-Z0-9-]{8,120}$/.test(eventId))
    return reply({error:'Invalid webhook event reference'},400);
  const session=await env.PAYMENTS_DB.prepare(
    'SELECT * FROM safepay_sessions WHERE tracker = ?').bind(tracker).first();
  if (!session || session.environment !== 'sandbox' || session.status === 'creating')
    return reply({error:'Unknown tracker'},404);
  const now=new Date().toISOString();
  await env.PAYMENTS_DB.prepare(
    'INSERT OR IGNORE INTO safepay_events(event_id,tracker,event_type,result,created_at,updated_at) '+
    'VALUES(?,?,?,?,?,?)'
  ).bind(eventId,tracker,String(event.type||'').slice(0,100),'received',now,now).run();
  const prior=await env.PAYMENTS_DB.prepare(
    'SELECT result FROM safepay_events WHERE event_id=?').bind(eventId).first();
  if (prior?.result === 'processed' || prior?.result === 'ignored')
    return reply({ok:true,duplicate:true});
  if (event.type !== 'payment.succeeded') {
    await env.PAYMENTS_DB.prepare(
      'UPDATE safepay_events SET result=?,updated_at=? WHERE event_id=?'
    ).bind('ignored',now,eventId).run();
    return reply({ok:true,ignored:true});
  }
  if (event.data?.state !== 'TRACKER_ENDED' ||
      event.data?.currency !== 'PKR' ||
      Number(event.data?.amount) !== session.amount_minor ||
      (event.data?.metadata?.order_id && event.data.metadata.order_id !== session.order_id))
    return reply({error:'Tracker, amount, or currency mismatch'},409);
  // The webhook alone is insufficient. Re-fetch the matching tracker via
  // merchant-authenticated Safepay Reporter and validate state and amount.
  const providerResult=await provider(env,'/reporter/api/v1/payments/'+encodeURIComponent(tracker));
  const reported=providerResult.data?.tracker || providerResult.data || {};
  const quote=reported.purchase_totals?.quote_amount;
  if (reported.state !== 'TRACKER_ENDED' ||
      reported.token !== tracker ||
      quote?.currency !== 'PKR' ||
      Number(quote?.amount) !== session.amount_minor)
    return reply({error:'Independent Safepay verification failed'},409);
  // This release only processes sandbox transactions. NEVER mark a sandbox
  // payment as live paid or as fulfilled in Firebase.
  const changed=await env.PAYMENTS_DB.prepare(
    'UPDATE safepay_sessions SET status=?,updated_at=?,verified_at=? '+
    'WHERE order_id=? AND status=?'
  ).bind('sandbox_succeeded',now,now,session.order_id,'pending').run();
  if (!changed.meta?.changes && session.status!=='sandbox_succeeded')
    return reply({error:'Session state changed; manual reconciliation needed'},409);
  await env.PAYMENTS_DB.prepare(
    'UPDATE safepay_events SET result=?,updated_at=? WHERE event_id=?'
  ).bind('processed',now,eventId).run();
  return reply({ok:true,testPayment:true});
}
export async function safepayRouter(request,env) {
  const path=new URL(request.url).pathname;
  const origin=request.headers.get('origin') || '';
  const reply=(body,status=200)=>responseJson(body,status,origin);
  if (origin && !allowedOrigins.has(origin)) return reply({error:'Origin not allowed'},403);
  if (request.method==='OPTIONS') return reply({ok:true});
  if (path==='/api/payments/safepay/status'&&request.method==='GET') {
    let enabled=isReady(env);
    if (enabled) {
      try {
        const schema=await env.PAYMENTS_DB.prepare(
          'SELECT name FROM sqlite_master WHERE type=? AND name=?'
        ).bind('table','safepay_sessions').first();
        enabled=!!schema;
      }catch{enabled=false;}
    }
    return reply({enabled,environment:'sandbox'});
  }
  if (!isReady(env))
    return reply({error:'Safepay is not configured or payment test mode is disabled.'},503);
  try {
    if (path==='/api/payments/safepay/checkout' && request.method==='POST')
      return await startCheckout(request,env,reply);
    if (path==='/api/payments/safepay/order-status' && request.method==='POST')
      return await orderStatus(request,env,reply);
    if (path==='/api/payments/safepay/webhook' && request.method==='POST')
      return await receiveWebhook(request,env,reply);
    return reply({error:'Unsupported payment endpoint'},404);
  } catch(err) {
    console.error('Safepay D1 backend:',err instanceof Error?err.message:'unknown');
    return reply({error:'Payment service unavailable. No payment was confirmed.'},502);
  }
}
