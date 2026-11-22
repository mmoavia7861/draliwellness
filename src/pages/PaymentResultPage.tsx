import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';

type PaymentInfo = {orderNumber?:string;paymentStatus?:'pending'|'paid'|'failed'|'refunded';orderStatus?:string;testPaid?:boolean};

const PAYMENT_API_BASE = (import.meta.env.VITE_PAYMENT_API_BASE_URL || 'https://draliwellness.moavia400.workers.dev').replace(/\/$/, '');

export const PaymentResultPage: React.FC = () => {
  const [search] = useSearchParams();
  const orderId = search.get('order') || '';
  const cancelled = search.get('cancelled') === '1';
  const [email, setEmail] = useState(() => sessionStorage.getItem('safepay:email:'+orderId) || '');
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const check = async () => {
    if(!email.trim()||!orderId)return;
    setChecking(true);
    setError('');
    try{
      const response=await fetch(PAYMENT_API_BASE + '/api/payments/safepay/order-status', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({order:orderId,email:email.trim()})
      });
      const result=await response.json() as PaymentInfo & {error?:string};
      if(!response.ok)throw new Error(result.error||'Could not confirm payment.');
      sessionStorage.setItem('safepay:email:'+orderId,email.trim());
      setInfo(result);
    }catch(e){setError(e instanceof Error?e.message:'Payment lookup unavailable.');}
    finally{setChecking(false);}
  };
  useEffect(() => { if(email && orderId) void check(); },[orderId]);
  const paid=info?.paymentStatus === 'paid';
  return <main className="max-w-xl mx-auto px-4 sm:px-6 py-16 space-y-6">
    <PageMeta title="Safepay Payment Status — Dr. Ali Hassan Health & Wellness" description="Verify the status of your online payment." />
    <h1 className="font-serif text-3xl font-semibold text-[#174D40]">Safepay Payment Status</h1>
    <div className="bg-white rounded-2xl border border-[#174D40]/15 p-6 space-y-4">
      <p className="text-sm text-[#252B29]/80">
        {cancelled ? 'You returned from the cancelled checkout. Your order has not been marked paid.' :
          'Safepay redirect received. Payment is only confirmed after secure payment verification.'}
      </p>
      <label className="block text-sm font-medium" htmlFor="payment-status-email">Order email address</label>
      <input id="payment-status-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
        className="w-full border border-[#174D40]/20 rounded-lg p-3" placeholder="you@example.com" />
      <button type="button" onClick={()=>void check()} disabled={checking||!email.trim()||!orderId}
        className="w-full bg-[#174D40] text-white px-5 py-3 rounded-lg disabled:opacity-60">
        {checking?'Checking...':'Refresh Payment Status'}
      </button>
      {info && <div className="bg-[#FAF8F2] rounded-lg p-4 text-sm space-y-2">
        <p>Order: <strong>{info.orderNumber}</strong></p>
        <p>Payment: <strong>{info.testPaid?'Sandbox Test Completed — No Real Payment':paid?'Verified Paid': info.paymentStatus === 'pending'?'Pending Verification':info.paymentStatus}</strong></p>
        {!paid && !info.testPaid && <p>Do not pay again unless support confirms the original payment failed.</p>}
      </div>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
    <Link to="/shop" className="inline-flex text-[#174D40] font-semibold underline">Back to Shop</Link>
  </main>;
};
