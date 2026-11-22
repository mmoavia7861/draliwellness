import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, PackageSearch, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PageMeta } from '../components/PageMeta';
import type { OrderTracking } from '../types';
import { formatPkr, getOrderStatusLabel, ORDER_STATUS_STEPS } from '../utils/commerce';
import { computeTrackingKey, normalizeTrackingId } from '../utils/tracking';

export const OrderTrackingPage: React.FC = () => {
  const { trackOrder, siteSettings } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [trackingId, setTrackingId] = useState(searchParams.get('id') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OrderTracking | null>(null);

  const performLookup = async (id: string) => {
    const cleanId = normalizeTrackingId(id);
    if (!cleanId) {
      setResult(null);
      setError('Enter the Tracking ID provided when your order was placed.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const found = await trackOrder(cleanId);
      if (!found) {
        setResult(null);
        setError('Tracking ID not found. Check the ID or contact support.');
      } else {
        setResult(found);
        setTrackingId(cleanId);
        // A shareable link without the checkout email.
        setSearchParams({ id: cleanId }, { replace: true });
      }
    } catch {
      setResult(null);
      setError('Unable to look up order status right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      void performLookup(id);
      return;
    }
    // Open previously shared links without requiring the customer to re-enter
    // their email. Convert the old order+email URL into a private ID-only link.
    const legacyOrder = searchParams.get('order');
    const legacyEmail = searchParams.get('email');
    if (legacyOrder && legacyEmail) {
      void computeTrackingKey(legacyOrder, legacyEmail)
        .then((oldId) => {
          setTrackingId(oldId);
          setSearchParams({ id: oldId }, { replace: true });
          return performLookup(oldId);
        })
        .catch(() => setError('This older tracking link could not be opened.'));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(trackingId);
  };

  const currentStepIdx = result ? ORDER_STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <>
      <PageMeta
        title={`Track Your Order — ${siteSettings.businessName}`}
        description="Track your BrainAxis supplement order securely using your tracking ID only."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C7A46A]">
            Secure Tracking ID Lookup
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174D40]">
            Track Your Order
          </h1>
          <p className="text-sm text-[#252B29]/75">
            Enter your Tracking ID to see your order, payment and delivery status. No email is required.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#174D40]/12 rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <div className="space-y-1">
            <label htmlFor="tracking-id" className="text-xs font-semibold text-[#252B29]">
              Tracking ID *
            </label>
            <input
              id="tracking-id"
              type="text"
              required
              autoComplete="off"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. TRK-XXXXXXXXXXXXXXXXXXXX"
              className="w-full h-11 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm uppercase"
            />
            <p className="text-xs text-[#252B29]/60">
              You can find this ID on the order confirmation screen. If you
              placed an earlier order and do not have a tracking link, contact support.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto h-11 px-7 rounded-lg bg-[#174D40] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#113A30] disabled:opacity-60 cursor-pointer"
          >
            <PackageSearch className="w-4 h-4" />
            <span>{loading ? 'Checking...' : 'Check Order Status'}</span>
          </button>
        </form>

        {result && (
          <div className="bg-white border border-[#174D40]/15 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#174D40]/10 pb-4">
              <div>
                <p className="text-xs text-[#252B29]/60">Order Reference</p>
                <h2 className="font-serif text-2xl font-semibold text-[#174D40] tabular-nums">
                  {result.orderNumber}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#252B29]/60">Current Status</p>
                <p className="text-sm font-semibold text-[#174D40]">
                  {getOrderStatusLabel(result.status)}
                </p>
              </div>
            </div>

            {result.status === 'cancelled' ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                This order has been cancelled. Contact support if you need assistance.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ORDER_STATUS_STEPS.map((step, idx) => {
                  const completed = currentStepIdx >= idx;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        completed
                          ? 'bg-[#E8F1EB] border-[#174D40]/30 text-[#174D40]'
                          : 'bg-[#FAF8F2] border-[#174D40]/10 text-[#252B29]/55'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tabular-nums">0{idx + 1}</span>
                        {completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <p className="font-semibold">{getOrderStatusLabel(step)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-sm bg-[#FAF8F2] border border-[#174D40]/10 rounded-xl p-5">
              <div>
                <span className="text-xs text-[#252B29]/60 block">Payment Method &amp; Status</span>
                <span className="font-medium capitalize">
                  {result.paymentMethod.toUpperCase()} · {result.paymentStatus}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#252B29]/60 block">Order Total</span>
                <span className="font-semibold text-[#174D40] tabular-nums">
                  {formatPkr(result.totalPkr)}
                </span>
              </div>
              {result.city && (
                <div>
                  <span className="text-xs text-[#252B29]/60 block">Destination City</span>
                  <span className="font-medium">{result.city}</span>
                </div>
              )}
              {(result.courierName || result.courierTrackingNo) && (
                <div>
                  <span className="text-xs text-[#252B29]/60 block">Courier Tracking</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#174D40]" />
                    {[result.courierName, result.courierTrackingNo].filter(Boolean).join(' — ')}
                  </span>
                </div>
              )}
            </div>

            {result.itemsSummary && result.itemsSummary.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#252B29]/60">
                  Items in Package
                </h3>
                <ul className="text-sm text-[#252B29]/85 space-y-1">
                  {result.itemsSummary.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
