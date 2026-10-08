import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TransaksiKas, PosKas, TipeTransaksi } from '../types';
import { LogoSemarang } from './LogoSemarang';
import { LOGO_SEMARANG_DATA_URI } from '../data/logoSemarang';
import { generateQRCodeWithBerkahOneLogo } from '../utils/qrCodeGenerator';
import { exportElementToPDF } from '../utils/pdfExport';
import { IuranWargaView } from './IuranWargaView';
import { UndanganJumpaBulanView } from './kas/UndanganJumpaBulanView';
import { QrCodeBendaharaModal } from './iuran/QrCodeBendaharaModal';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Layers, 
  X,
  Coins,
  Receipt,
  Scale,
  ExternalLink,
  Loader2,
  Users,
  QrCode,
  Sparkles,
  Pencil
} from 'lucide-react';

export const KasBesarView: React.FC = () => {
  const { 
    kasList, 
    ringkasanKas, 
    addTransaksiKas, 
    updateTransaksiKas,
    deleteTransaksiKas,
    deleteAllTransaksiKas,
    hasPermission, 
    currentUser,
    users,
    activeKasSubTab,
    setActiveKasSubTab,
    iuranList
  } = useApp();

  // Tab filter: 'semua' (Kas Besar Gabungan), 'kas_kecil', 'kas_bop'
  const [selectedPos, setSelectedPos] = useState<'semua' | 'kas_kecil' | 'kas_bop'>('semua');
  const [filterTipe, setFilterTipe] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [filterLpj, setFilterLpj] = useState<'semua' | 'lengkap' | 'proses' | 'belum' | 'tidak_perlu'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  // Sesuai ketentuan: transaksi kas berlaku mulai Februari 2026, data yang tampil hanya yang dipilih sesuai periode
  const [selectedBulan, setSelectedBulan] = useState<string>('2026-02');

  // Modals & PDF
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllKeepSaldoAwal, setDeleteAllKeepSaldoAwal] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQrBendaharaModalOpen, setIsQrBendaharaModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedPdfInfo, setGeneratedPdfInfo] = useState<{ url: string; filename: string } | null>(null);
  const printContentRef = useRef<HTMLDivElement>(null);
  const [transaksiToDelete, setTransaksiToDelete] = useState<TransaksiKas | null>(null);
  const [editingLpjItem, setEditingLpjItem] = useState<TransaksiKas | null>(null);
  const [editingLpjValue, setEditingLpjValue] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Koreksi Transaksi State
  const [editingTransaksi, setEditingTransaksi] = useState<TransaksiKas | null>(null);
  const [koreksiPosKas, setKoreksiPosKas] = useState<PosKas>('kas_kecil');
  const [koreksiTipe, setKoreksiTipe] = useState<TipeTransaksi>('masuk');
  const [koreksiTanggal, setKoreksiTanggal] = useState<string>('2026-02-01');
  const [koreksiKategori, setKoreksiKategori] = useState<string>('');
  const [koreksiKeterangan, setKoreksiKeterangan] = useState<string>('');
  const [koreksiNominal, setKoreksiNominal] = useState<string>('');
  const [koreksiNoBukti, setKoreksiNoBukti] = useState<string>('');
  const [koreksiLpj, setKoreksiLpj] = useState<string>('Tidak Perlu');
  const [koreksiPenanggungJawab, setKoreksiPenanggungJawab] = useState<string>('');
  const [koreksiCatatan, setKoreksiCatatan] = useState<string>('');
  const [koreksiError, setKoreksiError] = useState<string | null>(null);

  // Form State
  const [formPosKas, setFormPosKas] = useState<PosKas>('kas_kecil');
  const [formTipe, setFormTipe] = useState<TipeTransaksi>('masuk');
  const [formTanggal, setFormTanggal] = useState<string>('2026-02-01');
  const [formKategori, setFormKategori] = useState<string>('Iuran Warga Bulanan');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formNominal, setFormNominal] = useState<string>('');
  const [formNoBukti, setFormNoBukti] = useState<string>('');
  const [formLpj, setFormLpj] = useState<string>('Tidak Perlu');
  const [formPenanggungJawab, setFormPenanggungJawab] = useState<string>(
    currentUser ? `${currentUser.nama} (${currentUser.roleLabel})` : 'Misbahudin (Bendahara)'
  );

  // Categories list per posKas
  const kategoriKasKecil = [
    'Saldo Awal Kas',
    'Iuran Warga Bulanan',
    'Iuran Sosial & Duka',
    'Sumbangan & Donasi Warga',
    'Kebersihan & Sampah',
    'Sarana Prasarana Lingkungan',
    'Konsumsi Rapat Warga',
    'Operasional & ATK',
    'Kerja Bakti Lingkungan',
    'Keamanan & Ronda',
    'Lain-lain (Kas Kecil)'
  ];

  const kategoriKasBOP = [
    'Pencairan BOP Kelurahan',
    'BOP Alokasi Kebersihan & Sanitasi',
    'BOP Pemberdayaan Masyarakat',
    'Honor & Dukungan Kader',
    'Sarana Pelayanan Masyarakat',
    'Konsumsi Koordinasi Kelembagaan',
    'Publikasi & Papan Informasi',
    'Administrasi & SPJ BOP',
    'Kesehatan & Pengendalian DBD',
    'Lain-lain (Kas BOP)'
  ];

  // When pos changes in form, reset default category & LPJ
  const handlePosChange = (pos: PosKas) => {
    setFormPosKas(pos);
    if (pos === 'kas_kecil') {
      setFormKategori(formTipe === 'masuk' ? 'Iuran Warga Bulanan' : 'Kebersihan & Sampah');
      setFormLpj(formTipe === 'masuk' ? 'Tidak Perlu' : 'Kwitansi Terlampir');
    } else {
      setFormKategori(formTipe === 'masuk' ? 'Pencairan BOP Kelurahan' : 'Honor & Dukungan Kader');
      setFormLpj(formTipe === 'masuk' ? 'SP2D Kelurahan' : 'LPJ BOP');
    }
  };

  const handleTipeChange = (tipe: TipeTransaksi) => {
    setFormTipe(tipe);
    if (formPosKas === 'kas_kecil') {
      setFormKategori(tipe === 'masuk' ? 'Iuran Warga Bulanan' : 'Kebersihan & Sampah');
      setFormLpj(tipe === 'masuk' ? 'Tidak Perlu' : 'Kwitansi Terlampir');
    } else {
      setFormKategori(tipe === 'masuk' ? 'Pencairan BOP Kelurahan' : 'Honor & Dukungan Kader');
      setFormLpj(tipe === 'masuk' ? 'SP2D Kelurahan' : 'LPJ BOP');
    }
  };

  // Unique months from transactions for filter (berlaku mulai Februari 2026)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-02');
    kasList.forEach((item) => {
      if (item.tanggal) {
        const ym = item.tanggal.substring(0, 7);
        if (ym >= '2026-02') {
          months.add(ym);
        }
      }
    });
    return Array.from(months).sort();
  }, [kasList]);

  // Pastikan selectedBulan valid dan ada dalam daftar
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedBulan)) {
      setSelectedBulan(availableMonths[0]);
    }
  }, [availableMonths, selectedBulan]);

  // Saldo awal sebelum periode terpilih (akumulasi saldo sebelum bulan yang dipilih sejak Februari 2026)
  const saldoAwalBulanIni = useMemo(() => {
    let saKasKecil = 0;
    let saKasBop = 0;

    kasList.forEach((tx) => {
      if (!tx.tanggal || tx.tanggal.substring(0, 7) < '2026-02') return;
      if (tx.tanggal.substring(0, 7) < selectedBulan) {
        const delta = tx.tipe === 'masuk' ? tx.nominal : -tx.nominal;
        if (tx.posKas === 'kas_kecil') saKasKecil += delta;
        else if (tx.posKas === 'kas_bop') saKasBop += delta;
      }
    });

    return {
      kasKecil: saKasKecil,
      kasBop: saKasBop,
      totalKasBesar: saKasKecil + saKasBop
    };
  }, [kasList, selectedBulan]);

  // Ringkasan finansial khusus periode terpilih
  const ringkasanPeriode = useMemo(() => {
    let totalMasukKasKecil = 0;
    let totalKeluarKasKecil = 0;
    let totalMasukKasBOP = 0;
    let totalKeluarKasBOP = 0;

    kasList.forEach((t) => {
      if (!t.tanggal || t.tanggal.substring(0, 7) !== selectedBulan) return;
      if (t.posKas === 'kas_kecil') {
        if (t.tipe === 'masuk') totalMasukKasKecil += t.nominal;
        else totalKeluarKasKecil += t.nominal;
      } else if (t.posKas === 'kas_bop') {
        if (t.tipe === 'masuk') totalMasukKasBOP += t.nominal;
        else totalKeluarKasBOP += t.nominal;
      }
    });

    const saldoAkhirKasKecil = saldoAwalBulanIni.kasKecil + totalMasukKasKecil - totalKeluarKasKecil;
    const saldoAkhirKasBOP = saldoAwalBulanIni.kasBop + totalMasukKasBOP - totalKeluarKasBOP;
    const totalMasukKasBesar = totalMasukKasKecil + totalMasukKasBOP;
    const totalKeluarKasBesar = totalKeluarKasKecil + totalKeluarKasBOP;
    const saldoAkhirKasBesar = saldoAkhirKasKecil + saldoAkhirKasBOP;

    return {
      saldoAwalKasKecil: saldoAwalBulanIni.kasKecil,
      saldoAkhirKasKecil,
      totalMasukKasKecil,
      totalKeluarKasKecil,
      saldoAwalKasBOP: saldoAwalBulanIni.kasBop,
      saldoAkhirKasBOP,
      totalMasukKasBOP,
      totalKeluarKasBOP,
      saldoAwalKasBesar: saldoAwalBulanIni.totalKasBesar,
      saldoAkhirKasBesar,
      totalMasukKasBesar,
      totalKeluarKasBesar,
    };
  }, [kasList, selectedBulan, saldoAwalBulanIni]);

  // Filtered list: HANYA menampilkan data transaksi yang dipilih sesuai periode (dan filter lainnya)
  const filteredKas = useMemo(() => {
    return kasList.filter((item) => {
      // Hanya berlaku mulai bulan Februari 2026
      if (!item.tanggal || item.tanggal.substring(0, 7) < '2026-02') return false;

      // HANYA data yang sesuai dengan periode yang dipilih
      const itemMonth = item.tanggal.substring(0, 7);
      if (itemMonth !== selectedBulan) return false;

      // Pos kas filter
      if (selectedPos !== 'semua' && item.posKas !== selectedPos) return false;
      // Tipe filter
      if (filterTipe !== 'semua' && item.tipe !== filterTipe) return false;
      // LPJ filter
      if (filterLpj !== 'semua') {
        const lpjVal = (item.lpj || '').toLowerCase();
        if (filterLpj === 'lengkap') {
          if (lpjVal.includes('proses') || lpjVal.includes('belum') || lpjVal.includes('tidak perlu') || lpjVal === '-' || !lpjVal) {
            return false;
          }
        } else if (filterLpj === 'proses') {
          if (!lpjVal.includes('proses')) return false;
        } else if (filterLpj === 'belum') {
          if (!lpjVal.includes('belum')) return false;
        } else if (filterLpj === 'tidak_perlu') {
          if (!lpjVal.includes('tidak perlu') && lpjVal !== '-' && lpjVal !== '') return false;
        }
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchKeterangan = item.keterangan.toLowerCase().includes(query);
        const matchKategori = item.kategori.toLowerCase().includes(query);
        const matchBukti = item.noBukti?.toLowerCase().includes(query);
        const matchPJ = item.penanggungJawab.toLowerCase().includes(query);
        const matchLPJ = item.lpj?.toLowerCase().includes(query);
        if (!matchKeterangan && !matchKategori && !matchBukti && !matchPJ && !matchLPJ) return false;
      }
      return true;
    });
  }, [kasList, selectedPos, filterTipe, filterLpj, selectedBulan, searchQuery]);

  // Sort chronological for running balance calculation
  const chronologicalSorted = useMemo(() => {
    return [...filteredKas].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [filteredKas]);

  // Compute running balance for each row
  const tableWithRunningBalance = useMemo(() => {
    let startingBase = 0;
    if (selectedPos === 'kas_kecil') startingBase = saldoAwalBulanIni.kasKecil;
    else if (selectedPos === 'kas_bop') startingBase = saldoAwalBulanIni.kasBop;
    else startingBase = saldoAwalBulanIni.totalKasBesar;

    let running = startingBase;
    const balanceMap: { [id: string]: number } = {};
    chronologicalSorted.forEach((tx) => {
      if (tx.tipe === 'masuk') {
        running += tx.nominal;
      } else {
        running -= tx.nominal;
      }
      balanceMap[tx.id] = running;
    });

    // Display in reverse chronological (newest first)
    return [...filteredKas]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .map((tx) => ({
        ...tx,
        saldoBerjalan: balanceMap[tx.id] ?? 0
      }));
  }, [filteredKas, chronologicalSorted, selectedPos, saldoAwalBulanIni]);

  // Handle Form Submit
  const handleSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const num = parseInt(formNominal.replace(/\D/g, ''), 10);
    if (isNaN(num) || num <= 0) {
      setFormError('Mohon masukkan nominal transaksi yang valid (lebih besar dari Rp 0).');
      return;
    }
    if (!formKeterangan.trim()) {
      setFormError('Mohon masukkan uraian atau rincian transaksi.');
      return;
    }

    addTransaksiKas({
      posKas: formPosKas,
      tipe: formTipe,
      tanggal: formTanggal,
      kategori: formKategori,
      keterangan: formKeterangan.trim(),
      nominal: num,
      noBukti: formNoBukti.trim() || undefined,
      lpj: formLpj.trim() || undefined,
      penanggungJawab: formPenanggungJawab.trim()
    });

    // Reset and close
    setFormNominal('');
    setFormKeterangan('');
    setFormNoBukti('');
    setFormLpj(formTipe === 'masuk' ? 'Tidak Perlu' : (formPosKas === 'kas_bop' ? 'LPJ BOP' : 'Kwitansi Terlampir'));
    setFormError(null);
    setIsAddModalOpen(false);
    setToastMessage({
      type: 'success',
      text: 'Transaksi baru berhasil dicatat dan saldo kas telah disesuaikan.'
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick LPJ Update
  const handleSaveLpjEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLpjItem) return;
    updateTransaksiKas(editingLpjItem.id, {
      lpj: editingLpjValue.trim() || undefined
    });
    setEditingLpjItem(null);
    setEditingLpjValue('');
    setToastMessage({
      type: 'success',
      text: 'Status LPJ transaksi berhasil diperbarui.'
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Buka Modal Koreksi Transaksi
  const handleOpenKoreksi = (item: TransaksiKas) => {
    setEditingTransaksi(item);
    setKoreksiPosKas(item.posKas);
    setKoreksiTipe(item.tipe);
    setKoreksiTanggal(item.tanggal);
    setKoreksiKategori(item.kategori);
    setKoreksiKeterangan(item.keterangan);
    setKoreksiNominal(item.nominal.toLocaleString('id-ID'));
    setKoreksiNoBukti(item.noBukti || '');
    setKoreksiLpj(item.lpj || (item.tipe === 'masuk' ? 'Tidak Perlu' : 'Kwitansi Terlampir'));
    setKoreksiPenanggungJawab(item.penanggungJawab || (currentUser ? `${currentUser.nama} (${currentUser.roleLabel})` : 'Misbahudin (Bendahara)'));
    setKoreksiCatatan('');
    setKoreksiError(null);
  };

  const handleKoreksiPosChange = (pos: PosKas) => {
    setKoreksiPosKas(pos);
    if (pos === 'kas_kecil' && !kategoriKasKecil.includes(koreksiKategori)) {
      setKoreksiKategori(koreksiTipe === 'masuk' ? 'Iuran Warga Bulanan' : 'Kebersihan & Sampah');
    } else if (pos === 'kas_bop' && !kategoriKasBOP.includes(koreksiKategori)) {
      setKoreksiKategori(koreksiTipe === 'masuk' ? 'Pencairan BOP Kelurahan' : 'Konsumsi Koordinasi Kelembagaan');
    }
  };

  const handleSaveKoreksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaksi) return;
    setKoreksiError(null);

    const num = parseInt(koreksiNominal.replace(/\D/g, ''), 10);
    const isSaldoAwal = editingTransaksi.id === 'kas-sa-2026-02' || editingTransaksi.kategori?.toLowerCase().includes('saldo awal');
    if (isNaN(num) || (!isSaldoAwal && num <= 0) || (isSaldoAwal && num < 0)) {
      setKoreksiError('Mohon masukkan nominal transaksi yang valid' + (isSaldoAwal ? ' (minimal Rp 0).' : ' (lebih besar dari Rp 0).'));
      return;
    }
    if (!koreksiKeterangan.trim()) {
      setKoreksiError('Mohon masukkan uraian atau rincian transaksi.');
      return;
    }
    if (!koreksiTanggal || koreksiTanggal < '2026-02-01') {
      setKoreksiError('Tanggal transaksi pembukuan harus mulai dari bulan Februari 2026 (minimal 2026-02-01).');
      return;
    }
    if (!koreksiPenanggungJawab.trim()) {
      setKoreksiError('Mohon masukkan nama penanggung jawab transaksi.');
      return;
    }

    const updatedData: Partial<TransaksiKas> = {
      posKas: koreksiPosKas,
      tipe: koreksiTipe,
      tanggal: koreksiTanggal,
      kategori: koreksiKategori,
      keterangan: koreksiKeterangan.trim(),
      nominal: num,
      noBukti: koreksiNoBukti.trim() || undefined,
      lpj: koreksiLpj.trim() || undefined,
      penanggungJawab: koreksiPenanggungJawab.trim()
    };

    updateTransaksiKas(editingTransaksi.id, updatedData);

    // Otomatis sinkronkan periode jika tanggal transaksi dikoreksi ke bulan lain
    const targetMonth = koreksiTanggal.substring(0, 7);
    if (targetMonth && targetMonth !== selectedBulan) {
      setSelectedBulan(targetMonth);
    }

    setEditingTransaksi(null);
    setToastMessage({
      type: 'success',
      text: `Koreksi transaksi "${updatedData.keterangan}" berhasil disimpan dan pembukuan kas telah disesuaikan.`
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Tanggal', 'Pos Kas', 'Tipe', 'Kategori', 'Uraian Transaksi', 'No. Bukti', 'LPJ', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo (Rp)', 'Penanggung Jawab'];
    const rows = tableWithRunningBalance.map((item, idx) => [
      idx + 1,
      item.tanggal,
      item.posKas === 'kas_kecil' ? 'Kas Kecil' : 'Kas BOP',
      item.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
      `"${item.kategori.replace(/"/g, '""')}"`,
      `"${item.keterangan.replace(/"/g, '""')}"`,
      `"${(item.noBukti || '-').replace(/"/g, '""')}"`,
      `"${(item.lpj || '-').replace(/"/g, '""')}"`,
      item.tipe === 'masuk' ? item.nominal : 0,
      item.tipe === 'keluar' ? item.nominal : 0,
      item.saldoBerjalan,
      `"${item.penanggungJawab.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kas_Besar_RT02_RW14_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatBulanTahun = (ym: string) => {
    const [year, month] = ym.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  };

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const ketuaRTName = users?.find((u) => u.role === 'superadmin')?.nama || 'ALI MUHTAROM, S.T';
  const bendaharaRTName = users?.find((u) => u.role === 'bendahara')?.nama || 'MISBAHUDIN';

  // Digital Signature QR Codes with BerkahOne Logo
  const [qrKetuaUrl, setQrKetuaUrl] = useState<string>('');
  const [qrBendaharaUrl, setQrBendaharaUrl] = useState<string>('');

  const ensureQRCodes = async () => {
    if (qrKetuaUrl && qrBendaharaUrl) {
      return { qrKetua: qrKetuaUrl, qrBendahara: qrBendaharaUrl };
    }
    const periodeLabel = formatBulanTahun(selectedBulan);
    const ketuaText = `DOKUMEN RESMI BUKU KAS BESAR RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Mengetahui\nNama: ${ketuaRTName}\nJabatan: Ketua RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14\nPeriode: ${periodeLabel}\nVerifikasi: SAH & TERCATAT`;
    const bendaharaText = `DOKUMEN RESMI BUKU KAS BESAR RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Dibuat\nNama: ${bendaharaRTName}\nJabatan: Bendahara RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14\nPeriode: ${periodeLabel}\nVerifikasi: SAH & TERCATAT`;

    try {
      const [k, b] = await Promise.all([
        generateQRCodeWithBerkahOneLogo(ketuaText, 240),
        generateQRCodeWithBerkahOneLogo(bendaharaText, 240)
      ]);
      setQrKetuaUrl(k);
      setQrBendaharaUrl(b);
      return { qrKetua: k, qrBendahara: b };
    } catch (err) {
      console.error('Error generating signature QRs:', err);
      return { qrKetua: '', qrBendahara: '' };
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadQRs = async () => {
      const periodeLabel = formatBulanTahun(selectedBulan);
      const ketuaText = `DOKUMEN RESMI BUKU KAS BESAR RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Mengetahui\nNama: ${ketuaRTName}\nJabatan: Ketua RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14\nPeriode: ${periodeLabel}\nVerifikasi: SAH & TERCATAT`;
      const bendaharaText = `DOKUMEN RESMI BUKU KAS BESAR RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Dibuat\nNama: ${bendaharaRTName}\nJabatan: Bendahara RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14\nPeriode: ${periodeLabel}\nVerifikasi: SAH & TERCATAT`;

      try {
        const [k, b] = await Promise.all([
          generateQRCodeWithBerkahOneLogo(ketuaText, 240),
          generateQRCodeWithBerkahOneLogo(bendaharaText, 240)
        ]);
        if (isMounted) {
          setQrKetuaUrl(k);
          setQrBendaharaUrl(b);
        }
      } catch (err) {
        console.error('Failed to load signature QRs:', err);
      }
    };
    loadQRs();
    return () => {
      isMounted = false;
    };
  }, [selectedBulan, ketuaRTName, bendaharaRTName]);

  const printLedgerItems = useMemo(() => {
    return [...tableWithRunningBalance].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
  }, [tableWithRunningBalance]);

  const printTotals = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    printLedgerItems.forEach((tx) => {
      if (tx.tipe === 'masuk') masuk += tx.nominal;
      if (tx.tipe === 'keluar') keluar += tx.nominal;
    });
    return {
      totalMasuk: masuk,
      totalKeluar: keluar
    };
  }, [printLedgerItems]);

  const getPrintableKasHtml = (customQrs?: { qrKetua: string; qrBendahara: string }) => {
    const activeQrKetua = customQrs?.qrKetua || qrKetuaUrl;
    const activeQrBendahara = customQrs?.qrBendahara || qrBendaharaUrl;
    const periodeText = formatBulanTahun(selectedBulan);
    const posFilterText = selectedPos === 'semua' 
      ? 'Konsolidasi Pos Kas Kecil & Kas BOP' 
      : selectedPos === 'kas_kecil' 
        ? 'Khusus Pos Kas Kecil RT' 
        : 'Khusus Pos Kas BOP RT';
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const rowsHtml = printLedgerItems.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px 6px;">${idx + 1}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px 6px; white-space: nowrap;">${item.tanggal}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px 6px; font-weight: bold; color: ${item.posKas === 'kas_kecil' ? '#065f46' : '#1e40af'};">
          ${item.posKas === 'kas_kecil' ? 'Kas Kecil' : 'Kas BOP'}
        </td>
        <td style="border: 1px solid #cbd5e1; padding: 5px 6px;">
          <strong>${escapeHtml(item.kategori)}</strong> &ndash; ${escapeHtml(item.keterangan)}
        </td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px 6px; font-family: monospace; font-size: 8pt;">${escapeHtml(item.noBukti || '-')}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 8pt; font-weight: 600;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; border: 1px solid ${
            (item.lpj || '').toLowerCase().includes('proses') ? '#fcd34d; background: #fffbeb; color: #92400e;' :
            (item.lpj || '').toLowerCase().includes('belum') ? '#fda4af; background: #fff1f2; color: #9f1239;' :
            (item.lpj || '').toLowerCase().includes('tidak perlu') || (item.lpj || '') === '-' ? '#cbd5e1; background: #f8fafc; color: #64748b;' :
            '#86efac; background: #f0fdf4; color: #14532d;'
          }; font-size: 7.5pt;">${escapeHtml(item.lpj || '-')}</span>
        </td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px 6px; color: #065f46; font-weight: 600;">
          ${item.tipe === 'masuk' ? formatRupiah(item.nominal) : '-'}
        </td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px 6px; color: #dc2626; font-weight: 600;">
          ${item.tipe === 'keluar' ? formatRupiah(item.nominal) : '-'}
        </td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 5px 6px; font-weight: bold;">
          ${formatRupiah(item.saldoBerjalan)}
        </td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Buku Kas Besar RT 02 RW 14 - Periode ${escapeHtml(periodeText)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 10.5pt;
      line-height: 1.35;
    }
    .no-print-bar {
      background: #064e3b;
      color: #ffffff;
      padding: 12px 18px;
      margin-bottom: 24px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .no-print-btn-group {
      display: flex;
      gap: 10px;
    }
    .no-print-btn {
      background: #ffffff;
      color: #064e3b;
      border: none;
      padding: 8px 16px;
      font-weight: bold;
      font-size: 13px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .no-print-btn-secondary {
      background: rgba(255,255,255,0.2);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.4);
      padding: 8px 14px;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0 !important; }
    }
    /* Kop Surat */
    .kop-wrapper {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 12px;
      border-bottom: 3px double #000000;
      margin-bottom: 14px;
    }
    .kop-logo img {
      width: 72px;
      height: auto;
      object-fit: contain;
    }
    .kop-text {
      flex: 1;
      text-align: center;
    }
    .kop-text .line-1 {
      font-size: 13.5pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0;
    }
    .kop-text .line-2 {
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 2px 0 0 0;
    }
    .kop-text .line-3 {
      font-size: 12.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 2px 0 0 0;
    }
    .kop-text .line-4 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #475569;
      margin-top: 3px;
    }
    /* Document Title */
    .doc-title {
      text-align: center;
      margin: 14px 0 12px 0;
    }
    .doc-title h2 {
      font-size: 12pt;
      font-weight: 800;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .doc-title p {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #475569;
      margin: 3px 0 0 0;
    }
    /* Ringkasan Rekapitulasi */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .summary-card.highlight {
      border: 2px solid #0f172a;
      background: #ecfdf5;
    }
    .summary-title {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      font-size: 8.5pt;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      color: #475569;
      margin-top: 2px;
    }
    .summary-saldo {
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      color: #065f46;
      font-size: 9pt;
    }
    .summary-card.highlight .summary-saldo {
      color: #0f172a;
      font-size: 9.5pt;
      border-top: 1.5px solid #0f172a;
    }
    /* Data Table */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8pt;
      margin-bottom: 16px;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      border: 1px solid #94a3b8;
      padding: 5px 6px;
      font-weight: 700;
      text-align: center;
    }
    table.data-table tr:nth-child(even) {
      background-color: #fafafa;
    }
    /* Signatures: Pojok Kiri (Ketua RT 02) & Pojok Kanan (Bendahara RT 02) */
    .ttd-wrapper {
      margin-top: 26px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    .ttd-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    .ttd-col {
      width: 230px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .ttd-date {
      margin-bottom: 5px;
      font-size: 8.5pt;
      color: #0f172a;
    }
    .ttd-header {
      margin-bottom: 6px;
    }
    .ttd-sub {
      color: #64748b;
      font-size: 8pt;
    }
    .ttd-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8.5pt;
      color: #0f172a;
      letter-spacing: 0.3px;
    }
    .ttd-qr-box {
      width: 90px;
      height: 90px;
      margin: 4px auto 6px auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 3px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .ttd-qr-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .ttd-name {
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      font-size: 8.5pt;
      color: #0f172a;
    }
    .ttd-role {
      font-size: 8pt;
      color: #475569;
      margin-top: 1px;
    }
    .ttd-badge {
      font-size: 6.5pt;
      color: #065f46;
      font-weight: bold;
      margin-top: 2px;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Dokumen Siap Cetak:</strong> Laporan Buku Kas Besar RT 02 RW 14 &bull; ${escapeHtml(periodeText)}
    </div>
    <div class="no-print-btn-group">
      <button class="no-print-btn" onclick="window.print()">🖨️ Cetak Dokumen Sekarang</button>
      <button class="no-print-btn-secondary" onclick="window.close()">Tutup Tab</button>
    </div>
  </div>

  <!-- Kop Surat Kedinasan Kota Semarang -->
  <div class="kop-wrapper">
    <div class="kop-logo">
      <img src="${LOGO_SEMARANG_DATA_URI}" alt="Logo Kota Semarang" />
    </div>
    <div class="kop-text">
      <div class="line-1">PEMERINTAH KOTA SEMARANG</div>
      <div class="line-2">KECAMATAN PEDURUNGAN &bull; KELURAHAN PEDURUNGAN TENGAH</div>
      <div class="line-3">RT 02 RW 14 TANJUNG SARI</div>
    </div>
  </div>

  <!-- Judul Laporan -->
  <div class="doc-title">
    <h2>LAPORAN BUKU KAS BESAR (KONSOLIDASI KAS KECIL & KAS BOP)</h2>
    <p>Periode: ${escapeHtml(periodeText)} &bull; ${escapeHtml(posFilterText)}</p>
  </div>

  <!-- Ringkasan Rekapitulasi Finansial -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-title">1. POS KAS KECIL (IURAN WARGA)</div>
      <div class="summary-row"><span>Total Masuk:</span><span>${formatRupiah(ringkasanPeriode.totalMasukKasKecil)}</span></div>
      <div class="summary-row"><span>Total Keluar:</span><span>${formatRupiah(ringkasanPeriode.totalKeluarKasKecil)}</span></div>
      <div class="summary-saldo"><span>Saldo Akhir Kas Kecil:</span><span>${formatRupiah(ringkasanPeriode.saldoAkhirKasKecil)}</span></div>
    </div>

    <div class="summary-card">
      <div class="summary-title">2. POS KAS BOP (KELURAHAN)</div>
      <div class="summary-row"><span>Total Masuk:</span><span>${formatRupiah(ringkasanPeriode.totalMasukKasBOP)}</span></div>
      <div class="summary-row"><span>Total Keluar:</span><span>${formatRupiah(ringkasanPeriode.totalKeluarKasBOP)}</span></div>
      <div class="summary-saldo"><span>Saldo Akhir Kas BOP:</span><span>${formatRupiah(ringkasanPeriode.saldoAkhirKasBOP)}</span></div>
    </div>

    <div class="summary-card highlight">
      <div class="summary-title">3. TOTAL KAS BESAR RT 02</div>
      <div class="summary-row"><span>Total Masuk:</span><span>${formatRupiah(ringkasanPeriode.totalMasukKasBesar)}</span></div>
      <div class="summary-row"><span>Total Keluar:</span><span>${formatRupiah(ringkasanPeriode.totalKeluarKasBesar)}</span></div>
      <div class="summary-saldo"><span>Total Saldo Akhir:</span><span>${formatRupiah(ringkasanPeriode.saldoAkhirKasBesar)}</span></div>
    </div>
  </div>

  <!-- Tabel Data Rincian Transaksi -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 26px;">No</th>
        <th style="width: 70px;">Tanggal</th>
        <th style="width: 70px;">Pos Kas</th>
        <th>Uraian / Keterangan Transaksi</th>
        <th style="width: 75px;">No. Bukti</th>
        <th style="width: 85px; text-align: center;">LPJ</th>
        <th style="width: 90px; text-align: right;">Pemasukan</th>
        <th style="width: 90px; text-align: right;">Pengeluaran</th>
        <th style="width: 100px; text-align: right;">Saldo Berjalan</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
        <td colspan="6" style="border: 1px solid #94a3b8; padding: 6px; text-align: right;">
          TOTAL TRANSAKSI PERIODE INI:
        </td>
        <td style="border: 1px solid #94a3b8; padding: 6px; text-align: right; color: #065f46;">
          ${formatRupiah(printTotals.totalMasuk)}
        </td>
        <td style="border: 1px solid #94a3b8; padding: 6px; text-align: right; color: #dc2626;">
          ${formatRupiah(printTotals.totalKeluar)}
        </td>
        <td style="border: 1px solid #94a3b8; padding: 6px; text-align: right; font-weight: 800;">
          ${formatRupiah(ringkasanPeriode.saldoAkhirKasBesar)}
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- Tanda Tangan 2 Kolom Kedinasan RT 02 (Pojok Kiri: Ketua RT 02 & Pojok Kanan: Bendahara RT 02) -->
  <div class="ttd-wrapper">
    <div class="ttd-flex">
      <!-- Kolom Pojok Kiri: Mengetahui, KETUA RT 02 -->
      <div class="ttd-col">
        <div style="height: 18px;"></div>
        <div class="ttd-header">
          <div class="ttd-sub">Mengetahui,</div>
          <div class="ttd-title">KETUA RT 02</div>
        </div>
        <div class="ttd-qr-box">
          ${activeQrKetua ? `<img src="${activeQrKetua}" alt="QR Code Ali Muhtarom, S.T" />` : '<div style="font-size: 7.5pt; color: #94a3b8;">QR Code</div>'}
        </div>
        <div>
          <div class="ttd-name">${escapeHtml(ketuaRTName || 'ALI MUHTAROM, S.T')}</div>
          <div class="ttd-role">Ketua RT 02 RW 14</div>
          <div class="ttd-badge">&#x2713; Tanda Tangan Digital BerkahOne</div>
        </div>
      </div>

      <!-- Kolom Pojok Kanan: Dibuat Oleh, BENDAHARA RT 02 -->
      <div class="ttd-col">
        <div class="ttd-date">
          Semarang, ${currentDate}
        </div>
        <div class="ttd-header">
          <div class="ttd-sub">Dibuat Oleh,</div>
          <div class="ttd-title">BENDAHARA RT 02</div>
        </div>
        <div class="ttd-qr-box">
          ${activeQrBendahara ? `<img src="${activeQrBendahara}" alt="QR Code Misbahudin" />` : '<div style="font-size: 7.5pt; color: #94a3b8;">QR Code</div>'}
        </div>
        <div>
          <div class="ttd-name">${escapeHtml(bendaharaRTName || 'MISBAHUDIN')}</div>
          <div class="ttd-role">Bendahara RT 02 RW 14</div>
          <div class="ttd-badge">&#x2713; Tanda Tangan Digital BerkahOne</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {}
      }, 400);
    };
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    setPrintNotice(null);
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print failed:', e);
    }

    if (inIframe) {
      setPrintNotice('Sistem mendeteksi tampilan di dalam iFrame. Jika kotak dialog printer browser Anda tidak terbuka otomatis, silakan gunakan tombol "Buka Tab Cetak" atau "Unduh Dokumen".');
    }
  };

  const handleOpenPrintTab = async () => {
    try {
      const qrs = await ensureQRCodes();
      const html = getPrintableKasHtml(qrs);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');

      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        handleDownloadHtmlPrint();
        setPrintNotice('Pembukaan tab baru dicegah peramban (popup blocker). File dokumen cetak (.html) telah diunduh otomatis.');
      } else {
        setPrintNotice('Dokumen resmi telah dibuka pada tab baru lengkap dengan QRCode BerkahOne dan siap dicetak.');
        setTimeout(() => setPrintNotice(null), 5000);
      }
    } catch (err) {
      console.error('Gagal membuka tab cetak:', err);
      handleDownloadHtmlPrint();
    }
  };

  const handleDownloadHtmlPrint = async () => {
    try {
      const qrs = await ensureQRCodes();
      const html = getPrintableKasHtml(qrs);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeBulan = selectedBulan === 'semua' ? 'Semua_2026' : selectedBulan.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Laporan_Buku_Kas_Besar_RT02_${safeBulan}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToastMessage({
        type: 'success',
        text: 'File dokumen cetak resmi (.html) berhasil diunduh lengkap dengan QRCode BerkahOne.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Gagal mengunduh file cetak:', err);
    }
  };

  const handleExportPDF = async (action: 'download' | 'open' | 'both' = 'both') => {
    try {
      setIsGeneratingPdf(true);
      await ensureQRCodes();

      // Ensure modal is open so the printable A4 document is mounted and styled
      if (!isPrintModalOpen) {
        setIsPrintModalOpen(true);
      }

      // Wait until printContentRef.current is ready and styled in the DOM
      let attempts = 0;
      while (!printContentRef.current && attempts < 20) {
        await new Promise((res) => setTimeout(res, 80));
        attempts++;
      }

      if (!printContentRef.current) {
        throw new Error('Area dokumen cetak belum siap dimuat.');
      }

      // Small delay to ensure images/SVG/QR codes are painted
      await new Promise((res) => setTimeout(res, 200));

      const safeBulan = selectedBulan === 'semua' ? 'Semua_2026' : selectedBulan.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Laporan_Buku_Kas_Besar_RT02_${safeBulan}.pdf`;

      const result = await exportElementToPDF({
        element: printContentRef.current,
        filename,
        action
      });

      if (result.blobUrl) {
        setGeneratedPdfInfo({
          url: result.blobUrl,
          filename: result.filename
        });
      }

      setToastMessage({
        type: 'success',
        text: 'Berkas PDF Rekapitulasi Kas RT 02 siap diunduh.'
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Gagal membuat dokumen PDF:', err);
      setToastMessage({
        type: 'info',
        text: 'Pembuatan PDF langsung menemui kendala di browser. Silakan gunakan tombol "Buka Tab Cetak" lalu pilih printer "Simpan sebagai PDF (Save as PDF)".'
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderLpjBadge = (lpj?: string) => {
    if (!lpj || lpj.trim() === '' || lpj === '-') {
      return <span className="text-slate-300 font-mono text-[11px]">-</span>;
    }
    const lower = lpj.toLowerCase();
    if (lower.includes('proses')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>{lpj}</span>
        </span>
      );
    }
    if (lower.includes('belum')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>{lpj}</span>
        </span>
      );
    }
    if (lower === 'tidak perlu') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200">
          Tidak Perlu
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>{lpj}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-menu Switcher: Buku Kas Besar vs Menu Iuran Warga */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveKasSubTab('buku_kas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeKasSubTab === 'buku_kas'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Buku Kas Besar (Gabungan)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeKasSubTab === 'buku_kas'
                  ? 'bg-emerald-900/80 text-emerald-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {kasList.length} Transaksi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveKasSubTab('iuran_warga')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeKasSubTab === 'iuran_warga'
                ? 'bg-orange-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Menu Iuran Warga RT</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeKasSubTab === 'iuran_warga'
                  ? 'bg-orange-800 text-orange-100'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              36 KK &bull; Kartu Iuran
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveKasSubTab('undangan_jumpa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeKasSubTab === 'undangan_jumpa'
                ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>Undangan Jumpa Bulan</span>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 ${
                activeKasSubTab === 'undangan_jumpa'
                  ? 'bg-purple-900/90 text-purple-100'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              AI Features
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-2">
          {activeKasSubTab === 'buku_kas' ? (
            <span>
              Saldo Kas RT ({formatBulanTahun(selectedBulan)}):{' '}
              <strong className="text-emerald-800 font-bold">
                {formatRupiah(ringkasanPeriode.saldoAkhirKasBesar)}
              </strong>
            </span>
          ) : activeKasSubTab === 'iuran_warga' ? (
            <span>
              Penerimaan Iuran 2026:{' '}
              <strong className="text-orange-900 font-bold">
                {formatRupiah(iuranList.reduce((acc, curr) => acc + curr.nominal, 0))}
              </strong>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-purple-900 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Didukung Model Cerdas Gemini Flash</span>
            </span>
          )}
        </div>
      </div>

      {activeKasSubTab === 'iuran_warga' ? (
        <IuranWargaView />
      ) : activeKasSubTab === 'undangan_jumpa' ? (
        <UndanganJumpaBulanView />
      ) : (
        <>
          {/* Main Interactive Screen Content (Hidden when printing via modal) */}
          <div className={`space-y-6 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
            {/* Top Banner & Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Buku Kas Besar RT 02 RW 14
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Kas Gabungan
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Rekapitulasi Konsolidasi Terpadu antara <span className="font-semibold text-emerald-700">Kas Kecil (Iuran & Operasional Warga)</span> dan <span className="font-semibold text-blue-700">Kas BOP (Bantuan Operasional Pemerintah)</span> Kelurahan Pedurungan Tengah.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {hasPermission('manage_kas') && (
            <button
              onClick={() => {
                setFormPosKas('kas_kecil');
                setFormTipe('masuk');
                setFormKategori('Iuran Warga Bulanan');
                setIsAddModalOpen(true);
              }}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi Kas</span>
            </button>
          )}

          {hasPermission('manage_kas') && kasList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Hapus / bersihkan seluruh data transaksi kas besar gabungan"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Semua Transaksi</span>
            </button>
          )}

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Buka dialog pratinjau cetak dokumen rekap kas besar"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Pratinjau</span>
          </button>

          <button
            onClick={() => setIsQrBendaharaModalOpen(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
            title="Tampilkan QRIS & Verifikasi Digital Bendahara RT"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>QR Code Bendahara</span>
          </button>

          <button
            onClick={() => handleExportPDF('both')}
            disabled={isGeneratingPdf}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Cetak dan Unduh Dokumen PDF Rekapitulasi Kas RT 02"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            ) : (
              <FileText className="w-4 h-4 text-rose-600" />
            )}
            <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh Rekap PDF'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Download file CSV / Excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Core Summary Cards (Kas Kecil, Kas BOP, and Total Kas Besar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 2xl:gap-5 4k:gap-6">
        {/* Card 1: Kas Kecil */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">1. Kas Kecil RT</h3>
                <span className="text-[10px] text-slate-400">Iuran Warga & Operasional</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
              Periode {formatBulanTahun(selectedBulan)}
            </span>
          </div>

          <div className="my-2">
            <div className="text-[11px] text-slate-500 font-medium">Sisa Saldo Kas Kecil Periode:</div>
            <div className="text-xl font-extrabold text-emerald-800 tracking-tight">
              {formatRupiah(ringkasanPeriode.saldoAkhirKasKecil)}
            </div>
            {selectedBulan === '2026-02' && (
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                Saldo Awal Feb 2026: Rp 2.099.000
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-1 text-emerald-700 font-medium text-[10px]">
                <ArrowDownLeft className="w-3 h-3" />
                <span>Pemasukan</span>
              </div>
              <div className="font-bold text-emerald-900 mt-0.5">
                {formatRupiah(ringkasanPeriode.totalMasukKasKecil)}
              </div>
            </div>
            <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
              <div className="flex items-center gap-1 text-rose-700 font-medium text-[10px]">
                <ArrowUpRight className="w-3 h-3" />
                <span>Pengeluaran</span>
              </div>
              <div className="font-bold text-rose-900 mt-0.5">
                {formatRupiah(ringkasanPeriode.totalKeluarKasKecil)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Kas BOP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">2. Kas BOP RT</h3>
                <span className="text-[10px] text-slate-400">Bantuan Operasional Pemerintah</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
              Periode {formatBulanTahun(selectedBulan)}
            </span>
          </div>

          <div className="my-2">
            <div className="text-[11px] text-slate-500 font-medium">Sisa Saldo Kas BOP Periode:</div>
            <div className="text-xl font-extrabold text-blue-800 tracking-tight">
              {formatRupiah(ringkasanPeriode.saldoAkhirKasBOP)}
            </div>
            {selectedBulan === '2026-02' && (
              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                Saldo Awal Feb 2026: Rp 0
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
              <div className="flex items-center gap-1 text-blue-700 font-medium text-[10px]">
                <ArrowDownLeft className="w-3 h-3" />
                <span>Pemasukan</span>
              </div>
              <div className="font-bold text-blue-900 mt-0.5">
                {formatRupiah(ringkasanPeriode.totalMasukKasBOP)}
              </div>
            </div>
            <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
              <div className="flex items-center gap-1 text-rose-700 font-medium text-[10px]">
                <ArrowUpRight className="w-3 h-3" />
                <span>Pengeluaran</span>
              </div>
              <div className="font-bold text-rose-900 mt-0.5">
                {formatRupiah(ringkasanPeriode.totalKeluarKasBOP)}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Kas Besar (Gabungan) */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">3. Total Kas Besar</h3>
                <span className="text-[10px] text-emerald-200">Konsolidasi (Kas Kecil + BOP)</span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-xs">
              Periode {formatBulanTahun(selectedBulan)}
            </span>
          </div>

          <div className="my-2">
            <div className="text-[11px] text-emerald-200 font-medium">Total Kas Bersih Periode:</div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatRupiah(ringkasanPeriode.saldoAkhirKasBesar)}
            </div>
            {selectedBulan === '2026-02' ? (
              <div className="text-[10.5px] text-emerald-300 font-medium mt-0.5 flex flex-wrap items-center gap-1">
                <span>Saldo Awal Feb 2026:</span>
                <strong className="text-white font-bold">{formatRupiah(2099000)}</strong>
                <span className="text-[10px] text-emerald-200 bg-white/10 px-1.5 py-0.2 rounded ml-1">
                  Saldo Sebelum Periode: Rp 0
                </span>
              </div>
            ) : (
              <div className="text-[10.5px] text-emerald-300 font-medium mt-0.5 flex items-center gap-1">
                <span>Saldo Awal Periode:</span>
                <strong className="text-white font-bold">{formatRupiah(ringkasanPeriode.saldoAwalKasBesar)}</strong>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-emerald-800/80 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] text-emerald-300">Total Semua Masuk:</span>
              <div className="font-bold text-emerald-100">
                {formatRupiah(ringkasanPeriode.totalMasukKasBesar)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-300">Total Semua Keluar:</span>
              <div className="font-bold text-emerald-100">
                {formatRupiah(ringkasanPeriode.totalKeluarKasBesar)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Pos Kas Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setSelectedPos('semua')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPos === 'semua'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua (Kas Besar)
              </button>
              <button
                onClick={() => setSelectedPos('kas_kecil')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedPos === 'kas_kecil'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Kas Kecil</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </button>
              <button
                onClick={() => setSelectedPos('kas_bop')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedPos === 'kas_bop'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Kas BOP</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </button>
            </div>

            {/* Quick Status / Counter */}
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Periode Aktif:</span>
              <span className="font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                {formatBulanTahun(selectedBulan)}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {tableWithRunningBalance.length} Transaksi
              </span>
            </div>
          </div>

          {/* Secondary Filters (Search, Tipe, LPJ, Periode) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
            {/* Search */}
            <div className="sm:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari uraian, no. bukti, LPJ..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Tipe */}
            <div className="sm:col-span-3 flex items-center gap-1">
              <button
                onClick={() => setFilterTipe('semua')}
                className={`flex-1 py-1.5 px-1.5 text-[11px] font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  filterTipe === 'semua'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterTipe('masuk')}
                className={`flex-1 py-1.5 px-1.5 text-[11px] font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  filterTipe === 'masuk'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Masuk (+)
              </button>
              <button
                onClick={() => setFilterTipe('keluar')}
                className={`flex-1 py-1.5 px-1.5 text-[11px] font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  filterTipe === 'keluar'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-rose-50/50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                Keluar (-)
              </button>
            </div>

            {/* Filter Status LPJ */}
            <div className="sm:col-span-2">
              <select
                value={filterLpj}
                onChange={(e) => setFilterLpj(e.target.value as any)}
                className="w-full py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
                title="Filter berdasarkan status / dokumen LPJ"
              >
                <option value="semua">Semua Status LPJ</option>
                <option value="lengkap">Sudah Lengkap / Terlampir</option>
                <option value="proses">Sedang Proses LPJ</option>
                <option value="belum">Belum Ada LPJ</option>
                <option value="tidak_perlu">Tidak Perlu LPJ</option>
              </select>
            </div>

            {/* Filter Periode (Data tampil HANYA sesuai periode yang dipilih) */}
            <div className="sm:col-span-3">
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                title="Pilih periode pembukuan kas (berlaku mulai Februari 2026)"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Periode {formatBulanTahun(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Saldo Awal Banner */}
        {selectedBulan === '2026-02' ? (
          <div className="px-4 py-2 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-emerald-800">Saldo Awal Bulan Februari 2026:</span>
              <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {formatRupiah(selectedPos === 'kas_bop' ? 0 : 2099000)}
              </span>
              <span className="text-[11px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                Saldo Sebelum Periode: <strong>Rp 0</strong>
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-medium">
              Pos: {selectedPos === 'kas_kecil' ? 'Kas Kecil RT (Saldo Awal: Rp 2.099.000)' : selectedPos === 'kas_bop' ? 'Kas BOP RT (Saldo Awal: Rp 0)' : 'Kas Besar Gabungan (Saldo Awal: Rp 2.099.000)'}
            </span>
          </div>
        ) : (
          <div className="px-4 py-2 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-800">Saldo Awal Periode {formatBulanTahun(selectedBulan)} (Pindahan Bulan Lalu):</span>
              <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                {formatRupiah(selectedPos === 'kas_kecil' ? saldoAwalBulanIni.kasKecil : selectedPos === 'kas_bop' ? saldoAwalBulanIni.kasBop : saldoAwalBulanIni.totalKasBesar)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-medium">
              Pos: {selectedPos === 'kas_kecil' ? 'Kas Kecil RT' : selectedPos === 'kas_bop' ? 'Kas BOP' : 'Kas Besar Gabungan'}
            </span>
          </div>
        )}

        {/* Ledger Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3">Pos Kas</th>
                <th className="py-3 px-3.5">Kategori & Keterangan</th>
                <th className="py-3 px-3 text-center">No. Bukti</th>
                <th className="py-3 px-3 text-center">LPJ</th>
                <th className="py-3 px-3 text-right text-emerald-800">Pemasukan</th>
                <th className="py-3 px-3 text-right text-rose-800">Pengeluaran</th>
                <th className="py-3 px-3 text-right text-slate-800">Saldo Berjalan</th>
                {hasPermission('manage_kas') && (
                  <th className="py-3 px-3 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {tableWithRunningBalance.length === 0 ? (
                <tr>
                  <td colSpan={hasPermission('manage_kas') ? 9 : 8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada transaksi yang sesuai kriteria filter.</p>
                    <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter pos kas.</p>
                  </td>
                </tr>
              ) : (
                tableWithRunningBalance.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Tanggal */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Pos Kas Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.posKas === 'kas_kecil' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Kas Kecil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Kas BOP
                        </span>
                      )}
                    </td>

                    {/* Kategori & Keterangan */}
                    <td className="py-3 px-3.5 max-w-xs md:max-w-md">
                      <div className="font-semibold text-slate-900 text-xs">
                        {item.kategori}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug mt-0.5">
                        {item.keterangan}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Oleh: {item.penanggungJawab}
                      </div>
                    </td>

                    {/* No Bukti */}
                    <td className="py-3 px-3 whitespace-nowrap text-center text-[11px] font-mono text-slate-500">
                      {item.noBukti ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.noBukti}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Kolom LPJ */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1">
                        {renderLpjBadge(item.lpj)}
                        {hasPermission('manage_kas') && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLpjItem(item);
                              setEditingLpjValue(item.lpj || '');
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Perbarui catatan / status LPJ"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Pemasukan */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-bold text-emerald-800">
                      {item.tipe === 'masuk' ? formatRupiah(item.nominal) : '-'}
                    </td>

                    {/* Pengeluaran */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-bold text-rose-800">
                      {item.tipe === 'keluar' ? formatRupiah(item.nominal) : '-'}
                    </td>

                    {/* Saldo Berjalan */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-black text-slate-900">
                      {formatRupiah(item.saldoBerjalan)}
                    </td>

                    {/* Action */}
                    {hasPermission('manage_kas') && (
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenKoreksi(item)}
                            className="px-2 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Koreksi transaksi ini"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                            <span>Koreksi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTransaksiToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* MODAL: Tambah Transaksi Kas */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Catat Transaksi Kas RT</h3>
                  <p className="text-[11px] text-slate-500">Pilih pos kas (Kas Kecil atau Kas BOP)</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaksi} className="space-y-4">
              {/* 1. Pemilihan Pos Kas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Pilih Pos Kas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePosChange('kas_kecil')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formPosKas === 'kas_kecil'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">🪙 Kas Kecil RT</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Iuran warga, operasional, & kegiatan rutin
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePosChange('kas_bop')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formPosKas === 'kas_bop'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">📑 Kas BOP RT</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Bantuan operasional dari Kelurahan
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Tipe: Pemasukan / Pengeluaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Jenis Aliran Kas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTipeChange('masuk')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      formTipe === 'masuk'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Pemasukan (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTipeChange('keluar')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      formTipe === 'keluar'
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Pengeluaran (-)</span>
                  </button>
                </div>
              </div>

              {/* 3. Nominal & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400 text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formNominal}
                      onChange={(e) => setFormNominal(e.target.value)}
                      placeholder="Contoh: 500000"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 4. Kategori & No. Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Transaksi
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  >
                    {(formPosKas === 'kas_kecil' ? kategoriKasKecil : kategoriKasBOP).map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Bukti / Kuitansi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNoBukti}
                    onChange={(e) => setFormNoBukti(e.target.value)}
                    placeholder="Misal: KWT/02/2026/01"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Status / Keterangan Dokumen LPJ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Kolom LPJ (Status / Berkas Pertanggungjawaban)
                  </label>
                  <span className="text-[10px] text-slate-400">Laporan Pertanggungjawaban</span>
                </div>
                <input
                  type="text"
                  value={formLpj}
                  onChange={(e) => setFormLpj(e.target.value)}
                  placeholder="Contoh: Kwitansi Terlampir, LPJ BOP, Proses LPJ..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
                />
                <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                  <span className="text-[10px] text-slate-400 mr-0.5">Pilihan Cepat:</span>
                  {[
                    formPosKas === 'kas_bop' ? 'LPJ BOP' : 'Kwitansi Terlampir',
                    'Nota & Foto',
                    'SP2D Kelurahan',
                    'Proses LPJ',
                    'Belum LPJ',
                    'Tidak Perlu'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormLpj(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        formLpj === preset 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Uraian Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian Lengkap Transaksi *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Jelaskan rincian pemasukan atau penggunaan dana kas..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* 6. Penanggung Jawab */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penanggung Jawab / Pencatat
                </label>
                <input
                  type="text"
                  value={formPenanggungJawab}
                  onChange={(e) => setFormPenanggungJawab(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Transaksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Koreksi Transaksi Kas */}
      {editingTransaksi && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Pencil className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Koreksi Transaksi Kas</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      ID: {editingTransaksi.id}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Perbaiki data pembukuan kas, tanggal, nominal, atau rincian transaksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTransaksi(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kotak Rujukan Data Asli Sebelum Koreksi */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Data Tercatat Sebelum Dikoreksi:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500">Tanggal: </span>
                  <strong>{editingTransaksi.tanggal}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Pos Kas: </span>
                  <strong>{editingTransaksi.posKas === 'kas_kecil' ? 'Kas Kecil RT' : 'Kas BOP RT'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Jenis: </span>
                  <span className={editingTransaksi.tipe === 'masuk' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {editingTransaksi.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Nominal: </span>
                  <strong className="text-slate-900 font-bold">{formatRupiah(editingTransaksi.nominal)}</strong>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60 line-clamp-1">
                <span className="text-slate-500">Uraian: </span>
                {editingTransaksi.kategori} &ndash; {editingTransaksi.keterangan}
              </div>
            </div>

            {koreksiError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{koreksiError}</span>
              </div>
            )}

            <form onSubmit={handleSaveKoreksi} className="space-y-4">
              {/* Pos Kas Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pos Kas Pembukuan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleKoreksiPosChange('kas_kecil')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      koreksiPosKas === 'kas_kecil'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🪙 Kas Kecil RT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKoreksiPosChange('kas_bop')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      koreksiPosKas === 'kas_bop'
                        ? 'bg-blue-50 text-blue-900 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏛️ Kas BOP RT</span>
                  </button>
                </div>
              </div>

              {/* Tipe Transaksi: Masuk vs Keluar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jenis Arus Kas <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setKoreksiTipe('masuk');
                      if (koreksiLpj === 'Kwitansi Terlampir' || koreksiLpj === 'LPJ BOP') {
                        setKoreksiLpj('Tidak Perlu');
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      koreksiTipe === 'masuk'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Pemasukan (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKoreksiTipe('keluar');
                      if (koreksiLpj === 'Tidak Perlu') {
                        setKoreksiLpj(koreksiPosKas === 'kas_bop' ? 'LPJ BOP' : 'Kwitansi Terlampir');
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      koreksiTipe === 'keluar'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-xs ring-2 ring-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Pengeluaran (-)</span>
                  </button>
                </div>
              </div>

              {/* Tanggal & No Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min="2026-02-01"
                    value={koreksiTanggal}
                    onChange={(e) => setKoreksiTanggal(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Berlaku mulai Feb 2026</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Bukti Transaksi
                  </label>
                  <input
                    type="text"
                    value={koreksiNoBukti}
                    onChange={(e) => setKoreksiNoBukti(e.target.value)}
                    placeholder="Contoh: KWT/2026/02/001"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Kategori Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Transaksi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={koreksiKategori}
                  onChange={(e) => setKoreksiKategori(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {(koreksiPosKas === 'kas_kecil' ? kategoriKasKecil : kategoriKasBOP).map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={koreksiNominal}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      if (!raw) {
                        setKoreksiNominal('');
                        return;
                      }
                      const num = parseInt(raw, 10);
                      setKoreksiNominal(num.toLocaleString('id-ID'));
                    }}
                    placeholder="0"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
                {koreksiNominal && (
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">
                    Terbaca: {formatRupiah(parseInt(koreksiNominal.replace(/\D/g, '') || '0', 10))}
                  </div>
                )}
              </div>

              {/* Uraian / Keterangan Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uraian / Keterangan Transaksi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={koreksiKeterangan}
                  onChange={(e) => setKoreksiKeterangan(e.target.value)}
                  placeholder="Jelaskan keperluan dan detail transaksi secara lengkap..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
                />
              </div>

              {/* Kolom LPJ & Penanggung Jawab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status / Kelengkapan LPJ
                  </label>
                  <select
                    value={koreksiLpj}
                    onChange={(e) => setKoreksiLpj(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Tidak Perlu">Tidak Perlu (Rutin/Penerimaan)</option>
                    <option value="Kwitansi Terlampir">Kwitansi Terlampir</option>
                    <option value="Nota Konsumsi">Nota Konsumsi</option>
                    <option value="Nota Belanja">Nota Belanja</option>
                    <option value="Tanda Terima">Tanda Terima</option>
                    <option value="LPJ BOP">LPJ BOP</option>
                    <option value="Proses LPJ">Proses LPJ</option>
                    <option value="Lengkap">Lengkap</option>
                    <option value="Belum Ada LPJ">Belum Ada LPJ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={koreksiPenanggungJawab}
                    onChange={(e) => setKoreksiPenanggungJawab(e.target.value)}
                    placeholder="Nama pengurus / PIC"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Alasan Koreksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Alasan Koreksi <span className="text-slate-400 font-normal">(Untuk arsip audit)</span>
                </label>
                <input
                  type="text"
                  value={koreksiCatatan}
                  onChange={(e) => setKoreksiCatatan(e.target.value)}
                  placeholder="Contoh: Koreksi nominal salah input, penyesuaian bukti nota, dll."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTransaksi(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan Koreksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Status LPJ Cepat */}
      {editingLpjItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Perbarui Status Kolom LPJ
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Laporan Pertanggungjawaban Transaksi Kas RT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLpjItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Transaksi Singkat */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-semibold text-slate-800">{editingLpjItem.tanggal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pos Kas:</span>
                <span className="font-bold text-emerald-800">
                  {editingLpjItem.posKas === 'kas_kecil' ? 'Kas Kecil' : 'Kas BOP'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold text-slate-900">{formatRupiah(editingLpjItem.nominal)}</span>
              </div>
              <div className="pt-1 text-slate-600 border-t border-slate-200 line-clamp-2">
                {editingLpjItem.kategori} &ndash; {editingLpjItem.keterangan}
              </div>
            </div>

            <form onSubmit={handleSaveLpjEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Nomor Berkas LPJ
                </label>
                <input
                  type="text"
                  value={editingLpjValue}
                  onChange={(e) => setEditingLpjValue(e.target.value)}
                  placeholder="Contoh: Kwitansi Terlampir, LPJ BOP, Proses LPJ..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Pilihan Status / Berkas Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Kwitansi Terlampir',
                    'LPJ BOP',
                    'Nota & Foto',
                    'SP2D Kelurahan',
                    'Proses LPJ',
                    'Belum LPJ',
                    'Tidak Perlu'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingLpjValue(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        editingLpjValue === preset
                          ? 'bg-emerald-700 text-white border-emerald-700 font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLpjItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan LPJ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Dokumen Resmi Buku Kas Besar */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:bg-transparent print:p-0 print:m-0 print:block print:overflow-visible">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none">
            {/* Modal Controls (Not printed) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-5 gap-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pratinjau Cetak: Laporan Kas Besar RT 02 RW 14
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Blanko standar A4 kedinasan Pemerintah Kota Semarang
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Cetak langsung menggunakan dialog printer browser"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPDF('both')}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Unduh dokumen rekap kas dalam bentuk file PDF resmi A4"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh PDF (A4)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenPrintTab}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  title="Buka dokumen di tab baru untuk pencetakan bebas hambatan iFrame"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Buka Tab Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtmlPrint}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  title="Unduh berkas cetak resmi (.html)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Unduh Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintModalOpen(false);
                    setPrintNotice(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Generating State Banner */}
            {isGeneratingPdf && (
              <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900 animate-pulse print:hidden">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div>
                  <span className="font-bold">Sedang memproses & menyusun Berkas PDF A4...</span>
                  <p className="text-[11px] text-blue-700">Mengonversi tabel rekapitulasi, kop surat Pemkot Semarang, dan QRCode BerkahOne.</p>
                </div>
              </div>
            )}

            {/* PDF Ready Download Card */}
            {generatedPdfInfo && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:hidden animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 text-emerald-950 font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Berkas PDF Resmi Siap Diunduh!</p>
                    <p className="text-[11px] text-emerald-800 font-normal">{generatedPdfInfo.filename}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <a
                    href={generatedPdfInfo.url}
                    download={generatedPdfInfo.filename}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File PDF (.pdf)</span>
                  </a>
                  <a
                    href={generatedPdfInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka PDF</span>
                  </a>
                </div>
              </div>
            )}

            {/* Print Notice (If running in iframe or blocked) */}
            {printNotice && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2 print:hidden animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{printNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintNotice(null)}
                  className="text-amber-500 hover:text-amber-800 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Printable Document Area */}
            <div ref={printContentRef} className="text-slate-900 font-serif leading-relaxed bg-white p-2">
              {/* Kop Surat Kedinasan */}
              <div className="flex items-center gap-4 pb-3 border-b-4 border-double border-slate-900">
                <LogoSemarang size={75} className="shrink-0" />
                <div className="flex-1 text-center font-serif text-slate-900 leading-snug">
                  <div className="text-lg font-black tracking-wider uppercase">
                    PEMERINTAH KOTA SEMARANG
                  </div>
                  <div className="text-sm font-bold tracking-wide uppercase">
                    KECAMATAN PEDURUNGAN &bull; KELURAHAN PEDURUNGAN TENGAH
                  </div>
                  <div className="text-base font-extrabold tracking-wide uppercase mt-0.5">
                    RT 02 RW 14 TANJUNG SARI
                  </div>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center my-5">
                <h2 className="text-base font-bold uppercase underline tracking-wide">
                  LAPORAN BUKU KAS BESAR (KONSOLIDASI KAS KECIL & KAS BOP)
                </h2>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  Periode: {formatBulanTahun(selectedBulan)}
                </p>
              </div>

              {/* Ringkasan Rekapitulasi Cetak */}
              <div className="grid grid-cols-3 gap-3 font-sans text-xs mb-5">
                <div className="border border-slate-300 p-2.5 rounded bg-slate-50">
                  <div className="font-bold text-slate-800">1. POS KAS KECIL (IURAN WARGA)</div>
                  <div className="text-[11px] text-slate-600 mt-1">Masuk: {formatRupiah(ringkasanPeriode.totalMasukKasKecil)}</div>
                  <div className="text-[11px] text-slate-600">Keluar: {formatRupiah(ringkasanPeriode.totalKeluarKasKecil)}</div>
                  <div className="font-bold text-emerald-800 mt-1 pt-1 border-t border-slate-200">
                    Saldo Akhir: {formatRupiah(ringkasanPeriode.saldoAkhirKasKecil)}
                  </div>
                </div>

                <div className="border border-slate-300 p-2.5 rounded bg-slate-50">
                  <div className="font-bold text-slate-800">2. POS KAS BOP (KELURAHAN)</div>
                  <div className="text-[11px] text-slate-600 mt-1">Masuk: {formatRupiah(ringkasanPeriode.totalMasukKasBOP)}</div>
                  <div className="text-[11px] text-slate-600">Keluar: {formatRupiah(ringkasanPeriode.totalKeluarKasBOP)}</div>
                  <div className="font-bold text-blue-800 mt-1 pt-1 border-t border-slate-200">
                    Saldo Akhir: {formatRupiah(ringkasanPeriode.saldoAkhirKasBOP)}
                  </div>
                </div>

                <div className="border-2 border-slate-800 p-2.5 rounded bg-emerald-50">
                  <div className="font-bold text-slate-900">3. TOTAL KAS BESAR RT 02</div>
                  <div className="text-[11px] text-slate-600 mt-1">Total Masuk: {formatRupiah(ringkasanPeriode.totalMasukKasBesar)}</div>
                  <div className="text-[11px] text-slate-600">Total Keluar: {formatRupiah(ringkasanPeriode.totalKeluarKasBesar)}</div>
                  <div className="font-black text-slate-900 mt-1 pt-1 border-t border-slate-300 text-sm">
                    Total Saldo Akhir: {formatRupiah(ringkasanPeriode.saldoAkhirKasBesar)}
                  </div>
                </div>
              </div>

              {/* Table Print */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-xs font-sans border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-400">
                      <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-300 p-1.5 text-center">Tanggal</th>
                      <th className="border border-slate-300 p-1.5 text-center">Pos Kas</th>
                      <th className="border border-slate-300 p-1.5 text-left">Uraian / Keterangan</th>
                      <th className="border border-slate-300 p-1.5 text-center">No. Bukti</th>
                      <th className="border border-slate-300 p-1.5 text-center">LPJ</th>
                      <th className="border border-slate-300 p-1.5 text-right">Pemasukan</th>
                      <th className="border border-slate-300 p-1.5 text-right">Pengeluaran</th>
                      <th className="border border-slate-300 p-1.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printLedgerItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 whitespace-nowrap">{item.tanggal}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">
                          {item.posKas === 'kas_kecil' ? 'Kas Kecil' : 'Kas BOP'}
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <span className="font-bold">{item.kategori}</span> - {item.keterangan}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px]">
                          {item.noBukti || '-'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center text-[10px] whitespace-nowrap">
                          {item.lpj ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded border font-semibold ${
                              item.lpj.toLowerCase().includes('proses')
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : item.lpj.toLowerCase().includes('belum')
                                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                                  : item.lpj.toLowerCase().includes('tidak perlu') || item.lpj === '-'
                                    ? 'bg-slate-50 text-slate-500 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            }`}>
                              {item.lpj}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-medium text-emerald-800">
                          {item.tipe === 'masuk' ? formatRupiah(item.nominal) : '-'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-medium text-rose-800">
                          {item.tipe === 'keluar' ? formatRupiah(item.nominal) : '-'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">
                          {formatRupiah(item.saldoBerjalan)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-700">
                      <td colSpan={6} className="border border-slate-300 p-2 text-right">
                        TOTAL PERIODE INI:
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-800 font-bold">
                        {formatRupiah(printTotals.totalMasuk)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-rose-800 font-bold">
                        {formatRupiah(printTotals.totalKeluar)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-black">
                        {formatRupiah(ringkasanKas.totalSaldoKasBesar)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tanda Tangan 2 Kolom Kedinasan RT 02 (Pojok Kiri: Ketua RT 02 & Pojok Kanan: Bendahara RT 02) */}
              <div className="font-sans text-xs mt-8 pt-4">
                <div className="flex justify-between items-start w-full">
                  {/* Kolom Pojok Kiri: Mengetahui, KETUA RT 02 */}
                  <div className="flex flex-col items-center text-center w-52 sm:w-60">
                    <div className="h-4 sm:h-5"></div>
                    <div>
                      <div className="text-slate-500 text-[11px]">Mengetahui,</div>
                      <div className="font-bold uppercase text-slate-900 tracking-wide">KETUA RT 02</div>
                    </div>
                    <div className="my-2.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-center">
                      {qrKetuaUrl ? (
                        <img
                          src={qrKetuaUrl}
                          alt="QR Code Verifikasi Ali Muhtarom, S.T"
                          className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-22 sm:h-22 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold underline uppercase text-slate-900">{ketuaRTName || 'ALI MUHTAROM, S.T'}</div>
                      <div className="text-[10px] text-slate-500">Ketua RT 02 RW 14</div>
                      <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">✓ Tanda Tangan Digital BerkahOne</div>
                    </div>
                  </div>

                  {/* Kolom Pojok Kanan: Dibuat Oleh, BENDAHARA RT 02 */}
                  <div className="flex flex-col items-center text-center w-52 sm:w-60">
                    <div className="text-[11px] text-slate-600 mb-1">
                      Semarang, {new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div>
                      <div className="text-slate-500 text-[11px]">Dibuat Oleh,</div>
                      <div className="font-bold uppercase text-slate-900 tracking-wide">BENDAHARA RT 02</div>
                    </div>
                    <div className="my-2.5 p-1 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-center">
                      {qrBendaharaUrl ? (
                        <img
                          src={qrBendaharaUrl}
                          alt="QR Code Verifikasi Misbahudin"
                          className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-22 sm:h-22 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold underline uppercase text-slate-900">{bendaharaRTName || 'MISBAHUDIN'}</div>
                      <div className="text-[10px] text-slate-500">Bendahara RT 02 RW 14</div>
                      <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">✓ Tanda Tangan Digital BerkahOne</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Transaksi Kas */}
      {transaksiToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Transaksi Kas?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pencatatan transaksi ini akan dihapus permanen dan saldo Buku Kas akan disesuaikan otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransaksiToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rincian Transaksi Yang Dihapus */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pos Kas:</span>
                {transaksiToDelete.posKas === 'kas_kecil' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Kas Kecil RT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Kas BOP RT
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Jenis & Nominal:</span>
                <span className={`font-bold text-xs ${transaksiToDelete.tipe === 'masuk' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {transaksiToDelete.tipe === 'masuk' ? '+ Pemasukan' : '- Pengeluaran'} ({formatRupiah(transaksiToDelete.nominal)})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Kategori:</span>
                <span className="font-semibold text-slate-800">{transaksiToDelete.kategori}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium shrink-0">Uraian:</span>
                <span className="font-semibold text-slate-800 text-right">{transaksiToDelete.keterangan}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Tanggal:</span>
                <span className="text-slate-700">
                  {new Date(transaksiToDelete.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {transaksiToDelete.noBukti && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">No. Bukti:</span>
                  <span className="font-mono text-slate-700">{transaksiToDelete.noBukti}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Penanggung Jawab:</span>
                <span className="text-slate-700">{transaksiToDelete.penanggungJawab}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransaksiToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetKeterangan = transaksiToDelete.keterangan;
                  deleteTransaksiKas(transaksiToDelete.id);
                  setTransaksiToDelete(null);
                  setToastMessage({
                    type: 'success',
                    text: `Transaksi "${targetKeterangan}" berhasil dihapus dari Buku Kas.`
                  });
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Semua Transaksi Kas */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Semua Transaksi Kas?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan menghapus data transaksi di Buku Kas Besar RT (Gabungan Kas Kecil & BOP).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 text-xs space-y-2.5">
              <div className="font-semibold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Pilih opsi pembersihan data transaksi:</span>
              </div>
              
              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-rose-200 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="radio"
                  name="deleteAllOption"
                  checked={deleteAllKeepSaldoAwal}
                  onChange={() => setDeleteAllKeepSaldoAwal(true)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Hapus Semua Transaksi (Saldo Awal Rp 2.099.000 Dipertahankan)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Menghapus seluruh transaksi kas operasional, dan menetapkan <strong>Saldo Awal Kas Kecil Rp 2.099.000 &amp; Kas BOP Rp 0</strong>.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-rose-200 cursor-pointer hover:bg-rose-50/40">
                <input
                  type="radio"
                  name="deleteAllOption"
                  checked={!deleteAllKeepSaldoAwal}
                  onChange={() => setDeleteAllKeepSaldoAwal(false)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Kosongkan Total (0 Baris Transaksi)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Menghapus seluruh transaksi tanpa sisa (Buku Kas menjadi 0 baris dan total saldo Rp 0).
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllTransaksiKas(deleteAllKeepSaldoAwal);
                  setIsDeleteAllModalOpen(false);
                  setToastMessage({
                    type: 'success',
                    text: deleteAllKeepSaldoAwal 
                      ? 'Seluruh data transaksi kas berhasil dihapus (Saldo Awal Kas Kecil Rp 2.099.000 & Kas BOP Rp 0 tetap tercatat).' 
                      : 'Seluruh data transaksi kas besar berhasil dikosongkan.'
                  });
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Semua Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal QR Code Bendahara RT */}
      {isQrBendaharaModalOpen && (
        <QrCodeBendaharaModal
          onClose={() => setIsQrBendaharaModalOpen(false)}
        />
      )}
    </div>
  );
};
