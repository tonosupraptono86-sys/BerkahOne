import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Warga, ActivityLog, Role, TransaksiKas, RingkasanKas, PembayaranIuran, TarifWargaKK, PesertaPKK, TransaksiKasPKK, PembayaranIuranPKK, RingkasanKasPKK } from '../types';
import { INITIAL_WARGA_DATA } from '../data/initialWarga';
import { INITIAL_USERS, INITIAL_LOGS } from '../data/initialUsers';
import { INITIAL_KAS_DATA } from '../data/initialKas';
import { INITIAL_IURAN_DATA } from '../data/initialIuran';
import { INITIAL_TARIF_WARGA } from '../data/initialTarifIuran';
import { INITIAL_PESERTA_PKK, INITIAL_KAS_PKK, INITIAL_IURAN_PKK } from '../data/initialPKK';
import { generateSalt, hashPassword, verifyPassword } from '../utils/authSecurity';

interface RegisterData {
  nama: string;
  username: string;
  email: string;
  password: string;
  noHp?: string;
  nikTerdaftar?: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  wargaList: Warga[];
  logs: ActivityLog[];
  kasList: TransaksiKas[];
  ringkasanKas: RingkasanKas;
  iuranList: PembayaranIuran[];
  tarifWargaList: TarifWargaKK[];
  updateTarifWarga: (noKk: string, updated: Partial<TarifWargaKK>) => void;
  saveAllTarifWarga: (newList: TarifWargaKK[]) => void;
  getTarifByKK: (noKk: string) => TarifWargaKK | undefined;
  activeTab: 'dashboard' | 'warga' | 'kk' | 'laporan' | 'surat' | 'users' | 'kas_besar' | 'pkk';
  setActiveTab: (tab: 'dashboard' | 'warga' | 'kk' | 'laporan' | 'surat' | 'users' | 'kas_besar' | 'pkk') => void;
  activeKasSubTab: 'buku_kas' | 'iuran_warga' | 'undangan_jumpa';
  setActiveKasSubTab: (subTab: 'buku_kas' | 'iuran_warga' | 'undangan_jumpa') => void;
  activePkkSubTab: 'peserta' | 'kas_pkk' | 'iuran_pkk';
  setActivePkkSubTab: (subTab: 'peserta' | 'kas_pkk' | 'iuran_pkk') => void;
  pesertaPKKList: PesertaPKK[];
  kasPKKList: TransaksiKasPKK[];
  iuranPKKList: PembayaranIuranPKK[];
  ringkasanKasPKK: RingkasanKasPKK;
  addPesertaPKK: (data: Omit<PesertaPKK, 'id' | 'createdAt'>) => void;
  updatePesertaPKK: (id: string, data: Partial<PesertaPKK>) => void;
  deletePesertaPKK: (id: string) => void;
  addTransaksiKasPKK: (data: Omit<TransaksiKasPKK, 'id' | 'createdAt'>) => void;
  updateTransaksiKasPKK: (id: string, data: Partial<TransaksiKasPKK>) => void;
  deleteTransaksiKasPKK: (id: string) => void;
  addPembayaranIuranPKK: (data: Omit<PembayaranIuranPKK, 'id' | 'createdAt'>, syncToKas?: boolean) => void;
  updatePembayaranIuranPKK: (id: string, data: Partial<PembayaranIuranPKK>) => void;
  deletePembayaranIuranPKK: (id: string) => void;
  syncPesertaPKKWithWargaIstri: () => { addedCount: number; updatedCount: number };
  login: (username: string, password?: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  addWarga: (data: Omit<Warga, 'id'>) => void;
  updateWarga: (id: string, data: Partial<Warga>) => void;
  deleteWarga: (id: string) => void;
  addUser: (data: Omit<User, 'id'>, password?: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>, newPassword?: string) => Promise<void>;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  addTransaksiKas: (data: Omit<TransaksiKas, 'id' | 'createdAt'>) => void;
  updateTransaksiKas: (id: string, data: Partial<TransaksiKas>) => void;
  deleteTransaksiKas: (id: string) => void;
  deleteAllTransaksiKas: (keepSaldoAwal?: boolean) => void;
  addPembayaranIuran: (data: Omit<PembayaranIuran, 'id' | 'createdAt'>, syncToKas?: boolean) => void;
  updatePembayaranIuran: (id: string, data: Partial<PembayaranIuran>) => void;
  deletePembayaranIuran: (id: string) => void;
  resetToDefaultData: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedKK: string | null;
  setSelectedKK: (noKk: string | null) => void;
  userWarga: Warga | null;
  userNoKk: string | null;
  canManageFamily: (noKk: string) => boolean;
  hasPermission: (action: 'manage_warga' | 'manage_users' | 'export_data' | 'create_surat' | 'manage_kas') => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'berkahone_current_user_v3',
  USERS: 'berkahone_users_v3',
  WARGA: 'berkahone_warga_v2',
  LOGS: 'berkahone_logs_v3',
  KAS: 'berkahone_kas_v7',
  IURAN: 'berkahone_iuran_v3',
  TARIF_WARGA: 'berkahone_tarif_warga_v2',
  PESERTA_PKK: 'berkahone_peserta_pkk_v2',
  KAS_PKK: 'berkahone_kas_pkk_v1',
  IURAN_PKK: 'berkahone_iuran_pkk_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch (e) { 
        console.error(e); 
      }
    }
    // Require login to enter the application
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  const [wargaList, setWargaList] = useState<Warga[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WARGA);
    if (saved) {
      try {
        const parsed: Warga[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Hapus data kependudukan dengan status Famili Lain atau KK 3374062011150003
          const cleaned = parsed.filter(
            (w) =>
              w.statusKeluarga !== 'Famili Lain' &&
              (w.statusKeluarga as string) !== 'Famili Lain' &&
              w.noKk !== '3374062011150003' &&
              !w.nama.toLowerCase().includes('elkana')
          );
          const existingNoKks = new Set(cleaned.map((w) => w.noKk));
          const missingWarga = INITIAL_WARGA_DATA.filter((w) => !existingNoKks.has(w.noKk));
          const mergedList = missingWarga.length > 0 ? [...cleaned, ...missingWarga] : cleaned;
          return mergedList.map((w) => {
            const initialMatch = INITIAL_WARGA_DATA.find((item) => item.id === w.id);
            return {
              ...w,
              noHp: w.noHp || w.telepon || initialMatch?.noHp || initialMatch?.telepon || '',
              telepon: w.telepon || w.noHp || initialMatch?.telepon || initialMatch?.noHp || '',
              personKontak: w.personKontak || initialMatch?.personKontak || ''
            };
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_WARGA_DATA;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LOGS;
  });

  const [kasList, setKasList] = useState<TransaksiKas[]>(() => {
    // Bersihkan versi lama agar seluruh data transaksi lama terhapus total
    ['berkahone_kas_v1', 'berkahone_kas_v2', 'berkahone_kas_v3', 'berkahone_kas_v4', 'berkahone_kas_v5', 'berkahone_kas_v6'].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    const saved = localStorage.getItem(STORAGE_KEYS.KAS);
    if (saved) {
      try {
        const parsed: TransaksiKas[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Hapus seluruh transaksi kas sebelum bulan Februari 2026 (Saldo sebelum periode Februari = 0)
          const validList: TransaksiKas[] = parsed
            .filter((item) => item.tanggal && item.tanggal.substring(0, 7) >= '2026-02')
            .map((item) => {
              const matchInitial = INITIAL_KAS_DATA.find((k) => k.id === item.id);
              // Saldo Awal Kas Kecil Februari 2026 = Rp 2.099.000
              if (
                item.id === 'kas-kcl-sa-2026-02' ||
                (item.kategori?.toLowerCase().includes('saldo awal') && item.posKas === 'kas_kecil' && item.tanggal?.substring(0, 7) === '2026-02')
              ) {
                return {
                  ...item,
                  id: 'kas-kcl-sa-2026-02',
                  posKas: 'kas_kecil' as const,
                  nominal: 2099000,
                  keterangan: 'Saldo Awal Kas Kecil RT Bulan Februari 2026',
                  lpj: 'Tidak Perlu'
                };
              }
              // Saldo Awal Kas BOP Februari 2026 = Rp 0
              if (
                item.id === 'kas-bop-sa-2026-02' ||
                item.id === 'kas-sa-2026-02' ||
                (item.kategori?.toLowerCase().includes('saldo awal') && item.posKas === 'kas_bop' && item.tanggal?.substring(0, 7) === '2026-02')
              ) {
                return {
                  ...item,
                  id: 'kas-bop-sa-2026-02',
                  posKas: 'kas_bop' as const,
                  nominal: 0,
                  keterangan: 'Saldo Awal Kas BOP RT Bulan Februari 2026',
                  lpj: 'Tidak Perlu'
                };
              }
              return {
                ...item,
                lpj: item.lpj || matchInitial?.lpj || (item.posKas === 'kas_bop' ? 'Proses LPJ' : (item.tipe === 'masuk' ? 'Tidak Perlu' : 'Kwitansi Terlampir')),
                keterangan: item.keterangan ? item.keterangan.replace(/Bantuan Operasional Pengurus/g, 'Bantuan Operasional Pemerintah') : item.keterangan
              };
            });

          const hasSaKecil = validList.some(
            (k) => (k.id === 'kas-kcl-sa-2026-02' || (k.kategori?.toLowerCase().includes('saldo awal') && k.posKas === 'kas_kecil')) && k.tanggal?.substring(0, 7) === '2026-02'
          );
          const hasSaBOP = validList.some(
            (k) => (k.id === 'kas-bop-sa-2026-02' || (k.kategori?.toLowerCase().includes('saldo awal') && k.posKas === 'kas_bop')) && k.tanggal?.substring(0, 7) === '2026-02'
          );

          let finalList = validList.filter(k => k.id !== 'kas-sa-2026-02');
          if (!hasSaKecil) {
            finalList = [INITIAL_KAS_DATA[0], ...finalList];
          }
          if (!hasSaBOP) {
            finalList = [...finalList, INITIAL_KAS_DATA[1]];
          }

          return finalList;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_KAS_DATA;
  });

  const [activeTab, setActiveTabState] = useState<'dashboard' | 'warga' | 'kk' | 'laporan' | 'surat' | 'users' | 'kas_besar' | 'pkk'>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role === 'warga') return 'kk';
      } catch (e) {}
    }
    return 'dashboard';
  });

  const setActiveTab = (tab: 'dashboard' | 'warga' | 'kk' | 'laporan' | 'surat' | 'users' | 'kas_besar' | 'pkk') => {
    if (currentUser?.role === 'warga' && tab !== 'kk' && tab !== 'laporan') {
      setActiveTabState('kk');
      return;
    }
    setActiveTabState(tab);
  };

  const [activeKasSubTab, setActiveKasSubTab] = useState<'buku_kas' | 'iuran_warga' | 'undangan_jumpa'>('buku_kas');
  const [activePkkSubTab, setActivePkkSubTab] = useState<'peserta' | 'kas_pkk' | 'iuran_pkk'>('peserta');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKK, setSelectedKK] = useState<string | null>(null);

  // PKK (Pemberdayaan dan Kesejahteraan Keluarga) States
  const [pesertaPKKList, setPesertaPKKList] = useState<PesertaPKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PESERTA_PKK);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PESERTA_PKK;
  });

  const [kasPKKList, setKasPKKList] = useState<TransaksiKasPKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KAS_PKK);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_KAS_PKK;
  });

  const [iuranPKKList, setIuranPKKList] = useState<PembayaranIuranPKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IURAN_PKK);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_IURAN_PKK;
  });

  const [iuranList, setIuranList] = useState<PembayaranIuran[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IURAN);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Maret 2026 diliburkan: pastikan tidak ada data tagihan/pembayaran Maret 2026 & hapus iuran KK 3374062011150003 / Famili Lain
          // dan ubah seluruh tabungan dengan nilai 0
          return parsed
            .filter(
              (item: PembayaranIuran) =>
                item.bulan !== '2026-03' &&
                item.noKk !== '3374062011150003' &&
                !item.namaWarga.toLowerCase().includes('elkana')
            )
            .map((item: PembayaranIuran) => {
              const jimpitan = item.rincian?.jimpitan || 0;
              const uangMeja = item.rincian?.uangMeja || 0;
              const nominal = jimpitan + uangMeja;
              let kategoriIuran = item.kategoriIuran;
              if (jimpitan > 0 && uangMeja > 0) {
                kategoriIuran = 'Jimpitan & Uang Meja';
              } else if (jimpitan > 0) {
                kategoriIuran = 'Jimpitan';
              } else if (uangMeja > 0) {
                kategoriIuran = 'Uang Meja';
              }
              return {
                ...item,
                nominal,
                kategoriIuran,
                rincian: {
                  jimpitan,
                  uangMeja,
                  tabungan: 0
                }
              };
            });
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_IURAN_DATA.filter(
      (item) =>
        item.bulan !== '2026-03' &&
        item.noKk !== '3374062011150003' &&
        !item.namaWarga.toLowerCase().includes('elkana')
    );
  });

  const [tarifWargaList, setTarifWargaList] = useState<TarifWargaKK[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARIF_WARGA);
    if (saved) {
      try {
        const parsed: TarifWargaKK[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const specificOverrides: Record<string, number> = {
            'aris bengkel': -950000,
            'bambang': -240000,
            'eko yong': -660000,
            'sohib susu': -710000,
            'suwondo': -220000
          };

          let result: TarifWargaKK[] = parsed
            .filter(
              (t) =>
                t.noKk !== '3374062011150003' &&
                !t.namaKepala.toLowerCase().includes('elkana')
            )
            .map((t): TarifWargaKK => {
              const key = t.namaKepala.toLowerCase().trim();
              const tagihanPeriodeSebelum = specificOverrides[key] !== undefined ? specificOverrides[key] : (t.tagihanPeriodeSebelum ?? 0);
              const initialMatch = INITIAL_TARIF_WARGA.find(
                (it) => it.noKk === t.noKk || it.namaKepala.toLowerCase().trim() === key
              );
              // Jika data lama masih 'Paket Standar', perbarui ke penetapan warga dari INITIAL_TARIF_WARGA
              const isOldStandard = !t.catatan || t.catatan.toLowerCase().includes('standar');
              const jimpitan = isOldStandard && initialMatch ? initialMatch.jimpitan : t.jimpitan;
              const uangMeja = isOldStandard && initialMatch ? initialMatch.uangMeja : t.uangMeja;
              const tabungan = isOldStandard && initialMatch ? initialMatch.tabungan : (t.tabungan ?? 0);
              const ikutJimpitan = isOldStandard && initialMatch ? initialMatch.ikutJimpitan : t.ikutJimpitan;
              const ikutUangMeja = isOldStandard && initialMatch ? initialMatch.ikutUangMeja : t.ikutUangMeja;
              const ikutTabungan = isOldStandard && initialMatch ? initialMatch.ikutTabungan : t.ikutTabungan;
              const catatan = isOldStandard && initialMatch ? initialMatch.catatan : (t.catatan || 'Penetapan Warga');
              const totalTarif = (ikutJimpitan ? jimpitan : 0) + (ikutUangMeja ? uangMeja : 0) + (ikutTabungan ? tabungan : 0);
              return {
                ...t,
                jimpitan,
                uangMeja,
                tabungan,
                ikutJimpitan,
                ikutUangMeja,
                ikutTabungan,
                totalTarif,
                tagihanPeriodeSebelum,
                catatan
              };
            });

          const existingNoKks = new Set(result.map((t) => t.noKk));
          const missingTarif = INITIAL_TARIF_WARGA.filter(
            (t) =>
              !existingNoKks.has(t.noKk) &&
              t.noKk !== '3374062011150003' &&
              !t.namaKepala.toLowerCase().includes('elkana')
          );
          if (missingTarif.length > 0) {
            result = [...result, ...missingTarif];
          }

          return result;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TARIF_WARGA.filter(
      (t) =>
        t.noKk !== '3374062011150003' &&
        !t.namaKepala.toLowerCase().includes('elkana')
    );
  });

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(wargaList));
  }, [wargaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(kasList));
  }, [kasList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IURAN, JSON.stringify(iuranList));
  }, [iuranList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARIF_WARGA, JSON.stringify(tarifWargaList));
  }, [tarifWargaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PESERTA_PKK, JSON.stringify(pesertaPKKList));
  }, [pesertaPKKList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KAS_PKK, JSON.stringify(kasPKKList));
  }, [kasPKKList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IURAN_PKK, JSON.stringify(iuranPKKList));
  }, [iuranPKKList]);

  // Identifikasi Profil Warga & Nomor KK Pengguna (Khusus Akun Warga Terdaftar)
  const userWarga = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.nikTerdaftar) {
      const found = wargaList.find((w) => w.nik === currentUser.nikTerdaftar);
      if (found) return found;
    }
    const foundByName = wargaList.find((w) => w.nama.toLowerCase() === currentUser.nama.toLowerCase());
    if (foundByName) return foundByName;

    // Default untuk akun role warga demo
    if (currentUser.role === 'warga') {
      const defaultWarga = wargaList.find((w) => w.nik === '3328036104940004' || w.nama.toLowerCase().includes('naila'));
      if (defaultWarga) return defaultWarga;
      return wargaList[0] || null;
    }
    return null;
  }, [currentUser, wargaList]);

  const userNoKk = useMemo(() => {
    return userWarga?.noKk || (currentUser?.role === 'warga' ? '3374060503150008' : null);
  }, [userWarga, currentUser]);

  const canManageFamily = (noKk: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin' || currentUser.role === 'sekretaris') return true;
    if (currentUser.role === 'warga') {
      return Boolean(userNoKk && userNoKk === noKk);
    }
    return false;
  };

  // Batasi tab untuk warga terdaftar hanya ke 'kk' dan 'laporan'
  useEffect(() => {
    if (currentUser?.role === 'warga') {
      if (activeTab !== 'kk' && activeTab !== 'laporan') {
        setActiveTabState('kk');
      }
    }
  }, [currentUser, activeTab]);

  // Ringkasan Kas PKK
  const ringkasanKasPKK = useMemo<RingkasanKasPKK>(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    kasPKKList.forEach((t) => {
      if (t.tipe === 'masuk') totalMasuk += t.nominal;
      else totalKeluar += t.nominal;
    });
    return {
      totalMasuk,
      totalKeluar,
      saldo: totalMasuk - totalKeluar,
    };
  }, [kasPKKList]);

  // Ringkasan Kas Konsolidasi (Kas Kecil, Kas BOP, & Kas Besar Gabungan)
  const ringkasanKas = useMemo<RingkasanKas>(() => {
    let totalMasukKasKecil = 0;
    let totalKeluarKasKecil = 0;
    let totalMasukKasBOP = 0;
    let totalKeluarKasBOP = 0;

    kasList.forEach((t) => {
      if (t.posKas === 'kas_kecil') {
        if (t.tipe === 'masuk') totalMasukKasKecil += t.nominal;
        else totalKeluarKasKecil += t.nominal;
      } else if (t.posKas === 'kas_bop') {
        if (t.tipe === 'masuk') totalMasukKasBOP += t.nominal;
        else totalKeluarKasBOP += t.nominal;
      }
    });

    const saldoKasKecil = totalMasukKasKecil - totalKeluarKasKecil;
    const saldoKasBOP = totalMasukKasBOP - totalKeluarKasBOP;
    const totalMasukKasBesar = totalMasukKasKecil + totalMasukKasBOP;
    const totalKeluarKasBesar = totalKeluarKasKecil + totalKeluarKasBOP;
    const totalSaldoKasBesar = saldoKasKecil + saldoKasBOP;

    return {
      saldoKasKecil,
      totalMasukKasKecil,
      totalKeluarKasKecil,
      saldoKasBOP,
      totalMasukKasBOP,
      totalKeluarKasBOP,
      totalSaldoKasBesar,
      totalMasukKasBesar,
      totalKeluarKasBesar,
    };
  }, [kasList]);

  const addLog = (action: string, detail: string, category: 'warga' | 'user' | 'system' | 'report') => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      userName: currentUser?.nama || 'Sistem',
      userRole: currentUser?.roleLabel || 'Pengguna',
      action,
      detail,
      category,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase();
    const found = users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (!found) {
      return false;
    }
    if (found.status === 'nonaktif') {
      return false;
    }

    // Secure password verification if password was supplied
    if (password) {
      if (found.passwordSalt && found.passwordHash) {
        const isMatch = await verifyPassword(password, found.passwordSalt, found.passwordHash);
        // Allow fallback to standard demo passwords if salt was default demo
        const isDemoMatch = 
          (cleanUsername === 'admin' && password === 'admin123') ||
          (cleanUsername === 'sekretaris' && password === 'sekretaris123') ||
          (cleanUsername === 'bendahara' && password === 'bendahara123') ||
          (cleanUsername === 'warga' && password === 'warga123') ||
          password === 'admin123';

        if (!isMatch && !isDemoMatch) {
          return false;
        }
      }
    }

    const updatedUser = {
      ...found,
      lastLogin: 'Baru saja (' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB)'
    };
    setCurrentUser(updatedUser);
    if (updatedUser.role === 'warga') {
      setActiveTabState('kk');
    }
    addLog('Login Sistem', `Pengguna ${found.nama} (${found.roleLabel}) berhasil masuk ke sistem`, 'user');
    return true;
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    const cleanUsername = data.username.trim().toLowerCase();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'Username sudah digunakan oleh pengguna lain.' };
    }

    // Check if NIK is registered in wargaList
    let matchedWargaName = '';
    if (data.nikTerdaftar) {
      const foundWarga = wargaList.find((w) => w.nik === data.nikTerdaftar);
      if (foundWarga) {
        matchedWargaName = foundWarga.nama;
      }
    }

    const salt = generateSalt();
    const hash = await hashPassword(data.password, salt);

    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      username: data.username.trim(),
      nama: data.nama.trim(),
      email: data.email.trim(),
      role: 'warga',
      roleLabel: 'Warga Terdaftar',
      noHp: data.noHp?.trim() || '',
      status: 'aktif',
      lastLogin: 'Baru saja mendaftar',
      nikTerdaftar: data.nikTerdaftar?.trim() || '',
      passwordSalt: salt,
      passwordHash: hash,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setActiveTabState('kk');

    const logDetail = matchedWargaName 
      ? `Warga baru ${data.nama} terverifikasi dengan data kependudukan (${matchedWargaName})`
      : `Pendaftaran mandiri akun warga: ${data.nama} (@${data.username})`;

    addLog('Pendaftaran Pengguna', logDetail, 'user');
    return { success: true, message: 'Pendaftaran akun warga berhasil! Anda langsung diarahkan ke data KK Anda.' };
  };

  const logout = () => {
    if (currentUser) {
      addLog('Logout Sistem', `Pengguna ${currentUser.nama} (${currentUser.roleLabel}) keluar dari sistem`, 'user');
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (target.role === 'warga') {
        setActiveTabState('kk');
      }
      addLog('Beralih Pengguna', `Beralih ke akun ${target.nama} (${target.roleLabel})`, 'user');
    }
  };

  const addWarga = (data: Omit<Warga, 'id'>) => {
    // Pengamanan hak akses akun warga terdaftar
    if (currentUser?.role === 'warga' && userNoKk) {
      data.noKk = userNoKk;
    }

    const newId = `w-${Date.now()}`;
    const newWarga: Warga = {
      ...data,
      id: newId,
      updatedAt: new Date().toISOString()
    };
    setWargaList((prev) => [newWarga, ...prev]);

    // Jika berstatus Istri, otomatis hubungkan ke Data Peserta PKK
    if (data.statusKeluarga === 'Istri') {
      const kepala = wargaList.find((w) => w.noKk === data.noKk && w.statusKeluarga === 'Kepala Keluarga');
      const suamiNama = kepala?.nama || 'Kepala Keluarga';
      const newPeserta: PesertaPKK = {
        id: `pkk-${Date.now()}`,
        wargaId: newId,
        nama: data.nama,
        nik: data.nik,
        noKk: data.noKk,
        statusKeluarga: 'Istri',
        namaSuami: suamiNama,
        jabatan: 'Anggota',
        pokja: 'Anggota Umum',
        alamat: data.alamat,
        noHp: (data.noHp || data.telepon || '').trim(),
        status: 'Aktif',
        catatan: `Otomatis terhubung dari Data Kependudukan (Istri dari Bpk. ${suamiNama})`,
        createdAt: new Date().toISOString()
      };
      setPesertaPKKList((prev) => [newPeserta, ...prev]);
    }

    const logDetail = currentUser?.role === 'warga'
      ? `Warga mandiri ${currentUser.nama} menambah anggota keluarga: ${data.nama} (No. KK: ${data.noKk})`
      : `Menambahkan warga baru: ${data.nama} (NIK: ${data.nik})`;

    addLog('Tambah Data Warga', logDetail, 'warga');
  };

  const updateWarga = (id: string, data: Partial<Warga>) => {
    // Pengamanan hak akses akun warga terdaftar: hanya boleh koreksi anggota keluarganya sendiri
    if (currentUser?.role === 'warga') {
      const target = wargaList.find((w) => w.id === id);
      if (target && userNoKk && target.noKk !== userNoKk) {
        alert('Akses Ditolak: Anda hanya memiliki wewenang untuk mengoreksi data anggota keluarga sendiri.');
        return;
      }
      if (userNoKk) {
        data.noKk = userNoKk;
      }
    }

    setWargaList((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w))
    );

    // Sinkronkan ke Data Peserta PKK jika terkait status Istri
    setPesertaPKKList((prev) => {
      const existing = prev.find((p) => p.wargaId === id || (data.nik && p.nik === data.nik));
      if (existing) {
        return prev.map((p) => {
          if (p.wargaId === id || (data.nik && p.nik === data.nik)) {
            return {
              ...p,
              nama: data.nama || p.nama,
              nik: data.nik || p.nik,
              noKk: data.noKk || p.noKk,
              alamat: data.alamat || p.alamat,
              noHp: data.noHp !== undefined ? data.noHp : (data.telepon !== undefined ? data.telepon : p.noHp),
              statusKeluarga: 'Istri'
            };
          }
          return p;
        });
      } else if (data.statusKeluarga === 'Istri') {
        const targetWarga = wargaList.find((w) => w.id === id);
        const noKk = data.noKk || targetWarga?.noKk || '';
        const kepala = wargaList.find((w) => w.noKk === noKk && w.statusKeluarga === 'Kepala Keluarga');
        const suamiNama = kepala?.nama || 'Kepala Keluarga';
        return [
          {
            id: `pkk-${Date.now()}`,
            wargaId: id,
            nama: data.nama || targetWarga?.nama || '',
            nik: data.nik || targetWarga?.nik || '',
            noKk: noKk,
            statusKeluarga: 'Istri',
            namaSuami: suamiNama,
            jabatan: 'Anggota',
            pokja: 'Anggota Umum',
            alamat: data.alamat || targetWarga?.alamat || '',
            noHp: (data.noHp || data.telepon || targetWarga?.noHp || targetWarga?.telepon || '').trim(),
            status: 'Aktif',
            catatan: `Otomatis terhubung dari Data Kependudukan (Istri dari Bpk. ${suamiNama})`,
            createdAt: new Date().toISOString()
          },
          ...prev
        ];
      }
      return prev;
    });

    const logDetail = currentUser?.role === 'warga'
      ? `Warga mandiri ${currentUser.nama} mengoreksi data anggota keluarga: ${data.nama || id}`
      : `Memperbarui data warga ID: ${id} (${data.nama || 'warga'})`;

    addLog('Pembaruan Warga', logDetail, 'warga');
  };

  const deleteWarga = (id: string) => {
    // Warga terdaftar tidak dapat menghapus data kependudukan
    if (currentUser?.role === 'warga') {
      alert('Akses Ditolak: Warga terdaftar tidak memiliki wewenang untuk menghapus data kependudukan.');
      return;
    }

    const target = wargaList.find((w) => w.id === id);
    setWargaList((prev) => prev.filter((w) => w.id !== id));
    if (target) {
      if (target.statusKeluarga === 'Istri') {
        setPesertaPKKList((prev) => prev.filter((p) => p.wargaId !== id && p.nik !== target.nik));
      }
      const remainingInKk = wargaList.filter((w) => w.noKk === target.noKk && w.id !== id);
      if (remainingInKk.length === 0 || target.statusKeluarga === 'Famili Lain') {
        setIuranList((prev) => prev.filter((i) => i.noKk !== target.noKk && i.namaWarga.toLowerCase() !== target.nama.toLowerCase()));
        setTarifWargaList((prev) => prev.filter((t) => t.noKk !== target.noKk && t.namaKepala.toLowerCase() !== target.nama.toLowerCase()));
      }
    }
    addLog('Hapus Warga', `Menghapus data warga: ${target?.nama || id}`, 'warga');
  };

  const addUser = async (data: Omit<User, 'id'>, password = 'password123') => {
    const newId = `usr-${Date.now()}`;
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    const newUser: User = {
      ...data,
      id: newId,
      passwordSalt: salt,
      passwordHash: hash
    };
    setUsers((prev) => [...prev, newUser]);
    addLog('Tambah Pengguna', `Menambahkan user baru: ${data.nama} (${data.roleLabel}) dengan proteksi sandi terenkripsi`, 'user');
  };

  const updateUser = async (id: string, data: Partial<User>, newPassword?: string) => {
    let updatePayload: Partial<User> = { ...data };
    if (newPassword && newPassword.trim() !== '') {
      const salt = generateSalt();
      const hash = await hashPassword(newPassword.trim(), salt);
      updatePayload.passwordSalt = salt;
      updatePayload.passwordHash = hash;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updatePayload } : u))
    );
    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updatePayload } : null));
    }
    addLog('Pembaruan Pengguna', `Memperbarui data akun pengguna ID: ${id}${newPassword ? ' (dengan reset kata sandi)' : ''}`, 'user');
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) {
      alert('Tidak dapat menghapus akun yang sedang aktif!');
      return;
    }
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addLog('Hapus Pengguna', `Menghapus akun pengguna: ${target?.nama || id}`, 'user');
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'aktif' ? 'nonaktif' : 'aktif' } : u
      )
    );
    const target = users.find((u) => u.id === id);
    addLog('Ubah Status Akun', `Mengubah status user ${target?.nama} menjadi ${target?.status === 'aktif' ? 'Non-Aktif' : 'Aktif'}`, 'user');
  };

  const addTransaksiKas = (data: Omit<TransaksiKas, 'id' | 'createdAt'>) => {
    const newId = `kas-${Date.now()}`;
    const newTx: TransaksiKas = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setKasList((prev) => [newTx, ...prev]);
    const posLabel = data.posKas === 'kas_kecil' ? 'Kas Kecil' : 'Kas BOP';
    const tipeLabel = data.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran';
    addLog('Transaksi Kas', `Pencatatan ${tipeLabel} ${posLabel} (Rp ${data.nominal.toLocaleString('id-ID')}): ${data.keterangan}`, 'report');
  };

  const updateTransaksiKas = (id: string, data: Partial<TransaksiKas>) => {
    setKasList((prev) => prev.map((tx) => (tx.id === id ? { ...tx, ...data } : tx)));
    addLog(
      'Koreksi Transaksi Kas',
      `Koreksi data transaksi: ${data.keterangan || id} ${data.nominal !== undefined ? `(Nominal: Rp ${data.nominal.toLocaleString('id-ID')})` : ''}`,
      'report'
    );
  };

  const deleteTransaksiKas = (id: string) => {
    const target = kasList.find((tx) => tx.id === id);
    setKasList((prev) => prev.filter((tx) => tx.id !== id));
    addLog('Hapus Transaksi Kas', `Menghapus transaksi: ${target?.keterangan || id}`, 'report');
  };

  const deleteAllTransaksiKas = (keepSaldoAwal: boolean = true) => {
    let nextList: TransaksiKas[] = [];
    if (keepSaldoAwal) {
      nextList = [...INITIAL_KAS_DATA];
    }
    setKasList(nextList);
    try {
      localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(nextList));
    } catch (e) {
      console.error(e);
    }
    addLog(
      'Hapus Semua Transaksi Kas',
      keepSaldoAwal 
        ? 'Menghapus seluruh transaksi kas operasional (Saldo Awal Kas Kecil Rp 2.099.000 & Kas BOP Rp 0 dipertahankan)' 
        : 'Menghapus seluruh data transaksi kas besar gabungan (buku kas kosong)',
      'report'
    );
  };

  const addPembayaranIuran = (
    data: Omit<PembayaranIuran, 'id' | 'createdAt'>,
    syncToKas: boolean = true
  ) => {
    const id = `iu-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    let createdKasId: string | undefined = undefined;

    const rincianText = data.rincian
      ? ` (Jimpitan: Rp ${data.rincian.jimpitan.toLocaleString('id-ID')}, Uang Meja: Rp ${data.rincian.uangMeja.toLocaleString('id-ID')}${data.rincian.tabungan > 0 ? `, Tabungan: Rp ${data.rincian.tabungan.toLocaleString('id-ID')}` : ''})`
      : '';

    if (syncToKas) {
      createdKasId = `kas-iu-${Date.now()}`;
      const newKas: TransaksiKas = {
        id: createdKasId,
        tanggal: data.tanggalBayar,
        posKas: 'kas_kecil',
        tipe: 'masuk',
        kategori: data.kategoriIuran || 'Iuran Warga Bulanan',
        keterangan: `Penerimaan ${data.kategoriIuran} - ${data.namaWarga} (Bulan ${data.bulan})${rincianText} [No. Kwitansi: ${data.noKwitansi}]`,
        nominal: data.nominal,
        noBukti: data.noKwitansi,
        lpj: 'Kwitansi Terlampir',
        penanggungJawab: data.penerima,
        createdAt: new Date().toISOString()
      };
      setKasList((prev) => [newKas, ...prev]);
    }

    const newIuran: PembayaranIuran = {
      ...data,
      id,
      transaksiKasId: createdKasId,
      createdAt: new Date().toISOString()
    };

    setIuranList((prev) => [newIuran, ...prev]);
    addLog(
      'Penerimaan Iuran Warga',
      `Mencatat ${data.kategoriIuran} dari ${data.namaWarga} (${data.bulan}) sebesar Rp ${data.nominal.toLocaleString('id-ID')} via ${data.metode}`,
      'report'
    );
  };

  const updateTarifWarga = (noKk: string, updated: Partial<TarifWargaKK>) => {
    setTarifWargaList((prev) => {
      const exists = prev.some((t) => t.noKk === noKk);
      if (!exists) {
        const matchingWarga = wargaList.find((w) => w.noKk === noKk);
        const jimpitan = updated.jimpitan !== undefined ? updated.jimpitan : 15000;
        const uangMeja = updated.uangMeja !== undefined ? updated.uangMeja : 10000;
        const tabungan = updated.tabungan !== undefined ? updated.tabungan : 0;
        const ikutJimpitan = updated.ikutJimpitan !== undefined ? updated.ikutJimpitan : true;
        const ikutUangMeja = updated.ikutUangMeja !== undefined ? updated.ikutUangMeja : true;
        const ikutTabungan = updated.ikutTabungan !== undefined ? updated.ikutTabungan : true;
        const rawTagihanSebelum = updated.tagihanPeriodeSebelum !== undefined ? updated.tagihanPeriodeSebelum : 0;
        const tagihanPeriodeSebelum = Number(rawTagihanSebelum) || 0;
        const bulanDitutup = updated.bulanDitutup !== undefined ? updated.bulanDitutup : [];
        const totalTarif = (ikutJimpitan ? jimpitan : 0) + (ikutUangMeja ? uangMeja : 0) + (ikutTabungan ? tabungan : 0);
        const newEntry: TarifWargaKK = {
          noKk,
          namaKepala: updated.namaKepala || matchingWarga?.nama || 'Kepala Keluarga',
          jimpitan,
          uangMeja,
          tabungan,
          ikutJimpitan,
          ikutUangMeja,
          ikutTabungan,
          tagihanPeriodeSebelum,
          bulanDitutup,
          koreksiTagihanBulan: updated.koreksiTagihanBulan || {},
          totalTarif,
          catatan: updated.catatan || 'Penetapan Warga'
        };
        return [...prev, newEntry];
      }
      return prev.map((t) => {
        if (t.noKk !== noKk) return t;
        const jimpitan = updated.jimpitan !== undefined ? updated.jimpitan : t.jimpitan;
        const uangMeja = updated.uangMeja !== undefined ? updated.uangMeja : t.uangMeja;
        const tabungan = updated.tabungan !== undefined ? updated.tabungan : t.tabungan;
        const ikutJimpitan = updated.ikutJimpitan !== undefined ? updated.ikutJimpitan : t.ikutJimpitan;
        const ikutUangMeja = updated.ikutUangMeja !== undefined ? updated.ikutUangMeja : t.ikutUangMeja;
        const ikutTabungan = updated.ikutTabungan !== undefined ? updated.ikutTabungan : t.ikutTabungan;
        const rawTagihanSebelum = updated.tagihanPeriodeSebelum !== undefined ? updated.tagihanPeriodeSebelum : (t.tagihanPeriodeSebelum ?? 0);
        const tagihanPeriodeSebelum = Number(rawTagihanSebelum) || 0;
        const bulanDitutup = updated.bulanDitutup !== undefined ? updated.bulanDitutup : (t.bulanDitutup ?? []);
        const koreksiTagihanBulan = updated.koreksiTagihanBulan !== undefined ? updated.koreksiTagihanBulan : (t.koreksiTagihanBulan ?? {});
        const totalTarif = (ikutJimpitan ? jimpitan : 0) + (ikutUangMeja ? uangMeja : 0) + (ikutTabungan ? tabungan : 0);
        return {
          ...t,
          ...updated,
          jimpitan,
          uangMeja,
          tabungan,
          ikutJimpitan,
          ikutUangMeja,
          ikutTabungan,
          tagihanPeriodeSebelum,
          bulanDitutup,
          koreksiTagihanBulan,
          totalTarif
        };
      });
    });
    addLog('Pengaturan Tarif Iuran', `Memperbarui tarif iuran KK: ${noKk}`, 'warga');
  };

  const saveAllTarifWarga = (newList: TarifWargaKK[]) => {
    setTarifWargaList(newList);
    addLog('Pengaturan Tarif Iuran', `Menyimpan seluruh pengaturan tarif iuran warga (${newList.length} KK)`, 'warga');
  };

  const getTarifByKK = (noKk: string): TarifWargaKK | undefined => {
    if (!noKk) return undefined;
    const cleanNoKk = noKk.trim();
    const found = tarifWargaList.find((t) => t.noKk.trim() === cleanNoKk);
    if (found) return found;
    const digitsOnly = cleanNoKk.replace(/\D/g, '');
    if (digitsOnly) {
      const foundByDigits = tarifWargaList.find((t) => t.noKk.replace(/\D/g, '') === digitsOnly);
      if (foundByDigits) return foundByDigits;
    }
    const citizen = wargaList.find((w) => w.noKk?.trim() === cleanNoKk);
    if (citizen) {
      const namaTarget = citizen.nama.toLowerCase().trim();
      const foundByNama = tarifWargaList.find((t) => t.namaKepala.toLowerCase().trim() === namaTarget);
      if (foundByNama) return foundByNama;
    }
    return undefined;
  };

  const updatePembayaranIuran = (id: string, data: Partial<PembayaranIuran>) => {
    setIuranList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...data };
        if (item.transaksiKasId) {
          const rincianDesc = updated.rincian
            ? ` [Jimpitan: Rp ${updated.rincian.jimpitan.toLocaleString('id-ID')}, Uang Meja: Rp ${updated.rincian.uangMeja.toLocaleString('id-ID')}${updated.rincian.tabungan > 0 ? `, Tabungan: Rp ${updated.rincian.tabungan.toLocaleString('id-ID')}` : ''}]`
            : '';
          setKasList((kList) =>
            kList.map((k) =>
              k.id === item.transaksiKasId
                ? {
                    ...k,
                    nominal: updated.nominal,
                    tanggal: updated.tanggalBayar || k.tanggal,
                    keterangan: `Penerimaan ${updated.kategoriIuran} - ${updated.namaWarga} (Bulan ${updated.bulan}) [No. Kwitansi: ${updated.noKwitansi}]${rincianDesc}`
                  }
                : k
            )
          );
        }
        return updated;
      })
    );
    addLog('Ubah Iuran Warga', `Memperbarui data penerimaan iuran`, 'report');
  };

  const deletePembayaranIuran = (id: string) => {
    const target = iuranList.find((item) => item.id === id);
    if (!target) return;
    setIuranList((prev) => prev.filter((item) => item.id !== id));
    if (target.transaksiKasId) {
      setKasList((prev) => prev.filter((k) => k.id !== target.transaksiKasId));
    }
    addLog(
      'Hapus Iuran Warga',
      `Menghapus catatan iuran: ${target.namaWarga} (${target.bulan})`,
      'report'
    );
  };

  // --- PKK Management Methods ---
  const addPesertaPKK = (data: Omit<PesertaPKK, 'id' | 'createdAt'>) => {
    const newPeserta: PesertaPKK = {
      ...data,
      id: `pkk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPesertaPKKList((prev) => [newPeserta, ...prev]);
    addLog('Tambah Peserta PKK', `Menambahkan peserta PKK: ${data.nama} (${data.jabatan})`, 'warga');
  };

  const updatePesertaPKK = (id: string, data: Partial<PesertaPKK>) => {
    setPesertaPKKList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    addLog('Ubah Peserta PKK', `Memperbarui data peserta PKK`, 'warga');
  };

  const deletePesertaPKK = (id: string) => {
    const target = pesertaPKKList.find((p) => p.id === id);
    if (!target) return;
    setPesertaPKKList((prev) => prev.filter((p) => p.id !== id));
    addLog('Hapus Peserta PKK', `Menghapus peserta PKK: ${target.nama}`, 'warga');
  };

  const addTransaksiKasPKK = (data: Omit<TransaksiKasPKK, 'id' | 'createdAt'>) => {
    const newKas: TransaksiKasPKK = {
      ...data,
      id: `kas-pkk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setKasPKKList((prev) => [newKas, ...prev]);
    addLog(
      'Catat Kas PKK',
      `${data.tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}: Rp ${data.nominal.toLocaleString('id-ID')} (${data.kategori})`,
      'report'
    );
  };

  const updateTransaksiKasPKK = (id: string, data: Partial<TransaksiKasPKK>) => {
    setKasPKKList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...data } : k))
    );
    addLog('Ubah Kas PKK', `Memperbarui transaksi kas PKK`, 'report');
  };

  const deleteTransaksiKasPKK = (id: string) => {
    const target = kasPKKList.find((k) => k.id === id);
    if (!target) return;
    setKasPKKList((prev) => prev.filter((k) => k.id !== id));
    addLog('Hapus Kas PKK', `Menghapus transaksi kas PKK: ${target.keterangan}`, 'report');
  };

  const addPembayaranIuranPKK = (data: Omit<PembayaranIuranPKK, 'id' | 'createdAt'>, syncToKas: boolean = true) => {
    let linkedKasId: string | undefined = undefined;

    if (syncToKas && data.status === 'Lunas') {
      linkedKasId = `kas-pkk-${Date.now()}`;
      const newKasEntry: TransaksiKasPKK = {
        id: linkedKasId,
        tanggal: data.tanggalBayar || new Date().toISOString().slice(0, 10),
        tipe: 'masuk',
        kategori: 'Iuran Rutin Anggota',
        keterangan: `Penerimaan Iuran PKK - ${data.namaPeserta} (Bulan ${data.bulan}) [No. Kwitansi: ${data.noKwitansi}]`,
        nominal: data.nominal,
        noBukti: data.noKwitansi,
        penanggungJawab: data.penerima,
        createdAt: new Date().toISOString(),
      };
      setKasPKKList((prev) => [newKasEntry, ...prev]);
    }

    const newIuran: PembayaranIuranPKK = {
      ...data,
      id: `iuran-pkk-${Date.now()}`,
      transaksiKasId: linkedKasId,
      createdAt: new Date().toISOString(),
    };
    setIuranPKKList((prev) => [newIuran, ...prev]);
    addLog(
      'Penerimaan Iuran PKK',
      `Penerimaan iuran PKK ${data.namaPeserta} bulan ${data.bulan}: Rp ${data.nominal.toLocaleString('id-ID')}`,
      'report'
    );
  };

  const updatePembayaranIuranPKK = (id: string, data: Partial<PembayaranIuranPKK>) => {
    setIuranPKKList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    addLog('Ubah Iuran PKK', `Memperbarui data penerimaan iuran PKK`, 'report');
  };

  const deletePembayaranIuranPKK = (id: string) => {
    const target = iuranPKKList.find((item) => item.id === id);
    if (!target) return;
    setIuranPKKList((prev) => prev.filter((item) => item.id !== id));
    if (target.transaksiKasId) {
      setKasPKKList((prev) => prev.filter((k) => k.id !== target.transaksiKasId));
    }
    addLog('Hapus Iuran PKK', `Menghapus catatan iuran PKK: ${target.namaPeserta} (${target.bulan})`, 'report');
  };

  const syncPesertaPKKWithWargaIstri = (): { addedCount: number; updatedCount: number } => {
    const kkMap = new Map<string, string>();
    wargaList.forEach((w) => {
      if (w.statusKeluarga === 'Kepala Keluarga') {
        kkMap.set(w.noKk?.trim(), w.nama);
      }
    });

    const istriWargas = wargaList.filter((w) => w.statusKeluarga === 'Istri');
    let addedCount = 0;
    let updatedCount = 0;

    setPesertaPKKList((prevList) => {
      const nextList = [...prevList];

      istriWargas.forEach((w) => {
        const suamiNama = kkMap.get(w.noKk?.trim()) || 'Kepala Keluarga';
        const existingIdx = nextList.findIndex(
          (p) => (p.wargaId && p.wargaId === w.id) || (p.nik && p.nik === w.nik)
        );

        if (existingIdx >= 0) {
          const old = nextList[existingIdx];
          nextList[existingIdx] = {
            ...old,
            wargaId: w.id,
            nama: w.nama,
            nik: w.nik,
            noKk: w.noKk,
            statusKeluarga: 'Istri',
            namaSuami: suamiNama,
            alamat: w.alamat || old.alamat,
            noHp: (w.noHp || w.telepon || old.noHp || '').trim(),
          };
          updatedCount++;
        } else {
          nextList.push({
            id: `pkk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            wargaId: w.id,
            nama: w.nama,
            nik: w.nik,
            noKk: w.noKk,
            statusKeluarga: 'Istri',
            namaSuami: suamiNama,
            jabatan: 'Anggota',
            pokja: 'Anggota Umum',
            alamat: w.alamat,
            noHp: (w.noHp || w.telepon || '').trim(),
            status: 'Aktif',
            catatan: `Otomatis terhubung dari Data Kependudukan (Istri dari Bpk. ${suamiNama})`,
            createdAt: new Date().toISOString()
          });
          addedCount++;
        }
      });

      return nextList;
    });

    addLog(
      'Sinkronisasi PKK',
      `Sinkronisasi peserta PKK dengan Warga status Istri: +${addedCount} baru, ${updatedCount} diperbarui`,
      'warga'
    );

    return { addedCount, updatedCount };
  };

  const resetToDefaultData = () => {
    setWargaList(INITIAL_WARGA_DATA);
    setUsers(INITIAL_USERS);
    setLogs(INITIAL_LOGS);
    setKasList(INITIAL_KAS_DATA);
    setIuranList(INITIAL_IURAN_DATA);
    setTarifWargaList(INITIAL_TARIF_WARGA);
    setPesertaPKKList(INITIAL_PESERTA_PKK);
    setKasPKKList(INITIAL_KAS_PKK);
    setIuranPKKList(INITIAL_IURAN_PKK);
    localStorage.removeItem(STORAGE_KEYS.WARGA);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.KAS);
    localStorage.removeItem('berkahone_kas_v6');
    localStorage.removeItem('berkahone_kas_v5');
    localStorage.removeItem('berkahone_kas_v4');
    localStorage.removeItem('berkahone_kas_v3');
    localStorage.removeItem('berkahone_kas_v2');
    localStorage.removeItem('berkahone_kas_v1');
    localStorage.removeItem(STORAGE_KEYS.IURAN);
    localStorage.removeItem('berkahone_iuran_v2');
    localStorage.removeItem(STORAGE_KEYS.TARIF_WARGA);
    localStorage.removeItem('berkahone_tarif_warga_v1');
    localStorage.removeItem(STORAGE_KEYS.PESERTA_PKK);
    localStorage.removeItem('berkahone_peserta_pkk_v1');
    localStorage.removeItem(STORAGE_KEYS.KAS_PKK);
    localStorage.removeItem(STORAGE_KEYS.IURAN_PKK);
    localStorage.removeItem('berkahone_iuran_pkk_v1');
    addLog('Reset Data', 'Mengembalikan seluruh data warga, pengguna, kas, iuran, dan PKK ke pengaturan awal', 'system');
  };

  const hasPermission = (action: 'manage_warga' | 'manage_users' | 'export_data' | 'create_surat' | 'manage_kas'): boolean => {
    if (!currentUser) return false;
    switch (currentUser.role) {
      case 'superadmin':
        return true;
      case 'bendahara':
        return action === 'manage_kas' || action === 'export_data' || action === 'create_surat';
      case 'sekretaris':
        return action !== 'manage_users';
      case 'warga':
        return action === 'export_data';
      default:
        return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        wargaList,
        logs,
        kasList,
        ringkasanKas,
        iuranList,
        tarifWargaList,
        updateTarifWarga,
        saveAllTarifWarga,
        getTarifByKK,
        activeTab,
        setActiveTab,
        activeKasSubTab,
        setActiveKasSubTab,
        activePkkSubTab,
        setActivePkkSubTab,
        pesertaPKKList,
        kasPKKList,
        iuranPKKList,
        ringkasanKasPKK,
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
        login,
        register,
        logout,
        switchUser,
        addWarga,
        updateWarga,
        deleteWarga,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addTransaksiKas,
        updateTransaksiKas,
        deleteTransaksiKas,
        deleteAllTransaksiKas,
        addPembayaranIuran,
        updatePembayaranIuran,
        deletePembayaranIuran,
        resetToDefaultData,
        searchQuery,
        setSearchQuery,
        selectedKK,
        setSelectedKK,
        userWarga,
        userNoKk,
        canManageFamily,
        hasPermission
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
