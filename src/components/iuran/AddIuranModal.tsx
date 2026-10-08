import React, { useState, useMemo, useEffect } from 'react';
import { TarifWargaKK, PembayaranIuran, KategoriIuran, RincianIuran } from '../../types';
import { generateQRCodeWithBerkahOneLogo } from '../../utils/qrCodeGenerator';
import { X, CheckCircle2, AlertCircle, PlusCircle, Coins, Wallet, PiggyBank, Settings, QrCode, Copy, Check } from 'lucide-react';

interface AddIuranModalProps {
  kkList: { noKk: string; namaKepala: string; alamat: string }[];
  tarifWargaList: TarifWargaKK[];
  getTarifByKK: (noKk: string) => TarifWargaKK | undefined;
  onClose: () => void;
  onSuccess: (data: Omit<PembayaranIuran, 'id' | 'createdAt'>, syncToKas?: boolean) => void;
  onUpdateTarifWarga: (noKk: string, data: Partial<TarifWargaKK>) => void;
  preselectedKk?: { noKk: string; namaKepala: string } | null;
  preselectedMonth?: string;
  onOpenTarifModal: () => void;
}

const BULAN_NAMES = [
  { key: 'periode-sebelum', short: 'Sebelum', label: 'Tagihan Tahun Sebelum', isLibur: false, isPeriodeSebelum: true },
  { key: '2026-01', short: 'Jan', label: 'Januari 2026', isLibur: false },
  { key: '2026-02', short: 'Feb', label: 'Februari 2026', isLibur: false },
  { key: '2026-03', short: 'Mar', label: 'Maret 2026', isLibur: true },
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

export const formatRupiah = (amount: number): string => {
  if (amount < 0) {
    return '-Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const AddIuranModal: React.FC<AddIuranModalProps> = ({
  kkList,
  tarifWargaList,
  getTarifByKK,
  onClose,
  onSuccess,
  onUpdateTarifWarga,
  preselectedKk,
  preselectedMonth,
  onOpenTarifModal
}) => {
  const [formNoKk, setFormNoKk] = useState(preselectedKk?.noKk || '');
  const [formNamaWarga, setFormNamaWarga] = useState(preselectedKk?.namaKepala || '');
  const [formSelectedMonths, setFormSelectedMonths] = useState<string[]>(
    preselectedMonth ? [preselectedMonth] : ['2026-09']
  );

  const [formJimpitan, setFormJimpitan] = useState<number | string>(15000);
  const [formUangMeja, setFormUangMeja] = useState<number | string>(10000);
  const [formTabungan, setFormTabungan] = useState<number | string>(0);
  const [formIkutJimpitan, setFormIkutJimpitan] = useState<boolean>(true);
  const [formIkutUangMeja, setFormIkutUangMeja] = useState<boolean>(true);
  const [formIkutTabungan, setFormIkutTabungan] = useState<boolean>(true);
  const [formSimpanTarifKK, setFormSimpanTarifKK] = useState<boolean>(false);

  const [formTanggalBayar, setFormTanggalBayar] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formMetode, setFormMetode] = useState<'Tunai' | 'Transfer Bank' | 'QRIS RT 02'>('Tunai');
  const [formPenerima, setFormPenerima] = useState('Misbahudin (Bendahara)');
  const [formCatatan, setFormCatatan] = useState('');
  const [formSyncKas, setFormSyncKas] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // State pencatatan / pembaruan Tagihan Tahun Sebelum KK (bisa positif/tunggakan atau negatif/lebih bayar)
  const [formTagihanSebelumVal, setFormTagihanSebelumVal] = useState<number | string>(0);
  const [formCustomTagihanSebelumEdited, setFormCustomTagihanSebelumEdited] = useState<boolean>(false);
  const [qrQrisUrl, setQrQrisUrl] = useState<string>('');
  const [copiedRekening, setCopiedRekening] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadQr = async () => {
      const qrisText = `00020101021226580014ID.LINKAJA.WWW01189360000201102026090208123456780303UMI51440014ID.CO.QRIS.WWW0215ID10202609200020303UMI5204549953033605802ID5927KAS RT 02 RW 14 PEDURUNGAN6008SEMARANG61055019262240720BERKAHONE-IURAN-RT02630489A1`;
      try {
        const url = await generateQRCodeWithBerkahOneLogo(qrisText, 220);
        if (isMounted) setQrQrisUrl(url);
      } catch (e) {
        console.error('Error generating QRIS QR:', e);
      }
    };
    loadQr();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedKkList = useMemo(() => {
    return [...kkList].sort((a, b) => {
      const cmp = a.namaKepala.localeCompare(b.namaKepala, 'id', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return a.noKk.localeCompare(b.noKk, 'id', { numeric: true });
    });
  }, [kkList]);

  // When selected KK changes, load that KK's specific tariff
  useEffect(() => {
    if (!formNoKk) {
      if (sortedKkList.length > 0 && !preselectedKk) {
        const first = sortedKkList[0];
        setFormNoKk(first.noKk);
        setFormNamaWarga(first.namaKepala);
        applyTarifKK(first.noKk);
      }
      return;
    }
    applyTarifKK(formNoKk);
  }, [formNoKk, sortedKkList]);

  const applyTarifKK = (noKk: string) => {
    const tarif = getTarifByKK(noKk);
    if (tarif) {
      setFormJimpitan(tarif.jimpitan);
      setFormUangMeja(tarif.uangMeja);
      setFormTabungan(tarif.tabungan);
      setFormIkutJimpitan(tarif.ikutJimpitan);
      setFormIkutUangMeja(tarif.ikutUangMeja);
      setFormIkutTabungan(tarif.ikutTabungan);
      setFormTagihanSebelumVal(tarif.tagihanPeriodeSebelum ?? 0);
      setFormCustomTagihanSebelumEdited(false);
    } else {
      setFormJimpitan(15000);
      setFormUangMeja(10000);
      setFormTabungan(0);
      setFormIkutJimpitan(true);
      setFormIkutUangMeja(true);
      setFormIkutTabungan(true);
      setFormTagihanSebelumVal(0);
      setFormCustomTagihanSebelumEdited(false);
    }
  };

  const handleSelectKKChange = (noKk: string) => {
    setFormNoKk(noKk);
    const found = kkList.find((k) => k.noKk === noKk);
    if (found) {
      setFormNamaWarga(found.namaKepala);
    }
    applyTarifKK(noKk);
  };

  const nominalPerBulan = useMemo(() => {
    const j = formIkutJimpitan ? Number(formJimpitan) || 0 : 0;
    const m = formIkutUangMeja ? Number(formUangMeja) || 0 : 0;
    const t = formIkutTabungan ? Number(formTabungan) || 0 : 0;
    return j + m + t;
  }, [formIkutJimpitan, formJimpitan, formIkutUangMeja, formUangMeja, formIkutTabungan, formTabungan]);

  const grandTotal = useMemo(() => {
    return nominalPerBulan * (formSelectedMonths.length || 1);
  }, [nominalPerBulan, formSelectedMonths.length]);

  const toggleMonth = (mKey: string) => {
    if (formSelectedMonths.includes(mKey)) {
      if (formSelectedMonths.length === 1) return;
      setFormSelectedMonths((prev) => prev.filter((k) => k !== mKey));
    } else {
      setFormSelectedMonths((prev) => [...prev, mKey].sort());
    }
  };

  const computedKategori: KategoriIuran = useMemo(() => {
    if (formIkutJimpitan && formIkutUangMeja && formIkutTabungan) return 'Gabungan (Jimpitan, Uang Meja, Tabungan)';
    if (formIkutJimpitan && formIkutUangMeja && !formIkutTabungan) return 'Jimpitan & Uang Meja';
    if (formIkutJimpitan && !formIkutUangMeja && formIkutTabungan) return 'Jimpitan & Tabungan';
    if (!formIkutJimpitan && formIkutUangMeja && formIkutTabungan) return 'Uang Meja & Tabungan';
    if (formIkutJimpitan && !formIkutUangMeja && !formIkutTabungan) return 'Jimpitan';
    if (!formIkutJimpitan && formIkutUangMeja && !formIkutTabungan) return 'Uang Meja';
    if (!formIkutJimpitan && !formIkutUangMeja && formIkutTabungan) return 'Tabungan';
    return 'Iuran Kustom Warga';
  }, [formIkutJimpitan, formIkutUangMeja, formIkutTabungan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNoKk) {
      setFormError('Silakan pilih Kepala Keluarga / No. KK terlebih dahulu.');
      return;
    }
    if (formSelectedMonths.length === 0) {
      setFormError('Silakan pilih minimal 1 periode bulan yang dibayar.');
      return;
    }
    // Nilai jimpitan, uang meja dan tabungan bisa kosong tidak ada validasi minimal nominal

    if (formSimpanTarifKK) {
      onUpdateTarifWarga(formNoKk, {
        jimpitan: Number(formJimpitan) || 0,
        uangMeja: Number(formUangMeja) || 0,
        tabungan: Number(formTabungan) || 0,
        ikutJimpitan: formIkutJimpitan,
        ikutUangMeja: formIkutUangMeja,
        ikutTabungan: formIkutTabungan
      });
    }

    // Perbarui / Catat Tagihan Tahun Sebelum KK jika diubah atau jika periode-sebelum dibayar
    if (formCustomTagihanSebelumEdited) {
      onUpdateTarifWarga(formNoKk, {
        tagihanPeriodeSebelum: formTagihanSebelumVal === '' ? 0 : (Number(formTagihanSebelumVal) || 0)
      });
    } else if (formSelectedMonths.includes('periode-sebelum')) {
      const currentSeb = getTarifByKK(formNoKk)?.tagihanPeriodeSebelum ?? 0;
      // < 0 adalah Kurang Bayar, pembayaran menambah saldo tahun sebelum (-25rb + 25rb = 0)
      const newSeb = currentSeb + nominalPerBulan;
      onUpdateTarifWarga(formNoKk, {
        tagihanPeriodeSebelum: newSeb
      });
    }

    const currentTarif = getTarifByKK(formNoKk);
    const alamatWarga = currentTarif?.alamat || 'RT 02 RW 14';

    const rincian: RincianIuran = {
      jimpitan: formIkutJimpitan ? (Number(formJimpitan) || 0) : 0,
      uangMeja: formIkutUangMeja ? (Number(formUangMeja) || 0) : 0,
      tabungan: formIkutTabungan ? (Number(formTabungan) || 0) : 0
    };

    formSelectedMonths.forEach((mKey, idx) => {
      const stamp = Date.now() + idx;
      const isSeb = mKey === 'periode-sebelum';
      const kwitansiCode = isSeb
        ? `KW-SEBELUM-${String(stamp).slice(-4)}`
        : `KW-2026-${mKey.split('-')[1] || '00'}-${String(stamp).slice(-4)}`;

      onSuccess(
        {
          noKwitansi: kwitansiCode,
          noKk: formNoKk,
          namaWarga: formNamaWarga,
          alamat: alamatWarga,
          bulan: mKey,
          tahun: isSeb ? 2025 : 2026,
          nominal: nominalPerBulan,
          kategoriIuran: computedKategori,
          rincian,
          tanggalBayar: formTanggalBayar,
          metode: formMetode,
          penerima: formPenerima,
          status: 'Lunas',
          catatan: formCatatan.trim() || undefined
        },
        formSyncKas
      );
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pencatatan Pembayaran Iuran Warga
              </h2>
              <p className="text-[11px] text-slate-500">
                RT 02 RW 14 &bull; Otomatis disinkronkan ke Kas Besar RT
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

        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Pilih Warga / KK (Tanpa Menampilkan Alamat Rumah) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Warga / Kepala Keluarga *
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTarifModal();
                }}
                className="text-[10px] text-orange-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Settings className="w-3 h-3" />
                <span>Atur tarif khusus warga</span>
              </button>
            </div>
            <select
              value={formNoKk}
              onChange={(e) => handleSelectKKChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium cursor-pointer"
              required
            >
              <option value="">-- Pilih Kepala Keluarga / No. KK --</option>
              {sortedKkList.map((k) => (
                <option key={k.noKk} value={k.noKk}>
                  {k.namaKepala} &bull; No. KK: {k.noKk}
                </option>
              ))}
            </select>
            {formNoKk && (
              <div className="mt-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Tagihan / Saldo Tahun Sebelum KK</span>
                  </div>
                  <div className="text-xs font-mono font-bold">
                    {(getTarifByKK(formNoKk)?.tagihanPeriodeSebelum ?? 0) === 0 ? (
                      <span className="text-slate-500 font-semibold bg-slate-200/80 px-2 py-0.5 rounded text-[11px]">Rp 0 (Nihil)</span>
                    ) : (getTarifByKK(formNoKk)?.tagihanPeriodeSebelum ?? 0) < 0 ? (
                      <span className="text-rose-950 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-[11px]">
                        -{formatRupiah(Math.abs(getTarifByKK(formNoKk)!.tagihanPeriodeSebelum!))} (Kurang Bayar)
                      </span>
                    ) : (
                      <span className="text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px]">
                        +{formatRupiah(getTarifByKK(formNoKk)!.tagihanPeriodeSebelum!)} (Lebih Bayar)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700">
                      Catat / Sesuaikan Tagihan Tahun Sebelum:
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormTagihanSebelumVal(0);
                          setFormCustomTagihanSebelumEdited(true);
                        }}
                        className="px-2 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold transition-colors cursor-pointer"
                        title="Setel menjadi Rp 0 (Lunas / Nihil)"
                      >
                        Rp 0 (Nihil)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Number(formTagihanSebelumVal) || 0;
                          setFormTagihanSebelumVal(-(Math.abs(cur) || 25000));
                          setFormCustomTagihanSebelumEdited(true);
                        }}
                        className="px-2 py-0.5 text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded font-bold transition-colors cursor-pointer"
                        title="Setel nilai negatif (< 0) sebagai Kurang Bayar"
                      >
                        - Kurang Bayar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = Number(formTagihanSebelumVal) || 0;
                          setFormTagihanSebelumVal(Math.abs(cur) || 25000);
                          setFormCustomTagihanSebelumEdited(true);
                        }}
                        className="px-2 py-0.5 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded font-bold transition-colors cursor-pointer"
                        title="Setel nilai positif (> 0) sebagai Lebih Bayar"
                      >
                        + Lebih Bayar
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="1000"
                      value={formTagihanSebelumVal}
                      onChange={(e) => {
                        setFormTagihanSebelumVal(e.target.value);
                        setFormCustomTagihanSebelumEdited(true);
                      }}
                      placeholder="0 (< 0 Kurang Bayar, > 0 Lebih Bayar)"
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>
                      💡 <strong>&lt; 0 (negatif)</strong>: Kurang Bayar (tunggakan periode lalu). <strong>&gt; 0 (positif)</strong>: Lebih Bayar (deposit/kelebihan bayar).
                    </span>
                    {!formSelectedMonths.includes('periode-sebelum') && (
                      <button
                        type="button"
                        onClick={() => toggleMonth('periode-sebelum')}
                        className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 shrink-0 cursor-pointer transition-colors"
                      >
                        + Pilih Tahun Sebelum
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Pilih Bulan yang Dibayar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Periode Pembayaran * ({formSelectedMonths.length} periode dipilih)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              {BULAN_NAMES.map((b) => {
                const isSelected = formSelectedMonths.includes(b.key);
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => toggleMonth(b.key)}
                    className={`py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : b.isPeriodeSebelum
                        ? 'bg-amber-100/70 text-amber-950 border border-amber-300 hover:bg-amber-200'
                        : b.isLibur
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={b.isPeriodeSebelum ? 'Tagihan Tahun Sebelum (digabung dengan periode berjalan)' : b.isLibur ? 'Bulan Maret 2026: Libur Iuran RT' : undefined}
                  >
                    <div className="leading-tight">{b.short}</div>
                    {b.isPeriodeSebelum && (
                      <span className={`text-[8px] font-bold block ${isSelected ? 'text-emerald-100' : 'text-amber-800'}`}>
                        Thn Sblm
                      </span>
                    )}
                    {b.isLibur && (
                      <span className={`text-[8px] font-bold block ${isSelected ? 'text-amber-200' : 'text-amber-800'}`}>
                        Libur
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {formSelectedMonths.includes('2026-03') && (
              <p className="mt-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-1.5">
                ℹ️ <strong>Catatan:</strong> Bulan Maret 2026 telah ditetapkan sebagai <strong>Bulan Libur Iuran</strong>. Pembayaran untuk bulan ini bersifat sukarela jika tetap dicatat.
              </p>
            )}
          </div>

          {/* 3. Komponen Iuran (Jimpitan 15rb, Uang Meja 10rb, Tabungan 20rb) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900">
                Komponen Iuran (Tiap Warga Bisa Disesuaikan) *
              </label>
              <span className="text-[10px] text-slate-500">
                Kategori: <strong className="text-slate-800">{computedKategori}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Jimpitan */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  formIkutJimpitan ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="ikutJimpitan"
                      checked={formIkutJimpitan}
                      onChange={(e) => setFormIkutJimpitan(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer"
                    />
                    <label htmlFor="ikutJimpitan" className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600" /> Jimpitan
                    </label>
                  </div>
                  <span className="text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold font-mono">
                    {formatRupiah(Number(formJimpitan) || 0)}
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
                    disabled={!formIkutJimpitan}
                    value={formJimpitan}
                    onChange={(e) => setFormJimpitan(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-amber-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Uang Meja */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  formIkutUangMeja ? 'bg-blue-50/60 border-blue-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="ikutUangMeja"
                      checked={formIkutUangMeja}
                      onChange={(e) => setFormIkutUangMeja(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="ikutUangMeja" className="text-xs font-bold text-blue-950 cursor-pointer flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-blue-600" /> Uang Meja
                    </label>
                  </div>
                  <span className="text-[9px] text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded font-semibold font-mono">
                    {formatRupiah(Number(formUangMeja) || 0)}
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
                    disabled={!formIkutUangMeja}
                    value={formUangMeja}
                    onChange={(e) => setFormUangMeja(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Tabungan */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  formIkutTabungan ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="ikutTabungan"
                      checked={formIkutTabungan}
                      onChange={(e) => setFormIkutTabungan(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer"
                    />
                    <label htmlFor="ikutTabungan" className="text-xs font-bold text-emerald-950 cursor-pointer flex items-center gap-1">
                      <PiggyBank className="w-3 h-3 text-emerald-600" /> Tabungan
                    </label>
                  </div>
                  <span className="text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold font-mono">
                    {formatRupiah(Number(formTabungan) || 0)}
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
                    disabled={!formIkutTabungan}
                    value={formTabungan}
                    onChange={(e) => setFormTabungan(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Opsi Simpan Sebagai Tarif Tetap KK */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSimpanTarifKK}
                  onChange={(e) => setFormSimpanTarifKK(e.target.checked)}
                  className="w-3.5 h-3.5 text-orange-600 rounded cursor-pointer"
                />
                <span>Simpan komponen nominal ini sebagai tarif tetap KK {formNamaWarga || ''}</span>
              </label>
            </div>

            {/* Ringkasan Nominal & Grand Total */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-emerald-800">
                  Tarif Bulanan: <strong>{formatRupiah(nominalPerBulan)}</strong> &times; {formSelectedMonths.length} bulan
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Total Pembayaran Diterima:
                </div>
              </div>
              <div className="text-lg font-extrabold text-emerald-950 font-mono">
                {formatRupiah(grandTotal)}
              </div>
            </div>
          </div>

          {/* 4. Tanggal & Metode Bayar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                value={formTanggalBayar}
                onChange={(e) => setFormTanggalBayar(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={formMetode}
                onChange={(e) => setFormMetode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white cursor-pointer font-medium"
              >
                <option value="Tunai">Tunai (Cash)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS RT 02">QRIS RT 02</option>
              </select>
            </div>
          </div>

          {/* Info Rekening Kas jika Transfer Bank dipilih */}
          {formMetode === 'Transfer Bank' && (
            <div className="p-3 bg-blue-50 border border-blue-300 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                  BM
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-200 text-blue-900">
                      TRANSFER RESMI
                    </span>
                    <span>Rekening Kas RT 02 (Misbahudin)</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-tight">
                    Transfer Bank melalui Mandiri Nomer Rekening <strong>1350015984766</strong> an <strong>Misbahudin</strong>.
                  </p>
                  <div className="text-[10px] font-mono text-blue-800 font-semibold pt-0.5">
                    No. Rekening: 1350015984766 &bull; Bank Mandiri
                  </div>
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
                className="px-2.5 py-1 text-[10px] font-bold text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedRekening ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRekening ? 'Tersalin!' : 'Salin Rek'}</span>
              </button>
            </div>
          )}

          {/* Preview QRIS Bendahara jika metode QRIS dipilih */}
          {formMetode === 'QRIS RT 02' && (
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl flex items-center gap-3.5 animate-in fade-in">
              <div className="p-1 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
                {qrQrisUrl ? (
                  <img
                    src={qrQrisUrl}
                    alt="QRIS Kas RT 02"
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                    Memuat...
                  </div>
                )}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-200 text-emerald-900">
                    QRIS RESMI
                  </span>
                  <span>Kas RT 02 (Bendahara Misbahudin)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay ke Kas RT 02 RW 14.
                </p>
                <div className="text-[10px] font-mono text-emerald-850 font-semibold pt-0.5">
                  NMID: ID1020260920002 &bull; Bank Jateng
                </div>
              </div>
            </div>
          )}

          {/* 5. Petugas Penerima & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Penerima *
              </label>
              <input
                type="text"
                value={formPenerima}
                onChange={(e) => setFormPenerima(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                placeholder="Misal: Titip tetangga / lunas 3 bulan"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Opsi Sinkronisasi ke Kas Besar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="syncKas"
                checked={formSyncKas}
                onChange={(e) => setFormSyncKas(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="syncKas" className="text-xs text-slate-700 cursor-pointer font-medium">
                Otomatis catat penerimaan ini ke <strong>Kas Besar RT</strong> (Kas Kecil)
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Pembayaran ({formatRupiah(grandTotal)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
