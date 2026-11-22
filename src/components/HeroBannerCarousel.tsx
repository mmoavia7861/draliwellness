import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { HeroBannerSlide } from '../types';

export type { HeroBannerSlide };

const assetUrl = (url: string): string => `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`;

const FEATURED_ENERGY_BOOST_BANNER: HeroBannerSlide = {
  id: 'brainaxis-energy-boost-hero-2026',
  imageUrl: assetUrl('/assets/aistudio/brainaxis-energyboost-hd-20261122.webp'),
  alt: 'BrainAxis Energy Boost — premium multivitamin and mineral formula, Dr. Ali Hassan Health & Wellness hero banner',
  to: '/product/brainaxis-energy-boost',
};

export const HERO_BANNER_SLIDES: HeroBannerSlide[] = [
  FEATURED_ENERGY_BOOST_BANNER,
  {
    id: 'sundex-d-podium',
    imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_a7r5pra7r5pra7r5__2__b6276b6b.jpg'),
    alt: 'BrainAxis SUNDEX-D Vitamin D3 200,000 IU softgel capsule showcase banner',
    to: '/product/brainaxis-sundex-d',
  },
  {
    id: 'sundex-d-lifestyle',
    imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_a7r5pra7r5pra7r5__1__8f069b03.jpg'),
    alt: 'BrainAxis SUNDEX-D Stronger Bones & Immunity Vitamin D3 200,000 IU banner',
    to: '/product/brainaxis-sundex-d',
  },
  {
    id: 'energy-boost-lifestyle',
    imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_p04fcqp04fcqp04f_05bd9bbc.jpg'),
    alt: 'BrainAxis Energy Boost Complete Daily Nutrition 30 Tablets banner',
    to: '/product/brainaxis-energy-boost',
  },
  {
    id: 'energy-boost-podium',
    imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_h6gfxgh6gfxgh6gf_69a909aa.jpg'),
    alt: 'BrainAxis Energy Boost Premium Multivitamin & Mineral Formula showcase banner',
    to: '/product/brainaxis-energy-boost',
  },
];

export const HeroBannerCarousel: React.FC = () => {
  const { siteSettings } = useStore();
  const slides =
    Array.isArray(siteSettings.banners) && siteSettings.banners.length > 0
      ? siteSettings.banners.filter((b) => Boolean(b.imageUrl))
      : HERO_BANNER_SLIDES;

  // Keep admin-uploaded replacements, but recover the requested featured
  // banner when Firestore still holds an older, retired image URL.
  const [unavailableImages, setUnavailableImages] = useState<string[]>([]);
  const isRetiredBanner = (url: string) =>
    url.includes('brainaxis-energy-boost-hero-banner.webp') ||
    url.includes('brainaxis-energy-boost-hero-20261122.png') ||
    url.includes('brainaxis-energy-boost-owner-banner-20261122.avif');
  const savedFeatured = slides.find((slide) => slide.id === FEATURED_ENERGY_BOOST_BANNER.id);
  const featuredSlide = savedFeatured && !isRetiredBanner(savedFeatured.imageUrl)
    ? savedFeatured
    : FEATURED_ENERGY_BOOST_BANNER;
  const effectiveSlides = [
    featuredSlide,
    ...slides.filter((slide) =>
      slide.id !== FEATURED_ENERGY_BOOST_BANNER.id &&
      Boolean(slide.imageUrl) &&
      !isRetiredBanner(slide.imageUrl)
    ),
  ].filter((slide) => !unavailableImages.includes(slide.imageUrl));
  const slideCount = effectiveSlides.length;

  // Exactly five seconds per banner, including when the mouse is over the image.
  const intervalMs = 5_000;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= slideCount) {
      setActiveIndex(0);
    }
  }, [slideCount, activeIndex]);

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [slideCount, intervalMs]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % slideCount);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="BrainAxis Featured Banners"
      data-active-slide={activeIndex}
      data-rotation-ms={intervalMs}
      className="relative w-full bg-[#0E1311] border-b border-[#174D40]/15 overflow-hidden group"
    >
      <div className="relative w-full max-w-[1920px] mx-auto aspect-[2/1]">
        {effectiveSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={slide.id}
              to={slide.to || '/shop'}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className={`absolute inset-0 block w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.alt || 'BrainAxis featured banner'}
                referrerPolicy="no-referrer"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                className="relative w-full h-full object-contain"
                onError={() => setUnavailableImages((previous) =>
                  previous.includes(slide.imageUrl) ? previous : [...previous, slide.imageUrl]
                )}
              />
            </Link>
          );
        })}

        {slideCount > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous banner"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next banner"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div
              className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-[2px]"
              role="tablist"
              aria-label="Select featured banner"
            >
              {effectiveSlides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Banner ${index + 1} of ${slideCount}`}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive ? 'w-6 bg-[#C7A46A]' : 'w-2 bg-white/60 hover:bg-white'
                    }`}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
