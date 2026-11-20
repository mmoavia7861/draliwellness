import type {
  FaqItem,
  HeroBannerSlide,
  NewsletterSubscriber,
  SitePolicies,
  SiteSettings,
  SocialLinks,
} from '../types';

const DEFAULT_POLICIES: SitePolicies = {
  privacyPolicy: '',
  termsAndConditions: '',
  shippingPolicy: '',
  refundPolicy: '',
  supplementDisclaimer: '',
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function clampString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function sanitizeSiteSettingsForFirestore(settings: SiteSettings): Omit<SiteSettings, 'updatedAt'> {
  const businessName =
    clampString(settings.businessName, 160) || 'Dr. Ali Hassan Health & Wellness';

  const banners: HeroBannerSlide[] = (Array.isArray(settings.banners) ? settings.banners : [])
    .slice(0, 12)
    .map((b, idx) => ({
      id: clampString(b?.id, 64) || `banner-${idx + 1}`,
      imageUrl: clampString(b?.imageUrl, 600),
      alt: clampString(b?.alt, 200),
      to: clampString(b?.to, 160) || '/shop',
    }))
    .filter((b) => Boolean(b.imageUrl));

  const faqs: FaqItem[] = (Array.isArray(settings.faqs) ? settings.faqs : [])
    .slice(0, 20)
    .map((f) => ({
      question: clampString(f?.question, 240),
      answer: clampString(f?.answer, 1200),
    }))
    .filter((f) => f.question.length > 0 && f.answer.length > 0);

  const rawPolicies = settings.policies ?? DEFAULT_POLICIES;
  const policies: SitePolicies = {
    privacyPolicy: clampString(rawPolicies.privacyPolicy, 6000),
    termsAndConditions: clampString(rawPolicies.termsAndConditions, 6000),
    shippingPolicy: clampString(rawPolicies.shippingPolicy, 6000),
    refundPolicy: clampString(rawPolicies.refundPolicy, 6000),
    supplementDisclaimer: clampString(rawPolicies.supplementDisclaimer, 4000),
  };

  const rawSocial = settings.socialLinks ?? {};
  const socialLinks: SocialLinks = {
    instagram: clampString(rawSocial.instagram, 240),
    facebook: clampString(rawSocial.facebook, 240),
    youtube: clampString(rawSocial.youtube, 240),
    linkedin: clampString(rawSocial.linkedin, 240),
  };

  return {
    id: 'main',
    businessName,
    supplementBrandName: clampString(settings.supplementBrandName, 80),
    tagline: clampString(settings.tagline, 200),
    announcementEnabled: Boolean(settings.announcementEnabled),
    announcementText: clampString(settings.announcementText, 240),
    heroHeadline: clampString(settings.heroHeadline, 200),
    heroSubheadline: clampString(settings.heroSubheadline, 400),
    banners,
    bannerIntervalSec: clampNumber(settings.bannerIntervalSec, 5, 2, 60),
    founderName: clampString(settings.founderName, 120),
    founderTitle: clampString(settings.founderTitle, 120),
    founderPhotoUrl: clampString(settings.founderPhotoUrl, 600),
    founderBio: clampString(settings.founderBio, 3000),
    founderMission: clampString(settings.founderMission, 1000),
    whatsappNumber: clampString(settings.whatsappNumber, 32),
    whatsappGreeting: clampString(settings.whatsappGreeting, 300),
    supportEmail: clampString(settings.supportEmail, 120),
    supportHours: clampString(settings.supportHours, 160),
    shippingFeePkr: clampNumber(settings.shippingFeePkr, 250, 0, 50000),
    freeShippingThresholdPkr: clampNumber(settings.freeShippingThresholdPkr, 3000, 0, 500000),
    codEnabled: settings.codEnabled !== false,
    onlinePaymentsEnabled: Boolean(settings.onlinePaymentsEnabled),
    faqs,
    policies,
    socialLinks,
    seoTitle: clampString(settings.seoTitle, 160),
    seoDescription: clampString(settings.seoDescription, 320),
  };
}

export function sanitizeAdminMemberInput(input: {
  uid: string;
  email: string;
  role: 'super_admin' | 'editor';
}): { uid: string; email: string; role: 'super_admin' | 'editor' } {
  const uid = input.uid.trim();
  const email = input.email.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
    throw new Error('Firebase UID must be 1–128 alphanumeric, underscore, or hyphen characters.');
  }
  if (email.length < 3 || email.length > 160 || !email.includes('@')) {
    throw new Error('Please enter a valid administrator email address.');
  }
  const role: 'super_admin' | 'editor' =
    input.role === 'super_admin' ? 'super_admin' : 'editor';

  return { uid, email, role };
}

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

export function formatSubscribersCsv(subscribers: NewsletterSubscriber[]): string {
  const header = ['id', 'email', 'consent'].map(escapeCsvCell).join(',');
  const rows = subscribers.map((sub) =>
    [sub.id || '', sub.email || '', String(Boolean(sub.consent))]
      .map(escapeCsvCell)
      .join(',')
  );
  return [header, ...rows].join('\n');
}
