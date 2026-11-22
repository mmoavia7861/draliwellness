import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, MessageCircle, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import type { Order } from '../types';
import { calculateCartTotals, checkoutSchema, formatPkr } from '../utils/commerce';

const PAYMENT_API_BASE = (import.meta.env.VITE_PAYMENT_API_BASE_URL || 'https://draliwellness.moavia400.workers.dev').replace(/\/$/, '');

export const CheckoutPage: React.FC = () => {
  const { cart, siteSettings, appliedCoupon, user, userProfile, placeOrder } = useStore();

  const savedAddr = userProfile?.addresses?.[0];

  const [customerName, setCustomerName] = useState(
    savedAddr?.recipientName || user?.displayName || ''
  );
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(
    savedAddr?.phone || userProfile?.phone || ''
  );
  const [shippingAddress, setShippingAddress] = useState(savedAddr?.streetAddress || '');
  const [city, setCity] = useState(savedAddr?.city || '');
  const [province, setProvince] = useState(savedAddr?.province || '');
  const [postalCode, setPostalCode] = useState(savedAddr?.postalCode || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'whatsapp' | 'safepay'>('cod');
  const [safepayAvailable, setSafepayAvailable] = useState(false);
  const [safepayEnvironment, setSafepayEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const pendingSafepayOrder = useRef<Order | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(PAYMENT_API_BASE + '/api/payments/safepay/status', { signal: controller.signal })
      .then((r) => r.headers.get('content-type')?.includes('application/json') ? r.json() : null)
      .then((result: {enabled?:boolean;environment?:'sandbox'|'production'} | null) => {
        if (result?.enabled === true) {
          setSafepayAvailable(true);
          setSafepayEnvironment(result.environment === 'production' ? 'production' : 'sandbox');
        }
      })
      .catch(() => { /* COD and WhatsApp remain available */ });
    return () => controller.abort();
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const totals = calculateCartTotals(
    cart,
    siteSettings.shippingFeePkr,
    siteSettings.freeShippingThresholdPkr,
    appliedCoupon
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');

    const parsed = checkoutSchema.safeParse({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      province,
      postalCode,
      notes,
      paymentMethod,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (parsed.data.paymentMethod === 'safepay') {
        if (!safepayAvailable || siteSettings.onlinePaymentsEnabled !== true) {
          throw new Error('Safepay is not ready. Choose Cash on Delivery instead.');
        }
        // Keep a saved, pending order for a retry without creating duplicates.
        const order = pendingSafepayOrder.current ?? await placeOrder(parsed.data);
        pendingSafepayOrder.current = order;
        const response = await fetch(PAYMENT_API_BASE + '/api/payments/safepay/checkout', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            orderId: order.id, email:order.customerEmail,
            items:order.items.map(item => ({
              productId:item.productId,
              variantLabel:item.variantLabel || '',quantity:item.quantity,
            })),
            couponCode:order.couponCode || '',
            returnOrigin:window.location.origin,
          }),
        });
        const result = response.headers.get('content-type')?.includes('application/json')
          ? (await response.json()) as {checkoutUrl?:string;error?:string}
          : null;
        if (!response.ok || !result?.checkoutUrl) {
          throw new Error(result?.error || 'Safepay checkout is not available right now. Your order is still payment-pending.');
        }
        // No payment is marked paid here. Only a verified webhook updates that status.
        sessionStorage.setItem('safepay:email:'+order.id, order.customerEmail);
        const target = new URL(result.checkoutUrl);
        if (target.protocol !== 'https:' || !['sandbox.api.getsafepay.com','api.getsafepay.com'].includes(target.hostname)) {
          throw new Error('The payment provider returned an invalid checkout address.');
        }
        window.location.assign(target.toString());
        return;
      }
      const order = await placeOrder(parsed.data);
      setConfirmedOrder(order);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to place order right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const phoneClean = (siteSettings.whatsappNumber || '').replace(/[^0-9]/g, '');
    const waSummary = encodeURIComponent(
      `Order ${confirmedOrder.orderNumber} placed for ${confirmedOrder.customerName} (${formatPkr(
        confirmedOrder.totalPkr
      )}).`
    );

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <PageMeta
          title={`Order Confirmed ${confirmedOrder.orderNumber} — ${siteSettings.businessName}`}
          description="Your BrainAxis supplement order has been placed."
        />

        <div className="bg-white border border-[#174D40]/15 rounded-2xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F1EB] text-[#174D40] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#C7A46A]">
                Order Placed Successfully
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[#174D40]">
                Thank you, {confirmedOrder.customerName}
              </h1>
              <p className="text-sm text-[#252B29]/80">
                Reference: <strong className="tabular-nums">{confirmedOrder.orderNumber}</strong>
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F2] border border-[#174D40]/10 rounded-xl p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#252B29]/70">Payment Method</span>
              <span className="font-semibold">
                {confirmedOrder.paymentMethod === 'cod'
                  ? 'Cash on Delivery (Payment Pending)'
                  : 'WhatsApp Order Confirmation'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#252B29]/70">Delivery City</span>
              <span className="font-medium">{confirmedOrder.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#252B29]/70">Total Payable</span>
              <span className="font-semibold text-[#174D40] tabular-nums">
                {formatPkr(confirmedOrder.totalPkr)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#252B29]/60">
              Ordered Items
            </h2>
            <ul className="divide-y divide-[#174D40]/10 text-sm">
              {confirmedOrder.items.map((it) => (
                <li key={it.productId + (it.variantLabel || '')} className="py-2 flex justify-between">
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-medium tabular-nums">{formatPkr(it.lineTotalPkr)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to={`/track-order?order=${encodeURIComponent(
                confirmedOrder.orderNumber
              )}&email=${encodeURIComponent(confirmedOrder.customerEmail)}`}
              className="h-11 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center"
            >
              Track This Order
            </Link>
            {phoneClean && (
              <a
                href={`https://wa.me/${phoneClean}?text=${waSummary}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-5 rounded-lg border border-[#174D40]/25 text-[#174D40] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#E8F1EB]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm via WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Checkout — ${siteSettings.businessName}`}
        description="Complete your BrainAxis supplement order with Cash on Delivery across Pakistan."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">Checkout</h1>
          <p className="text-sm text-[#252B29]/75">
            Complete your delivery details below. Guest checkout and signed-in checkout are both supported.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white border border-[#174D40]/12 rounded-2xl p-10 text-center space-y-4">
            <p className="text-sm text-[#252B29]/75">Your cart is empty.</p>
            <Link
              to="/shop"
              className="inline-flex h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium items-center"
            >
              Go to Shop
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start" noValidate>
            <div className="lg:col-span-7 bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
                Shipping Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="checkout-name" className="text-xs font-semibold text-[#252B29]">
                    Full Name *
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Muhammad Usman"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-700">{errors.customerName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="checkout-email" className="text-xs font-semibold text-[#252B29]">
                    Email Address *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                  {errors.customerEmail && (
                    <p className="text-xs text-red-700">{errors.customerEmail}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="checkout-phone" className="text-xs font-semibold text-[#252B29]">
                    Mobile Phone (Pakistan) *
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-700">{errors.customerPhone}</p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="checkout-address" className="text-xs font-semibold text-[#252B29]">
                    Complete Street Address *
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="House / Flat, Street, Sector or Block"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                  {errors.shippingAddress && (
                    <p className="text-xs text-red-700">{errors.shippingAddress}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="checkout-city" className="text-xs font-semibold text-[#252B29]">
                    City *
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lahore, Karachi, Islamabad..."
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                  {errors.city && <p className="text-xs text-red-700">{errors.city}</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="checkout-province" className="text-xs font-semibold text-[#252B29]">
                    Province / Region
                  </label>
                  <input
                    id="checkout-province"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Punjab, Sindh, KPK, ICT..."
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="checkout-postal" className="text-xs font-semibold text-[#252B29]">
                    Postal Code (Optional)
                  </label>
                  <input
                    id="checkout-postal"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor="checkout-notes" className="text-xs font-semibold text-[#252B29]">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Preferred delivery window or landmark"
                    className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3 pt-4 border-t border-[#174D40]/10">
                <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Payment Method</h2>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-[#174D40]/25 bg-[#FAF8F2] cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-[#252B29] block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-xs text-[#252B29]/70">
                        Pay in cash when your BrainAxis package arrives at your doorstep.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-[#174D40]/20 bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="whatsapp"
                      checked={paymentMethod === 'whatsapp'}
                      onChange={() => setPaymentMethod('whatsapp')}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <span className="font-semibold text-[#252B29] block">
                        WhatsApp Order Confirmation
                      </span>
                      <span className="text-xs text-[#252B29]/70">
                        Place your order now and confirm dispatch details directly via WhatsApp.
                      </span>
                    </div>
                  </label>

                  {safepayAvailable && siteSettings.onlinePaymentsEnabled === true ? (
                    <label className="flex items-start gap-3 p-4 rounded-xl border border-[#174D40]/25 bg-white cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="safepay"
                        checked={paymentMethod === 'safepay'}
                        onChange={() => setPaymentMethod('safepay')}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <span className="font-semibold text-[#252B29] block">
                          Safepay Online Payment {safepayEnvironment === 'sandbox' ? '(Test Mode)' : ''}
                        </span>
                        <span className="text-xs text-[#252B29]/70">
                          Pay on Safepay's secure hosted checkout. Payment status updates after verification.
                        </span>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[#252B29]/20 bg-[#FAF8F2]/60 opacity-75 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-[#252B29]/60 mt-0.5 shrink-0" />
                      <div className="text-xs text-[#252B29]/75">
                        <span className="font-semibold block text-[#252B29]">
                          Safepay Online Payment (Not Yet Activated)
                        </span>
                        <span>The merchant gateway remains disabled until Safepay credentials and verified webhooks are configured.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary Right */}
            <div className="lg:col-span-5 bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Your Order</h2>

              <ul className="divide-y divide-[#174D40]/10 text-sm">
                {cart.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId ?? 'default'}`}
                    className="py-3 flex justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-[#252B29]">{item.name}</p>
                      <p className="text-xs text-[#252B29]/60">
                        Qty {item.quantity} {item.variantLabel ? `· ${item.variantLabel}` : ''}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatPkr(item.unitPricePkr * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 text-sm border-t border-[#174D40]/10 pt-4">
                <div className="flex justify-between">
                  <span className="text-[#252B29]/75">Subtotal</span>
                  <span className="tabular-nums font-medium">{formatPkr(totals.subtotalPkr)}</span>
                </div>
                {totals.discountPkr > 0 && (
                  <div className="flex justify-between text-[#174D40]">
                    <span>Discount ({totals.appliedCouponCode})</span>
                    <span className="tabular-nums font-medium">
                      -{formatPkr(totals.discountPkr)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#252B29]/75">Nationwide Shipping</span>
                  <span className="tabular-nums font-medium">
                    {totals.shippingFeePkr === 0 ? 'Free' : formatPkr(totals.shippingFeePkr)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-[#174D40]/10">
                  <span>Total Payable</span>
                  <span className="text-[#174D40] tabular-nums">{formatPkr(totals.totalPkr)}</span>
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-[#174D40] text-white text-sm font-semibold hover:bg-[#113A30] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Processing...' : paymentMethod === 'safepay'
                  ? `Continue to Safepay (${formatPkr(totals.totalPkr)})`
                  : `Confirm Order (${formatPkr(totals.totalPkr)})`}
              </button>

              <p className="text-xs text-[#252B29]/65 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#174D40]" />
                <span>You will receive a tracking reference immediately after confirming.</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </>
  );
};
