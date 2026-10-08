import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateAge, formatIndoDate } from '../utils/dateUtils';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Baby, 
  HeartHandshake, 
  MapPin, 
  FileText, 
  CheckCircle2,
  Calendar,
  Layers,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { LogoSemarang } from './LogoSemarang';
import { RupiahIcon } from './RupiahIcon';

const formatRupiah = (num: number): string => {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
};

export const LaporanPelaporan: React.FC = () => {
  const { 
    wargaList, 
    users, 
    setActiveTab,
    ringkasanKas,
    ringkasanKasPKK,
    kasPKKList,
    pesertaPKKList,
    setActivePkkSubTab,
    currentUser
  } = useApp();
  const isWargaRole = currentUser?.role === 'warga';
  const [reportType, setReportType] = useState<'induk' | 'rekap' | 'balita' | 'lansia' | 'luar' | 'kas_pkk'>('induk');

  const sekretarisNama = users.find((u) => u.role === 'sekretaris')?.nama || 'Supraptono';
  const ketuaNama = users.find((u) => u.role === 'superadmin')?.nama || 'Ali Muhtarom, S.T';

  // Balita list (< 5 yo)
  const balitaList = wargaList.filter((w) => calculateAge(w.tglLahir) <= 5);
  // Lansia list (> 60 yo)
  const lansiaList = wargaList.filter((w) => calculateAge(w.tglLahir) >= 60);
  // Warga Luar / Kost
  const wargaLuarList = wargaList.filter((w) => !w.domisili.toLowerCase().includes('rt 02'));

  // Kas PKK sorted with running balance
  const sortedKasPKK = useMemo(() => {
    return [...kasPKKList].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [kasPKKList]);

  const kasPKKWithRunningBalance = useMemo(() => {
    let current = 0;
    return sortedKasPKK.map((item) => {
      if (item.tipe === 'masuk') current += item.nominal;
      else current -= item.nominal;
      return {
        ...item,
        saldoBerjalan: current
      };
    });
  }, [sortedKasPKK]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCurrent = () => {
    if (reportType === 'kas_pkk') {
      const headers = ['No', 'Tanggal', 'No Bukti', 'Tipe', 'Kategori', 'Uraian Transaksi', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Berjalan (Rp)', 'Penanggung Jawab'];
      const rows = kasPKKWithRunningBalance.map((k, idx) => [
        idx + 1,
        `"${k.tanggal}"`,
        `"${k.noBukti || '-'}"`,
        k.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        `"${k.kategori}"`,
        `"${k.keterangan.replace(/"/g, '""')}"`,
        k.tipe === 'masuk' ? k.nominal : 0,
        k.tipe === 'keluar' ? k.nominal : 0,
        k.saldoBerjalan,
        `"${k.penanggungJawab || '-'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csvContent);
      link.download = `BerkahOne_Laporan_Kas_PKK_RT02_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      return;
    }

    let dataset = wargaList;
    let title = 'Buku_Induk_RT02';
    if (reportType === 'balita') { dataset = balitaList; title = 'Laporan_Balita_Posyandu'; }
    else if (reportType === 'lansia') { dataset = lansiaList; title = 'Laporan_Lansia_Posbindu'; }
    else if (reportType === 'luar') { dataset = wargaLuarList; title = 'Laporan_Warga_Luar_Wilayah'; }

    const headers = ['No', 'Nama Warga', 'NIK', 'No KK', 'TTL', 'Jenis Kelamin', 'Status Keluarga', 'Alamat', 'Domisili', 'Pendidikan'];
    const rows = dataset.map((w, idx) => [
      idx + 1,
      `"${w.nama}"`,
      `'${w.nik}`,
      `'${w.noKk}`,
      `"${w.tempatLahir}, ${w.tglLahir}"`,
      w.jenisKelamin,
      w.statusKeluarga,
      `"${w.alamat}"`,
      `"${w.domisili}"`,
      w.pendidikan
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `BerkahOne_${title}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner for Warga Role (Hanya Lihat di Dashboard Pelaporan) */}
      {isWargaRole && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950 print:hidden shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <div>
              <strong className="text-emerald-900">Dashboard Pelaporan (Mode Akses Warga - Hanya Lihat):</strong>{' '}
              Anda dapat melihat statistik kependudukan, buku induk, sasaran posyandu, rekapitulasi, dan posisi kas PKK RT 02 RW 14 secara transparan.
            </div>
          </div>
        </div>
      )}

      {/* Action Header Card (Hidden on Print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>Pusat Pelaporan & Dokumen Resmi Kependudukan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Format pelaporan standar administrasi RT 02 RW 14 Tanjung Sari (Kelurahan Pedurungan Tengah).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCurrent}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Unduh CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen (A4 / F4)</span>
          </button>
        </div>
      </div>

      {/* Tabs / Report Selector (Hidden on Print) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap gap-1.5 print:hidden">
        <button
          onClick={() => setReportType('induk')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            reportType === 'induk'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Buku Induk Kependudukan ({wargaList.length})</span>
        </button>

        <button
          onClick={() => setReportType('rekap')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            reportType === 'rekap'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rekapitulasi Statistik RT</span>
        </button>

        <button
          onClick={() => setReportType('balita')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            reportType === 'balita'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Baby className="w-4 h-4 text-amber-500" />
          <span>Sasaran Posyandu Balita ({balitaList.length})</span>
        </button>

        <button
          onClick={() => setReportType('lansia')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            reportType === 'lansia'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-purple-500" />
          <span>Sasaran Posbindu Lansia ({lansiaList.length})</span>
        </button>

        <button
          onClick={() => setReportType('luar')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            reportType === 'luar'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4 text-cyan-600" />
          <span>Warga Luar Domisili / Kost ({wargaLuarList.length})</span>
        </button>

        <button
          onClick={() => setReportType('kas_pkk')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            reportType === 'kas_pkk'
              ? 'bg-rose-800 text-white shadow-xs'
              : 'text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <RupiahIcon className="w-4 h-4 text-pink-600" />
          <span>Posisi Kas PKK RT ({formatRupiah(ringkasanKasPKK.saldo)})</span>
        </button>

        {!isWargaRole && (
          <button
            onClick={() => setActiveTab('kas_besar')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer ml-auto"
          >
            <Wallet className="w-4 h-4 text-emerald-700" />
            <span>Laporan Kas Besar RT &rarr;</span>
          </button>
        )}
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Official Letterhead (Kop Laporan) */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-4">
            <LogoSemarang className="w-12 h-14" />
            <div className="text-left">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                PEMERINTAH KOTA SEMARANG &bull; RT 02 RW 14
              </h2>
              <p className="text-xs text-slate-700 font-semibold">
                KELURAHAN PEDURUNGAN TENGAH &bull; KECAMATAN PEDURUNGAN
              </p>
              <p className="text-[11px] text-slate-500">
                Sekretariat: Jl. Tanjungsari Permai / Pedurungan Tengah, Kota Semarang 50192
              </p>
            </div>
          </div>
          <div className="pt-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 underline">
              {reportType === 'induk' && 'BUKU INDUK DATA KEPENDUDUKAN WARGA'}
              {reportType === 'rekap' && 'REKAPITULASI LAPORAN DATA DEMOGRAFI & KEUANGAN BULANAN'}
              {reportType === 'balita' && 'DATA SASARAN POSYANDU BALITA & IMUNISASI (USIA 0 - 5 TAHUN)'}
              {reportType === 'lansia' && 'DATA SASARAN POSBINDU KESEHATAN LANSIA (USIA 60 TAHUN KE ATAS)'}
              {reportType === 'luar' && 'DATA WARGA TINGGAL SEMENTARA / LUAR DOMISILI / KOST'}
              {reportType === 'kas_pkk' && 'LAPORAN PERTANGGUNGJAWABAN POSISI KAS & KEUANGAN PKK RT 02'}
            </h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Posisi Data Per: {formatIndoDate(new Date().toISOString().slice(0, 10))} &bull; Sistem BerkahOne
            </p>
          </div>
        </div>

        {/* View 1: Buku Induk */}
        {reportType === 'induk' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                  <th className="p-2 border-r border-slate-300">NIK</th>
                  <th className="p-2 border-r border-slate-300">No. KK</th>
                  <th className="p-2 border-r border-slate-300">L/P</th>
                  <th className="p-2 border-r border-slate-300">Tempat, Tgl Lahir</th>
                  <th className="p-2 border-r border-slate-300">Status Kel.</th>
                  <th className="p-2 border-r border-slate-300">Person Kontak</th>
                  <th className="p-2 border-r border-slate-300">No. HP</th>
                  <th className="p-2 border-r border-slate-300">Alamat</th>
                  <th className="p-2">Pendidikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {wargaList.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50 text-[11px]">
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{w.nama}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.nik}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.noKk}</td>
                    <td className="p-2 border-r border-slate-200 text-center">{w.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                    <td className="p-2 border-r border-slate-200">{w.tempatLahir}, {w.tglLahir}</td>
                    <td className="p-2 border-r border-slate-200">{w.statusKeluarga}</td>
                    <td className="p-2 border-r border-slate-200 font-medium">{w.personKontak || (w.statusKeluarga === 'Kepala Keluarga' ? `${w.nama} (KK)` : '-')}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.noHp || w.telepon || '-'}</td>
                    <td className="p-2 border-r border-slate-200 truncate max-w-[180px]">{w.alamat}</td>
                    <td className="p-2">{w.pendidikan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Rekapitulasi Statistik RT */}
        {reportType === 'rekap' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-4 4k:grid-cols-4 gap-4 2xl:gap-5 4k:gap-6">
              <div className="p-4 rounded-xl border border-slate-200 text-center bg-slate-50">
                <span className="text-xs text-slate-500 block">Total Jiwa</span>
                <span className="text-2xl font-black text-slate-800">{wargaList.length}</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 text-center bg-slate-50">
                <span className="text-xs text-slate-500 block">Laki-laki</span>
                <span className="text-2xl font-black text-blue-700">
                  {wargaList.filter((w) => w.jenisKelamin === 'Laki-laki').length}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 text-center bg-slate-50">
                <span className="text-xs text-slate-500 block">Perempuan</span>
                <span className="text-2xl font-black text-pink-700">
                  {wargaList.filter((w) => w.jenisKelamin === 'Perempuan').length}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 text-center bg-slate-50">
                <span className="text-xs text-slate-500 block">Total KK</span>
                <span className="text-2xl font-black text-emerald-800">
                  {new Set(wargaList.map((w) => w.noKk)).size}
                </span>
              </div>
            </div>

            {/* Rekap Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300">Kategori Indikator</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Jumlah (Jiwa)</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Persentase</th>
                    <th className="p-2.5">Keterangan Program RT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">Warga Balita (0 - 5 Th)</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">{balitaList.length}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-mono">
                      {Math.round((balitaList.length / wargaList.length) * 100)}%
                    </td>
                    <td className="p-2.5 text-slate-600">Posyandu Balita rutin tanggal 15 setiap bulan</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">Warga Lansia (60+ Th)</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">{lansiaList.length}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-mono">
                      {Math.round((lansiaList.length / wargaList.length) * 100)}%
                    </td>
                    <td className="p-2.5 text-slate-600">Pemeriksaan tensi & senam lansia Posbindu</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">Kepala Keluarga (KK)</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">
                      {wargaList.filter((w) => w.statusKeluarga === 'Kepala Keluarga').length}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-mono">
                      {Math.round((wargaList.filter((w) => w.statusKeluarga === 'Kepala Keluarga').length / wargaList.length) * 100)}%
                    </td>
                    <td className="p-2.5 text-slate-600">Partisipan rapat RT & iuran wajib kas lingkungan</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-bold">Warga Luar Domisili / Kost</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">{wargaLuarList.length}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-mono">
                      {Math.round((wargaLuarList.length / wargaList.length) * 100)}%
                    </td>
                    <td className="p-2.5 text-slate-600">Wajib lapor diri 1x24 jam & pendataan ketertiban</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rekap Posisi Keuangan Kas RT & Kas PKK */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-300">
                <span>Posisi Saldo Kas & Keuangan Lingkungan (Kas RT & Kas PKK)</span>
                <span className="text-[11px] text-slate-500 font-normal">Tahun Berjalan 2026</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Nama Rekening / Pos Dana</th>
                    <th className="p-2.5 border-r border-slate-200 text-right">Pemasukan (Rp)</th>
                    <th className="p-2.5 border-r border-slate-200 text-right">Pengeluaran (Rp)</th>
                    <th className="p-2.5 border-r border-slate-200 text-right font-bold">Saldo Akhir (Rp)</th>
                    <th className="p-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-medium">Kas Kecil RT 02 (Iuran & Sosial)</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono">{formatRupiah(ringkasanKas.totalMasukKasKecil)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono">{formatRupiah(ringkasanKas.totalKeluarKasKecil)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-emerald-800">{formatRupiah(ringkasanKas.saldoKasKecil)}</td>
                    <td className="p-2.5 text-slate-600">Iuran rutin warga & operasional RT 02</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border-r border-slate-200 font-medium">Kas BOP RT 02 (Bantuan Pemerintah)</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono">{formatRupiah(ringkasanKas.totalMasukKasBOP)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono">{formatRupiah(ringkasanKas.totalKeluarKasBOP)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-blue-800">{formatRupiah(ringkasanKas.saldoKasBOP)}</td>
                    <td className="p-2.5 text-slate-600">BOP Kelurahan Pedurungan Tengah</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="p-2.5 border-r border-slate-200 font-bold text-emerald-950">Subtotal Kas Besar RT (Konsolidasi)</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold">{formatRupiah(ringkasanKas.totalMasukKasBesar)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold">{formatRupiah(ringkasanKas.totalKeluarKasBesar)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-black text-emerald-900">{formatRupiah(ringkasanKas.totalSaldoKasBesar)}</td>
                    <td className="p-2.5 font-semibold text-emerald-800">Saldo Konsolidasi Kas RT</td>
                  </tr>
                  <tr className="bg-rose-50/50">
                    <td className="p-2.5 border-r border-slate-200 font-bold text-rose-950">Posisi Kas PKK RT 02</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-rose-900">{formatRupiah(ringkasanKasPKK.totalMasuk)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-bold text-rose-900">{formatRupiah(ringkasanKasPKK.totalKeluar)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono font-black text-rose-800">{formatRupiah(ringkasanKasPKK.saldo)}</td>
                    <td className="p-2.5 font-semibold text-rose-900">Kelolaan Tim PKK ({pesertaPKKList.length} Istri / Kader)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 3: Balita */}
        {reportType === 'balita' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead className="bg-amber-50 text-[10px] uppercase font-bold text-amber-900 border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-slate-300">Nama Balita</th>
                  <th className="p-2 border-r border-slate-300">NIK</th>
                  <th className="p-2 border-r border-slate-300">L/P</th>
                  <th className="p-2 border-r border-slate-300">Tanggal Lahir</th>
                  <th className="p-2 border-r border-slate-300">Usia</th>
                  <th className="p-2 border-r border-slate-300">No. KK</th>
                  <th className="p-2">Alamat Rumah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {balitaList.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{w.nama}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.nik}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-semibold">{w.jenisKelamin}</td>
                    <td className="p-2 border-r border-slate-200">{w.tglLahir}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-amber-700">{calculateAge(w.tglLahir)} Tahun</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.noKk}</td>
                    <td className="p-2 truncate max-w-[200px]">{w.alamat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 4: Lansia */}
        {reportType === 'lansia' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead className="bg-purple-50 text-[10px] uppercase font-bold text-purple-900 border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-slate-300">Nama Lansia</th>
                  <th className="p-2 border-r border-slate-300">NIK</th>
                  <th className="p-2 border-r border-slate-300">L/P</th>
                  <th className="p-2 border-r border-slate-300">Tanggal Lahir</th>
                  <th className="p-2 border-r border-slate-300">Usia</th>
                  <th className="p-2 border-r border-slate-300">Status di Keluarga</th>
                  <th className="p-2">Alamat Lengkap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {lansiaList.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{w.nama}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.nik}</td>
                    <td className="p-2 border-r border-slate-200 text-center">{w.jenisKelamin}</td>
                    <td className="p-2 border-r border-slate-200">{w.tglLahir}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-purple-700">{calculateAge(w.tglLahir)} Tahun</td>
                    <td className="p-2 border-r border-slate-200">{w.statusKeluarga}</td>
                    <td className="p-2 truncate max-w-[200px]">{w.alamat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 5: Warga Luar Domisili */}
        {reportType === 'luar' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead className="bg-cyan-50 text-[10px] uppercase font-bold text-cyan-900 border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                  <th className="p-2 border-r border-slate-300">NIK</th>
                  <th className="p-2 border-r border-slate-300">Status Domisili</th>
                  <th className="p-2 border-r border-slate-300">Asal Daerah (Tempat Lahir)</th>
                  <th className="p-2">Alamat Tinggal di Wilayah RT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {wargaLuarList.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{w.nama}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{w.nik}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-cyan-800">{w.domisili}</td>
                    <td className="p-2 border-r border-slate-200">{w.tempatLahir}</td>
                    <td className="p-2 truncate max-w-[250px]">{w.alamat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 6: Posisi Kas PKK */}
        {reportType === 'kas_pkk' && (
          <div className="space-y-6">
            {/* KPI Cards Ringkasan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-rose-300 text-center bg-rose-50/70 shadow-2xs">
                <span className="text-xs text-rose-800 font-bold block">Saldo Kas PKK</span>
                <span className="text-2xl font-black text-rose-900 mt-1 block">{formatRupiah(ringkasanKasPKK.saldo)}</span>
                <span className="text-[10px] text-rose-600 mt-0.5 block font-medium">Dana Kas Tersedia</span>
              </div>
              <div className="p-4 rounded-xl border border-emerald-300 text-center bg-emerald-50/70 shadow-2xs">
                <span className="text-xs text-emerald-800 font-bold block">Total Pemasukan</span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block">{formatRupiah(ringkasanKasPKK.totalMasuk)}</span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Iuran & Penerimaan</span>
              </div>
              <div className="p-4 rounded-xl border border-red-300 text-center bg-red-50/70 shadow-2xs">
                <span className="text-xs text-red-800 font-bold block">Total Pengeluaran</span>
                <span className="text-2xl font-black text-red-700 mt-1 block">{formatRupiah(ringkasanKasPKK.totalKeluar)}</span>
                <span className="text-[10px] text-red-600 mt-0.5 block font-medium">Operasional & Kegiatan</span>
              </div>
              <div className="p-4 rounded-xl border border-pink-300 text-center bg-pink-50/70 shadow-2xs">
                <span className="text-xs text-pink-800 font-bold block">Kader & Warga Istri</span>
                <span className="text-2xl font-black text-pink-900 mt-1 block">{pesertaPKKList.length} Anggota</span>
                <span className="text-[10px] text-pink-700 mt-0.5 block font-medium">Status Istri Warga RT 02</span>
              </div>
            </div>

            {/* Buku Kas PKK Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-700">
                <span className="font-bold uppercase tracking-wide text-rose-950">
                  BUKU MUTASI KAS TIM PENGGERAK PKK RT 02 RW 14
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Total {kasPKKWithRunningBalance.length} Transaksi Tercatat
                </span>
              </div>
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead className="bg-rose-50 text-[10px] uppercase font-bold text-rose-900 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                    <th className="p-2 border-r border-slate-300 w-24">Tanggal</th>
                    <th className="p-2 border-r border-slate-300 w-28">No. Bukti</th>
                    <th className="p-2 border-r border-slate-300">Kategori</th>
                    <th className="p-2 border-r border-slate-300">Uraian / Keterangan</th>
                    <th className="p-2 border-r border-slate-300 text-right w-28">Masuk (Rp)</th>
                    <th className="p-2 border-r border-slate-300 text-right w-28">Keluar (Rp)</th>
                    <th className="p-2 border-r border-slate-300 text-right w-28">Saldo (Rp)</th>
                    <th className="p-2 w-36">PJ / Penerima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {kasPKKWithRunningBalance.map((k, idx) => (
                    <tr key={k.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap">{k.tanggal}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{k.noBukti || '-'}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{k.kategori}</td>
                      <td className="p-2 border-r border-slate-200">{k.keterangan}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                        {k.tipe === 'masuk' ? formatRupiah(k.nominal) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-red-700">
                        {k.tipe === 'keluar' ? formatRupiah(k.nominal) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(k.saldoBerjalan)}
                      </td>
                      <td className="p-2 text-slate-600 truncate max-w-[140px]">{k.penanggungJawab || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-xs">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right uppercase border-r border-slate-300">
                      Total Akumulasi & Saldo Kas PKK:
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-800 border-r border-slate-300">
                      {formatRupiah(ringkasanKasPKK.totalMasuk)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-red-700 border-r border-slate-300">
                      {formatRupiah(ringkasanKasPKK.totalKeluar)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-rose-900 border-r border-slate-300">
                      {formatRupiah(ringkasanKasPKK.saldo)}
                    </td>
                    <td className="p-2.5 text-[10px] text-slate-600">Terverifikasi Seimbang</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Formal Signature Footer */}
        {reportType === 'kas_pkk' ? (
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-800 border-t border-slate-200 mt-6">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold uppercase">KETUA RT 02 RW 14,</p>
              <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                {ketuaNama}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Pembina Lingkungan RT</p>
            </div>
            <div>
              <p>Diperiksa Oleh,</p>
              <p className="font-bold uppercase">KETUA PKK RT 02,</p>
              <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                NY. CHRISTIANTI SUMARSONO
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Koordinator Penggerak PKK</p>
            </div>
            <div>
              <p>Semarang, {formatIndoDate(new Date().toISOString().slice(0, 10))}</p>
              <p className="font-bold uppercase">BENDAHARA PKK RT 02,</p>
              <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                NY. WIWIK DWI WINDU
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Pengelola Kas & Iuran PKK</p>
            </div>
          </div>
        ) : (
          <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">SEKRETARIS RT 02 RW 14,</p>
              <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                {sekretarisNama}
              </div>
            </div>
            <div>
              <p>Semarang, {formatIndoDate(new Date().toISOString().slice(0, 10))}</p>
              <p className="font-bold">KETUA RT 02 RW 14 PEDURUNGAN TENGAH,</p>
              <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                {ketuaNama}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
