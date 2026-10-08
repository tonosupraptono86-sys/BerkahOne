import React from 'react';
import { useApp } from '../context/AppContext';
import { Warga } from '../types';
import { calculateAge, getAgeCategory, formatIndoDate } from '../utils/dateUtils';
import { 
  X, 
  User, 
  MapPin, 
  FolderGit2, 
  FileText, 
  Edit, 
  Baby, 
  HeartHandshake, 
  GraduationCap, 
  Calendar,
  CreditCard,
  ShieldCheck,
  Phone,
  MessageSquare,
  UserCheck,
  Flower2
} from 'lucide-react';

interface WargaDetailModalProps {
  warga: Warga | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (warga: Warga) => void;
  onGenerateSurat: (warga: Warga) => void;
}

export const WargaDetailModal: React.FC<WargaDetailModalProps> = ({
  warga,
  isOpen,
  onClose,
  onEdit,
  onGenerateSurat
}) => {
  const { wargaList, pesertaPKKList, setSelectedKK, setActiveTab, hasPermission } = useApp();

  if (!isOpen || !warga) return null;

  const age = calculateAge(warga.tglLahir);
  const ageCat = getAgeCategory(age);

  // PKK Membership lookup if status is Istri
  const pkkMember = warga.statusKeluarga === 'Istri' 
    ? pesertaPKKList.find((p) => (p.wargaId && p.wargaId === warga.id) || (p.nik && p.nik === warga.nik))
    : null;

  // Other members in the same KK
  const familyMembers = wargaList.filter(
    (w) => w.noKk === warga.noKk && w.id !== warga.id
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base ${
              warga.jenisKelamin === 'Laki-laki' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-pink-100 text-pink-800'
            }`}>
              {warga.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{warga.nama}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${ageCat.badgeBg}`}>
                  {ageCat.label} ({age} Th)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                NIK: {warga.nik}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 py-4 text-xs text-slate-700">
          {/* Identity Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status di Keluarga</span>
              <span className="font-bold text-slate-900">{warga.statusKeluarga}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status Perkawinan</span>
              <span className="font-bold text-slate-900">{warga.statusPerkawinan}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tempat, Tanggal Lahir</span>
              <span className="font-medium text-slate-800">{warga.tempatLahir}, {warga.tglLahir}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Agama</span>
              <span className="font-medium text-slate-800">{warga.agama}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pendidikan Terakhir</span>
              <span className="font-medium text-slate-800">{warga.pendidikan}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status Domisili</span>
              <span className="font-bold text-emerald-800">{warga.domisili}</span>
            </div>
          </div>

          {/* Alamat & KK */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700">Alamat Tempat Tinggal:</span>
                <p className="text-slate-600">{warga.alamat}</p>
              </div>
            </div>

            {/* Person Kontak & No. HP Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Informasi Kontak &amp; Person Kontak
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Person Kontak:</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{warga.personKontak || (warga.statusKeluarga === 'Kepala Keluarga' ? `${warga.nama} (Kepala Keluarga)` : '-')}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Nomor HP / WhatsApp:</span>
                  {warga.noHp || warga.telepon ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-slate-900">{warga.noHp || warga.telepon}</span>
                      <a
                        href={`https://wa.me/${(warga.noHp || warga.telepon || '').replace(/\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors"
                        title="Chat WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WA</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">- Belum ada no. hp -</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="text-[10px] text-emerald-800 font-semibold uppercase">Nomor Kartu Keluarga</div>
                  <div className="font-mono font-bold text-slate-900">{warga.noKk}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedKK(warga.noKk);
                  setActiveTab('kk');
                  onClose();
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer"
              >
                Lihat Kartu Keluarga
              </button>
            </div>

            {/* Hubungan ke Data Peserta PKK untuk Warga Berstatus Istri */}
            {warga.statusKeluarga === 'Istri' && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Flower2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">
                      Terhubung ke Data Peserta PKK RT 02
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {pkkMember?.jabatan || 'Anggota PKK'} • {pkkMember?.pokja || 'Anggota Umum'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Status Keluarga: Istri
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('pkk');
                    onClose();
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg cursor-pointer shadow-2xs"
                >
                  Buka Data PKK
                </button>
              </div>
            )}
          </div>

          {/* Family members inside same KK */}
          {familyMembers.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Anggota Keluarga Lainnya ({familyMembers.length} Jiwa):
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {familyMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{m.nama}</span>
                      <span className="text-slate-400 ml-2 font-mono text-[10px]">({m.nik})</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                      {m.statusKeluarga}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onGenerateSurat(warga);
              }}
              className="px-3 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Buat Surat Pengantar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission('manage_warga') && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(warga);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Ubah</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
