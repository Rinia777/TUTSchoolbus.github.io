const TOKYO = 'Asia/Tokyo';

export interface TokyoParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TOKYO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
});

const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getTokyoParts(date: Date = new Date()): TokyoParts {
  const values: Record<string, string> = {};
  for (const { type, value } of partsFormatter.formatToParts(date)) values[type] = value;
  const weekdayName = values.weekday ?? 'Sun';
  return {
    year: Number(values.year ?? 0),
    month: Number(values.month ?? 0),
    day: Number(values.day ?? 0),
    hour: Number(values.hour ?? 0),
    minute: Number(values.minute ?? 0),
    second: Number(values.second ?? 0),
    weekday: weekdayMap[weekdayName] ?? 0,
  };
}

export function dateKey(date: Date = new Date()): string {
  const p = getTokyoParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function addTokyoDays(date: Date, days: number): string {
  const p = getTokyoParts(date);
  const utc = new Date(Date.UTC(p.year, p.month - 1, p.day + days, 12));
  return dateKey(utc);
}

export function dayType(dateKeyValue: string): 'weekday' | 'saturday' | 'sunday' {
  const [year = 0, month = 1, day = 1] = dateKeyValue.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  return weekday === 0 ? 'sunday' : weekday === 6 ? 'saturday' : 'weekday';
}

export function nowMinutes(date: Date = new Date()): number {
  const p = getTokyoParts(date);
  return p.hour * 60 + p.minute;
}

export function nowSeconds(date: Date = new Date()): number {
  const p = getTokyoParts(date);
  return p.hour * 3600 + p.minute * 60 + p.second;
}

export function formatTokyoDateTime(date: Date = new Date()): string {
  const p = getTokyoParts(date);
  return `日本時間 ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

export function formatFetchedAt(date: Date): string {
  const p = getTokyoParts(date);
  return `最終取得 ${p.month}/${p.day} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}
