import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Warga } from '../types';
import { X, Save, UserPlus, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

interface WargaModalProps {
  isOpen: boolean;
  onClose: () => void;
  wargaToEdit?: Warga | null;
  defaultNoKk?: string;
}

export const WargaModal: React.FC<WargaModalProps> = ({
  isOpen,
  onClose,
  wargaToEdit,
  defaultNoKk
}) => {
  const { addWarga, updateWarga, currentUser, userNoKk, wargaList } = useApp();
  const isWargaRole = currentUser?.role === 'warga';

  const [formData, setFormData] = useState<Partial<Warga>>({
    nama: '',
    nik: '',
    noKk: '',
    statusKeluarga: 'Kepala Keluarga',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Semarang',
    tglLahir: '1990-01-01',
    statusPerkawinan: 'Kawin',
    alamat: 'Jl. Tanjungsari RT 02 RW 14',
    domisili: 'Domisili RT 02 RW 14',
    agama: 'Islam',
    pendidikan: 'SLTA / Sederajat',
    personKontak: '',
    noHp: '',
    telepon: '',
    keterangan: ''
  });

  useEffect(() => {
    if (wargaToEdit) {
      setFormData({
        ...wargaToEdit,
        noKk: isWargaRole ? (userNoKk || wargaToEdit.noKk) : wargaToEdit.noKk,
        personKontak: wargaToEdit.personKontak || '',
        noHp: wargaToEdit.noHp || wargaToEdit.telepon || '',
        telepon: wargaToEdit.telepon || wargaToEdit.noHp || ''
      });
    } else {
      // Menambah anggota baru
      const targetKk = isWargaRole ? (userNoKk || defaultNoKk || '') : (defaultNoKk || '');
      const familySample = targetKk ? wargaList.find((w) => w.noKk === targetKk) : null;

      setFormData({
        nama: '',
        nik: '',
        noKk: targetKk,
        statusKeluarga: isWargaRole ? 'Anak' : 'Kepala Keluarga',
        jenisKelamin: 'Laki-laki',
        tempatLahir: 'Semarang',
        tglLahir: '2005-01-01',
        statusPerkawinan: isWargaRole ? 'Belum Kawin' : 'Kawin',
        alamat: familySample?.alamat || 'Jl. Tanjungsari RT 02 RW 14 Pedurungan Tengah',
        domisili: familySample?.domisili || 'Domisili RT 02 RW 14',
        agama: familySample?.agama || 'Islam',
        pendidikan: 'SLTA / Sederajat',
        personKontak: familySample?.personKontak || familySample?.nama || '',
        noHp: '',
        telepon: '',
        keterangan: ''
      });
    }
  }, [wargaToEdit, isOpen, isWargaRole, userNoKk, defaultNoKk, wargaList]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim() || !formData.nik?.trim()) {
      alert('Nama Warga dan NIK wajib diisi!');
      return;
    }

    const assignedNoKk = isWargaRole ? (userNoKk || formData.noKk || '') : (formData.noKk || '');
    if (!assignedNoKk.trim()) {
      alert('Nomor Kartu Keluarga wajib ditentukan!');
      return;
    }

    const finalData = {
      ...formData,
      noKk: assignedNoKk,
      noHp: formData.noHp?.trim() || formData.telepon?.trim() || '',
      telepon: formData.noHp?.trim() || formData.telepon?.trim() || '',
      personKontak: formData.personKontak?.trim() || ''
    };

    if (wargaToEdit) {
      updateWarga(wargaToEdit.id, finalData);
    } else {
      addWarga(finalData as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {wargaToEdit ? 'Ubah Data Kependudukan' : 'Registrasi Warga Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Format data sesuai standar administrasi kependudukan Dukcapil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        {isWargaRole && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 mt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900">Hak Akses Warga Mandiri:</strong>{' '}
              {wargaToEdit
                ? `Anda sedang mengoreksi data anggota keluarga pada No. KK ${userNoKk || formData.noKk}.`
                : `Anda sedang menambahkan anggota baru ke dalam Kartu Keluarga Anda (No. KK: ${userNoKk || formData.noKk}).`}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Nama & NIK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Lengkap Warga <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Ali Muhtarom, S.T"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="16 digit NIK..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          {/* No KK & Hubungan Keluarga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 flex items-center justify-between mb-1">
                <span>Nomor Kartu Keluarga (KK) <span className="text-red-500">*</span></span>
                {isWargaRole && (
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Terkunci pada KK Anda
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                readOnly={isWargaRole}
                disabled={isWargaRole}
                value={formData.noKk}
                onChange={(e) => !isWargaRole && setFormData({ ...formData, noKk: e.target.value })}
                placeholder="16 digit No KK..."
                className={`w-full p-2.5 rounded-xl outline-none text-xs font-mono font-medium ${
                  isWargaRole 
                    ? 'bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed font-bold' 
                    : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600'
                }`}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Status Hubungan di Keluarga
              </label>
              <select
                value={formData.statusKeluarga}
                onChange={(e) => setFormData({ ...formData, statusKeluarga: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-semibold"
              >
                <option value="Kepala Keluarga">Kepala Keluarga</option>
                <option value="Istri">Istri</option>
                <option value="Anak">Anak</option>
                <option value="Cucu">Cucu</option>
                <option value="Famili Lain">Famili Lain</option>
              </select>
            </div>
          </div>

          {/* Gender & Status Perkawinan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.jenisKelamin}
                onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Status Perkawinan
              </label>
              <select
                value={formData.statusPerkawinan}
                onChange={(e) => setFormData({ ...formData, statusPerkawinan: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
              >
                <option value="Kawin">Kawin</option>
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Janda">Janda</option>
                <option value="Duda">Duda</option>
                <option value="Meninggal">Meninggal</option>
              </select>
            </div>
          </div>

          {/* TTL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.tempatLahir}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                placeholder="Contoh: Semarang"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tanggal Lahir (DD/MM/YYYY atau YYYY-MM-DD)
              </label>
              <input
                type="text"
                value={formData.tglLahir}
                onChange={(e) => setFormData({ ...formData, tglLahir: e.target.value })}
                placeholder="22/10/1985"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Agama & Pendidikan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Agama
              </label>
              <select
                value={formData.agama}
                onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
              >
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pendidikan Terakhir
              </label>
              <input
                type="text"
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                placeholder="S1, SMA, SMP, SD..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
              />
            </div>
          </div>

          {/* Alamat & Domisili */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Alamat Rumah / Tempat Tinggal
              </label>
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Jl. Tanjungsari No. 12"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Status Domisili Wilayah
              </label>
              <select
                value={formData.domisili}
                onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-xs font-semibold"
              >
                <option value="Domisili RT 02 RW 14">Domisili RT 02 RW 14 (Tetap)</option>
                <option value="Domisili RW 14">Domisili RW 14</option>
                <option value="Domisili Luar Wilayah">Domisili Luar Wilayah / Kost</option>
              </select>
            </div>
          </div>

          {/* Person Kontak & No. HP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Person Kontak (Penanggung Jawab / Kontak Darurat)
              </label>
              <input
                type="text"
                value={formData.personKontak || ''}
                onChange={(e) => setFormData({ ...formData, personKontak: e.target.value })}
                placeholder="Contoh: Bpk. Samsul Maarif (Kepala Keluarga)"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 outline-none text-xs font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Nama orang yang dihubungi pengurus RT jika ada keperluan warga/keluarga.
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor HP / WhatsApp
              </label>
              <input
                type="text"
                value={formData.noHp || formData.telepon || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, noHp: val, telepon: val });
                }}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-emerald-600 outline-none text-xs font-mono font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Digunakan untuk notifikasi kependudukan, surat pengantar &amp; kuitansi iuran.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{wargaToEdit ? 'Simpan Perubahan' : 'Simpan Data Warga'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
