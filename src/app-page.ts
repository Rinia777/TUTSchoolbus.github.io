import './styles/tokens.css';
import './styles/base.css';
import './styles/utilities.css';
import './styles/app-page.css';
import { setupThemeControls } from './theme';

setupThemeControls();

document.querySelectorAll<HTMLImageElement>('.store-link img').forEach((image) => {
  image.addEventListener('error', () => {
    const parent = image.closest<HTMLElement>('.store-link');
    if (parent) parent.hidden = true;
  }, { once: true });
});
