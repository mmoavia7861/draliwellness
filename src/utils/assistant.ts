import type { Product, SiteSettings } from '../types';

export interface AssistantMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AssistantProductBrief {
  name: string;
  brand: string;
  packSize?: string;
  strength?: string;
  pricePkr: number;
  shortDescription?: string;
  directions?: string;
  warnings?: string;
  manufacturer?: string;
  certifications?: string[];
  benefits?: string[];
}

export interface AssistantSiteBrief {
  businessName: string;
  supplementBrandName?: string;
  shippingFeePkr: number;
  freeShippingThresholdPkr: number;
  codEnabled?: boolean;
  supportHours?: string;
}

export interface ValidatedAssistantRequest {
  message: string;
  history: AssistantMessage[];
  products: AssistantProductBrief[];
  site?: AssistantSiteBrief;
}

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_TURNS = 8;
const MAX_HISTORY_TEXT_LENGTH = 1500;
const MAX_PRODUCTS_CONTEXT = 12;

function trimString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function serializeCatalogForAssistant(
  products: Product[],
  site?: SiteSettings
): { products: AssistantProductBrief[]; site?: AssistantSiteBrief } {
  return {
    products: products.slice(0, MAX_PRODUCTS_CONTEXT).map((p) => ({
      name: p.name,
      brand: p.brand,
      packSize: p.packSize,
      strength: p.strength,
      pricePkr: p.pricePkr,
      shortDescription: p.shortDescription,
      directions: p.directions,
      warnings: p.warnings,
      manufacturer: p.manufacturer,
      certifications: p.certifications,
      benefits: p.benefits,
    })),
    site: site
      ? {
          businessName: site.businessName,
          supplementBrandName: site.supplementBrandName,
          shippingFeePkr: site.shippingFeePkr,
          freeShippingThresholdPkr: site.freeShippingThresholdPkr,
          codEnabled: site.codEnabled,
          supportHours: site.supportHours,
        }
      : undefined,
  };
}

export function validateAssistantInput(
  payload: unknown
): { ok: true; data: ValidatedAssistantRequest } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const record = payload as Record<string, unknown>;
  const rawMessage = typeof record.message === 'string' ? record.message.trim() : '';

  if (!rawMessage) {
    return { ok: false, error: 'Please enter a question before sending.' };
  }

  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Question is too long (maximum ${MAX_MESSAGE_LENGTH} characters).`,
    };
  }

  const history: AssistantMessage[] = [];
  if (Array.isArray(record.history)) {
    for (const entry of record.history.slice(-MAX_HISTORY_TURNS)) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const role = item.role === 'model' ? 'model' : item.role === 'user' ? 'user' : null;
      const text = trimString(item.text, MAX_HISTORY_TEXT_LENGTH);
      if (role && text) {
        history.push({ role, text });
      }
    }
  }

  const products: AssistantProductBrief[] = [];
  if (Array.isArray(record.products)) {
    for (const rawProd of record.products.slice(0, MAX_PRODUCTS_CONTEXT)) {
      if (!rawProd || typeof rawProd !== 'object') continue;
      const p = rawProd as Record<string, unknown>;
      const name = trimString(p.name, 160);
      const brand = trimString(p.brand, 80) || 'BrainAxis';
      const pricePkr =
        typeof p.pricePkr === 'number' && Number.isFinite(p.pricePkr) && p.pricePkr >= 0
          ? Math.round(p.pricePkr)
          : 0;
      if (!name) continue;
      products.push({
        name,
        brand,
        packSize: trimString(p.packSize, 80) || undefined,
        strength: trimString(p.strength, 80) || undefined,
        pricePkr,
        shortDescription: trimString(p.shortDescription, 400) || undefined,
        directions: trimString(p.directions, 400) || undefined,
        warnings: trimString(p.warnings, 400) || undefined,
        manufacturer: trimString(p.manufacturer, 200) || undefined,
        certifications: Array.isArray(p.certifications)
          ? p.certifications
              .map((c) => trimString(c, 60))
              .filter(Boolean)
              .slice(0, 6)
          : undefined,
        benefits: Array.isArray(p.benefits)
          ? p.benefits
              .map((b) => trimString(b, 120))
              .filter(Boolean)
              .slice(0, 8)
          : undefined,
      });
    }
  }

  let site: AssistantSiteBrief | undefined;
  if (record.site && typeof record.site === 'object') {
    const s = record.site as Record<string, unknown>;
    const businessName = trimString(s.businessName, 120);
    if (businessName) {
      site = {
        businessName,
        supplementBrandName: trimString(s.supplementBrandName, 80) || undefined,
        shippingFeePkr:
          typeof s.shippingFeePkr === 'number' && Number.isFinite(s.shippingFeePkr)
            ? Math.max(0, Math.round(s.shippingFeePkr))
            : 200,
        freeShippingThresholdPkr:
          typeof s.freeShippingThresholdPkr === 'number' &&
          Number.isFinite(s.freeShippingThresholdPkr)
            ? Math.max(0, Math.round(s.freeShippingThresholdPkr))
            : 2000,
        codEnabled: typeof s.codEnabled === 'boolean' ? s.codEnabled : true,
        supportHours: trimString(s.supportHours, 120) || undefined,
      };
    }
  }

  return {
    ok: true,
    data: {
      message: rawMessage,
      history,
      products,
      site,
    },
  };
}

const DEFAULT_LAUNCH_PRODUCTS: AssistantProductBrief[] = [
  {
    name: 'BrainAxis Energy Boost',
    brand: 'BrainAxis',
    packSize: '30 Tablets',
    strength: 'Complete Daily Formula',
    pricePkr: 1490,
    shortDescription:
      'Once-daily multivitamin and mineral dietary supplement supporting energy, stamina, focus, memory, immunity, bone health, and heart health.',
    directions:
      'Take one (1) tablet once daily with water, preferably after a meal, or as directed by your healthcare professional.',
    warnings:
      'Do not exceed recommended daily serving. Consult a qualified healthcare provider if pregnant, nursing, taking medication, or managing a medical condition.',
  },
  {
    name: 'BrainAxis SUNDEX-D® Vitamin D3 (Cholecalciferol) 200,000 IU',
    brand: 'BrainAxis',
    packSize: '1 Softgel',
    strength: '200,000 IU',
    pricePkr: 799,
    shortDescription:
      'High-potency Vitamin D3 (Cholecalciferol) 200,000 IU softgel capsule supporting Vitamin D restoration, bone & joint health, muscle strength, and immune function.',
    directions:
      'As directed by your healthcare provider. Typically 1 softgel (200,000 IU) as a single dose or as advised by the physician, taken with a meal containing fat for better absorption.',
    warnings:
      'CAUTION: High-dose Vitamin D3. Use only on the advice of a registered healthcare professional.',
    manufacturer: 'Bio Serve Pharma — Karachi, Pakistan',
    certifications: ['GMP Certified', 'ISO', 'DRAP Registered'],
  },
];

export function buildAssistantSystemInstruction(
  products: AssistantProductBrief[],
  site?: AssistantSiteBrief
): string {
  const activeProducts = products.length > 0 ? products : DEFAULT_LAUNCH_PRODUCTS;
  const businessName = site?.businessName || 'Dr. Ali Hassan Health & Wellness';
  const supplementBrand = site?.supplementBrandName || 'BrainAxis';
  const shippingFee = site?.shippingFeePkr ?? 200;
  const freeThreshold = site?.freeShippingThresholdPkr ?? 2000;
  const supportHours = site?.supportHours || 'Monday – Saturday, 9:00 AM – 7:00 PM PKT';

  const productLines = activeProducts
    .map((p, index) => {
      const details = [
        `${index + 1}. ${p.name} (${p.brand}) — Price: Rs. ${p.pricePkr.toLocaleString('en-PK')}`,
        p.packSize ? `Pack: ${p.packSize}` : '',
        p.strength ? `Strength: ${p.strength}` : '',
        p.shortDescription ? `Overview: ${p.shortDescription}` : '',
        p.benefits?.length ? `Key benefits: ${p.benefits.join(', ')}` : '',
        p.directions ? `Directions: ${p.directions}` : '',
        p.warnings ? `Caution: ${p.warnings}` : '',
        p.manufacturer ? `Manufacturer: ${p.manufacturer}` : '',
        p.certifications?.length ? `Certifications: ${p.certifications.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' | ');
      return details;
    })
    .join('\n');

  return [
    `You are the official AI Supplement Guide for ${businessName} (${supplementBrand} supplement line).`,
    'Answer customer questions accurately, clearly, and concisely in the same language the customer uses (English, Roman Urdu, or Urdu).',
    '',
    'LIVE STOREFRONT CATALOG (ONLY recommend or describe products listed below — never invent products, prices, or unverified claims):',
    productLines,
    '',
    'SHIPPING & ORDERING POLICY:',
    `- Nationwide delivery across Pakistan. Standard shipping fee: Rs. ${shippingFee}. Free shipping on orders of Rs. ${freeThreshold} or above.`,
    `- Payment options at launch: ${site?.codEnabled !== false ? 'Cash on Delivery (COD) and WhatsApp order confirmation' : 'WhatsApp order support'}.`,
    '- Customers can track orders on the Track Order page using their Order Number and checkout email/phone.',
    `- Support hours: ${supportHours}.`,
    '',
    'STRICT SAFETY & ACCURACY RULES:',
    '- Never diagnose diseases, prescribe treatments, or claim supplements cure, treat, or prevent any disease.',
    '- Whenever discussing BrainAxis SUNDEX-D® 200,000 IU (or combining high-dose Vitamin D3 with other supplements), explicitly state that it is a high-dose Vitamin D3 formula and must be used only on the advice of a registered healthcare professional.',
    '- If asked about personal medical conditions, pregnancy, medications, or lab results, encourage consulting a qualified physician.',
    '- Keep replies well-structured and brief (3–6 short sentences or simple "-" bullet lines, avoiding Markdown asterisks ** or # headings).',
  ].join('\n');
}

export function extractReadableErrorMessage(
  rawError: unknown,
  fallback = 'Unable to generate an AI response right now. Please try again shortly.'
): string {
  const candidate =
    typeof rawError === 'string'
      ? rawError
      : rawError && typeof rawError === 'object' && 'message' in rawError
      ? String((rawError as { message?: unknown }).message ?? '')
      : '';

  const trimmed = candidate.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { error?: { message?: string }; message?: string };
      const nested = parsed?.error?.message || parsed?.message;
      if (typeof nested === 'string' && nested.trim()) {
        return nested.trim();
      }
    } catch {
      // Fall through to plain trimmed string
    }
  }

  return trimmed;
}

