import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatPkr } from '../utils/commerce';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useStore();
  const [qty, setQty] = useState(1);

  if (!quickViewProduct) return null;

  const p = quickViewProduct;
  const inStock = p.stock > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view ${p.name}`}
    >
      <div className="bg-[#FAF8F2] border border-[#174D40]/15 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl grid md:grid-cols-2">
        <div className="bg-[#F4F1EA] p-6 flex items-center justify-center min-h-[260px]">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              referrerPolicy="no-referrer"
              className="max-h-80 w-full object-contain"
            />
          ) : (
            <span className="font-serif text-2xl text-[#174D40]">{p.brand}</span>
          )}
        </div>

        <div className="p-6 sm:p-8 bg-white flex flex-col justify-between gap-5 relative">
          <button
            type="button"
            onClick={() => {
              setQty(1);
              setQuickViewProduct(null);
            }}
            aria-label="Close quick view"
            className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-[#252B29]/70 hover:bg-[#E8F1EB] hover:text-[#174D40] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-3 pr-8">
            <p className="text-xs text-[#252B29]/65">
              {[p.brand, p.format, p.packSize || p.strength].filter(Boolean).join(' · ')}
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#252B29] leading-tight">
              {p.name}
            </h2>
            {p.subtitle && <p className="text-sm font-medium text-[#174D40]">{p.subtitle}</p>}
            <p className="text-xl font-semibold text-[#174D40] tabular-nums">
              {formatPkr(p.pricePkr)}
            </p>
            {p.shortDescription && (
              <p className="text-sm text-[#252B29]/80 leading-relaxed">{p.shortDescription}</p>
            )}

            {p.benefits && p.benefits.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {p.benefits.slice(0, 4).map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-[#252B29]/85">
                    <Check className="w-3.5 h-3.5 text-[#174D40] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-[#174D40]/10">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-[#174D40]/20 rounded-lg bg-[#FAF8F2]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-10 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] rounded-l-lg cursor-pointer"
                >
                  -
                </button>
                <span className="w-9 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(p.stock || 10, q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-10 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] rounded-r-lg cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={!inStock}
                onClick={() => {
                  addToCart(p, qty);
                  setQty(1);
                  setQuickViewProduct(null);
                }}
                className="flex-1 h-10 px-4 rounded-lg bg-[#174D40] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-50 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
            </div>

            <Link
              to={`/product/${p.slug}`}
              onClick={() => {
                setQty(1);
                setQuickViewProduct(null);
              }}
              className="block w-full text-center text-sm font-medium text-[#174D40] hover:underline py-1"
            >
              View Full Product Details &amp; Safety Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
