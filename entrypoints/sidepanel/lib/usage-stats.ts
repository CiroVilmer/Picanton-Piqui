import { storage } from 'wxt/utils/storage';
import { classify, shouldSkipTab, type Category } from './classifier';
import type { MoodBand } from '../mood';

export type MoodSegment = { band: MoodBand; from: number; to: number };
export type MoodCurrent = { band: MoodBand; since: number };

export type TabCounters = {
  total: number;
  byCategory: Partial<Record<Category, number>>;
  firstOpenedAt: number | null;
  lastOpenedAt: number | null;
};

const installDate = storage.defineItem<number>('local:install-date', {
  fallback: 0,
});

const moodSegments = storage.defineItem<MoodSegment[]>('local:mood-segments', {
  fallback: [],
});

const moodCurrent = storage.defineItem<MoodCurrent | null>('local:mood-current', {
  fallback: null,
});

const tabCounters = storage.defineItem<TabCounters>('local:tab-counters', {
  fallback: { total: 0, byCategory: {}, firstOpenedAt: null, lastOpenedAt: null },
});

let writeQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.catch(() => undefined);
  return next;
}

export async function ensureInstallDate(now: number = Date.now()): Promise<void> {
  const existing = await installDate.getValue();
  if (existing === 0) await installDate.setValue(now);
}

export async function recordTabOpened(url: string, now: number = Date.now()): Promise<void> {
  return enqueue(async () => {
    const category = classify(url);
    const current = await tabCounters.getValue();
    const byCategory = { ...current.byCategory };
    byCategory[category] = (byCategory[category] ?? 0) + 1;
    await tabCounters.setValue({
      total: current.total + 1,
      byCategory,
      firstOpenedAt: current.firstOpenedAt ?? now,
      lastOpenedAt: now,
    });
  });
}

export async function recordMoodChange(band: MoodBand, now: number = Date.now()): Promise<void> {
  return enqueue(async () => {
    const current = await moodCurrent.getValue();
    if (current && current.band === band) return;
    if (current) {
      const segments = await moodSegments.getValue();
      await moodSegments.setValue([
        ...segments,
        { band: current.band, from: current.since, to: now },
      ]);
    }
    await moodCurrent.setValue({ band, since: now });
  });
}

export function startTabTracking(): () => void {
  const onCreated = (tab: chrome.tabs.Tab) => {
    if (shouldSkipTab(tab) || !tab.url) return;
    recordTabOpened(tab.url).catch((err) => console.warn('[piqui usage] recordTabOpened failed', err));
  };
  const onUpdated = (
    _tabId: number,
    changeInfo: chrome.tabs.OnUpdatedInfo,
    tab: chrome.tabs.Tab,
  ) => {
    if (changeInfo.url == null) return;
    if (shouldSkipTab(tab)) return;
    recordTabOpened(changeInfo.url).catch((err) =>
      console.warn('[piqui usage] recordTabOpened (onUpdated) failed', err),
    );
  };
  chrome.tabs.onCreated.addListener(onCreated);
  chrome.tabs.onUpdated.addListener(onUpdated);
  return () => {
    chrome.tabs.onCreated.removeListener(onCreated);
    chrome.tabs.onUpdated.removeListener(onUpdated);
  };
}

export type UsageStats = {
  installDate: number | null;
  durationMs: number;
  moodTotals: Record<MoodBand, number>;
  moodTotalTrackedMs: number;
  tabs: TabCounters;
};

const EMPTY_MOOD_TOTALS: Record<MoodBand, number> = {
  happy: 0,
  calm: 0,
  warm: 0,
  angry: 0,
};

export async function getUsageStats(now: number = Date.now()): Promise<UsageStats> {
  const [install, segments, current, tabs] = await Promise.all([
    installDate.getValue(),
    moodSegments.getValue(),
    moodCurrent.getValue(),
    tabCounters.getValue(),
  ]);

  const moodTotals = { ...EMPTY_MOOD_TOTALS };
  for (const s of segments) {
    const dur = Math.max(0, s.to - s.from);
    moodTotals[s.band] += dur;
  }
  if (current) {
    moodTotals[current.band] += Math.max(0, now - current.since);
  }
  const moodTotalTrackedMs =
    moodTotals.happy + moodTotals.calm + moodTotals.warm + moodTotals.angry;

  return {
    installDate: install > 0 ? install : null,
    durationMs: install > 0 ? Math.max(0, now - install) : 0,
    moodTotals,
    moodTotalTrackedMs,
    tabs,
  };
}

export async function resetUsageStats(): Promise<void> {
  await Promise.all([
    installDate.removeValue(),
    moodSegments.removeValue(),
    moodCurrent.removeValue(),
    tabCounters.removeValue(),
  ]);
}
