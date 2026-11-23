import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { calculateCartTotals, formatPkr } from '../utils/commerce';

export const CartPage: React.FC = () => {
  const {
    cart,
    products,
    updateCartQuantity,
    removeFromCart,
    siteSettings,
    appliedCoupon,
    applyCouponCode,
    clearCoupon,
  } = useStore();

  const comparisonLineTotal = (productId: string, unitPricePkr: number, quantity: number) => {
    const comparison = products.find((product) => product.id === productId)?.compareAtPricePkr;
    return typeof comparison === 'number' && comparison > unitPricePkr
      ? comparison * quantity
      : null;
  };

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const totals = calculateCartTotals(
    cart,
    siteSettings.shippingFeePkr,
    siteSettings.freeShippingThresholdPkr,
    appliedCoupon
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await applyCouponCode(couponInput);
    setCouponMsg({ ok: res.ok, text: res.message });
  };

  return (
    <>
      <PageMeta
        title={`Shopping Cart — ${siteSettings.businessName}`}
        description="Review your BrainAxis supplement order, apply discount coupons, and proceed to secure checkout."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white border border-[#174D40]/12 rounded-2xl p-12 text-center space-y-4">
            <p className="text-base text-[#252B29]/75">Your shopping cart is empty.</p>
            <Link
              to="/shop"
              className="inline-flex h-11 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold items-center"
            >
              Browse BrainAxis Supplements
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId ?? 'default'}`}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-5"
                >
                  <div className="w-24 h-20 rounded-lg bg-[#F4F1EA] p-2 shrink-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      to={`/product/${item.slug}`}
                      className="font-serif text-xl font-semibold text-[#252B29] hover:text-[#174D40]"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[#252B29]/65">
                      {[item.brand, item.variantLabel].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-2 text-sm tabular-nums">
                      {comparisonLineTotal(item.productId, item.unitPricePkr, 1) !== null && (
                        <span className="text-[#252B29]/55 line-through">
                          {formatPkr(comparisonLineTotal(item.productId, item.unitPricePkr, 1)!)}
                        </span>
                      )}
                      <span className="font-medium text-[#174D40]">{formatPkr(item.unitPricePkr)} each</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="inline-flex items-center border border-[#174D40]/20 rounded-lg bg-[#FAF8F2]">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="w-9 h-9 flex items-center justify-center text-[#174D40] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-9 h-9 flex items-center justify-center text-[#174D40] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 tabular-nums">
                      {comparisonLineTotal(item.productId, item.unitPricePkr, item.quantity) !== null && (
                        <span className="text-xs text-[#252B29]/55 line-through">
                          {formatPkr(comparisonLineTotal(item.productId, item.unitPricePkr, item.quantity)!)}
                        </span>
                      )}
                      <span className="text-base font-semibold text-[#174D40]">
                        {formatPkr(item.unitPricePkr * item.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      aria-label={`Remove ${item.name}`}
                      className="p-2 text-[#252B29]/50 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4 bg-white border border-[#174D40]/12 rounded-2xl p-6 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Order Summary</h2>

              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label htmlFor="coupon-input" className="text-xs font-semibold text-[#252B29]">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm uppercase"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg border border-[#174D40] text-[#174D40] text-xs font-semibold hover:bg-[#E8F1EB] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCoupon();
                      setCouponMsg(null);
                    }}
                    className="text-xs text-red-700 hover:underline cursor-pointer"
                  >
                    Remove coupon ({appliedCoupon.code})
                  </button>
                )}
                {couponMsg && (
                  <p className={`text-xs ${couponMsg.ok ? 'text-[#174D40]' : 'text-red-700'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </form>

              <div className="space-y-2 text-sm border-t border-[#174D40]/10 pt-4">
                <div className="flex justify-between">
                  <span className="text-[#252B29]/75">Subtotal</span>
                  <span className="font-medium tabular-nums">{formatPkr(totals.subtotalPkr)}</span>
                </div>
                {totals.discountPkr > 0 && (
                  <div className="flex justify-between text-[#174D40]">
                    <span>Discount</span>
                    <span className="font-medium tabular-nums">
                      -{formatPkr(totals.discountPkr)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#252B29]/75">Shipping</span>
                  <span className="font-medium tabular-nums">
                    {totals.shippingFeePkr === 0 ? 'Free' : formatPkr(totals.shippingFeePkr)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-[#174D40]/10">
                  <span>Total</span>
                  <span className="text-[#174D40] tabular-nums">{formatPkr(totals.totalPkr)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full h-11 rounded-lg bg-[#174D40] text-white text-sm font-semibold flex items-center justify-center hover:bg-[#113A30] transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
