import { createDataError } from './data-source';
import { dateKey, formatTokyoDateTime } from './date-time';
import { allDisplayRows, endpointsFor, nextBusCountdown, parseTime, statusLabel, upcomingTrips } from './timetable';
import { ROUTES } from './types';
import type { Direction, LoadedTimetables, RouteKey, Timetable, TimetableRow, TimetableSearchResult, UpcomingResult } from './types';

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function statusClass(result: UpcomingResult): string {
  return `status-${result.kind}`;
}

function routeStatusLabel(result: UpcomingResult, isException: boolean): string {
  if (result.kind === 'no-service') return '運休';
  if (isException && (result.kind === 'service' || result.kind === 'shuttle')) return '臨時運行';
  return statusLabel(result);
}

function renderCountdownValue(element: HTMLElement, countdown: ReturnType<typeof nextBusCountdown>): void {
  const value = element.querySelector<HTMLElement>('.next-bus-countdown-value');
  if (!value || !countdown) return;
  if (countdown.isDepartingSoon) {
    value.replaceChildren();
    value.textContent = 'まもなく出発';
    return;
  }

  const parts: Array<[number, string]> = [
    [Math.floor(countdown.remainingSeconds / 3600), 'h'],
    [Math.floor((countdown.remainingSeconds % 3600) / 60), 'm'],
    [countdown.remainingSeconds % 60, 's'],
  ];
  value.replaceChildren();
  parts.forEach(([number, unit], index) => {
    if (index > 0) value.append(' ');
    const part = createElement('span', 'countdown-part');
    const numberElement = createElement('span', 'countdown-number');
    numberElement.textContent = String(number).padStart(2, '0');
    const unitElement = createElement('span', 'countdown-unit');
    unitElement.textContent = unit;
    part.append(numberElement, unitElement);
    value.append(part);
  });
}

function setCountdownText(element: HTMLElement, countdown: ReturnType<typeof nextBusCountdown>): void {
  renderCountdownValue(element, countdown);
}

function renderNextBusCountdown(result: UpcomingResult, currentSeconds: number): HTMLElement | null {
  const countdown = nextBusCountdown(result, currentSeconds);
  if (!countdown) return null;
  const element = createElement('p', 'next-bus-countdown');
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  const label = createElement('span', 'next-bus-countdown-label');
  label.textContent = '次のバスまで';
  const value = createElement('span', 'next-bus-countdown-value');
  element.append(label, value);
  renderCountdownValue(element, countdown);
  return element;
}

export function renderRoutePicker(container: HTMLElement, selected: number, onSelect: (index: number) => void): void {
  container.replaceChildren(...ROUTES.map((route, index) => {
    const button = createElement('button', 'route-choice');
    button.type = 'button';
    button.textContent = route.shortLabel;
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `${route.label}を表示`);
    button.setAttribute('aria-current', index === selected ? 'true' : 'false');
    button.addEventListener('click', () => onSelect(index));
    return button;
  }));
}

function renderTripRow(trip: { departure: string; arrival: string }, index: number): HTMLElement {
  const row = createElement('div', 'trip-row');
  row.setAttribute('role', 'listitem');
  const departure = createElement('div', 'trip-time');
  const departureValue = createElement('span', 'time-value');
  departureValue.textContent = trip.departure;
  const departureLabel = createElement('span', 'time-label');
  departureLabel.textContent = '発';
  departure.append(departureValue, departureLabel);
  const arrow = createElement('span', 'trip-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  const arrival = createElement('div', 'trip-time');
  const arrivalValue = createElement('span', 'time-value');
  arrivalValue.textContent = trip.arrival;
  const arrivalLabel = createElement('span', 'time-label');
  arrivalLabel.textContent = '着';
  arrival.append(arrivalValue, arrivalLabel);
  row.append(departure, arrow, arrival);
  row.setAttribute('aria-label', `${index + 1}便 ${trip.departure}発、${trip.arrival}着`);
  return row;
}

function renderStatusMessage(result: UpcomingResult): HTMLElement {
  const message = createElement('p', `card-status-message ${statusClass(result)}`);
  message.textContent = statusLabel(result);
  return message;
}

function createTimetableDialog(title: string, timetable: Timetable, routeKey: RouteKey, direction: Direction, currentMinutes: number, tomorrow: boolean): HTMLDialogElement {
  const dialog = createElement('dialog', 'timetable-dialog');
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  const inner = createElement('div', 'dialog-inner');
  const heading = createElement('div', 'dialog-heading');
  const titleElement = createElement('h2');
  titleElement.id = 'dialog-title';
  titleElement.textContent = title;
  const close = createElement('button', 'dialog-close');
  close.type = 'button';
  close.setAttribute('aria-label', '閉じる');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  heading.append(titleElement, close);
  const list = createElement('div', 'dialog-routes');
  const route = ROUTES.find((candidate) => candidate.key === routeKey) ?? ROUTES[0];
  if (!route) return dialog;
  {
    const section = createElement('section', 'dialog-route');
    const endpointLabels = createElement('div', 'endpoint-labels dialog-endpoint-labels');
    const departureLabel = createElement('span');
    departureLabel.textContent = direction === 'to-school' ? route.label : '大学';
    const arrivalLabel = createElement('span');
    arrivalLabel.textContent = direction === 'to-school' ? '大学' : route.label;
    endpointLabels.append(departureLabel, arrivalLabel);
    const rows = createElement('div', 'dialog-trip-list');
    const routeRows = timetable[route.key];
    const upcoming = upcomingTrips(routeRows, direction, currentMinutes);
    const displayRows = !tomorrow && upcoming.kind === 'no-service'
      ? []
      : allDisplayRows(routeRows, direction, currentMinutes, tomorrow);
    const finalSourceIndex = tomorrow ? [...displayRows].reverse().find((row) => row.status === '通常')?.sourceIndex : undefined;
    for (const row of displayRows) {
      if (row.sourceIndex === finalSourceIndex) {
        const finalLabel = createElement('p', 'dialog-final-label');
        finalLabel.textContent = '最終バス';
        rows.append(finalLabel);
      }
      const tripRow = renderTripRow({ departure: row.departure, arrival: row.arrival }, row.sourceIndex);
      tripRow.classList.toggle('is-past', row.past);
      if (row.status === 'シャトル') tripRow.classList.add('is-shuttle');
      rows.append(tripRow);
    }
    if (!displayRows.length) rows.append(renderStatusMessage(upcoming));
    section.append(endpointLabels, rows);
    list.append(section);
  }
  inner.append(heading, list);
  dialog.append(inner);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  return dialog;
}

function formatSearchDate(targetDateKey: string): string {
  const [year = '', month = '', day = ''] = targetDateKey.split('-');
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

function shuttleRangeText(rows: TimetableRow[], direction: Direction, sourceIndex: number): string {
  let before: string | null = null;
  let after: string | null = null;
  for (let index = sourceIndex - 1; index >= 0 && before === null; index -= 1) {
    const row = rows[index];
    if (!row || row.status !== '通常') continue;
    const departure = endpointsFor(row, direction).departure;
    if (parseTime(departure) !== null) before = departure;
  }
  for (let index = sourceIndex + 1; index < rows.length && after === null; index += 1) {
    const row = rows[index];
    if (!row || row.status !== '通常') continue;
    const departure = endpointsFor(row, direction).departure;
    if (parseTime(departure) !== null) after = departure;
  }
  return before && after ? `${before} 〜 ${after}` : 'シャトル運行中';
}

function renderSearchRows(container: HTMLElement, rows: TimetableRow[], direction: Direction): void {
  const displayRows = allDisplayRows(rows, direction, 0, true);
  const finalSourceIndex = [...displayRows].reverse().find((row) => row.status === '通常')?.sourceIndex;
  displayRows.forEach((row, index) => {
    if (row.status === 'シャトル') {
      const shuttle = createElement('div', 'search-shuttle-row');
      shuttle.setAttribute('role', 'listitem');
      const label = createElement('strong');
      label.textContent = 'シャトル運行中';
      const range = createElement('span');
      range.textContent = shuttleRangeText(rows, direction, row.sourceIndex);
      shuttle.append(label, range);
      container.append(shuttle);
      return;
    }
    if (row.sourceIndex === finalSourceIndex) {
      const finalLabel = createElement('p', 'search-final-label');
      finalLabel.textContent = '最終バス';
      container.append(finalLabel);
    }
    const tripRow = renderTripRow({ departure: row.departure, arrival: row.arrival }, index);
    if (row.status === '不明') tripRow.classList.add('is-unknown');
    container.append(tripRow);
  });
}

function createTimetableSearchDialog(routeKey: RouteKey, direction: Direction, trigger: HTMLElement, onSearch: (targetDateKey: string) => Promise<TimetableSearchResult>): HTMLDialogElement {
  const dialog = createElement('dialog', 'timetable-dialog search-dialog');
  dialog.setAttribute('aria-labelledby', 'search-dialog-title');
  const inner = createElement('div', 'dialog-inner');
  const heading = createElement('div', 'dialog-heading');
  const title = createElement('h2');
  title.id = 'search-dialog-title';
  title.textContent = '時刻表検索';
  const close = createElement('button', 'dialog-close');
  close.type = 'button';
  close.setAttribute('aria-label', '閉じる');
  close.textContent = '×';
  close.addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.remove();
  });
  heading.append(title, close);

  const form = createElement('form', 'search-controls');
  const dateLabel = createElement('label', 'search-date-label');
  dateLabel.textContent = '日付選択';
  const dateInput = createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'timetable-search-date';
  dateInput.name = 'date';
  dateInput.value = dateKey();
  dateInput.required = true;
  dateLabel.htmlFor = dateInput.id;
  dateLabel.append(dateInput);
  const submit = createElement('button', 'table-button search-submit');
  submit.type = 'submit';
  submit.textContent = '検索';
  form.append(dateLabel, submit);

  const status = createElement('p', 'search-status');
  status.setAttribute('role', 'status');
  status.textContent = '日付を選択して検索してください。';
  const result = createElement('div', 'search-result');
  result.hidden = true;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!dateInput.value) {
      status.hidden = false;
      status.className = 'search-status search-status-error';
      status.textContent = '検索する日付を選択してください。';
      result.hidden = true;
      return;
    }
    status.hidden = false;
    status.className = 'search-status';
    status.textContent = '検索中…';
    submit.disabled = true;
    submit.textContent = '検索中…';
    dateInput.disabled = true;
    void onSearch(dateInput.value).then((searchResult) => {
      const route = ROUTES.find((candidate) => candidate.key === routeKey) ?? ROUTES[0];
      if (!route) throw new Error('ルート情報を読み込めませんでした。');
      const rows = searchResult.timetable[routeKey];
      const dateHeading = createElement('p', 'search-result-date');
      dateHeading.textContent = formatSearchDate(searchResult.dateKey);
      const operationStatus = createElement('p', 'search-operation-status');
      const isSuspended = rows.length === 1 && rows[0]?.status === 'なし';
      operationStatus.textContent = isSuspended ? '運休' : searchResult.isException ? '臨時運行' : '通常運行';
      operationStatus.className = `search-operation-status ${isSuspended || searchResult.isException ? 'is-alert' : ''}`;
      const endpoints = createElement('div', 'search-endpoints');
      const start = createElement('span');
      start.textContent = direction === 'to-school' ? route.label : '大学';
      const end = createElement('span');
      end.textContent = direction === 'to-school' ? '大学' : route.label;
      endpoints.append(start, end);
      const list = createElement('div', 'search-trip-list');
      if (isSuspended) {
        const message = createElement('p', 'search-empty-message');
        message.textContent = '選択日のバスの運行は\nありません';
        list.append(message);
      } else if (!rows.length) {
        const message = createElement('p', 'search-empty-message');
        message.textContent = '時刻表の取得に失敗しました';
        list.append(message);
      } else {
        renderSearchRows(list, rows, direction);
      }
      result.replaceChildren(dateHeading, operationStatus, endpoints, list);
      result.hidden = false;
      status.hidden = true;
    }).catch((error: unknown) => {
      result.hidden = true;
      status.hidden = false;
      status.className = 'search-status search-status-error';
      status.textContent = createDataError(error);
    }).finally(() => {
      submit.disabled = false;
      submit.textContent = '検索';
      dateInput.disabled = false;
    });
  });

  inner.append(heading, form, status, result);
  dialog.append(inner);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    dialog.remove();
    trigger.focus();
  }, { once: true });
  return dialog;
}

export function renderRouteCards(container: HTMLElement, data: LoadedTimetables | null, direction: Direction, currentSeconds: number, selected: number, onToday: (route: RouteKey) => void, onTomorrow: (route: RouteKey) => void, onRefresh: () => void, onSearch: (route: RouteKey, trigger: HTMLElement) => void): void {
  const currentMinutes = Math.floor(currentSeconds / 60);
  const cards = ROUTES.map((route, index) => {
    const card = createElement('article', 'route-card');
    card.dataset.index = String(index);
    card.setAttribute('aria-label', `${route.label}の時刻表`);
    const heading = createElement('header', 'route-card-heading');
    const title = createElement('h2');
    title.textContent = direction === 'to-school' ? `${route.label}発` : `${route.label}行き`;
    const refresh = createElement('button', 'card-refresh-button');
    refresh.type = 'button';
    refresh.setAttribute('aria-label', '時刻表を再読み込み');
    refresh.title = '時刻表を再読み込み';
    refresh.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11a8 8 0 0 0-14.9-4L3 9m0 0V4m0 5h5M4 13a8 8 0 0 0 14.9 4L21 15m0 0v5m0-5h-5" /></svg>';
    refresh.addEventListener('click', onRefresh);
    heading.append(title, refresh);
    card.append(heading);
    if (!data) {
      const empty = createElement('div', 'card-empty');
      empty.textContent = '時刻表を読み込んでいます…';
      card.append(empty);
      return card;
    }
    const result = upcomingTrips(data.today[route.key], direction, currentMinutes, currentSeconds);
    const isTemporary = data.todayIsException && (result.kind === 'service' || result.kind === 'shuttle');
    const state = createElement('p', `service-state ${statusClass(result)}${isTemporary ? ' status-temporary' : ''}`);
    state.textContent = routeStatusLabel(result, data.todayIsException);
    card.append(state);
    card.dataset.displayState = `${result.kind}:${result.trips[0]?.departure ?? ''}`;
    const countdown = renderNextBusCountdown(result, currentSeconds);
    if (countdown) card.append(countdown);
    const endpoints = data.today[route.key].find((row) => row.status === '通常');
    const labels = createElement('div', 'endpoint-labels');
    const endpoint = endpoints ? endpointsFor(endpoints, direction) : { departure: '出発', arrival: '到着' };
    labels.append(Object.assign(createElement('span'), { textContent: endpoint.departure === '〜' ? '出発' : direction === 'to-school' ? route.label : '大学' }), Object.assign(createElement('span'), { textContent: direction === 'to-school' ? '大学' : route.label }));
    card.append(labels);
    const tripList = createElement('div', 'trip-list');
    if (result.trips.length) result.trips.forEach((trip, tripIndex) => tripList.append(renderTripRow(trip, tripIndex)));
    else tripList.append(renderStatusMessage(result));
    card.append(tripList);
    const actions = createElement('div', 'card-actions');
    const todayButton = createElement('button', 'table-button');
    todayButton.type = 'button'; todayButton.textContent = '本日の時刻表'; todayButton.addEventListener('click', () => onToday(route.key));
    const tomorrowButton = createElement('button', 'table-button');
    tomorrowButton.type = 'button'; tomorrowButton.textContent = '明日の時刻表'; tomorrowButton.addEventListener('click', () => onTomorrow(route.key));
    actions.append(todayButton, tomorrowButton);
    const searchActions = createElement('div', 'card-search-action');
    const searchButton = createElement('button', 'table-button search-button');
    searchButton.type = 'button';
    searchButton.textContent = '時刻表検索';
    searchButton.addEventListener('click', () => onSearch(route.key, searchButton));
    searchActions.append(searchButton);
    card.append(actions, searchActions);
    return card;
  });
  container.replaceChildren(...cards);
  requestAnimationFrame(() => {
    const selectedCard = container.querySelector<HTMLElement>(`[data-index="${selected}"]`);
    if (!selectedCard) return;
    const left = selectedCard.offsetLeft - (container.clientWidth - selectedCard.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
  });
}

export function updateRouteCardCountdowns(container: HTMLElement, data: LoadedTimetables | null, direction: Direction, currentSeconds: number): boolean {
  if (!data) return false;
  const currentMinutes = Math.floor(currentSeconds / 60);
  let needsRender = false;
  ROUTES.forEach((route, index) => {
    const card = container.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!card) return;
    const result = upcomingTrips(data.today[route.key], direction, currentMinutes, currentSeconds);
    const displayState = `${result.kind}:${result.trips[0]?.departure ?? ''}`;
    if (card.dataset.displayState !== displayState) {
      needsRender = true;
      return;
    }
    const element = card.querySelector<HTMLElement>('.next-bus-countdown');
    const countdown = nextBusCountdown(result, currentSeconds);
    if (element && countdown) setCountdownText(element, countdown);
  });
  return needsRender;
}

export function showTimetableDialog(title: string, data: LoadedTimetables, routeKey: RouteKey, direction: Direction, currentMinutes: number, tomorrow: boolean): void {
  const dialog = createTimetableDialog(title, tomorrow ? data.tomorrow : data.today, routeKey, direction, currentMinutes, tomorrow);
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
}

export function showTimetableSearchDialog(routeKey: RouteKey, direction: Direction, trigger: HTMLElement, onSearch: (targetDateKey: string) => Promise<TimetableSearchResult>): void {
  const dialog = createTimetableSearchDialog(routeKey, direction, trigger, onSearch);
  document.body.append(dialog);
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  dialog.querySelector<HTMLInputElement>('#timetable-search-date')?.focus();
}

export function updateClock(element: HTMLElement): void {
  element.textContent = formatTokyoDateTime();
}
