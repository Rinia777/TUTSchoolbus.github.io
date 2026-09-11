import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadTimetableForDate, loadTimetables, resolveTimetableFile } from '../src/data-source';
import type { TimetableConfig } from '../src/types';

const config: TimetableConfig = {
  defaults: { weekday: 'weekday.json', saturday: 'saturday.json', sunday: 'sunday.json' },
  exceptions: { '2026-09-07': '20260907.json' },
};

describe('data source resolution', () => {
  it('prioritizes date exceptions over weekday defaults', () => {
    expect(resolveTimetableFile(config, '2026-09-07')).toBe('20260907.json');
    expect(resolveTimetableFile(config, '2026-09-08')).toBe('weekday.json');
    expect(resolveTimetableFile(config, '2026-09-05')).toBe('saturday.json');
    expect(resolveTimetableFile(config, '2026-09-06')).toBe('sunday.json');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('fetches and validates both today and tomorrow using relative URLs', async () => {
    const timetable = { hachioji: [], minamino: [], gakuseikaikan: [] };
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push(url);
      return Promise.resolve({ ok: true, status: 200, json: async () => url.endsWith('config.json') ? config : timetable });
    }));
    const result = await loadTimetables(new Date('2026-09-06T03:00:00.000Z'));
    expect(result.todayKey).toBe('2026-09-06');
    expect(result.tomorrowKey).toBe('2026-09-07');
    expect(result.todayIsException).toBe(false);
    expect(result.tomorrowIsException).toBe(true);
    expect(calls).toEqual(['./bustimelist/config.json', './bustimelist/sunday.json', './bustimelist/20260907.json']);
  });

  it('fetches an arbitrary search date using the exception file', async () => {
    const timetable = { hachioji: [], minamino: [], gakuseikaikan: [] };
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push(url);
      return Promise.resolve({ ok: true, status: 200, json: async () => url.endsWith('config.json') ? config : timetable });
    }));
    const result = await loadTimetableForDate('2026-09-07');
    expect(result.dateKey).toBe('2026-09-07');
    expect(result.isException).toBe(true);
    expect(calls).toEqual(['./bustimelist/config.json', './bustimelist/20260907.json']);
  });

  it('rejects invalid calendar dates before fetching', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(loadTimetableForDate('2026-02-30')).rejects.toThrow('検索する日付が不正です');
    expect(fetch).not.toHaveBeenCalled();
  });
});
