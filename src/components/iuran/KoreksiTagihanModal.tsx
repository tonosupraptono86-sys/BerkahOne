import React, { useState, useMemo } from 'react';
import { TarifWargaKK } from '../../types';
import { formatRupiah } from './KwitansiModal';
import {
  X,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Coins,
  Settings,
  Calendar,
  Save,
  Check,
  Building2,
  Info,
  Clock,
  Wallet,
  Copy
} from 'lucide-react';

export interface KoreksiTagihanModalProps {
  isOpen: boolean;
  onClose: () => void;
  kk: { noKk: string; namaKepala: string } | null;
  monthKey: string;
  monthLabel: string;
  kkTarif?: TarifWargaKK;
  initialTab?: 'tagihan' | 'sebelum';
  onSaveKoreksi: (noKk: string, monthKey: string, newNominal: number | null) => void;
  onDeleteTagihan: (noKk: string, monthKey: string) => void;
  onSaveTagihanSebelum?: (noKk: string, newNominal: number) => void;
  onDeleteTagihanSebelum?: (noKk: string) => void;
  onUpdatePenetapan?: (noKk: string, updated: Partial<TarifWargaKK>) => void;
}

export const KoreksiTagihanModal: React.FC<KoreksiTagihanModalProps> = ({
  isOpen,
  onClose,
  kk,
  monthKey,
  monthLabel,
  kkTarif,
  initialTab = 'tagihan',
  onSaveKoreksi,
  onDeleteTagihan,
  onSaveTagihanSebelum,
  onDeleteTagihanSebelum,
  onUpdatePenetapan
}) => {
  if (!isOpen || !kk) return null;

  // Active Tab: 'tagihan' (Nilai Tagihan Warga Bulanan) atau 'sebelum' (Tagihan Tahun Sebelum)
  const [activeTab, setActiveTab] = useState<'tagihan' | 'sebelum'>(initialTab);

  // Nilai penetapan standar KK sesuai Penetapan Tarif Iuran Warga
  const penetapanJimpitan = kkTarif?.ikutJimpitan !== false ? (kkTarif?.jimpitan ?? 15000) : 0;
  const penetapanUangMeja = kkTarif?.ikutUangMeja !== false ? (kkTarif?.uangMeja ?? 10000) : 0;
  const penetapanTabungan = kkTarif?.ikutTabungan ? (kkTarif?.tabungan ?? 0) : 0;
  const totalPenetapan = penetapanJimpitan + penetapanUangMeja + penetapanTabungan;
  const tarifPenetapanKK = kkTarif?.totalTarif ?? (totalPenetapan || 25000);

  // Koreksi yang saat ini tersimpan untuk bulan target
  const currentKoreksi = kkTarif?.koreksiTagihanBulan?.[monthKey];
  const isCurrentlyDeleted = currentKoreksi === 0;
  const hasKoreksi = currentKoreksi !== undefined && currentKoreksi !== null;

  // Tagihan Tahun Sebelum saat ini
  const rawTagihanSebelum = kkTarif?.tagihanPeriodeSebelum ?? 0;

  // State form Tab 1 (Tagihan Bulanan)
  const [nominalInput, setNominalInput] = useState<string>(
    hasKoreksi ? String(currentKoreksi) : String(tarifPenetapanKK)
  );
  const [showEditPenetapan, setShowEditPenetapan] = useState(false);
  const [jimpitanInput, setJimpitanInput] = useState<number>(kkTarif?.jimpitan ?? 15000);
  const [uangMejaInput, setUangMejaInput] = useState<number>(kkTarif?.uangMeja ?? 10000);
  const [tabunganInput, setTabunganInput] = useState<number>(kkTarif?.tabungan ?? 0);
  const [ikutJimpitanInput, setIkutJimpitanInput] = useState<boolean>(kkTarif?.ikutJimpitan ?? true);
  const [ikutUangMejaInput, setIkutUangMejaInput] = useState<boolean>(kkTarif?.ikutUangMeja ?? true);
  const [ikutTabunganInput, setIkutTabunganInput] = useState<boolean>(kkTarif?.ikutTabungan ?? false);

  // State form Tab 2 (Tagihan Tahun Sebelum)
  const [sebelumType, setSebelumType] = useState<'kurang' | 'lebih' | 'lunas'>(
    rawTagihanSebelum < 0 ? 'kurang' : rawTagihanSebelum > 0 ? 'lebih' : 'lunas'
  );
  const [sebelumNominalInput, setSebelumNominalInput] = useState<string>(
    String(Math.abs(rawTagihanSebelum))
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDeleteTagihan, setConfirmDeleteTagihan] = useState<boolean>(false);
  const [confirmDeleteSebelum, setConfirmDeleteSebelum] = useState<boolean>(false);
  const [copiedRekening, setCopiedRekening] = useState<boolean>(false);

  // Handler Simpan Tab 1: Nilai Tagihan Warga
  const handleSaveTagihan = () => {
    const val = Number(nominalInput);
    if (isNaN(val) || val < 0) {
      setErrorMessage('Mohon masukkan nominal tagihan yang valid (angka 0 atau lebih).');
      return;
    }

    // Jika diedit penetapan permanennya
    if (showEditPenetapan && onUpdatePenetapan) {
      onUpdatePenetapan(kk.noKk, {
        jimpitan: jimpitanInput,
        uangMeja: uangMejaInput,
        tabungan: tabunganInput,
        ikutJimpitan: ikutJimpitanInput,
        ikutUangMeja: ikutUangMejaInput,
        ikutTabungan: ikutTabunganInput,
        totalTarif: (ikutJimpitanInput ? jimpitanInput : 0) + (ikutUangMejaInput ? uangMejaInput : 0) + (ikutTabunganInput ? tabunganInput : 0)
      });
    }

    onSaveKoreksi(kk.noKk, monthKey, val);
    onClose();
  };

  const handleResetToPenetapan = () => {
    onSaveKoreksi(kk.noKk, monthKey, null);
    onClose();
  };

  const handleDeleteTagihan = () => {
    if (!confirmDeleteTagihan) {
      setConfirmDeleteTagihan(true);
      return;
    }
    onDeleteTagihan(kk.noKk, monthKey);
    onClose();
  };

  // Handler Simpan Tab 2: Tagihan Tahun Sebelum
  const handleSaveTagihanSebelum = () => {
    let finalVal = 0;
    if (sebelumType === 'kurang') {
      const absVal = Math.abs(Number(sebelumNominalInput) || 0);
      finalVal = -absVal;
    } else if (sebelumType === 'lebih') {
      const absVal = Math.abs(Number(sebelumNominalInput) || 0);
      finalVal = absVal;
    } else {
      finalVal = 0;
    }

    if (onSaveTagihanSebelum) {
      onSaveTagihanSebelum(kk.noKk, finalVal);
    }
    onClose();
  };

  const handleDeleteTagihanSebelum = () => {
    if (!confirmDeleteSebelum) {
      setConfirmDeleteSebelum(true);
      return;
    }
    if (onDeleteTagihanSebelum) {
      onDeleteTagihanSebelum(kk.noKk);
    } else if (onSaveTagihanSebelum) {
      onSaveTagihanSebelum(kk.noKk, 0);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-xs">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                  Modul Tagihan Iuran Warga RT 02
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                Koreksi &amp; Hapus Nilai Tagihan
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('tagihan');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'tagihan'
                ? 'bg-white text-blue-950 border-slate-200 shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Nilai Tagihan Warga ({monthLabel})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sebelum');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'sebelum'
                ? 'bg-white text-amber-950 border-slate-200 shadow-2xs -mb-px'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Tagihan Tahun Sebelum</span>
            {rawTagihanSebelum !== 0 && (
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${rawTagihanSebelum < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {rawTagihanSebelum < 0 ? 'Kurang' : 'Lebih'}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          {/* Info KK */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Warga / Kepala Keluarga</span>
              <div className="font-black text-slate-900 text-sm">{kk.namaKepala}</div>
              <div className="font-mono text-[10px] text-slate-500">No. KK: {kk.noKk}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Penetapan Iuran KK</span>
              <div className="font-black text-emerald-800 font-mono text-xs">
                {formatRupiah(tarifPenetapanKK)} / bln
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Tagihan Thn Sblm:{' '}
                <strong className={rawTagihanSebelum < 0 ? 'text-rose-700' : rawTagihanSebelum > 0 ? 'text-emerald-700' : 'text-slate-600'}>
                  {rawTagihanSebelum === 0 ? 'Rp 0 (Lunas)' : (rawTagihanSebelum < 0 ? '-' : '+') + formatRupiah(Math.abs(rawTagihanSebelum))}
                </strong>
              </div>
            </div>
          </div>

          {/* TAB 1: NILAI TAGIHAN WARGA BULANAN */}
          {activeTab === 'tagihan' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Rincian Penetapan Iuran Warga */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Penetapan Tarif Iuran Warga KK:</span>
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-900">
                    {formatRupiah(tarifPenetapanKK)} / bln
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-emerald-200/80">
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 block">Jimpitan:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {kkTarif?.ikutJimpitan !== false ? formatRupiah(kkTarif?.jimpitan ?? 15000) : 'Rp 0 (Nonaktif)'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 block">Uang Meja:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {kkTarif?.ikutUangMeja !== false ? formatRupiah(kkTarif?.uangMeja ?? 10000) : 'Rp 0 (Nonaktif)'}
                    </span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                    <span className="text-slate-500 block">Tabungan:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {kkTarif?.ikutTabungan && (kkTarif?.tabungan ?? 0) > 0 ? formatRupiah(kkTarif?.tabungan ?? 0) : 'Rp 0'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-emerald-800">
                    Besaran tagihan otomatis disesuaikan dengan Penetapan Tarif Iuran Warga di atas.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEditPenetapan(!showEditPenetapan)}
                    className="text-[10px] font-bold text-emerald-900 hover:text-emerald-700 underline cursor-pointer"
                  >
                    {showEditPenetapan ? 'Sembunyikan Ubah Penetapan' : 'Ubah Komponen Penetapan KK'}
                  </button>
                </div>
              </div>

              {/* Form Ubah Komponen Penetapan KK (Opsional Expandable) */}
              {showEditPenetapan && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs animate-in slide-in-from-top-2 duration-150">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-amber-700" />
                    <span>Ubah Penetapan Tarif Iuran KK Secara Permanen:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={ikutJimpitanInput}
                          onChange={(e) => setIkutJimpitanInput(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>Jimpitan</span>
                      </label>
                      <input
                        type="number"
                        value={jimpitanInput}
                        onChange={(e) => setJimpitanInput(Number(e.target.value) || 0)}
                        disabled={!ikutJimpitanInput}
                        className="w-full mt-1 px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none disabled:bg-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={ikutUangMejaInput}
                          onChange={(e) => setIkutUangMejaInput(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>Uang Meja</span>
                      </label>
                      <input
                        type="number"
                        value={uangMejaInput}
                        onChange={(e) => setUangMejaInput(Number(e.target.value) || 0)}
                        disabled={!ikutUangMejaInput}
                        className="w-full mt-1 px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none disabled:bg-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={ikutTabunganInput}
                          onChange={(e) => setIkutTabunganInput(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>Tabungan</span>
                      </label>
                      <input
                        type="number"
                        value={tabunganInput}
                        onChange={(e) => setTabunganInput(Number(e.target.value) || 0)}
                        disabled={!ikutTabunganInput}
                        className="w-full mt-1 px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none disabled:bg-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Koreksi Saat Ini */}
              {hasKoreksi && (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isCurrentlyDeleted
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {isCurrentlyDeleted
                        ? `Tagihan ${monthLabel} saat ini berstatus DIHAPUS (Rp 0).`
                        : `Tagihan ${monthLabel} saat ini DIKOREKSI menjadi ${formatRupiah(currentKoreksi)}.`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToPenetapan}
                    className="px-2 py-1 rounded bg-white border font-bold text-[10px] hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset ke Penetapan</span>
                  </button>
                </div>
              )}

              {/* Input Nominal Tagihan Koreksi */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Nominal Tagihan untuk Periode {monthLabel}:</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Standar: {formatRupiah(tarifPenetapanKK)}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono text-xs">Rp</span>
                  <input
                    type="number"
                    value={nominalInput}
                    onChange={(e) => setNominalInput(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Tombol Opsi Cepat Tagihan Bulanan */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNominalInput(String(tarifPenetapanKK));
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 transition-colors cursor-pointer text-[11px]"
                >
                  Sesuai Penetapan ({formatRupiah(tarifPenetapanKK)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNominalInput('0');
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold border border-rose-200 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Hapus Tagihan (Rp 0)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TAGIHAN TAHUN SEBELUM */}
          {activeTab === 'sebelum' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Status Tagihan Tahun Sebelum Saat Ini */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                rawTagihanSebelum < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : rawTagihanSebelum > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">
                    Status Tagihan Tahun Sebelum Saat Ini:
                  </span>
                  <div className="text-base font-black font-mono mt-0.5 flex items-center gap-2">
                    <span>
                      {rawTagihanSebelum === 0
                        ? 'Rp 0 (Lunas Bersih / Nihil)'
                        : (rawTagihanSebelum < 0 ? '-' : '+') + formatRupiah(Math.abs(rawTagihanSebelum))}
                    </span>
                    <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full border bg-white/70">
                      {rawTagihanSebelum < 0 ? 'Kurang Bayar / Tunggakan' : rawTagihanSebelum > 0 ? 'Lebih Bayar / Saldo' : 'Lunas'}
                    </span>
                  </div>
                </div>

                {rawTagihanSebelum !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('lunas');
                      setSebelumNominalInput('0');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title="Nolkan Tagihan Tahun Sebelum"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Nolkan (Rp 0)</span>
                  </button>
                )}
              </div>

              {/* Pilihan Jenis Status Koreksi */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Pilih Jenis Tagihan Tahun Sebelum:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSebelumType('kurang')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      sebelumType === 'kurang'
                        ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-rose-700 font-mono text-sm">- Kurang Bayar</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Tunggakan Warga</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSebelumType('lebih')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      sebelumType === 'lebih'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-emerald-700 font-mono text-sm">+ Lebih Bayar</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Saldo Warga</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('lunas');
                      setSebelumNominalInput('0');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      sebelumType === 'lunas'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-400/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-blue-700 font-mono text-sm">Rp 0 (Lunas)</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Hapus / Nolkan</div>
                  </button>
                </div>
              </div>

              {/* Input Nominal Tagihan Tahun Sebelum */}
              {sebelumType !== 'lunas' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 flex items-center justify-between">
                    <span>
                      Nominal {sebelumType === 'kurang' ? 'Kurang Bayar / Tunggakan' : 'Lebih Bayar / Saldo'}:
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {sebelumType === 'kurang' ? 'Akan dicatat negatif (-)' : 'Akan dicatat positif (+)'}
                    </span>
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 font-bold font-mono text-xs ${sebelumType === 'kurang' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {sebelumType === 'kurang' ? '-Rp' : '+Rp'}
                    </span>
                    <input
                      type="number"
                      value={sebelumNominalInput}
                      onChange={(e) => setSebelumNominalInput(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full pl-12 pr-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Tombol Opsi Cepat Tagihan Sebelum */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">
                  Pilihan Cepat Tagihan Tahun Sebelum:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('lunas');
                      setSebelumNominalInput('0');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 transition-colors cursor-pointer text-[10.5px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Hapus / Nolkan (Rp 0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('kurang');
                      setSebelumNominalInput(String(tarifPenetapanKK));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold border border-rose-200 transition-colors cursor-pointer text-[10.5px]"
                  >
                    Tunggakan 1 Bln (-{formatRupiah(tarifPenetapanKK)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('kurang');
                      setSebelumNominalInput(String(tarifPenetapanKK * 2));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold border border-rose-200 transition-colors cursor-pointer text-[10.5px]"
                  >
                    Tunggakan 2 Bln (-{formatRupiah(tarifPenetapanKK * 2)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('kurang');
                      setSebelumNominalInput(String(tarifPenetapanKK * 3));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold border border-rose-200 transition-colors cursor-pointer text-[10.5px]"
                  >
                    Tunggakan 3 Bln (-{formatRupiah(tarifPenetapanKK * 3)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSebelumType('lebih');
                      setSebelumNominalInput(String(tarifPenetapanKK));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 transition-colors cursor-pointer text-[10.5px]"
                  >
                    Lebih Bayar (+{formatRupiah(tarifPenetapanKK)})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Keterangan Transfer Bank Mandiri */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-800 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                BM
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-blue-700 font-bold block">
                  Keterangan Rekening Pembayaran Warga:
                </span>
                <span className="font-bold text-blue-950 font-mono text-xs">
                  Transfer Bank melalui Mandiri Nomer Rekening 1350015984766 an Misbahudin
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText('1350015984766');
                  setCopiedRekening(true);
                  setTimeout(() => setCopiedRekening(false), 2500);
                } catch {
                  setCopiedRekening(true);
                  setTimeout(() => setCopiedRekening(false), 2500);
                }
              }}
              className="px-2 py-1 text-[10px] font-bold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              {copiedRekening ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedRekening ? 'Tersalin!' : 'Salin Rek'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {activeTab === 'tagihan' ? (
            confirmDeleteTagihan ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-700">Yakin hapus tagihan (Rp 0)?</span>
                <button
                  type="button"
                  onClick={handleDeleteTagihan}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTagihan(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDeleteTagihan}
                className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title="Hapus / Nolkan tagihan periode ini"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Tagihan (Rp 0)</span>
              </button>
            )
          ) : (
            confirmDeleteSebelum ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-700">Yakin hapus tagihan tahun sebelum (Rp 0)?</span>
                <button
                  type="button"
                  onClick={handleDeleteTagihanSebelum}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSebelum(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDeleteTagihanSebelum}
                className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title="Hapus / Nolkan tagihan tahun sebelum (Rp 0)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Tagihan Sblm (Rp 0)</span>
              </button>
            )
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            {activeTab === 'tagihan' ? (
              <button
                type="button"
                onClick={handleSaveTagihan}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Nilai Tagihan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveTagihanSebelum}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Tagihan Thn Sblm</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
