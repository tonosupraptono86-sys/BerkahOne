import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Warga } from '../types';
import { calculateAge, formatIndoDate } from '../utils/dateUtils';
import { LOGO_SEMARANG_URL, LOGO_SEMARANG_DATA_URI } from '../data/logoSemarang';
import { LogoSemarang } from './LogoSemarang';
import { 
  Printer, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText,
  Users,
  User,
  X,
  CheckCircle2,
  PenTool,
  Send,
  FileCheck
} from 'lucide-react';

interface SuratPengantarProps {
  initialWarga?: Warga | null;
}

export const SuratPengantar: React.FC<SuratPengantarProps> = ({ initialWarga }) => {
  const { wargaList, users } = useApp();

  // Find default Ketua and Sekretaris from users list
  const defaultKetua = useMemo(() => {
    const k = users.find(u => u.role === 'superadmin' || u.role === 'ketua_rt');
    return k?.nama || 'Ali Muhtarom, S.T';
  }, [users]);

  const defaultSekretaris = useMemo(() => {
    const s = users.find(u => u.role === 'sekretaris');
    return s?.nama || 'Supraptono';
  }, [users]);

  const [selectedWargaId, setSelectedWargaId] = useState<string>(() => {
    return initialWarga?.id || (wargaList.length > 0 ? wargaList[0].id : '');
  });

  // Atribut Surat
  const [nomorSurat, setNomorSurat] = useState<string>('042/SP/RT.02-RW.14/IX/2026');
  const [lampiranSurat, setLampiranSurat] = useState<string>('-');
  const [halSurat, setHalSurat] = useState<string>('Pengantar');

  // Tujuan Surat (Kepada Yth.)
  const [tujuanKepada, setTujuanKepada] = useState<string>('Bapak / Ibu Lurah Pedurungan Tengah');
  const [tujuanKota, setTujuanKota] = useState<string>('SEMARANG');

  // Keperluan & Keterangan
  const [keperluan, setKeperluan] = useState<string>('Pengurusan Kartu Tanda Penduduk (KTP-el) di Kelurahan');
  const [customKeperluan, setCustomKeperluan] = useState<string>('');
  const [keteranganLain, setKeteranganLain] = useState<string>(
    'Bahwa orang tersebut di atas adalah benar-benar warga kami yang bertempat tinggal di RT 02 RW 14 Kelurahan Pedurungan Tengah dan berkelakuan baik.'
  );

  // 2 Kolom Tanda Tangan:
  // Kolom Kiri: Mengetahui KETUA RW 14
  const [namaKetuaRw, setNamaKetuaRw] = useState<string>('');
  // Kolom Kanan: Tanggal penerbitan Semarang dan tanda tangan Ketua RT 02: Ali Muhtarom, S.T
  const [penandatangan, setPenandatangan] = useState<string>(defaultKetua);
  const [jabatan, setJabatan] = useState<string>('Ketua RT 02');

  // Search & Picker states
  const [wargaSearch, setWargaSearch] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState<boolean>(false);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalFilterStatus, setModalFilterStatus] = useState<string>('all');
  
  // Notification states
  const [copied, setCopied] = useState<boolean>(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync initialWarga when it changes from outside
  useEffect(() => {
    if (initialWarga) {
      setSelectedWargaId(initialWarga.id);
    } else if (!selectedWargaId && wargaList.length > 0) {
      setSelectedWargaId(wargaList[0].id);
    }
  }, [initialWarga, wargaList, selectedWargaId]);

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedWarga: Warga | undefined = useMemo(() => {
    return wargaList.find((w) => w.id === selectedWargaId) || wargaList[0];
  }, [wargaList, selectedWargaId]);

  // Live filtered suggestions for the search input dropdown
  const searchSuggestions = useMemo(() => {
    if (!wargaSearch.trim()) {
      return wargaList.slice(0, 8);
    }
    const q = wargaSearch.toLowerCase().trim();
    return wargaList.filter((w) =>
      w.nama.toLowerCase().includes(q) ||
      w.nik.includes(q) ||
      w.noKk.includes(q) ||
      (w.alamat && w.alamat.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [wargaList, wargaSearch]);

  // All warga sorted alphabetically for native select
  const sortedWargaList = useMemo(() => {
    return [...wargaList].sort((a, b) => a.nama.localeCompare(b.nama));
  }, [wargaList]);

  // Modal filtered list
  const modalFilteredWarga = useMemo(() => {
    return wargaList.filter((w) => {
      const matchQuery = !modalSearch.trim() || 
        w.nama.toLowerCase().includes(modalSearch.toLowerCase()) ||
        w.nik.includes(modalSearch) ||
        w.noKk.includes(modalSearch) ||
        (w.alamat && w.alamat.toLowerCase().includes(modalSearch.toLowerCase()));

      const matchStatus = modalFilterStatus === 'all' || 
        (modalFilterStatus === 'kepala' && w.statusKeluarga.toLowerCase().includes('kepala')) ||
        (modalFilterStatus === 'istri' && w.statusKeluarga.toLowerCase().includes('istri')) ||
        (modalFilterStatus === 'anak' && w.statusKeluarga.toLowerCase().includes('anak')) ||
        (modalFilterStatus === 'laki' && w.jenisKelamin === 'Laki-laki') ||
        (modalFilterStatus === 'perempuan' && w.jenisKelamin === 'Perempuan');

      return matchQuery && matchStatus;
    });
  }, [wargaList, modalSearch, modalFilterStatus]);

  const handleSelectWarga = (warga: Warga) => {
    setSelectedWargaId(warga.id);
    setWargaSearch('');
    setIsSearchFocused(false);
    setIsPickerModalOpen(false);
    setPrintNotice(`Warga pemohon terpilih: ${warga.nama} (NIK: ${warga.nik})`);
  };

  const todayStr = formatIndoDate(new Date().toISOString().slice(0, 10));
  const finalKeperluan = keperluan === 'Lainnya' ? customKeperluan || 'Keperluan Administrasi' : keperluan;

  // Generate standalone printable HTML content with embedded colored logo
  const getPrintableHtml = () => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Surat Pengantar RT 02 RW 14 - ${selectedWarga?.nama || 'Warga'}</title>
  <style>
    @page { 
      size: A4 portrait; 
      margin: 15mm 20mm 15mm 20mm; 
    }
    * { box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', Times, serif; 
      font-size: 11.5pt; 
      line-height: 1.45; 
      color: #000000; 
      background: #ffffff;
      margin: 0; 
      padding: 15px 25px; 
    }
    .kop-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      border-bottom: 3.5px double #000000;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .kop-logo {
      width: 80px;
      height: 98px;
      margin-right: 16px;
      flex-shrink: 0;
    }
    .kop-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .kop-text {
      flex: 1;
      text-align: center;
      padding-right: 30px;
    }
    .kop-kota { margin: 0; font-size: 15.5pt; font-weight: bold; letter-spacing: 0.8px; line-height: 1.25; }
    .kop-text h3 { margin: 0; font-size: 13pt; font-weight: bold; letter-spacing: 0.5px; line-height: 1.25; }
    .kop-text h2 { margin: 1px 0; font-size: 14pt; font-weight: bold; letter-spacing: 0.5px; line-height: 1.25; }
    .kop-text h1 { margin: 2px 0; font-size: 15pt; font-weight: bold; letter-spacing: 0.5px; line-height: 1.25; }
    .kop-text p { margin: 3px 0 0 0; font-size: 9.5pt; font-family: Arial, Helvetica, sans-serif; }
    
    .surat-header-table {
      width: 100%;
      margin-bottom: 14px;
      border-collapse: collapse;
    }
    .surat-header-table td {
      vertical-align: top;
      font-size: 11pt;
    }
    .meta-table td {
      padding: 1px 2px;
      font-size: 11pt;
    }
    .tujuan-box {
      font-size: 11pt;
      line-height: 1.35;
      padding-left: 20px;
    }

    .title { text-align: center; margin: 10px 0 14px 0; }
    .title h4 { text-decoration: underline; margin: 0; font-size: 13pt; font-weight: bold; letter-spacing: 1.5px; }
    
    .intro { margin-bottom: 8px; font-size: 11.5pt; text-align: justify; text-indent: 28px; line-height: 1.45; }
    
    table.data { width: 100%; border-collapse: collapse; margin: 6px 0 10px 0; font-size: 11pt; }
    table.data td { padding: 2.5px 3px; vertical-align: top; }

    table.ttd-2col { width: 100%; margin-top: 36px; border-collapse: collapse; font-size: 11pt; }
    table.ttd-2col td { text-align: center; width: 50%; vertical-align: top; padding: 0 15px; }
    
    .no-print-bar {
      background: #064e3b; 
      color: white; 
      padding: 12px 18px; 
      margin-bottom: 20px;
      font-family: system-ui, -apple-system, sans-serif; 
      font-size: 13px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .no-print-btn {
      background: #ffffff; 
      color: #064e3b; 
      border: none; 
      padding: 8px 18px; 
      font-weight: bold; 
      font-size: 13px; 
      border-radius: 6px; 
      cursor: pointer;
    }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Dokumen Siap Cetak:</strong> Surat Pengantar RT 02 RW 14 (${selectedWarga?.nama || 'Warga'}) &bull; Logo Kota Semarang Berwarna
    </div>
    <button class="no-print-btn" onclick="window.print()">🖨️ Cetak Dokumen Sekarang</button>
  </div>

  <!-- Kop Surat Kedinasan: Logo Kota Semarang berwarna di sisi kiri atas -->
  <div class="kop-wrapper">
    <div class="kop-logo">
      <img src="${LOGO_SEMARANG_DATA_URI}" alt="Logo Kota Semarang" />
    </div>
    <div class="kop-text">
      <h2 class="kop-kota">KOTA SEMARANG</h2>
      <h3>KECAMATAN PEDURUNGAN</h3>
      <h2>KELURAHAN PEDURUNGAN TENGAH</h2>
      <h1>RT 02 RW 14</h1>
    </div>
  </div>

  <!-- Tujuan Surat (Kepada Yth.) & Nomor / Lampiran / Hal -->
  <table class="surat-header-table">
    <tr>
      <!-- Kolom kiri atas: Nomor diisi nomor surat, Lampiran dikosongkan, Hal diisi Pengantar -->
      <td style="width: 50%;">
        <table class="meta-table" border="0">
          <tr>
            <td style="width: 75px;">Nomor</td>
            <td style="width: 15px;">:</td>
            <td><strong>${nomorSurat}</strong></td>
          </tr>
          <tr>
            <td>Lampiran</td>
            <td>:</td>
            <td>${lampiranSurat || '-'}</td>
          </tr>
          <tr>
            <td>Hal</td>
            <td>:</td>
            <td><strong>${halSurat}</strong></td>
          </tr>
        </table>
      </td>

      <!-- Kolom tujuan di kanan atas (default: Kepada Yth. Bapak / Ibu Lurah Pedurungan Tengah di SEMARANG) -->
      <td style="width: 50%; text-align: left;">
        <div class="tujuan-box">
          Kepada Yth.<br>
          <strong>${tujuanKepada}</strong><br>
          di -<br>
          &nbsp;&nbsp;&nbsp;&nbsp;<u><strong>${tujuanKota}</strong></u>
        </div>
      </td>
    </tr>
  </table>

  <div class="intro" style="margin-top: 20px;">
    Yang bertanda tangan di bawah ini Pengurus RT 02 RW 14 Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang, dengan ini menerangkan bahwa:
  </div>

  <!-- Data Pemohon Format Blanko Resmi (1-11) -->
  <table class="data">
    <tr>
      <td style="width: 35%;">1. Nama Lengkap</td>
      <td style="width: 3%;">:</td>
      <td style="width: 62%;"><strong>${(selectedWarga?.nama || '-').toUpperCase()}</strong></td>
    </tr>
    <tr>
      <td>2. Tempat, Tanggal Lahir</td>
      <td>:</td>
      <td>${selectedWarga?.tempatLahir || '-'}, ${selectedWarga?.tglLahir || '-'} (${calculateAge(selectedWarga?.tglLahir || '')} Tahun)</td>
    </tr>
    <tr>
      <td>3. Jenis Kelamin</td>
      <td>:</td>
      <td>${selectedWarga?.jenisKelamin || '-'}</td>
    </tr>
    <tr>
      <td>4. Kewarganegaraan / Agama</td>
      <td>:</td>
      <td>WNI / ${selectedWarga?.agama || '-'}</td>
    </tr>
    <tr>
      <td>5. Pekerjaan</td>
      <td>:</td>
      <td>${selectedWarga?.pekerjaan || selectedWarga?.pendidikan || 'Wiraswasta / Karyawan'}</td>
    </tr>
    <tr>
      <td>6. Status Perkawinan</td>
      <td>:</td>
      <td>${selectedWarga?.statusPerkawinan || '-'}</td>
    </tr>
    <tr>
      <td>7. Nomor Induk Kependudukan (NIK)</td>
      <td>:</td>
      <td><strong>${selectedWarga?.nik || '-'}</strong></td>
    </tr>
    <tr>
      <td>8. Nomor Kartu Keluarga (KK)</td>
      <td>:</td>
      <td>${selectedWarga?.noKk || '-'}</td>
    </tr>
    <tr>
      <td>9. Alamat / Tempat Tinggal</td>
      <td>:</td>
      <td>${selectedWarga?.alamat || 'RT 02 RW 14 Kelurahan Pedurungan Tengah, Kota Semarang'}</td>
    </tr>
    <tr>
      <td>10. Maksud / Keperluan</td>
      <td>:</td>
      <td><strong>${finalKeperluan}</strong></td>
    </tr>
    <tr>
      <td>11. Keterangan Lain-lain</td>
      <td>:</td>
      <td>${keteranganLain}</td>
    </tr>
  </table>

  <div class="intro" style="margin-top: 10px;">
    Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
  </div>

  <!-- 2 Kolom Tanda Tangan Standar Lampiran RT/RW -->
  <table class="ttd-2col">
    <tr>
      <!-- Kolom Kiri: Mengetahui KETUA RW 14 -->
      <td>
        Mengetahui,<br>
        <strong>KETUA RW 14</strong>
        <div style="height: 75px;"></div>
        <strong>( ${namaKetuaRw ? namaKetuaRw : '..................................................'} )</strong>
      </td>

      <!-- Kolom Kanan: Tanggal penerbitan Semarang dan tanda tangan Ketua RT 02: Ali Muhtarom, S.T -->
      <td>
        Semarang, ${todayStr}<br>
        <strong>${jabatan.toUpperCase()}</strong>
        <div style="height: 75px;"></div>
        <u><strong>( ${penandatangan} )</strong></u>
      </td>
    </tr>
  </table>

  <script>
    window.onload = function() {
      setTimeout(function() {
        try { window.print(); } catch(e) {}
      }, 500);
    };
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    setPrintNotice(null);
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print failed:', e);
    }

    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (inIframe) {
      setPrintNotice('Sedang membuka tab cetak dengan format blanko resmi...');
      setTimeout(() => {
        handleOpenPrintTab();
      }, 300);
    }
  };

  const handleOpenPrintTab = () => {
    try {
      const html = getPrintableHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        const safeName = (selectedWarga?.nama || 'Warga').replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `Cetak_Surat_Pengantar_RT02_${safeName}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setPrintNotice('File dokumen cetak berhasil diunduh. Buka file untuk langsung mencetak dokumen.');
      } else {
        setPrintNotice(null);
      }
    } catch (err) {
      console.error(err);
      handleDownloadWord();
    }
  };

  const handleDownloadWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Surat Pengantar RT 02 RW 14</title>
        <style>
          @page {
            size: 21cm 29.7cm; /* A4 */
            margin: 2cm 2cm 2cm 2cm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11.5pt;
            line-height: 1.4;
            color: #000000;
          }
          table.kop-table { width: 100%; border-bottom: 3.5px double #000000; padding-bottom: 8px; margin-bottom: 14px; }
          .kop-kota { margin: 0; font-size: 15.5pt; font-weight: bold; text-align: center; letter-spacing: 0.5px; }
          .kop-h3 { margin: 0; font-size: 13pt; font-weight: bold; text-align: center; }
          .kop-h2 { margin: 1px 0; font-size: 13.5pt; font-weight: bold; text-align: center; }
          .kop-h1 { margin: 2px 0; font-size: 15pt; font-weight: bold; text-align: center; }
          .kop-sub { margin: 3px 0 0 0; font-size: 9.5pt; font-style: italic; text-align: center; }
          table.header-table { width: 100%; margin-bottom: 14px; border-collapse: collapse; }
          table.header-table td { vertical-align: top; font-size: 11pt; }
          table.data { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table.data td { padding: 3px; font-size: 11pt; vertical-align: top; }
          table.ttd { width: 100%; margin-top: 35px; border-collapse: collapse; }
          table.ttd td { width: 50%; text-align: center; vertical-align: top; font-size: 11pt; padding: 0 15px; }
        </style>
      </head>
      <body>
        <!-- Kop Surat Kedinasan -->
        <table class="kop-table" border="0">
          <tr>
            <td width="90" align="center" valign="middle">
              <img src="${LOGO_SEMARANG_DATA_URI}" width="75" height="95" alt="Logo Kota Semarang" />
            </td>
            <td align="center" valign="middle">
              <div class="kop-kota">KOTA SEMARANG</div>
              <div class="kop-h3">KECAMATAN PEDURUNGAN</div>
              <div class="kop-h2">KELURAHAN PEDURUNGAN TENGAH</div>
              <div class="kop-h1">RT 02 RW 14</div>
            </td>
          </tr>
        </table>

        <!-- Header: Nomor, Lampiran, Hal (kiri) & Kepada Yth (kanan) -->
        <table class="header-table" border="0">
          <tr>
            <td width="50%">
              <table border="0" style="font-size: 11pt;">
                <tr>
                  <td width="70">Nomor</td>
                  <td width="15">:</td>
                  <td><strong>${nomorSurat}</strong></td>
                </tr>
                <tr>
                  <td>Lampiran</td>
                  <td>:</td>
                  <td>${lampiranSurat || '-'}</td>
                </tr>
                <tr>
                  <td>Hal</td>
                  <td>:</td>
                  <td><strong>${halSurat}</strong></td>
                </tr>
              </table>
            </td>
            <td width="50%" align="left">
              <div style="font-size: 11pt; padding-left: 20px;">
                Kepada Yth.<br>
                <strong>${tujuanKepada}</strong><br>
                di -<br>
                &nbsp;&nbsp;&nbsp;&nbsp;<u><strong>${tujuanKota}</strong></u>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin-top: 18px; margin-bottom: 8px; text-indent: 28px; text-align: justify;">
          Yang bertanda tangan di bawah ini Pengurus RT 02 RW 14 Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang, dengan ini menerangkan bahwa:
        </p>

        <!-- Data Pemohon Format Blanko Resmi (1-11) -->
        <table class="data">
          <tr>
            <td style="width: 35%;">1. Nama Lengkap</td>
            <td style="width: 3%;">:</td>
            <td style="width: 62%;"><strong>${(selectedWarga?.nama || '-').toUpperCase()}</strong></td>
          </tr>
          <tr>
            <td>2. Tempat, Tanggal Lahir</td>
            <td>:</td>
            <td>${selectedWarga?.tempatLahir || '-'}, ${selectedWarga?.tglLahir || '-'} (${calculateAge(selectedWarga?.tglLahir || '')} Tahun)</td>
          </tr>
          <tr>
            <td>3. Jenis Kelamin</td>
            <td>:</td>
            <td>${selectedWarga?.jenisKelamin || '-'}</td>
          </tr>
          <tr>
            <td>4. Kewarganegaraan / Agama</td>
            <td>:</td>
            <td>WNI / ${selectedWarga?.agama || '-'}</td>
          </tr>
          <tr>
            <td>5. Pekerjaan</td>
            <td>:</td>
            <td>${selectedWarga?.pekerjaan || selectedWarga?.pendidikan || 'Wiraswasta / Karyawan'}</td>
          </tr>
          <tr>
            <td>6. Status Perkawinan</td>
            <td>:</td>
            <td>${selectedWarga?.statusPerkawinan || '-'}</td>
          </tr>
          <tr>
            <td>7. Nomor Induk Kependudukan (NIK)</td>
            <td>:</td>
            <td><strong>${selectedWarga?.nik || '-'}</strong></td>
          </tr>
          <tr>
            <td>8. Nomor Kartu Keluarga (KK)</td>
            <td>:</td>
            <td>${selectedWarga?.noKk || '-'}</td>
          </tr>
          <tr>
            <td>9. Alamat / Tempat Tinggal</td>
            <td>:</td>
            <td>${selectedWarga?.alamat || 'RT 02 RW 14 Kelurahan Pedurungan Tengah, Kota Semarang'}</td>
          </tr>
          <tr>
            <td>10. Maksud / Keperluan</td>
            <td>:</td>
            <td><strong>${finalKeperluan}</strong></td>
          </tr>
          <tr>
            <td>11. Keterangan Lain-lain</td>
            <td>:</td>
            <td>${keteranganLain}</td>
          </tr>
        </table>

        <p style="margin-top: 10px; text-indent: 28px; text-align: justify;">
          Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
        </p>

        <!-- 2 Kolom Tanda Tangan Standar Lampiran RT/RW -->
        <table class="ttd">
          <tr>
            <!-- Kolom Kiri: Mengetahui KETUA RW 14 -->
            <td>
              Mengetahui,<br>
              <strong>KETUA RW 14</strong>
              <br><br><br><br><br>
              <strong>( ${namaKetuaRw ? namaKetuaRw : '..................................................'} )</strong>
            </td>

            <!-- Kolom Kanan: Tanggal penerbitan Semarang dan tanda tangan Ketua RT 02: Ali Muhtarom, S.T -->
            <td>
              Semarang, ${todayStr}<br>
              <strong>${jabatan.toUpperCase()}</strong>
              <br><br><br><br><br>
              <u><strong>( ${penandatangan} )</strong></u>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (selectedWarga?.nama || 'Warga').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `Surat_Pengantar_RT02_${safeName}_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPrintNotice('File dokumen Word (.doc) berhasil diunduh dengan logo Semarang berwarna dan format baru.');
  };

  const handleCopyText = () => {
    const text = `KOTA SEMARANG
KECAMATAN PEDURUNGAN
KELURAHAN PEDURUNGAN TENGAH
RT 02 RW 14

Nomor    : ${nomorSurat}
Lampiran : ${lampiranSurat || '-'}
Hal      : ${halSurat}

Kepada Yth.
${tujuanKepada}
di - ${tujuanKota}

Yang bertanda tangan di bawah ini Pengurus RT 02 RW 14 Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang, menerangkan bahwa:
1. Nama Lengkap           : ${(selectedWarga?.nama || '-').toUpperCase()}
2. Tempat / Tanggal Lahir : ${selectedWarga?.tempatLahir || '-'}, ${selectedWarga?.tglLahir || '-'} (${calculateAge(selectedWarga?.tglLahir || '')} Tahun)
3. Jenis Kelamin          : ${selectedWarga?.jenisKelamin || '-'}
4. Kewarganegaraan/Agama  : WNI / ${selectedWarga?.agama || '-'}
5. Pekerjaan              : ${selectedWarga?.pekerjaan || selectedWarga?.pendidikan || '-'}
6. Status Perkawinan      : ${selectedWarga?.statusPerkawinan || '-'}
7. No. KTP / NIK          : ${selectedWarga?.nik || '-'}
8. No. Kartu Keluarga     : ${selectedWarga?.noKk || '-'}
9. Alamat                 : ${selectedWarga?.alamat || '-'}
10. Maksud / Keperluan    : ${finalKeperluan}
11. Keterangan Lain-lain  : ${keteranganLain}

Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.

Mengetahui,
KETUA RW 14
( ${namaKetuaRw || '..............................'} )

Semarang, ${todayStr}
${jabatan},
( ${penandatangan} )`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Generator Controls (Hidden when printing) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl shrink-0">
              <LogoSemarang className="w-9 h-11" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Penerbitan Surat Pengantar RT Resmi
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded-full">
                  Format Standar Pemkot Semarang
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kop Kedinasan Logo Semarang Berwarna &bull; Nomor, Lampiran, Hal &bull; Blanko 11 Poin Data &bull; 2 Kolom Tanda Tangan (Ketua RW &amp; Ketua RT)
              </p>
            </div>
          </div>

          {/* Action Buttons: Multi-mode Print, Word Download, Clean Tab, Copy */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              title="Cetak surat langsung lewat browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              title="Unduh format Microsoft Word (.doc) lengkap dengan kop & logo berwarna"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Unduh Word (.doc)</span>
            </button>

            <button
              onClick={handleOpenPrintTab}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Buka dokumen di tab baru untuk cetak bebas hambatan"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Buka Tab Cetak</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Salin teks isi surat ke clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Helpful notification/tip banner */}
        {printNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{printNotice}</span>
            </div>
            <button 
              onClick={() => setPrintNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold px-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Kolom 1: Pilih Warga Pemohon */}
          <div className="space-y-2" ref={searchContainerRef}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Pilih Warga Pemohon:</span>
              </label>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <Users className="w-3 h-3" />
                <span>Daftar Warga (118)</span>
              </button>
            </div>

            {/* Quick Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={wargaSearch}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setWargaSearch(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Ketik nama atau NIK warga..."
                className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
              {wargaSearch && (
                <button
                  type="button"
                  onClick={() => setWargaSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>Hasil Pencarian ({searchSuggestions.length} ditemukan):</span>
                    <button
                      type="button"
                      onClick={() => setIsPickerModalOpen(true)}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Lihat Semua 118 Warga &rarr;
                    </button>
                  </div>

                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((w) => {
                      const isCurrent = w.id === selectedWargaId;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => handleSelectWarga(w)}
                          className={`w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                            isCurrent ? 'bg-emerald-50/70 border-l-3 border-emerald-700' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                              <span>{w.nama}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded">
                                  Terpilih
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              NIK: {w.nik} &bull; {w.statusKeluarga}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {w.alamat}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full mt-1">
                            Pilih
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Tidak ada warga yang sesuai dengan "{wargaSearch}".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Native Select fallback listing all warga sorted A-Z */}
            <div className="pt-0.5">
              <select
                value={selectedWargaId}
                onChange={(e) => {
                  const found = wargaList.find((w) => w.id === e.target.value);
                  if (found) {
                    handleSelectWarga(found);
                  }
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none font-medium cursor-pointer"
              >
                {sortedWargaList.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama} — NIK: {w.nik} ({w.statusKeluarga})
                  </option>
                ))}
              </select>
            </div>

            {/* Maksud / Keperluan */}
            <div className="pt-1 space-y-1">
              <label className="font-bold text-slate-700 block">10. Maksud / Keperluan:</label>
              <select
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none font-medium"
              >
                <option value="Pengurusan Kartu Tanda Penduduk (KTP-el) di Kelurahan">Pengurusan KTP-el</option>
                <option value="Penerbitan / Pembaruan Kartu Keluarga (KK)">Pembaruan Kartu Keluarga (KK)</option>
                <option value="Surat Keterangan Domisili Tempat Tinggal">Keterangan Domisili Tempat Tinggal</option>
                <option value="Pengantar Permohonan Surat Keterangan Catatan Kepolisian (SKCK)">Pengantar SKCK</option>
                <option value="Pengurusan Surat Keterangan Tidak Mampu (SKTM) / KIS / BPJS">Pengurusan SKTM / BPJS / KIS</option>
                <option value="Pengantar Pernikahan (Model N1-N4) ke Kelurahan">Pengantar Pernikahan (N1 - N4)</option>
                <option value="Surat Pengantar Pindah Domisili Keluar / Datang">Pengantar Pindah / Datang Domisili</option>
                <option value="Pengurusan Akta Kelahiran / Akta Kematian">Pengurusan Akta Kelahiran / Kematian</option>
                <option value="Keterangan Usaha / UMKM Warga RT 02">Keterangan Usaha / UMKM</option>
                <option value="Lainnya">Keperluan Lainnya...</option>
              </select>

              {keperluan === 'Lainnya' && (
                <input
                  type="text"
                  value={customKeperluan}
                  onChange={(e) => setCustomKeperluan(e.target.value)}
                  placeholder="Tuliskan keperluan spesifik..."
                  className="w-full p-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                />
              )}
            </div>
          </div>

          {/* Kolom 2: Nomor, Lampiran, Hal & Tujuan Surat */}
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kolom Kiri Atas (Nomor, Lampiran, Hal):</span>
              </label>

              <div className="space-y-1.5">
                <div>
                  <span className="text-[11px] text-slate-600 block">Nomor Surat:</span>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Nomor Register Surat"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-600 block">Lampiran:</span>
                    <input
                      type="text"
                      value={lampiranSurat}
                      onChange={(e) => setLampiranSurat(e.target.value)}
                      placeholder="-"
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-emerald-600 outline-none text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block">Hal:</span>
                    <input
                      type="text"
                      value={halSurat}
                      onChange={(e) => setHalSurat(e.target.value)}
                      placeholder="Pengantar"
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kolom Kanan Atas (Tujuan Surat):</span>
              </label>
              
              <div className="space-y-1.5">
                <div>
                  <span className="text-[11px] text-slate-600 block">Kepada Yth.:</span>
                  <input
                    type="text"
                    value={tujuanKepada}
                    onChange={(e) => setTujuanKepada(e.target.value)}
                    placeholder="Bapak / Ibu Lurah Pedurungan Tengah"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block">Di Kota:</span>
                  <input
                    type="text"
                    value={tujuanKota}
                    onChange={(e) => setTujuanKota(e.target.value)}
                    placeholder="SEMARANG"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-emerald-600 outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 3: 2 Kolom Tanda Tangan (Ketua RW & Ketua RT) + Keterangan */}
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Pengesahan Tanda Tangan (2 Kolom):</span>
                </label>
              </div>

              {/* Kolom Kanan: Tanggal & Tanda Tangan Ketua RT 02 */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Kolom Kanan (Ketua RT 02):</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPenandatangan(defaultKetua);
                        setJabatan('Ketua RT 02');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        penandatangan === defaultKetua ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Ali Muhtarom
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPenandatangan(defaultSekretaris);
                        setJabatan('Sekretaris RT 02');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        penandatangan === defaultSekretaris ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Supraptono
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={penandatangan}
                    onChange={(e) => setPenandatangan(e.target.value)}
                    placeholder="Nama Ketua RT"
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-emerald-600 outline-none"
                  />
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Jabatan"
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Kolom Kiri: Mengetahui KETUA RW 14 */}
              <div className="space-y-1 pt-1.5 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Kolom Kiri (Mengetahui KETUA RW 14):
                </span>
                <input
                  type="text"
                  value={namaKetuaRw}
                  onChange={(e) => setNamaKetuaRw(e.target.value)}
                  placeholder="Nama Ketua RW (atau kosongkan untuk tanda tangan basah)"
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-emerald-600 outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  *Jika dikosongkan, akan dicetak garis titik-titik untuk tanda tangan &amp; stempel basah di RW.
                </p>
              </div>
            </div>

            {/* 11. Keterangan Lain-lain */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">11. Keterangan Lain-lain:</label>
              <textarea
                rows={2}
                value={keteranganLain}
                onChange={(e) => setKeteranganLain(e.target.value)}
                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Selected Warga Highlight Card */}
        {selectedWarga && (
          <div className="p-3 bg-gradient-to-r from-emerald-50/80 to-slate-50 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                {selectedWarga.nama.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{selectedWarga.nama}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded-full">
                    {selectedWarga.statusKeluarga}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-200/70 rounded-full">
                    {selectedWarga.jenisKelamin}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="font-mono">NIK: <strong>{selectedWarga.nik}</strong></span>
                  <span className="font-mono">No. KK: {selectedWarga.noKk}</span>
                  <span>{selectedWarga.alamat}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPickerModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ganti Pemohon</span>
            </button>
          </div>
        )}
      </div>

      {/* Full Citizen Picker Modal */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-sm">Pilih Warga Pemohon Surat Pengantar</h3>
                  <p className="text-[11px] text-emerald-200">
                    Total {wargaList.length} Warga Terdaftar di RT 02 RW 14 Tanjung Sari
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Chips */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Ketik nama warga, NIK, nomor KK, atau alamat..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
                {modalSearch && (
                  <button
                    type="button"
                    onClick={() => setModalSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-500 font-semibold mr-1">Filter:</span>
                {[
                  { id: 'all', label: 'Semua Warga' },
                  { id: 'kepala', label: 'Kepala Keluarga' },
                  { id: 'istri', label: 'Istri' },
                  { id: 'anak', label: 'Anak' },
                  { id: 'laki', label: 'Laki-laki' },
                  { id: 'perempuan', label: 'Perempuan' }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setModalFilterStatus(chip.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      modalFilterStatus === chip.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Citizen List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
              {modalFilteredWarga.length > 0 ? (
                modalFilteredWarga.map((w) => {
                  const isSelected = w.id === selectedWargaId;
                  return (
                    <div
                      key={w.id}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-emerald-50/60 border border-emerald-200' : ''
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs uppercase">{w.nama}</span>
                          <span className="px-2 py-0.2 text-[10px] font-semibold text-emerald-800 bg-emerald-100 rounded-full">
                            {w.statusKeluarga}
                          </span>
                          <span className="px-2 py-0.2 text-[10px] font-medium text-slate-600 bg-slate-100 rounded-full">
                            {w.jenisKelamin}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex flex-wrap gap-x-3">
                          <span>NIK: <strong>{w.nik}</strong></span>
                          <span>No KK: {w.noKk}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {w.alamat} &bull; {w.pekerjaan || 'Wiraswasta'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectWarga(w)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white border border-emerald-300'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Terpilih</span>
                          </>
                        ) : (
                          <span>Pilih Warga Ini</span>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-700">Tidak ada warga yang sesuai pencarian.</p>
                  <p>Coba kata kunci lain atau pilih filter Semua Warga.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-6 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Menampilkan {modalFilteredWarga.length} dari {wargaList.length} warga RT 02 RW 14</span>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Document (A4 format sesuai spesifikasi user) */}
      <div 
        id="printable-surat"
        className="bg-white rounded-2xl border border-slate-200 shadow-md p-10 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none text-slate-900 leading-relaxed font-serif"
      >
        {/* Kop Surat Kedinasan: Logo Kota Semarang berwarna di sisi kiri atas & Susunan Instansi Berjenjang */}
        <div className="border-b-4 border-double border-slate-900 pb-3 flex items-center justify-between gap-4">
          <div className="shrink-0 pl-1">
            <img 
              src={LOGO_SEMARANG_URL} 
              alt="Logo Resmi Kota Semarang" 
              className="w-20 h-24 object-contain"
            />
          </div>

          <div className="flex-1 text-center pr-8">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 leading-tight">
              KOTA SEMARANG
            </h2>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 leading-tight">
              KECAMATAN PEDURUNGAN
            </h2>
            <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 leading-tight">
              KELURAHAN PEDURUNGAN TENGAH
            </h1>
            <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 leading-tight">
              RT 02 RW 14
            </h1>
          </div>
        </div>

        {/* Tujuan Surat (Kepada Yth.) & Kolom Kiri Atas (Nomor, Lampiran, Hal) */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-serif">
          {/* Kolom kiri atas: Nomor, Lampiran, Hal */}
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-3 text-slate-700">Nomor</span>
              <span className="col-span-9 font-bold text-slate-900">: {nomorSurat}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-3 text-slate-700">Lampiran</span>
              <span className="col-span-9 text-slate-800">: {lampiranSurat || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-3 text-slate-700">Hal</span>
              <span className="col-span-9 font-bold text-slate-900">: {halSurat}</span>
            </div>
          </div>

          {/* Kolom tujuan di kanan atas: Kepada Yth */}
          <div className="flex justify-end">
            <div className="text-left space-y-0.5 min-w-[220px]">
              <p className="text-slate-700">Kepada Yth.</p>
              <p className="font-bold text-slate-900">{tujuanKepada}</p>
              <p className="text-slate-700">di -</p>
              <p className="font-bold text-slate-900 pl-4 underline tracking-wider">{tujuanKota}</p>
            </div>
          </div>
        </div>

        {/* Body Paragraph */}
        <div className="mt-6 text-xs space-y-3 font-serif">
          <p className="indent-8 text-justify leading-relaxed">
            Yang bertanda tangan di bawah ini Pengurus RT 02 RW 14 Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang, dengan ini menerangkan bahwa:
          </p>

          {/* Data Pemohon Format Blanko Resmi (1 s/d 11) */}
          <div className="pl-4 pr-2 space-y-1.5 text-xs">
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">1. Nama Lengkap</span>
              <span className="col-span-8 font-bold text-slate-900 uppercase">: {selectedWarga?.nama || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">2. Tempat, Tanggal Lahir</span>
              <span className="col-span-8 text-slate-900">: {selectedWarga?.tempatLahir || '-'}, {selectedWarga?.tglLahir || '-'} ({calculateAge(selectedWarga?.tglLahir || '')} Tahun)</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">3. Jenis Kelamin</span>
              <span className="col-span-8 text-slate-900">: {selectedWarga?.jenisKelamin || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">4. Kewarganegaraan / Agama</span>
              <span className="col-span-8 text-slate-900">: WNI / {selectedWarga?.agama || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">5. Pekerjaan</span>
              <span className="col-span-8 text-slate-900">: {selectedWarga?.pekerjaan || selectedWarga?.pendidikan || 'Wiraswasta / Karyawan'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">6. Status Perkawinan</span>
              <span className="col-span-8 text-slate-900">: {selectedWarga?.statusPerkawinan || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">7. Nomor Induk Kependudukan (NIK)</span>
              <span className="col-span-8 font-bold text-slate-900 font-mono">: {selectedWarga?.nik || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">8. Nomor Kartu Keluarga (KK)</span>
              <span className="col-span-8 text-slate-900 font-mono">: {selectedWarga?.noKk || '-'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">9. Alamat / Tempat Tinggal</span>
              <span className="col-span-8 text-slate-900">: {selectedWarga?.alamat || 'RT 02 RW 14 Kelurahan Pedurungan Tengah, Kota Semarang'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">10. Maksud / Keperluan</span>
              <span className="col-span-8 font-bold text-slate-900 uppercase">: {finalKeperluan}</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 text-slate-700">11. Keterangan Lain-lain</span>
              <span className="col-span-8 text-slate-800">: {keteranganLain}</span>
            </div>
          </div>

          <p className="pt-2 indent-8 text-justify leading-relaxed">
            Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
          </p>
        </div>

        {/* 2 Kolom Tanda Tangan Standar Lampiran RT/RW */}
        <div className="mt-12 grid grid-cols-2 gap-12 text-center text-xs font-serif">
          {/* Kolom Kiri: Mengetahui KETUA RW 14 */}
          <div>
            <p className="text-slate-700">Mengetahui,</p>
            <p className="font-bold text-slate-900 uppercase">
              KETUA RW 14
            </p>
            <div className="h-24 flex items-end justify-center font-bold text-slate-900 uppercase">
              ( {namaKetuaRw ? namaKetuaRw : '..................................................'} )
            </div>
          </div>

          {/* Kolom Kanan: Tanggal penerbitan Semarang dan tanda tangan Ketua RT 02: Ali Muhtarom, S.T */}
          <div>
            <p className="text-slate-700">
              Semarang, {todayStr}
            </p>
            <p className="font-bold text-slate-900 uppercase">
              {jabatan}
            </p>
            <div className="h-24 flex items-end justify-center font-bold text-slate-900 uppercase underline">
              ( {penandatangan} )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
