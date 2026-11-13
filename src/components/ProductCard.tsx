import { ShoppingBag } from 'lucide-react';
import { CATEGORY_LABELS, UI_COPY, formatBDT } from '../i18n/translations';
import type { Language, Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({
  product,
  lang,
  onSelectProduct,
  onAddToCart,
}: ProductCardProps) {
  const t = UI_COPY[lang];
  const title = lang === 'en' ? product.nameEn : product.nameBn;
  const categoryLabel = CATEGORY_LABELS[product.category][lang];
  const hasDiscount = product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const stockLabel =
    product.stock <= 0
      ? t.outOfStock
      : product.stock <= 5
        ? `${t.lowStock} (${product.stock})`
        : `${t.inStock} (${product.stock})`;

  return (
    <article className="group flex flex-col bg-[#091124] border border-slate-800/80 hover:border-cyan-500/45 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
      {/* Uniform 4:3 Studio Product Image */}
      <button
        type="button"
        onClick={() => onSelectProduct(product)}
        className="relative w-full aspect-[4/3] bg-[#0B152D] overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <SafeImage
          src={product.image}
          alt={title}
          fallbackLabel={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      {/* Card Body with strict field hierarchy & zero pill spam */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Unboxed metadata line */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="text-slate-300 font-medium">{categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                product.stock <= 0
                  ? 'text-rose-400'
                  : product.stock <= 5
                    ? 'text-amber-400'
                    : 'text-cyan-400'
              }
            >
              {stockLabel}
            </span>
          </div>

          {/* Product Title */}
          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="text-left cursor-pointer"
          >
            <h3 className="font-display text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
          </button>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono tabular-nums text-lg font-semibold text-white">
                {formatBDT(product.price)}
              </span>
              {hasDiscount && (
                <span className="font-mono tabular-nums text-xs text-slate-500 line-through">
                  {formatBDT(product.originalPrice)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="font-mono tabular-nums text-xs font-medium text-cyan-400">
                -{discountPct}% {t.off}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => onAddToCart(product)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed bg-[#0F1D3D] hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 hover:border-cyan-400"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>{product.stock > 0 ? t.addToCart : t.outOfStock}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
