import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Instagram } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { FOUNDER_BIO_PARAGRAPHS, FOUNDER_VISION_TAGLINE } from '../content/founderBiography';

export const AboutPage: React.FC = () => {
  const { siteSettings } = useStore();
  const configuredFounderPhoto =
    siteSettings.founderPhotoUrl?.trim() ||
    `${import.meta.env.BASE_URL}assets/aistudio/founder-dr-muhammad-ali-hassan.webp`;
  // Preserve the existing cache-busting HD portrait and any custom CMS image URL.
  const founderPhotoUrl = configuredFounderPhoto.includes('/assets/aistudio/founder-dr-muhammad-ali-hassan.webp')
    ? `${configuredFounderPhoto.split('?')[0]}?v=founder-hd-20261120`
    : configuredFounderPhoto;
  const linkedInUrl =
    siteSettings.socialLinks?.linkedin?.trim() ||
    'https://www.linkedin.com/in/dr-muhammad-ali-hassan-5174b7287/';
  const instagramUrl =
    siteSettings.socialLinks?.instagram?.trim() ||
    'https://www.instagram.com/dr.ali.neurosurgeon/';

  return (
    <>
      <PageMeta
        title={`About Dr. Muhammad Ali Hassan — ${siteSettings.businessName}`}
        description="Meet Dr. Muhammad Ali Hassan, medical doctor, clinical researcher, aspiring neurosurgeon and founder of Dr. Ali Hassan Health & Wellness and BrainAxis."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <header className="space-y-4 border-b border-[#174D40]/12 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            About the Founder
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#174D40]">
            Dr. Muhammad Ali Hassan
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#174D40]/85 leading-relaxed">
            {FOUNDER_VISION_TAGLINE}
          </p>
        </header>

        <section className="grid md:grid-cols-12 gap-8 lg:gap-10 items-start" aria-labelledby="founder-heading">
          <div className="md:col-span-4">
            <div className="aspect-[4/5] bg-white border border-[#174D40]/15 rounded-2xl overflow-hidden shadow-sm">
              <img
                src={founderPhotoUrl}
                alt="Dr. Muhammad Ali Hassan, founder of Dr. Ali Hassan Health & Wellness and BrainAxis"
                className="w-full h-full object-cover object-top"
                loading="eager"
                decoding="async"
              />
            </div>
            <p className="mt-3 text-xs text-[#252B29]/65 text-center">
              Dr. Muhammad Ali Hassan · Founder
            </p>
          </div>

          <div className="md:col-span-8 space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A88649]">
                Medicine · Research · Innovation · Entrepreneurship
              </p>
              <h2 id="founder-heading" className="font-serif text-2xl sm:text-3xl font-semibold text-[#174D40]">
                Driven by Medicine and Innovation
              </h2>
            </div>
            {FOUNDER_BIO_PARAGRAPHS.slice(0, 2).map((paragraph, index) => (
              <p key={index} className="text-sm sm:text-base text-[#252B29]/85 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section aria-label="Full founder biography" className="space-y-5">
          {FOUNDER_BIO_PARAGRAPHS.slice(2).map((paragraph, index) => (
            <p key={index} className="text-sm sm:text-base text-[#252B29]/85 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="rounded-2xl border border-[#174D40]/15 bg-[#E8F1EB]/60 p-6 sm:p-8 text-center space-y-5" aria-label="Founder's vision">
          <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#174D40] leading-relaxed">
            {FOUNDER_VISION_TAGLINE}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3" aria-label="Dr. Ali's professional social profiles">
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#174D40]/20 bg-white px-5 py-3 text-sm font-semibold text-[#174D40] hover:bg-[#E8F1EB] transition-colors"
            >
              LinkedIn Profile <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#174D40]/20 bg-white px-5 py-3 text-sm font-semibold text-[#174D40] hover:bg-[#E8F1EB] transition-colors"
            >
              <Instagram className="w-4 h-4" aria-hidden="true" />
              Instagram Profile <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </section>

        <div className="text-center pt-2">
          <Link
            to="/shop"
            className="h-11 px-7 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center hover:bg-[#113A30]"
          >
            Explore BrainAxis Products
          </Link>
        </div>
      </div>
    </>
  );
};
