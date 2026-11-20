import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const WhatsAppFloat: React.FC = () => {
  const { siteSettings } = useStore();
  const phone = (siteSettings.whatsappNumber || '').replace(/[^0-9]/g, '');

  if (!phone) return null;

  const greeting = encodeURIComponent(
    siteSettings.whatsappGreeting ||
      'Hello Dr. Ali Hassan Health & Wellness team, I would like information about BrainAxis supplements.'
  );
  const href = `https://wa.me/${phone}?text=${greeting}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp with Dr. Ali Hassan Health & Wellness"
      className="fixed bottom-5 right-5 z-40 h-11 px-4 rounded-full bg-[#174D40] text-white shadow-lg border border-white/15 flex items-center gap-2 text-sm font-medium hover:bg-[#113A30] transition-colors"
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">WhatsApp Support</span>
    </a>
  );
};
