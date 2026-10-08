import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'horizontal' | 'icon-only';
  showSubtitle?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const BerkahOneIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 500 500" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="logoBgGlow" cx="45%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#237e38" />
        <stop offset="35%" stopColor="#145d28" />
        <stop offset="70%" stopColor="#0a3c17" />
        <stop offset="100%" stopColor="#04200b" />
      </radialGradient>
      <linearGradient id="logoOrangeOne" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#ffb020" />
        <stop offset="35%" stopColor="#ff8f00" />
        <stop offset="75%" stopColor="#f57c00" />
        <stop offset="100%" stopColor="#e65100" />
      </linearGradient>
      <linearGradient id="logoLeafTop" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#55b31f" />
        <stop offset="50%" stopColor="#7bd52c" />
        <stop offset="100%" stopColor="#99e843" />
      </linearGradient>
      <linearGradient id="logoLeafBottom" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0f4a1a" />
        <stop offset="60%" stopColor="#1c752c" />
        <stop offset="100%" stopColor="#2e943c" />
      </linearGradient>
      <filter id="logoShadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Squircle App Icon Base */}
    <rect width="500" height="500" rx="110" fill="url(#logoBgGlow)" />
    <rect width="494" height="494" x="3" y="3" rx="108" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeOpacity="0.25" />

    {/* Emblem: B + House + Leaf + 1 */}
    <g filter="url(#logoShadow)">
      {/* White 'B' Shape */}
      <path
        d="M 125,70 L 280,70 C 335,70 375,100 375,150 C 375,178 358,202 328,214 C 370,226 395,258 395,302 C 395,360 345,395 270,395 L 125,395 Z M 245,260 L 270,260 C 305,260 325,278 325,310 C 325,340 305,355 270,355 L 245,355 Z"
        fill="#ffffff"
        fillRule="evenodd"
      />

      {/* House Silhouette */}
      <path
        d="M 155,195 L 220,132 L 285,195 L 285,325 C 285,335 278,342 268,342 L 172,342 C 162,342 155,335 155,325 Z"
        fill="#0c421b"
      />

      {/* 4 Windows */}
      <rect x="201" y="192" width="16" height="16" rx="2.5" fill="#ffffff" />
      <rect x="223" y="192" width="16" height="16" rx="2.5" fill="#ffffff" />
      <rect x="201" y="214" width="16" height="16" rx="2.5" fill="#ffffff" />
      <rect x="223" y="214" width="16" height="16" rx="2.5" fill="#ffffff" />

      {/* Orange '1' */}
      <path
        d="M 324,182 L 388,120 L 388,285 C 388,328 368,368 314,395 C 352,365 365,330 365,285 L 365,195 L 345,212 Z"
        fill="url(#logoOrangeOne)"
      />

      {/* Leaf Bottom & Top */}
      <path
        d="M 125,345 C 130,290 175,255 235,248 C 238,295 205,342 155,355 C 138,358 128,353 125,345 Z"
        fill="url(#logoLeafBottom)"
      />
      <path
        d="M 125,345 C 140,285 185,250 240,248 C 210,270 170,295 140,345 Z"
        fill="url(#logoLeafTop)"
      />
      <path
        d="M 136,338 Q 185,288 238,249"
        stroke="#0e4a1a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>

    {/* Integrated Text Inside Squircle: BERKAH — One — */}
    <g textAnchor="middle" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif">
      <text x="250" y="408" fill="#ffffff" fontSize="48" fontWeight="900" letterSpacing="5">
        BERKAH
      </text>
      <line x1="130" y1="441" x2="185" y2="441" stroke="#ff8f00" strokeWidth="5" strokeLinecap="round" />
      <text x="250" y="452" fill="#ff8f00" fontSize="42" fontWeight="800">
        One
      </text>
      <line x1="315" y1="441" x2="370" y2="441" stroke="#ff8f00" strokeWidth="5" strokeLinecap="round" />
    </g>
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  className = '',
  theme = 'light'
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
    '2xl': 'w-36 h-36'
  };

  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-lg', sub: 'text-[11px]' },
    lg: { title: 'text-2xl', sub: 'text-xs' },
    xl: { title: 'text-3xl', sub: 'text-sm' },
    '2xl': { title: 'text-4xl', sub: 'text-base' }
  };

  const IconGraphic = (
    <div className={`relative ${iconSizes[size]} drop-shadow-md flex items-center justify-center flex-shrink-0 transition-transform hover:scale-[1.02]`}>
      <BerkahOneIcon className="w-full h-full drop-shadow-sm" />
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{IconGraphic}</div>;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {IconGraphic}
        {showSubtitle && (
          <div className="mt-2.5">
            <p className={`text-xs font-semibold tracking-wider uppercase ${theme === 'dark' ? 'text-emerald-200/90' : 'text-slate-600'}`}>
              RT 02 RW 14 Tanjung Sari
            </p>
          </div>
        )}
      </div>
    );
  }

  // Horizontal variant (standard header / navbar)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {IconGraphic}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className={`font-black tracking-wider uppercase ${theme === 'dark' ? 'text-white' : 'text-emerald-950'} ${textSizes[size].title}`}>
            BERKAH
          </span>
          <span className={`font-black tracking-tight text-orange-500 ${textSizes[size].title}`}>
            One
          </span>
        </div>
        {showSubtitle && (
          <span className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${theme === 'dark' ? 'text-emerald-300/80' : 'text-emerald-800/80'}`}>
            Sistim Informasi RT 02 RW 14 Tanjung Sari
          </span>
        )}
      </div>
    </div>
  );
};
export default Logo;

