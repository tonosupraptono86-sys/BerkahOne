import React, { useState, useMemo, useEffect } from 'react';
import { TarifWargaKK, Warga } from '../../types';
import {
  X,
  Search,
  Settings,
  Edit2,
  Check,
  RotateCcw,
  AlertCircle,
  Coins,
  Calendar,
  Save,
  Info,
  Plus,
  UserPlus,
  Trash2,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  User
} from 'lucide-react';

interface TarifModalProps {
  tarifWargaList: TarifWargaKK[];
  wargaList?: Warga[];
  onClose: () => void;
  onSaveAll: (newList: TarifWargaKK[]) => void;
  onUpdateTarif?: (noKk: string, data: Partial<TarifWargaKK>) => void;
  initialEditingNoKk?: string;
}

export const formatRupiah = (amount: number): string => {
  if (amount < 0) {
    return '-Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

const BULAN_LIST = [
  { key: '2026-01', short: 'Jan', full: 'Januari' },
  { key: '2026-02', short: 'Feb', full: 'Februari' },
  { key: '2026-03', short: 'Mar', full: 'Maret' },
  { key: '2026-04', short: 'Apr', full: 'April' },
  { key: '2026-05', short: 'Mei', full: 'Mei' },
  { key: '2026-06', short: 'Jun', full: 'Juni' },
  { key: '2026-07', short: 'Jul', full: 'Juli' },
  { key: '2026-08', short: 'Ags', full: 'Agustus' },
  { key: '2026-09', short: 'Sep', full: 'September' },
  { key: '2026-10', short: 'Okt', full: 'Oktober' },
  { key: '2026-11', short: 'Nov', full: 'November' },
  { key: '2026-12', short: 'Des', full: 'Desember' },
];

export const TarifModal: React.FC<TarifModalProps> = ({
  tarifWargaList,
  wargaList = [],
  onClose,
  onSaveAll,
  onUpdateTarif,
  initialEditingNoKk
}) => {
  // Local draft state so changes can be Saved (Simpan) or Discarded (Batal)
  const [draftList, setDraftList] = useState<TarifWargaKK[]>(() =>
    tarifWargaList.map((item) => ({
      ...item,
      bulanDitutup: item.bulanDitutup ? [...item.bulanDitutup] : []
    }))
  );

  // Track changes to highlight them and detect unsaved edits
  const [modifiedNoKks, setModifiedNoKks] = useState<Set<string>>(new Set());
  const [newNoKks, setNewNoKks] = useState<Set<string>>(new Set());
  const [deletedItemsHistory, setDeletedItemsHistory] = useState<TarifWargaKK[]>([]);
  const [lastDeletedItem, setLastDeletedItem] = useState<TarifWargaKK | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // STATE: EDIT EXISTING KK
  // ----------------------------------------------------
  const [editingTarifKk, setEditingTarifKk] = useState<string | null>(null);
  const [editJimpitan, setEditJimpitan] = useState<number | string>(15000);
  const [editUangMeja, setEditUangMeja] = useState<number | string>(10000);
  const [editTabungan, setEditTabungan] = useState<number | string>(0);
  const [editIkutJimpitan, setEditIkutJimpitan] = useState<boolean>(true);
  const [editIkutUangMeja, setEditIkutUangMeja] = useState<boolean>(true);
  const [editIkutTabungan, setEditIkutTabungan] = useState<boolean>(true);
  const [editTagihanPeriodeSebelum, setEditTagihanPeriodeSebelum] = useState<number | string>(0);
  const [editBulanDitutup, setEditBulanDitutup] = useState<string[]>([]);
  const [editCatatan, setEditCatatan] = useState<string>('');

  // ----------------------------------------------------
  // STATE: ADD NEW CITIZEN / KK TARIFF
  // ----------------------------------------------------
  const [isAddingNewTarif, setIsAddingNewTarif] = useState<boolean>(false);
  const [addSourceMode, setAddSourceMode] = useState<'from_warga' | 'manual'>('from_warga');
  const [addSelectedWargaKk, setAddSelectedWargaKk] = useState<string>('');
  const [addNoKk, setAddNoKk] = useState<string>('');
  const [addNamaKepala, setAddNamaKepala] = useState<string>('');
  const [addJimpitan, setAddJimpitan] = useState<number | string>(15000);
  const [addUangMeja, setAddUangMeja] = useState<number | string>(10000);
  const [addTabungan, setAddTabungan] = useState<number | string>(0);
  const [addIkutJimpitan, setAddIkutJimpitan] = useState<boolean>(true);
  const [addIkutUangMeja, setAddIkutUangMeja] = useState<boolean>(true);
  const [addIkutTabungan, setAddIkutTabungan] = useState<boolean>(true);
  const [addTagihanPeriodeSebelum, setAddTagihanPeriodeSebelum] = useState<number | string>(0);
  const [addBulanDitutup, setAddBulanDitutup] = useState<string[]>([]);
  const [addCatatan, setAddCatatan] = useState<string>('');
  const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);

  // ----------------------------------------------------
  // STATE: DELETE CONFIRMATION
  // ----------------------------------------------------
  const [deletingItem, setDeletingItem] = useState<TarifWargaKK | null>(null);

  // ----------------------------------------------------
  // STATE: CONFIRMATION DIALOG FOR BATAL
  // ----------------------------------------------------
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);

  // Derive unique families from wargaList for quick selection in Add form
  const uniqueWargaFamilies = useMemo(() => {
    if (!wargaList || wargaList.length === 0) return [];
    const map = new Map<string, { noKk: string; namaKepala: string; alamat: string }>();
    wargaList.forEach((w) => {
      const k = w.noKk?.trim() || `KK-${w.nik || w.id}`;
      if (!map.has(k)) {
        map.set(k, {
          noKk: k,
          namaKepala: w.nama,
          alamat: w.alamat || ''
        });
      } else if (
        w.statusKeluarga === 'Kepala Keluarga' ||
        (w as any).statusHubunganKeluarga === 'Kepala Keluarga' ||
        (w as any).statusHubunganKeluarga === 'KEPALA KELUARGA'
      ) {
        const existing = map.get(k)!;
        existing.namaKepala = w.nama;
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const cmp = a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [wargaList]);

  // Set of current KKs already in draftList
  const existingNoKkSet = useMemo(() => {
    return new Set(draftList.map((d) => d.noKk));
  }, [draftList]);

  const hasUnsavedChanges =
    modifiedNoKks.size > 0 ||
    newNoKks.size > 0 ||
    deletedItemsHistory.length > 0 ||
    editingTarifKk !== null ||
    isAddingNewTarif;

  // Selected KK being edited object
  const activeEditingItem = useMemo(() => {
    if (!editingTarifKk) return null;
    return draftList.find((t) => t.noKk === editingTarifKk) || null;
  }, [editingTarifKk, draftList]);

  // ----------------------------------------------------
  // HANDLERS: EDIT KK
  // ----------------------------------------------------
  const handleOpenEdit = (t: TarifWargaKK) => {
    setIsAddingNewTarif(false);
    setEditingTarifKk(t.noKk);
    setEditJimpitan(t.jimpitan);
    setEditUangMeja(t.uangMeja);
    setEditTabungan(t.tabungan);
    setEditIkutJimpitan(t.ikutJimpitan);
    setEditIkutUangMeja(t.ikutUangMeja);
    setEditIkutTabungan(t.ikutTabungan);
    setEditTagihanPeriodeSebelum(t.tagihanPeriodeSebelum ?? 0);
    setEditBulanDitutup(t.bulanDitutup ? [...t.bulanDitutup] : []);
    setEditCatatan(t.catatan || '');
  };

  useEffect(() => {
    if (initialEditingNoKk) {
      const item = draftList.find((t) => t.noKk === initialEditingNoKk);
      if (item) {
        handleOpenEdit(item);
      }
    }
  }, [initialEditingNoKk]);

  const handleCancelKkEdit = () => {
    setEditingTarifKk(null);
  };

  const handleSaveKkEdit = (noKk: string) => {
    const jimpitan = Number(editJimpitan) || 0;
    const uangMeja = Number(editUangMeja) || 0;
    const tabungan = Number(editTabungan) || 0;
    const tagihanPeriodeSebelum = Number(editTagihanPeriodeSebelum) || 0;
    const totalTarif =
      (editIkutJimpitan ? jimpitan : 0) +
      (editIkutUangMeja ? uangMeja : 0) +
      (editIkutTabungan ? tabungan : 0);

    setDraftList((prev) =>
      prev.map((item) => {
        if (item.noKk !== noKk) return item;
        return {
          ...item,
          jimpitan,
          uangMeja,
          tabungan,
          ikutJimpitan: editIkutJimpitan,
          ikutUangMeja: editIkutUangMeja,
          ikutTabungan: editIkutTabungan,
          tagihanPeriodeSebelum,
          bulanDitutup: editBulanDitutup,
          totalTarif,
          catatan: editCatatan
        };
      })
    );

    setModifiedNoKks((prev) => new Set(prev).add(noKk));
    setEditingTarifKk(null);
  };

  // ----------------------------------------------------
  // HANDLERS: TAMBAH TARIF WARGA BARU
  // ----------------------------------------------------
  const handleOpenAdd = () => {
    setEditingTarifKk(null);
    setAddErrorMessage(null);

    // Auto-select first citizen from wargaList that doesn't have tariff yet
    const unconfigured = uniqueWargaFamilies.find((f) => !existingNoKkSet.has(f.noKk));
    if (unconfigured) {
      setAddSourceMode('from_warga');
      setAddSelectedWargaKk(unconfigured.noKk);
      setAddNoKk(unconfigured.noKk);
      setAddNamaKepala(unconfigured.namaKepala);
    } else {
      setAddSourceMode('manual');
      setAddSelectedWargaKk('');
      setAddNoKk('');
      setAddNamaKepala('');
    }

    setAddJimpitan(15000);
    setAddUangMeja(10000);
    setAddTabungan(0);
    setAddIkutJimpitan(true);
    setAddIkutUangMeja(true);
    setAddIkutTabungan(true);
    setAddTagihanPeriodeSebelum(0);
    setAddBulanDitutup([]);
    setAddCatatan('');
    setIsAddingNewTarif(true);
  };

  const handleSelectWargaInAdd = (noKkSelected: string) => {
    setAddSelectedWargaKk(noKkSelected);
    setAddErrorMessage(null);
    const found = uniqueWargaFamilies.find((f) => f.noKk === noKkSelected);
    if (found) {
      setAddNoKk(found.noKk);
      setAddNamaKepala(found.namaKepala);
    }
  };

  const handleSaveAdd = () => {
    setAddErrorMessage(null);
    const cleanNoKk = addNoKk.trim();
    const cleanNama = addNamaKepala.trim();

    if (!cleanNoKk) {
      setAddErrorMessage('Nomor Kartu Keluarga (KK) wajib diisi.');
      return;
    }
    if (!cleanNama) {
      setAddErrorMessage('Nama Kepala Keluarga / Warga wajib diisi.');
      return;
    }

    // Check duplicate No. KK
    if (existingNoKkSet.has(cleanNoKk)) {
      setAddErrorMessage(`Nomor KK "${cleanNoKk}" sudah terdaftar dalam tarif. Silakan ubah data yang sudah ada.`);
      return;
    }

    const jimpitan = Number(addJimpitan) || 0;
    const uangMeja = Number(addUangMeja) || 0;
    const tabungan = Number(addTabungan) || 0;
    const tagihanPeriodeSebelum = Number(addTagihanPeriodeSebelum) || 0;
    const totalTarif =
      (addIkutJimpitan ? jimpitan : 0) +
      (addIkutUangMeja ? uangMeja : 0) +
      (addIkutTabungan ? tabungan : 0);

    const newItem: TarifWargaKK = {
      noKk: cleanNoKk,
      namaKepala: cleanNama,
      jimpitan,
      uangMeja,
      tabungan,
      ikutJimpitan: addIkutJimpitan,
      ikutUangMeja: addIkutUangMeja,
      ikutTabungan: addIkutTabungan,
      tagihanPeriodeSebelum,
      bulanDitutup: addBulanDitutup,
      totalTarif,
      catatan: addCatatan.trim() || undefined
    };

    // Prepend new item to draft list
    setDraftList((prev) => [newItem, ...prev]);
    setNewNoKks((prev) => new Set(prev).add(cleanNoKk));
    setModifiedNoKks((prev) => new Set(prev).add(cleanNoKk));

    setIsAddingNewTarif(false);
    setLastDeletedItem(null);
  };

  // ----------------------------------------------------
  // HANDLERS: HAPUS TARIF WARGA
  // ----------------------------------------------------
  const handlePromptDelete = (item: TarifWargaKK) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    const targetKk = deletingItem.noKk;

    // Record for undo or cancellation
    setDeletedItemsHistory((prev) => [...prev, deletingItem]);
    setLastDeletedItem(deletingItem);

    // Remove from draftList
    setDraftList((prev) => prev.filter((t) => t.noKk !== targetKk));

    // Cleanup states
    if (editingTarifKk === targetKk) {
      setEditingTarifKk(null);
    }
    setModifiedNoKks((prev) => new Set(prev).add(targetKk));
    setNewNoKks((prev) => {
      const next = new Set(prev);
      next.delete(targetKk);
      return next;
    });

    setDeletingItem(null);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedItem) return;
    setDraftList((prev) => [lastDeletedItem, ...prev]);
    setDeletedItemsHistory((prev) => prev.filter((t) => t.noKk !== lastDeletedItem.noKk));
    setLastDeletedItem(null);
  };

  // ----------------------------------------------------
  // QUICK PRESETS
  // ----------------------------------------------------
  const handleSetAllTabunganZero = () => {
    setDraftList((prev) =>
      prev.map((t) => ({
        ...t,
        tabungan: 0,
        ikutTabungan: true,
        totalTarif:
          (t.ikutJimpitan ? t.jimpitan : 0) +
          (t.ikutUangMeja ? t.uangMeja : 0),
        catatan: t.catatan ? t.catatan.replace(/Tabungan[^\)]*/, 'Tabungan Rp 0') : 'Tabungan Rp 0'
      }))
    );
    setModifiedNoKks(new Set(draftList.map((t) => t.noKk)));
  };

  // ----------------------------------------------------
  // COMMIT SAVE ALL & CANCEL
  // ----------------------------------------------------
  const handleCommitSaveAll = () => {
    let finalList = [...draftList];

    // If there's an active KK edit open when user clicks "Simpan", commit that KK too
    if (editingTarifKk) {
      const jimpitan = Number(editJimpitan) || 0;
      const uangMeja = Number(editUangMeja) || 0;
      const tabungan = Number(editTabungan) || 0;
      const tagihanPeriodeSebelum = Number(editTagihanPeriodeSebelum) || 0;
      const totalTarif =
        (editIkutJimpitan ? jimpitan : 0) +
        (editIkutUangMeja ? uangMeja : 0) +
        (editIkutTabungan ? tabungan : 0);

      finalList = finalList.map((item) => {
        if (item.noKk !== editingTarifKk) return item;
        return {
          ...item,
          jimpitan,
          uangMeja,
          tabungan,
          ikutJimpitan: editIkutJimpitan,
          ikutUangMeja: editIkutUangMeja,
          ikutTabungan: editIkutTabungan,
          tagihanPeriodeSebelum,
          bulanDitutup: editBulanDitutup,
          totalTarif,
          catatan: editCatatan
        };
      });
    }

    onSaveAll(finalList);
    if (onUpdateTarif && modifiedNoKks.size > 0) {
      finalList.forEach((t) => {
        if (modifiedNoKks.has(t.noKk)) {
          onUpdateTarif(t.noKk, t);
        }
      });
    }
    onClose();
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowCancelPrompt(true);
    } else {
      onClose();
    }
  };

  // Live total preview for active editing KK
  const activeEditingTotal = useMemo(() => {
    if (!editingTarifKk) return 0;
    return (
      (editIkutJimpitan ? Number(editJimpitan) || 0 : 0) +
      (editIkutUangMeja ? Number(editUangMeja) || 0 : 0) +
      (editIkutTabungan ? Number(editTabungan) || 0 : 0)
    );
  }, [editingTarifKk, editIkutJimpitan, editJimpitan, editIkutUangMeja, editUangMeja, editIkutTabungan, editTabungan]);

  // Live total preview for Add form
  const addFormTotal = useMemo(() => {
    return (
      (addIkutJimpitan ? Number(addJimpitan) || 0 : 0) +
      (addIkutUangMeja ? Number(addUangMeja) || 0 : 0) +
      (addIkutTabungan ? Number(addTabungan) || 0 : 0)
    );
  }, [addIkutJimpitan, addJimpitan, addIkutUangMeja, addUangMeja, addIkutTabungan, addTabungan]);

  const filteredList = useMemo(() => {
    const list = draftList.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.namaKepala.toLowerCase().includes(q) || t.noKk.includes(q);
    });

    return list.sort((a, b) => {
      const cmp = a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [draftList, searchQuery]);

  const totalPotensiBulan = useMemo(() => {
    return draftList.reduce((acc, t) => acc + (t.totalTarif || 0), 0);
  }, [draftList]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]">
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-700 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Penetapan Tarif Iuran Tiap Warga RT 02
                </h3>
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300 animate-pulse">
                    Draft Diubah (Belum Disimpan)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Tarif iuran warga berdasarkan penetapan masing-masing KK (tidak ada standar baku seragam, besaran nominal dan komponen dapat berbeda antar warga).
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-x-tarif"
            onClick={handleCancelClick}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Tutup / Batal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOOLBAR & SEARCH */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Summary, Presets & Add Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Terdaftar: <strong>{draftList.length} KK</strong> &bull; Total Potensi:{' '}
                <strong className="text-emerald-800 font-bold font-mono">
                  {formatRupiah(totalPotensiBulan)}
                </strong>
                /bln
              </div>

              {/* TOMBOL TAMBAH TARIF WARGA */}
              <button
                type="button"
                id="btn-tambah-tarif-warga"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Tetapkan Tarif Warga / KK Baru"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>+ Tetapkan Tarif Warga</span>
              </button>

              <button
                type="button"
                id="btn-set-tabungan-nol"
                onClick={handleSetAllTabunganZero}
                className="px-2.5 py-1.5 text-[11px] font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Isikan nilai 0 di kolom tabungan untuk semua warga"
              >
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                <span>Tabungan = Rp 0</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                id="search-input-tarif-warga"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Kepala Keluarga / No. KK..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* UNDO NOTIFICATION AFTER DELETION */}
          {lastDeletedItem && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-900">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Tarif untuk <strong>{lastDeletedItem.namaKepala}</strong> (KK: {lastDeletedItem.noKk}) telah dihapus dari daftar draft.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUndoDelete}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Undo2 className="w-3 h-3 text-slate-600" />
                <span>Urungkan</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL FORM: TAMBAH TARIF WARGA BARU                                      */}
          {/* ========================================================================= */}
          {isAddingNewTarif && (
            <div className="p-4 bg-emerald-50/80 border-2 border-emerald-400 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 block">
                      Tambah Pengaturan Tarif Warga Baru
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Entri Tarif &amp; Penutupan Bulan RT 02
                    </h4>
                  </div>
                </div>

                {/* Total Calculated Live Badge */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shrink-0 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-600">Total Tarif:</span>
                  <span className="text-sm font-black font-mono text-emerald-900">
                    {formatRupiah(addFormTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400">/ bulan</span>
                </div>
              </div>

              {/* Error Message if any */}
              {addErrorMessage && (
                <div className="mb-3 p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-xs text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addErrorMessage}</span>
                </div>
              )}

              {/* Source Selection Toggle */}
              <div className="bg-white p-3 rounded-lg border border-emerald-200 mb-3 space-y-3">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-slate-700">Sumber Data:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="addSourceMode"
                      value="from_warga"
                      checked={addSourceMode === 'from_warga'}
                      onChange={() => setAddSourceMode('from_warga')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">Pilih dari Data Warga RT</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="addSourceMode"
                      value="manual"
                      checked={addSourceMode === 'manual'}
                      onChange={() => setAddSourceMode('manual')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">Input Manual / KK Baru</span>
                  </label>
                </div>

                {addSourceMode === 'from_warga' ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Pilih Kepala Keluarga / No. KK dari Database Warga:
                    </label>
                    <select
                      value={addSelectedWargaKk}
                      onChange={(e) => handleSelectWargaInAdd(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:border-emerald-600 font-medium"
                    >
                      <option value="">-- Pilih Warga / Kepala Keluarga --</option>
                      {uniqueWargaFamilies.map((f) => {
                        const isAlready = existingNoKkSet.has(f.noKk);
                        return (
                          <option
                            key={f.noKk}
                            value={f.noKk}
                            disabled={isAlready}
                            className={isAlready ? 'text-slate-400 bg-slate-100' : 'text-slate-900'}
                          >
                            {f.namaKepala} - KK: {f.noKk} {isAlready ? '✓ (Sudah ada di daftar tarif)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Memilih warga akan otomatis mengisi Nomor KK dan Nama Kepala Keluarga.
                    </p>
                  </div>
                ) : null}

                {/* No KK & Nama Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nomor Kartu Keluarga (KK) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addNoKk}
                      onChange={(e) => {
                        setAddNoKk(e.target.value);
                        setAddErrorMessage(null);
                      }}
                      placeholder="Contoh: 3374062011150001"
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nama Kepala Keluarga / Warga <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addNamaKepala}
                      onChange={(e) => {
                        setAddNamaKepala(e.target.value);
                        setAddErrorMessage(null);
                      }}
                      placeholder="Contoh: Bpk. Bambang Sutrisno"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Tarif */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Jimpitan */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addIkutJimpitan}
                        onChange={(e) => setAddIkutJimpitan(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Jimpitan</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Pilihan: 15.000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      disabled={!addIkutJimpitan}
                      value={addJimpitan}
                      onChange={(e) => setAddJimpitan(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border ${
                        addIkutJimpitan
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setAddIkutJimpitan(true); setAddJimpitan(15000); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
                    >
                      15rb
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddIkutJimpitan(false); setAddJimpitan(0); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer"
                    >
                      Bebas
                    </button>
                  </div>
                </div>

                {/* Uang Meja */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addIkutUangMeja}
                        onChange={(e) => setAddIkutUangMeja(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Uang Meja</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Pilihan: 10.000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      disabled={!addIkutUangMeja}
                      value={addUangMeja}
                      onChange={(e) => setAddUangMeja(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border ${
                        addIkutUangMeja
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setAddIkutUangMeja(true); setAddUangMeja(10000); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
                    >
                      10rb
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddIkutUangMeja(false); setAddUangMeja(0); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer"
                    >
                      Bebas
                    </button>
                  </div>
                </div>

                {/* Tabungan */}
                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addIkutTabungan}
                        onChange={(e) => setAddIkutTabungan(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Tabungan</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Rp 0 / Sesuai Warga</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      disabled={!addIkutTabungan}
                      value={addTabungan}
                      onChange={(e) => setAddTabungan(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border ${
                        addIkutTabungan
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setAddIkutTabungan(true); setAddTabungan(0); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 cursor-pointer"
                    >
                      Rp 0
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddIkutTabungan(true); setAddTabungan(10000); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
                    >
                      10rb
                    </button>
                  </div>
                </div>
              </div>

              {/* Tagihan Tahun Sebelum & Catatan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">
                      Saldo / Tagihan Tahun Sebelum
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatRupiah(Number(addTagihanPeriodeSebelum) || 0)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={addTagihanPeriodeSebelum}
                      onChange={(e) => setAddTagihanPeriodeSebelum(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddTagihanPeriodeSebelum(0)}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 cursor-pointer"
                    >
                      Nihil (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Number(addTagihanPeriodeSebelum) || 0;
                        setAddTagihanPeriodeSebelum(-(Math.abs(cur) || 25000));
                      }}
                      className="px-2 py-1 text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-900 rounded border border-rose-300 cursor-pointer"
                    >
                      - Kurang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Number(addTagihanPeriodeSebelum) || 0;
                        setAddTagihanPeriodeSebelum(Math.abs(cur) || 25000);
                      }}
                      className="px-2 py-1 text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded border border-emerald-300 cursor-pointer"
                    >
                      + Lebih
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Nilai minus (-) untuk sisa tunggakan, nilai plus (+) untuk kelebihan bayar.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Catatan / Status Khusus Warga
                  </label>
                  <input
                    type="text"
                    value={addCatatan}
                    onChange={(e) => setAddCatatan(e.target.value)}
                    placeholder="Contoh: Warga baru pindahan bulan Mei, Tabungan Rp 0, dll."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-emerald-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Catatan akan dicantumkan pada kuitansi dan rekapitulasi iuran warga.
                  </p>
                </div>
              </div>

              {/* Penutupan Kolom Bulan */}
              <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tutup Kolom Bulan (Warga belum wajib iuran dari awal tahun)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {addBulanDitutup.length > 0
                      ? `${addBulanDitutup.length} bulan ditutup`
                      : 'Semua 12 bulan aktif'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BULAN_LIST.map((b) => {
                    const isClosed = addBulanDitutup.includes(b.key);
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => {
                          if (isClosed) {
                            setAddBulanDitutup((prev) => prev.filter((k) => k !== b.key));
                          } else {
                            setAddBulanDitutup((prev) => [...prev, b.key]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isClosed
                            ? 'bg-slate-300 text-slate-800 border-slate-400 shadow-2xs'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {b.short}: {isClosed ? 'TUTUP' : 'Aktif'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons for Add Form */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/80">
                <button
                  type="button"
                  id="btn-batal-tambah-warga"
                  onClick={() => setIsAddingNewTarif(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  id="btn-simpan-tambah-warga"
                  onClick={handleSaveAdd}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tambahkan ke Daftar</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL FORM: EDIT TARIF KK AKTIF                                           */}
          {/* ========================================================================= */}
          {editingTarifKk && activeEditingItem && (
            <div className="p-4 bg-orange-50/70 border-2 border-orange-300 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-orange-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    <Edit2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-900 block">
                      Mengubah Tarif Iuran Warga:
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {activeEditingItem.namaKepala}{' '}
                      <span className="font-mono text-xs font-normal text-slate-600">
                        (No. KK: {activeEditingItem.noKk})
                      </span>
                    </h4>
                  </div>
                </div>

                {/* Total Calculated Live Badge */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-orange-300 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-600">Total Tarif:</span>
                  <span className="text-sm font-black font-mono text-orange-950">
                    {formatRupiah(activeEditingTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400">/ bulan</span>
                </div>
              </div>

              {/* Rincian Komponen Tarif */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Jimpitan */}
                <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIkutJimpitan}
                        onChange={(e) => setEditIkutJimpitan(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>Jimpitan</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Pilihan: 15.000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      disabled={!editIkutJimpitan}
                      value={editJimpitan}
                      onChange={(e) => setEditJimpitan(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border ${
                        editIkutJimpitan
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-orange-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditIkutJimpitan(true); setEditJimpitan(15000); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-800 rounded border border-orange-200 cursor-pointer"
                    >
                      15rb
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditIkutJimpitan(false); setEditJimpitan(0); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer"
                    >
                      Bebas
                    </button>
                  </div>
                </div>

                {/* Uang Meja */}
                <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIkutUangMeja}
                        onChange={(e) => setEditIkutUangMeja(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>Uang Meja</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Pilihan: 10.000</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      disabled={!editIkutUangMeja}
                      value={editUangMeja}
                      onChange={(e) => setEditUangMeja(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border ${
                        editIkutUangMeja
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-orange-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditIkutUangMeja(true); setEditUangMeja(10000); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-800 rounded border border-orange-200 cursor-pointer"
                    >
                      10rb
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditIkutUangMeja(false); setEditUangMeja(0); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer"
                    >
                      Bebas
                    </button>
                  </div>
                </div>

                {/* Tabungan */}
                <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIkutTabungan}
                        onChange={(e) => setEditIkutTabungan(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>Tabungan</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Rp 0 / Sesuai Warga</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      disabled={!editIkutTabungan}
                      value={editTabungan}
                      onChange={(e) => setEditTabungan(e.target.value)}
                      className={`w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border ${
                        editIkutTabungan
                          ? 'border-slate-300 bg-white text-slate-900 focus:border-orange-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setEditIkutTabungan(true); setEditTabungan(0); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 cursor-pointer"
                    >
                      Rp 0
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditIkutTabungan(true); setEditTabungan(10000); }}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
                    >
                      10rb
                    </button>
                  </div>
                </div>
              </div>

              {/* Tagihan Tahun Sebelum & Catatan Khusus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">
                      Saldo / Tagihan Tahun Sebelum
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatRupiah(Number(editTagihanPeriodeSebelum) || 0)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={editTagihanPeriodeSebelum}
                      onChange={(e) => setEditTagihanPeriodeSebelum(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 outline-none focus:border-orange-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditTagihanPeriodeSebelum(0)}
                      className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 cursor-pointer"
                    >
                      Nihil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Number(editTagihanPeriodeSebelum) || 0;
                        setEditTagihanPeriodeSebelum(-(Math.abs(cur) || 25000));
                      }}
                      className="px-2 py-1.5 text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-lg cursor-pointer"
                      title="Setel Nilai Minus (Kurang Bayar)"
                    >
                      - Kurang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Number(editTagihanPeriodeSebelum) || 0;
                        setEditTagihanPeriodeSebelum(Math.abs(cur) || 25000);
                      }}
                      className="px-2 py-1.5 text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg cursor-pointer"
                      title="Setel Nilai Plus (Lebih Bayar)"
                    >
                      + Lebih
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Gunakan tanda minus (-) jika warga memiliki tunggakan dari tahun/periode lalu.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Catatan / Status Khusus Warga
                  </label>
                  <input
                    type="text"
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    placeholder="Contoh: Tabungan Rp 0, Warga Pindahan baru Mei, dll."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-orange-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Catatan ini akan tampil pada kuitansi dan rekapitulasi iuran warga.
                  </p>
                </div>
              </div>

              {/* Penutupan Kolom Bulan */}
              <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tutup Kolom Bulan (Warga belum wajib iuran dari awal tahun)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {editBulanDitutup.length > 0
                      ? `${editBulanDitutup.length} bulan ditutup (bebas tagihan)`
                      : 'Semua 12 bulan aktif'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BULAN_LIST.map((b) => {
                    const isClosed = editBulanDitutup.includes(b.key);
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => {
                          if (isClosed) {
                            setEditBulanDitutup((prev) => prev.filter((k) => k !== b.key));
                          } else {
                            setEditBulanDitutup((prev) => [...prev, b.key]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isClosed
                            ? 'bg-slate-300 text-slate-800 border-slate-400 shadow-2xs'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {b.short}: {isClosed ? 'TUTUP' : 'Aktif'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS FOR CITIZEN EDIT FORM */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-orange-200/80">
                <button
                  type="button"
                  id="btn-batal-edit-kk"
                  onClick={handleCancelKkEdit}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal Edit Warga Ini</span>
                </button>
                <button
                  type="button"
                  id="btn-simpan-edit-kk"
                  onClick={() => handleSaveKkEdit(activeEditingItem.noKk)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-orange-700 hover:bg-orange-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan ke Daftar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TABLE OF KK TARIFFS */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 sticky top-0 text-slate-700 text-[11px] font-bold border-b border-slate-200 z-10">
                <tr>
                  <th className="p-2.5 text-center w-10">No</th>
                  <th className="p-2.5 min-w-[180px]">Kepala Keluarga &amp; KK</th>
                  <th className="p-2.5 text-center min-w-[95px]">Jimpitan</th>
                  <th className="p-2.5 text-center min-w-[95px]">Uang Meja</th>
                  <th className="p-2.5 text-center min-w-[95px]">Tabungan</th>
                  <th className="p-2.5 text-center min-w-[110px] bg-amber-50 text-amber-950 font-bold border-x border-amber-200" title="Tagihan Tahun Sebelum">
                    <div>Tagihan Thn Sblm</div>
                    <div className="text-[8px] font-normal text-amber-800">&lt;0 Kurang, &gt;0 Lebih</div>
                  </th>
                  <th className="p-2.5 text-right min-w-[105px]">Total / Bulan</th>
                  <th className="p-2.5 text-center min-w-[130px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                      Tidak ada data warga yang cocok dengan pencarian "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredList.map((t, idx) => {
                    const isBeingEdited = editingTarifKk === t.noKk;
                    const isModified = modifiedNoKks.has(t.noKk);
                    const isNewlyAdded = newNoKks.has(t.noKk);

                    return (
                      <tr
                        key={t.noKk}
                        className={`transition-colors ${
                          isBeingEdited
                            ? 'bg-orange-100/60 font-medium'
                            : isNewlyAdded
                            ? 'bg-emerald-50/70 hover:bg-emerald-50'
                            : isModified
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{t.namaKepala}</span>
                            {isNewlyAdded && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-950 text-[9px] font-extrabold uppercase">
                                Baru
                              </span>
                            )}
                            {isModified && !isNewlyAdded && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-extrabold uppercase">
                                Diubah
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">KK: {t.noKk}</div>
                          {t.catatan && (
                            <div className="text-[10px] text-orange-800 italic mt-0.5">
                              {t.catatan}
                            </div>
                          )}
                          {t.bulanDitutup && t.bulanDitutup.length > 0 && (
                            <div className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                              {t.bulanDitutup.length} Bulan Ditutup
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {t.ikutJimpitan ? (
                            <span className="font-semibold text-slate-800 font-mono">
                              Rp {t.jimpitan.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {t.ikutUangMeja ? (
                            <span className="font-semibold text-slate-800 font-mono">
                              Rp {t.uangMeja.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`font-semibold font-mono ${t.tabungan > 0 ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>
                            Rp {(t.tabungan || 0).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-2.5 text-center bg-amber-50/40 border-x border-amber-100">
                          {(t.tagihanPeriodeSebelum ?? 0) === 0 ? (
                            <span className="text-slate-300 font-mono">-</span>
                          ) : (t.tagihanPeriodeSebelum ?? 0) < 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold font-mono text-[11px] text-rose-950 bg-rose-100/90 px-1.5 py-0.5 rounded border border-rose-300">
                                -{formatRupiah(Math.abs(t.tagihanPeriodeSebelum!))}
                              </span>
                              <span className="text-[7.5px] text-rose-700 font-bold">Kurang Bayar</span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold font-mono text-[11px] text-emerald-950 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                +{formatRupiah(t.tagihanPeriodeSebelum!)}
                              </span>
                              <span className="text-[7.5px] text-emerald-700 font-bold">Lebih Bayar</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-bold font-mono text-slate-900">
                          {formatRupiah(t.totalTarif)}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* TOMBOL UBAH */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="px-2.5 py-1 text-[11px] font-bold text-orange-950 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="Ubah tarif dan pengaturan KK ini"
                            >
                              <Edit2 className="w-3 h-3 text-orange-700" />
                              <span>Ubah</span>
                            </button>

                            {/* TOMBOL HAPUS */}
                            <button
                              type="button"
                              onClick={() => handlePromptDelete(t)}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title={`Hapus tarif iuran untuk ${t.namaKepala}`}
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Hapus</span>
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
        </div>

        {/* MODAL FOOTER - HAS "BATAL" AND "SIMPAN" BUTTONS */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 rounded-b-2xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status message */}
          <div className="text-xs text-slate-600">
            {hasUnsavedChanges ? (
              <span className="text-amber-900 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Terdapat perubahan draft ({modifiedNoKks.size} KK diubah/ditambah, {deletedItemsHistory.length} dihapus). Klik <strong>Simpan Pengaturan</strong> untuk menyimpan permanen, atau <strong>Batal</strong> untuk membatalkan.
                </span>
              </span>
            ) : (
              <span className="text-slate-500">
                Pengaturan tarif berlaku otomatis pada buku pencatatan kas &amp; kartu iuran berikutnya.
              </span>
            )}
          </div>

          {/* Action Buttons: Batal & Simpan */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* TOMBOL BATAL */}
            <button
              type="button"
              id="btn-batal-atur-tarif"
              onClick={handleCancelClick}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:border-slate-400"
              title="Batalkan semua perubahan dan tutup form"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Batal</span>
            </button>

            {/* TOMBOL SIMPAN */}
            <button
              type="button"
              id="btn-simpan-atur-tarif"
              onClick={handleCommitSaveAll}
              className="px-5 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-700/20 hover:shadow-lg"
              title="Simpan semua pengaturan tarif warga"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION PROMPT: HAPUS TARIF WARGA */}
      {deletingItem && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3.5">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Hapus Tarif Iuran Warga?
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 my-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Warga:</span>
                <strong className="text-slate-900">{deletingItem.namaKepala}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor KK:</span>
                <span className="font-mono text-slate-700">{deletingItem.noKk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif Iuran:</span>
                <strong className="text-emerald-800 font-mono">{formatRupiah(deletingItem.totalTarif)}/bln</strong>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Data tarif untuk warga ini akan dihapus dari daftar. Perubahan akan berlaku permanen saat Anda menekan tombol <strong>Simpan Pengaturan</strong> di bawah.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Tarif Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION PROMPT WHEN CANCELING WITH UNSAVED CHANGES */}
      {showCancelPrompt && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Batalkan Perubahan Tarif?
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Anda memiliki perubahan tarif yang belum disimpan. Seluruh perubahan draft (penambahan, perubahan, atau penghapusan) akan dibatalkan jika Anda keluar.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Lanjut Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelPrompt(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors cursor-pointer"
              >
                Ya, Batalkan &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
