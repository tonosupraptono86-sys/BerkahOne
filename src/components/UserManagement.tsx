import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Role } from '../types';
import { 
  ShieldCheck, 
  UserPlus, 
  UserCheck, 
  ShieldAlert, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  KeyRound, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  X,
  User as UserIcon,
  QrCode
} from 'lucide-react';
import { QrCodeBendaharaModal } from './iuran/QrCodeBendaharaModal';

export const UserManagement: React.FC = () => {
  const { 
    users, 
    currentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus, 
    logs,
    hasPermission 
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isQrBendaharaModalOpen, setIsQrBendaharaModalOpen] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    role: 'sekretaris' as Role,
    noHp: '',
    password: '',
    status: 'aktif' as 'aktif' | 'nonaktif'
  });
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const handleOpenAdd = () => {
    setFormData({
      nama: '',
      username: '',
      email: '',
      role: 'warga',
      noHp: '',
      password: 'password123',
      status: 'aktif'
    });
    setEditingUser(null);
    setShowPasswordInput(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({
      nama: user.nama,
      username: user.username,
      email: user.email,
      role: user.role,
      noHp: user.noHp || '',
      password: '',
      status: user.status
    });
    setEditingUser(user);
    setShowPasswordInput(false);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.username.trim()) {
      alert('Nama dan Username wajib diisi!');
      return;
    }

    const roleLabels: Record<Role, string> = {
      superadmin: 'Ketua RT / Super Admin',
      sekretaris: 'Sekretaris RT',
      bendahara: 'Bendahara / Petugas',
      warga: 'Warga Terdaftar'
    };

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(
          editingUser.id,
          {
            nama: formData.nama.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            role: formData.role,
            roleLabel: roleLabels[formData.role],
            noHp: formData.noHp.trim(),
            status: formData.status
          },
          formData.password.trim() ? formData.password.trim() : undefined
        );
      } else {
        await addUser(
          {
            nama: formData.nama.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            role: formData.role,
            roleLabel: roleLabels[formData.role],
            noHp: formData.noHp.trim(),
            status: formData.status,
            lastLogin: 'Belum pernah login'
          },
          formData.password.trim() || 'password123'
        );
      }
      setIsAddModalOpen(false);
    } catch (err) {
      alert('Terjadi kesalahan saat memproses data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'sekretaris':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'bendahara':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'warga':
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.noHp && u.noHp.includes(searchTerm));
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Manajemen Pengguna & Hak Akses BerkahOne</span>
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              {users.length} Akun Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan otorisasi pengurus RT (Super Admin, Sekretaris, Bendahara) dan akun Warga dengan proteksi sandi SHA-256 + Salt.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Mode Akses Terbatas:</strong> Anda saat ini login sebagai{' '}
            <span className="font-bold underline">{currentUser?.roleLabel}</span>. Hanya akun{' '}
            <strong>Super Admin / Ketua RT</strong> yang memiliki izin membuat, mengedit, atau menghapus akun pengguna lain.
          </div>
        </div>
      )}

      {/* Role Matrix Explanation (RBAC) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Matriks Hak Akses & Peran Jabatan (RBAC)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
              <span>👑 Ketua RT (Super Admin)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Kontrol penuh: Tambah/Ubah/Hapus Warga, Kelola Pengguna & Hak Akses, Cetak Surat & Laporan, Reset Pengaturan.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
            <div className="font-bold text-blue-950 flex items-center gap-1.5 mb-1">
              <span>📝 Sekretaris RT</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Kelola Data Kependudukan, Verifikasi KK, Terbitkan Surat Pengantar RT, dan Cetak Buku Induk.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
            <div className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
              <span>💰 Bendahara / Petugas</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Melihat Data Warga, Analisis Demografi, Ekspor Statistik Kependudukan, dan Rekapitulasi Wilayah.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <span>👤 Warga Terdaftar (User)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Akses mandiri: Memeriksa data Kartu Keluarga pribadi, melihat ringkasan statistik lingkungan publik RT 02.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Users */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, username, email, atau no. HP..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-semibold"
          >
            <option value="all">Semua Peran (Role)</option>
            <option value="superadmin">👑 Super Admin</option>
            <option value="sekretaris">📝 Sekretaris</option>
            <option value="bendahara">💰 Bendahara</option>
            <option value="warga">👤 Warga (User)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-semibold"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Akun Pengguna ({filteredUsers.length} ditemukan)
          </h3>
          <span className="text-xs text-slate-400">
            Password tersimpan dengan cryptographic salt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Role Akses</th>
                <th className="py-3 px-4">No. Telepon</th>
                <th className="py-3 px-4">Keamanan Sandi</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Login Terakhir</th>
                {isSuperAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ditemukan pengguna yang sesuai dengan pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {u.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.nama}</span>
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-800">@{u.username}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(u.role)}`}>
                            {u.roleLabel}
                          </span>
                          {u.role === 'bendahara' && (
                            <button
                              type="button"
                              onClick={() => setIsQrBendaharaModalOpen(true)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-850 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                              title="Buka QR Code QRIS & Verifikasi Digital Bendahara RT"
                            >
                              <QrCode className="w-3 h-3 text-emerald-700" />
                              <span>QR Bendahara</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {u.noHp || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          <span>SHA-256 + Salt</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          disabled={!isSuperAdmin || isCurrent}
                          onClick={() => toggleUserStatus(u.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            u.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } disabled:cursor-default`}
                        >
                          {u.status === 'aktif' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Non-Aktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {u.lastLogin || '-'}
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Edit Data & Reset Sandi"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                title="Hapus Akun"
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Audit Trail / Log Aktivitas Keamanan Sistem</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Tercatat realtime untuk akuntabilitas pengurus RT 02
          </span>
        </div>

        <div className="space-y-2">
          {logs.slice(0, 6).map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{log.action}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                    {log.category}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">{log.detail}</div>
              </div>
              <div className="text-right text-[10px] text-slate-400 whitespace-nowrap pl-3">
                <div>{log.timestamp}</div>
                <div className="font-medium text-slate-600">{log.userName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser ? 'Perbarui data akun atau reset kata sandi' : 'Buat akun pengurus atau warga baru'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Ahmad Fauzi, S.Kom"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="fauzi88"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role / Peran:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-semibold"
                  >
                    <option value="superadmin">👑 Ketua RT (Superadmin)</option>
                    <option value="sekretaris">📝 Sekretaris RT</option>
                    <option value="bendahara">💰 Bendahara / Petugas</option>
                    <option value="warga">👤 Warga Terdaftar (User)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status Akun:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-semibold"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    {editingUser ? 'Reset Kata Sandi (Kosongkan jika tidak diubah):' : 'Kata Sandi Akun:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    {showPasswordInput ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPasswordInput ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Ketik sandi baru untuk mengganti...' : 'Masukkan kata sandi (min. 6 karakter)...'}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Kata sandi akan otomatis dienkripsi dengan salt SHA-256 sebelum disimpan.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat Akun Sekarang')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Akun Pengguna */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Akun Pengguna?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akun pengguna ini akan dihapus dan tidak dapat masuk ke dalam sistem lagi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nama:</span>
                <span className="font-bold text-slate-900">{userToDelete.nama}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Username:</span>
                <span className="font-mono text-slate-700">@{userToDelete.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Peran / Role:</span>
                <span className="font-semibold text-slate-800">{userToDelete.roleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="text-slate-700">{userToDelete.email}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code Bendahara RT */}
      {isQrBendaharaModalOpen && (
        <QrCodeBendaharaModal
          onClose={() => setIsQrBendaharaModalOpen(false)}
        />
      )}
    </div>
  );
};
