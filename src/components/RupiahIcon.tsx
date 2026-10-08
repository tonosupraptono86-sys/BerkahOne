import React from 'react';

interface RupiahIconProps {
  className?: string;
  size?: number;
  showBadge?: boolean;
}

/**
 * Komponen Ikon Resmi Logo Rupiah (Rp)
 * Menampilkan simbol mata uang Rupiah Indonesia (Rp) dalam bentuk koin/lencana vektor presisi tinggi.
 */
export const RupiahIcon: React.FC<RupiahIconProps> = ({ 
  className = 'w-4 h-4', 
  size,
  showBadge = false
}) => {
  if (showBadge) {
    return (
      <span className={`inline-flex items-center justify-center font-extrabold text-[10px] tracking-tight px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs font-mono select-none ${className}`}>
        Rp
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Outer Coin Ring */}
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.85" />
      {/* Letter 'R' */}
      <path
        d="M6.5 7.5v9M6.5 7.5h3.8a2.4 2.4 0 0 1 0 4.8h-3.8M9.3 12.3l3.2 4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
      {/* Letter 'p' */}
      <path
        d="M14.5 10v7.2M14.5 11.3a2.2 2.2 0 1 1 0 3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
    </svg>
  );
};

export default RupiahIcon;
