import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/utilities.css';
import './styles/timetable.css';
import { scheduleAppInstallPrompt, setupAppInstallPrompt } from './app-install-prompt';
import { setupThemeControls } from './theme';
import { createDataError, loadTimetableForDate, loadTimetables } from './data-source';
import { dateKey, formatFetchedAt, nowMinutes, nowSeconds } from './date-time';
import { renderRouteCards, renderRoutePicker, showTimetableDialog, showTimetableSearchDialog, updateClock, updateRouteCardCountdowns } from './view';
import type { Direction, LoadedTimetables, RouteKey } from './types';

const directionKey = 'tut-web-direction';
const routeKey = 'tut-web-route';
const validDirections: Direction[] = ['to-school', 'to-station'];

function readDirection(): Direction {
  const value = localStorage.getItem(directionKey);
  return validDirections.includes(value as Direction) ? value as Direction : 'to-school';
}

function readRoute(): number {
  const value = Number(localStorage.getItem(routeKey));
  return Number.isInteger(value) && value >= 0 && value < 3 ? value : 1;
}

const carouselNode = document.querySelector<HTMLElement>('#route-carousel');
const pickerNode = document.querySelector<HTMLElement>('#route-picker');
const errorNode = document.querySelector<HTMLElement>('#app-error');
const fetchNode = document.querySelector<HTMLElement>('#fetch-label');
const clockNode = document.querySelector<HTMLElement>('#clock-label');
if (!carouselNode || !pickerNode || !errorNode || !fetchNode || !clockNode) throw new Error('時刻表画面の要素が見つかりません。');
const carousel = carouselNode;
const picker = pickerNode;
const errorElement = errorNode;
const fetchElement = fetchNode;
const clockElement = clockNode;
setupThemeControls();
setupAppInstallPrompt();

let direction: Direction = readDirection();
let selectedRoute = readRoute();
let loaded: LoadedTimetables | null = null;
let lastFetched: Date | null = null;
let loading = false;
let initialLoadCompleted = false;
let lastDate = dateKey();
let lastMinute = nowMinutes();

function setError(message: string): void {
  errorElement.textContent = message;
  errorElement.hidden = !message;
}

function setRefreshDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement>('.card-refresh-button').forEach((button) => { button.disabled = disabled; });
}

function updateControls(): void {
  carousel.setAttribute('aria-label', `${direction === 'to-school' ? '登校' : '下校'}、${selectedRoute + 1} / 3 のルート`);
}

function scrollRouteIntoView(index: number, behavior: ScrollBehavior = 'smooth'): void {
  const card = carousel.querySelector<HTMLElement>(`[data-index="${index}"]`);
  if (!card) return;
  const left = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;
  carousel.scrollTo({ left: Math.max(0, left), behavior });
}

function selectRoute(index: number, scroll = true): void {
  if (index < 0 || index > 2 || index === selectedRoute) return;
  selectedRoute = index;
  localStorage.setItem(routeKey, String(index));
  renderRoutePicker(picker, selectedRoute, selectRoute);
  updateControls();
  if (scroll) scrollRouteIntoView(index);
}

function render(): void {
  updateClock(clockElement);
  renderRoutePicker(picker, selectedRoute, selectRoute);
  renderRouteCards(carousel, loaded, direction, nowSeconds(), selectedRoute, (route) => openDialog(route, false), (route) => openDialog(route, true), () => void loadData(true), (route, trigger) => openSearchDialog(route, trigger));
  updateControls();
  if (lastFetched) fetchElement.textContent = formatFetchedAt(lastFetched);
}

function openDialog(route: RouteKey, tomorrow: boolean): void {
  if (!loaded) return;
  const title = tomorrow ? '明日の時刻表' : '本日の時刻表';
  showTimetableDialog(title, loaded, route, direction, nowMinutes(), tomorrow);
}

function openSearchDialog(route: RouteKey, trigger: HTMLElement): void {
  showTimetableSearchDialog(route, direction, trigger, (targetDateKey) => loadTimetableForDate(targetDateKey));
}

async function loadData(isRefresh = false): Promise<void> {
  if (loading) return;
  loading = true;
  setRefreshDisabled(true);
  if (!loaded) fetchElement.textContent = '時刻表を読み込み中...';
  try {
    loaded = await loadTimetables();
    const shouldScheduleAppPrompt = !isRefresh && !initialLoadCompleted;
    initialLoadCompleted = true;
    lastFetched = new Date();
    setError('');
    render();
    if (shouldScheduleAppPrompt) scheduleAppInstallPrompt();
    if (isRefresh) fetchElement.textContent = `${formatFetchedAt(lastFetched)}（更新しました）`;
  } catch (error) {
    setError(`${createDataError(error)} 再読み込みをお試しください。`);
    if (!loaded) render();
  } finally {
    loading = false;
    setRefreshDisabled(false);
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    const value = button.dataset.direction as Direction;
    if (!validDirections.includes(value)) return;
    direction = value;
    localStorage.setItem(directionKey, direction);
    document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === button)));
    render();
  });
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-direction]')];
    const current = tabs.indexOf(button);
    const next = event.key === 'ArrowRight' ? tabs[current + 1] : tabs[current - 1];
    if (next) { event.preventDefault(); next.focus(); next.click(); }
  });
});

carousel.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); selectRoute(selectedRoute - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); selectRoute(selectedRoute + 1); }
});

type DragState = { pointerId: number; startX: number; startY: number; startScrollLeft: number; moved: boolean };
let dragState: DragState | null = null;
let suppressClick = false;
let suppressClickTimer: number | undefined;

carousel.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const target = event.target;
  if (target instanceof Element && target.closest('button, a')) return;
  dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startScrollLeft: carousel.scrollLeft, moved: false };
  carousel.setPointerCapture(event.pointerId);
});

carousel.addEventListener('pointermove', (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  if (!dragState.moved) {
    if (Math.hypot(deltaX, deltaY) < 6) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      carousel.releasePointerCapture(event.pointerId);
      dragState = null;
      return;
    }
    dragState.moved = true;
    carousel.classList.add('is-dragging');
  }
  event.preventDefault();
  carousel.scrollLeft = dragState.startScrollLeft - deltaX;
});

function endDrag(event: PointerEvent): void {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const moved = dragState.moved;
  if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);
  carousel.classList.remove('is-dragging');
  dragState = null;
  if (moved) {
    suppressClick = true;
    window.clearTimeout(suppressClickTimer);
    suppressClickTimer = window.setTimeout(() => { suppressClick = false; }, 400);
  }
}

carousel.addEventListener('pointerup', endDrag);
carousel.addEventListener('pointercancel', endDrag);
carousel.addEventListener('click', (event) => {
  if (!suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressClick = false;
  window.clearTimeout(suppressClickTimer);
}, true);

let scrollTimer: number | undefined;
carousel.addEventListener('scroll', () => {
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    const cards = [...carousel.querySelectorAll<HTMLElement>('.route-card')];
    if (!cards.length) return;
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    const index = cards.reduce((best, card, current) => {
      const bestCard = cards[best];
      if (!bestCard) return current;
      return Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(bestCard.offsetLeft + bestCard.offsetWidth / 2 - center) ? current : best;
    }, 0);
    if (index !== selectedRoute) selectRoute(index, false);
  }, 80);
}, { passive: true });

render();
void loadData();

window.setInterval(() => {
  const currentDate = dateKey();
  const currentMinute = nowMinutes();
  updateClock(clockElement);
  if (currentDate !== lastDate) { lastDate = currentDate; void loadData(); return; }
  if (currentMinute !== lastMinute) { lastMinute = currentMinute; if (loaded) render(); }
  else if (loaded && updateRouteCardCountdowns(carousel, loaded, direction, nowSeconds())) render();
}, 1000);
