import { useEffect, useState } from 'react';
import type { Analysis } from '../lib/classifier';
import { applyGrouping } from '../lib/grouping';
import { pushToast } from '../lib/toast';

type Props = {
  analysis: Analysis;
  onReanalyze: () => void;
};

export function ApplyGroupingButton({ analysis, onReanalyze }: Props) {
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setApplied(false);
  }, [analysis]);

  const onApply = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const groupsCreated = await applyGrouping(analysis);
      pushToast(`Agrupado en Chrome (${groupsCreated} ${groupsCreated === 1 ? 'grupo' : 'grupos'}).`);
      setApplied(true);
    } catch (err) {
      console.error('applyGrouping failed', err);
      pushToast('No pude agrupar. Mirá la consola.');
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <button
        type="button"
        onClick={onReanalyze}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
      >
        Re-analizar
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onApply}
      disabled={busy || analysis.groups.length === 0}
      className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? 'Agrupando…' : 'Agrupar en Chrome'}
    </button>
  );
}
