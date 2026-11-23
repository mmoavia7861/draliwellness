import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Stethoscope,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { PageMeta } from '../components/PageMeta';
import { BrandLogo } from '../components/BrandLogo';
import { HeroBannerCarousel } from '../components/HeroBannerCarousel';
import { formatPkr } from '../utils/commerce';
import { FOUNDER_BIO_PARAGRAPHS, FOUNDER_VISION_TAGLINE } from '../content/founderBiography';

export const HomePage: React.FC = () => {
  const { liveProducts, siteSettings, services, reviews, journalPosts } = useStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const primaryProduct = liveProducts[0];
  const secondaryProduct = liveProducts[1];
  const approvedReviews = reviews.filter((r) => r.approved);
  const visibleServices = services.filter((s) => s.visible);
  const publishedPosts = journalPosts.filter((p) => p.published);

  const faqs = siteSettings.faqs ?? [];

  return (
    <>
      <PageMeta
        title={siteSettings.seoTitle || 'Dr. Ali Hassan Health & Wellness — BrainAxis Supplements'}
        description={
          siteSettings.seoDescription ||
          'Discover BrainAxis wellness supplements under Dr. Ali Hassan Health & Wellness. Shop Energy Boost and SUNDEX-D Vitamin D3.'
        }
      />

      {/* 0. Rotating Launch Banner Carousel (5s interval) */}
      <HeroBannerCarousel />

      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-[#E8F1EB]/70 via-[#FAF8F2] to-[#FAF8F2] border-b border-[#174D40]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#174D40]/80">
              BrainAxis by Dr. Ali Hassan Health &amp; Wellness
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#174D40] leading-[1.08] tracking-tight">
              {siteSettings.heroHeadline || 'Smarter Wellness Starts Here'}
            </h1>
            <p className="text-base sm:text-lg text-[#252B29]/80 leading-relaxed max-w-xl">
              {siteSettings.heroSubheadline ||
                'Discover premium wellness supplements by BrainAxis under Dr. Ali Hassan Health & Wellness.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/shop"
                className="h-12 px-7 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#113A30] transition-colors whitespace-nowrap"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#featured-products"
                className="h-12 px-6 rounded-lg border border-[#174D40]/25 bg-white text-[#174D40] text-sm font-semibold inline-flex items-center hover:bg-[#E8F1EB]/60 transition-colors whitespace-nowrap"
              >
                Explore Products
              </a>
            </div>

            <div className="pt-4 border-t border-[#174D40]/10 grid grid-cols-3 gap-4 text-xs text-[#252B29]/75">
              <div>
                <p className="font-semibold text-[#174D40]">Doctor-Led Line</p>
                <p className="mt-0.5">Transparent composition</p>
              </div>
              <div>
                <p className="font-semibold text-[#174D40]">Cash on Delivery</p>
                <p className="mt-0.5">Nationwide Pakistan</p>
              </div>
              <div>
                <p className="font-semibold text-[#174D40]">Direct Support</p>
                <p className="mt-0.5">WhatsApp &amp; Web Care</p>
              </div>
            </div>
          </div>

          {/* Dual Launch Product Showcase */}
          <div className="lg:col-span-6 grid sm:grid-cols-12 gap-4 items-stretch">
            {primaryProduct && (
              <Link
                to={`/product/${primaryProduct.slug}`}
                className="sm:col-span-6 bg-white border border-[#174D40]/12 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="h-52 sm:h-56 bg-[#F4F1EA] rounded-xl p-3 flex items-center justify-center overflow-hidden">
                  {primaryProduct.imageUrl && (
                    <img
                      src={primaryProduct.imageUrl}
                      alt={primaryProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#252B29]/60">
                    {primaryProduct.brand} · {primaryProduct.packSize || primaryProduct.format}
                  </p>
                  <h2 className="font-serif text-xl font-semibold text-[#252B29] leading-snug">
                    {primaryProduct.name}
                  </h2>
                  <p className="text-xs text-[#252B29]/70">{primaryProduct.subtitle || 'Once Daily Multivitamin'}</p>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
                    {typeof primaryProduct.compareAtPricePkr === 'number' &&
                      primaryProduct.compareAtPricePkr > primaryProduct.pricePkr && (
                        <span className="text-sm text-[#252B29]/55 line-through tabular-nums" aria-label="Original price">
                          {formatPkr(primaryProduct.compareAtPricePkr)}
                        </span>
                      )}
                    <span className="text-lg font-semibold text-[#174D40] tabular-nums" aria-label="Current price">
                      {formatPkr(primaryProduct.pricePkr)}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {secondaryProduct && (
              <Link
                to={`/product/${secondaryProduct.slug}`}
                className="sm:col-span-6 bg-white border border-[#174D40]/12 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="h-52 sm:h-56 bg-[#F4F1EA] rounded-xl p-3 flex items-center justify-center overflow-hidden">
                  {secondaryProduct.imageUrl && (
                    <img
                      src={secondaryProduct.imageUrl}
                      alt={secondaryProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#252B29]/60">
                    {secondaryProduct.brand} · {secondaryProduct.packSize || secondaryProduct.format}
                  </p>
                  <h2 className="font-serif text-xl font-semibold text-[#252B29] leading-snug">
                    BrainAxis SUNDEX-D®
                  </h2>
                  <p className="text-xs text-[#252B29]/70">Vitamin D3 200,000 IU</p>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
                    {typeof secondaryProduct.compareAtPricePkr === 'number' &&
                      secondaryProduct.compareAtPricePkr > secondaryProduct.pricePkr && (
                        <span className="text-sm text-[#252B29]/55 line-through tabular-nums" aria-label="Original price">
                          {formatPkr(secondaryProduct.compareAtPricePkr)}
                        </span>
                      )}
                    <span className="text-lg font-semibold text-[#174D40] tabular-nums" aria-label="Current price">
                      {formatPkr(secondaryProduct.pricePkr)}
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Featured Launch Products */}
      <section id="featured-products" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#174D40]/12 pb-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
                BrainAxis Launch Formulations
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
                Focused Daily &amp; Targeted Nutrition
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-sm font-semibold text-[#174D40] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div
            className={`grid gap-8 ${
              liveProducts.length <= 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {liveProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Product Benefits Comparison */}
      {liveProducts.length >= 2 && (
        <section className="py-14 bg-white border-y border-[#174D40]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
                Formulation Comparison
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#174D40]">
                Choosing Your BrainAxis Supplement
              </h2>
              <p className="text-sm text-[#252B29]/75">
                Compare everyday multivitamin support with high-potency Vitamin D3 supplementation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {liveProducts.slice(0, 2).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#FAF8F2] border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs text-[#252B29]/60">
                        {[prod.format, prod.packSize, prod.strength].filter(Boolean).join(' · ')}
                      </p>
                      <h3 className="font-serif text-2xl font-semibold text-[#174D40]">
                        {prod.name}
                      </h3>
                      <p className="text-sm text-[#252B29]/80">{prod.subtitle}</p>
                    </div>

                    <ul className="space-y-2.5 pt-2">
                      {(prod.benefits ?? []).map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-sm text-[#252B29]">
                          <CheckCircle2 className="w-4 h-4 text-[#174D40] shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#174D40]/10 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#252B29]/60 block">Usage</span>
                      <span className="text-sm font-medium text-[#252B29]">
                        {prod.usageSummary || prod.packSize}
                      </span>
                    </div>
                    <Link
                      to={`/product/${prod.slug}`}
                      className="h-10 px-4 rounded-lg bg-[#174D40] text-white text-sm font-medium inline-flex items-center gap-1.5 hover:bg-[#113A30] transition-colors whitespace-nowrap"
                    >
                      <span>Read Label</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Why Choose Us */}
      <section id="why-choose-us" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
              Standards &amp; Trust
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
              Why Choose Us
            </h2>
            <p className="text-sm sm:text-base text-[#252B29]/75">
              Explore BrainAxis supplements with clear product labeling, order tracking, and nationwide delivery across Pakistan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Stethoscope,
                title: 'Doctor-Led',
                desc: 'Curated under Dr. Ali Hassan with clear separation between daily multivitamin support and physician-guided high-dose Vitamin D3.',
              },
              {
                icon: ShieldCheck,
                title: 'Label & Safety Information',
                desc: 'Review the published supplement information, directions, storage and safety cautions. Confirm product-specific manufacturer and regulatory details on the actual packaging.',
              },
              {
                icon: Truck,
                title: 'Nationwide Delivery',
                desc: 'Dependable courier dispatch across Pakistan with Cash on Delivery and verification-protected online order tracking.',
              },
              {
                icon: MessageCircle,
                title: 'Customer Support',
                desc: 'Contact our support team for product details, orders, delivery questions, or help using the website.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-6 flex flex-col justify-between gap-4 hover:shadow-sm transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="w-11 h-11 rounded-xl bg-[#E8F1EB] text-[#174D40] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#252B29]">{item.title}</h3>
                    <p className="text-sm text-[#252B29]/75 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. About Dr. Ali Hassan */}
      <section className="py-16 bg-[#E8F1EB]/50 border-y border-[#174D40]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] max-w-sm mx-auto bg-white border border-[#174D40]/15 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center">
              {siteSettings.founderPhotoUrl ? (
                <img
                  src={siteSettings.founderPhotoUrl}
                  alt={siteSettings.founderName || 'Dr. Ali Hassan'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="space-y-5">
                  <BrandLogo
                    variant="founder"
                    theme="light"
                    title={siteSettings.founderName || 'Dr. Ali Hassan'}
                  />
                  <p className="text-xs text-[#252B29]/65">
                    Founder portrait configurable in Admin Dashboard
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
              Founder &amp; Brand Mission
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
              {siteSettings.founderName || 'Dr. Ali Hassan'}
            </h2>
            {siteSettings.founderTitle && (
              <p className="text-sm font-medium text-[#174D40]/85">{siteSettings.founderTitle}</p>
            )}
            <p className="text-base text-[#252B29]/80 leading-relaxed">
              {FOUNDER_BIO_PARAGRAPHS[0]}
            </p>
            <p className="text-sm text-[#252B29]/75 italic border-t border-[#174D40]/12 pt-4">
              “{FOUNDER_VISION_TAGLINE}”
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/about"
                className="h-11 px-6 rounded-lg border border-[#174D40] text-[#174D40] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#174D40] hover:text-white transition-colors"
              >
                <span>Read Our Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {siteSettings.socialLinks?.linkedin && (
                <a
                  href={siteSettings.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-lg border border-[#174D40]/25 bg-white text-[#174D40] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#E8F1EB] transition-colors"
                >
                  <span>LinkedIn Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Wellness Services Preview (Admin-Controlled) */}
      {visibleServices.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
                  Upcoming &amp; Active Services
                </p>
                <h2 className="font-serif text-3xl font-semibold text-[#174D40]">
                  Wellness &amp; Supplement Guidance
                </h2>
              </div>
              <Link
                to="/services"
                className="text-sm font-semibold text-[#174D40] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {visibleServices.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white border border-[#174D40]/12 rounded-xl p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#174D40]">
                      {svc.bookingEnabled ? 'Booking Open' : 'Coming Soon'} ·{' '}
                      {svc.durationMinutes || 30} min
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-[#252B29]">{svc.title}</h3>
                    <p className="text-sm text-[#252B29]/75 leading-relaxed">{svc.description}</p>
                  </div>
                  <Link
                    to="/services"
                    className="text-sm font-semibold text-[#174D40] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{svc.bookingEnabled ? 'Request Appointment' : 'View Service Info'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Customer Reviews (Hidden automatically if no real approved reviews exist) */}
      {approvedReviews.length > 0 && (
        <section className="py-16 bg-white border-t border-[#174D40]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
                Verified Customer Feedback
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#174D40]">
                What Customers Say
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {approvedReviews.slice(0, 6).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#FAF8F2] border border-[#174D40]/12 rounded-xl p-6 space-y-3"
                >
                  <p className="text-xs font-semibold text-[#C7A46A]">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </p>
                  <p className="text-sm text-[#252B29]/85 leading-relaxed">“{rev.comment}”</p>
                  <p className="text-xs font-semibold text-[#174D40]">{rev.authorName}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Health Journal Preview (Hidden automatically if no published posts exist) */}
      {publishedPosts.length > 0 && (
        <section className="py-16 border-t border-[#174D40]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
                  Educational Articles
                </p>
                <h2 className="font-serif text-3xl font-semibold text-[#174D40]">Health Journal</h2>
              </div>
              <Link to="/journal" className="text-sm font-semibold text-[#174D40] hover:underline">
                All Articles
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {publishedPosts.slice(0, 3).map((post) => (
                <Link
                  key={post.id}
                  to="/journal"
                  className="bg-white border border-[#174D40]/12 rounded-xl p-6 space-y-2 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-[#252B29]/60">{post.category}</p>
                  <h3 className="font-serif text-xl font-semibold text-[#252B29]">{post.title}</h3>
                  {post.summary && (
                    <p className="text-sm text-[#252B29]/75 line-clamp-2">{post.summary}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. FAQ Preview */}
      {faqs.length > 0 && (
        <section className="py-16 bg-white border-t border-[#174D40]/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
                Common Questions
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#174D40]">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="divide-y divide-[#174D40]/12 border border-[#174D40]/12 rounded-2xl bg-[#FAF8F2] overflow-hidden">
              {faqs.slice(0, 5).map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#E8F1EB]/40 transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-semibold text-[#252B29]">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#174D40] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-[#252B29]/80 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                to="/faq"
                className="text-sm font-semibold text-[#174D40] hover:underline inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>View All FAQs &amp; Order Guidance</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
