import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const { cart, setCartDrawerOpen, user } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b ${
      isActive
        ? 'text-[#174D40] border-[#174D40]'
        : 'text-[#252B29]/80 border-transparent hover:text-[#174D40] hover:border-[#174D40]/40'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F2]/95 backdrop-blur-md border-b border-[#174D40]/12">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 min-w-0">
        {/* Zone 1: Signature Brand Lockup */}
        <Link
          to="/"
          aria-label="Dr. Ali Hassan Health & Wellness"
          className="inline-flex items-center shrink-0 py-1"
        >
          <BrandLogo variant="header" theme="light" />
        </Link>

        {/* Zone 2: Concise single-line nav links with Admin at the end */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5 lg:gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/shop" className={navLinkClass}>
            Shop
          </NavLink>
          <NavLink to="/ai-studio" className={navLinkClass}>
            AI Guide
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/services" className={navLinkClass}>
            Services
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        </nav>

        {/* Zone 3: Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search supplements"
            aria-expanded={searchOpen}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-[#252B29]/80 hover:text-[#174D40] hover:bg-[#E8F1EB]/70 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          <Link
            to="/account"
            aria-label={user ? 'My Account' : 'Sign In'}
            className="w-9 h-9 sm:w-auto sm:px-3 sm:h-10 flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-[#252B29]/80 hover:text-[#174D40] hover:bg-[#E8F1EB]/70 transition-colors whitespace-nowrap shrink-0"
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Account</span>
          </Link>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            aria-label={`Open shopping cart, ${itemCount} items`}
            className="px-2.5 sm:px-3.5 h-9 sm:h-10 flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#174D40] text-white text-xs sm:text-sm font-medium hover:bg-[#113A30] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="tabular-nums">Cart ({itemCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#252B29] hover:bg-[#E8F1EB] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-[#174D40]/10 bg-white px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-2">
            <label htmlFor="header-search-input" className="sr-only">
              Search supplements
            </label>
            <input
              id="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BrainAxis Energy Boost, SUNDEX-D Vitamin D3..."
              className="flex-1 h-10 px-3.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-sm text-[#252B29] focus:outline-none focus:border-[#174D40]"
              autoFocus
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#174D40] text-white text-sm font-medium hover:bg-[#113A30] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#174D40]/10 bg-[#FAF8F2] px-4 py-4 space-y-1"
        >
          {[
            { to: '/', label: 'Home' },
            { to: '/shop', label: 'Shop' },
            { to: '/ai-studio', label: 'AI Wellness Studio' },
            { to: '/about', label: 'About Us' },
            { to: '/services', label: 'Wellness Services' },
            { to: '/track-order', label: 'Track Order' },
            { to: '/faq', label: 'FAQ' },
            { to: '/contact', label: 'Contact' },
            { to: '/account', label: 'My Account' },
            { to: '/admin', label: 'Admin' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[#252B29] hover:bg-[#E8F1EB] hover:text-[#174D40]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};
