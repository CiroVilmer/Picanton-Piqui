import { shouldSkipTab, type SkimTab } from './classifier';

/* Señales de "comida": dominios de delivery/recetas + términos para queries de búsqueda. */
const FOOD_KEYWORDS = [
  // delivery
  'rappi',
  'pedidosya',
  'ubereats',
  'uber eats',
  'glovo',
  'doordash',
  'justeat',
  // recetas / food sites
  'cookpad',
  'recetasgratis',
  'allrecipes',
  'tudorecetas',
  'paulinacocina',
  'foodnetwork',
  // términos (matchean título / url / query de búsqueda)
  'comida',
  'receta',
  'recetas',
  'pizza',
  'hamburguesa',
  'sushi',
  'restaurante',
  'restaurant',
  'delivery',
  'milanesa',
  'empanada',
  'empanadas',
  'asado',
  'helado',
  'tacos',
  'ramen',
  'parrilla',
  'panaderia',
  'panadería',
];

/** Texto combinado de una tab para matchear: título + url + query 'q' decodeada. */
function haystack(tab: chrome.tabs.Tab): string {
  let s = `${tab.title ?? ''} ${tab.url ?? ''}`.toLowerCase();
  try {
    if (tab.url) {
      const q = new URL(tab.url).searchParams.get('q');
      if (q) s += ' ' + decodeURIComponent(q).toLowerCase();
    }
  } catch {
    /* url malformada — ignorar */
  }
  return s;
}

/** Detecta las pestañas abiertas relacionadas con comida (para alimentar a Piqui). */
export async function detectFoodTabs(): Promise<SkimTab[]> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const out: SkimTab[] = [];
  for (const t of tabs) {
    if (t.id == null || !t.url || shouldSkipTab(t)) continue;
    const hay = haystack(t);
    if (FOOD_KEYWORDS.some((k) => hay.includes(k))) {
      out.push({
        id: t.id,
        title: t.title ?? '(sin título)',
        url: t.url,
        favIconUrl: t.favIconUrl,
        lastAccessed: t.lastAccessed,
      });
    }
  }
  return out;
}
