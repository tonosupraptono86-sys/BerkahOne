import React, { useState, useMemo } from 'react';
import { PembayaranIuran, KategoriIuran, RincianIuran } from '../../types';
import { X, CheckCircle2, AlertCircle, Edit2, Coins, Wallet, PiggyBank } from 'lucide-react';

interface KoreksiIuranModalProps {
  item: PembayaranIuran;
  onClose: () => void;
  onSave: (id: string, updatedData: Partial<PembayaranIuran>) => void;
}

const BULAN_NAMES = [
  { key: 'periode-sebelum', label: 'Tagihan Tahun Sebelum', isLibur: false, isPeriodeSebelum: true },
  { key: '2026-01', label: 'Januari 2026', isLibur: false },
  { key: '2026-02', label: 'Februari 2026', isLibur: false },
  { key: '2026-03', label: 'Maret 2026', isLibur: true },
  { key: '2026-04', label: 'April 2026', isLibur: false },
  { key: '2026-05', label: 'Mei 2026', isLibur: false },
  { key: '2026-06', label: 'Juni 2026', isLibur: false },
  { key: '2026-07', label: 'Juli 2026', isLibur: false },
  { key: '2026-08', label: 'Agustus 2026', isLibur: false },
  { key: '2026-09', label: 'September 2026', isLibur: false },
  { key: '2026-10', label: 'Oktober 2026', isLibur: false },
  { key: '2026-11', label: 'November 2026', isLibur: false },
  { key: '2026-12', label: 'Desember 2026', isLibur: false }
];

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const KoreksiIuranModal: React.FC<KoreksiIuranModalProps> = ({
  item,
  onClose,
  onSave
}) => {
  const [bulan, setBulan] = useState(item.bulan);
  const [tanggalBayar, setTanggalBayar] = useState(item.tanggalBayar);

  const initialRincian = item.rincian || {
    jimpitan: 15000,
    uangMeja: 10000,
    tabungan: 0
  };

  const [jimpitan, setJimpitan] = useState<number | string>(initialRincian.jimpitan);
  const [uangMeja, setUangMeja] = useState<number | string>(initialRincian.uangMeja);
  const [tabungan, setTabungan] = useState<number | string>(initialRincian.tabungan);

  const [ikutJimpitan, setIkutJimpitan] = useState<boolean>(initialRincian.jimpitan > 0);
  const [ikutUangMeja, setIkutUangMeja] = useState<boolean>(initialRincian.uangMeja > 0);
  const [ikutTabungan, setIkutTabungan] = useState<boolean>(initialRincian.tabungan > 0);

  const [metode, setMetode] = useState(item.metode);
  const [penerima, setPenerima] = useState(item.penerima);
  // Catatan koreksi dikosongkan secara default sesuai instruksi pengguna
  const [catatan, setCatatan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const computedTotal = useMemo(() => {
    const j = ikutJimpitan ? (Number(jimpitan) || 0) : 0;
    const m = ikutUangMeja ? (Number(uangMeja) || 0) : 0;
    const t = ikutTabungan ? (Number(tabungan) || 0) : 0;
    return j + m + t;
  }, [ikutJimpitan, jimpitan, ikutUangMeja, uangMeja, ikutTabungan, tabungan]);

  const computedKategori: KategoriIuran = useMemo(() => {
    if (ikutJimpitan && ikutUangMeja && ikutTabungan) return 'Gabungan (Jimpitan, Uang Meja, Tabungan)';
    if (ikutJimpitan && ikutUangMeja && !ikutTabungan) return 'Jimpitan & Uang Meja';
    if (ikutJimpitan && !ikutUangMeja && ikutTabungan) return 'Jimpitan & Tabungan';
    if (!ikutJimpitan && ikutUangMeja && ikutTabungan) return 'Uang Meja & Tabungan';
    if (ikutJimpitan && !ikutUangMeja && !ikutTabungan) return 'Jimpitan';
    if (!ikutJimpitan && ikutUangMeja && !ikutTabungan) return 'Uang Meja';
    if (!ikutJimpitan && !ikutUangMeja && ikutTabungan) return 'Tabungan';
    return 'Iuran Kustom Warga';
  }, [ikutJimpitan, ikutUangMeja, ikutTabungan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Nilai jimpitan, uang meja dan tabungan bisa kosong tidak ada validasi minimal nominal
    const rincianUpdated: RincianIuran = {
      jimpitan: ikutJimpitan ? (Number(jimpitan) || 0) : 0,
      uangMeja: ikutUangMeja ? (Number(uangMeja) || 0) : 0,
      tabungan: ikutTabungan ? (Number(tabungan) || 0) : 0
    };

    onSave(item.id, {
      bulan,
      tanggalBayar,
      nominal: computedTotal,
      kategoriIuran: computedKategori,
      rincian: rincianUpdated,
      metode,
      penerima,
      catatan: catatan.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <Edit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Koreksi Pembayaran Iuran Warga
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                No. Kuitansi: {item.noKwitansi}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identitas Warga */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm">{item.namaWarga}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">No. KK: {item.noKk}</div>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
              Mode Koreksi
            </span>
          </div>

          {/* Periode Bulan & Tanggal Bayar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periode Bulan Iuran *
              </label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium cursor-pointer"
                required
              >
                {BULAN_NAMES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label} {b.isLibur ? '(Libur Iuran)' : ''}
                  </option>
                ))}
              </select>
              {bulan === '2026-03' && (
                <p className="mt-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-1">
                  ⚠️ Bulan Maret 2026 telah ditetapkan sebagai <strong>Bulan Libur Iuran RT</strong>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Koreksi Rincian 3 Komponen */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900">
                Koreksi Komponen Iuran (Jimpitan, Uang Meja, Tabungan) *
              </label>
              <span className="text-[10px] text-slate-500">
                Kategori: <strong className="text-slate-800">{computedKategori}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Jimpitan */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  ikutJimpitan ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="koreksiJimpitan"
                      checked={ikutJimpitan}
                      onChange={(e) => setIkutJimpitan(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="koreksiJimpitan" className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600" /> Jimpitan
                    </label>
                  </div>
                  <span className="text-[9px] text-amber-800 bg-amber-100 px-1 py-0.2 rounded font-semibold">
                    15rb
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[11px] font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    disabled={!ikutJimpitan}
                    value={jimpitan}
                    onChange={(e) => setJimpitan(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-amber-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Uang Meja */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  ikutUangMeja ? 'bg-blue-50/60 border-blue-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="koreksiUangMeja"
                      checked={ikutUangMeja}
                      onChange={(e) => setIkutUangMeja(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="koreksiUangMeja" className="text-xs font-bold text-blue-950 cursor-pointer flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-blue-600" /> Uang Meja
                    </label>
                  </div>
                  <span className="text-[9px] text-blue-800 bg-blue-100 px-1 py-0.2 rounded font-semibold">
                    10rb
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[11px] font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    disabled={!ikutUangMeja}
                    value={uangMeja}
                    onChange={(e) => setUangMeja(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Tabungan */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  ikutTabungan ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="koreksiTabungan"
                      checked={ikutTabungan}
                      onChange={(e) => setIkutTabungan(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer"
                    />
                    <label htmlFor="koreksiTabungan" className="text-xs font-bold text-emerald-950 cursor-pointer flex items-center gap-1">
                      <PiggyBank className="w-3 h-3 text-emerald-600" /> Tabungan
                    </label>
                  </div>
                  <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-semibold">
                    20rb
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[11px] font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    disabled={!ikutTabungan}
                    value={tabungan}
                    onChange={(e) => setTabungan(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Total Display */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-700">
                Total Nominal Terkoreksi:
              </div>
              <div className="text-base font-extrabold text-emerald-800">
                {formatRupiah(computedTotal)}
              </div>
            </div>
          </div>

          {/* Metode Bayar & Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium cursor-pointer"
              >
                <option value="Tunai">Tunai (Cash)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS RT 02">QRIS RT 02 RW 14</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Penerima *
              </label>
              <input
                type="text"
                value={penerima}
                onChange={(e) => setPenerima(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Catatan Koreksi (Dikosongkan)
              </label>
              {catatan && (
                <button
                  type="button"
                  onClick={() => setCatatan('')}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline"
                >
                  Kosongkan Catatan
                </button>
              )}
            </div>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan koreksi (kosongkan jika tidak diperlukan)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
            * Menyimpan koreksi akan otomatis memperbarui catatan di Kas Besar RT dan kuitansi pembayaran warga.
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan Koreksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
