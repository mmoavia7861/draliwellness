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

/** Convert a Pakistani checkout mobile number to WhatsApp's international format. */
export function normalizePakistanWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (/^03[0-9]{9}$/.test(digits)) return '92' + digits.slice(1);
  if (/^923[0-9]{9}$/.test(digits)) return digits;
  if (/^3[0-9]{9}$/.test(digits)) return '92' + digits;
  if (/^00923[0-9]{9}$/.test(digits)) return digits.slice(2);
  return null;
}

export function generateOrderNumber(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DRH-${yy}${mm}${dd}-${rand}`;
}
