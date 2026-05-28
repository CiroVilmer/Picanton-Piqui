import { useEffect, useState } from 'react';
import { isScrappableUrl } from './extractor';

export type ActiveTabState = {
  scrappable: boolean;
  url: string | undefined;
  title: string | undefined;
};

export function useActiveTabScrappable(): ActiveTabState {
  const [state, setState] = useState<ActiveTabState>({
    scrappable: false,
    url: undefined,
    title: undefined,
  });

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (cancelled) return;
      setState({
        scrappable: isScrappableUrl(tab?.url),
        url: tab?.url,
        title: tab?.title,
      });
    };

    refresh();

    const onActivated = () => refresh();
    const onUpdated = (_tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
      if (changeInfo.url !== undefined || changeInfo.title !== undefined) refresh();
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      cancelled = true;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  return state;
}
