import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import type { Order } from '../types';
import { calculateCartTotals, checkoutSchema, formatPkr } from '../utils/commerce';

// Merchant-provided receiving number. Both wallets must be verified by owner before collecting payment.
const WALLET_RECEIVING_NUMBER = '03486287055';
const isManualWallet = (value: string) => value === 'easypaisa' || value === 'jazzcash';
const walletLabel = (value: string) => value === 'easypaisa' ? 'Easypaisa' : 'JazzCash';

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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'whatsapp' | 'easypaisa' | 'jazzcash'>('cod');
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
      )}). Payment method: ${isManualWallet(confirmedOrder.paymentMethod) ? walletLabel(confirmedOrder.paymentMethod) + ' transfer' : confirmedOrder.paymentMethod}. Payment pending; please verify the transfer against the wallet transaction reference.`
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
                  : confirmedOrder.paymentMethod === 'whatsapp'
                    ? 'WhatsApp Order Confirmation'
                    : isManualWallet(confirmedOrder.paymentMethod)
                      ? walletLabel(confirmedOrder.paymentMethod) + ' Manual Transfer (Payment Pending)'
                      : 'Payment Pending'}
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

          {isManualWallet(confirmedOrder.paymentMethod) && (
            <div className="bg-[#FFF9E8] border border-[#C7A46A]/45 rounded-xl p-5 space-y-2 text-sm">
              <p className="font-semibold text-[#174D40]">{walletLabel(confirmedOrder.paymentMethod)} manual payment instructions</p>
              <p>Amount: <strong>{formatPkr(confirmedOrder.totalPkr)}</strong></p>
              <p>Receiving number: <strong className="tabular-nums">{WALLET_RECEIVING_NUMBER}</strong></p>
              <p>Open your wallet app and transfer the exact amount only after confirming the recipient account name matches the store. Share your order number and wallet transaction ID with store support.</p>
              <p className="font-semibold text-[#865B00]">Payment pending — your order is NOT marked paid until the merchant verifies receipt.</p>
              <p className="text-xs text-[#252B29]/70">Never share wallet PIN, OTP, password or card details.</p>
            </div>
          )}

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

                  {(['easypaisa', 'jazzcash'] as const).map((wallet) => (
                    <label key={wallet} className="flex items-start gap-3 p-4 rounded-xl border border-[#174D40]/20 bg-white cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={wallet}
                        checked={paymentMethod === wallet}
                        onChange={() => setPaymentMethod(wallet)}
                        className="mt-1"
                      />
                      <div className="text-sm space-y-1">
                        <span className="font-semibold text-[#252B29] block">
                          {walletLabel(wallet)} — Manual Wallet Transfer
                        </span>
                        <span className="text-xs text-[#252B29]/70 block">
                          Pay to {WALLET_RECEIVING_NUMBER} through the {walletLabel(wallet)} app and send your transaction reference for verification.
                          Payment is not automatically deducted or confirmed.
                        </span>
                      </div>
                    </label>
                  ))}
                  {isManualWallet(paymentMethod) && (
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-sm space-y-1">
                      <p className="font-semibold text-[#174D40]">{walletLabel(paymentMethod)} receiving number: <span className="tabular-nums">{WALLET_RECEIVING_NUMBER}</span></p>
                      <p className="text-xs text-[#252B29]/80">Place your order first, then transfer the displayed total using your wallet app. Check the recipient's name before sending. Your order stays payment-pending until the merchant verifies it.</p>
                      <p className="text-xs text-[#252B29]/80">Never enter wallet PIN, OTP or card information on this website.</p>
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
                {submitting ? 'Processing...' : `Confirm Order (${formatPkr(totals.totalPkr)})`}
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
