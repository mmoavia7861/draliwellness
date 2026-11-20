import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Database,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { AdminProductEditor } from '../components/admin/AdminProductEditor';
import { AdminCmsPanel } from '../components/admin/AdminCmsPanel';
import { AdminAudiencePanel } from '../components/admin/AdminAudiencePanel';
import type {
  AdminMember,
  Appointment,
  AuditLog,
  Category,
  ContactInquiry,
  Coupon,
  JournalPost,
  NewsletterSubscriber,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  Service,
  SiteSettings,
  UserPublicProfile,
} from '../types';
import { formatPkr, isProductLive } from '../utils/commerce';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'cms'
  | 'coupons'
  | 'services'
  | 'community'
  | 'audience';

export const AdminPage: React.FC = () => {
  const {
    user,
    authReady,
    isAdmin,
    adminChecked,
    signInWithGoogle,
    products,
    categories,
    siteSettings,
    services,
    reviews,
    journalPosts,
    firestoreSeeded,
    seedLaunchCatalog,
    saveProduct,
    deleteProduct,
    saveCategory,
    deleteCategory,
    saveSiteSettings,
    fetchAllOrders,
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
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [courierDrafts, setCourierDrafts] = useState<
    Record<string, { courierName: string; courierTrackingNo: string }>
  >({});

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [usersList, setUsersList] = useState<UserPublicProfile[]>([]);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statusBanner, setStatusBanner] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

  // Category create/edit state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSortOrder, setCatSortOrder] = useState('1');

  // Coupon creation state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState('10');
  const [newCouponMin, setNewCouponMin] = useState('0');
  const [newCouponExpires, setNewCouponExpires] = useState('');

  // CMS Settings draft
  const [cmsDraft, setCmsDraft] = useState<SiteSettings>(siteSettings);

  // Service create/edit state
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [svcTitle, setSvcTitle] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcProvider, setSvcProvider] = useState('');
  const [svcQualifications, setSvcQualifications] = useState('');
  const [svcDuration, setSvcDuration] = useState('30');
  const [svcFee, setSvcFee] = useState('0');
  const [svcVisible, setSvcVisible] = useState(true);
  const [svcBookingEnabled, setSvcBookingEnabled] = useState(false);

  // Review creation state
  const [newReviewProductId, setNewReviewProductId] = useState(products[0]?.id || '');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState('5');

  // Journal create/edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Nutrition Fundamentals');
  const [postSummary, setPostSummary] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postPublished, setPostPublished] = useState(true);

  useEffect(() => {
    setCmsDraft(siteSettings);
  }, [siteSettings]);

  const loadAdminCollections = async () => {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    setLoadError('');
    try {
      // One unavailable collection must not hide the other dashboard sections.
      const [ord, cpn, apt, inq, subs, usrs, adm, logs] = await Promise.allSettled([
        fetchAllOrders(),
        fetchAllCoupons(),
        fetchAllAppointments(),
        fetchAllInquiries(),
        fetchNewsletterSubscribers(),
        fetchAllUsers(),
        fetchAdminMembers(),
        fetchAuditLogs(),
      ]);
      const failed: string[] = [];
      if (ord.status === 'fulfilled') {
        setOrders(ord.value);
        setCourierDrafts(Object.fromEntries(ord.value.map((o) => [
          o.id, { courierName: o.courierName || '', courierTrackingNo: o.courierTrackingNo || '' },
        ])));
      } else { failed.push('Orders'); }
      if (cpn.status === 'fulfilled') setCoupons(cpn.value); else failed.push('Coupons');
      if (apt.status === 'fulfilled') setAppointments(apt.value); else failed.push('Appointments');
      if (inq.status === 'fulfilled') setInquiries(inq.value); else failed.push('Inquiries');
      if (subs.status === 'fulfilled') setSubscribers(subs.value); else failed.push('Subscribers');
      if (usrs.status === 'fulfilled') setUsersList(usrs.value); else failed.push('Customers');
      if (adm.status === 'fulfilled') setAdminMembers(adm.value); else failed.push('Administrators');
      if (logs.status === 'fulfilled') setAuditLogs(logs.value); else failed.push('Audit Logs');
      if (failed.length) {
        setLoadError(`Unable to load: ${failed.join(', ')}. Verify Firebase permissions, database and indexes. Other sections may still be available.`);
        console.error('Admin collection read failures', { ord, cpn, apt, inq, subs, usrs, adm, logs });
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load admin dashboard.');
    } finally {
      setLoadingAdmin(false);
    }
  };

  const saveQuickPrice = async (product: Product, rawPrice: string) => {
    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
      setLoadError('Enter a valid selling price between Rs. 1 and Rs. 1,000,000.');
      return;
    }
    setSavingPriceId(product.id);
    setLoadError('');
    try {
      const variants = product.variants?.length === 1
        ? product.variants.map((variant) => ({ ...variant, pricePkr: price }))
        : product.variants;
      await saveProduct({ ...product, pricePkr: price, variants });
      notify(`${product.name} price saved: ${formatPkr(price)} (including single-pack variant).`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Product price could not be saved.');
    } finally {
      setSavingPriceId(null);
    }
  };

  const handleAdminLogin = async () => {
    setLoginError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      const code = (err as { code?: string } | null)?.code || '';
      setLoginError(
        code.includes('unauthorized-domain')
          ? 'This website domain is not authorized in Firebase Authentication. Add mmoavia7861.github.io under Firebase Console → Authentication → Settings → Authorized domains.'
          : code.includes('popup-blocked')
            ? 'The browser blocked the Google sign-in popup. Allow popups for this site and try again.'
            : code.includes('popup-closed-by-user')
              ? 'Google sign-in was cancelled. Select your authorized account and try again.'
              : `Google sign-in failed: ${message}`
      );
    }
  };

  useEffect(() => {
    if (isAdmin && adminChecked) {
      void loadAdminCollections();
    }
  }, [isAdmin, adminChecked]);

  const notify = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(''), 4000);
  };

  if (!authReady || !adminChecked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-[#252B29]/70">
        Verifying administrator permissions...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <>
        <PageMeta
          title="Admin Control Panel — Dr. Ali Hassan Health & Wellness"
          description="Protected administrator portal."
        />
        <div className="max-w-lg mx-auto px-4 py-20">
          <div className="bg-white border border-[#174D40]/15 rounded-2xl p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#E8F1EB] text-[#174D40] flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E6F3A]">
                Dr. Ali Hassan Health &amp; Wellness
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[#174D40]">
                Admin Control Panel
              </h1>
              <p className="text-sm text-[#252B29]/75">
                {user
                  ? `Signed in as ${user.email}, which does not have administrator privileges.`
                  : 'Sign in with an authorized administrator Google account to manage products, banners, orders, appointments, and storefront settings.'}
              </p>
            </div>
            {loginError && (
              <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                {loginError}
              </p>
            )}
            <div className="space-y-2.5 pt-1">
              {!user && (
                <button
                  type="button"
                  onClick={() => void handleAdminLogin()}
                  className="w-full h-11 rounded-lg bg-[#174D40] text-white text-sm font-semibold hover:bg-[#113A30] cursor-pointer"
                >
                  Sign In with Google
                </button>
              )}
              <Link
                to="/"
                className="w-full h-10 rounded-lg border border-[#174D40]/20 text-sm font-medium text-[#174D40] inline-flex items-center justify-center hover:bg-[#E8F1EB]"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const validOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalOrderValue = validOrders.reduce((sum, o) => sum + (o.totalPkr || 0), 0);
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'placed' || o.status === 'confirmed' || o.status === 'processing'
  ).length;
  const lowStockProducts = products.filter((p) => p.stock <= 10);
  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
    setCatSortOrder(String(categories.length + 1));
  };

  const resetServiceForm = () => {
    setEditingSvcId(null);
    setSvcTitle('');
    setSvcDesc('');
    setSvcProvider('');
    setSvcQualifications('');
    setSvcDuration('30');
    setSvcFee('0');
    setSvcVisible(true);
    setSvcBookingEnabled(false);
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostTitle('');
    setPostCategory('Nutrition Fundamentals');
    setPostSummary('');
    setPostContent('');
    setPostPublished(true);
  };

  return (
    <>
      <PageMeta
        title="Admin Control Panel — Dr. Ali Hassan Health & Wellness"
        description="Storefront administration, inventory, compliance, orders, banners, and CMS."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Admin Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#174D40]/15 pb-6">
          <div>
            <p className="text-xs text-[#252B29]/60">Signed in as {user.email}</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
              Admin Control Center
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                await seedLaunchCatalog();
                notify('Launch catalog synced to Firestore.');
              }}
              className="h-10 px-4 rounded-lg border border-[#174D40]/25 bg-white text-xs font-semibold text-[#174D40] inline-flex items-center gap-1.5 hover:bg-[#E8F1EB] cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>{firestoreSeeded ? 'Re-sync Launch Defaults' : 'Initialize Firestore Seed'}</span>
            </button>
            <button
              type="button"
              onClick={() => void loadAdminCollections()}
              disabled={loadingAdmin}
              className="h-10 px-4 rounded-lg bg-[#174D40] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#113A30] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{loadingAdmin ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {statusBanner && (
          <div className="p-3.5 rounded-xl bg-[#E8F1EB] border border-[#174D40]/20 text-sm text-[#174D40] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}

        {loadError && (
          <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
            {loadError}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'products', label: `Products (${products.length})` },
              { id: 'categories', label: `Categories (${categories.length})` },
              { id: 'orders', label: `Orders (${orders.length})` },
              { id: 'cms', label: 'CMS, Banners & Policies' },
              { id: 'coupons', label: `Coupons (${coupons.length})` },
              { id: 'services', label: 'Services & Bookings' },
              { id: 'community', label: 'Reviews, Journal & Inbox' },
              { id: 'audience', label: 'Audience & Team' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`h-10 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                tab === item.id
                  ? 'bg-[#174D40] text-white'
                  : 'bg-white border border-[#174D40]/15 text-[#252B29] hover:border-[#174D40]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Order Value (not paid revenue)', value: formatPkr(totalOrderValue) },
                { label: 'Total Orders', value: String(orders.length) },
                { label: 'Pending Fulfillment', value: String(pendingOrdersCount) },
                { label: 'Live Published Products', value: String(products.filter(isProductLive).length) },
                { label: 'Low Stock Items (≤ 10)', value: String(lowStockProducts.length) },
                { label: 'Active Coupons', value: String(coupons.filter((c) => c.active).length) },
                { label: 'New Contact Inquiries', value: String(newInquiriesCount) },
                { label: 'Newsletter Subscribers', value: String(subscribers.length) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-5 space-y-1"
                >
                  <p className="text-xs text-[#252B29]/65">{stat.label}</p>
                  <p className="text-2xl font-semibold text-[#174D40] tabular-nums">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-3">
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                Recent Audit Trail
              </h2>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-[#252B29]/65">No administrative mutations logged yet.</p>
              ) : (
                <ul className="divide-y divide-[#174D40]/10 text-xs">
                  {auditLogs.slice(0, 12).map((log) => (
                    <li key={log.id} className="py-2 flex justify-between gap-4">
                      <span>
                        <strong>{log.action}</strong> · {log.targetCollection}/{log.targetId}
                        {log.summary ? ` — ${log.summary}` : ''}
                      </span>
                      <span className="text-[#252B29]/60">{log.actorEmail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#252B29]/75">
                Only products with <strong>Published = Yes</strong> and{' '}
                <strong>Compliance = Approved</strong> appear on the live storefront.
              </p>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="h-10 px-4 rounded-lg bg-[#174D40] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            <div className="bg-white border border-[#174D40]/12 rounded-xl overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#174D40]/12 text-xs text-[#252B29]/65 bg-[#FAF8F2]">
                    <th className="py-3 px-4 font-semibold">Product</th>
                    <th className="py-3 px-4 font-semibold">Price</th>
                    <th className="py-3 px-4 font-semibold">Stock</th>
                    <th className="py-3 px-4 font-semibold">Compliance</th>
                    <th className="py-3 px-4 font-semibold">Quick Toggles</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#174D40]/10">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#252B29]">{p.name}</p>
                        <p className="text-xs text-[#252B29]/60">
                          {p.brand} · {p.packSize || p.format}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-medium tabular-nums">
                        <form
                          className="flex items-center gap-2 min-w-[170px]"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const input = e.currentTarget.elements.namedItem('newPrice') as HTMLInputElement | null;
                            if (input) await saveQuickPrice(p, input.value);
                          }}
                        >
                          <label className="sr-only" htmlFor={`price-${p.id}`}>Selling price for {p.name}</label>
                          <input
                            key={`${p.id}-${p.pricePkr}`}
                            id={`price-${p.id}`}
                            name="newPrice"
                            type="number"
                            min="1"
                            max="1000000"
                            step="1"
                            required
                            defaultValue={p.pricePkr}
                            className="w-24 h-9 px-2 border border-[#174D40]/20 rounded-md bg-white text-xs tabular-nums"
                          />
                          <button
                            type="submit"
                            disabled={savingPriceId === p.id}
                            className="h-9 px-2.5 rounded-md text-xs font-semibold bg-[#174D40] text-white disabled:opacity-60"
                          >
                            {savingPriceId === p.id ? 'Saving' : 'Save'}
                          </button>
                        </form>
                      </td>
                      <td className="py-3 px-4 tabular-nums">{p.stock}</td>
                      <td className="py-3 px-4 capitalize text-xs">
                        {p.complianceStatus.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-xs space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveProduct({ ...p, published: !p.published });
                            notify(`${p.name} ${!p.published ? 'published' : 'hidden'}.`);
                          }}
                          className={`px-2.5 py-1 rounded-md border font-medium inline-flex items-center gap-1 cursor-pointer ${
                            isProductLive(p)
                              ? 'border-[#174D40]/30 bg-[#E8F1EB] text-[#174D40]'
                              : 'border-[#252B29]/20 bg-[#FAF8F2] text-[#252B29]/70'
                          }`}
                        >
                          {p.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{p.published ? 'Published' : 'Hidden'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await saveProduct({ ...p, featured: !p.featured });
                            notify(`${p.name} featured status updated.`);
                          }}
                          className={`px-2.5 py-1 rounded-md border font-medium inline-flex items-center gap-1 cursor-pointer ${
                            p.featured
                              ? 'border-[#8E6F3A]/40 bg-[#FAF6EE] text-[#8E6F3A]'
                              : 'border-[#252B29]/15 bg-white text-[#252B29]/60'
                          }`}
                        >
                          <Star className="w-3 h-3" />
                          <span>{p.featured ? 'Featured' : 'Standard'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(p)}
                          className="px-3 py-1.5 rounded-lg border border-[#174D40]/20 text-xs font-medium text-[#174D40] inline-flex items-center gap-1 hover:bg-[#E8F1EB] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteProduct(p.id);
                            notify(`Deleted ${p.name}`);
                          }}
                          aria-label={`Delete ${p.name}`}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {tab === 'categories' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white border border-[#174D40]/12 rounded-xl overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[#174D40]/12 bg-[#FAF8F2] text-xs text-[#252B29]/65">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Sort</th>
                    <th className="py-3 px-4">Live Products</th>
                    <th className="py-3 px-4">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#174D40]/10">
                  {categories.map((cat) => {
                    const count = products.filter(
                      (p) => isProductLive(p) && (p.categoryIds ?? []).includes(cat.id)
                    ).length;
                    return (
                      <tr key={cat.id}>
                        <td className="py-3 px-4">
                          <p className="font-semibold">{cat.name}</p>
                          <p className="text-xs text-[#252B29]/60">{cat.slug}</p>
                        </td>
                        <td className="py-3 px-4 tabular-nums text-xs">{cat.sortOrder}</td>
                        <td className="py-3 px-4 tabular-nums">{count}</td>
                        <td className="py-3 px-4 text-xs">
                          <button
                            type="button"
                            onClick={async () => {
                              await saveCategory({ ...cat, active: !cat.active });
                              notify('Category visibility updated.');
                            }}
                            className="underline text-[#174D40] cursor-pointer"
                          >
                            {cat.active ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            aria-label={`Edit category ${cat.name}`}
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setCatName(cat.name);
                              setCatDesc(cat.description || '');
                              setCatSortOrder(String(cat.sortOrder ?? 1));
                            }}
                            className="p-1.5 text-[#174D40] hover:bg-[#E8F1EB] rounded cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteCategory(cat.id);
                              notify(`Deleted category ${cat.name}`);
                            }}
                            aria-label={`Delete category ${cat.name}`}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!catName.trim()) return;
                const existing = editingCatId
                  ? categories.find((c) => c.id === editingCatId)
                  : undefined;
                const slug =
                  existing?.slug ||
                  catName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                await saveCategory(
                  {
                    id: existing?.id || slug,
                    slug,
                    name: catName.trim(),
                    description: catDesc.trim(),
                    active: existing ? existing.active : true,
                    sortOrder: Number(catSortOrder) || categories.length + 1,
                  },
                  !existing
                );
                resetCategoryForm();
                notify(existing ? 'Category updated.' : 'Category created.');
              }}
              className="lg:col-span-5 bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                  {editingCatId ? 'Edit Category' : 'Add New Category'}
                </h2>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="text-xs underline text-[#252B29]/70 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <p className="text-xs text-[#252B29]/65">
                Categories automatically appear on the storefront once they contain at least one published product.
              </p>
              <input
                type="text"
                required
                placeholder="Category Name (e.g. Bone & Joint Support)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
              />
              <textarea
                rows={2}
                placeholder="Description (optional)"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold">Sort Order</label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-xs font-semibold cursor-pointer"
              >
                {editingCatId ? 'Update Category' : 'Create Category'}
              </button>
            </form>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <input
                type="search"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order number, customer, city..."
                className="h-10 px-3.5 rounded-lg border border-[#174D40]/20 bg-white text-sm w-72"
              />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-[#174D40]/12 rounded-xl p-10 text-center text-sm text-[#252B29]/70">
                No matching orders found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord) => {
                  const courier = courierDrafts[ord.id] ?? {
                    courierName: ord.courierName || '',
                    courierTrackingNo: ord.courierTrackingNo || '',
                  };
                  return (
                    <div
                      key={ord.id}
                      className="bg-white border border-[#174D40]/12 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex flex-wrap justify-between gap-4 border-b border-[#174D40]/10 pb-3">
                        <div>
                          <p className="font-semibold text-[#174D40] tabular-nums">
                            {ord.orderNumber}
                          </p>
                          <p className="text-xs text-[#252B29]/70">
                            {ord.customerName} · {ord.customerPhone} · {ord.customerEmail}
                          </p>
                          <p className="text-xs text-[#252B29]/65">
                            {ord.shippingAddress}, {ord.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#174D40] tabular-nums">
                            {formatPkr(ord.totalPkr)}
                          </p>
                          <p className="text-xs text-[#252B29]/65">
                            {ord.paymentMethod.toUpperCase()} · {ord.paymentStatus}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-start justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          {ord.items.map((it) => (
                            <p key={it.productId + (it.variantLabel || '')}>
                              • {it.name} × {it.quantity} ({formatPkr(it.lineTotalPkr)})
                            </p>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            aria-label={`Order status for ${ord.orderNumber}`}
                            value={ord.status}
                            onChange={async (e) => {
                              const nextStatus = e.target.value as OrderStatus;
                              await updateOrderFulfillment(ord, { status: nextStatus });
                              await loadAdminCollections();
                              notify(`${ord.orderNumber} marked as ${nextStatus}`);
                            }}
                            className="h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <select
                            aria-label={`Payment status for ${ord.orderNumber}`}
                            value={ord.paymentStatus}
                            onChange={async (e) => {
                              const nextPay = e.target.value as PaymentStatus;
                              await updateOrderFulfillment(ord, { paymentStatus: nextPay });
                              await loadAdminCollections();
                              notify(`${ord.orderNumber} payment marked as ${nextPay}`);
                            }}
                            className="h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                          >
                            <option value="pending">Payment Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>

                      {/* Courier Dispatch Tracking Editor */}
                      <div className="pt-2 border-t border-[#174D40]/10 flex flex-wrap items-center gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Courier Name (e.g. TCS, Leopards)"
                          value={courier.courierName}
                          onChange={(e) =>
                            setCourierDrafts({
                              ...courierDrafts,
                              [ord.id]: { ...courier, courierName: e.target.value },
                            })
                          }
                          className="h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] w-56"
                        />
                        <input
                          type="text"
                          placeholder="Courier Tracking No."
                          value={courier.courierTrackingNo}
                          onChange={(e) =>
                            setCourierDrafts({
                              ...courierDrafts,
                              [ord.id]: { ...courier, courierTrackingNo: e.target.value },
                            })
                          }
                          className="h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] w-56"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await updateOrderFulfillment(ord, {
                              courierName: courier.courierName.trim(),
                              courierTrackingNo: courier.courierTrackingNo.trim(),
                            });
                            await loadAdminCollections();
                            notify(`Saved tracking details for ${ord.orderNumber}`);
                          }}
                          className="h-9 px-3.5 rounded-lg border border-[#174D40]/25 bg-white font-semibold text-[#174D40] hover:bg-[#E8F1EB] cursor-pointer"
                        >
                          Save Courier Tracking
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CMS, BANNERS, FAQS & POLICIES */}
        {tab === 'cms' && (
          <AdminCmsPanel
            cmsDraft={cmsDraft}
            setCmsDraft={setCmsDraft}
            onSave={async (nextSettings) => {
              await saveSiteSettings(nextSettings);
              notify('Storefront CMS, banners, FAQs, and policies saved.');
            }}
          />
        )}

        {/* COUPONS */}
        {tab === 'coupons' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white border border-[#174D40]/12 rounded-xl overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-[#174D40]/12 bg-[#FAF8F2] text-xs">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#174D40]/10">
                  {coupons.map((cp) => (
                    <tr key={cp.code}>
                      <td className="py-3 px-4 font-semibold">{cp.code}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {cp.discountType === 'percent' ? `${cp.value}%` : formatPkr(cp.value)}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-xs">
                        {formatPkr(cp.minOrderPkr || 0)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveCoupon({ ...cp, active: !cp.active });
                            await loadAdminCollections();
                            notify(`Coupon ${cp.code} is now ${!cp.active ? 'Active' : 'Inactive'}.`);
                          }}
                          className="underline text-[#174D40] cursor-pointer"
                        >
                          {cp.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          aria-label={`Delete coupon ${cp.code}`}
                          onClick={async () => {
                            await deleteCoupon(cp.code);
                            await loadAdminCollections();
                            notify(`Deleted coupon ${cp.code}`);
                          }}
                          className="p-1.5 text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCouponCode.trim()) return;
                await saveCoupon({
                  code: newCouponCode.trim().toUpperCase(),
                  discountType: newCouponType,
                  value: Number(newCouponValue) || 0,
                  minOrderPkr: Number(newCouponMin) || 0,
                  expiresAt: newCouponExpires.trim(),
                  active: true,
                });
                setNewCouponCode('');
                setNewCouponExpires('');
                await loadAdminCollections();
                notify('Coupon saved.');
              }}
              className="lg:col-span-5 bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4 h-fit text-sm"
            >
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">Create Coupon</h2>
              <input
                type="text"
                required
                placeholder="Code (e.g. WELLNESS10)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] uppercase"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (PKR)</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={newCouponValue}
                  onChange={(e) => setNewCouponValue(e.target.value)}
                  placeholder="Value"
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(e.target.value)}
                  placeholder="Min Order (PKR)"
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="date"
                  aria-label="Coupon expiration date"
                  value={newCouponExpires}
                  onChange={(e) => setNewCouponExpires(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-xs font-semibold cursor-pointer"
              >
                Save Coupon
              </button>
            </form>
          </div>
        )}

        {/* SERVICES & APPOINTMENTS */}
        {tab === 'services' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-3">
                <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                  Wellness Services
                </h2>
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="bg-white border border-[#174D40]/12 rounded-xl p-5 flex flex-wrap items-start justify-between gap-4"
                  >
                    <div className="space-y-1 text-sm max-w-md">
                      <p className="font-semibold text-[#252B29]">{svc.title}</p>
                      <p className="text-xs text-[#252B29]/70">{svc.description}</p>
                      <p className="text-xs text-[#174D40]">
                        {svc.bookingEnabled ? 'Booking Active' : 'Coming Soon'} ·{' '}
                        {svc.visible ? 'Visible' : 'Hidden'} · {svc.durationMinutes || 30} min ·{' '}
                        {svc.feePkr ? formatPkr(svc.feePkr) : 'Complimentary'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                      <button
                        type="button"
                        onClick={async () => {
                          await saveService({ ...svc, visible: !svc.visible });
                          notify('Updated service visibility.');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#174D40]/20 text-[#174D40] cursor-pointer"
                      >
                        {svc.visible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveService({ ...svc, bookingEnabled: !svc.bookingEnabled });
                          notify('Updated service booking status.');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#174D40]/20 text-[#174D40] cursor-pointer"
                      >
                        {svc.bookingEnabled ? 'Disable Booking' : 'Enable Booking'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit service ${svc.title}`}
                        onClick={() => {
                          setEditingSvcId(svc.id);
                          setSvcTitle(svc.title);
                          setSvcDesc(svc.description || '');
                          setSvcProvider(svc.providerName || '');
                          setSvcQualifications(svc.providerQualifications || '');
                          setSvcDuration(String(svc.durationMinutes || 30));
                          setSvcFee(String(svc.feePkr || 0));
                          setSvcVisible(svc.visible);
                          setSvcBookingEnabled(svc.bookingEnabled);
                        }}
                        className="p-1.5 text-[#174D40] hover:bg-[#E8F1EB] rounded cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete service ${svc.title}`}
                        onClick={() => void deleteService(svc.id)}
                        className="p-1.5 text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!svcTitle.trim()) return;
                  const existing = editingSvcId
                    ? services.find((s) => s.id === editingSvcId)
                    : undefined;
                  const id =
                    existing?.id || svcTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  await saveService(
                    {
                      id,
                      title: svcTitle.trim(),
                      description: svcDesc.trim(),
                      providerName: svcProvider.trim(),
                      providerQualifications: svcQualifications.trim(),
                      durationMinutes: Math.max(5, Number(svcDuration) || 30),
                      feePkr: Math.max(0, Number(svcFee) || 0),
                      visible: svcVisible,
                      bookingEnabled: svcBookingEnabled,
                      sortOrder: existing?.sortOrder ?? services.length + 1,
                    },
                    !existing
                  );
                  resetServiceForm();
                  notify(existing ? 'Service updated.' : 'Service added.');
                }}
                className="lg:col-span-5 bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4 h-fit text-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                    {editingSvcId ? 'Edit Wellness Service' : 'Add Wellness Service'}
                  </h2>
                  {editingSvcId && (
                    <button
                      type="button"
                      onClick={resetServiceForm}
                      className="text-xs underline text-[#252B29]/70 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Service Title"
                  value={svcTitle}
                  onChange={(e) => setSvcTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="text"
                  placeholder="Provider Name"
                  value={svcProvider}
                  onChange={(e) => setSvcProvider(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="text"
                  placeholder="Provider Qualifications"
                  value={svcQualifications}
                  onChange={(e) => setSvcQualifications(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Duration (min)</label>
                    <input
                      type="number"
                      min={5}
                      value={svcDuration}
                      onChange={(e) => setSvcDuration(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Fee (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      value={svcFee}
                      onChange={(e) => setSvcFee(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] tabular-nums"
                    />
                  </div>
                </div>
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={svcVisible}
                      onChange={(e) => setSvcVisible(e.target.checked)}
                    />
                    <span>Visible on Services Page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={svcBookingEnabled}
                      onChange={(e) => setSvcBookingEnabled(e.target.checked)}
                    />
                    <span>Enable Online Booking</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-xs font-semibold cursor-pointer"
                >
                  {editingSvcId ? 'Update Service' : 'Save Service'}
                </button>
              </form>
            </div>

            {appointments.length > 0 && (
              <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-3">
                <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                  Appointment Requests ({appointments.length})
                </h2>
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-wrap justify-between items-center gap-3 py-2 border-b border-[#174D40]/10 text-xs"
                  >
                    <div>
                      <p className="font-semibold">{apt.serviceTitle}</p>
                      <p>
                        {apt.customerName} ({apt.customerPhone}) · {apt.preferredDate} ·{' '}
                        {apt.preferredSlot}
                      </p>
                      {apt.notes && <p className="text-[#252B29]/70">{apt.notes}</p>}
                    </div>
                    <select
                      aria-label={`Appointment status for ${apt.customerName}`}
                      value={apt.status}
                      onChange={async (e) => {
                        await updateAppointmentStatus(
                          apt.id,
                          e.target.value as Appointment['status']
                        );
                        await loadAdminCollections();
                        notify(`Appointment status updated.`);
                      }}
                      className="h-8 px-2 rounded border border-[#174D40]/20"
                    >
                      <option value="requested">Requested</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS, JOURNAL & INBOX */}
        {tab === 'community' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Real Customer Reviews */}
              <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4">
                <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                  Verified Reviews (Hidden on Site if Empty)
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newReviewAuthor.trim() || !newReviewComment.trim()) return;
                    await saveReview(
                      {
                        id: `rev-${Date.now()}`,
                        productId: newReviewProductId || products[0]?.id || 'brainaxis-energy-boost',
                        userId: user.uid,
                        authorName: newReviewAuthor.trim(),
                        rating: Number(newReviewRating) || 5,
                        comment: newReviewComment.trim(),
                        approved: true,
                      },
                      true
                    );
                    setNewReviewAuthor('');
                    setNewReviewComment('');
                    notify('Approved real review added.');
                  }}
                  className="space-y-3 text-sm border-b border-[#174D40]/10 pb-4"
                >
                  <select
                    value={newReviewProductId}
                    onChange={(e) => setNewReviewProductId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Verified Customer Name"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                    />
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(e.target.value)}
                      className="w-24 h-9 px-2 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                    >
                      <option value="5">5 ★</option>
                      <option value="4">4 ★</option>
                      <option value="3">3 ★</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Verified review comment..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#174D40] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add Approved Review
                  </button>
                </form>

                {reviews.length === 0 ? (
                  <p className="text-xs text-[#252B29]/65">
                    No customer reviews yet. Reviews section stays hidden on the storefront.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {reviews.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg bg-[#FAF8F2] flex justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {r.authorName} ({r.rating}★) ·{' '}
                            <span className={r.approved ? 'text-[#174D40]' : 'text-[#8E6F3A]'}>
                              {r.approved ? 'Approved' : 'Pending'}
                            </span>
                          </p>
                          <p>{r.comment}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              await saveReview({ ...r, approved: !r.approved });
                              notify(`Review ${!r.approved ? 'approved' : 'hidden'}.`);
                            }}
                            className="underline text-[#174D40] cursor-pointer"
                          >
                            {r.approved ? 'Hide' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete review by ${r.authorName}`}
                            onClick={() => void deleteReview(r.id)}
                            className="text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Health Journal Publisher */}
              <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                    Health Journal Articles
                  </h2>
                  {editingPostId && (
                    <button
                      type="button"
                      onClick={resetPostForm}
                      className="text-xs underline text-[#252B29]/70 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!postTitle.trim()) return;
                    const existing = editingPostId
                      ? journalPosts.find((p) => p.id === editingPostId)
                      : undefined;
                    const slug =
                      existing?.slug ||
                      postTitle
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');
                    await saveJournalPost({
                      id: existing?.id || slug,
                      slug,
                      title: postTitle.trim(),
                      category: postCategory.trim() || 'Wellness',
                      summary: postSummary.trim(),
                      content: postContent.trim(),
                      authorName: siteSettings.founderName || 'Dr. Ali Hassan',
                      published: postPublished,
                      publishedAt: existing?.publishedAt,
                    });
                    resetPostForm();
                    notify(existing ? 'Journal article updated.' : 'Journal article saved.');
                  }}
                  className="space-y-3 text-xs border-b border-[#174D40]/10 pb-4"
                >
                  <input
                    type="text"
                    placeholder="Article Title"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                  />
                  <input
                    type="text"
                    placeholder="Short Summary"
                    value={postSummary}
                    onChange={(e) => setPostSummary(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                  />
                  <textarea
                    rows={3}
                    placeholder="Article Body"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                  />
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postPublished}
                      onChange={(e) => setPostPublished(e.target.checked)}
                    />
                    <span>Published on Journal</span>
                  </label>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#174D40] text-white font-semibold cursor-pointer"
                  >
                    {editingPostId ? 'Update Article' : 'Save Article'}
                  </button>
                </form>

                {journalPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg bg-[#FAF8F2] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-[11px] text-[#252B29]/60">
                        {post.category} · {post.published ? 'Published' : 'Draft'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await saveJournalPost({ ...post, published: !post.published });
                          notify(`Article ${!post.published ? 'published' : 'moved to draft'}.`);
                        }}
                        className="underline text-[#174D40] cursor-pointer"
                      >
                        {post.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit article ${post.title}`}
                        onClick={() => {
                          setEditingPostId(post.id);
                          setPostTitle(post.title);
                          setPostCategory(post.category);
                          setPostSummary(post.summary || '');
                          setPostContent(post.content || '');
                          setPostPublished(post.published);
                        }}
                        className="p-1 text-[#174D40] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete article ${post.title}`}
                        onClick={() => void deleteJournalPost(post.id)}
                        className="text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Inbox */}
            <div className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                Contact Support Inquiries ({inquiries.length})
              </h2>
              {inquiries.length === 0 ? (
                <p className="text-xs text-[#252B29]/65">No customer inquiries yet.</p>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 rounded-xl bg-[#FAF8F2] border border-[#174D40]/10 flex flex-wrap justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <p className="font-semibold text-[#174D40]">
                          {inq.name} · {inq.email} {inq.phone ? `· ${inq.phone}` : ''}
                        </p>
                        {inq.subject && <p className="font-medium">{inq.subject}</p>}
                        <p className="text-[#252B29]/80">{inq.message}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <select
                          aria-label={`Inquiry status for ${inq.name}`}
                          value={inq.status}
                          onChange={async (e) => {
                            await updateInquiryStatus(
                              inq.id,
                              e.target.value as ContactInquiry['status']
                            );
                            await loadAdminCollections();
                            notify('Inquiry status updated.');
                          }}
                          className="h-8 px-2 rounded border border-[#174D40]/20 bg-white"
                        >
                          <option value="new">New</option>
                          <option value="replied">Replied</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          type="button"
                          aria-label={`Delete inquiry from ${inq.name}`}
                          onClick={async () => {
                            await deleteContactInquiry(inq.id);
                            await loadAdminCollections();
                            notify('Inquiry deleted.');
                          }}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDIENCE & TEAM */}
        {tab === 'audience' && (
          <AdminAudiencePanel
            currentUid={user.uid}
            subscribers={subscribers}
            usersList={usersList}
            adminMembers={adminMembers}
            onDeleteSubscriber={async (subId) => {
              await deleteNewsletterSubscriber(subId);
              await loadAdminCollections();
              notify('Subscriber removed.');
            }}
            onSaveAdminMember={async (member) => {
              await saveAdminMember(member);
              await loadAdminCollections();
              notify(`Admin role saved for ${member.email}.`);
            }}
            onDeleteAdminMember={async (uid) => {
              await deleteAdminMember(uid);
              await loadAdminCollections();
              notify('Admin access revoked.');
            }}
            onNotify={notify}
          />
        )}
      </div>

      {editingProduct !== undefined && (
        <AdminProductEditor
          initialProduct={editingProduct}
          categories={categories}
          onSave={async (prod, isNew) => {
            await saveProduct(prod, isNew);
            notify(`Saved ${prod.name}`);
          }}
          onClose={() => setEditingProduct(undefined)}
        />
      )}
    </>
  );
};
