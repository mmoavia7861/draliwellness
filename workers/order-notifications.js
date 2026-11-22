/**
 * Dr. Ali Hassan Health & Wellness transactional order alert.
 * No Firebase Admin JSON/key is required. The server independently checks
 * the public, privacy-minimized orderTracking document before emailing.
 *
 * Resend secret and verified sender/recipient live ONLY in Worker Runtime:
 * RESEND_API_KEY, ORDER_NOTIFICATION_FROM, ORDER_NOTIFICATION_TO.
 * The email is a NEW ORDER alert, never proof of a successful card payment.
 */
import firebaseConfig from '../firebase-applet-config.json';

const encoder = new TextEncoder();
const allowedOrigins = new Set([
  'https://draliwellness.com',
  'https://www.draliwellness.com',
  'https://draliwellness.moavia400.workers.dev',
  'https://mmoavia7861.github.io',
]);
const compactJson = (body, status=200, origin='') => {
  const headers={'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff',Vary:'Origin'};
  if(origin && allowedOrigins.has(origin)){
    headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Methods']='POST,GET,OPTIONS';
    headers['Access-Control-Allow-Headers']='Content-Type';
  }
  return new Response(JSON.stringify(body), {status,headers});
};
const configured = (env) => Boolean(env.RESEND_API_KEY && env.ORDER_NOTIFICATION_FROM && env.ORDER_NOTIFICATION_TO);
const isEmail = (value) => typeof value === 'string' && value.length <= 180 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isOrder = (value) => typeof value === 'string' && /^DRH-[0-9]{6}-[0-9]{4}$/.test(value);
const clean = (value, limit=150) => typeof value === 'string' ? value.replace(/[\r\n\u0000-\u001f]/g,' ').trim().slice(0,limit) : '';
async function computeKey(order, email) {
  const input = order.trim().toUpperCase() + '::' + email.trim().toLowerCase().replace(/\s+/g,'');
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,'0')).join('');
}
function fireValue(raw) {
  if (!raw) return null;
  if ('stringValue' in raw) return raw.stringValue;
  if ('integerValue' in raw) return Number(raw.integerValue);
  if ('doubleValue' in raw) return Number(raw.doubleValue);
  if ('timestampValue' in raw) return raw.timestampValue;
  if ('booleanValue' in raw) return raw.booleanValue;
  if ('arrayValue' in raw) return (raw.arrayValue?.values || []).map(fireValue);
  return null;
}
async function verifiedTracking(orderNumber, email) {
  const id = await computeKey(orderNumber,email);
  const url = new URL('https://firestore.googleapis.com/v1/projects/'+
    encodeURIComponent(firebaseConfig.projectId) + '/databases/' +
    encodeURIComponent(firebaseConfig.firestoreDatabaseId) +
    '/documents/orderTracking/' + id);
  url.searchParams.set('key', firebaseConfig.apiKey);
  const response = await fetch(url.toString(), {headers:{'Accept':'application/json'}});
  if (response.status === 403 || response.status === 401 || response.status === 404) return null;
  if (!response.ok) throw new Error('Order-tracking lookup unavailable');
  const record = await response.json();
  const source = record?.fields || {};
  const result = Object.fromEntries(Object.entries(source).map(([k,v])=>[k,fireValue(v)]));
  if (result.orderNumber !== orderNumber || result.status !== 'placed' ||
      result.paymentStatus !== 'pending' || !['cod','whatsapp','safepay'].includes(result.paymentMethod) ||
      !Number.isFinite(result.totalPkr) || result.totalPkr < 0 || result.totalPkr > 10000000) return null;
  const age = Date.now() - Date.parse(String(result.createdAt || ''));
  // A valid, recently committed order can trigger one owner alert.
  if (!Number.isFinite(age) || age < -120000 || age > 15*60*1000) return null;
  return {id,orderNumber,method:result.paymentMethod,city:clean(result.city,80),
    totalPkr:Math.round(result.totalPkr),items:(Array.isArray(result.itemsSummary)?result.itemsSummary:[]).slice(0,30).map(x=>clean(x,140))};
}
async function sendEmail(env, order, email) {
  const from = clean(env.ORDER_NOTIFICATION_FROM,180);
  const to = clean(env.ORDER_NOTIFICATION_TO,180);
  if (!isEmail(to) || !/^.{1,60}<[^<>]+@[^<>]+\.[^<>]+>$/.test(from) && !isEmail(from))
    throw new Error('Sender or destination address is not configured');
  const subject = 'New BrainAxis Order: '+order.orderNumber+' ('+order.method.toUpperCase()+')';
  const text = [
    'A new order was saved on Dr. Ali Hassan Health & Wellness.',
    'Order Number: '+order.orderNumber,
    'Payment Method: '+order.method.toUpperCase(),
    'Payment Status: PENDING (not a verified paid transaction)',
    'Order Total: PKR '+order.totalPkr,
    'City: '+order.city,
    'Customer Email: '+email,
    'Items:',
    ...order.items.map(x=>'- '+x),
    '',
    'Sign in to your existing Firebase Admin panel to view shipping details.',
    'This message does not confirm a completed card payment.',
  ].join('\n');
  const response = await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      'Authorization':'Bearer '+env.RESEND_API_KEY,
      'Content-Type':'application/json',
      'Idempotency-Key':'new-order/'+order.orderNumber,
    },
    body:JSON.stringify({from,to:[to],subject,text}),
  });
  if (!response.ok) throw new Error('Order email provider returned '+response.status);
}
export async function orderMailRouter(request, env) {
  const pathname = new URL(request.url).pathname;
  const origin=request.headers.get('Origin')||'';
  const reply=(body,status=200)=>compactJson(body,status,origin);
  if(origin && !allowedOrigins.has(origin))return reply({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return reply({ok:true});
  if(pathname === '/api/orders/notification-status' && request.method === 'GET')
    return reply({enabled:configured(env)});
  if(pathname !== '/api/orders/notify' || request.method !== 'POST')
    return reply({error:'Not found'},404);
  if(!configured(env))
    return reply({enabled:false,error:'Owner notification email is not configured'},503);
  if(Number(request.headers.get('Content-Length')||0)>1024)
    return reply({error:'Request too large'},413);
  let payload;
  try {
    const input=await request.text();
    if(input.length>1024)return reply({error:'Request too large'},413);
    payload=JSON.parse(input);
  } catch {return reply({error:'Invalid request'},400)}
  const order=clean(payload?.orderNumber,32), email=clean(payload?.email,180).toLowerCase();
  if(!isOrder(order) || !isEmail(email))return reply({error:'Invalid order reference'},400);
  try {
    const verified=await verifiedTracking(order,email);
    if(!verified)return reply({error:'Order verification not available'},404);
    await sendEmail(env,verified,email);
    return reply({sent:true});
  }catch (error) {
    console.error('Order notification failed:',error instanceof Error?error.message:'unknown');
    return reply({error:'Email notification is temporarily unavailable'},502);
  }
}
