import React from 'react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import type { SitePolicies } from '../types';

interface PolicyPageProps {
  policyKey: keyof SitePolicies;
  title: string;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ policyKey, title }) => {
  const { siteSettings } = useStore();
  const body = siteSettings.policies?.[policyKey] ?? '';

  return (
    <>
      <PageMeta
        title={`${title} — ${siteSettings.businessName}`}
        description={`${title} for ${siteSettings.businessName}.`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="space-y-2 border-b border-[#174D40]/12 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Store Policies
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">{title}</h1>
        </div>
        <div className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-10 space-y-4 text-sm sm:text-base text-[#252B29]/85 leading-relaxed whitespace-pre-line">
          {body}
          {siteSettings.policies?.supplementDisclaimer && (
            <div className="pt-6 border-t border-[#174D40]/10 text-xs text-[#252B29]/70">
              <strong>Supplement Disclaimer:</strong>{' '}
              {siteSettings.policies.supplementDisclaimer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
