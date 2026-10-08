import React, { useState, useMemo, useEffect } from 'react';
import { TarifWargaKK, PembayaranIuran } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { X, Printer, Calendar, CalendarDays, ShieldCheck } from 'lucide-react';

interface RekapModalProps {
  kkList: { noKk: string; namaKepala: string }[];
  paidMap: Map<string, Map<string, PembayaranIuran>>;
  getTarifByKK: (noKk: string) => TarifWargaKK | undefined;
  totalUangYtd: number;
  targetMonthLabel: string;
  targetMonthKey?: string;
  onClose: () => void;
}

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

export const formatRupiah = (amount: number): string => {
  if (amount < 0) {
    return '-Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const RekapModal: React.FC<RekapModalProps> = ({
  kkList,
  paidMap,
  getTarifByKK,
  totalUangYtd,
  targetMonthLabel,
  targetMonthKey = '2026-09',
  onClose
}) => {
  // Urutkan KK sesuai Nama Kepala Keluarga lalu Nomor KK
  const sortedKKList = useMemo(() => {
    return [...kkList].sort((a, b) => {
      const cmp = a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [kkList]);

  const { users } = useApp();
  const ketuaRTName = users?.find((u) => u.role === 'superadmin' || u.role === 'ketua_rt')?.nama || 'ALI MUHTAROM, S.T';
  const bendaharaRTName = users?.find((u) => u.role === 'bendahara')?.nama || 'MISBAHUDIN';

  const [qrKetuaUrl, setQrKetuaUrl] = useState<string>('');
  const [qrBendaharaUrl, setQrBendaharaUrl] = useState<string>('');

  // Pilihan di kartu iuran / rekap: 12 Bulan (semua bulan) vs Per Bulan Berjalan
  const [rekapFormat, setRekapFormat] = useState<'12bulan' | 'perbulan'>('12bulan');
  const [activeBulanKey, setActiveBulanKey] = useState<string>(targetMonthKey || '2026-09');

  const activeBulanObj = BULAN_NAMES.find((b) => b.key === activeBulanKey) || BULAN_NAMES[8];

  useEffect(() => {
    let isMounted = true;
    const loadQrs = async () => {
      const formatStr = rekapFormat === '12bulan' ? 'Rekapitulasi 12 Bulan Tahun 2026' : `Bulan ${activeBulanObj.label}`;
      const ketuaText = `DOKUMEN RESMI REKAPITULASI KARTU IURAN RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Mengetahui\nNama: ${ketuaRTName}\nJabatan: Ketua RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14\nFormat: ${formatStr}\nTanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\nVerifikasi: SAH & TERCATAT`;
      const bendaharaText = `DOKUMEN RESMI REKAPITULASI KARTU IURAN RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Dibuat\nNama: ${bendaharaRTName}\nJabatan: Bendahara RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14\nFormat: ${formatStr}\nTanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\nVerifikasi: SAH & TERCATAT`;

      try {
        const [k, b] = await Promise.all([
          generateQRCodeWithBerkahOneLogo(ketuaText, 220),
          generateQRCodeWithBerkahOneLogo(bendaharaText, 220)
        ]);
        if (isMounted) {
          setQrKetuaUrl(k);
          setQrBendaharaUrl(b);
        }
      } catch (err) {
        console.error('Error generating rekap QRs:', err);
      }
    };
    loadQrs();
    return () => {
      isMounted = false;
    };
  }, [rekapFormat, activeBulanObj, ketuaRTName, bendaharaRTName]);

  const totalTagihanSebelumAll = sortedKKList.reduce((acc, kk) => {
    const t = getTarifByKK(kk.noKk);
    return acc + (t?.tagihanPeriodeSebelum || 0);
  }, 0);

  // Perhitungan khusus untuk format Per Bulan Berjalan
  let totalBulanIni = 0;
  let countLunasBulanIni = 0;
  let totalPotensiBulanIni = 0;

  sortedKKList.forEach((kk) => {
    const p = paidMap.get(kk.noKk)?.get(activeBulanKey);
    const t = getTarifByKK(kk.noKk);
    const tarifNominal = t ? (t.totalTarif ?? ((t.ikutJimpitan ? t.jimpitan : 0) + (t.ikutUangMeja ? t.uangMeja : 0) + (t.ikutTabungan ? t.tabungan : 0))) : 0;
    const isClosed = t?.bulanDitutup?.includes(activeBulanKey);

    if (!activeBulanObj.isLibur && !isClosed) {
      totalPotensiBulanIni += tarifNominal;
    }

    if (p) {
      totalBulanIni += p.nominal;
      countLunasBulanIni++;
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Format Cetak Rekapitulasi Kartu Iuran RT 02 RW 14
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih format cetak: Semua 12 Bulan atau Per Bulan Berjalan Saja
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Toggle Format: 12 Bulan vs Per Bulan */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setRekapFormat('12bulan')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  rekapFormat === '12bulan'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>12 Bulan (Semua Bulan)</span>
              </button>
              <button
                type="button"
                onClick={() => setRekapFormat('perbulan')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  rekapFormat === 'perbulan'
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                <span>Per Bulan Berjalan</span>
              </button>
            </div>

            {/* Dropdown pemilih bulan jika mode Per Bulan */}
            {rekapFormat === 'perbulan' && (
              <select
                value={activeBulanKey}
                onChange={(e) => setActiveBulanKey(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {BULAN_NAMES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label} {b.isLibur ? '(Libur)' : ''}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              id="btn-batal-rekap-kartu-header"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Batal dan tutup rekap"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Batal</span>
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="border border-slate-300 p-6 rounded-xl bg-white text-slate-900 text-xs space-y-4 print:border-none print:p-0">
          {/* Kop Surat Resmi RT */}
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wide">
              PENGURUS RUKUN TETANGGA 02 RUKUN WARGA 14
            </h3>
            <h4 className="text-xs font-bold text-slate-700">
              KELURAHAN PEDURUNGAN TENGAH &ndash; KECAMATAN PEDURUNGAN &ndash; KOTA SEMARANG
            </h4>
            <p className="text-[10px] text-slate-500">
              Sekretariat: Tanjung Sari, RT 02 RW 14, Pedurungan Tengah &bull; Tahun Anggaran 2026
            </p>
            <p className="text-[10px] font-semibold text-slate-600 mt-1">
              Tarif Warga: Berdasarkan Penetapan Masing-Masing KK (Tidak ada standar seragam &bull; Komponen: Jimpitan, Uang Meja, Tabungan)
            </p>
          </div>

          {/* Judul Dokumen Berdasarkan Pilihan */}
          <div className="text-center my-2">
            <h4 className="text-xs font-bold uppercase underline">
              {rekapFormat === '12bulan'
                ? 'REKAPITULASI PEMBAYARAN IURAN WAJIB WARGA RT 02 RW 14 TAHUN 2026 (12 BULAN)'
                : `REKAPITULASI PEMBAYARAN IURAN WARGA RT 02 RW 14 &ndash; BULAN ${activeBulanObj.label.toUpperCase()}`}
            </h4>
            <p className="text-[10px] text-slate-600">
              Periode Pemantauan:{' '}
              <strong>
                {rekapFormat === '12bulan' ? 'Tahun Penuh 2026 (Januari - Desember)' : activeBulanObj.label}
              </strong>
            </p>
          </div>

          {/* TAMPILAN 1: FORMAT 12 BULAN (SEMUA BULAN) */}
          {rekapFormat === '12bulan' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-400 p-1 text-center w-8">No</th>
                    <th className="border border-slate-400 p-1 text-left">Nama Kepala Keluarga</th>
                    <th className="border border-slate-400 p-1 text-left">No. KK</th>
                    <th className="border border-slate-400 p-1 text-right">Tarif KK</th>
                    <th className="border border-slate-400 p-1 text-center min-w-[90px] bg-amber-50 text-amber-950 font-bold" title="Tagihan Tahun Sebelum">
                      <div>Tagihan Thn Sblm</div>
                      <div className="text-[7px] font-normal text-amber-800 tracking-tight">&lt;0 Kurang, &gt;0 Lebih</div>
                    </th>
                    {BULAN_NAMES.map((b) => (
                      <th
                        key={b.key}
                        className={`border border-slate-400 p-1 text-center w-8 ${
                          b.isLibur ? 'bg-amber-100 text-amber-900 font-extrabold' : ''
                        }`}
                        title={b.isLibur ? 'Bulan Libur Iuran' : undefined}
                      >
                        {b.short}
                        {b.isLibur && <div className="text-[7px] font-black text-amber-800 leading-tight">LIBUR</div>}
                      </th>
                    ))}
                    <th className="border border-slate-400 p-1 text-right min-w-[75px]">Total Terbayar</th>
                    <th className="border border-slate-400 p-1 text-right min-w-[110px] bg-emerald-50 text-emerald-950 font-bold">
                      Total Terbayar + Tagihan Tahun Sebelum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedKKList.map((kk, i) => {
                    const kkPayments = paidMap.get(kk.noKk);
                    const kkTarif = getTarifByKK(kk.noKk);
                    const totalTarifKK = kkTarif?.totalTarif ?? 25000;
                    const tagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;
                    let totalKkPaid = 0;

                    return (
                      <tr key={kk.noKk}>
                        <td className="border border-slate-400 p-1 text-center">{i + 1}</td>
                        <td className="border border-slate-400 p-1 font-semibold">{kk.namaKepala}</td>
                        <td className="border border-slate-400 p-1 font-mono text-[9px]">{kk.noKk}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono">
                          Rp {totalTarifKK.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-slate-400 p-1 text-right font-mono bg-amber-50/40 text-[10px]">
                          {tagihanSebelum === 0 ? (
                            '-'
                          ) : tagihanSebelum < 0 ? (
                            <span className="text-rose-900 font-bold">
                              -{formatRupiah(Math.abs(tagihanSebelum))}
                            </span>
                          ) : (
                            <span className="text-emerald-900 font-bold">
                              +{formatRupiah(tagihanSebelum)}
                            </span>
                          )}
                        </td>
                        {BULAN_NAMES.map((b) => {
                          const isPaid = kkPayments?.has(b.key);
                          if (isPaid) totalKkPaid += kkPayments.get(b.key)!.nominal;
                          const isClosed = kkTarif?.bulanDitutup?.includes(b.key);

                          return (
                            <td
                              key={b.key}
                              className={`border border-slate-400 p-1 text-center ${
                                b.isLibur ? 'bg-amber-50/40 text-amber-900' : ''
                              }`}
                            >
                              {isPaid ? (
                                <span className="font-bold text-emerald-800">✓</span>
                              ) : b.isLibur ? (
                                <span className="text-[8px] font-extrabold text-amber-800">LIBUR</span>
                              ) : isClosed ? (
                                <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-0.5 rounded border border-slate-300">
                                  TUTUP
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="border border-slate-400 p-1 text-right font-bold whitespace-nowrap font-mono">
                          {formatRupiah(totalKkPaid)}
                        </td>
                        <td className="border border-slate-400 p-1 text-right font-bold whitespace-nowrap font-mono bg-emerald-50/30">
                          {totalKkPaid + tagihanSebelum < 0 ? (
                            <span className="text-slate-300 font-medium">-</span>
                          ) : totalKkPaid + tagihanSebelum === 0 ? (
                            <span className="text-slate-600">Rp 0</span>
                          ) : (
                            <span className="text-emerald-800">+{formatRupiah(totalKkPaid + tagihanSebelum)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-[11px]">
                    <td colSpan={4} className="border border-slate-400 p-1.5 text-right font-black uppercase">
                      TOTAL KESELURUHAN:
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-black font-mono bg-amber-50">
                      <div className={totalTagihanSebelumAll < 0 ? 'text-rose-900' : totalTagihanSebelumAll > 0 ? 'text-emerald-900' : 'text-slate-600'}>
                        {totalTagihanSebelumAll > 0 ? '+' : ''}{formatRupiah(totalTagihanSebelumAll)}
                      </div>
                      <div className="text-[7.5px] text-slate-500 font-normal">
                        {totalTagihanSebelumAll < 0 ? '(Kurang)' : totalTagihanSebelumAll > 0 ? '(Lebih)' : '(Nihil)'}
                      </div>
                    </td>
                    <td colSpan={12} className="border border-slate-400 p-1.5 text-center text-slate-500 font-normal text-[10px]">
                      Periode Berjalan: <strong>{formatRupiah(totalUangYtd)}</strong>
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right text-slate-900 font-black font-mono whitespace-nowrap">
                      <div>{formatRupiah(totalUangYtd)}</div>
                      <div className="text-[7.5px] text-slate-500 font-normal">(Terbayar)</div>
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-black font-mono whitespace-nowrap bg-emerald-50 text-emerald-950">
                      <div className={totalUangYtd + totalTagihanSebelumAll < 0 ? 'text-slate-400' : 'text-emerald-950'}>
                        {totalUangYtd + totalTagihanSebelumAll < 0 ? '-' : (totalUangYtd + totalTagihanSebelumAll > 0 ? '+' : '') + formatRupiah(totalUangYtd + totalTagihanSebelumAll)}
                      </div>
                      <div className="text-[7.5px] text-slate-500 font-normal">(Terbayar + Seb)</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* TAMPILAN 2: FORMAT PER BULAN BERJALAN SAJA */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                    <th className="border border-slate-400 p-1.5 text-left">Nama Kepala Keluarga</th>
                    <th className="border border-slate-400 p-1.5 text-left">No. KK</th>
                    <th className="border border-slate-400 p-1.5 text-right">Tarif Warga</th>
                    <th className="border border-slate-400 p-1.5 text-center bg-amber-50">
                      <div>Tagihan Seb.</div>
                      <div className="text-[7px] text-amber-800 font-normal">&lt;0 Kurang, &gt;0 Lebih</div>
                    </th>
                    <th className="border border-slate-400 p-1.5 text-center">Status {activeBulanObj.short}</th>
                    <th className="border border-slate-400 p-1.5 text-right">Terbayar Bulan Ini</th>
                    <th className="border border-slate-400 p-1.5 text-left">Tgl &amp; Metode Bayar</th>
                    <th className="border border-slate-400 p-1.5 text-center w-24">Paraf / Tanda Tangan</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedKKList.map((kk, i) => {
                    const kkTarif = getTarifByKK(kk.noKk);
                    const totalTarifKK = kkTarif?.totalTarif ?? 25000;
                    const tagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;
                    const p = paidMap.get(kk.noKk)?.get(activeBulanKey);
                    const isClosed = kkTarif?.bulanDitutup?.includes(activeBulanKey);

                    return (
                      <tr key={kk.noKk}>
                        <td className="border border-slate-400 p-1.5 text-center">{i + 1}</td>
                        <td className="border border-slate-400 p-1.5 font-semibold">{kk.namaKepala}</td>
                        <td className="border border-slate-400 p-1.5 font-mono text-[9px]">{kk.noKk}</td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono">
                          {formatRupiah(totalTarifKK)}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono bg-amber-50/40">
                          {tagihanSebelum === 0 ? (
                            '-'
                          ) : tagihanSebelum < 0 ? (
                            <span className="text-rose-900 font-bold">-{formatRupiah(Math.abs(tagihanSebelum))}</span>
                          ) : (
                            <span className="text-emerald-900 font-bold">+{formatRupiah(tagihanSebelum)}</span>
                          )}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center font-bold">
                          {p ? (
                            <span className="text-emerald-800 font-black">LUNAS</span>
                          ) : activeBulanObj.isLibur ? (
                            <span className="text-amber-800 font-black">LIBUR</span>
                          ) : isClosed ? (
                            <span className="text-slate-500 font-bold">DITUTUP</span>
                          ) : (
                            <span className="text-rose-700 font-bold">BELUM BAYAR</span>
                          )}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-right font-mono font-bold">
                          {p ? formatRupiah(p.nominal) : 'Rp 0'}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-[9px]">
                          {p ? `${p.tanggalBayar} (${p.metode})` : '-'}
                        </td>
                        <td className="border border-slate-400 p-1.5 text-center text-slate-300">
                          {p ? '✓ Lunas' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-[11px]">
                    <td colSpan={3} className="border border-slate-400 p-1.5 text-right font-black uppercase">
                      TOTAL REKAPITULASI BULAN {activeBulanObj.short.toUpperCase()}:
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono">
                      {formatRupiah(totalPotensiBulanIni)}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono bg-amber-50">
                      {totalTagihanSebelumAll > 0 ? '+' : ''}{formatRupiah(totalTagihanSebelumAll)}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-center text-emerald-800">
                      {countLunasBulanIni} / {sortedKKList.length} KK
                    </td>
                    <td className="border border-slate-400 p-1.5 text-right font-mono text-emerald-950 font-black">
                      {formatRupiah(totalBulanIni)}
                    </td>
                    <td colSpan={2} className="border border-slate-400 p-1.5 text-slate-600 text-[9px]">
                      Kepatuhan: {sortedKKList.length > 0 ? Math.round((countLunasBulanIni / sortedKKList.length) * 100) : 0}% KK
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Keterangan Tambahan */}
          <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
            <div>* <strong>Tagihan Tahun Sebelum</strong>: &lt; 0 adalah Kurang Bayar, &gt; 0 adalah Lebih Bayar (dikelola melalui Catatan Iuran Baru).</div>
            <div>* Kolom bertanda <strong>TUTUP</strong> menandakan warga belum ikut iuran pada bulan tersebut (bebas tagihan).</div>
            <div>* Iuran Warga Bulan Maret 2026 diliburkan (bebas iuran warga RT 02).</div>
          </div>

          {/* Tanda Tangan Pengurus RT */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs">
            <div className="flex flex-col items-center">
              <div>
                Mengetahui,
                <div className="font-bold">Ketua RT 02 RW 14,</div>
              </div>
              <div className="my-2 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center">
                {qrKetuaUrl ? (
                  <img src={qrKetuaUrl} alt="QR Code Ketua RT" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400">QR Code</div>
                )}
              </div>
              <div className="font-bold underline">{ketuaRTName}</div>
              <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">✓ Tanda Tangan Digital BerkahOne</div>
            </div>

            <div className="flex flex-col items-center">
              <div>
                Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                <div className="font-bold">Bendahara RT 02,</div>
              </div>
              <div className="my-2 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center">
                {qrBendaharaUrl ? (
                  <img src={qrBendaharaUrl} alt="QR Code Bendahara RT" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-slate-50 flex items-center justify-center text-[9px] text-slate-400">QR Code</div>
                )}
              </div>
              <div className="font-bold underline">{bendaharaRTName}</div>
              <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">✓ Tanda Tangan Digital BerkahOne</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Batal Button */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500">
            Rekapitulasi Kartu Iuran Warga RT 02 RW 14 &bull; Format {rekapFormat === '12bulan' ? '12 Bulan' : 'Per Bulan'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-batal-rekap-kartu-footer"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:border-slate-400"
              title="Tutup / Batalkan tampilan rekap"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Batal</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Cetak Rekapitulasi Iuran"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekapitulasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
