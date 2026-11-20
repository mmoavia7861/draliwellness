import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const { siteSettings, subscribeNewsletter, isAdmin } = useStore();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'ok' | 'err'; msg: string }>({
    type: 'idle',
    msg: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const phoneClean = (siteSettings.whatsappNumber || '').replace(/[^0-9]/g, '');
  const whatsappUrl = phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(siteSettings.whatsappGreeting || '')}`
    : '/contact';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'err', msg: 'Please enter a valid email address.' });
      return;
    }
    if (!consent) {
      setStatus({ type: 'err', msg: 'Please confirm your subscription consent.' });
      return;
    }
    setSubmitting(true);
    try {
      await subscribeNewsletter(email);
      setStatus({ type: 'ok', msg: 'Thank you for subscribing to updates.' });
      setEmail('');
      setConsent(false);
    } catch {
      setStatus({ type: 'err', msg: 'Could not subscribe right now. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#174D40] text-[#FAF8F2] border-t border-[#174D40]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="space-y-4">
          <h2 className="sr-only">{siteSettings.businessName}</h2>
          <div className="pt-1">
            <BrandLogo variant="footer" theme="dark" />
          </div>
          <p className="text-sm text-[#FAF8F2]/80 leading-relaxed">
            {siteSettings.tagline || 'Thoughtful wellness, supported by knowledge and care.'}
          </p>
          <div className="space-y-1 text-xs text-[#FAF8F2]/65 leading-relaxed">
            <p>Supplement Line: {siteSettings.supplementBrandName || 'BrainAxis'}</p>
            <p>Support Hours: {siteSettings.supportHours || 'Mon – Sat, 9:00 AM – 7:00 PM PKT'}</p>
          </div>
        </div>

        {/* Shop & Explore */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wider text-[#C7A46A] uppercase">
            Explore &amp; Shop
          </h3>
          <ul className="space-y-2 text-sm text-[#FAF8F2]/85">
            <li>
              <Link to="/shop" className="hover:text-white transition-colors">
                All Supplements
              </Link>
            </li>
            <li>
              <Link to="/product/brainaxis-energy-boost" className="hover:text-white transition-colors">
                BrainAxis Energy Boost
              </Link>
            </li>
            <li>
              <Link to="/product/brainaxis-sundex-d" className="hover:text-white transition-colors">
                BrainAxis SUNDEX-D 200,000 IU
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About Dr. Ali Hassan
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-white transition-colors">
                Wellness Services
              </Link>
            </li>
            <li>
              <Link to="/ai-studio" className="hover:text-white transition-colors">
                AI Wellness Studio
              </Link>
            </li>
            <li>
              <Link to="/journal" className="hover:text-white transition-colors">
                Health Journal
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wider text-[#C7A46A] uppercase">
            Support &amp; Policies
          </h3>
          <ul className="space-y-2 text-sm text-[#FAF8F2]/85">
            <li>
              <Link to="/track-order" className="hover:text-white transition-colors">
                Order Tracking
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-white transition-colors">
                Frequently Asked Questions
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <a
                href={whatsappUrl}
                target={phoneClean ? '_blank' : undefined}
                rel={phoneClean ? 'noopener noreferrer' : undefined}
                className="hover:text-white transition-colors"
              >
                WhatsApp Support
              </a>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/shipping-policy" className="hover:text-white transition-colors">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="hover:text-white transition-colors">
                Refund &amp; Return Policy
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/admin" className="hover:text-white transition-colors font-medium text-[#C7A46A]">
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wider text-[#C7A46A] uppercase">
            Wellness Updates
          </h3>
          <p className="text-sm text-[#FAF8F2]/80">
            Receive verified product launches and educational wellness guides.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2.5">
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#C7A46A]"
            />
            <label className="flex items-start gap-2 text-xs text-[#FAF8F2]/80 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-white/30"
              />
              <span>I consent to receive wellness emails from {siteSettings.businessName}.</span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-lg bg-[#C7A46A] text-[#174D40] text-sm font-semibold hover:bg-[#d5b47c] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Subscribing...' : 'Subscribe'}
            </button>
            {status.type !== 'idle' && (
              <p
                className={`text-xs ${
                  status.type === 'ok' ? 'text-[#E8F1EB]' : 'text-amber-200'
                }`}
              >
                {status.msg}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FAF8F2]/70">
          <p>
            &copy; {new Date().getFullYear()} {siteSettings.businessName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
            <p className="text-center sm:text-right">
              Dietary supplements are for nutritional support and not intended to replace medical advice.
            </p>
            {isAdmin && (
              <Link to="/admin" className="text-[#C7A46A] hover:text-white font-semibold transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
