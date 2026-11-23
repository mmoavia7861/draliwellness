import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSubscribersCsv,
  sanitizeAdminMemberInput,
  sanitizeSiteSettingsForFirestore,
} from './admin';
import { LAUNCH_SITE_SETTINGS } from '../data/launchCatalog';

test('sanitizeSiteSettingsForFirestore enforces rule whitelist and bounds', () => {
  const dirty = {
    ...LAUNCH_SITE_SETTINGS,
    businessName: '   ',
    bannerIntervalSec: 120,
    shippingFeePkr: -50,
    freeShippingThresholdPkr: 9999999,
    banners: Array.from({ length: 15 }, (_, i) => ({
      id: `b-${i}`,
      imageUrl: i === 1 ? '' : `/assets/banner-${i}.jpg`,
      alt: `Banner ${i}`,
      to: '/shop',
    })),
    faqs: [
      { question: 'Valid Q?', answer: 'Valid A.' },
      { question: '', answer: 'Missing question' },
    ],
  };

  const clean = sanitizeSiteSettingsForFirestore(dirty);
  assert.equal(clean.id, 'main');
  assert.equal(clean.businessName, 'Dr. Ali Hassan Health & Wellness');
  assert.equal(clean.bannerIntervalSec, 60);
  assert.equal(clean.shippingFeePkr, 0);
  assert.equal(clean.freeShippingThresholdPkr, 0);
  assert.equal(clean.banners?.length, 11);
  assert.equal(clean.faqs?.length, 1);
  assert.equal(clean.faqs?.[0]?.question, 'Valid Q?');
});

test('sanitizeAdminMemberInput validates uid, email, and role', () => {
  const valid = sanitizeAdminMemberInput({
    uid: 'user_123-abc',
    email: 'Admin@Example.com ',
    role: 'super_admin',
  });
  assert.deepEqual(valid, {
    uid: 'user_123-abc',
    email: 'admin@example.com',
    role: 'super_admin',
  });

  assert.throws(
    () =>
      sanitizeAdminMemberInput({
        uid: 'bad uid with spaces',
        email: 'admin@example.com',
        role: 'editor',
      }),
    /Firebase UID/
  );

  assert.throws(
    () =>
      sanitizeAdminMemberInput({
        uid: 'valid_uid_1',
        email: 'not-an-email',
        role: 'editor',
      }),
    /email/
  );
});

test('formatSubscribersCsv safely quotes fields', () => {
  const csv = formatSubscribersCsv([
    { id: 'sub-1', email: 'test@example.com', consent: true },
    { id: 'sub-2', email: 'quoted"user@example.com', consent: true },
  ]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"id","email","consent"');
  assert.equal(lines[1], '"sub-1","test@example.com","true"');
  assert.equal(lines[2], '"sub-2","quoted""user@example.com","true"');
});
