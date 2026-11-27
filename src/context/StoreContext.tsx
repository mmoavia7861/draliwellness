import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  LAUNCH_CATEGORIES,
  LAUNCH_PRODUCTS,
  LAUNCH_SERVICES,
  LAUNCH_SITE_SETTINGS,
} from '../data/launchCatalog';
import type {
  AdminMember,
  Appointment,
  AuditLog,
  CartItem,
  Category,
  ContactInquiry,
  Coupon,
  JournalPost,
  NewsletterSubscriber,
  Order,
  OrderStatus,
  OrderTracking,
  PaymentStatus,
  Product,
  ProductVariant,
  Review,
  SavedAddress,
  Service,
  SiteSettings,
  UserPrivateProfile,
  UserPublicProfile,
} from '../types';
import {
  calculateCartTotals,
  getVisibleCategories,
  isProductLive,
  type CheckoutFormValues,
} from '../utils/commerce';
import { sanitizeAdminMemberInput, sanitizeSiteSettingsForFirestore } from '../utils/admin';
import { computeTrackingKey, generateOrderNumber, generateTrackingId, normalizeTrackingId } from '../utils/tracking';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

const CART_STORAGE_KEY = 'dr_ali_hassan_cart_v1';
const WISHLIST_STORAGE_KEY = 'dr_ali_hassan_wishlist_v1';
const BOOTSTRAP_ADMIN_EMAIL = 'moavia400@gmail.com';

// Restore the current launch offer on older Firestore records, without changing
// intentionally edited selling prices or product availability.
function normalizeLaunchOfferPricing(product: Product): Product {
  const isEnergyBoost = product.id === 'brainaxis-energy-boost';
  const isSundexD = product.id === 'brainaxis-sundex-d';

  const oldEnergyBoostPrice = isEnergyBoost && product.pricePkr === 1350;
  const sellingPrice = oldEnergyBoostPrice ? 1295 : product.pricePkr;

  const updatedVariants = product.variants?.map((variant) =>
    isEnergyBoost && variant.id === 'eb-30-tablets' && variant.pricePkr === 1350
      ? { ...variant, pricePkr: 1295 }
      : variant
  );

  // Show the owner-requested strike-through price when the product is still at
  // its standard launch selling price; other admin-edited selling prices remain.
  const launchComparePrice =
    isEnergyBoost && sellingPrice === 1295
      ? 2000
      : isSundexD && sellingPrice === 799
        ? 999
        : undefined;

  return {
    ...product,
    pricePkr: sellingPrice,
    ...(launchComparePrice ? { compareAtPricePkr: launchComparePrice } : {}),
    variants: updatedVariants,
  };
}

interface StoreContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminChecked: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;

  products: Product[];
  liveProducts: Product[];
  categories: Category[];
  visibleCategories: Category[];
  siteSettings: SiteSettings;
  services: Service[];
  reviews: Review[];
  journalPosts: JournalPost[];
  firestoreSeeded: boolean;

  cart: CartItem[];
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  clearCoupon: () => void;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateCartQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;

  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  userProfile: UserPrivateProfile | null;
  saveUserProfile: (updates: Partial<UserPrivateProfile>) => Promise<void>;
  saveAddress: (address: SavedAddress) => Promise<void>;
  removeAddress: (addressId: string) => Promise<void>;

  placeOrder: (values: CheckoutFormValues) => Promise<Order>;
  trackOrder: (trackingId: string) => Promise<OrderTracking | null>;
  fetchMyOrders: () => Promise<Order[]>;
  fetchMyAppointments: () => Promise<Appointment[]>;
  cancelMyOrder: (orderId: string) => Promise<void>;
  submitContactInquiry: (payload: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) => Promise<void>;
  subscribeNewsletter: (email: string) => Promise<void>;
  requestAppointment: (payload: {
    service: Service;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    preferredDate: string;
    preferredSlot: string;
    notes?: string;
  }) => Promise<void>;

  // Admin Operations
  seedLaunchCatalog: () => Promise<number>;
  saveProduct: (product: Product, isNew?: boolean) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (category: Category, isNew?: boolean) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  saveSiteSettings: (settings: SiteSettings) => Promise<void>;
  fetchAllOrders: () => Promise<Order[]>;
  deleteOrder: (order: Order) => Promise<void>;
  updateOrderFulfillment: (
    order: Order,
    updates: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      courierName?: string;
      courierTrackingNo?: string;
    }
  ) => Promise<void>;
  fetchAllCoupons: () => Promise<Coupon[]>;
  saveCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  saveService: (service: Service, isNew?: boolean) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  fetchAllAppointments: () => Promise<Appointment[]>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: Appointment['status']
  ) => Promise<void>;
  saveReview: (review: Review, isNew?: boolean) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  saveJournalPost: (post: JournalPost) => Promise<void>;
  deleteJournalPost: (postId: string) => Promise<void>;
  fetchAllInquiries: () => Promise<ContactInquiry[]>;
  updateInquiryStatus: (id: string, status: ContactInquiry['status']) => Promise<void>;
  deleteContactInquiry: (inquiryId: string) => Promise<void>;
  fetchNewsletterSubscribers: () => Promise<NewsletterSubscriber[]>;
  deleteNewsletterSubscriber: (subscriberId: string) => Promise<void>;
  fetchAllUsers: () => Promise<UserPublicProfile[]>;
  fetchAdminMembers: () => Promise<AdminMember[]>;
  saveAdminMember: (member: {
    uid: string;
    email: string;
    role: 'super_admin' | 'editor';
  }) => Promise<void>;
  deleteAdminMember: (uid: string) => Promise<void>;
  fetchAuditLogs: () => Promise<AuditLog[]>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || `id-${Date.now()}`;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [products, setProducts] = useState<Product[]>(LAUNCH_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(LAUNCH_CATEGORIES);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(LAUNCH_SITE_SETTINGS);
  const [services, setServices] = useState<Service[]>(LAUNCH_SERVICES);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [journalPosts, setJournalPosts] = useState<JournalPost[]>([]);
  const [firestoreSeeded, setFirestoreSeeded] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [userProfile, setUserProfile] = useState<UserPrivateProfile | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore storage quota
    }
  }, [wishlistIds]);

  // Auth listener & Admin check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setAdminChecked(false);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminChecked(true);
        setUserProfile(null);
        return;
      }

      try {
        const isBootstrapped =
          nextUser.emailVerified &&
          nextUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;

        let adminFlag = Boolean(isBootstrapped);
        let superAdminFlag = Boolean(isBootstrapped);
        if (!adminFlag && nextUser.emailVerified) {
          const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
          if (adminSnap.exists() && ['super_admin', 'editor'].includes(adminSnap.data().role)) {
            adminFlag = true;
            superAdminFlag = adminSnap.data().role === 'super_admin';
          }
        }
        if (isBootstrapped) {
          // Verified owner authorization is independent of this best-effort
          // registry write. Database rules still enforce privileges.
          try {
            const adminRef = doc(db, 'admins', nextUser.uid);
            const existingAdmin = await getDoc(adminRef);
            if (!existingAdmin.exists()) {
              await setDoc(adminRef, {
                uid: nextUser.uid,
                email: (nextUser.email ?? BOOTSTRAP_ADMIN_EMAIL).slice(0, 160),
                role: 'super_admin',
                createdAt: serverTimestamp(),
              });
            }
          } catch (registryError) {
            console.warn('Admin registry unavailable. Check Firestore rules.', registryError);
          }
        }
        // Ignore stale admin verification if the user changed during an async check.
        if (auth.currentUser?.uid !== nextUser.uid) return;
        setIsAdmin(adminFlag);
        setIsSuperAdmin(superAdminFlag);
      } catch (err) {
        console.error('Admin verification check error:', err);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      } finally {
        if (auth.currentUser?.uid === nextUser.uid) setAdminChecked(true);
      }

      // Sync customer public/private profile
      if (nextUser.emailVerified) {
        try {
          const pubRef = doc(db, 'users', nextUser.uid);
          const pubSnap = await getDoc(pubRef);
          if (!pubSnap.exists()) {
            await setDoc(pubRef, {
              uid: nextUser.uid,
              displayName: (nextUser.displayName || 'Customer').slice(0, 120),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          const privRef = doc(db, 'users', nextUser.uid, 'private', 'profile');
          const privSnap = await getDoc(privRef);
          if (privSnap.exists()) {
            const prof = privSnap.data() as UserPrivateProfile;
            setUserProfile(prof);
            if (Array.isArray(prof.wishlistProductIds)) {
              setWishlistIds(prof.wishlistProductIds);
            }
          } else {
            const initialProf: UserPrivateProfile = {
              email: (nextUser.email || '').slice(0, 160),
              addresses: [],
              wishlistProductIds: wishlistIds.slice(0, 50),
              newsletterOptIn: false,
            };
            await setDoc(privRef, {
              ...initialProf,
              updatedAt: serverTimestamp(),
            });
            setUserProfile(initialProf);
          }
        } catch (err) {
          console.error('User profile sync note:', err);
        }
      }
    });

    return () => unsub();
  }, []);

  // Live Firestore subscriptions (publicly safe queries, or full admin queries)
  useEffect(() => {
    if (!adminChecked) return;

    const productsQuery = isAdmin
      ? query(collection(db, 'products'), orderBy('sortOrder', 'asc'))
      : query(
          collection(db, 'products'),
          where('published', '==', true),
          where('complianceStatus', '==', 'approved')
        );

    const unsubProducts = onSnapshot(
      productsQuery,
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs
            .map((d) => normalizeLaunchOfferPricing(d.data() as Product))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setProducts(items);
          setFirestoreSeeded(true);
        } else {
          setProducts(LAUNCH_PRODUCTS);
          setFirestoreSeeded(false);
        }
      },
      (err) => {
        console.warn('Products listener fallback to launch catalog:', err.message);
      }
    );

    const categoriesQuery = isAdmin
      ? query(collection(db, 'categories'), orderBy('sortOrder', 'asc'))
      : query(collection(db, 'categories'), where('active', '==', true));

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs
            .map((d) => d.data() as Category)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setCategories(items);
        } else {
          setCategories(LAUNCH_CATEGORIES);
        }
      },
      (err) => {
        console.warn('Categories listener fallback:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'siteSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const saved = snap.data() as SiteSettings;
          const savedPhone = (saved.whatsappNumber || '').replace(/[^0-9]/g, '');
          setSiteSettings({
            ...LAUNCH_SITE_SETTINGS,
            ...saved,
            // Free nationwide delivery supersedes old fee/threshold values in Firestore.
            shippingFeePkr: 0,
            freeShippingThresholdPkr: 0,
            policies: {
              ...LAUNCH_SITE_SETTINGS.policies!,
              ...saved.policies,
              shippingPolicy: /standard shipping charges|free-shipping thresholds/i.test(saved.policies?.shippingPolicy || '')
                ? LAUNCH_SITE_SETTINGS.policies!.shippingPolicy
                : (saved.policies?.shippingPolicy || LAUNCH_SITE_SETTINGS.policies!.shippingPolicy),
            },
            // Replace only the previously seeded placeholder number, not custom admin values.
            whatsappNumber:
              !savedPhone || savedPhone === '923000000000'
                ? LAUNCH_SITE_SETTINGS.whatsappNumber
                : saved.whatsappNumber,
            socialLinks: {
              ...LAUNCH_SITE_SETTINGS.socialLinks,
              ...saved.socialLinks,
              instagram:
                saved.socialLinks?.instagram || LAUNCH_SITE_SETTINGS.socialLinks?.instagram,
            },
          });
        }
      },
      (err) => {
        console.warn('Site settings listener fallback:', err.message);
      }
    );

    const servicesQuery = isAdmin
      ? query(collection(db, 'services'), orderBy('sortOrder', 'asc'))
      : query(collection(db, 'services'), where('visible', '==', true));

    const unsubServices = onSnapshot(
      servicesQuery,
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs
            .map((d) => d.data() as Service)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setServices(items);
        } else {
          setServices(LAUNCH_SERVICES);
        }
      },
      (err) => {
        console.warn('Services listener fallback:', err.message);
      }
    );

    const reviewsQuery = isAdmin
      ? query(collection(db, 'reviews'))
      : query(collection(db, 'reviews'), where('approved', '==', true));

    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snap) => {
        setReviews(snap.docs.map((d) => d.data() as Review));
      },
      (err) => {
        console.warn('Reviews listener note:', err.message);
      }
    );

    const journalQuery = isAdmin
      ? query(collection(db, 'journalPosts'))
      : query(collection(db, 'journalPosts'), where('published', '==', true));

    const unsubJournal = onSnapshot(
      journalQuery,
      (snap) => {
        setJournalPosts(snap.docs.map((d) => d.data() as JournalPost));
      },
      (err) => {
        console.warn('Journal listener note:', err.message);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
      unsubServices();
      unsubReviews();
      unsubJournal();
    };
  }, [isAdmin, adminChecked]);

  // Add missing launch records only. Never overwrite live prices, stock, orders
  // or administrator-authored CMS settings when initializing the store.
  const seedLaunchCatalog = useCallback(async () => {
    if (!isAdmin || !auth.currentUser) {
      throw new Error('Administrator permissions are required to initialize the catalog.');
    }

    // Refresh the Firebase ID token after email verification. Firestore checks
    // request.auth.token.email_verified, not just the client UI state.
    await auth.currentUser.reload();
    if (!auth.currentUser.emailVerified) {
      throw new Error('Verify the administrator email, then sign out and sign in again.');
    }
    await auth.currentUser.getIdToken(true);

    // Only insert missing documents; do not overwrite prices, stock, orders,
    // banners or other content already edited through the dashboard.
    const candidateDocs = [
      ...LAUNCH_CATEGORIES.map((category) => ({
        ref: doc(db, 'categories', category.id),
        data: { ...category, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      })),
      ...LAUNCH_PRODUCTS.map((product) => ({
        ref: doc(db, 'products', product.id),
        data: { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      })),
      {
        ref: doc(db, 'siteSettings', 'main'),
        data: { ...LAUNCH_SITE_SETTINGS, updatedAt: serverTimestamp() },
      },
      ...LAUNCH_SERVICES.map((service) => ({
        ref: doc(db, 'services', service.id),
        data: { ...service, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      })),
    ];

    // Each operation reports its actual document path instead of labelling all
    // read/write failures as "products/seed".
    let inserted = 0;
    for (const candidate of candidateDocs) {
      let exists = false;
      try {
        exists = (await getDoc(candidate.ref)).exists();
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, candidate.ref.path);
      }
      if (exists) continue;

      try {
        await setDoc(candidate.ref, candidate.data);
        inserted += 1;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, candidate.ref.path);
      }
    }
    setFirestoreSeeded(true);
    return inserted;
  }, [isAdmin]);

  // Default initialization is deliberately manual. Auto-seeding on login can
  // trigger denied writes before verified tokens/rules are ready, and a failed
  // batch previously hid which collection needed attention. Admins can use
  // "Check Missing Defaults" to resume safely without overwriting live data.

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  }, []);

  // Customer registration only; /admin never registers users and checks Firestore
  // authorization independently. Passwords are handled exclusively by Firebase Auth.
  const registerWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await sendEmailVerification(credential.user);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Sign in before requesting a verification email.');
    if (auth.currentUser.emailVerified) return;
    await sendEmailVerification(auth.currentUser);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const liveProducts = useMemo(() => products.filter(isProductLive), [products]);

  // Reprice existing browser carts when a product price changes in the live catalog.
  useEffect(() => {
    setCart((previousCart) => {
      let changed = false;
      const updated = previousCart.map((item) => {
        const product = liveProducts.find((p) => p.id === item.productId);
        if (!product) return item;
        const variant = item.variantId
          ? product.variants?.find((v) => v.id === item.variantId)
          : undefined;
        const currentPrice = variant ? variant.pricePkr : product.pricePkr;
        if (currentPrice === item.unitPricePkr) return item;
        changed = true;
        return { ...item, unitPricePkr: currentPrice };
      });
      return changed ? updated : previousCart;
    });
  }, [liveProducts]);
  const visibleCategories = useMemo(
    () => getVisibleCategories(categories, products),
    [categories, products]
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1, variant?: ProductVariant) => {
      if (!isProductLive(product)) return;
      const maxStock = variant ? variant.stock : product.stock;
      if (maxStock <= 0) return;

      const unitPrice = variant ? variant.pricePkr : product.pricePkr;
      const variantId = variant?.id;
      const variantLabel = variant?.label ?? product.packSize;

      setCart((prev) => {
        const idx = prev.findIndex(
          (item) => item.productId === product.id && item.variantId === variantId
        );
        if (idx >= 0) {
          const updated = [...prev];
          const nextQty = Math.min(maxStock, updated[idx].quantity + quantity);
          updated[idx] = { ...updated[idx], quantity: nextQty, unitPricePkr: unitPrice, maxStock };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            packSize: product.packSize,
            variantId,
            variantLabel,
            unitPricePkr: unitPrice,
            quantity: Math.min(maxStock, Math.max(1, quantity)),
            maxStock,
          },
        ];
      });
      setCartDrawerOpen(true);
    },
    []
  );

  const updateCartQuantity = useCallback(
    (productId: string, variantId: string | undefined, quantity: number) => {
      setCart((prev) =>
        prev
          .map((item) => {
            if (item.productId === productId && item.variantId === variantId) {
              if (quantity <= 0) return null;
              return { ...item, quantity: Math.min(item.maxStock, quantity) };
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
      );
    },
    []
  );

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const applyCouponCode = useCallback(
    async (rawCode: string): Promise<{ ok: boolean; message: string }> => {
      const code = rawCode.trim().toUpperCase();
      if (!code || !/^[A-Z0-9_-]+$/.test(code)) {
        return { ok: false, message: 'Please enter a valid alphanumeric coupon code.' };
      }
      try {
        const snap = await getDoc(doc(db, 'coupons', code));
        if (!snap.exists()) {
          return { ok: false, message: 'Coupon code not found.' };
        }
        const coupon = snap.data() as Coupon;
        const preview = calculateCartTotals(
          cart,
          siteSettings.shippingFeePkr,
          siteSettings.freeShippingThresholdPkr,
          coupon
        );
        if (preview.couponError) {
          return { ok: false, message: preview.couponError };
        }
        setAppliedCoupon(coupon);
        return { ok: true, message: `Coupon ${coupon.code} applied.` };
      } catch {
        return { ok: false, message: 'Unable to validate coupon right now.' };
      }
    },
    [cart, siteSettings.shippingFeePkr, siteSettings.freeShippingThresholdPkr]
  );

  const clearCoupon = useCallback(() => setAppliedCoupon(null), []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const next = wishlistIds.includes(productId)
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId].slice(0, 50);
      setWishlistIds(next);

      if (user && user.emailVerified) {
        try {
          await setDoc(
            doc(db, 'users', user.uid, 'private', 'profile'),
            {
              email: (user.email || '').slice(0, 160),
              wishlistProductIds: next,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/private/profile`);
        }
      }
    },
    [wishlistIds, user]
  );

  const saveUserProfile = useCallback(
    async (updates: Partial<UserPrivateProfile>) => {
      if (!user) throw new Error('Please sign in first.');
      const next: UserPrivateProfile = {
        email: (user.email || '').slice(0, 160),
        phone: (updates.phone ?? userProfile?.phone ?? '').slice(0, 32),
        addresses: (updates.addresses ?? userProfile?.addresses ?? []).slice(0, 10),
        wishlistProductIds: (updates.wishlistProductIds ?? wishlistIds).slice(0, 50),
        newsletterOptIn: updates.newsletterOptIn ?? userProfile?.newsletterOptIn ?? false,
      };
      try {
        await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
          ...next,
          updatedAt: serverTimestamp(),
        });
        setUserProfile(next);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/private/profile`);
      }
    },
    [user, userProfile, wishlistIds]
  );

  const saveAddress = useCallback(
    async (address: SavedAddress) => {
      const existing = userProfile?.addresses ?? [];
      const filtered = existing.filter((a) => a.id !== address.id);
      await saveUserProfile({ addresses: [...filtered, address].slice(0, 10) });
    },
    [userProfile, saveUserProfile]
  );

  const removeAddress = useCallback(
    async (addressId: string) => {
      const existing = userProfile?.addresses ?? [];
      await saveUserProfile({ addresses: existing.filter((a) => a.id !== addressId) });
    },
    [userProfile, saveUserProfile]
  );

  const placeOrder = useCallback(
    async (values: CheckoutFormValues): Promise<Order> => {
      if (cart.length === 0) {
        throw new Error('Your cart is empty.');
      }

      // Re-verify items against current live catalog prices & stock
      const verifiedItems = cart.map((item) => {
        const product = liveProducts.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`"${item.name}" is currently unavailable.`);
        }
        const variant = item.variantId
          ? product.variants?.find((v) => v.id === item.variantId)
          : undefined;
        const unitPrice = variant ? variant.pricePkr : product.pricePkr;
        const availableStock = variant ? variant.stock : product.stock;
        if (availableStock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Only ${availableStock} left.`);
        }
        return {
          productId: product.id,
          name: product.name,
          ...(item.variantLabel ? { variantLabel: item.variantLabel.slice(0, 80) } : {}),
          unitPricePkr: unitPrice,
          quantity: item.quantity,
          lineTotalPkr: unitPrice * item.quantity,
        };
      });

      const repricedCart = cart.map((item, index) => ({
        ...item,
        unitPricePkr: verifiedItems[index].unitPricePkr,
      }));
      const totals = calculateCartTotals(
        repricedCart,
        siteSettings.shippingFeePkr,
        siteSettings.freeShippingThresholdPkr,
        appliedCoupon
      );

      const orderNumber = generateOrderNumber();
      const orderId = sanitizeId(orderNumber);
      // Customer-facing tracking IDs are random and independent of their email.
      // Keep the existing email-derived lookup as a compatibility record for the
      // already-deployed owner notification Worker and historical order links.
      const trackingKey = generateTrackingId();
      const notificationTrackingKey = await computeTrackingKey(orderNumber, values.customerEmail);
      const userId = user?.uid ?? 'guest';

      const orderDocData = {
        id: orderId,
        orderNumber,
        userId,
        trackingKey,
        customerName: values.customerName.trim().slice(0, 120),
        customerEmail: values.customerEmail.trim().slice(0, 160),
        customerPhone: values.customerPhone.trim().slice(0, 32),
        shippingAddress: values.shippingAddress.trim().slice(0, 400),
        city: values.city.trim().slice(0, 80),
        province: (values.province || '').trim().slice(0, 80),
        postalCode: (values.postalCode || '').trim().slice(0, 20),
        notes: (values.notes || '').trim().slice(0, 500),
        items: verifiedItems,
        subtotalPkr: totals.subtotalPkr,
        discountPkr: totals.discountPkr,
        couponCode: totals.appliedCouponCode || '',
        shippingFeePkr: totals.shippingFeePkr,
        totalPkr: totals.totalPkr,
        paymentMethod: values.paymentMethod,
        paymentStatus: 'pending' as PaymentStatus,
        status: 'placed' as OrderStatus,
        courierName: '',
        courierTrackingNo: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const trackingDocData = {
        orderNumber,
        status: 'placed' as OrderStatus,
        paymentMethod: values.paymentMethod,
        paymentStatus: 'pending' as PaymentStatus,
        city: values.city.trim().slice(0, 80),
        totalPkr: totals.totalPkr,
        itemCount: totals.itemCount,
        itemsSummary: verifiedItems.map((i) => `${i.name} × ${i.quantity}`).slice(0, 30),
        courierName: '',
        courierTrackingNo: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'orderTracking', trackingKey), trackingDocData);
        batch.set(doc(db, 'orderTracking', notificationTrackingKey), trackingDocData);
        batch.set(doc(db, 'orders', orderId), orderDocData);
        await batch.commit();
        // Transactional owner notification: best-effort, never blocks a valid
        // Firestore order if the external mail service is unavailable.
        try {
          const notificationApiUrl =
            import.meta.env.VITE_ORDER_NOTIFICATION_API_URL?.trim() ||
            'https://draliwellness.moavia400.workers.dev/api/orders/notify';
          const notifyResponse = await fetch(notificationApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNumber, email: values.customerEmail.trim().toLowerCase() }),
            signal: AbortSignal.timeout(3500),
          });
          if (!notifyResponse.ok) {
            console.warn('Order was saved, but the owner notification could not be delivered.');
          }
        } catch {
          console.warn('Order was saved, but the notification endpoint was unavailable.');
        }
        clearCart();
        return {
          ...orderDocData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    },
    [
      cart,
      liveProducts,
      siteSettings.shippingFeePkr,
      siteSettings.freeShippingThresholdPkr,
      appliedCoupon,
      user,
      clearCart,
    ]
  );

  const trackOrder = useCallback(
    async (trackingId: string): Promise<OrderTracking | null> => {
      const key = normalizeTrackingId(trackingId);
      if (!key) return null;
      try {
        const snap = await getDoc(doc(db, 'orderTracking', key));
        if (!snap.exists()) return null;
        return snap.data() as OrderTracking;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `orderTracking/${key}`);
      }
    },
    []
  );

  const fetchMyOrders = useCallback(async (): Promise<Order[]> => {
    if (!user) return [];
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Order);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    }
  }, [user]);

  const fetchMyAppointments = useCallback(async (): Promise<Appointment[]> => {
    if (!user) return [];
    try {
      const q = query(collection(db, 'appointments'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Appointment);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    }
  }, [user]);

  const cancelMyOrder = useCallback(async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  }, []);

  const submitContactInquiry = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone?: string;
      subject?: string;
      message: string;
    }) => {
      const id = sanitizeId(`inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      try {
        await setDoc(doc(db, 'contactInquiries', id), {
          id,
          name: payload.name.trim().slice(0, 120),
          email: payload.email.trim().slice(0, 160),
          phone: (payload.phone || '').trim().slice(0, 32),
          subject: (payload.subject || 'General Inquiry').trim().slice(0, 160),
          message: payload.message.trim().slice(0, 2000),
          status: 'new',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `contactInquiries/${id}`);
      }
    },
    []
  );

  const subscribeNewsletter = useCallback(async (email: string) => {
    const id = sanitizeId(`sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    try {
      await setDoc(doc(db, 'newsletterSubscribers', id), {
        id,
        email: email.trim().toLowerCase().slice(0, 160),
        consent: true,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `newsletterSubscribers/${id}`);
    }
  }, []);

  const requestAppointment = useCallback(
    async (payload: {
      service: Service;
      customerName: string;
      customerEmail?: string;
      customerPhone: string;
      preferredDate: string;
      preferredSlot: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Please sign in to request an appointment.');
      const id = sanitizeId(`apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      try {
        await setDoc(doc(db, 'appointments', id), {
          id,
          userId: user.uid,
          serviceId: payload.service.id,
          serviceTitle: payload.service.title.slice(0, 120),
          customerName: payload.customerName.trim().slice(0, 120),
          customerEmail: (payload.customerEmail || user.email || '').trim().slice(0, 160),
          customerPhone: payload.customerPhone.trim().slice(0, 32),
          preferredDate: payload.preferredDate.slice(0, 32),
          preferredSlot: payload.preferredSlot.slice(0, 40),
          notes: (payload.notes || '').trim().slice(0, 400),
          status: 'requested',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `appointments/${id}`);
      }
    },
    [user]
  );

  // Audit Log helper
  const logAudit = useCallback(
    async (action: string, targetCollection: string, targetId: string, summary?: string) => {
      if (!user) return;
      const id = sanitizeId(`aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      try {
        await setDoc(doc(db, 'auditLogs', id), {
          id,
          actorUid: user.uid,
          actorEmail: (user.email || '').slice(0, 160),
          action: action.slice(0, 120),
          targetCollection: targetCollection.slice(0, 64),
          targetId: targetId.slice(0, 128),
          summary: (summary || '').slice(0, 400),
          createdAt: serverTimestamp(),
        });
      } catch {
        // audit best-effort
      }
    },
    [user]
  );

  const saveProduct = useCallback(
    async (product: Product, isNew = false) => {
      const id = sanitizeId(product.id);
      const slug = product.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 128);

      const cleanPayload = {
        id,
        slug: slug || id,
        name: product.name.trim().slice(0, 160),
        subtitle: (product.subtitle || '').trim().slice(0, 240),
        brand: (product.brand || 'BrainAxis').trim().slice(0, 80),
        founderMention: (product.founderMention || 'Dr. Ali').trim().slice(0, 80),
        categoryIds: (product.categoryIds ?? []).slice(0, 10),
        shortDescription: (product.shortDescription || '').trim().slice(0, 500),
        overview: (product.overview || '').trim().slice(0, 4000),
        format: (product.format || '').trim().slice(0, 80),
        packSize: (product.packSize || '').trim().slice(0, 80),
        strength: (product.strength || '').trim().slice(0, 80),
        usageSummary: (product.usageSummary || '').trim().slice(0, 160),
        pricePkr: Math.max(0, Number(product.pricePkr) || 0),
        compareAtPricePkr: Math.max(0, Number(product.compareAtPricePkr) || 0),
        stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
        sku: (product.sku || '').trim().slice(0, 64),
        imageUrl: (product.imageUrl || '').trim().slice(0, 600),
        galleryUrls: (product.galleryUrls ?? []).slice(0, 8),
        benefits: (product.benefits ?? []).slice(0, 12),
        ingredientsSummary: (product.ingredientsSummary || '').trim().slice(0, 2000),
        supplementFacts: (product.supplementFacts ?? []).slice(0, 20),
        otherIngredients: (product.otherIngredients || '').trim().slice(0, 1000),
        directions: (product.directions || '').trim().slice(0, 2000),
        warnings: (product.warnings || '').trim().slice(0, 2000),
        storageInstructions: (product.storageInstructions || '').trim().slice(0, 1000),
        allergens: (product.allergens || '').trim().slice(0, 500),
        interactions: (product.interactions || '').trim().slice(0, 1000),
        manufacturer: (product.manufacturer || '').trim().slice(0, 300),
        countryOfOrigin: (product.countryOfOrigin || '').trim().slice(0, 80),
        batchNo: (product.batchNo || '').trim().slice(0, 64),
        mfgDate: (product.mfgDate || '').trim().slice(0, 32),
        expDate: (product.expDate || '').trim().slice(0, 32),
        enlistmentNo: (product.enlistmentNo || '').trim().slice(0, 64),
        form7No: (product.form7No || '').trim().slice(0, 64),
        certifications: (product.certifications ?? []).slice(0, 8),
        faqs: (product.faqs ?? []).slice(0, 10),
        variants: (product.variants ?? []).slice(0, 12),
        featured: Boolean(product.featured),
        published: Boolean(product.published),
        complianceStatus: product.complianceStatus,
        sortOrder: Number(product.sortOrder) || 0,
      };

      try {
        const ref = doc(db, 'products', id);
        const existingSnap = await getDoc(ref);
        if (isNew || !existingSnap.exists()) {
          await setDoc(ref, {
            ...cleanPayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await logAudit('CREATE_PRODUCT', 'products', id, cleanPayload.name);
        } else {
          await setDoc(ref, {
            ...cleanPayload,
            createdAt: existingSnap.data().createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await logAudit('UPDATE_PRODUCT', 'products', id, cleanPayload.name);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
      }
    },
    [logAudit]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        await deleteDoc(doc(db, 'products', productId));
        await logAudit('DELETE_PRODUCT', 'products', productId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
      }
    },
    [logAudit]
  );

  const saveCategory = useCallback(
    async (category: Category, isNew = false) => {
      const id = sanitizeId(category.id);
      const slug = category.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .slice(0, 128);
      const payload = {
        id,
        slug: slug || id,
        name: category.name.trim().slice(0, 80),
        description: (category.description || '').trim().slice(0, 400),
        imageUrl: (category.imageUrl || '').trim().slice(0, 600),
        active: Boolean(category.active),
        sortOrder: Number(category.sortOrder) || 0,
      };
      try {
        const ref = doc(db, 'categories', id);
        const existingSnap = await getDoc(ref);
        if (isNew || !existingSnap.exists()) {
          await setDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await logAudit('CREATE_CATEGORY', 'categories', id, payload.name);
        } else {
          await setDoc(ref, {
            ...payload,
            createdAt: existingSnap.data().createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await logAudit('UPDATE_CATEGORY', 'categories', id, payload.name);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
      }
    },
    [logAudit]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
        await logAudit('DELETE_CATEGORY', 'categories', categoryId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
      }
    },
    [logAudit]
  );

  const saveSiteSettings = useCallback(
    async (settings: SiteSettings) => {
      const sanitized = sanitizeSiteSettingsForFirestore(settings);
      try {
        await setDoc(doc(db, 'siteSettings', 'main'), {
          ...sanitized,
          updatedAt: serverTimestamp(),
        });
        await logAudit('UPDATE_SETTINGS', 'siteSettings', 'main', 'Updated storefront CMS settings');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'siteSettings/main');
      }
    },
    [logAudit]
  );

  const fetchAllOrders = useCallback(async (): Promise<Order[]> => {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      return snap.docs.map((d) => d.data() as Order);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    }
  }, []);

  const deleteOrder = useCallback(async (order: Order): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) {
      throw new Error('A verified super-admin login is required to delete an order.');
    }
    const owner = currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;
    if (!owner) {
      const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
      if (!adminSnap.exists() || adminSnap.data().role !== 'super_admin') {
        throw new Error('Only a super administrator can permanently delete orders.');
      }
    }
    const orderRef = doc(db, 'orders', sanitizeId(order.id));
    const currentSnap = await getDoc(orderRef);
    if (!currentSnap.exists()) throw new Error('Order is already removed. Refresh the dashboard.');
    const stored = currentSnap.data() as Order;
    if (
      stored.orderNumber !== order.orderNumber ||
      stored.trackingKey !== order.trackingKey ||
      stored.customerEmail !== order.customerEmail
    ) {
      throw new Error('Order changed since it was loaded. Refresh before deleting.');
    }

    // Delete the order AND both customer tracking aliases in one atomic batch.
    // Do not leave trackable copies of personal order summaries behind.
    const compatibleKey = await computeTrackingKey(stored.orderNumber, stored.customerEmail);
    const batch = writeBatch(db);
    batch.delete(orderRef);
    batch.delete(doc(db, 'orderTracking', stored.trackingKey));
    if (compatibleKey !== stored.trackingKey) {
      batch.delete(doc(db, 'orderTracking', compatibleKey));
    }
    try {
      await batch.commit();
      await logAudit('DELETE_ORDER', 'orders', order.id,
        `Permanently deleted order ${stored.orderNumber} and related tracking records`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${order.id}`);
    }
  }, [logAudit]);

  const updateOrderFulfillment = useCallback(
    async (
      order: Order,
      updates: {
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        courierName?: string;
        courierTrackingNo?: string;
      }
    ) => {
      try {
        const batch = writeBatch(db);
        const nextStatus = updates.status ?? order.status;
        const nextPayment = updates.paymentStatus ?? order.paymentStatus;
        const nextCourier = updates.courierName ?? order.courierName ?? '';
        const nextTrackingNo = updates.courierTrackingNo ?? order.courierTrackingNo ?? '';

        batch.update(doc(db, 'orders', order.id), {
          status: nextStatus,
          paymentStatus: nextPayment,
          courierName: nextCourier.slice(0, 80),
          courierTrackingNo: nextTrackingNo.slice(0, 80),
          updatedAt: serverTimestamp(),
        });

        const trackingRef = doc(db, 'orderTracking', order.trackingKey);
        const trackingSnap = await getDoc(trackingRef);
        const trackingChanges = {
          status: nextStatus,
          paymentStatus: nextPayment,
          courierName: nextCourier.slice(0, 80),
          courierTrackingNo: nextTrackingNo.slice(0, 80),
          updatedAt: serverTimestamp(),
        };
        if (trackingSnap.exists()) {
          batch.update(trackingRef, trackingChanges);
        }

        // Keep the private order, customer-facing tracking ID and compatibility
        // summary (read by the Resend notification Worker) in sync.
        const compatibilityKey = await computeTrackingKey(order.orderNumber, order.customerEmail);
        if (compatibilityKey !== order.trackingKey) {
          const compatibilityRef = doc(db, 'orderTracking', compatibilityKey);
          const compatibilitySnap = await getDoc(compatibilityRef);
          if (compatibilitySnap.exists()) {
            batch.update(compatibilityRef, trackingChanges);
          }
        }

        await batch.commit();
        await logAudit('UPDATE_ORDER', 'orders', order.id, `${order.orderNumber} -> ${nextStatus}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      }
    },
    [logAudit]
  );

  const fetchAllCoupons = useCallback(async (): Promise<Coupon[]> => {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      return snap.docs.map((d) => d.data() as Coupon);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'coupons');
    }
  }, []);

  const saveCoupon = useCallback(
    async (coupon: Coupon) => {
      const code = coupon.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      try {
        const ref = doc(db, 'coupons', code);
        const existingSnap = await getDoc(ref);
        await setDoc(ref, {
          code,
          discountType: coupon.discountType,
          value: Math.max(0, Number(coupon.value) || 0),
          minOrderPkr: Math.max(0, Number(coupon.minOrderPkr) || 0),
          active: Boolean(coupon.active),
          expiresAt: (coupon.expiresAt || '').slice(0, 40),
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        });
        await logAudit('SAVE_COUPON', 'coupons', code);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `coupons/${code}`);
      }
    },
    [logAudit]
  );

  const deleteCoupon = useCallback(
    async (code: string) => {
      try {
        await deleteDoc(doc(db, 'coupons', code));
        await logAudit('DELETE_COUPON', 'coupons', code);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `coupons/${code}`);
      }
    },
    [logAudit]
  );

  const saveService = useCallback(
    async (service: Service, isNew = false) => {
      const id = sanitizeId(service.id);
      try {
        const ref = doc(db, 'services', id);
        const existingSnap = await getDoc(ref);
        await setDoc(ref, {
          id,
          title: service.title.trim().slice(0, 120),
          description: (service.description || '').trim().slice(0, 1000),
          providerName: (service.providerName || '').trim().slice(0, 120),
          providerQualifications: (service.providerQualifications || '').trim().slice(0, 200),
          durationMinutes: Math.max(5, Number(service.durationMinutes) || 30),
          feePkr: Math.max(0, Number(service.feePkr) || 0),
          visible: Boolean(service.visible),
          bookingEnabled: Boolean(service.bookingEnabled),
          sortOrder: Number(service.sortOrder) || 0,
          createdAt: isNew || !existingSnap.exists() ? serverTimestamp() : existingSnap.data().createdAt,
          updatedAt: serverTimestamp(),
        });
        await logAudit('SAVE_SERVICE', 'services', id, service.title);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `services/${id}`);
      }
    },
    [logAudit]
  );

  const deleteService = useCallback(
    async (serviceId: string) => {
      try {
        await deleteDoc(doc(db, 'services', serviceId));
        await logAudit('DELETE_SERVICE', 'services', serviceId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
      }
    },
    [logAudit]
  );

  const fetchAllAppointments = useCallback(async (): Promise<Appointment[]> => {
    try {
      const snap = await getDocs(collection(db, 'appointments'));
      return snap.docs.map((d) => d.data() as Appointment);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    }
  }, []);

  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, status: Appointment['status']) => {
      try {
        await updateDoc(doc(db, 'appointments', appointmentId), {
          status,
          updatedAt: serverTimestamp(),
        });
        await logAudit('UPDATE_APPOINTMENT', 'appointments', appointmentId, status);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
      }
    },
    [logAudit]
  );

  const saveReview = useCallback(
    async (review: Review, isNew = false) => {
      const id = sanitizeId(review.id);
      try {
        const ref = doc(db, 'reviews', id);
        const existingSnap = await getDoc(ref);
        await setDoc(ref, {
          id,
          productId: sanitizeId(review.productId),
          userId: review.userId || user?.uid || 'admin',
          authorName: review.authorName.trim().slice(0, 80),
          rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
          comment: review.comment.trim().slice(0, 1000),
          approved: Boolean(review.approved),
          createdAt: isNew || !existingSnap.exists() ? serverTimestamp() : existingSnap.data().createdAt,
        });
        await logAudit('SAVE_REVIEW', 'reviews', id);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `reviews/${id}`);
      }
    },
    [user, logAudit]
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
        await logAudit('DELETE_REVIEW', 'reviews', reviewId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
      }
    },
    [logAudit]
  );

  const saveJournalPost = useCallback(
    async (post: JournalPost) => {
      const id = sanitizeId(post.id);
      const slug = post.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 128);
      try {
        await setDoc(doc(db, 'journalPosts', id), {
          id,
          slug: slug || id,
          title: post.title.trim().slice(0, 200),
          category: post.category.trim().slice(0, 80),
          summary: (post.summary || '').trim().slice(0, 500),
          content: (post.content || '').trim().slice(0, 12000),
          authorName: (post.authorName || '').trim().slice(0, 120),
          published: Boolean(post.published),
          publishedAt: post.publishedAt || new Date().toISOString().slice(0, 10),
          updatedAt: serverTimestamp(),
        });
        await logAudit('SAVE_JOURNAL', 'journalPosts', id, post.title);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `journalPosts/${id}`);
      }
    },
    [logAudit]
  );

  const deleteJournalPost = useCallback(
    async (postId: string) => {
      try {
        await deleteDoc(doc(db, 'journalPosts', postId));
        await logAudit('DELETE_JOURNAL', 'journalPosts', postId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `journalPosts/${postId}`);
      }
    },
    [logAudit]
  );

  const fetchAllInquiries = useCallback(async (): Promise<ContactInquiry[]> => {
    try {
      const snap = await getDocs(collection(db, 'contactInquiries'));
      return snap.docs.map((d) => d.data() as ContactInquiry);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'contactInquiries');
    }
  }, []);

  const updateInquiryStatus = useCallback(
    async (id: string, status: ContactInquiry['status']) => {
      try {
        await updateDoc(doc(db, 'contactInquiries', id), { status });
        await logAudit('UPDATE_INQUIRY', 'contactInquiries', id, status);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `contactInquiries/${id}`);
      }
    },
    [logAudit]
  );

  const deleteContactInquiry = useCallback(
    async (inquiryId: string) => {
      try {
        await deleteDoc(doc(db, 'contactInquiries', inquiryId));
        await logAudit('DELETE_INQUIRY', 'contactInquiries', inquiryId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `contactInquiries/${inquiryId}`);
      }
    },
    [logAudit]
  );

  const fetchNewsletterSubscribers = useCallback(async (): Promise<NewsletterSubscriber[]> => {
    try {
      const snap = await getDocs(collection(db, 'newsletterSubscribers'));
      return snap.docs.map((d) => d.data() as NewsletterSubscriber);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'newsletterSubscribers');
    }
  }, []);

  const deleteNewsletterSubscriber = useCallback(
    async (subscriberId: string) => {
      try {
        await deleteDoc(doc(db, 'newsletterSubscribers', subscriberId));
        await logAudit('DELETE_SUBSCRIBER', 'newsletterSubscribers', subscriberId);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `newsletterSubscribers/${subscriberId}`);
      }
    },
    [logAudit]
  );

  const fetchAllUsers = useCallback(async (): Promise<UserPublicProfile[]> => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => d.data() as UserPublicProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  }, []);

  const fetchAdminMembers = useCallback(async (): Promise<AdminMember[]> => {
    try {
      const snap = await getDocs(collection(db, 'admins'));
      return snap.docs.map((d) => d.data() as AdminMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'admins');
    }
  }, []);

  const saveAdminMember = useCallback(
    async (member: { uid: string; email: string; role: 'super_admin' | 'editor' }) => {
      const clean = sanitizeAdminMemberInput(member);
      try {
        const ref = doc(db, 'admins', clean.uid);
        const existingSnap = await getDoc(ref);
        await setDoc(ref, {
          uid: clean.uid,
          email: clean.email,
          role: clean.role,
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        });
        await logAudit('SAVE_ADMIN', 'admins', clean.uid, `${clean.email} (${clean.role})`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `admins/${clean.uid}`);
      }
    },
    [logAudit]
  );

  const deleteAdminMember = useCallback(
    async (uid: string) => {
      if (user?.uid === uid) {
        throw new Error('You cannot remove your own active administrator account.');
      }
      try {
        await deleteDoc(doc(db, 'admins', uid));
        await logAudit('DELETE_ADMIN', 'admins', uid);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
      }
    },
    [user?.uid, logAudit]
  );

  const fetchAuditLogs = useCallback(async (): Promise<AuditLog[]> => {
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      return snap.docs.map((d) => d.data() as AuditLog);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'auditLogs');
    }
  }, []);

  const value: StoreContextValue = {
    user,
    authReady,
    isAdmin,
    isSuperAdmin,
    adminChecked,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    resendVerificationEmail,
    logout,
    products,
    liveProducts,
    categories,
    visibleCategories,
    siteSettings,
    services,
    reviews,
    journalPosts,
    firestoreSeeded,
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    quickViewProduct,
    setQuickViewProduct,
    appliedCoupon,
    applyCouponCode,
    clearCoupon,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    wishlistIds,
    toggleWishlist,
    userProfile,
    saveUserProfile,
    saveAddress,
    removeAddress,
    placeOrder,
    trackOrder,
    fetchMyOrders,
    fetchMyAppointments,
    cancelMyOrder,
    submitContactInquiry,
    subscribeNewsletter,
    requestAppointment,
    seedLaunchCatalog,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveSiteSettings,
    fetchAllOrders,
    deleteOrder,
    updateOrderFulfillment,
    fetchAllCoupons,
    saveCoupon,
    deleteCoupon,
    saveService,
    deleteService,
    fetchAllAppointments,
    updateAppointmentStatus,
    saveReview,
    deleteReview,
    saveJournalPost,
    deleteJournalPost,
    fetchAllInquiries,
    updateInquiryStatus,
    deleteContactInquiry,
    fetchNewsletterSubscribers,
    deleteNewsletterSubscriber,
    fetchAllUsers,
    fetchAdminMembers,
    saveAdminMember,
    deleteAdminMember,
    fetchAuditLogs,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}
