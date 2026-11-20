import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AnnouncementBar: React.FC = () => {
  const { siteSettings } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !siteSettings.announcementEnabled || !siteSettings.announcementText) {
    return null;
  }

  return (
    <div className="bg-[#174D40] text-[#FAF8F2] text-xs px-4 py-2 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-center pr-8">
        <p className="text-center font-medium tracking-wide truncate">
          {siteSettings.announcementText}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#FAF8F2]/80 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
