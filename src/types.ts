export type Role = 'superadmin' | 'sekretaris' | 'bendahara' | 'warga';

export interface User {
  id: string;
  username: string;
  nama: string;
  email: string;
  role: Role;
  roleLabel: string;
  avatar?: string;
  noHp?: string;
  status: 'aktif' | 'nonaktif';
  lastLogin?: string;
  nikTerdaftar?: string;
  passwordHash?: string;
  passwordSalt?: string;
}

export interface Warga {
  id: string;
  nama: string;
  nik: string;
  noKk: string;
  statusKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Cucu' | 'Famili Lain' | 'Lainnya';
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  statusPerkawinan: 'Kawin' | 'Belum Kawin' | 'Janda' | 'Duda' | 'Meninggal';
  alamat: string;
  domisili: string;
  tempatLahir: string;
  tglLahir: string; // DD/MM/YYYY
  agama: string;
  pendidikan: string;
  pekerjaan?: string;
  telepon?: string;
  noHp?: string;
  personKontak?: string;
  catatanKhusus?: string;
  updatedAt?: string;
}

export interface KartuKeluarga {
  noKk: string;
  kepalaKeluarga: string;
  alamat: string;
  domisili: string;
  anggota: Warga[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  detail: string;
  category: 'warga' | 'user' | 'system' | 'report';
}

export interface SuratPengantarForm {
  nomorSurat: string;
  wargaId: string;
  keperluan: string;
  keteranganLain: string;
  tujuan: string;
  tglSurat: string;
  berlakuHingga: string;
  penandatangan: string;
  jabatanPenandatangan: string;
}

export type PosKas = 'kas_kecil' | 'kas_bop';
export type TipeTransaksi = 'masuk' | 'keluar';

export interface TransaksiKas {
  id: string;
  tanggal: string; // YYYY-MM-DD
  posKas: PosKas;
  tipe: TipeTransaksi;
  kategori: string;
  keterangan: string;
  nominal: number;
  noBukti?: string;
  lpj?: string;
  penanggungJawab: string;
  createdAt: string;
}

export interface RingkasanKas {
  saldoKasKecil: number;
  totalMasukKasKecil: number;
  totalKeluarKasKecil: number;
  saldoKasBOP: number;
  totalMasukKasBOP: number;
  totalKeluarKasBOP: number;
  totalSaldoKasBesar: number;
  totalMasukKasBesar: number;
  totalKeluarKasBesar: number;
}

export type KategoriIuran = 
  | 'Jimpitan'
  | 'Uang Meja'
  | 'Tabungan'
  | 'Gabungan (Jimpitan, Uang Meja, Tabungan)'
  | 'Jimpitan & Uang Meja'
  | 'Jimpitan & Tabungan'
  | 'Uang Meja & Tabungan'
  | 'Iuran Kustom Warga';

export interface RincianIuran {
  jimpitan: number; // Komponen Jimpitan
  uangMeja: number; // Komponen Uang Meja
  tabungan: number; // Komponen Tabungan
}

export interface TarifWargaKK {
  noKk: string;
  namaKepala: string;
  jimpitan: number;
  uangMeja: number;
  tabungan: number;
  ikutJimpitan: boolean;
  ikutUangMeja: boolean;
  ikutTabungan: boolean;
  totalTarif: number;
  catatan?: string;
  tagihanPeriodeSebelum?: number;
  bulanDitutup?: string[]; // Kunci bulan yang ditutup untuk KK ini (misal warga belum ikut dari awal)
  koreksiTagihanBulan?: Record<string, number>; // Nilai koreksi tagihan per bulan (misal "2026-10": 20000 atau "2026-10": 0 untuk dihapus)
}

export interface PembayaranIuran {
  id: string;
  noKk: string;
  namaWarga: string; // Nama Kepala Keluarga / Pembayar
  alamat: string;
  bulan: string; // Format: "YYYY-MM" contoh "2026-01"
  nominal: number;
  kategoriIuran: KategoriIuran;
  rincian?: RincianIuran;
  tanggalBayar: string; // YYYY-MM-DD
  metode: 'Tunai' | 'Transfer Bank' | 'QRIS RT 02';
  noKwitansi: string;
  status: 'Lunas' | 'Sebagian';
  penerima: string;
  catatan?: string;
  transaksiKasId?: string; // Tautan ke ID Transaksi Kas Besar jika disinkronkan
  createdAt: string;
}

// --- PKK (Pemberdayaan dan Kesejahteraan Keluarga) ---
export type JabatanPKK =
  | 'Ketua PKK'
  | 'Wakil Ketua'
  | 'Sekretaris'
  | 'Bendahara'
  | 'Ketua Pokja I'
  | 'Ketua Pokja II'
  | 'Ketua Pokja III'
  | 'Ketua Pokja IV'
  | 'Anggota Pokja I'
  | 'Anggota Pokja II'
  | 'Anggota Pokja III'
  | 'Anggota Pokja IV'
  | 'Anggota';

export interface PesertaPKK {
  id: string;
  wargaId?: string; // ID Warga dari Data Kependudukan
  nama: string;
  nik: string;
  noKk: string;
  namaSuami?: string; // Nama Kepala Keluarga (Suami)
  statusKeluarga?: 'Istri';
  jabatan: JabatanPKK;
  pokja: 'Pokja I' | 'Pokja II' | 'Pokja III' | 'Pokja IV' | 'Pengurus Inti' | 'Anggota Umum';
  alamat: string;
  noHp?: string;
  status: 'Aktif' | 'Non-Aktif';
  catatan?: string;
  createdAt: string;
}

export interface TransaksiKasPKK {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tipe: 'masuk' | 'keluar';
  kategori: string;
  keterangan: string;
  nominal: number;
  noBukti?: string;
  penanggungJawab: string;
  createdAt: string;
}

export interface PembayaranIuranPKK {
  id: string;
  pesertaId: string;
  namaPeserta: string;
  noKk: string;
  bulan: string; // Format: "YYYY-MM" contoh "2026-01"
  nominal: number; // misal Rp 20.000
  tanggalBayar: string; // YYYY-MM-DD
  metode: 'Tunai' | 'Transfer Bank' | 'QRIS';
  noKwitansi: string;
  status: 'Lunas' | 'Belum Bayar';
  penerima: string;
  catatan?: string;
  transaksiKasId?: string;
  createdAt: string;
}

export interface RingkasanKasPKK {
  saldo: number;
  totalMasuk: number;
  totalKeluar: number;
}


