import { describe, expect, it } from 'vitest';
import { addTokyoDays, dateKey, dayType, getTokyoParts, nowMinutes, nowSeconds } from '../src/date-time';

describe('Tokyo date utilities', () => {
  it('uses Asia/Tokyo even when the Date is represented in UTC', () => {
    const date = new Date('2026-09-05T15:30:00.000Z');
    expect(dateKey(date)).toBe('2026-09-06');
    expect(nowMinutes(date)).toBe(30);
    expect(nowSeconds(date)).toBe(30 * 60);
  });

  it('handles day boundaries and weekday types', () => {
    const date = new Date('2026-12-31T12:00:00.000Z');
    expect(addTokyoDays(date, 1)).toBe('2027-01-01');
    expect(dayType('2026-09-05')).toBe('saturday');
    expect(dayType('2026-09-06')).toBe('sunday');
    expect(dayType('2026-09-07')).toBe('weekday');
    expect(getTokyoParts(date).hour).toBe(21);
  });
});
