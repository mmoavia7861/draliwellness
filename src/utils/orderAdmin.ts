import type { Order } from '../types';

// Firestore Timestamp, persisted legacy dates and ISO strings are all supported.
export function orderCreatedAtMs(value: unknown): number {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  if (value && typeof value === 'object') {
    const stamp = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
    };
    if (typeof stamp.toMillis === 'function') {
      const result = stamp.toMillis();
      return Number.isFinite(result) ? result : 0;
    }
    if (typeof stamp.toDate === 'function') return orderCreatedAtMs(stamp.toDate());
    const seconds = stamp.seconds ?? stamp._seconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      return seconds * 1000 + Math.floor((stamp.nanoseconds ?? 0) / 1_000_000);
    }
  }
  return 0;
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function orderDayKey(value: unknown): string {
  const millis = orderCreatedAtMs(value);
  if (!millis) return 'unknown';
  const parts = dayFormatter.formatToParts(new Date(millis));
  const field = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${field('year')}-${field('month')}-${field('day')}`;
}

export function formatOrderDateTime(value: unknown): string {
  const millis = orderCreatedAtMs(value);
  if (!millis) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true,
  }).format(new Date(millis)) + ' PKT';
}

export function formatOrderDay(key: string): string {
  if (key === 'unknown') return 'Date unavailable';
  const millis = Date.parse(key + 'T12:00:00+05:00');
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(millis));
}

export function sortAndFilterOrders(
  orders: Order[],
  filters: { status: string; search: string; from: string; to: string; sort: 'newest' | 'oldest' }
): Order[] {
  const query = filters.search.trim().toLowerCase();
  return orders.filter((order) => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    const day = orderDayKey(order.createdAt);
    if (filters.from && (day === 'unknown' || day < filters.from)) return false;
    if (filters.to && (day === 'unknown' || day > filters.to)) return false;
    if (!query) return true;
    return [
      order.orderNumber, order.customerName, order.customerEmail,
      order.customerPhone, order.city, order.trackingKey,
    ].some((value) => String(value ?? '').toLowerCase().includes(query));
  }).sort((a, b) => {
    const delta = orderCreatedAtMs(a.createdAt) - orderCreatedAtMs(b.createdAt);
    if (delta !== 0) return filters.sort === 'newest' ? -delta : delta;
    return a.orderNumber.localeCompare(b.orderNumber);
  });
}
