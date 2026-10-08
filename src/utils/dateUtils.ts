export function parseIndoDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Support DD/MM/YYYY or YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const isoDate = new Date(dateStr);
  return isNaN(isoDate.getTime()) ? null : isoDate;
}

export function calculateAge(dateStr: string): number {
  const birthDate = parseIndoDate(dateStr);
  if (!birthDate) return 0;
  
  const today = new Date(); // 2026 or current runtime
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function getAgeCategory(age: number): {
  label: 'Balita' | 'Anak-anak' | 'Remaja' | 'Dewasa' | 'Lansia';
  color: string;
  badgeBg: string;
} {
  if (age <= 5) {
    return { label: 'Balita', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200 text-amber-700' };
  } else if (age <= 12) {
    return { label: 'Anak-anak', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
  } else if (age <= 18) {
    return { label: 'Remaja', color: 'text-cyan-700', badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700' };
  } else if (age <= 59) {
    return { label: 'Dewasa', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-200 text-blue-700' };
  } else {
    return { label: 'Lansia', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200 text-purple-700' };
  }
}

export function formatIndoDate(dateStr: string): string {
  const d = parseIndoDate(dateStr);
  if (!d) return dateStr || '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
