import { Cpu } from 'lucide-react';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = '', fallbackLabel }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B152F] via-[#070E20] to-[#050814] text-slate-400 p-4 text-center ${className}`}
      >
        <Cpu className="w-8 h-8 text-cyan-400/70 mb-2" strokeWidth={1.5} />
        {fallbackLabel ? (
          <span className="text-xs font-medium text-slate-300 line-clamp-2 max-w-[180px]">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
