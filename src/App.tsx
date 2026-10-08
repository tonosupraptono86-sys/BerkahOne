import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WargaTable } from './components/WargaTable';
import { KartuKeluargaView } from './components/KartuKeluargaView';
import { LaporanPelaporan } from './components/LaporanPelaporan';
import { SuratPengantar } from './components/SuratPengantar';
import { UserManagement } from './components/UserManagement';
import { KasBesarView } from './components/KasBesarView';
import { DataPesertaPKKView } from './components/pkk/DataPesertaPKKView';
import { WargaModal } from './components/WargaModal';
import { WargaDetailModal } from './components/WargaDetailModal';
import { LoginModal } from './components/LoginModal';
import { Warga } from './types';
import { 
  LayoutDashboard, 
  Users, 
  FolderGit2, 
  Wallet, 
  FileSpreadsheet,
  Mail
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useApp();
  const isWargaRole = currentUser?.role === 'warga';

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'login' | 'register'>('login');
  const [isWargaModalOpen, setIsWargaModalOpen] = useState(false);
  const [wargaToEdit, setWargaToEdit] = useState<Warga | null>(null);
  const [defaultNoKkModal, setDefaultNoKkModal] = useState<string | undefined>(undefined);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedWargaDetail, setSelectedWargaDetail] = useState<Warga | null>(null);

  const [targetSuratWarga, setTargetSuratWarga] = useState<Warga | null>(null);

  // If not logged in, show the dedicated Login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handlers
  const handleOpenLogin = () => {
    setLoginModalTab('login');
    setIsLoginModalOpen(true);
  };

  const handleOpenRegister = () => {
    setLoginModalTab('register');
    setIsLoginModalOpen(true);
  };

  const handleOpenAddWarga = (noKk?: string) => {
    setWargaToEdit(null);
    setDefaultNoKkModal(noKk);
    setIsWargaModalOpen(true);
  };

  const handleOpenEditWarga = (warga: Warga) => {
    setWargaToEdit(warga);
    setDefaultNoKkModal(warga.noKk);
    setIsWargaModalOpen(true);
  };

  const handleOpenDetailWarga = (warga: Warga) => {
    setSelectedWargaDetail(warga);
    setIsDetailModalOpen(true);
  };

  const handleGenerateSurat = (warga: Warga) => {
    setTargetSuratWarga(warga);
    setActiveTab('surat');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Top Navbar */}
      <Navbar 
        onOpenAddWarga={() => handleOpenAddWarga()}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />

      {/* Main Body with Responsive Container */}
      <div className="flex-1 flex app-container-responsive w-full max-w-7xl 2xl:max-w-[1840px] 4k:max-w-[3200px] mx-auto p-3 sm:p-4 md:p-6 2xl:p-8 4k:p-10 gap-4 md:gap-6 4k:gap-8 pb-24 md:pb-6">
        {/* Sidebar */}
        <Sidebar />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 min-w-0">
          {isWargaRole ? (
            <>
              {activeTab === 'laporan' ? (
                <LaporanPelaporan />
              ) : (
                <KartuKeluargaView 
                  onOpenAddMember={handleOpenAddWarga}
                  onOpenEditMember={handleOpenEditWarga}
                />
              )}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard />}

              {activeTab === 'warga' && (
                <WargaTable
                  onOpenAddModal={() => handleOpenAddWarga()}
                  onOpenEditModal={handleOpenEditWarga}
                  onOpenDetailModal={handleOpenDetailWarga}
                  onGenerateSurat={handleGenerateSurat}
                />
              )}

              {activeTab === 'kk' && (
                <KartuKeluargaView 
                  onOpenAddMember={handleOpenAddWarga}
                  onOpenEditMember={handleOpenEditWarga}
                />
              )}

              {activeTab === 'pkk' && <DataPesertaPKKView />}

              {activeTab === 'kas_besar' && <KasBesarView />}

              {activeTab === 'laporan' && <LaporanPelaporan />}

              {activeTab === 'surat' && (
                <SuratPengantar initialWarga={targetSuratWarga} />
              )}

              {activeTab === 'users' && <UserManagement />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Handheld phones, thumb-friendly, hidden on desktop and print) */}
      <nav id="mobile-bottom-bar" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex justify-around items-center shadow-lg print:hidden">
        {isWargaRole ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('kk')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'kk' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'kk' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <FolderGit2 className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">KK Saya</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('laporan')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'laporan' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'laporan' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">Dashboard Pelaporan</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'dashboard' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('warga')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'warga' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'warga' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <Users className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">Warga</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kk')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'kk' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'kk' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <FolderGit2 className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">KK</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kas_besar')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'kas_besar' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'kas_besar' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <Wallet className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">Kas RT</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('laporan')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'laporan' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'laporan' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">Laporan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('surat')}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
                activeTab === 'surat' ? 'text-emerald-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === 'surat' ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                <Mail className="w-4 h-4" />
              </div>
              <span className="mt-0.5 leading-tight">Surat</span>
            </button>
          </>
        )}
      </nav>

      {/* System Footer (Hidden during printing) */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 print:hidden mt-auto mb-14 md:mb-0">
        <div className="app-container-responsive max-w-7xl 2xl:max-w-[1840px] 4k:max-w-[3200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-900">BerkahOne RT 02 RW 14</span>
            <span>&bull;</span>
            <span>Kelurahan Pedurungan Tengah, Kota Semarang</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Sistem Informasi Kependudukan & Administrasi Terpadu &copy; 2026
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialTab={loginModalTab}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <WargaModal
        isOpen={isWargaModalOpen}
        onClose={() => setIsWargaModalOpen(false)}
        wargaToEdit={wargaToEdit}
        defaultNoKk={defaultNoKkModal}
      />

      <WargaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        warga={selectedWargaDetail}
        onEdit={handleOpenEditWarga}
        onGenerateSurat={handleGenerateSurat}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
