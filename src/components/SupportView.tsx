import { Facebook, Mail, MapPin, MessageCircle } from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import type { Language, StoreSettings } from '../types';

interface SupportViewProps {
  lang: Language;
  settings: StoreSettings;
}

export function SupportView({ lang, settings }: SupportViewProps) {
  const t = UI_COPY[lang];
  const cleanWhatsapp = settings.whatsappNumber.replace(/[^\d]/g, '');

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-14 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white [text-wrap:balance]">
          {t.supportTitle}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          {t.supportSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href={`https://wa.me/${cleanWhatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-xl bg-[#091124] border border-slate-800/80 hover:border-cyan-500/45 transition-colors flex flex-col justify-between gap-4"
        >
          <div>
            <MessageCircle className="w-6 h-6 text-cyan-400 mb-3" />
            <h2 className="font-display text-lg font-semibold text-white">{t.whatsappBtn}</h2>
            <p className="font-mono tabular-nums text-sm text-slate-400 mt-1">
              {settings.whatsappNumber}
            </p>
          </div>
          <span className="text-xs font-semibold text-cyan-400">Open WhatsApp →</span>
        </a>

        <a
          href={settings.facebookPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-xl bg-[#091124] border border-slate-800/80 hover:border-cyan-500/45 transition-colors flex flex-col justify-between gap-4"
        >
          <div>
            <Facebook className="w-6 h-6 text-cyan-400 mb-3" />
            <h2 className="font-display text-lg font-semibold text-white">{t.facebookBtn}</h2>
            <p className="text-sm text-slate-400 mt-1 truncate">{settings.facebookPageUrl}</p>
          </div>
          <span className="text-xs font-semibold text-cyan-400">Open Facebook →</span>
        </a>

        <a
          href={`mailto:${settings.contactEmail}`}
          className="p-6 rounded-xl bg-[#091124] border border-slate-800/80 hover:border-cyan-500/45 transition-colors flex flex-col justify-between gap-4"
        >
          <div>
            <Mail className="w-6 h-6 text-cyan-400 mb-3" />
            <h2 className="font-display text-lg font-semibold text-white">{t.emailAdminBtn}</h2>
            <p className="text-sm text-slate-400 mt-1 break-all">{settings.contactEmail}</p>
          </div>
          <span className="text-xs font-semibold text-cyan-400">Send Email →</span>
        </a>
      </div>

      <div className="p-6 rounded-xl bg-[#091124] border border-slate-800/80 flex items-start gap-4">
        <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            {lang === 'en' ? 'Dhaka Dispatch & Warranty Hub' : 'ঢাকা ডিসপ্যাচ ও ওয়ারেন্টি হাব'}
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {lang === 'en' ? settings.storeAddressEn : settings.storeAddressBn}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {lang === 'en'
              ? 'Support Hours: Saturday – Thursday, 10:00 AM – 8:00 PM BST'
              : 'সাপোর্ট সময়: শনিবার – বৃহস্পতিবার, সকাল ১০টা – রাত ৮টা'}
          </p>
        </div>
      </div>
    </section>
  );
}
