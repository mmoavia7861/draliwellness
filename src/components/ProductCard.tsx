import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import { formatPkr } from '../utils/commerce';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setQuickViewProduct, wishlistIds, toggleWishlist } = useStore();
  const [imgError, setImgError] = useState(false);

  const isWishlisted = wishlistIds.includes(product.id);
  const inStock = product.stock > 0;
  const hasDiscount =
    typeof product.compareAtPricePkr === 'number' &&
    product.compareAtPricePkr > product.pricePkr;

  const metaParts = [
    product.brand,
    product.format,
    product.packSize || product.strength,
  ].filter(Boolean);

  return (
    <article className="group bg-white border border-[#174D40]/12 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] bg-[#F4F1EA] overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full p-4">
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#E8F1EB] to-[#FAF8F2] text-[#174D40] p-6 text-center rounded-lg">
              <span className="font-serif text-xl font-semibold">{product.brand}</span>
              <span className="text-xs mt-1 text-[#252B29]/70">{product.name}</span>
            </div>
          )}
        </Link>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={() => void toggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 border border-[#174D40]/10 flex items-center justify-center text-[#174D40] hover:bg-white transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#174D40]' : ''}`} />
        </button>
      </div>

      {/* Product Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-[#252B29]/65">
            <span className="truncate">{metaParts.join(' · ')}</span>
            <span className="shrink-0 font-medium text-[#174D40]">
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <h3 className="font-serif text-xl font-semibold text-[#252B29] leading-snug">
            <Link to={`/product/${product.slug}`} className="hover:text-[#174D40] transition-colors">
              {product.name}
            </Link>
          </h3>

          {product.subtitle && (
            <p className="text-xs font-medium text-[#174D40]/85">{product.subtitle}</p>
          )}

          {product.shortDescription && (
            <p className="text-sm text-[#252B29]/75 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-[#174D40]/10 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-sm text-[#252B29]/55 line-through tabular-nums" aria-label="Comparison price">
                  {formatPkr(product.compareAtPricePkr!)}
                </span>
              )}
              <span className="text-lg font-semibold text-[#174D40] tabular-nums" aria-label="Current price">
                {formatPkr(product.pricePkr)}
              </span>
            </div>
            {product.usageSummary && (
              <span className="text-xs text-[#252B29]/60 truncate">{product.usageSummary}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!inStock}
              onClick={() => addToCart(product, 1)}
              className="flex-1 min-w-[130px] h-10 px-3 sm:px-4 rounded-lg bg-[#174D40] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>{inStock ? 'Add to Cart' : 'Unavailable'}</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickViewProduct(product)}
              aria-label={`Quick view ${product.name}`}
              className="h-10 px-3 rounded-lg border border-[#174D40]/20 text-[#174D40] text-sm font-medium hover:bg-[#E8F1EB]/70 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Quick View</span>
            </button>

            <Link
              to={`/product/${product.slug}`}
              className="h-10 px-3 rounded-lg border border-[#174D40]/20 text-[#252B29] text-sm font-medium hover:border-[#174D40] hover:text-[#174D40] transition-colors flex items-center justify-center whitespace-nowrap shrink-0"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
