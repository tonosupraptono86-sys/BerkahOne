import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PesertaPKK, TransaksiKasPKK, PembayaranIuranPKK, JabatanPKK } from '../../types';
import { LogoSemarang } from '../LogoSemarang';
import { RupiahIcon } from '../RupiahIcon';
import {
  Users,
  Wallet,
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  X,
  Edit2,
  Trash2,
  HeartHandshake,
  Flower2,
  Clock,
  ShieldCheck,
  CreditCard,
  Building,
  Check,
  Copy,
  ChevronRight
} from 'lucide-react';

const BULAN_OPTIONS = [
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
  { key: '2026-12', label: 'Desember 2026' },
];

const JABATAN_OPTIONS: JabatanPKK[] = [
  'Ketua PKK',
  'Wakil Ketua',
  'Sekretaris',
  'Bendahara',
  'Ketua Pokja I',
  'Ketua Pokja II',
  'Ketua Pokja III',
  'Ketua Pokja IV',
  'Anggota Pokja I',
  'Anggota Pokja II',
  'Anggota Pokja III',
  'Anggota Pokja IV',
  'Anggota'
];

const KAS_KATEGORI_MASUK = [
  'Iuran Rutin Anggota',
  'Bantuan Dana Kas RT',
  'Saldo Awal Tahun',
  'Usaha Bersama / UP2K / Bazar',
  'Donasi / Sumbangan Warga',
  'Lain-lain Masuk'
];

const KAS_KATEGORI_KELUAR = [
  'Konsumsi Pertemuan Rutin',
  'ATK & Cetak Notulen',
  'Dana Sosial & Jenguk Warga',
  'Kegiatan Lomba & PHBI',
  'Dukungan Posyandu & Toga',
  'Seragam & Perlengkapan',
  'Lain-lain Keluar'
];

const formatRupiah = (num: number): string => {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
};

export const DataPesertaPKKView: React.FC = () => {
  const {
    pesertaPKKList,
    kasPKKList,
    iuranPKKList,
    ringkasanKasPKK,
    activePkkSubTab,
    setActivePkkSubTab,
    addPesertaPKK,
    updatePesertaPKK,
    deletePesertaPKK,
    addTransaksiKasPKK,
    updateTransaksiKasPKK,
    deleteTransaksiKasPKK,
    addPembayaranIuranPKK,
    updatePembayaranIuranPKK,
    deletePembayaranIuranPKK,
    syncPesertaPKKWithWargaIstri,
    wargaList,
    setActiveTab,
    setSelectedKK
  } = useApp();

  // Warga berstatus Istri dari Data Kependudukan
  const wargaIstriList = useMemo(() => {
    return wargaList.filter((w) => w.statusKeluarga === 'Istri');
  }, [wargaList]);

  // Pemetaan No. KK ke Nama Suami (Kepala Keluarga)
  const kkSuamiMap = useMemo(() => {
    const map = new Map<string, string>();
    wargaList.forEach((w) => {
      if (w.statusKeluarga === 'Kepala Keluarga') {
        map.set(w.noKk?.trim(), w.nama);
      }
    });
    return map;
  }, [wargaList]);

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Tab 1: Peserta Filters
  const [pesertaSearch, setPesertaSearch] = useState('');
  const [pesertaFilterPokja, setPesertaFilterPokja] = useState<string>('all');
  const [pesertaFilterStatus, setPesertaFilterStatus] = useState<string>('all');

  // Tab 2: Kas Filters
  const [kasTipeFilter, setKasTipeFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [kasKategoriFilter, setKasKategoriFilter] = useState<string>('all');
  const [kasSearch, setKasSearch] = useState('');

  // Tab 3: Iuran Filters
  const [selectedBulan, setSelectedBulan] = useState<string>('2026-03');
  const [iuranStatusFilter, setIuranStatusFilter] = useState<'all' | 'Lunas' | 'Belum Bayar'>('all');
  const [iuranSearch, setIuranSearch] = useState('');

  // Modals
  const [isPesertaModalOpen, setIsPesertaModalOpen] = useState(false);
  const [editingPeserta, setEditingPeserta] = useState<PesertaPKK | null>(null);

  const [isKasModalOpen, setIsKasModalOpen] = useState(false);
  const [kasModalTipe, setKasModalTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [editingKas, setEditingKas] = useState<TransaksiKasPKK | null>(null);

  const [isBayarIuranModalOpen, setIsBayarIuranModalOpen] = useState(false);
  const [targetPesertaIuran, setTargetPesertaIuran] = useState<PesertaPKK | null>(null);

  const [selectedKwitansi, setSelectedKwitansi] = useState<PembayaranIuranPKK | null>(null);
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);

  // Forms state for Peserta
  const [pesertaFormWargaId, setPesertaFormWargaId] = useState('');
  const [pesertaFormNamaSuami, setPesertaFormNamaSuami] = useState('');
  const [pesertaFormNama, setPesertaFormNama] = useState('');
  const [pesertaFormNik, setPesertaFormNik] = useState('');
  const [pesertaFormNoKk, setPesertaFormNoKk] = useState('');
  const [pesertaFormJabatan, setPesertaFormJabatan] = useState<JabatanPKK>('Anggota');
  const [pesertaFormPokja, setPesertaFormPokja] = useState<PesertaPKK['pokja']>('Anggota Umum');
  const [pesertaFormAlamat, setPesertaFormAlamat] = useState('');
  const [pesertaFormNoHp, setPesertaFormNoHp] = useState('');
  const [pesertaFormStatus, setPesertaFormStatus] = useState<'Aktif' | 'Non-Aktif'>('Aktif');
  const [pesertaFormCatatan, setPesertaFormCatatan] = useState('');

  // Forms state for Kas
  const [kasFormTanggal, setKasFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kasFormKategori, setKasFormKategori] = useState(KAS_KATEGORI_MASUK[0]);
  const [kasFormKeterangan, setKasFormKeterangan] = useState('');
  const [kasFormNominal, setKasFormNominal] = useState('');
  const [kasFormNoBukti, setKasFormNoBukti] = useState('');
  const [kasFormPJ, setKasFormPJ] = useState('Wiwik Dwi Windu (Bendahara PKK)');

  // Forms state for Iuran
  const [iuranFormPesertaId, setIuranFormPesertaId] = useState('');
  const [iuranFormBulan, setIuranFormBulan] = useState(selectedBulan);
  const [iuranFormNominal, setIuranFormNominal] = useState('20000');
  const [iuranFormMetode, setIuranFormMetode] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [iuranFormTanggal, setIuranFormTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [iuranFormSyncKas, setIuranFormSyncKas] = useState(true);

  // Filtered Peserta List
  const filteredPesertaList = useMemo(() => {
    return pesertaPKKList.filter((p) => {
      if (pesertaSearch) {
        const q = pesertaSearch.toLowerCase();
        const match =
          p.nama.toLowerCase().includes(q) ||
          p.nik.includes(q) ||
          p.alamat.toLowerCase().includes(q) ||
          (p.noHp && p.noHp.includes(q));
        if (!match) return false;
      }
      if (pesertaFilterPokja !== 'all' && p.pokja !== pesertaFilterPokja) {
        return false;
      }
      if (pesertaFilterStatus !== 'all' && p.status !== pesertaFilterStatus) {
        return false;
      }
      return true;
    });
  }, [pesertaPKKList, pesertaSearch, pesertaFilterPokja, pesertaFilterStatus]);

  // Filtered Kas List
  const filteredKasList = useMemo(() => {
    return kasPKKList.filter((k) => {
      if (kasTipeFilter !== 'all' && k.tipe !== kasTipeFilter) return false;
      if (kasKategoriFilter !== 'all' && k.kategori !== kasKategoriFilter) return false;
      if (kasSearch) {
        const q = kasSearch.toLowerCase();
        const match =
          k.keterangan.toLowerCase().includes(q) ||
          k.kategori.toLowerCase().includes(q) ||
          (k.noBukti && k.noBukti.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [kasPKKList, kasTipeFilter, kasKategoriFilter, kasSearch]);

  // Status Iuran Bulan Terpilih
  const iuranBulanMap = useMemo(() => {
    const map = new Map<string, PembayaranIuranPKK>();
    iuranPKKList
      .filter((i) => i.bulan === selectedBulan && i.status === 'Lunas')
      .forEach((item) => {
        map.set(item.pesertaId, item);
      });
    return map;
  }, [iuranPKKList, selectedBulan]);

  const iuranRekap = useMemo(() => {
    const totalPeserta = pesertaPKKList.length;
    let lunasCount = 0;
    let totalNominal = 0;

    pesertaPKKList.forEach((p) => {
      const bayar = iuranBulanMap.get(p.id);
      if (bayar) {
        lunasCount++;
        totalNominal += bayar.nominal;
      }
    });

    const belumLunasCount = Math.max(0, totalPeserta - lunasCount);
    const persentase = totalPeserta > 0 ? Math.round((lunasCount / totalPeserta) * 100) : 0;

    return {
      totalPeserta,
      lunasCount,
      belumLunasCount,
      totalNominal,
      persentase
    };
  }, [pesertaPKKList, iuranBulanMap]);

  // Handlers for Peserta
  const handleOpenAddPeserta = () => {
    setEditingPeserta(null);
    setPesertaFormWargaId('');
    setPesertaFormNamaSuami('');
    setPesertaFormNama('');
    setPesertaFormNik('');
    setPesertaFormNoKk('');
    setPesertaFormJabatan('Anggota');
    setPesertaFormPokja('Anggota Umum');
    setPesertaFormAlamat('');
    setPesertaFormNoHp('');
    setPesertaFormStatus('Aktif');
    setPesertaFormCatatan('');
    setIsPesertaModalOpen(true);
  };

  const handleOpenEditPeserta = (p: PesertaPKK) => {
    setEditingPeserta(p);
    setPesertaFormWargaId(p.wargaId || '');
    setPesertaFormNamaSuami(p.namaSuami || kkSuamiMap.get(p.noKk?.trim()) || '');
    setPesertaFormNama(p.nama);
    setPesertaFormNik(p.nik);
    setPesertaFormNoKk(p.noKk);
    setPesertaFormJabatan(p.jabatan);
    setPesertaFormPokja(p.pokja);
    setPesertaFormAlamat(p.alamat);
    setPesertaFormNoHp(p.noHp || '');
    setPesertaFormStatus(p.status);
    setPesertaFormCatatan(p.catatan || '');
    setIsPesertaModalOpen(true);
  };

  const handleSavePeserta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesertaFormNama.trim()) {
      alert('Nama peserta wajib diisi');
      return;
    }

    const suamiNama =
      pesertaFormNamaSuami ||
      kkSuamiMap.get(pesertaFormNoKk.trim()) ||
      'Kepala Keluarga';

    if (editingPeserta) {
      updatePesertaPKK(editingPeserta.id, {
        wargaId: pesertaFormWargaId || editingPeserta.wargaId,
        nama: pesertaFormNama.trim(),
        nik: pesertaFormNik.trim(),
        noKk: pesertaFormNoKk.trim(),
        namaSuami: suamiNama,
        statusKeluarga: 'Istri',
        jabatan: pesertaFormJabatan,
        pokja: pesertaFormPokja,
        alamat: pesertaFormAlamat.trim(),
        noHp: pesertaFormNoHp.trim(),
        status: pesertaFormStatus,
        catatan: pesertaFormCatatan.trim()
      });
    } else {
      addPesertaPKK({
        wargaId: pesertaFormWargaId || undefined,
        nama: pesertaFormNama.trim(),
        nik: pesertaFormNik.trim(),
        noKk: pesertaFormNoKk.trim(),
        namaSuami: suamiNama,
        statusKeluarga: 'Istri',
        jabatan: pesertaFormJabatan,
        pokja: pesertaFormPokja,
        alamat: pesertaFormAlamat.trim(),
        noHp: pesertaFormNoHp.trim(),
        status: pesertaFormStatus,
        catatan: pesertaFormCatatan.trim() || `Istri dari Bpk. ${suamiNama}`
      });
    }
    setIsPesertaModalOpen(false);
  };

  // Quick autofill from residents who are Istri
  const handleSelectWargaForPeserta = (wargaId: string) => {
    const w = wargaList.find((item) => item.id === wargaId);
    if (!w) return;
    const suamiNama = kkSuamiMap.get(w.noKk?.trim()) || 'Kepala Keluarga';
    setPesertaFormWargaId(w.id);
    setPesertaFormNama(w.nama);
    setPesertaFormNik(w.nik);
    setPesertaFormNoKk(w.noKk);
    setPesertaFormNamaSuami(suamiNama);
    setPesertaFormAlamat(w.alamat);
    setPesertaFormNoHp((w.noHp || w.telepon || '').trim());
    setPesertaFormCatatan(`Istri dari Bpk. ${suamiNama}`);
  };

  const handleSyncFromWargaIstri = () => {
    const res = syncPesertaPKKWithWargaIstri();
    setSyncFeedback(
      `Berhasil menghubungkan! ${wargaIstriList.length} warga berstatus Istri telah tersinkronisasi (${res.addedCount} baru, ${res.updatedCount} diperbarui).`
    );
    setTimeout(() => {
      setSyncFeedback(null);
    }, 5000);
  };

  // Handlers for Kas
  const handleOpenAddKas = (tipe: 'masuk' | 'keluar') => {
    setEditingKas(null);
    setKasModalTipe(tipe);
    setKasFormTanggal(new Date().toISOString().slice(0, 10));
    setKasFormKategori(tipe === 'masuk' ? KAS_KATEGORI_MASUK[0] : KAS_KATEGORI_KELUAR[0]);
    setKasFormKeterangan('');
    setKasFormNominal('');
    setKasFormNoBukti(
      tipe === 'masuk'
        ? `KAS/PKK/${new Date().getFullYear()}/${String(kasPKKList.length + 1).padStart(3, '0')}`
        : `NT/PKK/${new Date().getFullYear()}/${String(kasPKKList.length + 1).padStart(3, '0')}`
    );
    setKasFormPJ('Wiwik Dwi Windu (Bendahara PKK)');
    setIsKasModalOpen(true);
  };

  const handleSaveKas = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseInt(kasFormNominal.replace(/\D/g, ''), 10);
    if (!nominal || nominal <= 0) {
      alert('Nominal transaksi kas harus valid');
      return;
    }
    if (!kasFormKeterangan.trim()) {
      alert('Keterangan transaksi kas wajib diisi');
      return;
    }

    if (editingKas) {
      updateTransaksiKasPKK(editingKas.id, {
        tanggal: kasFormTanggal,
        tipe: kasModalTipe,
        kategori: kasFormKategori,
        keterangan: kasFormKeterangan.trim(),
        nominal,
        noBukti: kasFormNoBukti.trim(),
        penanggungJawab: kasFormPJ.trim()
      });
    } else {
      addTransaksiKasPKK({
        tanggal: kasFormTanggal,
        tipe: kasModalTipe,
        kategori: kasFormKategori,
        keterangan: kasFormKeterangan.trim(),
        nominal,
        noBukti: kasFormNoBukti.trim(),
        penanggungJawab: kasFormPJ.trim()
      });
    }
    setIsKasModalOpen(false);
  };

  // Handlers for Iuran
  const handleOpenBayarIuran = (peserta?: PesertaPKK) => {
    const target = peserta || pesertaPKKList[0];
    setTargetPesertaIuran(target || null);
    if (target) {
      setIuranFormPesertaId(target.id);
    }
    setIuranFormBulan(selectedBulan);
    setIuranFormNominal('20000');
    setIuranFormMetode('Tunai');
    setIuranFormTanggal(new Date().toISOString().slice(0, 10));
    setIuranFormSyncKas(true);
    setIsBayarIuranModalOpen(true);
  };

  const handleSaveBayarIuran = (e: React.FormEvent) => {
    e.preventDefault();
    const p = pesertaPKKList.find((item) => item.id === iuranFormPesertaId);
    if (!p) {
      alert('Pilih peserta PKK terlebih dahulu');
      return;
    }

    const nominal = parseInt(iuranFormNominal.replace(/\D/g, ''), 10) || 20000;
    const noKwitansi = `KWT-PKK/${iuranFormBulan.replace('-', '/')}/${String(iuranPKKList.length + 1).padStart(3, '0')}`;

    addPembayaranIuranPKK(
      {
        pesertaId: p.id,
        namaPeserta: p.nama,
        noKk: p.noKk,
        bulan: iuranFormBulan,
        nominal,
        tanggalBayar: iuranFormTanggal,
        metode: iuranFormMetode,
        noKwitansi,
        status: 'Lunas',
        penerima: 'Wiwik Dwi Windu (Bendahara PKK)',
        catatan: `Iuran rutin PKK bulan ${iuranFormBulan}`
      },
      iuranFormSyncKas
    );

    setIsBayarIuranModalOpen(false);
  };

  const handleShareWhatsAppKwitansi = (item: PembayaranIuranPKK) => {
    const peserta = pesertaPKKList.find((p) => p.id === item.pesertaId);
    const phone = peserta?.noHp?.replace(/\D/g, '') || '';
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    const pesan = `*BUKTI PEMBAYARAN IURAN PKK RT 02 RW 14*\n` +
      `Kelurahan Pedurungan Tengah, Semarang\n` +
      `-------------------------------------------\n` +
      `No. Kwitansi : ${item.noKwitansi}\n` +
      `Nama Peserta : ${item.namaPeserta}\n` +
      `Periode Bulan: ${item.bulan}\n` +
      `Jumlah Bayar : ${formatRupiah(item.nominal)}\n` +
      `Metode Bayar : ${item.metode}\n` +
      `Tanggal      : ${item.tanggalBayar}\n` +
      `Penerima     : ${item.penerima}\n` +
      `Status       : LUNAS ✅\n` +
      `-------------------------------------------\n` +
      `Terima kasih atas partisipasi aktif dalam kegiatan PKK RT 02 RW 14 Tanjung Sari.`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pesan)}`
      : `https://wa.me/?text=${encodeURIComponent(pesan)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-white p-6 md:p-8 shadow-sm border border-rose-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-rose-100">
              <Flower2 className="w-3.5 h-3.5 text-pink-300" />
              <span>PKK RT 02 RW 14 Kelurahan Pedurungan Tengah</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Data Peserta, Kas & Iuran PKK
            </h1>
            <p className="text-rose-100 text-xs md:text-sm leading-relaxed">
              Sistem tata kelola Pemberdayaan Kesejahteraan Keluarga (PKK), pencatatan transparansi kas masuk-keluar, serta pembayaran iuran wajib bulanan ibu-ibu warga RT 02 RW 14.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncFromWargaIstri}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-700/80 hover:bg-rose-700 border border-rose-400/50 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Hubungkan dan sinkronkan otomatis dengan seluruh data warga berstatus Istri"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sinkron Data Warga (Istri)</span>
            </button>
            <button
              onClick={() => setIsPrintReportModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-rose-950 bg-white hover:bg-rose-50 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-rose-800" />
              <span>Cetak Laporan PKK</span>
            </button>
            {activePkkSubTab === 'peserta' && (
              <button
                onClick={handleOpenAddPeserta}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border border-rose-400/40"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Peserta PKK</span>
              </button>
            )}
            {activePkkSubTab === 'kas_pkk' && (
              <button
                onClick={() => handleOpenAddKas('masuk')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Kas Masuk</span>
              </button>
            )}
            {activePkkSubTab === 'iuran_pkk' && (
              <button
                onClick={() => handleOpenBayarIuran()}
                className="px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <RupiahIcon className="w-4 h-4" />
                <span>Catat Iuran Warga</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sync Feedback Toast Banner */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Navigation Tabs for PKK */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActivePkkSubTab('peserta')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activePkkSubTab === 'peserta'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Peserta PKK ({pesertaPKKList.length})</span>
        </button>

        <button
          onClick={() => setActivePkkSubTab('kas_pkk')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activePkkSubTab === 'kas_pkk'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Kas PKK ({formatRupiah(ringkasanKasPKK.saldo)})</span>
        </button>

        <button
          onClick={() => setActivePkkSubTab('iuran_pkk')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activePkkSubTab === 'iuran_pkk'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-rose-50 hover:text-rose-900'
          }`}
        >
          <RupiahIcon className="w-4 h-4" />
          <span>Iuran PKK ({iuranRekap.lunasCount}/{pesertaPKKList.length} Lunas)</span>
        </button>
      </div>

      {/* ========================================================
          SUBTAB 1: DATA PESERTA PKK
          ======================================================== */}
      {activePkkSubTab === 'peserta' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Peserta PKK</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Flower2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{pesertaPKKList.length} Ibu</div>
              <p className="text-[11px] text-slate-500 mt-1">Kader &amp; anggota aktif PKK RT 02</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Warga Status Istri</span>
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-pink-700">
                {wargaIstriList.length} Jiwa
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Data Kependudukan RT 02 RW 14</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Keterhubungan Data</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700">100% Sinkron</div>
              <p className="text-[11px] text-slate-500 mt-1">Terhubung otomatis dengan Kepala KK</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Struktur Kepengurusan</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {pesertaPKKList.filter((p) => p.pokja === 'Pengurus Inti').length} Inti + 4 Pokja
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Pembagian tugas operasional PKK</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex-1 relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={pesertaSearch}
                onChange={(e) => setPesertaSearch(e.target.value)}
                placeholder="Cari nama istri, suami, NIK, alamat, atau no. HP..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pesertaFilterPokja}
                onChange={(e) => setPesertaFilterPokja(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs font-medium"
              >
                <option value="all">Semua Pokja / Penugasan</option>
                <option value="Pengurus Inti">Pengurus Inti</option>
                <option value="Pokja I">Pokja I</option>
                <option value="Pokja II">Pokja II</option>
                <option value="Pokja III">Pokja III</option>
                <option value="Pokja IV">Pokja IV</option>
                <option value="Anggota Umum">Anggota Umum</option>
              </select>

              <select
                value={pesertaFilterStatus}
                onChange={(e) => setPesertaFilterStatus(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs font-medium"
              >
                <option value="all">Semua Status Keaktifan</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>

          {/* Peserta Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Nama Peserta (Istri) &amp; NIK</th>
                    <th className="py-3 px-3">Suami (Kepala KK)</th>
                    <th className="py-3 px-3">Jabatan PKK</th>
                    <th className="py-3 px-3">Pokja / Bidang</th>
                    <th className="py-3 px-3">Alamat Domisili</th>
                    <th className="py-3 px-3">Kontak WhatsApp</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPesertaList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada data peserta PKK yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredPesertaList.map((p, idx) => {
                      const isPengurus = p.pokja === 'Pengurus Inti';
                      const suamiNama = p.namaSuami || (kkSuamiMap.get(p.noKk?.trim()) || '-');
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{p.nama}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-100 text-pink-800 border border-pink-200">
                                Istri
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">{p.nik}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <HeartHandshake className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                              <span>{suamiNama}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKK(p.noKk);
                                setActiveTab('kk');
                              }}
                              className="font-mono text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5 mt-0.5 cursor-pointer"
                              title="Buka Kartu Keluarga"
                            >
                              <span>KK: {p.noKk}</span>
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isPengurus
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : p.jabatan.includes('Ketua Pokja')
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.jabatan}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">
                            {p.pokja}
                          </td>
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[180px]">
                            {p.alamat}
                          </td>
                          <td className="py-3 px-3">
                            {p.noHp ? (
                              <a
                                href={`https://wa.me/${p.noHp.replace(/\D/g, '').startsWith('0') ? '62' + p.noHp.replace(/\D/g, '').slice(1) : p.noHp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[11px] hover:underline"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{p.noHp}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenBayarIuran(p)}
                                title="Catat Iuran Warga (PKK)"
                                className="p-1.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                              >
                                <RupiahIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab('warga');
                                }}
                                title="Buka di Data Kependudukan"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditPeserta(p)}
                                title="Edit Data Peserta"
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus peserta PKK: ${p.nama}?`)) {
                                    deletePesertaPKK(p.id);
                                  }
                                }}
                                title="Hapus Peserta"
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Menampilkan {filteredPesertaList.length} dari total {pesertaPKKList.length} peserta PKK (Terhubung dengan Data Kependudukan status Istri)</span>
              <span className="font-medium text-rose-800">PKK RT 02 RW 14 Tanjung Sari</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBTAB 2: KAS PKK (Pencatatan Keuangan Masuk/Keluar)
          ======================================================== */}
      {activePkkSubTab === 'kas_pkk' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Ringkasan Saldo Kas PKK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-rose-900 to-pink-900 text-white rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-200">Saldo Akhir Kas PKK</span>
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-rose-200" />
                </div>
              </div>
              <div className="text-2xl font-black">{formatRupiah(ringkasanKasPKK.saldo)}</div>
              <p className="text-[11px] text-rose-200/80 mt-1">Kas operasional & simpanan PKK</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Kas Masuk</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700">{formatRupiah(ringkasanKasPKK.totalMasuk)}</div>
              <p className="text-[11px] text-slate-500 mt-1">Iuran warga, subsidi kas RT & sumbangan</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Kas Keluar</span>
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-red-600">{formatRupiah(ringkasanKasPKK.totalKeluar)}</div>
              <p className="text-[11px] text-slate-500 mt-1">Konsumsi rapat, ATK, dana sosial warga</p>
            </div>
          </div>

          {/* Filter Bar & Action Buttons */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex-1 relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={kasSearch}
                onChange={(e) => setKasSearch(e.target.value)}
                placeholder="Cari uraian, nomor bukti, kategori kas PKK..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={kasTipeFilter}
                onChange={(e) => setKasTipeFilter(e.target.value as any)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs font-medium"
              >
                <option value="all">Semua Jenis Kas</option>
                <option value="masuk">Kas Masuk Saja</option>
                <option value="keluar">Kas Keluar Saja</option>
              </select>

              <button
                onClick={() => handleOpenAddKas('masuk')}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Kas Masuk</span>
              </button>

              <button
                onClick={() => handleOpenAddKas('keluar')}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>- Kas Keluar</span>
              </button>
            </div>
          </div>

          {/* Table Kas Mutasi */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">No. Bukti</th>
                    <th className="py-3 px-3 text-center">Jenis</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Uraian / Keterangan</th>
                    <th className="py-3 px-3 text-right">Nominal (Rp)</th>
                    <th className="py-3 px-3">Penanggung Jawab</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKasList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Belum ada mutasi transaksi kas PKK yang sesuai kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKasList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono text-slate-700">{item.tanggal}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{item.noBukti || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.tipe === 'masuk' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{item.kategori}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">{item.keterangan}</td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold ${
                            item.tipe === 'masuk' ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {item.tipe === 'masuk' ? '+' : '-'}{formatRupiah(item.nominal)}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600">{item.penanggungJawab}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                if (confirm(`Hapus mutasi kas: ${item.keterangan}?`)) {
                                  deleteTransaksiKasPKK(item.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBTAB 3: IURAN PKK (Pencatatan Iuran Rutin Bulanan)
          ======================================================== */}
      {activePkkSubTab === 'iuran_pkk' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Periode Month Selector Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">Periode Iuran Bulanan</span>
                <span className="text-base font-black text-slate-900">
                  {BULAN_OPTIONS.find((b) => b.key === selectedBulan)?.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-rose-600 cursor-pointer"
              >
                {BULAN_OPTIONS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleOpenBayarIuran()}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RupiahIcon className="w-4 h-4" />
                <span>Catat Iuran Warga</span>
              </button>
            </div>
          </div>

          {/* Iuran KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Target Peserta</span>
              <span className="text-2xl font-black text-slate-900">{iuranRekap.totalPeserta} Peserta</span>
              <p className="text-[11px] text-slate-400 mt-1">Iuran wajib @ Rp 20.000 / bulan</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Sudah Lunas</span>
              <span className="text-2xl font-black text-emerald-700">{iuranRekap.lunasCount} Peserta</span>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                {iuranRekap.persentase}% Peserta Terbayar
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Belum Bayar</span>
              <span className="text-2xl font-black text-amber-600">{iuranRekap.belumLunasCount} Peserta</span>
              <p className="text-[11px] text-slate-400 mt-1">Perlu ditagihkan / disetor</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Total Iuran Terkumpul</span>
              <span className="text-2xl font-black text-rose-800">{formatRupiah(iuranRekap.totalNominal)}</span>
              <p className="text-[11px] text-slate-500 mt-1">Tersinkron ke Kas Masuk PKK</p>
            </div>
          </div>

          {/* Table Daftar Pembayaran Iuran Bulan Ini */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex-1 relative max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={iuranSearch}
                  onChange={(e) => setIuranSearch(e.target.value)}
                  placeholder="Cari peserta dalam daftar iuran..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs"
                />
              </div>

              <select
                value={iuranStatusFilter}
                onChange={(e) => setIuranStatusFilter(e.target.value as any)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none text-xs font-medium"
              >
                <option value="all">Semua Status (Lunas & Belum)</option>
                <option value="Lunas">Hanya Yang Lunas</option>
                <option value="Belum Bayar">Hanya Yang Belum Bayar</option>
              </select>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Nama Peserta PKK</th>
                    <th className="py-3 px-3">Jabatan</th>
                    <th className="py-3 px-3 text-center">Status Iuran</th>
                    <th className="py-3 px-3">Tanggal Bayar</th>
                    <th className="py-3 px-3">Metode</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-3">No. Kwitansi</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pesertaPKKList
                    .filter((p) => {
                      if (iuranSearch && !p.nama.toLowerCase().includes(iuranSearch.toLowerCase())) {
                        return false;
                      }
                      const payment = iuranBulanMap.get(p.id);
                      const isLunas = !!payment;
                      if (iuranStatusFilter === 'Lunas' && !isLunas) return false;
                      if (iuranStatusFilter === 'Belum Bayar' && isLunas) return false;
                      return true;
                    })
                    .map((p, idx) => {
                      const payment = iuranBulanMap.get(p.id);
                      const isLunas = !!payment;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{p.nama}</div>
                            <div className="text-[10px] text-slate-400">{p.alamat}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{p.jabatan}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isLunas ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Lunas</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Belum Bayar</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {payment?.tanggalBayar || '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {payment?.metode || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            {payment ? formatRupiah(payment.nominal) : formatRupiah(20000)}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {payment?.noKwitansi || '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isLunas && payment ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedKwitansi(payment)}
                                  className="px-2 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>Kwitansi</span>
                                </button>
                                <button
                                  onClick={() => handleShareWhatsAppKwitansi(payment)}
                                  title="Kirim Kwitansi via WhatsApp"
                                  className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenBayarIuran(p)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                              >
                                <RupiahIcon className="w-3.5 h-3.5" />
                                <span>Bayar Sekarang</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TAMBAH / EDIT PESERTA PKK
          ======================================================== */}
      {isPesertaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-700" />
                <span>{editingPeserta ? 'Edit Data Peserta PKK' : 'Tambah Peserta PKK Baru'}</span>
              </h3>
              <button
                onClick={() => setIsPesertaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeserta} className="space-y-3.5 text-xs">
              {/* Quick autofill from resident */}
              {!editingPeserta && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                    <span>Pilih Cepat Dari Warga RT 02 (Otomatis Isi)</span>
                  </span>
                  <select
                    onChange={(e) => handleSelectWargaForPeserta(e.target.value)}
                    className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:border-rose-600"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih Nama Warga Perempuan --</option>
                    {wargaList
                      .filter((w) => w.jenisKelamin === 'Perempuan')
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nama} (NIK: {w.nik} - {w.alamat})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Peserta *</label>
                <input
                  type="text"
                  required
                  value={pesertaFormNama}
                  onChange={(e) => setPesertaFormNama(e.target.value)}
                  placeholder="Contoh: Ny. Siti Sulastri"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    value={pesertaFormNik}
                    onChange={(e) => setPesertaFormNik(e.target.value)}
                    placeholder="3374..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-rose-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. Kartu Keluarga</label>
                  <input
                    type="text"
                    value={pesertaFormNoKk}
                    onChange={(e) => setPesertaFormNoKk(e.target.value)}
                    placeholder="3374..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-rose-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jabatan PKK</label>
                  <select
                    value={pesertaFormJabatan}
                    onChange={(e) => {
                      const jab = e.target.value as JabatanPKK;
                      setPesertaFormJabatan(jab);
                      if (['Ketua PKK', 'Wakil Ketua', 'Sekretaris', 'Bendahara'].includes(jab)) {
                        setPesertaFormPokja('Pengurus Inti');
                      } else if (jab.includes('Pokja I')) {
                        setPesertaFormPokja('Pokja I');
                      } else if (jab.includes('Pokja II')) {
                        setPesertaFormPokja('Pokja II');
                      } else if (jab.includes('Pokja III')) {
                        setPesertaFormPokja('Pokja III');
                      } else if (jab.includes('Pokja IV')) {
                        setPesertaFormPokja('Pokja IV');
                      } else {
                        setPesertaFormPokja('Anggota Umum');
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-medium"
                  >
                    {JABATAN_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pokja / Bidang</label>
                  <select
                    value={pesertaFormPokja}
                    onChange={(e) => setPesertaFormPokja(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-medium"
                  >
                    <option value="Pengurus Inti">Pengurus Inti</option>
                    <option value="Pokja I">Pokja I (Gotong Royong & Karakter)</option>
                    <option value="Pokja II">Pokja II (Pendidikan & Keterampilan)</option>
                    <option value="Pokja III">Pokja III (Pangan, Sandang, Toga)</option>
                    <option value="Pokja IV">Pokja IV (Kesehatan & Lingkungan)</option>
                    <option value="Anggota Umum">Anggota Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alamat Domisili RT 02</label>
                <input
                  type="text"
                  value={pesertaFormAlamat}
                  onChange={(e) => setPesertaFormAlamat(e.target.value)}
                  placeholder="Jl. Tanjungsari Permai Blok..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={pesertaFormNoHp}
                    onChange={(e) => setPesertaFormNoHp(e.target.value)}
                    placeholder="0812..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-rose-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status Keaktifan</label>
                  <select
                    value={pesertaFormStatus}
                    onChange={(e) => setPesertaFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-medium"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPesertaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingPeserta ? 'Simpan Perubahan' : 'Simpan Peserta PKK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CATAT KAS PKK (Masuk / Keluar)
          ======================================================== */}
      {isKasModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-700" />
                <span>{kasModalTipe === 'masuk' ? 'Catat Kas Masuk PKK' : 'Catat Kas Keluar PKK'}</span>
              </h3>
              <button
                onClick={() => setIsKasModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKas} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={kasFormTanggal}
                    onChange={(e) => setKasFormTanggal(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Bukti</label>
                  <input
                    type="text"
                    value={kasFormNoBukti}
                    onChange={(e) => setKasFormNoBukti(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:bg-white focus:border-rose-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori Kas</label>
                <select
                  value={kasFormKategori}
                  onChange={(e) => setKasFormKategori(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-medium"
                >
                  {(kasModalTipe === 'masuk' ? KAS_KATEGORI_MASUK : KAS_KATEGORI_KELUAR).map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nominal Rupiah (Rp) *</label>
                <input
                  type="text"
                  required
                  value={kasFormNominal}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setKasFormNominal(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                  }}
                  placeholder="Contoh: 150.000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 focus:bg-white focus:border-rose-600 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Uraian / Keterangan *</label>
                <textarea
                  rows={2}
                  required
                  value={kasFormKeterangan}
                  onChange={(e) => setKasFormKeterangan(e.target.value)}
                  placeholder="Contoh: Konsumsi snack pertemuan rutin bulanan PKK..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Penanggung Jawab</label>
                <input
                  type="text"
                  value={kasFormPJ}
                  onChange={(e) => setKasFormPJ(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKasModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BAYAR IURAN PKK
          ======================================================== */}
      {isBayarIuranModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RupiahIcon className="w-5 h-5 text-rose-700" />
                <span>Catat Iuran Warga (PKK)</span>
              </h3>
              <button
                onClick={() => setIsBayarIuranModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBayarIuran} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Peserta PKK Pembayar *</label>
                <select
                  value={iuranFormPesertaId}
                  onChange={(e) => setIuranFormPesertaId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-bold text-slate-900"
                >
                  {pesertaPKKList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.jabatan} - {p.alamat})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bulan Iuran</label>
                  <select
                    value={iuranFormBulan}
                    onChange={(e) => setIuranFormBulan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-bold"
                  >
                    {BULAN_OPTIONS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Metode Bayar</label>
                  <select
                    value={iuranFormMetode}
                    onChange={(e) => setIuranFormMetode(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none font-semibold"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nominal Iuran (Rupiah)</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-2.5 flex items-center gap-1 text-rose-700 pointer-events-none select-none">
                      <RupiahIcon className="w-4 h-4" />
                      <span className="text-xs font-bold text-slate-500 font-mono">Rp</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={parseInt(iuranFormNominal, 10).toLocaleString('id-ID')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setIuranFormNominal(raw || '0');
                      }}
                      className="w-full pl-14 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white focus:border-rose-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    required
                    value={iuranFormTanggal}
                    onChange={(e) => setIuranFormTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-600 outline-none"
                  />
                </div>
              </div>

              {/* Sync to Kas Checkbox */}
              <label className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={iuranFormSyncKas}
                  onChange={(e) => setIuranFormSyncKas(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-rose-950 leading-tight">
                  <strong>Otomatis catat kas masuk</strong> ke Buku Kas PKK RT 02 RW 14
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBayarIuranModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RupiahIcon className="w-4 h-4" />
                  <span>Simpan & Terbitkan Kwitansi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PRATINJAU KWITANSI RESMI IURAN PKK
          ======================================================== */}
      {selectedKwitansi && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-700" />
                <span>Kwitansi Pembayaran Iuran PKK</span>
              </h3>
              <button
                onClick={() => setSelectedKwitansi(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Kwitansi Card */}
            <div className="p-6 border-2 border-rose-800/80 rounded-2xl bg-gradient-to-b from-rose-50/40 via-white to-pink-50/30 text-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-rose-300">
                <div className="flex items-center gap-2.5">
                  <LogoSemarang className="w-10 h-12" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-rose-950 tracking-wider">
                      PKK RT 02 RW 14 TANJUNG SARI
                    </h4>
                    <p className="text-[10px] text-slate-600">
                      Kelurahan Pedurungan Tengah • Kota Semarang
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">No. Kwitansi:</span>
                  <span className="text-xs font-mono font-bold text-rose-900">{selectedKwitansi.noKwitansi}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Telah Diterima Dari:</span>
                  <span className="font-bold text-slate-900">{selectedKwitansi.namaPeserta}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Untuk Pembayaran:</span>
                  <span className="font-semibold text-slate-800">
                    Iuran Rutin PKK Bulan {selectedKwitansi.bulan}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Bayar:</span>
                  <span className="font-mono text-slate-800">{selectedKwitansi.tanggalBayar}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Metode Pembayaran:</span>
                  <span className="font-semibold text-slate-800">{selectedKwitansi.metode}</span>
                </div>
                <div className="flex justify-between py-2 bg-rose-100/60 px-3 rounded-xl">
                  <span className="font-bold text-rose-950">Jumlah Diterima:</span>
                  <span className="font-mono font-black text-rose-950 text-sm">
                    {formatRupiah(selectedKwitansi.nominal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600">
                <div>
                  <span className="block text-[10px] text-slate-400">Status Validasi:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>LUNAS & TERCATAT</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400">Penerima Kas:</span>
                  <span className="font-bold underline text-slate-900">{selectedKwitansi.penerima}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleShareWhatsAppKwitansi(selectedKwitansi)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bagikan ke WhatsApp</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Kwitansi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CETAK LAPORAN RESMI KAS & PESERTA PKK
          ======================================================== */}
      {isPrintReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 max-w-4xl w-full rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-rose-700" />
                <span>Pratinjau Cetak Laporan Resmi PKK RT 02 RW 14</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (A4)</span>
                </button>
                <button
                  onClick={() => setIsPrintReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex justify-center bg-slate-200/50">
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-md border border-slate-300 font-serif text-slate-900 space-y-6">
                {/* Kop Surat */}
                <div className="border-b-4 border-double border-slate-900 pb-3 flex items-center gap-4 text-center">
                  <LogoSemarang className="w-14 h-16 shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-base font-black uppercase tracking-wide">
                      PEMERINTAH KOTA SEMARANG • KECAMATAN PEDURUNGAN
                    </h2>
                    <h3 className="text-sm font-extrabold uppercase">
                      TIM PENGGERAK PKK RT 02 RW 14 TANJUNG SARI
                    </h3>
                    <p className="text-[11px] font-sans text-slate-600">
                      Kelurahan Pedurungan Tengah • Sekretariat: Jl. Tanjungsari Permai, Kota Semarang 50192
                    </p>
                  </div>
                </div>

                {/* Judul Dokumen */}
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold uppercase underline tracking-wide">
                    LAPORAN DATA PESERTA, KAS, DAN IURAN PKK
                  </h4>
                  <p className="text-xs font-sans text-slate-600">
                    Posisi Data: Tahun 2026 • Sistem Informasi BerkahOne RT 02 RW 14
                  </p>
                </div>

                {/* Ringkasan Keuangan Kas PKK */}
                <div className="grid grid-cols-3 gap-3 font-sans text-center text-xs">
                  <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Kas Masuk</span>
                    <span className="font-bold text-emerald-800 text-sm">{formatRupiah(ringkasanKasPKK.totalMasuk)}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-300 bg-slate-50">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Kas Keluar</span>
                    <span className="font-bold text-red-700 text-sm">{formatRupiah(ringkasanKasPKK.totalKeluar)}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-300 bg-rose-50">
                    <span className="text-[10px] text-rose-900 uppercase font-bold block">Sisa Saldo Kas</span>
                    <span className="font-black text-rose-900 text-sm">{formatRupiah(ringkasanKasPKK.saldo)}</span>
                  </div>
                </div>

                {/* Daftar Pengurus & Peserta PKK */}
                <div>
                  <h5 className="font-sans font-bold text-xs uppercase mb-2">
                    I. Susunan Pengurus & Peserta PKK RT 02 ({pesertaPKKList.length} Orang)
                  </h5>
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse font-sans">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                        <th className="p-1.5 border border-slate-300">Nama Lengkap</th>
                        <th className="p-1.5 border border-slate-300">Jabatan</th>
                        <th className="p-1.5 border border-slate-300">Pokja</th>
                        <th className="p-1.5 border border-slate-300">Alamat Domisili</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesertaPKKList.slice(0, 15).map((p, idx) => (
                        <tr key={p.id}>
                          <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-bold">{p.nama}</td>
                          <td className="p-1.5 border border-slate-300">{p.jabatan}</td>
                          <td className="p-1.5 border border-slate-300">{p.pokja}</td>
                          <td className="p-1.5 border border-slate-300">{p.alamat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pesertaPKKList.length > 15 && (
                    <p className="text-[10px] font-sans text-slate-500 italic mt-1">
                      * Menampilkan 15 pengurus utama dari total {pesertaPKKList.length} peserta terdaftar.
                    </p>
                  )}
                </div>

                {/* Ringkasan Mutasi Kas Terakhir */}
                <div>
                  <h5 className="font-sans font-bold text-xs uppercase mb-2">
                    II. Riwayat Mutasi Kas PKK Terakhir
                  </h5>
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse font-sans">
                    <thead className="bg-slate-100 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                        <th className="p-1.5 border border-slate-300">Tanggal</th>
                        <th className="p-1.5 border border-slate-300">Uraian Transaksi</th>
                        <th className="p-1.5 border border-slate-300 text-center">Jenis</th>
                        <th className="p-1.5 border border-slate-300 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kasPKKList.slice(0, 8).map((k, idx) => (
                        <tr key={k.id}>
                          <td className="p-1.5 border border-slate-300 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300">{k.tanggal}</td>
                          <td className="p-1.5 border border-slate-300">{k.keterangan}</td>
                          <td className="p-1.5 border border-slate-300 text-center uppercase text-[10px]">
                            {k.tipe}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-right font-mono">
                            {formatRupiah(k.nominal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan Resmi Pengurus PKK */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold uppercase">KETUA PKK RT 02 RW 14,</p>
                    <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                      CHRISTIANTI
                    </div>
                    <p className="text-[10px] text-slate-600 font-sans">Ketua PKK RT 02 RW 14</p>
                  </div>

                  <div>
                    <p>Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold uppercase">BENDAHARA PKK RT 02 RW 14,</p>
                    <div className="h-20 flex items-end justify-center font-bold uppercase underline">
                      WIWIK DWI WINDU
                    </div>
                    <p className="text-[10px] text-slate-600 font-sans">Bendahara PKK RT 02 RW 14</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
