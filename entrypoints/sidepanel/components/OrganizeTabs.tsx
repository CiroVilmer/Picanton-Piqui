import { useState } from 'react';
import { ArrowClockwise, BookmarkSimple, SpinnerGap, Trash } from '@phosphor-icons/react';
import {
  analyzeTabs,
  CATEGORY_META,
  DOT_CLASS,
  type Analysis,
  type Category,
  type SkimTab,
} from '../lib/classifier';
import { applyGrouping, ungroupAllInCurrentWindow } from '../lib/grouping';
import {
  deleteSession,
  reopenSession,
  saveGroupAsSession,
  sessions,
  type Session,
} from '../lib/sessions';
import { useTabCount } from '../lib/useTabCount';
import { useStorageValue } from '../lib/useStorageValue';
import { pushToast } from '../lib/toast';
import { timeAgo } from '../lib/format';

/** Feature "Organizar pestañas": clasifica las tabs abiertas y maneja sesiones. */
export default function OrganizeTabs() {
  const tabCount = useTabCount();
  const allSessions = useStorageValue(sessions);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAnalyze() {
    setBusy(true);
    try {
      const result = await analyzeTabs();
      setAnalysis(result);
      if (result.groups.length === 0) pushToast('No hay nada para clasificar.');
    } finally {
      setBusy(false);
    }
  }

  async function onApply() {
    if (!analysis) return;
    const n = await applyGrouping(analysis);
    pushToast(n > 0 ? `Agrupé en Chrome (${n} grupos).` : 'Nada para agrupar.');
  }

  async function onUngroup() {
    const n = await ungroupAllInCurrentWindow();
    pushToast(n > 0 ? `Desagrupé ${n} pestañas.` : 'No había grupos.');
  }

  async function onSaveSession(category: Category, tabs: SkimTab[]) {
    const s = await saveGroupAsSession(category, tabs);
    pushToast(`Guardé '${s.name}'.`);
  }

  async function onReopen(s: Session) {
    const { tabsOpened } = await reopenSession(s);
    pushToast(`Abrí ${tabsOpened} pestañas.`);
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <button
        type="button"
        onClick={onAnalyze}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-pill bg-mood-happy px-4 py-2.5 font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {busy && <SpinnerGap weight="bold" size={16} className="animate-spin" />}
        {busy ? 'Analizando…' : `Analizar ${tabCount} ${tabCount === 1 ? 'pestaña' : 'pestañas'}`}
      </button>

      {analysis && analysis.groups.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {analysis.groups.map((g) => (
            <div key={g.category} className="flex items-center gap-2 rounded-xl bg-sunken px-3 py-2">
              <span className={`size-2.5 shrink-0 rounded-full ${DOT_CLASS[g.category]}`} />
              <span className="font-semibold text-ink">{CATEGORY_META[g.category].label}</span>
              <span className="text-ink-muted">({g.tabs.length})</span>
              <button
                type="button"
                onClick={() => onSaveSession(g.category, g.tabs)}
                aria-label="Guardar como sesión"
                className="ml-auto shrink-0 text-ink-muted transition-colors hover:text-ink"
              >
                <BookmarkSimple weight="duotone" size={18} />
              </button>
            </div>
          ))}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={onApply}
              className="flex-1 rounded-pill bg-sunken px-3 py-2 font-semibold text-ink transition-colors hover:bg-outline"
            >
              Aplicar en Chrome
            </button>
            <button
              type="button"
              onClick={onUngroup}
              className="flex-1 rounded-pill border border-outline px-3 py-2 font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Desagrupar
            </button>
          </div>
        </div>
      )}

      {allSessions && allSessions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Sesiones
          </span>
          {allSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-xl bg-sunken px-3 py-2">
              <span className={`size-2 shrink-0 rounded-full ${DOT_CLASS[s.category]}`} />
              <span className="min-w-0 flex-1 truncate text-ink">{s.name}</span>
              <span className="shrink-0 text-[11px] text-ink-muted">
                {s.tabs.length}t · {timeAgo(s.createdAt)}
              </span>
              <button
                type="button"
                onClick={() => onReopen(s)}
                aria-label="Reabrir sesión"
                className="shrink-0 text-ink-muted transition-colors hover:text-ink"
              >
                <ArrowClockwise weight="bold" size={16} />
              </button>
              <button
                type="button"
                onClick={() => deleteSession(s.id)}
                aria-label="Borrar sesión"
                className="shrink-0 text-ink-muted transition-colors hover:text-mood-angry"
              >
                <Trash weight="duotone" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
