export type Category =
  | 'trabajo'
  | 'estudio'
  | 'compras'
  | 'distracciones'
  | 'docs-tecnicos'
  | 'investigacion'
  | 'otros';

export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

export const CATEGORY_ORDER: ReadonlyArray<Category> = [
  'trabajo',
  'estudio',
  'docs-tecnicos',
  'investigacion',
  'compras',
  'distracciones',
  'otros',
];

export const KEYWORD_GROUPS: Record<Category, string[]> = {
  'trabajo':       ['notion.so', 'slack.com', 'linear.app', 'gmail.com', 'calendar.google.com'],
  'estudio':       ['coursera.org', 'youtube.com/watch?v=', 'wikipedia.org'],
  'compras':       ['mercadolibre', 'amazon.', 'shop.'],
  'distracciones': ['twitter.com', 'x.com', 'instagram.com', 'reddit.com', 'tiktok.com'],
  'docs-tecnicos': ['developer.', 'docs.', 'github.com', 'stackoverflow.com'],
  'investigacion': ['arxiv.org', 'scholar.google'],
  'otros':         [],
};

export const CATEGORY_META: Record<Category, { label: string; color: TabGroupColor }> = {
  'trabajo':       { label: 'Trabajo',       color: 'blue' },
  'estudio':       { label: 'Estudio',       color: 'green' },
  'compras':       { label: 'Compras',       color: 'orange' },
  'distracciones': { label: 'Distracciones', color: 'yellow' },
  'docs-tecnicos': { label: 'Docs',          color: 'purple' },
  'investigacion': { label: 'Investigación', color: 'cyan' },
  'otros':         { label: 'Otros',         color: 'grey' },
};

export const DOT_CLASS: Record<Category, string> = {
  'trabajo':       'bg-blue-500',
  'estudio':       'bg-emerald-500',
  'compras':       'bg-orange-500',
  'distracciones': 'bg-yellow-400',
  'docs-tecnicos': 'bg-purple-500',
  'investigacion': 'bg-cyan-500',
  'otros':         'bg-zinc-500',
};

const UNSCRAPPABLE_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'view-source:',
  'file://',
  'devtools://',
];

export function classify(url: string): Category {
  for (const cat of CATEGORY_ORDER) {
    if (cat === 'otros') continue;
    if (KEYWORD_GROUPS[cat].some((k) => url.includes(k))) return cat;
  }
  return 'otros';
}

export function shouldSkipTab(tab: chrome.tabs.Tab): boolean {
  if (tab.pinned) return true;
  if (!tab.url) return true;
  return UNSCRAPPABLE_PREFIXES.some((p) => tab.url!.startsWith(p));
}

export type SkimTab = {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  lastAccessed?: number;
};

export type GroupedTabs = {
  category: Category;
  tabs: SkimTab[];
};

export type Analysis = {
  totalAnalyzed: number;
  groups: GroupedTabs[];
  capturedAt: number;
};

export async function analyzeTabs(): Promise<Analysis> {
  const raw = await chrome.tabs.query({ currentWindow: true });
  const ok = raw.filter((t) => !shouldSkipTab(t));

  const byCategory = new Map<Category, SkimTab[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);

  for (const t of ok) {
    if (t.id == null || !t.url) continue;
    const cat = classify(t.url);
    byCategory.get(cat)!.push({
      id: t.id,
      title: t.title ?? '(sin título)',
      url: t.url,
      favIconUrl: t.favIconUrl,
      lastAccessed: t.lastAccessed,
    });
  }

  for (const list of byCategory.values()) {
    list.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  }

  const groups: GroupedTabs[] = CATEGORY_ORDER
    .filter((cat) => byCategory.get(cat)!.length > 0)
    .map((cat) => ({ category: cat, tabs: byCategory.get(cat)! }));

  return {
    totalAnalyzed: ok.length,
    groups,
    capturedAt: Date.now(),
  };
}
