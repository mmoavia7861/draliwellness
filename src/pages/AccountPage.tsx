import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, MapPin, Package, Plus, Trash2, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { getEmailAuthError } from '../utils/authErrors';
import { ProductCard } from '../components/ProductCard';
import type { Appointment, Order, SavedAddress } from '../types';
import { formatPkr, getOrderStatusLabel } from '../utils/commerce';

export const AccountPage: React.FC = () => {
  const {
    user,
    authReady,
    isAdmin,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    resendVerificationEmail,
    logout,
    userProfile,
    saveUserProfile,
    saveAddress,
    removeAddress,
    wishlistIds,
    liveProducts,
    fetchMyOrders,
    fetchMyAppointments,
    cancelMyOrder,
    siteSettings,
  } = useStore();

  const [tab, setTab] = useState<'orders' | 'profile' | 'addresses' | 'wishlist' | 'appointments'>(
    'orders'
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [phoneInput, setPhoneInput] = useState(userProfile?.phone ?? '');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');

  const [newAddr, setNewAddr] = useState<Omit<SavedAddress, 'id'>>({
    label: 'Home',
    recipientName: user?.displayName ?? '',
    phone: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
  });

  useEffect(() => {
    setPhoneInput(userProfile?.phone ?? '');
  }, [userProfile]);

  const loadAccountData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [ordList, aptList] = await Promise.all([fetchMyOrders(), fetchMyAppointments()]);
      setOrders(ordList);
      setAppointments(aptList);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.emailVerified) {
      void loadAccountData();
    }
  }, [user]);

  const submitAccountAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthInfo('');
    if (authMode === 'register' && authPassword.length < 8) {
      setAuthError('Use a password of at least 8 characters.');
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === 'register') {
        await registerWithEmail(authEmail, authPassword);
        setAuthInfo('Account created. Check your inbox for the verification link.');
      } else {
        await signInWithEmail(authEmail, authPassword);
      }
      setAuthPassword('');
    } catch (err) {
      setAuthError(getEmailAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const requestAccountReset = async () => {
    setAuthError('');
    setAuthInfo('');
    if (!authEmail.trim()) {
      setAuthError('Enter your account email first.');
      return;
    }
    setAuthBusy(true);
    try {
      await resetPassword(authEmail);
      setAuthInfo('If this account exists, a password reset email has been sent.');
    } catch (err) {
      setAuthError(getEmailAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const requestAccountVerification = async () => {
    setAuthError('');
    setAuthInfo('');
    setAuthBusy(true);
    try {
      await resendVerificationEmail();
      setAuthInfo('Verification email requested. Follow the link and sign out / sign in again.');
    } catch (err) {
      setAuthError(getEmailAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const wishlistProducts = liveProducts.filter((p) => wishlistIds.includes(p.id));

  if (!authReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-[#252B29]/70">
        Loading account...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <PageMeta
          title={`My Account — ${siteSettings.businessName}`}
          description="Sign in to view your BrainAxis orders, saved addresses, and wishlist."
        />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white border border-[#174D40]/15 rounded-2xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#E8F1EB] text-[#174D40] flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-semibold text-[#174D40]">
                Customer Account
              </h1>
              <p className="text-sm text-[#252B29]/75">
                Sign in with an email address and a dedicated website password to manage your orders, addresses and wishlist.
              </p>
            </div>
            {authError && (
              <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                {authError}
              </p>
            )}
            {authInfo && (
              <p role="status" className="text-sm text-[#174D40] bg-[#E8F1EB] rounded-lg p-3">
                {authInfo}
              </p>
            )}
            <form onSubmit={(e) => void submitAccountAuth(e)} className="w-full text-left space-y-3">
              <div className="space-y-1">
                <label htmlFor="customer-email" className="text-xs font-semibold text-[#174D40]">Email / Gmail</label>
                <input
                  id="customer-email" type="email" required autoComplete="email"
                  value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#174D40]/25 bg-white text-sm"
                  placeholder="you@gmail.com"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="customer-password" className="text-xs font-semibold text-[#174D40]">Password</label>
                <input
                  id="customer-password" type="password" required
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  minLength={authMode === 'register' ? 8 : undefined}
                  value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#174D40]/25 bg-white text-sm"
                  placeholder={authMode === 'register' ? 'At least 8 characters' : 'Website account password'}
                />
              </div>
              <button type="submit" disabled={authBusy}
                className="w-full h-11 rounded-lg bg-[#174D40] text-white text-sm font-semibold disabled:opacity-60">
                {authBusy ? 'Working...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            <div className="w-full flex items-center justify-between gap-2 text-xs text-[#174D40]">
              <button type="button" disabled={authBusy}
                onClick={() => { setAuthError(''); setAuthInfo(''); setAuthMode(authMode === 'login' ? 'register' : 'login'); }}
                className="underline">
                {authMode === 'login' ? 'Create a customer account' : 'Already have an account? Sign in'}
              </button>
              <button type="button" disabled={authBusy} onClick={() => void requestAccountReset()}
                className="underline">Forgot password?</button>
            </div>

            <p className="text-xs text-[#252B29]/60">
              Placed an order as a guest? You can track it anytime on{' '}
              <Link to="/track-order" className="text-[#174D40] underline">
                Order Tracking
              </Link>
              .
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!user.emailVerified) {
    return (
      <>
        <PageMeta title="Verify Email — Dr. Ali Hassan Health & Wellness" description="Verify your email to access account features." />
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white border border-[#174D40]/15 rounded-2xl p-8 text-center space-y-4">
            <h1 className="font-serif text-3xl text-[#174D40]">Verify your email</h1>
            <p className="text-sm text-[#252B29]/75">
              Check your inbox for {user.email}. After clicking the verification link, sign out and sign in again.
            </p>
            {authError && <p role="alert" className="text-sm text-red-800">{authError}</p>}
            {authInfo && <p role="status" className="text-sm text-[#174D40]">{authInfo}</p>}
            <button type="button" disabled={authBusy} onClick={() => void requestAccountVerification()}
              className="w-full h-11 bg-[#174D40] text-white rounded-lg disabled:opacity-60">
              {authBusy ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button type="button" onClick={() => void logout()}
              className="w-full h-11 border border-[#174D40]/25 rounded-lg text-[#174D40]">Sign Out</button>
            <Link to="/track-order" className="block text-sm text-[#174D40] underline">Track a guest order</Link>
          </div>
        </div>
      </>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUserProfile({ phone: phoneInput });
    setProfileSavedMsg('Profile updated.');
    setTimeout(() => setProfileSavedMsg(''), 3000);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.streetAddress.trim() || !newAddr.city.trim()) return;
    await saveAddress({
      ...newAddr,
      id: `addr-${Date.now()}`,
    });
    setNewAddr({
      label: 'Home',
      recipientName: user.displayName ?? '',
      phone: '',
      streetAddress: '',
      city: '',
      province: '',
      postalCode: '',
    });
  };

  return (
    <>
      <PageMeta
        title={`My Account — ${siteSettings.businessName}`}
        description="Manage your orders, delivery addresses, and saved supplements."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#174D40]/12 pb-6">
          <div>
            <p className="text-xs text-[#252B29]/60">{user.email}</p>
            <h1 className="font-serif text-3xl font-semibold text-[#174D40]">
              Welcome, {user.displayName || 'Customer'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="h-10 px-4 rounded-lg bg-[#C7A46A] text-[#174D40] text-xs font-semibold flex items-center"
              >
                Open Admin Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="h-10 px-4 rounded-lg border border-[#174D40]/20 text-sm font-medium text-[#252B29] flex items-center gap-2 hover:bg-[#E8F1EB] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Account Navigation Tabs */}
        <div className="flex flex-wrap gap-2" role="tablist">
          {[
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'wishlist', label: `Wishlist (${wishlistProducts.length})` },
            { id: 'addresses', label: 'Addresses' },
            { id: 'appointments', label: `Consultations (${appointments.length})` },
            { id: 'profile', label: 'Profile' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`h-10 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === t.id
                  ? 'bg-[#174D40] text-white'
                  : 'bg-white border border-[#174D40]/15 text-[#252B29] hover:border-[#174D40]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <div className="space-y-4">
            {loadingData ? (
              <p className="text-sm text-[#252B29]/70">Loading your orders...</p>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-[#174D40]/12 rounded-2xl p-10 text-center space-y-3">
                <Package className="w-8 h-8 text-[#174D40]/50 mx-auto" />
                <p className="text-sm text-[#252B29]/75">You have not placed any orders yet.</p>
                <Link
                  to="/shop"
                  className="inline-flex h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium items-center"
                >
                  Shop Supplements
                </Link>
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#174D40]/10 pb-3">
                    <div>
                      <p className="font-semibold text-[#174D40] tabular-nums">{ord.orderNumber}</p>
                      <Link
                        to={`/track-order?id=${encodeURIComponent(ord.trackingKey)}`}
                        className="text-xs text-[#174D40] underline break-all"
                      >
                        Track by ID: {ord.trackingKey}
                      </Link>
                      <p className="text-xs text-[#252B29]/65">
                        {ord.city} · {ord.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPkr(ord.totalPkr)}
                      </span>
                      <span className="text-xs font-semibold text-[#174D40]">
                        {getOrderStatusLabel(ord.status)}
                      </span>
                      {ord.status === 'placed' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await cancelMyOrder(ord.id);
                            await loadAccountData();
                          }}
                          className="text-xs text-red-700 hover:underline cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                  <ul className="text-sm space-y-1 text-[#252B29]/85">
                    {ord.items.map((it) => (
                      <li key={it.productId + (it.variantLabel || '')} className="flex justify-between">
                        <span>
                          {it.name} × {it.quantity}
                        </span>
                        <span className="tabular-nums">{formatPkr(it.lineTotalPkr)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'wishlist' && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="bg-white border border-[#174D40]/12 rounded-2xl p-10 text-center space-y-3">
                <p className="text-sm text-[#252B29]/75">Your wishlist is currently empty.</p>
                <Link
                  to="/shop"
                  className="inline-flex h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium items-center"
                >
                  Explore Supplements
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'addresses' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-4">
              {(userProfile?.addresses ?? []).length === 0 ? (
                <div className="bg-white border border-[#174D40]/12 rounded-xl p-8 text-sm text-[#252B29]/70">
                  No saved addresses yet.
                </div>
              ) : (
                (userProfile?.addresses ?? []).map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white border border-[#174D40]/12 rounded-xl p-5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-[#174D40] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{addr.label}</span>
                      </p>
                      <p className="font-medium">{addr.recipientName}</p>
                      <p className="text-[#252B29]/75">
                        {addr.streetAddress}, {addr.city}
                      </p>
                      <p className="text-xs text-[#252B29]/65">{addr.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeAddress(addr.id)}
                      aria-label={`Delete address ${addr.label}`}
                      className="p-2 text-[#252B29]/50 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddAddress}
              className="lg:col-span-6 bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4"
            >
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">Add New Address</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <input
                  type="text"
                  required
                  placeholder="Label (Home / Office)"
                  value={newAddr.label}
                  onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={newAddr.recipientName}
                  onChange={(e) => setNewAddr({ ...newAddr, recipientName: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone (03XX-XXXXXXX)"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
                <input
                  type="text"
                  required
                  placeholder="Complete Street Address"
                  value={newAddr.streetAddress}
                  onChange={(e) => setNewAddr({ ...newAddr, streetAddress: e.target.value })}
                  className="sm:col-span-2 h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Address</span>
              </button>
            </form>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white border border-[#174D40]/12 rounded-xl p-10 text-center text-sm text-[#252B29]/75">
                No consultation appointments requested yet.
              </div>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-5 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-[#174D40]">{apt.serviceTitle}</p>
                    <p className="text-xs text-[#252B29]/70">
                      {apt.preferredDate} · {apt.preferredSlot}
                    </p>
                  </div>
                  <span className="text-xs font-semibold capitalize text-[#174D40]">
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className="max-w-lg bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Profile Details</h2>
            <div className="space-y-1 text-sm">
              <label className="text-xs font-semibold">Email</label>
              <input
                type="email"
                disabled
                value={user.email ?? ''}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/15 bg-[#FAF8F2]/60 text-[#252B29]/65"
              />
            </div>
            <div className="space-y-1 text-sm">
              <label htmlFor="prof-phone" className="text-xs font-semibold">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium cursor-pointer"
            >
              Save Profile
            </button>
            {profileSavedMsg && <p className="text-xs text-[#174D40]">{profileSavedMsg}</p>}
          </form>
        )}
      </div>
    </>
  );
};
