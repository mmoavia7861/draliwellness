import React, { useState } from 'react';
import { Clock, Mail, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import { contactInquirySchema } from '../utils/commerce';

export const ContactPage: React.FC = () => {
  const { siteSettings, submitContactInquiry } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phoneClean = (siteSettings.whatsappNumber || '').replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = contactInquirySchema.safeParse({ name, email, phone, subject, message });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Please check your input.');
      return;
    }
    setSubmitting(true);
    try {
      await submitContactInquiry(parsed.data);
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch {
      setError('Unable to send your inquiry right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title={`Contact Us — ${siteSettings.businessName}`}
        description="Get in touch with Dr. Ali Hassan Health & Wellness via our contact form, email, or WhatsApp."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-2 border-b border-[#174D40]/12 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Customer Support
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
            Contact Us
          </h1>
          <p className="text-sm text-[#252B29]/75">
            Questions about BrainAxis Energy Boost, SUNDEX-D, or an existing order? Reach out below.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#174D40]/12 rounded-2xl p-6 space-y-4 text-sm">
              <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Direct Channels</h2>

              {siteSettings.supportEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#174D40] mt-1 shrink-0" />
                  <div>
                    <p className="font-semibold">Email Support</p>
                    <p className="text-[#252B29]/75">{siteSettings.supportEmail}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#174D40] mt-1 shrink-0" />
                <div>
                  <p className="font-semibold">Support Timings</p>
                  <p className="text-[#252B29]/75">{siteSettings.supportHours}</p>
                </div>
              </div>

              {phoneClean && (
                <a
                  href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(
                    siteSettings.whatsappGreeting || ''
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-lg bg-[#174D40] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#113A30]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-4"
            noValidate
          >
            <h2 className="font-serif text-2xl font-semibold text-[#174D40]">Send a Message</h2>

            {sent && (
              <div className="p-4 rounded-xl bg-[#E8F1EB] text-sm text-[#174D40]">
                Thank you. Your inquiry has been received and saved for our support team.
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <label htmlFor="contact-name" className="text-xs font-semibold">
                  Your Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="contact-email" className="text-xs font-semibold">
                  Email Address *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="contact-phone" className="text-xs font-semibold">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="contact-subject" className="text-xs font-semibold">
                  Subject (Optional)
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order, Product Info..."
                  className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                />
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <label htmlFor="contact-message" className="text-xs font-semibold">
                Message *
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 px-7 rounded-lg bg-[#174D40] text-white text-sm font-semibold hover:bg-[#113A30] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
