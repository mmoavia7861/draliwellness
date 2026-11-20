import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { HeroBannerSlide } from '../types';

export type { HeroBannerSlide };

const assetUrl = (url: string): string => `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`;

export const HERO_BANNER_SLIDES: HeroBannerSlide[] = [
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

  const slideCount = slides.length > 0 ? slides.length : HERO_BANNER_SLIDES.length;
  const effectiveSlides = slides.length > 0 ? slides : HERO_BANNER_SLIDES;
  const intervalMs = Math.min(60, Math.max(2, siteSettings.bannerIntervalSec || 5)) * 1000;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (activeIndex >= slideCount) {
      setActiveIndex(0);
    }
  }, [slideCount, activeIndex]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPaused, slideCount, activeIndex, intervalMs]);

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
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full bg-[#0E1311] border-b border-[#174D40]/15 overflow-hidden group"
    >
      <div className="relative w-full max-w-[1920px] mx-auto aspect-[3168/1344]">
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
                className="w-full h-full object-cover"
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
