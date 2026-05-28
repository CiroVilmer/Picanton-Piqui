# Piqui — utilidades para integrar al diseño

Este PR entrega el core de Piqui listo para componer en el diseño definitivo:
**analizar tabs → ver grupos → agrupar/desagrupar en Chrome → guardar/reabrir sesiones**, más toasts y hooks reactivos.

Stack: WXT 0.20 + React 19 + TS + Tailwind v4. Todo vive en `entrypoints/sidepanel/`.

---

## lib/

### `classifier.ts`
```ts
analyzeTabs(): Promise<Analysis>        // chrome.tabs.query → clasifica heurístico → ordena por lastAccessed
classify(url: string): Category         // substring matching contra KEYWORD_GROUPS
shouldSkipTab(tab): boolean             // pinned + chrome://, file://, etc.

const CATEGORY_ORDER: readonly Category[];
const CATEGORY_META: Record<Category, { label: string; color: TabGroupColor }>;
const DOT_CLASS:     Record<Category, string>;  // Tailwind bg-*-500

type Category = 'trabajo' | 'estudio' | 'compras' | 'distracciones'
              | 'docs-tecnicos' | 'investigacion' | 'otros';
type SkimTab  = { id: number; title: string; url: string; favIconUrl?: string; lastAccessed?: number };
type Analysis = { totalAnalyzed: number; groups: { category: Category; tabs: SkimTab[] }[]; capturedAt: number };
```

### `grouping.ts`
```ts
applyGrouping(analysis): Promise<number>            // → cantidad de grupos creados
ungroupTabs(tabIds: readonly number[]): Promise<void>
ungroupAllInCurrentWindow(): Promise<number>        // → cantidad de tabs desagrupadas
```

### `sessions.ts`
```ts
saveGroupAsSession(category, tabs): Promise<Session>
reopenSession(session): Promise<{ tabsOpened: number }>
renameSession(id, newName): Promise<void>
deleteSession(id): Promise<void>
defaultSessionName(category): string                // "trabajo · vie 28 may"

const sessions: WxtStorageItem<Session[], any>;     // key: 'local:sessions'

type Session  = { id: string; name: string; category: Category; createdAt: number; tabs: SavedTab[] };
type SavedTab = { url: string; title: string; favIconUrl?: string };
```

### Toasts y hooks
```ts
pushToast(msg: string): void                        // llamable desde cualquier handler
useToasts(): Toast[]                                // subscriber (lo consume <ToastHost />)

useStorageValue<T>(item: WxtStorageItem<T, any>): T | null   // null = loading; reactivo a cambios
useTabCount(): number                               // live count de tabs no-skip en current window
timeAgo(ts: number): string                         // "recién" / "hace 5min" / "hace 2h" / "hace 3d"
```

---

## components/

Todos son drop-in. Cada uno maneja su propio busy state y dispara sus propios toasts.

| Componente | Props | Qué hace |
|---|---|---|
| `<AnalyzeButton />` | `tabCount, loading?, onAnalyze` | CTA principal "Analizar mis pestañas (N)" |
| `<GroupedTabsCard />` | `category, tabs` | Card del grupo (incluye Save + Ungroup inline en el header) |
| `<SaveGroupButton />` | `category, tabs` | 💾 inline (ya usado por GroupedTabsCard) |
| `<UngroupGroupButton />` | `category, tabIds` | "desagrupar" inline (ya usado por GroupedTabsCard) |
| `<ApplyGroupingButton />` | `analysis, onReanalyze` | Primary "Agrupar en Chrome" → "Re-analizar" post-apply |
| `<UngroupAllButton />` | — | Ghost "Desagrupar todo" (toda la ventana actual) |
| `<SessionList />` | — | Reactive sobre `sessions`, con rename inline + reopen + delete con confirm |
| `<ToastHost />` | — | Stack fixed bottom-center. Montar **una sola vez** en el root del panel |

---

## Wire-up mínimo

```tsx
import { useState } from 'react';
import { AnalyzeButton } from './components/AnalyzeButton';
import { ApplyGroupingButton } from './components/ApplyGroupingButton';
import { GroupedTabsCard } from './components/GroupedTabsCard';
import { SessionList } from './components/SessionList';
import { ToastHost } from './components/ToastHost';
import { UngroupAllButton } from './components/UngroupAllButton';
import { analyzeTabs, type Analysis } from './lib/classifier';
import { useTabCount } from './lib/useTabCount';

export default function App() {
  const tabCount = useTabCount();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const onAnalyze = async () => {
    setLoading(true);
    try { setAnalysis(await analyzeTabs()); }
    finally { setLoading(false); }
  };

  return (
    <>
      <AnalyzeButton tabCount={tabCount} loading={loading} onAnalyze={onAnalyze} />
      {analysis?.groups.map(g => (
        <GroupedTabsCard key={g.category} category={g.category} tabs={g.tabs} />
      ))}
      {analysis && (
        <>
          <ApplyGroupingButton analysis={analysis} onReanalyze={onAnalyze} />
          <UngroupAllButton />
        </>
      )}
      <SessionList />
      <ToastHost />
    </>
  );
}
```

Ver `entrypoints/sidepanel/App.tsx` para el wire-up actual (header + layout Tailwind).

---

## Gotchas

- **`@types/chrome`** es devDep — WXT 0.20+ no incluye los tipos globales `chrome.*`.
- **Storage import**: `from 'wxt/utils/storage'` (no `'wxt/storage'`, no resuelve en 0.20.26).
- **`chrome.tabs.group({ tabIds })`** requiere cast a tuple `as [number, ...number[]]` después del length check.
- **`pnpm-workspace.yaml`** tiene `allowBuilds: { esbuild: true }` — sin esto el postinstall de esbuild se ignora y el build falla en pnpm 11+.
- **`entrypoints/background.ts`** llama `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` — sin eso el ícono no abre el panel.
- **`shouldSkipTab`** excluye pinned + URLs internas. Aplicar siempre antes de meter una tab al flow.
- **Storage key `'local:sessions'`** reservado — no reusar.

---

## Fuera de scope (próximos PRs)

Mascot anims · Piqui chat (partner-side) · Collections (AI scraper con `responseConstraint`) · Wrapped (carousel post-Análisis) · AI fallback para categoría `otros`.

Ver `docs/piqui-plan.md` (en el repo de prep) para el detalle de cada uno.
