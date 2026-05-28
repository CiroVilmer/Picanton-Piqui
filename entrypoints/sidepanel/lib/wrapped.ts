import { CATEGORY_META, type Category } from './classifier';
import { collections } from './collections';
import { MOOD_LABEL, type MoodBand } from '../mood';
import { sessions } from './sessions';
import { getUsageStats, type UsageStats } from './usage-stats';

export type MoodSlice = {
  band: MoodBand;
  label: string;
  ms: number;
  percent: number;
};

export type CategoryCount = {
  category: Category;
  label: string;
  count: number;
};

export type WrappedSlide =
  | { kind: 'hook'; title: string; subtitle: string }
  | { kind: 'time-total'; days: number; durationLabel: string; subtitle: string }
  | {
      kind: 'mood-distribution';
      slices: MoodSlice[];
      topBand: MoodBand;
      topLabel: string;
      topPercent: number;
      subtitle: string;
    }
  | {
      kind: 'tabs-total';
      total: number;
      perDay: number | null;
      subtitle: string;
    }
  | {
      kind: 'top-category';
      category: Category;
      label: string;
      count: number;
      percentOfTotal: number;
      subtitle: string;
    }
  | { kind: 'breakdown'; counts: CategoryCount[]; subtitle: string }
  | {
      kind: 'scrapes-total';
      itemsScraped: number;
      collectionsCount: number;
      subtitle: string;
    }
  | { kind: 'sessions-count'; count: number; subtitle: string }
  | { kind: 'finale'; title: string; subtitle: string };

export type ExtendedStats = UsageStats & {
  itemsScraped: number;
  collectionsCount: number;
  sessionsCount: number;
};

export type WrappedData = {
  slides: WrappedSlide[];
  capturedAt: number;
  stats: ExtendedStats;
};

const MOOD_ORDER: ReadonlyArray<MoodBand> = ['happy', 'calm', 'warm', 'angry'];

const HOOK_SUBTITLE_BY_TOP: Record<MoodBand, string[]> = {
  happy: ['Bueno, hagamos balance.', 'Vamos a ver qué onda.'],
  calm: ['Sin urgencia. Veamos.', 'Una pausa, una mirada atrás.'],
  warm: ['Hagamos números.', 'A ver qué tal venimos.'],
  angry: ['Ya que estamos, miremos esto.', 'Bueno, contemos las verdades.'],
};

const TIME_SUBTITLE_BY_DAYS = (days: number): string => {
  if (days === 0) return 'Acabamos de empezar.';
  if (days === 1) return 'Un día juntos. Recién arrancamos.';
  if (days < 7) return 'Vamos de a poco.';
  if (days < 30) return 'Ya somos costumbre.';
  if (days < 90) return 'Esto es serio.';
  return 'Veteranos del side panel.';
};

const MOOD_SUBTITLE_BY_TOP: Record<MoodBand, string[]> = {
  happy: ['Casi todo bien. Sospechoso.', 'Mucha calma, poca tormenta.'],
  calm: ['Equilibrio sano. Por ahora.', 'Vivimos en zona neutra.'],
  warm: ['Más ansiedad de la que conviene.', 'Bajemos un cambio.'],
  angry: ['Hay cosas para hablar.', 'No fue todo color de rosa.'],
};

const TABS_SUBTITLE = (total: number): string => {
  if (total === 0) return 'No abriste ni una. Casi un récord.';
  if (total < 20) return 'Poquito. Vas a tu ritmo.';
  if (total < 100) return 'Browsing normal.';
  if (total < 300) return 'Hay nivel acá.';
  if (total < 1000) return 'Industrial.';
  return 'Esto pide intervención.';
};

const TOP_CATEGORY_SUBTITLE_BY_CAT: Partial<Record<Category, string[]>> = {
  trabajo: ['Productividad o aparentar serlo.', 'Mucho laburo. Te debo descanso.'],
  distracciones: ['Tu zona de confort.', 'Cero sorpresas.'],
  'docs-tecnicos': ['Modo construcción permanente.', 'Stack Overflow es tu segunda casa.'],
  investigacion: ['Algo grande estás cocinando.', 'Curiosidad sostenida.'],
  compras: ['Algún día se concreta.', 'Carrito eterno.'],
  estudio: ['Algo nuevo en la cabeza.', 'Aprender, ese deporte.'],
  otros: ['Variedad. Eso es vida.', 'Un poco de todo y nada en particular.'],
};

const FINALE_BY_TOP: Record<MoodBand, string[]> = {
  happy: ['Hasta la próxima.', 'Seguimos así.'],
  calm: ['Tranqui. Te espero.', 'Nos vemos pronto.'],
  warm: ['Respiremos un poco.', 'Volvé cuando puedas.'],
  angry: ['Que descanses. Lo necesitás.', 'Mañana es otro día.'],
};

const SCRAPES_SUBTITLE = (items: number): string => {
  if (items === 0) return 'Cero scraping. Confiás en tu memoria.';
  if (items < 5) return 'Apenas un par. Probando el feature.';
  if (items < 20) return 'Vas armando tu base de datos.';
  if (items < 100) return 'Cazaste un montón.';
  return 'Sos un mini-Google personal.';
};

const SESSIONS_SUBTITLE = (count: number): string => {
  if (count === 0) return 'Nunca guardaste un grupo. Vivís al filo.';
  if (count < 5) return 'Algunas a salvo, por las dudas.';
  if (count < 20) return 'Disciplinado. Me gusta.';
  return 'Coleccionista de sesiones.';
};

function pick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0 min';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    const rem = min - hr * 60;
    return rem === 0 ? `${hr}h` : `${hr}h ${rem}m`;
  }
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days} ${days === 1 ? 'día' : 'días'}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'mes' : 'meses'}`;
}

function daysSince(timestamp: number, now: number): number {
  return Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
}

function dominantMoodBand(totals: Record<MoodBand, number>): MoodBand {
  let best: MoodBand = 'calm';
  let bestMs = -1;
  for (const band of MOOD_ORDER) {
    if (totals[band] > bestMs) {
      bestMs = totals[band];
      best = band;
    }
  }
  return best;
}

function buildMoodSlide(stats: UsageStats): WrappedSlide | null {
  if (stats.moodTotalTrackedMs <= 0) return null;
  const slices: MoodSlice[] = MOOD_ORDER.map((band) => {
    const ms = stats.moodTotals[band];
    return {
      band,
      label: MOOD_LABEL[band],
      ms,
      percent: ms > 0 ? Math.round((ms / stats.moodTotalTrackedMs) * 100) : 0,
    };
  }).filter((s) => s.ms > 0);

  if (slices.length === 0) return null;

  const topSlice = slices.reduce((a, b) => (b.ms > a.ms ? b : a), slices[0]!);
  return {
    kind: 'mood-distribution',
    slices,
    topBand: topSlice.band,
    topLabel: topSlice.label,
    topPercent: topSlice.percent,
    subtitle: pick(MOOD_SUBTITLE_BY_TOP[topSlice.band]),
  };
}

function buildTabsSlide(stats: UsageStats): WrappedSlide | null {
  if (stats.tabs.total <= 0) return null;
  const days = stats.installDate ? Math.max(1, daysSince(stats.installDate, Date.now()) + 1) : 1;
  const perDay = stats.tabs.total / days;
  return {
    kind: 'tabs-total',
    total: stats.tabs.total,
    perDay: Number.isFinite(perDay) ? Math.round(perDay * 10) / 10 : null,
    subtitle: TABS_SUBTITLE(stats.tabs.total),
  };
}

function buildTopCategorySlide(stats: UsageStats): WrappedSlide | null {
  const entries = Object.entries(stats.tabs.byCategory) as Array<[Category, number]>;
  if (entries.length === 0 || stats.tabs.total === 0) return null;
  const [topCat, topCount] = entries.reduce(
    (best, cur) => (cur[1] > best[1] ? cur : best),
    entries[0]!,
  );
  return {
    kind: 'top-category',
    category: topCat,
    label: CATEGORY_META[topCat].label,
    count: topCount,
    percentOfTotal: Math.round((topCount / stats.tabs.total) * 100),
    subtitle: pick(TOP_CATEGORY_SUBTITLE_BY_CAT[topCat] ?? ['Eso es lo que más miraste.']),
  };
}

function buildBreakdownSlide(stats: UsageStats): WrappedSlide | null {
  const entries = Object.entries(stats.tabs.byCategory) as Array<[Category, number]>;
  if (entries.length === 0) return null;
  const counts: CategoryCount[] = entries
    .map(([category, count]) => ({
      category,
      label: CATEGORY_META[category].label,
      count,
    }))
    .sort((a, b) => b.count - a.count);
  return {
    kind: 'breakdown',
    counts,
    subtitle: `${counts.length} ${counts.length === 1 ? 'categoría' : 'categorías'} en tu mix.`,
  };
}

async function getExtraCounts(): Promise<{
  itemsScraped: number;
  collectionsCount: number;
  sessionsCount: number;
}> {
  const [allCollections, allSessions] = await Promise.all([
    collections.getValue(),
    sessions.getValue(),
  ]);
  return {
    itemsScraped: allCollections.reduce((sum, c) => sum + c.items.length, 0),
    collectionsCount: allCollections.length,
    sessionsCount: allSessions.length,
  };
}

export async function buildWrappedSlides(now: number = Date.now()): Promise<WrappedData> {
  const [usage, extras] = await Promise.all([getUsageStats(now), getExtraCounts()]);
  const stats: ExtendedStats = { ...usage, ...extras };

  const dominant = dominantMoodBand(stats.moodTotals);
  const days = stats.installDate ? daysSince(stats.installDate, now) : 0;

  const slides: WrappedSlide[] = [];

  slides.push({
    kind: 'hook',
    title: 'Piqui Wrapped',
    subtitle: pick(HOOK_SUBTITLE_BY_TOP[dominant]),
  });

  if (stats.installDate !== null && stats.durationMs > 0) {
    slides.push({
      kind: 'time-total',
      days,
      durationLabel: formatDuration(stats.durationMs),
      subtitle: TIME_SUBTITLE_BY_DAYS(days),
    });
  }

  const tabsSlide = buildTabsSlide(stats);
  if (tabsSlide) slides.push(tabsSlide);

  if (stats.itemsScraped > 0 || stats.collectionsCount > 0) {
    slides.push({
      kind: 'scrapes-total',
      itemsScraped: stats.itemsScraped,
      collectionsCount: stats.collectionsCount,
      subtitle: SCRAPES_SUBTITLE(stats.itemsScraped),
    });
  }

  const topCatSlide = buildTopCategorySlide(stats);
  if (topCatSlide) slides.push(topCatSlide);

  const breakdownSlide = buildBreakdownSlide(stats);
  if (breakdownSlide) slides.push(breakdownSlide);

  const moodSlide = buildMoodSlide(stats);
  if (moodSlide) slides.push(moodSlide);

  if (stats.sessionsCount > 0) {
    slides.push({
      kind: 'sessions-count',
      count: stats.sessionsCount,
      subtitle: SESSIONS_SUBTITLE(stats.sessionsCount),
    });
  }

  slides.push({
    kind: 'finale',
    title: 'Hasta el próximo Wrapped',
    subtitle: pick(FINALE_BY_TOP[dominant]),
  });

  return { slides, capturedAt: now, stats };
}
