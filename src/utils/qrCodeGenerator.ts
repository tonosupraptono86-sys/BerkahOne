import QRCode from 'qrcode';

export const BERKAHONE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100" height="100">
  <defs>
    <radialGradient id="bgGlow" cx="45%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#237e38" />
      <stop offset="35%" stop-color="#145d28" />
      <stop offset="70%" stop-color="#0a3c17" />
      <stop offset="100%" stop-color="#04200b" />
    </radialGradient>
    <linearGradient id="orangeOne" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffb020" />
      <stop offset="35%" stop-color="#ff8f00" />
      <stop offset="75%" stop-color="#f57c00" />
      <stop offset="100%" stop-color="#e65100" />
    </linearGradient>
    <linearGradient id="leafTop" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#55b31f" />
      <stop offset="50%" stop-color="#7bd52c" />
      <stop offset="100%" stop-color="#99e843" />
    </linearGradient>
    <linearGradient id="leafBottom" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f4a1a" />
      <stop offset="60%" stop-color="#1c752c" />
      <stop offset="100%" stop-color="#2e943c" />
    </linearGradient>
  </defs>
  <rect width="500" height="500" rx="110" fill="url(#bgGlow)" />
  <rect width="494" height="494" x="3" y="3" rx="108" fill="none" stroke="#4ade80" stroke-width="2" stroke-opacity="0.25" />
  <g id="berkahone-symbol">
    <path d="M 125,70 L 280,70 C 335,70 375,100 375,150 C 375,178 358,202 328,214 C 370,226 395,258 395,302 C 395,360 345,395 270,395 L 125,395 Z M 245,260 L 270,260 C 305,260 325,278 325,310 C 325,340 305,355 270,355 L 245,355 Z" fill="#ffffff" fill-rule="evenodd" />
    <path d="M 155,195 L 220,132 L 285,195 L 285,325 C 285,335 278,342 268,342 L 172,342 C 162,342 155,335 155,325 Z" fill="#0c421b" />
    <g fill="#ffffff">
      <rect x="201" y="192" width="16" height="16" rx="2.5" />
      <rect x="223" y="192" width="16" height="16" rx="2.5" />
      <rect x="201" y="214" width="16" height="16" rx="2.5" />
      <rect x="223" y="214" width="16" height="16" rx="2.5" />
    </g>
    <path d="M 324,182 L 388,120 L 388,285 C 388,328 368,368 314,395 C 352,365 365,330 365,285 L 365,195 L 345,212 Z" fill="url(#orangeOne)" />
    <path d="M 125,345 C 130,290 175,255 235,248 C 238,295 205,342 155,355 C 138,358 128,353 125,345 Z" fill="url(#leafBottom)" />
    <path d="M 125,345 C 140,285 185,250 240,248 C 210,270 170,295 140,345 Z" fill="url(#leafTop)" />
    <path d="M 136,338 Q 185,288 238,249" stroke="#0e4a1a" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6" />
  </g>
  <g text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif">
    <text x="250" y="408" fill="#ffffff" font-size="48" font-weight="900" letter-spacing="5">BERKAH</text>
    <line x1="130" y1="441" x2="185" y2="441" stroke="#ff8f00" stroke-width="5" stroke-linecap="round" />
    <text x="250" y="452" fill="#ff8f00" font-size="42" font-weight="800">One</text>
    <line x1="315" y1="441" x2="370" y2="441" stroke="#ff8f00" stroke-width="5" stroke-linecap="round" />
  </g>
</svg>`;

export const BERKAHONE_LOGO_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(BERKAHONE_ICON_SVG)}`;

const qrCache = new Map<string, string>();

/**
 * Generates a QR Code data URL with the BerkahOne logo embedded in the center.
 * Uses ErrorCorrectionLevel 'H' (~30% error tolerance) to ensure scan reliability.
 */
export async function generateQRCodeWithBerkahOneLogo(
  text: string,
  size = 240
): Promise<string> {
  const cacheKey = `${text}_${size}`;
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey)!;
  }

  if (typeof document === 'undefined') {
    // SSR / server fallback
    const rawQr = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    return rawQr;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    QRCode.toCanvas(
      canvas,
      text,
      {
        errorCorrectionLevel: 'H',
        width: size,
        margin: 1,
        color: {
          dark: '#064e3b', // Elegant deep emerald for BerkahOne identity
          light: '#ffffff'
        }
      },
      (err) => {
        if (err) {
          console.error('Error generating QR Canvas:', err);
          QRCode.toDataURL(text, { errorCorrectionLevel: 'H', width: size }).then(resolve);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallback = canvas.toDataURL('image/png');
          qrCache.set(cacheKey, fallback);
          resolve(fallback);
          return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const center = size / 2;
          const logoSize = Math.round(size * 0.26); // 26% is safe under 'H' (30%)
          const pad = 6;
          const bgBoxSize = logoSize + pad * 2;
          const halfBg = bgBoxSize / 2;

          // Draw white rounded background with subtle border behind the logo
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;

          const radius = 8;
          ctx.beginPath();
          ctx.roundRect(center - halfBg, center - halfBg, bgBoxSize, bgBoxSize, radius);
          ctx.fill();

          // Border around white box
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw BerkahOne logo image
          ctx.drawImage(
            img,
            center - logoSize / 2,
            center - logoSize / 2,
            logoSize,
            logoSize
          );
          ctx.restore();

          const result = canvas.toDataURL('image/png');
          qrCache.set(cacheKey, result);
          resolve(result);
        };

        img.onerror = () => {
          console.warn('Could not load BerkahOne logo SVG onto canvas, using clean QR Code');
          const fallback = canvas.toDataURL('image/png');
          qrCache.set(cacheKey, fallback);
          resolve(fallback);
        };

        img.src = BERKAHONE_LOGO_DATA_URI;
      }
    );
  });
}
