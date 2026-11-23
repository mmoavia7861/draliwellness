import { z } from 'zod';
import type { CartItem, Category, Coupon, OrderStatus, Product } from '../types';

export function formatPkr(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `Rs. ${safe.toLocaleString('en-PK')}`;
}

export interface CartTotals {
  subtotalPkr: number;
  discountPkr: number;
  shippingFeePkr: number;
  totalPkr: number;
  itemCount: number;
  couponError?: string;
  appliedCouponCode?: string;
}

export function calculateCartTotals(
  items: CartItem[],
  _shippingFeePkr: number,
  _freeShippingThresholdPkr: number,
  coupon?: Coupon | null,
  now: Date = new Date()
): CartTotals {
  const subtotalPkr = items.reduce(
    (sum, item) => sum + Math.max(0, item.unitPricePkr) * Math.max(0, item.quantity),
    0
  );
  const itemCount = items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);

  if (items.length === 0 || subtotalPkr === 0) {
    return {
      subtotalPkr: 0,
      discountPkr: 0,
      shippingFeePkr: 0,
      totalPkr: 0,
      itemCount: 0,
    };
  }

  let discountPkr = 0;
  let couponError: string | undefined;
  let appliedCouponCode: string | undefined;

  if (coupon) {
    if (!coupon.active) {
      couponError = 'This coupon code is no longer active.';
    } else if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime()) {
      couponError = 'This coupon code has expired.';
    } else if (coupon.minOrderPkr && subtotalPkr < coupon.minOrderPkr) {
      couponError = `Minimum order of ${formatPkr(coupon.minOrderPkr)} required for ${coupon.code}.`;
    } else {
      if (coupon.discountType === 'percent') {
        discountPkr = Math.round((subtotalPkr * Math.min(100, Math.max(0, coupon.value))) / 100);
      } else {
        discountPkr = Math.min(subtotalPkr, Math.max(0, Math.round(coupon.value)));
      }
      appliedCouponCode = coupon.code;
    }
  }

  const discountedSubtotal = Math.max(0, subtotalPkr - discountPkr);
  // Free nationwide delivery is guaranteed even for previously saved CMS fees.
  const effectiveShipping = 0;

  return {
    subtotalPkr,
    discountPkr,
    shippingFeePkr: effectiveShipping,
    totalPkr: discountedSubtotal + effectiveShipping,
    itemCount,
    couponError,
    appliedCouponCode,
  };
}

export function isProductLive(product: Product): boolean {
  return product.published === true && product.complianceStatus === 'approved';
}

export function getVisibleCategories(categories: Category[], products: Product[]): Category[] {
  const liveProducts = products.filter(isProductLive);
  const activeCatIds = new Set<string>();
  for (const product of liveProducts) {
    for (const catId of product.categoryIds ?? []) {
      activeCatIds.add(catId);
    }
  }
  return categories
    .filter((cat) => cat.active && activeCatIds.has(cat.id))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export function filterAndSortProducts(
  products: Product[],
  options: {
    query?: string;
    categoryId?: string;
    inStockOnly?: boolean;
    sortBy?: SortOption;
  }
): Product[] {
  const { query = '', categoryId = 'all', inStockOnly = false, sortBy = 'featured' } = options;
  const q = query.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (!isProductLive(p)) return false;
    if (inStockOnly && p.stock <= 0) return false;
    if (categoryId && categoryId !== 'all') {
      if (!(p.categoryIds ?? []).includes(categoryId)) return false;
    }
    if (q) {
      const haystack = [
        p.name,
        p.subtitle ?? '',
        p.brand,
        p.shortDescription ?? '',
        p.ingredientsSummary ?? '',
        ...(p.benefits ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.pricePkr - b.pricePkr;
    if (sortBy === 'price-desc') return b.pricePkr - a.pricePkr;
    if (sortBy === 'newest') {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      return bOrder - aOrder;
    }
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Please enter your full name.'),
  customerEmail: z.string().trim().email('Please enter a valid email address.'),
  customerPhone: z
    .string()
    .trim()
    .min(7, 'Please enter a valid phone number.')
    .max(32, 'Phone number is too long.'),
  shippingAddress: z.string().trim().min(5, 'Please enter your complete street address.'),
  city: z.string().trim().min(2, 'Please enter your city.'),
  province: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().max(500, 'Notes must be 500 characters or less.').optional(),
  paymentMethod: z.enum(['cod', 'whatsapp', 'easypaisa', 'jazzcash']),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().trim().max(32).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(5, 'Please enter your message (at least 5 characters).').max(2000),
});

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    placed: 'Order Placed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}
