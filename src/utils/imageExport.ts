import html2canvas from 'html2canvas-pro';

export interface ImageExportResult {
  dataUrl: string;
  blob: Blob;
  filename: string;
}

/**
 * Mengonversi elemen DOM menjadi file gambar JPEG berkualitas tinggi (2x retina).
 */
export async function exportElementToJPEG(
  element: HTMLElement,
  filename: string,
  quality: number = 0.95
): Promise<ImageExportResult> {
  // Pastikan ekstensi .jpg atau .jpeg
  const cleanFilename = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')
    ? filename
    : `${filename}.jpg`;

  const canvas = await html2canvas(element, {
    scale: 2, // 2x resolusi tajam untuk layar smartphone & cetak
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      // Pastikan elemen print/layar cloned terlihat rapi
      const el = clonedDoc.querySelector(`[data-export-root="true"]`) as HTMLElement;
      if (el) {
        el.style.transform = 'none';
        el.style.boxShadow = 'none';
      }
    }
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal menghasilkan blob gambar JPEG'));
          return;
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Unduh otomatis file ke perangkat pengguna
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = cleanFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        resolve({
          dataUrl,
          blob,
          filename: cleanFilename
        });
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Mencoba membagikan gambar JPEG secara langsung (Web Share API) jika didukung perangkat,
 * atau mengunduh JPEG dan membuka WhatsApp dengan teks pengantar.
 */
export async function shareOrDownloadJPEG(
  element: HTMLElement,
  filename: string,
  whatsappNumber: string,
  whatsappMessageText: string,
  title: string = 'Dokumen RT 02 RW 14'
): Promise<{ sharedViaNative: boolean; filename: string }> {
  const result = await exportElementToJPEG(element, filename, 0.95);

  const file = new File([result.blob], result.filename, { type: 'image/jpeg' });

  // Cek apakah browser mendukung Web Share API dengan file
  const canShareFiles = typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] });

  if (canShareFiles && navigator.share) {
    try {
      await navigator.share({
        title,
        text: whatsappMessageText,
        files: [file]
      });
      return { sharedViaNative: true, filename: result.filename };
    } catch (err: any) {
      // Jika pengguna membatalkan (AbortError), abaikan
      if (err.name === 'AbortError') {
        return { sharedViaNative: true, filename: result.filename };
      }
      console.warn('Gagal membagikan melalui Web Share API, beralih ke fallback WhatsApp Web/App:', err);
    }
  }

  // Fallback: File JPEG sudah terunduh di perangkat pengguna. Buka WhatsApp agar pengguna bisa lampirkan foto.
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const formattedNumber = cleanNumber.startsWith('0')
    ? '62' + cleanNumber.slice(1)
    : cleanNumber.startsWith('8')
    ? '62' + cleanNumber
    : cleanNumber;

  const encodedText = encodeURIComponent(whatsappMessageText);
  const waUrl = formattedNumber
    ? `https://wa.me/${formattedNumber}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return { sharedViaNative: false, filename: result.filename };
}
