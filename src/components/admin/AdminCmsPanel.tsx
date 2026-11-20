import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { SitePolicies, SiteSettings } from '../../types';

interface AdminCmsPanelProps {
  cmsDraft: SiteSettings;
  setCmsDraft: React.Dispatch<React.SetStateAction<SiteSettings>>;
  onSave: (settings: SiteSettings) => Promise<void>;
}

const DEFAULT_POLICIES: SitePolicies = {
  privacyPolicy: '',
  termsAndConditions: '',
  shippingPolicy: '',
  refundPolicy: '',
  supplementDisclaimer: '',
};

export const AdminCmsPanel: React.FC<AdminCmsPanelProps> = ({
  cmsDraft,
  setCmsDraft,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const banners = cmsDraft.banners ?? [];
  const faqs = cmsDraft.faqs ?? [];
  const policies = cmsDraft.policies ?? DEFAULT_POLICIES;

  const updatePolicy = (key: keyof SitePolicies, value: string) => {
    setCmsDraft({
      ...cmsDraft,
      policies: {
        ...policies,
        [key]: value,
      },
    });
  };

  const moveBanner = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setCmsDraft({ ...cmsDraft, banners: next });
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
          await onSave(cmsDraft);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to save website settings.');
        } finally {
          setSaving(false);
        }
      }}
      className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-8 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#174D40]/10 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
            Complete Storefront CMS, Banners, FAQs &amp; Policies
          </h2>
          <p className="text-xs text-[#252B29]/70 mt-1">
            Control hero banners, rotation timing, announcement bar, founder story, payments, shipping, FAQs, and store policies.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-6 rounded-lg bg-[#174D40] text-white text-xs font-semibold hover:bg-[#113A30] disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save All CMS Changes'}
        </button>
      </div>

      {error && (
        <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* 1. Branding & Announcement */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
          1. Store Branding &amp; Announcement Bar
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Business Name</label>
            <input
              type="text"
              required
              value={cmsDraft.businessName}
              onChange={(e) => setCmsDraft({ ...cmsDraft, businessName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Supplement Brand Name</label>
            <input
              type="text"
              value={cmsDraft.supplementBrandName || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, supplementBrandName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Tagline</label>
            <input
              type="text"
              value={cmsDraft.tagline || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, tagline: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-12 gap-4 items-center bg-[#FAF8F2] p-4 rounded-xl border border-[#174D40]/10">
          <label className="sm:col-span-4 flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={cmsDraft.announcementEnabled !== false}
              onChange={(e) =>
                setCmsDraft({ ...cmsDraft, announcementEnabled: e.target.checked })
              }
            />
            <span>Show Top Announcement Bar</span>
          </label>
          <div className="sm:col-span-8 space-y-1">
            <label className="text-xs font-semibold">Announcement Bar Text</label>
            <input
              type="text"
              value={cmsDraft.announcementText || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, announcementText: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
            />
          </div>
        </div>
      </section>

      {/* 2. Hero Text & Rotating Banners */}
      <section className="space-y-4 border-t border-[#174D40]/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
            2. Hero Copy &amp; Rotating Banners
          </h3>
          <button
            type="button"
            disabled={banners.length >= 12}
            onClick={() =>
              setCmsDraft({
                ...cmsDraft,
                banners: [
                  ...banners,
                  {
                    id: `banner-${Date.now()}`,
                    imageUrl: '/assets/aistudio/image_7b6ef45b.png',
                    alt: 'Promotional wellness banner',
                    to: '/shop',
                  },
                ],
              })
            }
            className="h-9 px-3 rounded-lg border border-[#174D40]/25 text-xs font-semibold text-[#174D40] inline-flex items-center gap-1 hover:bg-[#E8F1EB] disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Banner Slide
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Hero Headline</label>
            <input
              type="text"
              value={cmsDraft.heroHeadline || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, heroHeadline: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Hero Subheadline</label>
            <input
              type="text"
              value={cmsDraft.heroSubheadline || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, heroSubheadline: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Banner Rotation Interval (seconds, 2–60)</label>
            <input
              type="number"
              min={2}
              max={60}
              value={cmsDraft.bannerIntervalSec ?? 5}
              onChange={(e) =>
                setCmsDraft({ ...cmsDraft, bannerIntervalSec: Number(e.target.value) || 5 })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-3">
          {banners.length === 0 ? (
            <p className="text-xs text-[#252B29]/65">
              No custom banners configured (default launch banners will be shown).
            </p>
          ) : (
            banners.map((banner, idx) => (
              <div
                key={banner.id || idx}
                className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#174D40]/12 grid sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[11px] font-semibold">Image URL / Asset Path</label>
                  <input
                    type="text"
                    value={banner.imageUrl}
                    onChange={(e) => {
                      const next = [...banners];
                      next[idx] = { ...banner, imageUrl: e.target.value };
                      setCmsDraft({ ...cmsDraft, banners: next });
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-semibold">Alt Description</label>
                  <input
                    type="text"
                    value={banner.alt}
                    onChange={(e) => {
                      const next = [...banners];
                      next[idx] = { ...banner, alt: e.target.value };
                      setCmsDraft({ ...cmsDraft, banners: next });
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold">Link Route</label>
                  <input
                    type="text"
                    value={banner.to}
                    placeholder="/shop"
                    onChange={(e) => {
                      const next = [...banners];
                      next[idx] = { ...banner, to: e.target.value };
                      setCmsDraft({ ...cmsDraft, banners: next });
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-white text-xs"
                  />
                </div>
                <div className="sm:col-span-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => moveBanner(idx, -1)}
                    aria-label={`Move banner ${idx + 1} up`}
                    className="p-1.5 rounded hover:bg-[#E8F1EB] text-[#174D40] cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBanner(idx, 1)}
                    aria-label={`Move banner ${idx + 1} down`}
                    className="p-1.5 rounded hover:bg-[#E8F1EB] text-[#174D40] cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCmsDraft({
                        ...cmsDraft,
                        banners: banners.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label={`Delete banner ${idx + 1}`}
                    className="p-1.5 rounded hover:bg-red-50 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. Commerce, Shipping & Payment Methods */}
      <section className="space-y-4 border-t border-[#174D40]/10 pt-6">
        <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
          3. Commerce, Shipping &amp; Payment Options
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Standard Shipping Fee (PKR)</label>
            <input
              type="number"
              min={0}
              value={cmsDraft.shippingFeePkr}
              onChange={(e) =>
                setCmsDraft({ ...cmsDraft, shippingFeePkr: Number(e.target.value) || 0 })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Free Shipping Threshold (PKR)</label>
            <input
              type="number"
              min={0}
              value={cmsDraft.freeShippingThresholdPkr}
              onChange={(e) =>
                setCmsDraft({
                  ...cmsDraft,
                  freeShippingThresholdPkr: Number(e.target.value) || 0,
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] tabular-nums"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={cmsDraft.codEnabled !== false}
              onChange={(e) => setCmsDraft({ ...cmsDraft, codEnabled: e.target.checked })}
            />
            <span>Cash on Delivery (COD) Enabled</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={Boolean(cmsDraft.onlinePaymentsEnabled)}
              onChange={(e) =>
                setCmsDraft({ ...cmsDraft, onlinePaymentsEnabled: e.target.checked })
              }
            />
            <span>Online Payments Enabled</span>
          </label>
        </div>
      </section>

      {/* 4. Founder & Mission */}
      <section className="space-y-4 border-t border-[#174D40]/10 pt-6">
        <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
          4. Founder &amp; Brand Mission
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Founder Name</label>
            <input
              type="text"
              value={cmsDraft.founderName || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, founderName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Founder Title</label>
            <input
              type="text"
              value={cmsDraft.founderTitle || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, founderTitle: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Founder Portrait URL</label>
            <input
              type="text"
              value={cmsDraft.founderPhotoUrl || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, founderPhotoUrl: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-semibold">Founder Biography</label>
            <textarea
              rows={3}
              value={cmsDraft.founderBio || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, founderBio: e.target.value })}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <label className="text-xs font-semibold">Brand Mission Statement</label>
            <textarea
              rows={2}
              value={cmsDraft.founderMission || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, founderMission: e.target.value })}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
        </div>
      </section>

      {/* 5. Support, Social Links & SEO */}
      <section className="space-y-4 border-t border-[#174D40]/10 pt-6">
        <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
          5. Support Contact, Social Channels &amp; SEO
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">WhatsApp Number</label>
            <input
              type="text"
              value={cmsDraft.whatsappNumber || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, whatsappNumber: e.target.value })}
              placeholder="923001234567"
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">WhatsApp Default Greeting</label>
            <input
              type="text"
              value={cmsDraft.whatsappGreeting || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, whatsappGreeting: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Support Email</label>
            <input
              type="email"
              value={cmsDraft.supportEmail || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, supportEmail: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Support Hours</label>
            <input
              type="text"
              value={cmsDraft.supportHours || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, supportHours: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">LinkedIn URL</label>
            <input
              type="url"
              value={cmsDraft.socialLinks?.linkedin || ''}
              onChange={(e) =>
                setCmsDraft({
                  ...cmsDraft,
                  socialLinks: { ...(cmsDraft.socialLinks || {}), linkedin: e.target.value },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Instagram URL</label>
            <input
              type="url"
              value={cmsDraft.socialLinks?.instagram || ''}
              onChange={(e) =>
                setCmsDraft({
                  ...cmsDraft,
                  socialLinks: { ...(cmsDraft.socialLinks || {}), instagram: e.target.value },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Facebook URL</label>
            <input
              type="url"
              value={cmsDraft.socialLinks?.facebook || ''}
              onChange={(e) =>
                setCmsDraft({
                  ...cmsDraft,
                  socialLinks: { ...(cmsDraft.socialLinks || {}), facebook: e.target.value },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">YouTube URL</label>
            <input
              type="url"
              value={cmsDraft.socialLinks?.youtube || ''}
              onChange={(e) =>
                setCmsDraft({
                  ...cmsDraft,
                  socialLinks: { ...(cmsDraft.socialLinks || {}), youtube: e.target.value },
                })
              }
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold">SEO Meta Title</label>
            <input
              type="text"
              value={cmsDraft.seoTitle || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, seoTitle: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold">SEO Meta Description</label>
            <input
              type="text"
              value={cmsDraft.seoDescription || ''}
              onChange={(e) => setCmsDraft({ ...cmsDraft, seoDescription: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
            />
          </div>
        </div>
      </section>

      {/* 6. Storefront FAQs */}
      <section className="space-y-4 border-t border-[#174D40]/10 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
            6. Storefront FAQs ({faqs.length}/20)
          </h3>
          <button
            type="button"
            disabled={faqs.length >= 20}
            onClick={() =>
              setCmsDraft({ ...cmsDraft, faqs: [...faqs, { question: '', answer: '' }] })
            }
            className="h-9 px-3 rounded-lg border border-[#174D40]/25 text-xs font-semibold text-[#174D40] inline-flex items-center gap-1 hover:bg-[#E8F1EB] disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </button>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#FAF8F2] border border-[#174D40]/12 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...faqs];
                    next[idx] = { ...faq, question: e.target.value };
                    setCmsDraft({ ...cmsDraft, faqs: next });
                  }}
                  className="flex-1 h-9 px-3 rounded-lg border border-[#174D40]/20 bg-white text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCmsDraft({ ...cmsDraft, faqs: faqs.filter((_, i) => i !== idx) })
                  }
                  aria-label={`Delete FAQ ${idx + 1}`}
                  className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) => {
                  const next = [...faqs];
                  next[idx] = { ...faq, answer: e.target.value };
                  setCmsDraft({ ...cmsDraft, faqs: next });
                }}
                className="w-full p-2.5 rounded-lg border border-[#174D40]/20 bg-white text-xs"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 7. Legal & Store Policies */}
      <section className="space-y-4 border-t border-[#174D40]/10 pt-6">
        <h3 className="text-sm font-semibold text-[#174D40] uppercase tracking-wider">
          7. Legal &amp; Storefront Policies
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Privacy Policy</label>
            <textarea
              rows={3}
              value={policies.privacyPolicy}
              onChange={(e) => updatePolicy('privacyPolicy', e.target.value)}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Terms &amp; Conditions</label>
            <textarea
              rows={3}
              value={policies.termsAndConditions}
              onChange={(e) => updatePolicy('termsAndConditions', e.target.value)}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Shipping Policy</label>
            <textarea
              rows={3}
              value={policies.shippingPolicy}
              onChange={(e) => updatePolicy('shippingPolicy', e.target.value)}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Refund &amp; Return Policy</label>
            <textarea
              rows={3}
              value={policies.refundPolicy}
              onChange={(e) => updatePolicy('refundPolicy', e.target.value)}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold">Supplement Medical Disclaimer</label>
            <textarea
              rows={2}
              value={policies.supplementDisclaimer}
              onChange={(e) => updatePolicy('supplementDisclaimer', e.target.value)}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
            />
          </div>
        </div>
      </section>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold hover:bg-[#113A30] disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save All CMS Changes'}
        </button>
      </div>
    </form>
  );
};
