import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  FolderGit2, 
  FileSpreadsheet, 
  Mail, 
  ShieldCheck, 
  MapPin, 
  Info,
  Calendar,
  Wallet,
  HeartHandshake,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    wargaList,
    users,
    currentUser,
    userWarga,
    userNoKk,
    hasPermission,
    ringkasanKas,
    activeKasSubTab,
    setActiveKasSubTab,
    pesertaPKKList,
    ringkasanKasPKK,
    activePkkSubTab,
    setActivePkkSubTab
  } = useApp();

  // Compute total unique KK
  const totalKK = new Set(wargaList.map((w) => w.noKk).filter(Boolean)).size;

  const isWargaRole = currentUser?.role === 'warga';

  const menuItems = isWargaRole
    ? [
        {
          id: 'kk',
          label: 'Kartu Keluarga (KK Saya)',
          icon: FolderGit2,
          badge: 'KK Mandiri',
          description: userNoKk ? `No. KK: ${userNoKk}` : 'Data Anggota Keluarga'
        },
        {
          id: 'laporan',
          label: 'Dashboard Pelaporan',
          icon: FileSpreadsheet,
          badge: 'Lihat',
          description: 'Pusat Dokumen & Rekap RT'
        }
      ]
    : [
        {
          id: 'dashboard',
          label: 'Dashboard Utama',
          icon: LayoutDashboard,
          badge: null,
          description: 'Statistik & Analisis Demografi'
        },
        {
          id: 'warga',
          label: 'Data Kependudukan',
          icon: Users,
          badge: `${wargaList.length} Jiwa`,
          description: 'Daftar Lengkap Warga'
        },
        {
          id: 'kk',
          label: 'Buku Kartu Keluarga',
          icon: FolderGit2,
          badge: `${totalKK} KK`,
          description: 'Struktur Kepala & Anggota'
        },
        {
          id: 'pkk',
          label: 'Data Peserta PKK',
          icon: HeartHandshake,
          badge: `${pesertaPKKList.length} Ibu`,
          description: 'Kas PKK & Iuran PKK'
        },
        {
          id: 'kas_besar',
          label: 'Kas Besar RT',
          icon: Wallet,
          badge: 'Gabungan',
          description: 'Kas Kecil & Kas BOP'
        },
        {
          id: 'laporan',
          label: 'Laporan & Ekspor',
          icon: FileSpreadsheet,
          badge: 'Cetak',
          description: 'Format Resmi RT/RW & Rekap'
        },
        {
          id: 'surat',
          label: 'Surat Pengantar RT',
          icon: Mail,
          badge: 'Cepat',
          description: 'Pelayanan Administrasi Warga'
        },
        {
          id: 'users',
          label: 'Manajemen Pengguna',
          icon: ShieldCheck,
          badge: `${users.length} Akun`,
          description: 'Role & Kontrol Akses'
        }
      ];

  return (
    <aside id="main-sidebar" className="w-60 lg:w-64 2xl:w-72 4k:w-80 shrink-0 hidden md:block print:hidden">
      <div className="sticky top-20 2xl:top-24 space-y-4">
        {/* Navigation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 2xl:p-4 space-y-1">
          <div className="px-3 pt-1 pb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              {isWargaRole ? 'Akses Warga Terdaftar' : 'Menu Utama BerkahOne'}
            </span>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs truncate">{item.label}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full whitespace-nowrap font-semibold ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Sub-menu for Data Peserta PKK */}
                {item.id === 'pkk' && (
                  <div className="pl-9 pr-1 py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('pkk');
                        setActivePkkSubTab('kas_pkk');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        activeTab === 'pkk' && activePkkSubTab === 'kas_pkk'
                          ? 'bg-rose-100 text-rose-950 font-bold border border-rose-300'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activeTab === 'pkk' && activePkkSubTab === 'kas_pkk' ? 'bg-rose-600' : 'bg-slate-400'
                        }`} />
                        <span>Kas PKK</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-200/70 text-rose-900 font-bold">
                        {new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(ringkasanKasPKK.saldo)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('pkk');
                        setActivePkkSubTab('iuran_pkk');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        activeTab === 'pkk' && activePkkSubTab === 'iuran_pkk'
                          ? 'bg-pink-100 text-pink-950 font-bold border border-pink-300'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activeTab === 'pkk' && activePkkSubTab === 'iuran_pkk' ? 'bg-pink-600' : 'bg-slate-400'
                        }`} />
                        <span>Iuran PKK</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-200/70 text-pink-900 font-bold">
                        Bulanan
                      </span>
                    </button>
                  </div>
                )}

                {/* Sub-menu for Kas Besar RT */}
                {item.id === 'kas_besar' && (
                  <div className="pl-9 pr-1 py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('kas_besar');
                        setActiveKasSubTab('buku_kas');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        activeTab === 'kas_besar' && activeKasSubTab === 'buku_kas'
                          ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activeTab === 'kas_besar' && activeKasSubTab === 'buku_kas' ? 'bg-emerald-700' : 'bg-slate-400'
                        }`} />
                        <span>Buku Kas Besar</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('kas_besar');
                        setActiveKasSubTab('iuran_warga');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        activeTab === 'kas_besar' && activeKasSubTab === 'iuran_warga'
                          ? 'bg-orange-100 text-orange-950 font-bold border border-orange-300'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activeTab === 'kas_besar' && activeKasSubTab === 'iuran_warga' ? 'bg-orange-600' : 'bg-slate-400'
                        }`} />
                        <span>Menu Iuran Warga</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-200/70 text-orange-900 font-bold">
                        36 KK
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('kas_besar');
                        setActiveKasSubTab('undangan_jumpa');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        activeTab === 'kas_besar' && activeKasSubTab === 'undangan_jumpa'
                          ? 'bg-indigo-100 text-indigo-950 font-bold border border-indigo-300'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className={`w-3.5 h-3.5 ${
                          activeTab === 'kas_besar' && activeKasSubTab === 'undangan_jumpa' ? 'text-indigo-600' : 'text-slate-400'
                        }`} />
                        <span>Undangan Jumpa Bulan</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-extrabold flex items-center gap-0.5">
                        <span>AI</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Territory Identity Card */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Wilayah Administrasi</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            RT 02 RW 14 Tanjung Sari
          </h4>
          <p className="text-[11px] text-emerald-200/90 leading-relaxed mb-3">
            Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang, Jawa Tengah.
          </p>

          <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-emerald-300">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Tahun 2026</span>
            </span>
            <span className="bg-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-200">
              Kode: 337406
            </span>
          </div>
        </div>

        {/* Quick Help Card */}
        {isWargaRole ? (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 shadow-xs text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Akses Warga Terdaftar</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div>Nama: <strong className="text-slate-900">{currentUser?.nama}</strong></div>
              <div>No. KK: <strong className="text-slate-900 font-mono">{userNoKk || '-'}</strong></div>
            </div>
            <p className="text-[10px] text-emerald-800 leading-relaxed border-t border-emerald-200/60 pt-2">
              Hak akses Anda: Mengoreksi &amp; menambah anggota keluarga pada KK Anda, serta meninjau data di Dashboard Pelaporan.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-3.5 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold mb-1 text-emerald-950">
              <Info className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sistem BerkahOne</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-normal">
              Sistem kependudukan terintegrasi dengan filter pencarian instan, validasi KK, rekapitulasi data demografi, dan pencetakan surat pengantar.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
