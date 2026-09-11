export const ROUTES = [
  { key: 'minamino', label: '八王子みなみ野駅', shortLabel: 'みなみ野駅' },
  { key: 'hachioji', label: '八王子駅', shortLabel: '八王子駅' },
  { key: 'gakuseikaikan', label: '学生会館', shortLabel: '学生会館' },
] as const;

export type RouteKey = (typeof ROUTES)[number]['key'];
export type Direction = 'to-school' | 'to-station';
export type ServiceStatus = '通常' | 'シャトル' | '終了' | 'なし';
export type DisplayStatus = ServiceStatus | '不明';

export interface TimetableRow {
  start: string;
  station: string;
  stop: string;
  status: string;
}

export type Timetable = Record<RouteKey, TimetableRow[]>;

export interface TimetableConfig {
  defaults: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  exceptions: Record<string, string>;
}

export interface LoadedTimetables {
  today: Timetable;
  tomorrow: Timetable;
  todayKey: string;
  tomorrowKey: string;
  todayIsException: boolean;
  tomorrowIsException: boolean;
}

export interface TimetableSearchResult {
  timetable: Timetable;
  dateKey: string;
  isException: boolean;
}

export interface Trip {
  departure: string;
  arrival: string;
  departureMinutes: number;
  arrivalMinutes: number | null;
  sourceIndex: number;
  status: DisplayStatus;
}

export type UpcomingResult =
  | { kind: 'service'; trips: Trip[] }
  | { kind: 'shuttle'; trips: Trip[] }
  | { kind: 'finished'; trips: [] }
  | { kind: 'no-service'; trips: [] }
  | { kind: 'unknown'; trips: [] }
  | { kind: 'no-data'; trips: [] };

export interface DisplayRow {
  departure: string;
  arrival: string;
  status: DisplayStatus;
  sourceIndex: number;
  past: boolean;
  sentinel?: boolean;
}
