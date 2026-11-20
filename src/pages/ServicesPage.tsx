import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import type { Service } from '../types';
import { formatPkr } from '../utils/commerce';

export const ServicesPage: React.FC = () => {
  const { services, user, signInWithGoogle, requestAppointment, siteSettings } = useStore();
  const visibleServices = services.filter((s) => s.visible);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('10:00 AM PKT');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setSubmitting(true);
    setStatusMsg('');
    try {
      await requestAppointment({
        service: selectedService,
        customerName: name,
        customerPhone: phone,
        preferredDate: date,
        preferredSlot: slot,
        notes,
      });
      setStatusMsg('Appointment request submitted. Our team will confirm availability shortly.');
      setSelectedService(null);
      setNotes('');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title={`Wellness Services — ${siteSettings.businessName}`}
        description="Explore upcoming and active nutrition and supplement guidance consultations at Dr. Ali Hassan Health & Wellness."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="space-y-2 border-b border-[#174D40]/12 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Future-Ready Care Platform
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
            Wellness &amp; Consultation Services
          </h1>
          <p className="text-sm text-[#252B29]/75 max-w-2xl">
            Consultation services are controlled directly by our clinical administration. Services marked as Coming Soon are informational until provider schedules are activated.
          </p>
        </div>

        {statusMsg && (
          <div className="p-4 rounded-xl bg-[#E8F1EB] border border-[#174D40]/20 text-sm text-[#174D40]">
            {statusMsg}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {visibleServices.map((svc) => (
            <div
              key={svc.id}
              className="bg-white border border-[#174D40]/12 rounded-2xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#174D40]">
                  {svc.bookingEnabled ? 'Booking Open' : 'Coming Soon'}
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[#252B29]">{svc.title}</h2>
                <p className="text-sm text-[#252B29]/75 leading-relaxed">{svc.description}</p>
                <div className="text-xs text-[#252B29]/65 space-y-1 pt-2 border-t border-[#174D40]/10">
                  {svc.providerName && <p>Provider: {svc.providerName}</p>}
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{svc.durationMinutes || 30} minutes</span>
                  </p>
                  {typeof svc.feePkr === 'number' && svc.feePkr > 0 && (
                    <p className="font-semibold text-[#174D40] tabular-nums">
                      Fee: {formatPkr(svc.feePkr)}
                    </p>
                  )}
                </div>
              </div>

              {svc.bookingEnabled ? (
                <button
                  type="button"
                  onClick={() => setSelectedService(svc)}
                  className="h-10 rounded-lg bg-[#174D40] text-white text-sm font-semibold hover:bg-[#113A30] cursor-pointer"
                >
                  Request Appointment
                </button>
              ) : (
                <div className="h-10 rounded-lg bg-[#FAF8F2] border border-[#174D40]/15 text-[#252B29]/65 text-xs font-medium flex items-center justify-center">
                  Scheduling Opens Soon
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedService && (
          <div className="bg-white border border-[#174D40]/20 rounded-2xl p-6 sm:p-8 max-w-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
                Request: {selectedService.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="text-xs text-[#252B29]/60 hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {!user ? (
              <div className="space-y-3 text-sm">
                <p className="text-[#252B29]/80">
                  Please sign in with Google to submit a verified consultation request.
                </p>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="h-10 px-5 rounded-lg bg-[#174D40] text-white text-sm font-medium cursor-pointer"
                >
                  Sign In with Google
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Preferred Time (PKT) *</label>
                    <select
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2]"
                    >
                      <option value="10:00 AM PKT">10:00 AM PKT</option>
                      <option value="12:00 PM PKT">12:00 PM PKT</option>
                      <option value="03:00 PM PKT">03:00 PM PKT</option>
                      <option value="05:00 PM PKT">05:00 PM PKT</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional general wellness topic (no sensitive medical history needed)"
                  className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
};
