import React, { useState, useEffect } from 'react';
import { PembayaranIuran, TarifWargaKK, Warga } from '../../types';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { X, Printer, Calendar, CalendarDays, CheckCircle2, AlertCircle, Coins, Receipt, MessageCircle, Trash2, PlusCircle, ShieldCheck, Settings, Copy, Check } from 'lucide-react';
import { formatRupiah, directSendWhatsAppKwitansi } from './KwitansiModal';
import { directSendWhatsAppTagihan } from './TagihanWhatsAppModal';

interface KartuIuranKKModalProps {
  kk: {
    noKk: string;
    namaKepala: string;
    alamat?: string;
    anggotaCount?: number;
  };
  tarif?: TarifWargaKK;
  payments: Map<string, PembayaranIuran>;
  currentMonthKey: string;
  onClose: () => void;
  onPayMonth?: (monthKey: string) => void;
  onViewKwitansi?: (payment: PembayaranIuran) => void;
  onDeletePayment?: (payment: PembayaranIuran) => void;
  canManage?: boolean;
  wargaList?: Warga[];
  onOpenEditTarif?: (noKk: string) => void;
}

const BULAN_NAMES = [
  { key: '2026-01', short: 'Jan', label: 'Januari 2026', isLibur: false },
  { key: '2026-02', short: 'Feb', label: 'Februari 2026', isLibur: false },
  { key: '2026-03', short: 'Mar', label: 'Maret 2026', isLibur: true, catatanLibur: 'Libur Iuran RT' },
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

export const KartuIuranKKModal: React.FC<KartuIuranKKModalProps> = ({
  kk,
  tarif,
  payments,
  currentMonthKey,
  onClose,
  onPayMonth,
  onViewKwitansi,
  onDeletePayment,
  canManage,
  wargaList,
  onOpenEditTarif
}) => {
  // Pilihan di Kartu Iuran: 12 Bulan (semua bulan) vs Bulan Berjalan saja
  const [kartuMode, setKartuMode] = useState<'12bulan' | 'perbulan'>('12bulan');
  const [selectedBulan, setSelectedBulan] = useState<string>(currentMonthKey || '2026-09');
  const [qrBendaharaUrl, setQrBendaharaUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      const qrText = `KARTU IURAN WARGA RT 02 RW 14
Kelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
Nama KK: ${kk.namaKepala} (No. KK: ${kk.noKk})
Tahun: 2026
Petugas / Bendahara: Misbahudin
Status: Terverifikasi Digital & Diterbitkan Resmi
Sistem: BerkahOne RT 02 Digital`;

      try {
        const url = await generateQRCodeWithBerkahOneLogo(qrText, 220);
        if (isMounted) setQrBendaharaUrl(url);
      } catch (err) {
        console.error('Error generating QR Bendahara for Kartu Iuran:', err);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [kk.namaKepala, kk.noKk]);

  // Tarif Iuran yang diterapkan untuk KK ini berdasarkan penetapan
  const tarifJimpitan = tarif ? (tarif.ikutJimpitan ? tarif.jimpitan : 0) : 0;
  const tarifUangMeja = tarif ? (tarif.ikutUangMeja ? tarif.uangMeja : 0) : 0;
  const tarifTabungan = tarif ? (tarif.ikutTabungan ? tarif.tabungan : 0) : 0;
  const totalTarif = tarif?.totalTarif ?? (tarifJimpitan + tarifUangMeja + tarifTabungan);
  const tagihanSebelum = tarif?.tagihanPeriodeSebelum ?? 0;
  const [copiedRekening, setCopiedRekening] = useState<boolean>(false);
  const activeMonthObj = BULAN_NAMES.find((b) => b.key === selectedBulan) || BULAN_NAMES[8];

  // Hitung total terbayar tahunan
  let totalBayar12Bulan = 0;
  let jumlahBulanLunas = 0;
  BULAN_NAMES.forEach((b) => {
    const p = payments.get(b.key);
    if (p) {
      totalBayar12Bulan += p.nominal;
      jumlahBulanLunas++;
    }
  });

  const currentPayment = payments.get(selectedBulan);
  const isSelectedLibur = activeMonthObj.isLibur;
  const isSelectedClosed = tarif?.bulanDitutup?.includes(selectedBulan) ?? false;

  // Person Kontak KK
  const kkPersonKontak = React.useMemo(() => {
    if (!wargaList || wargaList.length === 0) return '';
    const kepala = wargaList.find((w) => w.noKk === kk.noKk && w.statusKeluarga === 'Kepala Keluarga');
    if (kepala?.personKontak?.trim()) return kepala.personKontak.trim();
    const anyWithPerson = wargaList.find((w) => w.noKk === kk.noKk && w.personKontak && w.personKontak.trim() !== '');
    if (anyWithPerson?.personKontak?.trim()) return anyWithPerson.personKontak.trim();
    return kepala?.nama ? `${kepala.nama} (KK)` : '';
  }, [wargaList, kk.noKk, kk.namaKepala]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Controls Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Kartu Kendali Iuran Warga RT 02
              </h3>
              <p className="text-xs text-slate-500">
                KK: <strong className="text-slate-800">{kk.namaKepala}</strong> &bull; No. KK: {kk.noKk}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Mode Switcher: 12 Bulan vs Per Bulan */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setKartuMode('12bulan')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  kartuMode === '12bulan'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>12 Bulan (Semua)</span>
              </button>
              <button
                type="button"
                onClick={() => setKartuMode('perbulan')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  kartuMode === 'perbulan'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bulan Berjalan</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Cetak Kartu Iuran Warga"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              type="button"
              id="btn-batal-kartu-iuran-header"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Batal dan tutup kartu iuran"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Batal</span>
            </button>
          </div>
        </div>

        {/* Sub-selector for Per Bulan mode */}
        {kartuMode === 'perbulan' && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Pilih Bulan Berjalan:</span>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-emerald-500 cursor-pointer"
              >
                {BULAN_NAMES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label} {b.isLibur ? '(Libur)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-slate-500 text-[11px]">
              Menampilkan slip &amp; status pembayaran iuran khusus <strong>{activeMonthObj.label}</strong>
            </div>
          </div>
        )}

        {/* Printable Card Container */}
        <div className="mt-4 border-2 border-slate-800 rounded-xl p-5 bg-white text-slate-900 space-y-4 print:border-none print:p-0">
          {/* Header Kartu Resmi RT */}
          <div className="border-b-2 border-slate-800 pb-3 text-center relative">
            <div className="text-[10px] tracking-widest font-black uppercase text-slate-500">
              RUKUN TETANGGA 02 &bull; RUKUN WARGA 14
            </div>
            <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight">
              KARTU KENDALI IURAN WARGA TAHUN 2026
            </h4>
            <div className="text-[11px] font-semibold text-slate-600">
              Kel. Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
            </div>
            <div className="mt-1 inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider">
              {kartuMode === '12bulan' ? 'Format 12 Bulan (Tahunan)' : `Format Bulan Berjalan: ${activeMonthObj.label}`}
            </div>
          </div>

          {/* Identitas Kepala Keluarga & Detail Tarif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Nama Kepala KK</span>
                <span className="font-bold text-slate-900">: {kk.namaKepala}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Nomor KK</span>
                <span className="font-mono font-bold text-slate-800">: {kk.noKk}</span>
              </div>
              {kkPersonKontak && (
                <div className="flex">
                  <span className="w-28 text-slate-500 font-medium">Person Kontak</span>
                  <span className="font-semibold text-slate-800">: {kkPersonKontak}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-28 text-slate-500 font-medium">Alamat</span>
                <span className="text-slate-700">: {kk.alamat || 'RT 02 RW 14 Tanjung Sari'}</span>
              </div>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Penetapan Tarif Warga</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold font-mono text-emerald-800">: {formatRupiah(totalTarif)}/bln</span>
                  {canManage && onOpenEditTarif && (
                    <button
                      type="button"
                      onClick={() => onOpenEditTarif(kk.noKk)}
                      className="px-1.5 py-0.5 text-[9px] font-bold text-orange-950 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded transition-colors cursor-pointer flex items-center gap-0.5 print:hidden"
                      title="Ubah penetapan tarif iuran khusus KK ini"
                    >
                      <Settings className="w-2.5 h-2.5 text-orange-700" />
                      <span>Ubah</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-500">
                (Jimpitan: {tarif ? (tarif.ikutJimpitan ? formatRupiah(tarif.jimpitan) : 'Rp 0') : '-'} &bull; Uang Meja: {tarif ? (tarif.ikutUangMeja ? formatRupiah(tarif.uangMeja) : 'Rp 0') : '-'} &bull; Tabungan: {tarif ? (tarif.ikutTabungan && tarif.tabungan > 0 ? formatRupiah(tarif.tabungan) : 'Rp 0') : 'Rp 0'})
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500 font-medium">Tagihan Tahun Sebelum</span>
                <span className={`font-bold font-mono ${tagihanSebelum < 0 ? 'text-rose-700' : tagihanSebelum > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                  : {tagihanSebelum > 0 ? '+' : ''}{formatRupiah(tagihanSebelum)}
                  {tagihanSebelum < 0 ? ' (Kurang)' : tagihanSebelum > 0 ? ' (Lebih)' : ' (Nihil)'}
                </span>
              </div>
            </div>
          </div>

          {/* OPSI 1: TAMPILAN 12 BULAN (SEMUA BULAN) */}
          {kartuMode === '12bulan' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-800 uppercase tracking-wide">
                  Matriks Kendali Pembayaran 12 Bulan (Januari - Desember 2026)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Terbayar: <strong className="text-emerald-800">{jumlahBulanLunas} dari 11 bln wajib</strong>
                </span>
              </div>

              {/* Grid 12 Kotak Kartu Iuran */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {BULAN_NAMES.map((b) => {
                  const payment = payments.get(b.key);
                  const isClosed = tarif?.bulanDitutup?.includes(b.key);
                  const isCurrent = b.key === currentMonthKey;

                  return (
                    <div
                      key={b.key}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between min-h-[90px] transition-all relative ${
                        payment
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : b.isLibur
                          ? 'bg-amber-50/80 border-amber-300'
                          : isClosed
                          ? 'bg-slate-100 border-slate-300 opacity-70'
                          : isCurrent
                          ? 'bg-rose-50/60 border-rose-300 shadow-2xs ring-1 ring-rose-400'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Header Box Bulan */}
                      <div className="flex items-center justify-between border-b pb-1 border-slate-200/60">
                        <span className="font-black text-slate-800">{b.short}</span>
                        {isCurrent && (
                          <span className="text-[8px] font-black text-rose-700 bg-rose-100 px-1 py-0.2 rounded uppercase">
                            Bulan Ini
                          </span>
                        )}
                      </div>

                      {/* Content Box Bulan */}
                      <div className="my-1.5">
                        {payment ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-emerald-800 font-extrabold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>LUNAS</span>
                            </div>
                            <div className="font-mono text-[10px] font-bold text-slate-700">
                              {formatRupiah(payment.nominal)}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {payment.tanggalBayar}
                            </div>
                          </div>
                        ) : b.isLibur ? (
                          <div className="text-center py-1">
                            <span className="text-[10px] font-black text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                              LIBUR
                            </span>
                            <div className="text-[8px] text-amber-700 mt-1 font-semibold">
                              Bebas Iuran RT
                            </div>
                          </div>
                        ) : isClosed ? (
                          <div className="text-center py-1">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                              DITUTUP
                            </span>
                            <div className="text-[8px] text-slate-500 mt-1">
                              Belum ikut
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-rose-700 font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>BELUM BAYAR</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              Tagihan: {formatRupiah(totalTarif)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Aksi Kotak */}
                      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px]">
                        {payment ? (
                          <div className="flex items-center gap-1.5 print:hidden">
                            <button
                              type="button"
                              onClick={() => onViewKwitansi?.(payment)}
                              className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 cursor-pointer"
                              title="Buka Kuitansi Resmi"
                            >
                              <Receipt className="w-2.5 h-2.5" />
                              <span>Kuitansi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => directSendWhatsAppKwitansi(payment, wargaList)}
                              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer hover:bg-emerald-100 px-1 py-0.5 rounded transition-colors"
                              title="Kirim Kuitansi Langsung ke WhatsApp Warga"
                            >
                              <MessageCircle className="w-2.5 h-2.5 fill-current" />
                              <span>Kirim WA</span>
                            </button>
                            {canManage && onDeletePayment && (
                              <button
                                type="button"
                                onClick={() => onDeletePayment(payment)}
                                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer hover:bg-rose-50 px-1 py-0.5 rounded transition-colors"
                                title={`Hapus pembayaran bulan ${b.short}`}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        ) : !b.isLibur && !isClosed && canManage ? (
                          <div className="flex items-center gap-1.5 print:hidden">
                            <button
                              type="button"
                              onClick={() => onPayMonth?.(b.key)}
                              className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer flex items-center gap-0.5"
                              title={`Catat pembayaran bulan ${b.short}`}
                            >
                              <PlusCircle className="w-2.5 h-2.5" />
                              <span>+ Bayar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                directSendWhatsAppTagihan({
                                  kk,
                                  targetMonthKey: b.key,
                                  targetMonthLabel: b.label,
                                  kkTarif: tarif,
                                  wargaList
                                });
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer hover:bg-emerald-100 px-1 py-0.5 rounded transition-colors"
                              title={`Kirim Tagihan Bulan ${b.short} via WhatsApp`}
                            >
                              <MessageCircle className="w-2.5 h-2.5 fill-current" />
                              <span>WA</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">&bull;</span>
                        )}
                        <span className="font-mono text-[8px] text-slate-400">
                          {payment?.noKwitansi || '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rekap Total 12 Bulan */}
              <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="text-slate-600">Total Pembayaran Periode Berjalan 2026:</div>
                  <div className="text-base font-black font-mono text-emerald-900">
                    {formatRupiah(totalBayar12Bulan)}
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4">
                  <div className="text-slate-600">Total Akumulasi Terbayar + Tagihan Sebelum:</div>
                  <div className="text-base font-black font-mono text-emerald-950">
                    {totalBayar12Bulan + tagihanSebelum < 0
                      ? '-'
                      : (totalBayar12Bulan + tagihanSebelum > 0 ? '+' : '') + formatRupiah(totalBayar12Bulan + tagihanSebelum)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPSI 2: TAMPILAN BULAN BERJALAN SAJA */}
          {kartuMode === 'perbulan' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Slip &amp; Bukti Iuran Bulan Berjalan
                    </span>
                    <h5 className="text-base font-black text-slate-900">
                      Bulan {activeMonthObj.label}
                    </h5>
                  </div>
                  <div>
                    {currentPayment ? (
                      <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-xs">
                        LUNAS
                      </span>
                    ) : isSelectedLibur ? (
                      <span className="px-3 py-1 bg-amber-500 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-xs">
                        LIBUR IURAN
                      </span>
                    ) : isSelectedClosed ? (
                      <span className="px-3 py-1 bg-slate-500 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-xs">
                        BULAN DITUTUP
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-600 text-white rounded-full font-black text-xs uppercase tracking-wider shadow-xs">
                        BELUM LUNAS
                      </span>
                    )}
                  </div>
                </div>

                {/* Rincian Iuran Bulan Berjalan */}
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-emerald-100">
                      <td className="py-1.5 text-slate-600">1. Iuran Jimpitan Warga</td>
                      <td className="py-1.5 text-right font-mono font-semibold">
                        {tarif ? (tarif.ikutJimpitan ? formatRupiah(tarif.jimpitan) : 'Rp 0 (Tidak Ikut)') : 'Rp 15.000'}
                      </td>
                    </tr>
                    <tr className="border-b border-emerald-100">
                      <td className="py-1.5 text-slate-600">2. Iuran Uang Meja</td>
                      <td className="py-1.5 text-right font-mono font-semibold">
                        {tarif ? (tarif.ikutUangMeja ? formatRupiah(tarif.uangMeja) : 'Rp 0 (Tidak Ikut)') : 'Rp 10.000'}
                      </td>
                    </tr>
                    <tr className="border-b border-emerald-100">
                      <td className="py-1.5 text-slate-600">3. Tabungan / Lain-lain</td>
                      <td className="py-1.5 text-right font-mono font-semibold">
                        {tarif ? (tarif.ikutTabungan && tarif.tabungan > 0 ? formatRupiah(tarif.tabungan) : 'Rp 0') : 'Rp 0'}
                      </td>
                    </tr>
                    <tr className="border-b-2 border-emerald-300 font-bold text-slate-900">
                      <td className="py-2">Total Kewajiban Iuran Bulan {activeMonthObj.short}</td>
                      <td className="py-2 text-right font-mono text-sm text-emerald-900">
                        {isSelectedLibur ? 'Rp 0 (Libur)' : isSelectedClosed ? 'Rp 0 (Ditutup)' : formatRupiah(totalTarif)}
                      </td>
                    </tr>
                    {currentPayment && (
                      <tr className="bg-emerald-100/60 font-black text-emerald-950">
                        <td className="py-2 px-2">Jumlah Yang Telah Dibayar</td>
                        <td className="py-2 px-2 text-right font-mono text-sm">
                          {formatRupiah(currentPayment.nominal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Detail Bukti Pembayaran jika sudah lunas */}
                {currentPayment ? (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Data Pembayaran Terverifikasi:</span>
                      <span className="font-mono text-emerald-700">No. {currentPayment.noKwitansi}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>Tanggal Bayar: <strong>{currentPayment.tanggalBayar}</strong></div>
                      <div>Metode: <strong>{currentPayment.metode}</strong></div>
                      <div>Penerima: <strong>{currentPayment.penerima}</strong></div>
                      <div>Status: <strong className="text-emerald-700">Lunas Sah</strong></div>
                    </div>
                    {canManage && (
                      <div className="pt-2 flex items-center gap-2 print:hidden flex-wrap">
                        <button
                          type="button"
                          onClick={() => onViewKwitansi?.(currentPayment)}
                          className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Buka Kuitansi Resmi
                        </button>
                        <button
                          type="button"
                          onClick={() => directSendWhatsAppKwitansi(currentPayment, wargaList)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Kirim Bukti Kuitansi Langsung ke WhatsApp Warga"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Kirim WA Langsung</span>
                        </button>
                        {onDeletePayment && (
                          <button
                            type="button"
                            onClick={() => onDeletePayment(currentPayment)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Hapus catatan pembayaran iuran bulan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Hapus Pembayaran</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : !isSelectedLibur && !isSelectedClosed ? (
                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs flex items-center justify-between">
                    <div className="text-rose-900">
                      Warga belum menyelesaikan iuran bulan <strong>{activeMonthObj.label}</strong>.
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onPayMonth?.(selectedBulan)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                      >
                        + Catat Bayar Bulan Ini
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Informasi Rekening Transfer Bank Mandiri */}
          <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-2xs">
                BM
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-blue-700 font-bold block">
                  Informasi Pembayaran Non-Tunai Kas RT 02:
                </span>
                <span className="font-bold text-blue-950 font-mono text-xs">
                  Transfer Bank melalui Mandiri Nomer Rekening 1350015984766 an Misbahudin
                </span>
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
              className="px-2.5 py-1 text-[10px] font-bold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors cursor-pointer shrink-0 print:hidden flex items-center gap-1"
            >
              {copiedRekening ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedRekening ? 'Tersalin!' : 'Salin Rekening'}</span>
            </button>
          </div>

          {/* Tanda Tangan Kartu Resmi */}
          <div className="pt-4 grid grid-cols-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <div>
                Warga / Kepala Keluarga,
                <div className="font-bold mt-1 text-slate-700">Penerima Kartu</div>
              </div>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 italic">( Tanda Tangan )</span>
              </div>
              <div className="font-bold underline text-slate-900">{kk.namaKepala}</div>
            </div>

            <div className="flex flex-col items-center">
              <div>
                Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                <div className="font-bold mt-1 text-slate-700">Petugas / Bendahara RT 02</div>
              </div>
              <div className="my-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-center justify-center">
                {qrBendaharaUrl ? (
                  <img
                    src={qrBendaharaUrl}
                    alt="QR Code Bendahara RT"
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400">
                    QR Bendahara
                  </div>
                )}
              </div>
              <div className="font-bold underline text-slate-900">Misbahudin</div>
              <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                ✓ Terverifikasi Digital Bendahara
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Batal Button */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500">
            Kartu Iuran Keluarga: <strong className="text-slate-800">{kk.namaKepala}</strong> &bull; No. KK: <span className="font-mono">{kk.noKk}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-batal-kartu-iuran-footer"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:border-slate-400"
              title="Tutup / Batalkan tampilan kartu"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Batal</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Cetak Kartu Iuran Warga"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Iuran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
