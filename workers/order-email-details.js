/**
 * Privileged, read-only order lookup for merchant email notifications.
 *
 * The customer only submits an order number + email. Never trust shipping
 * details or prices received from a browser: load them directly from Firestore
 * using a restricted Cloud Datastore Viewer service account.
 *
 * Configure FIREBASE_SERVICE_ACCOUNT_JSON as a Worker *runtime secret*.
 * NEVER expose the JSON, OAuth access token or customer details in an API reply.
 */
import firebaseConfig from '../firebase-applet-config.json';

const utf8 = new TextEncoder();
const safeText = (value, max = 200) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
const safeMoney = value => Number.isFinite(value) && value >= 0 && value <= 10000000
  ? Math.round(value) : null;

function base64url(input) {
  const bytes = utf8.encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function privateKeyBytes(pem) {
  if (typeof pem !== 'string' || !pem.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Firestore notification reader key is invalid');
  }
  const content = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  return Uint8Array.from(atob(content), char => char.charCodeAt(0));
}

async function getServiceAccountToken(env) {
  let account;
  try {
    account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new Error('Firestore notification reader JSON is invalid');
  }
  if (account?.project_id !== firebaseConfig.projectId ||
      typeof account?.client_email !== 'string' ||
      !account.client_email.endsWith('.gserviceaccount.com') ||
      typeof account?.private_key !== 'string') {
    throw new Error('Firestore notification reader account does not match project');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 300,
  }));
  const signingInput = header + '.' + payload;
  const key = await crypto.subtle.importKey(
    'pkcs8', privateKeyBytes(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, utf8.encode(signingInput)
  ));
  let signatureBinary = '';
  for (const byte of signature) signatureBinary += String.fromCharCode(byte);
  const assertion = signingInput + '.' +
    btoa(signatureBinary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) throw new Error('Firestore notification reader could not authenticate');
  const token = await response.json();
  if (typeof token.access_token !== 'string') {
    throw new Error('Firestore notification reader returned no token');
  }
  return token.access_token;
}

function firestoreValue(field) {
  if (!field || typeof field !== 'object') return null;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return Number(field.doubleValue);
  if ('booleanValue' in field) return Boolean(field.booleanValue);
  if ('timestampValue' in field) return field.timestampValue;
  if ('nullValue' in field) return null;
  if ('arrayValue' in field) return (field.arrayValue?.values || []).map(firestoreValue);
  if ('mapValue' in field) return Object.fromEntries(
    Object.entries(field.mapValue?.fields || {}).map(([key, value]) => [key, firestoreValue(value)])
  );
  return null;
}

export async function fetchPrivateOrderForNotification(env, verified, email) {
  const bearer = await getServiceAccountToken(env);
  const url = 'https://firestore.googleapis.com/v1/projects/' +
    encodeURIComponent(firebaseConfig.projectId) + '/databases/' +
    encodeURIComponent(firebaseConfig.firestoreDatabaseId) +
    '/documents/orders/' + encodeURIComponent(verified.orderNumber);
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + bearer, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Private order lookup failed');
  const record = await response.json();
  const data = Object.fromEntries(
    Object.entries(record?.fields || {}).map(([key, value]) => [key, firestoreValue(value)])
  );

  // A public visitor cannot supply their own shipping address or a fake total
  // to this mail endpoint. The email is composed only from the stored order.
  if (data.id !== verified.orderNumber ||
      data.orderNumber !== verified.orderNumber ||
      // Old orders use the notification lookup hash as their tracking key.
      // New orders display a separate cryptographically random TRK- ID,
      // while the verified notification alias remains a hashed Firestore doc.
      !(data.trackingKey === verified.id ||
        (typeof data.trackingKey === 'string' &&
         /^TRK-[A-HJ-NP-Z2-9]{20}$/.test(data.trackingKey))) ||
      String(data.customerEmail || '').trim().toLowerCase() !== email ||
      data.status !== 'placed' ||
      data.paymentStatus !== 'pending' ||
      data.paymentMethod !== verified.method ||
      safeMoney(data.totalPkr) !== verified.totalPkr ||
      !Array.isArray(data.items) || data.items.length < 1 || data.items.length > 30) {
    throw new Error('Private order data did not match verified order');
  }

  const items = data.items.map(item => {
    if (!item || typeof item !== 'object' ||
        safeMoney(item.unitPricePkr) === null ||
        safeMoney(item.lineTotalPkr) === null ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new Error('Private order line item is invalid');
    }
    return {
      name: safeText(item.name, 160),
      variant: safeText(item.variantLabel, 80),
      quantity: item.quantity,
      unitPricePkr: safeMoney(item.unitPricePkr),
      lineTotalPkr: safeMoney(item.lineTotalPkr),
    };
  });

  if (!safeText(data.customerName, 120) ||
      !safeText(data.customerPhone, 32) ||
      !safeText(data.shippingAddress, 400) ||
      items.some(item => !item.name)) {
    throw new Error('Private order is missing delivery information');
  }

  return {
    customerName: safeText(data.customerName, 120),
    customerEmail: email,
    customerPhone: safeText(data.customerPhone, 32),
    shippingAddress: safeText(data.shippingAddress, 400),
    city: safeText(data.city, 80),
    province: safeText(data.province, 80),
    postalCode: safeText(data.postalCode, 20),
    notes: safeText(data.notes, 500),
    couponCode: safeText(data.couponCode, 40),
    subtotalPkr: safeMoney(data.subtotalPkr),
    discountPkr: safeMoney(data.discountPkr ?? 0),
    shippingFeePkr: safeMoney(data.shippingFeePkr),
    totalPkr: verified.totalPkr,
    items,
  };
}

export function formatPrivateOrderText(details) {
  const money = value => value === null ? 'Not available' : 'Rs. ' + value.toLocaleString('en-PK');
  return [
    'Customer Details',
    'Name: ' + details.customerName,
    'Email: ' + details.customerEmail,
    'Phone: ' + details.customerPhone,
    '',
    'Delivery Address',
    details.shippingAddress,
    'City: ' + details.city,
    ...(details.province ? ['Province: ' + details.province] : []),
    ...(details.postalCode ? ['Postal code: ' + details.postalCode] : []),
    '',
    'Ordered Products',
    ...details.items.map((item, i) =>
      (i + 1) + '. ' + item.name +
      (item.variant ? ' (' + item.variant + ')' : '') +
      ' | Quantity: ' + item.quantity +
      ' | Unit: ' + money(item.unitPricePkr) +
      ' | Line total: ' + money(item.lineTotalPkr)
    ),
    '',
    'Subtotal: ' + money(details.subtotalPkr),
    'Discount: -' + money(details.discountPkr),
    ...(details.couponCode ? ['Coupon: ' + details.couponCode] : []),
    'Shipping: ' + money(details.shippingFeePkr),
    'Total payable: ' + money(details.totalPkr),
    ...(details.notes ? ['', 'Customer notes: ' + details.notes] : []),
  ].join('\n');
}
