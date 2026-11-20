import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Stethoscope } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { BrandLogo } from '../components/BrandLogo';

export const AboutPage: React.FC = () => {
  const { siteSettings } = useStore();

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

        <section className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5">
            <div className="aspect-[4/5] bg-white border border-[#174D40]/15 rounded-2xl overflow-hidden flex items-center justify-center p-6 text-center">
              {siteSettings.founderPhotoUrl ? (
                <img
                  src={siteSettings.founderPhotoUrl}
                  alt={siteSettings.founderName || 'Dr. Ali Hassan'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="space-y-4">
                  <BrandLogo
                    variant="founder"
                    theme="light"
                    title={siteSettings.founderName || 'Dr. Ali Hassan'}
                  />
                  <p className="text-xs text-[#252B29]/65">{siteSettings.founderTitle}</p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7 space-y-5">
            <h2 className="font-serif text-3xl font-semibold text-[#174D40]">
              {siteSettings.founderName || 'Dr. Ali Hassan'}
            </h2>
            <p className="text-sm sm:text-base text-[#252B29]/85 leading-relaxed whitespace-pre-line">
              {siteSettings.founderBio}
            </p>
            {siteSettings.founderMission && (
              <div className="bg-[#E8F1EB]/60 border border-[#174D40]/15 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#174D40] mb-1">
                  Mission
                </p>
                <p className="text-sm text-[#252B29]/85 leading-relaxed">
                  {siteSettings.founderMission}
                </p>
              </div>
            )}
            {siteSettings.socialLinks?.linkedin && (
              <div className="pt-1">
                <a
                  href={siteSettings.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#174D40] hover:underline"
                >
                  <span>View LinkedIn Profile</span>
                </a>
              </div>
            )}
          </div>
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
