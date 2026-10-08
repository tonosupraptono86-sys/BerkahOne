import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Warga } from '../types';
import { calculateAge, formatIndoDate } from '../utils/dateUtils';
import { 
  FolderGit2, 
  Search, 
  Users, 
  Home, 
  Printer, 
  X, 
  MapPin, 
  CheckCircle2, 
  FileText,
  ExternalLink,
  ArrowUpDown,
  UserPlus,
  Edit3,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface KartuKeluargaViewProps {
  onOpenAddMember?: (noKk?: string) => void;
  onOpenEditMember?: (warga: Warga) => void;
}

export const KartuKeluargaView: React.FC<KartuKeluargaViewProps> = ({
  onOpenAddMember,
  onOpenEditMember
}) => {
  const { wargaList, selectedKK, setSelectedKK, currentUser, userNoKk, userWarga, canManageFamily } = useApp();
  const [kkSearch, setKkSearch] = useState('');
  const [sortBy, setSortBy] = useState<'nama_kk' | 'no_kk'>('nama_kk');
  const [activeKKModal, setActiveKKModal] = useState<string | null>(selectedKK);

  const isWargaRole = currentUser?.role === 'warga';
  const effectiveUserNoKk = userNoKk || userWarga?.noKk || '3374060503150008';

  // Group residents by No. KK
  const kkGroups = useMemo(() => {
    const map = new Map<string, Warga[]>();
    wargaList.forEach((w) => {
      const key = w.noKk || 'NO_KK_UNDEFINED';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    });

    const list: {
      noKk: string;
      kepalaKeluarga: string;
      kepalaNik: string;
      alamat: string;
      domisili: string;
      personKontak: string;
      phone: string;
      members: Warga[];
    }[] = [];

    map.forEach((members, noKk) => {
      // Find Kepala Keluarga or first member
      const kepala = members.find((m) => m.statusKeluarga === 'Kepala Keluarga') || members[0];
      const foundPhone = members.find((m) => (m.noHp || m.telepon)?.trim())?.noHp || members.find((m) => (m.noHp || m.telepon)?.trim())?.telepon || '-';
      const foundPerson = members.find((m) => m.personKontak?.trim())?.personKontak || kepala?.nama || '-';

      list.push({
        noKk,
        kepalaKeluarga: kepala?.nama || 'Kepala Keluarga',
        kepalaNik: kepala?.nik || '-',
        alamat: kepala?.alamat || members[0]?.alamat || '-',
        domisili: kepala?.domisili || members[0]?.domisili || 'RT 02 RW 14',
        personKontak: foundPerson,
        phone: foundPhone,
        members: members.sort((a, b) => {
          const rank = (s: string) => {
            if (s === 'Kepala Keluarga') return 1;
            if (s === 'Istri') return 2;
            if (s === 'Anak') return 3;
            if (s === 'Cucu') return 4;
            return 5;
          };
          return rank(a.statusKeluarga) - rank(b.statusKeluarga);
        }),
      });
    });

    return list.sort((a, b) => {
      const cmp = a.kepalaKeluarga.localeCompare(b.kepalaKeluarga, 'id', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [wargaList]);

  // Displayed KK List: for role 'warga', strictly restrict to their own family KK only!
  const displayedKK = useMemo(() => {
    if (isWargaRole) {
      const myKK = kkGroups.find((g) => g.noKk === effectiveUserNoKk);
      if (myKK) return [myKK];
      // Fallback if not yet in kkGroups
      const myMembers = wargaList.filter((w) => w.noKk === effectiveUserNoKk);
      if (myMembers.length > 0) {
        const kepala = myMembers.find((m) => m.statusKeluarga === 'Kepala Keluarga') || myMembers[0];
        return [{
          noKk: effectiveUserNoKk,
          kepalaKeluarga: kepala?.nama || currentUser?.nama || 'Kepala Keluarga',
          kepalaNik: kepala?.nik || '-',
          alamat: kepala?.alamat || 'RT 02 RW 14 Pedurungan Tengah',
          domisili: kepala?.domisili || 'Domisili RT 02 RW 14',
          personKontak: kepala?.nama || '-',
          phone: kepala?.noHp || kepala?.telepon || '-',
          members: myMembers
        }];
      }
      return [];
    }

    let list = kkGroups;
    if (kkSearch.trim()) {
      const q = kkSearch.toLowerCase();
      list = kkGroups.filter(
        (kk) =>
          kk.noKk.toLowerCase().includes(q) ||
          kk.kepalaKeluarga.toLowerCase().includes(q) ||
          kk.alamat.toLowerCase().includes(q) ||
          kk.members.some((m) => m.nama.toLowerCase().includes(q) || m.nik.includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'no_kk') {
        const cmpKk = a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
        if (cmpKk !== 0) return cmpKk;
        return a.kepalaKeluarga.localeCompare(b.kepalaKeluarga, 'id', { sensitivity: 'base' });
      }
      const cmpNama = a.kepalaKeluarga.localeCompare(b.kepalaKeluarga, 'id', { sensitivity: 'base' });
      if (cmpNama !== 0) return cmpNama;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [isWargaRole, kkGroups, effectiveUserNoKk, wargaList, currentUser, kkSearch, sortBy]);

  const selectedKKData = useMemo(() => {
    if (!activeKKModal) return null;
    // For warga role, prevent viewing other families' KK sheet
    if (isWargaRole && activeKKModal !== effectiveUserNoKk) return null;
    return kkGroups.find((g) => g.noKk === activeKKModal) || null;
  }, [kkGroups, activeKKModal, isWargaRole, effectiveUserNoKk]);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-700" />
            <span>{isWargaRole ? 'Kartu Keluarga (KK Saya)' : 'Buku Kartu Keluarga (KK) RT 02 RW 14'}</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              {isWargaRole ? 'Akses Khusus Warga Terdaftar' : `${kkGroups.length} Keluarga Terdaftar`}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isWargaRole ? (
              <span>
                Pengelolaan mandiri data kependudukan keluarga Anda (No. KK: <strong className="font-mono text-emerald-900 font-bold">{effectiveUserNoKk}</strong>). Anda berwenang mengoreksi dan menambah anggota keluarga sendiri.
              </span>
            ) : (
              'Pengelompokan hubungan kekeluargaan berdasarkan Nomor Kartu Keluarga resmi.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* If Warga Role: Provide direct Add Family Member Button */}
          {isWargaRole ? (
            <div className="flex items-center gap-2">
              {onOpenAddMember && (
                <button
                  onClick={() => onOpenAddMember(effectiveUserNoKk)}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Anggota Keluarga</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5" title="Urutkan Data KK">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                >
                  <option value="nama_kk">Urut: Nama Kepala &amp; No. KK</option>
                  <option value="no_kk">Urut: No. KK &amp; Nama Kepala</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={kkSearch}
                  onChange={(e) => setKkSearch(e.target.value)}
                  placeholder="Cari No. KK, nama kepala..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notice Banner for Warga Role */}
      {isWargaRole && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">
                Pusat Data Keluarga Mandiri &bull; Akun: {currentUser?.nama} ({currentUser?.roleLabel})
              </p>
              <p className="text-[11px] text-emerald-800/90 mt-0.5">
                Sesuai kebijakan hak akses sistem RT 02 RW 14, Anda hanya dapat melihat dan mengelola kartu keluarga Anda sendiri. Gunakan tombol <strong>Koreksi Data</strong> pada anggota keluarga jika terdapat perbaikan biodata, atau <strong>Tambah Anggota Keluarga</strong> untuk mendaftarkan anak/anggota baru.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of KK Cards */}
      <div className={`grid ${isWargaRole ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 4k:grid-cols-5'} gap-4 2xl:gap-5 4k:gap-6`}>
        {displayedKK.map((kk) => {
          return (
            <div
              key={kk.noKk}
              className={`bg-white rounded-2xl border ${isWargaRole ? 'border-emerald-300 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'} transition-all p-5 flex flex-col justify-between`}
            >
              <div>
                {/* KK Top Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      {isWargaRole ? 'Kartu Keluarga Anda' : 'Kepala Keluarga'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {kk.kepalaKeluarga}
                    </h3>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {kk.members.length} Jiwa
                  </span>
                </div>

                {/* KK Meta */}
                <div className="space-y-1.5 text-xs text-slate-600 pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-400">No. KK:</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">{kk.noKk}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span className="line-clamp-1">{kk.alamat}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Kontak Person:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{kk.personKontak}</span>
                  </div>
                  {kk.phone && kk.phone !== '-' && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">No. HP / WA:</span>
                      <span className="font-mono text-emerald-800 font-bold">{kk.phone}</span>
                    </div>
                  )}
                </div>

                {/* Member Preview List */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Susunan Anggota Keluarga ({kk.members.length}):
                    </span>
                    {isWargaRole && onOpenAddMember && (
                      <button
                        onClick={() => onOpenAddMember(kk.noKk)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Tambah</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {/* For warga role, show all members so they can correct any of them */}
                    {(isWargaRole ? kk.members : kk.members.slice(0, 4)).map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                        <div className="min-w-0 pr-2">
                          <div className="text-slate-800 font-medium truncate">
                            {m.nama}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIK: {m.nik}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold whitespace-nowrap">
                            {m.statusKeluarga}
                          </span>
                          
                          {/* Tombol Koreksi Anggota Keluarga */}
                          {(isWargaRole || canManageFamily(kk.noKk)) && onOpenEditMember && (
                            <button
                              onClick={() => onOpenEditMember(m)}
                              title={`Koreksi Data ${m.nama}`}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {!isWargaRole && kk.members.length > 4 && (
                      <div className="text-[10px] text-emerald-700 font-semibold pl-1">
                        + {kk.members.length - 4} anggota lainnya...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-2">
                {isWargaRole && onOpenAddMember && (
                  <button
                    onClick={() => onOpenAddMember(kk.noKk)}
                    className="w-full py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Anggota Keluarga</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveKKModal(kk.noKk)}
                  className={`w-full py-2 text-xs font-bold ${isWargaRole ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'} rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Buka Lembar Resmi Kartu Keluarga</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Kartu Keluarga Modal Document */}
      {selectedKKData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-700" />
                <span className="text-sm font-bold text-slate-800">
                  Pratinjau Resmi Kartu Keluarga (KK)
                </span>
                {isWargaRole && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    KK Mandiri
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Tambah Anggota in Modal */}
                {onOpenAddMember && (isWargaRole || canManageFamily(selectedKKData.noKk)) && (
                  <button
                    onClick={() => {
                      onOpenAddMember(selectedKKData.noKk);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Anggota</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak KK</span>
                </button>
                <button
                  onClick={() => setActiveKKModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable KK style) */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800" id="printable-kk">
              {/* KK Header */}
              <div className="text-center pb-4 border-b-2 border-emerald-900">
                <div className="text-sm font-bold tracking-widest text-emerald-950 uppercase">
                  REPUBLIK INDONESIA
                </div>
                <h1 className="text-xl font-black text-emerald-900 uppercase tracking-wider my-1">
                  KARTU KELUARGA
                </h1>
                <div className="font-mono text-base font-bold text-slate-900 tracking-wider">
                  No. {selectedKKData.noKk}
                </div>
              </div>

              {/* KK Identity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-xs bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Kepala Keluarga</span>
                    <span className="font-bold text-slate-900 uppercase">{selectedKKData.kepalaKeluarga}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alamat</span>
                    <span className="font-medium text-slate-800 text-right">{selectedKKData.alamat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RT / RW</span>
                    <span className="font-bold text-slate-800">02 / 14</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kelurahan / Desa</span>
                    <span className="font-medium text-slate-800">Pedurungan Tengah</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kecamatan</span>
                    <span className="font-medium text-slate-800">Pedurungan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kabupaten / Kota</span>
                    <span className="font-bold text-slate-800">Kota Semarang</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provinsi</span>
                    <span className="font-medium text-slate-800">Jawa Tengah</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Domisili</span>
                    <span className="font-bold text-emerald-800">{selectedKKData.domisili}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Person Kontak</span>
                    <span className="font-bold text-slate-800">{selectedKKData.personKontak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. HP / WA</span>
                    <span className="font-mono font-bold text-emerald-800">{selectedKKData.phone}</span>
                  </div>
                </div>
              </div>

              {/* Tabel 1: Identitas Pribadi Anggota */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-slate-600 uppercase">
                    I. DAFTAR ANGGOTA KELUARGA
                  </div>
                  <span className="text-[10px] text-slate-400 print:hidden">
                    Klik tombol Koreksi untuk mengubah data anggota
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                        <th className="p-2 border-r border-slate-300">NIK</th>
                        <th className="p-2 border-r border-slate-300">Jenis Kelamin</th>
                        <th className="p-2 border-r border-slate-300">Tempat Lahir</th>
                        <th className="p-2 border-r border-slate-300">Tgl Lahir</th>
                        <th className="p-2 border-r border-slate-300">Agama</th>
                        <th className="p-2 border-r border-slate-300">Pendidikan</th>
                        <th className="p-2 text-center print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedKKData.members.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{m.nama}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{m.nik}</td>
                          <td className="p-2 border-r border-slate-200">{m.jenisKelamin}</td>
                          <td className="p-2 border-r border-slate-200">{m.tempatLahir}</td>
                          <td className="p-2 border-r border-slate-200">{m.tglLahir}</td>
                          <td className="p-2 border-r border-slate-200">{m.agama}</td>
                          <td className="p-2 border-r border-slate-200">{m.pendidikan}</td>
                          <td className="p-2 text-center print:hidden">
                            {onOpenEditMember && (
                              <button
                                onClick={() => onOpenEditMember(m)}
                                title={`Koreksi Data ${m.nama}`}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3 h-3 text-emerald-700" />
                                <span>Koreksi</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabel 2: Status Hubungan & Status Perkawinan */}
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase mb-1">
                  II. STATUS PERKAWINAN & HUBUNGAN KELUARGA
                </div>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                        <th className="p-2 border-r border-slate-300">Status Perkawinan</th>
                        <th className="p-2 border-r border-slate-300">Status Hubungan di Keluarga</th>
                        <th className="p-2 border-r border-slate-300">Person Kontak</th>
                        <th className="p-2 border-r border-slate-300">No. HP</th>
                        <th className="p-2 border-r border-slate-300">Kewarganegaraan</th>
                        <th className="p-2 border-r border-slate-300">Catatan Kependudukan</th>
                        <th className="p-2 text-center print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedKKData.members.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{m.statusPerkawinan}</td>
                          <td className="p-2 border-r border-slate-200 font-bold text-emerald-800">{m.statusKeluarga}</td>
                          <td className="p-2 border-r border-slate-200">{m.personKontak || (m.statusKeluarga === 'Kepala Keluarga' ? `${m.nama} (KK)` : selectedKKData.personKontak || '-')}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{m.noHp || m.telepon || selectedKKData.phone || '-'}</td>
                          <td className="p-2 border-r border-slate-200">WNI</td>
                          <td className="p-2 border-r border-slate-200 text-slate-500">{m.domisili}</td>
                          <td className="p-2 text-center print:hidden">
                            {onOpenEditMember && (
                              <button
                                onClick={() => onOpenEditMember(m)}
                                title={`Koreksi Data ${m.nama}`}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3 h-3 text-emerald-700" />
                                <span>Koreksi</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-slate-700">
                <div>
                  <p className="font-medium">KEPALA KELUARGA,</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900 uppercase">
                    ( {selectedKKData.kepalaKeluarga} )
                  </div>
                </div>
                <div>
                  <p className="font-medium">KETUA RT 02 RW 14 PEDURUNGAN TENGAH,</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-900 uppercase">
                    ( ALI MUHTAROM, S.T )
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
