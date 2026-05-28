import { storage } from 'wxt/utils/storage';
import { CATEGORY_META, type Category } from './classifier';

export type SavedTab = {
  url: string;
  title: string;
  favIconUrl?: string;
};

export type Session = {
  id: string;
  name: string;
  category: Category;
  createdAt: number;
  tabs: SavedTab[];
};

export const sessions = storage.defineItem<Session[]>('local:sessions', {
  fallback: [],
});

export function defaultSessionName(category: Category): string {
  const d = new Date();
  const dayShort = d.toLocaleDateString('es-AR', { weekday: 'short' });
  const dayNum = d.getDate();
  const monthShort = d.toLocaleDateString('es-AR', { month: 'short' });
  return `${CATEGORY_META[category].label.toLowerCase()} · ${dayShort} ${dayNum} ${monthShort}`;
}

export async function saveGroupAsSession(
  category: Category,
  groupTabs: ReadonlyArray<{ url: string; title: string; favIconUrl?: string }>,
): Promise<Session> {
  const newSession: Session = {
    id: crypto.randomUUID(),
    name: defaultSessionName(category),
    category,
    createdAt: Date.now(),
    tabs: groupTabs.map((t) => ({ url: t.url, title: t.title, favIconUrl: t.favIconUrl })),
  };
  const current = await sessions.getValue();
  await sessions.setValue([newSession, ...current]);
  return newSession;
}

export async function renameSession(id: string, newName: string): Promise<void> {
  const clean = newName.trim().slice(0, 60);
  if (clean.length === 0) return;
  const current = await sessions.getValue();
  await sessions.setValue(
    current.map((s) => (s.id === id ? { ...s, name: clean } : s)),
  );
}

export async function deleteSession(id: string): Promise<void> {
  const current = await sessions.getValue();
  await sessions.setValue(current.filter((s) => s.id !== id));
}

export async function reopenSession(session: Session): Promise<{ tabsOpened: number }> {
  const tabIds: number[] = [];

  for (const t of session.tabs) {
    try {
      const created = await chrome.tabs.create({ url: t.url, active: false });
      if (created.id != null) tabIds.push(created.id);
    } catch (err) {
      console.warn('reopenSession: failed to open', t.url, err);
    }
  }

  if (tabIds.length === 0) return { tabsOpened: 0 };

  const groupId = await chrome.tabs.group({
    tabIds: tabIds as [number, ...number[]],
  });
  await chrome.tabGroups.update(groupId, {
    color: CATEGORY_META[session.category].color,
    title: CATEGORY_META[session.category].label,
  });

  return { tabsOpened: tabIds.length };
}
