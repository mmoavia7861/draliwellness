/*
 * Safepay hosted checkout for Dr. Ali Hassan Health & Wellness.
 * Credentials must be Cloudflare Worker runtime secrets, NEVER VITE_ variables.
 * Gateway remains OFF until merchant, webhook, Firebase service account, and
 * SAFEPAY_ENABLED=true are configured.
 */
const FIREBASE_PROJECT = 'watchful-adapter-wbcxw';
const FIRESTORE_DB = 'ai-studio-e97294bf-5393-4976-a852-dec4adb1854d';
const enc = new TextEncoder();
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});
function ready(env) {
  return env.SAFEPAY_ENABLED === 'true' && !!env.SAFEPAY_PUBLIC_KEY &&
    !!env.SAFEPAY_SECRET_KEY && !!env.SAFEPAY_WEBHOOK_SECRET &&
    !!env.FIREBASE_SERVICE_ACCOUNT_JSON;
}
function sandbox(env) { return env.SAFEPAY_ENV !== 'production'; }
function gateway(env) { return sandbox(env) ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com'; }
function b64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return btoa(out).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function u64(txt) { return b64(enc.encode(txt)); }
async function serviceToken(env) {
  const svc = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!svc.private_key || !svc.client_email || !svc.client_email.endsWith('.gserviceaccount.com')) throw new Error('Invalid Firebase server credentials');
  const now = Math.floor(Date.now() / 1000);
  const payload = u64(JSON.stringify({ alg:'RS256', typ:'JWT' })) + '.' + u64(JSON.stringify({
    iss:svc.client_email, scope:'https://www.googleapis.com/auth/datastore',
    aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3300
  }));
  const pem = svc.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');
  const bytes = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const rsa = await crypto.subtle.importKey('pkcs8', bytes, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', rsa, enc.encode(payload));
  const body = new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:payload+'.'+b64(new Uint8Array(sig)) });
  const res = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body });
  const result = await res.json();
  if (!res.ok || !result.access_token) throw new Error('Firebase service account OAuth failed');
  return result.access_token;
}
function dbPath(collection, id = '') {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(collection) || (id && !/^[a-zA-Z0-9_-]{1,128}$/.test(id))) throw new Error('Invalid document path');
  return 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT +
    '/databases/' + FIRESTORE_DB + '/documents/' + collection + (id ? '/'+id : '');
}
function decodeValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k,x]) => [k,decodeValue(x)]));
  return null;
}
function decodeDoc(doc) {
  return { ...Object.fromEntries(Object.entries(doc.fields || {}).map(([k,v])=>[k,decodeValue(v)])), _updateTime:doc.updateTime };
}
function encodeValue(v) {
  if (v === null || v === undefined) return {nullValue:null};
  if (typeof v === 'string') return {stringValue:v};
  if (typeof v === 'boolean') return {booleanValue:v};
  if (typeof v === 'number') return Number.isInteger(v) ? {integerValue:String(v)} : {doubleValue:v};
  if (Array.isArray(v)) return {arrayValue:{values:v.map(encodeValue)}};
  if (typeof v === 'object') return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encodeValue(x)]))}};
  throw new Error('Unsupported document field');
}
const fields = data => ({ fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,(k==='updatedAt' && typeof v==='string') ? {timestampValue:v} : encodeValue(v)])) });
async function readDoc(collection,id,token) {
  const resp=await fetch(dbPath(collection,id),{headers:{authorization:'Bearer '+token}});
  if(resp.status===404) return null;
  if(!resp.ok) throw new Error('Secure database read failed ('+resp.status+')');
  return decodeDoc(await resp.json());
}
async function createDoc(collection,id, data, token) {
  const url=dbPath(collection,id)+'?currentDocument.exists=false';
  const response=await fetch(url,{ method:'PATCH', headers:{ authorization:'Bearer '+token, 'content-type':'application/json'},body:JSON.stringify(fields(data)) });
  if(response.status===409 || response.status===412) return false;
  if(!response.ok) throw new Error('Secure database insert failed ('+response.status+')');
  return true;
}
async function updateDoc(collection,id, data, token, updateTime) {
  const url=new URL(dbPath(collection,id));
  for(const name of Object.keys(data)) url.searchParams.append('updateMask.fieldPaths',name);
  if(updateTime)url.searchParams.set('currentDocument.updateTime',updateTime);
  const response=await fetch(url,{method:'PATCH',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(fields(data))});
  if(!response.ok)throw new Error('Secure database update failed ('+response.status+')');
}
async function safepayRequest(env,path,method='GET',body) {
  const response=await fetch(gateway(env)+path,{method,headers:{
    'content-type':'application/json','x-sfpy-merchant-secret':env.SAFEPAY_SECRET_KEY
  },...(body ? {body:JSON.stringify(body)}:{})});
  let result={};try{result=await response.json()}catch{}
  if(!response.ok || result.status?.errors?.length)throw new Error('Safepay provider request failed ('+response.status+')');
  return result;
}
function verifiedTotal(order,items,site,coupon) {
  let subtotal=0;
  for(const it of items)subtotal+=it.lineTotalPkr;
  let discount=0;
  if(coupon) {
    if(coupon.active!==true || (coupon.expiresAt && Date.parse(coupon.expiresAt)<Date.now()) ||
       (coupon.minOrderPkr>0 && subtotal<coupon.minOrderPkr)) throw new Error('Coupon no longer valid');
    discount=coupon.discountType==='percent'
      ? Math.round(subtotal*Math.min(100,Math.max(0,coupon.value))/100)
      : Math.min(subtotal,Math.max(0,Math.round(coupon.value)));
  }
  const after=Math.max(0,subtotal-discount);
  const shipping=Number(site.freeShippingThresholdPkr)>0 && after>=site.freeShippingThresholdPkr
    ? 0 : Math.max(0,Math.round(Number(site.shippingFeePkr)||0));
  const total=after+shipping;
  if(!Number.isSafeInteger(total)||total<=0||total>1e7||
     order.subtotalPkr!==subtotal||Number(order.discountPkr||0)!==discount||
     order.shippingFeePkr!==shipping||order.totalPkr!==total)throw new Error('Order amount does not match current verified prices');
  return total;
}
async function checkOrder(order,token) {
  if(!Array.isArray(order.items)||order.items.length===0||order.items.length>30)throw new Error('Order is invalid');
  let items=[];
  for(const item of order.items) {
    if(!/^[a-zA-Z0-9_-]{1,128}$/.test(item.productId)) throw new Error('Invalid product');
    const prod=await readDoc('products',item.productId,token);
    if(!prod||prod.published!==true||prod.complianceStatus!=='approved') throw new Error('Product is no longer available');
    const qty=Number(item.quantity);
    if(!Number.isSafeInteger(qty)||qty<1||qty>30)throw new Error('Invalid quantity');
    let price=prod.pricePkr,stock=prod.stock;
    if(item.variantLabel) {
      const variant=(prod.variants||[]).find(v=>v.label===item.variantLabel);
      if(!variant)throw new Error('Product variant is unavailable');
      price=variant.pricePkr;stock=variant.stock;
    }
    if(!Number.isSafeInteger(price)||price<0||stock<qty)throw new Error('Product stock or price changed');
    if(item.unitPricePkr!==price||item.lineTotalPkr!==price*qty)throw new Error('Order line total mismatched');
    items.push(item);
  }
  const site=await readDoc('siteSettings','main',token);
  if(!site||site.onlinePaymentsEnabled!==true)throw new Error('Online payments are not enabled by the administrator');
  let coupon=null;
  if(order.couponCode){
    const code=String(order.couponCode).trim();
    if(!/^[a-zA-Z0-9_-]{1,40}$/.test(code))throw new Error('Invalid coupon');
    coupon=await readDoc('coupons',code,token);
    if(!coupon||coupon.code!==code)throw new Error('Coupon not found');
  }
  return verifiedTotal(order,items,site,coupon);
}
async function startCheckout(request,env) {
  const origin=request.headers.get('origin')||'';
  if(origin && origin!==new URL(request.url).origin) return json({error:'Origin not allowed'},403);
  if(Number(request.headers.get('content-length')||0)>2048)return json({error:'Request too large'},413);
  let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const orderId=String(body?.orderId||''), email=String(body?.email||'').trim().toLowerCase();
  if(!/^[a-zA-Z0-9_-]{4,128}$/.test(orderId)||!/^.{1,160}@.{3,}$/.test(email)) return json({error:'Order reference and email required'},400);
  const token=await serviceToken(env);
  const order=await readDoc('orders',orderId,token);
  if(!order || order.customerEmail?.trim().toLowerCase()!==email ||
     order.paymentMethod!=='safepay' || order.paymentStatus!=='pending' ||
     order.status!=='placed')return json({error:'Order is not eligible for Safepay checkout'},403);
  const existing=await readDoc('safepayCheckouts',orderId,token);
  if(existing) {
    if(existing.status==='pending'&&Date.now()-Date.parse(existing.createdAt)<45*60*1000)
      return json({checkoutUrl:existing.checkoutUrl,orderId,environment:existing.environment});
    return json({error:'This payment session has expired or been used. Contact support.'},409);
  }
  let total;
  try{total=await checkOrder(order,token)}
  catch(e){return json({error:e instanceof Error?e.message:'Order validation failed'},409)}
  const envName=sandbox(env)?'sandbox':'production';
  const trackerResp=await safepayRequest(env,'/order/payments/v3/','POST',{
    merchant_api_key:env.SAFEPAY_PUBLIC_KEY,intent:'CYBERSOURCE',mode:'payment',
    entry_mode:'raw',currency:'PKR',amount:Math.round(total*100),
    metadata:{order_id:orderId,source:'draliwellness'},include_fees:false
  });
  const tracker=trackerResp.data?.tracker?.token;
  if(!/^track_[a-zA-Z0-9-]+$/.test(tracker||''))throw new Error('Safepay did not issue a tracker');
  const auth=await safepayRequest(env,'/client/passport/v1/token','POST');
  const tbt=typeof auth.data==='string'?auth.data:auth.data?.token;
  if(!tbt)throw new Error('Safepay did not issue an authentication token');
  const checkoutURL=new URL(gateway(env)+'/embedded/');
  const redirect=new URL('/payment-result',new URL(request.url).origin);
  redirect.searchParams.set('order',orderId);
  const cancel=new URL(redirect);cancel.searchParams.set('cancelled','1');
  for(const [k,v] of Object.entries({
    tbt,tracker,order_id:orderId,environment:envName,source:'hosted',
    redirect_url:redirect.toString(),cancel_url:cancel.toString()
  }))checkoutURL.searchParams.set(k,String(v));
  const checkoutUrl=checkoutURL.toString();
  const checkoutDoc={
    orderId,orderNumber:order.orderNumber,tracker,amountMinor:Math.round(total*100),
    currency:'PKR',environment:envName,checkoutUrl,status:'pending',createdAt:new Date().toISOString()
  };
  // Persist the correlation before redirecting to Safepay. Never return
  // checkout URLs if the lookup record cannot be persisted.
  await createDoc('safepayTrackers',tracker,{orderId,amountMinor:checkoutDoc.amountMinor,environment:envName},token);
  const inserted=await createDoc('safepayCheckouts',orderId,checkoutDoc,token);
  if(!inserted) return json({error:'Checkout already started for this order. Please retry.'},409);
  return json({checkoutUrl,orderId,environment:envName});
}
async function checkStatus(request,env) {
  if(Number(request.headers.get('content-length')||0)>1024)return json({error:'Request too large'},413);
  let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
  const orderId=String(body?.order||''),email=String(body?.email||'').trim().toLowerCase();
  if(!/^[a-zA-Z0-9_-]{4,128}$/.test(orderId)||!/^.{1,160}@.{3,}$/.test(email))return json({error:'Order and email required'},400);
  const token=await serviceToken(env);
  const order=await readDoc('orders',orderId,token);
  if(!order||order.paymentMethod!=='safepay'||order.customerEmail?.trim().toLowerCase()!==email)return json({error:'Order not found'},404);
  const session=await readDoc('safepayCheckouts',orderId,token);
  return json({orderNumber:order.orderNumber,paymentStatus:order.paymentStatus,
    orderStatus:order.status,testPaid:session?.status==='sandbox_succeeded' && session?.environment==='sandbox'});
}
async function signatureValid(raw,sig,secret) {
  if(!/^[0-9a-f]{64}([0-9a-f]{64})?$/i.test(sig||''))return false;
  const data=enc.encode(raw);const provided=sig.toLowerCase();
  for(const hash of (provided.length===128?['SHA-512']:['SHA-256'])){
    const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash},false,['sign']);
    const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,data));
    const hex=Array.from(mac).map(v=>v.toString(16).padStart(2,'0')).join('');
    let diff=hex.length^provided.length;
    for(let i=0;i<Math.min(hex.length,provided.length);i++)diff|=hex.charCodeAt(i)^provided.charCodeAt(i);
    if(diff===0)return true;
  }
  return false;
}
async function receiveWebhook(request,env) {
  const raw=await request.text();
  if(raw.length>32000)return json({error:'Payload too large'},413);
  if(!await signatureValid(raw,request.headers.get('x-sfpy-signature')||'',env.SAFEPAY_WEBHOOK_SECRET))
    return json({error:'Invalid signature'},401);
  const event=JSON.parse(raw);
  if(!event?.type||!event?.data?.tracker)return json({ok:true,ignored:true});
  const tracker=String(event.data.tracker);
  if(!/^track_[a-zA-Z0-9-]+$/.test(tracker))return json({error:'Invalid tracker'},400);
  if(event.merchant_api_key!==env.SAFEPAY_PUBLIC_KEY)return json({error:'Wrong merchant'},403);
  const token=await serviceToken(env);
  const map=await readDoc('safepayTrackers',tracker,token);
  if(!map)return json({error:'Unrecognized payment tracker'},404);
  const session=await readDoc('safepayCheckouts',map.orderId,token);
  if(!session||session.tracker!==tracker||session.environment!==(sandbox(env)?'sandbox':'production'))
    return json({error:'Payment session mismatch'},409);
  if(event.type!=='payment.succeeded')return json({ok:true,ignored:true});
  if(event.data.state!=='TRACKER_ENDED'||event.data.currency!=='PKR'||event.data.amount!==session.amountMinor)
    return json({error:'Payment amount or state mismatch'},409);
  // Verify with Safepay's independent reporter endpoint, not with the return URL.
  const reporter=await safepayRequest(env,'/reporter/api/v1/payments/'+encodeURIComponent(tracker));
  const reported=reporter.data?.tracker||reporter.data||{};
  if(reported.state!=='TRACKER_ENDED' || (reported.token&&reported.token!==tracker))
    return json({error:'Payment is not confirmed by provider'},409);
  const reportedAmount=reported.purchase_totals?.quote_amount;
  if(reportedAmount && (reportedAmount.currency!=='PKR'||reportedAmount.amount!==session.amountMinor))
    return json({error:'Provider total mismatch'},409);
  // A sandbox test must never be treated as a received payment or live revenue.
  if(sandbox(env)) {
    if(session.status!=='sandbox_succeeded') {
      await updateDoc('safepayCheckouts',map.orderId,
        {status:'sandbox_succeeded',updatedAt:new Date().toISOString()},token,session._updateTime);
    }
    return json({ok:true,testPayment:true});
  }
  const order=await readDoc('orders',map.orderId,token);
  if(!order||order.paymentMethod!=='safepay'||Math.round(order.totalPkr*100)!==session.amountMinor)
    return json({error:'Order mismatch'},409);
  if(order.paymentStatus!=='paid') {
    if(order.paymentStatus!=='pending')return json({error:'Order no longer payable'},409);
    await updateDoc('orders',map.orderId,{paymentStatus:'paid',updatedAt:new Date().toISOString()},token,order._updateTime);
  }
  const tracking=await readDoc('orderTracking',order.trackingKey,token);
  if(tracking&&tracking.paymentStatus!=='paid')
    await updateDoc('orderTracking',order.trackingKey,{paymentStatus:'paid',updatedAt:new Date().toISOString()},token,tracking._updateTime);
  const eventId=String(event.token||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,128);
  if(eventId)await createDoc('safepayWebhookEvents',eventId,{orderId:map.orderId,tracker,type:event.type,processedAt:new Date().toISOString()},token);
  return json({ok:true});
}
export async function safepayRouter(request,env) {
  const path=new URL(request.url).pathname;
  if(path==='/api/payments/safepay/status'&&request.method==='GET')
    return json({enabled:ready(env),environment:sandbox(env)?'sandbox':'production'});
  if(!ready(env))return json({error:'Safepay is not configured. Cash on Delivery remains available.'},503);
  try {
    if(path==='/api/payments/safepay/checkout'&&request.method==='POST')return await startCheckout(request,env);
    if(path==='/api/payments/safepay/order-status'&&request.method==='POST')return await checkStatus(request,env);
    if(path==='/api/payments/safepay/webhook'&&request.method==='POST')return await receiveWebhook(request,env);
    return json({error:'Unsupported payment endpoint'},404);
  }catch(e){
    console.error('Safepay backend:',e instanceof Error?e.message:'unknown failure');
    return json({error:'Payment service could not complete this request. No payment has been confirmed.'},502);
  }
}
