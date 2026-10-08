import { User, ActivityLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    username: 'admin',
    nama: 'Ali Muhtarom, S.T',
    email: 'rt02rw14.semarang@gmail.com',
    role: 'superadmin',
    roleLabel: 'Ketua RT / Super Admin',
    noHp: '081234567801',
    status: 'aktif',
    lastLogin: 'Hari ini, 08:30 WIB',
    nikTerdaftar: '3374062005820002',
    passwordSalt: 's1_adm_salt_89a7',
    passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'usr-2',
    username: 'sekretaris',
    nama: 'Supraptono',
    email: 'tonosupraptono86@gmail.com',
    role: 'sekretaris',
    roleLabel: 'Sekretaris RT',
    noHp: '081390123456',
    status: 'aktif',
    lastLogin: 'Kemarin, 19:15 WIB',
    nikTerdaftar: '3374060410630005',
    passwordSalt: 's2_sek_salt_43b2',
    passwordHash: 'f4c2e6843a887b5a82ef57b98a0026e6f9872506b3a0b5a840e660eb98e1694f'
  },
  {
    id: 'usr-3',
    username: 'bendahara',
    nama: 'Misbahudin',
    email: 'bendahara.rt02@gmail.com',
    role: 'bendahara',
    roleLabel: 'Bendahara / Pengurus RT',
    noHp: '081234567803',
    status: 'aktif',
    lastLogin: '2 hari lalu',
    nikTerdaftar: '3374052407830004',
    passwordSalt: 's3_ben_salt_12c9',
    passwordHash: '8a3e7b1a2c9f4d5e6b7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f'
  },
  {
    id: 'usr-4',
    username: 'warga',
    nama: 'Naila Rosdiana Zulfany',
    email: 'naila.rosdiana@gmail.com',
    role: 'warga',
    roleLabel: 'Warga Terdaftar',
    noHp: '081298765432',
    status: 'aktif',
    lastLogin: 'Baru saja',
    nikTerdaftar: '3328036104940004',
    passwordSalt: 's4_wrg_salt_77e1',
    passwordHash: '7b9e1a2d3c4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-11 20:15',
    userName: 'Ali Muhtarom, S.T',
    userRole: 'Ketua RT / Super Admin',
    action: 'Sinkronisasi Data Awal',
    detail: 'Memuat 118 data kependudukan RT 02 RW 14 ke sistem BerkahOne',
    category: 'system'
  },
  {
    id: 'log-2',
    timestamp: '2026-09-11 20:20',
    userName: 'Supraptono',
    userRole: 'Sekretaris RT',
    action: 'Verifikasi Berkas KK',
    detail: 'Pemeriksaan kelengkapan NIK dan No KK warga Tanjungsari & Pedurungan',
    category: 'warga'
  },
  {
    id: 'log-3',
    timestamp: '2026-09-11 20:25',
    userName: 'Ali Muhtarom, S.T',
    userRole: 'Ketua RT / Super Admin',
    action: 'Generate Laporan Demografi',
    detail: 'Ekspor rekapitulasi data kelompok umur & rasio jenis kelamin',
    category: 'report'
  }
];
