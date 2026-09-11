import { addTokyoDays, dateKey, dayType } from './date-time';
import type { LoadedTimetables, RouteKey, Timetable, TimetableConfig, TimetableRow, TimetableSearchResult } from './types';

const routeKeys: RouteKey[] = ['hachioji', 'minamino', 'gakuseikaikan'];
const basePath = './bustimelist/';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateConfig(value: unknown): TimetableConfig {
  if (!isRecord(value) || !isRecord(value.defaults) || !isRecord(value.exceptions)) throw new Error('時刻表の設定を読み込めませんでした。');
  const defaults = value.defaults;
  if (!['weekday', 'saturday', 'sunday'].every((key) => typeof defaults[key] === 'string')) throw new Error('時刻表の設定が不正です。');
  const exceptions: Record<string, string> = {};
  for (const [key, file] of Object.entries(value.exceptions)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || typeof file !== 'string') throw new Error('日付別時刻表の設定が不正です。');
    exceptions[key] = file;
  }
  return { defaults: defaults as TimetableConfig['defaults'], exceptions };
}

function validateRow(value: unknown): TimetableRow {
  if (!isRecord(value) || !['start', 'station', 'stop', 'status'].every((key) => typeof value[key] === 'string')) throw new Error('時刻表の行が不正です。');
  return { start: value.start as string, station: value.station as string, stop: value.stop as string, status: value.status as string };
}

function validateTimetable(value: unknown): Timetable {
  if (!isRecord(value)) throw new Error('時刻表データが不正です。');
  const result = {} as Timetable;
  for (const key of routeKeys) {
    if (!Array.isArray(value[key])) throw new Error(`時刻表のルート ${key} が不正です。`);
    result[key] = (value[key] as unknown[]).map(validateRow);
  }
  return result;
}

async function fetchJson<T>(url: string, validate: (value: unknown) => T): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`時刻表データを取得できませんでした（${response.status}）。`);
  return validate(await response.json() as unknown);
}

export function resolveTimetableFile(config: TimetableConfig, key: string): string {
  return config.exceptions[key] ?? config.defaults[dayType(key)];
}

function isValidDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export async function loadTimetableForDate(targetDateKey: string): Promise<TimetableSearchResult> {
  if (!isValidDateKey(targetDateKey)) throw new Error('検索する日付が不正です。');
  const config = await fetchJson(`${basePath}config.json`, validateConfig);
  const timetable = await fetchJson(`${basePath}${resolveTimetableFile(config, targetDateKey)}`, validateTimetable);
  return { timetable, dateKey: targetDateKey, isException: Object.prototype.hasOwnProperty.call(config.exceptions, targetDateKey) };
}

export async function loadTimetables(now: Date = new Date()): Promise<LoadedTimetables> {
  const todayKey = dateKey(now);
  const tomorrowKey = addTokyoDays(now, 1);
  const config = await fetchJson(`${basePath}config.json`, validateConfig);
  const [today, tomorrow] = await Promise.all([
    fetchJson(`${basePath}${resolveTimetableFile(config, todayKey)}`, validateTimetable),
    fetchJson(`${basePath}${resolveTimetableFile(config, tomorrowKey)}`, validateTimetable),
  ]);
  return {
    today,
    tomorrow,
    todayKey,
    tomorrowKey,
    todayIsException: Object.prototype.hasOwnProperty.call(config.exceptions, todayKey),
    tomorrowIsException: Object.prototype.hasOwnProperty.call(config.exceptions, tomorrowKey),
  };
}

export function createDataError(error: unknown): string {
  return error instanceof Error ? error.message : '時刻表データを取得できませんでした。';
}
