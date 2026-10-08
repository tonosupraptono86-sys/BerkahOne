import { TransaksiKas } from '../types';

export const INITIAL_KAS_DATA: TransaksiKas[] = [
  // =========================================================================
  // SALDO AWAL BULAN FEBRUARI 2026:
  // - Saldo Awal Kas Kecil RT = Rp 2.099.000
  // - Saldo Awal Kas BOP RT   = Rp 0
  // Total Saldo Awal Kas Besar (Gabungan) = Rp 2.099.000
  // =========================================================================
  {
    id: 'kas-kcl-sa-2026-02',
    tanggal: '2026-02-01',
    posKas: 'kas_kecil',
    tipe: 'masuk',
    kategori: 'Saldo Awal Kas',
    keterangan: 'Saldo Awal Kas Kecil RT Bulan Februari 2026',
    nominal: 2099000,
    noBukti: 'SA/2026/02/001',
    lpj: 'Tidak Perlu',
    penanggungJawab: 'Misbahudin (Bendahara)',
    createdAt: '2026-02-01T08:00:00Z'
  },
  {
    id: 'kas-bop-sa-2026-02',
    tanggal: '2026-02-01',
    posKas: 'kas_bop',
    tipe: 'masuk',
    kategori: 'Saldo Awal Kas',
    keterangan: 'Saldo Awal Kas BOP RT Bulan Februari 2026',
    nominal: 0,
    noBukti: 'SA/2026/02/002',
    lpj: 'Tidak Perlu',
    penanggungJawab: 'Misbahudin (Bendahara)',
    createdAt: '2026-02-01T08:00:00Z'
  }
];
