import React from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, ExternalLink, GraduationCap, Instagram, ShieldCheck, Stethoscope } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';

export const AboutPage: React.FC = () => {
  const { siteSettings } = useStore();
  const configuredFounderPhoto =
    siteSettings.founderPhotoUrl?.trim() ||
    `${import.meta.env.BASE_URL}assets/aistudio/founder-dr-muhammad-ali-hassan.webp`;
  // Bust caches only for the locally hosted portrait replaced with the HD original.
  // A founder portrait uploaded through CMS keeps its unique Firebase Storage URL.
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
        title={`About Us — ${siteSettings.businessName}`}
        description="Learn about Dr. Ali Hassan Health & Wellness and the BrainAxis supplement brand philosophy."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        <header className="space-y-4 border-b border-[#174D40]/12 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Our Brand &amp; Leadership
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#174D40]">
            About {siteSettings.businessName}
          </h1>
          <p className="text-base sm:text-lg text-[#252B29]/80 leading-relaxed max-w-3xl">
            {siteSettings.tagline}
          </p>
        </header>

        <section className="grid md:grid-cols-12 gap-10 items-center" aria-labelledby="founder-heading">
          <div className="md:col-span-5">
            <div className="aspect-square bg-white border border-[#174D40]/15 rounded-2xl overflow-hidden shadow-sm">
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

          <div className="md:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A88649]">
              Meet the Founder
            </p>
            <h2 id="founder-heading" className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
              Dr. Muhammad Ali Hassan
            </h2>
            <p className="text-sm font-semibold text-[#174D40]">
              Founder — Dr. Ali Hassan Health &amp; Wellness &amp; BrainAxis
            </p>
            <p className="text-sm sm:text-base text-[#252B29]/85 leading-relaxed">
              Dr. Muhammad Ali Hassan is a Pakistan-based medical researcher whose professional interests
              include neurosurgery, clinical research and research collaboration. His publicly listed
              LinkedIn profile describes his pursuit of a surgeon-scientist career and highlights
              academic research and professional engagement.
            </p>
            <p className="text-sm sm:text-base text-[#252B29]/85 leading-relaxed">
              His profile lists studies at Shifa Tameer-e-Millat University (2019–2024), an association
              with the Pakistan Academy of Neurological Surgery (PANS), research publications and
              conference presentations. He also lists the Dr. Syed Qamar Alam Research Gold Medal,
              awarded in March 2025 for excellence in research.
            </p>
            <p className="text-sm sm:text-base text-[#252B29]/85 leading-relaxed whitespace-pre-line">
              {siteSettings.founderBio}
            </p>
            {siteSettings.founderMission && (
              <div className="bg-[#E8F1EB]/60 border border-[#174D40]/15 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#174D40] mb-1">
                  Our Mission
                </p>
                <p className="text-sm text-[#252B29]/85 leading-relaxed">
                  {siteSettings.founderMission}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3" aria-label="Dr. Ali's professional social profiles">
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#174D40]/20 px-5 py-3 text-sm font-semibold text-[#174D40] hover:bg-[#E8F1EB] transition-colors"
              >
                LinkedIn Profile
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#174D40]/20 px-5 py-3 text-sm font-semibold text-[#174D40] hover:bg-[#E8F1EB] transition-colors"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
                Instagram Profile
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-4" aria-label="Founder's professional background">
          <div className="rounded-2xl border border-[#174D40]/12 bg-white p-5 space-y-2">
            <GraduationCap className="w-6 h-6 text-[#A88649]" aria-hidden="true" />
            <h3 className="font-semibold text-[#174D40]">Medical Education</h3>
            <p className="text-sm text-[#252B29]/80">Shifa Tameer-e-Millat University · 2019–2024</p>
          </div>
          <div className="rounded-2xl border border-[#174D40]/12 bg-white p-5 space-y-2">
            <BookOpen className="w-6 h-6 text-[#A88649]" aria-hidden="true" />
            <h3 className="font-semibold text-[#174D40]">Research &amp; Mentoring</h3>
            <p className="text-sm text-[#252B29]/80">Research publications, conference activity and PANS engagement</p>
          </div>
          <div className="rounded-2xl border border-[#174D40]/12 bg-white p-5 space-y-2">
            <Award className="w-6 h-6 text-[#A88649]" aria-hidden="true" />
            <h3 className="font-semibold text-[#174D40]">Research Recognition</h3>
            <p className="text-sm text-[#252B29]/80">Dr. Syed Qamar Alam Research Gold Medal · March 2025</p>
          </div>
          <p className="sm:col-span-3 text-xs text-[#252B29]/65">
            Professional details are based on the founder's public LinkedIn profile.
            They do not constitute clinical evidence of the effectiveness of any supplement.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-3">
            <Stethoscope className="w-6 h-6 text-[#174D40]" />
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
              The BrainAxis Line
            </h2>
            <p className="text-sm text-[#252B29]/80 leading-relaxed">
              BrainAxis is our dedicated supplement range launched with two focused formulations: BrainAxis Energy Boost for everyday multivitamin support, and BrainAxis SUNDEX-D 200,000 IU softgel capsules for physician-advised Vitamin D3 restoration.
            </p>
          </div>

          <div className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-3">
            <ShieldCheck className="w-6 h-6 text-[#174D40]" />
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
              Responsible Information
            </h2>
            <p className="text-sm text-[#252B29]/80 leading-relaxed">
              We publish exact packaging details, storage guidelines, and caution statements on every product page without exaggerated claims or fabricated testimonials.
            </p>
          </div>
        </section>

        <div className="text-center pt-4">
          <Link
            to="/shop"
            className="h-11 px-7 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center hover:bg-[#113A30]"
          >
            Explore Launch Products
          </Link>
        </div>
      </div>
    </>
  );
};
