export type ComplianceStatus =
  | 'draft'
  | 'awaiting_docs'
  | 'under_review'
  | 'approved'
  | 'archived';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'whatsapp' | 'jazzcash' | 'easypaisa' | 'card' | 'safepay';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface SupplementFactRow {
  nutrient: string;
  amount: string;
  dailyValue?: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  pricePkr: number;
  stock: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  brand: string;
  founderMention?: string;
  categoryIds?: string[];
  shortDescription?: string;
  overview?: string;
  format?: string;
  packSize?: string;
  strength?: string;
  usageSummary?: string;
  pricePkr: number;
  compareAtPricePkr?: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  galleryUrls?: string[];
  benefits?: string[];
  ingredientsSummary?: string;
  supplementFacts?: SupplementFactRow[];
  otherIngredients?: string;
  directions?: string;
  warnings?: string;
  storageInstructions?: string;
  allergens?: string;
  interactions?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
  enlistmentNo?: string;
  form7No?: string;
  certifications?: string[];
  faqs?: FaqItem[];
  variants?: ProductVariant[];
  featured?: boolean;
  published: boolean;
  complianceStatus: ComplianceStatus;
  sortOrder?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SitePolicies {
  privacyPolicy: string;
  termsAndConditions: string;
  shippingPolicy: string;
  refundPolicy: string;
  supplementDisclaimer: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
}

export interface HeroBannerSlide {
  id: string;
  imageUrl: string;
  alt: string;
  to: string;
}

export interface SiteSettings {
  id: string;
  businessName: string;
  supplementBrandName?: string;
  tagline?: string;
  announcementEnabled?: boolean;
  announcementText?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  banners?: HeroBannerSlide[];
  bannerIntervalSec?: number;
  founderName?: string;
  founderTitle?: string;
  founderPhotoUrl?: string;
  founderBio?: string;
  founderMission?: string;
  whatsappNumber?: string;
  whatsappGreeting?: string;
  supportEmail?: string;
  supportHours?: string;
  shippingFeePkr: number;
  freeShippingThresholdPkr: number;
  codEnabled?: boolean;
  onlinePaymentsEnabled?: boolean;
  faqs?: FaqItem[];
  policies?: SitePolicies;
  socialLinks?: SocialLinks;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl?: string;
  packSize?: string;
  variantId?: string;
  variantLabel?: string;
  unitPricePkr: number;
  quantity: number;
  maxStock: number;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  variantLabel?: string;
  unitPricePkr: number;
  quantity: number;
  lineTotalPkr: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  trackingKey: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  province?: string;
  postalCode?: string;
  notes?: string;
  items: OrderItemSnapshot[];
  subtotalPkr: number;
  discountPkr?: number;
  couponCode?: string;
  shippingFeePkr: number;
  totalPkr: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  courierName?: string;
  courierTrackingNo?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderTracking {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  city?: string;
  totalPkr: number;
  itemCount?: number;
  itemsSummary?: string[];
  courierName?: string;
  courierTrackingNo?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Coupon {
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minOrderPkr?: number;
  active: boolean;
  expiresAt?: string;
  createdAt?: unknown;
}

export interface Service {
  id: string;
  title: string;
  description?: string;
  providerName?: string;
  providerQualifications?: string;
  durationMinutes?: number;
  feePkr?: number;
  visible: boolean;
  bookingEnabled: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Appointment {
  id: string;
  userId: string;
  serviceId: string;
  serviceTitle?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  preferredDate: string;
  preferredSlot: string;
  notes?: string;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: unknown;
}

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary?: string;
  content?: string;
  authorName?: string;
  published: boolean;
  publishedAt?: string;
  updatedAt?: unknown;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  createdAt?: unknown;
}

export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province?: string;
  postalCode?: string;
}

export interface UserPrivateProfile {
  email: string;
  phone?: string;
  addresses?: SavedAddress[];
  wishlistProductIds?: string[];
  newsletterOptIn?: boolean;
  updatedAt?: unknown;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  consent: boolean;
  createdAt?: unknown;
}

export interface UserPublicProfile {
  uid: string;
  displayName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminMember {
  uid: string;
  email: string;
  role: 'super_admin' | 'editor';
  createdAt?: unknown;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail?: string;
  action: string;
  targetCollection: string;
  targetId: string;
  summary?: string;
  createdAt?: unknown;
}
