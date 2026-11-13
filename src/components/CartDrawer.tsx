import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { UI_COPY, formatBDT } from '../i18n/translations';
import type { CartItem, Language, Product, StoreSettings } from '../types';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
  cart: CartItem[];
  products: Product[];
  settings: StoreSettings;
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  onClose,
  lang,
  cart,
  products,
  settings,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const t = UI_COPY[lang];

  const resolvedItems = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((item): item is { productId: string; quantity: number; product: Product } => Boolean(item));

  const subtotal = resolvedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const qualifiesFree =
    settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        aria-label={t.yourCart}
        className="relative z-10 w-full max-w-md bg-[#070E20] border-l border-slate-800 h-full flex flex-col shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-lg font-semibold text-white">{t.yourCart}</h2>
            <span className="font-mono tabular-nums text-xs text-slate-400">
              ({resolvedItems.reduce((acc, i) => acc + i.quantity, 0)})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Itemized List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {resolvedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-slate-600 mb-3" strokeWidth={1.5} />
              <p className="text-slate-400 text-sm mb-5">{t.emptyCart}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors cursor-pointer"
              >
                {t.continueShopping}
              </button>
            </div>
          ) : (
            resolvedItems.map(({ product, quantity }) => {
              const title = lang === 'en' ? product.nameEn : product.nameBn;
              return (
                <div
                  key={product.id}
                  className="flex gap-4 pb-4 border-b border-slate-800/70 last:border-b-0"
                >
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#0B152D] border border-slate-800 shrink-0">
                    <SafeImage
                      src={product.image}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                        {title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        aria-label={`Remove ${title}`}
                        className="text-slate-500 hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-mono tabular-nums text-xs text-slate-400 mt-0.5">
                      {formatBDT(product.price)} each
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-slate-700 rounded-md bg-[#091124]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono tabular-nums w-8 text-center text-xs font-semibold text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= product.stock}
                          onClick={() => onUpdateQty(product.id, quantity + 1)}
                          aria-label="Increase quantity"
                          className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono tabular-nums text-sm font-semibold text-white">
                        {formatBDT(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary & Checkout */}
        {resolvedItems.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-[#050A18] space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.subtotal}</span>
                <span className="font-mono tabular-nums text-base font-semibold text-white">
                  {formatBDT(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {t.deliveryDhaka} / {t.deliveryOutside}
                </span>
                <span className="font-mono tabular-nums text-cyan-400">
                  {qualifiesFree
                    ? t.freeDeliveryApplied
                    : `${formatBDT(settings.dhakaDeliveryFee)} / ${formatBDT(
                        settings.outsideDhakaDeliveryFee
                      )}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              {t.proceedCheckout}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
