import type { Direction, DisplayRow, TimetableRow, Trip, UpcomingResult } from './types';

export interface NextBusCountdown {
  remainingSeconds: number;
  trip: Trip;
  isDepartingSoon: boolean;
}

export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? hour * 60 + minute : null;
}

export function endpointsFor(row: TimetableRow, direction: Direction): { departure: string; arrival: string } {
  return direction === 'to-school' ? { departure: row.station, arrival: row.stop } : { departure: row.start, arrival: row.station };
}

function isEndSentinel(row: TimetableRow, direction: Direction): boolean {
  const endpoint = endpointsFor(row, direction);
  return row.status === '終了' || endpoint.departure === '23:59' || endpoint.arrival === '23:59';
}

function toTrip(row: TimetableRow, direction: Direction, sourceIndex: number): Trip | null {
  const endpoint = endpointsFor(row, direction);
  const departureMinutes = parseTime(endpoint.departure);
  if (departureMinutes === null || isEndSentinel(row, direction)) return null;
  return {
    departure: endpoint.departure,
    arrival: endpoint.arrival,
    departureMinutes,
    arrivalMinutes: parseTime(endpoint.arrival),
    sourceIndex,
    status: row.status === '通常' || row.status === 'シャトル' || row.status === '終了' || row.status === 'なし' ? row.status : '不明',
  };
}

function hasShuttleBetween(rows: TimetableRow[], direction: Direction, currentMinutes: number, currentSeconds?: number): boolean {
  return rows.some((row, index) => {
    if (row.status !== 'シャトル') return false;
    let before: number | null = null;
    let after: number | null = null;
    for (let i = index - 1; i >= 0 && before === null; i -= 1) { const candidate = rows[i]; if (candidate) before = toTrip(candidate, direction, i)?.departureMinutes ?? null; }
    for (let i = index + 1; i < rows.length && after === null; i += 1) { const candidate = rows[i]; if (candidate) after = toTrip(candidate, direction, i)?.departureMinutes ?? null; }
    const current = currentSeconds === undefined ? currentMinutes : currentSeconds / 60;
    return (before === null || current >= before) && (after === null || current < after);
  });
}

export function upcomingTrips(rows: TimetableRow[], direction: Direction, currentMinutes: number, currentSeconds?: number): UpcomingResult {
  if (!rows.length) return { kind: 'no-data', trips: [] };
  const trips = rows.map((row, index) => toTrip(row, direction, index)).filter((trip): trip is Trip => trip !== null);
  const candidates = trips.filter((trip) => {
    if (trip.status !== '通常') return false;
    return trip.departureMinutes >= currentMinutes;
  }).slice(0, 3);
  if (candidates.length) {
    return hasShuttleBetween(rows, direction, currentMinutes, currentSeconds) ? { kind: 'shuttle', trips: candidates } : { kind: 'service', trips: candidates };
  }
  if (hasShuttleBetween(rows, direction, currentMinutes, currentSeconds)) return { kind: 'shuttle', trips: [] };
  if (rows.some((row) => row.status === 'なし')) return { kind: 'no-service', trips: [] };
  if (rows.some((row) => row.status !== '通常' && row.status !== '終了' && row.status !== 'シャトル')) return { kind: 'unknown', trips: [] };
  return { kind: 'finished', trips: [] };
}

/**
 * Returns the remaining seconds for the first scheduled normal trip.
 * The caller should pass Tokyo local seconds since midnight. A trip at the
 * current minute is intentionally included by upcomingTrips(), matching iOS.
 */
export function nextBusCountdown(result: UpcomingResult, currentSeconds: number): NextBusCountdown | null {
  const trip = result.trips[0];
  if (!trip || result.kind !== 'service') return null;
  const currentMinutes = Math.floor(currentSeconds / 60);
  return {
    remainingSeconds: Math.max(0, trip.departureMinutes * 60 - currentSeconds),
    trip,
    isDepartingSoon: currentMinutes === trip.departureMinutes && currentSeconds >= trip.departureMinutes * 60,
  };
}

export function allDisplayRows(rows: TimetableRow[], direction: Direction, currentMinutes: number, tomorrow = false): DisplayRow[] {
  return rows.flatMap((row, sourceIndex): DisplayRow[] => {
    if (isEndSentinel(row, direction)) return [];
    const endpoint = endpointsFor(row, direction);
    const departureMinutes = parseTime(endpoint.departure);
    if (row.status === 'シャトル' || endpoint.departure === '〜') {
      return [{ departure: 'シャトル', arrival: '運行中', status: 'シャトル' as const, sourceIndex, past: false }];
    }
    if (departureMinutes === null) return [{ departure: '—', arrival: '—', status: '不明', sourceIndex, past: false }];
    return [{ departure: endpoint.departure, arrival: endpoint.arrival, status: row.status === '通常' ? '通常' : '不明', sourceIndex, past: !tomorrow && departureMinutes < currentMinutes }];
  });
}

export function statusLabel(result: UpcomingResult): string {
  switch (result.kind) {
    case 'service': return '通常運行';
    case 'shuttle': return 'シャトル運行中';
    case 'finished': return '本日の運行は終了しました';
    case 'no-service': return '本日は運休です';
    case 'unknown': return '運行情報を確認できません';
    default: return '時刻表データがありません';
  }
}
