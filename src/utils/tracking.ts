export function normalizeContactForTracking(contact: string): string {
  return contact.trim().toLowerCase().replace(/\s+/g, '');
}

export async function computeTrackingKey(orderNumber: string, contact: string): Promise<string> {
  const input = `${orderNumber.trim().toUpperCase()}::${normalizeContactForTracking(contact)}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// A high-entropy, customer-facing tracking ID. Unlike the short order reference,
// this cannot practically be guessed by trying dates and sequential numbers.
// Twenty base32 characters encode 100 cryptographically random bits.
const TRACKING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TRACKING_ID_PATTERN = /^TRK-[A-HJ-NP-Z2-9]{20}$/;

export function generateTrackingId(): string {
  const bytes = new Uint8Array(20);
  globalThis.crypto.getRandomValues(bytes);
  return 'TRK-' + Array.from(bytes, byte => TRACKING_ALPHABET[byte & 31]).join('');
}

export function normalizeTrackingId(input: string): string | null {
  const value = input.trim().toUpperCase().replace(/\\s+/g, '');
  // Existing records use a SHA-256 document ID derived from order+email.
  // Permit their ID (without collecting an email again) for backward links.
  if (TRACKING_ID_PATTERN.test(value)) return value;
  if (/^[A-F0-9]{64}$/.test(value)) return value.toLowerCase();
  return null;
}

export function generateOrderNumber(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRH-${yy}${mm}${dd}-${rand}`;
}
