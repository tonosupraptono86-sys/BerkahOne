import React from 'react';
import { LOGO_SEMARANG_DATA_URI, LOGO_SEMARANG_URL } from '../data/logoSemarang';

interface LogoSemarangProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const LogoSemarang: React.FC<LogoSemarangProps> = ({
  className = 'w-16 h-20',
  size,
  alt = 'Logo Pemerintah Kota Semarang'
}) => {
  return (
    <img
      src={LOGO_SEMARANG_DATA_URI || LOGO_SEMARANG_URL}
      alt={alt}
      className={`object-contain shrink-0 ${className}`}
      style={size ? { width: size, height: 'auto' } : undefined}
      loading="eager"
    />
  );
};
