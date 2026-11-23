import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { ProductCard } from '../components/ProductCard';
import { formatPkr } from '../utils/commerce';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    liveProducts,
    addToCart,
    wishlistIds,
    toggleWishlist,
    siteSettings,
    reviews,
  } = useStore();

  const product = liveProducts.find((p) => p.slug === slug);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#174D40]">Product Not Found</h1>
        <p className="text-sm text-[#252B29]/75">
          This supplement may be unpublished or unavailable.
        </p>
        <Link
          to="/shop"
          className="inline-flex h-10 px-6 rounded-lg bg-[#174D40] text-white text-sm font-medium items-center"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const variants = product.variants ?? [];
  const activeVariant = variants[selectedVariantIdx];
  const displayPrice = activeVariant ? activeVariant.pricePkr : product.pricePkr;
  const availableStock = activeVariant ? activeVariant.stock : product.stock;
  const inStock = availableStock > 0;
  const isWishlisted = wishlistIds.includes(product.id);
  const gallery = product.galleryUrls?.length
    ? product.galleryUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const relatedProducts = liveProducts.filter((p) => p.id !== product.id);
  const productReviews = reviews.filter((r) => r.approved && r.productId === product.id);

  const phoneClean = (siteSettings.whatsappNumber || '').replace(/[^0-9]/g, '');
  const whatsappHref = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(
        `Hello Dr. Ali Hassan Health & Wellness, I have a question about ${product.name}.`
      )}`
    : '/contact';

  const isPublishedLabelValue = (value?: string | null) =>
    Boolean(value?.trim() && !/^(editable in admin|pending|tbd|to be confirmed|not available|n\/a)$/i.test(value.trim()));
  const productCanonicalUrl = `https://draliwellness.com/product/${product.slug}/`;
  const productImages = gallery
    .filter(Boolean)
    .map((url) => new URL(url, 'https://draliwellness.com/').href);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productCanonicalUrl}#product`,
    name: product.name,
    description: product.shortDescription || product.overview,
    url: productCanonicalUrl,
    ...(productImages.length > 0 ? { image: productImages } : {}),
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    sku: activeVariant?.sku || product.sku,
    offers: {
      '@type': 'Offer',
      url: productCanonicalUrl,
      priceCurrency: 'PKR',
      price: String(displayPrice),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <PageMeta
        title={`${product.name} — ${siteSettings.businessName}`}
        description={
          product.shortDescription ||
          `${product.name} by ${product.brand}. View supplement facts, directions, and safety warnings.`
        }
        jsonLd={productJsonLd}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#252B29]/65 flex items-center gap-2">
          <Link to="/" className="hover:text-[#174D40]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/shop" className="hover:text-[#174D40]">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#174D40] font-medium truncate">{product.name}</span>
        </nav>

        {/* Contiguous Purchase Module */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Sticky Gallery Left */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="aspect-[4/3] bg-[#F4F1EA] border border-[#174D40]/12 rounded-2xl p-6 flex items-center justify-center overflow-hidden">
              {gallery[activeImageIdx] ? (
                <img
                  src={gallery[activeImageIdx]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="font-serif text-2xl text-[#174D40]">{product.brand}</span>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="flex items-center gap-3">
                {gallery.map((url, idx) => (
                  <button
                    key={url + idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-16 rounded-lg bg-[#F4F1EA] p-1.5 border cursor-pointer ${
                      activeImageIdx === idx ? 'border-[#174D40]' : 'border-[#174D40]/15'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} view ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Panel Right */}
          <div className="lg:col-span-6 bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-[#252B29]/65">
                {[product.brand, product.founderMention && `Founder: ${product.founderMention}`, product.format, product.packSize]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40] leading-tight">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="text-sm font-medium text-[#252B29]/80">{product.subtitle}</p>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-4 border-y border-[#174D40]/10 py-4">
              <div>
                {typeof product.compareAtPricePkr === 'number' &&
                  product.compareAtPricePkr > displayPrice && (
                    <span className="mr-2 text-sm text-[#252B29]/55 line-through tabular-nums" aria-label="Comparison price">
                      {formatPkr(product.compareAtPricePkr)}
                    </span>
                  )}
                <span className="text-2xl font-semibold text-[#174D40] tabular-nums" aria-label="Current price">
                  {formatPkr(displayPrice)}
                </span>
              </div>
              <span
                className={`text-xs font-semibold ${
                  inStock ? 'text-[#174D40]' : 'text-red-700'
                }`}
              >
                {inStock ? `In Stock (${availableStock} available)` : 'Out of Stock'}
              </span>
            </div>

            {product.shortDescription && (
              <p className="text-sm text-[#252B29]/85 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Quick Key Facts */}
            <div className="grid grid-cols-2 gap-3 bg-[#FAF8F2] border border-[#174D40]/10 rounded-xl p-4 text-xs">
              {product.format && (
                <div>
                  <span className="text-[#252B29]/60 block">Format</span>
                  <span className="font-semibold text-[#252B29]">{product.format}</span>
                </div>
              )}
              {(product.packSize || product.strength) && (
                <div>
                  <span className="text-[#252B29]/60 block">Presentation</span>
                  <span className="font-semibold text-[#252B29]">
                    {[product.packSize, product.strength].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
              {product.usageSummary && (
                <div className="col-span-2">
                  <span className="text-[#252B29]/60 block">Usage Summary</span>
                  <span className="font-semibold text-[#252B29]">{product.usageSummary}</span>
                </div>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#252B29]">Pack Size / Option</span>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        idx === selectedVariantIdx
                          ? 'bg-[#174D40] text-white border-[#174D40]'
                          : 'bg-[#FAF8F2] text-[#252B29] border-[#174D40]/20 hover:border-[#174D40]'
                      }`}
                    >
                      {v.label} — {formatPkr(v.pricePkr)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[#174D40]/20 rounded-lg bg-[#FAF8F2]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-11 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] rounded-l-lg cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(availableStock || 1, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-11 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] rounded-r-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => addToCart(product, quantity, activeVariant)}
                  className="flex-1 h-11 px-5 rounded-lg bg-[#174D40] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void toggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className="w-11 h-11 rounded-lg border border-[#174D40]/20 flex items-center justify-center text-[#174D40] hover:bg-[#E8F1EB] cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#174D40]' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => {
                    addToCart(product, quantity, activeVariant);
                    navigate('/checkout');
                  }}
                  className="h-11 rounded-lg border border-[#174D40] text-[#174D40] text-sm font-semibold hover:bg-[#E8F1EB]/70 disabled:opacity-50 cursor-pointer"
                >
                  Buy Now (Cash on Delivery)
                </button>

                <a
                  href={whatsappHref}
                  target={phoneClean ? '_blank' : undefined}
                  rel={phoneClean ? 'noopener noreferrer' : undefined}
                  className="h-11 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-[#252B29] text-sm font-medium flex items-center justify-center gap-2 hover:border-[#174D40]"
                >
                  <MessageCircle className="w-4 h-4 text-[#174D40]" />
                  <span>Ask on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Shipping & Compliance Trust Line */}
            <div className="pt-3 border-t border-[#174D40]/10 space-y-2 text-xs text-[#252B29]/75">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#174D40]" />
                <span>
                  Shipping: {formatPkr(siteSettings.shippingFeePkr)} across Pakistan (Free above{' '}
                  {formatPkr(siteSettings.freeShippingThresholdPkr)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#174D40]" />
                <span>Unopened sealed packs eligible for 7-day transit-damage review.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Clinical & Supplement Information */}
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            {product.overview && (
              <section className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-3">
                <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Product Overview</h2>
                <p className="text-sm text-[#252B29]/85 leading-relaxed whitespace-pre-line">
                  {product.overview}
                </p>
              </section>
            )}

            {product.benefits && product.benefits.length > 0 && (
              <section className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-4">
                <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Key Benefits</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {product.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-[#252B29]">
                      <Check className="w-4 h-4 text-[#174D40] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {product.directions && (
              <section className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-3">
                <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
                  Dosage &amp; Directions
                </h2>
                <p className="text-sm text-[#252B29]/85 leading-relaxed whitespace-pre-line">
                  {product.directions}
                </p>
              </section>
            )}

            {product.warnings && (
              <section className="bg-amber-50/70 border border-amber-900/15 rounded-2xl p-6 sm:p-8 space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h2 className="font-serif text-2xl font-semibold">
                    Safety Warnings &amp; Caution
                  </h2>
                </div>
                <p className="text-sm text-amber-950/90 leading-relaxed whitespace-pre-line">
                  {product.warnings}
                </p>
                {product.interactions && (
                  <p className="text-xs text-amber-950/80 pt-2 border-t border-amber-900/10">
                    <strong>Interactions:</strong> {product.interactions}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Supplement Facts & Label Verification */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white border border-[#174D40]/15 rounded-2xl p-6 space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-[#174D40] border-b border-[#174D40]/15 pb-3">
                Supplement Facts &amp; Composition
              </h2>
              {product.ingredientsSummary && (
                <p className="text-sm text-[#252B29]/85">{product.ingredientsSummary}</p>
              )}
              {product.supplementFacts && product.supplementFacts.length > 0 && (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#174D40]/20 text-left text-xs text-[#252B29]/65">
                      <th className="py-2 font-semibold">Component</th>
                      <th className="py-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#174D40]/10">
                    {product.supplementFacts.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 text-[#252B29]">{row.nutrient}</td>
                        <td className="py-2.5 text-right font-semibold text-[#174D40] tabular-nums">
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {product.otherIngredients && (
                <p className="text-xs text-[#252B29]/75 pt-2 border-t border-[#174D40]/10">
                  <strong>Other Ingredients:</strong> {product.otherIngredients}
                </p>
              )}
              {product.allergens && (
                <p className="text-xs text-[#252B29]/75">
                  <strong>Allergens:</strong> {product.allergens}
                </p>
              )}
            </section>

            <section className="bg-white border border-[#174D40]/12 rounded-2xl p-6 space-y-3 text-xs text-[#252B29]/80">
              <h2 className="font-serif text-xl font-semibold text-[#174D40]">
                Storage &amp; Batch Details
              </h2>
              {product.storageInstructions && (
                <p>
                  <strong>Storage:</strong> {product.storageInstructions}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-[#174D40]/10">
                {product.manufacturer && (
                  <div className="col-span-2">
                    <dt className="text-[#252B29]/55">Manufacturer</dt>
                    <dd className="font-medium text-[#252B29]">{product.manufacturer}</dd>
                  </div>
                )}
                {product.countryOfOrigin && (
                  <div>
                    <dt className="text-[#252B29]/55">Origin</dt>
                    <dd className="font-medium text-[#252B29]">{product.countryOfOrigin}</dd>
                  </div>
                )}
                {isPublishedLabelValue(product.batchNo) && (
                  <div>
                    <dt className="text-[#252B29]/55">Batch No.</dt>
                    <dd className="font-medium text-[#252B29] tabular-nums">{product.batchNo}</dd>
                  </div>
                )}
                {isPublishedLabelValue(product.mfgDate) && (
                  <div>
                    <dt className="text-[#252B29]/55">Mfg. Date</dt>
                    <dd className="font-medium text-[#252B29] tabular-nums">{product.mfgDate}</dd>
                  </div>
                )}
                {isPublishedLabelValue(product.expDate) && (
                  <div>
                    <dt className="text-[#252B29]/55">Exp. Date</dt>
                    <dd className="font-medium text-[#252B29] tabular-nums">{product.expDate}</dd>
                  </div>
                )}
                {isPublishedLabelValue(product.enlistmentNo) && (
                  <div>
                    <dt className="text-[#252B29]/55">Enlistment No.</dt>
                    <dd className="font-medium text-[#252B29] tabular-nums">
                      {product.enlistmentNo}
                    </dd>
                  </div>
                )}
                {isPublishedLabelValue(product.form7No) && (
                  <div>
                    <dt className="text-[#252B29]/55">Form 7 No.</dt>
                    <dd className="font-medium text-[#252B29] tabular-nums">{product.form7No}</dd>
                  </div>
                )}
              </dl>

              {product.certifications && product.certifications.length > 0 && (
                <div className="pt-2 border-t border-[#174D40]/10">
                  <span className="text-[#252B29]/55 block mb-1">Packaging Markings</span>
                  <p className="font-medium text-[#174D40]">
                    {product.certifications.join(' · ')}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Product FAQs */}
        {product.faqs && product.faqs.length > 0 && (
          <section className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
              Product Questions &amp; Answers
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {product.faqs.map((f) => (
                <div key={f.question} className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#252B29]">{f.question}</h3>
                  <p className="text-sm text-[#252B29]/75 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Independent reference sources support reader understanding, not product efficacy claims. */}
        {(product.slug === 'brainaxis-energy-boost' || product.slug === 'brainaxis-sundex-d') && (
          <section aria-labelledby="independent-health-information" className="bg-[#E8F1EB]/55 border border-[#174D40]/15 rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 id="independent-health-information" className="font-serif text-2xl font-semibold text-[#174D40]">
              Independent Health Information
            </h2>
            <p className="text-sm text-[#252B29]/80 leading-relaxed">
              {product.slug === 'brainaxis-sundex-d'
                ? 'SUNDEX-D contains 200,000 IU vitamin D3. Do not take this high-dose softgel daily unless a qualified healthcare professional has expressly prescribed that schedule. Excess vitamin D can be harmful.'
                : 'Multivitamin and mineral supplements vary in composition. Review the actual pack label, ingredients and cautions, particularly if you take medication or other supplements.'}
            </p>
            <a
              href={product.slug === 'brainaxis-sundex-d'
                ? 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/'
                : 'https://ods.od.nih.gov/factsheets/MVMS-Consumer/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-semibold text-[#174D40] underline underline-offset-4 hover:text-[#113A30]"
            >
              {product.slug === 'brainaxis-sundex-d'
                ? 'NIH Office of Dietary Supplements — Vitamin D information'
                : 'NIH Office of Dietary Supplements — Multivitamins and minerals'}
            </a>
            <p className="text-xs text-[#252B29]/65 leading-relaxed">
              This independent reference explains the nutrient category. It is not an endorsement, product-specific clinical study, or replacement for medical advice.
            </p>
          </section>
        )}

        {/* Verified Reviews (Only shown if approved reviews exist) */}
        {productReviews.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
              Verified Customer Reviews ({productReviews.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {productReviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-2"
                >
                  <p className="text-xs font-semibold text-[#C7A46A]">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </p>
                  <p className="text-sm text-[#252B29]/85">{r.comment}</p>
                  <p className="text-xs font-medium text-[#174D40]">{r.authorName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-[#174D40]/12">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#174D40]">
              Also From BrainAxis
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
              {relatedProducts.slice(0, 2).map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};
