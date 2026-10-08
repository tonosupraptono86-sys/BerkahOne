import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PDFExportOptions {
  element: HTMLElement;
  filename: string;
  action?: 'download' | 'open' | 'both';
}

export interface PDFExportResult {
  success: boolean;
  blobUrl?: string;
  blob?: Blob;
  filename: string;
}

/**
 * Exports a given DOM element to a professional A4 PDF.
 * Supports clean multi-page pagination using canvas chunking to avoid overlap.
 */
export async function exportElementToPDF({
  element,
  filename,
  action = 'download'
}: PDFExportOptions): Promise<PDFExportResult> {
  try {
    // Capture element with high-definition scale (scale 2)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // A4 Portrait dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 8; // 8mm margin
    const contentWidth = pdfWidth - margin * 2;
    const totalPdfHeight = (canvas.height * contentWidth) / canvas.width;
    const pageAvailableHeight = pdfHeight - margin * 2;

    if (totalPdfHeight <= pageAvailableHeight) {
      // Single page document
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, totalPdfHeight, undefined, 'FAST');
    } else {
      // Multi-page document: slice canvas in source pixel coordinates
      const pxPageHeight = Math.floor((canvas.width * pageAvailableHeight) / contentWidth);
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const remainingPx = canvas.height - renderedHeight;
        const currentChunkPx = Math.min(pxPageHeight, remainingPx);

        const chunkCanvas = document.createElement('canvas');
        chunkCanvas.width = canvas.width;
        chunkCanvas.height = currentChunkPx;

        const chunkCtx = chunkCanvas.getContext('2d');
        if (chunkCtx) {
          chunkCtx.fillStyle = '#ffffff';
          chunkCtx.fillRect(0, 0, chunkCanvas.width, chunkCanvas.height);
          chunkCtx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            currentChunkPx,
            0,
            0,
            canvas.width,
            currentChunkPx
          );
        }

        const chunkImgData = chunkCanvas.toDataURL('image/jpeg', 0.95);
        const chunkPdfHeight = (currentChunkPx * contentWidth) / canvas.width;

        pdf.addImage(chunkImgData, 'JPEG', margin, margin, contentWidth, chunkPdfHeight, undefined, 'FAST');

        // Footer page numbering
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const footerTitle = filename.toLowerCase().includes('kas')
          ? 'Laporan Rekapitulasi Buku Kas Besar'
          : 'Laporan Rekapitulasi Statistik & Demografi Warga';
        pdf.text(
          `Halaman ${pageIndex + 1} - ${footerTitle} • RT 02 RW 14 BerkahOne`,
          pdfWidth / 2,
          pdfHeight - 3,
          { align: 'center' }
        );

        renderedHeight += currentChunkPx;
        pageIndex++;
      }
    }

    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    if (action === 'download' || action === 'both') {
      try {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1200);
      } catch (err) {
        console.warn('Auto link download failed:', err);
      }
    }

    if (action === 'open') {
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Fallback to direct download if popup blocked
        pdf.save(filename);
      }
    }

    return {
      success: true,
      blobUrl,
      blob,
      filename
    };
  } catch (error) {
    console.error('Error in exportElementToPDF:', error);
    throw error;
  }
}
