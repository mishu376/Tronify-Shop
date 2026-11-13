import { CheckCircle2, Info, Loader2, Mail, MessageCircle, Truck, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { BANGLADESH_DISTRICTS } from '../data/seed';
import { UI_COPY, formatBDT } from '../i18n/translations';
import { api } from '../lib/api';
import type { CartItem, Language, Order, Product, StoreSettings } from '../types';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
  cart: CartItem[];
  products: Product[];
  settings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
  onTrackOrder: (orderNumber: string, phone: string) => void;
}

export function CheckoutModal({
  open,
  onClose,
  lang,
  cart,
  products,
  settings,
  onOrderSuccess,
  onTrackOrder,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

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
  const deliveryCharge = qualifiesFree
    ? 0
    : district === 'Dhaka'
      ? settings.dhakaDeliveryFee
      : settings.outsideDhakaDeliveryFee;
  const totalPayable = subtotal + deliveryCharge;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^01[3-9]\d{8}$/.test(customerPhone.replace(/\s+/g, ''))) {
      setError(
        lang === 'en'
          ? 'Please enter a valid 11-digit Bangladeshi mobile number starting with 01.'
          : 'অনুগ্রহ করে ০১ দিয়ে শুরু হওয়া সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।'
      );
      return;
    }

    setSubmitting(true);
    try {
      const { order } = await api.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s+/g, ''),
        customerEmail: customerEmail.trim() || undefined,
        district,
        address: address.trim(),
        note: note.trim() || undefined,
        items: resolvedItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setConfirmedOrder(order);
      onOrderSuccess(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedOrder(null);
    setError(null);
    onClose();
  };

  const cleanWhatsapp = settings.whatsappNumber.replace(/[^\d]/g, '');
  const whatsappOrderText = confirmedOrder
    ? `Hello TRONIFY SHOP, I just placed COD Order ${confirmedOrder.orderNumber} for ${formatBDT(
        confirmedOrder.total
      )}. Name: ${confirmedOrder.customerName}, Phone: ${confirmedOrder.customerPhone}, District: ${
        confirmedOrder.district
      }.`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        onClick={handleResetAndClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-[#070E20] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="font-display text-lg font-semibold text-white">
            {confirmedOrder ? t.orderConfirmedTitle : t.checkoutTitle}
          </h2>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close checkout"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {confirmedOrder ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-[#0B1733] border border-cyan-500/35">
                <CheckCircle2 className="w-7 h-7 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{t.orderIdLabel}</p>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-0.5">
                    {confirmedOrder.orderNumber}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">{t.orderConfirmedSubtitle}</p>
                </div>
              </div>

              {/* Honest email notification status */}
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
                  confirmedOrder.emailNotification.configured
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-100'
                    : 'bg-slate-900/90 border-slate-700 text-slate-300'
                }`}
              >
                {confirmedOrder.emailNotification.configured ? (
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {confirmedOrder.emailNotification.configured
                      ? 'Email Notification Status'
                      : 'Email Service Not Configured'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {confirmedOrder.emailNotification.message} You can share your order directly on WhatsApp or contact {settings.contactEmail}.
                  </p>
                </div>
              </div>

              {/* Receipt breakdown */}
              <div className="border border-slate-800 rounded-xl bg-[#091124] p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block">Customer</span>
                    <span className="font-medium text-white">
                      {confirmedOrder.customerName} · {confirmedOrder.customerPhone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Delivery Address</span>
                    <span className="font-medium text-white">
                      {confirmedOrder.address}, {confirmedOrder.district}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-2">
                  {confirmedOrder.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between text-sm gap-4"
                    >
                      <span className="text-slate-200">
                        {lang === 'en' ? item.nameEn : item.nameBn}{' '}
                        <span className="font-mono text-xs text-slate-400">x{item.quantity}</span>
                      </span>
                      <span className="font-mono tabular-nums text-white">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>{t.subtotal}</span>
                    <span className="font-mono tabular-nums">{formatBDT(confirmedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.deliveryCharge}</span>
                    <span className="font-mono tabular-nums">
                      {confirmedOrder.deliveryCharge === 0
                        ? 'Free'
                        : formatBDT(confirmedOrder.deliveryCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-cyan-400 pt-1">
                    <span>{t.totalPayable}</span>
                    <span className="font-mono tabular-nums">{formatBDT(confirmedOrder.total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappOrderText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-white text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <span>{t.sendWhatsappOrder}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const num = confirmedOrder.orderNumber;
                    const ph = confirmedOrder.customerPhone;
                    handleResetAndClose();
                    onTrackOrder(num, ph);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>{t.trackThisOrder}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t.customerName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Md. Tanvir Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#091124] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t.phoneLabel} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#091124] border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t.districtLabel} *
                  </label>
                  <select
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#091124] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t.emailOptional}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#091124] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.addressLabel} *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House 14, Road 6, Dhanmondi, Dhaka"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#091124] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.noteOptional}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Call before delivery"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#091124] border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Payment method + Order Totals */}
              <div className="p-4 rounded-xl bg-[#091124] border border-slate-800 space-y-3">
                <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                  <Truck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.paymentCodBadge}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.paymentCodDesc}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>
                      {t.subtotal} ({resolvedItems.reduce((a, b) => a + b.quantity, 0)} items)
                    </span>
                    <span className="font-mono tabular-nums">{formatBDT(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>
                      {t.deliveryCharge} ({district})
                    </span>
                    <span className="font-mono tabular-nums text-cyan-400">
                      {deliveryCharge === 0 ? t.freeDeliveryApplied : formatBDT(deliveryCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-1.5 border-t border-slate-800">
                    <span>{t.totalPayable}</span>
                    <span className="font-mono tabular-nums text-cyan-400">
                      {formatBDT(totalPayable)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || resolvedItems.length === 0}
                className="w-full py-3.5 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.placingOrder}</span>
                  </>
                ) : (
                  <span>
                    {t.placeOrderCod} · {formatBDT(totalPayable)}
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
