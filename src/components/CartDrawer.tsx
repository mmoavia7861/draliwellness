import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { calculateCartTotals, formatPkr } from '../utils/commerce';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    products,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    siteSettings,
    appliedCoupon,
  } = useStore();

  if (!cartDrawerOpen) return null;

  const totals = calculateCartTotals(
    cart,
    siteSettings.shippingFeePkr,
    siteSettings.freeShippingThresholdPkr,
    appliedCoupon
  );

  const comparisonLineTotal = (productId: string, unitPricePkr: number, quantity: number) => {
    const comparison = products.find((product) => product.id === productId)?.compareAtPricePkr;
    return typeof comparison === 'number' && comparison > unitPricePkr
      ? comparison * quantity
      : null;
  };

  // All orders qualify for free delivery, regardless of cart amount.

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        className="flex-1"
        onClick={() => setCartDrawerOpen(false)}
        aria-hidden="true"
      />
      <div className="w-full max-w-md bg-[#FAF8F2] h-full flex flex-col border-l border-[#174D40]/15 shadow-2xl">
        <div className="px-6 py-4 bg-white border-b border-[#174D40]/12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#174D40]" />
            <h2 className="font-serif text-xl font-semibold text-[#252B29]">
              Your Cart ({totals.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#252B29]/70 hover:bg-[#E8F1EB] hover:text-[#174D40] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-2.5 bg-[#E8F1EB] text-xs text-[#174D40] font-medium border-b border-[#174D40]/10">
            Free Nationwide Delivery — no minimum order.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-sm text-[#252B29]/70">Your shopping cart is currently empty.</p>
              <Link
                to="/shop"
                onClick={() => setCartDrawerOpen(false)}
                className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium hover:bg-[#113A30] transition-colors"
              >
                Explore Supplements
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantId ?? 'default'}`}
                className="bg-white border border-[#174D40]/12 rounded-xl p-4 flex gap-4"
              >
                <div className="w-20 h-20 rounded-lg bg-[#F4F1EA] shrink-0 overflow-hidden p-1.5">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#174D40]">
                      {item.brand}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={() => setCartDrawerOpen(false)}
                        className="text-sm font-semibold text-[#252B29] hover:text-[#174D40] line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      {item.variantLabel && (
                        <p className="text-xs text-[#252B29]/60 mt-0.5">{item.variantLabel}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="p-1 text-[#252B29]/50 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#174D40]/20 rounded-lg bg-[#FAF8F2]">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="w-8 h-8 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] rounded-l-lg cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-8 h-8 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] rounded-r-lg cursor-pointer"
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
                      <span className="text-sm font-semibold text-[#174D40]">
                        {formatPkr(item.unitPricePkr * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-[#174D40]/12 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#252B29]/75">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatPkr(totals.subtotalPkr)}</span>
              </div>
              {totals.discountPkr > 0 && (
                <div className="flex justify-between text-[#174D40]">
                  <span>Discount ({totals.appliedCouponCode})</span>
                  <span className="tabular-nums font-medium">-{formatPkr(totals.discountPkr)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#252B29]/75">
                <span>Shipping</span>
                <span className="tabular-nums font-medium">
                  {totals.shippingFeePkr === 0 ? 'Free' : formatPkr(totals.shippingFeePkr)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#252B29] pt-2 border-t border-[#174D40]/10">
                <span>Estimated Total</span>
                <span className="tabular-nums text-[#174D40]">{formatPkr(totals.totalPkr)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/cart"
                onClick={() => setCartDrawerOpen(false)}
                className="h-11 rounded-lg border border-[#174D40]/25 text-[#174D40] text-sm font-medium flex items-center justify-center hover:bg-[#E8F1EB]/70 transition-colors"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={() => setCartDrawerOpen(false)}
                className="h-11 rounded-lg bg-[#174D40] text-white text-sm font-medium flex items-center justify-center hover:bg-[#113A30] transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
