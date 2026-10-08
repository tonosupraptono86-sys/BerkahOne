import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { calculateAge, getAgeCategory, parseIndoDate } from '../utils/dateUtils';
import { Warga } from '../types';
import { 
  Users, 
  Home, 
  HeartHandshake, 
  TrendingUp, 
  GraduationCap, 
  Activity, 
  Baby, 
  UserCheck, 
  MapPin, 
  Download, 
  ArrowUpRight,
  Sparkles,
  Shield,
  Filter,
  RotateCcw,
  Calendar,
  Search,
  Printer,
  ChevronRight,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Wallet,
  X,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { LogoSemarang } from './LogoSemarang';
import { RupiahIcon } from './RupiahIcon';
import { LOGO_SEMARANG_DATA_URI } from '../data/logoSemarang';
import { exportElementToPDF } from '../utils/pdfExport';
import { generateQRCodeWithBerkahOneLogo } from '../utils/qrCodeGenerator';

export const Dashboard: React.FC = () => {
  const { 
    wargaList, 
    users, 
    setActiveTab, 
    setSearchQuery, 
    logs, 
    setSelectedKK, 
    ringkasanKas,
    ringkasanKasPKK,
    setActivePkkSubTab,
    pesertaPKKList
  } = useApp();

  // Print & PDF Preview Modal States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedPdfInfo, setGeneratedPdfInfo] = useState<{ url: string; filename: string } | null>(null);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const printContentRef = useRef<HTMLDivElement>(null);
  const [qrKetuaUrl, setQrKetuaUrl] = useState<string>('');
  const [qrAdminUrl, setQrAdminUrl] = useState<string>('');

  const ketuaRTName = users?.find((u) => u.role === 'superadmin')?.nama || 'ALI MUHTAROM, S.T';
  const sekretarisRTName = users?.find((u) => u.role === 'sekretaris')?.nama || 'SUPRAPTONO';

  // Filter States
  const [selectedGender, setSelectedGender] = useState<'all' | 'Laki-laki' | 'Perempuan'>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<'all' | 'balita' | 'anak' | 'remaja' | 'dewasa' | 'lansia'>('all');
  const [selectedStatusKeluarga, setSelectedStatusKeluarga] = useState<'all' | 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Cucu'>('all');
  const [selectedStatusKawin, setSelectedStatusKawin] = useState<'all' | 'Kawin' | 'Belum Kawin' | 'Janda' | 'Duda' | 'Meninggal'>('all');
  const [selectedDomisili, setSelectedDomisili] = useState<'all' | 'rt02' | 'luar'>('all');
  const [selectedPendidikan, setSelectedPendidikan] = useState<string>('all');
  const [yearRangePreset, setYearRangePreset] = useState<string>('all');
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Preset Year Range handler
  const handlePresetChange = (preset: string) => {
    setYearRangePreset(preset);
    const currentYear = 2026;
    switch (preset) {
      case 'balita':
        setStartYear((currentYear - 5).toString());
        setEndYear(currentYear.toString());
        break;
      case 'anak':
        setStartYear((currentYear - 12).toString());
        setEndYear((currentYear - 6).toString());
        break;
      case 'remaja':
        setStartYear((currentYear - 18).toString());
        setEndYear((currentYear - 13).toString());
        break;
      case 'dewasa':
        setStartYear((currentYear - 59).toString());
        setEndYear((currentYear - 19).toString());
        break;
      case 'lansia':
        setStartYear('1930');
        setEndYear((currentYear - 60).toString());
        break;
      default:
        setStartYear('');
        setEndYear('');
        break;
    }
  };

  const resetAllFilters = () => {
    setSelectedGender('all');
    setSelectedAgeGroup('all');
    setSelectedStatusKeluarga('all');
    setSelectedStatusKawin('all');
    setSelectedDomisili('all');
    setSelectedPendidikan('all');
    setYearRangePreset('all');
    setStartYear('');
    setEndYear('');
    setFilterSearch('');
  };

  const isAnyFilterActive = 
    selectedGender !== 'all' || 
    selectedAgeGroup !== 'all' || 
    selectedStatusKeluarga !== 'all' || 
    selectedStatusKawin !== 'all' || 
    selectedDomisili !== 'all' || 
    selectedPendidikan !== 'all' || 
    startYear !== '' || 
    endYear !== '' || 
    filterSearch !== '';

  // Filter computation
  const filteredWarga = useMemo(() => {
    return wargaList.filter((w) => {
      const age = calculateAge(w.tglLahir);

      // Gender filter
      if (selectedGender !== 'all' && w.jenisKelamin !== selectedGender) return false;

      // Age Group filter
      if (selectedAgeGroup !== 'all') {
        if (selectedAgeGroup === 'balita' && (age < 0 || age > 5)) return false;
        if (selectedAgeGroup === 'anak' && (age < 6 || age > 12)) return false;
        if (selectedAgeGroup === 'remaja' && (age < 13 || age > 18)) return false;
        if (selectedAgeGroup === 'dewasa' && (age < 19 || age > 59)) return false;
        if (selectedAgeGroup === 'lansia' && age < 60) return false;
      }

      // Status Keluarga filter
      if (selectedStatusKeluarga !== 'all') {
        if (selectedStatusKeluarga === 'Cucu' && w.statusKeluarga !== 'Cucu' && w.statusKeluarga !== 'Lainnya' && (w.statusKeluarga as string) !== 'Famili Lain') return false;
        if (selectedStatusKeluarga !== 'Cucu' && w.statusKeluarga !== selectedStatusKeluarga) return false;
      }

      // Status Perkawinan filter
      if (selectedStatusKawin !== 'all' && w.statusPerkawinan !== selectedStatusKawin) return false;

      // Domisili filter
      if (selectedDomisili !== 'all') {
        const isRT02 = w.domisili.toLowerCase().includes('rt 02');
        if (selectedDomisili === 'rt02' && !isRT02) return false;
        if (selectedDomisili === 'luar' && isRT02) return false;
      }

      // Pendidikan filter
      if (selectedPendidikan !== 'all') {
        if (!w.pendidikan || !w.pendidikan.toUpperCase().includes(selectedPendidikan.toUpperCase())) return false;
      }

      // Birth Year Range
      if (startYear || endYear) {
        const d = parseIndoDate(w.tglLahir);
        if (d) {
          const birthYear = d.getFullYear();
          if (startYear && birthYear < parseInt(startYear, 10)) return false;
          if (endYear && birthYear > parseInt(endYear, 10)) return false;
        }
      }

      // Free text search in filter view
      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase();
        const matchesName = w.nama.toLowerCase().includes(query);
        const matchesNik = w.nik.includes(query);
        const matchesNoKk = w.noKk.includes(query);
        const matchesAlamat = w.alamat.toLowerCase().includes(query);
        if (!matchesName && !matchesNik && !matchesNoKk && !matchesAlamat) return false;
      }

      return true;
    });
  }, [
    wargaList,
    selectedGender,
    selectedAgeGroup,
    selectedStatusKeluarga,
    selectedStatusKawin,
    selectedDomisili,
    selectedPendidikan,
    startYear,
    endYear,
    filterSearch
  ]);

  // Calculations for filtered data
  const totalJiwa = filteredWarga.length;
  const uniqueKK = Array.from(new Set(filteredWarga.map((w) => w.noKk).filter(Boolean)));
  const totalKK = uniqueKK.length;
  const kepalaKeluargaCount = filteredWarga.filter((w) => w.statusKeluarga === 'Kepala Keluarga').length;

  // Gender counts
  const lakiCount = filteredWarga.filter((w) => w.jenisKelamin === 'Laki-laki').length;
  const perempuanCount = filteredWarga.filter((w) => w.jenisKelamin === 'Perempuan').length;
  const lakiPercent = totalJiwa ? Math.round((lakiCount / totalJiwa) * 100) : 0;
  const perempuanPercent = totalJiwa ? 100 - lakiPercent : 0;

  // Status Perkawinan
  const kawinCount = filteredWarga.filter((w) => w.statusPerkawinan === 'Kawin').length;
  const belumKawinCount = filteredWarga.filter((w) => w.statusPerkawinan === 'Belum Kawin').length;
  const jandaCount = filteredWarga.filter((w) => w.statusPerkawinan === 'Janda').length;
  const dudaCount = filteredWarga.filter((w) => w.statusPerkawinan === 'Duda').length;
  const meninggalCount = filteredWarga.filter((w) => w.statusPerkawinan === 'Meninggal').length;
  const wargaHidupCount = totalJiwa - meninggalCount;

  // Age group distribution with Male/Female breakdown
  const ageGroups = {
    balita: { total: 0, laki: 0, perempuan: 0 },
    anak: { total: 0, laki: 0, perempuan: 0 },
    remaja: { total: 0, laki: 0, perempuan: 0 },
    dewasa: { total: 0, laki: 0, perempuan: 0 },
    lansia: { total: 0, laki: 0, perempuan: 0 },
  };

  filteredWarga.forEach((w) => {
    const age = calculateAge(w.tglLahir);
    const isMale = w.jenisKelamin === 'Laki-laki';

    if (age <= 5) {
      ageGroups.balita.total++;
      if (isMale) ageGroups.balita.laki++; else ageGroups.balita.perempuan++;
    } else if (age <= 12) {
      ageGroups.anak.total++;
      if (isMale) ageGroups.anak.laki++; else ageGroups.anak.perempuan++;
    } else if (age <= 18) {
      ageGroups.remaja.total++;
      if (isMale) ageGroups.remaja.laki++; else ageGroups.remaja.perempuan++;
    } else if (age <= 59) {
      ageGroups.dewasa.total++;
      if (isMale) ageGroups.dewasa.laki++; else ageGroups.dewasa.perempuan++;
    } else {
      ageGroups.lansia.total++;
      if (isMale) ageGroups.lansia.laki++; else ageGroups.lansia.perempuan++;
    }
  });

  // Education distribution
  const eduCounts: Record<string, number> = {};
  filteredWarga.forEach((w) => {
    let p = w.pendidikan?.trim() || 'Tidak Diketahui';
    if (p.includes('S1')) p = 'S1 / Sarjana';
    else if (p.includes('S2')) p = 'S2 / Magister';
    else if (p === 'BALITA' || p === 'PAUD') p = 'PAUD / Balita';
    eduCounts[p] = (eduCounts[p] || 0) + 1;
  });
  const sortedEdu = Object.entries(eduCounts).sort((a, b) => b[1] - a[1]);

  // Domisili
  const domisiliRT02 = filteredWarga.filter((w) => w.domisili.toLowerCase().includes('rt 02')).length;
  const domisiliLuar = totalJiwa - domisiliRT02;

  // Family status counts
  const statusKeluargaCounts = {
    'Kepala Keluarga': filteredWarga.filter((w) => w.statusKeluarga === 'Kepala Keluarga').length,
    'Istri': filteredWarga.filter((w) => w.statusKeluarga === 'Istri').length,
    'Anak': filteredWarga.filter((w) => w.statusKeluarga === 'Anak').length,
    'Cucu & Lainnya': filteredWarga.filter((w) => w.statusKeluarga === 'Cucu' || w.statusKeluarga === 'Lainnya' || (w.statusKeluarga as string) === 'Famili Lain').length,
  };

  // Export filtered data as CSV
  const handleExportCSV = () => {
    const headers = ['No', 'NIK', 'No KK', 'Nama', 'Jenis Kelamin', 'Tempat Lahir', 'Tgl Lahir', 'Usia', 'Status Hubungan', 'Status Perkawinan', 'Pendidikan', 'Alamat', 'Domisili'];
    const rows = filteredWarga.map((w, idx) => [
      idx + 1,
      `'${w.nik}`,
      `'${w.noKk}`,
      `"${w.nama.replace(/"/g, '""')}"`,
      w.jenisKelamin,
      w.tempatLahir,
      w.tglLahir,
      calculateAge(w.tglLahir),
      w.statusKeluarga,
      w.statusPerkawinan,
      w.pendidikan,
      `"${w.alamat.replace(/"/g, '""')}"`,
      `"${w.domisili.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Demografi_RT02_Tanjung_Sari_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate QR Codes for Signatures
  const ensureQRCodes = async () => {
    if (qrKetuaUrl && qrAdminUrl) {
      return { qrKetua: qrKetuaUrl, qrAdmin: qrAdminUrl };
    }
    const filterDesc = isAnyFilterActive ? `Filter Aktif (${totalJiwa} Jiwa)` : `Seluruh Warga (${totalJiwa} Jiwa)`;
    const ketuaText = `DOKUMEN RESMI DEMOGRAFI & REKAPITULASI RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Mengetahui\nNama: ${ketuaRTName}\nJabatan: Ketua RT 02 RW 14 Tanjung Sari\nSistem: BerkahOne RT 02 RW 14 Tanjung Sari\nTahun: 2026\nData: ${filterDesc}\nVerifikasi: SAH & TERCATAT`;
    const adminText = `DOKUMEN RESMI DEMOGRAFI & REKAPITULASI RT 02 RW 14\nKelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang\nStatus: Terverifikasi Digital & Dibuat\nNama: ${sekretarisRTName}\nJabatan: Administrator / Sekretaris RT 02 RW 14\nSistem: BerkahOne RT 02 RW 14 Tanjung Sari\nTahun: 2026\nData: ${filterDesc}\nVerifikasi: SAH & TERCATAT`;

    try {
      const [k, a] = await Promise.all([
        generateQRCodeWithBerkahOneLogo(ketuaText, 220),
        generateQRCodeWithBerkahOneLogo(adminText, 220)
      ]);
      setQrKetuaUrl(k);
      setQrAdminUrl(a);
      return { qrKetua: k, qrAdmin: a };
    } catch (err) {
      console.error('Error generating signature QRs:', err);
      return { qrKetua: '', qrAdmin: '' };
    }
  };

  useEffect(() => {
    ensureQRCodes();
  }, [totalJiwa, ketuaRTName, sekretarisRTName]);

  const escapeHtml = (str: string): string => {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getTanggalCetak = () => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  };

  // Generate Standalone HTML for Printing / Tab
  const generatePrintableHtml = (qrs: { qrKetua?: string; qrAdmin?: string }) => {
    const tanggalCetak = getTanggalCetak();
    const filterStatus = isAnyFilterActive
      ? `Filter Aktif: ${totalJiwa} Jiwa Terpilih (dari ${wargaList.length} Total Warga)`
      : `Semua Data Warga Terdaftar (100% - ${wargaList.length} Jiwa)`;

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Statistik & Demografi RT 02 RW 14 Tanjung Sari</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #0f172a;
      background-color: #f8fafc;
      margin: 0;
      padding: 16px;
    }
    .page-sheet {
      background: #ffffff;
      max-width: 210mm;
      margin: 0 auto;
      padding: 18mm 16mm;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    @media print {
      body { background: #fff !important; padding: 0 !important; }
      .page-sheet { border: none !important; box-shadow: none !important; max-width: 100% !important; padding: 0 !important; }
      .no-print { display: none !important; }
    }
    .no-print-bar {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: space-between;
      align-items: center;
      background: #0f4419;
      color: #fff;
      padding: 12px 18px;
      border-radius: 12px;
      font-family: Arial, sans-serif;
    }
    .no-print-btn {
      background: #f97316;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
    }
    .no-print-btn-secondary {
      background: #ffffff;
      color: #0f4419;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
    }
    /* Kop Surat */
    .kop-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 10px;
      border-bottom: 3.5px double #0f172a;
      margin-bottom: 12px;
    }
    .kop-logo img { width: 72px; height: auto; }
    .kop-text { flex: 1; text-align: center; font-family: 'Times New Roman', serif; }
    .kop-text .line-1 { font-size: 14pt; font-weight: 900; letter-spacing: 0.5px; }
    .kop-text .line-2 { font-size: 10pt; font-weight: bold; margin-top: 1px; }
    .kop-text .line-3 { font-size: 12pt; font-weight: 900; margin-top: 2px; }
    /* Title */
    .doc-title { text-align: center; margin: 12px 0; }
    .doc-title h2 { font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 0; text-transform: uppercase; }
    .doc-title p { font-family: Arial, sans-serif; font-size: 8.5pt; color: #475569; margin: 3px 0 0 0; }
    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
      font-family: Arial, sans-serif;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      background: #f8fafc;
      text-align: center;
    }
    .kpi-title { font-size: 7.5pt; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .kpi-val { font-size: 13pt; font-weight: 900; color: #0f172a; margin: 2px 0; }
    .kpi-sub { font-size: 7.5pt; color: #334155; }
    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #94a3b8;
      padding: 4.5px 6px;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
    }
    .sec-header {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      font-weight: bold;
      color: #0f4419;
      margin: 10px 0 4px 0;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    /* Signature */
    .sign-section {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      page-break-inside: avoid;
      font-family: 'Times New Roman', serif;
    }
    .sign-box {
      width: 44%;
      text-align: center;
      font-size: 9.5pt;
    }
    .sign-qr {
      width: 78px;
      height: 78px;
      margin: 6px auto;
      border: 1px solid #cbd5e1;
      padding: 2px;
      border-radius: 4px;
      background: #fff;
    }
    .sign-name { font-weight: bold; text-decoration: underline; font-size: 10pt; }
    .sign-role { font-size: 8.5pt; color: #334155; }
    .footer-note {
      margin-top: 14px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="no-print-bar no-print">
    <div>
      <strong>Pratinjau Cetak:</strong> Laporan Demografi RT 02 RW 14 Tanjung Sari (${filteredWarga.length} Warga)
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="no-print-btn" onclick="window.print()">🖨️ Cetak Dokumen Sekarang</button>
      <button class="no-print-btn-secondary" onclick="window.close()">Tutup Tab</button>
    </div>
  </div>

  <div class="page-sheet">
    <!-- Kop Surat Kedinasan Resmi -->
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

    <!-- Judul Dokumen -->
    <div class="doc-title">
      <h2>LAPORAN REKAPITULASI STATISTIK &amp; DEMOGRAFI KEPENDUDUKAN</h2>
      <p>Sistem Informasi Manajemen BerkahOne &bull; RT 02 RW 14 Tanjung Sari &bull; Tahun 2026</p>
      <p style="font-size: 8pt; color: #475569; margin-top: 2px;">
        Tanggal Cetak: ${tanggalCetak} &bull; ${filterStatus}
      </p>
    </div>

    <!-- KPI Ringkasan -->
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-title">Total Warga</div>
        <div class="kpi-val">${totalJiwa}</div>
        <div class="kpi-sub">${totalKK} Kepala Keluarga (KK)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">Jenis Kelamin</div>
        <div class="kpi-val" style="font-size: 11pt; margin-top: 4px;">L: ${lakiCount} | P: ${perempuanCount}</div>
        <div class="kpi-sub">Laki: ${lakiPercent}% &bull; Perempuan: ${perempuanPercent}%</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">Domisili Warga</div>
        <div class="kpi-val" style="font-size: 11pt; margin-top: 4px;">RT02: ${domisiliRT02} | Luar: ${domisiliLuar}</div>
        <div class="kpi-sub">${totalJiwa > 0 ? Math.round((domisiliRT02 / totalJiwa) * 100) : 0}% Warga Tetap RT 02</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">Kelompok Rentan</div>
        <div class="kpi-val" style="font-size: 11pt; margin-top: 4px;">Balita: ${ageGroups.balita.total} | Lansia: ${ageGroups.lansia.total}</div>
        <div class="kpi-sub">Produktif: ${ageGroups.dewasa.total} Jiwa</div>
      </div>
    </div>

    <!-- Tabel Kelompok Usia -->
    <div class="sec-header">I. Distribusi Kelompok Umur &amp; Generasi</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Kelompok Usia</th>
          <th>Rentang Usia</th>
          <th style="text-align: center;">Laki-laki</th>
          <th style="text-align: center;">Perempuan</th>
          <th style="text-align: center;">Total Jiwa</th>
          <th style="text-align: center;">Persentase</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Balita</strong> (Anak Bawah Lima Tahun)</td>
          <td>0 - 5 Tahun</td>
          <td style="text-align: center;">${ageGroups.balita.laki}</td>
          <td style="text-align: center;">${ageGroups.balita.perempuan}</td>
          <td style="text-align: center; font-weight: bold;">${ageGroups.balita.total}</td>
          <td style="text-align: center;">${totalJiwa > 0 ? ((ageGroups.balita.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr>
          <td><strong>Anak-anak</strong> (Usia Sekolah Dasar)</td>
          <td>6 - 12 Tahun</td>
          <td style="text-align: center;">${ageGroups.anak.laki}</td>
          <td style="text-align: center;">${ageGroups.anak.perempuan}</td>
          <td style="text-align: center; font-weight: bold;">${ageGroups.anak.total}</td>
          <td style="text-align: center;">${totalJiwa > 0 ? ((ageGroups.anak.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr>
          <td><strong>Remaja</strong> (SMP / SMA)</td>
          <td>13 - 18 Tahun</td>
          <td style="text-align: center;">${ageGroups.remaja.laki}</td>
          <td style="text-align: center;">${ageGroups.remaja.perempuan}</td>
          <td style="text-align: center; font-weight: bold;">${ageGroups.remaja.total}</td>
          <td style="text-align: center;">${totalJiwa > 0 ? ((ageGroups.remaja.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr>
          <td><strong>Usia Produktif</strong> (Dewasa / Bekerja)</td>
          <td>19 - 59 Tahun</td>
          <td style="text-align: center;">${ageGroups.dewasa.laki}</td>
          <td style="text-align: center;">${ageGroups.dewasa.perempuan}</td>
          <td style="text-align: center; font-weight: bold;">${ageGroups.dewasa.total}</td>
          <td style="text-align: center;">${totalJiwa > 0 ? ((ageGroups.dewasa.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr>
          <td><strong>Lanjut Usia (Lansia)</strong></td>
          <td>&ge; 60 Tahun</td>
          <td style="text-align: center;">${ageGroups.lansia.laki}</td>
          <td style="text-align: center;">${ageGroups.lansia.perempuan}</td>
          <td style="text-align: center; font-weight: bold;">${ageGroups.lansia.total}</td>
          <td style="text-align: center;">${totalJiwa > 0 ? ((ageGroups.lansia.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
        </tr>
      </tbody>
    </table>

    <!-- Tabel Status & Pendidikan -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
      <div>
        <div class="sec-header">II. Status Perkawinan</div>
        <table class="data-table">
          <thead>
            <tr><th>Status Perkawinan</th><th style="text-align: center;">Jumlah</th><th style="text-align: center;">%</th></tr>
          </thead>
          <tbody>
            <tr><td>Kawin</td><td style="text-align: center;">${kawinCount}</td><td style="text-align: center;">${totalJiwa ? ((kawinCount/totalJiwa)*100).toFixed(1) : 0}%</td></tr>
            <tr><td>Belum Kawin</td><td style="text-align: center;">${belumKawinCount}</td><td style="text-align: center;">${totalJiwa ? ((belumKawinCount/totalJiwa)*100).toFixed(1) : 0}%</td></tr>
            <tr><td>Janda / Duda</td><td style="text-align: center;">${jandaCount + dudaCount}</td><td style="text-align: center;">${totalJiwa ? (((jandaCount+dudaCount)/totalJiwa)*100).toFixed(1) : 0}%</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="sec-header">III. Tingkat Pendidikan Teratas</div>
        <table class="data-table">
          <thead>
            <tr><th>Pendidikan</th><th style="text-align: center;">Jumlah</th><th style="text-align: center;">%</th></tr>
          </thead>
          <tbody>
            ${sortedEdu.slice(0, 4).map(([p, cnt]) => `
              <tr><td>${escapeHtml(p)}</td><td style="text-align: center;">${cnt}</td><td style="text-align: center;">${totalJiwa ? ((cnt/totalJiwa)*100).toFixed(1) : 0}%</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pengesahan Digital -->
    <div class="sign-section">
      <div class="sign-box">
        <div>Mengetahui,</div>
        <div style="font-weight: bold; margin-bottom: 4px;">KETUA RT 02 RW 14 TANJUNG SARI</div>
        ${qrs.qrKetua ? `<img src="${qrs.qrKetua}" class="sign-qr" alt="QR TTD Ketua RT" />` : '<div style="height: 70px;"></div>'}
        <div class="sign-name">${escapeHtml(ketuaRTName)}</div>
        <div class="sign-role">Ketua RT 02 RW 14 Tanjung Sari</div>
      </div>
      <div class="sign-box">
        <div>Semarang, ${tanggalCetak}</div>
        <div style="font-weight: bold; margin-bottom: 4px;">ADMINISTRATOR / SEKRETARIS RT</div>
        ${qrs.qrAdmin ? `<img src="${qrs.qrAdmin}" class="sign-qr" alt="QR TTD Sekretaris RT" />` : '<div style="height: 70px;"></div>'}
        <div class="sign-name">${escapeHtml(sekretarisRTName)}</div>
        <div class="sign-role">Administrator / Sekretaris RT 02 RW 14</div>
      </div>
    </div>

    <div class="footer-note">
      <span>Dokumen Sah &bull; Sistem Informasi Kependudukan BerkahOne RT 02 RW 14 Tanjung Sari</span>
      <span>Dicetak otomatis pada: ${tanggalCetak}</span>
    </div>
  </div>
</body>
</html>`;
  };

  // Open Standalone Print Tab
  const handleOpenPrintTab = async () => {
    const qrs = await ensureQRCodes();
    const html = generatePrintableHtml(qrs);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setPrintNotice(null);
    } else {
      setPrintNotice('Pop-up browser terblokir. Mengunduh berkas laporan HTML secara otomatis.');
      handleDownloadHtmlPrint();
    }
  };

  // Download Standalone HTML file
  const handleDownloadHtmlPrint = async () => {
    const qrs = await ensureQRCodes();
    const html = generatePrintableHtml(qrs);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Statistik_Demografi_RT02_Tanjung_Sari_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export PDF using pdfExport utility
  const handleExportPDF = async (action: 'download' | 'open' | 'both' = 'both') => {
    try {
      setIsGeneratingPdf(true);
      await ensureQRCodes();

      if (!isPrintModalOpen) {
        setIsPrintModalOpen(true);
      }

      let attempts = 0;
      while (!printContentRef.current && attempts < 20) {
        await new Promise((res) => setTimeout(res, 80));
        attempts++;
      }

      if (!printContentRef.current) {
        throw new Error('Area dokumen cetak belum siap dimuat.');
      }

      await new Promise((res) => setTimeout(res, 200));

      const filename = `Laporan_Statistik_Demografi_RT02_Tanjung_Sari_${new Date().toISOString().slice(0, 10)}.pdf`;

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
    } catch (err) {
      console.error('Gagal membuat dokumen PDF:', err);
      setPrintNotice('Pembuatan PDF otomatis memerlukan izin pop-up browser. Silakan klik tombol "Buka Tab Cetak" untuk opsi cetak langsung.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    ensureQRCodes();
    setIsPrintModalOpen(true);
  };

  const handleDirectBrowserPrint = () => {
    try {
      window.print();
    } catch {
      setPrintNotice('Pencetakan browser terblokir di lingkungan iframe. Gunakan tombol "Buka Tab Cetak" atau "Unduh PDF".');
    }
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-200 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f4419] via-[#165b27] to-[#1e7e34] text-white p-6 md:p-8 shadow-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>BerkahOne Smart Dashboard RT 02 RW 14 Tanjung Sari</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Dashboard Pelaporan & Analisis Demografi
            </h1>
            <p className="text-emerald-100 text-xs md:text-sm leading-relaxed">
              Memantau data <strong className="text-white font-bold">{wargaList.length} warga terdaftar</strong> dengan visualisasi interaktif, filter rentang tanggal/kategori, dan ekspor pelaporan resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Buka Pratinjau Cetak Laporan Statistik & Demografi RT 02 RW 14 Tanjung Sari"
            >
              <Printer className="w-4 h-4 text-emerald-800" />
              <span>Cetak Pratinjau</span>
            </button>
            <button
              onClick={() => handleExportPDF('both')}
              disabled={isGeneratingPdf}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Unduh Rekap Statistik & Demografi dalam Format PDF A4 Resmi"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Hasil Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="text-sm font-bold text-slate-900">
              Filter Data Laporan Terpadu
            </span>
            {isAnyFilterActive && (
              <span className="text-[11px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                Filter Aktif: {totalJiwa} dari {wargaList.length} Jiwa
              </span>
            )}
          </div>

          {isAnyFilterActive && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 4k:grid-cols-4 gap-3 4k:gap-4 text-xs">
          {/* Filter 1: Status Hubungan Keluarga */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Status Hubungan:
            </label>
            <select
              value={selectedStatusKeluarga}
              onChange={(e) => setSelectedStatusKeluarga(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
            >
              <option value="all">Semua Status Keluarga</option>
              <option value="Kepala Keluarga">Kepala Keluarga</option>
              <option value="Istri">Istri</option>
              <option value="Anak">Anak</option>
              <option value="Cucu">Cucu / Famili Lain</option>
            </select>
          </div>

          {/* Filter 2: Kelompok Umur */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Kelompok Umur:
            </label>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
            >
              <option value="all">Semua Kelompok Umur</option>
              <option value="balita">Balita (0 - 5 Tahun)</option>
              <option value="anak">Anak-anak (6 - 12 Tahun)</option>
              <option value="remaja">Remaja (13 - 18 Tahun)</option>
              <option value="dewasa">Dewasa Produktif (19 - 59 Tahun)</option>
              <option value="lansia">Lansia (60+ Tahun)</option>
            </select>
          </div>

          {/* Filter 3: Jenis Kelamin */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Jenis Kelamin:
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
            >
              <option value="all">Semua Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Filter 4: Status Perkawinan */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Status Perkawinan:
            </label>
            <select
              value={selectedStatusKawin}
              onChange={(e) => setSelectedStatusKawin(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
            >
              <option value="all">Semua Status Perkawinan</option>
              <option value="Kawin">Kawin</option>
              <option value="Belum Kawin">Belum Kawin</option>
              <option value="Janda">Janda</option>
              <option value="Duda">Duda</option>
              <option value="Meninggal">Meninggal</option>
            </select>
          </div>
        </div>

        {/* Second Row of Filters: Date Range & Domisili */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 4k:grid-cols-4 gap-3 4k:gap-4 text-xs pt-1">
          {/* Rentang Tahun Kelahiran */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">
              Rentang Tahun Kelahiran:
            </label>
            <div className="flex items-center gap-2">
              <select
                value={yearRangePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
              >
                <option value="all">Preset Bebas</option>
                <option value="balita">Balita (2021-2026)</option>
                <option value="anak">Anak (2014-2020)</option>
                <option value="remaja">Remaja (2008-2013)</option>
                <option value="dewasa">Dewasa (1967-2007)</option>
                <option value="lansia">Lansia (Sebelum 1967)</option>
              </select>
              <input
                type="number"
                value={startYear}
                onChange={(e) => { setStartYear(e.target.value); setYearRangePreset('custom'); }}
                placeholder="Th. Mulai (1950)"
                className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-mono text-center"
              />
              <span className="text-slate-400 font-bold">&ndash;</span>
              <input
                type="number"
                value={endYear}
                onChange={(e) => { setEndYear(e.target.value); setYearRangePreset('custom'); }}
                placeholder="Th. Akhir (2026)"
                className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-mono text-center"
              />
            </div>
          </div>

          {/* Domisili */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">
              Sebaran Domisili:
            </label>
            <select
              value={selectedDomisili}
              onChange={(e) => setSelectedDomisili(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
            >
              <option value="all">Semua Wilayah</option>
              <option value="rt02">Warga Asli RT 02</option>
              <option value="luar">Warga Luar / Kost / Sementara</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI METRICS (RESPONDING DYNAMICALLY TO FILTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 4k:grid-cols-4 gap-4 2xl:gap-5 4k:gap-6">
        {/* KPI 1: Total Jiwa Terfilter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Penduduk</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{totalJiwa}</span>
            <span className="text-xs font-medium text-slate-400">Jiwa Terfilter</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-emerald-700 font-medium">{wargaHidupCount} Warga Aktif</span>
            <span className="text-slate-400">{meninggalCount} Meninggal</span>
          </div>
        </div>

        {/* KPI 2: Total KK Terfilter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kepala Keluarga</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{totalKK}</span>
            <span className="text-xs font-medium text-slate-400">No. KK Terkait</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-600">{kepalaKeluargaCount} Kepala Keluarga</span>
            <span className="text-orange-600 font-semibold">
              {(totalJiwa / (totalKK || 1)).toFixed(1)} jiwa / KK
            </span>
          </div>
        </div>

        {/* KPI 3: Rasio Gender Terfilter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rasio Jenis Kelamin</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-xs">
              <span className="font-bold text-blue-700">{lakiCount}</span> L ({lakiPercent}%)
            </div>
            <div className="text-xs">
              <span className="font-bold text-pink-700">{perempuanCount}</span> P ({perempuanPercent}%)
            </div>
          </div>
          {/* Dual Bar */}
          <div className="w-full h-2.5 bg-pink-200 rounded-full overflow-hidden flex">
            <div style={{ width: `${lakiPercent}%` }} className="h-full bg-blue-600 transition-all duration-300" />
            <div style={{ width: `${perempuanPercent}%` }} className="h-full bg-pink-500 transition-all duration-300" />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
            <span>Proporsi Gender</span>
            <span className="text-emerald-700 font-bold">{totalJiwa > 0 ? 'Seimbang' : '-'}</span>
          </div>
        </div>

        {/* KPI 4: Sebaran Domisili */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sebaran Domisili</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{domisiliRT02}</span>
            <span className="text-xs font-medium text-emerald-700 font-bold">Domisili RT 02</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">{domisiliLuar} Warga Luar RT 02 / Kost</span>
            <span className="text-slate-400 font-mono text-[10px]">RW 14</span>
          </div>
        </div>
      </div>

      {/* PANEL POSISI KEUANGAN LINGKUNGAN: KAS BESAR RT & KAS PKK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KAS BESAR RT (KONSOLIDASI KAS KECIL & KAS BOP) */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between gap-4 border border-emerald-800/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                <Wallet className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Kas Besar RT 02 (Gabungan)
                  </span>
                  <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                    Konsolidasi
                  </span>
                </div>
                <div className="text-2xl font-black text-white mt-0.5">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ringkasanKas.totalSaldoKasBesar)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('kas_besar')}
              className="p-2 text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              title="Buka Menu Kas Besar"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 border-t border-emerald-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-emerald-100/90 flex flex-wrap items-center gap-2 text-[11px]">
              <span>🪙 Kas Kecil: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ringkasanKas.saldoKasKecil)}</strong></span>
              <span>&bull;</span>
              <span>📑 Kas BOP: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ringkasanKas.saldoKasBOP)}</strong></span>
            </div>
            <button
              onClick={() => setActiveTab('kas_besar')}
              className="text-[11px] font-bold text-emerald-200 hover:text-white underline underline-offset-2 cursor-pointer flex items-center gap-1 ml-auto"
            >
              Buku Kas RT &rarr;
            </button>
          </div>
        </div>

        {/* POSISI KAS PKK RT 02 */}
        <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-pink-950 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between gap-4 border border-rose-800/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
                <RupiahIcon className="w-6 h-6 text-pink-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-200">
                    Posisi Kas PKK RT 02
                  </span>
                  <span className="text-[10px] font-bold bg-pink-500 text-white px-2 py-0.5 rounded-full">
                    Kader PKK
                  </span>
                </div>
                <div className="text-2xl font-black text-white mt-0.5">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ringkasanKasPKK.saldo)}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('pkk');
                setActivePkkSubTab('kas_pkk');
              }}
              className="p-2 text-pink-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              title="Buka Kas PKK"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 border-t border-rose-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-pink-100/90 flex flex-wrap items-center gap-2 text-[11px]">
              <span>📥 Masuk: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ringkasanKasPKK.totalMasuk)}</strong></span>
              <span>&bull;</span>
              <span>📤 Keluar: <strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ringkasanKasPKK.totalKeluar)}</strong></span>
              <span>&bull;</span>
              <span>👥 {pesertaPKKList.length} Istri / Kader</span>
            </div>
            <button
              onClick={() => {
                setActiveTab('pkk');
                setActivePkkSubTab('kas_pkk');
              }}
              className="text-[11px] font-bold text-pink-200 hover:text-white underline underline-offset-2 cursor-pointer flex items-center gap-1 ml-auto"
            >
              Kelola Kas PKK &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS: BAR CHART & DONUT PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-3 4k:grid-cols-3 gap-6 4k:gap-8">
        {/* Left 2 Cols: Interactive Bar Chart & Education */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kelompok Umur: Bar Chart (with Gender Breakdown per Age Group) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>Grafik Batang Distribusi Kelompok Umur</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan komposisi usia penduduk (Laki-laki vs Perempuan)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-blue-700">
                  <span className="w-3 h-3 rounded bg-blue-600"></span>
                  <span>Laki-laki</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-pink-700">
                  <span className="w-3 h-3 rounded bg-pink-500"></span>
                  <span>Perempuan</span>
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { key: 'balita', label: 'Balita (0 - 5 Th)', stats: ageGroups.balita, desc: 'Sasaran Posyandu' },
                { key: 'anak', label: 'Anak-anak (6 - 12 Th)', stats: ageGroups.anak, desc: 'Usia Sekolah Dasar' },
                { key: 'remaja', label: 'Remaja (13 - 18 Th)', stats: ageGroups.remaja, desc: 'SMP / SMA & Karang Taruna' },
                { key: 'dewasa', label: 'Dewasa Produktif (19 - 59 Th)', stats: ageGroups.dewasa, desc: 'Tenaga Kerja & Keluarga' },
                { key: 'lansia', label: 'Lansia (60+ Th)', stats: ageGroups.lansia, desc: 'Sasaran Posbindu Lansia' },
              ].map((item, idx) => {
                const totalAge = item.stats.total;
                const pct = totalJiwa ? Math.round((totalAge / totalJiwa) * 100) : 0;
                const maxCount = Math.max(
                  ageGroups.balita.total,
                  ageGroups.anak.total,
                  ageGroups.remaja.total,
                  ageGroups.dewasa.total,
                  ageGroups.lansia.total,
                  1
                );
                const barWidth = Math.round((totalAge / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.label}</span>
                        <span className="text-slate-400 ml-2 hidden sm:inline text-[11px] font-normal">&bull; {item.desc}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-blue-700">L: {item.stats.laki}</span>
                        <span className="text-[11px] font-mono text-pink-700">P: {item.stats.perempuan}</span>
                        <span className="font-mono font-black text-slate-900 w-14 text-right">{totalAge} Jiwa</span>
                        <span className="text-[11px] font-semibold text-slate-400 w-10 text-right">({pct}%)</span>
                      </div>
                    </div>

                    {/* Split Gender Bar */}
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                      {totalAge > 0 ? (
                        <>
                          <div 
                            style={{ width: `${(item.stats.laki / totalJiwa) * 100}%` }} 
                            className="h-full bg-blue-600 transition-all duration-500" 
                            title={`Laki-laki: ${item.stats.laki}`}
                          />
                          <div 
                            style={{ width: `${(item.stats.perempuan / totalJiwa) * 100}%` }} 
                            className="h-full bg-pink-500 transition-all duration-500" 
                            title={`Perempuan: ${item.stats.perempuan}`}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-100" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jenjang Pendidikan Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>Grafik Batang Profil Tingkat Pendidikan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tingkat pendidikan formal warga terfilter
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {sortedEdu.slice(0, 8).map(([jenjang, count], idx) => {
                const pct = totalJiwa ? Math.round((count / totalJiwa) * 100) : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{jenjang}</span>
                      <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-emerald-700 rounded-full" style={{ width: `${Math.min(pct * 2.5, 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-800">{count}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Donut Pie Charts for Gender, Status Hubungan, Status Perkawinan */}
        <div className="space-y-6">
          {/* Donut Chart: Rasio Jenis Kelamin */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-orange-500" />
              <span>Diagram Lingkaran: Rasio Gender</span>
            </h3>

            {/* SVG Circular Donut */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="3.5"
                  />
                  {/* Laki-laki segment */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeDasharray={`${lakiPercent} ${100 - lakiPercent}`}
                    strokeDashoffset="0"
                  />
                  {/* Perempuan segment */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke="#ec4899"
                    strokeWidth="3.5"
                    strokeDasharray={`${perempuanPercent} ${100 - perempuanPercent}`}
                    strokeDashoffset={`${-lakiPercent}`}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-800">{totalJiwa}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jiwa</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <div>
                  <div className="font-bold text-blue-950">{lakiCount} Jiwa</div>
                  <div className="text-[10px] text-blue-700">Laki-laki ({lakiPercent}%)</div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-pink-50 border border-pink-100 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                <div>
                  <div className="font-bold text-pink-950">{perempuanCount} Jiwa</div>
                  <div className="text-[10px] text-pink-700">Perempuan ({perempuanPercent}%)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Donut Chart: Komposisi Status Keluarga */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              <span>Komposisi Status Keluarga</span>
            </h3>

            <div className="space-y-2.5">
              {[
                { label: 'Kepala Keluarga', count: statusKeluargaCounts['Kepala Keluarga'], color: 'bg-emerald-700' },
                { label: 'Istri', count: statusKeluargaCounts['Istri'], color: 'bg-teal-600' },
                { label: 'Anak', count: statusKeluargaCounts['Anak'], color: 'bg-blue-600' },
                { label: 'Cucu / Famili Lain', count: statusKeluargaCounts['Cucu & Lainnya'], color: 'bg-purple-600' },
              ].map((role, idx) => {
                const pct = totalJiwa ? Math.round((role.count / totalJiwa) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${role.color}`} />
                      <span className="text-xs font-semibold text-slate-800">{role.label}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      {role.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Perkawinan Badges */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Status Perkawinan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  Kawin: {kawinCount}
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg">
                  Belum Kawin: {belumKawinCount}
                </span>
                <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                  Janda: {jandaCount}
                </span>
                <span className="text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-lg">
                  Duda: {dudaCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DRILLDOWN TABLE: DAFTAR WARGA SESUAI FILTER YANG AKTIF */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Daftar Warga Hasil Filter ({totalJiwa} Jiwa)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan rincian data penduduk sesuai kombinasi filter yang diterapkan di atas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV / Excel</span>
            </button>
            <button
              onClick={() => setActiveTab('warga')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Tabel Induk</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 2xl:max-h-[32rem] 4k:max-h-[40rem] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Nama Lengkap</th>
                <th className="py-2.5 px-3">NIK</th>
                <th className="py-2.5 px-3">No. KK</th>
                <th className="py-2.5 px-3">L/P</th>
                <th className="py-2.5 px-3">Usia / Tgl Lahir</th>
                <th className="py-2.5 px-3">Status Keluarga</th>
                <th className="py-2.5 px-3">Status Nikah</th>
                <th className="py-2.5 px-3">Domisili</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWarga.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada warga yang sesuai dengan kriteria filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredWarga.map((w, idx) => {
                  const age = calculateAge(w.tglLahir);
                  const cat = getAgeCategory(age);
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {w.nama}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {w.nik}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {w.noKk}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          w.jenisKelamin === 'Laki-laki'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {w.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{age} th</div>
                        <div className="text-[10px] text-slate-400">{w.tglLahir}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {w.statusKeluarga}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {w.statusPerkawinan}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 truncate max-w-[160px]">
                        {w.domisili}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {filteredWarga.length} dari {wargaList.length} total warga terdaftar RT 02 RW 14 Tanjung Sari</span>
          {isAnyFilterActive && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Print Preview Modal (Standard A4 Kedinasan) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header & Controls */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Pratinjau Cetak: Laporan Statistik & Demografi Warga
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar Format Administrasi RT 02 RW 14 Tanjung Sari • Kelurahan Pedurungan Tengah
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDirectBrowserPrint}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Cetak langsung menggunakan printer browser"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Sekarang</span>
                </button>

                <button
                  onClick={() => handleExportPDF('download')}
                  disabled={isGeneratingPdf}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Unduh berkas PDF A4 resmi"
                >
                  {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>Unduh PDF (A4)</span>
                </button>

                <button
                  onClick={handleOpenPrintTab}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Buka dokumen di tab baru browser untuk pencetakan bebas iframe"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Buka Tab Cetak</span>
                </button>

                <button
                  onClick={handleDownloadHtmlPrint}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Unduh dokumen dalam format HTML"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Unduh HTML</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification / Alert Banners */}
            {isGeneratingPdf && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-900 shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
                <span>Sedang memproses & menyusun dokumen PDF A4 resmi... Mohon tunggu sebentar.</span>
              </div>
            )}

            {generatedPdfInfo && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-emerald-900 shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Dokumen PDF Siap:</strong> {generatedPdfInfo.filename}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={generatedPdfInfo.url}
                    download={generatedPdfInfo.filename}
                    className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded hover:bg-emerald-800 transition-colors inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Unduh Lagi
                  </a>
                  <a
                    href={generatedPdfInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 font-bold rounded hover:bg-emerald-50 transition-colors inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Buka PDF
                  </a>
                </div>
              </div>
            )}

            {printNotice && (
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between gap-2 text-xs text-blue-900 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{printNotice}</span>
                </div>
                <button
                  onClick={() => setPrintNotice(null)}
                  className="text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Body / Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center">
              {/* Printable Document Sheet (A4 format) */}
              <div className="w-full max-w-[210mm] bg-white shadow-xl rounded-sm p-6 sm:p-8 md:p-10 border border-slate-300 print:border-none print:shadow-none print:p-0">
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
                  <div className="text-center my-4">
                    <h2 className="text-base font-bold uppercase underline tracking-wide">
                      LAPORAN REKAPITULASI STATISTIK & DEMOGRAFI KEPENDUDUKAN
                    </h2>
                    <p className="text-xs font-sans text-slate-600 mt-1">
                      Sistem Informasi Manajemen BerkahOne &bull; RT 02 RW 14 Tanjung Sari &bull; Tahun 2026
                    </p>
                    <p className="text-[11px] font-sans text-slate-500 mt-0.5">
                      Tanggal Cetak: {getTanggalCetak()} &bull; {isAnyFilterActive ? `Filter Aktif: ${totalJiwa} Jiwa Terpilih (dari ${wargaList.length} Total Warga)` : `Semua Data Warga Terdaftar (100% - ${wargaList.length} Jiwa)`}
                    </p>
                  </div>

                  {/* Ringkasan Indikator Utama (KPI Grid) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-sans text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Total Warga</div>
                      <div className="text-lg font-black text-slate-900 my-0.5">{totalJiwa}</div>
                      <div className="text-[10px] text-slate-600">{totalKK} Kepala Keluarga</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Jenis Kelamin</div>
                      <div className="text-sm font-black text-slate-900 my-0.5">L: {lakiCount} | P: {perempuanCount}</div>
                      <div className="text-[10px] text-slate-600">L: {lakiPercent}% &bull; P: {perempuanPercent}%</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Domisili Warga</div>
                      <div className="text-sm font-black text-slate-900 my-0.5">RT02: {domisiliRT02} | Luar: {domisiliLuar}</div>
                      <div className="text-[10px] text-slate-600">{totalJiwa > 0 ? Math.round((domisiliRT02 / totalJiwa) * 100) : 0}% Warga Tetap RT 02</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Kelompok Rentan</div>
                      <div className="text-sm font-black text-slate-900 my-0.5">Balita: {ageGroups.balita.total} | Lansia: {ageGroups.lansia.total}</div>
                      <div className="text-[10px] text-slate-600">Produktif: {ageGroups.dewasa.total} Jiwa</div>
                    </div>
                  </div>

                  {/* Section I: Kelompok Usia */}
                  <div className="font-sans font-bold text-xs uppercase text-emerald-900 mb-1">
                    I. Distribusi Kelompok Umur & Generasi
                  </div>
                  <table className="w-full border-collapse border border-slate-400 font-sans text-xs mb-3">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 text-[11px] uppercase">
                        <th className="border border-slate-400 p-1.5 text-left">Kelompok Usia</th>
                        <th className="border border-slate-400 p-1.5 text-left">Rentang</th>
                        <th className="border border-slate-400 p-1.5 text-center">Laki-laki</th>
                        <th className="border border-slate-400 p-1.5 text-center">Perempuan</th>
                        <th className="border border-slate-400 p-1.5 text-center font-bold">Total Jiwa</th>
                        <th className="border border-slate-400 p-1.5 text-center">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-semibold">Balita (Anak Bawah Lima Tahun)</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600">0 - 5 Tahun</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.balita.laki}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.balita.perempuan}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{ageGroups.balita.total}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{totalJiwa > 0 ? ((ageGroups.balita.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-semibold">Anak-anak (Usia Sekolah Dasar)</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600">6 - 12 Tahun</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.anak.laki}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.anak.perempuan}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{ageGroups.anak.total}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{totalJiwa > 0 ? ((ageGroups.anak.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-semibold">Remaja (SMP / SMA)</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600">13 - 18 Tahun</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.remaja.laki}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.remaja.perempuan}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{ageGroups.remaja.total}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{totalJiwa > 0 ? ((ageGroups.remaja.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-semibold">Usia Produktif (Dewasa / Bekerja)</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600">19 - 59 Tahun</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.dewasa.laki}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.dewasa.perempuan}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{ageGroups.dewasa.total}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{totalJiwa > 0 ? ((ageGroups.dewasa.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-semibold">Lanjut Usia (Lansia)</td>
                        <td className="border border-slate-300 p-1.5 text-slate-600">&ge; 60 Tahun</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.lansia.laki}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{ageGroups.lansia.perempuan}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">{ageGroups.lansia.total}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{totalJiwa > 0 ? ((ageGroups.lansia.total / totalJiwa) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Section II & III: Status & Pendidikan */}
                  <div className="grid grid-cols-2 gap-3 mb-3 font-sans text-xs">
                    <div>
                      <div className="font-bold text-xs uppercase text-emerald-900 mb-1">
                        II. Status Perkawinan
                      </div>
                      <table className="w-full border-collapse border border-slate-400">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 text-[10px] uppercase">
                            <th className="border border-slate-400 p-1 text-left">Status</th>
                            <th className="border border-slate-400 p-1 text-center">Jumlah</th>
                            <th className="border border-slate-400 p-1 text-center">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-300 p-1">Kawin</td>
                            <td className="border border-slate-300 p-1 text-center font-semibold">{kawinCount}</td>
                            <td className="border border-slate-300 p-1 text-center">{totalJiwa ? ((kawinCount/totalJiwa)*100).toFixed(1) : 0}%</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-1">Belum Kawin</td>
                            <td className="border border-slate-300 p-1 text-center font-semibold">{belumKawinCount}</td>
                            <td className="border border-slate-300 p-1 text-center">{totalJiwa ? ((belumKawinCount/totalJiwa)*100).toFixed(1) : 0}%</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-300 p-1">Janda / Duda</td>
                            <td className="border border-slate-300 p-1 text-center font-semibold">{jandaCount + dudaCount}</td>
                            <td className="border border-slate-300 p-1 text-center">{totalJiwa ? (((jandaCount+dudaCount)/totalJiwa)*100).toFixed(1) : 0}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <div className="font-bold text-xs uppercase text-emerald-900 mb-1">
                        III. Tingkat Pendidikan Teratas
                      </div>
                      <table className="w-full border-collapse border border-slate-400">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 text-[10px] uppercase">
                            <th className="border border-slate-400 p-1 text-left">Jenjang</th>
                            <th className="border border-slate-400 p-1 text-center">Jumlah</th>
                            <th className="border border-slate-400 p-1 text-center">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedEdu.slice(0, 3).map(([p, cnt]) => (
                            <tr key={p}>
                              <td className="border border-slate-300 p-1 truncate max-w-[120px]">{p}</td>
                              <td className="border border-slate-300 p-1 text-center font-semibold">{cnt}</td>
                              <td className="border border-slate-300 p-1 text-center">{totalJiwa ? ((cnt/totalJiwa)*100).toFixed(1) : 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section IV: Posisi Saldo Kas RT & Kas PKK */}
                  <div className="mb-4 font-sans text-xs">
                    <div className="font-bold text-xs uppercase text-emerald-900 mb-1 flex items-center justify-between">
                      <span>IV. Posisi Saldo Kas & Keuangan Lingkungan RT 02 (Kas Besar RT & Kas PKK)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Per {getTanggalCetak()}</span>
                    </div>
                    <table className="w-full border-collapse border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-[10px] uppercase">
                          <th className="border border-slate-400 p-1.5 text-left">Pos Dana / Satuan Keuangan</th>
                          <th className="border border-slate-400 p-1.5 text-center">Total Masuk (Rp)</th>
                          <th className="border border-slate-400 p-1.5 text-center">Total Keluar (Rp)</th>
                          <th className="border border-slate-400 p-1.5 text-right font-bold">Saldo Akhir (Rp)</th>
                          <th className="border border-slate-400 p-1.5 text-left">Keterangan Akun</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-semibold">1. Kas Kecil RT 02 (Iuran & Sosial)</td>
                          <td className="border border-slate-300 p-1.5 text-center">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalMasukKasKecil)}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalKeluarKasKecil)}</td>
                          <td className="border border-slate-300 p-1.5 text-right font-bold text-emerald-800">{new Intl.NumberFormat('id-ID').format(ringkasanKas.saldoKasKecil)}</td>
                          <td className="border border-slate-300 p-1.5 text-[10px] text-slate-600">Iuran rutin warga & operasional RT</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-semibold">2. Kas BOP RT 02 (Bantuan Pemkot)</td>
                          <td className="border border-slate-300 p-1.5 text-center">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalMasukKasBOP)}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalKeluarKasBOP)}</td>
                          <td className="border border-slate-300 p-1.5 text-right font-bold text-blue-800">{new Intl.NumberFormat('id-ID').format(ringkasanKas.saldoKasBOP)}</td>
                          <td className="border border-slate-300 p-1.5 text-[10px] text-slate-600">Bantuan Operasional Kelurahan</td>
                        </tr>
                        <tr className="bg-emerald-50/60">
                          <td className="border border-slate-300 p-1.5 font-bold text-emerald-950">Subtotal Kas Besar RT (Konsolidasi)</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalMasukKasBesar)}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalKeluarKasBesar)}</td>
                          <td className="border border-slate-300 p-1.5 text-right font-black text-emerald-900">{new Intl.NumberFormat('id-ID').format(ringkasanKas.totalSaldoKasBesar)}</td>
                          <td className="border border-slate-300 p-1.5 text-[10px] font-semibold text-emerald-800">Saldo Konsolidasi Kas RT 02</td>
                        </tr>
                        <tr className="bg-pink-50/40">
                          <td className="border border-slate-300 p-1.5 font-bold text-rose-950">3. Posisi Kas PKK RT 02</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-900">{new Intl.NumberFormat('id-ID').format(ringkasanKasPKK.totalMasuk)}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-900">{new Intl.NumberFormat('id-ID').format(ringkasanKasPKK.totalKeluar)}</td>
                          <td className="border border-slate-300 p-1.5 text-right font-black text-rose-800">{new Intl.NumberFormat('id-ID').format(ringkasanKasPKK.saldo)}</td>
                          <td className="border border-slate-300 p-1.5 text-[10px] font-semibold text-rose-900">Kelolaan Kader & Istri Warga ({pesertaPKKList.length} Anggota)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pengesahan Tanda Tangan */}
                  <div className="flex justify-between items-start mt-6 pt-2 font-serif text-slate-900 page-break-inside-avoid">
                    <div className="text-center w-52">
                      <div className="text-xs">Mengetahui,</div>
                      <div className="text-xs font-bold uppercase mb-1">
                        KETUA RT 02 RW 14 TANJUNG SARI
                      </div>
                      <div className="my-1.5 flex justify-center">
                        {qrKetuaUrl ? (
                          <img
                            src={qrKetuaUrl}
                            alt="QR Tanda Tangan Ketua RT"
                            className="w-20 h-20 border border-slate-300 p-1 rounded bg-white shadow-xs"
                          />
                        ) : (
                          <div className="w-20 h-20 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                            QR Memuat...
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold underline uppercase tracking-wide">
                        {ketuaRTName}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Ketua RT 02 RW 14 Tanjung Sari
                      </div>
                    </div>

                    <div className="text-center w-52">
                      <div className="text-xs">Semarang, {getTanggalCetak()}</div>
                      <div className="text-xs font-bold uppercase mb-1">
                        ADMINISTRATOR / SEKRETARIS RT
                      </div>
                      <div className="my-1.5 flex justify-center">
                        {qrAdminUrl ? (
                          <img
                            src={qrAdminUrl}
                            alt="QR Tanda Tangan Sekretaris RT"
                            className="w-20 h-20 border border-slate-300 p-1 rounded bg-white shadow-xs"
                          />
                        ) : (
                          <div className="w-20 h-20 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                            QR Memuat...
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold underline uppercase tracking-wide">
                        {sekretarisRTName}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Administrator / Sekretaris RT 02 RW 14
                      </div>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="mt-6 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] font-sans text-slate-500">
                    <span>
                      Sistem Informasi Manajemen BerkahOne &bull; RT 02 RW 14 Tanjung Sari, Kelurahan Pedurungan Tengah
                    </span>
                    <span>
                      Dicetak pada: {getTanggalCetak()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0 print:hidden">
              <span className="flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Format cetak A4 kedinasan dilengkapi validasi QR Code resmi BerkahOne RT 02 RW 14 Tanjung Sari.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 font-semibold rounded cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
