import { useEffect, useState } from 'react';
import { shouldSkipTab } from './classifier';

export function useTabCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let timer: number | undefined;

    const compute = async () => {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      setCount(tabs.filter((t) => !shouldSkipTab(t)).length);
    };

    const recompute = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(compute, 120);
    };

    compute();

    const onUpdated = (_tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
      if (changeInfo.url !== undefined || changeInfo.pinned !== undefined) {
        recompute();
      }
    };

    chrome.tabs.onCreated.addListener(recompute);
    chrome.tabs.onRemoved.addListener(recompute);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      if (timer != null) window.clearTimeout(timer);
      chrome.tabs.onCreated.removeListener(recompute);
      chrome.tabs.onRemoved.removeListener(recompute);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  return count;
}
