# Piqui — backend utilities

Este PR aporta SOLO `entrypoints/sidepanel/lib/` — las utilidades async/storage/AI para que la UI las llame desde sus handlers. No incluye componentes (eso ya lo tenés).

Cubre **dos features end-to-end:**
1. **Tabs**: analizar pestañas abiertas → clasificarlas por heurística keyword-based en 7 categorías → aplicar/quitar grupos en Chrome → guardar/reabrir/renombrar/borrar sesiones.
2. **Collections**: scrapear cualquier página activa con Gemini 3.1 (API key del user) → schema auto-inferido por subtipo de producto → tabla persistente → export CSV.

Stack: WXT 0.20 + React 19 + TS + Tailwind v4 + `@google/genai`. Todo client-side; sin backend HTTP propio.

---

## Tabs — `lib/classifier.ts` + `grouping.ts` + `sessions.ts`

### Clasificación
```ts
analyzeTabs(): Promise<Analysis>        // chrome.tabs.query (current window) → clasifica → ordena por lastAccessed desc
classify(url: string): Category         // substring matching contra KEYWORD_GROUPS
shouldSkipTab(tab): boolean             // pinned + chrome://, file://, etc. Llamar siempre antes de meter una tab al flow.

const CATEGORY_ORDER: readonly Category[];
const CATEGORY_META: Record<Category, { label: string; color: TabGroupColor }>;
const DOT_CLASS:     Record<Category, string>;  // Tailwind bg-*-500 para los color dots

type Category = 'trabajo' | 'estudio' | 'compras' | 'distracciones'
              | 'docs-tecnicos' | 'investigacion' | 'otros';
type SkimTab  = { id: number; title: string; url: string; favIconUrl?: string; lastAccessed?: number };
type Analysis = { totalAnalyzed: number; groups: { category: Category; tabs: SkimTab[] }[]; capturedAt: number };
```

### Apply / Ungroup en Chrome
```ts
applyGrouping(analysis): Promise<number>            // → cantidad de grupos creados
ungroupTabs(tabIds: readonly number[]): Promise<void>
ungroupAllInCurrentWindow(): Promise<number>        // → cantidad de tabs desagrupadas
```

### Sessions (persistentes, reactive vía `useStorageValue`)
```ts
saveGroupAsSession(category, tabs): Promise<Session>
reopenSession(session): Promise<{ tabsOpened: number }>  // serial chrome.tabs.create + grupo coloreado
renameSession(id, newName): Promise<void>
deleteSession(id): Promise<void>
defaultSessionName(category): string                // "trabajo · vie 28 may"

const sessions: WxtStorageItem<Session[], any>;     // key: 'local:sessions'

type Session  = { id: string; name: string; category: Category; createdAt: number; tabs: SavedTab[] };
type SavedTab = { url: string; title: string; favIconUrl?: string };
```

---

## Collections — `lib/ai.ts` + `collections.ts` + `extractor.ts` + `csv.ts`

### AI client (Gemini 3.1, user-supplied API key)
```ts
const MODEL = 'gemini-3.1-pro-preview';             // constante exportada — cambialo de una línea

const apiKey: WxtStorageItem<string, any>;          // key: 'local:gemini-api-key'. fallback: ''

hasApiKey(): Promise<boolean>                       // true si hay key no-vacía guardada

generateStructured<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: object,                           // OpenAPI 3.0 subset, se pasa como responseSchema de Gemini
  temperature?: number,                             // default 0.2
): Promise<GenerateResult<T>>

type GenerateError = 'no-key' | 'auth' | 'parse' | 'network' | 'empty' | 'unknown';
type GenerateResult<T> = { ok: true; data: T } | { ok: false; error: GenerateError; message?: string };
```

Para guardar la API key desde la UI: `await apiKey.setValue(userInput.trim())`. Para leerla: `useStorageValue(apiKey)` (null = loading, '' = no seteada, string non-empty = lista).

### Save flow (alto nivel — no necesitás tocar `generateStructured` directo)
```ts
savePageToNewCollection(name: string, page: PageContent): Promise<SavePageResult>
// → 2 calls: 1) infer schema por subtipo de producto/contenido, 2) extract values

savePageToExistingCollection(collectionId: string, page: PageContent): Promise<SavePageResult>
// → 1 call: extract values con el schema lockeado de esa lista

deleteCollection(id: string): Promise<void>
deleteItem(collectionId: string, itemId: string): Promise<void>

const collections: WxtStorageItem<Collection[], any>;  // key: 'local:collections'

type Field      = { key: string; label: string; type: 'string' | 'number' | 'url' | 'date' };
type Item       = { id: string; source: { url: string; title: string; capturedAt: number }; values: Record<string, unknown> };
type Collection = { id: string; name: string; schema: Field[]; items: Item[]; createdAt: number; updatedAt: number };

type SaveError = 'no-key' | 'auth' | 'network' | 'parse' | 'empty' | 'unknown' | 'invalid-schema';
type SavePageResult = { ok: true; collection: Collection; item: Item } | { ok: false; error: SaveError; message?: string };
```

### Extractor de página activa
```ts
getActivePageContent(): Promise<PageContent | null>
// chrome.scripting.executeScript en la tab activa →
// meta tags (og:*, twitter:*, product:*, article:*, description, etc.) +
// JSON-LD blocks (productos estructurados, breadcrumbs) +
// texto visible de <main> / <article> / [role=main] / body.
// Combinado y capeado a 20000 chars.

isScrappableUrl(url: string | undefined): boolean   // false para chrome://, chrome-extension://, file://, etc.

type PageContent = { url: string; title: string; mainText: string };
```

### CSV export
```ts
buildCsv(collection): string                        // RFC 4180 escaping. Cols: source_url, source_title, captured_at, ...schema keys
downloadCsv(collection): Promise<void>              // chrome.downloads.download con Blob URL. Filename: slug-YYYY-MM-DD.csv
```

---

## Hooks reactivos — `lib/`

```ts
useStorageValue<T>(item: WxtStorageItem<T, any>): T | null   // null = loading; reactivo a cambios
useTabCount(): number                                        // live count tabs no-skip en current window
useActiveTabScrappable(): { scrappable: boolean; url?: string; title?: string }
                                                             // reactive a chrome.tabs.onActivated + onUpdated.
                                                             // Usalo para disable del botón "Guardar página"
```

## Toasts — `lib/toast.ts`

```ts
pushToast(msg: string): void           // llamable desde cualquier handler (no necesita context)
useToasts(): Toast[]                   // subscriber pub-sub; usalo en tu ToastHost para renderizar el stack
```

## Format — `lib/format.ts`

```ts
timeAgo(timestamp: number, now?: number): string   // "recién" / "hace 5min" / "hace 2h" / "hace 3d" / "hace 2sem"
```

---

## Wire-up típico desde tu UI

### Analyze + apply
```ts
import { analyzeTabs, type Analysis } from './lib/classifier';
import { applyGrouping, ungroupAllInCurrentWindow } from './lib/grouping';
import { pushToast } from './lib/toast';
import { useTabCount } from './lib/useTabCount';

const tabCount = useTabCount();                      // live, sin polling
const [analysis, setAnalysis] = useState<Analysis | null>(null);

async function onAnalyze() {
  const result = await analyzeTabs();
  setAnalysis(result);
  if (result.groups.length === 0) pushToast('Nada para clasificar.');
}

async function onApply() {
  if (!analysis) return;
  const n = await applyGrouping(analysis);
  pushToast(`Agrupado en Chrome (${n} grupos).`);
}
```

### Save session per group
```ts
import { saveGroupAsSession, sessions, reopenSession } from './lib/sessions';
import { useStorageValue } from './lib/useStorageValue';

const allSessions = useStorageValue(sessions);       // null = loading; reactive
// ... al click del 💾 en una card:
const s = await saveGroupAsSession(category, tabs);
pushToast(`Guardé '${s.name}' (${s.tabs.length} tabs).`);
```

### Save page to a collection
```ts
import { savePageToNewCollection, savePageToExistingCollection, collections } from './lib/collections';
import { getActivePageContent } from './lib/extractor';
import { apiKey, hasApiKey } from './lib/ai';
import { useActiveTabScrappable } from './lib/useActiveTabScrappable';

const active = useActiveTabScrappable();
const ready = active.scrappable;

async function onSavePageNew(name: string) {
  if (!ready) return;
  if (!(await hasApiKey())) { /* prompt user para API key, await apiKey.setValue(...) */ return; }
  const page = await getActivePageContent();
  if (!page) return;
  const result = await savePageToNewCollection(name, page);
  if (!result.ok) pushToast(messageFor(result.error));
  else pushToast(`Listo. Ya tenés ${result.collection.items.length} en '${result.collection.name}'.`);
}
```

### Export CSV
```ts
import { downloadCsv } from './lib/csv';
await downloadCsv(collection);   // chrome.downloads.download arranca solo, no requiere user gesture extra
```

---

## Gotchas

### General
- **`@types/chrome`** es devDep (bumped a `^0.1.42` — WXT 0.20+ no incluye los globales `chrome.*`).
- **Storage import**: `from 'wxt/utils/storage'` (no `'wxt/storage'`, no resuelve en 0.20.26).
- **`chrome.tabs.group({ tabIds })`** requiere cast a tuple `as [number, ...number[]]` después del length check.
- **`chrome.tabs.OnUpdatedInfo`**, no `TabChangeInfo`, en `@types/chrome` 0.1.x.
- **`pnpm-workspace.yaml`** debe tener `allowBuilds: { esbuild: true }` — sin esto el postinstall de esbuild se ignora y el build falla en pnpm 11+.

### Tabs / Sessions
- **`shouldSkipTab`** excluye pinned + URLs internas. Llamalo siempre antes de meter una tab al flow.
- **Storage keys reservadas**: `'local:sessions'`, `'local:collections'`, `'local:gemini-api-key'`. No reusar.
- **Reopen es serial**, no paralelo — rate limit de `chrome.tabs.create` no testeado en bulk.

### Collections / Gemini
- **API key**: el user pega su key una vez; queda en `chrome.storage.local`. Si una call devuelve `error: 'auth'`, abrí el flow para que la cambie (`apiKey.setValue(newKey)`).
- **First save de una lista = 2 API calls** (infer schema + extract). Saves siguientes = 1 call (schema lockeado). Heads up para los loading states.
- **El schema queda lockeado al primer item.** Cambiarlo después implica borrar la lista y arrancar fresh.
- **El extractor** prioriza `<main>`/`<article>`/`[role=main]` sobre body, y prepende meta tags + JSON-LD. Texto total capeado a 20000 chars. Páginas SPA-heavy (ML, Amazon) entran bien gracias a JSON-LD.
- **Logs de debug** en `lib/ai.ts`: `console.debug('[piqui ai] request' / 'response')` con el prompt preview, el JSON crudo del modelo y el `finishReason`. Inspeccioná el side panel para ver.
- **Modelo configurable**: const `MODEL = 'gemini-3.1-pro-preview'` en `lib/ai.ts`. Cambialo a `gemini-2.5-flash-lite` u otro de una línea.

### Manifest (ya pickeado en `wxt.config.ts`)
- Permisos requeridos: `tabs`, `tabGroups`, `storage`, `sidePanel`, `sessions`, `scripting`, `downloads`.
- `host_permissions: ['<all_urls>']` para que el scraper funcione en cualquier site.
- `side_panel.default_path: 'sidepanel.html'`.
- `background.ts` llama `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` para que el click del ícono abra el panel.

---

## Out of scope

Mascot anims · Wrapped (carousel post-Análisis) · AI fallback para categoría `otros` · drag-and-drop entre cards · reapertura combinada de varias sesiones.

Ver `docs/piqui-plan.md` (en el repo de prep) para el detalle de cada uno.
