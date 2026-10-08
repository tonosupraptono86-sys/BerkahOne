import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PembayaranIuran, Warga, TarifWargaKK } from '../types';
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
  Filter,
  Printer,
  Calendar,
  Wallet,
  ArrowUpDown,
  CreditCard,
  Users,
  Settings,
  Edit2,
  Trash2,
  TrendingUp,
  FileText,
  Ban,
  CheckCircle,
  X,
  CalendarDays,
  Receipt,
  MessageCircle,
  QrCode,
  Eye,
  Copy
} from 'lucide-react';
import { KwitansiModal, formatRupiah, directSendWhatsAppKwitansi, formatWhatsAppNumber } from './iuran/KwitansiModal';
import { KoreksiIuranModal } from './iuran/KoreksiIuranModal';
import { KoreksiTagihanModal } from './iuran/KoreksiTagihanModal';
import { TarifModal } from './iuran/TarifModal';
import { RekapModal } from './iuran/RekapModal';
import { AddIuranModal } from './iuran/AddIuranModal';
import { KartuIuranKKModal } from './iuran/KartuIuranKKModal';
import { QrCodeBendaharaModal } from './iuran/QrCodeBendaharaModal';
import { TagihanWhatsAppModal, findKKContact, directSendWhatsAppTagihan } from './iuran/TagihanWhatsAppModal';

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

export const IuranWargaView: React.FC = () => {
  const {
    wargaList,
    iuranList,
    tarifWargaList,
    updateTarifWarga,
    saveAllTarifWarga,
    getTarifByKK,
    addPembayaranIuran,
    updatePembayaranIuran,
    deletePembayaranIuran,
    currentUser,
    hasPermission
  } = useApp();

  // State untuk pengelolaan penutupan bulan per KK
  const [cellActionTarget, setCellActionTarget] = useState<{
    noKk: string;
    namaKepala: string;
    monthKey: string;
    monthLabel: string;
    isClosed: boolean;
  } | null>(null);

  const isMonthClosed = (noKk: string, monthKey: string): boolean => {
    const tarif = getTarifByKK(noKk);
    return tarif?.bulanDitutup?.includes(monthKey) ?? false;
  };

  const toggleMonthClosed = (noKk: string, monthKey: string) => {
    const currentClosed = getTarifByKK(noKk)?.bulanDitutup || [];
    let updatedClosed: string[];
    if (currentClosed.includes(monthKey)) {
      updatedClosed = currentClosed.filter((m) => m !== monthKey);
      showToast(`Bulan ${monthKey} dibuka kembali untuk KK.`);
    } else {
      updatedClosed = [...currentClosed, monthKey];
      showToast(`Bulan ${monthKey} ditutup (tidak ada tagihan untuk KK).`);
    }
    updateTarifWarga(noKk, { bulanDitutup: updatedClosed });
  };

  // View mode: 'matrix' (Matriks 12 Bulan) or 'history' (Riwayat Transaksi)
  const [viewMode, setViewMode] = useState<'matrix' | 'history'>('matrix');
  // Pilihan Kartu Iuran: '12bulan' (Semua Bulan) atau 'perbulan' (Bulan Berjalan Saja)
  const [kartuScope, setKartuScope] = useState<'12bulan' | 'perbulan'>('12bulan');
  const [selectedKkForCard, setSelectedKkForCard] = useState<{ noKk: string; namaKepala: string; alamat?: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBulanFilter, setSelectedBulanFilter] = useState<string>('2026-09');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'lunas' | 'tunggakan'>('semua');
  const [sortBy, setSortBy] = useState<'nama_kk' | 'no_kk'>('nama_kk');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedKk, setPreselectedKk] = useState<{ noKk: string; namaKepala: string } | null>(null);
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [editingTarifKkTarget, setEditingTarifKkTarget] = useState<string | null>(null);
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);
  const [selectedKwitansi, setSelectedKwitansi] = useState<PembayaranIuran | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PembayaranIuran | null>(null);
  const [isPrintRekapOpen, setIsPrintRekapOpen] = useState(false);
  const [isQrBendaharaModalOpen, setIsQrBendaharaModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PembayaranIuran | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State untuk Kirim Tagihan via WhatsApp
  const [whatsappTagihanKkTarget, setWhatsappTagihanKkTarget] = useState<{ noKk: string; namaKepala: string } | null>(null);
  const [isWhatsAppTagihanModalOpen, setIsWhatsAppTagihanModalOpen] = useState(false);

  // State untuk Koreksi & Hapus Nilai Tagihan Warga
  const [koreksiTagihanTarget, setKoreksiTagihanTarget] = useState<{
    noKk: string;
    namaKepala: string;
    monthKey: string;
    monthLabel: string;
    initialTab?: 'tagihan' | 'sebelum';
  } | null>(null);
  const [copiedRekeningTop, setCopiedRekeningTop] = useState(false);

  const handleOpenKoreksiTagihan = (
    kk: { noKk: string; namaKepala: string },
    monthKey: string,
    monthLabel: string,
    initialTab: 'tagihan' | 'sebelum' = 'tagihan'
  ) => {
    setKoreksiTagihanTarget({
      noKk: kk.noKk,
      namaKepala: kk.namaKepala,
      monthKey,
      monthLabel,
      initialTab
    });
  };

  const handleSaveKoreksiTagihan = (
    noKk: string,
    monthKey: string,
    newNominal: number | null
  ) => {
    const currentTarif = getTarifByKK(noKk);
    const currentKoreksi = { ...(currentTarif?.koreksiTagihanBulan || {}) };
    const kkObj = uniqueKKList.find((k) => k.noKk === noKk);
    const kkNama = kkObj?.namaKepala || 'Warga';

    if (newNominal === null) {
      delete currentKoreksi[monthKey];
      showToast(`Nilai tagihan ${monthKey} untuk ${kkNama} direset ke Penetapan Iuran Asli.`);
    } else {
      currentKoreksi[monthKey] = newNominal;
      showToast(`Nilai tagihan ${monthKey} untuk ${kkNama} berhasil dikoreksi menjadi ${formatRupiah(newNominal)}.`);
    }
    updateTarifWarga(noKk, { koreksiTagihanBulan: currentKoreksi });
  };

  const handleDeleteTagihan = (noKk: string, monthKey: string) => {
    const currentTarif = getTarifByKK(noKk);
    const currentKoreksi = { ...(currentTarif?.koreksiTagihanBulan || {}) };
    const kkObj = uniqueKKList.find((k) => k.noKk === noKk);
    const kkNama = kkObj?.namaKepala || 'Warga';

    currentKoreksi[monthKey] = 0; // 0 menandakan tagihan dihapus / dibebaskan
    updateTarifWarga(noKk, { koreksiTagihanBulan: currentKoreksi });
    showToast(`Nilai tagihan ${monthKey} untuk ${kkNama} telah dihapus (disetel Rp 0).`);
  };

  const handleSaveTagihanSebelum = (noKk: string, newNominal: number) => {
    updateTarifWarga(noKk, { tagihanPeriodeSebelum: newNominal });
    const kkObj = uniqueKKList.find((k) => k.noKk === noKk);
    const kkNama = kkObj?.namaKepala || 'Warga';
    if (newNominal === 0) {
      showToast(`Tagihan Tahun Sebelum untuk ${kkNama} berhasil dihapus (disetel Rp 0 / Lunas).`);
    } else if (newNominal < 0) {
      showToast(`Tagihan Tahun Sebelum untuk ${kkNama} disetel Kurang Bayar ${formatRupiah(Math.abs(newNominal))}.`);
    } else {
      showToast(`Tagihan Tahun Sebelum untuk ${kkNama} disetel Lebih Bayar +${formatRupiah(newNominal)}.`);
    }
  };

  const handleDeleteTagihanSebelum = (noKk: string) => {
    updateTarifWarga(noKk, { tagihanPeriodeSebelum: 0 });
    const kkObj = uniqueKKList.find((k) => k.noKk === noKk);
    const kkNama = kkObj?.namaKepala || 'Warga';
    showToast(`Tagihan Tahun Sebelum untuk ${kkNama} telah dihapus (disetel Rp 0).`);
  };

  const handleUpdatePenetapanFromKoreksi = (
    noKk: string,
    updated: Partial<TarifWargaKK>
  ) => {
    updateTarifWarga(noKk, updated);
    showToast(`Penetapan Iuran Warga KK berhasil diperbarui.`);
  };

  const handleOpenTarifForKK = (noKk: string) => {
    setEditingTarifKkTarget(noKk);
    setIsTarifModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendWhatsAppTagihanDirect = (kk: { noKk: string; namaKepala: string }) => {
    const kkTarif = getTarifByKK(kk.noKk);
    const currentPayment = paidMap.get(kk.noKk)?.get(selectedBulanFilter);
    const nextPayment = paidMap.get(kk.noKk)?.get(nextMonthObj.key);

    // Jika bulan berjalan sudah lunas, prioritaskan tagihan bulan berikutnya!
    // Jika belum lunas, kirim tagihan bulan berjalan.
    const isCurrentPaid = !!currentPayment;
    const targetKey = isCurrentPaid ? nextMonthObj.key : selectedBulanFilter;
    const targetLabel = isCurrentPaid
      ? nextMonthObj.label
      : (BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.label || selectedBulanFilter);
    const payment = isCurrentPaid ? nextPayment : currentPayment;

    const result = directSendWhatsAppTagihan({
      kk,
      targetMonthKey: targetKey,
      targetMonthLabel: targetLabel,
      kkTarif,
      payment,
      wargaList
    });

    if (result.hasPhone) {
      showToast(`Membuka WhatsApp untuk ${kk.namaKepala} (+${result.phone})...`);
    } else {
      showToast(`Membuka WhatsApp untuk ${kk.namaKepala} (Silakan pilih kontak di WhatsApp)...`);
    }
  };

  const handleOpenWhatsAppTagihanModal = (kk: { noKk: string; namaKepala: string }) => {
    setWhatsappTagihanKkTarget(kk);
    setIsWhatsAppTagihanModalOpen(true);
  };

  // Group Warga into unique KK List
  const uniqueKKList = useMemo(() => {
    const map = new Map<string, { kepala: Warga; members: Warga[]; alamat: string }>();

    wargaList.forEach((w) => {
      const kkKey = w.noKk?.trim() || `KK-INDIVIDU-${w.id}`;
      if (!map.has(kkKey)) {
        map.set(kkKey, {
          kepala: w,
          members: [w],
          alamat: w.alamat || 'RT 02 RW 14 Pedurungan Tengah'
        });
      } else {
        const existing = map.get(kkKey)!;
        existing.members.push(w);
        if (
          w.statusHubunganKeluarga === 'Kepala Keluarga' ||
          w.statusHubunganKeluarga === 'KEPALA KELUARGA'
        ) {
          existing.kepala = w;
        }
      }
    });

    return Array.from(map.entries()).map(([noKk, val]) => ({
      noKk,
      namaKepala: val.kepala.nama,
      anggotaCount: val.members.length,
      alamat: val.alamat,
      kepalaId: val.kepala.id
    })).sort((a, b) => {
      const cmp = a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [wargaList]);

  // Lookup map: [noKk -> [bulan -> PembayaranIuran]]
  const paidMap = useMemo(() => {
    const map = new Map<string, Map<string, PembayaranIuran>>();
    iuranList.forEach((item) => {
      if (!map.has(item.noKk)) {
        map.set(item.noKk, new Map());
      }
      // If item is recorded as periode-sebelum or before 2026
      if (
        item.bulan === 'periode-sebelum' ||
        item.bulan.toLowerCase().includes('sebelum') ||
        (item.bulan.startsWith('2025') || item.bulan < '2026-01')
      ) {
        map.get(item.noKk)!.set('periode-sebelum', item);
      }
      map.get(item.noKk)!.set(item.bulan, item);
    });
    return map;
  }, [iuranList]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const targetMonth = selectedBulanFilter;
    let paidCount = 0;
    let totalUangBulanIni = 0;
    let totalUangYtd = 0;

    uniqueKKList.forEach((kk) => {
      const kkMap = paidMap.get(kk.noKk);
      if (kkMap && kkMap.has(targetMonth)) {
        paidCount++;
        totalUangBulanIni += kkMap.get(targetMonth)!.nominal;
      }
    });

    iuranList.forEach((item) => {
      totalUangYtd += item.nominal;
    });

    const totalTagihanSebelumAll = uniqueKKList.reduce((acc, kk) => {
      const t = getTarifByKK(kk.noKk);
      return acc + (t?.tagihanPeriodeSebelum || 0);
    }, 0);

    const totalKk = uniqueKKList.length;
    const targetObj = BULAN_NAMES.find((b) => b.key === targetMonth);
    const isSelectedMonthLibur = targetObj?.isLibur;
    const unpaidCount = isSelectedMonthLibur ? 0 : Math.max(0, totalKk - paidCount);
    const percentage = isSelectedMonthLibur ? 100 : (totalKk > 0 ? Math.round((paidCount / totalKk) * 100) : 0);

    // Potential revenue based on custom tariffs (0 jika bulan libur)
    const potensiBulanIni = isSelectedMonthLibur ? 0 : tarifWargaList.reduce((acc, t) => acc + (t.totalTarif || 0), 0);

    return {
      totalKk,
      paidCount,
      unpaidCount,
      percentage,
      totalUangBulanIni,
      totalUangYtd,
      totalTagihanSebelumAll,
      potensiBulanIni,
      isSelectedMonthLibur
    };
  }, [uniqueKKList, paidMap, iuranList, selectedBulanFilter, tarifWargaList, getTarifByKK]);

  // Filtered Matrix List (Search without address dependency)
  const filteredMatrix = useMemo(() => {
    const list = uniqueKKList.filter((kk) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = kk.namaKepala.toLowerCase().includes(q);
        const matchKk = kk.noKk.toLowerCase().includes(q);
        if (!matchNama && !matchKk) return false;
      }

      if (statusFilter !== 'semua') {
        const isLibur = BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.isLibur;
        const kkPayments = paidMap.get(kk.noKk);
        const isPaid = kkPayments && kkPayments.has(selectedBulanFilter);
        const isClosed = isMonthClosed(kk.noKk, selectedBulanFilter);
        const kkTarif = getTarifByKK(kk.noKk);
        // < 0 adalah Kurang Bayar (tunggakan periode sebelum), > 0 adalah Lebih Bayar
        const hasKurangBayarSebelum = (kkTarif?.tagihanPeriodeSebelum ?? 0) < 0;

        if (isLibur || isClosed) {
          if (statusFilter === 'lunas' && hasKurangBayarSebelum) return false;
          if (statusFilter === 'tunggakan' && !hasKurangBayarSebelum) return false;
        } else {
          if (statusFilter === 'lunas' && (!isPaid || hasKurangBayarSebelum)) return false;
          if (statusFilter === 'tunggakan' && isPaid && !hasKurangBayarSebelum) return false;
        }
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'no_kk') {
        const cmpKk = a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
        if (cmpKk !== 0) return cmpKk;
        return a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      }
      // default: Nama Kepala Keluarga (A-Z) lalu Nomor KK
      const cmpNama = a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      if (cmpNama !== 0) return cmpNama;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [uniqueKKList, searchQuery, statusFilter, selectedBulanFilter, paidMap, getTarifByKK, sortBy]);

  // Totals for Matrix Table Footer
  const grandTotalTagihanSebelum = useMemo(() => {
    return filteredMatrix.reduce((acc, kk) => {
      const t = getTarifByKK(kk.noKk);
      return acc + (t?.tagihanPeriodeSebelum || 0);
    }, 0);
  }, [filteredMatrix, tarifWargaList, getTarifByKK]);

  const monthlyTotals2026 = useMemo(() => {
    return BULAN_NAMES.map((b) => {
      return filteredMatrix.reduce((acc, kk) => {
        const payment = paidMap.get(kk.noKk)?.get(b.key);
        return acc + (payment ? payment.nominal : 0);
      }, 0);
    });
  }, [filteredMatrix, paidMap]);

  const grandTotalBerjalan2026 = useMemo(() => {
    return monthlyTotals2026.reduce((acc, val) => acc + val, 0);
  }, [monthlyTotals2026]);

  // Rumus: Total Terbayar Periode Berjalan + Tagihan Tahun Sebelum
  const grandTotalAkhir = useMemo(() => {
    return grandTotalBerjalan2026 + grandTotalTagihanSebelum;
  }, [grandTotalBerjalan2026, grandTotalTagihanSebelum]);

  const grandTotalTagihanBerjalan2026 = useMemo(() => {
    return filteredMatrix.reduce((acc, kk) => {
      const kkTarif = getTarifByKK(kk.noKk);
      const totalTarifKK = kkTarif?.totalTarif ?? 25000;
      let activeMonths = 0;
      BULAN_NAMES.forEach((b) => {
        const isClosed = kkTarif?.bulanDitutup?.includes(b.key);
        if (!b.isLibur && !isClosed) {
          activeMonths++;
        }
      });
      return acc + (activeMonths * totalTarifKK);
    }, 0);
  }, [filteredMatrix, tarifWargaList, getTarifByKK]);

  // Bulan berikutnya berdasarkan selectedBulanFilter
  const nextMonthObj = useMemo(() => {
    const curIdx = BULAN_NAMES.findIndex((b) => b.key === selectedBulanFilter);
    if (curIdx !== -1 && curIdx + 1 < BULAN_NAMES.length) {
      return BULAN_NAMES[curIdx + 1];
    }
    return {
      key: '2027-01',
      short: 'Jan 27',
      label: 'Januari 2027',
      isLibur: false
    };
  }, [selectedBulanFilter]);

  // Fungsi hitung tagihan ke warga untuk bulan berikutnya disesuaikan Penetapan Iuran Warga & Koreksi/Hapus
  const getTagihanBulanBerikutnya = (noKk: string) => {
    const kkTarif = getTarifByKK(noKk);
    const penetapanJimpitan = kkTarif?.ikutJimpitan ? (kkTarif?.jimpitan ?? 15000) : 0;
    const penetapanUangMeja = kkTarif?.ikutUangMeja ? (kkTarif?.uangMeja ?? 10000) : 0;
    const penetapanTabungan = kkTarif?.ikutTabungan ? (kkTarif?.tabungan ?? 0) : 0;
    const totalPenetapan = penetapanJimpitan + penetapanUangMeja + penetapanTabungan;
    const totalTarifKK = kkTarif?.totalTarif ?? (totalPenetapan || 25000);

    // Cek koreksi / hapus khusus bulan ini
    const koreksiVal = kkTarif?.koreksiTagihanBulan?.[nextMonthObj.key];
    const isDihapus = koreksiVal === 0;
    const hasKoreksi = koreksiVal !== undefined && koreksiVal !== null;
    const nominalWajib = hasKoreksi ? koreksiVal! : totalTarifKK;

    const isClosed = kkTarif?.bulanDitutup?.includes(nextMonthObj.key);
    const isLibur = nextMonthObj.isLibur;
    const payment = paidMap.get(noKk)?.get(nextMonthObj.key);

    if (isLibur) {
      return {
        nominal: 0,
        status: 'libur' as const,
        label: 'Libur (Rp 0)',
        penetapan: totalPenetapan,
        hasKoreksi: false,
        isDihapus: false
      };
    }
    if (isClosed) {
      return {
        nominal: 0,
        status: 'ditutup' as const,
        label: 'Bebas/Tutup (Rp 0)',
        penetapan: totalPenetapan,
        hasKoreksi: false,
        isDihapus: false
      };
    }
    if (isDihapus) {
      return {
        nominal: 0,
        status: 'dihapus' as const,
        label: 'Dihapus (Rp 0)',
        penetapan: totalPenetapan,
        hasKoreksi: true,
        isDihapus: true
      };
    }
    if (payment && payment.nominal >= nominalWajib) {
      return {
        nominal: 0,
        status: 'lunas' as const,
        label: 'Lunas di Muka',
        paidNominal: payment.nominal,
        penetapan: totalPenetapan,
        hasKoreksi,
        isDihapus: false
      };
    }
    if (payment && payment.nominal > 0) {
      const sisa = Math.max(0, nominalWajib - payment.nominal);
      return {
        nominal: sisa,
        status: 'sebagian' as const,
        label: `Sisa ${formatRupiah(sisa)}`,
        paidNominal: payment.nominal,
        penetapan: totalPenetapan,
        hasKoreksi,
        isDihapus: false
      };
    }
    return {
      nominal: nominalWajib,
      status: hasKoreksi ? ('dikoreksi' as const) : ('penetapan' as const),
      label: formatRupiah(nominalWajib),
      penetapan: totalPenetapan,
      hasKoreksi,
      isDihapus: false
    };
  };

  const grandTotalTagihanBulanBerikutnya = useMemo(() => {
    return filteredMatrix.reduce((acc, kk) => {
      const res = getTagihanBulanBerikutnya(kk.noKk);
      return acc + res.nominal;
    }, 0);
  }, [filteredMatrix, nextMonthObj, getTarifByKK, paidMap, tarifWargaList]);

  // Filtered History Transactions
  const filteredHistory = useMemo(() => {
    return iuranList
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNama = item.namaWarga.toLowerCase().includes(q);
          const matchKk = item.noKk.toLowerCase().includes(q);
          const matchKwitansi = item.noKwitansi.toLowerCase().includes(q);
          if (!matchNama && !matchKk && !matchKwitansi) return false;
        }
        if (selectedBulanFilter && selectedBulanFilter !== 'semua') {
          if (item.bulan !== selectedBulanFilter) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime());
  }, [iuranList, searchQuery, selectedBulanFilter]);

  const handleOpenAddForKK = (kk: { noKk: string; namaKepala: string }) => {
    setPreselectedKk(kk);
    setIsAddModalOpen(true);
  };

  const handleKoreksiSave = (id: string, updatedData: Partial<PembayaranIuran>) => {
    updatePembayaranIuran(id, updatedData);
    setItemToEdit(null);
    showToast('Data pembayaran iuran warga berhasil dikoreksi.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold backdrop-blur-xs">
              <Coins className="w-3.5 h-3.5" />
              <span>Kas Besar RT 02 &bull; Modul Iuran Warga</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Kartu &amp; Pembayaran Iuran Warga
            </h1>
            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
              Tarif Iuran Warga berdasarkan <strong>Penetapan Masing-Masing KK</strong> (tidak ada standar baku seragam, besaran nominal dan komponen iuran dapat berbeda-beda antar warga sesuai penetapan).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTarifModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-orange-950 bg-orange-400 hover:bg-orange-300 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Penetapan Tarif Warga</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintRekapOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>

            <button
              type="button"
              onClick={() => setIsQrBendaharaModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Tampilkan QRIS & Verifikasi Digital Bendahara RT"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code Bendahara</span>
            </button>

            {hasPermission('manage_kas') && (
              <button
                type="button"
                onClick={() => {
                  setPreselectedKk(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catat Iuran Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner Keterangan Transfer Bank Mandiri Kas RT 02 */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-800 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            BM
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Rekening Resmi Penerimaan Iuran Warga RT 02</span>
            </div>
            <div className="text-xs text-slate-800 font-medium">
              Transfer Bank melalui Mandiri Nomer Rekening <strong className="font-mono font-black text-blue-950 text-sm">1350015984766</strong> an <strong className="text-slate-900 font-bold">Misbahudin</strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText('1350015984766');
              setCopiedRekeningTop(true);
              setTimeout(() => setCopiedRekeningTop(false), 2500);
            } catch {
              setCopiedRekeningTop(true);
              setTimeout(() => setCopiedRekeningTop(false), 2500);
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          title="Salin Nomor Rekening Mandiri Bendahara RT"
        >
          {copiedRekeningTop ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-700" />}
          <span>{copiedRekeningTop ? 'Rekening Tersalin!' : 'Salin Rekening Mandiri'}</span>
        </button>
      </div>

      {/* KPI Stat Cards with responsive scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 4k:grid-cols-4 gap-4 2xl:gap-5 4k:gap-6">
        {/* Bulan Terpilih */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bulan {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.short || 'Ini'}
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              {summaryMetrics.isSelectedMonthLibur
                ? 'Libur Iuran'
                : `${summaryMetrics.paidCount} / ${summaryMetrics.totalKk} KK`}
            </div>
            <div className={`text-[11px] font-semibold flex items-center gap-1 ${summaryMetrics.isSelectedMonthLibur ? 'text-amber-800' : 'text-emerald-700'}`}>
              <span>{summaryMetrics.isSelectedMonthLibur ? 'Seluruh warga bebas iuran' : `${summaryMetrics.percentage}% KK telah melunasi`}</span>
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${summaryMetrics.isSelectedMonthLibur ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Penerimaan Bulan Ini */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Penerimaan {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.short || ''}
            </span>
            <div className="text-xl font-extrabold text-emerald-800">
              {formatRupiah(summaryMetrics.totalUangBulanIni)}
            </div>
            <div className="text-[11px] text-slate-500">
              {summaryMetrics.isSelectedMonthLibur
                ? 'Bulan Libur (Potensi Rp 0)'
                : `Potensi: ${formatRupiah(summaryMetrics.potensiBulanIni)}`}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Tunggakan Bulan Terpilih */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {summaryMetrics.isSelectedMonthLibur ? 'Status Tunggakan' : `Belum Bayar (${BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.short || ''})`}
            </span>
            <div className={`text-xl font-extrabold ${summaryMetrics.isSelectedMonthLibur ? 'text-amber-800' : 'text-rose-700'}`}>
              {summaryMetrics.isSelectedMonthLibur ? '0 KK' : `${summaryMetrics.unpaidCount} KK`}
            </div>
            <div className={`text-[11px] font-medium ${summaryMetrics.isSelectedMonthLibur ? 'text-amber-800 font-semibold' : 'text-rose-600'}`}>
              {summaryMetrics.isSelectedMonthLibur ? 'Tidak ada penagihan' : 'Memerlukan tindak lanjut'}
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${summaryMetrics.isSelectedMonthLibur ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Kas Periode Berjalan & Rumus Total Akhir */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Terbayar Berjalan + Seb
            </span>
            <div className="text-xl font-extrabold text-emerald-950">
              {formatRupiah(summaryMetrics.totalUangYtd + summaryMetrics.totalTagihanSebelumAll)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Berjalan: {formatRupiah(summaryMetrics.totalUangYtd)}{' '}
              | Seb:{' '}
              <strong className={summaryMetrics.totalTagihanSebelumAll < 0 ? 'text-rose-700' : summaryMetrics.totalTagihanSebelumAll > 0 ? 'text-emerald-700' : 'text-slate-700'}>
                {summaryMetrics.totalTagihanSebelumAll > 0 ? '+' : ''}
                {formatRupiah(summaryMetrics.totalTagihanSebelumAll)}
                {summaryMetrics.totalTagihanSebelumAll < 0 ? ' (Kurang)' : summaryMetrics.totalTagihanSebelumAll > 0 ? ' (Lebih)' : ''}
              </strong>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Mode Switcher Tabs & Sub-Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kartu Iuran Warga</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'history'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Buku Riwayat &amp; Kuitansi ({iuranList.length})</span>
              </button>
            </div>

            {/* Sub-Toggle: 12 Bulan (Semua Bulan) vs Per Bulan Berjalan Saja */}
            {viewMode === 'matrix' && (
              <div className="inline-flex p-1 bg-emerald-50 border border-emerald-200 rounded-xl items-center gap-1">
                <span className="text-[10px] font-extrabold text-emerald-900 px-1.5 uppercase tracking-wider hidden sm:inline">
                  Pilihan Kartu:
                </span>
                <button
                  type="button"
                  onClick={() => setKartuScope('12bulan')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    kartuScope === '12bulan'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-900 hover:bg-emerald-100/70'
                  }`}
                  title="Tampilkan kartu kendali iuran lengkap 12 bulan (Januari - Desember)"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>12 Bulan (Semua Bulan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKartuScope('perbulan')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    kartuScope === 'perbulan'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-900 hover:bg-emerald-100/70'
                  }`}
                  title="Tampilkan kartu iuran fokus pada bulan berjalan saja"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Per Bulan Berjalan ({BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.short || 'Ini'})</span>
                </button>
              </div>
            )}
          </div>

          {/* Search & Month Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input (Without Address) */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama Kepala Keluarga, No. KK..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
              <span className="text-[11px] font-semibold text-slate-500">Bulan:</span>
              <select
                value={selectedBulanFilter}
                onChange={(e) => setSelectedBulanFilter(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                {BULAN_NAMES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label} {b.isLibur ? '(Libur)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="semua">Semua Status</option>
                <option value="lunas">Lunas Bulan Ini</option>
                <option value="tunggakan">Belum Lunas</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1" title="Urutkan Tampilan Data">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="nama_kk">Urut: Nama KK &amp; No. KK</option>
                <option value="no_kk">Urut: No. KK &amp; Nama KK</option>
              </select>
            </div>

            {/* Tombol Tambah / Catat Pembayaran Cepat */}
            {hasPermission('manage_kas') && (
              <button
                type="button"
                onClick={() => {
                  setPreselectedKk(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="Catat Pembayaran Iuran Baru"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Catat Iuran</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Banner Khusus Jika Memilih Bulan Libur */}
        {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.isLibur && (
          <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded font-black text-[10px] bg-amber-200 text-amber-900 uppercase tracking-wider">
                Bulan Libur
              </span>
              <span>
                <strong>Iuran Bulan Maret 2026 Diliburkan:</strong> Seluruh warga RT 02 dibebaskan dari kewajiban iuran bulanan dan tidak diperhitungkan sebagai tunggakan.
              </span>
            </div>
          </div>
        )}

        {/* VIEW 1A: MATRIX KARTU IURAN 12 BULAN (SEMUA BULAN) */}
        {viewMode === 'matrix' && kartuScope === '12bulan' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Kepala Keluarga &amp; No. KK</th>
                  <th className="py-2.5 px-2 text-center text-[10px] min-w-[120px] bg-amber-50/90 text-amber-950 font-black border-x border-amber-200">
                    <div className="leading-tight">
                      <span className="block text-[8px] uppercase tracking-wider text-amber-700 font-bold">Tagihan</span>
                      <span className="text-[10px] text-amber-950 font-black">Tahun Sebelum</span>
                      <span className="block text-[7.5px] font-semibold text-amber-800/90 mt-0.5">&lt;0 Kurang, &gt;0 Lebih</span>
                    </div>
                  </th>
                  {BULAN_NAMES.map((b) => (
                    <th
                      key={b.key}
                      className={`py-2 px-1 text-center text-[10px] ${
                        b.isLibur
                          ? 'w-14 bg-amber-100 text-amber-950 font-black border-x border-amber-200'
                          : selectedBulanFilter === b.key
                          ? 'w-14 bg-emerald-100 text-emerald-950 font-extrabold'
                          : 'w-14'
                      }`}
                      title={b.isLibur ? 'Iuran Maret 2026 Diliburkan' : 'Klik tanda - atau TUTUP di baris warga untuk kelola'}
                    >
                      <div>{b.short}</div>
                      {b.isLibur && (
                        <span className="inline-block text-[8px] font-black text-amber-900 bg-amber-200/90 px-1 rounded mt-0.5 tracking-tight">
                          LIBUR
                        </span>
                      )}
                    </th>
                  ))}
                  <th className="py-2.5 px-2.5 text-right min-w-[100px] bg-slate-100 text-slate-700 font-bold">
                    <div className="leading-tight">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">Total Terbayar</span>
                      <span className="text-[10px] text-slate-800 font-black">Periode Berjalan</span>
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-right min-w-[130px] bg-emerald-50/90 text-emerald-950 border-l border-emerald-200 font-bold"
                    title="Rumus: Total Terbayar Periode Berjalan + Tagihan Tahun Sebelum"
                  >
                    <div className="leading-tight">
                      <span className="block text-[8px] uppercase tracking-wider text-emerald-700 font-bold">Total Terbayar +</span>
                      <span className="text-[10px] text-emerald-950 font-black">Tagihan Tahun Sebelum</span>
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-right min-w-[130px] bg-blue-50/90 text-blue-950 border-l border-blue-200 font-bold"
                    title={`Estimasi kewajiban tagihan iuran ke warga untuk bulan berikutnya (${nextMonthObj.label})`}
                  >
                    <div className="leading-tight">
                      <span className="block text-[8px] uppercase tracking-wider text-blue-700 font-bold">Tagihan Warga</span>
                      <span className="text-[10px] text-blue-950 font-black">Bulan Berikutnya</span>
                      <span className="block text-[7.5px] font-semibold text-blue-800/90 mt-0.5">({nextMonthObj.short})</span>
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-center min-w-[130px] bg-emerald-50/90 text-emerald-950 border-l border-emerald-200 font-bold"
                    title="Kirim rincian tagihan iuran langsung ke nomor WhatsApp warga"
                  >
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <div className="flex items-center gap-1 text-emerald-800">
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span className="text-[10px] text-emerald-950 font-black">Kirim Tagihan</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-emerald-700 font-bold mt-0.5">WhatsApp</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada data warga yang sesuai kriteria filter.</p>
                      <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian atau ganti filter status.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((kk, idx) => {
                    const kkPayments = paidMap.get(kk.noKk);
                    const kkTarif = getTarifByKK(kk.noKk);
                    const totalTarifKK = kkTarif?.totalTarif ?? 25000;
                    const tagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;
                    const currentMonthPayment = kkPayments?.get(selectedBulanFilter);

                    let totalNominalPaid = 0;
                    BULAN_NAMES.forEach((b) => {
                      if (kkPayments?.has(b.key)) {
                        totalNominalPaid += kkPayments.get(b.key)!.nominal;
                      }
                    });

                    // Tagihan Periode Berjalan: Hanya menghitung bulan yang TIDAK libur dan TIDAK ditutup
                    let bulanAktifWajibCount = 0;
                    BULAN_NAMES.forEach((b) => {
                      const isClosed = kkTarif?.bulanDitutup?.includes(b.key);
                      if (!b.isLibur && !isClosed) {
                        bulanAktifWajibCount++;
                      }
                    });

                    return (
                      <tr key={kk.noKk} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{kk.namaKepala}</span>
                            {hasPermission('manage_kas') && (
                              <button
                                type="button"
                                onClick={() => handleOpenTarifForKK(kk.noKk)}
                                className="text-slate-400 hover:text-orange-700 p-0.5 rounded hover:bg-orange-50 transition-colors cursor-pointer"
                                title="Atur tarif iuran khusus KK ini"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{kk.noKk}</div>
                        </td>

                        {/* Tagihan Tahun Sebelum - < 0 Kurang Bayar, > 0 Lebih Bayar */}
                        <td className="py-2 px-2 text-center bg-amber-50/40 border-x border-amber-200">
                          <div className="flex items-center justify-center gap-1">
                            {tagihanSebelum === 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-mono text-xs font-semibold">-</span>
                                {hasPermission('manage_kas') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label, 'sebelum')}
                                    className="p-0.5 text-slate-300 hover:text-amber-700 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                    title="Setel / Koreksi Tagihan Tahun Sebelum"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ) : tagihanSebelum < 0 ? (
                              <div className="inline-flex items-center gap-1" title="Kurang Bayar Tahun Sebelum (< 0)">
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-mono text-[11px] font-bold text-rose-950 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                                    -{formatRupiah(Math.abs(tagihanSebelum))}
                                  </span>
                                  <span className="text-[7.5px] text-rose-700 font-bold tracking-tight mt-0.5">Kurang Bayar</span>
                                </div>
                                {hasPermission('manage_kas') && (
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label, 'sebelum')}
                                      className="p-0.5 text-slate-400 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                      title="Koreksi Tagihan Tahun Sebelum"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTagihanSebelum(kk.noKk)}
                                      className="p-0.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                      title="Hapus / Nolkan Tagihan Tahun Sebelum (Rp 0)"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1" title="Lebih Bayar Tahun Sebelum (> 0)">
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-mono text-[11px] font-bold text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                    +{formatRupiah(tagihanSebelum)}
                                  </span>
                                  <span className="text-[7.5px] text-emerald-700 font-bold tracking-tight mt-0.5">Lebih Bayar</span>
                                </div>
                                {hasPermission('manage_kas') && (
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label, 'sebelum')}
                                      className="p-0.5 text-slate-400 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                      title="Koreksi Tagihan Tahun Sebelum"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTagihanSebelum(kk.noKk)}
                                      className="p-0.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                      title="Hapus / Nolkan Saldo Tahun Sebelum (Rp 0)"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 12 Bulan Cells - Bisa ditutup jika warga tidak ikut iuran dari awal */}
                        {BULAN_NAMES.map((b) => {
                          const payment = kkPayments?.get(b.key);
                          const isHighlighted = selectedBulanFilter === b.key;
                          const isClosed = isMonthClosed(kk.noKk, b.key);

                          return (
                            <td
                              key={b.key}
                              className={`py-2 px-1 text-center text-[10px] ${
                                b.isLibur
                                  ? 'bg-amber-50/50 border-x border-amber-100/70'
                                  : isHighlighted
                                  ? 'bg-emerald-50/60 font-semibold'
                                  : ''
                              }`}
                            >
                              {payment ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedKwitansi(payment);
                                    setIsKwitansiModalOpen(true);
                                  }}
                                  className="w-full py-1 px-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold border border-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center leading-tight shadow-2xs"
                                  title={`Lunas (${b.label}): ${formatRupiah(payment.nominal)} (Klik untuk kuitansi / koreksi)`}
                                >
                                  <span className="text-[9px]">Lunas</span>
                                  <span className="text-[8px] font-mono opacity-80">
                                    {(payment.nominal / 1000).toFixed(0)}k
                                  </span>
                                </button>
                              ) : b.isLibur ? (
                                <span
                                  className="inline-flex items-center justify-center w-full py-1 px-0.5 rounded text-[8px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300/80 select-none tracking-tight"
                                  title="Iuran Maret 2026: Libur Iuran Warga (Bebas Iuran)"
                                >
                                  LIBUR
                                </span>
                              ) : isClosed ? (
                                <button
                                  type="button"
                                  onClick={() => setCellActionTarget({
                                    noKk: kk.noKk,
                                    namaKepala: kk.namaKepala,
                                    monthKey: b.key,
                                    monthLabel: b.label,
                                    isClosed: true
                                  })}
                                  className="inline-flex items-center justify-center w-full py-1 px-0.5 rounded text-[8px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 transition-colors cursor-pointer select-none"
                                  title="Bulan Ditutup (Warga belum ikut iuran dari awal). Klik untuk kelola / buka."
                                >
                                  TUTUP
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setCellActionTarget({
                                    noKk: kk.noKk,
                                    namaKepala: kk.namaKepala,
                                    monthKey: b.key,
                                    monthLabel: b.label,
                                    isClosed: false
                                  })}
                                  className="inline-block w-full py-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded font-mono transition-colors cursor-pointer"
                                  title="Belum terbayar. Klik untuk tutup bulan (jika belum ikut) atau catat pembayaran."
                                >
                                  -
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Nominal Terbayar Periode Berjalan */}
                        <td className="py-2.5 px-2.5 text-right font-mono text-[11px] whitespace-nowrap bg-slate-50/50">
                          <div className="font-bold text-slate-900">
                            {formatRupiah(totalNominalPaid)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-normal">
                            {bulanAktifWajibCount} bln wajib
                          </div>
                        </td>

                        {/* Rumus: Total Terbayar Periode Berjalan + Tagihan Tahun Sebelum */}
                        <td
                          className="py-2.5 px-3 text-right font-mono text-[11px] whitespace-nowrap bg-emerald-50/30 border-l border-emerald-100"
                          title={`Rumus: Terbayar (${formatRupiah(totalNominalPaid)}) + Tagihan Sebelum (${tagihanSebelum < 0 ? '-' : '+'}${formatRupiah(Math.abs(tagihanSebelum))}) = ${formatRupiah(totalNominalPaid + tagihanSebelum)}`}
                        >
                          {totalNominalPaid + tagihanSebelum < 0 ? (
                            <span className="text-slate-300 font-medium">-</span>
                          ) : totalNominalPaid + tagihanSebelum === 0 ? (
                            <div className="font-bold text-slate-700">Rp 0</div>
                          ) : (
                            <div className="font-extrabold text-emerald-800">
                              +{formatRupiah(totalNominalPaid + tagihanSebelum)}
                            </div>
                          )}
                          {totalNominalPaid + tagihanSebelum >= 0 && tagihanSebelum !== 0 && (
                            <div className="text-[8px] text-slate-400 font-normal leading-tight mt-0.5">
                              <span>
                                {tagihanSebelum > 0
                                  ? `(+${(tagihanSebelum / 1000).toFixed(0)}k)`
                                  : `(-${(Math.abs(tagihanSebelum) / 1000).toFixed(0)}k)`}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Kolom Tagihan ke Warga Bulan Berikutnya */}
                        <td className="py-2.5 px-3 text-right font-mono bg-blue-50/30 border-l border-blue-200">
                          {(() => {
                            const nextBill = getTagihanBulanBerikutnya(kk.noKk);
                            if (nextBill.status === 'lunas') {
                              return (
                                <div className="inline-flex flex-col items-end" title={`Sudah terbayar di muka untuk bulan ${nextMonthObj.label}`}>
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    LUNAS
                                  </span>
                                  <span className="text-[8px] text-emerald-700 font-semibold mt-0.5">
                                    Rp 0 Tagihan
                                  </span>
                                </div>
                              );
                            }
                            if (nextBill.status === 'dihapus') {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="flex flex-col items-end">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                      Dihapus (Rp 0)
                                    </span>
                                    <span className="text-[7.5px] text-slate-400 mt-0.5">
                                      Penetapan: {formatRupiah(nextBill.penetapan)}
                                    </span>
                                  </div>
                                  {hasPermission('manage_kas') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                      className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100/60 rounded transition-colors cursor-pointer"
                                      title={`Koreksi / Pulihkan Nilai Tagihan ${nextMonthObj.label}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            if (nextBill.status === 'dikoreksi') {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono font-black text-indigo-950 text-xs">
                                        {formatRupiah(nextBill.nominal)}
                                      </span>
                                      <span className="text-[8px] px-1 py-0.2 bg-indigo-100 text-indigo-800 font-extrabold rounded">
                                        Koreksi
                                      </span>
                                    </div>
                                    <span className="text-[7.5px] text-slate-400 mt-0.5">
                                      Penetapan: {formatRupiah(nextBill.penetapan)}
                                    </span>
                                  </div>
                                  {hasPermission('manage_kas') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                      className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-100/60 rounded transition-colors cursor-pointer"
                                      title={`Ubah Koreksi / Hapus Tagihan ${nextMonthObj.label}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            if (nextBill.status === 'libur') {
                              return (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  Libur Iuran
                                </span>
                              );
                            }
                            if (nextBill.status === 'ditutup') {
                              return (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                  Bebas / Tutup
                                </span>
                              );
                            }
                            if (nextBill.status === 'sebagian') {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="flex flex-col items-end">
                                    <span className="text-amber-900 font-bold text-xs">
                                      {formatRupiah(nextBill.nominal)}
                                    </span>
                                    <span className="text-[8px] text-slate-500">
                                      (Sebagian Terbayar)
                                    </span>
                                  </div>
                                  {hasPermission('manage_kas') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                      className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 rounded transition-colors cursor-pointer"
                                      title={`Koreksi / Hapus Sisa Tagihan ${nextMonthObj.label}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center justify-end gap-1.5" title={`Nilai Tagihan Warga sesuai Penetapan Iuran: ${formatRupiah(nextBill.nominal)}`}>
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-blue-950 text-xs font-mono">
                                    {formatRupiah(nextBill.nominal)}
                                  </span>
                                  <span className="text-[8px] text-blue-700 font-medium">
                                    Sesuai Penetapan
                                  </span>
                                </div>
                                {hasPermission('manage_kas') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                    className="p-1 text-slate-300 hover:text-blue-700 hover:bg-blue-100/60 rounded transition-colors cursor-pointer"
                                    title={`Koreksi atau Hapus Nilai Tagihan ${nextMonthObj.label} untuk KK ini`}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Kolom Kirim Tagihan ke Warga via WhatsApp */}
                        <td className="py-2.5 px-3 text-center bg-emerald-50/20 border-l border-emerald-100 whitespace-nowrap">
                          {(() => {
                            const contact = findKKContact(kk.noKk, wargaList);
                            return (
                              <div className="flex flex-col items-center justify-center">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSendWhatsAppTagihanDirect(kk)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs active:scale-95"
                                    title={contact.phone
                                      ? `Kirim Tagihan via WhatsApp ke ${contact.personName} (${contact.phone})`
                                      : `Kirim Tagihan via WhatsApp ke ${contact.personName} (Pilih kontak di WA)`
                                    }
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                    <span>Kirim WA</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppTagihanModal(kk)}
                                    className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-emerald-100/80 rounded-md transition-colors cursor-pointer"
                                    title="Pratinjau & Sesuaikan Pesan WhatsApp Tagihan"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {contact.phone ? (
                                  <div className="text-[9px] text-slate-400 font-mono mt-0.5 max-w-[125px] truncate" title={contact.phone}>
                                    +{formatWhatsAppNumber(contact.phone)}
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-amber-700 font-medium mt-0.5">
                                    No. HP belum ada
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Aksi Button */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedKkForCard(kk)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Buka Kartu Kendali Iuran KK ini"
                            >
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              <span>Kartu KK</span>
                            </button>
                            {hasPermission('manage_kas') && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddForKK(kk)}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5 shadow-2xs"
                                title="Buka form pembayaran iuran KK ini"
                              >
                                <span>+ Bayar</span>
                              </button>
                            )}
                            {hasPermission('manage_kas') && currentMonthPayment && (
                              <button
                                type="button"
                                onClick={() => setItemToDelete(currentMonthPayment)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                title={`Hapus pembayaran bulan ${BULAN_NAMES.find(b => b.key === selectedBulanFilter)?.short || selectedBulanFilter} (${formatRupiah(currentMonthPayment.nominal)}) untuk ${kk.namaKepala}`}
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/95 font-bold text-[11px] text-slate-800 border-t-2 border-slate-300 sticky bottom-0 shadow-xs">
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-right font-black uppercase text-slate-700">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-xs font-black border-x border-amber-200 bg-amber-50">
                    <div className={grandTotalTagihanSebelum < 0 ? 'text-rose-950 font-bold' : grandTotalTagihanSebelum > 0 ? 'text-emerald-950 font-bold' : 'text-slate-500'}>
                      {grandTotalTagihanSebelum > 0 ? '+' : ''}{formatRupiah(grandTotalTagihanSebelum)}
                    </div>
                    <div className="text-[8px] text-slate-500 font-normal">
                      {grandTotalTagihanSebelum < 0 ? '(Kurang Bayar)' : grandTotalTagihanSebelum > 0 ? '(Lebih Bayar)' : '(Nihil)'}
                    </div>
                  </td>
                  {BULAN_NAMES.map((b, idx) => (
                    <td
                      key={b.key}
                      className={`py-3 px-1 text-center font-mono text-[10px] ${
                        b.isLibur ? 'bg-amber-100/80 text-amber-900' : 'text-slate-700'
                      }`}
                    >
                      {b.isLibur ? (
                        <span className="text-[8px] font-black text-amber-900">LIBUR</span>
                      ) : monthlyTotals2026[idx] > 0 ? (
                        <span>{(monthlyTotals2026[idx] / 1000).toFixed(0)}k</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap bg-slate-100">
                    <div>{formatRupiah(grandTotalBerjalan2026)}</div>
                    <div className="text-[8px] text-slate-500 font-normal">
                      (Terbayar)
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black whitespace-nowrap bg-emerald-50/70 border-l border-emerald-200">
                    <div className={grandTotalAkhir < 0 ? 'text-slate-400 font-bold' : 'text-emerald-950 font-black'}>
                      {grandTotalAkhir < 0 ? '-' : (grandTotalAkhir > 0 ? '+' : '') + formatRupiah(grandTotalAkhir)}
                    </div>
                    <div className="text-[8px] text-slate-500 font-normal">
                      (Terbayar + Seb)
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black whitespace-nowrap bg-blue-50/80 border-l border-blue-200">
                    <div className="text-blue-950 font-black">
                      {formatRupiah(grandTotalTagihanBulanBerikutnya)}
                    </div>
                    <div className="text-[8px] text-blue-700 font-normal">
                      (Tagihan {nextMonthObj.short})
                    </div>
                  </td>
                  <td className="bg-emerald-50/40 border-l border-emerald-100"></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* VIEW 1B: KARTU IURAN PER BULAN BERJALAN SAJA */}
        {viewMode === 'matrix' && kartuScope === 'perbulan' && (
          <div className="overflow-x-auto custom-scrollbar">
            {/* Header Keterangan Bulan Berjalan */}
            <div className="p-3 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-emerald-950">
                  Kartu Iuran Per Bulan Berjalan:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-black text-[11px] shadow-2xs">
                  {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.label || selectedBulanFilter}
                </span>
                {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.isLibur && (
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                    Bulan Libur Iuran RT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600">
                Menampilkan status kewajiban &amp; setoran iuran per KK khusus bulan ini. Klik <strong>Kartu KK</strong> untuk mencetak kartu iuran keluarga.
              </div>
            </div>

            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3 min-w-[170px]">Kepala Keluarga &amp; No. KK</th>
                  <th className="py-2.5 px-3 text-right min-w-[130px]">Tarif Iuran Warga</th>
                  <th className="py-2.5 px-2 text-center text-[10px] min-w-[115px] bg-amber-50/90 text-amber-950 font-black border-x border-amber-200">
                    <div className="leading-tight">
                      <span className="block text-[8px] uppercase tracking-wider text-amber-700 font-bold">Tagihan</span>
                      <span className="text-[10px] text-amber-950 font-black">Tahun Sebelum</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">
                    Status Bulan {BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.short}
                  </th>
                  <th className="py-2.5 px-3 text-right min-w-[120px]">Terbayar Bulan Ini</th>
                  <th
                    className="py-2.5 px-3 text-right min-w-[130px] bg-blue-50/90 text-blue-950 border-l border-blue-200 font-bold"
                    title={`Estimasi kewajiban tagihan iuran ke warga untuk bulan berikutnya (${nextMonthObj.label})`}
                  >
                    <div className="leading-tight">
                      <span className="block text-[8px] uppercase tracking-wider text-blue-700 font-bold">Tagihan Warga</span>
                      <span className="text-[10px] text-blue-950 font-black">Bulan Berikutnya</span>
                      <span className="block text-[7.5px] font-semibold text-blue-800/90 mt-0.5">({nextMonthObj.short})</span>
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-center min-w-[130px] bg-emerald-50/90 text-emerald-950 border-l border-emerald-200 font-bold"
                    title="Kirim rincian tagihan iuran langsung ke nomor WhatsApp warga"
                  >
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <div className="flex items-center gap-1 text-emerald-800">
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span className="text-[10px] text-emerald-950 font-black">Kirim Tagihan</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-emerald-700 font-bold mt-0.5">WhatsApp</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 min-w-[150px]">Tgl &amp; Metode Bayar</th>
                  <th className="py-2.5 px-3 text-center min-w-[170px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Tidak ada data KK yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((kk, idx) => {
                    const kkTarif = getTarifByKK(kk.noKk);
                    const totalTarifKK = kkTarif?.totalTarif ?? 25000;
                    const tagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;
                    const payment = paidMap.get(kk.noKk)?.get(selectedBulanFilter);
                    const isLibur = BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.isLibur;
                    const isClosed = kkTarif?.bulanDitutup?.includes(selectedBulanFilter);

                    return (
                      <tr key={kk.noKk} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{kk.namaKepala}</span>
                            {hasPermission('manage_kas') && (
                              <button
                                type="button"
                                onClick={() => handleOpenTarifForKK(kk.noKk)}
                                className="text-slate-400 hover:text-orange-700 p-0.5 rounded hover:bg-orange-50 transition-colors cursor-pointer"
                                title="Atur tarif iuran khusus KK ini"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{kk.noKk}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-bold font-mono text-slate-800">
                            {formatRupiah(totalTarifKK)}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            J:{((kkTarif?.ikutJimpitan ? (kkTarif?.jimpitan ?? 15000) : 0) / 1000).toFixed(0)}k &bull; M:{((kkTarif?.ikutUangMeja ? (kkTarif?.uangMeja ?? 10000) : 0) / 1000).toFixed(0)}k
                            {(kkTarif?.ikutTabungan && (kkTarif?.tabungan ?? 0) > 0) ? ` • T:${((kkTarif?.tabungan ?? 0) / 1000).toFixed(0)}k` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-[11px] bg-amber-50/40 border-x border-amber-100">
                          <div className="flex items-center justify-end gap-1">
                            {tagihanSebelum === 0 ? (
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-normal">-</span>
                                {hasPermission('manage_kas') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label, 'sebelum')}
                                    className="p-0.5 text-slate-300 hover:text-amber-700 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                    title="Setel / Koreksi Tagihan Tahun Sebelum"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ) : tagihanSebelum < 0 ? (
                              <div className="flex items-center gap-1">
                                <div className="text-rose-950 font-bold">
                                  -{formatRupiah(Math.abs(tagihanSebelum))}
                                </div>
                                {hasPermission('manage_kas') && (
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label, 'sebelum')}
                                      className="p-0.5 text-slate-400 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                      title="Koreksi Tagihan Tahun Sebelum"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTagihanSebelum(kk.noKk)}
                                      className="p-0.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                      title="Hapus / Nolkan Tagihan Tahun Sebelum (Rp 0)"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="text-emerald-950 font-bold">
                                  +{formatRupiah(tagihanSebelum)}
                                </div>
                                {hasPermission('manage_kas') && (
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label, 'sebelum')}
                                      className="p-0.5 text-slate-400 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                                      title="Koreksi Tagihan Tahun Sebelum"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTagihanSebelum(kk.noKk)}
                                      className="p-0.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                      title="Hapus / Nolkan Saldo Tahun Sebelum (Rp 0)"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {payment ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              LUNAS
                            </span>
                          ) : isLibur ? (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900">
                              LIBUR
                            </span>
                          ) : isClosed ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              DITUTUP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              BELUM BAYAR
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {payment ? (
                            <span className="text-emerald-800 font-black">{formatRupiah(payment.nominal)}</span>
                          ) : (
                            <span className="text-slate-300 font-normal">Rp 0</span>
                          )}
                        </td>
                        {/* Kolom Tagihan Bulan Berikutnya */}
                        <td className="py-2.5 px-3 text-right font-mono bg-blue-50/30 border-l border-blue-100">
                          {(() => {
                            const nextBill = getTagihanBulanBerikutnya(kk.noKk);
                            if (nextBill.status === 'lunas') {
                              return (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  LUNAS
                                </span>
                              );
                            }
                            if (nextBill.status === 'dihapus') {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="flex flex-col items-end">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                      Dihapus (Rp 0)
                                    </span>
                                    <span className="text-[7.5px] text-slate-400 mt-0.5">
                                      Penetapan: {formatRupiah(nextBill.penetapan)}
                                    </span>
                                  </div>
                                  {hasPermission('manage_kas') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                      className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100/60 rounded transition-colors cursor-pointer"
                                      title={`Koreksi / Pulihkan Nilai Tagihan ${nextMonthObj.label}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            if (nextBill.status === 'dikoreksi') {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono font-black text-indigo-950 text-xs">
                                        {formatRupiah(nextBill.nominal)}
                                      </span>
                                      <span className="text-[8px] px-1 py-0.2 bg-indigo-100 text-indigo-800 font-extrabold rounded">
                                        Koreksi
                                      </span>
                                    </div>
                                    <span className="text-[7.5px] text-slate-400 mt-0.5">
                                      Penetapan: {formatRupiah(nextBill.penetapan)}
                                    </span>
                                  </div>
                                  {hasPermission('manage_kas') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                      className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-100/60 rounded transition-colors cursor-pointer"
                                      title={`Ubah Koreksi / Hapus Tagihan ${nextMonthObj.label}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            if (nextBill.status === 'libur') {
                              return (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  Libur
                                </span>
                              );
                            }
                            if (nextBill.status === 'ditutup') {
                              return (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                  Bebas/Tutup
                                </span>
                              );
                            }
                            if (nextBill.status === 'sebagian') {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="flex flex-col items-end">
                                    <span className="text-amber-900 font-bold text-xs">{formatRupiah(nextBill.nominal)}</span>
                                    <span className="text-[8px] text-slate-500">(Sisa Tagihan)</span>
                                  </div>
                                  {hasPermission('manage_kas') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                      className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 rounded transition-colors cursor-pointer"
                                      title={`Koreksi / Hapus Sisa Tagihan ${nextMonthObj.label}`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center justify-end gap-1.5" title={`Nilai Tagihan Warga sesuai Penetapan Iuran: ${formatRupiah(nextBill.nominal)}`}>
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-blue-950 text-xs font-mono">{formatRupiah(nextBill.nominal)}</span>
                                  <span className="text-[8px] text-blue-700/80 font-medium">Sesuai Penetapan</span>
                                </div>
                                {hasPermission('manage_kas') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenKoreksiTagihan(kk, nextMonthObj.key, nextMonthObj.label)}
                                    className="p-1 text-slate-300 hover:text-blue-700 hover:bg-blue-100/60 rounded transition-colors cursor-pointer"
                                    title={`Koreksi atau Hapus Nilai Tagihan ${nextMonthObj.label} untuk KK ini`}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Kolom Kirim Tagihan ke Warga via WhatsApp */}
                        <td className="py-2.5 px-3 text-center bg-emerald-50/20 border-l border-emerald-100 whitespace-nowrap">
                          {(() => {
                            const contact = findKKContact(kk.noKk, wargaList);
                            return (
                              <div className="flex flex-col items-center justify-center">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSendWhatsAppTagihanDirect(kk)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs active:scale-95"
                                    title={contact.phone
                                      ? `Kirim Tagihan via WhatsApp ke ${contact.personName} (${contact.phone})`
                                      : `Kirim Tagihan via WhatsApp ke ${contact.personName} (Pilih kontak di WA)`
                                    }
                                  >
                                    <MessageCircle className="w-3 h-3 fill-current" />
                                    <span>Kirim WA</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppTagihanModal(kk)}
                                    className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-emerald-100/80 rounded-md transition-colors cursor-pointer"
                                    title="Pratinjau & Sesuaikan Pesan WhatsApp Tagihan"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                                {contact.phone ? (
                                  <div className="text-[9px] text-slate-400 font-mono mt-0.5 max-w-[125px] truncate" title={contact.phone}>
                                    +{formatWhatsAppNumber(contact.phone)}
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-amber-700 font-medium mt-0.5">
                                    No. HP belum ada
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-2.5 px-3 text-[11px]">
                          {payment ? (
                            <div>
                              <div className="font-semibold text-slate-800">{payment.tanggalBayar}</div>
                              <div className="text-[10px] text-slate-500">{payment.metode}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedKkForCard(kk)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Buka Kartu Kendali Iuran KK ini"
                            >
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              <span>Kartu KK</span>
                            </button>
                            {payment ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedKwitansi(payment);
                                    setIsKwitansiModalOpen(true);
                                  }}
                                  className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  title="Lihat Kuitansi Pembayaran"
                                >
                                  <Receipt className="w-3 h-3 text-emerald-600" />
                                  <span>Kuitansi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    directSendWhatsAppKwitansi(payment, wargaList);
                                  }}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                  title="Kirim Kuitansi Langsung ke WhatsApp Warga"
                                >
                                  <MessageCircle className="w-3 h-3 fill-current" />
                                </button>
                                {hasPermission('manage_kas') && (
                                  <button
                                    type="button"
                                    onClick={() => setItemToDelete(payment)}
                                    className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                    title={`Hapus pembayaran bulan ${payment.bulan} untuk ${payment.namaWarga}`}
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              hasPermission('manage_kas') && !isLibur && !isClosed && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddForKK(kk)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-0.5"
                                  title="Catat Pembayaran Iuran KK Ini"
                                >
                                  <span>+ Bayar</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/95 font-bold text-[11px] text-slate-800 border-t-2 border-slate-300 sticky bottom-0 shadow-xs">
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-right font-black uppercase text-slate-700">
                    TOTAL KESELURUHAN BULAN INI:
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                    {formatRupiah(summaryMetrics.potensiBulanIni)}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-xs font-black border-x border-amber-200 bg-amber-50">
                    <div className={grandTotalTagihanSebelum < 0 ? 'text-rose-950 font-bold' : grandTotalTagihanSebelum > 0 ? 'text-emerald-950 font-bold' : 'text-slate-500'}>
                      {grandTotalTagihanSebelum > 0 ? '+' : ''}{formatRupiah(grandTotalTagihanSebelum)}
                    </div>
                    <div className="text-[8px] text-slate-500 font-normal">
                      {grandTotalTagihanSebelum < 0 ? '(Kurang)' : grandTotalTagihanSebelum > 0 ? '(Lebih)' : '(Nihil)'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-800 font-black">
                    {summaryMetrics.paidCount} / {summaryMetrics.totalKk} KK ({summaryMetrics.percentage}%)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-900 font-black text-xs">
                    {formatRupiah(summaryMetrics.totalUangBulanIni)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-blue-950 bg-blue-50/70 border-l border-blue-200 text-xs">
                    <div>{formatRupiah(grandTotalTagihanBulanBerikutnya)}</div>
                    <div className="text-[8px] text-blue-700 font-normal">(Tagihan {nextMonthObj.short})</div>
                  </td>
                  <td className="bg-emerald-50/40 border-l border-emerald-100"></td>
                  <td colSpan={2} className="py-3 px-3 text-slate-600 font-normal text-[10px]">
                    Belum Lunas: <strong>{summaryMetrics.unpaidCount} KK</strong> &bull; Potensi: {formatRupiah(summaryMetrics.potensiBulanIni)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {viewMode === 'history' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3">No. Kwitansi</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kepala Keluarga</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Rincian Iuran</th>
                  <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  <th className="py-2.5 px-3 text-center">Metode</th>
                  <th className="py-2.5 px-3">Penerima</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada riwayat pembayaran iuran yang ditemukan.</p>
                      <p className="text-[11px] mt-1">Gunakan tombol "Catat Iuran Baru" untuk menambahkan transaksi iuran warga.</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-emerald-900">
                        {item.noKwitansi}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {item.tanggalBayar}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.namaWarga}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {BULAN_NAMES.find((b) => b.key === item.bulan)?.label || item.bulan}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">
                            Jimpitan: <strong className="text-slate-800">Rp {(item.rincian?.jimpitan ?? 15000).toLocaleString('id-ID')}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Uang Meja: <strong className="text-slate-800">Rp {(item.rincian?.uangMeja ?? 10000).toLocaleString('id-ID')}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Tabungan: <strong className={(item.rincian?.tabungan ?? 0) > 0 ? 'text-emerald-900' : 'text-slate-800'}>Rp {(item.rincian?.tabungan ?? 0).toLocaleString('id-ID')}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-800 whitespace-nowrap font-mono">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.metode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {item.penerima}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Tombol Cetak Slip */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKwitansi(item);
                              setIsKwitansiModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat & Cetak Kuitansi Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Kirim WhatsApp Langsung */}
                          <button
                            type="button"
                            onClick={() => {
                              directSendWhatsAppKwitansi(item, wargaList);
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Kirim Kuitansi Langsung ke WhatsApp Warga"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Tombol Koreksi / Edit Iuran */}
                          {hasPermission('manage_kas') && (
                            <button
                              type="button"
                              onClick={() => setItemToEdit(item)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Koreksi / Ubah Catatan Iuran Ini"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          {hasPermission('manage_kas') && (
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Catatan Iuran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD IURAN */}
      {isAddModalOpen && (
        <AddIuranModal
          kkList={uniqueKKList}
          tarifWargaList={tarifWargaList}
          getTarifByKK={getTarifByKK}
          preselectedKk={preselectedKk}
          onClose={() => {
            setIsAddModalOpen(false);
            setPreselectedKk(null);
          }}
          onSuccess={(data, sync) => {
            addPembayaranIuran(data, sync);
            showToast(`Pembayaran iuran ${data.namaWarga} berhasil dicatat.`);
          }}
          onUpdateTarifWarga={updateTarifWarga}
          onOpenTarifModal={() => setIsTarifModalOpen(true)}
        />
      )}

      {/* MODAL: KOREKSI IURAN */}
      {itemToEdit && (
        <KoreksiIuranModal
          item={itemToEdit}
          onClose={() => setItemToEdit(null)}
          onSave={handleKoreksiSave}
        />
      )}

      {/* MODAL: KWITANSI RESMI */}
      {isKwitansiModalOpen && selectedKwitansi && (
        <KwitansiModal
          selectedKwitansi={selectedKwitansi}
          onClose={() => setIsKwitansiModalOpen(false)}
          canManage={hasPermission('manage_kas')}
          onKoreksi={(item) => setItemToEdit(item)}
          onDelete={(item) => setItemToDelete(item)}
          wargaList={wargaList}
        />
      )}

      {/* MODAL: PENGATURAN TARIF PER KK */}
      {isTarifModalOpen && (
        <TarifModal
          tarifWargaList={tarifWargaList}
          wargaList={wargaList}
          initialEditingNoKk={editingTarifKkTarget || undefined}
          onClose={() => {
            setIsTarifModalOpen(false);
            setEditingTarifKkTarget(null);
          }}
          onSaveAll={(newList) => {
            saveAllTarifWarga(newList);
            showToast('Pengaturan tarif warga berhasil disimpan.');
          }}
          onUpdateTarif={(noKk, data) => {
            updateTarifWarga(noKk, data);
            showToast('Tarif khusus warga berhasil diperbarui.');
          }}
        />
      )}

      {/* MODAL: CETAK REKAPITULASI */}
      {isPrintRekapOpen && (
        <RekapModal
          kkList={uniqueKKList}
          paidMap={paidMap}
          getTarifByKK={getTarifByKK}
          totalUangYtd={summaryMetrics.totalUangYtd}
          targetMonthLabel={BULAN_NAMES.find((b) => b.key === selectedBulanFilter)?.label || ''}
          targetMonthKey={selectedBulanFilter}
          onClose={() => setIsPrintRekapOpen(false)}
        />
      )}

      {/* MODAL: KARTU KENDALI IURAN WARGA (PER KK) */}
      {selectedKkForCard && (
        <KartuIuranKKModal
          kk={selectedKkForCard}
          tarif={getTarifByKK(selectedKkForCard.noKk)}
          payments={paidMap.get(selectedKkForCard.noKk) || new Map()}
          currentMonthKey={selectedBulanFilter}
          onClose={() => setSelectedKkForCard(null)}
          onOpenEditTarif={(noKk) => {
            setSelectedKkForCard(null);
            handleOpenTarifForKK(noKk);
          }}
          onPayMonth={(monthKey) => {
            const kkToPay = selectedKkForCard;
            setSelectedKkForCard(null);
            setPreselectedKk({ noKk: kkToPay.noKk, namaKepala: kkToPay.namaKepala });
            setSelectedBulanFilter(monthKey);
            setIsAddModalOpen(true);
          }}
          onViewKwitansi={(payment) => {
            setSelectedKwitansi(payment);
            setIsKwitansiModalOpen(true);
          }}
          onDeletePayment={(payment) => {
            setItemToDelete(payment);
          }}
          canManage={hasPermission('manage_kas')}
          wargaList={wargaList}
        />
      )}

      {/* MODAL: KONFIRMASI HAPUS */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Catatan Iuran</h4>
                <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan iuran{' '}
              <strong>{itemToDelete.namaWarga}</strong> untuk periode{' '}
              <strong>{itemToDelete.bulan}</strong> sebesar{' '}
              <strong>{formatRupiah(itemToDelete.nominal)}</strong>?
              {itemToDelete.transaksiKasId && (
                <span className="block mt-1 text-slate-500 italic">
                  * Pemasukan di Kas Besar juga akan otomatis disesuaikan.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePembayaranIuran(itemToDelete.id);
                  setItemToDelete(null);
                  showToast('Catatan iuran berhasil dihapus.');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Kelola Periode Bulan (Tutup / Buka / Bayar) */}
      {cellActionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${cellActionTarget.isClosed ? 'bg-slate-700' : 'bg-emerald-700'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Kelola Periode Bulan</h4>
                  <p className="text-[10px] text-slate-500">{cellActionTarget.monthLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCellActionTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Kepala Keluarga:</div>
              <div className="font-bold text-slate-900 mt-0.5">{cellActionTarget.namaKepala}</div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Status Bulan:</span>
                {cellActionTarget.isClosed ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                    DITUTUP (Tidak Ada Tagihan)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                    AKTIF (Wajib Iuran)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                {cellActionTarget.isClosed
                  ? 'Bulan ini ditutup karena warga belum ikut iuran dari awal. Bebas dari kewajiban tagihan.'
                  : 'Bulan ini aktif dan diperhitungkan ke dalam Tagihan Periode Berjalan warga.'}
              </p>
            </div>

            <div className="space-y-2">
              {cellActionTarget.isClosed ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleMonthClosed(cellActionTarget.noKk, cellActionTarget.monthKey);
                    setCellActionTarget(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Buka Kembali Bulan Ini (Wajib Iuran)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    toggleMonthClosed(cellActionTarget.noKk, cellActionTarget.monthKey);
                    setCellActionTarget(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ban className="w-4 h-4 text-slate-600" />
                  <span>Tutup Bulan Ini (Warga Belum Ikut)</span>
                </button>
              )}

              {hasPermission('manage_kas') && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const targetKk = uniqueKKList.find((k) => k.noKk === cellActionTarget.noKk);
                      if (targetKk) {
                        handleOpenKoreksiTagihan(
                          { noKk: targetKk.noKk, namaKepala: targetKk.namaKepala },
                          cellActionTarget.monthKey,
                          cellActionTarget.monthLabel
                        );
                      }
                      setCellActionTarget(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-blue-700" />
                    <span>Koreksi / Hapus Nilai Tagihan Bulan Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetKk = uniqueKKList.find((k) => k.noKk === cellActionTarget.noKk);
                      if (targetKk) {
                        setPreselectedKk({ noKk: targetKk.noKk, namaKepala: targetKk.namaKepala });
                        setIsAddModalOpen(true);
                      }
                      setCellActionTarget(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Catat Pembayaran Iuran Bulan Ini</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setCellActionTarget(null)}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code Bendahara RT */}
      {isQrBendaharaModalOpen && (
        <QrCodeBendaharaModal
          onClose={() => setIsQrBendaharaModalOpen(false)}
        />
      )}

      {/* Modal Pratinjau & Kirim Tagihan WhatsApp */}
      {isWhatsAppTagihanModalOpen && whatsappTagihanKkTarget && (
        <TagihanWhatsAppModal
          isOpen={isWhatsAppTagihanModalOpen}
          onClose={() => {
            setIsWhatsAppTagihanModalOpen(false);
            setWhatsappTagihanKkTarget(null);
          }}
          kk={whatsappTagihanKkTarget}
          wargaList={wargaList}
          getTarifByKK={getTarifByKK}
          paidMap={paidMap}
          selectedBulanFilter={selectedBulanFilter}
          nextMonthObj={nextMonthObj}
          onOpenKoreksiTagihan={handleOpenKoreksiTagihan}
        />
      )}

      {/* Modal Koreksi & Hapus Nilai Tagihan Warga & Tagihan Tahun Sebelum */}
      {koreksiTagihanTarget && (
        <KoreksiTagihanModal
          isOpen={!!koreksiTagihanTarget}
          onClose={() => setKoreksiTagihanTarget(null)}
          kk={koreksiTagihanTarget}
          monthKey={koreksiTagihanTarget.monthKey}
          monthLabel={koreksiTagihanTarget.monthLabel}
          kkTarif={getTarifByKK(koreksiTagihanTarget.noKk)}
          initialTab={koreksiTagihanTarget.initialTab || 'tagihan'}
          onSaveKoreksi={handleSaveKoreksiTagihan}
          onDeleteTagihan={handleDeleteTagihan}
          onSaveTagihanSebelum={handleSaveTagihanSebelum}
          onDeleteTagihanSebelum={handleDeleteTagihanSebelum}
          onUpdatePenetapan={handleUpdatePenetapanFromKoreksi}
        />
      )}
    </div>
  );
};
