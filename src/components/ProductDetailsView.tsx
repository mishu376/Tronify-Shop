import { ArrowLeft, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, UI_COPY, formatBDT } from '../i18n/translations';
import type { Language, Product, StoreSettings } from '../types';
import { SafeImage } from './SafeImage';

interface ProductDetailsViewProps {
  product: Product;
  lang: Language;
  settings: StoreSettings;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export function ProductDetailsView({
  product,
  lang,
  settings,
  onBack,
  onAddToCart,
  onBuyNow,
}: ProductDetailsViewProps) {
  const [qty, setQty] = useState(1);
  const t = UI_COPY[lang];
  const title = lang === 'en' ? product.nameEn : product.nameBn;
  const description = lang === 'en' ? product.descriptionEn : product.descriptionBn;
  const warranty = lang === 'en' ? product.warrantyEn : product.warrantyBn;
  const categoryLabel = CATEGORY_LABELS[product.category][lang];
  const hasDiscount = product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const cleanWhatsapp = settings.whatsappNumber.replace(/[^\d]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    `Hello TRONIFY SHOP, I want to inquire about ${product.nameEn} (${product.sku}) priced at ৳${product.price}.`
  )}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-cyan-400 transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backToShop}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Left Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#0A1328] border border-slate-800/80">
            <SafeImage
              src={product.image}
              alt={title}
              fallbackLabel={title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Contiguous Right Purchase Module */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
              <span className="text-cyan-400 font-medium">{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{product.sku}</span>
              <span aria-hidden="true">·</span>
              <span className={product.stock > 0 ? 'text-slate-300' : 'text-rose-400'}>
                {product.stock > 0 ? `${t.inStock} (${product.stock})` : t.outOfStock}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance]">
              {title}
            </h1>
          </div>

          {/* Pricing block */}
          <div className="p-5 rounded-xl bg-[#091124] border border-slate-800/80 flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono tabular-nums text-3xl font-bold text-white">
                {formatBDT(product.price)}
              </span>
              {hasDiscount && (
                <span className="font-mono tabular-nums text-base text-slate-500 line-through">
                  {formatBDT(product.originalPrice)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="font-mono tabular-nums text-sm font-semibold text-cyan-400">
                Save {formatBDT(product.originalPrice - product.price)} ({discountPct}% {t.off})
              </span>
            )}
          </div>

          <p className="text-slate-300 text-base leading-relaxed">{description}</p>

          {/* Quantity & Buy Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-300">{t.quantity}</span>
              <div className="inline-flex items-center border border-slate-700 rounded-lg bg-[#091124]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1 || product.stock <= 0}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono tabular-nums w-10 text-center text-sm font-semibold text-white">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  disabled={qty >= product.stock || product.stock <= 0}
                  aria-label="Increase quantity"
                  className="p-2.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => onAddToCart(product, qty)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-cyan-500/40 bg-[#0D1A38] hover:bg-[#13254E] text-cyan-300 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.addToCart}</span>
              </button>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => onBuyNow(product, qty)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <span>{t.buyNowCod}</span>
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span>{t.askWhatsapp}</span>
            </a>
          </div>

          {/* Delivery & Warranty Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-sm">
            <div className="flex items-start gap-2.5 text-slate-300">
              <Truck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">{t.paymentCodBadge}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dhaka {formatBDT(settings.dhakaDeliveryFee)} · Outside {formatBDT(settings.outsideDhakaDeliveryFee)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">{t.valueWarrantyTitle}</p>
                <p className="text-xs text-slate-400 mt-0.5">{warranty}</p>
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          {product.specs.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80">
              <h2 className="font-display text-base font-semibold text-white mb-3">
                {t.specifications}
              </h2>
              <dl className="divide-y divide-slate-800/70 border border-slate-800/80 rounded-xl bg-[#091124]">
                {product.specs.map((spec, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between gap-4 text-sm">
                    <dt className="text-slate-400">
                      {lang === 'en' ? spec.labelEn : spec.labelBn}
                    </dt>
                    <dd className="text-slate-100 font-medium text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
