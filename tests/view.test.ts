// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRouteCards, showTimetableDialog, updateRouteCardCountdowns } from '../src/view';
import type { LoadedTimetables } from '../src/types';

const suspendedData: LoadedTimetables = {
  today: {
    hachioji: [{ start: '', station: '', stop: '', status: 'なし' }],
    minamino: [{ start: '7:00', station: '7:10', stop: '7:20', status: '通常' }],
    gakuseikaikan: [{ start: '7:30', station: '7:40', stop: '7:50', status: '通常' }],
  },
  tomorrow: {
    hachioji: [{ start: '7:00', station: '7:10', stop: '7:20', status: '通常' }],
    minamino: [{ start: '7:00', station: '7:10', stop: '7:20', status: '通常' }],
    gakuseikaikan: [{ start: '7:30', station: '7:40', stop: '7:50', status: '通常' }],
  },
  todayKey: '2026-09-06',
  tomorrowKey: '2026-09-07',
  todayIsException: false,
  tomorrowIsException: false,
};

describe('timetable dialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('shows the explicit suspension message in the today timetable', () => {
    showTimetableDialog('本日の時刻表', suspendedData, 'hachioji', 'to-school', 600, false);

    expect(document.querySelector('.dialog-trip-list')?.textContent).toContain('本日は運休です');
    expect(document.querySelectorAll('.dialog-trip-list .trip-row')).toHaveLength(0);
  });
});

describe('route card countdown', () => {
  const data: LoadedTimetables = {
    today: {
      hachioji: [
        { start: '8:00', station: '8:10', stop: '8:30', status: '通常' },
        { start: '8:15', station: '8:25', stop: '8:45', status: '通常' },
      ],
      minamino: [{ start: '8:00', station: '8:10', stop: '8:30', status: '通常' }],
      gakuseikaikan: [{ start: '', station: '', stop: '', status: 'なし' }],
    },
    tomorrow: {
      hachioji: [],
      minamino: [],
      gakuseikaikan: [],
    },
    todayKey: '2026-09-08',
    tomorrowKey: '2026-09-09',
    todayIsException: false,
    tomorrowIsException: false,
  };

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('keeps the current trip and changes only the value to departing soon', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTo', { value: () => undefined });
    renderRouteCards(container, data, 'to-school', 490 * 60, 0, () => undefined, () => undefined, () => undefined, () => undefined);

    const currentCard = container.querySelector<HTMLElement>('[data-index="0"]');
    expect(currentCard?.textContent).toContain('次のバスまでまもなく出発');
    expect(currentCard?.textContent).toContain('8:10');
    expect(updateRouteCardCountdowns(container, data, 'to-school', 490 * 60 + 59)).toBe(false);
    expect(currentCard?.textContent).toContain('まもなく出発');
    expect(updateRouteCardCountdowns(container, data, 'to-school', 491 * 60)).toBe(true);
  });

  it('renders countdown numbers and units as separate elements', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTo', { value: () => undefined });
    renderRouteCards(container, data, 'to-school', 489 * 60 + 59, 0, () => undefined, () => undefined, () => undefined, () => undefined);

    const value = container.querySelector<HTMLElement>('[data-index="0"] .next-bus-countdown-value');
    expect(value?.textContent).toBe('00h 00m 01s');
    expect(value?.querySelectorAll('.countdown-part')).toHaveLength(3);
    expect(value?.querySelectorAll('.countdown-number')).toHaveLength(3);
    expect(value?.querySelectorAll('.countdown-unit')).toHaveLength(3);
  });

  it('does not render a countdown for a route without normal service', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTo', { value: () => undefined });
    renderRouteCards(container, data, 'to-school', 490 * 60, 0, () => undefined, () => undefined, () => undefined, () => undefined);

    expect(container.querySelector('[data-index="2"] .next-bus-countdown')).toBeNull();
  });
});

describe('endpoint labels', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps the long route label above the first timetable row', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTo', { value: () => undefined });
    renderRouteCards(container, suspendedData, 'to-school', 6 * 60 * 60, 0, () => undefined, () => undefined, () => undefined, () => undefined);

    const card = container.querySelector<HTMLElement>('[data-index="0"]');
    expect(card?.querySelector('.endpoint-labels')?.textContent).toContain('八王子みなみ野駅');
    expect(card?.querySelector('.trip-list .trip-row')).not.toBeNull();
  });
});
