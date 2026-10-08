import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Wallet,
  Smartphone,
  CheckCircle2,
  Info,
  CreditCard,
  Share2
} from 'lucide-react';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { LOGO_SEMARANG_URL } from '../../data/logoSemarang';
import { useApp } from '../../context/AppContext';

interface QrCodeBendaharaModalProps {
  onClose: () => void;
  defaultTab?: 'qris' | 'ttd';
}

export const QrCodeBendaharaModal: React.FC<QrCodeBendaharaModalProps> = ({
  onClose,
  defaultTab = 'qris'
}) => {
  const { users } = useApp();
  const [activeTab, setActiveTab] = useState<'qris' | 'ttd'>(defaultTab);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [copiedQrisPayload, setCopiedQrisPayload] = useState(false);
  const [qrQrisUrl, setQrQrisUrl] = useState<string>('');
  const [qrTtdUrl, setQrTtdUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Data Bendahara RT dari users
  const bendaharaUser = useMemo(() => {
    return users.find((u) => u.role === 'bendahara') || {
      nama: 'Misbahudin',
      username: 'bendahara',
      noHp: '0812-3456-7890',
      roleLabel: 'Bendahara / Pengurus RT'
    };
  }, [users]);

  const ketuaRT = useMemo(() => {
    return users.find((u) => u.role === 'superadmin' || u.role === 'ketua_rt') || {
      nama: 'Ali Muhtarom, S.T'
    };
  }, [users]);

  // Payload teks QRIS Resmi RT 02
  const qrisPayload = useMemo(() => {
    return `00020101021226580014ID.LINKAJA.WWW01189360000201102026090208123456780303UMI51440014ID.CO.QRIS.WWW0215ID10202609200020303UMI5204549953033605802ID5927KAS RT 02 RW 14 PEDURUNGAN6008SEMARANG61055019262240720BERKAHONE-IURAN-RT02630489A1`;
  }, []);

  // Payload teks Verifikasi Tanda Tangan Digital Bendahara
  const ttdPayload = useMemo(() => {
    return `DOKUMEN RESMI & OTENTIKASI DIGITAL BENDAHARA RT 02 RW 14
Kelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
Nama Petugas: ${bendaharaUser.nama}
Jabatan: Bendahara RT 02 RW 14 Tanjung Sari
Sistem: BerkahOne RT 02 Digital Platform
NMID / Rekening: Bank Mandiri 1350015984766 an Misbahudin
Otoritas: Pengelolaan Kas Besar, Kas Kecil, Kas BOP & Iuran Warga
Status Verifikasi: RESMI, SAH & TERCATAT`;
  }, [bendaharaUser]);

  useEffect(() => {
    let isMounted = true;
    const loadQrs = async () => {
      setIsLoading(true);
      try {
        const [qris, ttd] = await Promise.all([
          generateQRCodeWithBerkahOneLogo(qrisPayload, 320),
          generateQRCodeWithBerkahOneLogo(ttdPayload, 320)
        ]);
        if (isMounted) {
          setQrQrisUrl(qris);
          setQrTtdUrl(ttd);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Gagal generate QR Code Bendahara:', err);
        if (isMounted) setIsLoading(false);
      }
    };
    loadQrs();
    return () => {
      isMounted = false;
    };
  }, [qrisPayload, ttdPayload]);

  const handleCopyRekening = async () => {
    try {
      await navigator.clipboard.writeText('1350015984766');
      setCopiedRekening(true);
      setTimeout(() => setCopiedRekening(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadQR = () => {
    const targetUrl = activeTab === 'qris' ? qrQrisUrl : qrTtdUrl;
    if (!targetUrl) return;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `QR_Code_Bendahara_RT02_${activeTab.toUpperCase()}_Misbahudin.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStandee = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col relative overflow-hidden">
        {/* Dekorasi Background Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Bendahara RT 02 RW 14 &bull; {bendaharaUser.nama}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                QR Code Resmi Bendahara RT
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector (QRIS Pembayaran vs Tanda Tangan Digital) */}
        <div className="mt-4 flex p-1 bg-slate-100 rounded-2xl shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('qris')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'qris'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
            <span>QRIS Pembayaran Iuran &amp; Kas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ttd')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'ttd'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verifikasi &amp; TTD Digital Bendahara</span>
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 custom-scrollbar">
          {/* TAB 1: QRIS PEMBAYARAN IURAN */}
          {activeTab === 'qris' && (
            <div className="space-y-4">
              {/* Standee QR Card Container */}
              <div
                ref={printContainerRef}
                className="bg-gradient-to-b from-white to-slate-50 border-2 border-emerald-700/80 rounded-3xl p-5 sm:p-6 text-center shadow-md relative"
              >
                {/* Header Standee */}
                <div className="flex items-center justify-center gap-3 pb-3 border-b border-slate-200">
                  <img
                    src={LOGO_SEMARANG_URL}
                    alt="Logo Semarang"
                    className="w-10 h-10 object-contain"
                  />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      RUKUN TETANGGA 02 RUKUN WARGA 14
                    </div>
                    <div className="text-sm font-black text-emerald-950">
                      KAS RT 02 RW 14 PEDURUNGAN TENGAH
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Kel. Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
                    </div>
                  </div>
                </div>

                {/* Badge Standar QRIS */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-red-700 text-[11px] font-black tracking-wide">
                  <span>QRIS</span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-[10px] font-bold text-slate-600">
                    QR Standar Pembayaran Nasional
                  </span>
                </div>

                {/* QR Canvas / Image Display */}
                <div className="my-4 flex flex-col items-center justify-center">
                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner inline-block">
                    {isLoading ? (
                      <div className="w-56 h-56 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                        <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span>Membuat QR Code BerkahOne...</span>
                      </div>
                    ) : qrQrisUrl ? (
                      <img
                        src={qrQrisUrl}
                        alt="QR Code QRIS Kas RT 02"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-xs text-rose-500">
                        Gagal memuat QR Code
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-2 font-semibold">
                    NMID: ID1020260920002 &bull; A01
                  </div>
                </div>

                {/* Support E-Wallet Icons & Banks */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 text-center space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-950 flex items-center justify-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Dapat dipindai oleh semua aplikasi perbankan &amp; e-wallet:</span>
                  </div>
                  <div className="text-[10px] text-emerald-850 font-medium flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">BCA Mobile</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">Livin' Mandiri</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">BRImo</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">BNI Mobile</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">GoPay</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">OVO</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">DANA</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">ShopeePay</span>
                  </div>
                </div>

                {/* Penanggung Jawab Bendahara */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-left">
                  <div>
                    <div className="text-[10px] text-slate-500">Petugas / Pengelola:</div>
                    <div className="font-bold text-slate-900">{bendaharaUser.nama}</div>
                    <div className="text-[10px] text-slate-500">Bendahara RT 02 RW 14</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Mengetahui:</div>
                    <div className="font-bold text-slate-900">{ketuaRT.nama}</div>
                    <div className="text-[10px] text-slate-500">Ketua RT 02 RW 14</div>
                  </div>
                </div>
              </div>

              {/* Info Alternatif Transfer Bank Rekening Kas */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Transfer Bank Rekening Resmi RT 02
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Bank Mandiri
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Nomor Rekening Mandiri:</div>
                    <div className="text-sm font-mono font-black text-blue-950 tracking-wider">
                      1350015984766
                    </div>
                    <div className="text-[10px] text-slate-700 font-bold">
                      a.n. Misbahudin
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Salin nomor rekening"
                  >
                    {copiedRekening ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-blue-700" />
                        <span>Salin No. Rek</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFIKASI & TANDA TANGAN DIGITAL BENDAHARA */}
          {activeTab === 'ttd' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-3xl p-5 text-center shadow-xs space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sertifikat Tanda Tangan Digital Bendahara RT</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="p-3 bg-white border-2 border-emerald-600/60 rounded-2xl shadow-md inline-block">
                    {isLoading ? (
                      <div className="w-52 h-52 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                        <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span>Membuat QR Verifikasi...</span>
                      </div>
                    ) : qrTtdUrl ? (
                      <img
                        src={qrTtdUrl}
                        alt="QR Code Tanda Tangan Digital Bendahara"
                        className="w-52 h-52 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center text-xs text-rose-500">
                        Gagal memuat QR Code
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-3">
                    {bendaharaUser.nama}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bendahara RT 02 RW 14 Pedurungan Tengah
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    ✓ Terverifikasi Digital Sistem BerkahOne
                  </div>
                </div>

                {/* Metadata Verifikasi */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left text-xs space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Informasi Validitas QR Code Bendahara:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Penanggung Jawab:</span>
                      <span className="font-bold text-slate-800">{bendaharaUser.nama}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Jabatan:</span>
                      <span className="font-bold text-slate-800">Bendahara RT 02</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sistem Otentikasi:</span>
                      <span className="font-bold text-slate-800">BerkahOne Digital</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Dokumen Sah:</span>
                      <span className="font-bold text-slate-800">Kwitansi &amp; Buku Kas RT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Unduh file gambar QR Code"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh QR</span>
            </button>

            <button
              type="button"
              onClick={handlePrintStandee}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Cetak Standee / Lembar QR Code"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Standee QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
