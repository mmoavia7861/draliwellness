import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orderCreatedAtMs, orderDayKey, formatOrderDateTime,
  sortAndFilterOrders,
} from './orderAdmin';
import type { Order } from '../types';

const sample = (orderNumber: string, createdAt: unknown, status: Order['status'] = 'placed'): Order => ({
  id: orderNumber, orderNumber, createdAt, status, customerName: 'Customer',
  customerEmail: 'customer@example.com', customerPhone: '03000000000',
  city: 'Lahore', shippingAddress: 'Main Street', userId: 'guest',
  trackingKey: 'TRK-example', items: [], subtotalPkr: 1295, totalPkr: 1295,
  shippingFeePkr: 0, paymentMethod: 'cod', paymentStatus: 'pending',
});

test('order timestamps accept Firestore Timestamp and ISO dates', () => {
  assert.equal(orderCreatedAtMs({ seconds: 1795705200, nanoseconds: 0 }), 1795705200000);
  assert.equal(orderCreatedAtMs({ toMillis: () => 1795705200000 }), 1795705200000);
  assert.equal(orderCreatedAtMs('invalid'), 0);
});

test('PKT dates format using Asia/Karachi rather than viewer locale', () => {
  const stamp = '2026-11-26T20:30:00.000Z'; // 27 November, 01:30 PKT
  assert.equal(orderDayKey(stamp), '2026-11-27');
  assert.match(formatOrderDateTime(stamp), /PKT$/);
  assert.equal(orderDayKey(undefined), 'unknown');
});

test('sort orders chronologically and apply date range, status and search', () => {
  const orders = [
    sample('OLD', '2026-11-25T10:00:00Z'),
    sample('NEW', '2026-11-26T20:30:00Z', 'shipped'),
    sample('MID', '2026-11-26T10:00:00Z'),
  ];
  const base = { status: 'all', search: '', from: '', to: '', sort: 'newest' as const };
  assert.deepEqual(sortAndFilterOrders(orders, base).map((x) => x.orderNumber), ['NEW', 'MID', 'OLD']);
  assert.deepEqual(sortAndFilterOrders(orders, { ...base, sort: 'oldest' }).map((x) => x.orderNumber), ['OLD', 'MID', 'NEW']);
  assert.deepEqual(sortAndFilterOrders(orders, { ...base, from: '2026-11-27' }).map((x) => x.orderNumber), ['NEW']);
  assert.deepEqual(sortAndFilterOrders(orders, { ...base, status: 'shipped', search: 'new' }).map((x) => x.orderNumber), ['NEW']);
});
