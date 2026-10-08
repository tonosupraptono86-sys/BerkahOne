import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Warga, TarifWargaKK, PembayaranIuran } from '../../types';
import { formatRupiah, formatWhatsAppNumber, terbilangRupiah } from './KwitansiModal';
import { LOGO_SEMARANG_DATA_URI } from '../../data/logoSemarang';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { exportElementToJPEG, shareOrDownloadJPEG } from '../../utils/imageExport';
import {
  X,
  MessageCircle,
  Phone,
  Copy,
  Check,
  Send,
  Calendar,
  User,
  Home,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  FileText,
  Download,
  Image as ImageIcon,
  Share2,
  Coins,
  Wallet,
  ShieldCheck
} from 'lucide-react';

const BULAN_NAMES = [
  { key: '2026-01', short: 'Jan', label: 'Januari 2026', isLibur: false },
  { key: '2026-02', short: 'Feb', label: 'Februari 2026', isLibur: false },
  { key: '2026-03', short: 'Mar', label: 'Maret 2026', isLibur: true },
  { key: '2026-04', short: 'Apr', label: 'April 2026', isLibur: false },
  { key: '2026-05', short: 'Mei', label: 'Mei 2026', isLibur: false },
  { key: '2026-06', short: 'Jun', label: 'Juni 2026', isLibur: false },
  { key: '2026-07', short: 'Jul', label: 'Juli 2026', isLibur: false },
  { key: '2026-08', short: 'Ags', label: 'Agustus 2026', isLibur: false },
  { key: '2026-09', short: 'Sep', label: 'September 2026', isLibur: false },
  { key: '2026-10', short: 'Okt', label: 'Oktober 2026', isLibur: false },
  { key: '2026-11', short: 'Nov', label: 'November 2026', isLibur: false },
  { key: '2026-12', short: 'Des', label: 'Desember 2026', isLibur: false }
];

export interface KKContactInfo {
  phone: string;
  personName: string;
  isKepala: boolean;
}

export const findKKContact = (noKk: string, wargaList: Warga[] = []): KKContactInfo => {
  const family = wargaList.filter((w) => w.noKk === noKk);
  const kepala = family.find((w) => w.statusKeluarga?.toLowerCase() === 'kepala keluarga') || family[0];

  let phone = (kepala?.noHp || kepala?.telepon || '').trim();
  let isKepala = true;

  if (!phone) {
    const anyWithPhone = family.find((w) => (w.noHp || w.telepon) && (w.noHp || w.telepon)!.trim() !== '');
    if (anyWithPhone) {
      phone = (anyWithPhone.noHp || anyWithPhone.telepon)!.trim();
      isKepala = anyWithPhone.statusKeluarga?.toLowerCase() === 'kepala keluarga';
    }
  }

  const personName = kepala?.personKontak?.trim() || kepala?.nama || 'Warga RT 02';

  return {
    phone,
    personName,
    isKepala
  };
};

export interface GenerateTagihanOptions {
  kk: { noKk: string; namaKepala: string };
  targetMonthKey: string;
  targetMonthLabel: string;
  kkTarif?: TarifWargaKK;
  payment?: PembayaranIuran;
  contactName?: string;
  customNote?: string;
}

export const generateTagihanWhatsAppMessage = ({
  kk,
  targetMonthKey,
  targetMonthLabel,
  kkTarif,
  payment,
  contactName,
  customNote
}: GenerateTagihanOptions): string => {
  const jimpitan = kkTarif?.ikutJimpitan ? (kkTarif?.jimpitan ?? 15000) : 0;
  const uangMeja = kkTarif?.ikutUangMeja ? (kkTarif?.uangMeja ?? 10000) : 0;
  const tabungan = kkTarif?.ikutTabungan ? (kkTarif?.tabungan ?? 0) : 0;
  const penetapanTarifKK = jimpitan + uangMeja + tabungan;

  // Koreksi atau hapus khusus bulan ini
  const koreksiVal = kkTarif?.koreksiTagihanBulan?.[targetMonthKey];
  const isDihapus = koreksiVal === 0;
  const hasKoreksi = koreksiVal !== undefined;
  const totalTarifKK = hasKoreksi ? koreksiVal! : penetapanTarifKK;

  const tagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;
  const isClosed = kkTarif?.bulanDitutup?.includes(targetMonthKey);
  const isLibur = BULAN_NAMES.find((b) => b.key === targetMonthKey)?.isLibur;

  let msg = `🏛️ *PEMBERITAHUAN TAGIHAN IURAN RT 02 RW 14*\n`;
  msg += `Kelurahan Pedurungan Tengah, Kec. Pedurungan\n`;
  msg += `Kota Semarang, Jawa Tengah 50192\n`;
  msg += `Sistem Informasi BerkahOne RT 02 Digital\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `Yth. Bapak/Ibu *${contactName || kk.namaKepala}*\n`;
  msg += `Kepala Keluarga : *${kk.namaKepala}*\n`;
  msg += `No. KK          : \`${kk.noKk}\`\n`;
  msg += `Periode Iuran   : *${targetMonthLabel}*\n\n`;

  msg += `📋 *RINCIAN PENETAPAN IURAN:*\n`;
  if (isLibur) {
    msg += `• Bulan ini adalah *BULAN LIBUR IURAN RT* (Bebas Iuran)\n`;
  } else if (isClosed) {
    msg += `• Status Periode : *DITUTUP / BEBAS IURAN*\n`;
  } else if (isDihapus) {
    msg += `• Status Periode : *TAGIHAN DIHAPUS / DIBEBASKAN (Rp 0)*\n`;
  } else {
    if (jimpitan > 0) msg += `• Jimpitan Warga : ${formatRupiah(jimpitan)}\n`;
    if (uangMeja > 0) msg += `• Uang Meja      : ${formatRupiah(uangMeja)}\n`;
    if (tabungan > 0) msg += `• Tabungan       : ${formatRupiah(tabungan)}\n`;
    if (hasKoreksi && koreksiVal !== penetapanTarifKK) {
      msg += `• Penetapan Awal : ${formatRupiah(penetapanTarifKK)}\n`;
      msg += `• *Tagihan Koreksi: ${formatRupiah(totalTarifKK)}*\n`;
    } else {
      msg += `• *Iuran Bulanan : ${formatRupiah(totalTarifKK)}*\n`;
    }
  }

  // Informasi Tagihan Tahun Sebelum
  if (tagihanSebelum < 0) {
    msg += `• Tunggakan Thn Sblm : -${formatRupiah(Math.abs(tagihanSebelum))} (Kurang Bayar)\n`;
  } else if (tagihanSebelum > 0) {
    msg += `• Saldo Thn Sblm    : +${formatRupiah(tagihanSebelum)} (Lebih Bayar)\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  // Status Pembayaran Bulan Tersebut
  if (isLibur || isClosed || isDihapus) {
    msg += `✅ *STATUS TAGIHAN: RP 0 (TIDAK ADA TAGIHAN)*\n`;
  } else if (payment && payment.nominal >= totalTarifKK) {
    msg += `✅ *STATUS: LUNAS DI MUKA*\n`;
    msg += `Terbayar: ${formatRupiah(payment.nominal)} (${payment.tanggalBayar})\n`;
    msg += `No. Kuitansi: \`${payment.noKwitansi}\`\n`;
  } else if (payment && payment.nominal > 0) {
    const sisa = Math.max(0, totalTarifKK - payment.nominal);
    msg += `⏳ *STATUS: SEBAGIAN TERBAYAR*\n`;
    msg += `Sudah Bayar : ${formatRupiah(payment.nominal)}\n`;
    msg += `*SISA TAGIHAN: ${formatRupiah(sisa)}*\n`;
  } else {
    const totalWajib = totalTarifKK + (tagihanSebelum < 0 ? Math.abs(tagihanSebelum) : 0);
    msg += `💳 *TOTAL TAGIHAN: ${formatRupiah(totalWajib)}*\n`;
    if (tagihanSebelum < 0) {
      msg += `_(Iuran Bulanan ${formatRupiah(totalTarifKK)} + Tunggakan Sebelum ${formatRupiah(Math.abs(tagihanSebelum))})_\n`;
    }
    msg += `_(${terbilangRupiah(totalWajib)})_\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Catatan Tambahan (Opsional)
  if (customNote && customNote.trim() !== '') {
    msg += `💬 *Catatan Pengurus:*\n${customNote.trim()}\n\n`;
  }

  msg += `💳 *METODE PEMBAYARAN:*\n`;
  msg += `• *Transfer Bank melalui Mandiri*:\n`;
  msg += `  Nomer Rekening : \`1350015984766\`\n`;
  msg += `  Atas Nama      : *Misbahudin*\n`;
  msg += `• *Pembayaran Tunai*:\n`;
  msg += `  Dapat diserahkan langsung ke Bendahara RT 02 (Bpk. Misbahudin).\n`;
  msg += `• *QRIS Digital RT 02*:\n`;
  msg += `  Dapat dipindai melalui Kartu Iuran Warga atau poster QRIS resmi.\n\n`;

  msg += `ℹ️ _Kuitansi digital resmi ber-QR Code otomatis diterbitkan setelah pembayaran diverifikasi oleh Bendahara._\n\n`;

  msg += `Terima kasih atas partisipasi dan kepedulian Bapak/Ibu dalam mendukung kerukunan dan kemajuan lingkungan RT 02 RW 14 Tanjung Sari.\n\n`;
  msg += `_Pemberitahuan resmi diterbitkan oleh Pengurus RT 02 RW 14 melalui Sistem BerkahOne Digital._`;

  return msg;
};

export const directSendWhatsAppTagihan = ({
  kk,
  targetMonthKey,
  targetMonthLabel,
  kkTarif,
  payment,
  wargaList,
  customNote,
  explicitPhone
}: GenerateTagihanOptions & { wargaList?: Warga[]; explicitPhone?: string }): {
  success: boolean;
  hasPhone: boolean;
  phone: string;
} => {
  const contact = findKKContact(kk.noKk, wargaList);
  const targetPhone = explicitPhone || contact.phone;
  const cleanNumber = formatWhatsAppNumber(targetPhone);
  const messageText = generateTagihanWhatsAppMessage({
    kk,
    targetMonthKey,
    targetMonthLabel,
    kkTarif,
    payment,
    contactName: contact.personName,
    customNote
  });

  const encoded = encodeURIComponent(messageText);

  if (cleanNumber) {
    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    return { success: true, hasPhone: true, phone: cleanNumber };
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
    return { success: true, hasPhone: false, phone: '' };
  }
};

interface TagihanWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  kk: { noKk: string; namaKepala: string } | null;
  wargaList: Warga[];
  getTarifByKK: (noKk: string) => TarifWargaKK | undefined;
  paidMap: Map<string, Map<string, PembayaranIuran>>;
  selectedBulanFilter: string;
  nextMonthObj: { key: string; short: string; label: string; isLibur: boolean };
  onOpenKoreksiTagihan?: (noKk: string, monthKey: string, monthLabel: string) => void;
}

export const TagihanWhatsAppModal: React.FC<TagihanWhatsAppModalProps> = ({
  isOpen,
  onClose,
  kk,
  wargaList,
  getTarifByKK,
  paidMap,
  selectedBulanFilter,
  nextMonthObj,
  onOpenKoreksiTagihan
}) => {
  if (!isOpen || !kk) return null;

  const contact = useMemo(() => findKKContact(kk.noKk, wargaList), [kk.noKk, wargaList]);
  const kkTarif = useMemo(() => getTarifByKK(kk.noKk), [kk.noKk, getTarifByKK]);

  // Selected period to bill: 'current' (selectedBulanFilter) or 'next' (nextMonthObj.key)
  const [periodMode, setPeriodMode] = useState<'current' | 'next'>('current');
  const [modalTab, setModalTab] = useState<'teks' | 'kartu'>('teks');
  const [phoneInput, setPhoneInput] = useState<string>(contact.phone);
  const [customNote, setCustomNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedRekening, setCopiedRekening] = useState<boolean>(false);
  const [isExportingJpeg, setIsExportingJpeg] = useState<boolean>(false);
  const [qrTagihanUrl, setQrTagihanUrl] = useState<string>('');
  const tagihanCardRef = useRef<HTMLDivElement>(null);

  const activePeriodKey = periodMode === 'current' ? selectedBulanFilter : nextMonthObj.key;
  const activePeriodLabel =
    periodMode === 'current'
      ? BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.label || selectedBulanFilter
      : nextMonthObj.label;

  const payment = paidMap.get(kk.noKk)?.get(activePeriodKey);

  // Komponen tarif dan perhitungan tagihan riil
  const jimpitan = kkTarif?.ikutJimpitan !== false ? (kkTarif?.jimpitan ?? 15000) : 0;
  const uangMeja = kkTarif?.ikutUangMeja !== false ? (kkTarif?.uangMeja ?? 10000) : 0;
  const tabungan = kkTarif?.ikutTabungan ? (kkTarif?.tabungan ?? 0) : 0;
  const penetapanTarifKK = jimpitan + uangMeja + tabungan;

  const koreksiVal = kkTarif?.koreksiTagihanBulan?.[activePeriodKey];
  const isDihapus = koreksiVal === 0;
  const hasKoreksi = koreksiVal !== undefined && koreksiVal !== null;
  const tarifBulanIni = hasKoreksi ? koreksiVal! : (kkTarif?.totalTarif ?? (penetapanTarifKK || 25000));

  const tagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;
  const tunggakanSebelum = tagihanSebelum < 0 ? Math.abs(tagihanSebelum) : 0;
  const totalTagihanWajib = (isDihapus ? 0 : tarifBulanIni) + tunggakanSebelum;
  const sisaWajib = payment ? Math.max(0, totalTagihanWajib - payment.nominal) : totalTagihanWajib;
  const isLunas = payment && payment.nominal >= totalTagihanWajib;

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      const qrText = `TAGIHAN RESMI IURAN RT 02 RW 14
Kelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
Kepala Keluarga : ${kk.namaKepala}
No. KK          : ${kk.noKk}
Periode         : ${activePeriodLabel}
Total Tagihan   : ${formatRupiah(totalTagihanWajib)}
Transfer Bank   : Mandiri 1350015984766 an Misbahudin
Sistem Digital  : BerkahOne RT 02 Digital`;
      try {
        const url = await generateQRCodeWithBerkahOneLogo(qrText, 220);
        if (isMounted) setQrTagihanUrl(url);
      } catch (e) {
        console.error('Error creating QR Tagihan:', e);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [kk, activePeriodLabel, totalTagihanWajib]);

  const handleExportTagihanJpeg = async () => {
    if (!tagihanCardRef.current) return;
    setIsExportingJpeg(true);
    try {
      const filename = `Tagihan_${kk.namaKepala.replace(/\s+/g, '_')}_${activePeriodKey}.jpg`;
      await exportElementToJPEG(tagihanCardRef.current, filename, 0.95);
    } catch (err) {
      console.error('Gagal mengekspor tagihan JPEG:', err);
    } finally {
      setIsExportingJpeg(false);
    }
  };

  const handleSendTagihanJpegWA = async () => {
    if (!tagihanCardRef.current) return;
    setIsExportingJpeg(true);
    try {
      const filename = `Tagihan_${kk.namaKepala.replace(/\s+/g, '_')}_${activePeriodKey}.jpg`;
      await shareOrDownloadJPEG(
        tagihanCardRef.current,
        filename,
        phoneInput,
        messageText,
        `Tagihan Iuran ${activePeriodLabel} RT 02 RW 14`
      );
    } catch (err) {
      console.error('Gagal membagikan tagihan JPEG:', err);
    } finally {
      setIsExportingJpeg(false);
    }
  };

  const messageText = useMemo(() => {
    return generateTagihanWhatsAppMessage({
      kk,
      targetMonthKey: activePeriodKey,
      targetMonthLabel: activePeriodLabel,
      kkTarif,
      payment,
      contactName: contact.personName,
      customNote
    });
  }, [kk, activePeriodKey, activePeriodLabel, kkTarif, payment, contact.personName, customNote]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWA = () => {
    const cleanNumber = formatWhatsAppNumber(phoneInput);
    const encoded = encodeURIComponent(messageText);

    if (cleanNumber) {
      window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-xs">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-200 uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Kirim Tagihan WhatsApp &amp; Format JPEG</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Tagihan Iuran Warga RT 02
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Teks WhatsApp vs Kartu Tagihan JPEG */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('teks')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              modalTab === 'teks'
                ? 'bg-white text-emerald-950 border-slate-200 shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Format Teks WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('kartu')}
            className={`py-2 px-3.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              modalTab === 'kartu'
                ? 'bg-white text-teal-950 border-slate-200 shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>2. Kartu Tagihan Visual (JPEG)</span>
          </button>
        </div>

        {/* Modal Body */}
        {modalTab === 'teks' ? (
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Info Card Penerima */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Home className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kepala Keluarga:</span>
              </div>
              <div className="text-sm font-black text-slate-900">{kk.namaKepala}</div>
              <div className="text-[11px] font-mono text-slate-500">No. KK: {kk.noKk}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Tarif Iuran KK:</span>
              <span className="text-sm font-black text-emerald-800 font-mono">
                {formatRupiah(kkTarif?.totalTarif ?? 25000)} / bln
              </span>
              {(kkTarif?.tagihanPeriodeSebelum || 0) !== 0 && (
                <div
                  className={`text-[10px] font-bold ${
                    (kkTarif?.tagihanPeriodeSebelum || 0) < 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {(kkTarif?.tagihanPeriodeSebelum || 0) < 0 ? 'Kurang Thn Sblm: ' : 'Lebih Thn Sblm: '}
                  {formatRupiah(kkTarif?.tagihanPeriodeSebelum || 0)}
                </div>
              )}
            </div>
          </div>

          {/* Pemilihan Periode Tagihan */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilih Periode Tagihan yang Dikirim:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPeriodMode('current')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  periodMode === 'current'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Bulan Berjalan
                </div>
                <div className="font-extrabold text-xs mt-0.5">
                  {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.label || selectedBulanFilter}
                </div>
                <div className="text-[10px] mt-1 font-semibold text-slate-600">
                  {paidMap.get(kk.noKk)?.has(selectedBulanFilter) ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sudah Lunas
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Belum Bayar
                    </span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPeriodMode('next')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  periodMode === 'next'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Bulan Berikutnya
                </div>
                <div className="font-extrabold text-xs mt-0.5">{nextMonthObj.label}</div>
                <div className="text-[10px] mt-1 font-semibold text-slate-600">
                  {paidMap.get(kk.noKk)?.has(nextMonthObj.key) ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sudah Lunas di Muka
                    </span>
                  ) : nextMonthObj.isLibur ? (
                    <span className="text-amber-800 font-bold">Libur Iuran</span>
                  ) : (
                    <span className="text-blue-800 font-bold">Wajib Bayar ({formatRupiah(kkTarif?.totalTarif ?? 25000)})</span>
                  )}
                </div>
              </button>
            </div>

            {/* Tombol Koreksi & Hapus Tagihan Periode Aktif */}
            {onOpenKoreksiTagihan && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Perlu sesuaikan besaran tagihan periode {activePeriodLabel}?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenKoreksiTagihan(kk.noKk, activePeriodKey, activePeriodLabel);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold border border-blue-200 transition-colors cursor-pointer text-[10px]"
                >
                  <span>Koreksi / Hapus Tagihan</span>
                </button>
              </div>
            )}
          </div>

          {/* Nomor WhatsApp Tujuan */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Nomor WhatsApp Tujuan:</span>
              </label>
              {contact.personName && (
                <span className="text-[10px] text-slate-500 font-medium">
                  Kontak KK: <strong>{contact.personName}</strong>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold text-xs">+</span>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  className="w-full pl-6 pr-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {phoneInput && (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold font-mono shrink-0">
                  +{formatWhatsAppNumber(phoneInput)}
                </div>
              )}
            </div>
            {!phoneInput && (
              <p className="text-[10px] text-amber-700">
                Nomor belum tercatat di data warga. Anda dapat memasukkan nomor di atas atau WhatsApp akan meminta Anda memilih kontak.
              </p>
            )}
          </div>

          {/* Info Rekening Bank Mandiri RT 02 */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center font-black text-[11px] shrink-0">
                BM
              </div>
              <div>
                <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider block">
                  Transfer Bank melalui Mandiri Nomer Rekening 1350015984766 an Misbahudin
                </span>
                <div className="font-mono font-black text-xs text-blue-950 flex items-center gap-1.5">
                  <span>1350015984766</span>
                  <span className="text-slate-500 font-normal font-sans text-[11px]">a.n. Misbahudin</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText('1350015984766');
                  setCopiedRekening(true);
                  setTimeout(() => setCopiedRekening(false), 2500);
                } catch {
                  setCopiedRekening(true);
                  setTimeout(() => setCopiedRekening(false), 2500);
                }
              }}
              className="px-2.5 py-1 text-[10px] font-bold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              {copiedRekening ? <Check className="w-3 h-3 text-emerald-600" /> : null}
              <span>{copiedRekening ? 'Tersalin!' : 'Salin Rekening'}</span>
            </button>
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Catatan Tambahan untuk Warga (Opsional):</span>
              <span className="text-[10px] text-slate-400 font-normal">Akan disertakan dalam pesan</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Contoh: Titip di Pos RT atau konfirmasi setelah transfer ke Mandiri 1350015984766"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          {/* Live Preview Teks WhatsApp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pratinjau Pesan WhatsApp:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <div className="bg-[#efeae2] p-3 rounded-xl border border-[#d1d7db] max-h-48 overflow-y-auto custom-scrollbar">
              <div className="bg-white p-3 rounded-lg shadow-2xs max-w-full text-[11px] font-sans leading-relaxed text-slate-800 whitespace-pre-wrap select-all">
                {messageText}
              </div>
            </div>
          </div>
        </div>
      ) : (
          /* ========================================================================= */
          /* TAB 2: KARTU VISUAL TAGIHAN IURAN FORMAT JPEG                              */
          /* ========================================================================= */
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs animate-in fade-in duration-150">
            {/* Action Bar Kartu Tagihan */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <div className="text-xs text-teal-950 font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-700" />
                <span>Kartu Tagihan Siap Ekspor Gambar JPEG untuk WhatsApp Warga</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportTagihanJpeg}
                  disabled={isExportingJpeg}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="Unduh Kartu Tagihan Format JPEG"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isExportingJpeg ? 'Mengolah JPEG...' : 'Unduh JPEG'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendTagihanJpegWA}
                  disabled={isExportingJpeg}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Kirim Gambar JPEG ke WhatsApp Warga"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kirim Gambar via WA</span>
                </button>
              </div>
            </div>

            {/* Visual Card Element to capture via HTML2Canvas */}
            <div className="flex justify-center p-2 bg-slate-100 rounded-2xl overflow-x-auto">
              <div
                ref={tagihanCardRef}
                data-export-root="true"
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-300 font-sans text-slate-900 relative overflow-hidden"
                style={{ minWidth: '380px' }}
              >
                {/* Kop Surat Header */}
                <div className="flex items-center justify-between pb-3.5 border-b-2 border-emerald-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 p-1 flex items-center justify-center shrink-0 border border-slate-200">
                      <img src={LOGO_SEMARANG_DATA_URI} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-emerald-800 font-extrabold">
                        PEMERINTAH KOTA SEMARANG
                      </div>
                      <div className="text-xs font-black tracking-tight text-slate-900 leading-tight">
                        RT 02 RW 14 TANJUNG SARI
                      </div>
                      <div className="text-[8.5px] text-slate-500">
                        Kel. Pedurungan Tengah, Kec. Pedurungan
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[8.5px] font-black uppercase tracking-wider">
                      TAGIHAN RESMI
                    </span>
                  </div>
                </div>

                {/* Judul & Periode */}
                <div className="py-3 text-center border-b border-slate-100">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    PEMBERITAHUAN TAGIHAN IURAN WARGA
                  </div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                    Periode: {activePeriodLabel}
                  </h3>
                </div>

                {/* Data Warga Box */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 my-3 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-500">Kepala Keluarga:</span>
                    <span className="font-extrabold text-slate-900 text-xs">{kk.namaKepala}</span>
                  </div>
                  <div className="flex justify-between items-baseline font-mono text-[10px]">
                    <span className="text-slate-500 font-sans">No. KK:</span>
                    <span className="font-bold text-slate-700">{kk.noKk}</span>
                  </div>
                  {contact.personName && contact.personName !== kk.namaKepala && (
                    <div className="flex justify-between items-baseline text-[10px]">
                      <span className="text-slate-500">Penerima Kontak:</span>
                      <span className="font-semibold text-slate-700">{contact.personName}</span>
                    </div>
                  )}
                </div>

                {/* Rincian Komponen Tarif */}
                <div className="space-y-1.5 py-1 text-xs border-b border-slate-200 pb-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Rincian Komponen Penetapan:
                  </div>

                  {isDihapus ? (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold text-center">
                      Tagihan Bulan Ini Telah Dihapus / Dibebaskan (Rp 0)
                    </div>
                  ) : (
                    <>
                      {jimpitan > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">• Jimpitan Warga:</span>
                          <span className="font-mono font-semibold">{formatRupiah(jimpitan)}</span>
                        </div>
                      )}
                      {uangMeja > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">• Uang Meja:</span>
                          <span className="font-mono font-semibold">{formatRupiah(uangMeja)}</span>
                        </div>
                      )}
                      {tabungan > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">• Tabungan:</span>
                          <span className="font-mono font-semibold">{formatRupiah(tabungan)}</span>
                        </div>
                      )}
                      {hasKoreksi && koreksiVal !== penetapanTarifKK && (
                        <div className="flex justify-between text-indigo-900 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          <span>• Penyesuaian Koreksi:</span>
                          <span className="font-mono">{formatRupiah(koreksiVal!)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {tunggakanSebelum > 0 && (
                    <div className="flex justify-between text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded">
                      <span>• Tunggakan Thn Sebelum:</span>
                      <span className="font-mono">+{formatRupiah(tunggakanSebelum)}</span>
                    </div>
                  )}

                  {tagihanSebelum > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      <span>• Saldo Lebih Bayar Sblm:</span>
                      <span className="font-mono">-{formatRupiah(tagihanSebelum)}</span>
                    </div>
                  )}
                </div>

                {/* Total Wajib Bayar Banner */}
                <div className="my-3 p-3.5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl space-y-1 shadow-md">
                  <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                    <span>Total Tagihan:</span>
                    <span>{isLunas ? 'LUNAS DI MUKA' : 'BELUM BAYAR'}</span>
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {formatRupiah(isLunas ? 0 : sisaWajib)}
                  </div>
                  <div className="text-[9.5px] italic text-emerald-200">
                    # {terbilangRupiah(isLunas ? 0 : sisaWajib)} #
                  </div>
                </div>

                {/* Rekening Pembayaran Resmi */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs">
                  <div className="text-[9px] uppercase font-bold text-blue-800 tracking-wider">
                    Metode Pembayaran:
                  </div>
                  <div className="text-slate-900 font-medium leading-relaxed">
                    Transfer Bank melalui Mandiri Nomer Rekening <strong className="font-mono font-black text-blue-950 text-xs">1350015984766</strong> a.n. <strong className="font-bold">Misbahudin</strong>
                  </div>
                </div>

                {/* QR & Verifikasi */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[8.5px] text-slate-400 uppercase font-bold">Verifikasi Digital:</div>
                    <div className="text-[10px] font-black text-emerald-900">
                      Sistem Kas RT 02 BerkahOne
                    </div>
                    <div className="text-[8px] text-slate-500">
                      Kel. Pedurungan Tengah
                    </div>
                  </div>

                  {qrTagihanUrl && (
                    <div className="w-14 h-14 bg-white p-0.5 border border-slate-300 rounded-xl shadow-xs">
                      <img src={qrTagihanUrl} alt="QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportTagihanJpeg}
              disabled={isExportingJpeg}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Unduh Tagihan dalam format gambar JPEG"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{isExportingJpeg ? 'Mengolah JPEG...' : 'Unduh JPEG'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendTagihanJpegWA}
              disabled={isExportingJpeg}
              className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Kirim Gambar JPEG Tagihan ke WhatsApp Warga"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Kirim Gambar via WA</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWA}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Kirim Teks via WA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
