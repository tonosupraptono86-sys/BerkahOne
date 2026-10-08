import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Warga } from '../types';
import { calculateAge, getAgeCategory, formatIndoDate } from '../utils/dateUtils';
import { 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  FolderGit2, 
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
  ArrowUpDown,
  UserCheck,
  MessageSquare,
  Phone,
  Flower2
} from 'lucide-react';

interface WargaTableProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (warga: Warga) => void;
  onOpenDetailModal: (warga: Warga) => void;
  onGenerateSurat: (warga: Warga) => void;
}

export const WargaTable: React.FC<WargaTableProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
  onGenerateSurat
}) => {
  const { 
    wargaList, 
    searchQuery, 
    setSearchQuery, 
    deleteWarga, 
    hasPermission, 
    setSelectedKK, 
    setActiveTab 
  } = useApp();

  // Filters state
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterStatusKeluarga, setFilterStatusKeluarga] = useState<string>('all');
  const [filterPerkawinan, setFilterPerkawinan] = useState<string>('all');
  const [filterDomisili, setFilterDomisili] = useState<string>('all');
  const [filterAgama, setFilterAgama] = useState<string>('all');
  const [filterAgeCategory, setFilterAgeCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'kepala_kk' | 'no_kk' | 'nama_warga' | 'nik'>('kepala_kk');
  const [wargaToDelete, setWargaToDelete] = useState<Warga | null>(null);

  // Map No. KK to Nama Kepala Keluarga
  const kkKepalaMap = useMemo(() => {
    const map = new Map<string, string>();
    wargaList.forEach((w) => {
      const k = w.noKk?.trim();
      if (!k) return;
      if (w.statusKeluarga === 'Kepala Keluarga' || !map.has(k)) {
        map.set(k, w.nama);
      }
    });
    return map;
  }, [wargaList]);

  // Map No. KK to Info Kontak Keluarga (Person Kontak & No. HP)
  const kkContactMap = useMemo(() => {
    const map = new Map<string, { personKontak: string; noHp: string }>();
    wargaList.forEach((w) => {
      const k = w.noKk?.trim();
      if (!k) return;
      const phone = (w.noHp || w.telepon || '').trim();
      const person = (w.personKontak || (w.statusKeluarga === 'Kepala Keluarga' ? w.nama : '')).trim();

      if (!map.has(k)) {
        map.set(k, { personKontak: person || w.nama, noHp: phone });
      } else {
        const prev = map.get(k)!;
        if (w.statusKeluarga === 'Kepala Keluarga') {
          map.set(k, {
            personKontak: person || w.nama,
            noHp: phone || prev.noHp
          });
        } else if (!prev.noHp && phone) {
          map.set(k, {
            personKontak: prev.personKontak || person || w.nama,
            noHp: phone
          });
        }
      }
    });
    return map;
  }, [wargaList]);

  // Helper WA clean
  const cleanWaNumber = (num: string): string => {
    let c = num.replace(/\D/g, '');
    if (c.startsWith('0')) return '62' + c.slice(1);
    if (c.startsWith('8')) return '62' + c;
    return c;
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Filter logic
  const filteredWarga = useMemo(() => {
    return wargaList.filter((w) => {
      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = w.nama.toLowerCase().includes(query);
        const matchNik = w.nik.toLowerCase().includes(query);
        const matchKk = w.noKk.toLowerCase().includes(query);
        const matchAlamat = w.alamat.toLowerCase().includes(query);
        const matchTempat = w.tempatLahir.toLowerCase().includes(query);
        const matchPerson = (w.personKontak || '').toLowerCase().includes(query);
        const matchHp = (w.noHp || w.telepon || '').toLowerCase().includes(query);
        if (!matchName && !matchNik && !matchKk && !matchAlamat && !matchTempat && !matchPerson && !matchHp) {
          return false;
        }
      }

      // Gender filter
      if (filterGender !== 'all' && w.jenisKelamin !== filterGender) {
        return false;
      }

      // Family role filter
      if (filterStatusKeluarga !== 'all' && w.statusKeluarga !== filterStatusKeluarga) {
        return false;
      }

      // Status Perkawinan filter
      if (filterPerkawinan !== 'all' && w.statusPerkawinan !== filterPerkawinan) {
        return false;
      }

      // Domisili filter
      if (filterDomisili !== 'all') {
        if (filterDomisili === 'rt02' && !w.domisili.toLowerCase().includes('rt 02')) return false;
        if (filterDomisili === 'luar' && w.domisili.toLowerCase().includes('rt 02')) return false;
      }

      // Agama filter
      if (filterAgama !== 'all' && w.agama !== filterAgama) {
        return false;
      }

      // Age category filter
      if (filterAgeCategory !== 'all') {
        const age = calculateAge(w.tglLahir);
        const cat = getAgeCategory(age).label;
        if (filterAgeCategory === 'balita' && cat !== 'Balita') return false;
        if (filterAgeCategory === 'anak' && cat !== 'Anak-anak') return false;
        if (filterAgeCategory === 'remaja' && cat !== 'Remaja') return false;
        if (filterAgeCategory === 'dewasa' && cat !== 'Dewasa') return false;
        if (filterAgeCategory === 'lansia' && cat !== 'Lansia') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'no_kk') {
        const cmpKk = a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
        if (cmpKk !== 0) return cmpKk;
        const kepalaA = kkKepalaMap.get(a.noKk) || a.nama;
        const kepalaB = kkKepalaMap.get(b.noKk) || b.nama;
        const cmpKepala = kepalaA.localeCompare(kepalaB, 'id', { sensitivity: 'base' });
        if (cmpKepala !== 0) return cmpKepala;
        const rank = (s: string) => {
          if (s === 'Kepala Keluarga') return 1;
          if (s === 'Istri') return 2;
          if (s === 'Anak') return 3;
          if (s === 'Cucu') return 4;
          return 5;
        };
        const rDiff = rank(a.statusKeluarga) - rank(b.statusKeluarga);
        if (rDiff !== 0) return rDiff;
        return a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' });
      }

      if (sortBy === 'nama_warga') {
        return a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' });
      }

      if (sortBy === 'nik') {
        return a.nik.localeCompare(b.nik, 'id', { numeric: true });
      }

      // default: 'kepala_kk' (Urut Nama Kepala Keluarga lalu Nomor KK)
      const kepalaA = kkKepalaMap.get(a.noKk) || a.nama;
      const kepalaB = kkKepalaMap.get(b.noKk) || b.nama;
      const cmpKepala = kepalaA.localeCompare(kepalaB, 'id', { sensitivity: 'base' });
      if (cmpKepala !== 0) return cmpKepala;

      const cmpKk = a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
      if (cmpKk !== 0) return cmpKk;

      // Di dalam keluarga yang sama: urutkan Kepala Keluarga dahulu, kemudian Istri, Anak, Cucu
      const rank = (s: string) => {
        if (s === 'Kepala Keluarga') return 1;
        if (s === 'Istri') return 2;
        if (s === 'Anak') return 3;
        if (s === 'Cucu') return 4;
        return 5;
      };
      const rDiff = rank(a.statusKeluarga) - rank(b.statusKeluarga);
      if (rDiff !== 0) return rDiff;

      return a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' });
    });
  }, [
    wargaList,
    searchQuery,
    filterGender,
    filterStatusKeluarga,
    filterPerkawinan,
    filterDomisili,
    filterAgama,
    filterAgeCategory,
    sortBy,
    kkKepalaMap
  ]);

  // Paginated records
  const totalPages = Math.ceil(filteredWarga.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWarga.slice(start, start + itemsPerPage);
  }, [filteredWarga, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterGender('all');
    setFilterStatusKeluarga('all');
    setFilterPerkawinan('all');
    setFilterDomisili('all');
    setFilterAgama('all');
    setFilterAgeCategory('all');
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      'No', 'Nama Warga', 'NIK', 'No. KK', 'Status di Keluarga', 'Jenis Kelamin', 
      'Status Perkawinan', 'Alamat', 'Domisili', 'Person Kontak', 'No. HP', 'Tempat Lahir', 'Tgl Lahir', 'Agama', 'Pendidikan'
    ];

    const rows = filteredWarga.map((w, idx) => {
      const kkInfo = kkContactMap.get(w.noKk?.trim());
      const person = w.personKontak?.trim() || (w.statusKeluarga === 'Kepala Keluarga' ? w.nama : (kkInfo?.personKontak || '-'));
      const phone = (w.noHp || w.telepon || kkInfo?.noHp || '-').trim();

      return [
        idx + 1,
        `"${w.nama.replace(/"/g, '""')}"`,
        `'${w.nik}`,
        `'${w.noKk}`,
        `"${w.statusKeluarga}"`,
        `"${w.jenisKelamin}"`,
        `"${w.statusPerkawinan}"`,
        `"${w.alamat.replace(/"/g, '""')}"`,
        `"${w.domisili}"`,
        `"${person.replace(/"/g, '""')}"`,
        `'${phone}`,
        `"${w.tempatLahir}"`,
        `"${w.tglLahir}"`,
        `"${w.agama}"`,
        `"${w.pendidikan}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BerkahOne_Data_Warga_RT02_RW14_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Buku Induk Data Kependudukan</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              {filteredWarga.length} Jiwa Ditemukan
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data kependudukan RT 02 RW 14 Pedurungan Tengah, Kota Semarang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('manage_warga') && (
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Warga</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV untuk Excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Format Cetak</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 2xl:grid-cols-6 4k:grid-cols-6 gap-2.5 4k:gap-4">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, NIK, No. KK..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 outline-none text-slate-700"
            >
              <option value="all">Semua Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Status Keluarga */}
          <div>
            <select
              value={filterStatusKeluarga}
              onChange={(e) => { setFilterStatusKeluarga(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 outline-none text-slate-700"
            >
              <option value="all">Status Keluarga</option>
              <option value="Kepala Keluarga">Kepala Keluarga</option>
              <option value="Istri">Istri</option>
              <option value="Anak">Anak</option>
              <option value="Cucu">Cucu</option>
            </select>
          </div>

          {/* Status Perkawinan */}
          <div>
            <select
              value={filterPerkawinan}
              onChange={(e) => { setFilterPerkawinan(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 outline-none text-slate-700"
            >
              <option value="all">Status Perkawinan</option>
              <option value="Kawin">Kawin</option>
              <option value="Belum Kawin">Belum Kawin</option>
              <option value="Janda">Janda</option>
              <option value="Duda">Duda</option>
              <option value="Meninggal">Meninggal</option>
            </select>
          </div>

          {/* Rentang Usia */}
          <div>
            <select
              value={filterAgeCategory}
              onChange={(e) => { setFilterAgeCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-600 outline-none text-slate-700"
            >
              <option value="all">Semua Kelompok Usia</option>
              <option value="balita">Balita (0 - 5 Th)</option>
              <option value="anak">Anak (6 - 12 Th)</option>
              <option value="remaja">Remaja (13 - 18 Th)</option>
              <option value="dewasa">Dewasa (19 - 59 Th)</option>
              <option value="lansia">Lansia (60+ Th)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Filter Domisili:</span>
            <button
              onClick={() => { setFilterDomisili('all'); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded-md ${filterDomisili === 'all' ? 'bg-emerald-800 text-white font-semibold' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
            >
              Semua
            </button>
            <button
              onClick={() => { setFilterDomisili('rt02'); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded-md ${filterDomisili === 'rt02' ? 'bg-emerald-800 text-white font-semibold' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
            >
              Domisili RT 02
            </button>
            <button
              onClick={() => { setFilterDomisili('luar'); setCurrentPage(1); }}
              className={`px-2 py-0.5 rounded-md ${filterDomisili === 'luar' ? 'bg-emerald-800 text-white font-semibold' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
            >
              Luar RT 02 / Kost
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                <option value="kepala_kk">Urut: Kepala KK &amp; No. KK</option>
                <option value="no_kk">Urut: No. KK &amp; Kepala KK</option>
                <option value="nama_warga">Urut: Nama Warga (A-Z)</option>
                <option value="nik">Urut: NIK</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">No</th>
                <th className="py-3.5 px-3.5">Nama Lengkap &amp; NIK</th>
                <th className="py-3.5 px-3.5">No. Kartu Keluarga</th>
                <th className="py-3.5 px-3">Status Keluarga</th>
                <th className="py-3.5 px-3">L/P &amp; Umur</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3.5">Alamat &amp; Domisili</th>
                <th className="py-3.5 px-3.5">Person Kontak</th>
                <th className="py-3.5 px-3.5">No. HP</th>
                <th className="py-3.5 px-3">Pendidikan</th>
                <th className="py-3.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Tidak ada data warga yang cocok dengan kriteria pencarian.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 text-xs text-emerald-700 font-bold hover:underline"
                    >
                      Bersihkan filter pencarian
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedData.map((w, idx) => {
                  const age = calculateAge(w.tglLahir);
                  const ageCat = getAgeCategory(age);
                  const isMeninggal = w.statusPerkawinan === 'Meninggal';

                  const kkInfo = kkContactMap.get(w.noKk?.trim());
                  const explicitPerson = w.personKontak?.trim();
                  const explicitHp = (w.noHp || w.telepon || '').trim();
                  const displayPerson = explicitPerson || (w.statusKeluarga === 'Kepala Keluarga' ? w.nama : (kkInfo?.personKontak || '-'));
                  const displayHp = explicitHp || (kkInfo?.noHp || '-');
                  const isHpFromKK = !explicitHp && !!kkInfo?.noHp;
                  const isPersonFromKK = !explicitPerson && w.statusKeluarga !== 'Kepala Keluarga' && !!kkInfo?.personKontak;

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-slate-50/90 transition-colors ${isMeninggal ? 'bg-slate-50/50 opacity-80' : ''}`}
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* Nama & NIK */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-xs hover:text-emerald-800 cursor-pointer" onClick={() => onOpenDetailModal(w)}>
                          {w.nama}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 tracking-tight flex items-center gap-1 mt-0.5">
                          <span>NIK:</span>
                          <span className="bg-slate-100 px-1 py-0.2 rounded">{w.nik}</span>
                        </div>
                      </td>

                      {/* No KK */}
                      <td className="py-3 px-3.5">
                        <button
                          onClick={() => {
                            setSelectedKK(w.noKk);
                            setActiveTab('kk');
                          }}
                          className="font-mono text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                          title="Buka Kartu Keluarga ini"
                        >
                          <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{w.noKk}</span>
                        </button>
                      </td>

                      {/* Status Keluarga */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          w.statusKeluarga === 'Kepala Keluarga' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : w.statusKeluarga === 'Istri'
                            ? 'bg-pink-100 text-pink-800 border border-pink-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {w.statusKeluarga}
                        </span>
                        {w.statusKeluarga === 'Istri' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('pkk');
                            }}
                            className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
                            title="Buka Data Peserta PKK RT 02"
                          >
                            <Flower2 className="w-2.5 h-2.5 text-rose-600" />
                            <span>Peserta PKK</span>
                          </button>
                        )}
                      </td>

                      {/* L/P & Umur */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            w.jenisKelamin === 'Laki-laki' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {w.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </span>
                          <span className="font-medium text-slate-800">{age} Th</span>
                        </div>
                        <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded mt-0.5 border ${ageCat.badgeBg}`}>
                          {ageCat.label}
                        </span>
                      </td>

                      {/* Status Perkawinan */}
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-medium ${
                          isMeninggal ? 'text-red-600 font-semibold' : 'text-slate-700'
                        }`}>
                          {w.statusPerkawinan}
                        </span>
                      </td>

                      {/* Alamat & Domisili */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="truncate text-slate-800 font-medium" title={w.alamat}>
                          {w.alamat}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {w.domisili}
                        </div>
                      </td>

                      {/* Person Kontak */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]" title={displayPerson}>
                            {displayPerson}
                          </span>
                        </div>
                        {isPersonFromKK && (
                          <span className="text-[9px] text-slate-400 font-medium block">
                            (Kontak KK)
                          </span>
                        )}
                      </td>

                      {/* No. HP */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {displayHp && displayHp !== '-' ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/${cleanWaNumber(displayHp)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Hubungi via WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{displayHp}</span>
                            </a>
                            {isHpFromKK && (
                              <span className="text-[9px] text-slate-400 font-medium">
                                (KK)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Pendidikan */}
                      <td className="py-3 px-3">
                        <span className="text-slate-600 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          {w.pendidikan || '-'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenDetailModal(w)}
                            title="Lihat Detail Profil"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onGenerateSurat(w)}
                            title="Buat Surat Pengantar RT"
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {hasPermission('manage_warga') && (
                            <>
                              <button
                                onClick={() => onOpenEditModal(w)}
                                title="Ubah Data Warga"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setWargaToDelete(w)}
                                title="Hapus Data Warga"
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan{' '}
            <span className="font-bold text-slate-800">
              {filteredWarga.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-bold text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredWarga.length)}
            </span>{' '}
            dari <span className="font-bold text-slate-800">{filteredWarga.length}</span> warga
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={page}>
                    {prev && page - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                        currentPage === page
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* In-app Modal Konfirmasi Hapus Warga */}
      {wargaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Data Warga?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Data kependudukan warga ini akan dihapus dari buku administrasi RT.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWargaToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nama Lengkap:</span>
                <span className="font-bold text-slate-900">{wargaToDelete.nama}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">NIK:</span>
                <span className="font-mono text-slate-700">{wargaToDelete.nik}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">No. KK:</span>
                <span className="font-mono text-slate-700">{wargaToDelete.noKk}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Alamat Domisili:</span>
                <span className="text-slate-700 text-right">{wargaToDelete.alamat}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWargaToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteWarga(wargaToDelete.id);
                  setWargaToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Warga</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
