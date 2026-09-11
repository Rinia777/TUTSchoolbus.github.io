import { describe, expect, it } from 'vitest';
import { allDisplayRows, endpointsFor, nextBusCountdown, parseTime, upcomingTrips } from '../src/timetable';
import type { TimetableRow } from '../src/types';

const normal = (start: string, station: string, stop: string): TimetableRow => ({ start, station, stop, status: '通常' });

describe('timetable logic', () => {
  it('maps endpoints for both directions and accepts one-digit hours', () => {
    const row = normal('7:05', '7:15', '7:35');
    expect(endpointsFor(row, 'to-school')).toEqual({ departure: '7:15', arrival: '7:35' });
    expect(endpointsFor(row, 'to-station')).toEqual({ departure: '7:05', arrival: '7:15' });
    expect(parseTime('7:05')).toBe(425);
    expect(parseTime('25:00')).toBeNull();
  });

  it('returns up to three current-or-future trips, including the same minute', () => {
    const rows = [normal('7:00', '8:00', '8:20'), normal('7:20', '8:10', '8:30'), normal('7:40', '8:20', '8:40'), normal('8:00', '8:30', '8:50')];
    const result = upcomingTrips(rows, 'to-school', 490);
    expect(result.kind).toBe('service');
    expect(result.trips.map((trip) => trip.departure)).toEqual(['8:10', '8:20', '8:30']);
  });

  it('calculates the countdown from the first upcoming trip', () => {
    const rows = [normal('7:00', '8:10', '8:30'), normal('7:20', '8:25', '8:45')];
    const before = nextBusCountdown(upcomingTrips(rows, 'to-school', 489, 489 * 60 + 59), 489 * 60 + 59);
    expect(before?.remainingSeconds).toBe(1);
    expect(before?.isDepartingSoon).toBe(false);

    const atDeparture = nextBusCountdown(upcomingTrips(rows, 'to-school', 490, 490 * 60), 490 * 60);
    expect(atDeparture?.remainingSeconds).toBe(0);
    expect(atDeparture?.isDepartingSoon).toBe(true);

    for (const second of [1, 30, 59]) {
      const result = upcomingTrips(rows, 'to-school', 490, 490 * 60 + second);
      expect(result.trips[0]?.departure).toBe('8:10');
      expect(nextBusCountdown(result, 490 * 60 + second)?.isDepartingSoon).toBe(true);
    }

    const after = upcomingTrips(rows, 'to-school', 491, 491 * 60);
    expect(after.trips[0]?.departure).toBe('8:25');
    expect(nextBusCountdown(after, 491 * 60)?.remainingSeconds).toBe(14 * 60);
    expect(nextBusCountdown(after, 491 * 60)?.isDepartingSoon).toBe(false);
    expect(nextBusCountdown(upcomingTrips(rows, 'to-school', 540), 540 * 60)).toBeNull();
  });

  it('does not calculate a countdown for suspended or finished service', () => {
    expect(nextBusCountdown({ kind: 'no-service', trips: [] }, 500 * 60)).toBeNull();
    expect(nextBusCountdown({ kind: 'finished', trips: [] }, 500 * 60)).toBeNull();
    expect(nextBusCountdown({ kind: 'shuttle', trips: [] }, 500 * 60)).toBeNull();
  });

  it('distinguishes shuttle, no-service, finished, unknown, and sentinel rows', () => {
    const shuttle: TimetableRow = { start: '〜', station: '〜', stop: '〜', status: 'シャトル' };
    expect(upcomingTrips([normal('7:00', '8:00', '8:20'), shuttle, normal('7:30', '8:30', '8:50')], 'to-school', 500).kind).toBe('shuttle');
    expect(upcomingTrips([{ start: '', station: '', stop: '', status: 'なし' }], 'to-school', 500).kind).toBe('no-service');
    expect(upcomingTrips([normal('7:00', '8:00', '8:20'), { start: '23:59', station: '23:59', stop: '23:59', status: '終了' }], 'to-school', 600).kind).toBe('finished');
    expect(upcomingTrips([{ start: '8:00', station: '8:10', stop: '8:20', status: '不明な状態' }], 'to-school', 400).kind).toBe('unknown');
  });

  it('marks only today past rows and excludes the end sentinel', () => {
    const rows = [normal('7:00', '8:00', '8:20'), normal('8:30', '8:40', '9:00'), { start: '23:59', station: '23:59', stop: '23:59', status: '終了' }];
    expect(allDisplayRows(rows, 'to-school', 510).map((row) => row.past)).toEqual([true, false]);
    expect(allDisplayRows(rows, 'to-school', 510, true).map((row) => row.past)).toEqual([false, false]);
  });
});
