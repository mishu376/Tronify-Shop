import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { UI_COPY } from '../i18n/translations';
import type { Language, StoreSettings } from '../types';
import { TronifyLogo } from './TronifyLogo';

export type ActiveRoute = 'store' | 'product' | 'track' | 'support' | 'admin';

interface StoreHeaderProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  settings: StoreSettings;
  cartCount: number;
  onOpenCart: () => void;
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
}

export function StoreHeader({
  lang,
  onChangeLang,
  settings,
  cartCount,
  onOpenCart,
  activeRoute,
  onNavigate,
}: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = UI_COPY[lang];

  const handleNav = (route: ActiveRoute, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigate(route, sectionId);
  };

  return (
    <>
      {/* Slim non-sticky store announcement & language switcher strip */}
      <div className="bg-[#030610] border-b border-slate-800/70 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
          <p className="truncate text-slate-400">
            {lang === 'en' ? settings.announcementEn : settings.announcementBn}
          </p>
          <div className="flex items-center gap-1 bg-[#0B142B] border border-slate-800 rounded-md p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'en'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('bn')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'bn'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>
      </div>

      {/* Sticky 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-[#050814]/92 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark only */}
          <button
            type="button"
            onClick={() => handleNav('store')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
          >
            <TronifyLogo logoUrl={settings.logoUrl} size={30} />
            <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
              {settings.brandName}
            </span>
          </button>

          {/* Zone 2: Clean single-line text nav links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => handleNav('store')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeRoute === 'store' || activeRoute === 'product'
                  ? 'text-cyan-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.navShop}
            </button>
            <button
              type="button"
              onClick={() => handleNav('store', 'catalog-section')}
              className="whitespace-nowrap shrink-0 text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
            >
              {t.navCategories}
            </button>
            <button
              type="button"
              onClick={() => handleNav('track')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeRoute === 'track' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.navTrack}
            </button>
            <button
              type="button"
              onClick={() => handleNav('support')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeRoute === 'support' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.navSupport}
            </button>
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeRoute === 'admin' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.navAdmin}
            </button>
          </nav>

          {/* Zone 3: Primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>{t.cart}</span>
              <span className="font-mono tabular-nums text-xs bg-slate-950/15 px-1.5 py-0.5 rounded">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2.5 rounded-lg border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#070D1D] px-4 py-3 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNav('store')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/60"
            >
              {t.navShop}
            </button>
            <button
              type="button"
              onClick={() => handleNav('store', 'catalog-section')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/60"
            >
              {t.navCategories}
            </button>
            <button
              type="button"
              onClick={() => handleNav('track')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/60"
            >
              {t.navTrack}
            </button>
            <button
              type="button"
              onClick={() => handleNav('support')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/60"
            >
              {t.navSupport}
            </button>
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-slate-800/60"
            >
              {t.navAdmin}
            </button>
          </div>
        )}
      </header>
    </>
  );
}
