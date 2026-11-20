import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';

export const FaqPage: React.FC = () => {
  const { siteSettings } = useStore();
  const faqs = siteSettings.faqs ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <PageMeta
        title={`Frequently Asked Questions — ${siteSettings.businessName}`}
        description="Answers on ordering BrainAxis supplements, Cash on Delivery, nationwide shipping, and dosage guidance."
        jsonLd={faqJsonLd}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-[#174D40]/12 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Help Center
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="divide-y divide-[#174D40]/12 border border-[#174D40]/12 rounded-2xl bg-white overflow-hidden">
          {faqs.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#FAF8F2] cursor-pointer"
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
      </div>
    </>
  );
};
