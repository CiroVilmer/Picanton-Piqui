import { useState } from 'react';
import { CATEGORY_META, type Category } from '../lib/classifier';
import { ungroupTabs } from '../lib/grouping';
import { pushToast } from '../lib/toast';

type Props = {
  category: Category;
  tabIds: ReadonlyArray<number>;
};

export function UngroupGroupButton({ category, tabIds }: Props) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await ungroupTabs(tabIds);
      pushToast(`Desagrupé ${CATEGORY_META[category].label} (${tabIds.length} tabs).`);
    } catch (err) {
      console.error('ungroupTabs failed', err);
      pushToast('No pude desagrupar. Mirá la consola.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="Desagrupar de Chrome"
      className="rounded-md px-1.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
    >
      desagrupar
    </button>
  );
}
