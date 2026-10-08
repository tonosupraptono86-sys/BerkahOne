import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PembayaranIuran, Warga } from '../../types';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { exportElementToJPEG, shareOrDownloadJPEG } from '../../utils/imageExport';
import {
  X,
  Printer,
  Receipt,
  Edit2,
  MessageCircle,
  Copy,
  Check,
  Phone,
  ChevronDown,
  ChevronUp,
  Trash2,
  QrCode,
  ShieldCheck,
  Calendar,
  User,
  CreditCard,
  Coins,
  Wallet,
  PiggyBank,
  CheckCircle2,
  BadgeCheck,
  Building2,
  Sparkles,
  Download,
  Image as ImageIcon,
  Share2
} from 'lucide-react';

interface KwitansiModalProps {
  selectedKwitansi: PembayaranIuran;
  onClose: () => void;
  onKoreksi?: (item: PembayaranIuran) => void;
  onDelete?: (item: PembayaranIuran) => void;
  canManage?: boolean;
  wargaList?: Warga[];
}

const BULAN_NAMES = [
  { key: '2026-01', label: 'Januari 2026' },
  { key: '2026-02', label: 'Februari 2026' },
  { key: '2026-03', label: 'Maret 2026' },
  { key: '2026-04', label: 'April 2026' },
  { key: '2026-05', label: 'Mei 2026' },
  { key: '2026-06', label: 'Juni 2026' },
  { key: '2026-07', label: 'Juli 2026' },
  { key: '2026-08', label: 'Agustus 2026' },
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-10', label: 'Oktober 2026' },
  { key: '2026-11', label: 'November 2026' },
  { key: '2026-12', label: 'Desember 2026' }
];

export const formatRupiah = (amount: number): string => {
  if (amount < 0) {
    return '-Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const terbilangRupiah = (nominal: number): string => {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  const angka = Math.floor(nominal);
  if (angka === 0) return 'Nol Rupiah';

  const konversi = (n: number): string => {
    if (n < 12) return bilangan[n];
    if (n < 20) return konversi(n - 10) + ' Belas';
    if (n < 100) return konversi(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + konversi(n % 10) : '');
    if (n < 200) return 'Seratus' + (n % 100 !== 0 ? ' ' + konversi(n - 100) : '');
    if (n < 1000) return konversi(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + konversi(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n % 1000 !== 0 ? ' ' + konversi(n - 1000) : '');
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + konversi(n % 1000) : '');
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + konversi(n % 1000000) : '');
    return konversi(Math.floor(n / 1000000000)) + ' Milyar' + (n % 1000000000 !== 0 ? ' ' + konversi(n % 1000000000) : '');
  };

  return (konversi(angka) + ' Rupiah').trim();
};

export const formatWhatsAppNumber = (num: string): string => {
  let clean = num.replace(/\D/g, '');
  if (!clean) return '';
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
};

export const getBulanLabelFromKey = (bulanKey: string): string => {
  if (bulanKey === 'periode-sebelum') {
    return 'Tunggakan / Tahun Sebelum 2026';
  }
  return BULAN_NAMES.find((b) => b.key === bulanKey)?.label || bulanKey;
};

export interface CitizenContactDetails {
  personKontak: string;
  phone: string;
  isFromKK?: boolean;
}

export const findCitizenContactDetails = (
  payment: PembayaranIuran,
  wargaList?: Warga[]
): CitizenContactDetails => {
  if (!wargaList || wargaList.length === 0) {
    return { personKontak: '-', phone: '' };
  }

  // 1. Cek warga dengan nama sama persis di KK tersebut
  const exactMatch = wargaList.find(
    (w) =>
      w.noKk === payment.noKk &&
      w.nama.toLowerCase() === payment.namaWarga.toLowerCase()
  );

  // 2. Cek Kepala Keluarga di KK tersebut
  const kepalaMatch = wargaList.find(
    (w) =>
      w.noKk === payment.noKk &&
      w.statusKeluarga === 'Kepala Keluarga'
  );

  // 3. Cek anggota keluarga di KK tersebut yang memiliki personKontak atau no telepon
  const anyMemberWithPerson = wargaList.find(
    (w) => w.noKk === payment.noKk && w.personKontak && w.personKontak.trim() !== ''
  );
  const anyMemberWithPhone = wargaList.find(
    (w) =>
      w.noKk === payment.noKk &&
      (w.noHp || w.telepon) &&
      (w.noHp || w.telepon)!.trim() !== ''
  );

  // 4. Cari berdasarkan kecocokan nama saja jika noKk tidak cocok
  const nameOnlyMatch = wargaList.find(
    (w) =>
      w.nama.toLowerCase() === payment.namaWarga.toLowerCase()
  );

  // Tentukan Person Kontak
  let person = '';
  let isFromKK = false;

  if (exactMatch?.personKontak?.trim()) {
    person = exactMatch.personKontak.trim();
  } else if (exactMatch && exactMatch.statusKeluarga === 'Kepala Keluarga') {
    person = `${exactMatch.nama} (Kepala Keluarga)`;
  } else if (kepalaMatch?.personKontak?.trim()) {
    person = kepalaMatch.personKontak.trim();
    isFromKK = true;
  } else if (kepalaMatch?.nama) {
    person = `${kepalaMatch.nama} (Kepala Keluarga)`;
    isFromKK = true;
  } else if (anyMemberWithPerson?.personKontak?.trim()) {
    person = anyMemberWithPerson.personKontak.trim();
    isFromKK = true;
  } else if (nameOnlyMatch?.personKontak?.trim()) {
    person = nameOnlyMatch.personKontak.trim();
  } else if (payment.namaWarga) {
    person = payment.namaWarga;
  }

  // Tentukan Nomor Telepon
  let phone = '';
  if (exactMatch && (exactMatch.noHp || exactMatch.telepon)) {
    phone = (exactMatch.noHp || exactMatch.telepon)!.trim();
  } else if (kepalaMatch && (kepalaMatch.noHp || kepalaMatch.telepon)) {
    phone = (kepalaMatch.noHp || kepalaMatch.telepon)!.trim();
  } else if (anyMemberWithPhone && (anyMemberWithPhone.noHp || anyMemberWithPhone.telepon)) {
    phone = (anyMemberWithPhone.noHp || anyMemberWithPhone.telepon)!.trim();
  } else if (nameOnlyMatch && (nameOnlyMatch.noHp || nameOnlyMatch.telepon)) {
    phone = (nameOnlyMatch.noHp || nameOnlyMatch.telepon)!.trim();
  }

  return {
    personKontak: person || '-',
    phone,
    isFromKK
  };
};

export const findCitizenPersonKontak = (
  payment: PembayaranIuran,
  wargaList?: Warga[]
): string => {
  return findCitizenContactDetails(payment, wargaList).personKontak;
};

export const findCitizenPhone = (
  payment: PembayaranIuran,
  wargaList?: Warga[]
): string => {
  return findCitizenContactDetails(payment, wargaList).phone;
};

export const directSendWhatsAppKwitansi = (
  payment: PembayaranIuran,
  wargaList?: Warga[],
  customNote?: string
): { success: boolean; hasPhone: boolean; phone: string } => {
  const contactDetails = findCitizenContactDetails(payment, wargaList);
  const cleanNumber = formatWhatsAppNumber(contactDetails.phone);
  const bulanLabel = getBulanLabelFromKey(payment.bulan);
  const messageText = generateKwitansiWhatsAppMessage(
    payment,
    bulanLabel,
    customNote,
    contactDetails.personKontak
  );
  const encoded = encodeURIComponent(messageText);

  if (cleanNumber) {
    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    return { success: true, hasPhone: true, phone: cleanNumber };
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
    return { success: true, hasPhone: false, phone: '' };
  }
};

export const generateKwitansiWhatsAppMessage = (
  k: PembayaranIuran,
  bulanLabel: string,
  customNote?: string,
  personKontakOrWargaList?: string | Warga[]
): string => {
  const jimpitan = formatRupiah(k.rincian?.jimpitan ?? 0);
  const uangMeja = formatRupiah(k.rincian?.uangMeja ?? 0);
  const tabungan = formatRupiah(k.rincian?.tabungan ?? 0);
  const total = formatRupiah(k.nominal);
  const terbilang = terbilangRupiah(k.nominal);

  let personKontakText = '';
  if (typeof personKontakOrWargaList === 'string') {
    personKontakText = personKontakOrWargaList;
  } else if (Array.isArray(personKontakOrWargaList)) {
    personKontakText = findCitizenPersonKontak(k, personKontakOrWargaList);
  }

  let msg = `🏛️ *E-KUITANSI RESMI IURAN RT 02 RW 14*\n`;
  msg += `Kelurahan Pedurungan Tengah, Kec. Pedurungan\n`;
  msg += `Kota Semarang, Jawa Tengah 50192\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📄 *No. Kuitansi* : \`${k.noKwitansi}\`\n`;
  msg += `📅 *Tanggal Bayar*: ${k.tanggalBayar}\n`;
  msg += `👤 *Nama Warga*   : *${k.namaWarga}*\n`;
  msg += `🏠 *No. KK*       : \`${k.noKk}\`\n`;
  if (personKontakText && personKontakText !== '-') {
    msg += `📞 *Person Kontak*: ${personKontakText}\n`;
  }
  msg += `🗓️ *Pembayaran*   : Iuran Bulan ${bulanLabel}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*RINCIAN PENETAPAN IURAN:*\n`;
  if ((k.rincian?.jimpitan ?? 0) > 0) {
    msg += `• Jimpitan Warga : ${jimpitan}\n`;
  }
  if ((k.rincian?.uangMeja ?? 0) > 0) {
    msg += `• Uang Meja      : ${uangMeja}\n`;
  }
  if ((k.rincian?.tabungan ?? 0) > 0) {
    msg += `• Tabungan       : ${tabungan}\n`;
  }
  if (!(k.rincian?.jimpitan || k.rincian?.uangMeja || k.rincian?.tabungan)) {
    msg += `• Iuran Warga    : ${total}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL DIBAYAR: ${total}*\n`;
  msg += `_(# ${terbilang} #)_\n\n`;
  msg += `💳 *Metode*   : ${k.metode}\n`;
  msg += `✍️ *Penerima* : ${k.penerima} (Bendahara RT)\n`;
  msg += `✅ *Status*   : *LUNAS & TERCATAT SAH*\n`;

  if (customNote && customNote.trim()) {
    msg += `\n📝 *Catatan Tambahan*:\n${customNote.trim()}\n`;
  } else if (k.catatan && k.catatan.trim()) {
    msg += `\n📝 *Catatan*:\n${k.catatan.trim()}\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Terima kasih atas partisipasi dan kepedulian Bapak/Ibu dalam mendukung kas dan kemakmuran lingkungan RT 02 RW 14._`;

  return msg;
};

export const KwitansiModal: React.FC<KwitansiModalProps> = ({
  selectedKwitansi,
  onClose,
  onKoreksi,
  onDelete,
  canManage,
  wargaList
}) => {
  const [targetPhone, setTargetPhone] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedNo, setCopiedNo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [qrBendaharaUrl, setQrBendaharaUrl] = useState<string>('');
  const [viewStyle, setViewStyle] = useState<'modern' | 'slip'>('modern');
  const [isExportingJpeg, setIsExportingJpeg] = useState(false);

  const receiptCardRef = useRef<HTMLDivElement>(null);

  const contactDetails = useMemo(() => {
    return findCitizenContactDetails(selectedKwitansi, wargaList);
  }, [selectedKwitansi, wargaList]);

  const personKontak = contactDetails.personKontak;

  // Transaction digital verification token
  const verificationToken = useMemo(() => {
    const raw = `${selectedKwitansi.id}-${selectedKwitansi.noKwitansi}-${selectedKwitansi.nominal}-${selectedKwitansi.tanggalBayar}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `RT02-AUTH-${hex}`;
  }, [selectedKwitansi]);

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      const qrText = `E-KUITANSI RESMI IURAN RT 02 RW 14
No. Bukti : ${selectedKwitansi.noKwitansi || selectedKwitansi.id}
Token Auth: ${verificationToken}
Tanggal   : ${selectedKwitansi.tanggalBayar}
Nama KK   : ${selectedKwitansi.namaWarga} (KK: ${selectedKwitansi.noKk})
${personKontak && personKontak !== '-' ? `Kontak    : ${personKontak}\n` : ''}Nominal   : ${formatRupiah(selectedKwitansi.nominal)}
Metode    : ${selectedKwitansi.metode}
Penerima  : ${selectedKwitansi.penerima} (Bendahara RT 02)
Status    : SAH & LUNAS TERCATAT (Sistem Kas RT 02)`;

      try {
        const url = await generateQRCodeWithBerkahOneLogo(qrText, 240);
        if (isMounted) setQrBendaharaUrl(url);
      } catch (e) {
        console.error('Error generating QR Bendahara for Kwitansi:', e);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [selectedKwitansi, personKontak, verificationToken]);

  useEffect(() => {
    if (!selectedKwitansi) return;
    setTargetPhone(contactDetails.phone);
  }, [selectedKwitansi, contactDetails.phone]);

  const currentBulanLabel = useMemo(() => {
    return getBulanLabelFromKey(selectedKwitansi.bulan);
  }, [selectedKwitansi.bulan]);

  const messageText = useMemo(() => {
    return generateKwitansiWhatsAppMessage(
      selectedKwitansi,
      currentBulanLabel,
      customNote,
      personKontak
    );
  }, [selectedKwitansi, currentBulanLabel, customNote, personKontak]);

  const handleSendWhatsApp = () => {
    const cleanNumber = formatWhatsAppNumber(targetPhone);
    const encoded = encodeURIComponent(messageText);
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  const handleCopyNoKwitansi = async () => {
    try {
      await navigator.clipboard.writeText(selectedKwitansi.noKwitansi || selectedKwitansi.id);
      setCopiedNo(true);
      setTimeout(() => setCopiedNo(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJpeg = async () => {
    if (!receiptCardRef.current) return;
    setIsExportingJpeg(true);
    try {
      const filename = `Kwitansi_${(selectedKwitansi.noKwitansi || selectedKwitansi.id).replace(/[^a-zA-Z0-9]/g, '_')}_${selectedKwitansi.namaWarga.replace(/\s+/g, '_')}.jpg`;
      await exportElementToJPEG(receiptCardRef.current, filename, 0.95);
    } catch (err) {
      console.error('Gagal mengekspor kuitansi JPEG:', err);
    } finally {
      setIsExportingJpeg(false);
    }
  };

  const handleSendJpegWhatsApp = async () => {
    if (!receiptCardRef.current) return;
    setIsExportingJpeg(true);
    try {
      const filename = `Kwitansi_${(selectedKwitansi.noKwitansi || selectedKwitansi.id).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      await shareOrDownloadJPEG(
        receiptCardRef.current,
        filename,
        targetPhone,
        messageText,
        `E-Kuitansi ${selectedKwitansi.noKwitansi || ''} RT 02 RW 14`
      );
    } catch (err) {
      console.error('Gagal membagikan JPEG kuitansi:', err);
    } finally {
      setIsExportingJpeg(false);
    }
  };

  const rincianJimpitan = selectedKwitansi.rincian?.jimpitan ?? 0;
  const rincianUangMeja = selectedKwitansi.rincian?.uangMeja ?? 0;
  const rincianTabungan = selectedKwitansi.rincian?.tabungan ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[95vh] flex flex-col">
        {/* Header Modal Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-200 mb-4 print:hidden shrink-0 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  E-Kuitansi Pembayaran Iuran
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Resmi RT 02</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kel. Pedurungan Tengah &bull; Kas Rukun Tetangga 02 RW 14
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
            {/* View Style Switcher */}
            <div className="inline-flex p-0.5 bg-slate-200 rounded-xl text-[11px] font-semibold border border-slate-300">
              <button
                type="button"
                onClick={() => setViewStyle('modern')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewStyle === 'modern'
                    ? 'bg-white text-emerald-950 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format Kartu Modern E-Receipt"
              >
                Modern
              </button>
              <button
                type="button"
                onClick={() => setViewStyle('slip')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewStyle === 'slip'
                    ? 'bg-white text-emerald-950 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format Cetak Slip Kedinasan Klasik"
              >
                Slip Fisik
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportJpeg}
              disabled={isExportingJpeg}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:border-slate-400 disabled:opacity-50"
              title="Unduh E-Kuitansi dalam format gambar JPEG (Kualitas Tinggi)"
            >
              <Download className="w-3.5 h-3.5 text-slate-700" />
              <span>{isExportingJpeg ? 'Mengolah JPEG...' : 'Unduh JPEG'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:border-slate-400"
              title="Cetak Kuitansi ke Printer atau Simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              type="button"
              id="btn-close-kwitansi-top"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              title="Tutup / Batal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto space-y-4 pr-0.5 custom-scrollbar">
          {/* Card Wrapper for HTML2Canvas JPEG Capture */}
          <div ref={receiptCardRef} data-export-root="true" className="rounded-2xl overflow-hidden bg-white">
            {/* ========================================================================= */}
            {/* TAMPILAN 1: MODERN E-RECEIPT (CARD DESIGN PREMIUM)                        */}
            {/* ========================================================================= */}
            {viewStyle === 'modern' ? (
              <div className="relative rounded-2xl bg-white shadow-md border border-slate-200/90 text-slate-900 overflow-hidden font-sans print:shadow-none print:border print:border-slate-800 print:rounded-none">
              {/* Header Gradient Top Banner */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white p-4 sm:p-5 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/20 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-black shadow-md border border-white/20 shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-widest font-black uppercase text-emerald-300">
                          RUKUN TETANGGA 02 &bull; RW 14
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                        E-Kuitansi Iuran Warga
                      </h4>
                      <p className="text-[10px] text-emerald-100/70">
                        Kel. Pedurungan Tengah, Pedurungan, Kota Semarang
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-bold backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>LUNAS &amp; SAH</span>
                    </div>
                    <span className="text-[9px] text-emerald-100/60 font-mono mt-1">
                      {selectedKwitansi.tanggalBayar}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta Strip: No. Kuitansi & Metode */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">No. Bukti:</span>
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    <span className="font-mono font-bold text-slate-800">
                      {selectedKwitansi.noKwitansi}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNoKwitansi}
                      className="text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer transition-colors"
                      title="Salin nomor kuitansi"
                    >
                      {copiedNo ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Metode:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-bold text-[11px]">
                    <CreditCard className="w-3 h-3 text-emerald-700" />
                    <span>{selectedKwitansi.metode}</span>
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Hero Total Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-200/90 text-center relative overflow-hidden">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
                    Total Pembayaran Diterima
                  </div>
                  <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-950 tracking-tight my-1">
                    {formatRupiah(selectedKwitansi.nominal)}
                  </div>
                  <div className="text-xs text-slate-600 italic font-serif max-w-md mx-auto">
                    &ldquo;{terbilangRupiah(selectedKwitansi.nominal)}&rdquo;
                  </div>
                </div>

                {/* Dua Kartu Identitas: Warga & Peruntukan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Card Warga */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-1 border-b border-slate-200">
                      <User className="w-3 h-3 text-slate-600" />
                      <span>Identitas Pembayar</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {selectedKwitansi.namaWarga}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        No. KK: {selectedKwitansi.noKk}
                      </div>
                    </div>
                    {personKontak && personKontak !== '-' && (
                      <div className="text-[11px] text-slate-700 pt-0.5">
                        <span className="text-slate-500 font-medium">Kontak: </span>
                        <span className="font-bold text-slate-900">{personKontak}</span>
                        {contactDetails.phone && (
                          <span className="text-slate-500 font-mono text-[10px] ml-1">
                            ({contactDetails.phone})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-600">
                      <span className="text-slate-500 font-medium">Alamat: </span>
                      <span>{selectedKwitansi.alamat || 'RT 02 RW 14 Tanjung Sari'}</span>
                    </div>
                  </div>

                  {/* Card Peruntukan */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider pb-1 border-b border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span>Peruntukan Pembayaran</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Iuran Bulan {currentBulanLabel}
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        Kategori: {selectedKwitansi.kategoriIuran}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-700 pt-0.5">
                      <span className="text-slate-500 font-medium">Diterima Oleh: </span>
                      <span className="font-bold text-slate-900">{selectedKwitansi.penerima}</span>
                      <span className="text-slate-500 text-[10px]"> (Bendahara RT)</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <span className="text-slate-500 font-medium">Status Akun: </span>
                      <span className="font-bold text-emerald-700">Tercatat di Kas RT 02</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown Komponen Penetapan */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-3.5 py-2 text-[11px] font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
                    <span className="uppercase tracking-wider">Rincian Komponen Penetapan Iuran</span>
                    <span className="text-slate-500 font-normal">Sesuai penetapan KK</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-medium text-slate-700">1. Jimpitan Warga</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(rincianJimpitan)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-medium text-slate-700">2. Uang Meja RT</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(rincianUangMeja)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-medium text-slate-700">3. Tabungan Warga</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(rincianTabungan)}
                      </span>
                    </div>

                    {/* Catatan jika ada */}
                    {selectedKwitansi.catatan && (
                      <div className="px-3.5 py-2 bg-amber-50/60 text-amber-900 text-[11px] italic">
                        <strong>Catatan:</strong> {selectedKwitansi.catatan}
                      </div>
                    )}

                    {/* Total Bar */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 font-bold">
                      <span className="text-slate-900">Total Sah Terbayar</span>
                      <span className="font-mono text-sm text-emerald-950 font-extrabold">
                        {formatRupiah(selectedKwitansi.nominal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="relative my-4">
                  <div className="border-t-2 border-dashed border-slate-300" />
                  <div className="absolute -left-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-100 rounded-full border border-slate-300" />
                  <div className="absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-100 rounded-full border border-slate-300" />
                </div>

                {/* Bagian Keabsahan & Pengesahan Digital */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                  {/* Left: QR Code Verification */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="p-1 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
                      {qrBendaharaUrl ? (
                        <img
                          src={qrBendaharaUrl}
                          alt="QR Verifikasi Digital"
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                          QR Verifikasi
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verifikasi Digital Sah</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Pindai kode QR untuk memeriksa validitas catatan transaksi di buku kas RT 02.
                      </p>
                      <div className="font-mono text-[9px] text-slate-500 font-bold">
                        {verificationToken}
                      </div>
                    </div>
                  </div>

                  {/* Right: Bendahara Signature & Digital Stamp */}
                  <div className="text-center sm:text-right relative p-2">
                    <div className="text-[10px] text-slate-500">
                      Semarang, {selectedKwitansi.tanggalBayar}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 mt-0.5">
                      Penerima (Bendahara RT 02),
                    </div>

                    {/* Official Digital Stamp Graphic */}
                    <div className="my-1.5 flex justify-center sm:justify-end">
                      <div className="relative inline-flex items-center justify-center w-24 h-24 border-2 border-emerald-700/80 rounded-full text-emerald-800 font-bold text-[8px] uppercase tracking-tighter rotate-[-6deg] bg-emerald-50/30 p-1 select-none pointer-events-none">
                        <div className="w-full h-full border border-dashed border-emerald-600 rounded-full flex flex-col items-center justify-center p-1 text-center">
                          <span className="font-black text-[7px] text-emerald-900">RT 02 RW 14</span>
                          <span className="font-extrabold text-[8px] text-emerald-700 my-0.5">LUNAS</span>
                          <span className="text-[6.5px] text-emerald-800">PEDURUNGAN</span>
                        </div>
                      </div>
                    </div>

                    <div className="font-extrabold text-slate-900 text-xs underline">
                      {selectedKwitansi.penerima}
                    </div>
                    <div className="text-[9px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-center sm:justify-end gap-1">
                      <BadgeCheck className="w-3 h-3 text-emerald-600" />
                      <span>Tercatat Resmi Kas RT 02</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAMPILAN 2: FORMAT SLIP KEDINASAN KLASIK (PRINT OPTIMIZED)                */
            /* ========================================================================= */
            <div className="border-2 border-slate-900 p-6 rounded-xl bg-white text-slate-900 font-sans space-y-4 print:border-none print:p-0">
              {/* Kop Kuitansi */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  RUKUN TETANGGA 02 RUKUN WARGA 14
                </h4>
                <div className="text-xs font-bold text-slate-800">
                  KELURAHAN PEDURUNGAN TENGAH, KECAMATAN PEDURUNGAN
                </div>
                <div className="text-[10px] text-slate-600">
                  KOTA SEMARANG &bull; PROVINSI JAWA TENGAH 50192
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-b border-slate-300 pb-2">
                <span className="font-extrabold text-sm tracking-wide">
                  KUITANSI PEMBAYARAN IURAN WARGA
                </span>
                <span className="font-mono text-xs font-bold text-slate-800">
                  No: {selectedKwitansi.noKwitansi}
                </span>
              </div>

              {/* Rincian Identitas */}
              <div className="space-y-2 text-xs">
                <div className="flex">
                  <span className="w-36 text-slate-600 shrink-0">Telah Terima Dari</span>
                  <span className="font-bold text-slate-900">: {selectedKwitansi.namaWarga}</span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-600 shrink-0">Nomor KK</span>
                  <span className="font-mono font-medium text-slate-800">: {selectedKwitansi.noKk}</span>
                </div>
                {personKontak && personKontak !== '-' && (
                  <div className="flex">
                    <span className="w-36 text-slate-600 shrink-0">Person Kontak</span>
                    <span className="font-semibold text-slate-800">: {personKontak} {contactDetails.phone ? `(${contactDetails.phone})` : ''}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="w-36 text-slate-600 shrink-0">Untuk Pembayaran</span>
                  <span className="font-semibold text-slate-900">: Iuran Bulan {currentBulanLabel}</span>
                </div>

                {/* Komponen Breakdown */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5 my-2">
                  <div className="text-[10px] font-bold uppercase text-slate-600 border-b border-slate-300 pb-1">
                    Rincian Komponen Penetapan:
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>1. Jimpitan Warga:</span>
                    <span className="font-mono font-bold">{formatRupiah(rincianJimpitan)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>2. Uang Meja RT:</span>
                    <span className="font-mono font-bold">{formatRupiah(rincianUangMeja)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>3. Tabungan Warga:</span>
                    <span className="font-mono font-bold">{formatRupiah(rincianTabungan)}</span>
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className="w-36 text-slate-600 shrink-0">Uang Sejumlah</span>
                  <span className="font-serif italic font-bold text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 text-xs">
                    # {terbilangRupiah(selectedKwitansi.nominal)} #
                  </span>
                </div>
                <div className="flex">
                  <span className="w-36 text-slate-600 shrink-0">Metode Pembayaran</span>
                  <span className="font-medium text-slate-800">: {selectedKwitansi.metode}</span>
                </div>
                {selectedKwitansi.catatan && (
                  <div className="flex">
                    <span className="w-36 text-slate-600 shrink-0">Catatan Khusus</span>
                    <span className="italic text-slate-700">: {selectedKwitansi.catatan}</span>
                  </div>
                )}
              </div>

              {/* Bawah: Total & Tanda Tangan */}
              <div className="pt-4 border-t-2 border-slate-800 flex items-center justify-between">
                <div className="border-2 border-slate-900 p-3 rounded-lg bg-slate-50">
                  <div className="text-[10px] uppercase font-bold text-slate-700">Terbayar Lunas:</div>
                  <div className="text-xl font-black font-mono text-slate-950">
                    {formatRupiah(selectedKwitansi.nominal)}
                  </div>
                </div>

                <div className="text-center text-xs flex flex-col items-center">
                  <div className="text-slate-600 text-[11px]">
                    Semarang, {selectedKwitansi.tanggalBayar}
                  </div>
                  <div className="font-bold text-slate-800 mb-1">
                    Penerima (Bendahara RT 02),
                  </div>

                  {qrBendaharaUrl && (
                    <div className="my-1 p-1 border border-slate-300 rounded bg-white">
                      <img src={qrBendaharaUrl} alt="QR Verifikasi" className="w-14 h-14" />
                    </div>
                  )}

                  <div className="font-black text-slate-900 underline mt-1">
                    {selectedKwitansi.penerima}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    Token: {verificationToken}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* ========================================================================= */}
          {/* INTEGRASI WHATSAPP CARD (PRINT: HIDDEN)                                    */}
          {/* ========================================================================= */}
          <div className="border border-emerald-300/80 bg-white p-4 rounded-2xl space-y-3 print:hidden shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Kirim Kuitansi Digital via WhatsApp</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      1-Klik
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Kirim bukti bayar resmi langsung ke kontak WhatsApp warga
                  </p>
                </div>
              </div>

              {/* Tombol Toggle Pratinjau Teks */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <span>{showPreview ? 'Tutup Format' : 'Lihat Format Pesan'}</span>
                {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Input Nomor Telepon WhatsApp */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-700" />
                  <span>No. WhatsApp Tujuan:</span>
                </label>
                {targetPhone && (
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                    +{formatWhatsAppNumber(targetPhone)}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 (atau kosongkan untuk pilih kontak langsung di WA)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono bg-white shadow-2xs"
                />
                {targetPhone && (
                  <button
                    type="button"
                    onClick={() => setTargetPhone('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Kosongkan nomor"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Pratinjau Teks WhatsApp & Catatan Tambahan (Bisa Dilipat) */}
            {showPreview && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Catatan Tambahan untuk WhatsApp (Opsional):
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Contoh: Titipan diterima saat ronda malam, terima kasih!"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider">Format Pesan WhatsApp:</span>
                    <span>Teks Rapi Siap Kirim</span>
                  </div>
                  <div className="p-3 bg-[#EFEAE2] rounded-xl border border-slate-300 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto select-all shadow-inner">
                    {messageText}
                  </div>
                </div>
              </div>
            )}

            {/* Tombol Aksi WhatsApp */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-kirim-wa-body"
                onClick={handleSendWhatsApp}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-md"
                title="Buka WhatsApp dan kirim teks rincian kuitansi"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Kirim Teks via WA</span>
              </button>

              <button
                type="button"
                onClick={handleSendJpegWhatsApp}
                disabled={isExportingJpeg}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-md disabled:opacity-50"
                title="Unduh gambar JPEG kuitansi dan buka WhatsApp dengan pesan siap kirim"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isExportingJpeg ? 'Mengolah JPEG...' : 'Kirim Gambar JPEG via WA'}</span>
              </button>

              <button
                type="button"
                id="btn-salin-wa-body"
                onClick={handleCopyMessage}
                className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title="Salin isi format kuitansi ke clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center shrink-0 print:hidden">
          {canManage ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {onKoreksi && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onKoreksi(selectedKwitansi);
                  }}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Koreksi</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(selectedKwitansi);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                  title="Hapus / batalkan catatan pembayaran iuran ini"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-tutup-kwitansi-footer"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Tutup Kuitansi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
