import { ensureInstallDate, startTabTracking } from './sidepanel/lib/usage-stats';

export default defineBackground(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  ensureInstallDate().catch((error) => console.warn('[piqui usage] ensureInstallDate failed', error));
  startTabTracking();
});
