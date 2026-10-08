import React, { useState } from 'react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Menu, 
  X, 
  RefreshCw,
  FileText,
  Users,
  ChevronDown
} from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  onOpenAddWarga?: () => void;
  onOpenLoginModal?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAddWarga, 
  onOpenLoginModal, 
  onOpenLogin,
  onOpenRegister 
}) => {
  const triggerLogin = onOpenLogin || onOpenLoginModal || (() => {});
  const triggerRegister = onOpenRegister || triggerLogin;
  const { 
    currentUser, 
    logout, 
    switchUser, 
    users, 
    activeTab, 
    setActiveTab, 
    resetToDefaultData,
    hasPermission 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'superadmin':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '👑' };
      case 'sekretaris':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: '📝' };
      case 'bendahara':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: '💰' };
      case 'warga':
        return { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: '👤' };
    }
  };

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs print:hidden">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white text-xs py-1.5 px-3 sm:px-4">
        <div className="app-container-responsive max-w-7xl 2xl:max-w-[1840px] 4k:max-w-[3200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium tracking-wide">
              RT 02 RW 14 Tanjung Sari &bull; Kelurahan Pedurungan Tengah, Kota Semarang
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-emerald-200">
            <span>Sistem Kependudukan & Pelaporan Terpadu</span>
            <button 
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              title="Reset data warga jika telah dimodifikasi untuk demo"
              className="flex items-center gap-1 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Data Contoh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="app-container-responsive max-w-7xl 2xl:max-w-[1840px] 4k:max-w-[3200px] mx-auto px-4 sm:px-6 lg:px-8 4k:px-12">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab(currentUser?.role === 'warga' ? 'kk' : 'dashboard')}
          >
            <Logo size="md" variant="horizontal" />
          </div>

          {/* Right Action & User Controls */}
          <div className="flex items-center gap-3">

            {/* User Profile / Quick Switcher */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.nama}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 leading-tight">
                      {currentUser.roleLabel}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Masuk sebagai</p>
                      <p className="text-sm font-bold text-slate-800">{currentUser.nama}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 mt-1 rounded-full border ${getRoleBadge(currentUser.role).bg}`}>
                        <span>{getRoleBadge(currentUser.role).icon}</span>
                        <span>{currentUser.roleLabel}</span>
                      </span>
                    </div>

                    <div className="px-3 py-2">
                      <p className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
                        Ganti Akun Demo Cepat:
                      </p>
                      <div className="space-y-1">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              currentUser.id === u.id
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{getRoleBadge(u.role).icon}</span>
                              <div>
                                <div>{u.nama}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{u.roleLabel}</div>
                              </div>
                            </div>
                            {currentUser.id === u.id && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-1 px-1">
                      {currentUser?.role !== 'warga' && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setActiveTab('users');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Kelola Hak Akses Pengguna</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Sistem</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerRegister}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Daftar Warga</span>
                </button>
                <button
                  onClick={triggerLogin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Masuk Sistem</span>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {currentUser?.role === 'warga' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab('kk'); setMobileMenuOpen(false); }}
                className={`p-2.5 text-xs font-bold rounded-xl text-left transition-colors ${activeTab === 'kk' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                🏡 Kartu Keluarga (KK Saya)
              </button>
              <button
                onClick={() => { setActiveTab('laporan'); setMobileMenuOpen(false); }}
                className={`p-2.5 text-xs font-bold rounded-xl text-left transition-colors ${activeTab === 'laporan' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                📑 Dashboard Pelaporan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'dashboard' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('warga'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'warga' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                👥 Data Warga
              </button>
              <button
                onClick={() => { setActiveTab('kk'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'kk' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                🏡 Kartu Keluarga
              </button>
              <button
                onClick={() => { setActiveTab('pkk'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'pkk' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                🌸 Peserta PKK
              </button>
              <button
                onClick={() => { setActiveTab('kas_besar'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'kas_besar' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                💰 Kas Besar RT
              </button>
              <button
                onClick={() => { setActiveTab('laporan'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'laporan' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                📑 Pelaporan
              </button>
              <button
                onClick={() => { setActiveTab('surat'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'surat' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                ✉️ Surat Pengantar
              </button>
              <button
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                className={`p-2 text-xs font-medium rounded-lg text-left ${activeTab === 'users' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700'}`}
              >
                🔐 Manajemen User
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Konfirmasi Reset Data */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Reset Seluruh Data?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan mengembalikan data warga (118 warga), akun pengguna, dan riwayat transaksi kas ke kondisi awal bawaan sistem.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaultData();
                  setIsResetModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ya, Reset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
