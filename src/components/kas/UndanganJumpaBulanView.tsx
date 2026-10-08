import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../iuran/KwitansiModal';
import { LOGO_SEMARANG_DATA_URI } from '../../data/logoSemarang';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { exportElementToJPEG, shareOrDownloadJPEG } from '../../utils/imageExport';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Copy,
  Check,
  Printer,
  Download,
  Image as ImageIcon,
  Share2,
  RefreshCw,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Send,
  Building2,
  ShieldCheck,
  Coins,
  Wallet,
  Scale
} from 'lucide-react';

interface GeneratedUndangan {
  judulUndangan: string;
  pesanWhatsApp: string;
  suratResmiText: string;
  drafSambutanKetua: string;
  pesanPengingatH1: string;
  tipsPertemuan: string[];
}

export const UndanganJumpaBulanView: React.FC = () => {
  const { ringkasanKas, kasList, tarifWargaList, uniqueKKList, wargaList, currentUser } = useApp();

  // Form State
  const [jenisAcara, setJenisAcara] = useState('Pertemuan Jumpa Bulan Rutin RT 02');
  const [tanggal, setTanggal] = useState('Sabtu, 11 Oktober 2026');
  const [waktu, setWaktu] = useState('19.30 WIB (Ba\'da Isya) s/d Selesai');
  const [tempat, setTempat] = useState('Balai Warga RT 02 RW 14 Tanjung Sari');
  const [tone, setTone] = useState<'resmi_akrab' | 'formal_kedinasan' | 'santai_kekeluargaan' | 'singkat_padat'>('resmi_akrab');
  const [catatanTambahan, setCatatanTambahan] = useState('Diharapkan hadir tepat waktu. Membawa iuran jimpitan dan buku catatan.');
  
  // Agenda Checkboxes
  const [agendas, setAgendas] = useState<string[]>([
    'Laporan Pertanggungjawaban Kas Besar RT & Kas Kecil Iuran Warga Bulan Berjalan',
    'Evaluasi Program Kebersihan Lingkungan, Saluran Air & Rencana Kerja Bakti',
    'Evaluasi Jadwal Ronda Malam & Peningkatan Keamanan Lingkungan',
    'Arisan Rutin Warga RT 02 & Penarikan Jimpitan',
    'Sesi Musyawarah Bersama, Tanya Jawab & Penyampaian Aspirasi Warga'
  ]);
  const [customAgendaInput, setCustomAgendaInput] = useState('');

  // AI Generation State
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [undanganData, setUndanganData] = useState<GeneratedUndangan | null>(null);

  // Active View Tab on Results: 'wa' | 'card' | 'surat' | 'sambutan'
  const [activeResultTab, setActiveResultTab] = useState<'wa' | 'card' | 'surat' | 'sambutan'>('wa');

  // Copy & Action states
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedH1, setCopiedH1] = useState(false);
  const [isExportingJpeg, setIsExportingJpeg] = useState(false);
  const [qrUndanganUrl, setQrUndanganUrl] = useState<string>('');
  const [selectedKkTarget, setSelectedKkTarget] = useState<string>('');

  const visualCardRef = useRef<HTMLDivElement>(null);

  // Quick place suggestions
  const tempatOptions = [
    'Balai Warga RT 02 RW 14 Tanjung Sari',
    'Pos Kamling & Keamanan RT 02',
    'Kediaman Ketua RT (Bpk. Drs. Bambang Sudarsono)',
    'Kediaman Bendahara RT (Bpk. Misbahudin)',
    'Halaman Masjid / Musholla Lingkungan RT 02'
  ];

  // Inisialisasi default undangan awal
  useEffect(() => {
    // Generate initial QR code
    const qrText = `UNDANGAN JUMPA BULAN RESMI RT 02 RW 14
Kelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
Acara: ${jenisAcara}
Waktu: ${tanggal}, ${waktu}
Lokasi: ${tempat}
Sistem: BerkahOne RT 02 Digital`;

    generateQRCodeWithBerkahOneLogo(qrText, 220)
      .then(setQrUndanganUrl)
      .catch((e) => console.error('Error creating QR:', e));
  }, [jenisAcara, tanggal, waktu, tempat]);

  // Handler Generate dengan Gemini
  const handleGenerateWithAI = async () => {
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const payload = {
        jenisAcara,
        tanggal,
        waktu,
        tempat,
        agendaList: agendas,
        tone,
        ringkasanKas: {
          saldoKasBesar: ringkasanKas.totalSaldoKasBesar,
          saldoKasKecil: ringkasanKas.saldoKasKecil,
          saldoBOP: ringkasanKas.saldoKasBOP,
          bulan: 'Oktober 2026'
        },
        namaKetua: 'Drs. Bambang Sudarsono',
        namaSekretaris: 'Agus Setiawan, S.T.',
        namaBendahara: 'Misbahudin',
        catatanTambahan
      };

      const res = await fetch('/api/gemini/undangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghubungi asisten AI.');
      }

      setUndanganData(json.data);
      setActiveResultTab('wa');
    } catch (err: any) {
      console.warn('AI call failed, activating smart local generator fallback:', err);
      setAiError(err.message || 'Gagal memanggil API AI. Menggunakan format draf cerdas otomatis.');
      
      // Fallback generator cerdas lokal jika offline/tanpa internet
      generateLocalDraft();
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Fallback generator cerdas lokal
  const generateLocalDraft = () => {
    const formattedAgendas = agendas.map((a, i) => `${i + 1}. *${a}*`).join('\n');
    
    const waText = `🏛️ *UNDANGAN JUMPA BULAN & MUSYAWARAH WARGA RT 02 RW 14*
Kelurahan Pedurungan Tengah, Kec. Pedurungan, Kota Semarang
Sistem Informasi BerkahOne RT 02 Digital
━━━━━━━━━━━━━━━━━━━━━━━━━━

Kepada Yth.
*Bapak/Ibu/Saudara Warga RT 02 RW 14*
di Tempat

_Assalamu'alaikum Warahmatullahi Wabarakatuh,_
Salam sejahtera dan salam guyub rukun untuk kita semua.

Mengharap dengan hormat kehadiran Bapak/Ibu warga RT 02 RW 14 dalam acara **${jenisAcara}**, yang insya Allah akan dilaksanakan pada:

📅 *Hari / Tanggal* : *${tanggal}*
⏰ *Waktu*           : *${waktu}*
📍 *Tempat*          : *${tempat}*

📋 *SUSUNAN AGENDA PEMBAHASAN:*
${formattedAgendas}

💰 *KILAS KAS RT 02 TERKINI:*
• Saldo Kas Besar : *${formatRupiah(ringkasanKas.totalSaldoKasBesar)}*
• Saldo Kas Kecil : *${formatRupiah(ringkasanKas.saldoKasKecil)}*
• Saldo BOP       : *${formatRupiah(ringkasanKas.saldoKasBOP)}*
_(Laporan pembukuan lengkap & bukti kwitansi akan dipaparkan secara transparan)_

📝 *CATATAN PENGURUS:*
• ${catatanTambahan || 'Dimohon hadir tepat waktu demi kelancaran musyawarah.'}
• Bagi warga yang berhalangan hadir, dapat menyampaikan titipan usulan atau iuran kepada pengurus RT.

━━━━━━━━━━━━━━━━━━━━━━━━━━
Demikian undangan ini kami sampaikan. Mengingat pentingnya musyawarah demi kemajuan dan kenyamanan lingkungan bersama, kehadiran Bapak/Ibu sangat kami harapkan.

_Wassalamu'alaikum Warahmatullahi Wabarakatuh._

Hormat kami,
*PENGURUS RT 02 RW 14 TANJUNG SARI*
• Ketua RT 02    : *Drs. Bambang Sudarsono*
• Sekretaris     : *Agus Setiawan, S.T.*
• Bendahara      : *Misbahudin*`;

    const suratText = `PEMERINTAH KOTA SEMARANG
KECAMATAN PEDURUNGAN - KELURAHAN PEDURUNGAN TENGAH
RUKUN TETANGGA 02 RW 14 TANJUNG SARI

Nomor       : 042/UND/RT02-RW14/X/2026
Lampiran    : -
Perihal     : Undangan ${jenisAcara}

Kepada Yth.
Bapak/Ibu/Saudara Warga RT 02 RW 14
Kelurahan Pedurungan Tengah
di Tempat

Dengan hormat,
Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Dalam rangka menjalin silaturahmi, musyawarah warga, serta penyampaian transparansi laporan keuangan kas RT bulan berjalan, bersama ini kami Pengurus RT 02 RW 14 mengundang Bapak/Ibu/Saudara untuk hadir pada:

Hari, Tanggal : ${tanggal}
Waktu         : ${waktu}
Tempat        : ${tempat}
Acara         : ${jenisAcara}

Susunan Agenda:
${agendas.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Catatan Pengurus:
${catatanTambahan || 'Diharapkan hadir tepat waktu demi kelancaran musyawarah bersama.'}

Mengingat pentingnya agenda tersebut demi kebersamaan dan kemajuan lingkungan kita, kehadiran Bapak/Ibu sekalian sangat kami harapkan.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.

Semarang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
Pengurus RT 02 RW 14 Tanjung Sari

Ketua RT 02,                            Sekretaris,



Drs. Bambang Sudarsono                  Agus Setiawan, S.T.`;

    const sambutanText = `DRAF TEKS SAMBUTAN KETUA RT 02:
"Assalamu'alaikum Warahmatullahi Wabarakatuh, salam sejahtera bagi kita semua.
Bapak-bapak dan Ibu-ibu warga RT 02 RW 14 yang saya hormati dan saya banggakan.

Pertama-tama marilah kita panjatkan puji syukur ke hadirat Allah SWT, berkat rahmat-Nya malam ini kita dapat berkumpul dalam acara Jumpa Bulan RT 02 dalam keadaan sehat walafiat.

Pada pertemuan malam ini, poin utama yang akan kita sampaikan adalah transparansi laporan keuangan Kas Besar RT, Kas Kecil iuran warga, dan Kas BOP Kelurahan. Alhamdulillah saldo kas kita saat ini berada di posisi ${formatRupiah(ringkasanKas.totalSaldoKasBesar)}, dikelola dengan amanah dan transparan melalui sistem BerkahOne RT 02.

Selain laporan keuangan, kita juga akan membahas agenda kebersihan lingkungan, keamanan ronda, serta membuka sesi dialog untuk menampung kritik dan saran dari Bapak/Ibu sekalian. Mari kita musyawarahkan bersama dengan semangat kebersamaan dan kekeluargaan..."`;

    const pengingat = `🔔 *PENGINGAT (H-1) JUMPA BULAN RT 02 RW 14*
Mengingatkan kembali kepada seluruh Bapak/Ibu warga RT 02, besok malam (*${tanggal}* pukul *${waktu}*) akan diadakan pertemuan rutin bertempat di *${tempat}*. 
Mohon berkenan hadir tepat waktu demi kelancaran musyawarah lingkungan kita. Terima kasih! 🙏`;

    setUndanganData({
      judulUndangan: `Undangan Resmi ${jenisAcara}`,
      pesanWhatsApp: waText,
      suratResmiText: suratText,
      drafSambutanKetua: sambutanText,
      pesanPengingatH1: pengingat,
      tipsPertemuan: [
        'Sediakan daftar hadir warga dan kotak jimpitan di meja penerimaan tamu.',
        'Tampilkan layar atau cetak ringkasan Laporan Buku Kas Besar RT untuk transparansi.',
        'Buka sesi tanya jawab terstruktur maksimal 20 menit agar waktu pertemuan efektif.',
        'Sediakan konsumsi ringan dan teh hangat khas kebersamaan warga.'
      ]
    });
    setActiveResultTab('wa');
  };

  // Muat default undangan saat awal render jika belum ada
  useEffect(() => {
    if (!undanganData) {
      generateLocalDraft();
    }
  }, []);

  // Handler ekspor JPEG kartu visual undangan
  const handleExportJpeg = async () => {
    if (!visualCardRef.current) return;
    setIsExportingJpeg(true);
    try {
      const filename = `Undangan_Jumpa_Bulan_RT02_${tanggal.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      await exportElementToJPEG(visualCardRef.current, filename, 0.95);
    } catch (err) {
      console.error('Gagal mengekspor kartu undangan JPEG:', err);
    } finally {
      setIsExportingJpeg(false);
    }
  };

  // Handler bagikan JPEG ke WhatsApp
  const handleShareJpegToWhatsApp = async () => {
    if (!visualCardRef.current || !undanganData) return;
    setIsExportingJpeg(true);
    try {
      const filename = `Undangan_Jumpa_Bulan_RT02.jpg`;
      await shareOrDownloadJPEG(
        visualCardRef.current,
        filename,
        '',
        undanganData.pesanWhatsApp,
        'Undangan Jumpa Bulan RT 02 RW 14'
      );
    } catch (err) {
      console.error('Gagal membagikan ke WhatsApp:', err);
    } finally {
      setIsExportingJpeg(false);
    }
  };

  // Salin teks WhatsApp
  const handleCopyWA = async () => {
    if (!undanganData) return;
    try {
      await navigator.clipboard.writeText(undanganData.pesanWhatsApp);
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Salin pengingat H-1
  const handleCopyH1 = async () => {
    if (!undanganData) return;
    try {
      await navigator.clipboard.writeText(undanganData.pesanPengingatH1);
      setCopiedH1(true);
      setTimeout(() => setCopiedH1(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Buka WhatsApp kirim ke warga tertentu atau broadcast umum
  const handleSendToSelectedKK = () => {
    if (!undanganData) return;
    const cleanNumber = selectedKkTarget.replace(/\D/g, '');
    const encoded = encodeURIComponent(undanganData.pesanWhatsApp);
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Tambah agenda baru
  const handleAddCustomAgenda = () => {
    if (customAgendaInput.trim()) {
      setAgendas([...agendas, customAgendaInput.trim()]);
      setCustomAgendaInput('');
    }
  };

  // Hapus agenda
  const handleRemoveAgenda = (index: number) => {
    setAgendas(agendas.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Menu Undangan Jumpa Bulan */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Decorative ambient blur */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-purple-200 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>AI Features &bull; Kas Besar RT 02 RW 14</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Undangan Jumpa Bulan RT</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold uppercase tracking-wider shadow-xs">
                Gemini AI
              </span>
            </h1>
            <p className="text-xs text-purple-100/80 max-w-2xl leading-relaxed">
              Penyusunan naskah undangan pertemuan bulanan warga, broadcast WhatsApp, surat dinas resmi, dan pembuatan <strong>Kartu Undangan JPEG</strong> siap kirim secara cerdas dengan integrasi data Kas RT 02 terkini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isLoadingAi}
              className="px-4 py-2.5 text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Menyusun dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Generate Undangan AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Setup vs AI Generated Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Parameter Acara & Agenda (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan Jadwal &amp; Agenda Jumpa Bulan</span>
            </h2>
            <span className="text-[10px] font-bold text-slate-400 font-mono">RT 02 RW 14</span>
          </div>

          {/* Jenis Pertemuan */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Nama / Jenis Acara:</label>
            <input
              type="text"
              value={jenisAcara}
              onChange={(e) => setJenisAcara(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
              placeholder="Contoh: Pertemuan Jumpa Bulan Rutin RT 02"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                <span>Hari &amp; Tanggal:</span>
              </label>
              <input
                type="text"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-medium"
                placeholder="Sabtu, 11 Oktober 2026"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Waktu Pelaksanaan:</span>
              </label>
              <input
                type="text"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-medium"
                placeholder="19.30 WIB s/d Selesai"
              />
            </div>
          </div>

          {/* Tempat Pertemuan & Quick Chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-500" />
              <span>Lokasi / Tempat Pertemuan:</span>
            </label>
            <input
              type="text"
              value={tempat}
              onChange={(e) => setTempat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-medium"
              placeholder="Balai Warga RT 02 RW 14"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {tempatOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTempat(opt)}
                  className={`text-[9.5px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer text-left ${
                    tempat === opt
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Nada Bahasa (Tone) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Gaya / Nada Bahasa Undangan:</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTone('resmi_akrab')}
                className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  tone === 'resmi_akrab'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">Resmi &amp; Akrab</div>
                <div className="text-[9px] font-normal text-slate-500">Santun, hangat kekeluargaan</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('formal_kedinasan')}
                className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  tone === 'formal_kedinasan'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">Formal Kedinasan</div>
                <div className="text-[9px] font-normal text-slate-500">Kop dinas &amp; tata persuratan</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('santai_kekeluargaan')}
                className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  tone === 'santai_kekeluargaan'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">Santai Warga</div>
                <div className="text-[9px] font-normal text-slate-500">Guyub rukun, arisan santai</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('singkat_padat')}
                className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  tone === 'singkat_padat'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">Singkat &amp; Padat</div>
                <div className="text-[9px] font-normal text-slate-500">To the point, poin utama</div>
              </button>
            </div>
          </div>

          {/* Daftar Agenda Pertemuan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Daftar Agenda Pertemuan:</label>
              <span className="text-[10px] text-slate-400 font-mono">{agendas.length} Agenda</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {agendas.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 text-[9.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 leading-snug">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                    title="Hapus agenda"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customAgendaInput}
                onChange={(e) => setCustomAgendaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAgenda();
                  }
                }}
                placeholder="Tambah poin agenda baru..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomAgenda}
                className="px-3 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors cursor-pointer"
              >
                + Tambah
              </button>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Catatan Tambahan Pengurus:</label>
            <textarea
              rows={2}
              value={catatanTambahan}
              onChange={(e) => setCatatanTambahan(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
              placeholder="Contoh: Membawa iuran jimpitan dan hadir tepat waktu."
            />
          </div>

          {/* Konteks Kas Terkini */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-emerald-950 font-bold">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-700" />
                <span>Konteks Kas RT Otomatis Terhubung:</span>
              </span>
              <span className="font-mono text-emerald-800 text-[11px]">Transparan</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
              <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Kas Besar:</span>
                <span className="font-bold text-emerald-900 font-mono">
                  {formatRupiah(ringkasanKas.totalSaldoKasBesar)}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Kas Kecil (Iuran):</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatRupiah(ringkasanKas.saldoKasKecil)}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block">Kas BOP:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatRupiah(ringkasanKas.saldoKasBOP)}
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Jalankan AI */}
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isLoadingAi}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 hover:from-indigo-600 hover:to-purple-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isLoadingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                <span>Menyusun Undangan dengan AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Buat / Perbarui Undangan dengan AI</span>
              </>
            )}
          </button>

          {aiError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Hasil Undangan AI & Multi-Format View (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tab Switcher Hasil */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveResultTab('wa')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeResultTab === 'wa'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Format WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeResultTab === 'card'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Kartu Visual JPEG</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('surat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeResultTab === 'surat'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Surat Resmi Kedinasan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveResultTab('sambutan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeResultTab === 'sambutan'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sambutan &amp; Notulen AI</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isLoadingAi}
                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                title="Regenerate Undangan dengan AI"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAi ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* TAB 1: FORMAT WHATSAPP SIAP KIRIM */}
          {activeResultTab === 'wa' && undanganData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Format Broadcast WhatsApp Siap Kirim</h3>
                    <p className="text-[10px] text-slate-500">Dilengkapi emoji, rincian jadwal, agenda, dan kilas kas RT</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyWA}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {copiedWA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWA ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToSelectedKK}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Kirim ke KK Spesifik / Broadcast */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-700">Kirim Personal ke Kepala Keluarga (KK):</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedKkTarget}
                    onChange={(e) => setSelectedKkTarget(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium max-w-[200px]"
                  >
                    <option value="">-- Grup / Broadcast Umum --</option>
                    {uniqueKKList.map((kk) => {
                      const matchWarga = wargaList.find((w) => w.noKk === kk.noKk && w.noTelepon);
                      const phone = matchWarga?.noTelepon || '';
                      return (
                        <option key={kk.noKk} value={phone}>
                          {kk.namaKepala} {phone ? `(${phone})` : '(No HP -)'}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={handleSendToSelectedKK}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Buka Chat
                  </button>
                </div>
              </div>

              {/* WhatsApp Bubble Preview */}
              <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-300/80 shadow-inner">
                <div className="bg-white p-4 rounded-xl shadow-xs text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed select-all border border-black/5">
                  {undanganData.pesanWhatsApp}
                </div>
              </div>

              {/* Pengingat H-1 */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Draf Pesan Pengingat H-1 Pertemuan:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyH1}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 underline cursor-pointer"
                  >
                    {copiedH1 ? 'Tersalin!' : 'Salin Pengingat'}
                  </button>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/80 text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {undanganData.pesanPengingatH1}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KARTU VISUAL UNDANGAN JPEG (SIAP EKSPOR KE WA) */}
          {activeResultTab === 'card' && undanganData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Kartu Undangan Visual Format JPEG</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Bisa diunduh dan dikirim langsung ke grup WhatsApp sebagai kartu gambar resmi RT 02
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJpeg}
                    disabled={isExportingJpeg}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isExportingJpeg ? 'Mengolah JPEG...' : 'Unduh JPEG'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareJpegToWhatsApp}
                    disabled={isExportingJpeg}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan Gambar ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* RENDER KARTU VISUAL UNDANGAN (UNTUK DITANGKAP OLEH HTML2CANVAS JADI JPEG) */}
              <div className="flex justify-center p-2 bg-slate-100 rounded-2xl overflow-x-auto">
                <div
                  ref={visualCardRef}
                  className="w-full max-w-md bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30 font-sans relative overflow-hidden"
                  style={{ minWidth: '380px' }}
                >
                  {/* Decorative glowing circles */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/25 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/25 rounded-full blur-2xl pointer-events-none" />

                  {/* Kop Kartu */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/15 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/20">
                        <img src={LOGO_SEMARANG_DATA_URI} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-indigo-300 font-extrabold">
                          PEMERINTAH KOTA SEMARANG
                        </div>
                        <div className="text-xs font-black tracking-tight text-white leading-tight">
                          RT 02 RW 14 TANJUNG SARI
                        </div>
                        <div className="text-[8.5px] text-white/70">
                          Kel. Pedurungan Tengah, Kec. Pedurungan
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[8.5px] font-black uppercase tracking-wider">
                        UNDANGAN RESMI
                      </span>
                    </div>
                  </div>

                  {/* Judul Acara */}
                  <div className="py-4 text-center relative z-10">
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                      MUSYAWARAH &amp; SILATURAHMI WARGA
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight mt-0.5 leading-tight">
                      {jenisAcara}
                    </h2>
                    <p className="text-[10px] text-white/80 mt-1 italic">
                      "Guyub Rukun Membangun Lingkungan RT 02 yang Nyaman, Aman, dan Transparan"
                    </p>
                  </div>

                  {/* Rincian Waktu & Lokasi Box */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 space-y-2 relative z-10 shadow-inner">
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[8.5px] text-indigo-200 font-bold uppercase">Hari &amp; Tanggal:</div>
                        <div className="font-extrabold text-white text-xs">{tanggal}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[8.5px] text-purple-200 font-bold uppercase">Waktu:</div>
                        <div className="font-extrabold text-white text-xs">{waktu}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[8.5px] text-emerald-200 font-bold uppercase">Lokasi / Tempat:</div>
                        <div className="font-extrabold text-white text-xs leading-snug">{tempat}</div>
                      </div>
                    </div>
                  </div>

                  {/* Poin-Poin Agenda Utama */}
                  <div className="pt-3 pb-2 space-y-1.5 relative z-10 text-[10.5px]">
                    <div className="text-[9px] uppercase font-bold text-indigo-300 tracking-wider">
                      Agenda Pembahasan:
                    </div>
                    <div className="space-y-1">
                      {agendas.slice(0, 4).map((ag, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-white/90">
                          <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-tight">{ag}</span>
                        </div>
                      ))}
                      {agendas.length > 4 && (
                        <div className="text-[9px] text-indigo-200 italic pl-5">
                          + {agendas.length - 4} agenda pembahasan lainnya...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kilas Kas & Verifikasi QR */}
                  <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3 relative z-10">
                    <div className="space-y-1">
                      <div className="text-[8.5px] text-white/70 uppercase font-bold">Transparansi Kas RT:</div>
                      <div className="font-mono font-extrabold text-emerald-300 text-xs">
                        Saldo: {formatRupiah(ringkasanKas.totalSaldoKasBesar)}
                      </div>
                      <div className="text-[8px] text-white/60">
                        Pengurus RT 02 RW 14 &bull; BerkahOne
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {qrUndanganUrl && (
                        <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-md border border-white/30">
                          <img src={qrUndanganUrl} alt="QR Undangan" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SURAT RESMI KEDINASAN CETAK */}
          {activeResultTab === 'surat' && undanganData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-black text-slate-900">Format Lembar Surat Dinas Resmi RT 02</h3>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Surat (Print)</span>
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-300 font-serif text-slate-900 text-xs leading-relaxed whitespace-pre-wrap select-all shadow-inner">
                {undanganData.suratResmiText}
              </div>
            </div>
          )}

          {/* TAB 4: SAMBUTAN & NOTULEN AI */}
          {activeResultTab === 'sambutan' && undanganData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-black text-slate-900">Draf Sambutan Ketua RT &amp; Panduan Musyawarah</h3>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  AI Generator
                </span>
              </div>

              {/* Draf Sambutan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Naskah Pembuka Sambutan Ketua RT:</label>
                <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {undanganData.drafSambutanKetua}
                </div>
              </div>

              {/* Tips Efektivitas Pertemuan dari AI */}
              {undanganData.tipsPertemuan && undanganData.tipsPertemuan.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tips Sukses Pertemuan Jumpa Bulan (Saran AI):</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {undanganData.tipsPertemuan.map((tip, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="text-slate-700 text-[11px] leading-snug">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
