interface TronifyLogoProps {
  logoUrl?: string;
  size?: number;
}

export function TronifyLogo({ logoUrl, size = 32 }: TronifyLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="TRONIFY SHOP logo"
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-md object-contain shrink-0 bg-[#0A1328] border border-cyan-500/20"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="1.5" y="1.5" width="33" height="33" rx="8" fill="#09132B" stroke="#06B6D4" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M9 11.5H27L24.5 15.5H20.2V26H15.8V15.5H11.5L9 11.5Z" fill="#22D3EE" />
      <path d="M22.5 19.5L27 26H22.2L19.8 22.2L22.5 19.5Z" fill="#38BDF8" fillOpacity="0.85" />
    </svg>
  );
}
