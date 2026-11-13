import {
  ArrowRight,
  CheckCircle2,
  Facebook,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsView } from './components/ProductDetailsView';
import { SafeImage } from './components/SafeImage';
import { StoreHeader, type ActiveRoute } from './components/StoreHeader';
import { SupportView } from './components/SupportView';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { TrackOrderView } from './components/TrackOrderView';
import { TronifyLogo } from './components/TronifyLogo';
import { DEFAULT_STORE_SETTINGS } from './data/seed';
import { CATEGORY_LABELS, UI_COPY } from './i18n/translations';
import { api } from './lib/api';
import type { CartItem, CategoryId, Language, Order, Product, StoreSettings } from './types';

type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'discount';

const STORAGE_LANG_KEY = 'tronify_lang';
const STORAGE_CART_KEY = 'tronify_cart';

const CATEGORIES: CategoryId[] = [
  'smart-watches',
  'earbuds',
  'headphones',
  'smart-gadgets',
  'accessories',
];

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      return saved === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loadingStore, setLoadingStore] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [activeRoute, setActiveRoute] = useState<ActiveRoute>('store');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [trackPrefill, setTrackPrefill] = useState<{ orderNumber: string; phone: string }>({
    orderNumber: '',
    phone: '',
  });

  // Catalog Filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('featured');

  // Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const fetchStorefront = useCallback(async () => {
    try {
      const data = await api.getStorefront();
      setProducts(data.products);
      setSettings(data.settings);
      setStoreError(null);
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : 'Unable to load store catalog.');
    } finally {
      setLoadingStore(false);
    }
  }, []);

  useEffect(() => {
    fetchStorefront();
  }, [fetchStorefront]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore storage quota
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  // Sync URL hash for deep-linking & back button support
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash || hash === 'store') {
        setActiveRoute('store');
        setSelectedProductSlug(null);
      } else if (hash.startsWith('product/')) {
        setActiveRoute('product');
        setSelectedProductSlug(hash.slice('product/'.length));
      } else if (hash === 'track') {
        setActiveRoute('track');
      } else if (hash === 'support') {
        setActiveRoute('support');
      } else if (hash === 'admin') {
        setActiveRoute('admin');
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const navigate = (route: ActiveRoute, sectionId?: string) => {
    setActiveRoute(route);
    if (route !== 'product') {
      setSelectedProductSlug(null);
      window.location.hash = route === 'store' ? '' : route;
    }
    if (sectionId) {
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openProductDetails = (product: Product) => {
    setSelectedProductSlug(product.slug);
    setActiveRoute('product');
    window.location.hash = `product/${product.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      pushToast('error', UI_COPY[lang].outOfStock);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, { productId: product.id, quantity: Math.min(product.stock, quantity) }];
    });
    const title = lang === 'en' ? product.nameEn : product.nameBn;
    pushToast(
      'success',
      lang === 'en' ? `Added ${title} to your bag.` : `${title} আপনার ব্যাগে যোগ হয়েছে।`
    );
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    const product = products.find((p) => p.id === productId);
    const maxStock = product ? product.stock : quantity;
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(maxStock, quantity) } : i
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    fetchStorefront();
    pushToast(
      'success',
      lang === 'en'
        ? `Order ${order.orderNumber} confirmed!`
        : `অর্ডার ${order.orderNumber} নিশ্চিত হয়েছে!`
    );
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameBn.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    if (sortMode === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortMode === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortMode === 'discount') {
      return [...list].sort((a, b) => {
        const discA = a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      });
    }
    return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, selectedCategory, searchQuery, sortMode]);

  const activeProduct = useMemo(() => {
    if (!selectedProductSlug) return null;
    return products.find((p) => p.slug === selectedProductSlug || p.id === selectedProductSlug) || null;
  }, [products, selectedProductSlug]);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const t = UI_COPY[lang];
  const cleanWhatsapp = settings.whatsappNumber.replace(/[^\d]/g, '');

  return (
    <div className="min-h-screen flex flex-col bg-[#050814] text-slate-100">
      <StoreHeader
        lang={lang}
        onChangeLang={setLang}
        settings={settings}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeRoute={activeRoute}
        onNavigate={navigate}
      />

      <div className="flex-1">
        {/* VIEW: ADMIN DASHBOARD */}
        {activeRoute === 'admin' && (
          <AdminDashboard
            lang={lang}
            products={products}
            settings={settings}
            onRefreshStorefront={fetchStorefront}
            onToast={pushToast}
          />
        )}

        {/* VIEW: TRACK ORDER */}
        {activeRoute === 'track' && (
          <TrackOrderView
            lang={lang}
            initialOrderNumber={trackPrefill.orderNumber}
            initialPhone={trackPrefill.phone}
          />
        )}

        {/* VIEW: SUPPORT */}
        {activeRoute === 'support' && <SupportView lang={lang} settings={settings} />}

        {/* VIEW: PRODUCT DETAILS PAGE */}
        {activeRoute === 'product' && activeProduct && (
          <ProductDetailsView
            product={activeProduct}
            lang={lang}
            settings={settings}
            onBack={() => navigate('store', 'catalog-section')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        )}

        {/* VIEW: STOREFRONT HOMEPAGE */}
        {(activeRoute === 'store' || (activeRoute === 'product' && !activeProduct)) && (
          <>
            {/* SECTION 1: HERO SHOWCASE */}
            <section className="border-b border-slate-800/70 bg-gradient-to-b from-[#070E22] to-[#050814]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-center gap-5">
                    <p className="text-xs font-medium tracking-wide text-cyan-400">
                      {lang === 'en' ? settings.taglineEn : settings.taglineBn}
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl lg:text-[3.1rem] font-bold text-white leading-[1.12] [text-wrap:balance]">
                      {lang === 'en' ? settings.heroTitleEn : settings.heroTitleBn}
                    </h1>
                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                      {lang === 'en' ? settings.heroSubtitleEn : settings.heroSubtitleBn}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById('catalog-section')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
                      >
                        <span>{lang === 'en' ? settings.heroCtaEn : settings.heroCtaBn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <a
                        href={`https://wa.me/${cleanWhatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                        <span>{t.whatsappBtn}</span>
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="relative h-full min-h-[260px] sm:min-h-[340px] aspect-[16/9] lg:aspect-auto rounded-xl overflow-hidden bg-[#091124] border border-slate-800/80">
                      <SafeImage
                        src={settings.heroImage}
                        alt={settings.brandName}
                        fallbackLabel={settings.brandName}
                        className="w-full h-full object-cover"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#050814]/50 via-transparent to-transparent pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4-Column Store Guarantee Strip */}
                <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-white">{t.valueCodTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {t.valueCodDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-white">{t.valueWarrantyTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {t.valueWarrantyDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-white">{t.valueAuthenticTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {t.valueAuthenticDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-white">{t.valueSupportTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {t.valueSupportDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: PRODUCT CATALOG & FILTERS */}
            <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-white [text-wrap:balance]">
                    {t.catalogTitle}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
                    {t.catalogSubtitle}
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 sm:flex-initial sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#091124] border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    aria-label="Sort products"
                    className="px-3 py-2 rounded-lg bg-[#091124] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="featured">{t.sortFeatured}</option>
                    <option value="price-asc">{t.sortPriceAsc}</option>
                    <option value="price-desc">{t.sortPriceDesc}</option>
                    <option value="discount">{t.sortDiscount}</option>
                  </select>
                </div>
              </div>

              {/* Interactive Category Filter Bar */}
              <div
                role="tablist"
                aria-label="Product Categories"
                className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/70"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-[#091124] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.allCategories}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-[#091124] text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {CATEGORY_LABELS[cat][lang]}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              {loadingStore ? (
                <div className="py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-sm">Loading catalog...</p>
                </div>
              ) : storeError ? (
                <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm text-center">
                  {storeError}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <p className="text-slate-400 text-sm">{t.noProductsFound}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-cyan-400 hover:border-cyan-400 cursor-pointer"
                  >
                    {t.resetFilters}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      lang={lang}
                      onSelectProduct={openProductDetails}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* CLEAN FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#030610]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <TronifyLogo logoUrl={settings.logoUrl} size={28} />
              <span className="font-display text-base font-bold text-white">
                {settings.brandName}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              {lang === 'en' ? settings.taglineEn : settings.taglineBn}{' '}
              {lang === 'en' ? settings.storeAddressEn : settings.storeAddressBn}
            </p>
          </div>

          <div className="md:col-span-3 space-y-2 text-sm">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <button
              type="button"
              onClick={() => navigate('store')}
              className="block text-slate-400 hover:text-cyan-400 cursor-pointer"
            >
              {t.navShop}
            </button>
            <button
              type="button"
              onClick={() => navigate('track')}
              className="block text-slate-400 hover:text-cyan-400 cursor-pointer"
            >
              {t.navTrack}
            </button>
            <button
              type="button"
              onClick={() => navigate('support')}
              className="block text-slate-400 hover:text-cyan-400 cursor-pointer"
            >
              {t.navSupport}
            </button>
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="block text-slate-400 hover:text-cyan-400 cursor-pointer"
            >
              {t.navAdmin}
            </button>
          </div>

          <div className="md:col-span-4 space-y-2.5 text-sm">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Direct Channels
            </h3>
            <a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400"
            >
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="font-mono">{settings.whatsappNumber}</span>
            </a>
            <a
              href={settings.facebookPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400"
            >
              <Facebook className="w-4 h-4 text-cyan-400" />
              <span>Facebook Page</span>
            </a>
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>{settings.contactEmail}</span>
            </a>
          </div>
        </div>
        <div className="border-t border-slate-800/60 py-4 px-4 sm:px-6 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{t.footerRights}</span>
          <span>Cash on Delivery · All 64 Districts</span>
        </div>
      </footer>

      {/* Shopping Bag Drawer */}
      <CartDrawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
        cart={cart}
        products={products}
        settings={settings}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        lang={lang}
        cart={cart}
        products={products}
        settings={settings}
        onOrderSuccess={handleOrderSuccess}
        onTrackOrder={(orderNumber, phone) => {
          setTrackPrefill({ orderNumber, phone });
          navigate('track');
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
