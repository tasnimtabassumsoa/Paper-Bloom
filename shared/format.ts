export function formatBdt(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  const abs = Math.abs(safe).toLocaleString('en-US');
  return safe < 0 ? `-৳${abs}` : `৳${abs}`;
}

export function formatDiscountPercent(priceBdt: number, compareAtBdt: number | null): number | null {
  if (!compareAtBdt || compareAtBdt <= priceBdt || priceBdt <= 0) {
    return null;
  }
  const pct = Math.round(((compareAtBdt - priceBdt) / compareAtBdt) * 100);
  return pct >= 5 ? pct : null;
}

export function formatDateDhaka(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimeDhaka(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function normalizeBdPhone(raw: string): string {
  const cleaned = raw.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+880')) return cleaned.slice(3);
  if (cleaned.startsWith('880')) return cleaned.slice(2);
  return cleaned;
}
