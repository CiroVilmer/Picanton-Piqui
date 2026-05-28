import { useEffect, useState } from 'react';
import { ForkKnife } from '@phosphor-icons/react';
import { detectFoodTabs } from '../lib/food';
import type { SkimTab } from '../lib/classifier';
import { pushToast } from '../lib/toast';

/**
 * Feature "Alimentar a Piqui": lista las pestañas de comida abiertas; al elegir una,
 * Piqui se la come (sube hambre + ánimo y se cierra esa tab).
 */
export default function FeedPiqui({ onFeed }: { onFeed: () => void }) {
  const [foodTabs, setFoodTabs] = useState<SkimTab[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const refresh = () => {
      detectFoodTabs().then((t) => {
        if (!cancelled) setFoodTabs(t);
      });
    };
    const recompute = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 150);
    };
    refresh();
    chrome.tabs.onCreated.addListener(recompute);
    chrome.tabs.onRemoved.addListener(recompute);
    chrome.tabs.onUpdated.addListener(recompute);
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      chrome.tabs.onCreated.removeListener(recompute);
      chrome.tabs.onRemoved.removeListener(recompute);
      chrome.tabs.onUpdated.removeListener(recompute);
    };
  }, []);

  async function eat(tab: SkimTab) {
    onFeed();
    try {
      await chrome.tabs.remove(tab.id);
    } catch (e) {
      console.warn('[piqui feed] remove failed', e);
    }
    pushToast(`Piqui se comió "${tab.title.slice(0, 24)}" 😋`);
    detectFoodTabs().then(setFoodTabs);
  }

  if (foodTabs.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        No hay nada rico abierto. Buscá una receta, "pizza" en Google, o abrí Rappi y aparece
        acá para darle de comer.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {foodTabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => eat(t)}
          className="flex items-center gap-2 rounded-xl bg-sunken px-3 py-2 text-left transition-colors hover:bg-outline"
        >
          {t.favIconUrl ? (
            <img src={t.favIconUrl} alt="" className="size-4 shrink-0 rounded" />
          ) : (
            <ForkKnife weight="duotone" size={16} className="shrink-0 text-ink-muted" />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{t.title}</span>
          <span className="shrink-0 text-[11px] font-semibold text-mood-happy">dar 🍽</span>
        </button>
      ))}
    </div>
  );
}
