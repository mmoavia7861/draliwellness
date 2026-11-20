import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  checkoutSchema,
  filterAndSortProducts,
  formatPkr,
  getVisibleCategories,
} from './commerce';
import { computeTrackingKey } from './tracking';
import { LAUNCH_CATEGORIES, LAUNCH_PRODUCTS } from '../data/launchCatalog';
import type { CartItem, Category, Coupon, Product } from '../types';

test('formatPkr formats Pakistani Rupee prices cleanly', () => {
  assert.equal(formatPkr(799), 'Rs. 799');
  assert.equal(formatPkr(1490), 'Rs. 1,490');
  assert.equal(formatPkr(-10), 'Rs. 0');
});

test('calculateCartTotals computes subtotal, shipping, and free shipping threshold', () => {
  const items: CartItem[] = [
    {
      productId: 'brainaxis-sundex-d',
      slug: 'brainaxis-sundex-d',
      name: 'BrainAxis SUNDEX-D',
      brand: 'BrainAxis',
      unitPricePkr: 799,
      quantity: 1,
      maxStock: 50,
    },
  ];
  const underThreshold = calculateCartTotals(items, 200, 2000);
  assert.equal(underThreshold.subtotalPkr, 799);
  assert.equal(underThreshold.shippingFeePkr, 200);
  assert.equal(underThreshold.totalPkr, 999);

  const overThreshold = calculateCartTotals(
    [{ ...items[0], quantity: 3 }],
    200,
    2000
  );
  assert.equal(overThreshold.subtotalPkr, 2397);
  assert.equal(overThreshold.shippingFeePkr, 0);
  assert.equal(overThreshold.totalPkr, 2397);
});

test('calculateCartTotals rejects expired or inactive coupons', () => {
  const items: CartItem[] = [
    {
      productId: 'brainaxis-energy-boost',
      slug: 'brainaxis-energy-boost',
      name: 'BrainAxis Energy Boost',
      brand: 'BrainAxis',
      unitPricePkr: 1490,
      quantity: 1,
      maxStock: 50,
    },
  ];
  const expiredCoupon: Coupon = {
    code: 'OLD10',
    discountType: 'percent',
    value: 10,
    active: true,
    expiresAt: '2020-01-01T00:00:00Z',
  };
  const res = calculateCartTotals(items, 200, 2000, expiredCoupon, new Date('2026-11-20T00:00:00Z'));
  assert.equal(res.discountPkr, 0);
  assert.ok(res.couponError?.includes('expired'));

  const validCoupon: Coupon = {
    code: 'SAVE10',
    discountType: 'percent',
    value: 10,
    active: true,
  };
  const validRes = calculateCartTotals(items, 200, 2000, validCoupon);
  assert.equal(validRes.discountPkr, 149);
  assert.equal(validRes.appliedCouponCode, 'SAVE10');
});

test('getVisibleCategories hides empty categories automatically', () => {
  const extraCategories: Category[] = [
    ...LAUNCH_CATEGORIES,
    {
      id: 'empty-sleep',
      slug: 'sleep-support',
      name: 'Sleep Support',
      active: true,
      sortOrder: 99,
    },
  ];
  const visible = getVisibleCategories(extraCategories, LAUNCH_PRODUCTS);
  assert.equal(visible.some((c) => c.id === 'empty-sleep'), false);
  assert.equal(visible.length, LAUNCH_CATEGORIES.length);
});

test('filterAndSortProducts hides unpublished or unapproved products and searches accurately', () => {
  const draftProduct: Product = {
    ...LAUNCH_PRODUCTS[0],
    id: 'draft-future-product',
    slug: 'draft-future-product',
    name: 'Future Magnesium',
    published: false,
    complianceStatus: 'draft',
  };
  const all = [...LAUNCH_PRODUCTS, draftProduct];
  const live = filterAndSortProducts(all, {});
  assert.equal(live.length, 2);

  const searchD3 = filterAndSortProducts(all, { query: 'cholecalciferol' });
  assert.equal(searchD3.length, 1);
  assert.equal(searchD3[0].id, 'brainaxis-sundex-d');
});

test('checkoutSchema validates required Pakistani checkout fields and rejects invalid entries', () => {
  const invalid = checkoutSchema.safeParse({
    customerName: 'A',
    customerEmail: 'bad-email',
    customerPhone: '123',
    shippingAddress: 'abc',
    city: '',
    paymentMethod: 'cod',
  });
  assert.equal(invalid.success, false);

  const valid = checkoutSchema.safeParse({
    customerName: 'Ayesha Khan',
    customerEmail: 'ayesha@example.com',
    customerPhone: '03001234567',
    shippingAddress: 'House 12, Street 4, Gulberg III',
    city: 'Lahore',
    paymentMethod: 'cod',
  });
  assert.equal(valid.success, true);
});

test('computeTrackingKey produces deterministic case-insensitive verification hashes', async () => {
  const k1 = await computeTrackingKey('DRH-261120-1234', 'Customer@Example.com');
  const k2 = await computeTrackingKey('drh-261120-1234', ' customer@example.com ');
  assert.equal(k1, k2);
  assert.equal(k1.length, 64);
});
