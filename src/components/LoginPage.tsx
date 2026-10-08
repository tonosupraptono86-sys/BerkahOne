import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { 
  Lock, 
  User as UserIcon, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  CreditCard,
  UserPlus,
  Shield,
  Check,
  Building2,
  FileText
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, register, users, wargaList } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regNama, setRegNama] = useState('');
  const [regNik, setRegNik] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNoHp, setRegNoHp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nikMatchStatus, setNikMatchStatus] = useState<string | null>(null);

  // Realtime NIK matching for registration
  const handleNikChange = (nikVal: string) => {
    setRegNik(nikVal);
    if (nikVal.trim().length >= 10) {
      const match = wargaList.find((w) => w.nik === nikVal.trim());
      if (match) {
        setNikMatchStatus(`Warga Terverifikasi: ${match.nama} (${match.statusKeluarga}, No. KK: ${match.noKk})`);
        if (!regNama) {
          setRegNama(match.nama);
        }
      } else {
        setNikMatchStatus('NIK belum ada di daftar RT 02 (tetap dapat mendaftar mandiri)');
      }
    } else {
      setNikMatchStatus(null);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginUsername) {
      setErrorMsg('Silakan masukkan username atau NIK Anda.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const success = await login(loginUsername, loginPassword);
      setIsLoading(false);
      if (success) {
        setSuccessMsg('Login berhasil! Menyiapkan data aplikasi...');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg('Username atau kata sandi tidak cocok, atau akun telah dinonaktifkan.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Terjadi kendala saat memproses login. Silakan coba kembali.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regNama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMsg('Username wajib diisi.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        username: regUsername,
        nama: regNama,
        email: regEmail,
        password: regPassword,
        noHp: regNoHp,
        nikTerdaftar: regNik
      });

      setIsLoading(false);
      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
        }, 600);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Pendaftaran gagal. Silakan periksa kembali data Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-between text-slate-100 antialiased p-4 sm:p-6 lg:p-8">
      {/* Top Header Badge */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-white/10 text-xs text-emerald-200/80">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">BERKAH RT : Bersih - Ramah Lingkungan - Ketahanan Pangan - Aman - Harmonis</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-700/50">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistem Terproteksi RT 02 RW 14 Tanjung Sari</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero & App Info */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Logo size="xl" variant="full" showSubtitle={false} theme="dark" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aplikasi Administrasi RT</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Sistim Informasi Warga <span className="text-emerald-400">RT 02 RW 14 Tanjung Sari</span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang.
              </p>
            </div>

            
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-7 bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Tab Navigation: Masuk vs Daftar */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-3.5 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 font-extrabold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk ke Sistem (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-3.5 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 font-extrabold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar Akun Warga</span>
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Alert Feedback */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              {/* TAB 1: LOGIN FORM */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Username / NIK Akun:</span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Contoh: admin atau nama pengguna..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Kata Sandi:</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi..."
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                      />
                      <span>Ingat sesi masuk di perangkat ini</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isLoading ? (
                      <span>Memverifikasi kredensial...</span>
                    ) : (
                      <>
                        <span>Masuk ke BerkahOne RT 02</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: REGISTER FORM */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      Warga RT 02 RW 14 dapat mendaftarkan akun mandiri. Masukkan NIK Anda untuk langsung terverifikasi dengan data kependudukan RT.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Nomor Induk Kependudukan (NIK):</span>
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={regNik}
                      onChange={(e) => handleNikChange(e.target.value)}
                      placeholder="16 digit NIK sesuai KTP..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                    />
                    {nikMatchStatus && (
                      <p className={`text-[11px] mt-1 font-medium ${
                        nikMatchStatus.startsWith('Warga Terverifikasi') ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {nikMatchStatus}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                      <input
                        type="text"
                        value={regNama}
                        onChange={(e) => setRegNama(e.target.value)}
                        placeholder="Nama lengkap..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Username Baru:</label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Username unik..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>No. WhatsApp / HP:</span>
                      </label>
                      <input
                        type="tel"
                        value={regNoHp}
                        onChange={(e) => setRegNoHp(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Email (Opsional):</span>
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi:</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ulangi Sandi:</label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang sandi"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-emerald-600 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
                  >
                    {isLoading ? (
                      <span>Memproses Pendaftaran...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Daftar Akun Warga Sekarang</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer security badge */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enkripsi Kredensial SHA-256 & Salted Hash</span>
              </div>
              <span className="text-slate-400">Aplikasi Resmi RT 02 RW 14 Pedurungan Tengah</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="max-w-4xl w-full mx-auto py-3 text-center text-xs text-slate-400 border-t border-white/10">
        &copy; 2026 BerkahOne &bull; RT 02 RW 14 Tanjung Sari, Kelurahan Pedurungan Tengah, Semarang
      </footer>
    </div>
  );
};
