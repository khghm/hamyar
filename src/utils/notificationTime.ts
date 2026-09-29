// Relative "time ago" formatter in Persian (used by the admin notification
// system). Keeps the bell dropdown and the notifications page consistent.
export function timeAgoFa(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'به‌تازگی';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'همین حالا';
  if (minutes < 60) return `${minutes.toLocaleString('fa-IR')} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString('fa-IR')} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days.toLocaleString('fa-IR')} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months.toLocaleString('fa-IR')} ماه پیش`;
  return `${Math.floor(months / 12).toLocaleString('fa-IR')} سال پیش`;
}
