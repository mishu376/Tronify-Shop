import { CheckCircle2, Loader2, PackageCheck, Search, Truck, XCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ORDER_STATUS_LABELS, UI_COPY, formatBDT } from '../i18n/translations';
import { api } from '../lib/api';
import type { Language, Order, OrderStatus } from '../types';

interface TrackOrderViewProps {
  lang: Language;
  initialOrderNumber?: string;
  initialPhone?: string;
}

const PIPELINE_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
];

export function TrackOrderView({
  lang,
  initialOrderNumber = '',
  initialPhone = '',
}: TrackOrderViewProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const t = UI_COPY[lang];

  const runLookup = async (num: string, ph: string) => {
    if (!num.trim() || !ph.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.trackOrder(num.trim(), ph.trim());
      setOrder(res.order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber && initialPhone) {
      setOrderNumber(initialOrderNumber);
      setPhone(initialPhone);
      runLookup(initialOrderNumber, initialPhone);
    }
  }, [initialOrderNumber, initialPhone]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runLookup(orderNumber, phone);
  };

  const currentStepIndex = order ? PIPELINE_STEPS.indexOf(order.status) : -1;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white [text-wrap:balance]">
          {t.trackOrderTitle}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          {t.trackOrderSubtitle}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-5 sm:p-6 rounded-xl bg-[#091124] border border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
      >
        <div className="sm:col-span-5">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {t.orderIdLabel}
          </label>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={t.enterOrderNumber}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#050814] border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div className="sm:col-span-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {t.phoneLabel}
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.enterPhone}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#050814] border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{t.checkStatus}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-6 p-6 rounded-xl bg-[#091124] border border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <p className="text-xs text-slate-400">{t.orderIdLabel}</p>
              <p className="font-mono tabular-nums text-xl font-bold text-white">
                {order.orderNumber}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">{t.totalPayable}</p>
              <p className="font-mono tabular-nums text-xl font-bold text-cyan-400">
                {formatBDT(order.total)}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Status: {ORDER_STATUS_LABELS[order.status][lang]}
              </p>
            </div>
          </div>

          {order.status === 'Cancelled' ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-950/40 border border-rose-500/35 text-rose-200 text-sm">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'This order has been cancelled. Contact support if you need assistance.'
                  : 'এই অর্ডারটি বাতিল করা হয়েছে। সহায়তার জন্য সাপোর্টে যোগাযোগ করুন।'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PIPELINE_STEPS.map((step, idx) => {
                const completed = currentStepIndex >= idx;
                return (
                  <div
                    key={step}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      completed
                        ? 'bg-cyan-500/10 border-cyan-500/45 text-cyan-300'
                        : 'bg-[#050814] border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex justify-center mb-1.5">
                      {idx === 4 ? (
                        <PackageCheck className="w-4 h-4" />
                      ) : idx === 3 ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                    <p className="text-xs font-semibold">{ORDER_STATUS_LABELS[step][lang]}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-800 pt-5 space-y-2">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
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
        </div>
      )}
    </section>
  );
}
